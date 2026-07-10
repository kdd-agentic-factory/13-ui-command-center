import React, { Suspense, useState, useEffect, useRef, useCallback, type CSSProperties, type ElementType } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, Activity, Map, Circle, Sliders, Wrench,
  CalendarDays, Radio, Bot, GitBranch, Settings, Zap, ChevronRight, LogOut,
  Route, Film, Lightbulb, FileText, Users, Database, MonitorPlay, GitCompare, ShieldAlert, History,
  Sparkles, Fingerprint, MessagesSquare, FlaskConical, CircleDot, Network, Ghost, GraduationCap, TestTubes, Video,
  LayoutGrid, TrendingUp, Mic, ShieldCheck, Boxes, Server, Layers, Mountain, Crosshair, HeartPulse, Globe2, FlaskRound, GitMerge, Plug, Flag, Radar, Trophy, Timer, Disc, CircuitBoard, CloudRain, Wind, Fuel, Gauge, Bike, ClipboardList, Gavel, Cog, SlidersHorizontal,
  Menu, X,
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
const ResearchLabPage = React.lazy(() => import('../pages/ResearchLabPage'));

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
  // ── 1. MISSION CONTROL — operational entry points ──────────────────
  { section: 'nav.sections.missionControl', items: [
    { id: 'overview', labelKey: 'nav.overview', icon: LayoutDashboard },
    { id: 'pre-gp', labelKey: 'nav.preGp', icon: CalendarDays },
    { id: 'raceday', labelKey: 'nav.raceday', icon: ClipboardList, badge: 'AI', badgeColor: 'blue' },
    { id: 'live', labelKey: 'nav.live', icon: MonitorPlay, badge: 'LIVE', badgeColor: 'red' },
  ]},
  // ── 2. PITWALL OS — primary operational product ────────────────────
  { section: 'nav.sections.pitwall', items: [
    { id: 'cockpit', labelKey: 'nav.cockpit', icon: LayoutGrid, badge: 'AI', badgeColor: 'blue' },
    { id: 'telemetry', labelKey: 'nav.telemetry', icon: Activity, badge: '10Hz', badgeColor: 'green' },
    { id: 'circuit', labelKey: 'nav.circuit', icon: Map },
    { id: 'corners', labelKey: 'nav.corners', icon: Route, badge: 'AI', badgeColor: 'blue' },
    { id: 'setup', labelKey: 'nav.setup', icon: Sliders },
    { id: 'parts', labelKey: 'nav.parts', icon: Wrench },
    { id: 'twin', labelKey: 'nav.twin', icon: GitBranch },
    { id: 'tires', labelKey: 'nav.tires', icon: Circle },
    { id: 'pressure', labelKey: 'nav.pressure', icon: Gauge, badge: 'AI', badgeColor: 'blue' },
    { id: 'crew', labelKey: 'nav.crew', icon: Radio },
  ]},
  // ── 3. PERFORMANCE — analytics, reports, workflows ─────────────────
  { section: 'nav.sections.performance', items: [
    { id: 'replay', labelKey: 'nav.replay', icon: Film },
    { id: 'compare', labelKey: 'nav.compare', icon: GitCompare },
    { id: 'ghost-lap', labelKey: 'nav.ghostLap', icon: Ghost, badge: 'AI', badgeColor: 'blue' },
    { id: 'studio', labelKey: 'nav.studio', icon: Video, badge: 'AI', badgeColor: 'blue' },
    { id: 'report', labelKey: 'nav.report', icon: FileText, badge: 'PDF', badgeColor: 'muted' },
    { id: 'debrief', labelKey: 'nav.debrief', icon: MessagesSquare, badge: 'AI', badgeColor: 'blue' },
  ]},
  // ── 4. AI LAYER — copilot and intelligence ─────────────────────────
  { section: 'nav.sections.ai', items: [
    { id: 'copilot', labelKey: 'nav.copilot', icon: Bot, badge: 'AI', badgeColor: 'blue' },
    { id: 'advisor', labelKey: 'nav.advisor', icon: Lightbulb, badge: 'AI', badgeColor: 'blue' },
    { id: 'strategy', labelKey: 'nav.strategy', icon: Flag, badge: 'AI', badgeColor: 'blue' },
    { id: 'predict', labelKey: 'nav.predict', icon: Sparkles, badge: 'AI', badgeColor: 'blue' },
    { id: 'risk', labelKey: 'nav.risk', icon: ShieldAlert },
    { id: 'weather', labelKey: 'nav.weather', icon: CloudRain, badge: 'AI', badgeColor: 'blue' },
  ]},
  // ── 5. KNOWLEDGE NETWORK — nodes, federation, learning ─────────────
  { section: 'nav.sections.knowledge', items: [
    { id: 'knowledge', labelKey: 'nav.knowledge', icon: Network },
    { id: 'federated', labelKey: 'nav.federated', icon: Globe2, badge: 'AI', badgeColor: 'blue' },
    { id: 'learning-path', labelKey: 'nav.learningPath', icon: GraduationCap },
    { id: 'patterns', labelKey: 'nav.patterns', icon: Layers, badge: 'AI', badgeColor: 'blue' },
  ]},
  // ── 6. RESEARCH — applied research and experimentation ─────────────
  { section: 'nav.sections.research', items: [
    { id: 'research', labelKey: 'nav.research', icon: FlaskConical, badge: 'AI', badgeColor: 'blue' },
    { id: 'sandbox', labelKey: 'nav.sandbox', icon: FlaskConical, badge: 'AI', badgeColor: 'blue' },
    { id: 'sim-lab', labelKey: 'nav.simLab', icon: FlaskRound, badge: 'AI', badgeColor: 'blue' },
    { id: 'experiments', labelKey: 'nav.experiments', icon: TestTubes, badge: 'AI', badgeColor: 'blue' },
    { id: 'causal', labelKey: 'nav.causal', icon: GitMerge, badge: 'AI', badgeColor: 'blue' },
  ]},
  // ── 7. PLATFORM — admin, infrastructure, config (secondary) ────────
  { section: 'nav.sections.platform', items: [
    { id: 'platform', labelKey: 'nav.platform', icon: Server, badge: 'LIVE', badgeColor: 'green' },
    { id: 'settings', labelKey: 'nav.settings', icon: Settings },
    { id: 'edge', labelKey: 'nav.edge', icon: Radio, badge: 'AI', badgeColor: 'blue' },
    { id: 'lakehouse', labelKey: 'nav.lakehouse', icon: Database, badge: 'AI', badgeColor: 'blue' },
    { id: 'devhub', labelKey: 'nav.devhub', icon: Plug, badge: 'AI', badgeColor: 'blue' },
    { id: 'trust', labelKey: 'nav.trust', icon: ShieldCheck },
    { id: 'data', labelKey: 'nav.data', icon: Database },
  ]},
  // ── DEMOTED — secondary tools, hidden from primary nav ─────────────
  { section: 'nav.sections.tools', items: [
    { id: 'orchestrator', labelKey: 'nav.orchestrator', icon: Crosshair, badge: 'AI', badgeColor: 'blue' },
    { id: 'stewards', labelKey: 'nav.stewards', icon: Gavel, badge: 'AI', badgeColor: 'blue' },
    { id: 'pit-radio', labelKey: 'nav.pitRadio', icon: Mic },
    { id: 'team', labelKey: 'nav.team', icon: Users },
    { id: 'workbench', labelKey: 'nav.workbench', icon: LayoutDashboard, badge: 'AI', badgeColor: 'blue' },
    { id: 'human', labelKey: 'nav.human', icon: HeartPulse, badge: 'AI', badgeColor: 'blue' },
    { id: 'ai-crew', labelKey: 'nav.aiCrew', icon: Users, badge: 'AI', badgeColor: 'blue' },
    { id: 'black-box', labelKey: 'nav.blackBox', icon: CircleDot },
    { id: 'style', labelKey: 'nav.style', icon: Fingerprint },
    { id: 'engctrl', labelKey: 'nav.engctrl', icon: SlidersHorizontal, badge: 'AI', badgeColor: 'blue' },
    { id: 'electronics', labelKey: 'nav.electronics', icon: CircuitBoard, badge: 'AI', badgeColor: 'blue' },
    { id: 'aero', labelKey: 'nav.aero', icon: Wind, badge: 'AI', badgeColor: 'blue' },
    { id: 'fuel', labelKey: 'nav.fuel', icon: Fuel, badge: 'AI', badgeColor: 'blue' },
    { id: 'chassis', labelKey: 'nav.chassis', icon: Bike, badge: 'AI', badgeColor: 'blue' },
    { id: 'gearing', labelKey: 'nav.gearing', icon: Cog, badge: 'AI', badgeColor: 'blue' },
    { id: 'setup-lab', labelKey: 'nav.setupLab', icon: GitBranch },
    { id: 'brakes', labelKey: 'nav.brakes', icon: Disc, badge: 'AI', badgeColor: 'blue' },
    { id: 'bike-compare', labelKey: 'nav.bikeCompare', icon: GitCompare },
    { id: 'track-evo', labelKey: 'nav.trackEvo', icon: TrendingUp },
    { id: 'surface', labelKey: 'nav.surface', icon: Mountain, badge: 'AI', badgeColor: 'blue' },
    { id: 'events', labelKey: 'nav.events', icon: Zap, badge: 'AI', badgeColor: 'blue' },
    { id: 'history', labelKey: 'nav.history', icon: History },
    { id: 'cube', labelKey: 'nav.cube', icon: Boxes, badge: 'AI', badgeColor: 'blue' },
    { id: 'season', labelKey: 'nav.season', icon: Trophy, badge: 'AI', badgeColor: 'blue' },
    { id: 'quali', labelKey: 'nav.quali', icon: Timer, badge: 'AI', badgeColor: 'blue' },
    { id: 'rivals', labelKey: 'nav.rivals', icon: Radar, badge: 'AI', badgeColor: 'blue' },
  ]},
];

