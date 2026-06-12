/**
 * useLiveTelemetry — Simulates real-time MotoGP telemetry at 10 Hz.
 *
 * When the race-command-center API is available, data comes from the live
 * WebSocket feed. Otherwise a physics-inspired simulation drives the values
 * so the UI always shows live-feeling data during development.
 */
import { useState, useEffect, useRef } from 'react';
import { MUGELLO_CIRCUIT } from '../domain/sessionTruth';
import { getActiveDemoSession, demoFrameParams } from '../domain/demoSessions';

export interface TelemetryFrame {
  speed:      number;   // km/h  0–350
  rpm:        number;   // 0–15500
  gear:       number;   // 1–6 (0 = neutral)
  throttle:   number;   // % 0–100
  brake:      number;   // % 0–100
  brakePressureFront: number; // % 0–100, front circuit pressure
  brakePressureRear:  number; // % 0–100, rear circuit pressure
  leanAngle:  number;   // degrees 0–63
  fuelLoad:   number;   // kg 0–22
  lapTime:    number;   // seconds current lap
  lastLap:    number;   // seconds
  bestLap:    number;   // seconds
  lapCount:   number;
  position:   number;   // race position 1–24
  gap:        string;   // "+0.342" or "–0.342" or "leader"
  // Tire temperatures (°C)
  tireFrontLeft:  number;
  tireFrontRight: number;
  tireRearLeft:   number;
  tireRearRight:  number;
  tirePressureFront: number; // bar
  tirePressureRear:  number; // bar
  tireWearFront:     number; // % worn
  tireWearRear:      number; // % worn
  // Tyre compound
  frontCompound: 'SOFT' | 'MEDIUM' | 'HARD';
  rearCompound:  'SOFT' | 'MEDIUM' | 'HARD';
  frontTyreAge: number; // laps
  rearTyreAge:  number; // laps
  // Track position 0–1 (fraction of lap)
  trackPos: number;
  // --- Race data integrity ---
  lapAnomaly: boolean;   // true if last lap is an outlier
  fuelValid: boolean;    // false if fuel sensor reports impossible value
  raceLapsLeft: number;  // total race laps - current lap
  session: 'race' | 'test';
  stintAge: number;      // laps on current stint (reset at pit)
}

// Simulated track speed profile (speeds normalized 0–1 over track position 0–1)
// Models: long straight → braking → hairpin → acceleration → fast corner → ...
export function trackSpeed(pos: number): number {
  // Simple sinusoidal model with multiple harmonics
  const s =
    0.5 +
    0.25 * Math.sin(2 * Math.PI * pos) +
    0.15 * Math.sin(4 * Math.PI * pos + 0.8) +
    0.10 * Math.sin(8 * Math.PI * pos + 1.2);
  return Math.max(0.1, Math.min(1.0, s));
}

// MotoGP Mugello 2025 realistic references
// Record qualifying lap: 1:44.169 (Marquez, 2025)
// Race pace: ~1:45.x
// Total race distance: 23 laps × 5.245 km = 120.635 km
// Fuel capacity: 22 kg, consumption ~0.95 kg/lap for MotoGP
// Main straight speed trap: ~351 km/h
const TRACK_LAP_S = MUGELLO_CIRCUIT.typicalLapSeconds;  // realistic Mugello lap time
const RACE_LAPS = MUGELLO_CIRCUIT.raceLaps;
const FUEL_CAPACITY = MUGELLO_CIRCUIT.fuelCapacityKg;
const FUEL_PER_LAP = MUGELLO_CIRCUIT.fuelBurnKgPerLap;

export function useLiveTelemetry(): TelemetryFrame {
  const simTime = useRef(0);
  const demoTick = useRef(0);
  // Demo mode replays a scripted, seeded session: same package → identical
  // frames on every run (tick-driven, no wall clock, no Math.random).
  const demo = getActiveDemoSession();
  const lapStartRef = useRef(Date.now());
  const lapCountRef = useRef(0);        // increments each lap, 0-based
  const fuelRef = useRef(FUEL_CAPACITY);
  const lastLapRef = useRef(105.203);
  const bestLapRef = useRef(104.847);   // 1:44.847 — realistic Mugello best
  const anomalyRef = useRef(false);
  const anomalyLaps = useRef<Set<number>>(new Set([7, 13])); // laps 7 & 13 are slow

  const [frame, setFrame] = useState<TelemetryFrame>(() => computeFrame(0, FUEL_CAPACITY, 0, 105.203, 104.847, 0, false));

  useEffect(() => {
    const interval = setInterval(() => {
      if (demo) {
        const p = demoFrameParams(demo, demoTick.current++);
        setFrame({
          ...computeFrame(p.trackPos, p.fuel, p.lapCount, p.lastLap, p.bestLap, p.simTime, p.anomaly, p.rand),
          frontCompound: demo.frontCompound,
          rearCompound: demo.rearCompound,
        });
        return;
      }
      simTime.current += 0.1;

      // Lap progression
      const lapElapsed = (Date.now() - lapStartRef.current) / 1000;
      if (lapElapsed >= TRACK_LAP_S) {
        const lap = lapCountRef.current + 1;
        const isAnomaly = anomalyLaps.current.has(lap);

        // Realistic last lap: ~105.2s normally, +12-18s if anomaly (off-track/traffic)
        lastLapRef.current = isAnomaly
          ? 104.847 + 12 + Math.random() * 6   // +12–18s slow lap
          : 104.7 + (lap * 0.04) + (Math.random() - 0.5) * 0.6; // degrading pace ~0.04s/lap

        if (!isAnomaly && lastLapRef.current < bestLapRef.current) {
          bestLapRef.current = lastLapRef.current;
        }

        anomalyRef.current = isAnomaly;
        lapCountRef.current = lap;

        // Fuel: starts at 22kg, consumption ~0.95 kg/lap
        // Never goes below 0.5 kg (sensor noise floor)
        fuelRef.current = Math.max(0.5, fuelRef.current - FUEL_PER_LAP + (Math.random() - 0.5) * 0.1);

        lapStartRef.current = Date.now();

        // Race complete — reset session
        if (lap >= RACE_LAPS) {
          lapCountRef.current = 0;
          fuelRef.current = FUEL_CAPACITY;
          bestLapRef.current = 104.847;
        }
      }

      const trackPos = (lapElapsed % TRACK_LAP_S) / TRACK_LAP_S;
      setFrame(computeFrame(
        trackPos,
        fuelRef.current,
        lapCountRef.current,
        lastLapRef.current,
        bestLapRef.current,
        simTime.current,
        anomalyRef.current!,
      ));
    }, 100);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demo?.id]);

  return frame;
}

