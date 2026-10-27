import { telemetryFetch } from './telemetryIdentity';
import { selectRecording, type RecordedSession, type RecordedSignal } from '../domain/recordedSession';
const base = `${import.meta.env.VITE_TELEMETRY_URL ?? '/api/telemetry'}/api/v1/recorded`;
export interface RecordedSessionListItem { id:string; source:'aim'|'2d'; filename:string; imported_at:string; channel_count:number; validation_status:string }
export interface RecordedSessionPage { items:RecordedSessionListItem[]; next_cursor:string|null }
export const listRecordings = (options: {limit?:number;cursor?:string} = {}) => {
  const query = new URLSearchParams({limit:String(options.limit ?? 20)});
  if(options.cursor) query.set('cursor',options.cursor);
  return telemetryFetch(`${base}?${query}`, {signal:AbortSignal.timeout(30000)}).then(response<RecordedSessionPage>);
};
async function response<T>(r: Response): Promise<T> {
  if (!r.ok) {
    const body = await r.json().catch(() => null);
    throw new Error(typeof body?.detail === 'string' ? body.detail : `No se pudo leer la sesión (${r.status})`);
  }
  return r.json() as Promise<T>;
}
export async function importRecording(file: File, source: 'aim' | '2d',measurement?:string): Promise<RecordedSession> {
  const data = new FormData(); data.append('file', file);
  const session = await response<RecordedSession>(await telemetryFetch(`${base}/import?source=${source}${measurement?`&measurement=${encodeURIComponent(measurement)}&experimental=true`:''}`, {
    method: 'POST', body: data, signal: AbortSignal.timeout(150000),
    headers: { 'X-Actor-ID': 'local-operator', 'X-Workflow-ID': 'recorded-import', 'X-Trace-ID': crypto.randomUUID() },
  }));
  selectRecording(session);
  return session;
}
export interface TwoDMeasurement {path:string;channels:{name:string;unit:string;numeric_supported:boolean}[];validation:string}
export async function inspectTwoD(file:File):Promise<{measurements:TwoDMeasurement[]}> {
 const data=new FormData();data.append('file',file);
 return response(await telemetryFetch(`${base}/inspect-2d`,{method:'POST',body:data,headers:{'X-Actor-ID':'local-operator','X-Workflow-ID':'2d-inspect','X-Trace-ID':crypto.randomUUID()},signal:AbortSignal.timeout(30000)}));
}
export const getRecording = (id: string) => telemetryFetch(`${base}/${encodeURIComponent(id)}`).then(response<RecordedSession>);
export const saveRecordedGeometry = (id: string, geometry: { radius: number; rake: number; offset: number }) => telemetryFetch(`${base}/${encodeURIComponent(id)}/geometry`, {
  method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-Actor-ID': 'local-operator', 'X-Workflow-ID': 'chassis-measurements', 'X-Trace-ID': crypto.randomUUID() }, body: JSON.stringify(geometry),
}).then(response<RecordedSession>);
export const getRecordedSignal = (id: string, index: number) => telemetryFetch(`${base}/${encodeURIComponent(id)}/channels/${index}`).then(response<RecordedSignal>);
