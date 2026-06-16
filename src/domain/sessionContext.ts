/**
 * sessionContext.ts — Session Mode Gate domain.
 *
 * Second gate of the entry flow (Landing → Circuit Gate → Session Mode Gate →
 * Dashboard). After the platform knows WHICH circuit it is on, this module
 * captures WHAT we are doing with it, and builds the global Context Object
 * every page shares:
 *
 *   selectedCircuit + sessionMode + dataMode + dashboardProfile + demoMode …
 *
 * It also drives per-mode dashboard shaping: which nav modules are hidden,
 * which tab opens first, and which status badge (LIVE / REPLAY / DEMO /
 * SIMULATION / PRE-RACE …) is pinned over the dashboard.
 */
import type { TabId } from '../context/AuthContext';

// ── Modes ─────────────────────────────────────────────────────────────────────

export type SessionMode =
  | 'race' | 'test' | 'practice' | 'trackday'
  | 'replay' | 'demo' | 'pre-gp' | 'simulation';

export type DataMode = 'live' | 'recorded' | 'sample' | 'synthetic';

export interface ModeDef {
  id: SessionMode;
  label: string;
  tagline: string;
  detail: string;
  requirements: string[];
  badge: string;            // status label pinned over the dashboard
  badgeColor: string;
  dataMode: DataMode;
  dashboardProfile: string;
  pitStrategyEnabled: boolean;
  demoMode: boolean;
  openLabel: string;
}

export const MODE_DEFS: ModeDef[] = [
  {
    id: 'race', label: 'RACE', tagline: 'Official or simulated race session',
    detail: 'Race laps · grid · strategy · rivals · live timing',
    requirements: ['Race distance', 'Grid position', 'Race status', 'Tyres', 'Timing source'],
    badge: 'LIVE', badgeColor: 'var(--accent)', dataMode: 'live',
    dashboardProfile: 'race_live', pitStrategyEnabled: false, demoMode: false,
    openLabel: 'Open Race Dashboard',
  },
  {
    id: 'test', label: 'TEST', tagline: 'Engineering validation',
    detail: 'Setup · tyres · electronics · aero · suspension',
    requirements: ['Objective', 'Setup baseline', 'Validation metrics'],
    badge: 'TEST', badgeColor: 'var(--blue)', dataMode: 'live',
    dashboardProfile: 'engineering_test', pitStrategyEnabled: false, demoMode: false,
    openLabel: 'Open Test Dashboard',
  },
  {
    id: 'practice', label: 'PRACTICE', tagline: 'Free practice or warm-up',
    detail: 'FP1 · FP2 · FP3 · qualifying prep',
    requirements: ['Session FP1/FP2/FP3', 'Tyres', 'Goal', 'Reference lap'],
    badge: 'PRACTICE', badgeColor: 'var(--green)', dataMode: 'live',
    dashboardProfile: 'practice', pitStrategyEnabled: false, demoMode: false,
    openLabel: 'Open Practice Dashboard',
  },
  {
    id: 'trackday', label: 'TRACK DAY / STINT', tagline: 'Private session or rider coaching',
    detail: 'Lap improvement · safety · consistency',
    requirements: ['Rider', 'Bike', 'Stint', 'Data source', 'Coaching goal'],
    badge: 'STINT', badgeColor: 'var(--green)', dataMode: 'live',
    dashboardProfile: 'trackday_coaching', pitStrategyEnabled: false, demoMode: false,
    openLabel: 'Open Stint Dashboard',
  },
  {
    id: 'replay', label: 'REPLAY ANALYSIS', tagline: 'Analyze previous sessions',
    detail: 'Compare laps · generate report · extract insights',
    requirements: ['Recorded session', 'Available channels', 'Comparison mode'],
    badge: 'REPLAY', badgeColor: 'var(--yellow)', dataMode: 'recorded',
    dashboardProfile: 'replay_analysis', pitStrategyEnabled: false, demoMode: false,
    openLabel: 'Open Replay Dashboard',
  },
  {
    id: 'demo', label: 'DEMO', tagline: 'Load latest sample sessions from this circuit',
    detail: 'Explore the platform without live data',
    requirements: ['Demo package', 'Sample data', 'Guided walkthrough'],
    badge: 'DEMO', badgeColor: '#A78BFA', dataMode: 'sample',
    dashboardProfile: 'guided_demo', pitStrategyEnabled: false, demoMode: true,
    openLabel: 'Start Guided Demo',
  },
  {
    id: 'pre-gp', label: 'PRE-GP PREPARATION', tagline: 'Prepare weekend',
    detail: 'Circuit · weather · rivals · tyres · setup · simulation',
    requirements: ['Weather', 'Tyre allocation', 'Rivals', 'Setup baseline', 'Simulation scenarios'],
    badge: 'PRE-RACE', badgeColor: 'var(--yellow)', dataMode: 'recorded',
    dashboardProfile: 'pre_gp_workspace', pitStrategyEnabled: false, demoMode: false,
    openLabel: 'Open Preparation Workspace',
  },
  {
    id: 'simulation', label: 'SIMULATION', tagline: 'Create predicted session',
    detail: 'For new or incomplete circuits',
    requirements: ['Circuit model', 'Confidence', 'Generated baseline'],
    badge: 'SIMULATION', badgeColor: '#A78BFA', dataMode: 'synthetic',
    dashboardProfile: 'simulation', pitStrategyEnabled: false, demoMode: false,
    openLabel: 'Open Simulation Dashboard',
  },
];

