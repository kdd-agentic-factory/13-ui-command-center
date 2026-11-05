import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { EngineeringSession, SnapshotSelection } from '../../../domain/engineeringSession';
import { executeGuideTurn, getGuide, sendGuideTurn, type GuideItem } from '../../../services/sessionGuide';
import { createAnalysisSnapshot } from '../../../services/engineeringSession';
import { identitySnapshot } from '../../../services/telemetryIdentity';
import '../../../styles/session-guide.css';

const labels = {
  pending: 'Pendiente de ejecución', running: 'En ejecución', completed: 'Respuesta guardada',
  failed: 'Ejecución fallida', interrupted: 'Ejecución interrumpida',
};
const failures: Record<string, string> = {
  model_unavailable: 'Modelo no disponible.',
  timeout: 'El modelo agotó el tiempo de respuesta.',
  invalid_model_output: 'La respuesta del modelo no pasó la validación.',
  context_changed: 'El contexto cambió durante la ejecución.',
};

export function SessionGuide({ session, scope, selection, blockedReason }: { session: EngineeringSession | null; scope: string; selection?: SnapshotSelection; blockedReason?: string }) {
  const [identity, setIdentity] = useState(identitySnapshot);
  useEffect(() => {
    const update = () => setIdentity(identitySnapshot());
    window.addEventListener('telemetry-scope-changed', update);
    return () => window.removeEventListener('telemetry-scope-changed', update);
  }, []);
  const ready = session && identity.mode === 'authenticated' && identity.user && identity.team === session.team_id;
  return <aside className="session-guide" aria-label="Cicerone">
    <h2>Cicerone</h2>
    {ready
      ? <Conversation key={JSON.stringify([scope, identity.generation, session.id, session.revision])}
          session={session} selection={selection} blockedReason={blockedReason} writable={identity.role === 'engineer' || identity.role === 'admin'} />
      : <p>{session ? 'Selecciona el equipo de la sesión con una identidad verificada.' : 'Abre o prepara una sesión para consultar su conversación.'}</p>}
  </aside>;
}

