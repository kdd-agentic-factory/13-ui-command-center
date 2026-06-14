/**
 * cockpit.ts — Adaptive Pit-Wall Cockpit priority engine.
 *
 * The dashboard stops being a fixed screen: a rules engine reads the live
 * context (crash-risk, session phase, active experiment, tyre cliff, data
 * integrity, demo) and decides the cockpit MODE, which module is primary, which
 * support it, a per-module priority score and the single Next Best Action.
 *
 *   KDD doesn't just show modules — it decides which module you need right now.
 *
 * Pure and deterministic: decideCockpit(context) → layout. Same input, same
 * cockpit, so it is fully testable.
 */
import type { TabId } from '../context/AuthContext';

export type CockpitMode =
  | 'pre-session' | 'live-stint' | 'alert' | 'experiment' | 'post-stint' | 'demo' | 'simulation' | 'degraded';

export type SessionPhase = 'pre' | 'live' | 'post';

export interface CockpitContext {
  crashRisk: number;          // 0–100
  sessionPhase: SessionPhase;
  activeExperiment: boolean;
  tyreCliffRisk: 'low' | 'medium' | 'high';
  dataIntegrityOk: boolean;
  demo: boolean;
  oraclePending: boolean;
  rearTempC: number;
  rearSlip: number;           // %
  leanAtPickup: number;       // °
}

export interface NextBestAction {
  priority: string;
  action: string;
  why: string;
  expectedGain: string;
  risk: string;
}

export interface ModulePriority { tab: TabId; label: string; score: number; }

export interface CockpitLayout {
  mode: CockpitMode;
  trigger: string;
  primary: { tab: TabId; label: string };
  supporting: { tab: TabId; label: string }[];
  priorities: ModulePriority[];
  nextBestAction: NextBestAction;
  oracleVerdict: string;
  /** Hybrid mode: a mode switch KDD suggests but the user can accept/ignore/pin. */
  suggestion?: { toMode: CockpitMode; reason: string };
}

const MODE_META: Record<CockpitMode, { label: string; color: string }> = {
  'pre-session': { label: 'PRE-SESSION', color: 'var(--cyan)' },
  'live-stint':  { label: 'LIVE STINT',  color: 'var(--green)' },
  alert:         { label: 'ALERT MODE',  color: 'var(--accent)' },
  experiment:    { label: 'EXPERIMENT MODE', color: '#8B5CF6' },
  'post-stint':  { label: 'POST-STINT',  color: 'var(--yellow)' },
  demo:          { label: 'DEMO MODE',   color: '#A855F7' },
  simulation:    { label: 'SIMULATION',  color: '#00B7FF' },
  degraded:      { label: 'DEGRADED MODE', color: '#FF6A00' },
};
export function modeMeta(m: CockpitMode) { return MODE_META[m]; }

const L: Partial<Record<TabId, string>> = {
  telemetry: 'Live Telemetry', circuit: '3D Track Map', corners: 'Corner Intelligence',
  risk: 'Crash-Risk', tires: 'Tyre & Grip', 'ai-crew': 'Oracle Pit Wall',
  report: 'Session Report', twin: 'Digital Twin', advisor: 'Setup Advisor',
  style: 'Rider Style DNA', 'pre-gp': 'Session Planner', experiments: 'Experiment Engine',
  'black-box': 'KDD Black Box', 'track-evo': 'Track Evolution', overview: 'Race Overview',
  data: 'Data Integrity', 'pit-radio': 'Pit-Radio',
};
const tab = (t: TabId) => ({ tab: t, label: L[t] ?? t });

