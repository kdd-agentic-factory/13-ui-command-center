/**
 * qualifying.ts — KDD Qualifying Lab (the single-lap discipline).
 *
 * Race pace, grid intel and the title are covered elsewhere; this is the
 * time-trial altitude. It reconstructs the ideal lap from your best sectors
 * (the pole that is already in you), splits each sector vs the pole reference,
 * plans the tow, the tyre prep and the out-lap, reads track evolution to pick
 * the run window and lays out the Q1/Q2 run plan.
 *
 *   KDD doesn't just time your lap — it shows you the lap you already have.
 *
 * Deterministic single-lap model. Honest: a representative qualifying picture,
 * not a live timing-screen feed. All times in seconds.
 */

export type RunQuality = 'optimal' | 'good' | 'compromised';

export interface QualiSector { sector: string; yourBest: number; yourIdeal: number; pole: number }
export interface QualiRun { run: string; laps: number; tyre: string; quality: RunQuality; note: string }
export interface EvoPoint { minute: number; gripPct: number }

export interface Qualifying {
  combo: string; circuit: string;
  poleRef: number; yourBest: number; gapToPole: number;
  theoreticalBest: number; timeOnTable: number; poleInReach: boolean;
  sectors: QualiSector[];
  tow: { gainS: number; targetLap: number; risk: RunQuality; note: string };
  tyrePrep: { outLap: string; pushLaps: number; window: string; note: string };
  evolution: EvoPoint[]; bestWindowMin: number;
  runPlan: QualiRun[];
  poleProb: number; verdict: string; punchline: string; confidence: number;
}

const QUALITY_COLOR: Record<RunQuality, string> = { optimal: 'var(--green)', good: 'var(--yellow)', compromised: 'var(--accent)' };
export function qualityColor(q: RunQuality): string { return QUALITY_COLOR[q]; }

/** mm:ss.SSS from seconds. */
export function fmtLap(s: number): string {
  const m = Math.floor(s / 60);
  const rest = (s - m * 60).toFixed(3).padStart(6, '0');
  return `${m}:${rest}`;
}

export function buildQualifying(rider: string, bike: string, circuit: string, turns: number, lengthKm: number): Qualifying {
  const sectors: QualiSector[] = [
    { sector: 'S1 · stop-go', yourBest: 28.40, yourIdeal: 28.30, pole: 28.30 },
    { sector: 'S2 · flowing', yourBest: 41.20, yourIdeal: 41.05, pole: 41.05 },
    { sector: `S3 · final ${Math.max(2, Math.round(turns * 0.25))} corners`, yourBest: 35.83, yourIdeal: 35.75, pole: 35.83 },
  ];
  const yourBest = Math.round(sectors.reduce((a, s) => a + s.yourBest, 0) * 1000) / 1000;
  const theoreticalBest = Math.round(sectors.reduce((a, s) => a + s.yourIdeal, 0) * 1000) / 1000;
  const poleRef = Math.round(sectors.reduce((a, s) => a + s.pole, 0) * 1000) / 1000;
  const gapToPole = Math.round((yourBest - poleRef) * 1000) / 1000;
  const timeOnTable = Math.round((yourBest - theoreticalBest) * 1000) / 1000;
  const poleInReach = theoreticalBest <= poleRef;

  return {
    combo: `${rider} · ${bike} · ${circuit}`,
    circuit,
    poleRef, yourBest, gapToPole, theoreticalBest, timeOnTable, poleInReach,
    sectors,
    tow: {
      gainS: 0.18, targetLap: 3, risk: 'good',
      note: `~0.18s of tow down the ${lengthKm >= 1 ? `${lengthKm.toFixed(1)} km ` : ''}main straight — pick up a rider into the lap, but leave a 4–5s gap so you reach the line in clean air.`,
    },
    tyrePrep: {
      outLap: 'One build lap: weave + two hard stops to load the front, brake-drag to hold rear temp.',
      pushLaps: 2, window: 'Soft rear: 1 banker + 1 attack before the edge greases',
      note: 'Front pressure to the low end of the window for one-lap bite; only two genuine push laps in the tyre.',
    },
    evolution: [
      { minute: 0, gripPct: 100 }, { minute: 3, gripPct: 100.4 }, { minute: 6, gripPct: 100.8 },
      { minute: 9, gripPct: 101.3 }, { minute: 12, gripPct: 101.7 }, { minute: 14, gripPct: 101.9 },
    ],
    bestWindowMin: 12,
    runPlan: [
      { run: 'Run 1 · banker', laps: 3, tyre: 'Used soft', quality: 'good', note: 'Bank a clean lap early in case of a late red flag.' },
      { run: 'Cool-down', laps: 1, tyre: '—', quality: 'good', note: 'Box, drop tyre temp, reset the front.' },
      { run: 'Run 2 · attack', laps: 3, tyre: 'New soft', quality: 'optimal', note: `Bolt-on new softs, exploit peak grip at ~min 12, take the tow on the out-lap.` },
    ],
    poleProb: 0.34,
    verdict: poleInReach
      ? `Your ideal lap (${fmtLap(theoreticalBest)}) already beats pole (${fmtLap(poleRef)}) — you are leaving ${timeOnTable.toFixed(3)}s on the table, almost all of it in S1 braking. Stitch the sectors and the front row is yours.`
      : `Pole is ${gapToPole.toFixed(3)}s away and ${timeOnTable.toFixed(3)}s of that is yours to find by linking your best sectors.`,
    punchline: `The pole lap is already in the data — go and drive it.`,
    confidence: 0.8,
  };
}
