/**
 * Championship Command (Season & Title Intelligence). Locks the season sizing,
 * the standings (sorted, exactly one "you"), the title maths (magic number,
 * contention), the what-if scenarios, the MotoGP engine-allocation constraint
 * (used ≤ allowed) and the penalty tally under threshold.
 */
import { describe, it, expect } from 'vitest';
import { buildChampionship, trendColor, engineColor } from '../src/domain/championship';

const args = ['Rubén Juárez', 'Yamaha R1'] as const;

describe('championship command', () => {
  it('sizes the season and the points still available', () => {
    const c = buildChampionship(...args);
    expect(c.racesRemaining).toBe(c.totalRounds - c.round);
    expect(c.pointsAvailable).toBe(c.racesRemaining * 37);
    expect(c.pointsAvailable).toBeGreaterThan(0);
  });

  it('builds sorted standings with exactly one "you" and a leader at zero gap', () => {
    const c = buildChampionship(...args);
    expect(c.standings.filter(s => s.isYou)).toHaveLength(1);
    expect(c.standings[0].gap).toBe(0);
    for (let i = 1; i < c.standings.length; i++) {
      expect(c.standings[i].points).toBeLessThanOrEqual(c.standings[i - 1].points);
    }
    expect(c.standings.every(s => s.form.length === 5)).toBe(true);
  });

  it('computes the title maths: magic number and contention', () => {
    const c = buildChampionship(...args);
    expect(c.titleMath.magicNumber).toBe(c.you.gapToLeader + 1);
    expect(c.you.inContention).toBe(c.pointsAvailable >= c.you.gapToLeader);
    expect(typeof c.titleMath.inControl).toBe('boolean');
  });

  it('offers favourable and unfavourable title scenarios', () => {
    const c = buildChampionship(...args);
    expect(c.scenarios.length).toBeGreaterThanOrEqual(3);
    expect(c.scenarios.some(s => s.favourable)).toBe(true);
    expect(c.scenarios.some(s => !s.favourable)).toBe(true);
  });

  it('respects the engine-allocation rule and keeps penalties under threshold', () => {
    const c = buildChampionship(...args);
    expect(c.engine.used).toBeLessThanOrEqual(c.engine.allowed);
    expect(c.concessions.filter(t => t.isYou)).toHaveLength(1);
    expect(c.penalties.every(p => p.points < p.threshold)).toBe(true);
    expect(trendColor('up')).toBeTruthy();
    expect(engineColor('penalty-risk')).toBeTruthy();
  });
});
