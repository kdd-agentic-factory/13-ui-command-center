/**
 * useGarage — modules read the active garage profile and adapt. Locks the
 * fallback (always a coherent rider/bike) and the derived flags that drive
 * the module adaptations (telemetryLimited, powerClass).
 */
import { describe, it, expect, afterEach } from 'vitest';
import { useGarage } from '../src/hooks/useGarage';
import { setGarageProfile, buildGarageProfile, RIDERS, BIKES } from '../src/domain/garageProfile';

// useGarage is a plain reader (no React state) — callable directly.
afterEach(() => setGarageProfile(buildGarageProfile(RIDERS[0], BIKES[0], 'mugello')));

describe('useGarage adaptation', () => {
  it('falls back to a coherent rider/bike when no gate ran', () => {
    const v = useGarage();
    expect(v.profile.rider.id).toBeTruthy();
    expect(v.profile.bike.id).toBeTruthy();
  });

  it('a full-telemetry inline-four is not limited and High power', () => {
    setGarageProfile(buildGarageProfile(RIDERS[0], BIKES.find(b => b.id === 'yamaha_r1_2024')!, 'mugello'));
    const v = useGarage();
    expect(v.telemetryLimited).toBe(false);
    expect(v.powerClass).toBe('High');
  });

  it('a V4 is Very high power', () => {
    setGarageProfile(buildGarageProfile(RIDERS[1], BIKES.find(b => b.id === 'ducati_v4_2024')!, 'mugello'));
    expect(useGarage().powerClass).toBe('Very high');
  });

  it('a GPS-only bike flags limited telemetry', () => {
    setGarageProfile(buildGarageProfile(RIDERS[0], BIKES.find(b => b.telemetry === 'gps-only')!, 'mugello'));
    expect(useGarage().telemetryLimited).toBe(true);
  });
});
