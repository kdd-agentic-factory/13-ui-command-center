/**
 * Engineering Control (integration hub). Locks that it composes the six
 * engineering pillars into one board, each linking to a real lab tab, that the
 * counts sum, readiness is the green share, and the priority is the worst card.
 */
import { describe, it, expect } from 'vitest';
import { buildEngineeringControl, engCardColor } from '../src/domain/engineeringControl';

const args = ['Rubén Juárez', 'Yamaha R1', 'Mugello', 5.245, 15, 0.9] as const;
const RANK = { bad: 2, warn: 1, good: 0 } as const;

describe('engineering control', () => {
  it('composes one card per engineering pillar, each linking to a real lab', () => {
    const e = buildEngineeringControl(...args);
    expect(e.cards).toHaveLength(6);
    expect(e.cards.map(c => c.tab).sort()).toEqual(['aero', 'brakes', 'chassis', 'electronics', 'fuel', 'gearing']);
    expect(e.cards.every(c => c.headline && c.metric && c.metricLabel)).toBe(true);
  });

  it('counts statuses that sum to the card count and a readiness %', () => {
    const e = buildEngineeringControl(...args);
    expect(e.counts.good + e.counts.warn + e.counts.bad).toBe(e.cards.length);
    expect(e.readinessPct).toBe(Math.round((e.counts.good / e.cards.length) * 100));
  });

  it('picks the worst-status card as the open item', () => {
    const e = buildEngineeringControl(...args);
    const worst = Math.max(...e.cards.map(c => RANK[c.status]));
    expect(RANK[e.priority.status]).toBe(worst);
  });

  it('exposes grade colours via the shared palette', () => {
    expect(engCardColor('good')).toBeTruthy();
    expect(engCardColor('warn')).toBeTruthy();
    expect(engCardColor('bad')).toBeTruthy();
  });
});
