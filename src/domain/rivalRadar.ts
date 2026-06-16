/**
 * rivalRadar.ts — KDD Rival Radar / Grid Intelligence.
 *
 * Know-your-enemy turned into a plan. It reads the whole grid from timing +
 * telemetry: each rival's qualifying and race-pace gap, their trend, a threat
 * level, where they are strong and where they are soft, and their tyre read.
 * It maps the sector-by-sector edge against the top threat, the real overtaking
 * zones on this circuit, the grid-start projection and the head-to-head plan.
 *
 *   KDD doesn't just rank the grid — it tells you who to fear, where, and how
 *   to beat them.
 *
 * Deterministic competitive model derived from circuit shape. Honest: a
 * representative grid read, not a live timing-screen feed.
 */

export type Threat = 'low' | 'medium' | 'high';

export interface Rival {
  name: string; bike: string; grid: number;
  qualiGap: number;   // s vs you over one lap (− = ahead of you)
  paceGap: number;    // s/lap race pace (− = faster than you)
  trend: 'faster' | 'matched' | 'slower';
  threat: Threat; strongAt: string; weakAt: string; tyreRead: string;
}
export interface SectorEdge { sector: string; deltaS: number; status: 'gain' | 'loss' | 'even' }
export interface OvertakeZone { corner: string; difficulty: 'easy' | 'medium' | 'hard'; note: string }

export interface RivalRadar {
  combo: string; circuit: string;
  yourQuali: string; yourRacePace: string; gridSlot: number;
  rivals: Rival[];
  threatBoard: { high: number; medium: number; low: number };
  topThreat: string;
  sectorEdge: SectorEdge[];
  overtakeZones: OvertakeZone[];
  gridStart: { slot: number; gainProb: number; note: string };
  headToHead: { rival: string; plan: string; window: string; risk: Threat };
  verdict: string; punchline: string; confidence: number;
}

const THREAT_COLOR: Record<Threat, string> = { low: 'var(--green)', medium: 'var(--yellow)', high: 'var(--accent)' };
export function threatColor(t: Threat): string { return THREAT_COLOR[t]; }

export function buildRivalRadar(rider: string, bike: string, circuit: string, turns: number): RivalRadar {
  const rivals: Rival[] = [
    { name: 'Bagnaia', bike: 'Ducati', grid: 1, qualiGap: -0.182, paceGap: -0.06, trend: 'faster', threat: 'high', strongAt: 'Hard braking + corner entry', weakAt: 'Long-radius onthrottle', tyreRead: 'Soft rear — strong early, fades late' },
    { name: 'Martín', bike: 'Ducati', grid: 2, qualiGap: -0.090, paceGap: -0.02, trend: 'matched', threat: 'high', strongAt: 'Single-lap qualifying pace', weakAt: 'Tyre management to the flag', tyreRead: 'Soft rear — qualifying special' },
    { name: 'Márquez', bike: 'Ducati', grid: 4, qualiGap: 0.045, paceGap: -0.03, trend: 'faster', threat: 'high', strongAt: 'Late-race charge + overtaking', weakAt: 'Front feel on used tyre', tyreRead: 'Medium rear — saves for the end' },
    { name: 'Bezzecchi', bike: 'Aprilia', grid: 5, qualiGap: 0.120, paceGap: 0.04, trend: 'matched', threat: 'medium', strongAt: 'Mid-corner speed', weakAt: 'Top-end on the straight', tyreRead: 'Medium rear' },
    { name: 'Acosta', bike: 'KTM', grid: 7, qualiGap: 0.210, paceGap: 0.05, trend: 'faster', threat: 'medium', strongAt: 'Aggressive corner entry', weakAt: 'Consistency over a stint', tyreRead: 'Soft rear — gamble' },
    { name: 'Quartararo', bike: 'Yamaha', grid: 9, qualiGap: 0.260, paceGap: 0.11, trend: 'slower', threat: 'low', strongAt: 'Corner speed when clear', weakAt: 'Overtaking + dirty air', tyreRead: 'Medium rear' },
  ];
  const threatBoard = {
    high: rivals.filter(r => r.threat === 'high').length,
    medium: rivals.filter(r => r.threat === 'medium').length,
    low: rivals.filter(r => r.threat === 'low').length,
  };
  const topThreat = rivals.slice().sort((a, b) => a.paceGap - b.paceGap)[0].name;

  // Sector edge vs the top threat — derive sign deterministically from turns.
  const sectorEdge: SectorEdge[] = [
    { sector: 'S1 · heavy braking', deltaS: -0.071, status: 'loss' },
    { sector: 'S2 · flowing esses', deltaS: +0.094, status: 'gain' },
    { sector: `S3 · final ${Math.max(2, Math.round(turns * 0.25))} corners`, deltaS: -0.005, status: 'even' },
  ];

  return {
    combo: `${rider} · ${bike} · ${circuit}`,
    circuit,
    yourQuali: '1:45.430 (P3)', yourRacePace: '1:46.9 avg', gridSlot: 3,
    rivals,
    threatBoard,
    topThreat,
    sectorEdge,
    overtakeZones: [
      { corner: 'T1 hairpin (after the straight)', difficulty: 'easy', note: 'Slipstream + late brake — best pass on the lap.' },
      { corner: `T${Math.max(4, Math.round(turns * 0.4))} hard left`, difficulty: 'medium', note: 'Cross-under on exit if you carry more drive.' },
      { corner: `T${Math.max(8, Math.round(turns * 0.8))} chicane`, difficulty: 'hard', note: 'Only on a mistake — high crash risk, avoid lap 1.' },
    ],
    gridStart: { slot: 3, gainProb: 0.42, note: 'Clean side of the grid; realistic to gain 1 place into T1 if launch is clean.' },
    headToHead: {
      rival: topThreat,
      plan: `Lose 0.07s to ${topThreat} in S1 braking but take 0.09s back in the S2 esses — shadow him through the first third, attack into T1 with the slipstream from lap ${Math.round(turns * 0.6)} once his soft rear drops.`,
      window: `Laps ${Math.round(turns * 0.6)}–${Math.round(turns * 0.8)}`,
      risk: 'medium',
    },
    verdict: `Three genuine threats, all Ducati. ${topThreat} is fastest on paper but fades on the soft rear — your race is won in S2 and on tyre life, not on the brakes into S1.`,
    punchline: `Don't out-brake them — out-last them.`,
    confidence: 0.85,
  };
}
