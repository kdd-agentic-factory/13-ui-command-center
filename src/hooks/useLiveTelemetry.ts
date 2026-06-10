/**
 * useLiveTelemetry — Simulates real-time MotoGP telemetry at 10 Hz.
 *
 * When the race-command-center API is available, data comes from the live
 * WebSocket feed. Otherwise a physics-inspired simulation drives the values
 * so the UI always shows live-feeling data during development.
 */
import { useState, useEffect, useRef } from 'react';

export interface TelemetryFrame {
  speed:      number;   // km/h  0–350
  rpm:        number;   // 0–15500
  gear:       number;   // 1–6 (0 = neutral)
  throttle:   number;   // % 0–100
  brake:      number;   // % 0–100
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
const TRACK_LAP_S = 105.0;  // realistic Mugello lap time
const RACE_LAPS = 23;
const FUEL_CAPACITY = 22.0;
const FUEL_PER_LAP = 0.95;

export function useLiveTelemetry(): TelemetryFrame {
  const simTime = useRef(0);
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
  }, []);

  return frame;
}

function computeFrame(
  trackPos: number,
  fuel: number,
  lapCount: number,
  lastLap: number,
  bestLap: number,
  simTime: number,
  anomaly = false,
): TelemetryFrame {
  const speedNorm = trackSpeed(trackPos);
  const rawSpeed = speedNorm * 330 + 10;
  const speed = rawSpeed + (Math.random() - 0.5) * 4;

  const isBraking = speedNorm < 0.35;
  const isAccel   = speedNorm > 0.65 && trackPos > 0.1;

  const throttle = isAccel ? 85 + Math.random() * 15 : isBraking ? Math.random() * 10 : 40 + Math.random() * 40;
  const brake    = isBraking ? 60 + Math.random() * 35 : Math.random() * 5;
  const gear     = Math.max(1, Math.min(6, Math.round(speed / 55)));
  const rpm      = Math.min(15500, gear > 0 ? (speed * 45 + 2000 + (Math.random() - 0.5) * 500) : 6000);
  const leanAngle = isBraking ? 5 + Math.random() * 20 : (1 - speedNorm) * 55 + Math.random() * 5;

  // Tire temps — correlate with lean and speed
  const baseTemp = 85 + speedNorm * 30;
  const leanEffect = leanAngle * 0.4;

  // Gap — slow oscillation (two overlapping sine waves) + tiny tick noise
  const gapRaw =
    0.842 +
    0.55 * Math.sin(simTime * 0.157) +  // ~40 s period
    0.28 * Math.sin(simTime * 0.371) +  // ~17 s period
    (Math.random() - 0.5) * 0.04;       // 40 ms tick noise
  const gapAbs  = Math.abs(gapRaw);
  const gapSign = gapRaw >= 0 ? '+' : '–';
  const gap     = gapAbs < 0.05 ? 'leader' : `${gapSign}${gapAbs.toFixed(3)}`;

  const lapsLeft = Math.max(0, RACE_LAPS - lapCount);
  const stintAge = lapCount; // fresh stint every race start

  return {
    speed:       Math.round(speed),
    rpm:         Math.round(rpm),
    gear,
    throttle:    Math.round(throttle),
    brake:       Math.round(brake),
    leanAngle:   Math.round(leanAngle * 10) / 10,
    fuelLoad:    Math.round(fuel * 10) / 10,
    lapTime:     (trackPos * TRACK_LAP_S),
    lastLap,
    bestLap,
    lapCount:    lapCount,  // now real lap count, no offset
    position:    gapRaw < -0.4 ? 4 : 3,
    gap,
    tireFrontLeft:  Math.round(baseTemp + 2 + leanEffect + Math.random() * 3),
    tireFrontRight: Math.round(baseTemp - 2 + Math.random() * 3),
    tireRearLeft:   Math.round(baseTemp + 6 + leanEffect + Math.random() * 4),
    tireRearRight:  Math.round(baseTemp + 4 + Math.random() * 4),
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
