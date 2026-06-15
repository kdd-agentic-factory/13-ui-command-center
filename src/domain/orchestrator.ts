/**
 * orchestrator.ts — Autonomous Race Engineering Orchestrator.
 *
 * The operating brain above every module: it reads the detected events, the
 * surface/tyre/data context and the recurring pattern, forms a root hypothesis,
 * gets the Oracle verdict, and turns it into an executable MISSION — with a
 * lifecycle, a decision queue, a pit-wall task board, the single Next Best
 * Action, an orchestration graph and an auto brief/debrief.
 *
 *   KDD turns data, events and decisions into executable improvement missions.
 *
 * Composes eventEngine + trackSurface + dataTrust + patternMiner. Deterministic.
 */
import { buildEventEngine } from './eventEngine';
import { buildTrackSurface } from './trackSurface';
import { buildDataTrust } from './dataTrust';
import { buildPatternMine } from './patternMiner';

export type OrchestratorMode = 'manual' | 'assisted' | 'autonomous' | 'demo' | 'race-control';
export type MissionStatus =
  | 'created' | 'planned' | 'approved' | 'running' | 'evaluating'
  | 'validated' | 'partially-validated' | 'rejected' | 'learned';

export interface Criterion { metric: string; target: string }
export interface Mission {
  id: string;
  name: string;
  objective: string;
  scope: string;
  primaryMetric: string;
  secondaryMetrics: string[];
  successCriteria: Criterion[];
  abortConditions: Criterion[];
  status: MissionStatus;
  confidence: number;
}

export interface DecisionQueueItem {
  id: string;
  decision: string;
  status: 'awaiting' | 'hold' | 'not-recommended' | 'approved';
  risk: string;
  expectedGain: string;
  reason: string;
}

export interface OrchTask {
  id: string;
  title: string;
  owner: string;
  status: 'pending' | 'automatic' | 'done';
  approvalRole?: string;
}

export interface NextBestAction {
  action: string;
  why: string[];
  expectedOutcome: string[];
  doNotYet: string[];
}

export interface GraphNode { stage: string; label: string }

export interface MissionBrief {
  objective: string; riderFocus: string[]; setup: string; tyres: string;
  validationLaps: string; success: string[]; abort: string;
}
export interface MissionDebrief {
  status: MissionStatus;
  before: Record<string, string>;
  after: Record<string, string>;
  outcome: string; learning: string; nextMission: string;
}

export interface OrchContext {
  primaryFinding: string; frequency: string; impact: string;
  dataTrust: number; surface: string; tyre: string; rider: string; bike: string;
  oracleVerdict: string;
}

export interface Orchestrator {
  combo: string;
  systemState: string;
  mission: Mission;
  context: OrchContext;
  rootHypothesis: string;
  decisionQueue: DecisionQueueItem[];
  tasks: OrchTask[];
  nextBestAction: NextBestAction;
  graph: GraphNode[];
  brief: MissionBrief;
  debrief: MissionDebrief;
  modes: OrchestratorMode[];
}

const STATUS_META: Record<MissionStatus, { label: string; color: string }> = {
  created: { label: 'CREATED', color: 'var(--text-muted)' },
  planned: { label: 'PLANNED', color: 'var(--cyan)' },
  approved: { label: 'APPROVED', color: 'var(--cyan)' },
  running: { label: 'RUNNING', color: 'var(--yellow)' },
  evaluating: { label: 'EVALUATING', color: 'var(--yellow)' },
  validated: { label: 'VALIDATED', color: 'var(--green)' },
  'partially-validated': { label: 'PARTIALLY VALIDATED', color: 'var(--yellow)' },
  rejected: { label: 'REJECTED', color: 'var(--accent)' },
  learned: { label: 'LEARNED', color: 'var(--green)' },
};
export function missionStatusMeta(s: MissionStatus) { return STATUS_META[s]; }
export function queueColor(s: DecisionQueueItem['status']): string {
  return s === 'approved' ? 'var(--green)' : s === 'awaiting' ? 'var(--cyan)' : s === 'hold' ? 'var(--yellow)' : 'var(--text-muted)';
}
export function taskColor(s: OrchTask['status']): string {
  return s === 'done' ? 'var(--green)' : s === 'automatic' ? 'var(--violet)' : 'var(--yellow)';
}

export const ORCH_MODES: OrchestratorMode[] = ['manual', 'assisted', 'autonomous', 'demo', 'race-control'];

