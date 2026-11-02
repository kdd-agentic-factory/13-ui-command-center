import {useEffect,useRef,useState} from 'react';
import type {EngineeringReference} from '../../domain/engineeringSession';
import type {BikeProfileInput} from '../../domain/bikeTechnicalProfile';
import {readBikeProfile,saveBikeProfile} from '../../services/bikeTechnicalProfiles';
import {identitySnapshot} from '../../services/telemetryIdentity';
import {useWorkspaceDraft} from '../../context/WorkspaceDraftContext';

const empty=():BikeProfileInput=>({schema_version:'1.0.0',identity:{make:null,model:null,variant:null,year:null,preparation:null,source:null},architecture:{value:'unknown',source:null},components:[],measurements:{},base_setup_reference:null});
export function BikeTechnicalProfile({bike,name}:{bike:EngineeringReference;name:string}){
 const bikeId=bike.id,bikeRevision=bike.revision;
 const [body,setBody]=useState(empty),[revision,setRevision]=useState(0),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const {markDirty}=useWorkspaceDraft();const epoch=useRef(0);const attempt=useRef<{fingerprint:string;operation:string}|null>(null);
 const identity=identitySnapshot();const writable=identity.mode==='authenticated'&&!!identity.user&&!!identity.team&&identity.role!=='reader';
 useEffect(()=>{
  const generation=++epoch.current,c=new AbortController();setLoading(true);setBody(empty());setRevision(0);setError('');setNotice('');attempt.current=null;
  readBikeProfile({id:bikeId,revision:bikeRevision},c.signal).then(value=>{if(epoch.current!==generation||c.signal.aborted)return;if(value){setBody(value.body);setRevision(value.revision);}}).catch(e=>{if(!c.signal.aborted)setError(e instanceof Error?e.message:'No se pudo recuperar la ficha');}).finally(()=>{if(epoch.current===generation&&!c.signal.aborted)setLoading(false);});
  return()=>{epoch.current=generation+1;c.abort();markDirty(false,'bike-profile');};
 },[bikeId,bikeRevision,markDirty]);
 function change(key:keyof BikeProfileInput['identity'],value:string){
  setNotice('');markDirty(true,'bike-profile');setBody(old=>({...old,identity:{...old.identity,[key]:key==='year'?(value===''?null:Number(value)):(value||null),source:identity.user?{kind:'team_declaration',reference:'Ficha editada por el equipo',page:null,author_id:identity.user,recorded_at:new Date().toISOString(),verification:'unverified'}:null}}));
 }
 async function save(){
  if(busy||!writable||loading||error)return;
  const generation=epoch.current;setBusy(true);setNotice('');
  const fingerprint=JSON.stringify([revision,body]);
  if(attempt.current?.fingerprint!==fingerprint)attempt.current={fingerprint,operation:crypto.randomUUID()};
  try{
   const next=await saveBikeProfile(bike,revision,body,attempt.current.operation);
   if(epoch.current!==generation)return;
   setBody(next.body);setRevision(next.revision);attempt.current=null;markDirty(false,'bike-profile');setNotice(`Ficha guardada · revisión ${next.revision}`);
  }catch(e){if(epoch.current===generation)setNotice(e instanceof Error?e.message:'No se pudo guardar la ficha');}
  finally{if(epoch.current===generation)setBusy(false);}
 }
 return <section className="session-preparation" aria-label="Ficha técnica de moto">
  <h3>Ficha técnica · {name}</h3>
  {loading?<p role="status">Cargando ficha…</p>:<>
   <p>{revision?`Revisión ${revision}`:'Sin ficha guardada'}</p>
   {error&&<p role="alert">{error}</p>}
   <fieldset disabled={!writable||busy||!!error}><legend>Identidad del montaje</legend>
    {(['make','model','variant','year','preparation'] as const).map((field,i)=><label key={field}>{['Marca','Modelo','Versión','Año','Preparación'][i]}<input type={field==='year'?'number':'text'} min={field==='year'?1900:undefined} max={field==='year'?2200:undefined} value={body.identity[field]??''} onChange={e=>change(field,e.target.value)}/></label>)}
   </fieldset>
   <p>Arquitectura: {body.architecture.value==='unknown'?'pendiente de confirmar':body.architecture.value}. Componentes registrados: {body.components.length}. Medidas registradas: {Object.keys(body.measurements).length}.</p>
   <p>Esta ficha conserva lo conocido. No asigna componentes ni dimensiones de serie automáticamente.</p>
   {!writable&&<p>Se requiere un miembro autorizado del equipo para editar.</p>}
   <button className="btn" disabled={!writable||busy||!!error} onClick={()=>void save()}>{busy?'Guardando…':'Guardar ficha'}</button>
  </>}
  {notice&&<p role="status">{notice}</p>}
 </section>;
}
