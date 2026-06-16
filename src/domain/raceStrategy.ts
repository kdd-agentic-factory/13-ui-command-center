/**
 * raceStrategy.ts — KDD Race Strategy Command.
 *
 * The pit-wall decision surface: from telemetry to a defensible race call.
 * It sizes the race, models tyre degradation lap-by-lap, finds the pit /
 * flag-to-flag window, ranks the strategy options, runs the undercut/overcut
 * maths against a named rival, arms the weather trigger that flips the plan,
 * lays out a push/manage pace plan and the live "if X then Y" decision rules.
 *
 *   KDD doesn't just show you the gap — it tells you what to do about it,
 *   and proves why.
 *
 * Deterministic model derived from circuit length + turns. Honest: this is a
 * representative strategy model, not a live timing / weather radar feed.
 */
import { raceLapsFor } from './raceModel';
import { severityColor } from './palette';

export type Risk = 'low' | 'medium' | 'high';

export interface TyreCompound {
  name: string; position: 'Front' | 'Rear'; degPerLap: number; cliffLap: number; window: string; note: string;
}
export interface DegPoint { lap: number; paceDelta: number } // s/lap lost vs fresh
export interface StrategyOption {
  id: string; name: string; stops: number; projectedDelta: number; risk: Risk; recommended: boolean; note: string;
}
export interface RivalMove {
  rival: string; gap: number; trend: 'closing' | 'stable' | 'opening';
  move: 'undercut' | 'overcut' | 'hold'; gainPerLap: number; where: string; verdict: string;
}
export interface WeatherTrigger { condition: string; probability: number; action: string; byLap: number; armed: boolean }
export interface PhasePlan { phase: string; laps: string; target: string; mode: 'push' | 'manage' | 'attack' }
export interface DecisionTrigger { when: string; then: string; priority: Risk }

export interface RaceStrategy {
  combo: string;
  circuit: string; lengthKm: number; raceLaps: number; raceKm: number;
  verdict: string; punchline: string; recommendedStrategy: string; confidence: number;
  compounds: TyreCompound[];
  degCurve: DegPoint[];
  pitWindow: { openLap: number; closeLap: number; optimalLap: number; reason: string };
  options: StrategyOption[];
  rival: RivalMove;
  weather: WeatherTrigger;
  phasePlan: PhasePlan[];
  triggers: DecisionTrigger[];
  contingency: string[];
}

/** Risk shares the canonical low/medium/high severity scale. */
export function riskColor(r: Risk): string { return severityColor(r); }

/** Re-exported from the shared race model so callers/tests keep a stable import. */
export { raceLapsFor };

