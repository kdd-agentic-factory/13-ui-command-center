import '../i18n'; // must be first — initialises i18next before any component renders
import { useState, useEffect, useRef, useCallback, type CSSProperties, type ElementType } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, Activity, Map, Circle, Sliders, Wrench,
  CalendarDays, Radio, Bot, GitBranch, Settings, Zap, ChevronRight, LogOut,
  Route, Film, Lightbulb, FileText, Users, Database, MonitorPlay, GitCompare, ShieldAlert, History,
  Sparkles, Fingerprint, Loader2, MessagesSquare, FlaskConical, CircleDot, Network, Ghost, GraduationCap, TestTubes, Video,
  LayoutGrid, TrendingUp, Mic, ShieldCheck, Boxes, Server, Layers, Mountain, Crosshair, HeartPulse, Globe2, FlaskRound, GitMerge, Plug,
} from 'lucide-react';

import { AuthProvider, useProfile, PROFILES, TabId, ProfileId } from '../context/AuthContext';
import { NavContext, COPILOT_SEED_KEY } from '../context/NavContext';
import { IntroExperience } from '../components/intro/IntroExperience';
import { LoginModal } from '../components/auth/LoginModal';
import { useServiceData } from '../hooks/useServiceData';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { ToastProvider } from '../components/ToastProvider';
import { useLiveTelemetry } from '../hooks/useLiveTelemetry';
import { MUGELLO_CIRCUIT, RACE_SESSION, sessionDisplayState } from '../domain/sessionTruth';
import { CircuitGatePage } from '../pages/CircuitGatePage';
import { MissionControlPage } from '../pages/MissionControlPage';
import { DataSourceGatePage } from '../pages/DataSourceGatePage';
import { LaunchBriefPage } from '../pages/LaunchBriefPage';
import { GarageProfileGatePage } from '../pages/GarageProfileGatePage';
import { setGarageProfile, getGarageProfile, buildGarageProfile, RIDERS, BIKES } from '../domain/garageProfile';
import { BootSequence } from '../components/BootSequence';
import { CircuitRecord, setActiveCircuit, dashboardMode, MODE_META, getCircuitLibrary } from '../domain/circuits';
import { SessionModeGatePage } from '../pages/SessionModeGatePage';
import { SessionContextStrip } from '../components/SessionContextStrip';
import { GlobalContextBar } from '../components/GlobalContextBar';
import { DecisionCenter } from '../components/DecisionCenter';
import { CommandPalette } from '../components/CommandPalette';
import { getActiveDemoSession } from '../domain/demoSessions';
import {
  SessionContext, setSessionContext, clearSessionContext, getSessionContext,
  hiddenTabsForMode, defaultTabForMode, persistSessionContext,
  buildSessionContext, DEMO_PACKAGES,
} from '../domain/sessionContext';

