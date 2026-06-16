/**
 * Rival Radar / Grid Intelligence. Locks the grid read (threat levels, pace
 * gaps, strength/weakness), the threat-board counts, the top-threat selection
 * by race pace, the sector edge (gain + loss), overtaking zones, the grid-start
 * projection and the head-to-head plan keyed to the top threat.
 */
import { describe, it, expect } from 'vitest';
import { buildRivalRadar, threatColor } from '../src/domain/rivalRadar';

const args = ['Rubén Juárez', 'Yamaha R1', 'Mugello', 15] as const;

describe('rival radar / grid intelligence', () => {
  it('reads the grid with threat levels, pace gaps and strength/weakness', () => {
    const r = buildRivalRadar(...args);
    expect(r.rivals.length).toBeGreaterThanOrEqual(5);
    expect(r.rivals.every(v => v.strongAt && v.weakAt && v.tyreRead)).toBe(true);
    expect(r.rivals.some(v => v.threat === 'high')).toBe(true);
    expect(r.rivals.some(v => v.paceGap < 0)).toBe(true); // someone is faster than us
  });

  it('threat board counts match the grid and pick the fastest as top threat', () => {
    const r = buildRivalRadar(...args);
    expect(r.threatBoard.high).toBe(r.rivals.filter(v => v.threat === 'high').length);
    const fastest = r.rivals.slice().sort((a, b) => a.paceGap - b.paceGap)[0].name;
    expect(r.topThreat).toBe(fastest);
    expect(r.headToHead.rival).toBe(r.topThreat);
  });

  it('maps a sector edge with at least one gain and one loss', () => {
    const r = buildRivalRadar(...args);
    expect(r.sectorEdge.some(s => s.status === 'gain' && s.deltaS > 0)).toBe(true);
    expect(r.sectorEdge.some(s => s.status === 'loss' && s.deltaS < 0)).toBe(true);
  });

  it('lists overtaking zones graded by difficulty and a grid-start projection', () => {
    const r = buildRivalRadar(...args);
    expect(r.overtakeZones.length).toBeGreaterThanOrEqual(2);
    expect(r.overtakeZones.some(z => z.difficulty === 'easy')).toBe(true);
    expect(r.gridStart.gainProb).toBeGreaterThan(0);
    expect(r.gridStart.gainProb).toBeLessThanOrEqual(1);
  });

  it('builds a head-to-head plan with a window and exposes threat colours', () => {
    const r = buildRivalRadar(...args);
    expect(r.headToHead.plan.length).toBeGreaterThan(20);
    expect(r.headToHead.window).toMatch(/Laps/);
    expect(threatColor('high')).toBeTruthy();
    expect(threatColor('low')).toBeTruthy();
  });
});
