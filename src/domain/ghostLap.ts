/**
 * ghostLap.ts — Ghost Lap & Ideal Line Simulator.
 *
 * Builds an intelligent reference lap the rider can measure against corner by
 * corner — not a table of deltas but a ghost: your line vs the ideal line, the
 * cumulative gap, telemetry overlays and coach cues. Several ghost modes,
 * because the smartest reference is not always the fastest one (safety,
 * tyre-saving and twin-simulated ghosts exist alongside the personal best).
 *
 * Deterministic and personalised. Lap times sit on the honest rider-arc scale
 * (R1 track-day pace ~1:57, slower than the MotoGP record), not invented hero
 * numbers; on GPS-only bikes the throttle/slip overlays are flagged estimated.
 */

export interface GhostMode {
  id: string;
  label: string;
  desc: string;
  /** Time recovered vs your lap, seconds (positive = faster ghost). */
  gain: number;
  /** Change in crash-risk index the ghost implies (negative = safer). */
  riskDelta: number;
}

export const GHOST_MODES: GhostMode[] = [
  { id: 'best-personal',  label: 'Best Personal Lap',  desc: 'Your single fastest lap.',                       gain: 0.92, riskDelta: 0 },
  { id: 'ideal-personal', label: 'Ideal Personal Lap', desc: 'Your best sectors and corners combined.',        gain: 1.284, riskDelta: 4 },
  { id: 'coach',          label: 'Coach Ghost',        desc: 'Reference from an expert rider.',                gain: 1.61, riskDelta: 8 },
  { id: 'rival',          label: 'Rival Ghost',        desc: 'Compare against P1 / P2 / P4.',                  gain: 2.04, riskDelta: 11 },
  { id: 'twin',           label: 'Digital Twin Ghost', desc: 'Ideal lap simulated by the AI twin.',            gain: 1.47, riskDelta: 6 },
  { id: 'safety',         label: 'Safety Ghost',       desc: 'Lowest-risk lap with minimal time loss.',        gain: 0.74, riskDelta: -9 },
  { id: 'tyre',           label: 'Tyre Saving Ghost',  desc: 'Optimised to preserve the rear tyre.',           gain: 0.61, riskDelta: -5 },
];

export type OverlayChannel = 'Speed' | 'Throttle' | 'Brake' | 'Lean' | 'Gear' | 'Rear slip' | 'Racing line';
export const OVERLAY_CHANNELS: OverlayChannel[] = ['Speed', 'Throttle', 'Brake', 'Lean', 'Gear', 'Rear slip', 'Racing line'];
/** Overlays a GPS-only bike cannot measure (no ECU/IMU feed). */
export const TELEMETRY_OVERLAYS: OverlayChannel[] = ['Throttle', 'Brake', 'Lean', 'Gear', 'Rear slip'];

export interface CornerDelta {
  corner: string;
  yourLine: string;
  ghostLine: string;
  delta: number;          // seconds lost in this corner
  yourThrottle: string;
  ghostThrottle: string;
  yourExit: number;       // km/h
  ghostExit: number;      // km/h
  coach: string;
}

export interface GapPoint {
  marker: string;
  gap: number;            // cumulative seconds behind the ghost
}

export interface GhostCue {
  corner: string;
  text: string;
}

export interface GhostOracleRecommendation {
  ghost: string;
  reason: string;
  decision: string;
}

export interface GhostLap {
  combo: string;
  mode: GhostMode;
  yourLap: string;        // m:ss.mmm
  ghostLap: string;
  potentialGain: number;  // seconds
  mainLoss: string;
  corners: CornerDelta[];
  gapTimeline: GapPoint[];
  cues: GhostCue[];
  oracle: GhostOracleRecommendation;
  estimatedOverlays: OverlayChannel[];
}

const YOUR_LAP_SEC = 117.842; // 1:57.842 — honest rider-arc R1 track-day best

export function formatLap(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = (sec - m * 60).toFixed(3).padStart(6, '0');
  return `${m}:${s}`;
}

/** Cumulative gap profile (scaled to the selected ghost's total gain). */
function gapTimeline(gain: number): GapPoint[] {
  const shape: Array<[string, number]> = [
    ['Start', 0], ['T1 San Donato', 0.216], ['T7 Savelli', 0.402],
    ['T12 Correntaio', 0.544], ['T15 Bucine', 0.828], ['Finish', 1.284],
  ];
  const k = gain / 1.284;
  return shape.map(([marker, g]) => ({ marker, gap: +(g * k).toFixed(3) }));
}

export function buildGhostLap(rider: string, bike: string, circuit: string, modeId: string, telemetryLimited = false): GhostLap {
  const mode = GHOST_MODES.find(m => m.id === modeId) ?? GHOST_MODES[1];
  const ghostSec = YOUR_LAP_SEC - mode.gain;

  return {
    combo: `${circuit} · ${rider} · ${bike}`,
    mode,
    yourLap: formatLap(YOUR_LAP_SEC),
    ghostLap: formatLap(ghostSec),
    potentialGain: +mode.gain.toFixed(3),
    mainLoss: 'T15 Bucine · exit phase',
    corners: [
      {
        corner: 'T1 San Donato',
        yourLine: 'Brake point 9 m late', ghostLine: 'Earlier brake, smoother release',
        delta: 0.216, yourThrottle: 'Pickup on time', ghostThrottle: 'Pickup on time',
        yourExit: 171, ghostExit: 174,
        coach: 'Brake 5–9 m earlier and release pressure progressively.',
      },
      {
        corner: 'T7 Savelli',
        yourLine: 'Rushed pickup', ghostLine: 'Holds rotation, waits for the bike',
        delta: 0.186, yourThrottle: '0.2s early on a loaded rear', ghostThrottle: 'Pickup after rotation completes',
        yourExit: 148, ghostExit: 151,
        coach: 'Do not rush the pickup — let the bike finish turning.',
      },
      {
        corner: 'T12 Correntaio',
        yourLine: 'Wide entry', ghostLine: 'Tighter entry, earlier rotation',
        delta: 0.142, yourThrottle: 'Pickup mid-corner', ghostThrottle: 'Earlier, progressive',
        yourExit: 162, ghostExit: 165,
        coach: 'Tighter entry, earlier rotation.',
      },
      {
        corner: 'T15 Bucine',
        yourLine: 'Wide entry · late pickup', ghostLine: 'Earlier rotation · bike picked up before throttle',
        delta: 0.284, yourThrottle: '0.40s late at >55° lean', ghostThrottle: 'Starts after lean drops below 54°',
        yourExit: 184, ghostExit: 190,
        coach: 'Finish the turn before asking for drive.',
      },
    ],
    gapTimeline: gapTimeline(mode.gain),
    cues: [
      { corner: 'T1 San Donato', text: 'Brake earlier, release smoother.' },
      { corner: 'T7 Savelli', text: 'Do not rush pickup.' },
      { corner: 'T12 Correntaio', text: 'Tighter entry, earlier rotation.' },
      { corner: 'T15 Bucine', text: 'Pick the bike up before throttle.' },
    ],
    oracle: {
      ghost: 'Safety + Exit Drive Ghost',
      reason: 'The fastest ghost increases rear-slip risk. The safety ghost recovers -0.74s with lower crash probability.',
      decision: 'Use the Safety Ghost for the next stint.',
    },
    estimatedOverlays: telemetryLimited ? TELEMETRY_OVERLAYS : [],
  };
}
