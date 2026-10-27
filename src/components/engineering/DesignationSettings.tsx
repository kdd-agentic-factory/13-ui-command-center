import {useEffect,useRef,useState} from 'react';
import type {CrewDesignation,DesignationCandidate} from '../../domain/engineeringSession';
import * as api from '../../services/engineeringSession';
import {identitySnapshot} from '../../services/telemetryIdentity';
import '../../styles/engineering.css';
export function DesignationSettings(){
  const [identity,setIdentity]=useState(identitySnapshot);
  useEffect(()=>{const reset=()=>setIdentity(identitySnapshot());window.addEventListener('telemetry-scope-changed',reset);return()=>window.removeEventListener('telemetry-scope-changed',reset);},[]);
  return <DesignationEditor key={`${identity.mode}:${identity.user}:${identity.team}:${identity.role}`} identity={identity}/>;
}
function DesignationEditor({identity}:{identity:ReturnType<typeof identitySnapshot>}){
  const [designation,setDesignationState]=useState<CrewDesignation|null>(null),[candidates,setCandidates]=useState<DesignationCandidate[]>([]),[cursor,setCursor]=useState<string|null>(null),[primary,setPrimary]=useState(''),[substitute,setSubstitute]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[status,setStatus]=useState('');
  const epoch=useRef(0),controller=useRef<AbortController|null>(null),pending=useRef(false);
  const admin=identity.mode==='authenticated'&&identity.role==='admin'&&!!identity.team;
  async function load(){const g=epoch.current,c=new AbortController();controller.current=c;setBusy(true);setError('');
    try{const saved=await api.getDesignation(c.signal);const page=admin?await api.getDesignationCandidates(undefined,c.signal):null;if(g!==epoch.current)return;setDesignationState(saved);setPrimary(saved.primary_id??'');setSubstitute(saved.substitute_id??'');setCandidates(page?.items??[]);setCursor(page?.next_cursor??null);}
    catch(e){if(g===epoch.current&&!c.signal.aborted)setError(e instanceof Error?e.message:'Designación no disponible');}finally{if(g===epoch.current)setBusy(false);}}
  useEffect(()=>{if(identity.mode==='authenticated')void load();return()=>{epoch.current++;controller.current?.abort();};},[]);
  async function more(){if(!cursor||pending.current)return;pending.current=true;const g=epoch.current,c=new AbortController();controller.current=c;setBusy(true);try{const page=await api.getDesignationCandidates(cursor,c.signal);if(g===epoch.current){setCandidates(old=>[...new Map([...old,...page.items].map(x=>[x.user_id,x])).values()]);setCursor(page.next_cursor);}}catch(e){if(g===epoch.current&&!c.signal.aborted)setError(e instanceof Error?e.message:'No se pudieron cargar miembros');}finally{if(g===epoch.current){pending.current=false;setBusy(false);}}}
  async function save(){if(pending.current||!admin||!designation||!candidates.some(c=>c.user_id===primary)||substitute===primary||(substitute&&!candidates.some(c=>c.user_id===substitute)))return;pending.current=true;const g=epoch.current,c=new AbortController();controller.current=c;setBusy(true);setError('');setStatus('');
    try{const saved=await api.setDesignation({primary_id:primary,substitute_id:substitute||null,expected_revision:designation.revision},c.signal);if(g===epoch.current){setDesignationState(saved);setStatus('Designación guardada en la autoridad del equipo.');}}
    catch(e){if(g===epoch.current&&!c.signal.aborted){const detail=e instanceof Error?e.message:'No se pudo guardar';if(e instanceof api.EngineeringRequestError&&e.status===409)await load();if(g===epoch.current)setError(detail);}}
    finally{if(g===epoch.current){pending.current=false;setBusy(false);}}}
  return <section className="engineering-settings" aria-label="Designación del Crew Chief humano"><h2>Designación del Crew Chief humano</h2><p>El agente sintetiza. El titular o sustituto humano designado decide; los perfiles de interfaz no conceden autoridad.</p>
    {identity.mode==='local'?<p>Modo local: sin designaciones ni firma humana.</p>:<><p>Designación vigente r{designation?.revision??'—'} · titular {designation?.primary_id??'Sin designar'} · sustituto {designation?.substitute_id??'Sin designar'}.</p>
    {admin?<><div className="engineering-fields">{([['Titular humano',primary,setPrimary],['Sustituto humano',substitute,setSubstitute]] as const).map(([label,value,set])=><label key={label}>{label}<select disabled={busy} value={value} onChange={e=>set(e.target.value)}><option value="">Sin seleccionar</option>{candidates.map(c=><option key={c.user_id} value={c.user_id}>{c.user_id} · {c.role}{c.user_id===identity.user?' · Tú':''}</option>)}</select></label>)}</div><p>Miembros reales devueltos por el servidor. Las identidades fuera de esta página requieren cargar más miembros.</p>{cursor&&<button className="btn" disabled={busy} onClick={()=>void more()}>Cargar más miembros</button>}<button className="btn" disabled={busy||!designation||!primary||primary===substitute||!candidates.some(c=>c.user_id===primary)||(!!substitute&&!candidates.some(c=>c.user_id===substitute))} onClick={()=>void save()}>Guardar designación</button></>:<p>La edición requiere el rol administrador verificado.</p>}
    <button className="btn" disabled={busy} onClick={()=>void load()}>Recargar designación</button></>}
    {busy&&<p role="status">Consultando designación…</p>}{error&&<p role="alert">{error}</p>}{status&&<p role="status">{status}</p>}
  </section>;
}
