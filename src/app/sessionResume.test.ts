import { describe, expect, it } from 'vitest';

import { buildSessionResumeSnapshot } from './sessionResume';

describe('buildSessionResumeSnapshot', () => {
  it('restores the persisted session into the dashboard work area', () => {
    const snapshot = buildSessionResumeSnapshot({
      circuit_id: 'mugello',
      session_mode: 'replay',
      data_mode: 'recorded',
      dashboard_profile: 'replay_analysis',
      pit_strategy_enabled: false,
      demo_mode: false,
      setup: {
        session: 'Mugello · Stint 03 · 14:32 · Yamaha R1',
        rider: 'Rubén Juárez',
        bike: 'Yamaha R1',
        dataSource: 'upload',
      },
    });

    expect(snapshot.stage).toBe('dashboard');
    expect(snapshot.sessionCtx.selectedCircuit).toBe('mugello');
    expect(snapshot.sessionCtx.circuitName).toBe('Mugello');
    expect(snapshot.sessionCtx.sessionMode).toBe('replay');
    expect(snapshot.sessionCtx.dashboardProfile).toBe('replay_analysis');
    expect(snapshot.gateCircuit?.id).toBe('mugello');
    expect(snapshot.garageProfile?.rider.name).toBe('Rubén Juárez');
    expect(snapshot.garageProfile?.bike.brand).toBe('Yamaha');
  });

  it('keeps the session context even when the circuit is unknown', () => {
    const snapshot = buildSessionResumeSnapshot({
      circuit_id: 'unknown-track',
      session_mode: 'demo',
      data_mode: 'sample',
      dashboard_profile: 'guided_demo',
      pit_strategy_enabled: false,
      demo_mode: true,
      setup: { demoId: 'trackday' },
    });

    expect(snapshot.stage).toBe('dashboard');
    expect(snapshot.sessionCtx.selectedCircuit).toBe('unknown-track');
    expect(snapshot.sessionCtx.circuitName).toBe('unknown-track');
    expect(snapshot.gateCircuit).toBeNull();
    expect(snapshot.garageProfile).toBeNull();
  });
});
