import '../i18n'; // must be first — initialises i18next before any component renders
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, Activity, Map, Circle, Sliders, Wrench,
  CalendarDays, Radio, Bot, GitBranch, Settings, Zap, ChevronRight, LogOut,
  Route, Film, Lightbulb,
} from 'lucide-react';

import { AuthProvider, useProfile, TabId } from '../context/AuthContext';
import { IntroExperience } from '../components/intro/IntroExperience';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { ToastProvider } from '../components/ToastProvider';
import { useLiveTelemetry } from '../hooks/useLiveTelemetry';

import { OverviewPage }            from '../pages/OverviewPage';
import { LiveTelemetryPage }       from '../pages/LiveTelemetryPage';
import { CircuitIntelligencePage } from '../pages/CircuitIntelligencePage';
import { CornerIntelligencePage }  from '../pages/CornerIntelligencePage';
import { LapReplayPage }           from '../pages/LapReplayPage';
import { TireDegradationPage }     from '../pages/TireDegradationPage';
import { SetupManagementPage }     from '../pages/SetupManagementPage';
import { GarageSetupAdvisorPage }  from '../pages/GarageSetupAdvisorPage';
import { PartDesignPage }          from '../pages/PartDesignPage';
import { PreGrandPrixPage }        from '../pages/PreGrandPrixPage';
import { CrewChiefPage }           from '../pages/CrewChiefPage';
import { AICopilotPage }           from '../pages/AICopilotPage';
import { DigitalTwinReportPage }   from '../pages/DigitalTwinReportPage';
import { SettingsPage }            from '../pages/SettingsPage';

// ─── Nav definition ───────────────────────────────────────────────────────────

interface NavItemDef {
  id: TabId;
  labelKey: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
}

interface NavSectionDef {
  section: string;
  items: NavItemDef[];
}

const ALL_NAV_SECTIONS: NavSectionDef[] = [
  { section: 'nav.sections.race', items: [
    { id: 'overview',  labelKey: 'nav.overview',  icon: LayoutDashboard, badge: 'LIVE', badgeColor: 'red' },
    { id: 'telemetry', labelKey: 'nav.telemetry', icon: Activity,         badge: '10Hz', badgeColor: 'green' },
    { id: 'circuit',   labelKey: 'nav.circuit',   icon: Map },
    { id: 'corners',   labelKey: 'nav.corners',   icon: Route, badge: 'AI', badgeColor: 'blue' },
    { id: 'replay',    labelKey: 'nav.replay',    icon: Film },
    { id: 'tires',     labelKey: 'nav.tires',     icon: Circle },
  ]},
  { section: 'nav.sections.engineering', items: [
    { id: 'setup',   labelKey: 'nav.setup',   icon: Sliders },
    { id: 'advisor', labelKey: 'nav.advisor', icon: Lightbulb, badge: 'AI', badgeColor: 'blue' },
    { id: 'parts',   labelKey: 'nav.parts',   icon: Wrench },
    { id: 'twin',    labelKey: 'nav.twin',    icon: GitBranch },
  ]},
  { section: 'nav.sections.command', items: [
    { id: 'pre-gp',  labelKey: 'nav.preGp',   icon: CalendarDays },
    { id: 'crew',    labelKey: 'nav.crew',     icon: Radio },
    { id: 'copilot', labelKey: 'nav.copilot',  icon: Bot, badge: 'AI', badgeColor: 'blue' },
  ]},
  { section: 'nav.sections.system', items: [
    { id: 'settings', labelKey: 'nav.settings', icon: Settings },
  ]},
];

// Flat ordered list of all tab IDs (for keyboard navigation)
const ALL_TAB_IDS: TabId[] = ALL_NAV_SECTIONS.flatMap(s => s.items.map(i => i.id));

// ─── Clock hook ───────────────────────────────────────────────────────────────

