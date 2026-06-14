/**
 * Performance Experiment Engine — the improvement loop. Locks the experiment
 * contract: an active running experiment with no final result, completed ones
 * carrying a before/after metric table, and validation semantics (validated =
 * criteria met, partially = one improved + one worsened, rejected = a criterion
 * missed). Coherent with the Black Box (rebound validated, TC rejected).
 */
import { describe, it, expect } from 'vitest';
import { buildExperiments, statusMeta, EXPERIMENT_LOOP } from '../src/domain/experimentEngine';

const args = ['Rubén Juárez', 'Yamaha R1', 'Mugello'] as const;

describe('experiment engine', () => {
  it('builds a personalised set with exactly one active (running) experiment', () => {
    const xs = buildExperiments(...args);
    expect(xs.length).toBeGreaterThanOrEqual(4);
    const running = xs.filter(x => x.status === 'running');
    expect(running.length).toBe(1);
    expect(running[0].result).toBeUndefined();
    // active carries a full plan
    expect(running[0].changeSet.length).toBeGreaterThan(0);
    expect(running[0].successCriteria.length).toBeGreaterThan(0);
    expect(running[0].confidence).toBeGreaterThan(0);
    expect(running[0].confidence).toBeLessThanOrEqual(100);
  });

  it('completed experiments carry a before/after metric table and a learning', () => {
    const completed = buildExperiments(...args).filter(x => x.result);
    expect(completed.length).toBeGreaterThanOrEqual(3);
    for (const x of completed) {
      const r = x.result!;
      expect(r.metrics.length).toBeGreaterThan(0);
      for (const m of r.metrics) {
        expect(m.before).not.toBe(m.after);
        expect(typeof m.met).toBe('boolean');
      }
      expect(r.learning.length).toBeGreaterThan(5);
      expect(r.nextRecommendation.length).toBeGreaterThan(5);
    }
  });

  it('validation semantics hold per status', () => {
    const xs = buildExperiments(...args);
    const validated = xs.find(x => x.status === 'validated')!;
    expect(validated.result!.metrics.every(m => m.met)).toBe(true);

    const partial = xs.find(x => x.status === 'partially-validated')!;
    expect(partial.result!.improved).toBeTruthy();
    expect(partial.result!.worsened).toBeTruthy();
    expect(partial.result!.metrics.some(m => !m.met)).toBe(true);

    const rejected = xs.find(x => x.status === 'rejected')!;
    expect(rejected.result!.metrics.some(m => !m.met)).toBe(true);
  });

  it('stays coherent with the Black Box (rebound validated, TC rejected)', () => {
    const xs = buildExperiments(...args);
    const rebound = xs.find(x => x.title.includes('Rebound'))!;
    expect(rebound.status).toBe('validated');
    const tc = xs.find(x => x.title.includes('Traction Control'))!;
    expect(tc.status).toBe('rejected');
  });

  it('exposes status colours and the closed-loop method', () => {
    expect(statusMeta('validated').color).toBeTruthy();
    expect(statusMeta('rejected').label).toBe('REJECTED');
    expect(EXPERIMENT_LOOP[0]).toMatch(/detect/i);
    expect(EXPERIMENT_LOOP.length).toBeGreaterThanOrEqual(7);
  });
});
