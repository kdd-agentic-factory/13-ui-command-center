/**
 * Platform Console — orchestrator intent routing (live with fallback) + the
 * RAG 5xx→reachable labelling fix. Pure-function coverage.
 */
import { describe, it, expect, vi } from 'vitest';
import { groundDebrief } from '../src/domain/debrief';

describe('rag grounding state labelling', () => {
  it('treats a 5xx (reached + authenticated, no index) as reachable, not offline', async () => {
    const g = await groundDebrief('q', { ragSearch: async () => ({ ok: false, reason: 'server-error' }) });
    expect(g.state).toBe('reachable');
  });
  it('keeps a true network failure as unavailable', async () => {
    const g = await groundDebrief('q', { ragSearch: async () => ({ ok: false, reason: 'unreachable' }) });
    expect(g.state).toBe('unavailable');
  });
});

describe('orchestrator intent routing', () => {
  it('orchestrate posts user_input and returns the routed agent', async () => {
    let sentBody = '';
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      sentBody = String(init?.body ?? '');
      return { ok: true, json: async () => ({ status: 'completed', agent_used: 'setup-optimizer' }) };
    });
    vi.stubGlobal('fetch', fetchMock);
    const { orchestrate } = await import('../src/services/api');
    const r = await orchestrate('compare rear setup for Mugello');
    expect(r?.status).toBe('completed');
    expect(r?.agent_used).toBe('setup-optimizer');
    expect(JSON.parse(sentBody).user_input).toContain('Mugello');
    vi.unstubAllGlobals();
  });

  it('returns null when the orchestrator is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('down'); }));
    const { orchestrate } = await import('../src/services/api');
    expect(await orchestrate('x')).toBeNull();
    vi.unstubAllGlobals();
  });
});
