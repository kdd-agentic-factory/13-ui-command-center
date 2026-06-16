/**
 * Race Strategy Command. Locks the race sizing, the monotonic tyre-deg curve
 * with a late cliff, the ranked options (exactly one recommended baseline at
 * Δ0), the undercut/overcut rival maths, the armed weather trigger and the
 * live decision rules.
 */
import { describe, it, expect } from 'vitest';
import { buildRaceStrategy, raceLapsFor, riskColor } from '../src/domain/raceStrategy';

const args = ['Rubén Juárez', 'Yamaha R1', 'Mugello', 5.245, 15] as const;

describe('race strategy command', () => {
  it('sizes the race to a sane lap/distance range from circuit length', () => {
    const s = buildRaceStrategy(...args);
    expect(s.raceLaps).toBeGreaterThanOrEqual(18);
    expect(s.raceLaps).toBeLessThanOrEqual(30);
    expect(raceLapsFor(5.245)).toBe(s.raceLaps);
    expect(s.raceKm).toBeGreaterThan(100);
  });

  it('models a monotonic rear-deg curve that steepens into a late cliff', () => {
    const s = buildRaceStrategy(...args);
    expect(s.degCurve).toHaveLength(s.raceLaps);
    expect(s.degCurve[0].paceDelta).toBe(0);
    for (let i = 1; i < s.degCurve.length; i++) {
      expect(s.degCurve[i].paceDelta).toBeGreaterThanOrEqual(s.degCurve[i - 1].paceDelta);
    }
    const last = s.degCurve[s.degCurve.length - 1].paceDelta;
    const mid = s.degCurve[Math.floor(s.raceLaps / 2)].paceDelta;
    expect(last).toBeGreaterThan(mid * 1.5); // the cliff
  });

  it('ranks options with exactly one recommended baseline at delta 0', () => {
    const s = buildRaceStrategy(...args);
    const rec = s.options.filter(o => o.recommended);
    expect(rec).toHaveLength(1);
    expect(rec[0].projectedDelta).toBe(0);
    expect(s.options.every(o => o.recommended || o.projectedDelta > 0)).toBe(true);
    expect(s.options.some(o => o.id === 'ftf' && o.stops === 1)).toBe(true);
  });

  it('runs undercut/overcut maths vs a named rival and arms a weather trigger', () => {
    const s = buildRaceStrategy(...args);
    expect(['undercut', 'overcut', 'hold']).toContain(s.rival.move);
    expect(s.rival.gap).toBeGreaterThan(0);
    expect(s.weather.armed).toBe(true);
    expect(s.weather.probability).toBeGreaterThan(0);
    expect(s.weather.action.toLowerCase()).toContain('flag-to-flag');
  });

  it('exposes a phase pace plan and prioritised live decision rules', () => {
    const s = buildRaceStrategy(...args);
    expect(s.phasePlan.length).toBeGreaterThanOrEqual(3);
    expect(s.phasePlan.some(p => p.mode === 'manage')).toBe(true);
    expect(s.triggers.some(t => t.priority === 'high')).toBe(true);
    expect(riskColor('high')).toBeTruthy();
  });
});
