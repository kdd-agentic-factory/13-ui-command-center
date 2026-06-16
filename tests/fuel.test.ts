/**
 * Fuel & Energy Lab. Locks the tank-vs-race sizing, the consumption projection
 * + margin status, the fuel-weight penalty, the lift-and-coast worth-it logic,
 * the burn plan (with a save phase) and the recommendations.
 */
import { describe, it, expect } from 'vitest';
import { buildFuel, raceLapsForFuel, fuelStatusColor } from '../src/domain/fuel';

const args = ['Rubén Juárez', 'Yamaha R1', 'Mugello', 5.245, 15] as const;

describe('fuel & energy lab', () => {
  it('sizes the race and keeps the load within the tank limit', () => {
    const f = buildFuel(...args);
    expect(f.raceLaps).toBe(raceLapsForFuel(5.245));
    expect(f.tank.startLoadL).toBeLessThanOrEqual(f.tank.capacityL);
    expect(f.consumption.perLapL).toBeGreaterThan(0);
  });

  it('projects consumption and classifies the margin status', () => {
    const f = buildFuel(...args);
    expect(f.consumption.projectedTotalL).toBeCloseTo(
      Math.round(f.consumption.perLapL * f.raceLaps * 10) / 10, 1);
    expect(f.consumption.marginL).toBeCloseTo(
      Math.round((f.tank.startLoadL - f.consumption.projectedTotalL) * 10) / 10, 1);
    const expected = f.consumption.marginL < 0 ? 'short' : f.consumption.marginL < 0.4 ? 'tight' : 'safe';
    expect(f.consumption.status).toBe(expected);
  });

  it('prices the fuel-weight lap-time penalty', () => {
    const f = buildFuel(...args);
    expect(f.weight.fuelMassKg).toBeGreaterThan(0);
    expect(f.weight.startEndDeltaS).toBeGreaterThan(0);
  });

  it('marks lift-and-coast zones worth it only when litres beat lap time', () => {
    const f = buildFuel(...args);
    expect(f.liftCoast.length).toBeGreaterThanOrEqual(2);
    expect(f.liftCoast.some(z => z.worthIt)).toBe(true);
    expect(f.liftCoast.some(z => !z.worthIt)).toBe(true);
  });

  it('lays out a burn plan with a save phase, plus colours', () => {
    const f = buildFuel(...args);
    expect(f.phases.some(p => p.mode === 'save')).toBe(true);
    expect(f.recommendations.length).toBeGreaterThanOrEqual(3);
    expect(f.sustainable.toLowerCase()).toContain('2027');
    expect(fuelStatusColor('tight')).toBeTruthy();
  });
});