export function modeDef(id: SessionMode): ModeDef {
  return MODE_DEFS.find(m => m.id === id)!;
}

// ── Per-mode dashboard shaping (spec §5) ─────────────────────────────────────

/** Tabs hidden from the nav while this session mode is active. */
export function hiddenTabsForMode(mode: SessionMode): TabId[] {
  switch (mode) {
    case 'race':       return ['report', 'style'];
    case 'test':       return ['compare', 'crew', 'style'];
    case 'practice':   return [];
    case 'trackday':   return ['overview', 'compare', 'crew', 'pre-gp'];
    case 'replay':     return ['live', 'crew'];
    case 'demo':       return [];
    case 'pre-gp':     return ['live', 'overview'];
    case 'simulation': return ['live'];
  }
}

/** Human labels for dashboard modules (shared by Mode Gate + Launch Brief). */
export const MODULE_LABELS: Partial<Record<TabId, string>> = {
  overview: 'Race Overview', live: 'Track-Live', telemetry: 'Live Telemetry',
  circuit: '3D Track Map', corners: 'Corner Intelligence', replay: 'Lap Replay',
  compare: 'Rider Comparison', tires: 'Tyre & Grip', risk: 'Crash-Risk',
  predict: 'Predictive Model', setup: 'Setup Management', advisor: 'Garage Setup Advisor', 'setup-lab': 'Setup Lab',
  parts: 'Garage Part Factory', brakes: 'Brake Thermal Lab', electronics: 'Electronics Control Lab', aero: 'Aerodynamics Lab', fuel: 'Fuel & Energy Lab', pressure: 'Tyre Pressure & Compliance', chassis: 'Chassis & Geometry Lab', gearing: 'Gearing & Transmission Lab', engctrl: 'Engineering Control', 'bike-compare': 'Bike Comparison', twin: 'Digital Twin', sandbox: 'Scenario Sandbox', history: 'Circuit History',
  'pre-gp': 'Pre-GP Workspace', crew: 'Crew Chief', copilot: 'Rider Coach AI',
  'ai-crew': 'Oracle Pit Wall', report: 'Session Report', debrief: 'AI Debrief Room', 'black-box': 'KDD Black Box', knowledge: 'Knowledge Graph', style: 'Rider Style DNA',
  'ghost-lap': 'Ghost Lap Simulator', 'learning-path': 'Rider Learning Path', experiments: 'Experiment Engine', studio: 'Video Studio', 'sim-lab': 'Sim-to-Real Lab',
  cockpit: 'Adaptive Cockpit', 'track-evo': 'Track Evolution', surface: 'Track Surface', weather: 'Weather & Grip Radar', 'pit-radio': 'Pit-Radio', team: 'Team Workspace',
  raceday: 'Race Day Control', trust: 'Data Trust Center', cube: 'Telemetry Data Cube', platform: 'Platform Console', patterns: 'Pattern Miner', edge: 'Trackside Edge Hub', lakehouse: 'Data Lakehouse', devhub: 'Developer Hub', strategy: 'Race Strategy Command', rivals: 'Rival Radar', quali: 'Qualifying Lab', events: 'Event Engine', causal: 'Causal Engine', workbench: 'Visualization OS', federated: 'Federated Intelligence', orchestrator: 'Autonomous Race Engineer', season: 'Championship Command', stewards: 'Race Control & Compliance', human: 'Human Performance',
};

