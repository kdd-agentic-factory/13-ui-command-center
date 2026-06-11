/**
 * circuits.ts — Circuit database + validation logic for the Circuit
 * Intelligence Gate.
 *
 * The gate is the mandatory technical entry to the platform: no dashboard
 * opens until a circuit is selected and validated (or explicitly opened in a
 * degraded mode). This module is the single source of truth for:
 *   - the circuit library (seeded in-memory; mirrors the future backend table)
 *   - circuit lifecycle states (READY / PARTIAL / SIMULATED / NEEDS_REVIEW / INVALID)
 *   - the pre-dashboard validation checklist
 *   - the dashboard mode derived from the circuit state (full / limited /
 *     simulation / blocked)
 *   - the active-circuit session store (selectedCircuit)
 */
import { MUGELLO_CIRCUIT } from './sessionTruth';

// ── Types ─────────────────────────────────────────────────────────────────────

export type CircuitStatus = 'READY' | 'PARTIAL' | 'SIMULATED' | 'NEEDS_REVIEW' | 'INVALID';

export type DashboardMode = 'full' | 'limited' | 'simulation' | 'blocked';

export interface KeyZone {
  corner: string;
  note: string;
}

export interface CircuitRecord {
  id: string;
  name: string;
  country: string;
  layout: string;
  lengthKm: number;
  turns: number;
  direction: 'clockwise' | 'counter-clockwise';
  sectors: number;
  mainStraightKm: number | null;
  geometryLoaded: boolean;
  elevationModel: 'active' | 'estimated' | 'missing';
  cornerSetLoaded: number;       // corners with metadata
  sectorMapLoaded: boolean;
  meshLoaded: boolean;
  gpsAlignment: 'ready' | 'pending' | 'missing';
  telemetrySessions: string[];   // e.g. ['FP1','FP2','Race simulation']
  digitalTwinReady: boolean;
  agentContextReady: boolean;
  agentConfidence: number;       // 0..1
  status: CircuitStatus;
  statusSummary: string;
  keyZones: KeyZone[];
  source: 'verified' | 'gps-trace' | 'ai-reconstruction' | 'manual';
  lastValidated: string;         // ISO date
}

export interface ValidationCheck {
  label: string;
  ok: boolean;
  desc: string;
}

// ── Status presentation ───────────────────────────────────────────────────────

export const STATUS_META: Record<CircuitStatus, { color: string; badge: string; desc: string }> = {
  READY:        { color: 'var(--green)',  badge: 'badge-green',  desc: 'Everything validated.' },
  PARTIAL:      { color: 'var(--yellow)', badge: 'badge-yellow', desc: 'Missing elevation, sectors or telemetry.' },
  SIMULATED:    { color: '#A78BFA',       badge: 'badge-blue',   desc: 'AI-built from incomplete data.' },
  NEEDS_REVIEW: { color: '#FB923C',       badge: 'badge-yellow', desc: 'Requires manual engineer validation.' },
  INVALID:      { color: 'var(--accent)', badge: 'badge-red',    desc: 'Cannot be used yet.' },
};

// ── Seed library ──────────────────────────────────────────────────────────────

const MUGELLO: CircuitRecord = {
  id: MUGELLO_CIRCUIT.id,
  name: MUGELLO_CIRCUIT.shortName,
  country: MUGELLO_CIRCUIT.country,
  layout: 'GP',
  lengthKm: MUGELLO_CIRCUIT.lengthKm,
  turns: MUGELLO_CIRCUIT.turns,
  direction: 'clockwise',
  sectors: 3,
  mainStraightKm: MUGELLO_CIRCUIT.mainStraightKm,
  geometryLoaded: true,
  elevationModel: 'active',
  cornerSetLoaded: MUGELLO_CIRCUIT.turns,
  sectorMapLoaded: true,
  meshLoaded: true,
  gpsAlignment: 'ready',
  telemetrySessions: ['FP1', 'FP2', 'FP3', 'Q2', 'Race simulation'],
  digitalTwinReady: true,
  agentContextReady: true,
  agentConfidence: 0.98,
  status: 'READY',
  statusSummary: `${MUGELLO_CIRCUIT.lengthKm} km · ${MUGELLO_CIRCUIT.turns} turns · 3 sectors · elevation active · telemetry loaded`,
  keyZones: [
    { corner: 'T1 San Donato', note: 'heavy braking' },
    { corner: 'T3 Poggio Secco', note: 'elevation crest' },
    { corner: 'T8/T9 Arrabbiata', note: 'high-speed lean load' },
    { corner: 'T12 Correntaio', note: 'braking stability' },
    { corner: 'T15 Bucine', note: 'exit onto main straight' },
  ],
  source: 'verified',
  lastValidated: '2026-06-10',
};

