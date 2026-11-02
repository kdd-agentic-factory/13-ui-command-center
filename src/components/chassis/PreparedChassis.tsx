import {useEffect,useRef,useState} from 'react';
import type {EngineeringReference} from '../../domain/engineeringSession';
import {readProfileGeometry} from '../../services/bikeTechnicalProfiles';
import {importProfileGeometry} from '../../domain/bikeProfileImport';
import {useChassisWorkspace} from '../../hooks/useChassisWorkspace';
import {useWorkspaceDraft} from '../../context/WorkspaceDraftContext';
import {canWriteTelemetry} from '../../services/telemetryIdentity';
import type {WorkView} from '../../domain/chassisWorkViews';
import {ChassisWorkshop} from './workshop/ChassisWorkshop';

export function PreparedChassis({bikeId,workView,bikeReference}:{bikeId:string;workView:WorkView;bikeReference?:EngineeringReference}){
 const workspace=useChassisWorkspace({bike:bikeId,recordingId:null});
 const currentDraft=useRef(workspace.b);currentDraft.current=workspace.b;
 const {markDirty}=useWorkspaceDraft();
 const [importing,setImporting]=useState(false),[message,setMessage]=useState('');const active=useRef(true);
 useEffect(()=>{active.current=true;return()=>{active.current=false;markDirty(false,'prepared-chassis');};},[markDirty]);
 async function importGeometry(){
  if(!bikeReference||importing||!canWriteTelemetry())return;
  setImporting(true);setMessage('');
  try{
   const projection=await readProfileGeometry(bikeReference);
   if(!active.current)return;
   const next=importProfileGeometry(currentDraft.current,bikeReference,projection);
   workspace.setB(next);
   markDirty(true,'prepared-chassis');setMessage(`Geometría incorporada de ficha · revisión ${projection.profile_revision}`);
  }catch(e){if(active.current)setMessage(e instanceof Error?e.message:'No se pudo importar');}
  finally{if(active.current)setImporting(false);}
 }
 return <>
  <p>Borrador de preparación sin grabación. Puedes completar campos vacíos con medidas contrastadas de la ficha. Este borrador no se guarda como setup de una salida.</p>
  {bikeReference&&<button className="btn" disabled={importing||workspace.busy||!canWriteTelemetry()} onClick={()=>void importGeometry()}>{importing?'Consultando ficha…':'Incorporar geometría de la ficha'}</button>}
  {message&&<p role="status">{message}</p>}
  <ChassisWorkshop workView={workView} draft={workspace.b} bike={bikeId} recordingId={null}
   onChange={draft=>{if(canWriteTelemetry()&&!workspace.busy){workspace.setB(draft);markDirty(true,'prepared-chassis');}}}
   onCalculate={options=>{if(canWriteTelemetry())void workspace.calculate(options);}}
   preview={workspace.preview} busy={workspace.busy} error={workspace.error}
   specifications={workspace.specifications} specError={workspace.specError} onSpecificationSaved={workspace.updateSpecification}/>
 </>;
}