/** What a mode activates vs hides — shown in the gate BEFORE opening (§2). */
export function moduleVisibilityForMode(mode: SessionMode): { active: string[]; hidden: string[] } {
  const hiddenIds = new Set(hiddenTabsForMode(mode));
  const ids = Object.keys(MODULE_LABELS) as TabId[];
  return {
    active: ids.filter(id => !hiddenIds.has(id)).map(id => MODULE_LABELS[id]!),
    hidden: ids.filter(id => hiddenIds.has(id)).map(id => MODULE_LABELS[id]!),
  };
}

/** Tab the dashboard opens on for this mode (null → profile default). */
export function defaultTabForMode(mode: SessionMode): TabId | null {
  switch (mode) {
    case 'race':       return 'overview';
    case 'test':       return 'telemetry';
    case 'practice':   return 'overview';
    case 'trackday':   return 'live';
    case 'replay':     return 'replay';
    case 'demo':       return 'overview';
    case 'pre-gp':     return 'pre-gp';
    case 'simulation': return 'twin';
  }
}

// ── Context Object (spec §6) ──────────────────────────────────────────────────

export interface SessionContext {
  selectedCircuit: string;       // circuit id
  circuitName: string;
  sessionMode: SessionMode;
  dataMode: DataMode;
  dashboardProfile: string;
  pitStrategyEnabled: boolean;
  demoMode: boolean;
  badge: string;
  badgeColor: string;
  /** Mode-specific setup captured in the Session Setup step. */
  setup: Record<string, string>;
}

let current: SessionContext | null = null;

export function setSessionContext(ctx: SessionContext): void {
  current = ctx;
}

export function clearSessionContext(): void {
  current = null;
}

/** Defaults to a dry-GP race context on Mugello until a gate sets it. */
export function getSessionContext(): SessionContext {
  return current ?? {
    selectedCircuit: 'mugello', circuitName: 'Mugello',
    sessionMode: 'race', dataMode: 'live', dashboardProfile: 'race_live',
    pitStrategyEnabled: false, demoMode: false,
    badge: 'LIVE', badgeColor: 'var(--accent)', setup: {},
  };
}

/** Persist the opened session context to InsForge (audit trail of how each
 *  session was started). Anonymous sessions stay local — RLS rejects them. */
export async function persistSessionContext(ctx: SessionContext): Promise<void> {
  try {
    const { insforge } = await import('../lib/insforge');
    const { data: user } = await insforge.auth.getCurrentUser();
    const uid = (user as { user?: { id?: string } } | null)?.user?.id;
    if (!uid) return;
    await insforge.database.from('session_contexts').insert([{
      circuit_id: ctx.selectedCircuit, session_mode: ctx.sessionMode,
      data_mode: ctx.dataMode, dashboard_profile: ctx.dashboardProfile,
      pit_strategy_enabled: ctx.pitStrategyEnabled, demo_mode: ctx.demoMode,
      setup: ctx.setup, created_by: uid,
    }]);
  } catch { /* non-blocking */ }
}