/** Score the modules for a context; the engine sorts and shows the top of this. */
function score(ctx: CockpitContext): ModulePriority[] {
  const s: ModulePriority[] = [
    { tab: 'telemetry', label: L.telemetry!, score: ctx.sessionPhase === 'live' ? 92 : 40 },
    { tab: 'risk',      label: L.risk!,      score: Math.min(98, 30 + ctx.crashRisk) },
    { tab: 'tires',     label: L.tires!,     score: ctx.tyreCliffRisk === 'high' ? 90 : ctx.tyreCliffRisk === 'medium' ? 70 : 45 },
    { tab: 'corners',   label: L.corners!,   score: ctx.sessionPhase === 'live' ? 76 : 55 },
    { tab: 'experiments', label: L.experiments!, score: ctx.activeExperiment ? 88 : 30 },
    { tab: 'report',    label: L.report!,    score: ctx.sessionPhase === 'post' ? 95 : 20 },
    { tab: 'style',     label: L.style!,     score: ctx.sessionPhase === 'post' ? 84 : 35 },
    { tab: 'advisor',   label: L.advisor!,   score: ctx.sessionPhase === 'post' ? 80 : 50 },
    { tab: 'pre-gp',    label: L['pre-gp']!, score: ctx.sessionPhase === 'pre' ? 94 : 18 },
    { tab: 'ai-crew',   label: L['ai-crew']!, score: ctx.oraclePending ? 85 : 60 },
    { tab: 'data',      label: L.data!,      score: ctx.dataIntegrityOk ? 25 : 96 },
    { tab: 'track-evo', label: L['track-evo']!, score: ctx.sessionPhase === 'live' ? 68 : 48 },
  ];
  return s.sort((a, b) => b.score - a.score);
}

export function decideCockpit(ctx: CockpitContext): CockpitLayout {
  const priorities = score(ctx);
  const baseMode: CockpitMode = ctx.sessionPhase === 'pre' ? 'pre-session' : ctx.sessionPhase === 'post' ? 'post-stint' : 'live-stint';

  let mode: CockpitMode = baseMode;
  let trigger = `Session phase: ${ctx.sessionPhase}`;
  let primary: TabId = ctx.sessionPhase === 'pre' ? 'pre-gp' : ctx.sessionPhase === 'post' ? 'report' : 'telemetry';
  let supporting: TabId[] = ctx.sessionPhase === 'pre'
    ? ['pre-gp', 'tires', 'ai-crew', 'track-evo']
    : ctx.sessionPhase === 'post'
      ? ['corners', 'style', 'advisor', 'ai-crew']
      : ['circuit', 'risk', 'tires', 'ai-crew'];

  // Rules, highest urgency first (first match wins).
  if (!ctx.dataIntegrityOk) {
    mode = 'degraded'; primary = 'data'; trigger = 'Data integrity check failed';
    supporting = ['data', 'telemetry', 'ai-crew'];
  } else if (ctx.crashRisk > 75 || (ctx.rearTempC > 124 && ctx.rearSlip > 14)) {
    mode = 'alert'; primary = 'risk'; trigger = `Rear temp ${ctx.rearTempC}°C · slip ${ctx.rearSlip}% · lean ${ctx.leanAtPickup}° at pickup`;
    supporting = ['risk', 'tires', 'telemetry', 'ai-crew'];
  } else if (ctx.demo) {
    mode = 'demo'; primary = 'overview'; trigger = 'Guided demo narrative';
    supporting = ['overview', 'telemetry', 'corners', 'ai-crew'];
  } else if (ctx.activeExperiment) {
    mode = 'experiment'; primary = 'experiments'; trigger = 'Active experiment running';
    supporting = ['experiments', 'telemetry', 'tires', 'risk'];
  }
  // else baseMode stands

  // Hybrid suggestion: if the urgent mode differs from the session's base mode.
  const suggestion = mode !== baseMode
    ? { toMode: mode, reason: trigger }
    : undefined;

  // Next best action from the dominant limiter.
  const nextBestAction: NextBestAction =
    mode === 'alert'
      ? { priority: 'Protect the rear tyre', action: 'Abort the push lap; manage rear for 2 laps, then re-assess.', why: 'Rear temperature and slip are over the safe window.', expectedGain: 'Avoid the cliff / crash', risk: 'High if ignored' }
      : mode === 'degraded'
        ? { priority: 'Restore data trust', action: 'Open Data Integrity and confirm channels before acting on numbers.', why: 'A failed integrity check makes every metric unreliable.', expectedGain: 'Decisions on real data', risk: 'High if ignored' }
        : mode === 'experiment'
          ? { priority: 'Validate T15 Bucine exit', action: 'Run a 5-lap stint focused on throttle pickup after lean <54°.', why: 'Largest repeatable time loss; the experiment is mid-run.', expectedGain: '-0.42s/lap', risk: 'Medium' }
          : mode === 'post-stint'
            ? { priority: 'Close the loop', action: 'Generate the next-stint plan and save the learning to the Black Box.', why: 'Convert this stint into the next plan while it is fresh.', expectedGain: 'Faster next stint', risk: 'Low' }
            : mode === 'pre-session'
              ? { priority: 'Set the session target', action: 'Confirm tyres + setup and start the validation stint.', why: 'Nothing to analyse yet — prepare and define the objective.', expectedGain: 'Clean baseline', risk: 'Low' }
              : { priority: 'Validate T15 Bucine exit', action: 'Watch rear slip live; mark the corner for post-stint review.', why: 'It is the largest repeatable time loss on track.', expectedGain: '-0.42s/lap', risk: 'Medium' };

  const oracleVerdict = mode === 'alert'
    ? 'Back off this lap — the time is not worth the crash probability.'
    : mode === 'experiment'
      ? 'Stay on the experiment; rebound change is trending validated.'
      : ctx.oraclePending ? 'Decision pending — review the Oracle verdict.' : 'On plan — keep building.';

  return {
    mode, trigger,
    primary: tab(primary),
    supporting: supporting.map(tab),
    priorities,
    nextBestAction,
    oracleVerdict,
    suggestion,
  };
}

