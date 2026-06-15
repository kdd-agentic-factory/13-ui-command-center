/**
 * causal.ts — Causal Performance Engine.
 *
 * KDD stops at correlations and starts reasoning about cause: for an observed
 * loss/risk it builds a causal graph, ranks the likely causes by weight,
 * classifies each as correlated / likely-causal / confirmed / rejected, plans
 * the single best intervention (and what NOT to change), designs the causal
 * experiment that proves it, and stores the confirmed cause in causal memory.
 *
 *   KDD doesn't only find patterns — it discovers actionable causes.
 *
 * Deterministic. Composes the same Bucine scenario the rest of the stack uses.
 */

export type CauseClass = 'correlated' | 'likely-causal' | 'confirmed-causal' | 'rejected';

export interface CausalFactor { factor: string; weight: number; klass: CauseClass }
export interface Intervention {
  action: string; whyFirst: string; expected: string[]; risk: string; validation: string; doNotChange: string[];
}
export interface CausalExperiment {
  hypothesis: string; controlled: string[]; intervention: string; successCriteria: string[]; causalValidation: string;
}
export interface CausalResult { status: 'Confirmed' | 'Rejected' | 'Pending'; evidence: string[]; conclusion: string }
export interface CausalMemoryEntry { pattern: string; confirmedCause: string; intervention: string; sessions: string[]; effect: string; confidence: 'High' | 'Medium' | 'Low' }
export interface SetupCheck { question: string; evidenceFor: string[]; evidenceAgainst: string[]; verdict: string; decision: string }
export interface RiskAnalysis { observed: string; cause: string; amplifier: string; humanFactor: string; intervention: string; riskReduction: string }

export interface Causal {
  combo: string;
  problem: string;
  verdict: string;
  punchline: string;
  secondary: string[];
  rejected: string[];
  confidence: number;
  effect: string;
  directCause: string;
  upstream: string[];
  graph: string[];
  factors: CausalFactor[];
  intervention: Intervention;
  experiment: CausalExperiment;
  result: CausalResult;
  memory: CausalMemoryEntry[];
  setupCheck: SetupCheck;
  riskAnalysis: RiskAnalysis;
}

const CLASS_META: Record<CauseClass, { label: string; color: string }> = {
  'confirmed-causal': { label: 'CONFIRMED CAUSAL', color: 'var(--green)' },
  'likely-causal': { label: 'LIKELY CAUSAL', color: 'var(--cyan)' },
  correlated: { label: 'CORRELATED', color: 'var(--yellow)' },
  rejected: { label: 'REJECTED', color: 'var(--text-muted)' },
};
export function classMeta(c: CauseClass) { return CLASS_META[c]; }

export function buildCausal(rider: string, bike: string, circuit: string, session: string): Causal {
  return {
    combo: `${circuit} · ${rider} · ${bike} · ${session}`,
    problem: 'T15 Bucine exit loss (+0.284s)',
    verdict: 'The time loss is mainly caused by delayed bike pickup before throttle (excessive lean at pickup), amplified by rear tyre thermal load — not by insufficient apex speed.',
    punchline: 'You do not lose time because you enter slow — you lose it because you get on the throttle late and too leaned over.',
    secondary: ['Rear rebound behaviour', 'Rear hot-pressure uncertainty', 'Rider confidence loss after Arrabbiata'],
    rejected: ['Brake point', 'Gear selection', 'Apex speed'],
    confidence: 84,
    effect: 'Lap time loss +0.284s',
    directCause: 'Exit speed deficit −6 km/h',
    upstream: ['Lean angle too high at throttle pickup (57°)', 'Throttle ramp delayed (+0.40s)', 'Rear slip peak 14%', 'Rear tyre thermal load rising'],
    graph: ['High lean at pickup', 'Delayed throttle confidence', 'Rear slip spike', 'Exit speed deficit', 'Main-straight speed loss', 'Lap time loss'],
    factors: [
      { factor: 'Lean at throttle pickup', weight: 42, klass: 'likely-causal' },
      { factor: 'Throttle ramp delay', weight: 27, klass: 'likely-causal' },
      { factor: 'Rear tyre thermal load', weight: 18, klass: 'correlated' },
      { factor: 'Rear rebound behaviour', weight: 9, klass: 'correlated' },
      { factor: 'Gear selection', weight: 4, klass: 'rejected' },
    ],
    intervention: {
      action: 'Rider technique: pick the bike up before throttle (lean <54°).',
      whyFirst: 'It targets the highest-ranked causal factor without changing the bike.',
      expected: ['Rear slip −3% to −5%', 'Exit speed +4 to +6 km/h', 'Lap gain −0.24s to −0.42s'],
      risk: 'Low-medium',
      validation: 'Run a 5-lap focused stint.',
      doNotChange: ['Power map', 'Front preload', 'Gear ratio', 'Brake point'],
    },
    experiment: {
      hypothesis: 'Reducing lean at throttle pickup will reduce rear slip and improve exit speed.',
      controlled: ['Same rider', 'Same bike', 'Same tyre set', 'Same setup', 'Same weather window', 'Same target laps'],
      intervention: 'Rider cue only: pick the bike up before throttle.',
      successCriteria: ['Lean at pickup <54°', 'Rear slip <10%', 'Exit speed +5 km/h'],
      causalValidation: 'If improvement occurs without a setup change, rider technique is confirmed as the primary cause.',
    },
    result: {
      status: 'Confirmed',
      evidence: ['Lean at pickup 57° → 53°', 'Rear slip 14% → 9.8%', 'Exit speed +5 km/h', 'No setup change applied'],
      conclusion: 'The primary cause was rider pickup timing, not setup.',
    },
    memory: [
      { pattern: 'T15 Bucine exit loss', confirmedCause: 'Excessive lean at throttle pickup', intervention: 'Earlier bike pickup before throttle', sessions: ['Stint 04', 'Stint 05'], effect: 'Avg loss −0.21s', confidence: 'High' },
      { pattern: 'Sector 3 rear-slip spikes', confirmedCause: 'High lean + throttle overlap on hot rear', intervention: 'Smoother throttle ramp + rear pressure validation', sessions: ['Stint 05'], effect: 'Risk −11 pts', confidence: 'Medium' },
    ],
    setupCheck: {
      question: 'Is rear rebound causing the instability?',
      evidenceFor: ['Rear slip appears on exit', 'Bike unsettles during throttle pickup'],
      evidenceAgainst: ['Instability only when lean stays above 55°', 'No issue when pickup happens below 53°'],
      verdict: 'Rear rebound may amplify the issue, but is not the primary cause.',
      decision: 'Do the rider correction first; apply rear rebound +2 only if instability remains.',
    },
    riskAnalysis: {
      observed: 'Rear slip spikes in Sector 3',
      cause: 'High lean + throttle overlap',
      amplifier: 'Rear tyre temperature',
      humanFactor: 'Fatigue after lap 6',
      intervention: 'Shorter stint + smoother throttle ramp + rear pressure validation',
      riskReduction: '−11 points',
    },
  };
}
