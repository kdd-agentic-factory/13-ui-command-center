/**
 * pitMemory.ts — the box's operating memory, shared by two modules:
 *
 *  • KDD Black Box (Race Decision Timeline): the session's flight recorder —
 *    every telemetry event, Oracle verdict, engineer action and outcome, in
 *    order, with decision cards (detection → recommendation → applied →
 *    result → status).
 *  • Garage Knowledge Graph: what the platform has LEARNED across sessions —
 *    rider+bike+circuit → recurring limiter → best proven fix → confidence →
 *    recommended setup version.
 *
 * Deterministic seeds personalised to the active combination; the real feed
 * is the persisted decision_log + garage_profiles + setup versions.
 */

// ──── Black Box timeline decision records ────

export type EventSource =
  | 'Telemetry Sage' | 'Safety Guardian' | 'Oracle Chief' | 'Garage Engineer' | 'Digital Twin' | 'System';

export interface TimelineEvent {
  time: string;          // HH:MM:SS
  source: EventSource;
  kind: 'telemetry' | 'risk' | 'verdict' | 'action' | 'outcome' | 'tyre';
  text: string;
}

export interface DecisionRecord {
  id: string;
  decision: string;
  reason: string;
  evidence: string[];
  expectedEffect: string;
  applied: boolean;
  result: string;        // '—' until validated
  status: 'validated' | 'rejected' | 'pending';
}

export interface BlackBox {
  timeline: TimelineEvent[];
  decisions: DecisionRecord[];
}

const SRC_COLOR: Record<EventSource, string> = {
  'Telemetry Sage': '#22C55E', 'Safety Guardian': '#E10600', 'Oracle Chief': '#8B5CF6',
  'Garage Engineer': '#FCD34D', 'Digital Twin': '#00B7FF', 'System': '#757E92',
};
export function eventColor(s: EventSource): string { return SRC_COLOR[s]; }

const KIND_COLOR: Record<TimelineEvent['kind'], string> = {
  telemetry: '#22C55E', risk: '#E10600', verdict: '#8B5CF6',
  action: '#FCD34D', outcome: '#00E676', tyre: '#FF6A00',
};
export function kindColor(k: TimelineEvent['kind']): string { return KIND_COLOR[k]; }

export function buildBlackBox(rider: string, bike: string, circuit: string, session: string): BlackBox {
  return {
    timeline: [
      { time: '14:21:08', source: 'Telemetry Sage', kind: 'telemetry', text: `Rear slip detected at T15 Bucine · 14% (${bike})` },
      { time: '14:21:12', source: 'Safety Guardian', kind: 'risk', text: 'Risk increased to Medium · exit phase (76/100)' },
      { time: '14:21:19', source: 'Oracle Chief', kind: 'verdict', text: 'Recommendation: rear rebound +2 clicks slower · confidence 84%' },
      { time: '14:22:04', source: 'Garage Engineer', kind: 'action', text: `Recommendation accepted by ${rider}'s crew · Setup Lab v2` },
      { time: '14:24:50', source: 'Digital Twin', kind: 'tyre', text: 'Rear soft thermal load nominal after change · cliff held at L19' },
      { time: '14:27:31', source: 'Telemetry Sage', kind: 'outcome', text: 'Next stint: rear slip 14% → 9.8% · exit +5 km/h · lap −0.31 s' },
      { time: '14:27:40', source: 'Oracle Chief', kind: 'outcome', text: 'Decision validated — gain confirmed at manageable risk' },
    ],
    decisions: [
      {
        id: 'd1', decision: 'Rear rebound +2 clicks slower',
        reason: `Rear instability at T15 Bucine on ${circuit} (${session})`,
        evidence: ['Rear slip 14%', 'Throttle pickup at lean >55°', 'Rear grip drop 12%'],
        expectedEffect: 'Rear slip −3% to −5% on exit',
        applied: true, result: 'Rear slip −4.2% · exit +5 km/h · lap −0.31 s', status: 'validated',
      },
      {
        id: 'd2', decision: 'TC 4 → 5 in Sector 3',
        reason: 'Residual rear spin on the two Arrabbiata exits',
        evidence: ['Rear spin events: 3/lap', 'Exit traction loss above 40% throttle'],
        expectedEffect: 'Fewer spin events, ~+0.05 s cost',
        applied: false, result: '—', status: 'rejected',
      },
      {
        id: 'd3', decision: 'Engine brake EB4 → EB3',
        reason: 'Oracle: settle entry without losing the rebound gain',
        evidence: ['Entry instability into Correntaio', 'Twin sim supports it'],
        expectedEffect: 'Calmer entry, neutral on lap time',
        applied: false, result: '—', status: 'pending',
      },
    ],
  };
}

// ──── Knowledge Graph learned patterns ────

export interface KnowledgePattern {
  combo: string;          // rider + bike + circuit
  limiter: string;        // recurring problem
  bestFix: string;        // proven solution
  result: string;         // measured outcome
  confidence: 'High' | 'Medium' | 'Low';
  sessions: number;       // sessions backing it
  recommendedSetup: string;
}

export function getKnowledgePatterns(rider: string, bike: string, circuit: string): KnowledgePattern[] {
  return [
    {
      combo: `${rider} + ${bike} + ${circuit}`,
      limiter: 'Loses time at T15 Bucine — late throttle pickup at high lean',
      bestFix: 'Rear rebound +2 clicks slower + smoother throttle pickup below 54° lean',
      result: 'Rear slip −4%, exit +5 km/h, lap −0.31 s',
      confidence: 'High', sessions: 3, recommendedSetup: `${circuit} · ${bike} · Setup v3`,
    },
    {
      combo: `${rider} + ${bike} + ${circuit}`,
      limiter: 'Rear soft enters the thermal cliff around L19 on hot tracks',
      bestFix: 'Open from medium rear when track temp > 44°C; manage TC for the last 4 laps',
      result: 'Cliff pushed to ~L22, consistent end-of-stint pace',
      confidence: 'Medium', sessions: 2, recommendedSetup: 'Rear medium · TC ramp Sector 3',
    },
    {
      combo: `${rider} + any bike + ${circuit}`,
      limiter: 'Conservative entry on cold tyres (first 2 laps)',
      bestFix: 'Two-lap warm-up plan with progressive brake load',
      result: 'Reaches target pace one lap earlier',
      confidence: 'Low', sessions: 1, recommendedSetup: 'Warm-up protocol A',
    },
  ];
}
