/**
 * garageProfile.ts — the Garage Profile Gate domain.
 *
 * KDD does not analyse a generic lap; it analyses a concrete combination:
 * rider + bike + circuit + setup + tyres. This gate (between Circuit and
 * Mode) picks that combination and reports how trustworthy the analysis can
 * be — FULL / PARTIAL / GENERIC / NEW / GPS-ONLY — so the dashboard never
 * fakes precision it doesn't have.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RiderProfile {
  id: string;
  name: string;
  level: string;
  archetype: string;
  consistency: number;       // %
  riskTendency: 'Low' | 'Medium' | 'High';
  hasStyleDNA: boolean;      // Rider Style DNA available
  limiters: string[];
}

export interface BikeProfile {
  id: string;
  brand: string;
  model: string;
  category: string;
  engine: string;
  electronics: string[];
  telemetry: 'full' | 'gps-only';   // ECU/IMU/GPS vs GPS only
  hasSetupBaseline: boolean;
  generic: boolean;                  // generic category model vs specific
}

export interface TyreSet {
  manufacturer: string;
  front: 'SOFT' | 'MEDIUM' | 'HARD';
  rear: 'SOFT' | 'MEDIUM' | 'HARD';
  hotFront: number;   // bar
  hotRear: number;    // bar
}

export interface SetupBaseline {
  id: string;
  label: string;
  tc: number;
  engineBrake: string;
  powerMap: string;
  rearRebound: number;     // clicks
  available: boolean;
  why: string;
}

export type ReadinessStatus = 'READY' | 'PARTIAL' | 'GENERIC' | 'NEW' | 'GPS-ONLY';

export interface GarageProfile {
  rider: RiderProfile;
  bike: BikeProfile;
  tyres: TyreSet;
  setup: SetupBaseline;
  circuitId: string;
  compatibility: number;   // 0..100
  status: ReadinessStatus;
  sessionsKnown: number;
  reason: string;          // why not FULL (empty when READY)
}

// ── Seed libraries ────────────────────────────────────────────────────────────

export const RIDERS: RiderProfile[] = [
  {
    id: 'ruben_juarez', name: 'Rubén Juárez', level: 'Advanced amateur',
    archetype: 'Point-and-shoot · aggressive entry', consistency: 86,
    riskTendency: 'Medium', hasStyleDNA: true,
    limiters: ['Late throttle pickup', 'Excessive lean at initial throttle', 'Rear grip management'],
  },
  {
    id: 'pg9', name: 'P. García #9', level: 'Racing',
    archetype: 'Flow-and-drive · high corner speed', consistency: 91,
    riskTendency: 'Low', hasStyleDNA: true,
    limiters: ['Conservative braking', 'Late commitment on cold tyres'],
  },
  {
    id: 'kd5', name: 'K. Díaz #5', level: 'Pro',
    archetype: 'Late-brake specialist', consistency: 94,
    riskTendency: 'High', hasStyleDNA: true,
    limiters: ['Front-end risk on entry', 'Tyre wear from aggression'],
  },
];

export const BIKES: BikeProfile[] = [
  {
    id: 'yamaha_r1_2024', brand: 'Yamaha', model: 'R1', category: 'Superbike',
    engine: '998 cc inline-four', electronics: ['TC', 'Engine Brake', 'Power Maps', 'Launch', 'Quickshifter'],
    telemetry: 'full', hasSetupBaseline: true, generic: false,
  },
  {
    id: 'ducati_v4_2024', brand: 'Ducati', model: 'Panigale V4', category: 'Superbike',
    engine: '1103 cc V4', electronics: ['TC', 'Engine Brake', 'Power Maps', 'Launch', 'Quickshifter', 'Slide Control'],
    telemetry: 'full', hasSetupBaseline: true, generic: false,
  },
  {
    id: 'kawasaki_zx10r_2023', brand: 'Kawasaki', model: 'ZX-10R', category: 'Superbike',
    engine: '998 cc inline-four', electronics: ['TC', 'Engine Brake', 'Power Maps', 'Quickshifter'],
    telemetry: 'gps-only', hasSetupBaseline: false, generic: false,
  },
];

const DEFAULT_TYRES: TyreSet = {
  manufacturer: 'Pirelli', front: 'MEDIUM', rear: 'SOFT', hotFront: 2.10, hotRear: 1.90,
};

function baselineFor(bike: BikeProfile, circuitId: string): SetupBaseline {
  if (!bike.hasSetupBaseline) {
    return {
      id: `${bike.id}-generic`, label: `${bike.model} · generic baseline`,
      tc: 5, engineBrake: 'EB3', powerMap: 'MAP-4', rearRebound: 8, available: false,
      why: 'No circuit-specific baseline stored for this bike — using a generic category setup.',
    };
  }
  return {
    id: `${circuitId}-${bike.id}-baseline`,
    label: `${circuitId === 'mugello' ? 'Mugello' : 'Circuit'} · ${bike.model} · Track Day Baseline`,
    tc: 4, engineBrake: 'EB4', powerMap: 'MAP-6', rearRebound: 7, available: true,
    why: `Most stable ${bike.model} configuration recorded at this circuit. Strength: braking stability into T1. Weakness: rear instability at the final corner above 40% throttle at high lean.`,
  };
}

// ── Create rider / bike (no history → NEW / GENERIC by design) ───────────────

export function addRider(name: string, level: string, risk: RiderProfile['riskTendency']): RiderProfile {
  const r: RiderProfile = {
    id: `rider-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now() % 100000}`,
    name: name.trim() || 'New rider', level,
    archetype: 'Style not yet inferred — calibration pending',
    consistency: 0, riskTendency: risk, hasStyleDNA: false,
    limiters: ['Run a calibration stint to build the rider profile'],
  };
  RIDERS.unshift(r);
  return r;
}

export function addBike(brand: string, model: string, telemetry: BikeProfile['telemetry']): BikeProfile {
  const b: BikeProfile = {
    id: `bike-${(brand + '-' + model).toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now() % 100000}`,
    brand: brand.trim() || 'Custom', model: model.trim() || 'Bike', category: 'Custom',
    engine: 'Generic category model',
    electronics: ['TC', 'Engine Brake'], telemetry,
    hasSetupBaseline: false, generic: true,
  };
  BIKES.unshift(b);
  return b;
}

// ── Compatibility / readiness ─────────────────────────────────────────────────

/** How trustworthy is analysis for this rider+bike+circuit combination. */
export function buildGarageProfile(
  rider: RiderProfile, bike: BikeProfile, circuitId: string,
): GarageProfile {
  // Known sessions per concrete combination (explicit history table — only
  // combos we actually have data for are non-zero; everything else is new).
  const KNOWN: Record<string, number> = {
    'ruben_juarez|yamaha_r1_2024|mugello': 3,
    'ruben_juarez|yamaha_r1_2024|jerez': 2,
    'pg9|ducati_v4_2024|mugello': 4,
  };
  const known = KNOWN[`${rider.id}|${bike.id}|${circuitId}`] ?? 0;

  let status: ReadinessStatus = 'READY';
  let reason = '';
  let compat = 92;

  if (bike.telemetry === 'gps-only') {
    status = 'GPS-ONLY'; compat = 58;
    reason = `${bike.model} provides GPS only — ECU/IMU channels unavailable; throttle and RPM are estimated.`;
  } else if (bike.generic) {
    status = 'GENERIC'; compat = 64;
    reason = `${bike.brand} ${bike.model} uses a generic category model — no manufacturer-specific power/electronics curve.`;
  } else if (!rider.hasStyleDNA) {
    status = 'NEW'; compat = 60;
    reason = `No Rider Style DNA for ${rider.name} yet — run a calibration stint to build the profile.`;
  } else if (known === 0) {
    status = 'PARTIAL'; compat = 61;
    reason = `No previous ${circuitId} sessions with ${rider.name} on ${bike.model}. Rider style inferred from other circuits; run a 5-lap calibration stint before trusting advanced predictions.`;
  }

  return {
    rider, bike, tyres: { ...DEFAULT_TYRES }, setup: baselineFor(bike, circuitId),
    circuitId, compatibility: compat, status, sessionsKnown: known, reason,
  };
}

