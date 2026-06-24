import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { TabId } from '../context/AuthContext';
import { buildSessionContext, DASHBOARD_TAB_SETUP_KEY } from '../domain/sessionContext';

const { mockUseProfile, mockGetSessionContext, mockSetSessionContext } = vi.hoisted(() => ({
  mockUseProfile: vi.fn(),
  mockGetSessionContext: vi.fn(),
  mockSetSessionContext: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, fallback?: string) => fallback ?? key }),
}));

vi.mock('../context/AuthContext', async () => {
  const actual = await vi.importActual<typeof import('../context/AuthContext')>('../context/AuthContext');
  return {
    ...actual,
    useProfile: mockUseProfile,
  };
});

vi.mock('../domain/sessionContext', async () => {
  const actual = await vi.importActual<typeof import('../domain/sessionContext')>('../domain/sessionContext');
  return {
    ...actual,
    getSessionContext: mockGetSessionContext,
    setSessionContext: mockSetSessionContext,
  };
});

vi.mock('../domain/demoSessions', () => ({
  getActiveDemoSession: () => null,
}));

vi.mock('../hooks/useLiveTelemetry', () => ({
  useLiveTelemetry: () => ({ lapCount: 12, position: 3, gap: '+0.342', speed: 214, fuelLoad: 9.2 }),
}));

vi.mock('../hooks/useServiceData', () => ({
  useServiceData: () => ({ loading: false, servicesUp: 1, servicesTotal: 1 }),
}));

vi.mock('../components/LanguageSwitcher', () => ({
  LanguageSwitcher: () => null,
}));

vi.mock('../components/CommandPalette', () => ({
  CommandPalette: () => null,
}));

vi.mock('../components/SessionContextStrip', () => ({
  SessionContextStrip: () => null,
}));

vi.mock('../components/GlobalContextBar', () => ({
  GlobalContextBar: () => null,
}));

vi.mock('../components/DecisionCenter', () => ({
  DecisionCenter: () => null,
}));

vi.mock('../pages/LiveTelemetryPage', () => ({
  LiveTelemetryPage: () => <div>Telemetry Dashboard</div>,
}));

vi.mock('../pages/OverviewPage', () => ({
  OverviewPage: () => <div>Overview Dashboard</div>,
}));

import { DashboardShell } from './DashboardShell';

beforeEach(() => {
  mockUseProfile.mockReset();
  mockGetSessionContext.mockReset();
  mockSetSessionContext.mockReset();
});

describe('DashboardShell dashboard tab restore', () => {
  it('restores the persisted dashboard tab when it is allowed', async () => {
    mockUseProfile.mockReturnValue({
      profile: {
        defaultTab: 'overview' as TabId,
        allowedTabs: ['overview', 'telemetry'] as TabId[],
        color: '#E03737',
        icon: '⚙️',
        nameKey: 'profiles.raceEngineer.name',
      },
      logout: vi.fn(),
    });
    mockGetSessionContext.mockReturnValue(buildSessionContext('mugello', 'Mugello', 'race', {
      [DASHBOARD_TAB_SETUP_KEY]: 'telemetry',
    }));

    render(<DashboardShell />);

    expect(screen.getByText('Telemetry Dashboard')).toBeInTheDocument();
    await waitFor(() => {
      expect(mockSetSessionContext).toHaveBeenCalled();
    });
    const persistedContext = mockSetSessionContext.mock.calls[mockSetSessionContext.mock.calls.length - 1]?.[0];
    expect(persistedContext.setup.dashboardTab).toBe('telemetry');
  });

  it('falls back to the current default behavior when the saved tab is invalid', async () => {
    mockUseProfile.mockReturnValue({
      profile: {
        defaultTab: 'overview' as TabId,
        allowedTabs: ['overview', 'telemetry'] as TabId[],
        color: '#E03737',
        icon: '⚙️',
        nameKey: 'profiles.raceEngineer.name',
      },
      logout: vi.fn(),
    });
    mockGetSessionContext.mockReturnValue(buildSessionContext('mugello', 'Mugello', 'race', {
      [DASHBOARD_TAB_SETUP_KEY]: 'bogus',
    }));

    render(<DashboardShell />);

    expect(screen.getByText('Overview Dashboard')).toBeInTheDocument();
    await waitFor(() => {
      expect(mockSetSessionContext).toHaveBeenCalled();
    });
    const persistedContext = mockSetSessionContext.mock.calls[mockSetSessionContext.mock.calls.length - 1]?.[0];
    expect(persistedContext.setup.dashboardTab).toBe('overview');
  });
});
