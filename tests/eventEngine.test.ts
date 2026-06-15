/**
 * Telemetry Event Engine — raw telemetry → intelligent events. Locks the event
 * contract (every event has evidence + action), the summary/corner aggregation,
 * the critical main event, clustering and the GPS-only honesty flag.
 */
import { describe, it, expect } from 'vitest';
import { buildEventEngine } from '../src/domain/eventEngine';

const args = ['Rubén Juárez', 'Yamaha R1', 'Mugello', 'Stint 03'] as const;

describe('event engine', () => {
  it('emits categorised events that each carry evidence and an action', () => {
    const e = buildEventEngine(...args);
    expect(e.events.length).toBeGreaterThanOrEqual(6);
    for (const ev of e.events) {
      expect(ev.evidence.length).toBeGreaterThan(0);
      expect(ev.action.length).toBeGreaterThan(3);
      expect(ev.recommendation.length).toBeGreaterThan(3);
    }
  });

  it('summary counts match the events and the main event is critical', () => {
    const e = buildEventEngine(...args);
    expect(e.summary.total).toBe(e.events.length);
    expect(e.summary.critical).toBe(e.events.filter(x => x.severity === 'critical').length);
    expect(e.mainEvent.severity).toBe('critical');
    expect(e.mainEvent.corner).toContain('Bucine');
  });

  it('aggregates a per-corner event map ranked by count', () => {
    const e = buildEventEngine(...args);
    expect(e.cornerMap.length).toBeGreaterThan(0);
    for (let i = 1; i < e.cornerMap.length; i++) {
      expect(e.cornerMap[i - 1].total).toBeGreaterThanOrEqual(e.cornerMap[i].total);
    }
    const bucine = e.cornerMap.find(c => c.corner.includes('Bucine'))!;
    expect(bucine.total).toBeGreaterThanOrEqual(2);
  });

  it('clusters related events by root cause and exposes a resolved event', () => {
    const e = buildEventEngine(...args);
    expect(e.clusters[0].name.toLowerCase()).toContain('bucine');
    expect(e.clusters[0].events.length).toBeGreaterThan(1);
    expect(e.events.some(x => x.resolved)).toBe(true);
  });

  it('flags GPS-only estimated telemetry in the evidence', () => {
    const full = buildEventEngine('Rubén Juárez', 'Yamaha R1', 'Mugello', 'Stint 03', false);
    const gps = buildEventEngine('KD5', 'Kawasaki ZX-10R', 'Mugello', 'Stint 03', true);
    expect(full.events.flatMap(e => e.evidence).join(' ')).not.toContain('GPS-only');
    expect(gps.events.flatMap(e => e.evidence).join(' ')).toContain('GPS-only');
  });
});
