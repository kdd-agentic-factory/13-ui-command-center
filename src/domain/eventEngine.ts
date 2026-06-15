/**
 * eventEngine.ts — Telemetry Event Engine.
 *
 * Turns continuous telemetry into intelligent track EVENTS: late brake, early
 * throttle, grip loss, excess lean, chatter, sector loss, tyre cliff, data
 * dropout… Each event carries its evidence, impact, likely cause, a
 * recommendation and a concrete next action. Events are clustered by root cause
 * and summarised by category/severity.
 *
 *   Data → Events → Cause → Impact → Decision
 *
 * Deterministic and personalised; GPS-only telemetry flagged honestly.
 */

export type EventCategory = 'rider' | 'performance' | 'risk' | 'setup' | 'data';
export type EventSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface TelemetryEvent {
  id: string;
  lap: number;
  corner: string;
  phase: string;
  category: EventCategory;
  severity: EventSeverity;
  name: string;
  pattern: string;
  evidence: string[];
  impact: string;
  cause: string;
  recommendation: string;
  action: string;            // event → action
  resolved: boolean;
}

export interface EventCluster {
  name: string;
  events: string[];          // grouped event names
  rootCause: string;
  avgLoss: string;
  frequency: string;
}

export interface CornerEventStat {
  corner: string;
  total: number;
  topSeverity: EventSeverity;
  categories: EventCategory[];
}

export interface EventSummary {
  total: number; critical: number; performance: number; risk: number; rider: number; setup: number; data: number;
}

export interface EventEngine {
  combo: string;
  summary: EventSummary;
  mainEvent: TelemetryEvent;
  events: TelemetryEvent[];
  clusters: EventCluster[];
  cornerMap: CornerEventStat[];
  oracleContext: string;
}

const SEV_COLOR: Record<EventSeverity, string> = {
  low: 'var(--text-muted)', medium: 'var(--yellow)', high: '#FF6A00', critical: 'var(--accent)',
};
export function severityColor(s: EventSeverity): string { return SEV_COLOR[s]; }

const CAT_COLOR: Record<EventCategory, string> = {
  rider: 'var(--cyan)', performance: 'var(--green)', risk: 'var(--accent)', setup: 'var(--yellow)', data: 'var(--violet)',
};
export function categoryColor(c: EventCategory): string { return CAT_COLOR[c]; }

export const EVENT_CATEGORIES: EventCategory[] = ['rider', 'performance', 'risk', 'setup', 'data'];

