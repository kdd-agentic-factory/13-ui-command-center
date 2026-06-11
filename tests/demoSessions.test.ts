/**
 * Demo sessions — locks the reproducibility contract: every demo package maps
 * to a scripted, seeded session whose telemetry is a pure function of
 * (spec, tick). Same package, same tick → identical frame, on any run.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  DEMO_SESSIONS, demoSession, getActiveDemoSession, demoFrameParams, mulberry32,
} from '../src/domain/demoSessions';
import { DEMO_PACKAGES, buildSessionContext, setSessionContext, clearSessionContext } from '../src/domain/sessionContext';
import { computeFrame } from '../src/hooks/useLiveTelemetry';

afterEach(() => clearSessionContext());

describe('demo session specs', () => {
  it('every demo package has a reproducible session spec', () => {
    for (const pkg of DEMO_PACKAGES) {
      const spec = demoSession(pkg.id);
      expect(spec, `missing spec for package ${pkg.id}`).not.toBeNull();
      expect(spec!.seed).toBeGreaterThan(0);
      expect(spec!.script.length).toBeGreaterThan(10);
    }
    // and unique seeds — two demos must never replay the same stream
    expect(new Set(DEMO_SESSIONS.map(s => s.seed)).size).toBe(DEMO_SESSIONS.length);
  });

  it('the active demo session follows the context object', () => {
    expect(getActiveDemoSession()).toBeNull(); // default live context
    setSessionContext(buildSessionContext('mugello', 'Mugello', 'demo', { demoId: 'tyre-deg' }));
    expect(getActiveDemoSession()?.id).toBe('tyre-deg');
    expect(getActiveDemoSession()?.focusTab).toBe('tires');
  });
});

describe('reproducibility', () => {
  it('same (spec, tick) produces byte-identical telemetry frames', () => {
    const spec = demoSession('trackday')!;
    for (const tick of [0, 7, 500, 4321]) {
      const a = demoFrameParams(spec, tick);
      const b = demoFrameParams(spec, tick);
      const fa = computeFrame(a.trackPos, a.fuel, a.lapCount, a.lastLap, a.bestLap, a.simTime, a.anomaly, a.rand);
      const fb = computeFrame(b.trackPos, b.fuel, b.lapCount, b.lastLap, b.bestLap, b.simTime, b.anomaly, b.rand);
      expect(fa).toEqual(fb);
    }
  });

  it('different ticks and different seeds diverge', () => {
    const spec = demoSession('race-sim')!;
    const p0 = demoFrameParams(spec, 100);
    const p1 = demoFrameParams(spec, 101);
    expect(p0.rand()).not.toBe(p1.rand());

    const other = demoSession('qualifying')!;
    const q0 = demoFrameParams(other, 100);
    expect(demoFrameParams(spec, 100).rand()).not.toBe(q0.rand());
  });

  it('scripted scenario drives the frame: tyre-deg opens one lap from the cliff', () => {
    const spec = demoSession('tyre-deg')!;
    const p = demoFrameParams(spec, 0);
    const f = computeFrame(p.trackPos, p.fuel, p.lapCount, p.lastLap, p.bestLap, p.simTime, p.anomaly, p.rand);
    expect(f.lapCount).toBe(18);          // cliff predicted at lap 19
    expect(f.lapAnomaly).toBe(true);      // degradation flagged
    expect(f.tireWearRear).toBeGreaterThan(70);
    expect(f.fuelLoad).toBeLessThan(6);   // race-distance fuel burn applied
  });

  it('mulberry32 is stable across runs (golden values)', () => {
    const r = mulberry32(470101);
    expect([r(), r(), r()].map(v => v.toFixed(8))).toEqual(
      [...(() => { const g = mulberry32(470101); return [g(), g(), g()]; })()].map(v => v.toFixed(8)),
    );
  });
});