function Conversation({ session, writable, selection, blockedReason }: { session: EngineeringSession; writable: boolean; selection?: SnapshotSelection; blockedReason?: string }) {
  const [items, setItems] = useState<GuideItem[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState<'loading' | 'sending' | 'executing' | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const active = useRef<AbortController | null>(null);
  const retry = useRef<{ message: string; operation: string } | null>(null);
  const executions = useRef(new Map<string, { operation: string; snapshot: string | null; selection: SnapshotSelection }>());

  const refresh = useCallback(async () => {
    if (active.current) return;
    const controller = new AbortController();
    active.current = controller;
    setBusy('loading');
    setError('');
    try {
      const history = await getGuide(session.id, controller.signal);
      if (!controller.signal.aborted) setItems(history);
    } catch (cause) {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'No se pudo cargar el historial.');
    } finally {
      if (active.current === controller) {
        active.current = null;
        setBusy(null);
      }
    }
  }, [session.id]);

  useEffect(() => {
    void refresh();
    return () => {
      active.current?.abort();
      active.current = null;
    };
  }, [refresh]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = draft.trim();
    if (!writable || !message || active.current) return;
    const attempt = retry.current?.message === message ? retry.current : { message, operation: crypto.randomUUID() };
    retry.current = attempt;
    const controller = new AbortController();
    active.current = controller;
    setBusy('sending');
    setError('');
    setNotice('');
    try {
      const item = await sendGuideTurn(session.id, session.revision, message, attempt.operation, controller.signal);
      if (controller.signal.aborted) return;
      setItems(previous => {
        const existing = previous.find(entry => entry.turn.id === item.turn.id);
        if (!existing) return [...previous, item];
        return previous.map(entry => entry.turn.id === item.turn.id && entry.revision < item.revision ? item : entry);
      });
      retry.current = null;
      setDraft('');
      setNotice('Pregunta guardada.');
    } catch (cause) {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'No se pudo guardar la pregunta.');
    } finally {
      if (active.current === controller) {
        active.current = null;
        setBusy(null);
      }
    }
  }

  async function execute(item: GuideItem) {
    if (!writable || blockedReason || active.current || item.turn.session_revision !== session.revision || item.turn.status !== 'pending') return;
    let attempt = executions.current.get(item.turn.id);
    if (!attempt) {
      attempt = {
        operation: crypto.randomUUID(), snapshot: item.turn.snapshot_id,
        selection: structuredClone(selection ?? {
          recordings: [], comparison: null, setup_a: null, setup_b: null,
          binding: null, calibration: null, validation: null, environment: null,
        }),
      };
      executions.current.set(item.turn.id, attempt);
    }
    const controller = new AbortController();
    active.current = controller;
    setBusy('executing');
    setError('');
    setNotice('');
    try {
      if (!attempt.snapshot) {
        const snapshot = await createAnalysisSnapshot(session.id, session.revision, attempt.selection, attempt.operation, controller.signal);
        if (controller.signal.aborted) return;
        attempt.snapshot = snapshot.id;
      }
      const result = await executeGuideTurn(item, attempt.snapshot, controller.signal);
      if (controller.signal.aborted) return;
      setItems(previous => previous.map(entry => entry.turn.id === result.turn.id ? result : entry));
      setNotice(result.turn.status === 'completed' ? 'Respuesta guardada.' : 'Estado de ejecución actualizado.');
    } catch (cause) {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'No se pudo completar la consulta. Actualiza la conversación.');
    } finally {
      if (active.current === controller) {
        active.current = null;
        setBusy(null);
      }
    }
  }

  return <>
    <p className="session-guide-context">{session.name} · Revisión {session.revision}</p>
    {blockedReason && <p>{blockedReason}</p>}
    <button type="button" className="btn" onClick={() => void refresh()} disabled={!!busy}>Actualizar conversación</button>
    {error && <p role="alert">{error}</p>}
    <p role="status">{busy === 'loading' ? 'Cargando conversación…' : busy === 'sending' ? 'Guardando pregunta…' : busy === 'executing' ? 'Consultando Cicerone con los datos de la sesión…' : notice}</p>
    <ol className="session-guide-history" aria-label="Historial de la conversación" tabIndex={items.length ? 0 : undefined}>
      {items.map(item => <li key={item.turn.id}><GuideExchange item={item} revision={session.revision} />
        {writable && item.turn.status === 'pending' && item.turn.session_revision === session.revision &&
          <button type="button" className="btn" disabled={!!busy || !!blockedReason} onClick={() => void execute(item)}>Consultar con datos actuales</button>}
      </li>)}
    </ol>
    {!items.length && !busy && !error && <p>Todavía no hay preguntas en esta sesión.</p>}
    {writable ? <form onSubmit={event => void submit(event)}>
      <label>Pregunta para Cicerone
        <textarea value={draft} onChange={event => setDraft(event.target.value)} maxLength={8000}
          rows={3} disabled={busy === 'sending'} />
      </label>
      <button type="submit" className="btn" disabled={!!busy || !draft.trim()}>Guardar pregunta</button>
      <small>El historial muestra el estado de cada pregunta.</small>
    </form> : <p>Acceso de lectura a la conversación.</p>}
  </>;
}

function GuideExchange({ item, revision }: { item: GuideItem; revision: number }) {
  const { turn, reply } = item;
  return <>
    <p className="session-guide-question">{turn.message}</p>
    <p className="session-guide-context">{labels[turn.status]}{turn.session_revision !== revision && ` · Revisión anterior (${turn.session_revision})`}</p>
    {turn.error && <p>{Object.prototype.hasOwnProperty.call(failures, turn.error)
      ? failures[turn.error] : 'No se pudo completar la ejecución.'}</p>}
    {reply && <>
      <p><strong>Siguiente paso</strong> {reply.next_step}</p>
      {([['Hechos', reply.facts], ['Cálculos', reply.calculations], ['Hipótesis', reply.hypotheses]] as const).map(([label, entries]) =>
        entries.length > 0 && <details key={label}><summary>{label} ({entries.length})</summary>
          <ul>{entries.map((entry, index) => <li key={index}>{entry.text}
            <small>{entry.evidence.join(' · ')}</small></li>)}</ul>
        </details>)}
      {reply.limitations.length > 0 && <details><summary>Limitaciones</summary>
        <ul>{reply.limitations.map((value, index) => <li key={index}>{value}</li>)}</ul>
      </details>}
      {turn.model && <small>{turn.model}{turn.snapshot_id && ` · Snapshot ${turn.snapshot_id}`}</small>}
    </>}
  </>;
}