/**
 * Pure frame builder. `rand` defaults to Math.random for the live simulation;
 * demo sessions inject a per-tick seeded stream so frames are reproducible.
 */
export function computeFrame(
  trackPos: number,
  fuel: number,
  lapCount: number,
  lastLap: number,
  bestLap: number,
  simTime: number,
  anomaly = false,
  rand: () => number = Math.random,
): TelemetryFrame {
  const speedNorm = trackSpeed(trackPos);
  const rawSpeed = speedNorm * 330 + 10;
  const speed = rawSpeed + (rand() - 0.5) * 4;

  const isBraking = speedNorm < 0.35;
  const isAccel   = speedNorm > 0.65 && trackPos > 0.1;

  const throttle = isAccel ? 85 + rand() * 15 : isBraking ? rand() * 10 : 40 + rand() * 40;
  const brake    = isBraking ? 60 + rand() * 35 : rand() * 5;
  const brakePressureFront = Math.min(100, brake * (isBraking ? 0.92 : 0.65) + rand() * 3);
  const brakePressureRear = Math.min(100, brake * (isBraking ? 0.38 : 0.25) + rand() * 2);
  const gear     = Math.max(1, Math.min(6, Math.round(speed / 55)));
  const rpm      = Math.min(15500, gear > 0 ? (speed * 45 + 2000 + (rand() - 0.5) * 500) : 6000);
  const leanAngle = isBraking ? 5 + rand() * 20 : (1 - speedNorm) * 55 + rand() * 5;

  // Tire temps — correlate with lean and speed
  const baseTemp = 85 + speedNorm * 30;
  const leanEffect = leanAngle * 0.4;

  // Gap — slow oscillation (two overlapping sine waves) + tiny tick noise
  const gapRaw =
    0.842 +
    0.55 * Math.sin(simTime * 0.157) +  // ~40 s period
    0.28 * Math.sin(simTime * 0.371) +  // ~17 s period
    (rand() - 0.5) * 0.04;       // 40 ms tick noise
  const gapAbs  = Math.abs(gapRaw);
  const gapSign = gapRaw >= 0 ? '+' : '–';
  const gap     = gapAbs < 0.05 ? 'leader' : `${gapSign}${gapAbs.toFixed(3)}`;

  const lapsLeft = Math.max(0, RACE_LAPS - lapCount);
  const stintAge = lapCount; // fresh stint every race start
  const tirePressureFront = 1.86 + Math.min(0.18, lapCount * 0.006) + speedNorm * 0.03;
  const tirePressureRear = 1.70 + Math.min(0.20, lapCount * 0.008) + speedNorm * 0.04;
  // Non-linear wear: slow early laps, accelerating toward the cliff
  // (1 - e^(-lap/k)); rear wears faster than front. Calibrated so lap 18
  // rear ≈ 72% (matches the tyre-deg demo scenario).
  const tireWearFront = Math.min(100, Math.round((100 * (1 - Math.exp(-lapCount / 22)) + leanAngle * 0.05) * 10) / 10);
  const tireWearRear = Math.min(100, Math.round((100 * (1 - Math.exp(-lapCount / 14)) + throttle * 0.04) * 10) / 10);

  return {
    speed:       Math.round(speed),
    rpm:         Math.round(rpm),
    gear,
    throttle:    Math.round(throttle),
    brake:       Math.round(brake),
    brakePressureFront: Math.round(brakePressureFront),
    brakePressureRear:  Math.round(brakePressureRear),
    leanAngle:   Math.round(leanAngle * 10) / 10,
    fuelLoad:    Math.round(fuel * 10) / 10,
    lapTime:     (trackPos * TRACK_LAP_S),
    lastLap,
    bestLap,
    lapCount:    lapCount,  // now real lap count, no offset
    position:    gapRaw < -0.4 ? 4 : 3,
    gap,
    tireFrontLeft:  Math.round(baseTemp + 2 + leanEffect + rand() * 3),
    tireFrontRight: Math.round(baseTemp - 2 + rand() * 3),
    tireRearLeft:   Math.round(baseTemp + 6 + leanEffect + rand() * 4),
    tireRearRight:  Math.round(baseTemp + 4 + rand() * 4),
    tirePressureFront: Math.round(tirePressureFront * 100) / 100,
    tirePressureRear:  Math.round(tirePressureRear * 100) / 100,
    tireWearFront,
    tireWearRear,
    frontCompound:  'MEDIUM',
    rearCompound:   'SOFT',
    frontTyreAge:   lapCount,      // real tyre age
    rearTyreAge:    lapCount,      // real tyre age
    trackPos,
    lapAnomaly:    anomaly,
    fuelValid:     fuel >= 0.5 && fuel <= FUEL_CAPACITY,
    raceLapsLeft:  lapsLeft,
    session:       lapCount < 1 ? 'test' : 'race',
    stintAge,
  };
}
