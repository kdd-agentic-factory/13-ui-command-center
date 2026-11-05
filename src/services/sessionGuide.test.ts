import { afterEach, expect, it, vi } from 'vitest';
import { executeGuideTurn, type GuideItem } from './sessionGuide';

const identity = vi.hoisted(() => ({
  mode: 'authenticated', user: '10000000-0000-4000-8000-000000000001',
  team: '10000000-0000-4000-8000-000000000002', generation: 1,
}));
vi.mock('./telemetryIdentity', () => ({
  identitySnapshot: () => ({ ...identity }), telemetryFetch: vi.fn(),
}));
import { telemetryFetch } from './telemetryIdentity';

afterEach(() => vi.useRealTimers());

it('waits for an execution response beyond thirty seconds', async () => {
  vi.useFakeTimers();
  const snapshot = '10000000-0000-4000-8000-000000000004';
  const expected: GuideItem = {
    revision: 1, reply: null,
    turn: { id: '10000000-0000-4000-8000-000000000003', team_id: identity.team,
      session_id: '10000000-0000-4000-8000-000000000005', session_revision: 1,
      status: 'pending', message: 'Inspect', snapshot_id: null, model: null, error: null },
  };
  const result = { ...expected, schema_version: '1.0.0', revision: 3,
    turn: { ...expected.turn, status: 'completed', snapshot_id: snapshot, model: 'qa' },
    reply: { facts: [], calculations: [], hypotheses: [], limitations: ['No data'], next_step: 'Measure' } };
  vi.mocked(telemetryFetch).mockImplementation((_url, options) => new Promise((resolve, reject) => {
    options?.signal?.addEventListener('abort', () => reject(new Error('Aborted')), { once: true });
    setTimeout(() => resolve(new Response(JSON.stringify(result), { status: 200 })), 35000);
  }));
  const outcome = executeGuideTurn(expected, snapshot, new AbortController().signal)
    .then(value => ({ value, error: null }), error => ({ value: null, error }));
  await vi.advanceTimersByTimeAsync(35000);
  expect((await outcome).error).toBeNull();
  expect((await outcome).value?.turn.status).toBe('completed');
});
