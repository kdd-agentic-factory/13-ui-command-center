/**
 * dataCube.ts — Telemetry Data Cube & Semantic Zoom.
 *
 * Telemetry as a navigable cube, not loose charts:
 *
 *   Session → Lap → Sector → Corner → Phase → Channel
 *
 * A laps × corners delta matrix you can drill through, performance lenses that
 * re-colour the same data, a cause→effect chain, before/after and an automatic
 * data story. From the whole session to the exact millisecond where the lap is
 * lost. Deterministic; honest 1:57 rider-arc scale.
 */

export const CUBE_LAPS = [2, 3, 4, 5];
export const CUBE_CORNERS = ['T1', 'T7', 'T12', 'T15'];

export type CellState = 'gain' | 'stable' | 'moderate' | 'critical' | 'ai';

export interface CubeCell { lap: number; corner: string; delta: number; state: CellState; }

// delta = seconds lost at that corner vs the ideal (0 = on reference).
const MATRIX: Record<number, Record<string, number>> = {
  2: { T1: 0,    T7: 0.08, T12: 0.11, T15: 0.20 },
  3: { T1: 0.04, T7: 0.10, T12: 0.09, T15: 0.27 },
  4: { T1: 0.21, T7: 0.06, T12: 0.14, T15: 0.28 },
  5: { T1: 0,    T7: 0.12, T12: 0.10, T15: 0.31 },
};
// cells where the AI intervened with a recommendation
const AI_CELLS = new Set(['4:T15']);

export function cellState(delta: number, ai = false): CellState {
  if (ai) return 'ai';
  if (delta <= 0) return 'stable';
  if (delta < 0.12) return 'moderate';
  if (delta < 0.25) return 'critical';
  return 'critical';
}

const STATE_COLOR: Record<CellState, string> = {
  gain: 'var(--green)', stable: 'rgba(255,255,255,0.18)', moderate: 'var(--yellow)',
  critical: 'var(--accent)', ai: '#8B5CF6',
};
export function cellColor(s: CellState): string { return STATE_COLOR[s]; }

export interface Lens { id: string; label: string; desc: string; highlights: string[]; }
export const LENSES: Lens[] = [
  { id: 'performance', label: 'Performance', desc: 'Where I lose or gain time.', highlights: ['Time loss', 'Exit speed', 'Sector delta'] },
  { id: 'risk', label: 'Risk', desc: 'Where I approach the limit.', highlights: ['Near-misses', 'High lean + throttle', 'Grip drop'] },
  { id: 'tyre', label: 'Tyre', desc: 'Where I degrade the tyre most.', highlights: ['Thermal load', 'Rear slip', 'Cliff risk'] },
  { id: 'rider', label: 'Rider', desc: 'What I do as a rider.', highlights: ['Throttle timing', 'Brake release', 'Lean reliance', 'Line deviation'] },
  { id: 'setup', label: 'Setup', desc: 'What may be the bike.', highlights: ['Chatter', 'Rear slip', 'Rebound behaviour', 'Tyre pressure'] },
  { id: 'oracle', label: 'Oracle', desc: 'Where the AI recommends acting.', highlights: ['Pending verdicts', 'Validated fixes', 'Experiments'] },
];

export const HEATMAP_FILTERS = ['Time loss', 'Risk', 'Rear grip', 'Throttle timing', 'Brake point', 'Lean angle', 'Line deviation', 'Tyre temperature', 'Consistency'];
const HEATMAP_TOP: Record<string, string> = {
  'Time loss': 'T15 Bucine · repeated in 4/4 laps',
  Risk: 'T8/T9 Arrabbiata · high lean + tyre load',
  'Rear grip': 'T15 Bucine · slip 14% on exit',
  'Throttle timing': 'T15 Bucine · pickup 0.40s late',
  'Brake point': 'T1 San Donato · 9 m late (lap 4)',
  'Lean angle': 'T15 Bucine · 57° at pickup',
  'Line deviation': 'T12 Correntaio · variable entry',
  'Tyre temperature': 'Rear soft · cliff risk after L19',
  Consistency: 'T12 Correntaio · variable line',
};
export function heatmapTopIssue(filter: string): string { return HEATMAP_TOP[filter] ?? '—'; }

export interface CauseEffectStep { label: string; value: string; }
export interface BeforeAfter { before: Record<string, string>; after: Record<string, string>; improvement: string; }

