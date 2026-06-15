/**
 * Track Surface Intelligence — the living-surface model. Locks the grip map,
 * the Grip Budget invariant (segments sum to 100, critical = low margin), the
 * evolution windows and the GPS-only honesty flag.
 */
import { describe, it, expect } from 'vitest';
import { buildTrackSurface } from '../src/domain/trackSurface';

const args = ['Rubén Juárez', 'Yamaha R1', 'Mugello', 'Stint 03'] as const;

describe('track surface intelligence', () => {
  it('builds a per-corner grip map with critical zones', () => {
    const s = buildTrackSurface(...args);
    expect(s.corners.length).toBeGreaterThanOrEqual(4);
    expect(s.criticalZones).toContain('T15 Bucine');
    const bucine = s.corners.find(c => c.corner.includes('Bucine'))!;
    expect(bucine.grip).toBe('Dropping');
    expect(bucine.gripPct).toBeLessThan(s.corners.find(c => c.corner.includes('San Donato'))!.gripPct);
  });

  it('grip budgets sum to 100 and the critical one has a low margin', () => {
    const s = buildTrackSurface(...args);
    for (const b of s.gripBudgets) {
      expect(b.lean + b.throttle + b.degradation + b.margin).toBe(100);
    }
    const bucine = s.gripBudgets.find(b => b.corner.includes('Bucine'))!;
    expect(bucine.status).toBe('Critical');
    expect(bucine.margin).toBeLessThanOrEqual(5);
  });

  it('evolution timeline runs stabilizing → peak → dropping → risk', () => {
    const s = buildTrackSurface(...args);
    expect(s.evolution.map(e => e.state)).toEqual(['stabilizing', 'peak', 'dropping', 'risk']);
    expect(s.bestWindow).toMatch(/3.5/);
  });

  it('line adaptation and surface-aware oracle target the rear-grid constraint', () => {
    const s = buildTrackSurface(...args);
    expect(s.lineAdaptation.recommendedLine.length).toBeGreaterThan(2);
    expect(s.oracle.constraint.toLowerCase()).toContain('rear grip');
    expect(s.oracle.confidence).toBeGreaterThan(0);
  });

  it('flags estimated channels on GPS-only bikes', () => {
    const full = buildTrackSurface('Rubén Juárez', 'Yamaha R1', 'Mugello', 'Stint 03', false);
    const gps = buildTrackSurface('KD5', 'Kawasaki ZX-10R', 'Mugello', 'Stint 03', true);
    expect(gps.corners.find(c => c.corner.includes('Bucine'))!.risk).toContain('estimated');
    expect(full.corners.find(c => c.corner.includes('Bucine'))!.risk).not.toContain('estimated');
  });
});
