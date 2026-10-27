import { fieldLabel, metricLabels, type ComparisonRun } from '../../domain/chassisComparison';
export function EvidencePanel({ run }: { run: ComparisonRun | null }) {
  return <section className="chassis-evidence" aria-label="Evidencia del cálculo"><h2>Evidencia y siguientes pruebas</h2>
    {!run ? <p>Guarda una comparación para consultar resultados reproducibles y sus límites.</p> : <>
      <p>Modelo: {run.model_version}</p>
      {run.signal_error && <p role="status">Cálculo de señal bloqueado: {run.signal_error}. La geometría válida se conserva.</p>}
      {run.missing.length > 0 && <p role="status">Faltan medidas: {run.missing.map(fieldLabel).join(', ')}.</p>}
      <p>{run.recommendation.provider==='local-llm-ranking'?`Modelo local: ${run.recommendation.inference?.model??'configurado'} · priorización contrastada`:`Hallazgos deterministas · modelo de lenguaje ${run.recommendation.inference?.status==='not_configured'?'sin configurar':'no utilizado'}`}. Las observaciones de una sesión no prueban que un setup sea más rápido.</p>
      {run.recommendation.inference&&run.recommendation.inference.status!=='accepted'&&run.recommendation.inference.status!=='not_configured'&&<p>Estado de inferencia: {run.recommendation.inference.status}. La evidencia y las reglas siguen disponibles.</p>}
      {run.evidence.map(e => <details key={e.id}><summary>{e.kind === 'observed' ? 'Observado' : e.kind === 'derived' ? 'Derivado del SDK' : 'Calculado'} · {metricLabels[e.metric] ?? e.metric}{e.setup_id ? ` · ${e.setup_id === run.setup_a_id ? 'A' : 'B'}` : ''}</summary>
        <p>{e.formula}</p>
        {typeof e.min === 'number' && <p>{e.min.toFixed(4)}–{e.max?.toFixed(4)} {e.unit} · {e.sample_count} muestras.</p>}
        {e.sample_count === 0 && <p>Sin muestras válidas para este filtro e intervalo.</p>}
        {e.interval_s && <p>Intervalo: {e.interval_s[0].toFixed(3)}–{e.interval_s[1].toFixed(3)} s.</p>}
        {e.channels.map((c, i) => <p key={i}>Canal: {c.name} · unidad original: {c.original_unit}</p>)}
        {e.setup_id && <p>Setup: {e.setup_id === run.setup_a_id ? 'A' : 'B'}</p>}
        {e.coverage_fraction!==undefined&&<p>Cobertura física: {(e.coverage_fraction*100).toFixed(1)}% · {e.valid_sample_count} muestras válidas · {e.excluded_sample_count} excluidas. {e.curve_provenance==='assumed'?'Curva estimada: pendiente de medir.':''}</p>}
        {e.loads && Object.entries(e.loads).map(([name, range]) => {
          const label = ({ front_load_n: 'Carga delantera', rear_load_n: 'Carga trasera', spring_force_n: 'Fuerza del muelle', wheel_force_n: 'Fuerza en la rueda', wheel_rate_n_m: 'Rigidez tangente en rueda',wheel_displacement_m:'Recorrido de rueda',motion_ratio:'Relación ds/dz' } as Record<string, string>)[name] ?? name;
          const factor = name === 'wheel_rate_n_m' ? .001 : name==='wheel_displacement_m'?1000:1;
          const unit=name==='wheel_rate_n_m'?'N/mm':name==='wheel_displacement_m'?'mm':name==='motion_ratio'?'':'N';
          return <p key={name}>{label}: {(range.min * factor).toFixed(name==='motion_ratio'?3:1)}–{(range.max * factor).toFixed(name==='motion_ratio'?3:1)} {unit}</p>;
        })}
        {e.missing && e.missing.length > 0 && <p>Faltan: {e.missing.map(fieldLabel).join(', ')}</p>}
        {e.warnings?.length ? <p>Limitaciones: {e.warnings.join(', ')}</p> : null}
        {e.transform && <pre>{JSON.stringify(e.transform, null, 2)}</pre>}
        <p>{e.quality}</p><p>Referencia: {e.id}</p>
      </details>)}
      {run.recommendation.findings?.length ? <section className="chassis-findings"><h3>Recomendaciones trazables</h3>{run.recommendation.findings.map(f=><article key={f.id}><h4>{f.title}</h4><p>{f.observation}</p><p>{f.next_test}</p><details><summary>Evidencias que lo sustentan</summary>{f.evidence_ids.map(id=><p key={id}>{id}</p>)}</details></article>)}</section>:null}
      <p>{run.recommendation.next_test}</p>
      <p>No hay un modelo validado de clics de hidráulicos ni de ganancia de tiempo. No se generan prescripciones de ese tipo.</p>
      <details><summary>Trazabilidad de la comparación</summary><p>Sesión: {run.session_id}</p><p>A: {run.setup_a_id}<br />B: {run.setup_b_id}</p><p>Comparación: {run.id}</p><p>{run.warnings.join(' · ')}</p></details>
    </>}
  </section>;
}