/** Preview scenarios so the cockpit can be seen reorganising itself. */
export const COCKPIT_SCENARIOS: { id: string; label: string; ctx: CockpitContext }[] = [
  { id: 'live',       label: 'Live stint',  ctx: { crashRisk: 48, sessionPhase: 'live', activeExperiment: false, tyreCliffRisk: 'medium', dataIntegrityOk: true, demo: false, oraclePending: false, rearTempC: 112, rearSlip: 9, leanAtPickup: 52 } },
  { id: 'alert',      label: 'Alert',       ctx: { crashRisk: 82, sessionPhase: 'live', activeExperiment: false, tyreCliffRisk: 'high', dataIntegrityOk: true, demo: false, oraclePending: true, rearTempC: 126, rearSlip: 15, leanAtPickup: 57 } },
  { id: 'experiment', label: 'Experiment',  ctx: { crashRisk: 50, sessionPhase: 'live', activeExperiment: true, tyreCliffRisk: 'medium', dataIntegrityOk: true, demo: false, oraclePending: false, rearTempC: 114, rearSlip: 10, leanAtPickup: 54 } },
  { id: 'pre',        label: 'Pre-session', ctx: { crashRisk: 0, sessionPhase: 'pre', activeExperiment: false, tyreCliffRisk: 'low', dataIntegrityOk: true, demo: false, oraclePending: false, rearTempC: 30, rearSlip: 0, leanAtPickup: 0 } },
  { id: 'post',       label: 'Post-stint',  ctx: { crashRisk: 20, sessionPhase: 'post', activeExperiment: false, tyreCliffRisk: 'low', dataIntegrityOk: true, demo: false, oraclePending: true, rearTempC: 80, rearSlip: 0, leanAtPickup: 0 } },
  { id: 'degraded',   label: 'Degraded',    ctx: { crashRisk: 40, sessionPhase: 'live', activeExperiment: false, tyreCliffRisk: 'medium', dataIntegrityOk: false, demo: false, oraclePending: false, rearTempC: 110, rearSlip: 8, leanAtPickup: 51 } },
];
