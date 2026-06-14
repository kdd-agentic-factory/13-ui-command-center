/**
 * Ghost Lap Simulator — the reference lap. Locks the gap chronology (monotonic,
 * sums to the gain), the honest lap scale, mode-driven gain/risk, and the
 * Oracle picking a smart (not necessarily fastest) ghost.
 */
import { describe, it, expect } from 'vitest';
import { buildGhostLap, GHOST_MODES, formatLap } from '../src/domain/ghostLap';

describe('ghost lap', () => {
  it('cumulative gap is monotonic and ends at the potential gain', () => {
    const gl = buildGhostLap('Rubén Juárez', 'Yamaha R1', 'Mugello', 'ideal-personal');
    const gaps = gl.gapTimeline.map(p => p.gap);
    for (let i = 1; i < gaps.length; i++) expect(gaps[i]).toBeGreaterThanOrEqual(gaps[i - 1]);
    expect(gaps[0]).toBe(0);
    expect(gaps[gaps.length - 1]).toBeCloseTo(gl.potentialGain, 2);
  });

  it('lap times stay on the honest rider-arc scale (slower than the MotoGP record)', () => {
    const gl = buildGhostLap('Rubén Juárez', 'Yamaha R1', 'Mugello', 'ideal-personal');
    expect(gl.yourLap).toBe('1:57.842');
    // ghost is faster than your lap but not a fantasy hero time
    expect(gl.ghostLap < gl.yourLap).toBe(true);
    expect(formatLap(117.842)).toBe('1:57.842');
  });

  it('each mode yields its own gain and the fastest is not the safest', () => {
    const fastest = [...GHOST_MODES].sort((a, b) => b.gain - a.gain)[0];
    const safest = [...GHOST_MODES].sort((a, b) => a.riskDelta - b.riskDelta)[0];
    expect(fastest.id).not.toBe(safest.id);
    const safe = buildGhostLap('Rubén Juárez', 'Yamaha R1', 'Mugello', 'safety');
    expect(safe.mode.riskDelta).toBeLessThan(0);
  });

  it('every corner carries a delta + coach cue, and Oracle recommends a smart ghost', () => {
    const gl = buildGhostLap('Rubén Juárez', 'Yamaha R1', 'Mugello', 'ideal-personal');
    expect(gl.corners.length).toBeGreaterThanOrEqual(4);
    for (const c of gl.corners) {
      expect(c.delta).toBeGreaterThan(0);
      expect(c.coach.length).toBeGreaterThan(5);
      expect(c.ghostExit).toBeGreaterThanOrEqual(c.yourExit);
    }
    expect(gl.oracle.ghost.toLowerCase()).toContain('safety');
  });

  it('GPS-only bikes flag the ECU/IMU overlays as estimated', () => {
    const full = buildGhostLap('Rubén Juárez', 'Yamaha R1', 'Mugello', 'ideal-personal', false);
    expect(full.estimatedOverlays.length).toBe(0);
    const gps = buildGhostLap('KD5', 'Kawasaki ZX-10R', 'Mugello', 'ideal-personal', true);
    expect(gps.estimatedOverlays).toContain('Throttle');
    expect(gps.estimatedOverlays).toContain('Rear slip');
  });
});
