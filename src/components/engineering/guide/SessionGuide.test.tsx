import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { sessionId, teamId, userId } from '../../../../tests/workboardFixtures';
import type { EngineeringSession } from '../../../domain/engineeringSession';
import { executeGuideTurn, getGuide, sendGuideTurn, type GuideItem } from '../../../services/sessionGuide';
import { createAnalysisSnapshot } from '../../../services/engineeringSession';
import { SessionGuide } from './SessionGuide';

const identity = vi.hoisted(() => ({
  mode: 'authenticated', team: '', user: '', role: 'engineer', generation: 1,
}));
vi.mock('../../../services/telemetryIdentity', () => ({ identitySnapshot: () => ({ ...identity }) }));
vi.mock('../../../services/sessionGuide', () => ({ getGuide: vi.fn(), sendGuideTurn: vi.fn(), executeGuideTurn: vi.fn() }));
vi.mock('../../../services/engineeringSession', () => ({ createAnalysisSnapshot: vi.fn() }));

const session: EngineeringSession = {
  schema_version: '1.0.0', id: sessionId, revision: 1, name: 'Tanda de pruebas',
  session_type: 'practice', provenance: 'synthetic', other_label: null,
  circuit: null, bike: null, rider: null, notes: '', team_id: teamId,
  created_by: userId, created_at: '2026-11-04T10:00:00Z',
};
const item: GuideItem = {
  revision: 1, reply: null,
  turn: { id: crypto.randomUUID(), session_id: sessionId, team_id: teamId, session_revision: 1,
    message: '¿Qué falta medir?', status: 'pending', error: null, snapshot_id: null, model: null },
};
beforeEach(() => {
  vi.resetAllMocks();
  Object.assign(identity, { team: teamId, user: userId, role: 'engineer', generation: 1 });
  vi.mocked(getGuide).mockResolvedValue([]);
});

it('keeps the same operation on retry and displays the server status', async () => {
  vi.mocked(sendGuideTurn).mockRejectedValueOnce(new Error('Se perdió la respuesta')).mockResolvedValueOnce(item);
  render(<SessionGuide session={session} scope="qa" />);
  await screen.findByText('Todavía no hay preguntas en esta sesión.');
  fireEvent.change(screen.getByLabelText('Pregunta para Cicerone'), { target: { value: item.turn.message } });
  fireEvent.click(screen.getByRole('button', { name: 'Guardar pregunta' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Se perdió la respuesta');
  fireEvent.click(screen.getByRole('button', { name: 'Guardar pregunta' }));
  expect(await screen.findByText('Pendiente de ejecución')).toBeVisible();
  expect(vi.mocked(sendGuideTurn).mock.calls[0].slice(0, 4)).toEqual(vi.mocked(sendGuideTurn).mock.calls[1].slice(0, 4));
});

it('displays persisted replies to readers and clears them on a team switch', async () => {
  identity.role = 'reader';
  vi.mocked(getGuide).mockResolvedValue([{
    ...item,
    turn: { ...item.turn, status: 'completed', model: 'qa-model' },
    reply: { facts: [], calculations: [], hypotheses: [], limitations: ['Datos insuficientes'], next_step: 'Registra el recorrido',
      actions: [{ kind: 'request_data', request_id: 'bench_source_validation' }] },
  }]);
  render(<SessionGuide session={session} scope="qa" />);
  expect(await screen.findByText(/Registra el recorrido/)).toBeVisible();
  expect(screen.getByText('Validar la fuente del ensayo de banco')).toBeVisible();
  expect(screen.queryByLabelText('Pregunta para Cicerone')).not.toBeInTheDocument();
  act(() => {
    identity.team = crypto.randomUUID();
    identity.generation++;
    window.dispatchEvent(new Event('telemetry-scope-changed'));
  });
  expect(screen.queryByText(/Registra el recorrido/)).not.toBeInTheDocument();
});

it('executes a saved question with one stable snapshot across uncertain retries', async () => {
  vi.mocked(getGuide).mockResolvedValue([item]);
  const snapshot = crypto.randomUUID();
  vi.mocked(createAnalysisSnapshot).mockResolvedValue({ id: snapshot } as Awaited<ReturnType<typeof createAnalysisSnapshot>>);
  vi.mocked(executeGuideTurn).mockRejectedValueOnce(new Error('Respuesta perdida')).mockResolvedValueOnce({
    ...item, revision: 3, turn: { ...item.turn, status: 'completed', snapshot_id: snapshot, model: 'qa' },
    reply: { facts: [], calculations: [], hypotheses: [], limitations: ['Sin telemetría'], next_step: 'Importa una grabación' },
  });
  render(<SessionGuide session={session} scope="qa" />);
  fireEvent.click(await screen.findByRole('button', { name: 'Consultar con datos actuales' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Respuesta perdida');
  fireEvent.click(screen.getByRole('button', { name: 'Consultar con datos actuales' }));
  expect(await screen.findByText(/Importa una grabación/)).toBeVisible();
  expect(createAnalysisSnapshot).toHaveBeenCalledTimes(1);
  expect(vi.mocked(executeGuideTurn).mock.calls.every(call => call[1] === snapshot)).toBe(true);
});

it('opens the frozen citation from a conclusion separately from the rider check', async () => {
  const analysis = crypto.randomUUID();
  const digest = 'a'.repeat(64);
  const citation = `suspension:${analysis}@4:${digest}:lab_suspension_displacement`;
  const saved = {
    ...item,
    turn: { ...item.turn, status: 'completed' as const, snapshot_id: crypto.randomUUID(), snapshot_digest: digest },
    reply: {
      facts: [{ text: 'Recorrido máximo observado', evidence: [citation] }], calculations: [], hypotheses: [],
      next_step: 'Repite el mismo tramo y comprueba el recorrido', limitations: ['Datos parciales'],
    },
    cited_measurements: [{
      evidence_id: citation, metric: 'lab_suspension_displacement', method: 'movement', unit: 'm',
      analysis_reference: { id: analysis, revision: 4, digest },
      selected_signal_scope: { interval_s: ['2', '8'], selected_sensor_id: 'suspension_front' },
      measurements: [{ name: 'max', value_si: '0.04' }],
    }],
  };
  vi.mocked(getGuide).mockResolvedValue([saved]);
  render(<SessionGuide session={{...session, revision: 2}} scope="qa" />);
  expect(await screen.findByText('Próxima comprobación del piloto')).toBeVisible();
  fireEvent.click(screen.getByText('Hechos (1)'));
  fireEvent.click(screen.getByText('Ver evidencia congelada'));
  expect(screen.getByText(/Análisis r4/)).toBeVisible();
  expect(screen.getByText(/Intervalo 2–8 s/)).toBeVisible();
  expect(screen.getByText('suspension_front')).toBeVisible();
  expect(screen.getByText(/0\.04 m/)).toBeVisible();
});
