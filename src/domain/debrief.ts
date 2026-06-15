/**
 * debrief.ts — the AI Debrief Room: a structured post-session debrief led by
 * the AI advisors.
 *
 * A fixed 5-point agenda (improved / lost / why / change / validate) plus an
 * "ask the debrief" of curated questions, each answered by the most relevant
 * advisor. Answers are scripted and deterministic — honest about being a
 * rule-based debrief that can hand off to the live Rider Coach (copilot) for
 * free-form follow-up.
 */

export type AdvisorId = 'rider-mentor' | 'telemetry-sage' | 'garage-engineer' | 'safety-guardian' | 'oracle-chief';

export interface Advisor {
  id: AdvisorId;
  name: string;
  role: string;
  color: string;
}

export const ADVISORS: Advisor[] = [
  { id: 'rider-mentor', name: 'Rider Mentor', role: 'Technique & coaching', color: '#00B7FF' },
  { id: 'telemetry-sage', name: 'Telemetry Sage', role: 'Data & traces', color: '#22C55E' },
  { id: 'garage-engineer', name: 'Garage Engineer', role: 'Setup & mechanics', color: '#FCD34D' },
  { id: 'safety-guardian', name: 'Safety Guardian', role: 'Risk & limits', color: '#E10600' },
  { id: 'oracle-chief', name: 'Oracle Chief', role: 'Decision & strategy', color: '#8B5CF6' },
];

export function advisor(id: AdvisorId): Advisor { return ADVISORS.find(a => a.id === id)!; }

export interface AgendaItem {
  n: number;
  title: string;
  by: AdvisorId;
  points: string[];
}

export interface DebriefQuestion {
  q: string;
  by: AdvisorId;
  a: string;
}

export interface Debrief {
  agenda: AgendaItem[];
  questions: DebriefQuestion[];
}

// ── RAG grounding (03-rag-cag-knowledge-layer) ────────────────────────────────
// The scripted debrief above is the instant, always-available baseline. On top,
// the Debrief Room asks the real knowledge layer for grounding evidence so the
// "why" is backed by retrieved sources, not just rules — live-with-fallback.

export interface GroundingSource { sourceId: string; excerpt: string; score: number }
export type GroundingState = 'grounded' | 'reachable' | 'unavailable';
export interface Grounding { state: GroundingState; sources: GroundingSource[] }

export interface RagEvidenceLike { source_id: string; text_excerpt?: string; text?: string; score: number }
export interface RagSearchLike { results?: { source_id: string; text: string; score: number }[]; evidence?: RagEvidenceLike[] }
export type RagOutcomeLike =
  | { ok: true; data: RagSearchLike }
  | { ok: false; reason: 'unauthorized' | 'server-error' | 'unreachable' };

/** The query that grounds this session's debrief (the recurring limiter). */
export function debriefQuery(bike: string, circuit: string): string {
  return `${circuit} ${bike} rear instability and late throttle pickup on corner exit — setup recommendation and evidence`;
}

export async function groundDebrief(
  query: string,
  deps: { ragSearch: (q: string) => Promise<RagOutcomeLike> },
): Promise<Grounding> {
  try {
    const out = await deps.ragSearch(query);
    // reached + authenticated (401 via direct, or 5xx with no index) → reachable;
    // only a true no-response (network/timeout) is 'unavailable'.
    if (!out.ok) return { state: out.reason === 'unreachable' ? 'unavailable' : 'reachable', sources: [] };
    const ev: RagEvidenceLike[] = (out.data.evidence && out.data.evidence.length
      ? out.data.evidence
      : (out.data.results ?? []).map(r => ({ source_id: r.source_id, text: r.text, score: r.score })));
    const sources: GroundingSource[] = ev
      .map(e => ({ sourceId: e.source_id, excerpt: (e.text_excerpt ?? e.text ?? '').trim().slice(0, 240), score: e.score ?? 0 }))
      .filter(s => s.excerpt.length > 0)
      .slice(0, 4);
    return sources.length ? { state: 'grounded', sources } : { state: 'reachable', sources: [] };
  } catch {
    return { state: 'unavailable', sources: [] };
  }
}

/** Build the debrief for a rider+bike+circuit+session combination. */
export function buildDebrief(rider: string, bike: string, circuit: string, session: string): Debrief {
  return {
    agenda: [
      {
        n: 1, title: 'What improved', by: 'telemetry-sage',
        points: [
          'Braking into T1 San Donato is now 5 m later than the reference — clean and repeatable.',
          'Sector 2 minimum speeds up +3 km/h vs the previous stint.',
        ],
      },
      {
        n: 2, title: 'Where time was lost', by: 'telemetry-sage',
        points: [
          'T15 Bucine exit: −0.284 s, the biggest single loss of the lap.',
          'T12 Correntaio: −0.142 s, square the corner for a better exit.',
        ],
      },
      {
        n: 3, title: 'Why it happened', by: 'rider-mentor',
        points: [
          'Throttle pickup at Bucine starts while lean is still above 55° — the rear cannot take it.',
          'Rear slip peaks at 14% on exit, costing drive onto the main straight.',
        ],
      },
      {
        n: 4, title: 'What to change', by: 'garage-engineer',
        points: [
          'Rider: open throttle 0.3 s earlier, with lean below 54°.',
          'Setup: rear rebound +2 clicks (validated in Setup Lab v2: slip 14%→11%).',
        ],
      },
      {
        n: 5, title: 'What to validate next', by: 'oracle-chief',
        points: [
          `Next stint on ${bike}: rear slip <10% at T15, exit speed +6 km/h, lean at pickup <54°.`,
          'Re-check rear hot pressure after two laps; the soft is near its thermal window.',
        ],
      },
    ],
    questions: [
      {
        q: 'Why do I lose time at Bucine?', by: 'rider-mentor',
        a: `At Bucine you open the throttle while ${rider} is still leaned over 55°, so the rear spins instead of driving. It is the last corner onto the main straight, so the loss compounds down the straight — that is why it is the biggest single loss of the lap.`,
      },
      {
        q: 'Is it more a setup or a riding problem?', by: 'garage-engineer',
        a: 'Both, but the order matters: the rider-side fix (earlier pickup at lower lean) gives the bigger, free gain. The rear-rebound +2 clicks change supports it — it is a multiplier, not the root cause. Fix the technique first, then the setup makes it repeatable.',
      },
      {
        q: 'What change would you make first?', by: 'oracle-chief',
        a: 'Validate the rear-rebound +2 clicks change (already validated in the Setup Lab) and pair it with the throttle-timing cue. Expected combined gain −0.36 s/lap at medium risk. Do not chase more apex speed until rear stability is confirmed.',
      },
      {
        q: 'What should I NOT touch?', by: 'garage-engineer',
        a: 'Front preload, rear ride height and the power map. The braking platform and the tyre thermal window are calibrated around them — moving any of the three re-opens the cliff prediction and the validated braking stability.',
      },
      {
        q: 'Am I taking too much risk?', by: 'safety-guardian',
        a: `Crash-risk index is Medium (58/100), concentrated on corner exits (76/100) where lean stays high under throttle. On ${circuit} that is the rear-grip envelope — the throttle-timing change lowers it without costing lap time.`,
      },
    ],
  };
}
