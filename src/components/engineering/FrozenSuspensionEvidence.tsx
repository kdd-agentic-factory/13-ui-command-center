import {useEffect, useRef, useState} from 'react';
import type {SuspensionEvidence} from '../../domain/chassisReport';
import {getAnalysis} from '../../services/suspensionLab';
import {identitySnapshot} from '../../services/telemetryIdentity';
import {EngineeringIdentifier, engineeringLabel} from './engineeringPresentation';

const metrics: Record<string, string> = {
  lab_suspension_displacement: 'Desplazamiento de suspensión',
  lab_suspension_velocity: 'Velocidad de suspensión',
  bench_force_n: 'Fuerza de banco',
  cycle_work_j: 'Trabajo por ciclo',
  dominant_frequency_hz: 'Frecuencia dominante',
};
const eligibility = {eligible_for_review: 'Disponible para revisión', exploratory: 'Exploratoria', blocked: 'Bloqueada'};
const measurementLabel = {min: 'mín.', max: 'máx.', value: 'valor'};

export function FrozenSuspensionEvidence({row}: {row: SuspensionEvidence}) {
  return <>
    <strong>{Object.prototype.hasOwnProperty.call(metrics, row.metric) ? metrics[row.metric] : row.metric}</strong>
    {' · '}{row.eligibility ? eligibility[row.eligibility] : 'Elegibilidad sin registrar'}
    {' · '}Análisis r{row.revision}{row.method && ` · ${engineeringLabel(row.method)}`}
    <br />{row.interval ? `Intervalo ${row.interval[0]}–${row.interval[1]} s` : 'Intervalo sin registrar'}
    {' · '}{row.sensor ? <>Canal seleccionado <code>{row.sensor}</code></> : 'Canal seleccionado sin registrar'}
    {row.unit && row.measures.length > 0 && <p>{row.measures.map(m => `${measurementLabel[m.name]} ${m.value} ${row.unit}`).join(' · ')}</p>}
    <p>{row.samples === null ? 'Recuento de muestras sin registrar' : `${row.samples} muestras registradas en el análisis`}</p>
    {row.qualifications.length > 0 && <p>Límites del análisis · {row.qualifications.map(engineeringLabel).join(' · ')}</p>}
    <EngineeringIdentifier value={row.id} label="Referencia de evidencia" />
    {row.source && <EngineeringIdentifier value={row.source} label="Fuente" />}
    {row.analysis && <EngineeringIdentifier value={row.analysis} label="Análisis" />}
    {row.digest && <EngineeringIdentifier value={row.digest} label="SHA-256 del análisis" />}
    {row.analysis && row.digest && <SavedAnalysisDownload id={row.analysis} revision={row.revision} digest={row.digest} />}
  </>;
}

function SavedAnalysisDownload({id, revision, digest}: {id: string; revision: number; digest: string}) {
  const active = useRef<AbortController | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => () => active.current?.abort(), []);

  async function download() {
    if (active.current) return;
    const identity = identitySnapshot();
    const controller = new AbortController();
    active.current = controller;
    setBusy(true);
    setError('');
    const timeout = setTimeout(() => {
      setError('La recuperación del análisis agotó el tiempo de respuesta.');
      setBusy(false);
      controller.abort();
    }, 30000);
    try {
      const analysis = await getAnalysis(id, controller.signal);
      const current = identitySnapshot();
      if (controller.signal.aborted || current.mode !== identity.mode || current.generation !== identity.generation ||
          current.user !== identity.user || current.team !== identity.team) return;
      if (analysis.id !== id || analysis.revision !== revision || analysis.digest !== digest) {
        setError('La revisión o la huella del análisis difiere de la cita.');
        return;
      }
      const url = URL.createObjectURL(new Blob([JSON.stringify(analysis, null, 2)], {type: 'application/json'}));
      try {
        const link = document.createElement('a');
        link.href = url;
        link.download = `suspension-${id}-r${revision}.json`;
        link.click();
      } finally {
        URL.revokeObjectURL(url);
      }
    } catch {
      if (!controller.signal.aborted) setError('No se pudo recuperar el análisis citado.');
    } finally {
      clearTimeout(timeout);
      active.current = null;
      if (!controller.signal.aborted) setBusy(false);
    }
  }

  return <>
    <button type="button" className="btn" onClick={() => void download()} disabled={busy}>
      {busy ? 'Recuperando análisis…' : 'Descargar análisis guardado'}
    </button>
    {error && <p role="alert">{error}</p>}
  </>;
}