function partial(over: Partial<CircuitRecord> & Pick<CircuitRecord, 'id' | 'name' | 'country' | 'lengthKm' | 'turns'>): CircuitRecord {
  return {
    layout: 'GP',
    direction: 'clockwise',
    sectors: 3,
    mainStraightKm: null,
    geometryLoaded: true,
    elevationModel: 'missing',
    cornerSetLoaded: 0,
    sectorMapLoaded: false,
    meshLoaded: false,
    gpsAlignment: 'pending',
    telemetrySessions: [],
    digitalTwinReady: false,
    agentContextReady: false,
    agentConfidence: 0.6,
    status: 'PARTIAL',
    statusSummary: 'geometry loaded · elevation missing',
    keyZones: [],
    source: 'verified',
    lastValidated: '2026-05-20',
    ...over,
  };
}

const SEED: CircuitRecord[] = [
  MUGELLO,
  partial({
    id: 'jarama', name: 'Jarama', country: 'Spain', lengthKm: 3.850, turns: 13,
    cornerSetLoaded: 13, sectorMapLoaded: true, elevationModel: 'active',
    telemetrySessions: ['Track day 2026-04', 'Test session'], digitalTwinReady: true,
    agentContextReady: true, agentConfidence: 0.93, status: 'READY',
    statusSummary: '3.850 km · 13 turns · geometry loaded · telemetry loaded',
    keyZones: [
      { corner: 'T1 Nuvolari', note: 'downhill braking' },
      { corner: 'T7 Bugatti', note: 'double apex' },
      { corner: 'T13 Portago', note: 'exit onto main straight' },
    ],
    lastValidated: '2026-06-01',
  }),
  partial({ id: 'jerez', name: 'Jerez', country: 'Spain', lengthKm: 4.423, turns: 13, statusSummary: 'geometry loaded · elevation missing' }),
  partial({ id: 'montmelo', name: 'Montmeló', country: 'Spain', lengthKm: 4.657, turns: 14, statusSummary: 'geometry loaded · elevation missing' }),
  partial({ id: 'portimao', name: 'Portimão', country: 'Portugal', lengthKm: 4.592, turns: 15, statusSummary: 'geometry loaded · elevation missing · heavy gradients pending' }),
  partial({ id: 'misano', name: 'Misano', country: 'Italy', lengthKm: 4.226, turns: 16, statusSummary: 'geometry loaded · corner metadata pending' }),
  partial({ id: 'aragon', name: 'MotorLand Aragón', country: 'Spain', lengthKm: 5.077, turns: 17, statusSummary: 'geometry loaded · sectors pending' }),
  partial({ id: 'valencia', name: 'Valencia', country: 'Spain', lengthKm: 4.005, turns: 14, direction: 'counter-clockwise', statusSummary: 'geometry loaded · elevation missing' }),
  partial({ id: 'assen', name: 'Assen', country: 'Netherlands', lengthKm: 4.542, turns: 18, statusSummary: 'geometry loaded · elevation missing' }),
  {
    ...partial({ id: 'custom-01', name: 'Custom Track 01', country: '—', lengthKm: 3.21, turns: 11 }),
    status: 'SIMULATED', source: 'ai-reconstruction', agentConfidence: 0.82,
    statusSummary: 'GPS trace loaded · AI-generated corners',
    cornerSetLoaded: 11, elevationModel: 'estimated', gpsAlignment: 'ready',
  },
];

// In-memory library (mirrors the future circuits table; created circuits are
// appended here for the session).
const library: CircuitRecord[] = [...SEED];

export function getCircuitLibrary(): CircuitRecord[] {
  return library;
}

export function addCircuit(record: CircuitRecord): void {
  library.unshift(record);
}

// ── Validation checklist (spec §4) ───────────────────────────────────────────

export function buildValidationChecklist(c: CircuitRecord): ValidationCheck[] {
  return [
    { label: 'Geometry loaded', ok: c.geometryLoaded, desc: c.geometryLoaded ? `${c.layout} layout` : 'No closed-lap geometry' },
    { label: 'Lap length valid', ok: c.lengthKm > 1 && c.lengthKm < 10, desc: `${c.lengthKm.toFixed(3)} km` },
    { label: 'Corner set loaded', ok: c.cornerSetLoaded >= c.turns, desc: `${c.cornerSetLoaded} / ${c.turns}` },
    { label: 'Sector map loaded', ok: c.sectorMapLoaded, desc: c.sectorMapLoaded ? `${c.sectors} / ${c.sectors}` : 'Sectors pending' },
    { label: 'Elevation model', ok: c.elevationModel !== 'missing', desc: c.elevationModel },
    { label: 'GPS alignment', ok: c.gpsAlignment === 'ready', desc: c.gpsAlignment },
    { label: 'Telemetry compatibility', ok: c.telemetrySessions.length > 0, desc: c.telemetrySessions.length ? c.telemetrySessions.join(' · ') : 'No sessions loaded' },
    { label: 'Digital twin ready', ok: c.digitalTwinReady, desc: c.digitalTwinReady ? 'Baseline simulation available' : 'Twin not built' },
    { label: 'Agent knowledge loaded', ok: c.agentContextReady, desc: c.agentContextReady ? 'Circuit intelligence in context' : 'Agents need a validation stint' },
  ];
}

