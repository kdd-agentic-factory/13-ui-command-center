/**
 * videoStudio.ts — Telemetry + Video Studio.
 *
 * Synchronises an onboard view with the telemetry channels along a lap: a
 * single playhead drives speed / throttle / brake / lean / gear / rpm / rear
 * slip together, with corner markers and curated clips that jump to the exact
 * moment of interest (e.g. the late T15 Bucine pickup).
 *
 * HONESTY: there is no real camera footage in the dataset, so the "video" is a
 * telemetry-driven reconstruction of the onboard view (bike position on the
 * real circuit outline + a synced HUD), and the page says so. On GPS-only
 * bikes the ECU/IMU channels are flagged estimated, not measured.
 */

export interface TelemetryFrame {
  t: number;          // seconds from lap start
  distPct: number;    // 0–1 around the lap (drives position on the outline)
  speed: number;      // km/h
  throttle: number;   // 0–100 %
  brake: number;      // 0–100 %
  lean: number;       // degrees
  gear: number;       // 1–6
  rpm: number;        // engine rpm
  rearSlip: number;   // %
}

export interface ChannelDef {
  id: keyof Pick<TelemetryFrame, 'speed' | 'throttle' | 'brake' | 'lean' | 'gear' | 'rpm' | 'rearSlip'>;
  label: string;
  unit: string;
  color: string;
  max: number;
  estimatedOnGps: boolean;
}

export const CHANNELS: ChannelDef[] = [
  { id: 'speed',    label: 'Speed',     unit: 'km/h', color: '#00B7FF', max: 300, estimatedOnGps: false },
  { id: 'throttle', label: 'Throttle',  unit: '%',    color: '#22C55E', max: 100, estimatedOnGps: true },
  { id: 'brake',    label: 'Brake',     unit: '%',    color: 'var(--accent)', max: 100, estimatedOnGps: true },
  { id: 'lean',     label: 'Lean',      unit: '°',    color: 'var(--yellow)', max: 60,  estimatedOnGps: true },
  { id: 'gear',     label: 'Gear',      unit: '',     color: '#A855F7', max: 6,   estimatedOnGps: true },
  { id: 'rpm',      label: 'RPM',       unit: '',     color: '#FF6A00', max: 16000, estimatedOnGps: true },
  { id: 'rearSlip', label: 'Rear slip', unit: '%',    color: 'var(--accent)', max: 20,  estimatedOnGps: true },
];

export interface CornerMark { name: string; pct: number; }
export interface VideoClip { id: string; t: number; corner: string; note: string; severity: 'info' | 'loss' | 'gain'; }

export interface VideoTrack {
  combo: string;
  lap: string;
  lapOptions: string[];
  duration: number;        // seconds
  frames: TelemetryFrame[];
  corners: CornerMark[];
  clips: VideoClip[];
  estimated: boolean;      // GPS-only bike: ECU/IMU channels reconstructed
  reconstructed: true;     // no real footage — onboard view is telemetry-driven
}

// Mugello corner anchors: distance fraction, apex speed (km/h), peak lean (°).
const CORNERS: Array<{ name: string; pct: number; apex: number; lean: number }> = [
  { name: 'T1 San Donato', pct: 0.10, apex: 95,  lean: 50 },
  { name: 'T2 Luco',       pct: 0.18, apex: 132, lean: 45 },
  { name: 'T4 Materassi',  pct: 0.26, apex: 150, lean: 48 },
  { name: 'T6 Savelli',    pct: 0.36, apex: 85,  lean: 55 },
  { name: 'T8 Arrabbiata', pct: 0.50, apex: 128, lean: 53 },
  { name: 'T10 Scarperia', pct: 0.60, apex: 112, lean: 50 },
  { name: 'T12 Correntaio',pct: 0.66, apex: 100, lean: 52 },
  { name: 'T14 Biondetti', pct: 0.80, apex: 122, lean: 48 },
  { name: 'T15 Bucine',    pct: 0.88, apex: 105, lean: 56 },
];

const TOP_SPEED = 292;
const LAP_DURATION = 117.842;  // honest rider-arc R1 track-day reference
const N = 120;

function gearFor(speed: number): number {
  if (speed < 90) return 1;
  if (speed < 130) return 2;
  if (speed < 170) return 3;
  if (speed < 210) return 4;
  if (speed < 250) return 5;
  return 6;
}
const GEAR_MIN = [0, 70, 110, 150, 190, 230, 255];
const GEAR_MAX = [0, 130, 170, 210, 250, 292, 300];

