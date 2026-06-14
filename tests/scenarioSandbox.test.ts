/**
 * Scenario Sandbox — locks the what-if twin model: deterministic, monotonic in
 * the expected direction, and the Oracle verdict matches the regime.
 */
import { describe, it, expect } from 'vitest';
import { evaluateScenario, DEFAULT_LEVERS, fmtLap } from '../src/domain/scenarioSandbox';

describe('scenario evaluation', () => {
  it('is deterministic — same levers, same output', () => {
    const a = evaluateScenario({ ...DEFAULT_LEVERS, earlierThrottle: 0.3 });
    const b = evaluateScenario({ ...DEFAULT_LEVERS, earlierThrottle: 0.3 });
    expect(a).toEqual(b);
  });

  it('earlier throttle is faster but riskier', () => {
    const base = evaluateScenario(DEFAULT_LEVERS);
    const aggressive = evaluateScenario({ ...DEFAULT_LEVERS, earlierThrottle: 0.4 });
    expect(aggressive.lapTimeS).toBeLessThan(base.lapTimeS);
    expect(aggressive.risk).toBeGreaterThan(base.risk);
  });

  it('more TC lowers risk; rear rebound +2 is the lap-time optimum', () => {
    const base = evaluateScenario(DEFAULT_LEVERS);
    expect(evaluateScenario({ ...DEFAULT_LEVERS, tc: 3 }).risk).toBeLessThan(base.risk);
    const opt = evaluateScenario({ ...DEFAULT_LEVERS, rearRebound: 2 }).lapTimeS;
    expect(opt).toBeLessThanOrEqual(evaluateScenario({ ...DEFAULT_LEVERS, rearRebound: 0 }).lapTimeS);
    expect(opt).toBeLessThanOrEqual(evaluateScenario({ ...DEFAULT_LEVERS, rearRebound: 4 }).lapTimeS);
  });

  it('a worn tyre past the cliff collapses tyre life and flags risk', () => {
    const o = evaluateScenario({ ...DEFAULT_LEVERS, rearStintLaps: 21 });
    expect(o.tyreLifeLaps).toBe(0);
    expect(o.verdictTone).not.toBe('good');
  });

  it('max-aggression scenario reads as too risky', () => {
    const o = evaluateScenario({ ...DEFAULT_LEVERS, earlierThrottle: 0.5, tc: -2, rearRebound: -2, trackTempDelta: 10 });
    expect(o.risk).toBeGreaterThanOrEqual(78);
    expect(o.verdictTone).toBe('bad');
  });

  it('formats lap time as m:ss.mmm', () => {
    expect(fmtLap(117.842)).toBe('1:57.842');
  });
});
