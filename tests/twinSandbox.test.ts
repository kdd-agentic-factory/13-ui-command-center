/**
 * Scenario Sandbox ↔ Digital Twin validation (live with fallback). Locks the
 * lever→proposed-setup mapping and the three outcomes: a mapped live result, a
 * graceful "unavailable" when the twin returns null, and never throwing.
 */
import { describe, it, expect } from 'vitest';
import { leversToProposedSetup, validateWithTwin, DEFAULT_LEVERS } from '../src/domain/scenarioSandbox';

describe('twin validation mapping', () => {
  it('maps levers to a proposed setup the twin understands', () => {
    const setup = leversToProposedSetup({ ...DEFAULT_LEVERS, rearRebound: 1, tc: 2, earlierThrottle: 0.3 });
    expect(setup.rear_rebound).toBe(3);           // 2 + lever(1)
    expect(setup.tc).toBe(2);
    expect(setup.throttle_pickup_offset_s).toBe(-0.3);
  });

  it('overlays the twin verdict when the service returns a result', async () => {
    const v = await validateWithTwin(DEFAULT_LEVERS, { circuitId: 'mugello' }, {
      runWhatIf: async (req) => {
        expect(req.baseline_setup_id).toBe('mugello-baseline');  // circuit-derived
        expect(req.circuit_id).toBe('mugello');
        return {
          delta_metrics: { lap_time_delta_s: 0.05, stability_score_delta: -0.026, rear_temp_delta_c: 0 },
          risk_level: 'low', approval_required: false, explanation: 'Setup risk is low.', limitations: ['MVP heuristics'],
        };
      },
    });
    expect(v.available).toBe(true);
    expect(v.lapDeltaS).toBe(0.05);
    expect(v.stabilityDelta).toBe(-0.026);
    expect(v.riskLevel).toBe('low');
    expect(v.approvalRequired).toBe(false);
    expect(v.limitations).toContain('MVP heuristics');
  });

  it('falls back to unavailable when the twin is unreachable or returns no metrics', async () => {
    const offline = await validateWithTwin(DEFAULT_LEVERS, { circuitId: 'mugello' }, { runWhatIf: async () => null });
    const noMetrics = await validateWithTwin(DEFAULT_LEVERS, { circuitId: 'mugello' }, { runWhatIf: async () => ({ risk_level: 'low' }) });
    const threw = await validateWithTwin(DEFAULT_LEVERS, { circuitId: 'mugello' }, { runWhatIf: async () => { throw new Error('asleep'); } });
    for (const v of [offline, noMetrics, threw]) expect(v.available).toBe(false);
  });

  it('normalises the circuit id for the baseline lookup', async () => {
    let seen = '';
    await validateWithTwin(DEFAULT_LEVERS, { circuitId: 'Mugello GP' }, {
      runWhatIf: async (req) => { seen = req.baseline_setup_id; return null; },
    });
    expect(seen).toBe('mugellogp-baseline'); // lowercased, non-alnum stripped
  });
});
