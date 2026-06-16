/**
 * brakeThermal.ts — KDD Brake Thermal Lab.
 *
 * Carbon brakes only work inside a temperature window: too cold and the disc
 * glazes and there is no bite (the classic lap-1 / wet crash), too hot and it
 * fades and wears. This module rates the circuit's brake severity, models the
 * disc operating window, the per-corner brake energy and peak disc temperature,
 * the lap thermal curve, the cooling-duct trade-off and the fade / cold-disc
 * risk — ending in a duct + bias call.
 *
 *   KDD doesn't just tell you to brake later — it tells you whether the disc
 *   will let you.
 *
 * Deterministic thermal model derived from circuit shape. Honest: a
 * representative brake picture, not live disc telemetry. Temperatures in °C.
 */

export type ThermStatus = 'optimal' | 'hot' | 'overheat' | 'cold';

export interface BrakeZone { corner: string; entrySpeed: number; decelG: number; energyMJ: number; peakTempC: number; status: ThermStatus }
export interface DuctOption { size: 'S' | 'M' | 'L'; cooling: string; warmupRisk: string; chosen: boolean }
export interface ThermPoint { point: string; tempC: number }

export interface BrakeThermal {
  combo: string; circuit: string; severity: number; severityLabel: string;
  disc: { diameterMm: number; massKg: number; windowLow: number; windowHigh: number };
  state: { peakTempC: number; avgTempC: number; inWindow: boolean; status: ThermStatus };
  ducts: DuctOption[];
  zones: BrakeZone[];
  curve: ThermPoint[];
  fade: { fadeRiskPct: number; coldRiskPct: number; note: string };
  recommendations: string[];
  verdict: string; punchline: string; confidence: number;
}

const THERM_COLOR: Record<ThermStatus, string> = {
  optimal: 'var(--green)', hot: 'var(--yellow)', overheat: 'var(--accent)', cold: 'var(--cyan)',
};
export function thermColor(s: ThermStatus): string { return THERM_COLOR[s]; }

function statusFor(temp: number, low: number, high: number): ThermStatus {
  if (temp < low) return 'cold';
  if (temp > high) return 'overheat';
  if (temp > high - 80) return 'hot';
  return 'optimal';
}

export function buildBrakeThermal(rider: string, bike: string, circuit: string, turns: number): BrakeThermal {
  // More heavy stops + a big stop from top speed → higher severity.
  const heavyStops = Math.max(3, Math.round(turns * 0.35));
  const severity = Math.min(10, Math.round((heavyStops + 4) * 0.9));
  const severityLabel = severity >= 8 ? 'Extreme (340mm mandated)' : severity >= 6 ? 'High' : 'Moderate';
  const windowLow = 250, windowHigh = 800;
  const diameterMm = severity >= 8 ? 340 : 320;

  const zones: BrakeZone[] = [
    { corner: 'T1 · after main straight', entrySpeed: 351, decelG: 1.6, energyMJ: 2.4, peakTempC: 0 },
    { corner: `T${Math.max(4, Math.round(turns * 0.3))} · hard stop`, entrySpeed: 292, decelG: 1.4, energyMJ: 1.7, peakTempC: 0 },
    { corner: `T${Math.max(6, Math.round(turns * 0.5))} · downhill`, entrySpeed: 264, decelG: 1.3, energyMJ: 1.4, peakTempC: 0 },
    { corner: `T${Math.max(9, Math.round(turns * 0.75))} · chicane`, entrySpeed: 198, decelG: 1.1, energyMJ: 0.9, peakTempC: 0 },
  ].map(z => {
    const peakTempC = Math.round(420 + z.energyMJ * 165); // energy → disc temp
    return { ...z, peakTempC, status: statusFor(peakTempC, windowLow, windowHigh) };
  });

  const peakTempC = Math.max(...zones.map(z => z.peakTempC));
  const avgTempC = Math.round(zones.reduce((a, z) => a + z.peakTempC, 0) / zones.length);
  const status = statusFor(peakTempC, windowLow, windowHigh);

  return {
    combo: `${rider} · ${bike} · ${circuit}`,
    circuit, severity, severityLabel,
    disc: { diameterMm, massKg: diameterMm === 340 ? 1.05 : 0.95, windowLow, windowHigh },
    state: { peakTempC, avgTempC, inWindow: peakTempC <= windowHigh && avgTempC >= windowLow, status },
    ducts: [
      { size: 'S', cooling: 'Low — keeps temp up', warmupRisk: 'Best warm-up, fade risk if it spikes', chosen: false },
      { size: 'M', cooling: 'Balanced', warmupRisk: 'Safe both ends — recommended here', chosen: severity < 8 },
      { size: 'L', cooling: 'Max — for the big stops', warmupRisk: 'Cold-disc risk on lap 1 / in the wet', chosen: severity >= 8 },
    ],
    zones,
    curve: [
      { point: 'Start/finish', tempC: avgTempC - 120 },
      { point: 'T1 (big stop)', tempC: peakTempC },
      { point: 'Mid-sector', tempC: avgTempC + 40 },
      { point: 'Back straight (cooling)', tempC: avgTempC - 80 },
      { point: 'Final corners', tempC: avgTempC },
    ],
    fade: {
      fadeRiskPct: status === 'overheat' ? 38 : status === 'hot' ? 18 : 6,
      coldRiskPct: severity >= 8 ? 22 : 12,
      note: 'Cold-disc risk is highest on lap 1 and after a long no-brake straight in the wet — warm them with light drags.',
    },
    recommendations: [
      `Run ${diameterMm}mm discs with ${severity >= 8 ? 'large' : 'medium'} cooling ducts for the ${severityLabel.toLowerCase()} severity.`,
      peakTempC > windowHigh ? 'Open the ducts one step — T1 is over the window and will fade in the last third.' : 'Ducts are sized right — peak stays inside the window.',
      'Add front engine-braking to share the load and drop disc energy ~0.2 MJ at T1.',
      'Lap 1: two firm warm-up stops before T1 — do not trust a cold carbon disc.',
    ],
    verdict: `${severityLabel} brake circuit. Peak ${peakTempC}°C at T1 ${peakTempC > windowHigh ? 'is over the 800°C window — fade risk late' : 'sits inside the 250–800°C window'}; the real trap here is the cold disc on lap 1, not fade.`,
    punchline: `A carbon disc outside its window is just an expensive frisbee.`,
    confidence: 0.83,
  };
}
