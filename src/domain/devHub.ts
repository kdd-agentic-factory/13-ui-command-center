/**
 * devHub.ts — KDD Open Motorsport Protocol & Plugin Ecosystem.
 *
 * Turns KDD from a closed app into an extensible platform: a common data schema,
 * official connectors, a typed plugin ecosystem with trust levels + sandbox, an
 * SDK/API surface, an integration health center and a marketplace.
 *
 *   KDD doesn't just analyse your data — it lets you build a whole intelligence
 *   ecosystem on top of it.
 *
 * Deterministic catalogue. Honest: this is the protocol surface + a curated
 * plugin/connector catalogue, not a live package registry.
 */

export type ConnectorStatus = 'Healthy' | 'Warning' | 'Offline' | 'Manual';
export interface Connector { name: string; status: ConnectorStatus; channels: string; confidence: number; note: string }

export type PluginType = 'Data connector' | 'Visualization' | 'AI model' | 'Event detector' | 'Report' | 'Simulation' | 'Coach';
export type TrustLevel = 'verified' | 'team-private' | 'analysis' | 'sandbox';
export interface Plugin {
  id: string; name: string; type: PluginType; version: string; trust: TrustLevel;
  permissions: { read: boolean; createEvents: boolean; recommend: boolean; exportRaw: boolean };
  installed: boolean;
}

export interface ApiEndpoint { method: string; path: string; desc: string }
export interface SchemaField { field: string; type: string; required: boolean }
export interface SandboxRun { plugin: string; dataset: string; events: number; falsePositives: number; runtimeMs: number; status: string }
export interface MarketplaceItem { name: string; category: string; trust: TrustLevel; installed: boolean }

export interface DevHub {
  combo: string;
  installedPlugins: number; verifiedPlugins: number; privatePlugins: number; integrationHealth: number;
  schema: SchemaField[];
  sampleSchemaJson: Record<string, unknown>;
  connectors: Connector[];
  plugins: Plugin[];
  apis: ApiEndpoint[];
  sdks: string[];
  sandbox: SandboxRun;
  marketplace: MarketplaceItem[];
  trustLevels: { level: string; desc: string }[];
  pluginFlow: string[];
  manifestSample: Record<string, unknown>;
}

const CONN_COLOR: Record<ConnectorStatus, string> = {
  Healthy: 'var(--green)', Warning: 'var(--yellow)', Offline: 'var(--accent)', Manual: 'var(--text-muted)',
};
export function connColor(s: ConnectorStatus): string { return CONN_COLOR[s]; }
const TRUST_COLOR: Record<TrustLevel, string> = {
  verified: 'var(--green)', 'team-private': 'var(--violet)', analysis: 'var(--cyan)', sandbox: 'var(--yellow)',
};
export function trustColor(t: TrustLevel): string { return TRUST_COLOR[t]; }

