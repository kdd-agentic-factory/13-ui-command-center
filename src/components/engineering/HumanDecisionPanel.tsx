import {useEffect,useRef,useState} from 'react';
import type {ApplicationInput,CurrentValidity,DecisionAction,DecisionInput,EngineeringReference,HumanEvent,StoredProposal} from '../../domain/engineeringSession';
import * as api from '../../services/engineeringSession';
import {identitySnapshot} from '../../services/telemetryIdentity';
type Attempt={operation_id:string;kind:'decision';body:DecisionInput}|{operation_id:string;kind:'application';body:ApplicationInput};
const actualTime=(value:string)=>{const n=Date.parse(value);return Number.isFinite(n)&&n<=Date.now()&&/(Z|[+-]\d\d:\d\d)$/.test(value);};
export function HumanDecisionPanel({stored,validity,sessionRevision,frozenSetups=[],onRefresh}:{stored:StoredProposal;validity:CurrentValidity|null;sessionRevision:number;events:HumanEvent[];frozenSetups?:EngineeringReference[];onRefresh:()=>void}){
  const identity=identitySnapshot(),p=stored.proposal;
  const [note,setNote]=useState(''),[error,setError]=useState(''),[status,setStatus]=useState(''),[busy,setBusy]=useState(false),[uncertain,setUncertain]=useState(false),[locked,setLocked]=useState(false);
  const [setup,setSetup]=useState(''),[mounted,setMounted]=useState(''),[applicationNote,setApplicationNote]=useState('');
  const attempt=useRef<Attempt|null>(null),pending=useRef(false),epoch=useRef(0),controller=useRef<AbortController|null>(null);
  useEffect(()=>{setLocked(false);},[validity]);
  useEffect(()=>{const reset=()=>{epoch.current++;controller.current?.abort();attempt.current=null;pending.current=false;setBusy(false);setUncertain(false);setLocked(true);setNote('');setStatus('');setError('El ámbito cambió. Recarga la propuesta vigente.');};window.addEventListener('telemetry-scope-changed',reset);return()=>{epoch.current++;controller.current?.abort();window.removeEventListener('telemetry-scope-changed',reset);};},[]);
  const designated=identity.mode==='authenticated'&&!!identity.user&&(identity.role==='admin'||identity.role==='engineer')&&!!validity?.authority_available&&[validity.primary_id,validity.substitute_id].includes(identity.user);
  const exact=!!validity&&validity.proposal_id===stored.proposal_id&&validity.proposal_revision===p.revision&&validity.authority_proposal_id===stored.authority_proposal_id&&validity.generation===stored.generation;
  const enabled=designated&&exact&&!busy&&!uncertain&&!locked;
  const label=(id:string|null)=>id?`${id}${id===identity.user?' · Tú':''}`:'Sin designar';
  const base=()=>({expected_session_revision:sessionRevision,expected_proposal_revision:p.revision,expected_designation_revision:validity!.designation_revision!,proposal_digest:stored.proposal_digest,snapshot_digest:p.snapshot_digest});
  async function submit(next:Attempt){
    if(pending.current)return;const recovering=uncertain&&attempt.current?.operation_id===next.operation_id;let possiblySubmitted=recovering;pending.current=true;attempt.current=next;setBusy(true);setError('');setStatus('');const g=epoch.current,c=new AbortController();controller.current=c;
    try{
      if(g!==epoch.current||c.signal.aborted)return;
      possiblySubmitted=true;
      if(next.kind==='decision')await api.decideProposal(stored.proposal_id,next.body,next.operation_id,c.signal);
      else if(next.kind==='application')await api.recordApplication(stored.proposal_id,next.body,next.operation_id,c.signal);
      if(g!==epoch.current)return;attempt.current=null;setUncertain(false);setLocked(true);setStatus('Evento humano persistido. Actualizando la autoridad y el historial.');onRefresh();
    }catch(e){if(g!==epoch.current||c.signal.aborted)return;const conflict=e instanceof api.EngineeringRequestError&&e.status===409;
      const ambiguous=possiblySubmitted&&(!(e instanceof api.EngineeringRequestError)||e.status>=500);
      setError(e instanceof Error?e.message:'No se pudo confirmar el evento');setUncertain(ambiguous);if(!ambiguous)attempt.current=null;
      if(conflict){setLocked(true);onRefresh();}
    }finally{if(g===epoch.current){pending.current=false;setBusy(false);}}
  }
  function decide(action:DecisionAction){const flag=action==='approve'?validity?.approvable:action==='reject'?validity?.rejectable:validity?.revision_requestable;if(!enabled||!flag||!validity?.designation_revision)return;void submit({kind:'decision',operation_id:crypto.randomUUID(),body:{...base(),action,note}});}
  const targets=p.items.flatMap(i=>i.parameters).map(v=>({id:v.setup_id,revision:v.revision}));
  const permittedTargets=targets.length?targets:frozenSetups.slice(0,1);
  const setups=[...new Map(permittedTargets.filter(v=>frozenSetups.some(s=>s.id===v.id&&s.revision===v.revision)).map(v=>[`${v.id}:${v.revision}`,v])).entries()];
  return <section className="engineering-decisions" aria-label="Decisión humana"><h3>Crew Chief · decisión humana</h3>
    <p>Titular vigente: {label(validity?.primary_id??null)}<br/>Sustituto vigente: {label(validity?.substitute_id??null)} · designación r{validity?.designation_revision??'—'}</p>
    <p>Estado: {validity?.approved_current?'Aprobada y vigente':validity?.current?'Contexto vigente':validity?.decision_action?`Decisión histórica: ${validity.decision_action}`:'Vigencia sin confirmar'}.</p>
    {!designated&&<p>La firma requiere identidad verificada del titular o sustituto vigente. El perfil de interfaz no concede permiso. Modo local sin firma humana.</p>}
    {validity?.reasons.map(reason=><p key={reason}>{reason}</p>)}
    <label>Nota de decisión<textarea maxLength={2000} value={note} disabled={busy||uncertain} onChange={e=>setNote(e.target.value)}/></label>
    <div className="engineering-actions"><button className="btn" disabled={!enabled||!validity?.approvable} onClick={()=>decide('approve')}>Aprobar propuesta</button><button className="btn" disabled={!enabled||!validity?.rejectable} onClick={()=>decide('reject')}>Rechazar propuesta</button><button className="btn" disabled={!enabled||!validity?.revision_requestable} onClick={()=>decide('request_revision')}>Solicitar revisión</button></div>
    {busy&&<p role="status">Confirmando evento humano…</p>}{error&&<p role="alert">{error}</p>}{status&&<p role="status">{status}</p>}
    {uncertain&&<div><p>La respuesta puede haberse perdido después de persistir. Recupera el mismo evento y cuerpo antes de iniciar otro.</p><button className="btn" disabled={busy||identity.mode!=='authenticated'||!identity.user||(identity.role!=='engineer'&&identity.role!=='admin')} onClick={()=>{if(attempt.current)void submit(attempt.current);}}>Recuperar {attempt.current?.kind==='decision'?'decisión':attempt.current?.kind==='application'?'aplicación':'validación'} pendiente</button></div>}
    <details><summary>Registrar aplicación real del setup</summary><p>Evento separado de la aprobación. Sólo un objetivo de propuesta o su referencia de medida congelada en el snapshot; el servidor verifica la revisión autorizada. Sin montaje automático.</p>
      <label>Setup realmente montado<select value={setup} onChange={e=>setSetup(e.target.value)}><option value="">Selecciona revisión autorizada</option>{setups.map(([key,ref])=><option key={key} value={key}>{ref.id} · r{ref.revision}</option>)}</select></label>
      <label>Fecha de montaje con zona horaria<input placeholder="AAAA-MM-DDThh:mm:ss+02:00" value={mounted} onChange={e=>setMounted(e.target.value)}/></label><label>Nota del montaje<textarea maxLength={2000} value={applicationNote} onChange={e=>setApplicationNote(e.target.value)}/></label>
      <button className="btn" disabled={!enabled||!validity?.approved_current||!setups.some(([key])=>key===setup)||!actualTime(mounted)||!applicationNote.trim()} onClick={()=>{const ref=setups.find(([key])=>key===setup)?.[1];if(enabled&&validity?.approved_current&&ref&&actualTime(mounted))void submit({kind:'application',operation_id:crypto.randomUUID(),body:{...base(),setup:ref,mounted_at:mounted,note:applicationNote}});}}>Registrar aplicación</button>
    </details>
  </section>;
}