import { OverviewPage }            from '../pages/OverviewPage';
import { LiveTelemetryPage }       from '../pages/LiveTelemetryPage';
import { CircuitIntelligencePage } from '../pages/CircuitIntelligencePage';
import { CornerIntelligencePage }  from '../pages/CornerIntelligencePage';
import { LapReplayPage }           from '../pages/LapReplayPage';
import { TireDegradationPage }     from '../pages/TireDegradationPage';
import { SetupManagementPage }     from '../pages/SetupManagementPage';
import { GarageSetupAdvisorPage }  from '../pages/GarageSetupAdvisorPage';
import { PartDesignPage }          from '../pages/PartDesignPage';
import { BikeComparisonPage }     from '../pages/BikeComparisonPage';
import { SetupLabPage }           from '../pages/SetupLabPage';
import { PreGrandPrixPage }        from '../pages/PreGrandPrixPage';
import { CrewChiefPage }           from '../pages/CrewChiefPage';
import { AICopilotPage }           from '../pages/AICopilotPage';
import { DigitalTwinReportPage }   from '../pages/DigitalTwinReportPage';
import { ScenarioSandboxPage }    from '../pages/ScenarioSandboxPage';
import { SessionReportPage }       from '../pages/SessionReportPage';
import { DebriefRoomPage }        from '../pages/DebriefRoomPage';
import { BlackBoxPage }           from '../pages/BlackBoxPage';
import { KnowledgeGraphPage }     from '../pages/KnowledgeGraphPage';
import { GhostLapPage }           from '../pages/GhostLapPage';
import { RiderLearningPathPage }  from '../pages/RiderLearningPathPage';
import { ExperimentEnginePage }   from '../pages/ExperimentEnginePage';
import { VideoStudioPage }        from '../pages/VideoStudioPage';
import { TrackEvolutionPage }     from '../pages/TrackEvolutionPage';
import { PitRadioPage }           from '../pages/PitRadioPage';
import { TeamWorkspacePage }      from '../pages/TeamWorkspacePage';
import { CockpitPage }            from '../pages/CockpitPage';
import { DataTrustPage }          from '../pages/DataTrustPage';
import { DataCubePage }           from '../pages/DataCubePage';
import { PlatformConsolePage }    from '../pages/PlatformConsolePage';
import { PatternMinerPage }       from '../pages/PatternMinerPage';
import { EventEnginePage }        from '../pages/EventEnginePage';
import { TrackSurfacePage }       from '../pages/TrackSurfacePage';
import { VisualWorkbenchPage }    from '../pages/VisualWorkbenchPage';
import { OrchestratorPage }       from '../pages/OrchestratorPage';
import { HumanPerformancePage }   from '../pages/HumanPerformancePage';
import { FederatedPage }          from '../pages/FederatedPage';
import { SimLabPage }             from '../pages/SimLabPage';
import { EdgeHubPage }            from '../pages/EdgeHubPage';
import { LakehousePage }          from '../pages/LakehousePage';
import { CausalEnginePage }       from '../pages/CausalEnginePage';
import { DevHubPage }             from '../pages/DevHubPage';
import { AICrewPage }               from '../pages/AICrewPage';
import { ConnectDataPage }          from '../pages/ConnectDataPage';
import { TrackLivePage }            from '../pages/TrackLivePage';
import { RiderComparisonPage }      from '../pages/RiderComparisonPage';
import { CrashRiskPage }            from '../pages/CrashRiskPage';
import { CircuitHistoryPage }       from '../pages/CircuitHistoryPage';
import { PredictiveModelPage }      from '../pages/PredictiveModelPage';
import { RidingStylePage }          from '../pages/RidingStylePage';
import { SettingsPage }            from '../pages/SettingsPage';

// ─── Nav definition ───────────────────────────────────────────────────────────

interface NavItemDef {
  id: TabId;
  labelKey: string;
  icon: ElementType;
  badge?: string;
  badgeColor?: string;
}

interface NavSectionDef {
  section: string;
  items: NavItemDef[];
}

