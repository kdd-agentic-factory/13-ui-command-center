import { TelemetryGate } from '../components/auth/TeamSelector';
import { useEffect, useState,useRef } from 'react';
import {useAuth} from '../context/AuthContext';
import {useChassisWorkView} from '../hooks/useChassisWorkView';
import {ChassisWorkHeader} from '../components/chassis/ChassisWorkHeader';
import {nextWorkStep,type ComparisonPresentation,type AnalysisPresentation} from '../domain/chassisWorkViews';
import '../styles/chassis-workviews.css';
import '../styles/recorded.css';
import '../styles/chassis-workshop.css';
import { ChassisWorkshop } from '../components/chassis/workshop/ChassisWorkshop';
import { useNavigate } from '../context/NavContext';
import { activeRecording, clearRecording, calculateTrail, type RecordedSession, type RecordedSignal } from '../domain/recordedSession';
import { getRecording, getRecordedSignal, saveRecordedGeometry } from '../services/recordedTelemetry';
import { ChassisComparison } from '../components/chassis/ChassisComparison';
import { ProductCoverage } from '../components/chassis/ProductCoverage';
import { ChassisProductStatus } from '../components/chassis/ChassisProductStatus';
import { useWorkspaceDraft } from '../context/WorkspaceDraftContext';
import { useEngineeringSession } from '../context/EngineeringSessionContext';
import { SessionPreparation } from '../components/engineering/SessionPreparation';
import { AnalysisRunPanel } from '../components/engineering/AnalysisRunPanel';
import {SuspensionLabPanel} from '../components/chassis/suspension/SuspensionLabPanel';
import type {LabReference} from '../domain/suspensionLab';
import {DomainEvidencePanel} from '../components/chassis/domains/DomainEvidencePanel';
import type {DomainReference} from '../domain/domainEvidence';

