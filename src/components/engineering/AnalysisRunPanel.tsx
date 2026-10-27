import {DomainReportCoverage} from '../chassis/domains/DomainCoverage';
import type {DomainReference} from '../../domain/domainEvidence';
import {engineeringLabel as label,EngineeringIdentifier} from './engineeringPresentation';
import {useEffect,useRef,useState} from 'react';
import {useEngineeringSession} from '../../context/EngineeringSessionContext';
import {useWorkspaceDraft} from '../../context/WorkspaceDraftContext';
import type {AnalysisRun,CurrentValidity,EngineeringReference,EngineeringReport,HumanEvent,SynthesisProgress,StoredProposal} from '../../domain/engineeringSession';
import * as api from '../../services/engineeringSession';
import {canWriteTelemetry,identitySnapshot} from '../../services/telemetryIdentity';
import {serializeEngineeringReport} from '../../domain/chassisReport';
import {CrewChiefProposal} from './CrewChiefProposal';
import {ContrastPanel} from './ContrastPanel';
import {HumanDecisionPanel} from './HumanDecisionPanel';
import {HistoricalValidationPanel} from './HistoricalValidationPanel';
import {ReportInputRequests} from './InputRequests';
import {isReadingView,type WorkView,type AnalysisPresentation} from '../../domain/chassisWorkViews';
import '../../styles/engineering.css';
const message=(e:unknown)=>e instanceof Error?e.message:'No se pudo consultar el análisis';
type StartAttempt={snapshotOperation:string;runOperation:string;snapshotId:string|null;retryOf:string|null};
interface PresentationProps {workView?:WorkView;contextKey?:string;onPresentation?:(state:AnalysisPresentation)=>void;suspensionAnalyses?:{id:string;revision:number;digest:string}[];domainContexts?:DomainReference[]}
export function AnalysisRunPanel(props:PresentationProps={}){
  const context=useEngineeringSession();const [generation,setGeneration]=useState(0);
  useEffect(()=>{const reset=()=>setGeneration(g=>g+1);window.addEventListener('telemetry-scope-changed',reset);return()=>window.removeEventListener('telemetry-scope-changed',reset);},[]);
  const key=`${context.scope}:${generation}:${context.workspaceEpoch}:${context.session?.id}:${context.session?.revision}:${JSON.stringify(context.association?.selection??null)}:${JSON.stringify(props.suspensionAnalyses??null)}:${JSON.stringify(props.domainContexts??null)}`;
  return <AnalysisWorkspace key={key} {...props}/>;
}
function AnalysisWorkspace({workView='engineer',contextKey='',onPresentation,suspensionAnalyses,domainContexts}:PresentationProps){
  const engineering=useEngineeringSession(),session=engineering.session,identity=identitySnapshot();
  const {isDirty}=useWorkspaceDraft();
  const prepared=!!session&&engineering.association?.session_id===session.id&&engineering.association.session_revision===session.revision&&!engineering.loading&&!engineering.busy&&!engineering.bridgeLoading&&!isDirty;
  const [run,setRun]=useState<AnalysisRun|null>(null),[progress,setProgress]=useState<SynthesisProgress|null>(null),[stored,setStored]=useState<StoredProposal|null>(null),[validity,setValidity]=useState<CurrentValidity|null>(null);
  const [frozenSetups,setFrozenSetups]=useState<EngineeringReference[]>([]);
  const [snapshotInfo,setSnapshotInfo]=useState<{analyzable:boolean;blocked_reasons:string[]}|null>(null);
  const [events,setEvents]=useState<HumanEvent[]>([]),[cursor,setCursor]=useState<string|null>(null),[recovery,setRecovery]=useState(false),[eventsLoaded,setEventsLoaded]=useState(false),[pageCursor,setPageCursor]=useState<string|undefined>(undefined);
  const [report,setReport]=useState<EngineeringReport|null>(null),[loading,setLoading]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[eventError,setEventError]=useState(''),[reportError,setReportError]=useState(''),[ambiguousStart,setAmbiguousStart]=useState(false),[reconcileBlocked,setReconcileBlocked]=useState(false),[reconcileStatus,setReconcileStatus]=useState('');
  const [resolutionNote,setResolutionNote]=useState(''),[resolutionEvidence,setResolutionEvidence]=useState('');
  const presentationReadOnly=isReadingView(workView);
  const presentationStatus:AnalysisPresentation['status']=loading?'unknown':error||snapshotInfo?.analyzable===false||(stored&&(!validity?.current||validity.reasons.length>0))?'blocked':run?.status==='running'?'running':stored?'review':'idle';
  const presentationBlockers=JSON.stringify([...new Set([...(error?[error]:[]),...(snapshotInfo?.blocked_reasons??[]),...(validity?.reasons??[]),...(stored&&!validity?['authority_unconfirmed']:[])])]);
  useEffect(()=>{onPresentation?.({contextKey,status:presentationStatus,proposalId:stored?.proposal_id??null,blockers:JSON.parse(presentationBlockers)});},[contextKey,presentationStatus,stored?.proposal_id,presentationBlockers,onPresentation]);
  const resolutionIds=resolutionEvidence.split(/[\s,]+/).filter(Boolean);
  const resolutionReady=!!resolutionNote.trim()&&resolutionIds.length>0&&resolutionIds.length<=64&&new Set(resolutionIds).size===resolutionIds.length&&resolutionIds.every(id=>/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(id));
  const epoch=useRef(0),readVersion=useRef(0),pending=useRef(false),reading=useRef(false),eventPending=useRef(false),controllers=useRef(new Set<AbortController>()),readController=useRef<AbortController|null>(null),startAttempt=useRef<StartAttempt|null>(null),resolutionAttempt=useRef<{body:{expected_revision:number;note:string;evidence_ids:string[]};operation:string}|null>(null);
  const alive=useRef(true),printFrame=useRef<HTMLIFrameElement|null>(null);
  const loadedRun=useRef<string|null>(null),persistedStatus=useRef<AnalysisRun['status']|null>(null);
  const ownController=()=>{const c=new AbortController();controllers.current.add(c);return c;};
  const same=(g:number,c:AbortController)=>alive.current&&epoch.current===g&&!c.signal.aborted;
  async function refresh(){
    if(!session||reading.current)return false;reading.current=true;const g=epoch.current,v=++readVersion.current,c=ownController();readController.current=c;setLoading(true);setError('');setValidity(null);
    try{
      const current=await api.getCurrentAnalysisRun(session.id,c.signal);if(!same(g,c)||v!==readVersion.current)return;
      if(loadedRun.current!==(current?.run_id??null)){setProgress(null);setStored(null);setFrozenSetups([]);setSnapshotInfo(null);loadedRun.current=current?.run_id??null;}
      persistedStatus.current=current?.status??null;setRun(current);
      if(!current){setProgress(null);setStored(null);setValidity(null);return true;}
      const next=await api.getSynthesis(current.run_id,c.signal);if(!same(g,c)||v!==readVersion.current)return;setProgress(next);
      if(!next.proposal_id||current.status==='cancelled'){setStored(null);setValidity(null);return true;}
      const proposal=await api.getProposal(next.proposal_id,undefined,c.signal);
      if(proposal.proposal.run_id!==current.run_id||proposal.proposal.snapshot_digest!==current.snapshot_digest)throw new Error('La propuesta no corresponde al snapshot de la ejecución');
      const [authority,snapshot]=await Promise.all([api.getCurrentValidity(proposal.proposal_id,proposal.proposal.revision,c.signal),api.getAnalysisSnapshot(current.snapshot_id,c.signal)]);
      if(snapshot.session_id!==session.id||snapshot.snapshot_digest!==current.snapshot_digest||snapshot.session_revision!==session.revision)throw new Error('Snapshot de otra revisión; recarga el contexto');
      if(same(g,c)&&v===readVersion.current){setSnapshotInfo({analyzable:snapshot.analyzable,blocked_reasons:snapshot.blocked_reasons});setFrozenSetups([snapshot.selection.setup_a,snapshot.selection.setup_b].filter((ref):ref is EngineeringReference=>ref!==null));setStored(proposal);setValidity(authority);}
      return same(g,c)&&v===readVersion.current;
    }catch(e){if(same(g,c)&&v===readVersion.current){setError(message(e));setValidity(null);}}
    finally{controllers.current.delete(c);if(same(g,c)&&v===readVersion.current){reading.current=false;setLoading(false);}}
  }
  async function loadEvents(after?:string,replace=false){
    if(!session||identity.mode!=='authenticated'||eventPending.current)return;eventPending.current=true;const g=epoch.current,c=ownController();setEventError('');setPageCursor(after);
    try{const page=await api.getHumanEvents(session.id,after,c.signal);if(!same(g,c))return;
      if(page.items.some(e=>e.session_id!==session.id))throw new Error('Eventos de otra sesión; respuesta descartada');
      setEvents(old=>[...new Map([...(replace?[]:old),...page.items].map(e=>[e.id,e])).values()]);setCursor(page.next_cursor);setPageCursor(after);setRecovery(page.recovery_unavailable);setEventsLoaded(true);
    }catch(e){if(same(g,c))setEventError(message(e));}finally{controllers.current.delete(c);if(same(g,c))eventPending.current=false;}
  }
  useEffect(()=>{alive.current=true;reading.current=false;eventPending.current=false;if(session){void refresh();void loadEvents(undefined,true);}return()=>{alive.current=false;epoch.current++;readVersion.current++;controllers.current.forEach(c=>c.abort());controllers.current.clear();};},[]);
  const active=run?.status==='running'||(run?.status==='sealed'&&(!progress||['running','not_requested'].includes(progress.status)));
  useEffect(()=>{const update=()=>{if(document.visibilityState==='visible'&&active)void refresh();};const timer=window.setInterval(update,5000);document.addEventListener('visibilitychange',update);return()=>{window.clearInterval(timer);document.removeEventListener('visibilitychange',update);};},[active]);
  useEffect(()=>()=>{printFrame.current?.remove();printFrame.current=null;},[report]);
  async function start(retry=false){
    if(!session||!engineering.association||!prepared||pending.current||!canWriteTelemetry()||run?.status==='running'||reconcileBlocked)return;
    pending.current=true;setBusy(true);setError('');const g=epoch.current,c=ownController();
    let creating=false;
    try{
      if(!startAttempt.current&&identity.mode==='authenticated'){
        setReconcileBlocked(true);
        await api.reconcileAnalysisStarts(session.id,c.signal);if(!same(g,c))return;
        readVersion.current++;readController.current?.abort();reading.current=false;
        const refreshed=await refresh();if(!same(g,c))return;
        if(!refreshed)throw new Error('No se pudo recargar la ejecución tras reconciliar. Reintenta la recuperación.');
        setReconcileBlocked(false);
        if(persistedStatus.current==='running')return;
      }
      creating=true;
      if(!startAttempt.current)startAttempt.current={snapshotOperation:crypto.randomUUID(),runOperation:crypto.randomUUID(),snapshotId:null,retryOf:retry?run?.run_id??null:null};
      const attempt=startAttempt.current;
      if(!attempt.snapshotId){const selection={...engineering.association.selection,...(domainContexts?.length?{domain_contexts:domainContexts}:{}),...(suspensionAnalyses?.length?{suspension_analyses:suspensionAnalyses}:{})};const snapshot=await api.createAnalysisSnapshot(session.id,session.revision,selection,attempt.snapshotOperation,c.signal);if(!same(g,c))return;attempt.snapshotId=snapshot.id;setSnapshotInfo({analyzable:snapshot.analyzable,blocked_reasons:snapshot.blocked_reasons});}
      const next=await api.startAnalysisRun(session.id,attempt.snapshotId,session.revision,attempt.runOperation,attempt.retryOf,c.signal);if(!same(g,c))return;
      startAttempt.current=null;setAmbiguousStart(false);loadedRun.current=next.run_id;setRun(next);setProgress(null);setStored(null);setValidity(null);setReport(null);void refresh();
    }catch(e){if(same(g,c)){
      setError(message(e));
      if(creating){const conflict=e instanceof api.EngineeringRequestError&&e.status===409;const ambiguous=!(e instanceof api.EngineeringRequestError)||e.status>=500;setAmbiguousStart(ambiguous);if(!ambiguous)startAttempt.current=null;if(conflict){setReconcileBlocked(identity.mode==='authenticated');await refresh();engineering.reload();if(same(g,c))setError(message(e));}}
      else setReconcileBlocked(true);
    }}finally{controllers.current.delete(c);if(same(g,c)){pending.current=false;setBusy(false);}}
  }
  async function reconcile(){
    if(!session||pending.current||identity.mode!=='authenticated'||!canWriteTelemetry())return;
    if(startAttempt.current){void start();return;}
    pending.current=true;setBusy(true);setReconcileBlocked(true);setError('');setReconcileStatus('Reconciliando inicios persistidos…');const g=epoch.current,c=ownController();
    try{await api.reconcileAnalysisStarts(session.id,c.signal);if(!same(g,c))return;
      readVersion.current++;readController.current?.abort();reading.current=false;
      const refreshed=await refresh();if(!same(g,c))return;
      if(!refreshed)throw new Error('No se pudo recargar la ejecución tras reconciliar. Reintenta la recuperación.');
      engineering.reload();setReconcileBlocked(false);setReconcileStatus('Inicios reconciliados. Contexto y ejecución recargados.');
    }catch(e){if(same(g,c)){setError(message(e));setReconcileStatus('Recuperación sin confirmar. El inicio de otro análisis sigue bloqueado.');}}
    finally{controllers.current.delete(c);if(same(g,c)){pending.current=false;setBusy(false);}}
  }
  async function cancel(){if(!run||pending.current||!canWriteTelemetry())return;pending.current=true;setBusy(true);setError('');readVersion.current++;readController.current?.abort();reading.current=false;setLoading(false);const g=epoch.current,c=ownController();
    try{const next=await api.cancelAnalysisRun(run.run_id,c.signal);if(same(g,c)){setRun(next);setStored(null);setValidity(null);setProgress(null);setReport(null);startAttempt.current=null;setAmbiguousStart(false);}}
    catch(e){if(same(g,c)){setError(message(e));setValidity(null);}}finally{controllers.current.delete(c);if(same(g,c)){pending.current=false;setBusy(false);}}
  }
  async function buildReport(){if(!session||pending.current)return;pending.current=true;setBusy(true);setReportError('');const g=epoch.current,c=ownController();
    try{const created=await api.createEngineeringReport(session.id,session.revision,c.signal);const saved=await api.getEngineeringReport(created.id,c.signal);if(saved.session_id!==session.id||saved.session_revision!==session.revision)throw new Error('Informe de otro contexto');if(same(g,c))setReport(saved);}
    catch(e){if(same(g,c))setReportError(message(e));}finally{controllers.current.delete(c);if(same(g,c)){pending.current=false;setBusy(false);}}
  }
  function download(){if(!report)return;const url=URL.createObjectURL(new Blob([serializeEngineeringReport(report)],{type:'application/json;charset=utf-8'}));try{const link=document.createElement('a');link.href=url;link.download=`engineering-report-${report.id}.json`;link.click();}finally{URL.revokeObjectURL(url);}}
  function printReport(){
    if(!report)return;printFrame.current?.remove();const frame=document.createElement('iframe');frame.className='engineering-print-frame';frame.title='Informe de ingeniería persistido';frame.setAttribute('aria-hidden','true');document.body.appendChild(frame);printFrame.current=frame;
    const doc=frame.contentDocument,view=frame.contentWindow;if(!doc||!view){frame.remove();setReportError('No se pudo abrir la vista de impresión. Descarga el JSON persistido.');return;}
    doc.title=`Informe de ingeniería ${report.id}`;const style=doc.createElement('style');style.textContent='body{font:12px monospace;color:#111;background:#fff;margin:24px}pre{white-space:pre-wrap;overflow-wrap:anywhere}';doc.head.append(style);const pre=doc.createElement('pre');pre.textContent=serializeEngineeringReport(report);doc.body.append(pre);
    view.addEventListener('afterprint',()=>{frame.remove();if(printFrame.current===frame)printFrame.current=null;},{once:true});view.focus();view.print();
  }
  function refreshHuman(){void refresh();void loadEvents(undefined,true);setReport(null);}
  async function resolve(){
    if(!stored||pending.current||identity.mode!=='authenticated'||!canWriteTelemetry())return;
    if(!resolutionAttempt.current&&!resolutionReady)return;
    const next=resolutionAttempt.current??{body:{expected_revision:stored.proposal.revision,note:resolutionNote,evidence_ids:resolutionIds},operation:crypto.randomUUID()};resolutionAttempt.current=next;pending.current=true;setBusy(true);setError('');const g=epoch.current,c=ownController();
    try{await api.resolveProposalConflicts(stored.proposal_id,next.body,next.operation,c.signal);if(same(g,c)){resolutionAttempt.current=null;setResolutionNote('');setResolutionEvidence('');setReport(null);await refresh();}}
    catch(e){if(same(g,c)){setError(message(e));if(e instanceof api.EngineeringRequestError&&e.status<500){resolutionAttempt.current=null;if(e.status===409)await refresh();}}}finally{controllers.current.delete(c);if(same(g,c)){pending.current=false;setBusy(false);}}
  }
  if(!session)return <section className="engineering-analysis"><h2>Análisis y decisión</h2><p>Selecciona una sesión de ingeniería guardada para iniciar o recuperar un análisis.</p></section>;
  return <section className="engineering-analysis" aria-label="Análisis y decisión"><div className="engineering-header"><div><h2>Análisis y decisión</h2><p>Snapshot persistido → especialistas y revisión → propuesta → decisión humana. La aplicación y validación se registran por separado.</p></div><span>{run?`Ejecución ${label(run.status)}`:'Sin ejecución persistida'}</span></div>
    <div hidden={presentationReadOnly} className="engineering-actions"><button className="btn" disabled={busy||loading||!prepared||!canWriteTelemetry()||!!active||ambiguousStart||reconcileBlocked} onClick={()=>void start(false)}>Iniciar análisis</button><button className="btn" disabled={busy||loading} onClick={()=>{void refresh();void loadEvents(undefined,true);}}>Recargar análisis y autoridad</button>{run&&['running','sealed'].includes(run.status)&&<button className="btn" disabled={busy||!canWriteTelemetry()} onClick={()=>void cancel()}>Cancelar ejecución</button>}{run&&!['running','sealed'].includes(run.status)&&<button className="btn" disabled={busy||!prepared||!canWriteTelemetry()||ambiguousStart||reconcileBlocked} onClick={()=>void start(true)}>Reintentar como nueva ejecución</button>}{identity.mode==='authenticated'&&!ambiguousStart&&<button className="btn" disabled={busy||!canWriteTelemetry()} onClick={()=>void reconcile()}>Reconciliar inicios persistidos</button>}{ambiguousStart&&<button className="btn" disabled={busy||!prepared} onClick={()=>void start()}>Recuperar inicio pendiente</button>}</div>
    {reconcileStatus&&<p role="status">{reconcileStatus}</p>}
    {isDirty&&<p>Guarda o descarta los cambios del workspace antes de iniciar un análisis sobre revisiones persistidas.</p>}
    {snapshotInfo&&<div><p>Snapshot: {snapshotInfo.analyzable?'entradas analizables según el servidor':'entradas bloqueadas; la ejecución no acredita un diagnóstico'}.</p><ul>{snapshotInfo.blocked_reasons.map(reason=><li key={reason}>{reason}</li>)}</ul></div>}
    {!engineering.association&&<p>Asocia la grabación y las revisiones de setup persistidas desde Preparar sesión antes de iniciar otro análisis.</p>}{ambiguousStart&&<p>Inicio sin confirmar: se conservan el mismo snapshot, cuerpo e identificadores de operación al recuperar.</p>}{loading&&<p role="status">Consultando ejecución persistida…</p>}{busy&&<p role="status">Guardando operación…</p>}{error&&<p role="alert">{error}</p>}
    {stored&&<section aria-label="Autoridad actual de la propuesta"><h3>Vigencia de la propuesta</h3><p>{validity?.approved_current?'Aprobación humana vigente para la revisión consultada.':validity?.current?'Contexto vigente; sin aprobación humana vigente.':'Vigencia sin confirmar. Esta propuesta no autoriza el montaje.'}</p>{validity?.reasons.map(reason=><p key={reason}>{reason}</p>)}<button type="button" className="btn" disabled={busy||loading} onClick={()=>{void refresh();void loadEvents(undefined,true);}}>Consultar vigencia actual</button></section>}
    {run&&<details open={!presentationReadOnly}><summary>Detalle técnico de la ejecución</summary><div className="engineering-identity"><EngineeringIdentifier value={run.run_id} label="Run"/><EngineeringIdentifier value={run.snapshot_id} label="Snapshot"/><EngineeringIdentifier value={run.snapshot_digest} label="SHA-256"/>{label(run.review_mode)}</div><div className="engineering-table-scroll"><table><caption>Estados originales de tareas · actualización cada 2 s sólo mientras esta vista está visible y la ejecución o síntesis sigue activa</caption><thead><tr><th>Rama</th><th>Especialista / revisor</th><th>Estado servidor</th><th>Causa</th><th>Hash de resultado</th></tr></thead><tbody>{run.tasks.map(task=><tr key={task.task_id}><td>{label(task.branch)}</td><th>{task.agent_id}</th><td>{label(task.status)}</td><td>{task.cause?label(task.cause):'—'}</td><td><EngineeringIdentifier value={task.result_hash} label="Hash"/></td></tr>)}</tbody></table></div><p>Síntesis: {progress?.status?label(progress.status):'Sin consultar'}{progress?.cause?` · ${label(progress.cause)}`:''}</p></details>}
    {stored?<><CrewChiefProposal stored={stored}/><div hidden={presentationReadOnly}><HumanDecisionPanel key={`${stored.proposal_id}:${stored.proposal.revision}`} stored={stored} validity={validity} sessionRevision={session.revision} frozenSetups={frozenSetups} events={events} onRefresh={refreshHuman}/></div>
      {!presentationReadOnly&&stored.proposal.matrix.conflicts.length>0&&<details><summary>Resolver discrepancias con evidencia</summary><p>Registra una nueva revisión con 1–64 UUIDs de evidencia únicos. La evidencia y la autoridad se verifican en el servidor; una recuperación conserva el mismo cuerpo y operación.</p><label>Justificación de resolución<textarea disabled={busy||!!resolutionAttempt.current} maxLength={2000} value={resolutionNote} onChange={e=>setResolutionNote(e.target.value)}/></label><label>IDs de evidencia de la resolución<textarea disabled={busy||!!resolutionAttempt.current} value={resolutionEvidence} onChange={e=>setResolutionEvidence(e.target.value)}/></label><button className="btn" disabled={busy||identity.mode!=='authenticated'||!canWriteTelemetry()||(!resolutionAttempt.current&&!resolutionReady)} onClick={()=>void resolve()}>{resolutionAttempt.current?'Recuperar resolución pendiente':'Guardar revisión de resolución'}</button></details>}
    </>:progress?.report&&<section><h3>Resumen de referencias · sin propuesta del Crew Chief</h3><p>{progress.report.provenance}. Este agregado determinista no acredita una síntesis de modelo ni habilita firma.</p><ContrastPanel sections={progress.report.section_summaries} matrix={progress.report.matrix}/><p>Fuentes: {progress.report.source_status.join(' · ')}</p><ul>{progress.report.limitations.map((l,i)=><li key={i}>{l}</li>)}</ul></section>}
    {identity.mode==='authenticated'&&<div hidden={presentationReadOnly}><HistoricalValidationPanel sessionId={session.id} events={events} onRefresh={refreshHuman}/></div>}
    <details open={!presentationReadOnly}><summary>Historial y trazabilidad</summary><section className="engineering-human-events"><h3>Eventos humanos persistidos</h3>{identity.mode==='local'?<p>Sin historial de autoridad humana en modo local.</p>:<><p>{events.length} eventos cargados. {cursor?'Hay más páginas.':'Sin cursor adicional en la respuesta actual.'} El orden de paginación no implica orden cronológico.</p>{!eventsLoaded&&<p>Historial aún sin confirmar.</p>}{events.map(e=><details key={e.id}><summary>{e.kind} · {e.action??'registro'} · {e.created_at}</summary><p>Actor {e.actor_id} · designación r{e.designation_revision} · propuesta {e.proposal_id} r{e.proposal_revision}</p><pre>{JSON.stringify(e,null,2)}</pre></details>)}{recovery&&<p role="alert">Recuperación de recibos no disponible. Puede haber eventos pendientes; reintenta esta página.</p>}{eventError&&<p role="alert">{eventError}</p>}{(recovery||eventError)&&<button className="btn" onClick={()=>void loadEvents(pageCursor,false)}>Reintentar página de eventos</button>}{cursor&&<button className="btn" onClick={()=>void loadEvents(cursor,false)}>Cargar más eventos</button>}</>}
    </section>
    </details><section className="engineering-saved-report"><h3>Informe de ingeniería persistido</h3><p>Crea una nueva versión del informe desde las revisiones guardadas. La vigencia que captura corresponde a su fecha de creación.</p><button hidden={presentationReadOnly} className="btn" disabled={busy||!canWriteTelemetry()} onClick={()=>void buildReport()}>Guardar nueva versión del informe</button>{reportError&&<p role="alert">{reportError}</p>}{report&&<><p>Informe {report.id} · sesión r{report.session_revision} · {report.created_at} · digest <code>{report.content_digest}</code></p><p>Autoridad al crear: {report.current_validity?.approved_current?'aprobada vigente':report.current_validity?.current?'contexto vigente':'no confirmada'}. No constituye autorización actual.</p><div className="engineering-actions"><button className="btn" onClick={download}>Descargar informe de ingeniería JSON</button><button className="btn" onClick={printReport}>Imprimir informe de ingeniería</button></div><ul>{report.limitations.map((l,i)=><li key={i}>{l}</li>)}</ul>{report.domain_coverage&&<DomainReportCoverage coverage={report.domain_coverage}/>}<ReportInputRequests branches={report.branches}/><details><summary>Documento persistido completo</summary><pre>{serializeEngineeringReport(report)}</pre></details></>}
    </section>
  </section>;
}
