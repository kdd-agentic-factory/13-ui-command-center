import { describe, expect, it } from 'vitest';
import { alignRecordedLaps, curveDelta, pointAtDistance, type GpsPoint } from '../src/domain/lapAlignment';

function lap(rate = 1): GpsPoint[] {
  return Array.from({ length: 241 }, (_, i) => {
    const angle = i * Math.PI / 120;
    return { x: 120 * Math.sin(angle), y: 120 * (1 - Math.cos(angle)), t: i * .1 * rate, gap: false };
  });
}

describe('recorded lap alignment', () => {
  it('uses the same spatial cursor for each lap and compares elapsed time across a curve', () => {
    const result = alignRecordedLaps(lap(), lap(1.1));
    expect(result.valid).toBe(true);
    expect(result.coverage).toBeCloseTo(1);
    expect(pointAtDistance(result.compared, result.length / 2)?.t).toBeCloseTo(13.2);
    expect(curveDelta(result, result.length / 4, result.length / 2)).toBeCloseTo(.6);
  });

  it('preserves missing sections and withholds the delta across a gap', () => {
    const a = lap();
    const b = lap().filter((_, i) => i < 112 || i > 126);
    b[112].gap = true;
    const result = alignRecordedLaps(a, b);
    expect(result.valid).toBe(true);
    expect(result.coverage).toBeLessThan(.95);
    expect(pointAtDistance(result.compared, result.length / 2)).toBeNull();
    expect(curveDelta(result, result.length / 4, result.length * .75)).toBeNull();
  });

  it('rejects partial and wrong-direction laps', () => {
    const a = lap();
    for (const b of [lap().slice(70), lap().reverse().map((p, i) => ({ ...p, t: i * .1 }))]) {
      const result = alignRecordedLaps(a, b);
      expect(result.valid).toBe(false);
      expect(curveDelta(result, 0, 20)).toBeNull();
    }
  });
});
