import React, { Suspense, useState, useEffect, useRef, useCallback, type CSSProperties, type ElementType } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, Activity, Map, Circle, Sliders, Wrench,
  CalendarDays, Radio, Bot, GitBranch, Settings, Zap, ChevronRight, LogOut,
  Route, Film, Lightbulb, FileText, Users, Database, MonitorPlay, GitCompare, ShieldAlert, History,
  Sparkles, Fingerprint, MessagesSquare, FlaskConical, CircleDot, Network, Ghost, GraduationCap, TestTubes, Video,
  LayoutGrid, TrendingUp, Mic, ShieldCheck, Boxes, Server, Layers, Mountain, Crosshair, HeartPulse, Globe2, FlaskRound, GitMerge, Plug, Flag, Radar, Trophy, Timer, Disc, CircuitBoard, CloudRain, Wind, Fuel, Gauge, Bike, ClipboardList, Gavel, Cog, SlidersHorizontal,
} from 'lucide-react';

import { useProfile, type TabId } from '../context/AuthContext';
import { NavContext, COPILOT_SEED_KEY } from '../context/NavContext';
import { useServiceData } from '../hooks/useServiceData';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { CommandPalette } from '../components/CommandPalette';
import { SessionContextStrip } from '../components/SessionContextStrip';
import { GlobalContextBar } from '../components/GlobalContextBar';
import { DecisionCenter } from '../components/DecisionCenter';
import { useLiveTelemetry } from '../hooks/useLiveTelemetry';
import { MUGELLO_CIRCUIT, RACE_SESSION, sessionDisplayState } from '../domain/sessionTruth';
import { getActiveDemoSession } from '../domain/demoSessions';
import {
  DASHBOARD_TAB_SETUP_KEY,
  hiddenTabsForMode,
  defaultTabForMode,
  getSessionContext,
  resolveDashboardTab,
  setSessionContext,
  withDashboardTab,
  type SessionMode,
} from '../domain/sessionContext';

import { ErrorBoundary } from '../components/ErrorBoundary';

// Primary tabs — static imports (always visible)
import { OverviewPage } from '../pages/OverviewPage';
import { CockpitPage } from '../pages/CockpitPage';
import { LiveTelemetryPage } from '../pages/LiveTelemetryPage';
import { SettingsPage } from '../pages/SettingsPage';