export interface CubeViews {
  session: { bestLap: string; avgLap: string; consistency: string; mainLoss: string; primaryIssue: string };
  lap: (lap: number) => { lapTime: string; bestSector: string; worstSector: string; mainLoss: string; risk: string };
  corner: (corner: string) => { entry: string; apex: string; exit: string; issue: string; loss: string };
  phase: { throttlePickup: string; leanAtPickup: string; rearSlip: string; exitSpeed: string; target: string };
  channel: { throttle: string; lean: string; rearSlip: string; gear: string; rpm: string };
}

export interface DataCube {
  combo: string;
  cells: CubeCell[];
  views: CubeViews;
  lenses: Lens[];
  filters: string[];
  causeEffect: CauseEffectStep[];
  beforeAfter: BeforeAfter;
  dataStory: string;
}

export function buildDataCube(rider: string, bike: string, circuit: string): DataCube {
  const cells: CubeCell[] = [];
  for (const lap of CUBE_LAPS) {
    for (const corner of CUBE_CORNERS) {
      const delta = MATRIX[lap][corner];
      const ai = AI_CELLS.has(`${lap}:${corner}`);
      cells.push({ lap, corner, delta, state: cellState(delta, ai) });
    }
  }

  return {
    combo: `${circuit} · ${rider} · ${bike}`,
    cells,
    views: {
      session: { bestLap: '1:57.842', avgLap: '1:58.316', consistency: '86%', mainLoss: 'T15 Bucine', primaryIssue: 'Late throttle + rear slip' },
      lap: (lap) => ({
        lapTime: lap === 5 ? '1:57.842' : lap === 4 ? '1:58.071' : lap === 3 ? '1:58.244' : '1:58.402',
        bestSector: 'Sector 2', worstSector: 'Sector 3',
        mainLoss: `T15 Bucine · +${MATRIX[lap].T15.toFixed(3)}s`,
        risk: MATRIX[lap].T15 >= 0.28 ? 'Medium-high' : 'Medium',
      }),
      corner: (corner) => corner === 'T15'
        ? { entry: 'OK', apex: 'Slightly late', exit: 'Critical loss', issue: 'Throttle opens 0.40s late while lean remains 57°.', loss: '+0.284s' }
        : corner === 'T1'
          ? { entry: 'Brake 9 m late', apex: 'OK', exit: 'OK', issue: 'Late brake point compromises rotation.', loss: '+0.21s (lap 4)' }
          : corner === 'T12'
            ? { entry: 'Variable', apex: 'OK', exit: 'Minor loss', issue: 'Inconsistent entry line lap to lap.', loss: '+0.10s' }
            : { entry: 'OK', apex: 'OK', exit: 'Rushed pickup', issue: 'Pickup on a loaded rear.', loss: '+0.08s' },
      phase: { throttlePickup: '0.40s late', leanAtPickup: '57°', rearSlip: '14%', exitSpeed: '184 km/h', target: '190 km/h' },
      channel: { throttle: 'Late ramp', lean: 'Above threshold', rearSlip: 'High', gear: 'Correct', rpm: 'Within target' },
    },
    lenses: LENSES,
    filters: HEATMAP_FILTERS,
    causeEffect: [
      { label: 'High lean at pickup', value: '57°' },
      { label: 'Throttle delayed', value: '+0.40s' },
      { label: 'Rear slip', value: '14%' },
      { label: 'Exit speed loss', value: '-6 km/h' },
      { label: 'Lap time loss', value: '+0.284s' },
    ],
    beforeAfter: {
      before: { 'Rear slip': '14%', 'Exit speed': '184 km/h', 'Throttle pickup': '0.40s late', Lap: '1:58.402' },
      after: { 'Rear slip': '9.8%', 'Exit speed': '190 km/h', 'Throttle pickup': '0.12s late', Lap: '1:57.842' },
      improvement: '-0.560s',
    },
    dataStory:
      'Lap 4 was the cleanest because Sector 2 was tidy and line consistency improved. ' +
      'The lap still lost 0.284s at T15 Bucine, created on the exit: lean stayed above 57°, ' +
      'throttle pickup was 0.40s late and rear slip reached 14%. ' +
      'Primary recommendation: pick the bike up earlier before applying throttle.',
  };
}
