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


// ── Real traced layouts (approximate, 64×64 plan view) ───────────────────────
// Hand-traced from the published circuit maps — recognisably the REAL layout
// (Mugello: bottom main straight → San Donato right → Luco/Poggio loop →
// Materassi/Borgo → Casanova-Savelli esses → Arrabbiata 1-2 → Scarperia/
// Palagio → Correntaio → Biondetti → Bucine back onto the straight).
// Not survey data: meshLoaded stays false and the asset label says so.
export const REAL_OUTLINES: Record<string, Array<[number, number]>> = {
  mugello: [
    [10, 52], [22, 52.5], [34, 53], [44, 53], [50, 52],          // main straight (S/F → east)
    [55, 50], [58, 46], [58.5, 42],                               // T1 San Donato (right, climbing)
    [56, 38], [55, 34], [56.5, 30], [59, 27],                     // T2 Luco → T3 Poggio Secco
    [59.5, 23], [57, 20], [53, 18.5],                             // T4 Materassi
    [49, 19], [46, 21], [43, 23],                                 // T5 Borgo San Lorenzo
    [39, 23.5], [35, 21.5], [32, 18.5],                           // T6 Casanova → T7 Savelli (esses)
    [28, 16], [24, 15], [20.5, 16.5],                             // T8 Arrabbiata 1
    [17.5, 19], [15.5, 22.5],                                     // T9 Arrabbiata 2
    [13, 24.5], [10, 24], [8, 21.5],                              // T10 Scarperia → T11 Palagio
    [6, 24], [5, 28], [5.5, 32],                                  // T12 Correntaio (west loop)
    [7, 35.5], [9, 38], [9.5, 41.5],                              // T13-T14 Biondetti
    [8, 44.5], [7.5, 48], [8.5, 50.8],                            // T15 Bucine (long left onto straight)
  ],
  jarama: [
    [10, 46], [22, 46.5], [34, 47], [44, 46.5],                   // main straight
    [50, 44], [53, 40], [52, 36],                                 // T1 Nuvolari (right)
    [49, 33], [49.5, 29], [52.5, 26],                             // T2 Varzi → T3 Le Mans
    [55, 23], [54.5, 19.5], [51, 18],                             // T4 Farina
    [47, 18.5], [44.5, 21], [42, 24],                             // T5 Pegaso
    [38.5, 25.5], [35, 24], [33, 21],                             // T6 La Virgen → T7 Bugatti
    [30, 18.5], [26, 18], [23, 20],                               // T8 Monza
    [21, 23.5], [18, 25.5], [14.5, 25],                           // T9 Ascari → T10 Túnel
    [11.5, 27], [10, 30.5], [10.5, 34],                           // T11 Horquilla
    [12.5, 37], [12, 40.5], [10, 43.5],                           // T12 Rampa → T13 Portago
  ],
};


/**
 * Sample the smoothed real outline as a closed polyline fitted to a box.
 * Returns n+1 points (last repeats the first) ready for SVG polylines or a
 * 3D ribbon centerline. Pure function — same circuit, same polyline.
 */
export function sampleOutline(
  circuitId: string, n: number, width: number, height: number, margin = 0,
): Array<[number, number]> {
  const raw = REAL_OUTLINES[circuitId];
  if (!raw) return [];
  const N = raw.length;
  const mid = (a: [number, number], b: [number, number]): [number, number] =>
    [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  // Quadratic segments: mid(i-1,i) → ctrl raw[i] → mid(i,i+1)
  const dense: Array<[number, number]> = [];
  for (let i = 0; i < N; i++) {
    const a = mid(raw[(i - 1 + N) % N], raw[i]);
    const c = raw[i];
    const b = mid(raw[i], raw[(i + 1) % N]);
    for (const t of [0, 1 / 3, 2 / 3]) {
      const u = 1 - t;
      dense.push([u * u * a[0] + 2 * u * t * c[0] + t * t * b[0],
                  u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]);
    }
  }
  // Pick n points evenly, then fit to the box (uniform scale, centered).
  const picked: Array<[number, number]> = Array.from({ length: n }, (_, i) =>
    dense[Math.floor((i / n) * dense.length)]);
  const xs = picked.map(p => p[0]), ys = picked.map(p => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const k = Math.min((width - 2 * margin) / (maxX - minX), (height - 2 * margin) / (maxY - minY));
  const ox = (width - k * (maxX - minX)) / 2, oy = (height - k * (maxY - minY)) / 2;
  const out = picked.map(([x, y]): [number, number] =>
    [Math.round((ox + (x - minX) * k) * 10) / 10, Math.round((oy + (y - minY) * k) * 10) / 10]);
  out.push(out[0]); // close the loop
  return out;
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
