/**
 * Telemetry Calibration & Data Trust + Telemetry Data Cube. Locks the data-
 * trust contract (honest degradation on GPS-only bikes, per-module scoring,
 * mismatches) and the cube's semantic-zoom navigation + cause→effect chain.
 */
import { describe, it, expect } from 'vitest';
import { buildDataTrust } from '../src/domain/dataTrust';
import { buildDataCube, loadDataCube, cellState, CUBE_LAPS, CUBE_CORNERS, heatmapTopIssue } from '../src/domain/dataCube';

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

  it('the built cube defaults to the simulated source', () => {
    expect(buildDataCube('Rubén Juárez', 'Yamaha R1', 'Mugello').source).toBe('simulated');
  });
});

describe('telemetry → data cube (live with fallback)', () => {
  it('overlays the session header from a matching live session', async () => {
    const c = await loadDataCube('Rubén Juárez', 'Yamaha R1', 'Mugello', {
      fetchSessions: async () => [
        { session_id: 'JAR-2026-01', circuit_id: 'jarama', total_laps: 20 },
        { session_id: 'MUG-2026-07', circuit_id: 'mugello_gp', total_laps: 23, best_lap_time_s: 117.511, quality_score: 0.92 },
      ],
    });
    expect(c.source).toBe('live');
    expect(c.live?.sessionId).toBe('MUG-2026-07');   // matched by circuit, not first
    expect(c.live?.totalLaps).toBe(23);
    expect(c.views.session.bestLap).toBe('1:57.511'); // mapped from best_lap_time_s
    expect(c.views.session.consistency).toBe('92%');  // mapped from quality_score
  });

  it('marks CONNECTED (not live) when the service answers but has no session for this circuit', async () => {
    const c = await loadDataCube('Rubén Juárez', 'Yamaha R1', 'Mugello', {
      fetchSessions: async () => [
        { session_id: 'NAV-1', circuit_id: 'navarra', total_laps: 15, best_lap_time_s: 97.234 },
        { session_id: 'ASP-1', circuit_id: 'aspar_circuit', total_laps: 45, best_lap_time_s: 98.567 },
      ],
    });
    expect(c.source).toBe('connected');
    expect(c.live).toBeUndefined();
    expect(c.catalogue?.sessions).toBe(2);
    expect(c.catalogue?.circuits).toContain('navarra');
    expect(c.views.session.bestLap).toBe('1:57.842'); // never overlays another circuit's time
  });

  it('falls back to the deterministic model when the service is unreachable', async () => {
    const offline = await loadDataCube('Rubén Juárez', 'Yamaha R1', 'Mugello', { fetchSessions: async () => null });
    const empty = await loadDataCube('Rubén Juárez', 'Yamaha R1', 'Mugello', { fetchSessions: async () => [] });
    const threw = await loadDataCube('Rubén Juárez', 'Yamaha R1', 'Mugello', { fetchSessions: async () => { throw new Error('asleep'); } });
    for (const c of [offline, empty, threw]) {
      expect(c.source).toBe('simulated');
      expect(c.views.session.bestLap).toBe('1:57.842'); // unchanged deterministic header
    }
  });
});
