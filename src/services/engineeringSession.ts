import { identitySnapshot, telemetryFetch } from './telemetryIdentity';
import type { CatalogInput, CatalogKind, CatalogRevision, EngineeringPage, EngineeringReference, EngineeringSession, EngineeringSessionInput, WorkspaceAssociation } from '../domain/engineeringSession';
import type { RecordedSession } from '../domain/recordedSession';
import type { ChassisState } from './chassisTelemetry';
import type {AnalysisRun,AnalysisSnapshot,StoredProposal,SynthesisProgress,CurrentValidity,CrewDesignation,DesignationCandidate,DecisionInput,ApplicationInput,ValidationInput,HumanEvent,HumanEventsPage,EngineeringReport,SnapshotSelection} from '../domain/engineeringSession';

const origin = import.meta.env.VITE_TELEMETRY_URL ?? '/api/telemetry';
const base = `${origin}/api/v1/engineering`;
export class EngineeringRequestError extends Error {
  constructor(public status: number, message: string) { super(status === 409 ? 'El contexto ha cambiado. Recarga la sesión antes de guardar otra revisión.' : message); }
}
const canonical = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id);
function reference<T extends EngineeringReference>(value: T): T {
  if (!value || !canonical(value.id) || !Number.isInteger(value.revision) || value.revision < 1) throw new Error('Referencia persistida incompatible');
  return value;
}
function owned<T extends EngineeringReference & {team_id:string|null;schema_version:string}>(value: T): T {
  reference(value);
  const identity = identitySnapshot();
  if (value.schema_version !== '1.0.0' || value.team_id !== (identity.mode === 'local' ? null : identity.team)) throw new Error('Contexto de otro equipo o versión incompatible; respuesta descartada');
  return value;
}
async function request<T>(path: string, options: RequestInit = {}, absolute = false): Promise<T> {
  const response = await telemetryFetch(absolute ? path : base + path, { ...options, headers: { 'Content-Type': 'application/json', ...options.headers }, signal: options.signal ?? AbortSignal.timeout(30000) });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new EngineeringRequestError(response.status, typeof body?.detail === 'string' ? body.detail : `No se pudo leer el contexto (${response.status}). Reintenta la operación.`);
  }
  return response.json() as Promise<T>;
}
type PageOptions = { cursor?: string; signal?: AbortSignal };
const pageQuery = (cursor?: string) => '?limit=100' + (cursor ? `&cursor=${encodeURIComponent(cursor)}` : '');
function page<T extends EngineeringReference & {team_id:string|null;schema_version:string}>(data: EngineeringPage<T>) {
  if (!Array.isArray(data.items) || !(data.next_cursor === null || typeof data.next_cursor === 'string')) throw new Error('Página de contexto incompatible');
  return { ...data, items: data.items.map(owned) };
}
export const listEngineeringSessions = async ({cursor,signal}:PageOptions = {}) => page(await request<EngineeringPage<EngineeringSession>>('/sessions'+pageQuery(cursor),{signal}));
export async function getEngineeringSession(id:string, signal?:AbortSignal) {
  const value=owned(await request<EngineeringSession>(`/sessions/${encodeURIComponent(id)}`,{signal}));
  if(value.id!==id)throw new Error('La respuesta no corresponde a la sesión solicitada');
  return value;
}
export const createEngineeringSession = async (body:EngineeringSessionInput, operation_id:string, signal?:AbortSignal) => owned(await request<EngineeringSession>('/sessions',{method:'POST',body:JSON.stringify({operation_id,body}),signal}));
export const reviseEngineeringSession = async (id:string,body:EngineeringSessionInput,expected_revision:number,signal?:AbortSignal) => owned(await request<EngineeringSession>(`/sessions/${encodeURIComponent(id)}`,{method:'PUT',body:JSON.stringify({expected_revision,body}),signal}));
export const listCatalog = async (kind:CatalogKind,{cursor,signal}:PageOptions = {}) => page(await request<EngineeringPage<CatalogRevision>>(`/catalog/${kind}`+pageQuery(cursor),{signal}));
export async function getCatalogEntity(kind:CatalogKind,ref:EngineeringReference,signal?:AbortSignal) {
  const value=owned(await request<CatalogRevision>(`/catalog/${kind}/${encodeURIComponent(ref.id)}?revision=${ref.revision}`,{signal}));
  if(value.id!==ref.id||value.revision!==ref.revision||value.kind!==kind)throw new Error('El catálogo no corresponde a la revisión solicitada');
  return value;
}
export const saveCatalogEntity = async (kind:CatalogKind,body:CatalogInput,options:{id:string;expected_revision:number}|{operation_id:string},signal?:AbortSignal) => owned(await request<CatalogRevision>(`/catalog/${kind}`+('id' in options?`/${encodeURIComponent(options.id)}`:''),{method:'id' in options?'PUT':'POST',body:JSON.stringify('id' in options?{expected_revision:options.expected_revision,body}:{operation_id:options.operation_id,body}),signal}));

