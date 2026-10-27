import {telemetryFetch} from './telemetryIdentity';
import type {LabAcquisition,LabAnalysis,LabAnalysisInput,LabPage} from '../domain/suspensionLab';
const base=`${import.meta.env.VITE_TELEMETRY_URL??'/api/telemetry'}/api/v1/chassis/suspension-lab`;
async function call<T>(path:string,body?:unknown,signal?:AbortSignal):Promise<T>{
 const multipart=body instanceof FormData;
 const r=await telemetryFetch(base+path,{method:body===undefined?'GET':'POST',body:body===undefined?undefined:multipart?body:JSON.stringify(body),signal:signal??AbortSignal.timeout(40000),headers:{...(!multipart&&body!==undefined?{'Content-Type':'application/json'}:{}),'X-Actor-ID':'local-operator','X-Workflow-ID':'suspension-lab','X-Trace-ID':crypto.randomUUID()}});
 if(!r.ok){const e=await r.json().catch(()=>null);throw new Error(typeof e?.detail==='string'?e.detail:`No se pudo completar el análisis (${r.status})`);}
 return r.json();
}
export const listAcquisitions=(after='',signal?:AbortSignal)=>call<LabPage<LabAcquisition>>(`/acquisitions?after=${encodeURIComponent(after)}`,undefined,signal);
export const listAnalyses=(after='',signal?:AbortSignal)=>call<LabPage<LabAnalysis>>(`/analyses?after=${encodeURIComponent(after)}`,undefined,signal);
export const recordingManifest=(id:string,signal?:AbortSignal)=>call<LabAcquisition>(`/recordings/${encodeURIComponent(id)}`,undefined,signal);
export const getAnalysis=(id:string,signal?:AbortSignal)=>call<LabAnalysis>(`/analyses/${encodeURIComponent(id)}`,undefined,signal);
export const createAnalysis=(input:LabAnalysisInput,signal?:AbortSignal)=>call<LabAnalysis>('/analyses',input,signal);
export const getEvidence=(id:string,signal?:AbortSignal)=>call<Record<string,unknown>>(`/analyses/${encodeURIComponent(id)}/evidence`,undefined,signal);
export function importBench(file:File,mapping:unknown,signal?:AbortSignal){const data=new FormData();data.append('file',file);data.append('mapping',JSON.stringify(mapping));return call<LabAcquisition>('/bench-imports',data,signal);}
