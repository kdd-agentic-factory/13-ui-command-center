/**
 * fuel.ts — KDD Fuel & Energy Lab.
 *
 * Fuel is a quiet lap-time lever: carry too much and you are slow and heavy
 * early; carry too little and you coast home or run dry. This module sizes the
 * tank vs the race, projects per-lap consumption and the safety margin, prices
 * the fuel-weight lap-time penalty, finds the lift-and-coast zones that save the
 * most for the least time, lays out the burn plan and flags the 2027 sustainable
 * fuel transition.
 *
 *   KDD doesn't just measure the fuel — it tells you exactly how much to carry
 *   and where to save it.
 *
 * Deterministic energy model derived from circuit shape. Honest: a
 * representative fuel picture, not a live flow-meter feed. Volumes in litres.
 */
import { raceLapsFor } from './raceModel';

export type FuelStatus = 'safe' | 'tight' | 'short';

export interface LiftZone { corner: string; saveL: number; lapTimeCostS: number; worthIt: boolean }
export interface FuelPhase { phase: string; laps: string; mode: 'push' | 'save' | 'normal'; perLapL: number }

export interface Fuel {
  combo: string; circuit: string; raceLaps: number;
  tank: { capacityL: number; startLoadL: number; fullThrottlePct: number };
  consumption: { perLapL: number; projectedTotalL: number; marginL: number; status: FuelStatus };
  weight: { fuelMassKg: number; lapCostPerKgS: number; startEndDeltaS: number };
  liftCoast: LiftZone[];
  phases: FuelPhase[];
  sustainable: string;
  recommendations: string[];
  verdict: string; punchline: string; confidence: number;
}

const STATUS_COLOR: Record<FuelStatus, string> = { safe: 'var(--green)', tight: 'var(--yellow)', short: 'var(--accent)' };
export function fuelStatusColor(s: FuelStatus): string { return STATUS_COLOR[s]; }

/** Alias of the shared race model, kept for a stable public name. */
export const raceLapsForFuel = raceLapsFor;

export function buildFuel(rider: string, bike: string, circuit: string, lengthKm: number, turns: number): Fuel {
  const raceLaps = raceLapsForFuel(lengthKm);
  const capacityL = 22; // MotoGP tank limit
  // More full-throttle (fewer, longer corners + a straight) burns more.
  const fullThrottlePct = Math.max(48, Math.round(70 - turns * 1.1));
  const perLapL = Math.round((capacityL * 0.92 / raceLaps + fullThrottlePct * 0.004) * 100) / 100;
  const projectedTotalL = Math.round(perLapL * raceLaps * 10) / 10;
  const startLoadL = Math.min(capacityL, Math.ceil(projectedTotalL + 0.3));
  const marginL = Math.round((startLoadL - projectedTotalL) * 10) / 10;
  const status: FuelStatus = marginL < 0 ? 'short' : marginL < 0.4 ? 'tight' : 'safe';

  const fuelMassKg = Math.round(startLoadL * 0.75 * 10) / 10; // ~0.75 kg/L
  const lapCostPerKgS = 0.035;
  const startEndDeltaS = Math.round(startLoadL * 0.75 * lapCostPerKgS * 100) / 100;

  return {
    combo: `${rider} · ${bike} · ${circuit}`,
    circuit, raceLaps,
    tank: { capacityL, startLoadL, fullThrottlePct },
    consumption: { perLapL, projectedTotalL, marginL, status },
    weight: { fuelMassKg, lapCostPerKgS, startEndDeltaS },
    liftCoast: [
      { corner: 'T1 · after main straight', saveL: 0.06, lapTimeCostS: 0.04, worthIt: true },
      { corner: `T${Math.max(6, Math.round(turns * 0.5))} · hard stop`, saveL: 0.04, lapTimeCostS: 0.05, worthIt: true },
      { corner: `T${Math.max(9, Math.round(turns * 0.75))} · medium`, saveL: 0.03, lapTimeCostS: 0.09, worthIt: false },
    ],
    phases: [
      { phase: 'Launch', laps: '1–2', mode: 'normal', perLapL: perLapL + 0.05 },
      { phase: 'Push', laps: `3–${Math.round(raceLaps * 0.6)}`, mode: 'push', perLapL: perLapL + 0.03 },
      { phase: 'Save', laps: `${Math.round(raceLaps * 0.6) + 1}–${raceLaps - 2}`, mode: 'save', perLapL: perLapL - 0.06 },
      { phase: 'Sprint', laps: `${raceLaps - 1}–${raceLaps}`, mode: 'push', perLapL: perLapL + 0.02 },
    ],
    sustainable: '2027: 100% non-fossil fuel mandated (40% from 2024). Energy density ~2% lower — expect a touch more lift-and-coast and a recalibrated map.',
    recommendations: [
      status === 'short'
        ? `Projected burn ${projectedTotalL}L exceeds a sensible load — add lift-and-coast at T1 + the hard stop to claw back ${marginL < 0 ? Math.abs(marginL).toFixed(1) : '0.0'}L.`
        : `Carry ${startLoadL}L: covers ${projectedTotalL}L burn with a ${marginL}L margin (${status}).`,
      'Lift-and-coast at T1 and the heavy stop only — the medium corner costs more time than it saves.',
      `Fuel weight costs ~${startEndDeltaS}s/lap at the start; the bike is fastest in the final third as the tank empties.`,
      'Save in the middle stint (laps 60%→end-2), spend it in the last two laps when track position is decided.',
    ],
    verdict: `${raceLaps} laps, ${perLapL}L/lap → ${projectedTotalL}L. Start load ${startLoadL}L leaves a ${marginL}L margin (${status}). The real cost is weight: ~${startEndDeltaS}s/lap heavier at lights-out, so build the gap late, not early.`,
    punchline: `The lightest bike on track is the one crossing the line last lap — make it count.`,
    confidence: 0.83,
  };
}
