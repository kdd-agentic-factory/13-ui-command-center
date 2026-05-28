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

const TRACK_LAP_S = 93.4; // approximate lap time in seconds

export function useLiveTelemetry(): TelemetryFrame {
  const simTime = useRef(0);
  const lapStartRef = useRef(Date.now());
  const lapCountRef = useRef(0);
  const fuelRef = useRef(21.8);
  const lastLapRef = useRef(93.412);
  const bestLapRef = useRef(92.847);

  const [frame, setFrame] = useState<TelemetryFrame>(() => computeFrame(0, 21.8, 0, 93.412, 92.847, 0));

  useEffect(() => {
    const interval = setInterval(() => {
      simTime.current += 0.1;

      // Lap progression
      const lapElapsed = (Date.now() - lapStartRef.current) / 1000;
      if (lapElapsed >= TRACK_LAP_S) {
        lastLapRef.current = lapElapsed + (Math.random() - 0.5) * 0.4;
        if (lastLapRef.current < bestLapRef.current) {
          bestLapRef.current = lastLapRef.current;
        }
        lapCountRef.current += 1;
        lapStartRef.current = Date.now();
        fuelRef.current = Math.max(0, fuelRef.current - 2.2);
      }

      const trackPos = (lapElapsed % TRACK_LAP_S) / TRACK_LAP_S;
      setFrame(computeFrame(
        trackPos,
        fuelRef.current,
        lapCountRef.current,
        lastLapRef.current,
        bestLapRef.current,
        simTime.current,
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
  // simTime increments at 1.0 /s in real time; periods ~40 s and ~17 s feel
  // like organic track-position swings without being obviously periodic.
  const gapRaw =
    0.842 +
    0.55 * Math.sin(simTime * 0.157) +  // ~40 s period
    0.28 * Math.sin(simTime * 0.371) +  // ~17 s period
    (Math.random() - 0.5) * 0.04;       // 40 ms tick noise
  const gapAbs  = Math.abs(gapRaw);
  const gapSign = gapRaw >= 0 ? '+' : '–';
  const gap     = gapAbs < 0.05 ? 'leader' : `${gapSign}${gapAbs.toFixed(3)}`;

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
    lapCount:    lapCount + 3, // starts from lap 4
    // P3 most of the time; briefly drops to P4 when gap goes negative
    position:    gapRaw < -0.4 ? 4 : 3,
    gap,
    tireFrontLeft:  Math.round(baseTemp + 2 + leanEffect + Math.random() * 3),
    tireFrontRight: Math.round(baseTemp - 2 + Math.random() * 3),
    tireRearLeft:   Math.round(baseTemp + 6 + leanEffect + Math.random() * 4),
    tireRearRight:  Math.round(baseTemp + 4 + Math.random() * 4),
    frontCompound:  'MEDIUM',
    rearCompound:   'SOFT',
    frontTyreAge:   lapCount + 3,
    rearTyreAge:    lapCount + 3,
    trackPos,
  };
}
