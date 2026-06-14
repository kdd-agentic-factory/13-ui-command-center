/**
 * useGarage — read access to the active Garage Profile (rider + bike + setup
 * + tyres + readiness) chosen at the Garage Profile Gate.
 *
 * Like useSessionContext, the profile is set before the dashboard shell mounts
 * and is immutable for its lifetime, so a plain read is safe. Falls back to
 * the canonical Rubén + R1 + Mugello combination when no gate ran (tests,
 * deep-linked spectator) so every module always has a coherent rider/bike.
 */
import {
  getGarageProfile, buildGarageProfile, RIDERS, BIKES, GarageProfile,
} from '../domain/garageProfile';
import { getSessionContext } from '../domain/sessionContext';

export interface GarageView {
  profile: GarageProfile;
  /** Bike exposes only GPS — ECU/IMU channels are estimated, not measured. */
  telemetryLimited: boolean;
  /** Power class drives crash-risk and setup ranges. */
  powerClass: 'High' | 'Very high';
}

export function useGarage(): GarageView {
  const profile = getGarageProfile()
    ?? buildGarageProfile(RIDERS[0], BIKES[0], getSessionContext().selectedCircuit || 'mugello');
  return {
    profile,
    telemetryLimited: profile.bike.telemetry === 'gps-only',
    // V4 / >1000cc twins push more power to the rear than an inline-four.
    powerClass: profile.bike.engine.includes('V4') ? 'Very high' : 'High',
  };
}
