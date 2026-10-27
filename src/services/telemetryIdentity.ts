import {productProfile,assertCommercialIdentity} from '../domain/productProfile';
import { insforge } from '../lib/insforge';
export type TeamRole='reader'|'engineer'|'admin';
let mode:'local'|'authenticated'=productProfile==='chassis'?'authenticated':'local';
let user:string|null=null;let token:string|null=null;let team:string|null=null;let role:TeamRole='reader';let generation=0;let refresh:Promise<string>|null=null;
const origin=import.meta.env.VITE_TELEMETRY_URL??'/api/telemetry';
function changed(){generation++;refresh=null;window.dispatchEvent(new Event('telemetry-scope-changed'));}
export function configureTelemetryIdentity(next:typeof mode){assertCommercialIdentity(productProfile,next);if(mode!==next){mode=next;token=null;team=null;changed();}}
export function setTelemetryUser(id:string|null){if(user!==id){user=id;token=null;team=null;changed();}}
export function setActiveTeam(id:string|null,next:TeamRole){if(team!==id||role!==next){team=id;role=next;changed();}}
export function telemetryScope(){return mode==='local'?'local':user&&team?user+':'+team:'anonymous';}
export function canWriteTelemetry(){return mode==='local'||role==='engineer'||role==='admin';}
export function identitySnapshot(){return {mode,user,team,role,generation};}
async function bearer(force=false):Promise<string>{
 if(!user)throw new Error('Inicia una sesión verificada');
 if(!force&&token)return token;
 if(refresh)return refresh;
 const current=user;const g=generation;
 const operation=(async()=>{
  const {data,error}=await insforge.auth.refreshSession();
  if(error||!data?.accessToken||data.user?.id!==current||g!==generation)throw new Error('No se pudo verificar la sesión');
  token=data.accessToken;return token;
 })();
 refresh=operation;
 try{return await operation;}finally{if(refresh===operation)refresh=null;}
}
export async function telemetryFetch(url:string,init:RequestInit={}):Promise<Response>{
 const allowed=new URL(origin+'/',window.location.origin);const target=new URL(url,window.location.origin);
 if(target.origin!==allowed.origin||!target.pathname.startsWith(allowed.pathname))throw new Error('Destino de telemetría no autorizado');
 const g=generation;const intendedTeam=team;const headers=new Headers(init.headers);
 if(productProfile==='chassis'){
  try{const probe=await fetch(origin+'/api/v1/identity/mode',{signal:AbortSignal.timeout(12000),cache:'no-store'});if(!probe.ok)throw new Error('Servicio de identidad no disponible');assertCommercialIdentity(productProfile,(await probe.json()).mode);}
  catch(error){if(g===generation){setActiveTeam(null,'reader');window.dispatchEvent(new Event('telemetry-identity-blocked'));}throw error;}
  if(g!==generation)throw new Error('El equipo o la sesión cambió; petición descartada');
 }

 if(mode==='authenticated'){
  // An anonymous startup read is denied, but must not invalidate a pending cookie rehydration.
  try{headers.set('Authorization','Bearer '+await bearer());}catch(error){if(user&&g===generation){setTelemetryUser(null);window.dispatchEvent(new Event('telemetry-auth-expired'));}throw error;}
  if(g!==generation)throw new Error('El equipo o la sesión cambió; petición descartada');
  if(intendedTeam)headers.set('X-Team-ID',intendedTeam);
 }
 let response=await fetch(url,{...init,headers});
 if(mode==='authenticated'&&response.status===401&&g===generation){
  try{headers.set('Authorization','Bearer '+await bearer(true));}
  catch(error){if(g===generation){setTelemetryUser(null);window.dispatchEvent(new Event('telemetry-auth-expired'));}throw error;}
  if(g!==generation)throw new Error('El equipo o la sesión cambió; respuesta descartada');
  response=await fetch(url,{...init,headers});
 }
 if(g!==generation)throw new Error('El equipo o la sesión cambió; respuesta descartada');
 if(mode==='authenticated'&&response.status===401){setTelemetryUser(null);window.dispatchEvent(new Event('telemetry-auth-expired'));throw new Error('La sesión ha caducado; vuelve a iniciar sesión');}
 const readJson=response.json.bind(response);
 response.json=async()=>{const data=await readJson();if(g!==generation)throw new Error('El equipo o la sesión cambió; respuesta descartada');return data;};
 return response;
}