// Secondary/tertiary tabs — lazy-loaded
const CircuitIntelligencePage = React.lazy(() => import('../pages/CircuitIntelligencePage'));
const CornerIntelligencePage = React.lazy(() => import('../pages/CornerIntelligencePage'));
const LapReplayPage = React.lazy(() => import('../pages/LapReplayPage'));
const TireDegradationPage = React.lazy(() => import('../pages/TireDegradationPage'));
const SetupManagementPage = React.lazy(() => import('../pages/SetupManagementPage'));
const GarageSetupAdvisorPage = React.lazy(() => import('../pages/GarageSetupAdvisorPage'));
const PartDesignPage = React.lazy(() => import('../pages/PartDesignPage'));
const BikeComparisonPage = React.lazy(() => import('../pages/BikeComparisonPage'));
const SetupLabPage = React.lazy(() => import('../pages/SetupLabPage'));
const PreGrandPrixPage = React.lazy(() => import('../pages/PreGrandPrixPage'));
const CrewChiefPage = React.lazy(() => import('../pages/CrewChiefPage'));
const AICopilotPage = React.lazy(() => import('../pages/AICopilotPage'));
const DigitalTwinReportPage = React.lazy(() => import('../pages/DigitalTwinReportPage'));
const ScenarioSandboxPage = React.lazy(() => import('../pages/ScenarioSandboxPage'));
const SessionReportPage = React.lazy(() => import('../pages/SessionReportPage'));
const DebriefRoomPage = React.lazy(() => import('../pages/DebriefRoomPage'));
const BlackBoxPage = React.lazy(() => import('../pages/BlackBoxPage'));
const KnowledgeGraphPage = React.lazy(() => import('../pages/KnowledgeGraphPage'));
const GhostLapPage = React.lazy(() => import('../pages/GhostLapPage'));
const RiderLearningPathPage = React.lazy(() => import('../pages/RiderLearningPathPage'));
const ExperimentEnginePage = React.lazy(() => import('../pages/ExperimentEnginePage'));
const VideoStudioPage = React.lazy(() => import('../pages/VideoStudioPage'));
const TrackEvolutionPage = React.lazy(() => import('../pages/TrackEvolutionPage'));
const PitRadioPage = React.lazy(() => import('../pages/PitRadioPage'));
const TeamWorkspacePage = React.lazy(() => import('../pages/TeamWorkspacePage'));
const DataTrustPage = React.lazy(() => import('../pages/DataTrustPage'));
const DataCubePage = React.lazy(() => import('../pages/DataCubePage'));
const PlatformConsolePage = React.lazy(() => import('../pages/PlatformConsolePage'));
const PatternMinerPage = React.lazy(() => import('../pages/PatternMinerPage'));
const EventEnginePage = React.lazy(() => import('../pages/EventEnginePage'));
const TrackSurfacePage = React.lazy(() => import('../pages/TrackSurfacePage'));
const VisualWorkbenchPage = React.lazy(() => import('../pages/VisualWorkbenchPage'));
const OrchestratorPage = React.lazy(() => import('../pages/OrchestratorPage'));
const HumanPerformancePage = React.lazy(() => import('../pages/HumanPerformancePage'));
const FederatedPage = React.lazy(() => import('../pages/FederatedPage'));
const SimLabPage = React.lazy(() => import('../pages/SimLabPage'));
const EdgeHubPage = React.lazy(() => import('../pages/EdgeHubPage'));
const LakehousePage = React.lazy(() => import('../pages/LakehousePage'));
const CausalEnginePage = React.lazy(() => import('../pages/CausalEnginePage'));
const DevHubPage = React.lazy(() => import('../pages/DevHubPage'));
const RaceStrategyPage = React.lazy(() => import('../pages/RaceStrategyPage'));
const RivalRadarPage = React.lazy(() => import('../pages/RivalRadarPage'));
const ChampionshipPage = React.lazy(() => import('../pages/ChampionshipPage'));
const QualifyingPage = React.lazy(() => import('../pages/QualifyingPage'));
const BrakeThermalPage = React.lazy(() => import('../pages/BrakeThermalPage'));
const ElectronicsPage = React.lazy(() => import('../pages/ElectronicsPage'));
const WeatherPage = React.lazy(() => import('../pages/WeatherPage'));
const AeroPage = React.lazy(() => import('../pages/AeroPage'));
const FuelPage = React.lazy(() => import('../pages/FuelPage'));
const TyrePressurePage = React.lazy(() => import('../pages/TyrePressurePage'));
const ChassisPage = React.lazy(() => import('../pages/ChassisPage'));
const RaceDayControlPage = React.lazy(() => import('../pages/RaceDayControlPage'));
const RaceControlPage = React.lazy(() => import('../pages/RaceControlPage'));
const GearingPage = React.lazy(() => import('../pages/GearingPage'));
const EngineeringControlPage = React.lazy(() => import('../pages/EngineeringControlPage'));
const AICrewPage = React.lazy(() => import('../pages/AICrewPage'));
const ConnectDataPage = React.lazy(() => import('../pages/ConnectDataPage'));
const TrackLivePage = React.lazy(() => import('../pages/TrackLivePage'));
const RiderComparisonPage = React.lazy(() => import('../pages/RiderComparisonPage'));
const CrashRiskPage = React.lazy(() => import('../pages/CrashRiskPage'));
const CircuitHistoryPage = React.lazy(() => import('../pages/CircuitHistoryPage'));
const PredictiveModelPage = React.lazy(() => import('../pages/PredictiveModelPage'));
const RidingStylePage = React.lazy(() => import('../pages/RidingStylePage'));

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
  { section: 'nav.sections.race', items: [
    { id: 'cockpit', labelKey: 'nav.cockpit', icon: LayoutGrid, badge: 'AI', badgeColor: 'blue' },
    { id: 'pre-gp', labelKey: 'nav.preGp', icon: CalendarDays },
    { id: 'overview', labelKey: 'nav.overview', icon: LayoutDashboard },
    { id: 'raceday', labelKey: 'nav.raceday', icon: ClipboardList, badge: 'AI', badgeColor: 'blue' },
    { id: 'live', labelKey: 'nav.live', icon: MonitorPlay, badge: 'LIVE', badgeColor: 'red' },
    { id: 'telemetry', labelKey: 'nav.telemetry', icon: Activity, badge: '10Hz', badgeColor: 'green' },
    { id: 'circuit', labelKey: 'nav.circuit', icon: Map },
    { id: 'corners', labelKey: 'nav.corners', icon: Route, badge: 'AI', badgeColor: 'blue' },
    { id: 'replay', labelKey: 'nav.replay', icon: Film },
    { id: 'studio', labelKey: 'nav.studio', icon: Video, badge: 'AI', badgeColor: 'blue' },
    { id: 'compare', labelKey: 'nav.compare', icon: GitCompare },
    { id: 'ghost-lap', labelKey: 'nav.ghostLap', icon: Ghost, badge: 'AI', badgeColor: 'blue' },
    { id: 'tires', labelKey: 'nav.tires', icon: Circle },
    { id: 'pressure', labelKey: 'nav.pressure', icon: Gauge, badge: 'AI', badgeColor: 'blue' },
    { id: 'track-evo', labelKey: 'nav.trackEvo', icon: TrendingUp },
    { id: 'surface', labelKey: 'nav.surface', icon: Mountain, badge: 'AI', badgeColor: 'blue' },
    { id: 'weather', labelKey: 'nav.weather', icon: CloudRain, badge: 'AI', badgeColor: 'blue' },
    { id: 'risk', labelKey: 'nav.risk', icon: ShieldAlert },
    { id: 'predict', labelKey: 'nav.predict', icon: Sparkles, badge: 'AI', badgeColor: 'blue' },
    { id: 'strategy', labelKey: 'nav.strategy', icon: Flag, badge: 'AI', badgeColor: 'blue' },
    { id: 'rivals', labelKey: 'nav.rivals', icon: Radar, badge: 'AI', badgeColor: 'blue' },
    { id: 'quali', labelKey: 'nav.quali', icon: Timer, badge: 'AI', badgeColor: 'blue' },
  ]},
  { section: 'nav.sections.engineering', items: [
    { id: 'engctrl', labelKey: 'nav.engctrl', icon: SlidersHorizontal, badge: 'AI', badgeColor: 'blue' },
    { id: 'setup', labelKey: 'nav.setup', icon: Sliders },
    { id: 'advisor', labelKey: 'nav.advisor', icon: Lightbulb, badge: 'AI', badgeColor: 'blue' },
    { id: 'electronics', labelKey: 'nav.electronics', icon: CircuitBoard, badge: 'AI', badgeColor: 'blue' },
    { id: 'aero', labelKey: 'nav.aero', icon: Wind, badge: 'AI', badgeColor: 'blue' },
    { id: 'fuel', labelKey: 'nav.fuel', icon: Fuel, badge: 'AI', badgeColor: 'blue' },
    { id: 'chassis', labelKey: 'nav.chassis', icon: Bike, badge: 'AI', badgeColor: 'blue' },
    { id: 'gearing', labelKey: 'nav.gearing', icon: Cog, badge: 'AI', badgeColor: 'blue' },
    { id: 'setup-lab', labelKey: 'nav.setupLab', icon: GitBranch },
    { id: 'parts', labelKey: 'nav.parts', icon: Wrench },
    { id: 'brakes', labelKey: 'nav.brakes', icon: Disc, badge: 'AI', badgeColor: 'blue' },
    { id: 'bike-compare', labelKey: 'nav.bikeCompare', icon: GitCompare },
    { id: 'twin', labelKey: 'nav.twin', icon: GitBranch },
    { id: 'sandbox', labelKey: 'nav.sandbox', icon: FlaskConical, badge: 'AI', badgeColor: 'blue' },
    { id: 'sim-lab', labelKey: 'nav.simLab', icon: FlaskRound, badge: 'AI', badgeColor: 'blue' },
    { id: 'experiments', labelKey: 'nav.experiments', icon: TestTubes, badge: 'AI', badgeColor: 'blue' },
    { id: 'events', labelKey: 'nav.events', icon: Zap, badge: 'AI', badgeColor: 'blue' },
    { id: 'causal', labelKey: 'nav.causal', icon: GitMerge, badge: 'AI', badgeColor: 'blue' },
    { id: 'history', labelKey: 'nav.history', icon: History },
    { id: 'knowledge', labelKey: 'nav.knowledge', icon: Network },
    { id: 'patterns', labelKey: 'nav.patterns', icon: Layers, badge: 'AI', badgeColor: 'blue' },
    { id: 'federated', labelKey: 'nav.federated', icon: Globe2, badge: 'AI', badgeColor: 'blue' },
    { id: 'cube', labelKey: 'nav.cube', icon: Boxes, badge: 'AI', badgeColor: 'blue' },
  ]},
  { section: 'nav.sections.command', items: [
    { id: 'orchestrator', labelKey: 'nav.orchestrator', icon: Crosshair, badge: 'AI', badgeColor: 'blue' },
    { id: 'season', labelKey: 'nav.season', icon: Trophy, badge: 'AI', badgeColor: 'blue' },
    { id: 'stewards', labelKey: 'nav.stewards', icon: Gavel, badge: 'AI', badgeColor: 'blue' },
    { id: 'crew', labelKey: 'nav.crew', icon: Radio },
    { id: 'pit-radio', labelKey: 'nav.pitRadio', icon: Mic },
    { id: 'team', labelKey: 'nav.team', icon: Users },
    { id: 'workbench', labelKey: 'nav.workbench', icon: LayoutDashboard, badge: 'AI', badgeColor: 'blue' },
    { id: 'copilot', labelKey: 'nav.copilot', icon: Bot, badge: 'AI', badgeColor: 'blue' },
    { id: 'learning-path', labelKey: 'nav.learningPath', icon: GraduationCap },
    { id: 'human', labelKey: 'nav.human', icon: HeartPulse, badge: 'AI', badgeColor: 'blue' },
    { id: 'ai-crew', labelKey: 'nav.aiCrew', icon: Users, badge: 'AI', badgeColor: 'blue' },
    { id: 'report', labelKey: 'nav.report', icon: FileText, badge: 'PDF', badgeColor: 'muted' },
    { id: 'debrief', labelKey: 'nav.debrief', icon: MessagesSquare, badge: 'AI', badgeColor: 'blue' },
    { id: 'black-box', labelKey: 'nav.blackBox', icon: CircleDot },
    { id: 'style', labelKey: 'nav.style', icon: Fingerprint },
  ]},
  { section: 'nav.sections.system', items: [
    { id: 'edge', labelKey: 'nav.edge', icon: Radio, badge: 'AI', badgeColor: 'blue' },
    { id: 'lakehouse', labelKey: 'nav.lakehouse', icon: Database, badge: 'AI', badgeColor: 'blue' },
    { id: 'devhub', labelKey: 'nav.devhub', icon: Plug, badge: 'AI', badgeColor: 'blue' },
    { id: 'platform', labelKey: 'nav.platform', icon: Server, badge: 'LIVE', badgeColor: 'green' },
    { id: 'trust', labelKey: 'nav.trust', icon: ShieldCheck },
    { id: 'data', labelKey: 'nav.data', icon: Database },
    { id: 'settings', labelKey: 'nav.settings', icon: Settings },
  ]},
];