export const READINESS_META: Record<ReadinessStatus, { color: string; label: string }> = {
  'READY':    { color: 'var(--green)',  label: 'Full analysis available' },
  'PARTIAL':  { color: 'var(--yellow)', label: 'Limited — calibration recommended' },
  'GENERIC':  { color: 'var(--yellow)', label: 'Generic bike model' },
  'NEW':      { color: 'var(--violet)', label: 'New rider — learning style' },
  'GPS-ONLY': { color: 'var(--accent)', label: 'GPS-only telemetry' },
};

// ── Bike comparison (side-by-side) ───────────────────────────────────────────

export interface BikeCompareRow {
  bikeId: string; label: string;
  bestLap: string;          // at the given circuit (— if no data)
  rearGripDrop: string;     // % over a race stint
  topSpeed: number;         // km/h on the main straight
  powerClass: string;
  telemetry: string;
  hasData: boolean;
}

// Known best laps per bike+circuit (— when no real session exists).
const BIKE_BEST: Record<string, string> = {
  'yamaha_r1_2024|mugello': '1:57.842',
  'ducati_v4_2024|mugello': '1:57.420',
};
const BIKE_TOPSPEED: Record<string, number> = {
  yamaha_r1_2024: 299, ducati_v4_2024: 305, kawasaki_zx10r_2023: 297,
};

export function compareBikes(circuitId: string): BikeCompareRow[] {
  return BIKES.map(b => {
    const key = `${b.id}|${circuitId}`;
    const best = BIKE_BEST[key];
    return {
      bikeId: b.id, label: `${b.brand} ${b.model}`,
      bestLap: best ?? '—',
      rearGripDrop: best ? (b.engine.includes('V4') ? '15%' : '12%') : '—',
      topSpeed: BIKE_TOPSPEED[b.id] ?? 0,
      powerClass: b.engine.includes('V4') ? 'Very high' : 'High',
      telemetry: b.telemetry === 'full' ? 'ECU·IMU·GPS' : 'GPS only',
      hasData: Boolean(best),
    };
  });
}

// ── Active garage profile store (single source of truth) ─────────────────────

let active: GarageProfile | null = null;
export function setGarageProfile(p: GarageProfile): void { active = p; }
export function getGarageProfile(): GarageProfile | null { return active; }

/** Persist the chosen garage profile to InsForge (audit of the combination
 *  the session opened on). Anonymous sessions stay local — RLS rejects them. */
export async function persistGarageProfile(p: GarageProfile): Promise<void> {
  try {
    const { insforge } = await import('../lib/insforge');
    const { data: user } = await insforge.auth.getCurrentUser();
    const uid = (user as { user?: { id?: string } } | null)?.user?.id;
    if (!uid) return;
    await insforge.database.from('garage_profiles').insert([{
      rider_id: p.rider.id, rider_name: p.rider.name,
      bike_id: p.bike.id, bike_label: `${p.bike.brand} ${p.bike.model}`,
      circuit_id: p.circuitId, status: p.status,
      compatibility: p.compatibility, sessions_known: p.sessionsKnown, created_by: uid,
    }]);
  } catch { /* non-blocking */ }
}
