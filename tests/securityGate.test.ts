/**
 * Decision Center ↔ 24-security policy gate (live with fallback). Locks the
 * action mapping and the verdict states: allowed, blocked, approval-required,
 * and offline (engine unreachable / not configured → Decision Center still works).
 */
import { describe, it, expect } from 'vitest';
import { gateDecision, decisionAction, _resetDecisions, decisionsFor } from '../src/domain/decisions';

_resetDecisions();
const aDecision = decisionsFor('race-engineer')[0]; // a seeded pending decision

describe('decision → policy action mapping', () => {
  it('maps source/title to the security engine action vocabulary', () => {
    expect(decisionAction({ ...aDecision, title: 'Approve: deploy workflow' })).toBe('workflow.approve');
    expect(decisionAction({ ...aDecision, source: 'Tyre Intelligence', title: 'TC step' })).toBe('race.apply_tire_strategy');
    expect(decisionAction({ ...aDecision, source: 'Safety Guardian', title: 'Engine map' })).toBe('race.apply_engine_map_change');
    expect(decisionAction({ ...aDecision, source: 'Garage Engineer', title: 'Rear rebound +2' })).toBe('race.apply_setup_change');
  });
});

describe('policy gate verdicts', () => {
  it('allowed → ALLOWED with risk level', async () => {
    const v = await gateDecision(aDecision, {
      evaluatePolicy: async () => ({ ok: true, data: { allowed: true, risk_level: 'low', required_mitigations: [], violated_policies: [] } }),
    });
    expect(v.state).toBe('allowed');
    expect(v.riskLevel).toBe('low');
  });

  it('require_approval mitigation → APPROVAL', async () => {
    const v = await gateDecision(aDecision, {
      evaluatePolicy: async () => ({ ok: true, data: { allowed: true, risk_level: 'high', required_mitigations: ['require_approval', 'escalate_to:team-principal'] } }),
    });
    expect(v.state).toBe('approval');
    expect(v.mitigations).toContain('escalate_to:team-principal');
  });

  it('not allowed → BLOCKED with violated policies', async () => {
    const v = await gateDecision(aDecision, {
      evaluatePolicy: async () => ({ ok: true, data: { allowed: false, risk_level: 'high', violated_policies: ['data-governance'] } }),
    });
    expect(v.state).toBe('blocked');
    expect(v.violated).toContain('data-governance');
  });

  it('falls back to OFFLINE when the engine is not configured or unreachable or throws', async () => {
    const notConf = await gateDecision(aDecision, { evaluatePolicy: async () => ({ ok: false, reason: 'not-configured' }) });
    const unreach = await gateDecision(aDecision, { evaluatePolicy: async () => ({ ok: false, reason: 'unreachable' }) });
    const threw = await gateDecision(aDecision, { evaluatePolicy: async () => { throw new Error('down'); } });
    for (const v of [notConf, unreach, threw]) expect(v.state).toBe('offline');
  });
});