export function buildVideoTrack(rider: string, bike: string, circuit: string, lap = 'Stint 03 · Lap 5 (best)', telemetryLimited = false): VideoTrack {
  // 1. Speed profile: top speed minus a dip around each corner apex.
  const speeds: number[] = [];
  for (let i = 0; i < N; i++) {
    const p = i / (N - 1);
    let s = TOP_SPEED;
    for (const c of CORNERS) {
      const d = Math.min(Math.abs(p - c.pct), 1 - Math.abs(p - c.pct)); // wrap
      const g = Math.exp(-((d / 0.045) ** 2));
      s = Math.min(s, c.apex + (TOP_SPEED - c.apex) * (1 - g));
    }
    speeds.push(s);
  }

  // 2. Derive the rest from the speed curve + corner proximity.
  const frames: TelemetryFrame[] = speeds.map((speed, i) => {
    const p = i / (N - 1);
    const prev = speeds[Math.max(0, i - 1)];
    const dv = speed - prev;

    // nearest corner proximity (for lean + slip)
    let lean = 3, apexBucine = false;
    for (const c of CORNERS) {
      const d = Math.min(Math.abs(p - c.pct), 1 - Math.abs(p - c.pct));
      const g = Math.exp(-((d / 0.05) ** 2));
      if (g * c.lean > lean) { lean = g * c.lean; apexBucine = c.name === 'T15 Bucine' && g > 0.5; }
    }

    const brake = dv < -1.2 ? Math.min(100, Math.round(-dv * 22)) : 0;
    const throttle = dv > 0.2 ? Math.min(100, Math.round(40 + dv * 26)) : (brake > 0 ? 0 : 28);
    const gear = gearFor(speed);
    const span = Math.max(1, GEAR_MAX[gear] - GEAR_MIN[gear]);
    const rpm = Math.round(7500 + ((speed - GEAR_MIN[gear]) / span) * 8000);
    // rear slip spikes on corner exit (throttle up while still leaned), worst at Bucine
    const exitLoad = throttle > 45 && lean > 40 ? (throttle / 100) * (lean / 56) : 0;
    const rearSlip = +(exitLoad * (apexBucine ? 16 : 11)).toFixed(1);

    return {
      t: +(p * LAP_DURATION).toFixed(2), distPct: p,
      speed: Math.round(speed), throttle, brake, lean: Math.round(lean),
      gear, rpm: Math.min(15800, rpm), rearSlip,
    };
  });

  return {
    combo: `${circuit} · ${rider} · ${bike}`,
    lap,
    lapOptions: ['Stint 03 · Lap 5 (best)', 'Stint 03 · Lap 4', 'Stint 04 · Lap 2 (experiment)'],
    duration: LAP_DURATION,
    frames,
    corners: CORNERS.map(c => ({ name: c.name, pct: c.pct })),
    clips: [
      { id: 'c1', t: +(0.10 * LAP_DURATION).toFixed(2), corner: 'T1 San Donato', note: 'Brake point 9 m late — compromises rotation.', severity: 'loss' },
      { id: 'c2', t: +(0.36 * LAP_DURATION).toFixed(2), corner: 'T6 Savelli', note: 'Rushed pickup on a loaded rear.', severity: 'loss' },
      { id: 'c3', t: +(0.90 * LAP_DURATION).toFixed(2), corner: 'T15 Bucine', note: 'Throttle opens at >55° lean — rear-slip spike on exit, main time loss.', severity: 'loss' },
      { id: 'c4', t: +(0.50 * LAP_DURATION).toFixed(2), corner: 'T8 Arrabbiata', note: 'Clean line, exit speed on reference.', severity: 'gain' },
    ],
    estimated: telemetryLimited,
    reconstructed: true,
  };
}

/** Frame nearest to time t (seconds). */
export function frameAt(track: VideoTrack, t: number): TelemetryFrame {
  const i = Math.max(0, Math.min(track.frames.length - 1, Math.round((t / track.duration) * (track.frames.length - 1))));
  return track.frames[i];
}

export function formatClock(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = (sec - m * 60).toFixed(1).padStart(4, '0');
  return `${m}:${s}`;
}
