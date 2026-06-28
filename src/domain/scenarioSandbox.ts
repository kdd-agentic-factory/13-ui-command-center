/**
 * scenarioSandbox.ts — interactive what-if model on top of the digital twin.
 *
 * The engineer moves levers (setup, technique, conditions, stint plan) and
 * sees the predicted lap time, risk, tyre life and an Oracle verdict update
 * live. Pure deterministic model — same levers, same outputs — so a scenario
 * is reproducible and testable.
 */

export interface Levers {
  rearRebound: number;   // clicks vs baseline, -2..+4 (slower = +)
  tc: number;            // steps vs baseline, -2..+3
  trackTempDelta: number;// °C vs baseline 38°C, -10..+10
  rearStintLaps: number; // laps already on the rear soft, 0..18
  earlierThrottle: number; // s earlier on exit, 0..0.5
  rainRisk: number;      // %, 0..100
}

export const DEFAULT_LEVERS: Levers = {
  rearRebound: 0, tc: 0, trackTempDelta: 0, rearStintLaps: 3, earlierThrottle: 0, rainRisk: 10,
};

export interface ScenarioOutput {
  lapTimeS: number;      // projected lap time (seconds)
  lapTimeDelta: number;  // vs baseline (negative = faster)
  risk: number;          // crash-risk index 0..100
  tyreLifeLaps: number;  // remaining laps before the cliff
  verdict: string;       // Oracle one-liner
  verdictTone: 'good' | 'caution' | 'bad';
}

const BASE_LAP = 117.842;   // 1:57.842 — the calibrated R1 reference
const BASE_RISK = 52;
const TYRE_CLIFF = 19;      // rear soft cliff lap

export function evaluateScenario(L: Levers): ScenarioOutput {
// ──── Lap time ────
  // Earlier throttle is the biggest free gain (up to ~0.45s at 0.5s earlier).
  let lap = BASE_LAP;
  lap -= L.earlierThrottle * 0.9;
  // Rear rebound: slower rebound helps drive up to +2 clicks, then the bike
  // gets lazy on direction change (parabolic optimum at +2).
  lap += 0.04 * Math.pow(L.rearRebound - 2, 2) - 0.16;
  // More TC costs a little drive; less TC is faster but riskier.
  lap += L.tc * 0.03;
  // Hot track loses grip; cold track slow warm-up — slight either way.
  lap += Math.abs(L.trackTempDelta) * 0.004;
  // Worn rear past mid-stint bleeds lap time, sharply past the cliff.
  lap += Math.max(0, L.rearStintLaps - 10) * 0.05
       + Math.max(0, L.rearStintLaps - TYRE_CLIFF) * 0.35;

// ──── Risk ────
  let risk = BASE_RISK;
  risk += L.earlierThrottle * 28;        // earlier throttle at lean = more risk
  risk -= L.tc * 5;                       // TC reduces risk
  risk -= L.rearRebound * 2.5;            // calmer rear reduces exit risk
  risk += Math.max(0, L.trackTempDelta) * 0.8; // hot track = more slides
  risk += Math.max(0, L.rearStintLaps - TYRE_CLIFF) * 4; // worn tyre risk
  risk += L.rainRisk * 0.15;
  risk = Math.max(0, Math.min(100, Math.round(risk)));

// ──── Tyre life ────
  // Cliff comes sooner on a hot track and with aggressive throttle.
  const cliff = TYRE_CLIFF - Math.max(0, L.trackTempDelta) * 0.3 - L.earlierThrottle * 2 + L.tc * 0.4;
  const tyreLifeLaps = Math.max(0, Math.round(cliff - L.rearStintLaps));

// ──── Verdict ────
  const delta = lap - BASE_LAP;
  let verdict: string; let tone: ScenarioOutput['verdictTone'];
  if (risk >= 78) {
    verdict = 'Risk too high — the rear-grip envelope is exceeded; back off throttle timing or add TC.';
    tone = 'bad';
  } else if (delta < -0.2 && risk < 68 && tyreLifeLaps > 2) {
    verdict = 'Strong scenario — meaningful gain at manageable risk with tyre margin. Validate next stint.';
    tone = 'good';
  } else if (tyreLifeLaps <= 1) {
    verdict = 'Tyre is at the cliff — usable for warm-up only; fit a fresh rear before pushing.';
    tone = 'caution';
  } else {
    verdict = 'Marginal — gain does not clearly beat the risk/tyre cost. Try the throttle-timing lever first.';
    tone = 'caution';
  }

  return {
    lapTimeS: Math.round(lap * 1000) / 1000,
    lapTimeDelta: Math.round(delta * 1000) / 1000,
    risk, tyreLifeLaps, verdict, verdictTone: tone,
  };
}

