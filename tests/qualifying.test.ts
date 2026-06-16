/**
 * Qualifying Lab (single-lap discipline). Locks the lap arithmetic (best/pole/
 * ideal sums, time on the table, pole-in-reach), the sector splits, the tow
 * plan, the tyre prep, the track-evolution window and the Q1/Q2 run plan, plus
 * the lap formatter.
 */
import { describe, it, expect } from 'vitest';
import { buildQualifying, qualityColor, fmtLap } from '../src/domain/qualifying';

const args = ['Rubén Juárez', 'Yamaha R1', 'Mugello', 15, 1.141] as const;

describe('qualifying lab', () => {
  it('derives lap totals from the sector splits', () => {
    const q = buildQualifying(...args);
    const sumBest = q.sectors.reduce((a, s) => a + s.yourBest, 0);
    const sumPole = q.sectors.reduce((a, s) => a + s.pole, 0);
    expect(q.yourBest).toBeCloseTo(sumBest, 3);
    expect(q.poleRef).toBeCloseTo(sumPole, 3);
    expect(q.gapToPole).toBeCloseTo(q.yourBest - q.poleRef, 3);
  });

  it('computes the ideal lap and the time left on the table', () => {
    const q = buildQualifying(...args);
    expect(q.theoreticalBest).toBeLessThanOrEqual(q.yourBest);
    expect(q.timeOnTable).toBeCloseTo(q.yourBest - q.theoreticalBest, 3);
    expect(q.timeOnTable).toBeGreaterThan(0);
    expect(q.poleInReach).toBe(q.theoreticalBest <= q.poleRef);
  });

  it('plans the tow, the tyre prep and the run schedule', () => {
    const q = buildQualifying(...args);
    expect(q.tow.gainS).toBeGreaterThan(0);
    expect(q.tyrePrep.pushLaps).toBeGreaterThan(0);
    expect(q.runPlan.length).toBeGreaterThanOrEqual(2);
    expect(q.runPlan.some(r => r.tyre.toLowerCase().includes('new'))).toBe(true);
  });

  it('reads track evolution and picks a best grip window', () => {
    const q = buildQualifying(...args);
    expect(q.evolution.length).toBeGreaterThanOrEqual(4);
    const peak = q.evolution.reduce((a, b) => (b.gripPct > a.gripPct ? b : a));
    expect(q.bestWindowMin).toBeLessThanOrEqual(peak.minute);
    expect(q.evolution[q.evolution.length - 1].gripPct).toBeGreaterThanOrEqual(q.evolution[0].gripPct);
  });

  it('formats laps as m:ss.SSS and exposes quality colours', () => {
    expect(fmtLap(105.43)).toBe('1:45.430');
    expect(fmtLap(60)).toBe('1:00.000');
    expect(qualityColor('optimal')).toBeTruthy();
    expect(qualityColor('compromised')).toBeTruthy();
  });
});
