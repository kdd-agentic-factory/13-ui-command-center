/**
 * patternMiner.ts — Multi-Session Pattern Miner.
 *
 * KDD stops analysing a single stint and mines what RECURS across many sessions,
 * circuits, bikes and conditions: the repeated loss, its likely source (rider /
 * bike-setup / circuit), the historical trend, validated corrections and the
 * progress over time. Longitudinal performance intelligence.
 *
 * Deterministic and personalised to the active rider+bike, built over the same
 * decision/setup history the Black Box and Knowledge Graph use.
 */

export interface CornerLoss { corner: string; loss: number }  // avg seconds lost
export interface SourceSplit { rider: number; bike: number; circuit: number } // % (sum 100)

export interface PatternCard {
  id: string;
  pattern: string;
  detectedIn: string;          // "7 / 9 recent sessions"
  frequency: number;           // 0..1
  circuits: string[];
  corners: CornerLoss[];
  avgLoss: number;             // s per affected corner
  riskImpact: 'Low' | 'Medium' | 'High';
  telemetry: string[];
  source: SourceSplit;
  diagnosis: string;
  bestCorrection: string;
  trainingBlock: string;
  setupCheck: string[];
  confidence: number;          // 0..100
}

export interface HistoricalComparison {
  metric: string;
  current: number;
  avgLast5: number;
  target: number;
  trend: 'Improving' | 'Flat' | 'Declining';
}

export interface SetupEffectiveness {
  change: string;
  applied: number;
  validated: number;
  avgSlipReduction: string;
  avgLapGain: string;
  riskImpact: string;
  status: string;
}

export interface ProgressInsight {
  headline: string;
  mostImproved: string;
  stillUnresolved: string;
}

export interface PatternMine {
  combo: string;
  scope: string;               // "Last 9 sessions"
  patterns: PatternCard[];
  comparisons: HistoricalComparison[];
  setupHistory: SetupEffectiveness[];
  progress: ProgressInsight;
  oracleContext: string;
}

export function riskColor(r: PatternCard['riskImpact']): string {
  return r === 'High' ? 'var(--accent)' : r === 'Medium' ? 'var(--yellow)' : 'var(--green)';
}
export function trendColor(t: HistoricalComparison['trend']): string {
  return t === 'Improving' ? 'var(--green)' : t === 'Declining' ? 'var(--accent)' : 'var(--text-muted)';
}

const GPS_NOTE = ' (estimated — GPS-only bike)';

