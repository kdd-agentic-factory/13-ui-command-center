/**
 * Aerodynamics Lab. Locks the sensitivity rating, the package trade-off (one
 * chosen; higher downforce ⇒ more drag ⇒ lower top speed), the front/rear
 * balance summing to 100, the dirty-air loss, the corner aero gain (fast > slow)
 * and the recommendations. Exercises both the long-straight and short-straight
 * package selection.
 */
import { describe, it, expect } from 'vitest';
import { buildAero, difficultyColor, aeroTypeColor } from '../src/domain/aero';

const args = ['Rubén Juárez', 'Yamaha R1', 'Mugello', 15] as const;

describe('aerodynamics lab', () => {
  it('rates aero sensitivity within range', () => {
    const a = buildAero(...args, 0.9);
    expect(a.sensitivity).toBeGreaterThanOrEqual(3);
    expect(a.sensitivity).toBeLessThanOrEqual(10);
  });

  it('ranks packages as a real trade-off with exactly one chosen', () => {
    const a = buildAero(...args, 0.9);
    expect(a.packages.filter(p => p.chosen)).toHaveLength(1);
    const high = a.packages.find(p => p.id === 'high')!;
    const low = a.packages.find(p => p.id === 'low')!;
    expect(high.downforce).toBeGreaterThan(low.downforce);
    expect(high.drag).toBeGreaterThan(low.drag);
    expect(high.topSpeedKmh).toBeLessThan(low.topSpeedKmh);
  });

  it('picks low drag on a long straight and keeps trap speed in sync', () => {
    const longS = buildAero(...args, 1.2);
    expect(longS.packages.find(p => p.chosen)!.id).toBe('low');
    expect(longS.topSpeedTrapKmh).toBe(longS.packages.find(p => p.chosen)!.topSpeedKmh);
  });

  it('balances front/rear to 100% and models dirty-air loss', () => {
    const a = buildAero(...args, 0.9);
    expect(a.balance.frontPct + a.balance.rearPct).toBe(100);
    expect(a.dirtyAir.downforceLossPct).toBeGreaterThan(0);
    expect(['low', 'medium', 'high']).toContain(a.dirtyAir.overtakeDifficulty);
  });

  it('attributes more aero gain to fast corners than slow, with colours', () => {
    const a = buildAero(...args, 0.9);
    const fast = a.corners.find(c => c.type === 'fast')!;
    const slow = a.corners.find(c => c.type === 'slow')!;
    expect(fast.aeroGain).toBeGreaterThan(slow.aeroGain);
    expect(a.recommendations.length).toBeGreaterThanOrEqual(3);
    expect(difficultyColor('high')).toBeTruthy();
    expect(aeroTypeColor('fast')).toBeTruthy();
  });
});