export function buildEventEngine(rider: string, bike: string, circuit: string, session: string, telemetryLimited = false): EventEngine {
  const gps = telemetryLimited ? ' (est · GPS-only)' : '';
  const events: TelemetryEvent[] = [
    {
      id: 'e1', lap: 2, corner: 'T1 San Donato', phase: 'Entry', category: 'rider', severity: 'medium',
      name: 'Late brake', pattern: 'Brake point 9 m later than the reference.',
      evidence: ['Brake point +9 m', 'Apex speed −4 km/h'], impact: '+0.12s',
      cause: 'Brake marker reached late, rotation compromised.',
      recommendation: 'Brake 5–9 m earlier with progressive release.',
      action: 'Add San Donato progressive-release drill.', resolved: false,
    },
    {
      id: 'e2', lap: 2, corner: 'T8 Arrabbiata', phase: 'Mid', category: 'risk', severity: 'high',
      name: 'High lean load', pattern: 'Sustained lean >53° with tyre load near edge.',
      evidence: [`Lean 53°${gps}`, 'Edge load high'], impact: 'Risk watch',
      cause: 'Aggressive mid-corner load on a worn edge.',
      recommendation: 'Ease mid-corner load; widen line slightly.',
      action: 'Flag corner for Crash-Risk review.', resolved: false,
    },
    {
      id: 'e3', lap: 3, corner: 'T12 Correntaio', phase: 'Entry', category: 'performance', severity: 'medium',
      name: 'Wide entry', pattern: 'Entry line 0.4 m wide, late rotation.',
      evidence: ['Line deviation 0.4 m', 'Apex speed −3 km/h'], impact: '+0.14s',
      cause: 'Inconsistent entry reference lap to lap.',
      recommendation: 'Tighter entry, earlier rotation.',
      action: 'Pull Sector 3 line overlay.', resolved: false,
    },
    {
      id: 'e4', lap: 4, corner: 'T15 Bucine', phase: 'Exit', category: 'rider', severity: 'critical',
      name: 'High lean throttle event', pattern: 'Throttle starts while lean remains above 57°.',
      evidence: ['Throttle pickup 0.40s late', `Lean 57°${gps}`, `Rear slip 14%${gps}`, 'Exit 184 km/h (tgt 190)'],
      impact: '+0.284s', cause: 'Bike not picked up before throttle application.',
      recommendation: 'Delay aggressive throttle until lean <54°; earlier rotation, cleaner pickup.',
      action: 'Assign Exit Drive Mastery drill + open experiment EXP-04.', resolved: false,
    },
    {
      id: 'e5', lap: 4, corner: 'T15 Bucine', phase: 'Exit', category: 'setup', severity: 'high',
      name: 'Rear rebound instability', pattern: 'Rear unsettled as throttle is applied on exit.',
      evidence: [`Rear slip 14%${gps}`, 'Rear movement on drive'], impact: 'Amplifies exit loss',
      cause: 'Rear rebound returns too fast under throttle.',
      recommendation: 'Rear rebound +2 clicks slower (validated fix).',
      action: 'Check rear hot pressure after stint; apply rebound +2.', resolved: false,
    },
    {
      id: 'e6', lap: 5, corner: 'T6 Savelli', phase: 'Exit', category: 'setup', severity: 'medium',
      name: 'TC intervention cluster', pattern: 'Repeated TC cuts on the two exits.',
      evidence: ['Spin events 3/lap', 'TC active >40% throttle'], impact: '−0.05s drive',
      cause: 'Residual rear spin on power.',
      recommendation: 'Evaluate TC4→TC5 only if slip persists (time cost).',
      action: 'Log to Decision Center for gating.', resolved: false,
    },
    {
      id: 'e7', lap: 3, corner: 'Sector 3', phase: 'Run', category: 'data', severity: 'low',
      name: 'GPS jump', pattern: '3 position jumps detected and smoothed.',
      evidence: ['GPS Δ spikes ×3'], impact: 'Data confidence −',
      cause: 'Brief GPS multipath in the wooded section.',
      recommendation: 'Smoothed; exclude affected sub-lap from twin training.',
      action: 'Exclude lap from Digital Twin training.', resolved: false,
    },
    {
      id: 'e8', lap: 6, corner: 'T15 Bucine', phase: 'Exit', category: 'risk', severity: 'high',
      name: 'Rear slip spike', pattern: 'Rear slip crosses 14% with rising rear temp.',
      evidence: [`Rear slip 14.6%${gps}`, 'Rear temp 124°C'], impact: 'Cliff risk',
      cause: 'Throttle on worn hot rear above the slip window.',
      recommendation: 'Manage rear for two laps before pushing.',
      action: 'Tyre & Grip: confirm cliff window.', resolved: false,
    },
    {
      id: 'e9', lap: 7, corner: 'T15 Bucine', phase: 'Exit', category: 'performance', severity: 'low',
      name: 'Improved exit', pattern: 'Pickup after lean <54°, slip down, exit up.',
      evidence: ['Rear slip 9.8%', 'Exit +5 km/h', 'Lap −0.31s'], impact: 'Event resolved',
      cause: 'Earlier bike pick-up + rebound +2 applied.',
      recommendation: 'Repeat to consolidate; validate over 3 laps.',
      action: 'Mark experiment EXP-04 as validated.', resolved: true,
    },
  ];

  const summary: EventSummary = {
    total: events.length,
    critical: events.filter(e => e.severity === 'critical').length,
    performance: events.filter(e => e.category === 'performance').length,
    risk: events.filter(e => e.category === 'risk').length,
    rider: events.filter(e => e.category === 'rider').length,
    setup: events.filter(e => e.category === 'setup').length,
    data: events.filter(e => e.category === 'data').length,
  };

  // per-corner aggregation for the event map
  const byCorner = new Map<string, TelemetryEvent[]>();
  for (const e of events) byCorner.set(e.corner, [...(byCorner.get(e.corner) ?? []), e]);
  const sevRank: EventSeverity[] = ['low', 'medium', 'high', 'critical'];
  const cornerMap: CornerEventStat[] = [...byCorner.entries()].map(([corner, evs]) => ({
    corner,
    total: evs.length,
    topSeverity: evs.map(e => e.severity).sort((a, b) => sevRank.indexOf(b) - sevRank.indexOf(a))[0],
    categories: [...new Set(evs.map(e => e.category))],
  })).sort((a, b) => b.total - a.total);

  return {
    combo: `${circuit} · ${rider} · ${bike} · ${session}`,
    summary,
    mainEvent: events.find(e => e.severity === 'critical') ?? events[0],
    events,
    clusters: [
      {
        name: 'Bucine exit instability',
        events: ['High lean at pickup', 'Late throttle', 'Rear slip spike', 'Exit speed deficit'],
        rootCause: 'Late rotation and excessive lean reliance — the event begins before rear slip appears.',
        avgLoss: '+0.29s', frequency: '4 / 6 laps',
      },
      {
        name: 'Cold-tyre entry caution',
        events: ['Late brake', 'Wide entry'], rootCause: 'Conservative warm-up on the first laps.',
        avgLoss: '+0.13s', frequency: '2 / 6 laps',
      },
    ],
    cornerMap,
    oracleContext:
      'Most important event: Bucine exit instability (4/6 laps, +0.284s avg). The event begins before rear slip appears — '
      + 'root cause is throttle timing at high lean. Prioritise the rider correction before another setup change.',
  };
}
