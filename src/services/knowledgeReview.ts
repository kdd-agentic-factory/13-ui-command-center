import {identitySnapshot, telemetryFetch} from './telemetryIdentity';
export interface KnowledgeSource {
 schema_version:string; document:{id:string;team_id:string;title:string;edition:string;factory:string;review:string;visibility:string;sha256:string;rights:string;applicability:Record<string,unknown>;effective_from:string;effective_until:string|null};
 component:string; content_type:string; byte_length:number; extraction_state:string;
}
export interface KnowledgeReview {
 schema_version:string;document_id:string;team_id:string;sha256:string;metadata_sha256:string;revision:number;decision:string;operation_id:string|null;reviewed_by:string|null;recorded_at:string|null;reason:string|null;runtime_admitted:false;human_setup_approved:false;
}
export interface ReviewDraft {decision:'reviewed'|'superseded';reason:string;rights_confirmed:boolean;applicability_confirmed:boolean}
export interface KnowledgeExcerpt {id:string;start:number;end:number;text:string;citation:{document_id:string;sha256:string;section:string;page:number|null}}
const root=(import.meta.env.VITE_TELEMETRY_URL??'/api/telemetry')+'/api/v1/engineering/knowledge';
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const hash=/^[a-f0-9]{64}$/;
function obj(value:unknown):Record<string,unknown>{if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Respuesta documental incompatible');return value as Record<string,unknown>;}
async function request(path:string,options:RequestInit={}){
 const identity={...identitySnapshot()};if(identity.mode!=='authenticated'||!identity.team)throw new Error('Selecciona un equipo con identidad verificada');
 const response=await telemetryFetch(root+path,{...options,cache:'no-store',signal:options.signal??AbortSignal.timeout(30000),headers:{'Content-Type':'application/json',...options.headers}});
 const current=()=>{if(identitySnapshot().generation!==identity.generation)throw new Error('Cambió la identidad; respuesta documental descartada');};current();
 if(!response.ok)throw new Error(response.status===409?'La revisión cambió. Recarga la fuente antes de continuar.':response.status===404?'La biblioteca no está disponible en este servicio.':`No se pudo acceder a la fuente (${response.status}). Reintenta o recarga.`);
 const value:unknown=await response.json();current();return {value,identity};
}
function source(value:unknown,team:string):KnowledgeSource{
 const row=obj(value),d=obj(row.document);obj(d.applicability);
 if(row.schema_version!=='1.0.0'||d.team_id!==team||!uuid.test(String(d.id))||!hash.test(String(d.sha256))||d.visibility!=='private'||d.review!=='pending'||typeof d.title!=='string'||!d.title.trim()||d.title.length>300||typeof d.edition!=='string'||!['bike','circuit','rider','championship'].includes(String(d.factory))||!['open_reuse','licensed_team_use'].includes(String(d.rights))||typeof row.component!=='string'||!['text/plain','application/pdf'].includes(String(row.content_type))||!['text_ready','pending_pdf_extraction'].includes(String(row.extraction_state))||!Number.isSafeInteger(row.byte_length)||Number(row.byte_length)<1||Number(row.byte_length)>16777216)throw new Error('Fuente de otro equipo o incompatible; descartada');
 return value as KnowledgeSource;
}
function review(value:unknown,item:KnowledgeSource,team:string):KnowledgeReview{
 const row=obj(value);const initial=row.revision===0;
 if(row.schema_version!=='1.0.0'||row.team_id!==team||row.document_id!==item.document.id||row.sha256!==item.document.sha256||!hash.test(String(row.metadata_sha256))||!Number.isSafeInteger(row.revision)||Number(row.revision)<0||row.runtime_admitted!==false||row.human_setup_approved!==false||!(initial?row.decision==='pending'&&row.operation_id===null&&row.reviewed_by===null&&row.recorded_at===null&&row.reason===null:['reviewed','superseded'].includes(String(row.decision))&&uuid.test(String(row.operation_id))&&uuid.test(String(row.reviewed_by))&&Number.isFinite(Date.parse(String(row.recorded_at)))&&typeof row.reason==='string'&&!!row.reason.trim()))throw new Error('Revisión incompatible con la fuente; descartada');
 return value as KnowledgeReview;
}
export async function listKnowledge(cursor?:string,signal?:AbortSignal){
 const query=new URLSearchParams({limit:'100'});if(cursor)query.set('cursor',cursor);
 const {value,identity}=await request('/documents?'+query,{signal});const page=obj(value);
 if(!Array.isArray(page.items)||page.items.length>100||!(page.next_cursor===null||typeof page.next_cursor==='string'&&uuid.test(page.next_cursor)))throw new Error('Página documental incompatible');
 return {items:page.items.map(value=>source(value,identity.team!)),next_cursor:page.next_cursor as string|null};
}
export async function readKnowledgeReview(item:KnowledgeSource,signal?:AbortSignal){
 const {value,identity}=await request('/documents/'+item.document.id+'/review',{signal});return review(value,item,identity.team!);
}
export async function readKnowledgeExcerpts(item:KnowledgeSource,signal?:AbortSignal){
 const {value,identity}=await request('/documents/'+item.document.id+'/excerpts',{signal});source(item,identity.team!);const page=obj(value);
 if(page.review!=='pending'||page.usable_by_agents!==false||!Array.isArray(page.items)||page.items.length>128)throw new Error('Extractos incompatibles');
 let end=0;for(const value of page.items){const row=obj(value),citation=obj(row.citation);if(!uuid.test(String(row.id))||typeof row.text!=='string'||row.text.length<1||row.text.length>4096||row.start!==end||row.end!==end+Array.from(row.text).length||citation.document_id!==item.document.id||citation.sha256!==item.document.sha256||citation.page!==null||citation.section!==`characters ${row.start}:${row.end}`)throw new Error('Extracto sin vínculo verificable');end=Number(row.end);}
 return page.items as KnowledgeExcerpt[];
}
export async function saveKnowledgeReview(item:KnowledgeSource,state:KnowledgeReview,operation_id:string,body:ReviewDraft){
 const identity=identitySnapshot();if(!uuid.test(operation_id)||!['engineer','admin'].includes(identity.role))throw new Error('Se requiere un permiso de revisión del equipo');
 source(item,identity.team??'');review(state,item,identity.team??'');
 const {value,identity:verified}=await request('/reviews',{method:'POST',body:JSON.stringify({document_id:item.document.id,operation_id,body:{...body,expected_revision:state.revision,sha256:state.sha256,metadata_sha256:state.metadata_sha256}})});
 const result=review(value,item,verified.team!);if(result.operation_id!==operation_id||result.revision!==state.revision+1||result.decision!==body.decision||result.reason!==body.reason||result.reviewed_by!==verified.user||result.metadata_sha256!==state.metadata_sha256)throw new Error('El recibo no corresponde a esta revisión');return result;
}
