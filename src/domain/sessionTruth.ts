export const SESSION_PHASE = {
  PRE_RACE_TEST: 'pre-race-test',
  RACE: 'race',
} as const;

export type SessionPhase = (typeof SESSION_PHASE)[keyof typeof SESSION_PHASE];

export const CIRCUIT_ASSET_STATUS = {
  PROCEDURAL_SIMPLIFIED: 'procedural-simplified',
  REAL_ASSET_LOADED: 'real-asset-loaded',
} as const;

export type CircuitAssetStatus = (typeof CIRCUIT_ASSET_STATUS)[keyof typeof CIRCUIT_ASSET_STATUS];

export interface MugelloCircuitTruth {
  id: string;
  shortName: string;
  fullName: string;
  country: string;
  round: number;
  season: number;
  seasonRounds: number;
  lengthKm: number;
  turns: number;
  leftTurns: number;
  rightTurns: number;
  mainStraightKm: number;
  highSpeedKmh: number;
  raceLaps: number;
  typicalLapSeconds: number;
  recordLap: string;
  recordHolder: string;
  recordYear: number;
  fuelCapacityKg: number;
  fuelBurnKgPerLap: number;
  assetStatus: CircuitAssetStatus;
  assetStatusLabel: string;
}

export interface RaceSessionTruth {
  productName: string;
  positioning: string;
  decisionPromise: string;
  activeCircuitId: string;
}

export interface SessionDisplayState {
  phase: SessionPhase;
  activeRace: boolean;
  badgeLabel: string;
  badgeClass: string;
  flagLabel: string;
  lapLabel: string;
  lapValue: string;
}

export interface GearDistributionBin {
  gear: number;
  pct: number;
  active: boolean;
}

export interface IntegrityCheck {
  label: string;
  ok: boolean;
  desc: string;
}

export interface IntegrityInput {
  lapCount: number;
  fuelValid: boolean;
  lastLapValid: boolean;
  bestLapValid: boolean;
  lapAnomaly: boolean;
  sectorDeltasValidated: boolean;
  gearDistributionTotalPct: number;
  selectedCircuitId: string;
}

export const MUGELLO_CIRCUIT: MugelloCircuitTruth = {
  id: 'mugello',
  shortName: 'Mugello',
  fullName: 'Autodromo Internazionale del Mugello',
  country: 'Italy',
  round: 7,
  season: 2026,
  seasonRounds: 20,
  lengthKm: 5.245,
  turns: 15,
  leftTurns: 6,
  rightTurns: 9,
  mainStraightKm: 1.141,
  highSpeedKmh: 350,
  raceLaps: 23,
  typicalLapSeconds: 105.0,
  recordLap: '1:44.169',
  recordHolder: 'M. Marquez',
  recordYear: 2025,
  fuelCapacityKg: 22.0,
  fuelBurnKgPerLap: 0.95,
  assetStatus: CIRCUIT_ASSET_STATUS.PROCEDURAL_SIMPLIFIED,
  assetStatusLabel: 'Procedural simplified map — no official SVG/mesh asset loaded',
};

export const RACE_SESSION: RaceSessionTruth = {
  productName: 'KDD Moto Intelligence',
  positioning: 'AI Motorcycle Telemetry & Rider Performance',
  decisionPromise: 'Actionable race decisions first; telemetry explains the call.',
  activeCircuitId: MUGELLO_CIRCUIT.id,
};

export function sessionDisplayState(lapCount: number): SessionDisplayState {
  if (lapCount < 1) {
    return {
      phase: SESSION_PHASE.PRE_RACE_TEST,
      activeRace: false,
      badgeLabel: 'PRE-RACE TEST',
      badgeClass: 'badge-yellow',
      flagLabel: 'PIT-LANE TELEMETRY',
      lapLabel: 'STATE',
      lapValue: 'Pre-race',
    };
  }

  return {
    phase: SESSION_PHASE.RACE,
    activeRace: true,
    badgeLabel: 'RACE IN PROGRESS',
    badgeClass: 'badge-red',
    flagLabel: 'GREEN FLAG',
    lapLabel: 'LAP',
    lapValue: `${lapCount}/${MUGELLO_CIRCUIT.raceLaps}`,
  };
}

export function validRaceLap(lapCount: number): boolean {
  return lapCount >= 1 && lapCount <= MUGELLO_CIRCUIT.raceLaps;
}

export function buildGearDistribution(currentGear: number): GearDistributionBin[] {
  const base = [4, 8, 22, 32, 20, 14];
  const raw = base.map((value, index) => Math.max(0.5, value + (index + 1 === currentGear ? 4 : 0)));
  const total = raw.reduce((sum, value) => sum + value, 0);
  return raw.map((value, index) => ({
    gear: index + 1,
    pct: (value / total) * 100,
    active: index + 1 === currentGear,
  }));
}

export function gearDistributionTotalPct(distribution: GearDistributionBin[]): number {
  return distribution.reduce((sum, bin) => sum + bin.pct, 0);
}

export function buildRaceDataIntegrity(input: IntegrityInput): IntegrityCheck[] {
  const gearTotalOk = Math.abs(input.gearDistributionTotalPct - 100) <= 0.05;
  const activeCircuitOk = input.selectedCircuitId === RACE_SESSION.activeCircuitId;
  const geometryProcedural = MUGELLO_CIRCUIT.assetStatus === CIRCUIT_ASSET_STATUS.PROCEDURAL_SIMPLIFIED;

  return [
    {
      label: 'Current lap valid',
      ok: validRaceLap(input.lapCount) || input.lapCount === 0,
      desc: validRaceLap(input.lapCount) ? `${input.lapCount}/${MUGELLO_CIRCUIT.raceLaps}` : 'Pre-race/test state',
    },
    {
      label: 'Fuel model synchronized',
      ok: input.fuelValid,
      desc: input.fuelValid ? `${MUGELLO_CIRCUIT.fuelBurnKgPerLap} kg/lap model` : 'Fuel channel out of range',
    },
    {
      label: 'Track geometry loaded/procedural',
      ok: geometryProcedural,
      desc: MUGELLO_CIRCUIT.assetStatusLabel,
    },
    {
      label: 'Sector deltas validated',
      ok: input.sectorDeltasValidated,
      desc: input.sectorDeltasValidated ? 'S1/S2/S3 bounded and derived' : 'Sector deltas unavailable',
    },
    {
      label: 'Gear distribution equals 100%',
      ok: gearTotalOk,
      desc: `${input.gearDistributionTotalPct.toFixed(2)}%`,
    },
    {
      label: 'No circuit mismatch',
      ok: activeCircuitOk,
      desc: activeCircuitOk ? 'Mugello session truth active' : 'Non-Mugello circuit is not loaded for this session',
    },
    {
      label: 'Last lap time',
      ok: input.lastLapValid,
      desc: input.lastLapValid ? 'Within MotoGP range' : 'Invalid',
    },
    {
      label: 'Best lap time',
      ok: input.bestLapValid,
      desc: input.bestLapValid ? 'Within MotoGP range' : 'Invalid',
    },
    {
      label: 'Lap anomaly',
      ok: !input.lapAnomaly,
      desc: input.lapAnomaly ? 'Flagged' : 'Clean',
    },
  ];
}
