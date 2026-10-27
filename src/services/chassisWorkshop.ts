import {telemetryFetch} from './telemetryIdentity';
import type {SetupInput} from '../domain/chassisComparison';
import type {ComponentSpecification,PreviewOptions,WorkshopPreview} from '../domain/chassisWorkshop';
const base=`${import.meta.env.VITE_TELEMETRY_URL??'/api/telemetry'}/api/v1/chassis/workshop`;
export async function workshopRequest<T>(path:string,body?:unknown):Promise<T>{
 const response=await telemetryFetch(base+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json','X-Actor-ID':'local-operator','X-Workflow-ID':'chassis-workshop','X-Trace-ID':crypto.randomUUID()},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(30000)});
 if(!response.ok){const error=await response.json().catch(()=>null);throw new Error(typeof error?.detail==='string'?error.detail:`No se pudo completar la operación de taller (${response.status})`);}
 return response.json();
}
export const previewWorkshop=(body:PreviewOptions&{draft:SetupInput;recording_id?:string;reference_id?:string})=>workshopRequest<WorkshopPreview>('/preview',body);
export const listSpecifications=()=>workshopRequest<ComponentSpecification[]>('/specifications');
export const createSpecification=(specification:Omit<ComponentSpecification,'id'|'revision'|'digest'|'schema_version'|'status'|'verified_by'>,operation_id:string)=>workshopRequest<ComponentSpecification>('/specifications',{specification,operation_id});
export const verifySpecification=(id:string,expected_revision:number,operation_id:string)=>workshopRequest<ComponentSpecification>(`/specifications/${encodeURIComponent(id)}/verify`,{expected_revision,operation_id});
