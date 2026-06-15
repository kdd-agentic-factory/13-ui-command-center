/**
 * Human Performance Intelligence — the human layer. Locks the rider-state
 * contract, the fatigue→error windows, the human-aware crash-risk arithmetic
 * and the honesty about biometric provenance.
 */
import { describe, it, expect } from 'vitest';
import { buildHumanPerformance } from '../src/domain/humanPerformance';

const args = ['Rubén Juárez', 'Yamaha R1', 'Mugello', 'Stint 03'] as const;

describe('human performance intelligence', () => {
  it('builds a rider state score with a human limiter and evidence', () => {
    const h = buildHumanPerformance(...args);
    expect(h.stateScore).toBeGreaterThan(0);
    expect(h.stateScore).toBeLessThanOrEqual(100);
    expect(h.mainLimiter.toLowerCase()).toContain('fatigue');
    expect(h.evidence.length).toBeGreaterThan(2);
    expect(h.vitals.length).toBeGreaterThanOrEqual(5);
  });

  it('fatigue windows run stable → peak → rising', () => {
    const h = buildHumanPerformance(...args);
    expect(h.fatigue.map(f => f.state)).toEqual(['stable', 'peak', 'rising']);
  });

  it('human-aware crash risk adds fatigue + stress to the base', () => {
    const h = buildHumanPerformance(...args);
    expect(h.risk.base + h.risk.fatigueAdj + h.risk.stressAdj).toBe(h.risk.final);
    expect(h.risk.final).toBeGreaterThan(h.risk.base);
  });

  it('cognitive load map + confidence index separate high/low zones', () => {
    const h = buildHumanPerformance(...args);
    expect(h.cognitive.some(c => c.load === 'High')).toBe(true);
    expect(h.confidence.low).toContain('T15 Bucine');
    expect(h.confidence.high.length).toBeGreaterThan(0);
  });

  it('is honest that biometrics are wearable/manual and estimated', () => {
    const h = buildHumanPerformance(...args);
    expect(h.dataSource.toLowerCase()).toContain('estimated');
    expect(h.dataSource.toLowerCase()).toMatch(/wearable|manual/);
    expect(h.readiness.recommendedStint.length).toBeGreaterThan(0);
    expect(h.beforeAfter.length).toBeGreaterThan(0);
  });
});