export function buildRaceStrategy(rider: string, bike: string, circuit: string, lengthKm: number, turns: number): RaceStrategy {
  const raceLaps = raceLapsFor(lengthKm);
  const raceKm = Math.round(raceLaps * lengthKm * 10) / 10;

  // Rear deg dominates exit + lap time; cliff a few laps before the flag.
  const degPerLap = Math.round((0.05 + turns * 0.0035) * 1000) / 1000; // s/lap
  const cliffLap = raceLaps - 4;
  const degCurve: DegPoint[] = Array.from({ length: raceLaps }, (_, i) => {
    const lap = i + 1;
    const base = degPerLap * i;
    const cliff = lap > cliffLap ? (lap - cliffLap) * degPerLap * 1.8 : 0;
    return { lap, paceDelta: Math.round((base + cliff) * 100) / 100 };
  });

  const optimalLap = Math.round(raceLaps * 0.62);

  return {
    combo: `${rider} · ${bike} · ${circuit}`,
    circuit, lengthKm, raceLaps, raceKm,
    verdict: `Soft front / medium rear, manage rear edge from lap ${Math.round(raceLaps * 0.55)} — the rear cliff, not the front, decides this race.`,
    punchline: `Win it on tyre life, not on lap 1.`,
    recommendedStrategy: '0-stop slick · rear-life managed · flag-to-flag armed',
    confidence: 0.88,
    compounds: [
      { name: 'Soft', position: 'Front', degPerLap: degPerLap * 0.6, cliffLap: raceLaps - 2, window: `Full race`, note: 'Best front feel into braking; holds to the flag here.' },
      { name: 'Medium', position: 'Rear', degPerLap, cliffLap, window: `to lap ${cliffLap}`, note: 'Balanced — recommended. Edge grip fades after the cliff.' },
      { name: 'Soft', position: 'Rear', degPerLap: degPerLap * 1.35, cliffLap: cliffLap - 4, window: `to lap ${cliffLap - 4}`, note: 'Early pace, big drop — only if you can break the tow early.' },
      { name: 'Hard', position: 'Rear', degPerLap: degPerLap * 0.7, cliffLap: raceLaps, window: 'Full race', note: 'Survives but slow to switch on; risky if track temp drops.' },
    ],
    degCurve,
    pitWindow: {
      openLap: optimalLap - 3, closeLap: optimalLap + 3, optimalLap,
      reason: `Dry race → no stop. Window shown is the flag-to-flag swap window if rain arrives; lap ${optimalLap} balances track position vs a wet track filling up.`,
    },
    options: [
      { id: 'zero', name: '0-stop slick (manage rear)', stops: 0, projectedDelta: 0, risk: 'medium', recommended: true, note: 'Fastest if you protect the rear past the cliff. Baseline.' },
      { id: 'soft-attack', name: 'Soft rear early attack', stops: 0, projectedDelta: 2.4, risk: 'high', recommended: false, note: 'Build a gap in the first third, hang on. Loses if the cliff hits before the gap is safe.' },
      { id: 'hard-defensive', name: 'Hard rear defensive', stops: 0, projectedDelta: 3.1, risk: 'low', recommended: false, note: 'Safe to the flag, no late drama — but concedes the first laps.' },
      { id: 'ftf', name: 'Flag-to-flag (bike swap)', stops: 1, projectedDelta: 18.0, risk: 'high', recommended: false, note: 'Only on a rain trigger — armed below, not active.' },
    ],
    rival: {
      rival: 'Bagnaia (Ducati)', gap: 0.9, trend: 'closing', move: 'overcut', gainPerLap: 0.12,
      where: `T${Math.max(2, Math.round(turns * 0.45))} entry → his rear lights up 2 laps before yours`,
      verdict: `Don't fight lap 1. Hold the tow, let his soft rear cook, attack from lap ${Math.round(raceLaps * 0.7)}. Overcut beats undercut by ~0.4s here.`,
    },
    weather: {
      condition: 'Rain front from sector 3', probability: 0.35, action: 'Switch to flag-to-flag — call the wet bike to pit lane', byLap: optimalLap,
      armed: true,
    },
    phasePlan: [
      { phase: 'Launch', laps: `1–2`, target: 'Track position, no hero moves', mode: 'attack' },
      { phase: 'Build', laps: `3–${Math.round(raceLaps * 0.45)}`, target: `${(degCurve[Math.round(raceLaps * 0.3)]?.paceDelta ?? 0) >= 0 ? 'Hold reference pace' : 'Push'} · protect front`, mode: 'push' },
      { phase: 'Manage', laps: `${Math.round(raceLaps * 0.45) + 1}–${cliffLap}`, target: 'Save rear edge · short-shift on exit', mode: 'manage' },
      { phase: 'Sprint', laps: `${cliffLap + 1}–${raceLaps}`, target: 'Past the cliff — spend what is left', mode: 'attack' },
    ],
    triggers: [
      { when: `Rear drop > ${(degPerLap * 1.5).toFixed(2)} s/lap before lap ${cliffLap}`, then: 'Switch to manage mode now, defend track position', priority: 'high' },
      { when: `Rain probability crosses 50% before lap ${optimalLap}`, then: 'Arm flag-to-flag, ready wet bike, watch sector 3', priority: 'high' },
      { when: 'Rival gap < 0.4s into final third', then: 'Cover the inside at the heavy-braking zone, hold the line', priority: 'medium' },
      { when: 'Front temp below window after a safety-car', then: 'One warm-up lap of weave + brake before re-attacking', priority: 'medium' },
    ],
    contingency: [
      'Safety car: pit only if it coincides with the rain trigger — otherwise track position wins.',
      'Long lap penalty: take it before the cliff, never after — deg makes recovery impossible late.',
      'Rear cliff arrives early: drop to defensive lines, concede ~0.3s/lap, hold P-position to the flag.',
    ],
  };
}