const ALL_TAB_IDS: TabId[] = ALL_NAV_SECTIONS.flatMap(section => section.items.map(item => item.id));

const PRIMARY_TAB_IDS_BY_MODE: Record<SessionMode, readonly TabId[]> = {
  race: ['cockpit', 'raceday', 'live', 'telemetry', 'strategy', 'rivals', 'tires', 'weather', 'crew', 'copilot', 'team', 'stewards'],
  test: ['cockpit', 'telemetry', 'setup', 'advisor', 'engctrl', 'electronics', 'brakes', 'pressure', 'setup-lab', 'compare', 'team', 'trust'],
  practice: ['cockpit', 'overview', 'live', 'telemetry', 'corners', 'track-evo', 'tires', 'pressure', 'setup', 'advisor', 'crew', 'copilot'],
  trackday: ['cockpit', 'live', 'telemetry', 'corners', 'replay', 'ghost-lap', 'risk', 'tires', 'learning-path', 'human', 'copilot', 'report'],
  replay: ['cockpit', 'replay', 'telemetry', 'corners', 'compare', 'ghost-lap', 'studio', 'report', 'debrief', 'black-box', 'style', 'knowledge'],
  demo: ['cockpit', 'overview', 'live', 'telemetry', 'circuit', 'corners', 'replay', 'setup', 'twin', 'copilot', 'orchestrator', 'platform'],
  'pre-gp': ['cockpit', 'pre-gp', 'circuit', 'weather', 'surface', 'strategy', 'rivals', 'tires', 'setup', 'advisor', 'sandbox', 'team'],
  simulation: ['cockpit', 'twin', 'sandbox', 'sim-lab', 'causal', 'predict', 'circuit', 'surface', 'weather', 'setup', 'advisor', 'copilot'],
};

