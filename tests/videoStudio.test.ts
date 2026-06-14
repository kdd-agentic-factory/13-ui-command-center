/**
 * Telemetry + Video Studio — the synced track. Locks the frame contract
 * (monotonic time across a full lap), physical plausibility of the synthesised
 * channels, the honesty flags (reconstructed + GPS-only estimated), and that
 * the seek helper resolves a frame near any time.
 */
import { describe, it, expect } from 'vitest';
import { buildVideoTrack, frameAt, formatClock, CHANNELS } from '../src/domain/videoStudio';

const args = ['Rubén Juárez', 'Yamaha R1', 'Mugello'] as const;

describe('video studio', () => {
  it('frames span the whole lap with monotonic time and 0..1 distance', () => {
    const tr = buildVideoTrack(...args);
    expect(tr.frames.length).toBeGreaterThan(50);
    const ts = tr.frames.map(f => f.t);
    for (let i = 1; i < ts.length; i++) expect(ts[i]).toBeGreaterThanOrEqual(ts[i - 1]);
    expect(tr.frames[0].distPct).toBe(0);
    expect(tr.frames[tr.frames.length - 1].distPct).toBeCloseTo(1, 5);
    expect(tr.frames[tr.frames.length - 1].t).toBeCloseTo(tr.duration, 0);
  });

  it('synthesised channels stay physically plausible', () => {
    const tr = buildVideoTrack(...args);
    for (const f of tr.frames) {
      expect(f.speed).toBeGreaterThan(60);
      expect(f.speed).toBeLessThanOrEqual(300);
      expect(f.throttle).toBeGreaterThanOrEqual(0);
      expect(f.throttle).toBeLessThanOrEqual(100);
      expect(f.brake).toBeGreaterThanOrEqual(0);
      expect(f.brake).toBeLessThanOrEqual(100);
      expect(f.gear).toBeGreaterThanOrEqual(1);
      expect(f.gear).toBeLessThanOrEqual(6);
      expect(f.lean).toBeLessThanOrEqual(60);
    }
    // a real top speed appears somewhere on the lap
    expect(Math.max(...tr.frames.map(f => f.speed))).toBeGreaterThan(250);
    // the rear-slip spike happens near the Bucine clip, not on the straight
    const bucine = tr.clips.find(c => c.corner.includes('Bucine'))!;
    expect(frameAt(tr, bucine.t).rearSlip).toBeGreaterThan(0);
  });

  it('is honest: reconstructed view + corner markers + clips', () => {
    const tr = buildVideoTrack(...args);
    expect(tr.reconstructed).toBe(true);
    expect(tr.corners.length).toBeGreaterThanOrEqual(5);
    expect(tr.clips.length).toBeGreaterThanOrEqual(3);
    expect(tr.estimated).toBe(false);
  });

  it('GPS-only bikes flag ECU/IMU channels as estimated', () => {
    const gps = buildVideoTrack('KD5', 'Kawasaki ZX-10R', 'Mugello', 'Stint 03 · Lap 5 (best)', true);
    expect(gps.estimated).toBe(true);
    expect(CHANNELS.find(c => c.id === 'throttle')!.estimatedOnGps).toBe(true);
    expect(CHANNELS.find(c => c.id === 'speed')!.estimatedOnGps).toBe(false);
  });

  it('seek helper resolves a frame near any requested time', () => {
    const tr = buildVideoTrack(...args);
    const mid = frameAt(tr, tr.duration / 2);
    expect(mid.distPct).toBeGreaterThan(0.4);
    expect(mid.distPct).toBeLessThan(0.6);
    expect(formatClock(65.4)).toBe('1:05.4');
  });
});
