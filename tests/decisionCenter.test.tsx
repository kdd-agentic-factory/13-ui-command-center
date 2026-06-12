/**
 * Decision Center — locks the deciding-assistant contract: decisions routed
 * by role, every option carries gain AND risk, the Oracle recommendation is
 * explicit, and every call lands in the accountability log (with override
 * detection when the engineer picks against the Oracle).
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  decisionsFor, pendingCount, decide, defer, reopen, _resetDecisions,
} from '../src/domain/decisions';

afterEach(() => _resetDecisions());

describe('decision routing by role', () => {
  it('routes race calls, setup validations and strategy approvals to the right seats', () => {
    const engineer = decisionsFor('race-engineer');
    const principal = decisionsFor('team-principal');
    const mechanic = decisionsFor('mechanic');
    const spectator = decisionsFor('spectator');

    expect(engineer.map(d => d.id)).toContain('tc-step');
    expect(engineer.map(d => d.id)).toContain('rebound-validation');
    expect(principal.map(d => d.id)).toContain('attack-p2');
    expect(mechanic.map(d => d.id)).toEqual(['rebound-validation']);
    expect(spectator).toHaveLength(0);
  });

  it('every option carries explicit gain and risk, and a recommendation exists', () => {
    for (const d of decisionsFor('race-engineer')) {
      expect(d.options.length).toBeGreaterThanOrEqual(2);
      for (const o of d.options) {
        expect(o.gain.length).toBeGreaterThan(0);
        expect(o.risk.length).toBeGreaterThan(0);
      }
      expect(d.options[d.recommended]).toBeDefined();
      expect(d.confidence).toBeGreaterThan(0.5);
    }
  });
});

describe('decide / defer / log', () => {
  it('deciding moves the call to the log with lap and option', () => {
    expect(pendingCount('race-engineer')).toBe(3);
    decide('tc-step', 0, 17);
    const d = decisionsFor('race-engineer').find(x => x.id === 'tc-step')!;
    expect(d.status).toBe('decided');
    expect(d.decidedOption).toBe(0);
    expect(d.decidedLap).toBe(17);
    expect(pendingCount('race-engineer')).toBe(2);
  });

  it('an engineer override (non-recommended option) is detectable for the log', () => {
    decide('attack-p2', 0, 15); // Oracle recommends index 1 (hold position)
    const d = decisionsFor('team-principal').find(x => x.id === 'attack-p2')!;
    expect(d.decidedOption).not.toBe(d.recommended);
  });

  it('defer parks the call and reopen restores it', () => {
    defer('rebound-validation');
    expect(pendingCount('race-engineer')).toBe(2);
    reopen('rebound-validation');
    expect(pendingCount('race-engineer')).toBe(3);
  });
});