export function ChassisPage() {
  const engineering = useEngineeringSession();
  const {profile}=useAuth();
  const {view,setView}=useChassisWorkView(profile?.id??null,engineering.scope);
  const navigate = useNavigate();
  const {requestLeave,markDirty,isDirty,dirtyOwners} = useWorkspaceDraft();
  useEffect(()=>()=>markDirty(false,'legacy-geometry'),[markDirty]);
  const [session, setSession] = useState<RecordedSession | null>(null);
  const [domainAttachment,setDomainAttachment]=useState<{context:string;references:DomainReference[]}|null>(null);
  const [labAttachment,setLabAttachment]=useState<{context:string;reference:LabReference}|null>(null);
  const [restoring, setRestoring] = useState(Boolean(activeRecording()));
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [signal, setSignal] = useState<RecordedSignal | null>(null);
  const [dimensions, setDimensions] = useState({ radius: '', rake: '', offset: '' });
  const [comparisonPresentation,setComparisonPresentation]=useState<ComparisonPresentation|null>(null);
  const [analysisPresentation,setAnalysisPresentation]=useState<AnalysisPresentation|null>(null);
  const [revealed,setRevealed]=useState<string|null>(null);
  const areas=useRef<Record<string,HTMLElement|null>>({});
  const contextKey=JSON.stringify([engineering.scope,engineering.workspaceEpoch,engineering.session?.id,engineering.session?.revision,session?.id]);
  const nextStep=nextWorkStep({contextKey,sessionReady:!!engineering.session?.circuit&&!!engineering.session?.bike&&!!engineering.session?.rider,recordingReady:!!session,associationReady:!!engineering.session&&engineering.association?.session_id===engineering.session.id&&engineering.association.session_revision===engineering.session.revision&&engineering.association.recording.id===session?.id,workspaceDirty:isDirty,dirtyOwners,sourceStatus:session?.validation?.status??null,comparison:comparisonPresentation,analysis:analysisPresentation});
  const contextLabel=engineering.session?[engineering.session.name,engineering.historical.circuit?.name??'Circuito sin definir',engineering.historical.bike?.name??'Moto sin definir',engineering.historical.rider?.name??'Piloto sin definir',engineering.session.session_type].join(' · '):'Preparar sesión';
  function next(target:string){if(target==='import'){navigate('data');return;}if(target==='comparison'||target==='legacy'||target==='cornering')setView('engineer');if(target==='analysis'&&(view==='rider'||view==='management'))setView(nextStep.code==='review'?'crew-chief':'engineer');setRevealed(target);requestAnimationFrame(()=>{const area=areas.current[target==='cornering'?(session?'comparison':'workshop'):target];if(target==='cornering')area?.querySelector<HTMLButtonElement>('#workshop-tab-cornering')?.click();if(area?.tagName==='DETAILS')area.setAttribute('open','');area?.scrollIntoView({block:'start'});area?.focus();});}
  function visible(area:string){return revealed===area||area==='source'||area==='analysis'||(area==='context'&&!engineering.session)||(['engineer','analyst','mechanic'].includes(view)&&area==='comparison')||(view==='analyst'&&area==='signals');}
  useEffect(()=>{setDimensions(session?.geometry?{radius:String(session.geometry.radius),rake:String(session.geometry.rake),offset:String(session.geometry.offset)}:{radius:'',rake:'',offset:''});setSaved('');markDirty(false,'legacy-geometry');},[engineering.workspaceEpoch,session?.id]);
  useEffect(() => {
    let active = true;
    const id = activeRecording();
    if (id) getRecording(id).then(s => { if (active) { setSession(s); if (s.geometry) setDimensions({ radius: String(s.geometry.radius), rake: String(s.geometry.rake), offset: String(s.geometry.offset) }); setSelected(s.channels.find(c => c.sensor_id === 'suspension_front')?.index ?? s.channels.find(c => c.sensor_id === 'engine_rpm')?.index ?? s.channels[0]?.index ?? null); } }).catch(e => { if (active) setError(String(e.message)); }).finally(() => { if (active) setRestoring(false); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    let active = true; setSignal(null);
    if (session && selected !== null) getRecordedSignal(session.id, selected).then(s => { if (active) setSignal(s); }).catch(e => { if (active) setError(String(e.message)); });
    return () => { active = false; };
  }, [session, selected]);
  let trail: number | null = null;
  try { if (Object.values(dimensions).every(v => v.trim() !== '')) trail = calculateTrail(Number(dimensions.radius), Number(dimensions.rake), Number(dimensions.offset)); } catch { /* Invalid dimensions produce no result. */ }
  const selectedChannel = session?.channels.find(c => c.index === selected);
  const suspension = session?.channels.filter(c => c.sensor_id === 'suspension_front' || c.sensor_id === 'suspension_rear') ?? [];
  function trace() {
    if (!signal || signal.values.length < 2) return '';
    const lo = Math.min(...signal.values), hi = Math.max(...signal.values);
    const start = signal.times[0], span = signal.times[signal.times.length - 1] - start;
    return signal.values.map((v, i) => `${40 + (signal.times[i] - start) / (span || 1) * 720},${170 - (v - lo) / (hi - lo || 1) * 140}`).join(' ');
  }
  async function saveGeometry() {
    if (!session || trail === null || saving) return;
    setSaving(true); setError(''); setSaved('');
    try {
      const updated = await saveRecordedGeometry(session.id, { radius: Number(dimensions.radius), rake: Number(dimensions.rake), offset: Number(dimensions.offset) });
      setSession(updated); setSaved('Dimensiones guardadas y vinculadas a esta sesión.'); markDirty(false,'legacy-geometry'); engineering.workspaceChanged();
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudieron guardar las dimensiones'); }
    finally { setSaving(false); }
  }
  return <div className="page recorded-workspace">
    <div className="flex items-center justify-between mb-4"><h1 className="page-title">Chassis Tool</h1><div>{activeRecording() && <button className="btn" disabled={saving} onClick={() => requestLeave(() => { clearRecording(); setSession(null); setSelected(null); setSignal(null); setError(''); setSaved(''); setDimensions({ radius: '', rake: '', offset: '' }); })}>Cerrar sesión grabada</button>} <button className="btn" onClick={() => navigate('data')}>Importar AiM / 2D</button></div></div>
    <ChassisProductStatus /><ChassisWorkHeader view={view} onView={v=>{setView(v);setRevealed(null);}} contextLabel={contextLabel} nextStep={nextStep} onNext={next} dirty={isDirty}/><div className="chassis-work-layout" data-view={view} data-context-ready={!!engineering.session}>
    <section className="chassis-work-area" data-area="context" ref={e=>{areas.current.context=e;}} tabIndex={-1} hidden={!visible("context")}><SessionPreparation recordingId={session?.id ?? null} /></section>
    <div className="chassis-work-area" data-area="domains" ref={e=>{areas.current.domains=e;}} tabIndex={-1}><DomainEvidencePanel contextKey={contextKey} session={engineering.session} recordingId={session?.id??null} setup={engineering.association?.selection.setup_b??engineering.association?.selection.setup_a??undefined} selection={domainAttachment?.context===contextKey?domainAttachment.references:[]} onSelection={references=>setDomainAttachment({context:contextKey,references})}/></div>
    <div className="chassis-work-area" data-area="lab" ref={e=>{areas.current.lab=e;}} tabIndex={-1}><SuspensionLabPanel contextKey={contextKey} recordingId={session?.id??null} comparisonId={comparisonPresentation?.contextKey===contextKey&&!comparisonPresentation.dirty?comparisonPresentation.comparisonId??undefined:undefined} onEvidenceSaved={reference=>requestLeave(()=>setLabAttachment({context:contextKey,reference}))}/></div>
    {labAttachment?.context===contextKey&&<p role="status">Anexo seleccionado para el próximo snapshot: {labAttachment.reference.id.slice(-8)}. No modifica snapshots anteriores. <button type="button" onClick={()=>requestLeave(()=>setLabAttachment(null))}>Retirar anexo del próximo snapshot</button></p>}
    <section className="chassis-work-area" data-area="analysis" ref={e=>{areas.current.analysis=e;}} tabIndex={-1}><AnalysisRunPanel workView={view} contextKey={contextKey} onPresentation={setAnalysisPresentation} domainContexts={domainAttachment?.context===contextKey?domainAttachment.references:undefined} suspensionAnalyses={labAttachment?.context===contextKey?[labAttachment.reference]:undefined}/></section>
    <p className="page-subtitle">Geometría medida y señales grabadas · ninguna recomendación de setup sin evidencia.</p>
    {error && <p role="alert">{error}</p>}
    {restoring ? <p role="status">Cargando sesión guardada…</p> : !session ? <><div className="card"><h2>Sin sesión grabada</h2><p>Importa una sesión para inspeccionar sus señales. Puedes explorar las piezas del esquema; no hay un diagnóstico ni cambios mecánicos disponibles.</p></div><div className="chassis-work-area" data-area="workshop" ref={e=>{areas.current.workshop=e;}} tabIndex={-1} hidden={view!=="engineer"&&view!=="mechanic"}><ChassisWorkshop workView={view} draft={{values:{},assumed:{}}} onChange={()=>{}} onCalculate={()=>{}} bike="" recordingId={null} preview={null} busy={false} error=""/></div></> : <>
      <section className="chassis-work-area chassis-source-brief" data-area="source" ref={e=>{areas.current.source=e;}} tabIndex={-1}><h2>{session.filename}</h2><p>{session.source.toUpperCase()} · {session.channels.length} canales · {session.laps.length} marcadores de vuelta.</p><details><summary>Fuente y trazabilidad</summary><p>Lector {session.reader} {session.reader_version}. Sesión guardada: {session.id} · clasificación: {session.classification}</p></details></section>
      {session.validation?.status==='experimental'&&<section className="chassis-source-warning"><h2>Fuente 2D pendiente de validar</h2><p>Escala y reloj experimentales: contrasta con 2D Analyzer antes de fundamentar decisiones mecánicas.</p><details><summary>Canales excluidos ({session.excluded_channels?.length??0})</summary>{session.excluded_channels?.map((c,i)=><p key={i}>{c.name}: {c.reason}</p>)}</details></section>}
      <section className="chassis-work-area" data-area="comparison" ref={e=>{areas.current.comparison=e;}} tabIndex={-1} hidden={!visible("comparison")}><ChassisComparison workView={view} contextKey={contextKey} onPresentation={setComparisonPresentation} key={`${session.id}:${engineering.workspaceEpoch}`} sessionId={session.id} engineeringSessionId={engineering.session?.id} channels={session.channels} geometry={session.geometry} onPersistedChange={engineering.workspaceChanged} /></section>
      <div hidden={view!=="analyst"&&view!=="engineer"} className="card mb-4"><h2>Suspensión registrada</h2>
        {suspension.length ? suspension.map(c => <p key={c.index}>{c.name}: {c.min.toFixed(2)}–{c.max.toFixed(2)} {c.unit || '(unidad no informada)'} · {c.sample_count} muestras. Contrasta el cero del sensor con su calibración.</p>) : <p>No se han identificado canales de suspensión. No se puede calcular su recorrido ni diagnosticar su comportamiento.</p>}
        <p>Balance, agarre y cambios de clics: sin determinar. Requieren geometría, calibración y un modelo contrastado.</p>
      </div>
      <div hidden={!visible("signals")} className="card mb-4 chassis-work-area" data-area="signals" ref={e=>{areas.current.signals=e;}} tabIndex={-1}><h2>{session.validation?.clock==='metadata_reconstructed'?'Señal y reloj reconstruido':'Señal y tiempo originales'}</h2>
        <select aria-label="Canal registrado" value={selected ?? ''} onChange={e => setSelected(Number(e.target.value))}>{session.channels.map(c => <option key={c.index} value={c.index}>{c.name} · {c.unit || 'unidad desconocida'}</option>)}</select>
        {selectedChannel && <p>{selectedChannel.sample_count} muestras · {selectedChannel.start_s.toFixed(3)}–{selectedChannel.end_s.toFixed(3)} s · mín. {selectedChannel.min.toFixed(3)} · máx. {selectedChannel.max.toFixed(3)} {selectedChannel.unit} · {selectedChannel.kind === 'gps_computed' ? 'GPS derivado por el SDK, no señal bruta' : selectedChannel.kind === 'gps_raw' ? 'GPS bruto' : session.validation?.clock==='metadata_reconstructed'?'Canal decodificado · reloj reconstruido, origen sin verificar':'Canal registrado o exportado'}</p>}
        {signal && <><svg viewBox="0 0 800 200" role="img" aria-label={`Señal registrada ${signal.name}`} style={{ width: '100%', maxHeight: 260 }}><line x1="40" y1="170" x2="760" y2="170" stroke="var(--text-muted)" /><polyline points={trace()} fill="none" stroke="var(--cyan)" strokeWidth="1.5" /></svg><p>{signal.preview ? `Vista reducida de muestras originales (${signal.values.length} de ${signal.original_count}); sin interpolación.` : 'Muestras originales, sin interpolación.'} Eje horizontal: segundos. Eje vertical: {signal.unit || 'unidad no informada'}.</p></>}
      </div>
    </>}
    <details className="chassis-work-area"><summary>Cobertura del producto y funciones pendientes</summary><ProductCoverage session={session} /></details>
    <details ref={e=>{areas.current.legacy=e;}} tabIndex={-1} hidden={view!=="engineer"} className="card chassis-legacy"><summary>Medidas estáticas anteriores · calculadora local</summary><h2>Geometría estática</h2><p>Introduce medidas de la moto: dirección respecto a la vertical, rueda circular y offset perpendicular al eje de dirección.</p>
      {([['radius', 'Radio de rueda cargada (mm)'], ['rake', 'Ángulo de dirección desde la vertical (°)'], ['offset', 'Offset de dirección (mm)']] as const).map(([key, label]) => <label key={key} style={{ display: 'block', marginBottom: 12 }}>{label} <input type="number" step="any" value={dimensions[key]} onChange={e => { setSaved(''); markDirty(true,'legacy-geometry'); setDimensions({ ...dimensions, [key]: e.target.value }); }} /></label>)}
      <button className="btn" disabled={!session || trail === null || saving} onClick={() => void saveGeometry()}>{saving ? 'Guardando…' : 'Guardar dimensiones en la sesión'}</button>
      {saved && <p role="status">{saved}</p>}
      <p>Avance geométrico: {trail === null ? 'pendiente de dimensiones válidas' : `${trail.toFixed(2)} mm`}. Cálculo estático; no incluye deformación del neumático ni dinámica de suspensión.</p>
    </details>
  </div></div>;
}
export default function ProtectedChassisPage(){ return <TelemetryGate><ChassisPage/></TelemetryGate>; }

