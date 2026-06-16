/**
 * chassis.ts — KDD Chassis & Geometry Lab.
 *
 * Aero buys grip from speed; this is where it comes from at any speed —
 * mechanical grip. The lab reads the bike geometry (rake, trail, ride height,
 * swingarm pivot, wheelbase), the weight distribution, the fork/shock settings
 * in clicks, the front/rear balance and the corner-phase behaviour, then turns
 * "it pushes on entry / spins on exit" into a specific chassis change.
 *
 *   KDD doesn't just describe the handling — it hands you the click, and what
 *   it will do.
 *
 * Deterministic chassis model derived from circuit shape. Honest: a
 * representative setup picture, not a live suspension-potentiometer feed.
 */

export type Balance = 'understeer' | 'neutral' | 'oversteer';

export interface GeometryParam { name: string; value: number; unit: string; effect: string }
export interface SuspSetting { item: string; clicks: number; range: number; effect: string }
export interface CornerPhase { phase: 'Entry' | 'Mid-corner' | 'Exit'; issue: string; lever: string }
export interface ChassisChange { param: string; direction: string; effect: string; phase: string }

export interface Chassis {
  combo: string; circuit: string;
  geometry: GeometryParam[];
  weightDist: { frontPct: number; rearPct: number; note: string };
  suspension: SuspSetting[];
  balance: { state: Balance; frontGrip: number; rearGrip: number; note: string };
  corners: CornerPhase[];
  changes: ChassisChange[];
  mechanicalNote: string;
  verdict: string; punchline: string; confidence: number;
}

const BALANCE_COLOR: Record<Balance, string> = { understeer: 'var(--cyan)', neutral: 'var(--green)', oversteer: 'var(--accent)' };
export function balanceColor(b: Balance): string { return BALANCE_COLOR[b]; }

export function buildChassis(rider: string, bike: string, circuit: string, turns: number): Chassis {
  // Tighter, slower tracks want more agility (less trail); fast flowing tracks
  // want stability (more trail). Derive a representative lean of the setup.
  const tight = turns >= 14;
  const trailMm = tight ? 100 : 108;
  const rakeDeg = tight ? 24.0 : 25.2;
  const frontPct = tight ? 51 : 50;

  return {
    combo: `${rider} · ${bike} · ${circuit}`,
    circuit,
    geometry: [
      { name: 'Rake', value: rakeDeg, unit: '°', effect: 'Lower = quicker steering, less stability on the brakes.' },
      { name: 'Trail', value: trailMm, unit: 'mm', effect: 'Less = more agile turn-in; more = calmer front.' },
      { name: 'Front ride height', value: 0, unit: 'mm Δ', effect: 'Raise to load the rear on exit; lower to help turn-in.' },
      { name: 'Rear ride height', value: tight ? 2 : 0, unit: 'mm Δ', effect: 'Raised slightly here for rotation off slow corners.' },
      { name: 'Swingarm pivot', value: tight ? 1 : 0, unit: 'mm up', effect: 'Up = more anti-squat + rear grip on power.' },
      { name: 'Wheelbase', value: tight ? 1455 : 1462, unit: 'mm', effect: 'Shorter = agile; longer = stable + traction.' },
    ],
    weightDist: { frontPct, rearPct: 100 - frontPct, note: `${frontPct}/${100 - frontPct} — ${tight ? 'slightly front-biased for braking stability and turn-in' : 'neutral for the fast direction changes'}.` },
    suspension: [
      { item: 'Fork preload', clicks: 6, range: 10, effect: 'Sets front ride height + support under braking.' },
      { item: 'Fork compression', clicks: 8, range: 20, effect: 'Controls dive; soften for more front feel into the apex.' },
      { item: 'Fork rebound', clicks: 10, range: 20, effect: 'How fast the front recovers; affects mid-corner stability.' },
      { item: 'Shock preload', clicks: 5, range: 10, effect: 'Rear ride height + squat balance.' },
      { item: 'Shock compression', clicks: 9, range: 20, effect: 'Bump absorption + anti-squat on power.' },
      { item: 'Shock rebound', clicks: 11, range: 20, effect: 'Rear stability on exit; too fast = chatter.' },
    ],
    balance: {
      state: 'understeer', frontGrip: 0.82, rearGrip: 0.90,
      note: 'Mild understeer mid-corner — the front gives up before the rear. Free the front, do not add rear.',
    },
    corners: [
      { phase: 'Entry', issue: 'Front pushes wide on trail-brake', lever: 'Soften fork compression 2 clicks · drop front 1mm' },
      { phase: 'Mid-corner', issue: 'Not enough front bite at apex', lever: 'Reduce trail (lower front) · less fork preload' },
      { phase: 'Exit', issue: 'Rear squats but grip is OK', lever: 'Raise swingarm pivot 1mm for anti-squat' },
    ],
    changes: [
      { param: 'Fork compression', direction: '−2 clicks (softer)', effect: 'More front feel + grip on entry', phase: 'Entry' },
      { param: 'Front ride height', direction: '−1 mm (lower)', effect: 'Quicker turn-in, kills the mid-corner push', phase: 'Mid-corner' },
      { param: 'Swingarm pivot', direction: '+1 mm (up)', effect: 'More anti-squat, steadier drive', phase: 'Exit' },
      { param: 'Shock rebound', direction: 'no change', effect: 'Rear is balanced — leave it', phase: 'Exit' },
    ],
    mechanicalNote: 'This is mechanical grip — it works at every speed. Pair it with the Aerodynamics Lab: if the front still pushes only in the fast corners, that is an aero-balance job, not a geometry one.',
    verdict: `Mild mid-corner understeer on a ${tight ? 'tight, agility' : 'fast, stability'}-biased setup (rake ${rakeDeg}°, trail ${trailMm}mm, ${frontPct}/${100 - frontPct}). Fix it from the front — soften compression and lower the front 1mm — don't chase it by stiffening the rear.`,
    punchline: `Cure the front, don't fight it with the rear.`,
    confidence: 0.83,
  };
}
