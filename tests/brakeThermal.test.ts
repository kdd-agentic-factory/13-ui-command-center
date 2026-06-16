/**
 * Brake Thermal Lab. Locks the severity rating, the disc window, the per-corner
 * energy→temperature model and its status classification, the lap thermal
 * curve, the single chosen duct, the fade / cold-disc risk and the
 * recommendations.
 */
import { describe, it, expect } from 'vitest';
import { buildBrakeThermal, thermColor } from '../src/domain/brakeThermal';

const args = ['Rubén Juárez', 'Yamaha R1', 'Mugello', 15] as const;

describe('brake thermal lab', () => {
  it('rates severity and sizes the disc + operating window', () => {
    const b = buildBrakeThermal(...args);
    expect(b.severity).toBeGreaterThanOrEqual(1);
    expect(b.severity).toBeLessThanOrEqual(10);
    expect([320, 340]).toContain(b.disc.diameterMm);
    expect(b.disc.windowLow).toBeLessThan(b.disc.windowHigh);
  });

  it('derives per-corner peak temp from brake energy and classifies status', () => {
    const b = buildBrakeThermal(...args);
    expect(b.zones.length).toBeGreaterThanOrEqual(3);
    const hottest = b.zones.reduce((a, z) => (z.energyMJ > a.energyMJ ? z : a));
    expect(hottest.peakTempC).toBe(Math.max(...b.zones.map(z => z.peakTempC)));
    expect(b.zones.every(z => ['optimal', 'hot', 'overheat', 'cold'].includes(z.status))).toBe(true);
    expect(b.state.peakTempC).toBe(Math.max(...b.zones.map(z => z.peakTempC)));
  });

  it('builds a lap thermal curve that peaks at the big stop', () => {
    const b = buildBrakeThermal(...args);
    expect(b.curve.length).toBeGreaterThanOrEqual(4);
    expect(Math.max(...b.curve.map(p => p.tempC))).toBe(b.state.peakTempC);
  });

  it('chooses exactly one cooling duct and reports both risks', () => {
    const b = buildBrakeThermal(...args);
    expect(b.ducts.filter(d => d.chosen)).toHaveLength(1);
    expect(b.fade.fadeRiskPct).toBeGreaterThan(0);
    expect(b.fade.coldRiskPct).toBeGreaterThan(0);
  });

  it('always gives actionable recommendations and exposes thermal colours', () => {
    const b = buildBrakeThermal(...args);
    expect(b.recommendations.length).toBeGreaterThanOrEqual(3);
    expect(thermColor('overheat')).toBeTruthy();
    expect(thermColor('cold')).toBeTruthy();
  });
});