export function fmtLap(s: number): string {
  const m = Math.floor(s / 60);
  return `${m}:${(s - m * 60).toFixed(3).padStart(6, '0')}`;
}

// ── Digital Twin validation (17-digital-twin-simulation-lab) ──────────────────
// The local model above gives instant, interactive feedback. On demand, the
// Sandbox sends the current levers to the REAL twin for a second opinion (its
// own MVP physics). Live-with-fallback: if the twin has no baseline for the
// circuit / is asleep, `available` is false and the local model stands.

export interface WhatIfRequestLike {
  scenario_id: string; circuit_id: string; session_id: string;
  baseline_setup_id: string; proposed_setup: Record<string, number>;
  laps: number; ambient_temp_c: number; track_temp_c: number; tire_compound: string;
}
export interface WhatIfResultLike {
  delta_metrics?: { lap_time_delta_s: number; stability_score_delta: number; rear_temp_delta_c: number };
  risk_level?: string; approval_required?: boolean; explanation?: string; limitations?: string[];
}

export interface TwinValidation {
  available: boolean;
  lapDeltaS?: number;
  stabilityDelta?: number;
  rearTempDeltaC?: number;
  riskLevel?: string;
  approvalRequired?: boolean;
  explanation?: string;
  limitations?: string[];
}

/** Map the Sandbox levers to a proposed setup the twin understands. The twin
 *  computes deltas vs its own catalogue baseline, so these are intent values. */
export function leversToProposedSetup(L: Levers): Record<string, number> {
  return {
    rear_rebound: 2 + L.rearRebound,
    tc: L.tc,
    throttle_pickup_offset_s: -Math.round(L.earlierThrottle * 100) / 100,
  };
}

export interface TwinContext { circuitId: string; sessionId?: string }

export async function validateWithTwin(
  L: Levers,
  ctx: TwinContext,
  deps: { runWhatIf: (r: WhatIfRequestLike) => Promise<WhatIfResultLike | null> },
): Promise<TwinValidation> {
  const circuit = (ctx.circuitId || 'mugello').toLowerCase().replace(/[^a-z0-9]/g, '');
  try {
    const res = await deps.runWhatIf({
      scenario_id: 'sandbox',
      circuit_id: circuit,
      session_id: ctx.sessionId || 'race',
      baseline_setup_id: `${circuit}-baseline`,
      proposed_setup: leversToProposedSetup(L),
      laps: Math.max(1, Math.round(L.rearStintLaps) || 5),
      ambient_temp_c: 27,
      track_temp_c: 38 + L.trackTempDelta,
      tire_compound: 'soft',
    });
    if (!res || !res.delta_metrics) return { available: false };
    return {
      available: true,
      lapDeltaS: res.delta_metrics.lap_time_delta_s,
      stabilityDelta: res.delta_metrics.stability_score_delta,
      rearTempDeltaC: res.delta_metrics.rear_temp_delta_c,
      riskLevel: res.risk_level,
      approvalRequired: res.approval_required,
      explanation: res.explanation,
      limitations: res.limitations,
    };
  } catch {
    return { available: false };
  }
}