export function buildSessionContext(
  circuitId: string, circuitName: string, mode: SessionMode, setup: Record<string, string>,
): SessionContext {
  const def = modeDef(mode);
  return {
    selectedCircuit: circuitId, circuitName,
    sessionMode: mode, dataMode: def.dataMode, dashboardProfile: def.dashboardProfile,
    pitStrategyEnabled: def.pitStrategyEnabled, demoMode: def.demoMode,
    badge: def.badge, badgeColor: def.badgeColor, setup,
  };
}

// ── Session Setup forms (spec §7) ─────────────────────────────────────────────

export interface SetupField {
  key: string;
  label: string;
  options?: string[];   // select when present, text input otherwise
  value: string;        // default
  placeholder?: string;
}

export function setupFieldsForMode(mode: SessionMode, circuitName: string, raceLaps: number): SetupField[] {
  switch (mode) {
    case 'race': return [
      { key: 'race', label: 'Race', value: `GP ${circuitName} · Round 7/20 · 2026` },
      { key: 'status', label: 'Race status', options: ['Pre-race', 'Live', 'Completed'], value: 'Pre-race' },
      { key: 'distance', label: 'Race distance', value: `${raceLaps} laps` },
      { key: 'grid', label: 'Grid position', value: 'P3' },
      { key: 'tyres', label: 'Starting tyres', options: ['Front Medium · Rear Soft', 'Front Medium · Rear Medium', 'Front Hard · Rear Medium', 'Wets'], value: 'Front Medium · Rear Soft' },
      { key: 'weather', label: 'Weather', options: ['Dry start · stable', 'Dry start · rain risk late', 'Wet declared'], value: 'Dry start · rain risk late' },
      { key: 'rules', label: 'Race rules', options: ['Dry GP mode · no pit strategy', 'Flag-to-flag available', 'Endurance · pits enabled'], value: 'Dry GP mode · no pit strategy' },
    ];
    case 'test': return [
      { key: 'objective', label: 'Objective', options: ['Setup validation', 'Tyre comparison', 'Electronics mapping', 'Aero test', 'Suspension test'], value: 'Setup validation' },
      { key: 'detail', label: 'Test detail', value: 'Validate rear rebound +2 clicks' },
      { key: 'plan', label: 'Run plan', options: ['Stint 1 baseline · Stint 2 variant · Stint 3 validation', '2 stints A/B', 'Single long run'], value: 'Stint 1 baseline · Stint 2 variant · Stint 3 validation' },
      { key: 'laps', label: 'Laps per stint', options: ['5', '8', '10', 'Custom'], value: '8' },
      { key: 'metric', label: 'Primary metric', options: ['Lap time', 'Consistency', 'Tyre temp', 'Rear grip', 'Braking stability'], value: 'Rear grip' },
      { key: 'criteria', label: 'Success criteria', value: 'Rear slip <10% · exit +5 km/h at last corner · no crash-risk increase' },
    ];
    case 'practice': return [
      { key: 'session', label: 'Session', options: ['FP1', 'FP2', 'FP3', 'Warm-up'], value: 'FP2' },
      { key: 'goal', label: 'Goal', options: ['Learn track', 'Race pace', 'Tyre comparison', 'Qualifying simulation'], value: 'Race pace' },
      { key: 'fuel', label: 'Fuel load', options: ['Low', 'Medium', 'Race'], value: 'Race' },
      { key: 'tyres', label: 'Tyres', options: ['Front Medium · Rear Soft', 'Front Medium · Rear Medium', 'Front Hard · Rear Medium'], value: 'Front Medium · Rear Soft' },
      { key: 'reference', label: 'Reference', options: ['Previous FP', 'Best lap', 'Teammate', 'Ideal lap'], value: 'Best lap' },
    ];
    case 'trackday': return [
      { key: 'rider', label: 'Rider', value: 'Rubén Juárez' },
      { key: 'bike', label: 'Bike', value: 'Yamaha R1' },
      { key: 'stint', label: 'Session', options: ['Stint 01', 'Stint 02', 'Stint 03'], value: 'Stint 03' },
      { key: 'tyres', label: 'Tyres', options: ['Front Medium · Rear Soft', 'Front Medium · Rear Medium'], value: 'Front Medium · Rear Soft' },
      { key: 'source', label: 'Data source', options: ['Live logger', 'Uploaded CSV', 'Manual timing'], value: 'Live logger' },
      { key: 'goal', label: 'Coaching goal', options: ['Improve lap time', 'Consistency', 'Corner exits', 'Braking', 'Safety'], value: 'Corner exits' },
    ];
    case 'replay': return [
      { key: 'session', label: 'Select session', options: [`${circuitName} · Stint 03 · 14:32 · Yamaha R1`, `${circuitName} · FP2 · race pace runs`, `${circuitName} · Qualifying · best lap`], value: `${circuitName} · Stint 03 · 14:32 · Yamaha R1` },
      { key: 'channels', label: 'Data available', value: 'GPS · IMU · ECU · Video · CSV' },
      { key: 'analysis', label: 'Analysis mode', options: ['Full session', 'Best lap', 'Compare laps', 'Corner analysis', 'Rider coaching', 'Session report'], value: 'Compare laps' },
    ];
    case 'pre-gp': return [
      { key: 'load', label: 'Load', value: 'Circuit model · historical telemetry · weather · rivals · tyre allocation · setup baseline · race scenarios' },
      { key: 'objective', label: 'Objective', options: ['Prepare race weekend', 'Rival analysis only', 'Setup baseline only'], value: 'Prepare race weekend' },
    ];
    case 'simulation': return [
      { key: 'basis', label: 'Data basis', value: 'AI reconstructed geometry · estimated elevation · no real telemetry yet' },
      { key: 'objective', label: 'Simulation objective', options: ['Baseline lap model', 'Risk zones', 'Setup recommendation', 'First validation stint'], value: 'Baseline lap model' },
    ];
    case 'demo': return []; // demo uses the package selector instead of a form
  }
}

