/**
 * raceModel.ts — shared race-distance model.
 *
 * Single source of truth for how many racing laps a circuit length implies.
 * Race Strategy, Fuel & Energy and Tyre Pressure all size the race from this,
 * so it lives in one place — if it ever changes, every module agrees.
 *
 * A MotoGP race is ~120 km; derive laps from the circuit length, clamped to a
 * sane 18–30 lap range.
 */
export function raceLapsFor(lengthKm: number): number {
  const laps = Math.round(120 / Math.max(lengthKm, 2.5));
  return Math.min(30, Math.max(18, laps));
}
