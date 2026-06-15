/**
 * trackSurface.ts — Track Surface Intelligence.
 *
 * Treats the circuit as a living surface: per-corner grip, thermal load and
 * risk; a selectable layer model; the track-evolution windows; a Grip Budget
 * (how the available grip is spent on lean / throttle / degradation) and a
 * racing-line adaptation for the grip available right now.
 *
 *   There is no single ideal line — there is an ideal line for the grip
 *   available at that moment.
 *
 * Deterministic and personalised; estimated channels flagged on GPS-only bikes.
 */

export type GripLevel = 'High' | 'Medium-high' | 'Medium' | 'Variable' | 'Dropping';

export interface CornerGrip {
  corner: string;
  grip: GripLevel;
  gripPct: number;        // 0–100
  thermalLoad: 'Low' | 'Medium' | 'High';
  risk: string;
  recommendation: string;
}

export interface EvolutionWindow {
  laps: string;
  state: 'stabilizing' | 'peak' | 'dropping' | 'risk';
  note: string;
}

export interface GripBudget {
  corner: string;
  lean: number;          // % of grip
  throttle: number;      // %
  degradation: number;   // %
  margin: number;        // % remaining
  status: 'Healthy' | 'Low' | 'Critical';
  conclusion: string;
}

export interface LineAdaptation {
  normalLine: string;
  condition: string;
  recommendedLine: string[];
  reason: string;
}

export interface SurfaceAlert {
  zone: string;
  risk: string;
  trigger: string[];
  action: string;
}

export interface SurfaceOracle {
  constraint: string;
  decision: string;
  action: string;
  confidence: number;
}

export interface TrackSurface {
  combo: string;
  overallGrip: number;          // 0–100
  bestWindow: string;
  degradationWindow: string;
  criticalZones: string[];
  mainConstraint: string;
  recommendedAdaptation: string;
  confidence: number;
  limitations: string[];
  layers: string[];
  corners: CornerGrip[];
  evolution: EvolutionWindow[];
  gripBudgets: GripBudget[];
  lineAdaptation: LineAdaptation;
  alerts: SurfaceAlert[];
  oracle: SurfaceOracle;
}

const GRIP_COLOR: Record<GripLevel, string> = {
  High: 'var(--green)', 'Medium-high': '#7CD074', Medium: 'var(--yellow)', Variable: '#FF6A00', Dropping: 'var(--accent)',
};
export function gripColor(g: GripLevel): string { return GRIP_COLOR[g]; }
export function budgetColor(s: GripBudget['status']): string {
  return s === 'Critical' ? 'var(--accent)' : s === 'Low' ? 'var(--yellow)' : 'var(--green)';
}

export const SURFACE_LAYERS = [
  'Grip level', 'Track temperature', 'Rubber build-up', 'Tyre load',
  'Humidity risk', 'Wind effect', 'Dirty zones', 'Braking stress', 'Exit traction', 'Risk zones',
];

export function buildTrackSurface(rider: string, bike: string, circuit: string, session: string, telemetryLimited = false): TrackSurface {
  const est = telemetryLimited ? ' (estimated)' : '';
  return {
    combo: `${circuit} · ${rider} · ${bike} · ${session}`,
    overallGrip: 82,
    bestWindow: 'Laps 3–5',
    degradationWindow: 'From lap 6 onward',
    criticalZones: ['T15 Bucine', 'T12 Correntaio', 'T8/T9 Arrabbiata'],
    mainConstraint: 'Rear grip under throttle while lean remains high (Sector 3 rear-limited).',
    recommendedAdaptation: 'Earlier bike pickup, smoother throttle ramp and rear hot-pressure validation.',
    confidence: 84,
    limitations: [
      'No real-time asphalt temperature sensors.',
      `Rear tyre temperature ${telemetryLimited ? 'and slip ' : ''}estimated.`,
      'Wind data external.',
    ],
    layers: SURFACE_LAYERS,
    corners: [
      { corner: 'T1 San Donato', grip: 'High', gripPct: 88, thermalLoad: 'Medium', risk: 'Medium under late braking', recommendation: 'Stable — brake earlier with progressive release.' },
      { corner: 'T8/T9 Arrabbiata', grip: 'Medium-high', gripPct: 76, thermalLoad: 'High', risk: 'Edge tyre overload', recommendation: 'Ease mid-corner load; avoid extra steering correction.' },
      { corner: 'T12 Correntaio', grip: 'Variable', gripPct: 64, thermalLoad: 'Medium', risk: 'Front instability on entry', recommendation: 'Tighter entry; brake 3–5 m earlier for two laps to validate.' },
      { corner: 'T15 Bucine', grip: 'Dropping', gripPct: 52, thermalLoad: 'High', risk: `Rear tyre stress high${est}`, recommendation: 'Protect exit drive: pick the bike up before throttle (<54° lean).' },
    ],
    evolution: [
      { laps: 'Lap 1–2', state: 'stabilizing', note: 'Track still stabilizing. Grip medium, tyres below optimal window.' },
      { laps: 'Lap 3–5', state: 'peak', note: 'Best performance window. Grip high, lap-time potential highest.' },
      { laps: 'Lap 6–8', state: 'dropping', note: 'Rear grip starts dropping. T15 Bucine and T12 Correntaio become critical.' },
      { laps: 'Lap 9+', state: 'risk', note: 'Risk rises. Throttle pickup should be smoother; avoid aggressive exit drive.' },
    ],
    gripBudgets: [
      { corner: 'T15 Bucine', lean: 58, throttle: 31, degradation: 8, margin: 3, status: 'Critical', conclusion: 'Not enough grip budget to open throttle aggressively at 57° lean.' },
      { corner: 'T8/T9 Arrabbiata', lean: 52, throttle: 28, degradation: 7, margin: 13, status: 'Low', conclusion: 'Edge-limited — hold a steady line, no extra correction.' },
      { corner: 'T12 Correntaio', lean: 40, throttle: 26, degradation: 6, margin: 28, status: 'Healthy', conclusion: 'Margin available — the limiter here is entry consistency, not grip.' },
      { corner: 'T1 San Donato', lean: 34, throttle: 30, degradation: 5, margin: 31, status: 'Healthy', conclusion: 'Plenty of budget — focus on the brake point, not grip.' },
    ],
    lineAdaptation: {
      normalLine: 'Late apex with strong exit drive.',
      condition: 'Rear grip dropping on exit (Sector 3 rear-limited).',
      recommendedLine: ['Earlier rotation', 'Pick the bike up sooner', 'Reduce lean before throttle', 'Sacrifice minimal mid-corner speed to protect the exit'],
      reason: 'Current grip budget does not support aggressive throttle at high lean.',
    },
    alerts: [
      { zone: 'T8/T9 Arrabbiata', risk: 'High edge-load on rear tyre', trigger: ['Lean sustained above threshold', 'Rear thermal load rising', 'Grip margin dropping'], action: 'Avoid additional steering correction; keep throttle smooth.' },
      { zone: 'T12 Correntaio', risk: 'Grip variability increasing', trigger: ['Possible temperature drop or tyre wear'], action: 'Brake 3–5 m earlier for two laps and validate stability.' },
    ],
    oracle: {
      constraint: 'The main constraint is no longer rider timing — it is rear grip availability in Sector 3.',
      decision: 'Do not add power or chase earlier throttle aggressively.',
      action: 'Use a smoother throttle ramp and validate rear hot pressure after the stint.',
      confidence: 86,
    },
  };
}