const ALL_NAV_SECTIONS: NavSectionDef[] = [
  // Ordered to follow the pit-wall workflow: prepare → race → analyse → decide
  { section: 'nav.sections.race', items: [
    { id: 'cockpit',   labelKey: 'nav.cockpit',   icon: LayoutGrid, badge: 'AI', badgeColor: 'blue' },
    { id: 'pre-gp',    labelKey: 'nav.preGp',     icon: CalendarDays },
    { id: 'overview',  labelKey: 'nav.overview',  icon: LayoutDashboard },
    { id: 'live',      labelKey: 'nav.live',      icon: MonitorPlay,      badge: 'LIVE', badgeColor: 'red' },
    { id: 'telemetry', labelKey: 'nav.telemetry', icon: Activity,         badge: '10Hz', badgeColor: 'green' },
    { id: 'circuit',   labelKey: 'nav.circuit',   icon: Map },
    { id: 'corners',   labelKey: 'nav.corners',   icon: Route, badge: 'AI', badgeColor: 'blue' },
    { id: 'replay',    labelKey: 'nav.replay',    icon: Film },
    { id: 'studio',    labelKey: 'nav.studio',    icon: Video, badge: 'AI', badgeColor: 'blue' },
    { id: 'compare',   labelKey: 'nav.compare',   icon: GitCompare },
    { id: 'ghost-lap', labelKey: 'nav.ghostLap',  icon: Ghost, badge: 'AI', badgeColor: 'blue' },
    { id: 'tires',     labelKey: 'nav.tires',     icon: Circle },
    { id: 'track-evo', labelKey: 'nav.trackEvo',  icon: TrendingUp },
    { id: 'surface',   labelKey: 'nav.surface',   icon: Mountain, badge: 'AI', badgeColor: 'blue' },
    { id: 'risk',      labelKey: 'nav.risk',      icon: ShieldAlert },
    { id: 'predict',   labelKey: 'nav.predict',   icon: Sparkles, badge: 'AI', badgeColor: 'blue' },
  ]},
  { section: 'nav.sections.engineering', items: [
    { id: 'setup',   labelKey: 'nav.setup',   icon: Sliders },
    { id: 'advisor', labelKey: 'nav.advisor', icon: Lightbulb, badge: 'AI', badgeColor: 'blue' },
    { id: 'setup-lab', labelKey: 'nav.setupLab', icon: GitBranch },
    { id: 'parts',   labelKey: 'nav.parts',   icon: Wrench },
    { id: 'bike-compare', labelKey: 'nav.bikeCompare', icon: GitCompare },
    { id: 'twin',    labelKey: 'nav.twin',    icon: GitBranch },
    { id: 'sandbox', labelKey: 'nav.sandbox', icon: FlaskConical, badge: 'AI', badgeColor: 'blue' },
    { id: 'sim-lab', labelKey: 'nav.simLab',  icon: FlaskRound, badge: 'AI', badgeColor: 'blue' },
    { id: 'experiments', labelKey: 'nav.experiments', icon: TestTubes, badge: 'AI', badgeColor: 'blue' },
    { id: 'events',  labelKey: 'nav.events',  icon: Zap, badge: 'AI', badgeColor: 'blue' },
    { id: 'causal',  labelKey: 'nav.causal',  icon: GitMerge, badge: 'AI', badgeColor: 'blue' },
    { id: 'history', labelKey: 'nav.history', icon: History },
    { id: 'knowledge', labelKey: 'nav.knowledge', icon: Network },
    { id: 'patterns', labelKey: 'nav.patterns', icon: Layers, badge: 'AI', badgeColor: 'blue' },
    { id: 'federated', labelKey: 'nav.federated', icon: Globe2, badge: 'AI', badgeColor: 'blue' },
    { id: 'cube',    labelKey: 'nav.cube',    icon: Boxes, badge: 'AI', badgeColor: 'blue' },
  ]},
  { section: 'nav.sections.command', items: [
    { id: 'orchestrator', labelKey: 'nav.orchestrator', icon: Crosshair, badge: 'AI', badgeColor: 'blue' },
    { id: 'crew',    labelKey: 'nav.crew',     icon: Radio },
    { id: 'pit-radio', labelKey: 'nav.pitRadio', icon: Mic },
    { id: 'team',    labelKey: 'nav.team',     icon: Users },
    { id: 'workbench', labelKey: 'nav.workbench', icon: LayoutDashboard, badge: 'AI', badgeColor: 'blue' },
    { id: 'copilot', labelKey: 'nav.copilot',  icon: Bot, badge: 'AI', badgeColor: 'blue' },
    { id: 'learning-path', labelKey: 'nav.learningPath', icon: GraduationCap },
    { id: 'human',   labelKey: 'nav.human',    icon: HeartPulse, badge: 'AI', badgeColor: 'blue' },
    { id: 'ai-crew', labelKey: 'nav.aiCrew',   icon: Users, badge: 'AI', badgeColor: 'blue' },
    { id: 'report',  labelKey: 'nav.report',   icon: FileText, badge: 'PDF', badgeColor: 'muted' },
    { id: 'debrief', labelKey: 'nav.debrief',  icon: MessagesSquare, badge: 'AI', badgeColor: 'blue' },
    { id: 'black-box', labelKey: 'nav.blackBox', icon: CircleDot },
    { id: 'style',   labelKey: 'nav.style',    icon: Fingerprint },
  ]},
  { section: 'nav.sections.system', items: [
    { id: 'edge',     labelKey: 'nav.edge',     icon: Radio, badge: 'AI', badgeColor: 'blue' },
    { id: 'lakehouse', labelKey: 'nav.lakehouse', icon: Database, badge: 'AI', badgeColor: 'blue' },
    { id: 'devhub',   labelKey: 'nav.devhub',   icon: Plug, badge: 'AI', badgeColor: 'blue' },
    { id: 'platform', labelKey: 'nav.platform', icon: Server, badge: 'LIVE', badgeColor: 'green' },
    { id: 'trust',    labelKey: 'nav.trust',    icon: ShieldCheck },
    { id: 'data',     labelKey: 'nav.data',     icon: Database },
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
    case 'live':      return <TrackLivePage />;
    case 'telemetry': return <LiveTelemetryPage />;
    case 'circuit':   return <CircuitIntelligencePage />;
    case 'corners':   return <CornerIntelligencePage />;
    case 'replay':    return <LapReplayPage />;
    case 'studio':    return <VideoStudioPage />;
    case 'track-evo': return <TrackEvolutionPage />;
    case 'surface':   return <TrackSurfacePage />;
    case 'compare':   return <RiderComparisonPage />;
    case 'ghost-lap': return <GhostLapPage />;
    case 'risk':      return <CrashRiskPage />;
    case 'predict':   return <PredictiveModelPage />;
    case 'tires':     return <TireDegradationPage />;
    case 'setup':     return <SetupManagementPage />;
    case 'advisor':   return <GarageSetupAdvisorPage />;
    case 'setup-lab': return <SetupLabPage />;
    case 'parts':     return <PartDesignPage />;
    case 'bike-compare': return <BikeComparisonPage />;
    case 'pre-gp':    return <PreGrandPrixPage />;
    case 'crew':      return <CrewChiefPage />;
    case 'pit-radio': return <PitRadioPage />;
    case 'team':      return <TeamWorkspacePage />;
    case 'workbench': return <VisualWorkbenchPage />;
    case 'orchestrator': return <OrchestratorPage />;
    case 'cockpit':   return <CockpitPage />;
    case 'trust':     return <DataTrustPage />;
    case 'cube':      return <DataCubePage />;
    case 'platform':  return <PlatformConsolePage />;
    case 'edge':      return <EdgeHubPage />;
    case 'lakehouse': return <LakehousePage />;
    case 'devhub':    return <DevHubPage />;
    case 'patterns':  return <PatternMinerPage />;
    case 'federated': return <FederatedPage />;
    case 'events':    return <EventEnginePage />;
    case 'causal':    return <CausalEnginePage />;
    case 'copilot':   return <AICopilotPage />;
    case 'learning-path': return <RiderLearningPathPage />;
    case 'human':     return <HumanPerformancePage />;
    case 'report':    return <SessionReportPage />;
    case 'debrief':   return <DebriefRoomPage />;
    case 'black-box': return <BlackBoxPage />;
    case 'knowledge': return <KnowledgeGraphPage />;
    case 'ai-crew':   return <AICrewPage />;
    case 'style':     return <RidingStylePage />;
    case 'data':      return <ConnectDataPage />;
    case 'twin':      return <DigitalTwinReportPage />;
    case 'sandbox':   return <ScenarioSandboxPage />;
    case 'sim-lab':   return <SimLabPage />;
    case 'experiments': return <ExperimentEnginePage />;
    case 'history':   return <CircuitHistoryPage />;
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
  const sessionState = sessionDisplayState(telem.lapCount);
  const clock = useClock();
  const live = useServiceData(); // real platform health via the Fly BFF

  // Filter nav sections to only show allowed tabs (profile role) minus the
  // modules the active session mode hides (race vs track day vs pre-GP …).
  const modeHidden = hiddenTabsForMode(getSessionContext().sessionMode);
  const filteredSections = profile ? ALL_NAV_SECTIONS
    .map(sec => ({
      ...sec,
      items: sec.items.filter(item => profile.allowedTabs.includes(item.id) && !modeHidden.includes(item.id)),
    }))
    .filter(sec => sec.items.length > 0) : [];

  // Flat list of tabs this profile can access (for keyboard nav)
  const allowedTabIds = filteredSections.flatMap(s => s.items.map(i => i.id));

  // If current tab not in allowed set, fall back to mode default → profile default → first visible
  const activeTab: TabId = profile && allowedTabIds.includes(tab)
    ? tab
    : (() => {
        const sessionMode = getSessionContext().sessionMode;
        // Demo packages open on their own focus tab (telemetry/tyres/advisor…).
        const md = (sessionMode === 'demo' ? getActiveDemoSession()?.focusTab : null)
          ?? defaultTabForMode(sessionMode);
        if (md && allowedTabIds.includes(md)) return md;
        if (profile && allowedTabIds.includes(profile.defaultTab)) return profile.defaultTab;
        return allowedTabIds[0] ?? 'overview';
      })();

  const isFullBleed = activeTab === 'copilot';

  // ── Tab navigation with animation ─────────────────────────────────────────
  const navigateTo = useCallback((newTab: TabId) => {
    if (newTab === activeTab) return;
    setTransitioning(true);
    setTimeout(() => {
      prevTabRef.current = newTab;
      setTab(newTab);
      setTransitioning(false);
    }, 100); // matches CSS --dur-fast (120ms)
  }, [activeTab]);

  // Cross-page navigation that can seed a question for the Copilot (AI Crew "Ask").
  function navigate(newTab: TabId, seed?: string) {
    if (seed) sessionStorage.setItem(COPILOT_SEED_KEY, seed);
    navigateTo(newTab);
  }

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      // Don't intercept when typing in an input / textarea
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const tabOrderAll = ALL_TAB_IDS.filter(id => allowedTabIds.includes(id));
      if (tabOrderAll.length === 0) return;
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

  if (!profile) return null;

  return (
    <div className="app-shell">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon"><Zap size={16} /></div>
          <div>
            <div className="sidebar-brand-name">KDD MOTO</div>
            <div className="sidebar-brand-sub">Intelligence</div>
          </div>
        </div>

        {/* Profile chip */}
        <div className="sidebar-profile-chip" style={{ '--chip-color': profile.color } as CSSProperties}>
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
          <div className="sidebar-footer-line" style={{ fontWeight: 700, color: live.loading ? 'var(--text-muted)' : (live.servicesUp > 0 ? 'var(--green)' : 'var(--accent)') }}>
            {live.loading
              ? 'Platform · checking…'
              : `Platform · ${live.servicesUp}/${live.servicesTotal} services online`}
          </div>
        </div>
      </aside>

      <div className="app-body">
        {/* HEADER */}
        <header className="app-header">
          <div className="header-gp">
            <span className={`badge ${sessionState.badgeClass}`} style={{ fontSize: 10, letterSpacing: '0.1em' }}>{sessionState.badgeLabel}</span>
            <span className="header-gp-name">{RACE_SESSION.productName}</span>
            <span className="header-gp-round" style={{ color: 'var(--text-muted)', fontSize: 12 }}>{RACE_SESSION.positioning}</span>
          </div>
          <div className="header-stats">
            <div className="header-stat">
              <span className="header-stat-label">{sessionState.lapLabel}</span>
              <span className="header-stat-val">{sessionState.lapValue}</span>
            </div>
            <div className="header-stat-sep" />
            <div className="header-stat">
              <span className="header-stat-label">CIRCUIT</span>
              <span className="header-stat-val" style={{ fontSize: 14 }}>{MUGELLO_CIRCUIT.shortName}</span>
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
                background: sessionState.activeRace ? 'var(--green)' : 'var(--yellow)',
                boxShadow: `0 0 6px ${sessionState.activeRace ? 'var(--green)' : 'var(--yellow)'}`,
                animation: 'pulse 2s infinite',
              }} />
              <span style={{ fontSize: 11, color: sessionState.activeRace ? 'var(--green)' : 'var(--yellow)', fontWeight: 700, letterSpacing: '0.08em' }}>
                {sessionState.flagLabel}
              </span>
            </div>
            <DecisionCenter lap={telem.lapCount} />
            <GlobalContextBar telem={telem} />
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
            <NavContext.Provider value={navigate}>
              <CommandPalette
                items={filteredSections.flatMap(sec => sec.items.map(item => ({ id: item.id, label: t(item.labelKey), section: t(sec.section) })))}
                onNavigate={navigateTo}
              />
              <SessionContextStrip />
              <PageContent tab={activeTab} />
            </NavContext.Provider>
          </div>
        </main>
      </div>
    </div>
  );
}

