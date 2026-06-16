/**
 * raceControl.ts — KDD Race Control & Compliance.
 *
 * Races are lost in the stewards' room as often as on track. This is the
 * officiating-facing surface for the team: the live flag state, the track-limit
 * count creeping toward a long-lap penalty, the penalties pending and served,
 * the incidents under investigation and the scrutineering / parc-fermé technical
 * checklist — so nobody loses a result to a rule they could have managed.
 *
 *   KDD doesn't just race the track — it races the rulebook, so you don't lose
 *   in the office.
 *
 * Deterministic compliance model. Honest: a representative race-control picture,
 * not a live Race Direction feed.
 */

export type CheckStatus = 'pass' | 'check' | 'fail';
export type Flag = 'green' | 'yellow' | 'double-yellow' | 'red' | 'white' | 'chequered';

export interface CornerWarn { corner: string; count: number }
export interface Penalty { type: string; status: 'pending' | 'served' | 'investigation'; detail: string }
export interface Incident { lap: number; type: string; outcome: string }
export interface Check { item: string; status: CheckStatus; note: string }

export interface RaceControl {
  combo: string; circuit: string; flag: Flag;
  trackLimits: { warnings: number; limit: number; status: CheckStatus; corners: CornerWarn[]; note: string };
  penalties: Penalty[];
  incidents: Incident[];
  scrutineering: Check[];
  penaltyRisk: CheckStatus;
  recommendations: string[];
  verdict: string; punchline: string; confidence: number;
}

const CHECK_COLOR: Record<CheckStatus, string> = { pass: 'var(--green)', check: 'var(--yellow)', fail: 'var(--accent)' };
export function checkColor(s: CheckStatus): string { return CHECK_COLOR[s]; }
const FLAG_COLOR: Record<Flag, string> = {
  green: 'var(--green)', yellow: 'var(--yellow)', 'double-yellow': 'var(--yellow)',
  red: 'var(--accent)', white: 'var(--cyan)', chequered: 'var(--text)',
};
export function flagColor(f: Flag): string { return FLAG_COLOR[f]; }

export function buildRaceControl(rider: string, bike: string, circuit: string, turns: number): RaceControl {
  const limit = 3; // track-limit strikes before a long-lap penalty
  const corners: CornerWarn[] = [
    { corner: `T${Math.max(6, Math.round(turns * 0.5))} · fast exit`, count: 2 },
    { corner: `T${Math.max(2, Math.round(turns * 0.15))} · exit kerb`, count: 1 },
    { corner: `T${turns} · last corner`, count: 0 },
  ];
  const warnings = corners.reduce((a, c) => a + c.count, 0);
  const tlStatus: CheckStatus = warnings >= limit ? 'fail' : warnings >= limit - 1 ? 'check' : 'pass';

  const penalties: Penalty[] = [
    { type: 'Long-lap penalty', status: 'pending', detail: 'Track limits 4th time (if reached) — must serve within 3 laps.' },
    { type: 'Track-limit warning ×3', status: 'served', detail: 'Lap-time deleted in qualifying — none in the race yet.' },
  ];
  const incidents: Incident[] = [
    { lap: 1, type: 'Turn 1 contact (no fault)', outcome: 'No further action' },
    { lap: 8, type: 'Exceeding track limits', outcome: 'Warning (count 3)' },
  ];
  const scrutineering: Check[] = [
    { item: 'Minimum weight (157 kg)', status: 'pass', note: 'Bike + rider above the limit.' },
    { item: 'Ride-height device legal', status: 'pass', note: 'Front device disarmed off the start; rear within rules.' },
    { item: 'Tyre allocation', status: 'pass', note: 'Within the weekend allocation.' },
    { item: 'Front tyre pressure rule', status: 'check', note: 'Marginal — see Tyre Pressure module; bank legal laps in traffic.' },
    { item: 'Fuel sample / capacity', status: 'pass', note: '22 L max respected; sample ready for parc fermé.' },
    { item: 'Sound limit', status: 'pass', note: 'Within the dB limit.' },
  ];
  const penaltyRisk: CheckStatus = [tlStatus, ...scrutineering.map(s => s.status)].includes('fail')
    ? 'fail'
    : [tlStatus, ...scrutineering.map(s => s.status)].includes('check') ? 'check' : 'pass';

  return {
    combo: `${rider} · ${bike} · ${circuit}`,
    circuit, flag: 'green',
    trackLimits: {
      warnings, limit, status: tlStatus, corners,
      note: `${warnings} of ${limit} track-limit strikes — one more at the fast exit and the next is a long-lap penalty.`,
    },
    penalties,
    incidents,
    scrutineering,
    penaltyRisk,
    recommendations: [
      `Track limits: you are at ${warnings}/${limit}. Tighten the line at the fast exit (T${Math.max(6, Math.round(turns * 0.5))}) — that corner has 2 of your ${warnings} strikes.`,
      'Front pressure is the open compliance item — keep it above the line (see Tyre Pressure) to avoid a post-race penalty.',
      'If a long-lap is issued, serve it before the rear tyre cliff — never in the last 3 laps.',
      'Parc fermé: fuel sample and ride-height device settings are the usual checks — keep them within spec.',
    ],
    verdict: `Green flag, clean race so far — but you sit ${warnings}/${limit} on track limits and the front-pressure check is open. The penalty risk is ${penaltyRisk === 'pass' ? 'low' : penaltyRisk === 'check' ? 'real — manage it' : 'high — act now'}; tidy the fast exit and hold the front pressure.`,
    punchline: `Win the race, then pass scrutineering — both count.`,
    confidence: 0.82,
  };
}
