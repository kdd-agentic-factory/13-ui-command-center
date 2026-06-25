/**
 * electronics.ts — KDD Electronics Control Lab (ECU & rider aids).
 *
 * The invisible co-rider. A MotoGP lap is shaped as much by the ECU as by the
 * throttle: power maps, traction control, anti-wheelie, engine braking, slide
 * control, the launch / holeshot device and the ride-height device. This module
 * reads the intervention telemetry, recommends the aid levels corner by corner,
 * and turns "the bike feels nervous on exit" into a specific map change.
 *
 *   KDD doesn't just log the electronics — it tunes the co-rider you can't see.
 *
 * Deterministic ECU model derived from circuit shape. Honest: a representative
 * electronics picture, not a live ECU datalog.
 */

export type AidStatus = 'aggressive' | 'balanced' | 'safe';

export interface PowerMap { id: string; name: string; character: string; chosen: boolean }
export interface AidSetting { aid: string; level: number; max: number; status: AidStatus; note: string }
export interface CornerElectronics { corner: string; type: 'slow' | 'medium' | 'fast'; tc: number; antiWheelie: number; engineBrake: number; note: string }

export interface Electronics {
  combo: string; circuit: string;
  maps: PowerMap[];
  aids: AidSetting[];
  launch: { launchControl: boolean; holeshotDevice: boolean; gainS: number; note: string };
  rideHeight: { equipped: boolean; frontDevice: string; rearDevice: string; zones: string[]; note: string };
  corners: CornerElectronics[];
  intervention: { tcPerLap: number; wheeliePerLap: number; note: string };
  recommendations: string[];
  verdict: string; punchline: string; confidence: number;
}

const STATUS_COLOR: Record<AidStatus, string> = { aggressive: 'var(--accent)', balanced: 'var(--green)', safe: 'var(--cyan)' };
export function aidColor(s: AidStatus): string { return STATUS_COLOR[s]; }

function aidStatus(level: number, max: number): AidStatus {
  const r = level / max;
  if (r <= 0.35) return 'aggressive';
  if (r >= 0.7) return 'safe';
  return 'balanced';
}

export function buildElectronics(rider: string, bike: string, circuit: string, turns: number): Electronics {
  const slowCount = Math.max(2, Math.round(turns * 0.4));
  const aids: AidSetting[] = [
    { aid: 'Traction control', level: 4, max: 8, status: 'balanced', note: 'Lets the rear spin a touch on exit; drop a step if grip improves.' },
    { aid: 'Anti-wheelie', level: 3, max: 8, status: 'aggressive', note: 'Low — keeps drive off slow corners; watch the front on crests.' },
    { aid: 'Engine braking', level: 5, max: 8, status: 'balanced', note: 'Stabilises entry into the hard stops; raise for more rear support.' },
    { aid: 'Slide control', level: 2, max: 8, status: 'aggressive', note: 'Permissive — rewards a rider who steers on the throttle.' },
  ].map(a => ({ ...a, status: aidStatus(a.level, a.max) }));

  const corners: CornerElectronics[] = [
    { corner: 'T1 · slow hairpin', type: 'slow', tc: 5, antiWheelie: 4, engineBrake: 6, note: 'High TC + AW: low grip, big lean-to-upright on exit.' },
    { corner: `T${Math.max(4, Math.round(turns * 0.35))} · medium`, type: 'medium', tc: 4, antiWheelie: 3, engineBrake: 5, note: 'Balanced — let it drive.' },
    { corner: `T${Math.max(7, Math.round(turns * 0.6))} · fast sweep`, type: 'fast', tc: 3, antiWheelie: 2, engineBrake: 4, note: 'Low intervention: bike is upright, grip is high.' },
    { corner: `T${Math.max(9, Math.round(turns * 0.8))} · slow chicane`, type: 'slow', tc: 5, antiWheelie: 4, engineBrake: 6, note: 'Protect the rear on the second apex.' },
  ];

  return {
    combo: `${rider} · ${bike} · ${circuit}`,
    circuit,
    maps: [
      { id: 'm1', name: 'Map 1 · Full', character: 'Sharpest throttle — qualifying & clear track', chosen: false },
      { id: 'm2', name: 'Map 2 · Race', character: 'Smoother pickup — best for tyre life', chosen: true },
      { id: 'm3', name: 'Map 3 · Wet/Safe', character: 'Soft throttle — low grip / rain', chosen: false },
    ],
    aids,
    launch: {
      launchControl: true, holeshotDevice: true, gainS: 0.15,
      note: 'Launch control + front holeshot device armed: front lowered on the grid, releases at ~T1. ~0.15s and a place into the first corner.',
    },
    rideHeight: {
      equipped: true, frontDevice: 'Holeshot (start only)', rearDevice: 'Rear lowering (per lap)',
      zones: [`Main straight exit (T${turns})`, 'Back straight', `Drive out of T${Math.max(4, Math.round(turns * 0.35))}`],
      note: 'Rear device lowers the bike on the straights to cut wheelie + drag, resets under braking. Banned at full lean.',
    },
    corners,
    intervention: {
      tcPerLap: 18, wheeliePerLap: 11,
      note: 'TC cut in 18×/lap (mostly the 3 slow exits), anti-wheelie 11×. If TC > 25 the rear is overworked — soften the map or the rear tyre is gone.',
    },
    recommendations: [
      'Stay on Map 2 for the race — Map 1 spins the rear past mid-distance.',
      `Slow corners (${slowCount} of them) carry TC 5 / AW 4; fast corners drop to TC 3 / AW 2.`,
      'If rear grip drops late, raise engine braking one step before touching TC — it stabilises entry without killing drive.',
      'Arm the holeshot device every start; rear ride-height device on the two long straights only.',
    ],
    verdict: `Map 2 with mid traction control and low anti-wheelie suits this layout — the ${slowCount} slow exits, not the fast stuff, drive the electronics. Tune the co-rider corner by corner, not with one global number.`,
    punchline: `The fastest setting is the one you don't feel.`,
    confidence: 0.84,
  };
}
