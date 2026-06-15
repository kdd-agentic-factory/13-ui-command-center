/**
 * federated.ts — Federated Motorsport Intelligence.
 *
 * KDD stops learning only from one rider: it compares against AGGREGATED,
 * ANONYMOUS statistics of similar rider+bike+circuit+condition profiles, and
 * surfaces percentiles, corner/technique benchmarks and "riders like you
 * improved by…" — privacy by design (raw telemetry, identity and setup stay
 * private; only aggregated patterns are shared).
 *
 *   Collective racing intelligence, private by design.
 *
 * Deterministic. The benchmark cohort is a modelled aggregate (no raw third-
 * party data is ever read or exposed) — the module says so.
 */

export type BenchmarkMode = 'private' | 'team' | 'federated' | 'academy';
export const BENCHMARK_MODES: { id: BenchmarkMode; label: string; desc: string }[] = [
  { id: 'private', label: 'Private', desc: 'Learn only from your own sessions.' },
  { id: 'team', label: 'Team', desc: 'Learn from the whole team.' },
  { id: 'federated', label: 'Federated', desc: 'Compare against anonymous global patterns.' },
  { id: 'academy', label: 'Academy', desc: 'Compare students within a school group.' },
];

export interface Percentile { metric: string; percentile: number }
export interface LapBenchmark { yourBest: string; groupMedian: string; top20: string; mainDiff: string }
export interface CornerBenchmark { corner: string; yours: number; median: number; top20: number; unit: string; limiter: string }
export interface TechniqueRow { skill: string; score: number; vs: 'Above' | 'Below' | 'On par' }
export interface PrivacyRow { field: string; status: string; private: boolean }
export interface RidersLikeYou { action: string; avgGain: string; corners: string[]; riskImpact: string; confidence: 'High' | 'Medium' | 'Low' }
export interface LearningBenchmark { block: string; yourProgress: string; similar: string; status: string; nextStep: string }

export interface Federated {
  combo: string;
  group: string;
  overallPercentile: number;
  strengths: string[];
  weaknesses: string[];
  mainOpportunity: string;
  gainToTop20: string;
  percentiles: Percentile[];
  lap: LapBenchmark;
  corners: CornerBenchmark[];
  technique: TechniqueRow[];
  privacy: PrivacyRow[];
  ridersLikeYou: RidersLikeYou;
  learning: LearningBenchmark;
  oracleContext: string;
  recommendedMission: string;
  confidence: number;
  cohortNote: string;
}

export function percentileColor(p: number): string { return p >= 70 ? 'var(--green)' : p >= 45 ? 'var(--yellow)' : 'var(--accent)'; }
export function vsColor(v: TechniqueRow['vs']): string { return v === 'Above' ? 'var(--green)' : v === 'Below' ? 'var(--accent)' : 'var(--text-muted)'; }

export function buildFederated(rider: string, bike: string, circuit: string): Federated {
  return {
    combo: `${rider} · ${bike} · ${circuit}`,
    group: 'Advanced amateur · 1000cc · dry track day',
    overallPercentile: 62,
    strengths: ['Braking stability', 'Line consistency', 'Sector 2 rhythm'],
    weaknesses: ['Exit drive', 'Throttle smoothness', 'Rear grip management'],
    mainOpportunity: 'T15 Bucine exit',
    gainToTop20: '-0.74s',
    percentiles: [
      { metric: 'Lap time', percentile: 62 },
      { metric: 'Braking', percentile: 78 },
      { metric: 'Line consistency', percentile: 84 },
      { metric: 'Throttle smoothness', percentile: 34 },
      { metric: 'Exit speed', percentile: 41 },
      { metric: 'Risk control', percentile: 57 },
    ],
    lap: { yourBest: '1:57.842', groupMedian: '1:58.210', top20: '1:56.900', mainDiff: 'Exit drive in T15 Bucine and T12 Correntaio.' },
    corners: [
      { corner: 'T15 Bucine', yours: 184, median: 187, top20: 191, unit: 'km/h', limiter: 'Throttle pickup while lean too high' },
      { corner: 'T12 Correntaio', yours: 162, median: 164, top20: 167, unit: 'km/h', limiter: 'Variable entry line' },
      { corner: 'T1 San Donato', yours: 171, median: 170, top20: 173, unit: 'km/h', limiter: 'On par — strong braking' },
    ],
    technique: [
      { skill: 'Braking aggression', score: 82, vs: 'Above' },
      { skill: 'Throttle smoothness', score: 54, vs: 'Below' },
      { skill: 'Lean reliance', score: 81, vs: 'Above' },
      { skill: 'Line consistency', score: 86, vs: 'Above' },
    ],
    privacy: [
      { field: 'Raw telemetry', status: 'Private', private: true },
      { field: 'Rider identity', status: 'Private', private: true },
      { field: 'Team setup data', status: 'Private', private: true },
      { field: 'Shared with federation', status: 'Aggregated patterns only', private: false },
      { field: 'Benchmark mode', status: 'Anonymous', private: false },
    ],
    ridersLikeYou: {
      action: 'Reducing lean before throttle pickup',
      avgGain: '-0.42s per lap',
      corners: ['Long exits', 'High-power exits', 'Late-apex corners'],
      riskImpact: 'Rear-slip events −28%',
      confidence: 'High',
    },
    learning: {
      block: 'Exit Drive Mastery',
      yourProgress: '+9 pts in 3 sessions',
      similar: '+6 pts in 3 sessions',
      status: 'Above expected progression',
      nextStep: 'Raise target: keep rear slip <9% while improving exit speed +4 km/h.',
    },
    oracleContext:
      'This pattern is common in Yamaha R1 riders at Mugello. Similar riders improved most when they corrected '
      + 'throttle timing before changing setup. Prioritise Exit Drive Mastery for one more stint; hold major setup '
      + 'changes until rear pressure is validated.',
    recommendedMission: 'Exit Drive Validation',
    confidence: 88,
    cohortNote: 'Benchmark cohort modelled from anonymised session statistics — no raw third-party telemetry, identity or video is read or exposed.',
  };
}