// ── Dashboard mode (spec §14) ─────────────────────────────────────────────────

export function dashboardMode(status: CircuitStatus): DashboardMode {
  switch (status) {
    case 'READY': return 'full';
    case 'PARTIAL': return 'limited';
    case 'SIMULATED': return 'simulation';
    case 'NEEDS_REVIEW': return 'simulation';
    case 'INVALID': return 'blocked';
  }
}

export const MODE_META: Record<DashboardMode, { label: string; note: string; color: string }> = {
  full:       { label: 'Full Dashboard',       note: 'All modules available.', color: 'var(--green)' },
  limited:    { label: 'Limited Dashboard',    note: 'Basic telemetry and 2D maps available. 3D, corner intelligence and advanced predictions locked until the circuit is completed.', color: 'var(--yellow)' },
  simulation: { label: 'Simulation Dashboard', note: 'Predictions are AI-estimated. Validate with real data before race decisions.', color: '#A78BFA' },
  blocked:    { label: 'Dashboard Blocked',    note: 'Closed-lap geometry missing. Complete circuit validation first.', color: 'var(--accent)' },
};

// ── Active circuit session store (single source of truth) ────────────────────

let activeCircuit: CircuitRecord | null = null;

export function setActiveCircuit(c: CircuitRecord): void {
  activeCircuit = c;
}

/** The circuit the session is locked to. Defaults to Mugello (READY seed). */
export function getActiveCircuit(): CircuitRecord {
  return activeCircuit ?? MUGELLO;
}

export function getActiveDashboardMode(): DashboardMode {
  return dashboardMode(getActiveCircuit().status);
}

// ── AI reconstruction agents (spec §6/§13) ───────────────────────────────────

export interface ReconstructionAgent {
  name: string;
  task: string;
  finding: (name: string, lengthKm: number, turns: number) => string;
}

export const RECONSTRUCTION_AGENTS: ReconstructionAgent[] = [
  { name: 'Track Geometry Agent', task: 'Rebuild closed-lap geometry from GPS/GPX/KML/CSV', finding: (_n, l) => `Detected closed lap · ${l.toFixed(3)} km` },
  { name: 'Corner Detection Agent', task: 'Detect corners, radii, brake zones, apexes and exits', finding: (_n, _l, t) => `Detected ${t} corners` },
  { name: 'Sector Builder Agent', task: 'Propose sectors by performance logic', finding: () => 'Suggested 3 sectors' },
  { name: 'Elevation & Gradient Agent', task: 'Build 3D profile, gradients and compression zones', finding: () => 'No elevation file uploaded · estimated from map data' },
  { name: 'Racing Line Agent', task: 'Generate the initial ideal line', finding: () => 'Generated first reference line from GPS trace' },
  { name: 'Telemetry Alignment Agent', task: 'Synchronise GPS, IMU, ECU and video streams', finding: () => 'Alignment grid prepared · awaiting first stint' },
  { name: 'Digital Twin Agent', task: 'Create baseline lap-time, tyre and pace simulation', finding: () => 'Created baseline simulation' },
  { name: 'Safety Guardian', task: 'Detect preliminary risk zones', finding: () => 'Detected 3 preliminary risk zones' },
  { name: 'Setup Baseline Agent', task: 'Propose an initial setup for the selected bike', finding: () => 'Baseline: Medium front · Soft rear · TC4 · EB3' },
];

/** Initial simulation generated for a newly created circuit (spec §7). */
export interface InitialSimulation {
  lapWindow: string;
  performanceZones: string[];
  riskZones: string[];
  baselineSetup: string[];
  recommendedStint: string;
}

export function buildInitialSimulation(lengthKm: number): InitialSimulation {
  const base = 60 + lengthKm * 21; // crude s/km heuristic for a window
  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;
  return {
    lapWindow: `${fmt(base)} – ${fmt(base + 4.5)}`,
    performanceZones: ['T1 heavy braking', 'Mid-sector long right-hander', 'Exit onto back straight'],
    riskZones: ['Blind entry detected', 'Off-camber exit detected', 'Braking over bump detected'],
    baselineSetup: ['Medium front · Soft rear', 'TC4', 'Engine brake EB3', 'Rear rebound +1 click slower'],
    recommendedStint: '5 laps — validate GPS alignment, corner detection and tyre load.',
  };
}