function useClock(): string {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// ─── Page router ─────────────────────────────────────────────────────────────

function PageContent({ tab }: { tab: TabId }) {
  switch (tab) {
    case 'overview':  return <OverviewPage />;
    case 'telemetry': return <LiveTelemetryPage />;
    case 'circuit':   return <CircuitIntelligencePage />;
    case 'corners':   return <CornerIntelligencePage />;
    case 'replay':    return <LapReplayPage />;
    case 'tires':     return <TireDegradationPage />;
    case 'setup':     return <SetupManagementPage />;
    case 'advisor':   return <GarageSetupAdvisorPage />;
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

function AppShell() {
  const { profile, logout } = useProfile();
  const { t } = useTranslation();
  const [tab, setTab] = useState<TabId>(profile?.defaultTab ?? 'overview');
  const [transitioning, setTransitioning] = useState(false);
  const prevTabRef = useRef<TabId>(tab);
  const telem = useLiveTelemetry();
  const clock = useClock();

  if (!profile) return null;

  // Filter nav sections to only show allowed tabs
  const filteredSections = ALL_NAV_SECTIONS
    .map(sec => ({
      ...sec,
      items: sec.items.filter(item => profile.allowedTabs.includes(item.id)),
    }))
    .filter(sec => sec.items.length > 0);

  // Flat list of tabs this profile can access (for keyboard nav)
  const allowedTabIds = filteredSections.flatMap(s => s.items.map(i => i.id));

  // If current tab not in allowed set, fall back to profile default
  const activeTab: TabId = profile.allowedTabs.includes(tab) ? tab : profile.defaultTab;

  const isFullBleed = activeTab === 'copilot';

  // ── Tab navigation with animation ─────────────────────────────────────────
  function navigateTo(newTab: TabId) {
    if (newTab === activeTab) return;
    setTransitioning(true);
    setTimeout(() => {
      prevTabRef.current = newTab;
      setTab(newTab);
      setTransitioning(false);
    }, 100); // matches CSS --dur-fast (120ms)
  }

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      // Don't intercept when typing in an input / textarea
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const tabOrderAll = ALL_TAB_IDS.filter(id => allowedTabIds.includes(id));
      const idx = tabOrderAll.indexOf(activeTab);

      if (e.key === 'ArrowRight' || (e.altKey && e.key === ']')) {
        e.preventDefault();
        const next = tabOrderAll[(idx + 1) % tabOrderAll.length];
        navigateTo(next);
      } else if (e.key === 'ArrowLeft' || (e.altKey && e.key === '[')) {
        e.preventDefault();
        const prev = tabOrderAll[(idx - 1 + tabOrderAll.length) % tabOrderAll.length];
        navigateTo(prev);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeTab, allowedTabIds, navigateTo]);

  return (
    <div className="app-shell">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon"><Zap size={16} /></div>
          <div>
            <div className="sidebar-brand-name">KDD MOTO</div>
            <div className="sidebar-brand-sub">Moto Intelligence</div>
          </div>
        </div>

        {/* Profile chip */}
        <div className="sidebar-profile-chip" style={{ '--chip-color': profile.color } as React.CSSProperties}>
          <span>{profile.icon}</span>
          <span style={{ fontSize: 12, fontWeight: 600 }}>{t(profile.nameKey)}</span>
        </div>

        <nav className="sidebar-nav">
          {filteredSections.map(({ section, items }) => (
            <div key={section} className="sidebar-section">
              <div className="sidebar-section-title">{t(section)}</div>
              {items.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    className={`sidebar-item${activeTab === item.id ? ' sidebar-item-active' : ''}`}
                    onClick={() => navigateTo(item.id)}
                  >
                    <span className="sidebar-item-icon"><Icon size={15} /></span>
                    <span className="sidebar-item-label">{t(item.labelKey)}</span>
                    {item.badge && (
                      <span className={`sidebar-badge sidebar-badge-${item.badgeColor ?? 'muted'}`}>{item.badge}</span>
                    )}
                    {activeTab === item.id && <ChevronRight size={12} className="sidebar-item-arrow" />}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <LanguageSwitcher />
          <button className="btn btn-ghost btn-sm sidebar-logout" onClick={logout} title="Switch Profile">
            <LogOut size={12} /> {t('common.switchProfile', 'Switch Profile')}
          </button>
          <div className="sidebar-footer-line" style={{ color: 'var(--text-muted)', fontSize: 9, letterSpacing: '0.06em' }}>
            ← → arrows to navigate tabs
          </div>
          <div className="sidebar-footer-line" style={{ color: 'var(--green)', fontWeight: 700 }}>
            InsForge · Online
          </div>
        </div>
      </aside>

      <div className="app-body">
        {/* HEADER */}
        <header className="app-header">
          <div className="header-gp">
            <span className="badge badge-red" style={{ fontSize: 10, letterSpacing: '0.1em' }}>{t('header.race', 'RACE')}</span>
            <span className="header-gp-name">GP Mugello · Italy</span>
            <span className="header-gp-round" style={{ color: 'var(--text-muted)', fontSize: 12 }}>Round 7 / 20 · 2026</span>
          </div>
          <div className="header-stats">
            <div className="header-stat">
              <span className="header-stat-label">{t('common.lap', 'LAP').toUpperCase()}</span>
              <span className="header-stat-val">{telem.lapCount}<span style={{ fontSize: 12, color: 'var(--text-muted)' }}>/23</span></span>
            </div>
            <div className="header-stat-sep" />
            <div className="header-stat">
              <span className="header-stat-label">{t('common.position', 'POS').toUpperCase()}</span>
              <span className="header-stat-val" style={{ color: 'var(--accent)' }}>P{telem.position}</span>
            </div>
            <div className="header-stat-sep" />
            <div className="header-stat">
              <span className="header-stat-label">{t('common.gap', 'GAP').toUpperCase()}</span>
              <span className="header-stat-val" style={{ color: 'var(--yellow)' }}>{telem.gap}</span>
            </div>
            <div className="header-stat-sep" />
            <div className="header-stat">
              <span className="header-stat-label">{t('common.speed', 'SPD').toUpperCase()}</span>
              <span className="header-stat-val">{telem.speed}<span style={{ fontSize: 11, color: 'var(--text-muted)' }}>km/h</span></span>
            </div>
            <div className="header-stat-sep" />
            <div className="header-stat">
              <span className="header-stat-label">{t('common.fuel', 'FUEL').toUpperCase()}</span>
              <span
                className="header-stat-val"
                style={{ color: telem.fuelLoad < 5 ? 'var(--accent)' : 'var(--text)' }}
              >
                {telem.fuelLoad.toFixed(1)}<span style={{ fontSize: 11, color: 'var(--text-muted)' }}>kg</span>
              </span>
            </div>
          </div>
          <div className="header-right">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: 'var(--green)',
                boxShadow: '0 0 6px var(--green)',
                animation: 'pulse 2s infinite',
              }} />
              <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 700, letterSpacing: '0.08em' }}>
                {t('header.greenFlag', 'GREEN FLAG')}
              </span>
            </div>
            <span className="header-clock">{clock}</span>
          </div>
        </header>

        <main className={`app-main${isFullBleed ? ' app-main-fullbleed' : ''}`}>
          {/* Page transition wrapper — re-mounts on tab change */}
          <div
            key={activeTab}
            className={`page-transition${transitioning ? ' page-transition-out' : ' page-transition-in'}`}
            style={{ height: '100%' }}
          >
            <PageContent tab={activeTab} />
          </div>
        </main>
      </div>
    </div>
  );
}

// ─── Auth gate ────────────────────────────────────────────────────────────────

function AppWithAuth() {
  const { profile, login } = useProfile();
  if (!profile) return <IntroExperience onEnter={login} />;
  return <AppShell />;
}

// ─── Root export ──────────────────────────────────────────────────────────────

export function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppWithAuth />
      </ToastProvider>
    </AuthProvider>
  );
}
