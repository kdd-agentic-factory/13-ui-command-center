/**
 * simLab.ts — Sim-to-Real Racing Lab.
 *
 * KDD rehearses a stint BEFORE going out: it simulates a scenario (setup /
 * tyres / track temp / stint length / rider focus), generates the EXPECTED
 * telemetry signature, plans virtual runs, then — after the real stint —
 * compares predicted vs actual and reports the model error so the twin learns.
 *
 *   Test virtually. Validate on track. Learn automatically.
 *
 * Composes the Scenario Sandbox twin model for the predicted lap/risk.
 * Deterministic. Synthetic telemetry is clearly the EXPECTED signature, not
 * measured data.
 */
import { evaluateScenario, fmtLap, DEFAULT_LEVERS } from './scenarioSandbox';

export interface SimScenario {
  setup: string; tyres: string; trackTempC: number; stintLaps: number; riderFocus: string;
  predictedRearSlip: string; exitSpeedDelta: string; lapGain: string; riskDelta: string; confidence: number;
}
export interface SignatureRow { channel: string; before: string; after: string }
export interface SimVsRealRow { metric: string; predicted: string; actual: string; ok: boolean }
export interface PlannerOption { id: string; name: string; expectedGain: string; risk: string; recommended: boolean; note: string }
export interface VirtualRun { n: number; name: string; objective: string; risk: string }
export interface SetupAB { a: string; b: string; diff: string[]; recommendation: string; doNotChange: string[] }
export interface TyreSimRow { compound: string; window: string; cliff: string; bestFor: string }
export interface FatigueSim { stintLaps: number; effects: string[]; adjustment: string }
export interface RiskSim { fastestGain: string; fastestRisk: string; saferGain: string; saferRisk: string; recommendation: string }
export interface SimGhost { type: string; target: string; predictedLap: string; instruction: string }

export interface SimLab {
  combo: string;
  objective: string;
  confidence: number;
  recommendedTest: string;
  predictedLap: string;
  scenario: SimScenario;
  signature: SignatureRow[];
  simVsReal: SimVsRealRow[];
  modelError: 'Low' | 'Medium' | 'High';
  validationStatus: string;
  planner: PlannerOption[];
  virtualDay: VirtualRun[];
  setupAB: SetupAB;
  tyres: TyreSimRow[];
  fatigue: FatigueSim;
  risk: RiskSim;
  ghost: SimGhost;
  oracleVerdict: string;
  missionName: string;
}

export function buildSimLab(rider: string, bike: string, circuit: string, session: string, telemetryLimited = false): SimLab {
  // Predicted lap/risk from the twin model with the proposed correction.
  const proposed = { ...DEFAULT_LEVERS, rearRebound: 2, earlierThrottle: 0.3, trackTempDelta: 4 };
  const out = evaluateScenario(proposed);
  const est = telemetryLimited ? ' (est)' : '';

  return {
    combo: `${circuit} · ${rider} · ${bike} · ${session}`,
    objective: 'Validate exit-drive improvement at T15 Bucine.',
    confidence: 81,
    recommendedTest: '5-lap validation stint',
    predictedLap: fmtLap(out.lapTimeS),
    scenario: {
      setup: 'Rear rebound +2 clicks slower',
      tyres: 'Front Medium · Rear Soft',
      trackTempC: 42,
      stintLaps: 6,
      riderFocus: 'Pick the bike up before throttle at T15 Bucine',
      predictedRearSlip: `14% → 10.2%${est}`,
      exitSpeedDelta: '+4.8 km/h',
      lapGain: `${out.lapTimeDelta.toFixed(2)}s`,
      riskDelta: `${out.risk - 52} pts`,
      confidence: 81,
    },
    signature: [
      { channel: 'Lean at pickup', before: '57°', after: '53°' },
      { channel: 'Throttle pickup delay', before: '0.40s', after: '0.15s' },
      { channel: 'Rear slip', before: `14%${est}`, after: `9.8%${est}` },
      { channel: 'Exit speed', before: '184 km/h', after: '190 km/h' },
    ],
    simVsReal: [
      { metric: 'Rear slip', predicted: '10.2%', actual: '9.8%', ok: true },
      { metric: 'Exit speed', predicted: '+4.8 km/h', actual: '+5.0 km/h', ok: true },
      { metric: 'Lap gain', predicted: '-0.36s', actual: '-0.31s', ok: true },
    ],
    modelError: 'Low',
    validationStatus: 'Simulation validated',
    planner: [
      { id: 'A', name: '5-lap validation stint', expectedGain: '-0.34s', risk: 'Medium-low', recommended: true, note: 'Best use of track time for this correction.' },
      { id: 'B', name: '8-lap race-pace stint', expectedGain: '-0.22s', risk: 'Medium-high', recommended: false, note: 'Not yet — fatigue + rear cliff risk past lap 6.' },
      { id: 'C', name: 'Tyre comparison run', expectedGain: 'high insight', risk: 'Low', recommended: false, note: 'Useful after setup validation.' },
    ],
    virtualDay: [
      { n: 1, name: 'Calibration stint', objective: 'Baseline + data trust', risk: 'Low' },
      { n: 2, name: 'Exit drive validation', objective: 'Rear slip <10%, exit +5 km/h', risk: 'Medium-low' },
      { n: 3, name: 'Rear pressure check', objective: 'Hot pressure window', risk: 'Low' },
      { n: 4, name: 'Setup A/B comparison', objective: 'Confirm rebound benefit', risk: 'Medium' },
      { n: 5, name: 'Race-pace simulation', objective: 'Consistency over 8 laps', risk: 'Medium-high' },
    ],
    setupAB: {
      a: 'Current baseline',
      b: 'Rear rebound +2 clicks slower',
      diff: ['Rear slip −3.8%', 'Exit speed +4.2 km/h', 'Direction change +0.04s', 'Risk −7 pts'],
      recommendation: 'Test Setup B in a short validation stint.',
      doNotChange: ['Front preload', 'Power map', 'Rear ride height'],
    },
    tyres: [
      { compound: 'Rear Soft', window: 'Laps 3–5', cliff: 'from lap 7', bestFor: 'Short validation' },
      { compound: 'Rear Medium', window: 'Laps 4–8', cliff: 'low', bestFor: 'Consistency / race pace' },
    ],
    fatigue: {
      stintLaps: 8,
      effects: ['Throttle smoothness drops after lap 6', 'Line deviation increases after lap 7', 'Risk rises in Sector 3'],
      adjustment: 'Use a 5-lap stint with push laps on laps 3 and 4.',
    },
    risk: {
      fastestGain: '-0.48s', fastestRisk: '+11 pts',
      saferGain: '-0.34s', saferRisk: '-6 pts',
      recommendation: 'Use the safer version for the first validation, not the fastest.',
    },
    ghost: {
      type: 'Risk-aware ideal lap',
      target: 'Improve T15 Bucine without increasing rear slip.',
      predictedLap: fmtLap(out.lapTimeS - 0.1),
      instruction: 'Follow the safer pickup line, not maximum apex speed.',
    },
    oracleVerdict:
      'Simulated three options. Best technical: rear rebound +2 + earlier pickup. Best risk-adjusted: earlier pickup '
      + 'only, then setup change if rear slip persists. Run a short validation stint before any electronics change.',
    missionName: 'Sim-to-Real Exit Drive Validation',
  };
}
