import { describe, it, expect } from 'vitest';
import { calculateTrail, channelStats, activeRecording, clearRecording } from '../src/domain/recordedSession';

describe('recorded chassis data', () => {
  it('can leave a stored recording without keeping a stale pointer', () => {
    localStorage.setItem('kdd-recorded-session-id', 'stale-session');
    expect(activeRecording()).toBe('stale-session');
    clearRecording();
    expect(activeRecording()).toBeNull();
  });
  it('calculates trail from measured dimensions without using the circuit', () => {
    expect(calculateTrail(300, 24, 30)).toBeCloseTo(100.74, 1);
    expect(() => calculateTrail(0, 24, 30)).toThrow();
  });
  it('reports measured ranges without inventing balance or confidence', () => {
    expect(channelStats([12, 18, 15])).toEqual({ min: 12, max: 18, mean: 15 });
    expect(() => channelStats([])).toThrow();
  });
});