function filterSectionsByIds(sections: NavSectionDef[], ids: readonly TabId[]): NavSectionDef[] {
  return sections
    .map(section => ({
      ...section,
      items: section.items.filter(item => ids.includes(item.id)),
    }))
    .filter(section => section.items.length > 0);
}

function useClock(): string {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setTime(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function PageContent({ tab }: { tab: TabId }) {
  switch (tab) {
    case 'overview': return <OverviewPage />;
    case 'raceday': return <RaceDayControlPage />;
    case 'live': return <TrackLivePage />;
    case 'telemetry': return <LiveTelemetryPage />;
    case 'circuit': return <CircuitIntelligencePage />;
    case 'corners': return <CornerIntelligencePage />;
    case 'replay': return <LapReplayPage />;
    case 'studio': return <VideoStudioPage />;
    case 'track-evo': return <TrackEvolutionPage />;
    case 'surface': return <TrackSurfacePage />;
    case 'compare': return <RiderComparisonPage />;
    case 'ghost-lap': return <GhostLapPage />;
    case 'risk': return <CrashRiskPage />;
    case 'predict': return <PredictiveModelPage />;
    case 'tires': return <TireDegradationPage />;
    case 'setup': return <SetupManagementPage />;
    case 'advisor': return <GarageSetupAdvisorPage />;
    case 'setup-lab': return <SetupLabPage />;
    case 'parts': return <PartDesignPage />;
    case 'bike-compare': return <BikeComparisonPage />;
    case 'pre-gp': return <PreGrandPrixPage />;
    case 'crew': return <CrewChiefPage />;
    case 'pit-radio': return <PitRadioPage />;
    case 'team': return <TeamWorkspacePage />;
    case 'workbench': return <VisualWorkbenchPage />;
    case 'orchestrator': return <OrchestratorPage />;
    case 'cockpit': return <CockpitPage />;
    case 'trust': return <DataTrustPage />;
    case 'cube': return <DataCubePage />;
    case 'platform': return <PlatformConsolePage />;
    case 'edge': return <EdgeHubPage />;
    case 'lakehouse': return <LakehousePage />;
    case 'devhub': return <DevHubPage />;
    case 'strategy': return <RaceStrategyPage />;
    case 'rivals': return <RivalRadarPage />;
    case 'season': return <ChampionshipPage />;
    case 'stewards': return <RaceControlPage />;
    case 'quali': return <QualifyingPage />;
    case 'brakes': return <BrakeThermalPage />;
    case 'electronics': return <ElectronicsPage />;
    case 'weather': return <WeatherPage />;
    case 'aero': return <AeroPage />;
    case 'fuel': return <FuelPage />;
    case 'pressure': return <TyrePressurePage />;
    case 'chassis': return <ChassisPage />;
    case 'gearing': return <GearingPage />;
    case 'engctrl': return <EngineeringControlPage />;
    case 'patterns': return <PatternMinerPage />;
    case 'federated': return <FederatedPage />;
    case 'events': return <EventEnginePage />;
    case 'causal': return <CausalEnginePage />;
    case 'copilot': return <AICopilotPage />;
    case 'learning-path': return <RiderLearningPathPage />;
    case 'human': return <HumanPerformancePage />;
    case 'report': return <SessionReportPage />;
    case 'debrief': return <DebriefRoomPage />;
    case 'black-box': return <BlackBoxPage />;
    case 'knowledge': return <KnowledgeGraphPage />;
    case 'ai-crew': return <AICrewPage />;
    case 'style': return <RidingStylePage />;
    case 'data': return <ConnectDataPage />;
    case 'twin': return <DigitalTwinReportPage />;
    case 'sandbox': return <ScenarioSandboxPage />;
    case 'sim-lab': return <SimLabPage />;
    case 'experiments': return <ExperimentEnginePage />;
    case 'history': return <CircuitHistoryPage />;
    case 'settings': return <SettingsPage />;
    default: return <OverviewPage />;
  }
}

function DashboardShellContent() {
  const { profile, logout } = useProfile();
  const { t } = useTranslation();
  const [transitioning, setTransitioning] = useState(false);
  const sessionCtx = getSessionContext();
  const prevTabRef = useRef<TabId>(profile?.defaultTab ?? 'overview');
  const telem = useLiveTelemetry();
  const sessionState = sessionDisplayState(telem.lapCount);
  const clock = useClock();
  const live = useServiceData();

  const modeSecondaryTabIds = hiddenTabsForMode(sessionCtx.sessionMode);
  const profileAllowedSections = profile
    ? ALL_NAV_SECTIONS
        .map(section => ({
          ...section,
          items: section.items.filter(item => profile.allowedTabs.includes(item.id)),
        }))
        .filter(section => section.items.length > 0)
    : [];

  const allowedTabIds = profileAllowedSections.flatMap(section => section.items.map(item => item.id));
  const configuredPrimaryTabIds = PRIMARY_TAB_IDS_BY_MODE[sessionCtx.sessionMode].filter(id => !modeSecondaryTabIds.includes(id));
  const configuredAllowedPrimaryTabIds = configuredPrimaryTabIds.filter(id => allowedTabIds.includes(id));
  const primaryTabIds = configuredAllowedPrimaryTabIds.length > 0
    ? configuredAllowedPrimaryTabIds
    : allowedTabIds.slice(0, Math.min(allowedTabIds.length, 6));
  const secondaryTabIds = allowedTabIds.filter(id => !primaryTabIds.includes(id));
  const primarySections = filterSectionsByIds(profileAllowedSections, primaryTabIds);
  const secondarySections = filterSectionsByIds(profileAllowedSections, secondaryTabIds);
  const secondaryItemCount = secondaryTabIds.length;
  const modeDefaultTab = (sessionCtx.sessionMode === 'demo' ? getActiveDemoSession()?.focusTab : null) ?? defaultTabForMode(sessionCtx.sessionMode);
  const initialTab = resolveDashboardTab(
    sessionCtx.setup[DASHBOARD_TAB_SETUP_KEY],
    allowedTabIds,
    modeDefaultTab,
    profile?.defaultTab ?? null,
  );
  const [tab, setTab] = useState<TabId>(initialTab);

  const activeTab: TabId = allowedTabIds.includes(tab) ? tab : initialTab;
  const secondaryHasActiveTab = secondaryTabIds.includes(activeTab);

  const isFullBleed = activeTab === 'copilot';

  useEffect(() => {
    setSessionContext(withDashboardTab(getSessionContext(), activeTab));
  }, [activeTab]);

  const navigateTo = useCallback((newTab: TabId) => {
    if (!allowedTabIds.includes(newTab)) return;
    if (newTab === activeTab) return;
    setTransitioning(true);
    window.setTimeout(() => {
      prevTabRef.current = newTab;
      setTab(newTab);
      setTransitioning(false);
    }, 100);
  }, [activeTab, allowedTabIds]);

  function navigate(newTab: TabId, seed?: string) {
    if (seed) sessionStorage.setItem(COPILOT_SEED_KEY, seed);
    navigateTo(newTab);
  }

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const tabOrderAll = ALL_TAB_IDS.filter(id => allowedTabIds.includes(id));
      if (tabOrderAll.length === 0) return;
      const idx = tabOrderAll.indexOf(activeTab);

      if (e.key === 'ArrowRight' || (e.altKey && e.key === ']')) {
        e.preventDefault();
        navigateTo(tabOrderAll[(idx + 1) % tabOrderAll.length]);
      } else if (e.key === 'ArrowLeft' || (e.altKey && e.key === '[')) {
        e.preventDefault();
        navigateTo(tabOrderAll[(idx - 1 + tabOrderAll.length) % tabOrderAll.length]);
      }
    }

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeTab, allowedTabIds, navigateTo]);

  if (!profile) return null;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon"><Zap size={16} /></div>
          <div>
            <div className="sidebar-brand-name">KDD MOTO</div>
            <div className="sidebar-brand-sub">Intelligence</div>
          </div>
        </div>

        <div className="sidebar-profile-chip" style={{ '--chip-color': profile.color } as CSSProperties}>
          <span>{profile.icon}</span>
          <span style={{ fontSize: 12, fontWeight: 600 }}>{t(profile.nameKey)}</span>
        </div>

        <nav className="sidebar-nav">
          {primarySections.map(({ section, items }) => (
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

          {secondaryItemCount > 0 && (
            <details className="sidebar-section sidebar-more" open={secondaryHasActiveTab}>
              <summary className="sidebar-more-summary">
                <span>More modules</span>
                <span className="sidebar-more-count">{secondaryItemCount}</span>
              </summary>
              <div className="sidebar-more-body">
                {secondarySections.map(({ section, items }) => (
                  <div key={section} className="sidebar-more-group">
                    <div className="sidebar-section-title sidebar-section-title-compact">{t(section)}</div>
                    {items.map(item => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          className={`sidebar-item sidebar-item-secondary${activeTab === item.id ? ' sidebar-item-active' : ''}`}
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
              </div>
            </details>
          )}
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
            {live.loading ? 'Platform · checking…' : `Platform · ${live.servicesUp}/${live.servicesTotal} services online`}
          </div>
        </div>
      </aside>

      <div className="app-body">
        <header className="app-header">
          <div className="header-gp">
            <span className={`badge ${sessionState.badgeClass}`} style={{ fontSize: 10, letterSpacing: '0.1em' }}>{sessionState.badgeLabel}</span>
            <span className="header-gp-name">{sessionCtx.circuitName}</span>
            <span className="header-gp-round" style={{ color: 'var(--text-muted)', fontSize: 12 }}>{sessionCtx.sessionMode.toUpperCase()} MODE</span>
          </div>
          <div className="header-stats">
            <div className="header-stat">
              <span className="header-stat-label">{sessionState.lapLabel}</span>
              <span className="header-stat-val">{sessionState.lapValue}</span>
            </div>
            <div className="header-stat-sep" />
            <div className="header-stat">
              <span className="header-stat-label">CIRCUIT</span>
              <span className="header-stat-val" style={{ fontSize: 14 }}>{sessionCtx.circuitName}</span>
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
              <span className="header-stat-val" style={{ color: telem.fuelLoad < 5 ? 'var(--accent)' : 'var(--text)' }}>
                {telem.fuelLoad.toFixed(1)}<span style={{ fontSize: 11, color: 'var(--text-muted)' }}>kg</span>
              </span>
            </div>
          </div>
          <div className="header-right">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
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
          <div
            key={activeTab}
            className={`page-transition${transitioning ? ' page-transition-out' : ' page-transition-in'}`}
            style={{ height: '100%' }}
          >
            <NavContext.Provider value={navigate}>
              <CommandPalette
                items={profileAllowedSections.flatMap(section => section.items.map(item => ({ id: item.id, label: t(item.labelKey), section: t(section.section) })))}
                onNavigate={navigateTo}
              />
              <SessionContextStrip />
              <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)', fontSize: 13 }}>Loading…</div>}>
                <PageContent tab={activeTab} />
              </Suspense>
            </NavContext.Provider>
          </div>
        </main>
      </div>
    </div>
  );
}

export function DashboardShell() {
  return (
    <ErrorBoundary>
      <DashboardShellContent />
    </ErrorBoundary>
  );
}

export default DashboardShell;
