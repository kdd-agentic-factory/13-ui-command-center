/**
 * Chassis & Geometry Lab. Locks the geometry parameters, the weight
 * distribution summing to 100, the suspension clicks within range, the balance
 * read, the corner-phase behaviour and the recommended changes — plus that the
 * setup leans tighter/agile vs faster/stable with the circuit.
 */
import { describe, it, expect } from 'vitest';
import { buildChassis, balanceColor } from '../src/domain/chassis';

const args = ['Rubén Juárez', 'Yamaha R1', 'Mugello'] as const;

describe('chassis & geometry lab', () => {
  it('reports geometry params and a weight split summing to 100', () => {
    const c = buildChassis(...args, 15);
    expect(c.geometry.some(g => g.name === 'Rake')).toBe(true);
    expect(c.geometry.some(g => g.name === 'Trail')).toBe(true);
    expect(c.weightDist.frontPct + c.weightDist.rearPct).toBe(100);
  });

  it('keeps every suspension setting within its click range', () => {
    const c = buildChassis(...args, 15);
    expect(c.suspension.length).toBeGreaterThanOrEqual(4);
    expect(c.suspension.every(s => s.clicks >= 0 && s.clicks <= s.range)).toBe(true);
  });

  it('reads balance and gives a change for each corner phase', () => {
    const c = buildChassis(...args, 15);
    expect(['understeer', 'neutral', 'oversteer']).toContain(c.balance.state);
    expect(c.corners.map(p => p.phase)).toEqual(['Entry', 'Mid-corner', 'Exit']);
    expect(c.changes.length).toBeGreaterThanOrEqual(3);
  });

  it('leans agile on a tight track and stable on a fast one', () => {
    const tight = buildChassis(...args, 16);
    const fast = buildChassis(...args, 10);
    const trail = (c: ReturnType<typeof buildChassis>) => c.geometry.find(g => g.name === 'Trail')!.value;
    expect(trail(tight)).toBeLessThan(trail(fast)); // less trail = more agile
  });

  it('exposes balance colours', () => {
    expect(balanceColor('understeer')).toBeTruthy();
    expect(balanceColor('oversteer')).toBeTruthy();
  });
});
