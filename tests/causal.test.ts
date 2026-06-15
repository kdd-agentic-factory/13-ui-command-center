/**
 * Causal Performance Engine — reasoning from correlation to cause. Locks the
 * causal graph, the cause ranking + classification, the intervention planner,
 * the experiment→result validation and the causal memory.
 */
import { describe, it, expect } from 'vitest';
import { buildCausal, classMeta } from '../src/domain/causal';

const args = ['Rubén Juárez', 'Yamaha R1', 'Mugello', 'Stint 03'] as const;

describe('causal performance engine', () => {
  it('builds a causal graph from cause to lap-time loss', () => {
    const c = buildCausal(...args);
    expect(c.graph[0].toLowerCase()).toContain('lean');
    expect(c.graph[c.graph.length - 1].toLowerCase()).toContain('lap time');
    expect(c.graph.length).toBeGreaterThanOrEqual(5);
  });

  it('ranks causes by weight and classifies correlation vs cause; weights are ordered', () => {
    const c = buildCausal(...args);
    for (let i = 1; i < c.factors.length; i++) expect(c.factors[i - 1].weight).toBeGreaterThanOrEqual(c.factors[i].weight);
    expect(c.factors[0].klass).toBe('likely-causal');
    expect(c.factors.some(f => f.klass === 'rejected')).toBe(true);
    expect(c.rejected).toContain('Apex speed');
  });

  it('plans the single best intervention and what NOT to change', () => {
    const c = buildCausal(...args);
    expect(c.intervention.action.toLowerCase()).toContain('pick the bike up');
    expect(c.intervention.expected.length).toBeGreaterThan(0);
    expect(c.intervention.doNotChange).toContain('Power map');
  });

  it('the causal experiment is confirmed without a setup change', () => {
    const c = buildCausal(...args);
    expect(c.experiment.successCriteria.length).toBeGreaterThan(0);
    expect(c.result.status).toBe('Confirmed');
    expect(c.result.conclusion.toLowerCase()).toContain('not setup');
    expect(c.setupCheck.verdict.toLowerCase()).toContain('not the primary');
  });

  it('causal memory + risk analysis carry confirmed causes', () => {
    const c = buildCausal(...args);
    expect(c.memory.length).toBeGreaterThan(0);
    expect(c.memory[0].confidence).toBe('High');
    expect(c.riskAnalysis.riskReduction).toContain('11');
    expect(classMeta('confirmed-causal').label).toBe('CONFIRMED CAUSAL');
  });
});
