/**
 * Sim-to-Real Racing Lab — rehearse before track, validate after. Locks the
 * scenario/prediction contract, the expected telemetry signature, the predicted-
 * vs-actual validation, the planner recommendation and the risk-aware framing.
 */
import { describe, it, expect } from 'vitest';
import { buildSimLab } from '../src/domain/simLab';

const args = ['Rubén Juárez', 'Yamaha R1', 'Mugello', 'Stint 03'] as const;

describe('sim-to-real racing lab', () => {
  it('produces a predicted lap, scenario and expected telemetry signature', () => {
    const s = buildSimLab(...args);
    expect(s.predictedLap).toMatch(/^\d:\d\d\.\d{3}$/);
    expect(s.scenario.confidence).toBeGreaterThan(0);
    expect(s.signature.length).toBeGreaterThanOrEqual(3);
    for (const r of s.signature) expect(r.before).not.toBe(r.after);
  });

  it('sim-vs-real validates the prediction with a low model error', () => {
    const s = buildSimLab(...args);
    expect(s.simVsReal.length).toBeGreaterThan(0);
    expect(s.simVsReal.every(r => typeof r.ok === 'boolean')).toBe(true);
    expect(s.modelError).toBe('Low');
    expect(s.validationStatus.toLowerCase()).toContain('validated');
  });

  it('planner recommends exactly one option and the virtual day has runs', () => {
    const s = buildSimLab(...args);
    expect(s.planner.filter(o => o.recommended).length).toBe(1);
    expect(s.planner.find(o => o.recommended)!.name).toMatch(/5-lap/);
    expect(s.virtualDay.length).toBeGreaterThanOrEqual(4);
  });

  it('risk sim prefers the safer (not fastest) option and protects setup', () => {
    const s = buildSimLab(...args);
    expect(s.risk.recommendation.toLowerCase()).toContain('safer');
    expect(s.setupAB.doNotChange.length).toBeGreaterThan(0);
    expect(s.tyres.length).toBeGreaterThanOrEqual(2);
    expect(s.fatigue.adjustment.length).toBeGreaterThan(5);
    expect(s.missionName.toLowerCase()).toContain('validation');
  });

  it('flags GPS-only estimated telemetry in the signature', () => {
    const full = buildSimLab('Rubén Juárez', 'Yamaha R1', 'Mugello', 'Stint 03', false);
    const gps = buildSimLab('KD5', 'Kawasaki ZX-10R', 'Mugello', 'Stint 03', true);
    expect(gps.signature.some(r => r.after.includes('est'))).toBe(true);
    expect(full.signature.some(r => r.after.includes('est'))).toBe(false);
  });
});
