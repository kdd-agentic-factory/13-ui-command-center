/**
 * AI Debrief Room ↔ RAG knowledge layer grounding (live with fallback). Locks
 * the four states: grounded (evidence mapped), reachable (401 — service up but
 * credentialed), unavailable (network), and the query builder.
 */
import { describe, it, expect } from 'vitest';
import { groundDebrief, debriefQuery } from '../src/domain/debrief';

describe('debrief grounding', () => {
  it('builds a grounding query for the session limiter', () => {
    const q = debriefQuery('Yamaha R1', 'Mugello');
    expect(q).toContain('Mugello');
    expect(q).toContain('Yamaha R1');
    expect(q.length).toBeGreaterThan(20);
  });

  it('maps evidence into grounded sources', async () => {
    const g = await groundDebrief('q', {
      ragSearch: async () => ({
        ok: true,
        data: {
          evidence: [
            { source_id: 'paper.pdf#3', text_excerpt: 'Slower rear rebound settles the exit at Bucine.', score: 0.91 },
            { source_id: 'setup_notes', text_excerpt: '', score: 0.4 }, // dropped (no excerpt)
          ],
        },
      }),
    });
    expect(g.state).toBe('grounded');
    expect(g.sources).toHaveLength(1);
    expect(g.sources[0].sourceId).toBe('paper.pdf#3');
    expect(g.sources[0].excerpt).toMatch(/rebound/);
  });

  it('falls back to results when evidence is empty', async () => {
    const g = await groundDebrief('q', {
      ragSearch: async () => ({ ok: true, data: { evidence: [], results: [{ source_id: 'r1', text: 'Exit drive notes.', score: 0.7 }] } }),
    });
    expect(g.state).toBe('grounded');
    expect(g.sources[0].sourceId).toBe('r1');
  });

  it('reports REACHABLE on 401 (service up, needs server-side credentials)', async () => {
    const g = await groundDebrief('q', { ragSearch: async () => ({ ok: false, reason: 'unauthorized' }) });
    expect(g.state).toBe('reachable');
    expect(g.sources).toHaveLength(0);
  });

  it('reports UNAVAILABLE when the service is unreachable, and on empty grounded results', async () => {
    const off = await groundDebrief('q', { ragSearch: async () => ({ ok: false, reason: 'unreachable' }) });
    expect(off.state).toBe('unavailable');
    const empty = await groundDebrief('q', { ragSearch: async () => ({ ok: true, data: { evidence: [], results: [] } }) });
    expect(empty.state).toBe('reachable'); // service answered but nothing to ground
  });
});
