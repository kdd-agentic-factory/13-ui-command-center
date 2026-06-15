/**
 * Multi-Session Pattern Miner — longitudinal recurring-pattern intelligence.
 * Locks the pattern contract (source split sums to 100, corners ranked, the
 * recurring Bucine loss leads) and the GPS-only honesty flag.
 */
import { describe, it, expect } from 'vitest';
import { buildPatternMine } from '../src/domain/patternMiner';

describe('pattern miner', () => {
  it('builds personalised recurring patterns with coherent source splits', () => {
    const m = buildPatternMine('Rubén Juárez', 'Yamaha R1');
    expect(m.combo).toContain('Rubén Juárez');
    expect(m.patterns.length).toBeGreaterThanOrEqual(3);
    for (const p of m.patterns) {
      expect(p.source.rider + p.source.bike + p.source.circuit).toBe(100);
      expect(p.frequency).toBeGreaterThan(0);
      expect(p.frequency).toBeLessThanOrEqual(1);
      expect(p.confidence).toBeGreaterThan(0);
      expect(p.corners.length).toBeGreaterThan(0);
    }
  });

  it('the top pattern is the recurring late-pickup loss led by T15 Bucine', () => {
    const top = buildPatternMine('Rubén Juárez', 'Yamaha R1').patterns[0];
    expect(top.pattern.toLowerCase()).toContain('throttle');
    expect(top.corners[0].corner).toContain('Bucine');
    expect(top.corners[0].loss).toBe(0.31);
    expect(top.source.rider).toBeGreaterThan(top.source.bike); // mainly rider-style
  });

  it('comparisons, setup history and progress are present', () => {
    const m = buildPatternMine('Rubén Juárez', 'Yamaha R1');
    expect(m.comparisons.length).toBeGreaterThan(0);
    expect(m.setupHistory.some(s => s.validated > 0)).toBe(true);
    expect(m.progress.headline.length).toBeGreaterThan(10);
    expect(m.oracleContext.toLowerCase()).toContain('not a new issue');
  });

  it('flags GPS-only estimated telemetry honestly', () => {
    const full = buildPatternMine('Rubén Juárez', 'Yamaha R1', false);
    const gps = buildPatternMine('KD5', 'Kawasaki ZX-10R', true);
    expect(full.patterns[0].telemetry.join(' ')).not.toContain('estimated');
    expect(gps.patterns[0].telemetry.join(' ')).toContain('estimated');
  });
});
