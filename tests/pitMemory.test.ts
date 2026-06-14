/**
 * Pit memory — Black Box (timeline + decision records) and Knowledge Graph
 * (learned patterns). Locks the chronology, the decision-outcome contract and
 * the learning-loop personalisation.
 */
import { describe, it, expect } from 'vitest';
import { buildBlackBox, getKnowledgePatterns } from '../src/domain/pitMemory';

describe('black box', () => {
  it('timeline is chronological and ends in a validated outcome', () => {
    const bb = buildBlackBox('Rubén Juárez', 'Yamaha R1', 'Mugello', 'Stint 03');
    const times = bb.timeline.map(e => e.time);
    expect([...times].sort()).toEqual(times); // already in order
    expect(bb.timeline[bb.timeline.length - 1].kind).toBe('outcome');
    // the recorder captures detection → verdict → action → outcome
    const kinds = bb.timeline.map(e => e.kind);
    expect(kinds).toContain('telemetry');
    expect(kinds).toContain('verdict');
    expect(kinds).toContain('action');
  });

  it('decision records carry evidence, applied flag and outcome status', () => {
    const bb = buildBlackBox('Rubén Juárez', 'Yamaha R1', 'Mugello', 'Stint 03');
    const validated = bb.decisions.find(d => d.status === 'validated')!;
    expect(validated.applied).toBe(true);
    expect(validated.evidence.length).toBeGreaterThan(0);
    expect(validated.result).not.toBe('—');
    const rejected = bb.decisions.find(d => d.status === 'rejected')!;
    expect(rejected.applied).toBe(false);
    expect(rejected.result).toBe('—');
  });
});

describe('knowledge graph', () => {
  it('learns limiter → fix → result patterns personalised to the combo', () => {
    const ps = getKnowledgePatterns('Rubén Juárez', 'Yamaha R1', 'Mugello');
    expect(ps.length).toBeGreaterThanOrEqual(3);
    expect(ps[0].combo).toContain('Rubén Juárez');
    expect(ps[0].combo).toContain('Mugello');
    expect(ps[0].confidence).toBe('High');
    expect(ps[0].sessions).toBeGreaterThan(0);
    for (const p of ps) {
      expect(p.limiter.length).toBeGreaterThan(5);
      expect(p.bestFix.length).toBeGreaterThan(5);
      expect(p.recommendedSetup.length).toBeGreaterThan(0);
    }
  });
});
