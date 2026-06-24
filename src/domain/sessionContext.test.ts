import { describe, expect, it } from 'vitest';

import { buildSessionContext, resolveDashboardTab, withDashboardTab } from './sessionContext';
import type { TabId } from '../context/AuthContext';

describe('resolveDashboardTab', () => {
  it('uses the persisted dashboard tab when it is allowed', () => {
    const allowedTabs: TabId[] = ['overview', 'telemetry', 'setup'];

    expect(resolveDashboardTab('telemetry', allowedTabs, 'telemetry', 'overview')).toBe('telemetry');
  });

  it('falls back to the current default behavior when the saved tab is invalid or missing', () => {
    const allowedTabs: TabId[] = ['overview', 'telemetry', 'setup'];

    expect(resolveDashboardTab('bogus', allowedTabs, 'telemetry', 'overview')).toBe('telemetry');
    expect(resolveDashboardTab(undefined, ['overview', 'setup'], 'telemetry', 'overview')).toBe('overview');
  });
});

describe('withDashboardTab', () => {
  it('stores the current dashboard tab in the session setup JSON', () => {
    const ctx = buildSessionContext('mugello', 'Mugello', 'race', { rider: 'Rubén Juárez' });

    const next = withDashboardTab(ctx, 'telemetry');

    expect(next.setup.dashboardTab).toBe('telemetry');
    expect(next.setup.rider).toBe('Rubén Juárez');
    expect(ctx.setup.dashboardTab).toBeUndefined();
  });
});