const routeId=(id:string)=>{if(!canonical(id))throw new Error('Identificador persistido incompatible');return encodeURIComponent(id);};
const post=<T,>(path:string,body:unknown,signal?:AbortSignal)=>request<T>(path,{method:'POST',body:JSON.stringify(body),signal});
function runShape(run:AnalysisRun){
  if(!run||!canonical(run.run_id)||!canonical(run.session_id)||!canonical(run.snapshot_id)||!['running','sealed','cancelled','failed'].includes(run.status)||!Array.isArray(run.tasks)||run.tasks.some(task=>!canonical(task.task_id)||!['queued','running','succeeded','blocked_missing_inputs','unavailable','failed','timed_out','cancelled'].includes(task.status)))throw new Error('Ejecución incompatible');return run;
}
export async function getCurrentAnalysisRun(sessionId:string,signal?:AbortSignal){const data=await request<{run:AnalysisRun|null}>(`/sessions/${routeId(sessionId)}/runs/current`,{signal});if(data.run===null)return null;const run=runShape(data.run);if(run.session_id!==sessionId)throw new Error('Ejecución de otra sesión; respuesta descartada');return run;}
export async function reconcileAnalysisStarts(sessionId:string,signal?:AbortSignal){
  const value=await post<{session_id:string;starts:{operation_id:string;run_id:string;status:'superseded';generation:number}[]}>(`/sessions/${routeId(sessionId)}/runs/reconcile`,{},signal);
  if(value.session_id!==sessionId||!Array.isArray(value.starts)||value.starts.some(s=>!canonical(s.operation_id)||!canonical(s.run_id)||s.status!=='superseded'||!Number.isInteger(s.generation)||s.generation<1))throw new Error('Reconciliación incompatible; el inicio sigue bloqueado');
  return value;
}
export async function startAnalysisRun(sessionId:string,snapshotId:string,expected_revision:number,operation_id:string,retry_of:string|null=null,signal?:AbortSignal){const run=runShape(await post<AnalysisRun>(`/sessions/${routeId(sessionId)}/runs`,{snapshot_id:snapshotId,expected_revision,operation_id,config:{analysis_version:'2.0.0',retry_of}},signal));if(run.session_id!==sessionId||run.snapshot_id!==snapshotId)throw new Error('La ejecución no corresponde al snapshot');return run;}
export async function getAnalysisRun(id:string,signal?:AbortSignal){const run=runShape(await request<AnalysisRun>(`/runs/${routeId(id)}`,{signal}));if(run.run_id!==id)throw new Error('Ejecución incompatible');return run;}
export const cancelAnalysisRun=(id:string,signal?:AbortSignal)=>post<AnalysisRun>(`/runs/${routeId(id)}/cancel`,{},signal);
export async function createAnalysisSnapshot(sessionId:string,expected_revision:number,selection:SnapshotSelection,operation_id:string,signal?:AbortSignal){const snapshot=await post<AnalysisSnapshot>(`/sessions/${routeId(sessionId)}/snapshots`,{expected_revision,operation_id,selection},signal);if(snapshot.session_id!==sessionId||snapshot.session_revision!==expected_revision)throw new Error('Snapshot de otro contexto; respuesta descartada');return snapshot;}
export const getAnalysisSnapshot=(id:string,signal?:AbortSignal)=>request<AnalysisSnapshot>(`/snapshots/${routeId(id)}`,{signal});
export const getSynthesis=(id:string,signal?:AbortSignal)=>request<SynthesisProgress>(`/runs/${routeId(id)}/synthesis`,{signal});
export async function getProposal(id:string,revision?:number,signal?:AbortSignal){const stored=await request<StoredProposal>(`/proposals/${routeId(id)}`+(revision?`?revision=${revision}`:''),{signal});if(stored.proposal_id!==id||(revision&&stored.proposal.revision!==revision))throw new Error('Propuesta de otra revisión; respuesta descartada');return stored;}
export async function getCurrentValidity(id:string,revision:number,signal?:AbortSignal){const value=await request<CurrentValidity>(`/proposals/${routeId(id)}/authority?revision=${revision}`,{signal});if(value.proposal_id!==id||value.proposal_revision!==revision)throw new Error('Autoridad de otra propuesta; respuesta descartada');if(value.schema_version!=='1.0.0'||!canonical(value.authority_proposal_id)||(['current','approvable','rejectable','revision_requestable','approved_current','authority_available'] as const).some(flag=>typeof value[flag]!=='boolean')||!Array.isArray(value.reasons)||value.reasons.some(reason=>typeof reason!=='string'))throw new Error('Autoridad incompatible; recarga la versión vigente');return value;}
export const decideProposal=(id:string,body:DecisionInput,operation_id:string,signal?:AbortSignal)=>post<HumanEvent>(`/proposals/${routeId(id)}/decisions`,{operation_id,body},signal);
export const recordApplication=(id:string,body:ApplicationInput,operation_id:string,signal?:AbortSignal)=>post<HumanEvent>(`/proposals/${routeId(id)}/applications`,{operation_id,body},signal);
export const recordValidation=(id:string,body:ValidationInput,operation_id:string,signal?:AbortSignal)=>post<HumanEvent>(`/applications/${routeId(id)}/validations`,{operation_id,body},signal);
export const resolveProposalConflicts=(id:string,body:{expected_revision:number;note:string;evidence_ids:string[]},operation_id:string,signal?:AbortSignal)=>post<StoredProposal>(`/proposals/${routeId(id)}/resolve-conflicts`,{operation_id,body},signal);
export async function getDesignation(signal?:AbortSignal){const data=await request<CrewDesignation>('/settings/crew-chief',{signal});if(data.team_id!==identitySnapshot().team)throw new Error('Designación de otro equipo; respuesta descartada');return data;}
export const getDesignationCandidates=(cursor?:string,signal?:AbortSignal)=>request<EngineeringPage<DesignationCandidate>>('/settings/crew-chief/candidates?limit=100'+(cursor?`&after=${encodeURIComponent(cursor)}`:''),{signal});
export const setDesignation=(body:{primary_id:string;substitute_id:string|null;expected_revision:number},signal?:AbortSignal)=>request<CrewDesignation>('/settings/crew-chief',{method:'PUT',body:JSON.stringify(body),signal});
export const getHumanEvents=(sessionId:string,after?:string,signal?:AbortSignal)=>request<HumanEventsPage>(`/sessions/${routeId(sessionId)}/events?limit=100`+(after?`&after=${encodeURIComponent(after)}`:''),{signal});
export const createEngineeringReport=(sessionId:string,revision:number,signal?:AbortSignal)=>post<EngineeringReport>(`/sessions/${routeId(sessionId)}/reports`,{revision},signal);
export async function getEngineeringReport(id:string,signal?:AbortSignal){const value=await request<EngineeringReport>(`/reports/${routeId(id)}`,{signal});if(value.id!==id)throw new Error('Informe incompatible');return value;}

