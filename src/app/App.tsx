import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Activity,
  Map,
  Circle,
  Sliders,
  Wrench,
  CalendarDays,
  Radio,
  Bot,
  GitBranch,
  Settings,
  Zap,
  ChevronRight,
} from 'lucide-react';

import { useLiveTelemetry } from '../hooks/useLiveTelemetry';

import { OverviewPage }            from '../pages/OverviewPage';
import { LiveTelemetryPage }       from '../pages/LiveTelemetryPage';
import { CircuitIntelligencePage } from '../pages/CircuitIntelligencePage';
import { TireDegradationPage }     from '../pages/TireDegradationPage';
import { SetupManagementPage }     from '../pages/SetupManagementPage';
import { PartDesignPage }          from '../pages/PartDesignPage';
import { PreGrandPrixPage }        from '../pages/PreGrandPrixPage';
import { CrewChiefPage }           from '../pages/CrewChiefPage';
import { AICopilotPage }           from '../pages/AICopilotPage';
import { DigitalTwinReportPage }   from '../pages/DigitalTwinReportPage';
import { SettingsPage }            from '../pages/SettingsPage';

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId =
  | 'overview'
  | 'telemetry'
  | 'circuit'
  | 'tires'
  | 'setup'
  | 'parts'
  | 'pre-gp'
  | 'crew'
  | 'copilot'
  | 'twin'
  | 'settings';

interface NavItem {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
}

// ─── Navigation definition ────────────────────────────────────────────────────

const NAV_SECTIONS: { section: string; items: NavItem[] }[] = [
  {
    section: 'RACE',
    items: [
      { id: 'overview',  label: 'Overview',           icon: <LayoutDashboard size={15} />,  badge: 'LIVE', badgeColor: 'red' },
      { id: 'telemetry', label: 'Live Telemetry',     icon: <Activity size={15} />,         badge: '10Hz', badgeColor: 'green' },
      { id: 'circuit',   label: 'Circuit Intelligence', icon: <Map size={15} /> },
      { id: 'tires',     label: 'Tyre Degradation',   icon: <Circle size={15} /> },
    ],
  },
  {
    section: 'ENGINEERING',
    items: [
      { id: 'setup',     label: 'Setup Management',   icon: <Sliders size={15} /> },
      { id: 'parts',     label: 'Part Design',        icon: <Wrench size={15} /> },
      { id: 'twin',      label: 'Digital Twin',       icon: <GitBranch size={15} /> },
    ],
  },
  {
    section: 'COMMAND',
    items: [
      { id: 'pre-gp',    label: 'Pre Grand Prix',     icon: <CalendarDays size={15} /> },
      { id: 'crew',      label: 'Crew Chief',         icon: <Radio size={15} /> },
      { id: 'copilot',   label: 'AI Copilot',         icon: <Bot size={15} />,            badge: 'AI', badgeColor: 'blue' },
    ],
  },
  {
    section: 'SYSTEM',
    items: [
      { id: 'settings',  label: 'Settings',           icon: <Settings size={15} /> },
    ],
  },
];

// ─── Helper: live clock ───────────────────────────────────────────────────────