export function buildOrchestrator(rider: string, bike: string, circuit: string, session: string, telemetryLimited = false): Orchestrator {
  const eng = buildEventEngine(rider, bike, circuit, session, telemetryLimited);
  const surf = buildTrackSurface(rider, bike, circuit, session, telemetryLimited);
  const trust = buildDataTrust(rider, bike, circuit, session, telemetryLimited);
  const mine = buildPatternMine(rider, bike, telemetryLimited);
  const topPattern = mine.patterns[0];

  const context: OrchContext = {
    primaryFinding: `${eng.mainEvent.corner} · ${eng.mainEvent.name}`,
    frequency: topPattern.detectedIn,
    impact: `${eng.mainEvent.impact} average loss`,
    dataTrust: trust.trustScore,
    surface: surf.mainConstraint,
    tyre: 'Rear soft entering thermal stress window',
    rider: 'Point-and-shoot · lean-dependent rotation',
    bike: `${bike} · high rear load on exit`,
    oracleVerdict: 'Prioritise rider pickup and rear stability before chasing apex speed.',
  };

  return {
    combo: `${circuit} · ${rider} · ${bike} · ${session}`,
    systemState: 'Post-Stint Analysis',
    mission: {
      id: 'mugello_stint04_exit_drive_validation',
      name: `${circuit} · Exit Drive Validation`,
      objective: 'Reduce rear slip and improve exit speed at T15 Bucine.',
      scope: 'Stint 04 · 5 laps',
      primaryMetric: 'Rear slip',
      secondaryMetrics: ['Exit speed', 'Lean at pickup', 'Throttle timing', 'Risk index', 'Lap delta'],
      successCriteria: [
        { metric: 'Rear slip', target: '<10%' },
        { metric: 'Exit speed', target: '+5 km/h' },
        { metric: 'Risk index', target: 'not increased' },
      ],
      abortConditions: [
        { metric: 'Rear tyre peak', target: '>124°C' },
        { metric: 'Rear slip', target: '>16%' },
      ],
      status: 'planned',
      confidence: 87,
    },
    context,
    rootHypothesis: 'High lean at throttle pickup + rear rebound behaviour + rear tyre thermal load.',
    decisionQueue: [
      { id: 'd1', decision: 'Apply rear rebound +2 clicks slower?', status: 'awaiting', risk: 'Low-medium', expectedGain: '-0.31s to -0.48s', reason: 'Validated fix for the recurring Bucine exit instability.' },
      { id: 'd2', decision: 'Activate TC +1 in Sector 3?', status: 'hold', risk: 'Low', expectedGain: '+0.07s cost', reason: 'May reduce drive on the main straight.' },
      { id: 'd3', decision: 'Switch rear tyre compound?', status: 'not-recommended', risk: '—', expectedGain: '—', reason: 'Current problem is technique/setup before compound.' },
    ],
    tasks: [
      { id: 't1', title: 'Adjust rear rebound +2 clicks slower', owner: 'Garage Engineer', status: 'pending', approvalRole: 'Garage Engineer' },
      { id: 't2', title: 'Brief rider on T15 Bucine exit cue', owner: 'Rider Coach', status: 'pending', approvalRole: 'Coach' },
      { id: 't3', title: 'Check rear hot pressure after Stint 04', owner: 'Mechanic', status: 'pending' },
      { id: 't4', title: 'Validate rear slip <10% in laps 2–5', owner: 'KDD', status: 'automatic' },
      { id: 't5', title: 'Compare Stint 04 against Stint 03', owner: 'Telemetry Sage', status: 'automatic' },
    ],
    nextBestAction: {
      action: 'Run Exit Drive Validation.',
      why: ['Largest repeatable loss is T15 Bucine exit', `Data trust is ${trust.trustScore}% (high enough)`, 'Risk is manageable', 'Validatable in one short stint'],
      expectedOutcome: ['Rear slip −3% to −5%', 'Exit speed +5 km/h', 'Lap gain −0.31s to −0.48s'],
      doNotYet: ['Do not change the power map', 'Do not chase later braking', 'Do not switch tyre compound before pressure validation'],
    },
    graph: [
      { stage: 'Event', label: `${eng.mainEvent.name} at ${eng.mainEvent.corner}` },
      { stage: 'Root cause', label: 'Lean reliance + rear rebound + rear thermal load' },
      { stage: 'Oracle verdict', label: 'Prioritise exit-drive stability' },
      { stage: 'Experiment', label: 'Exit Drive Validation' },
      { stage: 'Tasks', label: 'Setup · Rider cue · Pressure check' },
      { stage: 'Validation', label: 'Rear slip · exit speed · risk' },
      { stage: 'Learning', label: `Update ${circuit} ${bike} profile` },
    ],
    brief: {
      objective: 'Validate improved exit drive at T15 Bucine.',
      riderFocus: ['Pick the bike up before throttle', 'Target lean at pickup < 54°'],
      setup: 'Rear rebound +2 clicks slower.',
      tyres: 'Rear soft · monitor thermal load.',
      validationLaps: 'Lap 2 to Lap 5.',
      success: ['Rear slip <10%', 'Exit speed +5 km/h', 'Risk index not increased'],
      abort: 'Rear tyre peak >124°C or rear slip >16%.',
    },
    debrief: {
      status: 'validated',
      before: { 'Rear slip': '14.0%', 'Exit speed': '184 km/h', 'Loss at T15': '+0.284s' },
      after: { 'Rear slip': '9.8%', 'Exit speed': '190 km/h', 'Loss at T15': '+0.091s' },
      outcome: 'The experiment improved exit drive without increasing risk.',
      learning: `Rear rebound +2 clicks works at ${circuit} when combined with earlier bike pickup.`,
      nextMission: 'Repeat validation at T12 Correntaio.',
    },
    modes: ORCH_MODES,
  };
}
