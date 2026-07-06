/**
 * serviceRegistry.ts — KDD service registry.
 * Central configuration for all external KDD services.
 * ModuleGateway reads this to determine routing, status, and display.
 */
export type ServiceStatus = 'live' | 'preview' | 'unavailable' | 'not-connected';

export interface ServiceRoute {
  id: string;
  label: string;
  path: string;
  description: string;
  layer: string;
}

export interface ServiceDef {
  id: string;
  label: string;
  description: string;
  baseUrl: string;
  status: ServiceStatus;
  /** Query params to append for context propagation */
  defaultParams?: Record<string, string>;
  icon?: string;
  badge?: string;
  routes?: ServiceRoute[];
  /** Health endpoint path relative to baseUrl (e.g. "/status.json") */
  healthPath?: string;
  /** Explicit override for status URL — used instead of baseUrl + healthPath when set */
  statusUrl?: string;
  /** Logical service kind for grouping/filtering (e.g. "race-command-center") */
  serviceKind?: string;
  /** Per-capability status map (e.g. { aiCopilot: "preview", telemetry: "demo" }) */
  capabilities?: Record<string, string>;
}

/**
 * Race Command Center (15) — full operational cycle preview.
 * Organized by layer: Mission Control → PitWall OS → Decision Layer → Prediction & Output.
 * All paths verified against 15-race-command-center/frontend/src/routes.tsx (serves from root).
 */
export const RACE_COMMAND_CENTER: ServiceDef = {
  id: 'race-command-center',
  label: 'Race Command Center',
  description: 'Dedicated operational preview for PitWall OS, AI Copilot, telemetry, strategy, simulation and debrief.',
  baseUrl: import.meta.env.VITE_RACE_COMMAND_CENTER_URL ?? "https://czdpamk9.insforge.site",
  status: 'preview',
  defaultParams: {
    node: 'demo-ruben',
    bike: 'yamaha-r1',
    circuit: 'mugello',
    mode: 'preview',
  },
  badge: 'PREVIEW',
  healthPath: '/status.json',
  serviceKind: 'race-command-center',
  capabilities: {
    sessionLaunch: 'available',
    pitWall: 'available',
    aiCopilot: 'preview',
    telemetry: 'demo',
    digitalTwin: 'preview',
    reports: 'available',
  },
  routes: [
    // Mission Control
    { id: 'launch', label: 'Mission Control', path: '/launch', description: 'Session launch wizard', layer: 'Mission Control' },
    // PitWall OS
    { id: 'pitwall', label: 'PitWall Cockpit', path: '/pitwall', description: 'Operational cockpit', layer: 'PitWall OS' },
    { id: 'telemetry', label: 'Live Telemetry', path: '/telemetry', description: 'Real-time telemetry', layer: 'PitWall OS' },
    { id: 'circuit', label: 'Circuit Intelligence', path: '/circuit', description: 'Circuit analysis', layer: 'PitWall OS' },
    { id: 'tires', label: 'Tyre / Grip', path: '/tires', description: 'Tyre degradation', layer: 'PitWall OS' },
    { id: 'setup', label: 'Setup Management', path: '/setup', description: 'Bike setup', layer: 'PitWall OS' },
    { id: 'parts', label: 'Parts Design', path: '/parts', description: 'Component design & iteration', layer: 'PitWall OS' },
    { id: 'pre-gp', label: 'Pre Grand Prix', path: '/pre-gp', description: 'Pre-race preparation', layer: 'PitWall OS' },
    // Decision Layer
    { id: 'crew-chief', label: 'Crew Chief', path: '/crew-chief', description: 'Crew recommendations', layer: 'Decision Layer' },
    { id: 'strategy', label: 'Race Strategy', path: '/strategy', description: 'Strategy command', layer: 'Decision Layer' },
    { id: 'copilot', label: 'AI Copilot', path: '/copilot', description: 'AI assistant', layer: 'Decision Layer' },
    // Prediction & Output
    { id: 'digital-twin', label: 'Digital Twin', path: '/digital-twin', description: 'Simulation engine', layer: 'Prediction & Output' },
    { id: 'reports', label: 'Reports / Debrief', path: '/reports', description: 'Session reports', layer: 'Prediction & Output' },
  ],
};

/** All registered external services */
export const SERVICE_REGISTRY: ServiceDef[] = [
  RACE_COMMAND_CENTER,
];

export function getServiceDef(id: string): ServiceDef | undefined {
  return SERVICE_REGISTRY.find(s => s.id === id);
}

/**
 * Feature flag for Race Command Center preview.
 * Defaults to true (enabled) — set VITE_ENABLE_RACE_COMMAND_CENTER_PREVIEW=false to disable.
 */
export const RACE_COMMAND_CENTER_ENABLED =
  import.meta.env.VITE_ENABLE_RACE_COMMAND_CENTER_PREVIEW !== 'false';
