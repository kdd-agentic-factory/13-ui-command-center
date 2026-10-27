import {telemetryFetch} from './telemetryIdentity';
import type {DomainPacket,DomainPacketInput,DomainPage,DomainReference} from '../domain/domainEvidence';
const base=`${import.meta.env.VITE_TELEMETRY_URL??'/api/telemetry'}/api/v1/chassis/domain-evidence`;
async function call<T>(path:string,body?:unknown,signal?:AbortSignal):Promise<T>{
 const multipart=body instanceof FormData;
 const response=await telemetryFetch(base+path,{method:body===undefined?'GET':'POST',signal:signal??AbortSignal.timeout(40000),headers:{...(!multipart&&body!==undefined?{'Content-Type':'application/json'}:{}),'X-Actor-ID':'local-operator','X-Workflow-ID':'domain-evidence','X-Trace-ID':crypto.randomUUID()},body:body===undefined?undefined:multipart?body:JSON.stringify(body)});
 if(!response.ok){const error=await response.json().catch(()=>null);throw new Error(typeof error?.detail==='string'?error.detail:`No se pudo completar la operación (${response.status}). Revisa la conexión y los campos.`);}return response.json();
}
const query=(sessionId:string,after='')=>`?session_id=${encodeURIComponent(sessionId)}&after=${encodeURIComponent(after)}`;
export const listPackets=(sessionId:string,after='',signal?:AbortSignal)=>call<DomainPage>('/packets'+query(sessionId,after),undefined,signal);
export const listReadiness=(sessionId:string,after='',signal?:AbortSignal)=>call<DomainPage>('/readiness'+query(sessionId,after),undefined,signal);
export const getPacket=(ref:DomainReference,signal?:AbortSignal)=>call<DomainPacket>(`/${ref.domain==='physical'||ref.domain==='neuro'?'readiness':'packets'}/${encodeURIComponent(ref.id)}?domain=${ref.domain}&revision=${ref.revision}&digest=${ref.digest}`,undefined,signal);
export const createPacket=(body:DomainPacketInput,operationId:string,signal?:AbortSignal)=>call<DomainPacket>('/packets',{body,operation_id:operationId},signal);
export const attestPacket=(ref:DomainReference,body:{reference:string;instrument_reference:string;scope:'reported_conditions'},operationId:string,signal?:AbortSignal)=>call<DomainPacket>(`/packets/${ref.id}/attestations`,{ref,body,operation_id:operationId},signal);
export function importPacket(file:File,mapping:unknown,signal?:AbortSignal){const data=new FormData();data.append('file',file);data.append('mapping',JSON.stringify(mapping));return call<DomainPacket>('/packets/imports',data,signal);}
export const importRecording=(body:unknown,signal?:AbortSignal)=>call<DomainPacket>('/packets/from-recording',body,signal);
export const saveReadiness=(body:unknown,operationId:string,signal?:AbortSignal)=>call<DomainPacket>('/readiness',{body,operation_id:operationId},signal);
