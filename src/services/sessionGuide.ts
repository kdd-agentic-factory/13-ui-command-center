import { identitySnapshot, telemetryFetch } from './telemetryIdentity';
import { canonicalWorkId } from './sessionWorkboard';

const base = (import.meta.env.VITE_TELEMETRY_URL ?? '/api/telemetry') + '/api/v1/engineering';
const states = ['pending', 'running', 'completed', 'failed', 'interrupted'] as const;
type Statement = { text: string; evidence: string[] };
export type GuideItem = {
  revision: number;
  turn: {
    id: string; session_id: string; team_id: string; session_revision: number;
    message: string; status: typeof states[number]; model: string | null;
    snapshot_id: string | null; error: string | null;
  };
  reply: {
    facts: Statement[]; calculations: Statement[]; hypotheses: Statement[];
    limitations: string[]; next_step: string;
  } | null;
};

async function request(path: string, signal: AbortSignal, body?: object) {
  const before = identitySnapshot();
  if (before.mode !== 'authenticated' || !before.user || !before.team) {
    throw new Error('Selecciona un equipo con identidad verificada.');
  }
  signal.throwIfAborted();
  const controller = new AbortController();
  const cancel = () => controller.abort(signal.reason);
  signal.addEventListener('abort', cancel, { once: true });
  const timer = setTimeout(() => controller.abort(new Error('Cicerone tardó demasiado en responder.')), 30000);
  let response: Response;
  let result: unknown;
  try {
    response = await telemetryFetch(base + path, {
      cache: 'no-store', signal: controller.signal,
      ...(body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}),
    });
    result = response.ok ? await response.json() : null;
  } finally {
    clearTimeout(timer);
    signal.removeEventListener('abort', cancel);
  }
  const after = identitySnapshot();
  if (before.generation !== after.generation || before.team !== after.team || before.user !== after.user) {
    throw new Error('La identidad cambió durante la consulta.');
  }
  if (!response.ok) {
    if (response.status === 409) throw new Error('La sesión o la operación cambió. Recarga el contexto de la sesión.');
    if (response.status === 403) throw new Error('Tu perfil no tiene permiso para esta operación.');
    throw new Error('No se pudo completar la operación. Puedes volver a intentarlo.');
  }
  return { result, team: before.team };
}

const strings = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(item => typeof item === 'string');
const statements = (value: unknown): value is Statement[] =>
  Array.isArray(value) && value.every(item => item && typeof item.text === 'string' && strings(item.evidence));

function parse(value: unknown, team: string, session: string): GuideItem {
  const item = value as GuideItem & { schema_version: string };
  const turn = item?.turn;
  const reply = item?.reply;
  if (item?.schema_version !== '1.0.0' || !Number.isSafeInteger(item.revision) || item.revision < 1 ||
      !turn || !canonicalWorkId(turn.id) || turn.team_id !== team || turn.session_id !== session ||
      !Number.isSafeInteger(turn.session_revision) || turn.session_revision < 1 ||
      typeof turn.message !== 'string' || !states.includes(turn.status) ||
      (turn.model !== null && typeof turn.model !== 'string') ||
      (turn.snapshot_id !== null && !canonicalWorkId(turn.snapshot_id)) ||
      (turn.error !== null && typeof turn.error !== 'string') ||
      (turn.status === 'completed'
        ? !reply || !statements(reply.facts) || !statements(reply.calculations) ||
          !statements(reply.hypotheses) || !strings(reply.limitations) || typeof reply.next_step !== 'string'
        : reply !== null)) {
    throw new Error('La respuesta de Cicerone no coincide con esta sesión o su contrato.');
  }
  return item;
}

export async function getGuide(session: string, signal: AbortSignal) {
  if (!canonicalWorkId(session)) throw new Error('Sesión incompatible.');
  const { result, team } = await request(`/sessions/${session}/guide`, signal);
  const data = result as { schema_version: string; items: unknown[] };
  if (data?.schema_version !== '1.0.0' || !Array.isArray(data.items) || data.items.length > 1000) {
    throw new Error('Historial incompatible.');
  }
  const items = data.items.map(item => parse(item, team, session));
  if (new Set(items.map(item => item.turn.id)).size !== items.length) throw new Error('Historial duplicado.');
  return items;
}

export async function sendGuideTurn(session: string, revision: number, message: string, operation: string, signal: AbortSignal) {
  if (!canonicalWorkId(session) || !canonicalWorkId(operation)) throw new Error('Identificador incompatible.');
  const { result, team } = await request('/guide/turns', signal, {
    session_id: session, expected_session_revision: revision, message, operation_id: operation,
  });
  const item = parse(result, team, session);
  if (item.turn.session_revision !== revision || item.turn.message !== message) {
    throw new Error('El turno guardado no coincide con el envío.');
  }
  return item;
}