/** Reads actual owned persisted source objects, never the editor's draft values. */
export async function readWorkspaceAssociation(session:EngineeringSession, recordingId:string, signal?:AbortSignal):Promise<WorkspaceAssociation> {
  if (!canonical(recordingId)) throw new Error('La grabación necesita un identificador persistido válido');
  const [recording,state] = await Promise.all([
    request<RecordedSession>(`${origin}/api/v1/recorded/${encodeURIComponent(recordingId)}`,{signal},true),
    request<ChassisState>(`${origin}/api/v1/chassis/sessions/${encodeURIComponent(recordingId)}/state`,{signal,headers:{'X-Actor-ID':'local-operator','X-Workflow-ID':'engineering-workspace-association','X-Trace-ID':crypto.randomUUID()}},true),
  ]);
  if(recording.id!==recordingId || !/^[a-f0-9]{64}$/.test(recording.sha256)) throw new Error('Identidad o huella de grabación incompatible');
  const run = state.comparison;
  if(run && (run.session_id!==recordingId || run.source_sha256!==recording.sha256 || !run.setup_a || !run.setup_b || run.setup_a.id!==run.setup_a_id || run.setup_b.id!==run.setup_b_id)) throw new Error('La comparación guardada no corresponde a esta fuente');
  const ref = (id:string,revision:number) => reference({id,revision});
  const bindings = state.bindings.filter(b=>b.session_id===recordingId && b.id && (!run || b.setup_id===run.setup_a_id));
  const binding = bindings[bindings.length-1];
  const bound = binding ? state.setups.find(s=>s.id===binding.setup_id) : undefined;
  // Comparison/binding objects are immutable; backend SnapshotSelection resolves their absent version as revision 1.
  return { session_id:session.id,session_revision:session.revision,
    recording:{id:recording.id,filename:recording.filename,sha256:recording.sha256,geometry_revision:recording.geometry_version??null},
    selection:{recordings:[{id:recording.id,geometry_revision:recording.geometry_version??null,interval_s:run?.interval_s?run.interval_s.map(String) as [string,string]:null}],
      comparison:run?ref(run.id,run.version??1):null,setup_a:run?.setup_a?ref(run.setup_a.id,run.setup_a.version):bound?ref(bound.id,bound.version):null,
      setup_b:run?.setup_b?ref(run.setup_b.id,run.setup_b.version):null,binding:binding?.id?ref(binding.id,binding.version??1):null,calibration:null,validation:null,environment:null} };
}