const ALL_TAB_IDS: TabId[] = ALL_NAV_SECTIONS.flatMap(section => section.items.map(item => item.id));

const PUBLIC_ROUTE_PREFIXES = new Set(['app', 'pit-wall', 'pitwall']);

const PUBLIC_ROUTE_TAB_BY_SLUG: Record<string, TabId> = {
  nodes: 'knowledge',
  federation: 'federated',
  copilot: 'copilot',
  research: 'research',
  'research-lab': 'research',
  platform: 'platform',
  dashboard: 'overview',
};

export function resolveTabFromPublicPath(pathname: string, baseUrl = import.meta.env.BASE_URL): TabId | null {
  const basePath = baseUrl.replace(/\/$/, '');
  const subPath = basePath && pathname.startsWith(basePath) ? pathname.slice(basePath.length) : pathname;
  const segments = subPath.split('/').filter(Boolean);
  const isDeepCockpitRoute = segments.length === 2 && PUBLIC_ROUTE_PREFIXES.has(segments[0]);
  const slug = isDeepCockpitRoute ? segments[1] : segments[0] === 'dashboard' ? 'dashboard' : null;

  return slug ? PUBLIC_ROUTE_TAB_BY_SLUG[slug] ?? null : null;
}

const PRIMARY_TAB_IDS_BY_MODE: Record<SessionMode, readonly TabId[]> = {
  // Race: Mission Control + PitWall OS + AI Layer (12 items)
  race: ['overview', 'raceday', 'live', 'cockpit', 'telemetry', 'tires', 'crew', 'copilot', 'strategy', 'weather', 'risk', 'debrief'],
  // Test: PitWall OS + Performance (12 items)
  test: ['cockpit', 'telemetry', 'setup', 'pressure', 'compare', 'replay', 'report', 'debrief', 'advisor', 'electronics', 'brakes', 'trust'],
  // Practice: Mission Control + PitWall OS + AI (12 items)
  practice: ['overview', 'live', 'cockpit', 'telemetry', 'corners', 'setup', 'tires', 'pressure', 'advisor', 'copilot', 'crew', 'report'],
  // Track Day: Mission Control + PitWall + Performance (12 items)
  trackday: ['overview', 'live', 'cockpit', 'telemetry', 'corners', 'replay', 'ghost-lap', 'risk', 'tires', 'copilot', 'learning-path', 'report'],
  // Replay: PitWall + Performance + Knowledge (12 items)
  replay: ['cockpit', 'telemetry', 'corners', 'replay', 'compare', 'ghost-lap', 'studio', 'report', 'debrief', 'knowledge', 'black-box', 'style'],
  // Demo: Mission Control + PitWall + Platform (12 items)
  demo: ['overview', 'live', 'cockpit', 'telemetry', 'circuit', 'setup', 'twin', 'copilot', 'platform', 'orchestrator', 'replay', 'report'],
  // Pre-GP: Mission Control + PitWall OS + Research (12 items)
  'pre-gp': ['overview', 'pre-gp', 'circuit', 'weather', 'surface', 'strategy', 'tires', 'setup', 'advisor', 'sandbox', 'copilot', 'team'],
  // Simulation: PitWall + Research + AI (12 items)
  simulation: ['cockpit', 'twin', 'sandbox', 'sim-lab', 'causal', 'predict', 'circuit', 'weather', 'setup', 'advisor', 'copilot', 'report'],
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
    case 'research': return <ResearchLabPage />;
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);
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
    setDrawerOpen(false); // close drawer on route change
  }

  // ── URL-to-TabId auto-navigation ──────────────────────────────
  // When the user enters the SPA via /pit-wall/{section}, auto-select the
  // corresponding dashboard tab so direct Hub CTAs land on the right section.
  useEffect(() => {
    const target = resolveTabFromPublicPath(window.location.pathname);
    if (target && allowedTabIds.includes(target) && target !== activeTab) {
      // Small delay to let the dashboard settle before switching
      window.setTimeout(() => setTab(target), 200);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Drawer: Escape key + body scroll lock
  useEffect(() => {
    if (!drawerOpen) return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setDrawerOpen(false);
        hamburgerRef.current?.focus();
      }
    }
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [drawerOpen]);

  // Drawer: focus trap (document-level to prevent escape)
  useEffect(() => {
    if (!drawerOpen || !drawerRef.current) return;
    const drawer = drawerRef.current;
    function handleTab(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;
      const focusable = drawer.querySelectorAll<HTMLElement>(
        'button:not([disabled]), summary, [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      // Always trap: if focus somehow left the drawer, bring it back
      if (!drawer.contains(document.activeElement)) {
        e.preventDefault();
        first.focus();
        return;
      }
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    // Auto-focus first item in drawer
    const firstBtn = drawer.querySelector<HTMLElement>('button.sidebar-item');
    if (firstBtn) firstBtn.focus();
    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [drawerOpen]);

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
      {/* Mobile drawer overlay */}
      <div
        className={`sidebar-drawer-overlay${drawerOpen ? ' sidebar-drawer-open' : ''}`}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />

      <aside className={`sidebar${drawerOpen ? ' sidebar-drawer-open' : ''}`} ref={drawerRef}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon"><Zap size={16} /></div>
          <div>
            <div className="sidebar-brand-name">KDD Hub</div>
            <div className="sidebar-brand-sub">by Keedio</div>
          </div>
          <button
            type="button"
            className="sidebar-drawer-close"
            onClick={() => { setDrawerOpen(false); hamburgerRef.current?.focus(); }}
            aria-label="Close navigation menu"
          >
            <X size={18} />
          </button>
        </div>

        <div className="sidebar-profile-chip" style={{ '--chip-color': profile.color } as CSSProperties}>
          <span>{profile.icon}</span>
          <span style={{ fontSize: 12, fontWeight: 600 }}>{t(profile.nameKey)}</span>
        </div>

        <nav className="sidebar-nav" id="sidebar-nav">
          {primarySections.map(({ section, items }) => (
            <div key={section} className="sidebar-section">
              <div className="sidebar-section-title">{t(section)}</div>
              {items.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    className={`sidebar-item${isActive ? ' sidebar-item-active' : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => { navigateTo(item.id); setDrawerOpen(false); }}
                  >
                    <span className="sidebar-item-icon"><Icon size={15} /></span>
                    <span className="sidebar-item-label">{t(item.labelKey)}</span>
                    {item.badge && (
                      <span className={`sidebar-badge sidebar-badge-${item.badgeColor ?? 'muted'}`}>{item.badge}</span>
                    )}
                    {isActive && <ChevronRight size={12} className="sidebar-item-arrow" />}
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
                {secondarySections.filter(s => s.section === 'nav.sections.platform' || s.section === 'nav.sections.tools').map(({ section, items }) => (
                  <div key={section} className="sidebar-more-group">
                    <div className="sidebar-section-title sidebar-section-title-compact">{t(section)}</div>
                    {items.map(item => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          className={`sidebar-item sidebar-item-secondary${isActive ? ' sidebar-item-active' : ''}`}
                          aria-current={isActive ? 'page' : undefined}
                          onClick={() => { navigateTo(item.id); setDrawerOpen(false); }}
                        >
                          <span className="sidebar-item-icon"><Icon size={15} /></span>
                          <span className="sidebar-item-label">{t(item.labelKey)}</span>
                          {item.badge && (
                            <span className={`sidebar-badge sidebar-badge-${item.badgeColor ?? 'muted'}`}>{item.badge}</span>
                          )}
                          {isActive && <ChevronRight size={12} className="sidebar-item-arrow" />}
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
          {/* Mobile hamburger */}
          <button
            ref={hamburgerRef}
            className="hamburger-btn"
            onClick={() => setDrawerOpen(prev => !prev)}
            aria-label={drawerOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={drawerOpen}
            aria-controls="sidebar-nav"
          >
            {drawerOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
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
