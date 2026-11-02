import {useEffect,useRef,useState} from 'react';
import type {EngineeringReference} from '../../domain/engineeringSession';
import type {SetupRevision} from '../../domain/chassisComparison';
import {listBikePreparations} from '../../services/bikeTechnicalProfiles';
import {bindSetup} from '../../services/chassisTelemetry';
import {canWriteTelemetry} from '../../services/telemetryIdentity';
import {useWorkspaceDraft} from '../../context/WorkspaceDraftContext';

export function PreparationBinding({bike,recordingId,onBound}:{bike:EngineeringReference;recordingId:string;onBound:()=>void}){
 const [rows,setRows]=useState<SetupRevision[]>([]),[selected,setSelected]=useState(''),[confirmed,setConfirmed]=useState(false),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[message,setMessage]=useState('');
 const {requestLeave}=useWorkspaceDraft();const current=useRef(0),pending=useRef(false);const bikeId=bike.id,bikeRevision=bike.revision;
 useEffect(()=>{const generation=++current.current;setRows([]);setSelected('');setConfirmed(false);setLoading(true);setMessage('');
  listBikePreparations({id:bikeId,revision:bikeRevision}).then(result=>{if(generation===current.current)setRows(result);}).catch(e=>{if(generation===current.current)setMessage(e.message);}).finally(()=>{if(generation===current.current)setLoading(false);});
  return()=>{current.current=generation+1;};
 },[bikeId,bikeRevision,recordingId]);
 async function associate(generation:number){
  if(generation!==current.current||pending.current||!canWriteTelemetry()||!confirmed||!rows.some(row=>row.id===selected))return;
  pending.current=true;setBusy(true);setMessage('');
  try{await bindSetup({session_id:recordingId,setup_id:selected,bike_id:bikeId});if(generation===current.current){setConfirmed(false);setMessage('Setup asociado a la grabación');onBound();}}
  catch(e){if(generation===current.current)setMessage(e instanceof Error?e.message:'No se pudo asociar');}
  finally{pending.current=false;if(generation===current.current)setBusy(false);}
 }
 return <section aria-label="Setup utilizado en la grabación"><h3>Relacionar preparación y grabación</h3>
  <p>Declara únicamente el setup que se utilizó en esta salida. Esta asociación no aprueba un montaje ni demuestra por sí sola que se haya aplicado.</p>
  {loading?<p role="status">Consultando setups…</p>:rows.length?<>
   <label>Setup utilizado<select value={selected} disabled={busy||!canWriteTelemetry()} onChange={e=>{setSelected(e.target.value);setConfirmed(false);}}><option value="">Selecciona un setup</option>{rows.map(row=><option key={row.id} value={row.id}>{row.label} · versión {row.version}</option>)}</select></label>
   <label><input type="checkbox" checked={confirmed} disabled={busy||!selected||!canWriteTelemetry()} onChange={e=>setConfirmed(e.target.checked)}/>Confirmo que este setup corresponde al montaje utilizado en esta grabación.</label>
   <button className="btn" disabled={busy||!selected||!confirmed||!canWriteTelemetry()} onClick={()=>{const generation=current.current;requestLeave(()=>void associate(generation));}}>{busy?'Asociando…':'Asociar setup a esta grabación'}</button>
  </>:<p>No hay setups guardados para la moto seleccionada.</p>}
  {message&&<p role="status">{message}</p>}
 </section>;
}
