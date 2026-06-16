/**
 * championship.ts — KDD Championship Command (Season & Title Intelligence).
 *
 * The season altitude. Every other module is session-scoped; this one zooms
 * out to the title fight: the standings with form, the title maths (points to
 * the leader, max swing per weekend, the magic number to clinch), the live
 * what-if title scenarios, the MotoGP engine-allocation constraint, the rider
 * penalty-point tally and the concession tiers.
 *
 *   KDD doesn't just win the race in front of you — it tells you what it does
 *   to the championship.
 *
 * Deterministic season model. Honest: a representative title picture, not a
 * live results feed. Points model: 37 per weekend (25 GP + 12 Sprint win).
 */
import { gradeColor } from './palette';

export type Trend = 'up' | 'flat' | 'down';

export interface Standing { pos: number; rider: string; team: string; points: number; gap: number; trend: Trend; form: string[]; isYou: boolean }
export interface TitleScenario { label: string; condition: string; result: string; favourable: boolean }
export interface EngineUse { used: number; allowed: number; avgMileageKm: number; status: 'ok' | 'tight' | 'penalty-risk'; note: string }
export interface ConcessionTier { tier: 'A' | 'B' | 'C' | 'D'; testing: string; engineDev: string; isYou: boolean }
export interface PenaltyTally { rider: string; points: number; threshold: number; note: string }

export interface Championship {
  combo: string;
  round: number; totalRounds: number; racesRemaining: number; pointsAvailable: number;
  you: { pos: number; points: number; gapToLeader: number; trend: Trend; inContention: boolean };
  standings: Standing[];
  titleMath: { pointsToLeader: number; maxSwingPerWeekend: number; magicNumber: number; inControl: boolean };
  scenarios: TitleScenario[];
  engine: EngineUse;
  concessions: ConcessionTier[];
  penalties: PenaltyTally[];
  momentum: string[];
  verdict: string; punchline: string; confidence: number;
}

const TREND_COLOR: Record<Trend, string> = { up: 'var(--green)', flat: 'var(--text-muted)', down: 'var(--accent)' };
export function trendColor(t: Trend): string { return TREND_COLOR[t]; }
export function engineColor(s: EngineUse['status']): string {
  return gradeColor(s === 'ok' ? 'good' : s === 'tight' ? 'warn' : 'bad');
}

export function buildChampionship(rider: string, bike: string): Championship {
  const totalRounds = 22, round = 14;
  const racesRemaining = totalRounds - round;
  const pointsAvailable = racesRemaining * 37; // 25 GP + 12 Sprint per weekend

  const standings: Standing[] = [
    { pos: 1, rider: 'Bagnaia', team: 'Ducati', points: 312, gap: 0, trend: 'flat', form: ['1', '2', '1', '3', '1'], isYou: false },
    { pos: 2, rider, team: bike, points: 289, gap: 23, trend: 'up', form: ['2', '1', '3', '1', '2'], isYou: true },
    { pos: 3, rider: 'Martín', team: 'Ducati', points: 271, gap: 41, trend: 'down', form: ['3', 'DNF', '2', '2', '4'], isYou: false },
    { pos: 4, rider: 'Márquez', team: 'Ducati', points: 244, gap: 68, trend: 'up', form: ['4', '3', '1', '5', '3'], isYou: false },
    { pos: 5, rider: 'Bezzecchi', team: 'Aprilia', points: 198, gap: 114, trend: 'flat', form: ['6', '5', '4', 'DNF', '5'], isYou: false },
  ];
  const you = standings.find(s => s.isYou)!;
  const gapToLeader = you.gap;
  const magicNumber = gapToLeader + 1; // points you must out-score the leader by to clinch
  const inControl = pointsAvailable > gapToLeader && you.trend === 'up';

  return {
    combo: `${rider} · ${bike}`,
    round, totalRounds, racesRemaining, pointsAvailable,
    you: { pos: you.pos, points: you.points, gapToLeader, trend: you.trend, inContention: pointsAvailable >= gapToLeader },
    standings,
    titleMath: { pointsToLeader: gapToLeader, maxSwingPerWeekend: 37, magicNumber, inControl },
    scenarios: [
      { label: 'Win out (you take both, leader 2nd)', condition: 'You +37 vs his +20 each weekend', result: `Lead by ${Math.round((37 - 20) * racesRemaining - gapToLeader)} after the season — title yours`, favourable: true },
      { label: 'Match the leader', condition: 'You both score equally', result: `Finish ${gapToLeader} pts behind — runner-up`, favourable: false },
      { label: 'One leader DNF', condition: 'He scores 0 once, you win that weekend', result: `Swing of +37 — gap cut to ${Math.max(0, gapToLeader - 37)}, fight goes to the wire`, favourable: true },
      { label: 'Two bad weekends', condition: 'You average 8th while he wins', result: 'Mathematically out by the penultimate round', favourable: false },
    ],
    engine: {
      used: 6, allowed: 9, avgMileageKm: 1820, status: 'tight',
      note: '6 of 9 engines used at round 14 — 3 left for 8 weekends. One extra = back-of-grid penalty. Manage mileage in practice.',
    },
    concessions: [
      { tier: 'A', testing: 'Unlimited test days + wildcards', engineDev: 'In-season engine dev allowed', isYou: false },
      { tier: 'B', testing: 'Extra test days', engineDev: 'Limited dev', isYou: false },
      { tier: 'C', testing: 'Standard allocation', engineDev: 'Frozen at homologation', isYou: true },
      { tier: 'D', testing: 'Reduced — front-running manufacturer', engineDev: 'Frozen', isYou: false },
    ],
    penalties: [
      { rider: 'Acosta', points: 5, threshold: 12, note: 'Two track-limit warnings + one jump start' },
      { rider: 'Martín', points: 3, threshold: 12, note: 'Irresponsible riding (FP)' },
      { rider, points: 1, threshold: 12, note: 'One track-limit warning — clean' },
    ],
    momentum: you.form,
    verdict: `P${you.pos}, ${gapToLeader} pts down with ${pointsAvailable} still on the table and the form line trending up. The title is alive — but the 3-engine-for-8-weekends constraint, not raw pace, is the real risk now.`,
    punchline: `Win the title in the data room, not just on track.`,
    confidence: 0.82,
  };
}
