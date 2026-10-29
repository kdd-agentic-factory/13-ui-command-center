import {identitySnapshot,telemetryFetch} from './telemetryIdentity';
export interface BrainContext {subject_key:string;model_year?:number|null;season?:number|null;category?:string|null;layout?:string|null}
export interface BrainBody {scope:{path:string[]};context:BrainContext|null;text:string;related_entries:string[]}
export interface BrainNote {schema_version:'1.0.0';id:string;operation_id:string;audit:Record<string,string>;team_id:string;created_by:string;created_at:string;review:'unreviewed';usable_by_agents:false;classification:'restricted';body:BrainBody}
export interface BrainPage {items:BrainNote[];next_cursor:string|null}
const root=(import.meta.env.VITE_TELEMETRY_URL??'/api/telemetry')+'/api/v1/engineering/brain/notes';
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
function object(value:unknown):Record<string,unknown>{if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Respuesta de Brain incompatible');return value as Record<string,unknown>;}
function sameContext(a:BrainContext|null,b:BrainContext|null){return a===null||b===null?a===b:(['subject_key','model_year','season','category','layout'] as const).every(key=>(a[key]??null)===(b[key]??null));}
function samePath(a:string[],b:string[]){return a.length===b.length&&a.every((v,i)=>v===b[i]);}
function owned(value:unknown,team:string):BrainNote{
 const item=object(value),body=object(item.body),scope=object(body.scope),audit=object(item.audit);
 if(item.schema_version!=='1.0.0'||item.team_id!==team||item.review!=='unreviewed'||item.usable_by_agents!==false||item.classification!=='restricted'||!uuid.test(String(item.id))||!uuid.test(String(item.operation_id))||audit['X-Actor-ID']!==item.created_by||['X-Actor-ID','X-Workflow-ID','X-Trace-ID'].some(key=>typeof audit[key]!=='string'||String(audit[key]).length<1||String(audit[key]).length>128)||!uuid.test(String(item.created_by))||!Number.isFinite(Date.parse(String(item.created_at)))||typeof body.text!=='string'||body.text.length>4000||!Array.isArray(scope.path)||scope.path.length<1||scope.path.length>3||scope.path.some(v=>typeof v!=='string')||!Array.isArray(body.related_entries)||body.related_entries.some(v=>typeof v!=='string'||!uuid.test(v)))throw new Error('Memoria de otro equipo o respuesta incompatible; descartada');
 if(samePath(scope.path as string[],["network"])&&body.context!==null)throw new Error("Contexto global Brain incompatible");
 if(body.context!==null){const context=object(body.context);if(typeof context.subject_key!=='string')throw new Error('Contexto Brain incompatible');}
 return value as BrainNote;
}
async function request(path:string,options:RequestInit={}):Promise<{value:unknown;team:string}>{
 const identity={...identitySnapshot()};if(identity.mode!=='authenticated'||!identity.team)throw new Error('Brain requiere una identidad de equipo verificada');
 const response=await telemetryFetch(path,{...options,cache:'no-store',headers:{'Content-Type':'application/json',...options.headers},signal:options.signal??AbortSignal.timeout(30000)});
 if(identitySnapshot().generation!==identity.generation)throw new Error('Cambió el equipo o la sesión; memoria descartada');
 if(!response.ok)throw new Error(response.status===404?'Brain no está disponible en este servicio.':'No se pudo acceder a Brain ('+response.status+'). Reintenta la operación.');
 const value:unknown=await response.json();
 if(identitySnapshot().generation!==identity.generation)throw new Error("Cambió el equipo o la sesión; memoria descartada");
 return {value,team:identity.team};
}
export async function listBrainNotes(scope:string[],context:BrainContext|null,{cursor,includeAncestors=false,signal}:{cursor?:string;includeAncestors?:boolean;signal?:AbortSignal}={}):Promise<BrainPage>{
 const query=new URLSearchParams({scope:scope.join('/'),limit:'100',include_ancestors:String(includeAncestors)});if(context)query.set('context',JSON.stringify(context));if(cursor)query.set('cursor',cursor);
 const {value,team}=await request(root+'?'+query,{signal});const page=object(value);
 if(!Array.isArray(page.items)||page.items.length>100||!(page.next_cursor===null||typeof page.next_cursor==='string'&&uuid.test(page.next_cursor)))throw new Error('Página Brain incompatible');
 const items=page.items.map(item=>owned(item,team));
 for(const item of items){const path=item.body.scope.path;const own=samePath(path,scope);const ancestor=includeAncestors&&(samePath(path,['network'])||path.length<scope.length&&path.every((v,i)=>v===scope[i]));if(!(own||ancestor)||(!samePath(path,['network'])&&!sameContext(item.body.context,context)))throw new Error('La memoria no corresponde al contexto seleccionado');}
 return {items,next_cursor:page.next_cursor as string|null};
}
export async function createBrainNote(body:BrainBody,operation_id:string,signal?:AbortSignal){
 if(!uuid.test(operation_id))throw new Error('Operación Brain incompatible');
 const {value,team}=await request(root,{method:'POST',body:JSON.stringify({operation_id,body}),signal});const item=owned(value,team);
 if(item.operation_id!==operation_id||!samePath(item.body.scope.path,body.scope.path)||!sameContext(item.body.context,body.context)||item.body.text!==body.text||JSON.stringify(item.body.related_entries)!==JSON.stringify(body.related_entries))throw new Error('La nota guardada no corresponde al borrador');
 return item;
}
