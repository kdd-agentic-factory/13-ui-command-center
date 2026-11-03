import {identitySnapshot,telemetryFetch} from './telemetryIdentity';
import type {TaskCandidate,WorkTask,WorkState,WorkDelivery,WorkReviewDecision,WorkDecisionAction} from '../domain/sessionWorkboard';

export const workStates:WorkState[]=['proposed','pending','in_progress','in_review','closed','blocked'];
export const workProfiles=['pilot','mechanic','engineer','analyst','crew_chief','observer'] as const;
export const canonicalWorkId=(id:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id);
const hex=(v:unknown)=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
const integer=(v:unknown)=>Number.isSafeInteger(v)&&Number(v)>0;
const strings=(v:unknown):v is string[]=>Array.isArray(v)&&v.every(x=>typeof x==='string');
const base=(import.meta.env.VITE_TELEMETRY_URL??'/api/telemetry')+'/api/v1/engineering';
export class WorkboardRequestError extends Error {
  constructor(public status:number){super(status===409?'La tarea, la sesión o la designación cambió. Recarga antes de continuar.':status===403?'Tu identidad actual no permite esta operación.':status===404?'No hay una entrega o decisión guardada para esta referencia.':'No se pudo completar la operación. Recarga para comprobar el resultado antes de reintentar.');}
}
function id(value:string){if(!canonicalWorkId(value))throw new Error('Identificador persistido incompatible');return value;}
async function request(path:string,body?:object,method='GET',signal?:AbortSignal):Promise<unknown>{
  const before=identitySnapshot();
  if(before.mode!=='authenticated'||!before.team||!before.user)throw new Error('Selecciona un equipo con identidad verificada');
  const response=await telemetryFetch(base+path,{method,cache:'no-store',headers:{'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:signal??AbortSignal.timeout(30000)});
  const data=response.ok?await response.json():null;
  const after=identitySnapshot();
  if(before.generation!==after.generation||before.user!==after.user||before.team!==after.team)throw new Error('La identidad cambió; respuesta descartada');
  if(!response.ok)throw new WorkboardRequestError(response.status);
  return data;
}
function task(value:unknown):WorkTask{
  const t=value as WorkTask;
  if(!t||t.schema_version!=='1.0.0'||!canonicalWorkId(t.id)||t.team_id!==identitySnapshot().team||!canonicalWorkId(t.session_id)||!integer(t.revision)||!integer(t.session_revision)||!workStates.includes(t.state)||!workProfiles.includes(t.target_profile)||typeof t.title!=='string'||typeof t.instructions!=='string'||typeof t.acceptance!=='string'||!strings(t.evidence)||!strings(t.dependencies)||!t.execution_estimate||!t.review_estimate||![t.execution_estimate,t.review_estimate].every(e=>e.minutes===null||(integer(e.minutes)&&typeof e.basis==='string'&&typeof e.author==='string'&&['low','medium','high'].includes(e.uncertainty??'')))||!(t.responsible_id===null||canonicalWorkId(t.responsible_id))||(t.state==='blocked'&&typeof t.blocked_reason!=='string'))throw new Error('Tarea de otro equipo o contrato incompatible');
  return t;
}
function delivery(value:unknown,expected:WorkTask):WorkDelivery{
  const p=value as WorkDelivery;const t=task(p?.task),r=p?.review;
  if(!p||p.schema_version!=='1.0.0'||!hex(p.digest)||!r||r.schema_version!=='1.0.0'||!canonicalWorkId(r.id)||r.task_id!==expected.id||t.id!==expected.id||r.team_id!==expected.team_id||r.session_id!==expected.session_id||t.session_id!==expected.session_id||r.task_revision!==t.revision||r.session_revision!==t.session_revision||t.state!=='in_review'||p.base_task_revision+1!==t.revision||!hex(r.task_digest)||typeof r.summary!=='string'||typeof r.limitations!=='string'||!strings(r.evidence)||!Array.isArray(p.snapshots)||p.snapshots.length<1||p.snapshots.length>8||!p.snapshots.every(s=>canonicalWorkId(s.id)&&integer(s.revision)&&hex(s.snapshot_digest)&&hex(s.content_digest)&&typeof s.analyzable==='boolean'&&strings(s.blocked_reasons)))throw new Error('Entrega de otra tarea o contrato incompatible');
  return p;
}
export async function getBoard(sessionId:string,signal?:AbortSignal){
  const data=await request(`/sessions/${id(sessionId)}/workboard`,undefined,'GET',signal) as {schema_version:string;items:unknown[]};
  if(!data||data.schema_version!=='1.0.0'||!Array.isArray(data.items)||data.items.length>1000)throw new Error('Tablero incompatible');
  const items=data.items.map(task);if(items.some(t=>t.session_id!==sessionId)||new Set(items.map(t=>t.id)).size!==items.length)throw new Error('Tablero de otra sesión o duplicado');return items;
}
export async function createTask(sessionId:string,revision:number,body:TaskCandidate,operation:string,signal?:AbortSignal){const value=task(await request(`/sessions/${id(sessionId)}/workboard/tasks`,{expected_session_revision:revision,body,operation_id:id(operation)},'POST',signal));if(value.session_id!==sessionId||value.session_revision!==revision)throw new Error('Tarea de otra sesión');return value;}
export async function transitionTask(t:WorkTask,target:'pending'|'in_progress'|'blocked',reason:string|null,operation:string,signal?:AbortSignal){const value=task(await request(`/workboard/tasks/${id(t.id)}/transitions`,{expected_revision:t.revision,target,reason,operation_id:id(operation)},'POST',signal));if(value.id!==t.id||value.session_id!==t.session_id)throw new Error('Tarea incompatible');return value;}
export async function assignTask(t:WorkTask,responsible:string|null,operation:string,signal?:AbortSignal){const value=task(await request(`/workboard/tasks/${id(t.id)}/assignee`,{expected_revision:t.revision,responsible_id:responsible===null?null:id(responsible),operation_id:id(operation)},'PUT',signal));if(value.id!==t.id||value.session_id!==t.session_id)throw new Error('Tarea incompatible');return value;}
export async function submitTask(t:WorkTask,body:{summary:string;limitations:string;snapshot_ids:string[]},operation:string,signal?:AbortSignal){return delivery(await request(`/workboard/tasks/${id(t.id)}/submissions`,{expected_revision:t.revision,body,operation_id:id(operation)},'POST',signal),t);}
export async function getLatestReview(t:WorkTask,signal?:AbortSignal){return delivery(await request(`/workboard/tasks/${id(t.id)}/latest-review`,undefined,'GET',signal),t);}
function decision(value:unknown,p:WorkDelivery):WorkReviewDecision{
 const v=value as WorkReviewDecision;const t=task(v?.task);
 if(!v||v.schema_version!=='1.0.0'||!canonicalWorkId(v.id)||v.team_id!==p.review.team_id||v.review_id!==p.review.id||v.delivery_digest!==p.digest||!canonicalWorkId(v.actor_id)||!integer(v.designation_revision)||!['primary','substitute'].includes(v.designation_role)||!['accept','request_changes','reject'].includes(v.action)||t.id!==p.task.id||t.revision!==p.task.revision+1||t.session_id!==p.task.session_id||t.session_revision!==p.task.session_revision||t.state!==({accept:'closed',request_changes:'in_progress',reject:'blocked'}[v.action])||typeof v.note!=='string'||!hex(v.digest))throw new Error('Decisión incompatible');return v;
}
export async function getDecision(p:WorkDelivery,signal?:AbortSignal){try{return decision(await request(`/workboard/reviews/${id(p.review.id)}/decision`,undefined,'GET',signal),p);}catch(error){if(error instanceof WorkboardRequestError&&error.status===404)return null;throw error;}}
export async function decideReview(p:WorkDelivery,designationRevision:number,action:WorkDecisionAction,note:string,operation:string,signal?:AbortSignal){return decision(await request(`/workboard/reviews/${id(p.review.id)}/decisions`,{expected_revision:p.task.revision,expected_designation_revision:designationRevision,action,note,operation_id:id(operation)},'POST',signal),p);}
