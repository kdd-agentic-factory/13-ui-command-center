/**
 * circuitDatasets.ts — per-circuit datasets beyond the handcrafted Mugello one.
 *
 * Mugello keeps its curated corner telemetry inside the pages; circuits listed
 * here get a NAMED corner set plus deterministically generated metrics
 * (seeded by circuit + corner index — same values on every run, like the demo
 * sessions). Circuits in neither group keep showing the Mugello reference
 * sample with the DATA INTEGRITY warning.
 */
import { mulberry32 } from './demoSessions';
import type { CircuitRecord } from './circuits';
import { MUGELLO_CIRCUIT } from './sessionTruth';

export interface CornerSeed {
  n: number;
  name: string;
  dir: 'L' | 'R';
}

/** Real corner names per circuit (Jarama: 13 corners, clockwise). */
export const CORNER_SETS: Record<string, CornerSeed[]> = {
  jarama: [
    { n: 1, name: 'Nuvolari', dir: 'R' },
    { n: 2, name: 'Varzi', dir: 'L' },
    { n: 3, name: 'Le Mans', dir: 'R' },
    { n: 4, name: 'Farina', dir: 'R' },
    { n: 5, name: 'Pegaso', dir: 'R' },
    { n: 6, name: 'La Virgen', dir: 'L' },
    { n: 7, name: 'Bugatti', dir: 'R' },
    { n: 8, name: 'Monza', dir: 'R' },
    { n: 9, name: 'Ascari', dir: 'L' },
    { n: 10, name: 'Túnel', dir: 'R' },
    { n: 11, name: 'Horquilla', dir: 'R' },
    { n: 12, name: 'Rampa', dir: 'L' },
    { n: 13, name: 'Portago', dir: 'R' },
  ],
};

/** True when the circuit has its OWN dataset (curated or named+generated). */
export function hasDataset(circuitId: string): boolean {
  return circuitId === MUGELLO_CIRCUIT.id || circuitId in CORNER_SETS;
}

/** Race distance for the active circuit (~105 race km, Mugello canonical 23). */
export function activeRaceLaps(circuit: Pick<CircuitRecord, 'id' | 'lengthKm'>): number {
  if (circuit.id === MUGELLO_CIRCUIT.id) return MUGELLO_CIRCUIT.raceLaps;
  return Math.max(15, Math.round(105 / circuit.lengthKm));
}

// ── Deterministic corner metrics ─────────────────────────────────────────────

export interface GeneratedCorner {
  n: number;
  name: string;
  dir: 'L' | 'R';
  entry: number; apex: number; exit: number;
  lossS: number;
  entrySpeed: number; apexSpeed: number; exitSpeed: number;
  maxLean: number; rearGrip: number;
  brakeDeltaM: number; throttleDeltaS: number;
  issue: string; rec: string;
}

const ISSUES: Array<[string, string]> = [
  ['On target', 'Keep it. Reference-lap quality.'],
  ['Late throttle pickup on exit', 'Open throttle earlier once lean drops below 50°.'],
  ['Brake point too deep', 'Brake 4–6 m earlier and release progressively.'],
  ['Mid-corner line drifts wide', 'Commit to a later apex; sacrifice entry for drive.'],
  ['Rear grip drops under drive', 'Short-shift on exit to keep rear slip under 10%.'],
  ['Entry speed below reference', 'Carry 3–5 km/h more entry; the front has margin.'],
];

function seedFrom(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) { h ^= id.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** Same circuit → same corners, every run (pure function of the circuit id). */
export function generateCorners(circuitId: string): GeneratedCorner[] {
  const seeds = CORNER_SETS[circuitId] ?? [];
  return seeds.map(seed => {
    const rand = mulberry32(seedFrom(circuitId) + seed.n * 7919);
    const quality = 0.55 + rand() * 0.45;            // 0.55–1.0 → scores
    const slow = rand() < 0.35;                       // slow vs fast corner
    const apexSpeed = Math.round(slow ? 70 + rand() * 40 : 120 + rand() * 50);
    const entrySpeed = Math.round(apexSpeed + 40 + rand() * 80);
    const exitSpeed = Math.round(apexSpeed + 30 + rand() * 50);
    const lossS = Math.round((1 - quality) * 0.32 * 1000) / 1000;
    const issueIdx = quality > 0.92 ? 0 : 1 + Math.floor(rand() * (ISSUES.length - 1));
    return {
      ...seed,
      entry: Math.round(60 + quality * 38),
      apex: Math.round(58 + quality * 38),
      exit: Math.round(56 + quality * 40),
      lossS,
      entrySpeed, apexSpeed, exitSpeed,
      maxLean: Math.round(44 + rand() * 14),
      rearGrip: Math.round(74 + quality * 22),
      brakeDeltaM: Math.round((rand() - 0.4) * 12),
      throttleDeltaS: Math.round(rand() * 0.35 * 100) / 100,
      issue: ISSUES[issueIdx][0],
      rec: ISSUES[issueIdx][1],
    };
  });
}