export function buildDevHub(rider: string, bike: string, circuit: string): DevHub {
  return {
    combo: `${rider} · ${bike} · ${circuit}`,
    installedPlugins: 12, verifiedPlugins: 7, privatePlugins: 3, integrationHealth: 92,
    schema: [
      { field: 'session_id', type: 'string', required: true },
      { field: 'timestamp', type: 'ISO8601', required: true },
      { field: 'distance_m', type: 'number', required: true },
      { field: 'speed_kmh', type: 'number', required: true },
      { field: 'corner_id', type: 'string', required: false },
      { field: 'phase', type: 'enum', required: false },
      { field: 'lean_deg', type: 'number', required: false },
      { field: 'rear_slip_pct', type: 'number', required: false },
      { field: 'confidence', type: 'number 0–1', required: false },
      { field: 'source', type: 'string', required: false },
    ],
    sampleSchemaJson: {
      session_id: 'mugello_stint03', rider_id: 'ruben_juarez', bike_id: 'yamaha_r1_2024',
      circuit_id: 'mugello_gp', timestamp: '2026-06-15T14:32:08.430Z', lap: 4, distance_m: 4982.4,
      corner_id: 't15_bucine', phase: 'exit',
      channels: { speed_kmh: 184, rpm: 13200, gear: 4, throttle_pct: 62, brake_pct: 0, lean_deg: 57, rear_slip_pct: 14 },
      confidence: 0.91, source: 'edge_hub',
    },
    connectors: [
      { name: 'AiM', status: 'Healthy', channels: 'Speed/RPM/Gear/Throttle/Brake/GPS/Lean', confidence: 94, note: 'Tyre pressure unavailable; video sync manual w/o camera metadata' },
      { name: '2D', status: 'Healthy', channels: 'CSV / native export', confidence: 90, note: 'CAN mapping per template' },
      { name: 'MoTeC', status: 'Healthy', channels: 'i2 / ld export', confidence: 88, note: '—' },
      { name: 'RaceCapture', status: 'Healthy', channels: 'CSV / live', confidence: 85, note: '—' },
      { name: 'GoPro', status: 'Warning', channels: 'Video + metadata', confidence: 70, note: 'Timestamp drift detected — run Time Sync Studio' },
      { name: 'Weather station', status: 'Offline', channels: 'Air/track temp, wind, humidity', confidence: 0, note: 'No connection' },
      { name: 'Tyre pressure', status: 'Manual', channels: 'Hot/cold pressure', confidence: 60, note: 'Manual entry mode' },
      { name: 'Smartwatch / HR', status: 'Healthy', channels: 'Heart rate, HRV', confidence: 80, note: 'Wearable, estimated' },
    ],
    plugins: [
      { id: 'chatter', name: 'Front Chatter Detector', type: 'Event detector', version: '1.0.0', trust: 'verified', permissions: { read: true, createEvents: true, recommend: false, exportRaw: false }, installed: true },
      { id: 'reargrip', name: 'Rear Grip Predictor', type: 'AI model', version: '0.3', trust: 'sandbox', permissions: { read: true, createEvents: true, recommend: false, exportRaw: false }, installed: true },
      { id: 'tyremodel', name: 'Private Tyre Model', type: 'AI model', version: '2.1', trust: 'team-private', permissions: { read: true, createEvents: false, recommend: true, exportRaw: false }, installed: true },
      { id: 'throttlecoach', name: 'Throttle Smoothness Coach', type: 'Coach', version: '1.2', trust: 'analysis', permissions: { read: true, createEvents: true, recommend: true, exportRaw: false }, installed: true },
      { id: 'heatmap', name: 'Advanced Heatmap', type: 'Visualization', version: '1.0', trust: 'verified', permissions: { read: true, createEvents: false, recommend: false, exportRaw: false }, installed: false },
      { id: 'academyreport', name: 'Academy Report', type: 'Report', version: '1.4', trust: 'verified', permissions: { read: true, createEvents: false, recommend: false, exportRaw: false }, installed: false },
    ],
    apis: [
      { method: 'POST', path: '/api/v1/telemetry/live', desc: 'Ingest TelemetrySample[] → trust score + warnings' },
      { method: 'WS', path: '/api/v1/telemetry/stream', desc: 'Live telemetry stream (edge / sim / external)' },
      { method: 'POST', path: '/api/v1/events', desc: 'Create a KDD-compatible event from an external model' },
      { method: 'GET', path: '/api/v1/features', desc: 'Query the feature store (circuit/bike/corner/phase)' },
      { method: 'GET', path: '/api/v1/sessions/{id}', desc: 'Session metadata + sensors + events' },
      { method: 'POST', path: '/api/v1/oracle/query', desc: 'Ask the Oracle for a grounded verdict' },
    ],
    sdks: ['Python', 'TypeScript', 'REST', 'WebSocket', 'Edge Hub SDK'],
    sandbox: { plugin: 'Rear Grip Predictor v0.3', dataset: 'Mugello demo session', events: 12, falsePositives: 2, runtimeMs: 34, status: 'Safe for replay analysis · not approved for live alerts yet' },
    marketplace: [
      { name: 'AiM Importer', category: 'Connector', trust: 'verified', installed: true },
      { name: 'GoPro Sync', category: 'Connector', trust: 'verified', installed: true },
      { name: 'Front Chatter Detector', category: 'Analysis', trust: 'verified', installed: true },
      { name: 'Ghost Lap Studio', category: 'Visualization', trust: 'verified', installed: false },
      { name: 'Race Engineer Report', category: 'Report', trust: 'verified', installed: false },
      { name: 'Rear Grip Predictor', category: 'AI model', trust: 'sandbox', installed: true },
    ],
    trustLevels: [
      { level: 'Sandbox', desc: 'Demo data only.' },
      { level: 'Read-only', desc: 'Reads sessions, modifies nothing.' },
      { level: 'Analysis', desc: 'Generates insights and events.' },
      { level: 'Decision-support', desc: 'Proposes recommendations (no setup/safety changes).' },
      { level: 'Verified', desc: 'Reviewed and signed by KDD.' },
      { level: 'Team-private', desc: 'Visible only to one team.' },
    ],
    pluginFlow: ['Plugin detects rear instability', 'Event Store records it', 'Causal Engine evaluates cause', 'Oracle issues recommendation', 'Orchestrator creates mission', 'Experiment Engine validates', 'Knowledge Graph stores learning'],
    manifestSample: {
      plugin_id: 'front_chatter_detector', name: 'Front Chatter Detector', version: '1.0.0', type: 'event_detector',
      required_channels: ['brake_pressure', 'fork_acceleration', 'speed_kmh', 'lean_deg'],
      outputs: ['front_chatter_event'],
      permissions: { read_telemetry: true, create_events: true, create_recommendations: false, export_raw_data: false },
      trust_level: 'verified',
    },
  };
}
