/**
 * Shared race-distance model. Locks the single source of truth used by Race
 * Strategy, Fuel and Tyre Pressure, and asserts all three agree on lap count
 * for the same circuit length (the integration this module exists to guarantee).
 */
import { describe, it, expect } from 'vitest';
import { raceLapsFor } from '../src/domain/raceModel';
import { raceLapsFor as fromStrategy } from '../src/domain/raceStrategy';
import { raceLapsForFuel } from '../src/domain/fuel';
import { raceLapsForPressure } from '../src/domain/tyrePressure';

describe('shared race model', () => {
  it('derives ~120 km of laps, clamped to 18–30', () => {
    expect(raceLapsFor(5.245)).toBe(23);   // Mugello-ish
    expect(raceLapsFor(2.0)).toBe(30);     // very short → clamp high
    expect(raceLapsFor(7.0)).toBe(18);     // very long → clamp low
  });

  it('is the single source of truth: strategy, fuel and pressure all agree', () => {
    for (const km of [3.3, 4.0, 4.5, 5.245, 6.0]) {
      const laps = raceLapsFor(km);
      expect(fromStrategy(km)).toBe(laps);
      expect(raceLapsForFuel(km)).toBe(laps);
      expect(raceLapsForPressure(km)).toBe(laps);
    }
  });
});
