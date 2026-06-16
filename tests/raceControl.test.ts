/**
 * Race Control & Compliance. Locks the track-limit count vs the long-lap
 * threshold and its status, the penalties/incidents logs, the scrutineering
 * checklist, and the overall penalty-risk roll-up from the worst check.
 */
import { describe, it, expect } from 'vitest';
import { buildRaceControl, checkColor, flagColor } from '../src/domain/raceControl';

const args = ['Rubén Juárez', 'Yamaha R1', 'Mugello', 15] as const;

describe('race control & compliance', () => {
  it('counts track-limit strikes vs the limit and classifies status', () => {
    const r = buildRaceControl(...args);
    expect(r.trackLimits.warnings).toBe(r.trackLimits.corners.reduce((a, c) => a + c.count, 0));
    expect(r.trackLimits.warnings).toBeLessThanOrEqual(r.trackLimits.limit);
    const expected = r.trackLimits.warnings >= r.trackLimits.limit ? 'fail'
      : r.trackLimits.warnings >= r.trackLimits.limit - 1 ? 'check' : 'pass';
    expect(r.trackLimits.status).toBe(expected);
  });

  it('logs penalties and incidents with valid states', () => {
    const r = buildRaceControl(...args);
    expect(r.penalties.length).toBeGreaterThanOrEqual(1);
    expect(r.penalties.every(p => ['pending', 'served', 'investigation'].includes(p.status))).toBe(true);
    expect(r.incidents.length).toBeGreaterThanOrEqual(1);
  });

  it('runs a scrutineering checklist with at least one open item', () => {
    const r = buildRaceControl(...args);
    expect(r.scrutineering.length).toBeGreaterThanOrEqual(4);
    expect(r.scrutineering.every(c => ['pass', 'check', 'fail'].includes(c.status))).toBe(true);
    expect(r.scrutineering.some(c => c.status !== 'pass')).toBe(true);
  });

  it('rolls penalty risk up from the worst check', () => {
    const r = buildRaceControl(...args);
    const all = [r.trackLimits.status, ...r.scrutineering.map(c => c.status)];
    const expected = all.includes('fail') ? 'fail' : all.includes('check') ? 'check' : 'pass';
    expect(r.penaltyRisk).toBe(expected);
  });

  it('gives recommendations and exposes flag + check colours', () => {
    const r = buildRaceControl(...args);
    expect(r.recommendations.length).toBeGreaterThanOrEqual(3);
    expect(flagColor(r.flag)).toBeTruthy();
    expect(checkColor('fail')).toBeTruthy();
  });
});
