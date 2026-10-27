import { canWriteTelemetry,identitySnapshot } from '../../services/telemetryIdentity';
import { useEffect, useRef, useState } from 'react';
import { setupFields, type Calibration, type ComparisonRun, type SetupRevision, type SetupInput } from '../../domain/chassisComparison';
import type { RecordedChannel, RecordedSession } from '../../domain/recordedSession';
import { bindSetup, compareSetups, createSetup, getChassisState } from '../../services/chassisTelemetry';
import { SetupEditor, type Draft } from './SetupEditor';
import { GeometryComparison } from './GeometryComparison';
import { EvidencePanel } from './EvidencePanel';
import { useWorkspaceDraft } from '../../context/WorkspaceDraftContext';
import { useChassisWorkspace } from '../../hooks/useChassisWorkspace';
import { draftInput, draftFromRevision } from '../../domain/chassisWorkshop';
import { ChassisWorkshop } from './workshop/ChassisWorkshop';
import type {WorkView,ComparisonPresentation} from '../../domain/chassisWorkViews';

const empty = (): Draft => ({ values: {}, assumed: {} });
function draftFrom(setup?: SetupRevision): Draft {
  return draftFromRevision(setup);
}
function invalidUnits(setup?: SetupRevision) { return setupFields.filter(f => setup?.values[f.key]?.value != null && setup.values[f.key].unit !== f.unit).map(f => f.label); }