// ── Demo packages (spec §8) ───────────────────────────────────────────────────

export interface DemoPackage {
  id: string;
  title: string;
  dataType: string;
  modules: string[];
  highlights: string[];
}

export const DEMO_PACKAGES: DemoPackage[] = [
  {
    id: 'race-sim', title: 'GP race simulation · 23 laps · full digital twin',
    dataType: 'Synthetic + historical sample',
    modules: ['Race Overview', '3D map', 'Digital twin', 'Oracle Pit Wall'],
    highlights: ['Win probability model', '27 strategy scenarios', 'Rear-grip cliff at lap 19'],
  },
  {
    id: 'trackday', title: 'Yamaha R1 track day · Stint 03 · rider coaching',
    dataType: 'Historical sample · GPS 10 Hz · IMU · ECU · tyre model',
    modules: ['Telemetry', 'Corner intelligence', 'Session report', 'Rider Style DNA'],
    highlights: ['Best lap 1:57.842', 'Potential gain -1.284s', 'Critical corner T15 Bucine', 'Rear grip drop 12%'],
  },
  {
    id: 'qualifying', title: 'Qualifying lap analysis · best lap comparison',
    dataType: 'Historical sample',
    modules: ['Telemetry', 'Lap replay', 'Rider comparison'],
    highlights: ['Sector 2 -0.31s vs ideal', 'Late brake at T1 worth -0.12s'],
  },
  {
    id: 'tyre-deg', title: 'Tyre degradation demo · rear soft cliff model',
    dataType: 'Synthetic (Pacejka model)',
    modules: ['Tyre & Grip', 'Crash-Risk', 'Digital twin'],
    highlights: ['Cliff predicted lap 19', 'Optimal cold pressure 1.95 bar'],
  },
  {
    id: 'setup', title: 'Garage setup validation · rebound + TC changes',
    dataType: 'Historical sample',
    modules: ['Garage Setup Advisor', 'Setup impact', 'Session report'],
    highlights: ['TC4→TC5 validated', 'Rear rebound +2 clicks · slip -4%'],
  },
];
