/**
 * Telemetry Visualization OS — the unified, synchronized session view. Locks
 * the master-cursor frame model (corner/phase mapping, events on apex), the
 * before/after lens deltas, the visual grammar and the seek helper.
 */
import { describe, it, expect } from 'vitest';
import { buildVisualWorkbench, cornerAt, frameAtTime, clockFromS } from '../src/domain/visualWorkbench';

const args = ['Rubén Juárez', 'Yamaha R1', 'Mugello', 'Stint 03'] as const;

describe('visual workbench', () => {
  it('cornerAt maps distance to corner + phase, straights included', () => {
    expect(cornerAt(0.88).corner).toContain('Bucine');
    expect(cornerAt(0.0).corner).toBe('Straight');
    expect(['Entry', 'Apex', 'Exit']).toContain(cornerAt(0.88).phase);
  });

  it('builds a synchronized frame timeline with events on corner apexes', () => {
    const wb = buildVisualWorkbench(...args);
    expect(wb.frames.length).toBeGreaterThan(50);
    expect(wb.frames[0].distM).toBe(0);
    expect(wb.frames[wb.frames.length - 1].distPct).toBeCloseTo(1, 5);
    const withEvents = wb.frames.filter(f => f.event);
    expect(withEvents.length).toBeGreaterThan(0);
    expect(withEvents.some(f => f.corner.includes('Bucine'))).toBe(true);
  });

  it('the master cursor resolves a coherent frame at any time', () => {
    const wb = buildVisualWorkbench(...args);
    const mid = frameAtTime(wb, wb.durationS / 2);
    expect(mid.distPct).toBeGreaterThan(0.4);
    expect(mid.distPct).toBeLessThan(0.6);
    expect(clockFromS(96.884)).toBe('1:36.884');
  });

  it('before/after lens improves the key metrics and carries the visual grammar', () => {
    const wb = buildVisualWorkbench(...args);
    const slip = wb.beforeAfter.find(r => r.metric === 'Rear slip')!;
    expect(slip.before).toBe('14.0%'); expect(slip.after).toBe('9.8%'); expect(slip.deltaPct).toBeLessThan(0);
    expect(wb.grammar.length).toBeGreaterThanOrEqual(6);
    expect(wb.confidence.map(c => c.dash)).toEqual(['solid', 'dashed', 'dotted']);
    expect(wb.workspaces.length).toBe(4);
  });
});