function useClock() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ active, onNav }: { active: TabId; onNav: (id: TabId) => void }) {
  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <Zap size={16} />
        </div>
        <div>
          <div className="sidebar-brand-name">KDD RACE</div>
          <div className="sidebar-brand-sub">Engineering Platform</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {NAV_SECTIONS.map(({ section, items }) => (
          <div key={section} className="sidebar-section">
            <div className="sidebar-section-title">{section}</div>
            {items.map(item => (
              <button
                key={item.id}
                className={`sidebar-item${active === item.id ? ' sidebar-item-active' : ''}`}
                onClick={() => onNav(item.id)}
              >
                <span className="sidebar-item-icon">{item.icon}</span>
                <span className="sidebar-item-label">{item.label}</span>
                {item.badge && (
                  <span className={`sidebar-badge sidebar-badge-${item.badgeColor ?? 'muted'}`}>
                    {item.badge}
                  </span>
                )}
                {active === item.id && <ChevronRight size={12} className="sidebar-item-arrow" />}
              </button>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-footer-line">v3.0.0 · Race Edition</div>
        <div className="sidebar-footer-line" style={{ color: 'var(--green)', fontWeight: 700 }}>
          InsForge · Online
        </div>
      </div>
    </aside>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

function Header({ tab }: { tab: TabId }) {
  const t = useLiveTelemetry();
  const clock = useClock();

  return (
    <header className="app-header">
      {/* Left: GP info */}
      <div className="header-gp">
        <span className="badge badge-red" style={{ fontSize: 10, letterSpacing: '0.1em' }}>RACE</span>
        <span className="header-gp-name">GP Mugello · Italy</span>
        <span className="header-gp-round" style={{ color: 'var(--text-muted)', fontSize: 12 }}>
          Round 7 / 20 · 2026
        </span>
      </div>

      {/* Centre: live stats */}
      <div className="header-stats">
        <div className="header-stat">
          <span className="header-stat-label">LAP</span>
          <span className="header-stat-val">{t.lapCount}<span style={{ fontSize: 12, color: 'var(--text-muted)' }}>/23</span></span>
        </div>
        <div className="header-stat-sep" />
        <div className="header-stat">
          <span className="header-stat-label">POS</span>
          <span className="header-stat-val" style={{ color: 'var(--accent)' }}>P{t.position}</span>
        </div>
        <div className="header-stat-sep" />
        <div className="header-stat">
          <span className="header-stat-label">GAP</span>
          <span className="header-stat-val" style={{ color: 'var(--yellow)' }}>{t.gap}</span>
        </div>
        <div className="header-stat-sep" />
        <div className="header-stat">
          <span className="header-stat-label">SPD</span>
          <span className="header-stat-val">{t.speed}<span style={{ fontSize: 11, color: 'var(--text-muted)' }}>km/h</span></span>
        </div>
        <div className="header-stat-sep" />
        <div className="header-stat">
          <span className="header-stat-label">FUEL</span>
          <span className="header-stat-val" style={{ color: t.fuelLoad < 5 ? 'var(--accent)' : 'var(--text)' }}>
            {t.fuelLoad.toFixed(1)}<span style={{ fontSize: 11, color: 'var(--text-muted)' }}>kg</span>
          </span>
        </div>
      </div>

      {/* Right: clock + flag */}
      <div className="header-right">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: 'var(--green)',
            boxShadow: '0 0 6px var(--green)',
            animation: 'pulse 2s infinite',
          }} />
          <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 700, letterSpacing: '0.08em' }}>GREEN FLAG</span>
        </div>
        <span className="header-clock">{clock}</span>
      </div>
    </header>
  );
}

// ─── Page router ─────────────────────────────────────────────────────────────

function PageContent({ tab }: { tab: TabId }) {
  switch (tab) {
    case 'overview':  return <OverviewPage />;
    case 'telemetry': return <LiveTelemetryPage />;
    case 'circuit':   return <CircuitIntelligencePage />;
    case 'tires':     return <TireDegradationPage />;
    case 'setup':     return <SetupManagementPage />;
    case 'parts':     return <PartDesignPage />;
    case 'pre-gp':    return <PreGrandPrixPage />;
    case 'crew':      return <CrewChiefPage />;
    case 'copilot':   return <AICopilotPage />;
    case 'twin':      return <DigitalTwinReportPage />;
    case 'settings':  return <SettingsPage />;
    default:          return <OverviewPage />;
  }
}

// ─── App shell ────────────────────────────────────────────────────────────────

export function App() {
  const [tab, setTab] = useState<TabId>('overview');

  // Copilot page is full-bleed (no padding) — detect it
  const isFullBleed = tab === 'copilot';

  return (
    <div className="app-shell">
      <Sidebar active={tab} onNav={setTab} />
      <div className="app-body">
        <Header tab={tab} />
        <main className={`app-main${isFullBleed ? ' app-main-fullbleed' : ''}`}>
          <PageContent tab={tab} />
        </main>
      </div>
    </div>
  );
}