// ─── Auth gate ────────────────────────────────────────────────────────────────

function AppWithAuth() {
  const { profile, login, user, authLoading } = useProfile();
  const [pendingProfile, setPendingProfile] = useState<ProfileId | null>(null);
  // Entry workflow (pit-wall boot sequence): Mission Control → Circuit →
  // Mode → Data → Launch Brief → Dashboard. Each stage feeds the global
  // context object; quick actions on Mission Control can pre-fill and jump.
  type Stage = 'mission' | 'circuit' | 'garage' | 'mode' | 'data' | 'launch' | 'booting' | 'dashboard';
  const [stage, setStage] = useState<Stage>('mission');
  const [createOnOpen, setCreateOnOpen] = useState(false);
  const [gateCircuit, setGateCircuit] = useState<CircuitRecord | null>(null);
  const [sessionCtx, setSessionCtx] = useState<SessionContext | null>(null);

  function presetLatestSession() {
    const mugello = getCircuitLibrary().find(c => c.id === 'mugello')!;
    setActiveCircuit(mugello); setGateCircuit(mugello);
    const ctx = buildSessionContext('mugello', 'Mugello', 'replay', {
      session: 'Mugello · Stint 03 · 14:32 · Yamaha R1',
      channels: 'GPS · IMU · ECU · Video · CSV', analysis: 'Full session',
      rider: 'Rubén Juárez', bike: 'Yamaha R1', dataSource: 'upload',
    });
    setGarageProfile(buildGarageProfile(RIDERS[0], BIKES[0], 'mugello'));
    setSessionContext(ctx); setSessionCtx(ctx); setStage('launch');
  }

  function presetGuidedDemo() {
    const mugello = getCircuitLibrary().find(c => c.id === 'mugello')!;
    setActiveCircuit(mugello); setGateCircuit(mugello);
    const pkg = DEMO_PACKAGES.find(p => p.id === 'trackday')!;
    const ctx = buildSessionContext('mugello', 'Mugello', 'demo', {
      demoId: pkg.id, demoPackage: pkg.title, dataType: pkg.dataType, dataSource: 'demo',
    });
    setGarageProfile(buildGarageProfile(RIDERS[0], BIKES[0], 'mugello'));
    setSessionContext(ctx); setSessionCtx(ctx); setStage('launch');
  }

  // Picking a profile: public ones (spectator) enter immediately; team profiles
  // require a real InsForge session first.
  function handleEnter(id: ProfileId) {
    const def = PROFILES.find(p => p.id === id);
    if (def && def.requiresAuth && !user) {
      setPendingProfile(id);
      return;
    }
    login(id);
  }

  // While the InsForge session rehydrates, don't flash protected content.
  if (authLoading && profile?.requiresAuth && !user) {
    return (
      <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg, #0c0e14)', color: 'var(--text-muted, #8b8fa3)', fontSize: 13 }}>
        <Loader2 size={18} className="spin" style={{ marginRight: 8 }} /> Loading session…
      </div>
    );
  }

  if (!profile) {
    const pendingLabel = pendingProfile
      ? PROFILES.find(p => p.id === pendingProfile)?.id
      : undefined;
    return (
      <>
        <IntroExperience onEnter={handleEnter} />
        {pendingProfile && !user && (
          <LoginModal
            profileLabel={pendingLabel}
            onClose={() => setPendingProfile(null)}
            onSuccess={() => {
              const id = pendingProfile;
              setPendingProfile(null);
              if (id) login(id);
            }}
          />
        )}
      </>
    );
  }
  // Guard: a team profile in localStorage must still have a live session.
  if (profile.requiresAuth && !user && !authLoading) {
    return <IntroExperience onEnter={handleEnter} />;
  }
  // ── Entry workflow stages ──────────────────────────────────────────────
  if (stage === 'mission') {
    return (
      <MissionControlPage
        onSelectCircuit={() => { setCreateOnOpen(false); setStage('circuit'); }}
        onCreateCircuit={() => { setCreateOnOpen(true); setStage('circuit'); }}
        onLoadLatest={presetLatestSession}
        onDemo={presetGuidedDemo}
      />
    );
  }
  if (stage === 'circuit' || !gateCircuit) {
    return (
      <CircuitGatePage
        startCreating={createOnOpen}
        onBack={() => setStage('mission')}
        onOpenDashboard={(c) => { setActiveCircuit(c); setGateCircuit(c); setStage('garage'); }}
      />
    );
  }
  if (stage === 'garage') {
    return (
      <GarageProfileGatePage
        circuit={gateCircuit}
        onBack={() => setStage('circuit')}
        onContinue={() => setStage('mode')}
      />
    );
  }
  if (stage === 'mode' || !sessionCtx) {
    return (
      <SessionModeGatePage
        circuit={gateCircuit}
        onBack={() => { clearSessionContext(); setSessionCtx(null); setStage('garage'); }}
        onOpen={(ctx) => {
          const gp = getGarageProfile();
          const merged = gp
            ? { ...ctx, setup: { rider: gp.rider.name, bike: `${gp.bike.brand} ${gp.bike.model}`, ...ctx.setup } }
            : ctx;
          setSessionContext(merged); setSessionCtx(merged); setStage('data');
        }}
      />
    );
  }
  if (stage === 'data') {
    return (
      <DataSourceGatePage
        ctx={sessionCtx}
        onBack={() => setStage('mode')}
        onContinue={(dataSource) => {
          const updated = { ...sessionCtx, setup: { ...sessionCtx.setup, dataSource } };
          setSessionContext(updated); setSessionCtx(updated); setStage('launch');
        }}
      />
    );
  }
  if (stage === 'booting') {
    return <BootSequence ctx={sessionCtx} onDone={() => setStage('dashboard')} />;
  }
  if (stage === 'launch') {
    return (
      <LaunchBriefPage
        circuit={gateCircuit}
        ctx={sessionCtx}
        onBack={() => setStage('data')}
        onLaunch={() => { void persistSessionContext(sessionCtx); setStage('booting'); }}
      />
    );
  }
  // The GlobalContextBar in the topbar now carries the session badge,
  // circuit, mode and integrity state (Data Integrity Center dropdown).
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
