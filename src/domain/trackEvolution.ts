/**
 * trackEvolution.ts — Track Evolution Model.
 *
 * How the circuit changes across a session: it rubbers in (grip climbs as the
 * racing line gets laid with rubber), reaches a peak window, then the track
 * temperature climbs and grip falls away. The model marks the best lap-time
 * window and explains the limiter at each phase so the crew plans push laps
 * when the track is actually fastest — not just when the rider feels ready.
 *
 * Deterministic and personalised to circuit + session length.
 */

export type EvoPhase = 'green' | 'rubbering-in' | 'peak' | 'overheating';

export interface EvoPoint {
  lap: number;
  gripPct: number;      // 0–100 relative track grip
  trackTempC: number;
  potential: number;    // lap-time offset vs the session best (s, +slower)
  phase: EvoPhase;
}

export interface TrackEvolution {
  combo: string;
  laps: number;
  points: EvoPoint[];
  peakWindow: [number, number];   // [fromLap, toLap]
  currentLap: number;
  currentPhase: EvoPhase;
  ambientC: number;
  recommendation: string;
  limiter: string;
}

const PHASE_META: Record<EvoPhase, { label: string; color: string }> = {
  green:          { label: 'GREEN',        color: 'var(--text-muted)' },
  'rubbering-in': { label: 'RUBBERING IN', color: 'var(--cyan)' },
  peak:           { label: 'PEAK WINDOW',  color: 'var(--green)' },
  overheating:    { label: 'OVERHEATING',  color: 'var(--accent)' },
};
export function phaseMeta(p: EvoPhase) { return PHASE_META[p]; }

export function buildTrackEvolution(circuit: string, laps = 24, ambientC = 27, currentLap = 9): TrackEvolution {
  const peakStart = Math.round(laps * 0.25);
  const peakEnd = Math.round(laps * 0.55);
  const points: EvoPoint[] = [];

  for (let lap = 1; lap <= laps; lap++) {
    // grip rises fast as rubber goes down, plateaus, then falls as temp climbs
    const rubber = 1 - Math.exp(-lap / (laps * 0.18));         // 0→1 saturating
    const trackTempC = +(ambientC + 8 + lap * (16 / laps)).toFixed(1); // climbs through the run
    const tempPenalty = Math.max(0, (trackTempC - (ambientC + 16)) / 14); // 0 until hot
    const gripPct = Math.max(40, Math.round(58 + rubber * 42 - tempPenalty * 24));

    const phase: EvoPhase =
      lap <= 2 ? 'green'
      : lap < peakStart ? 'rubbering-in'
      : lap <= peakEnd ? 'peak'
      : 'overheating';

    // lap-time potential offset vs best grip (more grip → faster → smaller offset)
    const potential = +(((100 - gripPct) / 100) * 1.6).toFixed(3);
    points.push({ lap, gripPct, trackTempC, potential, phase });
  }

  const cur = points[Math.min(currentLap, laps) - 1];
  const recommendation = cur.phase === 'peak'
    ? `Track is in its peak window (laps ${peakStart}–${peakEnd}). Send the push lap now.`
    : cur.phase === 'overheating'
      ? `Grip is fading with track temp — protect the tyre, do not chase the time.`
      : `Track still rubbering in. Best window opens around lap ${peakStart}; build, don't force.`;
  const limiter = cur.phase === 'overheating' ? 'Track temperature (rear grip drop)' : cur.phase === 'green' ? 'Low rubber on the line' : 'Tyre warm-up vs track grip balance';

  return {
    combo: circuit, laps, points,
    peakWindow: [peakStart, peakEnd], currentLap, currentPhase: cur.phase,
    ambientC, recommendation, limiter,
  };
}
