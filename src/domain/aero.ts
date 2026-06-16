/**
 * aero.ts — KDD Aerodynamics Lab.
 *
 * Aero is the modern MotoGP differentiator and a pure trade-off: every gram of
 * downforce that helps you turn and stop costs drag on the straight. This module
 * rates how aero-sensitive the circuit is, ranks the downforce packages with
 * their top-speed cost, splits the aero balance front/rear, models the dirty-air
 * loss when following, attributes the gain corner by corner and makes the call.
 *
 *   KDD doesn't just measure downforce — it tells you what it's worth here, and
 *   what it costs you on the straight.
 *
 * Deterministic aero model derived from circuit shape. Honest: a representative
 * aero picture, not a CFD/wind-tunnel run.
 */
import { severityColor } from './palette';

export interface AeroPackage { id: string; name: string; downforce: number; drag: number; topSpeedKmh: number; chosen: boolean; note: string }
export interface AeroCorner { corner: string; type: 'slow' | 'medium' | 'fast'; aeroGain: number; note: string }

export interface Aero {
  combo: string; circuit: string; sensitivity: number; sensitivityLabel: string;
  packages: AeroPackage[];
  balance: { frontPct: number; rearPct: number; note: string };
  dirtyAir: { downforceLossPct: number; overtakeDifficulty: 'low' | 'medium' | 'high'; note: string };
  corners: AeroCorner[];
  topSpeedTrapKmh: number;
  recommendations: string[];
  verdict: string; punchline: string; confidence: number;
}

/** Overtake difficulty shares the canonical low/medium/high severity scale. */
export function difficultyColor(d: Aero['dirtyAir']['overtakeDifficulty']): string { return severityColor(d); }
const TYPE_COLOR: Record<AeroCorner['type'], string> = { slow: 'var(--text-muted)', medium: 'var(--yellow)', fast: 'var(--green)' };
export function aeroTypeColor(t: AeroCorner['type']): string { return TYPE_COLOR[t]; }

export function buildAero(rider: string, bike: string, circuit: string, turns: number, mainStraightKm: number | null): Aero {
  const straight = mainStraightKm ?? 0.9;
  // Many fast corners → aero matters; a long straight pulls toward low downforce.
  const fastBias = Math.min(10, Math.round(turns * 0.45));
  const sensitivity = Math.min(10, Math.max(3, fastBias));
  const sensitivityLabel = sensitivity >= 8 ? 'Aero-critical' : sensitivity >= 6 ? 'High' : 'Moderate';
  const longStraight = straight >= 1.0;
  const baseTop = Math.round(335 + straight * 20);

  const packages: AeroPackage[] = [
    { id: 'high', name: 'High downforce', downforce: 100, drag: 100, topSpeedKmh: baseTop - 8, chosen: !longStraight && sensitivity >= 6, note: 'Best turn-in + anti-wheelie; costs ~8 km/h on the straight.' },
    { id: 'med', name: 'Medium', downforce: 82, drag: 88, topSpeedKmh: baseTop - 3, chosen: !( !longStraight && sensitivity >= 6) && !longStraight, note: 'Balanced — the safe default.' },
    { id: 'low', name: 'Low drag', downforce: 64, drag: 74, topSpeedKmh: baseTop + 4, chosen: longStraight, note: 'Top speed + slipstream defence; gives up front grip mid-corner.' },
  ];
  // Guarantee exactly one chosen.
  if (!packages.some(p => p.chosen)) packages[1].chosen = true;
  const chosen = packages.find(p => p.chosen)!;

  return {
    combo: `${rider} · ${bike} · ${circuit}`,
    circuit, sensitivity, sensitivityLabel,
    packages,
    balance: {
      frontPct: 46, rearPct: 54,
      note: 'Slightly rear-biased to calm the rear on power; move 2% forward if the front pushes mid-corner.',
    },
    dirtyAir: {
      downforceLossPct: 28, overtakeDifficulty: sensitivity >= 8 ? 'high' : 'medium',
      note: 'You lose ~28% front downforce within 0.5s of the bike ahead — the front washes out in fast corners, so pass into the slow ones, not the quick ones.',
    },
    corners: [
      { corner: `T${Math.max(7, Math.round(turns * 0.6))} · fast sweep`, type: 'fast', aeroGain: 0.21, note: 'Where downforce pays — most lap time gain.' },
      { corner: `T${Math.max(4, Math.round(turns * 0.35))} · medium`, type: 'medium', aeroGain: 0.09, note: 'Moderate aero contribution.' },
      { corner: 'T1 · slow hairpin', type: 'slow', aeroGain: 0.03, note: 'Mostly mechanical grip; aero barely helps.' },
      { corner: 'Braking zones', type: 'fast', aeroGain: 0.12, note: 'Downforce stabilises the front under heavy braking.' },
    ],
    topSpeedTrapKmh: chosen.topSpeedKmh,
    recommendations: [
      `${sensitivityLabel} circuit (${sensitivity}/10) — run the ${chosen.name.toLowerCase()} package; trap speed ~${chosen.topSpeedKmh} km/h.`,
      longStraight ? 'Long straight: protect top speed for the slipstream, accept softer mid-corner front.' : 'No dominant straight: take the downforce, the fast corners pay it back.',
      'Hold a slight rear aero bias; only shift forward if the front pushes mid-corner.',
      'Following in dirty air: do not attack fast corners — set up the pass into the slow ones.',
    ],
    verdict: `${sensitivityLabel} for aero. ${longStraight ? 'The long straight tips it to low drag — keep the top speed and defend with the tow.' : `Take the ${chosen.name.toLowerCase()} package: the ${packages[0].topSpeedKmh}-vs-${packages[2].topSpeedKmh} km/h top-speed spread is worth less than the 0.2s the fast corners give back.`}`,
    punchline: `Downforce is free lap time everywhere except the one place everyone is watching: the speed trap.`,
    confidence: 0.82,
  };
}
