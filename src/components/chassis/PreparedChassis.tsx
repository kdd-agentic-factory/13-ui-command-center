import {useEffect,useRef,useState} from 'react';
import type {EngineeringReference} from '../../domain/engineeringSession';
import {readProfileGeometry,listBikePreparations} from '../../services/bikeTechnicalProfiles';
import {importProfileGeometry} from '../../domain/bikeProfileImport';
import {useChassisWorkspace} from '../../hooks/useChassisWorkspace';
import {useWorkspaceDraft} from '../../context/WorkspaceDraftContext';
import {canWriteTelemetry} from '../../services/telemetryIdentity';
import type {WorkView} from '../../domain/chassisWorkViews';
import {ChassisWorkshop} from './workshop/ChassisWorkshop';
import {createSetup} from '../../services/chassisTelemetry';
import {draftInput,draftFromRevision} from '../../domain/chassisWorkshop';
import type {SetupRevision} from '../../domain/chassisComparison';

export function PreparedChassis({bikeId,workView,bikeReference}:{bikeId:string;workView:WorkView;bikeReference?:EngineeringReference}){
 const workspace=useChassisWorkspace({bike:bikeId,recordingId:null});
 const currentDraft=useRef(workspace.b);currentDraft.current=workspace.b;
 const {markDirty,requestLeave}=useWorkspaceDraft();
 const [preparations,setPreparations]=useState<SetupRevision[]>([]),[recovering,setRecovering]=useState(false);
 const [importing,setImporting]=useState(false),[message,setMessage]=useState('');const active=useRef(true);
 const [saving,setSaving]=useState(false),[dirty,setDirty]=useState(false),[saved,setSaved]=useState<{id:string;version:number}|null>(null);
 const saveAttempt=useRef<{fingerprint:string;operation:string}|null>(null);const savingNow=useRef(false);
 useEffect(()=>{active.current=true;return()=>{active.current=false;markDirty(false,'prepared-chassis');};},[markDirty]);
 async function importGeometry(){
  if(!bikeReference||importing||!canWriteTelemetry())return;
  setImporting(true);setMessage('');
  try{
   const projection=await readProfileGeometry(bikeReference);
   if(!active.current)return;
   const next=importProfileGeometry(currentDraft.current,bikeReference,projection);
   workspace.setB(next);
   setDirty(true);markDirty(true,'prepared-chassis');setMessage(`Geometría incorporada de ficha · revisión ${projection.profile_revision}`);
  }catch(e){if(active.current)setMessage(e instanceof Error?e.message:'No se pudo importar');}
  finally{if(active.current)setImporting(false);}
 }
 async function savePreparation(){
  if(savingNow.current||importing||workspace.busy||!dirty||!canWriteTelemetry())return;
  if(!Object.values(currentDraft.current.values).some(value=>value.trim())){setMessage('Registra alguna medida antes de guardar el setup');return;}
  savingNow.current=true;setSaving(true);setMessage('');
  const input=draftInput(currentDraft.current,bikeId,'Preparación',saved?.id);
  const fingerprint=JSON.stringify(input);
  if(saveAttempt.current?.fingerprint!==fingerprint)saveAttempt.current={fingerprint,operation:crypto.randomUUID()};
  try{
   const result=await createSetup({...input,operation_id:saveAttempt.current.operation});
   if(!active.current)return;
   setSaved({id:result.id,version:result.version});setDirty(false);saveAttempt.current=null;
   markDirty(false,'prepared-chassis');setMessage(`Setup de preparación guardado · versión ${result.version}`);
  }catch(e){if(active.current)setMessage(e instanceof Error?e.message:'No se pudo guardar el setup');}
  finally{savingNow.current=false;if(active.current)setSaving(false);}
 }
 async function loadPreparations(){
  if(!bikeReference||recovering)return;setRecovering(true);setMessage('');
  try{const rows=await listBikePreparations(bikeReference);if(active.current){setPreparations(rows);if(!rows.length)setMessage('No hay setups guardados para esta moto');}}
  catch(e){if(active.current)setMessage(e instanceof Error?e.message:'No se pudo recuperar');}
  finally{if(active.current)setRecovering(false);}
 }
 return <>
  <p>Prepara y guarda un setup antes de importar telemetría. Guardarlo no declara que se haya montado ni lo vincula automáticamente a una salida.</p>
  {bikeReference&&<button className="btn" disabled={importing||saving||workspace.busy||!canWriteTelemetry()} onClick={()=>void importGeometry()}>{importing?'Consultando ficha…':'Incorporar geometría de la ficha'}</button>}
  <button className="btn" disabled={!dirty||saving||importing||workspace.busy||!canWriteTelemetry()} onClick={()=>void savePreparation()}>{saving?'Guardando setup…':'Guardar setup de preparación'}</button>
  {saved&&<p>Setup guardado: {saved.id} · versión {saved.version}</p>}
  {bikeReference&&<button className="btn" disabled={recovering||saving||importing||workspace.busy} onClick={()=>void loadPreparations()}>{recovering?'Consultando setups…':'Consultar setups guardados'}</button>}
  {preparations.length>0&&<label>Recuperar preparación<select value="" disabled={saving||importing||workspace.busy||!canWriteTelemetry()} onChange={e=>{const setup=preparations.find(row=>row.id===e.target.value);if(setup)requestLeave(()=>{if(!active.current)return;workspace.setB(draftFromRevision(setup));setSaved({id:setup.id,version:setup.version});setDirty(false);markDirty(false,'prepared-chassis');setMessage(`Preparación recuperada · versión ${setup.version}`);});}}><option value="">Selecciona una revisión guardada</option>{preparations.map(setup=><option key={setup.id} value={setup.id}>{setup.label} · versión {setup.version} · {setup.id}</option>)}</select></label>}
  {message&&<p role="status">{message}</p>}
  <ChassisWorkshop workView={workView} draft={workspace.b} bike={bikeId} recordingId={null}
   onChange={draft=>{if(canWriteTelemetry()&&!workspace.busy&&!saving&&!importing){workspace.setB(draft);setDirty(true);markDirty(true,'prepared-chassis');}}}
   onCalculate={options=>{if(canWriteTelemetry())void workspace.calculate(options);}}
   preview={workspace.preview} busy={workspace.busy||saving||importing} error={workspace.error}
   specifications={workspace.specifications} specError={workspace.specError} onSpecificationSaved={workspace.updateSpecification}/>
 </>;
}
