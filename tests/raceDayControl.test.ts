/**
 * Race Day Control (integration hub). Locks that it composes the five race-day
 * modules into one board, that each card links to a real tab, that the counts
 * sum, and that the priority is the worst-status card (the watch item).
 */
import { describe, it, expect } from 'vitest';
import { buildRaceDayControl, cardStatusColor } from '../src/domain/raceDayControl';

const args = ['Rubén Juárez', 'Yamaha R1', 'Mugello', 5.245, 15] as const;
const RANK = { bad: 2, warn: 1, good: 0 } as const;

describe('race day control', () => {
  it('composes one card per race-day module, each linking to a real tab', () => {
    const r = buildRaceDayControl(...args);
    expect(r.cards).toHaveLength(5);
    expect(r.cards.map(c => c.tab).sort()).toEqual(['fuel', 'pressure', 'strategy', 'tires', 'weather']);
    expect(r.cards.every(c => c.headline && c.metric && c.metricLabel)).toBe(true);
  });

  it('counts the statuses and they sum to the number of cards', () => {
    const r = buildRaceDayControl(...args);
    expect(r.counts.good + r.counts.warn + r.counts.bad).toBe(r.cards.length);
  });

  it('picks the worst-status card as the priority watch item', () => {
    const r = buildRaceDayControl(...args);
    const worst = Math.max(...r.cards.map(c => RANK[c.status]));
    expect(RANK[r.priority.status]).toBe(worst);
    expect(r.cards.some(c => c.tab === r.priority.tab)).toBe(true);
  });

  it('reuses the shared race model for lap count and exposes status colours', () => {
    const r = buildRaceDayControl(...args);
    expect(r.raceLaps).toBe(23); // Mugello-ish, from raceModel
    const strategyCard = r.cards.find(c => c.tab === 'strategy')!;
    expect(strategyCard.metric).toBe(`${r.raceLaps}`);
    expect(cardStatusColor('bad')).toBeTruthy();
    expect(cardStatusColor('good')).toBeTruthy();
  });
});
