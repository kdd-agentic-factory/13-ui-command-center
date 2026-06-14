/**
 * Telemetry Calibration & Data Trust + Telemetry Data Cube. Locks the data-
 * trust contract (honest degradation on GPS-only bikes, per-module scoring,
 * mismatches) and the cube's semantic-zoom navigation + cause→effect chain.
 */
import { describe, it, expect } from 'vitest';
import { buildDataTrust } from '../src/domain/dataTrust';
import { buildDataCube, cellState, CUBE_LAPS, CUBE_CORNERS, heatmapTopIssue } from '../src/domain/dataCube';

describe('data trust center', () => {
  it('full telemetry scores higher than GPS-only and lists sources/channels/modules', () => {
    const full = buildDataTrust('Rubén Juárez', 'Yamaha R1', 'Mugello', 'Stint 03', false);
    const gps = buildDataTrust('KD5', 'Kawasaki ZX-10R', 'Mugello', 'Stint 03', true);
    expect(full.trustScore).toBeGreaterThan(gps.trustScore);
    expect(full.sources).toContain('ECU');
    expect(gps.sources).not.toContain('ECU');
    expect(full.channels.length).toBeGreaterThanOrEqual(8);
    expect(full.moduleTrust.length).toBeGreaterThanOrEqual(6);
  });

  it('GPS-only bikes mark ECU channels missing and add an ECU degraded mode', () => {
    const gps = buildDataTrust('KD5', 'Kawasaki ZX-10R', 'Mugello', 'Stint 03', true);
    const throttle = gps.channels.find(c => c.mappedTo === 'Throttle %')!;
    expect(throttle.status).toBe('Missing');
    expect(gps.degraded.some(d => d.trigger.includes('ECU'))).toBe(true);
    // every module score stays within bounds
    for (const m of gps.moduleTrust) { expect(m.score).toBeGreaterThan(0); expect(m.score).toBeLessThanOrEqual(100); }
  });

  it('always reports tyre pressure missing and a video sync offset, with actions', () => {
    const d = buildDataTrust('Rubén Juárez', 'Yamaha R1', 'Mugello', 'Stint 03');
    expect(d.channels.find(c => c.mappedTo === 'Tyre pressure')!.status).toBe('Missing');
    expect(d.sync.find(s => s.pair.includes('Video'))!.ok).toBe(false);
    expect(d.videoOffsetS).toBeGreaterThan(0);
    expect(d.recommendedActions.length).toBeGreaterThanOrEqual(3);
    expect(d.alignment.status).toBe('Validated');
  });
});

describe('telemetry data cube', () => {
  it('builds a full laps × corners matrix', () => {
    const c = buildDataCube('Rubén Juárez', 'Yamaha R1', 'Mugello');
    expect(c.cells.length).toBe(CUBE_LAPS.length * CUBE_CORNERS.length);
    // T15 is the recurring critical loss
    const t15 = c.cells.filter(x => x.corner === 'T15');
    expect(t15.every(x => x.delta > 0)).toBe(true);
  });

  it('cell state thresholds are monotonic in severity', () => {
    expect(cellState(0)).toBe('stable');
    expect(cellState(0.08)).toBe('moderate');
    expect(cellState(0.30)).toBe('critical');
    expect(cellState(0.30, true)).toBe('ai');
  });

  it('semantic zoom returns coherent content at each level', () => {
    const c = buildDataCube('Rubén Juárez', 'Yamaha R1', 'Mugello');
    expect(c.views.session.mainLoss).toContain('Bucine');
    expect(c.views.lap(4).mainLoss).toContain('T15');
    expect(c.views.corner('T15').exit).toMatch(/critical/i);
    expect(c.views.phase.leanAtPickup).toBe('57°');
    expect(c.views.channel.throttle.length).toBeGreaterThan(0);
  });

  it('cause→effect ends in the lap-time loss and before/after improves', () => {
    const c = buildDataCube('Rubén Juárez', 'Yamaha R1', 'Mugello');
    expect(c.causeEffect[0].label).toMatch(/lean/i);
    expect(c.causeEffect[c.causeEffect.length - 1].label).toMatch(/lap time/i);
    expect(c.beforeAfter.improvement.startsWith('-')).toBe(true);
    expect(heatmapTopIssue('Time loss')).toContain('Bucine');
  });
});
