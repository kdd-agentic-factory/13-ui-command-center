/**
 * Gearing & Transmission Lab. Locks the six-gear ladder (ratios fall, top speeds
 * rise), the final drive, the rpm-gap spacing + status, the shift points and
 * that a long straight gears taller for more top speed than a short one.
 */
import { describe, it, expect } from 'vitest';
import { buildGearing, gapColor } from '../src/domain/gearing';

const args = ['Rubén Juárez', 'Yamaha R1', 'Mugello', 15] as const;

describe('gearing & transmission lab', () => {
  it('builds a six-gear ladder: ratios fall, top speeds rise', () => {
    const g = buildGearing(...args, 0.9);
    expect(g.gears).toHaveLength(6);
    for (let i = 1; i < g.gears.length; i++) {
      expect(g.gears[i].ratio).toBeLessThan(g.gears[i - 1].ratio);
      expect(g.gears[i].topSpeedKmh).toBeGreaterThan(g.gears[i - 1].topSpeedKmh);
    }
    expect(g.gears[5].topSpeedKmh).toBe(g.topSpeed6thKmh);
  });

  it('reports the final drive and a positive trap speed below top speed', () => {
    const g = buildGearing(...args, 0.9);
    expect(g.finalDrive.front).toBeGreaterThan(0);
    expect(g.finalDrive.rear).toBeGreaterThan(0);
    expect(g.trapKmh).toBeLessThan(g.topSpeed6thKmh);
  });

  it('computes rpm gaps between every adjacent gear with a status', () => {
    const g = buildGearing(...args, 0.9);
    expect(g.rpmGaps).toHaveLength(5);
    expect(g.rpmGaps.every(x => x.dropRpm > 0)).toBe(true);
    expect(g.rpmGaps.every(x => ['even', 'tall', 'short'].includes(x.status))).toBe(true);
  });

  it('gears taller for top speed on a long straight than a short one', () => {
    const longS = buildGearing(...args, 1.3);
    const shortS = buildGearing(...args, 0.6);
    expect(longS.topSpeed6thKmh).toBeGreaterThan(shortS.topSpeed6thKmh);
    expect(longS.finalDrive.rear).toBeLessThanOrEqual(shortS.finalDrive.rear); // smaller rear sprocket = taller
  });

  it('lists shift points and exposes gap colours', () => {
    const g = buildGearing(...args, 0.9);
    expect(g.shifts.length).toBeGreaterThanOrEqual(3);
    expect(g.shifts.every(s => s.gear >= 1 && s.gear <= 6)).toBe(true);
    expect(gapColor('even')).toBeTruthy();
    expect(gapColor('tall')).toBeTruthy();
  });
});