export function buildPatternMine(rider: string, bike: string, telemetryLimited = false): PatternMine {
  const first = rider.split(' ')[0];
  return {
    combo: `${rider} · ${bike}`,
    scope: 'Last 9 sessions',
    patterns: [
      {
        id: 'p1',
        pattern: 'Late throttle pickup on corner exit',
        detectedIn: '7 / 9 recent sessions',
        frequency: 7 / 9,
        circuits: ['Mugello', 'Jarama', 'Jerez'],
        corners: [
          { corner: 'T15 Bucine', loss: 0.31 },
          { corner: 'T12 Correntaio', loss: 0.22 },
          { corner: 'T1 San Donato', loss: 0.19 },
          { corner: 'T7 Savelli', loss: 0.16 },
          { corner: 'T8/T9 Arrabbiata', loss: 0.12 },
        ],
        avgLoss: 0.2,
        riskImpact: 'Medium',
        telemetry: ['Lean >55°', 'Throttle pickup delayed 0.2–0.4s', `Rear slip >12%${telemetryLimited ? GPS_NOTE : ''}`],
        source: { rider: 70, bike: 20, circuit: 10 },
        diagnosis: 'Mainly rider-style related — the pattern appears across different circuits and conditions, amplified on high-power exits.',
        bestCorrection: 'Pick the bike up earlier before throttle; rear rebound +2 clicks only if rear slip persists.',
        trainingBlock: 'Exit Drive Mastery',
        setupCheck: ['Rear rebound behaviour', 'Rear hot pressure'],
        confidence: 88,
      },
      {
        id: 'p2',
        pattern: 'Rear soft thermal cliff at end of stint',
        detectedIn: '5 / 9 recent sessions',
        frequency: 5 / 9,
        circuits: ['Mugello', 'Jerez'],
        corners: [
          { corner: 'Sector 3 (hot laps)', loss: 0.18 },
          { corner: 'T15 Bucine', loss: 0.14 },
        ],
        avgLoss: 0.16,
        riskImpact: 'Medium',
        telemetry: ['Rear temp >124°C', 'Grip drop >10% after L19', 'Exit speed −4 km/h'],
        source: { rider: 25, bike: 55, circuit: 20 },
        diagnosis: 'Mostly setup/tyre related — grip drop tracks rear pressure window and compound on hot tracks.',
        bestCorrection: 'Rear medium for race stints >12 laps; manage TC for the last 4 laps.',
        trainingBlock: 'Tyre Preservation',
        setupCheck: ['Rear compound choice', 'Hot pressure target'],
        confidence: 81,
      },
      {
        id: 'p3',
        pattern: 'Conservative entry on cold tyres (first 2 laps)',
        detectedIn: '4 / 9 recent sessions',
        frequency: 4 / 9,
        circuits: ['Jarama'],
        corners: [
          { corner: 'T1 San Donato', loss: 0.21 },
          { corner: 'T6 Casanova', loss: 0.1 },
        ],
        avgLoss: 0.15,
        riskImpact: 'Low',
        telemetry: ['Brake load −15% (laps 1–2)', 'Apex speed −5 km/h'],
        source: { rider: 60, bike: 10, circuit: 30 },
        diagnosis: 'Rider warm-up caution — recovers within two laps; circuit-specific at cold Jarama mornings.',
        bestCorrection: 'Two-lap warm-up plan with progressive brake load.',
        trainingBlock: 'Braking Control',
        setupCheck: ['Front cold pressure'],
        confidence: 72,
      },
    ],
    comparisons: [
      { metric: 'Throttle smoothness', current: 54, avgLast5: 49, target: 70, trend: 'Improving' },
      { metric: 'Exit-phase loss (T15)', current: 31, avgLast5: 38, target: 20, trend: 'Improving' },
      { metric: 'Rear slip at pickup', current: 12, avgLast5: 14, target: 10, trend: 'Improving' },
      { metric: 'Consistency', current: 86, avgLast5: 84, target: 90, trend: 'Flat' },
    ],
    setupHistory: [
      { change: 'Rear rebound +2 clicks', applied: 3, validated: 2, avgSlipReduction: '−3.8%', avgLapGain: '−0.24s', riskImpact: 'neutral', status: 'Recommended for Mugello-style exits' },
      { change: 'TC4 → TC5 (Sector 3)', applied: 2, validated: 0, avgSlipReduction: '−1.1%', avgLapGain: '+0.07s', riskImpact: 'lower', status: 'Rejected — time cost over budget' },
      { change: 'Rear soft → medium (long runs)', applied: 2, validated: 1, avgSlipReduction: '−2.0%', avgLapGain: '+0.10s short / −0.15s end', riskImpact: 'lower', status: 'Use for stints >12 laps' },
    ],
    progress: {
      headline: `${first} has reduced average exit-phase loss by 18% over the last 4 sessions.`,
      mostImproved: 'T12 Correntaio exit',
      stillUnresolved: 'T15 Bucine exit under high rear-tyre temperature',
    },
    oracleContext:
      'This is not a new issue — late throttle pickup has appeared in 7 of the last 9 sessions. ' +
      'Rear rebound +2 helped stability but did not fully solve throttle timing. ' +
      'Recommendation: do not make another setup change yet; repeat the Exit Drive Mastery drill for one more stint.',
  };
}
