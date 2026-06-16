/**
 * gearing.ts — KDD Gearing & Transmission Lab.
 *
 * The last engineering pillar: how the power reaches the road. Tall gearing buys
 * top speed but blunts acceleration off the slow corners; short gearing does the
 * opposite, and an uneven ratio drops the engine off the boil between shifts.
 * This lab lays out the six ratios with their top speeds, the final drive, the
 * shift points corner by corner, the rpm drop between gears and the call.
 *
 *   KDD doesn't just count the gears — it tells you which tooth to change and
 *   what it buys you.
 *
 * Deterministic transmission model derived from circuit shape. Honest: a
 * representative gearing picture, not a live gearbox datalog.
 */

export type GapStatus = 'even' | 'tall' | 'short';

export interface GearRatio { gear: number; ratio: number; topSpeedKmh: number; note: string }
export interface ShiftPoint { corner: string; gear: number; action: 'up' | 'down' | 'hold'; rpm: number }
export interface RpmGap { fromTo: string; dropRpm: number; status: GapStatus }

export interface Gearing {
  combo: string; circuit: string; revLimit: number;
  finalDrive: { front: number; rear: number; ratio: number };
  gears: GearRatio[];
  topSpeed6thKmh: number; trapKmh: number;
  shifts: ShiftPoint[];
  rpmGaps: RpmGap[];
  recommendations: string[];
  verdict: string; punchline: string; confidence: number;
}

const GAP_COLOR: Record<GapStatus, string> = { even: 'var(--green)', tall: 'var(--yellow)', short: 'var(--cyan)' };
export function gapColor(s: GapStatus): string { return GAP_COLOR[s]; }

export function buildGearing(rider: string, bike: string, circuit: string, turns: number, mainStraightKm: number | null): Gearing {
  const straight = mainStraightKm ?? 0.9;
  const longStraight = straight >= 1.0;
  const revLimit = 18000;
  // Long straight → taller final drive (smaller rear sprocket) for top speed.
  const rear = longStraight ? 40 : 42;
  const front = 16;
  const finalRatio = Math.round((rear / front) * 1000) / 1000;
  const topSpeed6th = Math.round(338 + straight * 18 - (rear - 40) * 2);

  const ratios = [2.50, 2.00, 1.70, 1.50, 1.36, 1.25];
  const gears: GearRatio[] = ratios.map((ratio, i) => {
    const top = Math.round(topSpeed6th * (ratios[5] / ratio));
    const note = i === 0 ? 'Off the slow hairpins' : i === 5 ? 'Top speed down the straight' : `Corners ~T${Math.max(2, Math.round(turns * (i / 6)))}`;
    return { gear: i + 1, ratio, topSpeedKmh: top, note };
  });

  const rpmGaps: RpmGap[] = [];
  for (let i = 1; i < ratios.length; i++) {
    const drop = Math.round((1 - ratios[i] / ratios[i - 1]) * revLimit);
    const status: GapStatus = drop > 3300 ? 'tall' : drop < 2300 ? 'short' : 'even';
    rpmGaps.push({ fromTo: `${i}→${i + 1}`, dropRpm: drop, status });
  }

  return {
    combo: `${rider} · ${bike} · ${circuit}`,
    circuit, revLimit,
    finalDrive: { front, rear, ratio: finalRatio },
    gears,
    topSpeed6thKmh: topSpeed6th, trapKmh: topSpeed6th - 4,
    shifts: [
      { corner: 'T1 · slow hairpin', gear: 1, action: 'down', rpm: 9200 },
      { corner: `T${Math.max(4, Math.round(turns * 0.35))} · medium`, gear: 3, action: 'hold', rpm: 13800 },
      { corner: `T${Math.max(7, Math.round(turns * 0.6))} · fast`, gear: 4, action: 'up', rpm: 15600 },
      { corner: 'Main straight', gear: 6, action: 'up', rpm: revLimit - 300 },
      { corner: `T${turns} · last corner`, gear: 2, action: 'down', rpm: 10400 },
    ],
    rpmGaps,
    recommendations: [
      longStraight
        ? `Long straight: tall final drive (${front}/${rear}) holds ~${topSpeed6th} km/h in 6th for the slipstream.`
        : `No dominant straight: shorter final drive (${front}/${rear}) sharpens drive off the slow corners.`,
      rpmGaps.some(g => g.status === 'tall')
        ? `Gap ${rpmGaps.find(g => g.status === 'tall')!.fromTo} drops too many revs — the engine falls off the boil; close it a tooth if you can.`
        : 'Ratio spacing is even — the engine stays in the meat of the powerband between shifts.',
      'Make 1st tall enough to launch without bogging but short enough for the slowest hairpin.',
      'Set 6th so you just touch the limiter a beat before braking — never bouncing off it down the straight.',
    ],
    verdict: `${longStraight ? 'Top-speed' : 'Acceleration'}-biased gearing (${front}/${rear} final, ${topSpeed6th} km/h in 6th). Spacing is ${rpmGaps.every(g => g.status === 'even') ? 'even — engine stays on the boil' : 'slightly uneven — watch the big jump between gears'}. ${longStraight ? 'Protect the trap speed.' : 'Favour the drive out of the slow corners.'}`,
    punchline: `The right gear is the one that's already pulling when you pick up the throttle.`,
    confidence: 0.83,
  };
}
