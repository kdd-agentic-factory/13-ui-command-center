/**
 * Rider Learning Path — the development plan. Locks that the active block
 * trains a MEASURABLE skill, that GPS-only bikes flag the telemetry skills as
 * estimated, and that progress + Oracle verdict stay coherent.
 */
import { describe, it, expect } from 'vitest';
import { buildLearningPath } from '../src/domain/riderLearningPath';

describe('rider learning path', () => {
  it('is personalised and rates every skill against a target', () => {
    const lp = buildLearningPath('Rubén Juárez', 'Yamaha R1', 'Mugello');
    expect(lp.combo).toContain('Rubén Juárez');
    expect(lp.combo).toContain('Mugello');
    expect(lp.skills.length).toBe(10);
    for (const s of lp.skills) {
      expect(s.score).toBeGreaterThanOrEqual(0);
      expect(s.score).toBeLessThanOrEqual(100);
      expect(s.target).toBeGreaterThan(0);
    }
  });

  it('active block trains a measurable skill and chains to a different next block', () => {
    const lp = buildLearningPath('Rubén Juárez', 'Yamaha R1', 'Mugello');
    const trained = lp.skills.find(s => s.skill === lp.activeBlock.trains)!;
    expect(trained.estimated).toBe(false);
    expect(lp.activeBlock.drills.length).toBeGreaterThan(0);
    expect(lp.activeBlock.successCriteria.length).toBeGreaterThan(0);
    expect(lp.nextBlock.id).not.toBe(lp.activeBlock.id);
  });

  it('GPS-only bikes flag throttle/exit/lean as estimated but still train a measured skill', () => {
    const lp = buildLearningPath('KD5', 'Kawasaki ZX-10R', 'Mugello', true);
    expect(lp.telemetryLimited).toBe(true);
    const throttle = lp.skills.find(s => s.skill === 'Throttle Smoothness')!;
    expect(throttle.estimated).toBe(true);
    // whatever the active block trains, we can actually measure it
    const trained = lp.skills.find(s => s.skill === lp.activeBlock.trains)!;
    expect(trained.estimated).toBe(false);
  });

  it('progress shows a positive delta and the Oracle commits to a priority + gain', () => {
    const lp = buildLearningPath('Rubén Juárez', 'Yamaha R1', 'Mugello');
    expect(lp.progress.current - lp.progress.previous).toBe(lp.progress.delta);
    expect(lp.progress.delta).toBeGreaterThan(0);
    expect(lp.oracle.priority.length).toBeGreaterThan(0);
    expect(lp.oracle.expectedGain).toMatch(/s/);
    expect(lp.nextMilestone.length).toBeGreaterThan(5);
  });
});
