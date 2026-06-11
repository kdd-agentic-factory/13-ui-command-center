/**
 * demoSessions.ts — reproducible sessions behind the Demo Mode packages.
 *
 * Each demo package in the Session Mode Gate maps to a DemoSessionSpec: a
 * fixed RNG seed plus a scripted scenario (start lap, pace, tyres, fuel,
 * anomalies). The telemetry stream is derived from a frame counter — never
 * from wall-clock or Math.random — so the same demo replays IDENTICALLY on
 * every run and machine: tick N always produces the same TelemetryFrame.
 */
import type { TabId } from '../context/AuthContext';
import { getSessionContext } from './sessionContext';
import { MUGELLO_CIRCUIT } from './sessionTruth';

// ── Deterministic PRNG (mulberry32) ──────────────────────────────────────────

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Session specs ─────────────────────────────────────────────────────────────

export interface DemoSessionSpec {
  id: string;            // matches DEMO_PACKAGES id
  seed: number;          // base seed — the reproducibility anchor
  startLap: number;      // lap the demo opens on
  bestLap: number;       // seconds
  lastLap: number;       // seconds
  fuelStart: number;     // kg at startLap
  frontCompound: 'SOFT' | 'MEDIUM' | 'HARD';
  rearCompound: 'SOFT' | 'MEDIUM' | 'HARD';
  anomalyLaps: number[];
  focusTab: TabId;       // tab the dashboard opens on for this demo
  script: string;        // one-line description of the scripted scenario
}

const FUEL_PER_LAP = MUGELLO_CIRCUIT.fuelBurnKgPerLap;
const FUEL_CAPACITY = MUGELLO_CIRCUIT.fuelCapacityKg;

export const DEMO_SESSIONS: DemoSessionSpec[] = [
  {
    id: 'race-sim', seed: 470101, startLap: 17,
    bestLap: 104.847, lastLap: 105.38, fuelStart: FUEL_CAPACITY - 17 * FUEL_PER_LAP,
    frontCompound: 'MEDIUM', rearCompound: 'SOFT', anomalyLaps: [20],
    focusTab: 'overview',
    script: 'Race climax: lap 17/23, P3 fight, rear-grip cliff approaching lap 19, twin strategy live.',
  },
  {
    id: 'trackday', seed: 470202, startLap: 6,
    bestLap: 103.912, lastLap: 104.31, fuelStart: 14.2,
    frontCompound: 'MEDIUM', rearCompound: 'SOFT', anomalyLaps: [],
    focusTab: 'telemetry',
    script: 'Stint 03 · Yamaha R1 · best 1:43.912, coaching focus on T15 throttle pickup.',
  },
  {
    id: 'qualifying', seed: 470303, startLap: 2,
    bestLap: 104.169, lastLap: 104.169, fuelStart: 6.5,
    frontCompound: 'SOFT', rearCompound: 'SOFT', anomalyLaps: [],
    focusTab: 'replay',
    script: 'Low-fuel qualifying run: record-pace lap loaded for sector comparison.',
  },
  {
    id: 'tyre-deg', seed: 470404, startLap: 18,
    bestLap: 104.847, lastLap: 106.12, fuelStart: FUEL_CAPACITY - 18 * FUEL_PER_LAP,
    frontCompound: 'MEDIUM', rearCompound: 'SOFT', anomalyLaps: [18],
    focusTab: 'tires',
    script: 'Rear soft one lap from the predicted cliff (lap 19) — degradation telemetry live.',
  },
  {
    id: 'setup', seed: 470505, startLap: 4,
    bestLap: 104.95, lastLap: 105.02, fuelStart: 18.0,
    frontCompound: 'MEDIUM', rearCompound: 'MEDIUM', anomalyLaps: [],
    focusTab: 'advisor',
    script: 'Back-to-back validation stint after TC4→TC5 + rear rebound +2 clicks.',
  },
];

export function demoSession(id: string): DemoSessionSpec | null {
  return DEMO_SESSIONS.find(s => s.id === id) ?? null;
}

/** The reproducible session behind the ACTIVE demo context, if any. */
export function getActiveDemoSession(): DemoSessionSpec | null {
  const ctx = getSessionContext();
  if (!ctx.demoMode) return null;
  return demoSession(ctx.setup.demoId ?? '');
}

// ── Deterministic frame parameters ────────────────────────────────────────────

export interface DemoFrameParams {
  trackPos: number;
  lapCount: number;
  fuel: number;
  lastLap: number;
  bestLap: number;
  simTime: number;
  anomaly: boolean;
  /** Per-tick seeded noise stream — identical for (spec, tick) across runs. */
  rand: () => number;
}

const TRACK_LAP_S = MUGELLO_CIRCUIT.typicalLapSeconds;

/**
 * Pure function of (spec, tick) — the whole point of reproducibility.
 * tick advances at 10 Hz from 0 when the demo dashboard opens.
 */
export function demoFrameParams(spec: DemoSessionSpec, tick: number): DemoFrameParams {
  const t = tick * 0.1;                                  // seconds since demo start
  const lapsElapsed = Math.floor(t / TRACK_LAP_S);
  const lapCount = spec.startLap + lapsElapsed;
  const trackPos = (t % TRACK_LAP_S) / TRACK_LAP_S;
  const fuel = Math.max(0.5, spec.fuelStart - lapsElapsed * FUEL_PER_LAP);

  // Deterministic per-lap pace: base degradation + seeded per-lap jitter.
  const lapRand = mulberry32(spec.seed + lapCount * 7919);
  const anomaly = spec.anomalyLaps.includes(lapCount);
  const lastLap = lapsElapsed === 0
    ? spec.lastLap
    : anomaly
      ? spec.bestLap + 12 + lapRand() * 6
      : spec.bestLap + 0.04 * lapCount + (lapRand() - 0.5) * 0.6;

  return {
    trackPos, lapCount, fuel, lastLap,
    bestLap: spec.bestLap, simTime: t, anomaly,
    rand: mulberry32(spec.seed ^ (tick * 2654435761)),
  };
}