export function ChassisComparison({ sessionId, channels, geometry, onPersistedChange,engineeringSessionId,workView='engineer',contextKey=sessionId,onPresentation }: { sessionId: string; channels: RecordedChannel[]; geometry?: RecordedSession['geometry']; onPersistedChange?:()=>void;engineeringSessionId?:string;workView?:WorkView;contextKey?:string;onPresentation?:(state:ComparisonPresentation)=>void }) {
  const { markDirty } = useWorkspaceDraft();
  const [bike, setBike] = useState(''), [confirmed, setConfirmed] = useState(false);
  const workspace = useChassisWorkspace({bike,recordingId:sessionId});
  const {a,b,setA,setB} = workspace;
  const [side, setSide] = useState<'A' | 'B'>('A');
  const [run, setRun] = useState<ComparisonRun | null>(null), [busy, setBusy] = useState(false), [loading, setLoading] = useState(true), [error, setError] = useState('');
  const [dirty, setDirty] = useState(false), [savedA, setSavedA] = useState<SetupRevision>(), [savedB, setSavedB] = useState<SetupRevision>();
  const editing=workView==='engineer'||workView==='analyst';
  const missingPresentation=JSON.stringify(run?.missing??[]);
  useEffect(()=>{onPresentation?.({contextKey,comparisonId:run?.id??null,saved:!!run,dirty,error:error||null,missing:JSON.parse(missingPresentation)});},[contextKey,run?.id,dirty,error,missingPresentation,onPresentation]);
  useEffect(()=>{markDirty(dirty,'comparison');},[dirty,markDirty]);
  useEffect(()=>()=>markDirty(false,'comparison'),[markDirty]);
  const [revisions, setRevisions] = useState<SetupRevision[]>([]), [unitWarnings, setUnitWarnings] = useState<string[]>([]);
  const [channel, setChannel] = useState(''), [quantity, setQuantity] = useState<Calibration['quantity']>('suspension_displacement');
  const [zero, setZero] = useState(''), [scale, setScale] = useState(''), [sign, setSign] = useState<1 | -1>(1), [calibrationNote, setCalibrationNote] = useState('');
  const [start, setStart] = useState(''), [end, setEnd] = useState('');
  const [location, setLocation] = useState<NonNullable<Calibration['measurement_location']>>('unknown'), [windowSamples, setWindowSamples] = useState(''), [maxGap, setMaxGap] = useState('');
  const [fullExtension,setFullExtension]=useState(false);
  const generation = useRef(0), operationIds = useRef(new Map<string, string>());
  useEffect(() => {
    const token = ++generation.current;
    setLoading(true); setBusy(false); setError(''); setBike(''); setConfirmed(false); setA(empty()); setB(empty()); setRun(null); setDirty(false); setSavedA(undefined); setSavedB(undefined); setChannel(''); setZero(''); setScale(''); setCalibrationNote(''); setStart(''); setEnd(''); operationIds.current.clear();
    setQuantity('suspension_displacement'); setSign(1); setLocation('unknown'); setWindowSamples(''); setMaxGap('');
    setRevisions([]); setUnitWarnings([]);
    setFullExtension(false);
    getChassisState(sessionId).then(state => {
      if (generation.current !== token) return;
      setBike(state.bike_id ?? '');
      setRevisions(state.setups);
      if (state.comparison) {
        setRun(state.comparison); setA(draftFrom(state.comparison.setup_a)); setB(draftFrom(state.comparison.setup_b)); setSavedA(state.comparison.setup_a); setSavedB(state.comparison.setup_b);
        setUnitWarnings([...invalidUnits(state.comparison.setup_a), ...invalidUnits(state.comparison.setup_b)]);
        const calibration = state.comparison.calibration;
        if (calibration) {
          setFullExtension(calibration.displacement_reference==='full_extension');
          setChannel(String(calibration.channel_index)); setQuantity(calibration.quantity); setZero(String(calibration.zero)); setScale(String(calibration.scale)); setSign(calibration.sign); setCalibrationNote(calibration.provenance); setLocation(calibration.measurement_location ?? 'unknown'); setWindowSamples(calibration.derivative_window == null ? '' : String(calibration.derivative_window)); setMaxGap(calibration.max_gap_s == null ? '' : String(calibration.max_gap_s));
        }
        if (state.comparison.interval_s) { setStart(String(state.comparison.interval_s[0])); setEnd(String(state.comparison.interval_s[1])); }
        // Every new comparison still asks the operator to confirm session identity.
      } else if (state.bindings.length && state.setups.length) {
        const bound = state.setups.find(s => s.id === state.bindings[state.bindings.length - 1].setup_id);
        if (bound) { setA(draftFrom(bound)); setSavedA(bound); setUnitWarnings(invalidUnits(bound)); }
      } else if (geometry) {
        const legacy = { values: { front_radius_m: String(geometry.radius), rake_rad: String(geometry.rake), offset_m: String(geometry.offset) }, assumed: {} };
        setA(legacy); setB({ values: { ...legacy.values }, assumed: {} });
      }
    }).catch(e => { if (generation.current === token) setError(e.message); }).finally(() => { if (generation.current === token) setLoading(false); });
    return () => { generation.current++; };
  }, [sessionId]);
  function edit(draft: Draft) { (side === 'A' ? setA : setB)(draft); setDirty(true); }
  function makeInput(draft: Draft, label: string, previous?: SetupRevision): SetupInput {
    const payload = draftInput(draft,bike,label,previous?.bike_id===bike.trim()?previous.id:undefined);
    const key = JSON.stringify(payload);
    if (!operationIds.current.has(key)) operationIds.current.set(key, crypto.randomUUID());
    return { ...payload, operation_id: operationIds.current.get(key)! };
  }
  async function compare() {
    if (busy) return;
    const token = generation.current;
    setBusy(true); setError('');
    try {
      if(a.curveError||b.curveError)throw new Error(`Corrige la curva ${a.curveError?'A':'B'} antes de comparar: ${a.curveError||b.curveError}`);
      if (!!start.trim() !== !!end.trim() || (start.trim() && (!Number.isFinite(Number(start)) || !Number.isFinite(Number(end)) || Number(start) >= Number(end)))) throw new Error('Selecciona inicio y fin válidos, en segundos.');
      let calibration: Calibration | undefined;
      if (channel !== '') {
        if (!zero.trim() || !scale.trim() || !Number.isFinite(Number(zero)) || !Number.isFinite(Number(scale)) || Number(scale) <= 0 || calibrationNote.trim().length < 3) throw new Error('Completa cero, escala positiva y referencia de calibración.');
        calibration = { channel_index: Number(channel), quantity, zero: Number(zero), scale: Number(scale), sign, provenance: calibrationNote.trim() };
        if (quantity === 'suspension_displacement') {
          calibration.measurement_location = location;
          calibration.displacement_reference=fullExtension?'full_extension':'unknown';
          if (windowSamples.trim()) {
            const window = Number(windowSamples), gap = Number(maxGap);
            if (!Number.isInteger(window) || window < 3 || window > 101 || window % 2 === 0 || !maxGap.trim() || !Number.isFinite(gap) || gap <= 0) throw new Error('La velocidad requiere ventana impar de 3 a 101 y hueco máximo positivo.');
            calibration.derivative_window = window; calibration.max_gap_s = gap;
          }
        }
      }
      const inputA = makeInput(a, 'A', savedA), inputB = makeInput(b, 'B', savedB);
      if (Object.values(inputA.values).concat(Object.values(inputB.values)).some(v => v.value !== null && !Number.isFinite(v.value))) throw new Error('Hay una medida no finita.');
      const first = await createSetup(inputA);
      if (generation.current !== token) return;
      setRevisions(old => [...old.filter(s => s.id !== first.id), first]);
      const second = await createSetup(inputB);
      if (generation.current !== token) return;
      setRevisions(old => [...old.filter(s => s.id !== second.id), second]);
      await bindSetup({ session_id: sessionId, setup_id: first.id, bike_id: bike.trim() });
      if (generation.current !== token) return;
      const result = await compareSetups({ session_id: sessionId, setup_a_id: first.id, setup_b_id: second.id, ...(calibration ? { calibration } : {}), ...(start.trim() && end.trim() ? { interval_s: [Number(start), Number(end)] as [number, number] } : {}) });
      if (generation.current === token) { setRun(result); setSavedA(first); setSavedB(second); setDirty(false); setUnitWarnings([]); onPersistedChange?.(); }
    } catch (e) { if (generation.current === token) setError(e instanceof Error ? e.message : 'No se pudo comparar'); }
    finally { if (generation.current === token) setBusy(false); }
  }
  return <section className="chassis-comparison"><header className="chassis-section-heading"><h2>Comparar setups medidos</h2><span className="chassis-status">{loading ? 'Cargando' : busy ? 'Calculando' : run ? 'Comparación guardada' : 'Pendiente de medidas'}</span></header>
    {error && <p role="alert">{error}</p>}
    {unitWarnings.length > 0 && <p role="alert">Unidad incompatible en {Array.from(new Set(unitWarnings)).join(', ')}. Esos valores no se convierten ni se reutilizan: introduce una medida con la unidad indicada.</p>}
    <div hidden={!editing} className="chassis-identity"><label>Identificador de moto <input aria-label="Identificador de moto" value={bike} onChange={e => { setBike(e.target.value); setConfirmed(false); setDirty(true); }} disabled={busy || loading} /></label><label><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} disabled={busy || loading} /> Confirmo la moto de esta sesión</label></div>
    <div hidden={workView!=='engineer'&&workView!=='mechanic'}><ChassisWorkshop workView={workView} engineeringSessionId={engineeringSessionId} comparisonCurrent={!dirty} onSpecificationSaved={workspace.updateSpecification} canVerifySpecifications={identitySnapshot().mode==='authenticated'&&canWriteTelemetry()} specifications={workspace.specifications} specError={workspace.specError} draft={b} onChange={d=>{if(!busy&&!loading&&canWriteTelemetry()){setB(d);setDirty(true);}}} bike={bike} recordingId={sessionId} referenceId={savedA?.id} comparisonId={run?.id} preview={workspace.preview} busy={workspace.busy||busy||loading} error={workspace.error} onCalculate={options=>{if(canWriteTelemetry())void workspace.calculate(options,savedA?.id);}} calibrations={channel!==''&&zero.trim()&&scale.trim()&&Number(scale)>0&&calibrationNote.trim().length>=3?[{channel_index:Number(channel),quantity,zero:Number(zero),scale:Number(scale),sign,provenance:calibrationNote,measurement_location:location,displacement_reference:fullExtension?'full_extension':'unknown'}]:[]}/></div>
    {dirty && run && <p role="status">Cambios sin calcular. Los resultados visibles corresponden a las revisiones guardadas anteriores.</p>}
    <div className="chassis-columns" data-editing={editing}><div hidden={!editing} className="chassis-inputs"><div className="chassis-side-switch" aria-label="Setup en edición"><button type="button" aria-pressed={side === 'A'} onClick={() => setSide('A')}>A · Base registrada</button><button type="button" aria-pressed={side === 'B'} onClick={() => setSide('B')}>B · Alternativa</button></div>
      {revisions.some(s => s.bike_id === bike.trim()) && <label className="chassis-recovery">Recuperar revisión guardada <select aria-label="Recuperar revisión guardada" disabled={busy || loading} value={(side === 'A' ? savedA : savedB)?.id ?? ''} onChange={e => {
        const revision = revisions.find(s => s.id === e.target.value); if (!revision) return;
        if (side === 'A') { setA(draftFrom(revision)); setSavedA(revision); } else { setB(draftFrom(revision)); setSavedB(revision); }
        setUnitWarnings(invalidUnits(revision)); setDirty(true);
      }}><option value="">Elegir revisión para {side}</option>{revisions.filter(s => s.bike_id === bike.trim()).map(s => <option key={s.id} value={s.id}>{s.label} · v{s.version} · {s.id.slice(-8)}</option>)}</select></label>}
      <fieldset disabled={busy || loading} className="chassis-edit-lock"><SetupEditor side={side} draft={side === 'A' ? a : b} onChange={edit} /></fieldset>
      <fieldset disabled={busy || loading} className="chassis-edit-lock"><details className="chassis-calibration"><summary>Vincular una señal calibrada</summary><p>Sin calibración se compara geometría. Para calcular cargas necesitas aceleración longitudinal identificada y las medidas de masa, reparto, centro de gravedad y batalla.</p>
        <label>Canal para el modelo <select aria-label="Canal para el modelo" value={channel} onChange={e => { setChannel(e.target.value); setDirty(true); }}>{<option value="">Solo geometría</option>}{channels.map(c => <option key={c.index} value={c.index}>{c.name} · {c.unit || 'sin unidad'}</option>)}</select></label>
        {channel !== '' && <><label>Magnitud <select value={quantity} onChange={e => { setQuantity(e.target.value as Calibration['quantity']); setDirty(true); }}><option value="suspension_displacement">Desplazamiento de suspensión</option><option value="longitudinal_acceleration">Aceleración longitudinal</option></select></label>
          <label>Cero en unidades originales <input type="number" step="any" value={zero} onChange={e => { setZero(e.target.value); setDirty(true); }} /></label><label>Escala de calibración <input type="number" step="any" value={scale} onChange={e => { setScale(e.target.value); setDirty(true); }} /></label>
          <label>Convención de signo <select value={sign} onChange={e => { setSign(Number(e.target.value) as 1 | -1); setDirty(true); }}><option value="1">+1 · compresión / avance positivos</option><option value="-1">−1 · invertir sensor</option></select></label>
          <label>Referencia de calibración <input value={calibrationNote} onChange={e => { setCalibrationNote(e.target.value); setDirty(true); }} /></label>
          {quantity==='suspension_displacement'&&<label><input type="checkbox" checked={fullExtension} onChange={e=>{setFullExtension(e.target.checked);setDirty(true);}}/> Cero del sensor referido a extensión completa</label>}
          {quantity === 'suspension_displacement' && <><label>Punto de medida <select value={location} onChange={e => { setLocation(e.target.value as typeof location); setDirty(true); }}><option value="unknown">Sin identificar · solo desplazamiento</option><option value="shock">Amortiguador · habilita modelo del muelle</option><option value="fork">Horquilla</option><option value="wheel">Rueda</option></select></label><label>Ventana para velocidad (muestras, opcional) <input type="number" value={windowSamples} onChange={e => { setWindowSamples(e.target.value); setDirty(true); }} /></label><label>Hueco máximo del filtro (s) <input type="number" step="any" value={maxGap} onChange={e => { setMaxGap(e.target.value); setDirty(true); }} /></label></>}
          <label>Inicio del intervalo (s) <input type="number" step="any" value={start} onChange={e => { setStart(e.target.value); setDirty(true); }} /></label><label>Fin del intervalo (s) <input type="number" step="any" value={end} onChange={e => { setEnd(e.target.value); setDirty(true); }} /></label></>}
      </details></fieldset>
      <button className="btn chassis-compare-action" disabled={!canWriteTelemetry() || !bike.trim() || !confirmed || busy || loading} onClick={() => void compare()}>{busy ? 'Guardando y calculando…' : 'Guardar y comparar A/B'}</button>
      <p>Se guarda A como setup asociado a esta sesión; B es una alternativa calculada bajo las mismas condiciones. No representa otra sesión medida.</p>
    </div><GeometryComparison run={run} /><EvidencePanel run={run} /></div>
  </section>;
}


