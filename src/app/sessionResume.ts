import { getCircuitLibrary, type CircuitRecord } from '../domain/circuits';
import { buildGarageProfile, BIKES, RIDERS, type GarageProfile } from '../domain/garageProfile';
import { buildSessionContext, modeDef, type DataMode, type SessionContext, type SessionMode } from '../domain/sessionContext';

export interface PersistedSessionContextRow {
  circuit_id: string;
  session_mode: SessionMode;
  data_mode: DataMode;
  dashboard_profile: string;
  pit_strategy_enabled: boolean;
  demo_mode: boolean;
  setup: Record<string, string> | null;
}

export interface SessionResumeSnapshot {
  stage: 'mission';
  sessionCtx: SessionContext;
  gateCircuit: CircuitRecord | null;
  garageProfile: GarageProfile | null;
}

function resolveCircuit(circuitId: string): CircuitRecord | null {
  return getCircuitLibrary().find(circuit => circuit.id === circuitId) ?? null;
}

function resolveGarageProfile(setup: Record<string, string>, circuitId: string): GarageProfile | null {
  const riderName = setup.rider?.trim().toLowerCase();
  const bikeLabel = setup.bike?.trim().toLowerCase();

  const rider = riderName
    ? RIDERS.find(candidate => candidate.name.toLowerCase() === riderName)
    : undefined;
  const bike = bikeLabel
    ? BIKES.find(candidate => `${candidate.brand} ${candidate.model}`.toLowerCase() === bikeLabel)
    : undefined;

  if (!rider || !bike) return null;
  return buildGarageProfile(rider, bike, circuitId);
}

export function buildSessionResumeSnapshot(row: PersistedSessionContextRow): SessionResumeSnapshot {
  const gateCircuit = resolveCircuit(row.circuit_id);
  const circuitName = gateCircuit?.name ?? row.circuit_id;
  const setup = row.setup ?? {};
  const sessionCtx = buildSessionContext(row.circuit_id, circuitName, row.session_mode, setup);
  const mode = modeDef(row.session_mode);

  return {
    stage: 'mission',
    sessionCtx: {
      ...sessionCtx,
      dataMode: row.data_mode,
      dashboardProfile: row.dashboard_profile,
      pitStrategyEnabled: row.pit_strategy_enabled,
      demoMode: row.demo_mode,
      badge: mode.badge,
      badgeColor: mode.badgeColor,
    },
    gateCircuit,
    garageProfile: resolveGarageProfile(setup, row.circuit_id),
  };
}
