import {identitySnapshot,telemetryFetch} from './telemetryIdentity';
import type {EngineeringReference} from '../domain/engineeringSession';
import type {BikeProfileInput,BikeProfileRevision} from '../domain/bikeTechnicalProfile';
const base=(import.meta.env.VITE_TELEMETRY_URL??'/api/telemetry')+'/api/v1/engineering/bikes/';
async function request(bike:EngineeringReference,options:RequestInit,query:string):Promise<BikeProfileRevision|null>{
 const identity=identitySnapshot();
 const response=await telemetryFetch(base+encodeURIComponent(bike.id)+'/technical-profile'+query,{...options,headers:{'Content-Type':'application/json'},signal:options.signal??AbortSignal.timeout(30000)});
 if(!response.ok){const error=await response.json().catch(()=>null);throw new Error(response.status===409?'La ficha ha cambiado. Recarga antes de guardar.':typeof error?.detail==='string'?error.detail:`No se pudo recuperar la ficha (${response.status})`);}
 const value=await response.json() as BikeProfileRevision|null;
 if(identitySnapshot().generation!==identity.generation)throw new Error('El equipo ha cambiado');
 if(value&&(value.schema_version!=='1.0.0'||value.team_id!==identity.team||value.bike_reference?.id!==bike.id||value.bike_reference.revision!==bike.revision||!Number.isInteger(value.revision)||value.revision<1||!value.body))throw new Error('Ficha incompatible con la moto o el equipo');
 return value;
}
export const readBikeProfile=(bike:EngineeringReference,signal?:AbortSignal)=>request(bike,{signal},`?bike_revision=${bike.revision}`);
export async function saveBikeProfile(bike:EngineeringReference,expected:number,body:BikeProfileInput,operation:string,signal?:AbortSignal){
 const result=await request(bike,{method:'PUT',signal,body:JSON.stringify({bike_revision:bike.revision,expected_profile_revision:expected,body,operation_id:operation})},'');
 if(!result)throw new Error('El servidor no confirmó el guardado');return result;
}
export async function readProfileGeometry(bike:EngineeringReference,signal?:AbortSignal):Promise<import('../domain/bikeProfileImport').ProfileGeometryProjection>{
 const before=identitySnapshot();
 const response=await telemetryFetch(base+encodeURIComponent(bike.id)+'/technical-profile/projection?bike_revision='+bike.revision,{signal:signal??AbortSignal.timeout(30000)});
 if(!response.ok)throw new Error(`No se pudo consultar la geometría de la ficha (${response.status})`);
 const value=await response.json();
 if(identitySnapshot().generation!==before.generation||value.schema_version!=='1.0.0'||value.bike_reference?.id!==bike.id||value.bike_reference?.revision!==bike.revision||!value.values||!Number.isInteger(value.profile_revision)||value.profile_revision<1||!/^[a-f0-9]{64}$/.test(value.profile_digest))throw new Error('Geometría incompatible con el contexto actual');
 return value;
}
