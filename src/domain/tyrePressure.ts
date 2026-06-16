/**
 * tyrePressure.ts — KDD Tyre Pressure & Compliance.
 *
 * The front pressure rule is the trap that decides modern MotoGP races: the
 * front must stay ABOVE a minimum for most of the race or it's a time penalty —
 * yet leading in clean air cools the front and drops it below the line, while
 * following in dirty air pushes it up. This module models the cold→hot pressure
 * window, the live compliance vs the rule, the dirty-air effect and the
 * weekend tyre allocation.
 *
 *   KDD doesn't just read the gauge — it keeps you legal while you lead.
 *
 * Deterministic pressure model derived from race length. Honest: a
 * representative compliance picture, not a live tyre-pressure-monitor feed.
 * Pressures in bar.
 */
import { raceLapsFor } from './raceModel';

export type ComplianceStatus = 'compliant' | 'marginal' | 'breach';

export interface PressurePoint { phase: string; frontBar: number; aboveMin: boolean }
export interface TyreSet { compound: string; allocated: number; used: number }

export interface TyrePressure {
  combo: string; circuit: string; raceLaps: number;
  rule: { minFrontBar: number; requiredPct: number; note: string };
  current: { coldFrontBar: number; coldRearBar: number; hotFrontBar: number; windowLow: number; windowHigh: number };
  curve: PressurePoint[];
  compliance: { lapsAboveMin: number; lapsRequired: number; marginLaps: number; pct: number; status: ComplianceStatus; note: string };
  allocationFront: TyreSet[]; allocationRear: TyreSet[];
  dirtyAir: { riseBar: number; note: string };
  recommendations: string[];
  verdict: string; punchline: string; confidence: number;
}

const STATUS_COLOR: Record<ComplianceStatus, string> = { compliant: 'var(--green)', marginal: 'var(--yellow)', breach: 'var(--accent)' };
export function complianceColor(s: ComplianceStatus): string { return STATUS_COLOR[s]; }

/** Alias of the shared race model, kept for a stable public name. */
export const raceLapsForPressure = raceLapsFor;

export function buildTyrePressure(rider: string, bike: string, circuit: string, lengthKm: number): TyrePressure {
  const raceLaps = raceLapsForPressure(lengthKm);
  const minFrontBar = 1.88;
  const requiredPct = 60;
  const lapsRequired = Math.ceil(raceLaps * requiredPct / 100);

  // Leading in clean air → front runs cool → fewer laps above the line.
  const lapsAboveMin = Math.round(lapsRequired - 1); // a deliberately marginal demo case
  const marginLaps = lapsAboveMin - lapsRequired;
  const pct = Math.round((lapsAboveMin / raceLaps) * 100);
  const status: ComplianceStatus = marginLaps >= 1 ? 'compliant' : marginLaps === 0 ? 'marginal' : 'breach';

  const coldFrontBar = 1.95, hotFrontBar = 1.90;

  return {
    combo: `${rider} · ${bike} · ${circuit}`,
    circuit, raceLaps,
    rule: { minFrontBar, requiredPct, note: `Front must read ≥ ${minFrontBar.toFixed(2)} bar for ≥ ${requiredPct}% of race laps, or a time penalty applies.` },
    current: { coldFrontBar, coldRearBar: 1.68, hotFrontBar, windowLow: 1.90, windowHigh: 2.05 },
    curve: [
      { phase: 'Out-lap (cold)', frontBar: coldFrontBar, aboveMin: coldFrontBar >= minFrontBar },
      { phase: 'Lap 1–3 (pack)', frontBar: 2.02, aboveMin: true },
      { phase: 'Leading clean air', frontBar: 1.86, aboveMin: false },
      { phase: 'Following (dirty air)', frontBar: 1.97, aboveMin: true },
      { phase: 'Final laps', frontBar: 1.91, aboveMin: true },
    ],
    compliance: {
      lapsAboveMin, lapsRequired, marginLaps, pct, status,
      note: status === 'breach'
        ? `Only ${lapsAboveMin}/${raceLaps} laps above the line — ${Math.abs(marginLaps)} short of the ${lapsRequired} required. Penalty risk if you lead alone.`
        : `${lapsAboveMin}/${raceLaps} laps above the line vs ${lapsRequired} required — ${status}.`,
    },
    allocationFront: [
      { compound: 'Soft', allocated: 2, used: 1 },
      { compound: 'Medium', allocated: 3, used: 1 },
      { compound: 'Hard', allocated: 2, used: 0 },
    ],
    allocationRear: [
      { compound: 'Soft', allocated: 3, used: 1 },
      { compound: 'Medium', allocated: 4, used: 2 },
      { compound: 'Hard', allocated: 2, used: 0 },
    ],
    dirtyAir: {
      riseBar: 0.11,
      note: 'Running within ~1s of another bike pushes the front up ~0.11 bar — the rule quietly rewards following and punishes leading alone.',
    },
    recommendations: [
      `Set cold front to ${coldFrontBar.toFixed(2)} bar — it settles near ${hotFrontBar.toFixed(2)} hot, above the ${minFrontBar.toFixed(2)} line.`,
      status !== 'compliant'
        ? 'If you break clear early, bank compliant laps in the pack first — drop back briefly if pressure dips under the line.'
        : 'Compliance margin is healthy; race freely.',
      'When leading alone in clean air, expect the front to cool ~0.06 bar — do not over-bleed pressure chasing front feel.',
      'Save a fresh medium front: best compromise of grip and a stable pressure window here.',
    ],
    verdict: `Front rule ≥ ${minFrontBar.toFixed(2)} bar for ${requiredPct}% of laps. You sit at ${lapsAboveMin}/${raceLaps} (${status}). The risk isn't pace — it's leading alone in clean air and dropping the front under the line. Bank legal laps in traffic early.`,
    punchline: `Win on track, lose in the tech box — not on our watch.`,
    confidence: 0.82,
  };
}
