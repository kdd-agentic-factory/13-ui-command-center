/**
 * Weather & Grip Radar. Locks the current conditions, the forecast timeline
 * (rising rain probability, cooling track), the rain window detection, the
 * tyre crossover, the single recommended tyre, the track-state map and the
 * decision triggers.
 */
import { describe, it, expect } from 'vitest';
import { buildWeather, skyColor, tyreColor } from '../src/domain/weather';

const args = ['Rubén Juárez', 'Yamaha R1', 'Mugello'] as const;

describe('weather & grip radar', () => {
  it('reports current conditions with a grip index', () => {
    const w = buildWeather(...args);
    expect(w.now.gripIndex).toBeGreaterThan(0);
    expect(w.now.gripIndex).toBeLessThanOrEqual(1);
    expect(w.now.trackTempC).toBeGreaterThan(w.now.airTempC);
  });

  it('builds a forecast with rising rain probability and a cooling track', () => {
    const w = buildWeather(...args);
    expect(w.forecast.length).toBeGreaterThanOrEqual(4);
    const first = w.forecast[0], last = w.forecast[w.forecast.length - 1];
    expect(last.rainProb).toBeGreaterThan(first.rainProb);
    expect(last.trackTempC).toBeLessThan(first.trackTempC);
  });

  it('detects the rain window at the first ≥60% point', () => {
    const w = buildWeather(...args);
    const firstWet = w.forecast.find(f => f.rainProb >= 60)!;
    expect(w.rainWindow).not.toBeNull();
    expect(w.rainWindow!.arrivesMin).toBe(firstWet.min);
    expect(w.crossover.atMin).toBe(w.rainWindow!.arrivesMin);
  });

  it('recommends exactly one tyre and a slick→wetter crossover', () => {
    const w = buildWeather(...args);
    expect(w.tyres.filter(t => t.recommended)).toHaveLength(1);
    expect(w.crossover.fromTyre).toBe('slick');
    expect(['intermediate', 'wet']).toContain(w.crossover.toTyre);
  });

  it('maps track state with a wetter zone and exposes colours', () => {
    const w = buildWeather(...args);
    expect(w.zones.some(z => z.state === 'dry')).toBe(true);
    expect(w.zones.some(z => z.state === 'damp' || z.state === 'wet')).toBe(true);
    expect(w.recommendations.length).toBeGreaterThanOrEqual(3);
    expect(skyColor('rain')).toBeTruthy();
    expect(tyreColor('wet')).toBeTruthy();
  });
});
