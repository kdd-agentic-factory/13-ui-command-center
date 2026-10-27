import { telemetryFetch } from './telemetryIdentity';
export interface ChassisProductStatus {service:'telemetry-dataset-service';status:'ok';identity_mode:'local'|'authenticated';ai:{status:string;model?:string};readers:{aim:{platform_supported:boolean;dll_found:boolean;state:string};two_d:{native_validation:string}}}
export async function getChassisProductStatus():Promise<ChassisProductStatus>{
  const response=await telemetryFetch(`${import.meta.env.VITE_TELEMETRY_URL??'/api/telemetry'}/api/v1/chassis/status`,{signal:AbortSignal.timeout(12000)});
  if(!response.ok)throw new Error(`No se pudo verificar Chassis (${response.status})`);
  const data=await response.json();
  if(data?.service!=='telemetry-dataset-service'||data.status!=='ok'||!['local','authenticated'].includes(data.identity_mode)||typeof data.ai?.status!=='string'||typeof data.readers?.two_d?.native_validation!=='string'||typeof data.readers?.aim?.dll_found!=='boolean')throw new Error('Respuesta de estado no válida');
  return data;
}
