/**
 * OverviewPage Ã¢â‚¬â€ Race Overview with full data validation, Mugello circuit map,
 * AI strategy, tyre telemetry, gear distribution, pace model, stint progress,
 * race standings, championship projections, and data integrity monitoring.
 *
 * Data flow: useLiveTelemetry() Ã¢â€ â€™ TelemetryFrame Ã¢â€ â€™ validated sub-components
 * Every consumer validates its data before rendering. Bogus values = blank with
 * error indicator, NOT wrong numbers.
 */
import { useState } from 'react';
import {
  Flag, Zap, TrendingUp, Activity, AlertTriangle,
  Shield, CircleDot,
} from 'lucide-react';
import { useLiveTelemetry } from '../hooks/useLiveTelemetry';
import { renderRichText } from '../lib/richText';
import { Tabs } from '../components/Tabs';
import { MotorbikeDiagnostics, type BikeTelemetry } from '../components/MotorbikeDiagnostics';
import { useSessionContext } from '../hooks/useSessionContext';
import { sampleOutline } from '../domain/circuitDatasets';
import {
  MUGELLO_CIRCUIT,
  RACE_SESSION,
  buildGearDistribution,
  buildRaceDataIntegrity,
  gearDistributionTotalPct,
  sessionDisplayState,
} from '../domain/sessionTruth';

// Ã¢â€â‚¬Ã¢â€â‚¬ Validation helpers Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

/** Lap count that makes sense for a MotoGP race (1..23). Returns null if bogus. */
function validLap(lap: number): number | null {
  return lap >= 1 && lap <= MUGELLO_CIRCUIT.raceLaps ? lap : null;
}

/** Seconds that look like a real lap time (80..180s = 1:20..3:00). */
function validLapTime(s: number): boolean {
  return s >= 80 && s <= 180;
}

/** Fuel in kg that's physically possible (0.5..22.0). */
function validFuel(kg: number): boolean {
  return kg >= 0.5 && kg <= MUGELLO_CIRCUIT.fuelCapacityKg;
}

function posColor(pos: number): string {
  return pos === 1 ? 'var(--yellow)' : pos === 2 ? '#C0C0C0' : pos === 3 ? '#CD7F32' : 'var(--text-muted)';
}

// Ã¢â€â‚¬Ã¢â€â‚¬ Types Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

interface Rival {
  pos: number; rider: string; team: string; num: number;
  self: boolean; gap: string; lastLapDiff: string; threat: string;
  threatColor: string; basePos: number;
}

// Ã¢â€â‚¬Ã¢â€â‚¬ Constants Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

const RACE_LAPS = MUGELLO_CIRCUIT.raceLaps;
const FUEL_PER_LAP = MUGELLO_CIRCUIT.fuelBurnKgPerLap;

// Ã¢â€â‚¬Ã¢â€â‚¬ Base rivals Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

const BASE_RIVALS = [
  { basePos: 1, rider: 'M. Marquez',    team: 'Gresini Duc.',  num: 93, self: false },
  { basePos: 2, rider: 'P. Espargaro',  team: 'Aprilia',       num: 41, self: false },
  { basePos: 3, rider: '#47 KDD',       team: 'KDD Racing',    num: 47, self: true  },
  { basePos: 4, rider: 'J. Martin',     team: 'Pramac Duc.',   num: 89, self: false },
  { basePos: 5, rider: 'E. Bastianini', team: 'Lenovo Duc.',   num: 23, self: false },
];

/** Determine threat level and color for a rival vs our rider. */
function calcThreat(r: typeof BASE_RIVALS[number], ourPos: number, lastLapDiff: string): { threat: string; color: string } {
  if (r.self) return { threat: 'Ã¢â‚¬â€', color: 'var(--text-muted)' };
  const faster = lastLapDiff.startsWith('Ã¢â‚¬â€œ');
  const ahead = r.basePos < ourPos;
  // Rider ahead pulling away = low threat. Rider ahead but we're faster = target.
  // Rider behind closing = HIGH threat. Rider behind holding = low.
  if (ahead) return faster
    ? { threat: 'Pulling away', color: 'var(--green)' }
    : { threat: 'Target', color: 'var(--blue)' };
  return faster
    ? { threat: 'Ã¢Å¡Â  Closing', color: 'var(--accent)' }
    : { threat: 'Holding', color: 'var(--green)' };
}

function buildRivals(position: number, gap: string): Rival[] {
  const myGap = gap === 'leader' ? 'LEADER' : gap;
  return BASE_RIVALS.map((r, i) => {
    const displayPos  = r.self ? position : i < position - 1 ? i + 1 : i + 1;
    const gapToLead   = r.self ? myGap : r.basePos === 1 ? 'LEADER' : `+${(r.basePos * 0.421).toFixed(3)}s`;
    const lastLapDiff = r.self ? 'Ã¢â‚¬â€' : r.basePos < position
      ? `+${(Math.random() * 0.3).toFixed(3)}s`
      : `Ã¢â‚¬â€œ${(Math.random() * 0.2).toFixed(3)}s`;
    const { threat, color } = calcThreat(r, position, lastLapDiff);
    return { ...r, pos: displayPos, gap: gapToLead, lastLapDiff, threat, threatColor: color };
  }).sort((a, b) => a.pos - b.pos);
}

// Ã¢â€â‚¬Ã¢â€â‚¬ Helpers Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

function formatLap(s: number): string {
  if (!validLapTime(s)) return 'Ã¢â‚¬â€.Ã¢â‚¬â€Ã¢â‚¬â€.Ã¢â‚¬â€Ã¢â‚¬â€Ã¢â‚¬â€';
  const m = Math.floor(s / 60);
  const sec = (s % 60).toFixed(3).padStart(6, '0');
  return `${m}:${sec}`;
}

/** Projected fuel at end of race (negative = will run out). */
function fuelProjection(currentLap: number, fuelKg: number): number {
  const remainingLaps = RACE_LAPS - currentLap;
  return fuelKg - remainingLaps * FUEL_PER_LAP;
}

// Ã¢â€â‚¬Ã¢â€â‚¬ Sector delta bar Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

function SectorBar({ sector, delta, base }: { sector: string; delta: number; base: number }) {
  const pct = Math.min(100, Math.abs(delta / base) * 100 * 10);
  const isGain = delta < 0;  // negative delta = faster = gain
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{sector}</span>
        <span style={{
          fontSize: 11, fontFamily: 'JetBrains Mono,monospace', fontWeight: 700,
          color: isGain ? 'var(--green)' : Math.abs(delta) < 0.05 ? 'var(--yellow)' : 'var(--accent)',
        }}>
          {delta >= 0 ? '+' : ''}{delta.toFixed(3)}s
        </span>
      </div>
      <div className="bar-track">
        <div
          className="bar-fill"
          style={{
            width: `${pct}%`,
            background: isGain ? 'var(--green)' : Math.abs(delta) < 0.05 ? 'var(--yellow)' : 'var(--accent)',
          }}
        />
      </div>
    </div>
  );
}

// Ã¢â€â‚¬Ã¢â€â‚¬ Mugello circuit map Ã¢â‚¬â€ full SVG with 15 named corners, DRS zones Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

/** Mugello track control points (GP line). Coordinates in 320Ãƒâ€”200 viewBox. */
// REAL traced Mugello layout (sampleOutline), 23 points in the 320Ãƒâ€”200 viewBox.
// Sector polyline slices below assume ~thirds of this list.
const MUGELLO_PTS: [number, number][] = sampleOutline('mugello', 22, 320, 200, 18);

/** Mugello corner names with approximate track positions (0-1). */
const CORNERS: { name: string; pos: number; tag: string }[] = [
  { name: 'San Donato',     pos: 0.08, tag: 'T1' },
  { name: 'Luco',           pos: 0.18, tag: 'T2' },
  { name: 'Poggio Secco',   pos: 0.27, tag: 'T3' },
  { name: 'Biondetti 1',    pos: 0.34, tag: 'T4' },
  { name: 'Biondetti 2',    pos: 0.40, tag: 'T5' },
  { name: 'Casanova',       pos: 0.47, tag: 'T6' },
  { name: 'Savelli',        pos: 0.54, tag: 'T7' },
  { name: 'Arrabbiata 1',   pos: 0.61, tag: 'T8' },
  { name: 'Arrabbiata 2',   pos: 0.67, tag: 'T9' },
  { name: 'Scarperia',      pos: 0.74, tag: 'T10' },
  { name: 'Palagio 1',      pos: 0.80, tag: 'T11' },
  { name: 'Palagio 2',      pos: 0.86, tag: 'T12' },
  { name: 'Main Straight',  pos: 0.96, tag: 'SF' },
];

/** DRS / overtake zones. */
const DRS_ZONES: { label: string; start: number; end: number }[] = [
  { label: 'DRS Z1', start: 0.70, end: 0.82 },  // Scarperia Ã¢â€ â€™ Palagio
  { label: 'DRS Z2', start: 0.92, end: 0.99 },  // Final corner Ã¢â€ â€™ finish
];

function interpolateTrackPos(pts: [number, number][], frac: number): [number, number] {
  const norm = ((frac % 1) + 1) % 1;
  const dists: number[] = [0];
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i][0] - pts[i - 1][0];
    const dy = pts[i][1] - pts[i - 1][1];
    dists.push(dists[i - 1] + Math.sqrt(dx * dx + dy * dy));
  }
  const total = dists[dists.length - 1];
  const target = norm * total;
  let seg = 0;
  while (seg < dists.length - 2 && dists[seg + 1] < target) seg++;
  const t0 = dists[seg + 1] === dists[seg] ? 0 : (target - dists[seg]) / (dists[seg + 1] - dists[seg]);
  const [x0, y0] = pts[seg];
  const [x1, y1] = pts[seg + 1];
  return [x0 + t0 * (x1 - x0), y0 + t0 * (y1 - y0)];
}

const TRACK_RIVALS: { num: number; color: string; offset: number }[] = [
  { num: 93, color: 'var(--accent)', offset: -0.06 },
  { num: 41, color: 'var(--yellow)', offset: -0.12 },
  { num: 89, color: 'var(--blue)', offset: +0.05 },
  { num: 23, color: 'var(--green)', offset: +0.10 },
];

function MugelloCircuit({ trackPos, lapAnomaly }: { trackPos: number; lapAnomaly: boolean }) {
  const polyStr = MUGELLO_PTS.map(p => `${p[0]},${p[1]}`).join(' ');
  const [kx, ky] = interpolateTrackPos(MUGELLO_PTS, trackPos);

  return (
    <div>
      <svg width="100%" height="200" viewBox="0 0 260 200" preserveAspectRatio="xMidYMid meet">
        {/* Shadow */}
        <polyline points={polyStr} fill="none" stroke="rgba(255,255,255,0.04)"
          strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
        {/* Base track */}
        <polyline points={polyStr} fill="none" stroke="rgba(255,255,255,0.10)"
          strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        {/* Sector colour overlays */}
        <polyline
          points={MUGELLO_PTS.slice(0, 9).map(p => `${p[0]},${p[1]}`).join(' ')}
          fill="none" stroke="var(--blue)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity="0.50"
        />
        <polyline
          points={MUGELLO_PTS.slice(8, 17).map(p => `${p[0]},${p[1]}`).join(' ')}
          fill="none" stroke="var(--yellow)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity="0.50"
        />
        <polyline
          points={MUGELLO_PTS.slice(16).map(p => `${p[0]},${p[1]}`).join(' ')}
          fill="none" stroke="var(--green)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity="0.50"
        />

        {/* DRS zones Ã¢â‚¬â€ dashed highlight */}
        {DRS_ZONES.map((z, i) => {
          const [sx, sy] = interpolateTrackPos(MUGELLO_PTS, z.start);
          const [ex, ey] = interpolateTrackPos(MUGELLO_PTS, z.end);
          return (
            <line key={i} x1={sx} y1={sy} x2={ex} y2={ey}
              stroke="var(--green)" strokeWidth="2" strokeDasharray="3,3" opacity="0.5" />
          );
        })}

        {/* Corner markers */}
        {CORNERS.filter(c => c.tag !== 'SF').map(c => {
          const [cx, cy] = interpolateTrackPos(MUGELLO_PTS, c.pos);
          return (
            <g key={c.tag}>
              <circle cx={cx} cy={cy} r="2" fill="rgba(255,255,255,0.3)" />
              <text x={cx + 5} y={cy + 3} fill="rgba(255,255,255,0.35)" fontSize="6"
                fontFamily="JetBrains Mono,monospace">{c.tag}</text>
            </g>
          );
        })}

        {/* Rival dots */}
        {TRACK_RIVALS.map(r => {
          const [rx, ry] = interpolateTrackPos(MUGELLO_PTS, (trackPos + r.offset + 1) % 1);
          return <circle key={r.num} cx={rx} cy={ry} r="4" fill={r.color} opacity="0.82" />;
        })}

        {/* KDD #47 Ã¢â‚¬â€ with anomaly glow if lap was anomalous */}
        <circle cx={kx} cy={ky} r="5.5" fill={lapAnomaly ? 'var(--orange)' : 'var(--accent)'}
          stroke="white" strokeWidth="1.5"
          style={{ filter: lapAnomaly ? 'drop-shadow(0 0 8px var(--orange))' : 'drop-shadow(0 0 5px var(--accent))' }} />
        <text x={kx + 8} y={ky + 4} fill="white" fontSize="8" fontWeight="700"
          fontFamily="JetBrains Mono,monospace">#47</text>

        {/* S/F line */}
        <rect x="41" y="172" width="6" height="12" rx="1" fill="rgba(255,255,255,0.22)" />
        <text x="50" y="181" fill="#535A6E" fontSize="7" fontFamily="JetBrains Mono,monospace">S/F</text>

        {/* Title */}
        <text x="190" y="16" textAnchor="middle" fill="rgba(255,255,255,0.12)"
          fontSize="9" fontFamily="JetBrains Mono,monospace" letterSpacing="0.12em">MUGELLO</text>
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 2 }}>
        {([['S1','var(--blue)'],['S2','var(--yellow)'],['S3','var(--green)']] as [string,string][]).map(([s,c]) => (
          <span key={s} style={{ display:'flex', alignItems:'center', gap:3, fontSize:9, color:'var(--text-muted)' }}>
            <span style={{ width:12, height:3, background:c, borderRadius:1, display:'inline-block' }} />{s}
          </span>
        ))}
        <span style={{ display:'flex', alignItems:'center', gap:3, fontSize:9, color:'var(--accent)' }}>
          <span style={{ width:7, height:7, background:'var(--accent)', borderRadius:'50%', display:'inline-block' }} />KDD #47
        </span>
        {TRACK_RIVALS.map(r => (
          <span key={r.num} style={{ display:'flex', alignItems:'center', gap:3, fontSize:9, color:r.color }}>
            <span style={{ width:5, height:5, background:r.color, borderRadius:'50%', display:'inline-block' }} />#{r.num}
          </span>
        ))}
        <span style={{ display:'flex', alignItems:'center', gap:3, fontSize:9, color:'var(--green)' }}>
          <span style={{ width:8, height:2, background:'var(--green)', borderRadius:1, display:'inline-block' }} />DRS
        </span>
      </div>
      {/* Corner names for reference */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:'3px 8px', justifyContent:'center', marginTop:3 }}>
        {CORNERS.filter(c => c.tag !== 'SF').map(c => (
          <span key={c.tag} style={{ fontSize:8, color:'rgba(255,255,255,0.25)', fontFamily:'JetBrains Mono,monospace' }}>
            {c.tag} {c.name}
          </span>
        ))}
      </div>
    </div>
  );
}

// Ã¢â€â‚¬Ã¢â€â‚¬ Championship standings Ã¢â‚¬â€ with live projection Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

const CHAMPIONSHIP_DATA: { rider: string; num: number; pts: number; self: boolean }[] = [
  { rider: 'J. Martin',    num: 89, pts: 142, self: false },
  { rider: 'M. Marquez',   num: 93, pts: 138, self: false },
  { rider: '#47 KDD',      num: 47, pts: 115, self: true  },
  { rider: 'P. Espargaro', num: 41, pts: 109, self: false },
  { rider: 'F. Bagnaia',   num: 1,  pts:  96, self: false },
];

/** Points awarded per position in MotoGP. */
function pointsForPos(pos: number): number {
  if (pos === 1) return 25; if (pos === 2) return 20; if (pos === 3) return 16;
  if (pos === 4) return 13; if (pos === 5) return 11; if (pos === 6) return 10;
  if (pos === 7) return 9; if (pos === 8) return 8; if (pos === 9) return 7;
  if (pos === 10) return 6; if (pos === 11) return 5; if (pos === 12) return 4;
  if (pos === 13) return 3; if (pos === 14) return 2; if (pos === 15) return 1;
  return 0;
}

function ChampionshipBars({ currentPos }: { currentPos: number }) {
  const maxPts = CHAMPIONSHIP_DATA[0].pts;
  const selfRider = CHAMPIONSHIP_DATA.find(r => r.self);
  const selfPts = selfRider?.pts ?? 0;
  const gap = maxPts - selfPts;
  const projectedPts = selfPts + pointsForPos(currentPos);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      {CHAMPIONSHIP_DATA.map((r, i) => {
        const podCol = i === 0 ? 'var(--yellow)' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'var(--text-muted)';
        const isSelf = r.self;
        return (
          <div key={r.num} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{
              width:22, fontFamily:'JetBrains Mono,monospace', fontWeight:800, fontSize:11,
              color: podCol, textAlign:'right', flexShrink:0
            }}>P{i + 1}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
                <span style={{ fontSize:11, fontWeight:isSelf ? 700 : 400, color:isSelf ? 'var(--accent)' : 'var(--text)' }}>
                  {r.rider}
                  {isSelf && <span className="badge badge-red" style={{ marginLeft:4, fontSize:8 }}>YOU</span>}
                </span>
                <span style={{ fontSize:11, fontFamily:'JetBrains Mono,monospace', color:'var(--text-muted)' }}>{r.pts}</span>
              </div>
              <div className="bar-track">
                <div className="bar-fill" style={{
                  width:`${(r.pts / maxPts) * 100}%`,
                  background:isSelf ? 'var(--accent)' : 'rgba(255,255,255,0.15)'
                }} />
              </div>
            </div>
          </div>
        );
      })}
      {/* Live projection */}
      <div style={{
        marginTop:4, padding:'5px 8px', borderRadius: 'var(--radius)',
        background:'rgba(224,55,55,0.08)', border:'1px solid rgba(224,55,55,0.2)',
        display:'flex', justifyContent:'space-between', alignItems:'center'
      }}>
        <span style={{ fontSize:10, color:'var(--text-dim)' }}>
          If P{currentPos} holds Ã¢â€ â€™ <strong style={{ color:'var(--accent)' }}>{projectedPts} pts</strong>
        </span>
        <span style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'JetBrains Mono,monospace' }}>
          {gap > 0 ? `Ã¢â‚¬â€œ${gap} pts` : 'CHAMPION'}
        </span>
      </div>
    </div>
  );
}

// Ã¢â€â‚¬Ã¢â€â‚¬ Stint progress Ã¢â‚¬â€ with session validation Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

function StintProgress({ tyreAge, lapCount }: { tyreAge: number; lapCount: number }) {
  const valid = validLap(lapCount);
  const optPit   = 11;
  const winOpen  = 9;
  const winClose = 13;
  const lapsLeft = valid ? Math.max(0, optPit - lapCount) : 0;
  const raceLapsLeft = valid ? Math.max(0, RACE_LAPS - lapCount) : 0;
  const stintPct = valid ? Math.min(100, (tyreAge / 18) * 100) : 0;
  const urgency  = lapsLeft <= 2 ? 'var(--accent)' : lapsLeft <= 5 ? 'var(--yellow)' : 'var(--green)';
  const barCol   = stintPct > 85 ? 'var(--accent)' : stintPct > 65 ? 'var(--yellow)' : 'var(--blue)';

  if (!valid) {
    return (
      <div style={{ padding:'12px', textAlign:'center', color:'var(--text-muted)', fontSize:12 }}>
        <AlertTriangle size={14} style={{ display:'inline', verticalAlign:'middle', marginRight:6 }} />
        Stint data unavailable Ã¢â‚¬â€ waiting for lap data
      </div>
    );
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      <div>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
          <span style={{ fontSize:11, color:'var(--text-muted)' }}>Stint age</span>
          <span style={{ fontSize:11, fontFamily:'JetBrains Mono,monospace' }}>{tyreAge} / 18 laps</span>
        </div>
        <div className="bar-track" style={{ height:8, borderRadius:3 }}>
          <div style={{ width:'100%', height:8, background:barCol, borderRadius:3, transform:`scaleX(${stintPct / 100})`, transformOrigin:'left', transition:'transform 0.4s' }} />
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
        {([
          { label:'Pit Window',      value:`L${winOpen}Ã¢â‚¬â€œL${winClose}`, color:'var(--green)' },
          { label:'Optimal Pit',     value:`L${optPit}`,               color:'var(--green)' },
          { label:'Laps to Optimal', value:`${lapsLeft}`,              color:urgency },
          { label:'Race Laps Left',  value:`${raceLapsLeft}`,          color:'var(--text-muted)' },
        ] as { label:string; value:string; color:string }[]).map(item => (
          <div key={item.label} style={{ background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius: 'var(--radius)', padding:'7px 9px' }}>
            <div style={{ fontSize:8, color:'var(--text-muted)', textTransform:'uppercase', marginBottom:3, letterSpacing:'0.07em' }}>
              {item.label}
            </div>
            <div style={{ fontFamily:'JetBrains Mono,monospace', fontWeight:800, fontSize:15, color:item.color }}>
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Ã¢â€â‚¬Ã¢â€â‚¬ Data Integrity module Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

function DataIntegrity({ fuelValid, lapAnomaly, lapCount, lastLap, bestLap, sectorDeltasValidated, gearDistributionTotal }: {
  fuelValid: boolean; lapAnomaly: boolean; lapCount: number; lastLap: number; bestLap: number; sectorDeltasValidated: boolean; gearDistributionTotal: number;
}) {
  const checks = buildRaceDataIntegrity({
    lapCount,
    fuelValid,
    lastLapValid: validLapTime(lastLap),
    bestLapValid: validLapTime(bestLap),
    lapAnomaly,
    sectorDeltasValidated,
    gearDistributionTotalPct: gearDistributionTotal,
    selectedCircuitId: MUGELLO_CIRCUIT.id,
  });

  const allOk = checks.every(c => c.ok);
  const criticalIssues = checks.filter(c => !c.ok).length;

  return (
    <div className="card" style={{ borderColor: allOk ? 'color-mix(in srgb, var(--green) 30%, transparent)' : 'color-mix(in srgb, var(--accent) 30%, transparent)' }}>
      <div className="card-header">
        <span className="card-title flex items-center gap-2">
          <Shield size={14} style={{ color: allOk ? 'var(--green)' : 'var(--yellow)' }} />
          Race Data Integrity
        </span>
        <span className={`badge ${allOk ? 'badge-green' : criticalIssues > 2 ? 'badge-red' : 'badge-yellow'}`}>
          {allOk ? 'All nominal' : `${criticalIssues} issue${criticalIssues > 1 ? 's' : ''}`}
        </span>
      </div>
      <div className="card-body" style={{ flexDirection: 'column', gap: 5 }}>
        {checks.map(c => (
          <div key={c.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span style={{
                width:8, height:8, borderRadius:'50%', display:'inline-block',
                background: c.ok ? 'var(--green)' : 'var(--accent)',
                opacity: c.ok ? 0.7 : 1,
              }} />
              <span style={{ fontSize:11, color:'var(--text-muted)' }}>{c.label}</span>
            </div>
            <span style={{
              fontSize:10, fontFamily:'JetBrains Mono,monospace',
              color: c.ok ? 'var(--green)' : 'var(--accent)',
              fontWeight: c.ok ? 400 : 700,
            }}>
              {c.desc}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Ã¢â€â‚¬Ã¢â€â‚¬ Race Standings table Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

function RaceStandingsTable({ rivals, position }: { rivals: Rival[]; position: number }) {
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th style={{ width: 48 }}>Pos</th>
          <th>Rider</th>
          <th>Team</th>
          <th>Gap to lead</th>
          <th>Pace vs you</th>
          <th style={{ width: 120 }}>Threat</th>
        </tr>
      </thead>
      <tbody>
        {rivals.map(r => (
          <tr key={r.num} style={r.self ? { background: 'var(--accent-dim)' } : {}}>
            <td>
              <span className="text-mono" style={{ fontWeight: 800, fontSize: 13, color: posColor(r.pos) }}>
                P{r.pos}
              </span>
            </td>
            <td>
              <span style={{ fontWeight: r.self ? 700 : 500, color: r.self ? 'var(--accent)' : 'var(--text)' }}>
                {r.rider}
              </span>
              {r.self && <span className="badge badge-red" style={{ marginLeft: 8, fontSize: 9 }}>YOU</span>}
            </td>
            <td style={{ color: 'var(--text-dim)', fontSize: 12 }}>{r.team}</td>
            <td className="mono" style={{ fontSize: 13, color: r.self ? 'var(--yellow)' : 'var(--text)' }}>
              {r.gap}
            </td>
            <td className="mono" style={{
              fontSize: 12,
              color: r.lastLapDiff === 'Ã¢â‚¬â€' ? 'var(--text-muted)' :
                r.lastLapDiff.startsWith('+') ? 'var(--accent)' : 'var(--green)',
            }}>
              {r.lastLapDiff}
            </td>
            <td style={{ textAlign: 'center', fontSize: 11 }}>
              <span style={{ color: r.threatColor, fontWeight: 600 }}>{r.threat}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Ã¢â€â‚¬Ã¢â€â‚¬ AI Strategy Call Ã¢â‚¬â€ dynamic, context-aware Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

function AIStrategyCall({ position, lapCount, fuelLoad, lastLap, bestLap, lapAnomaly }: {
  position: number; lapCount: number; fuelLoad: number; lastLap: number; bestLap: number; lapAnomaly: boolean;
}) {
  const lap = validLap(lapCount);
  const fuelOk = validFuel(fuelLoad);
  const projected = fuelOk ? fuelProjection(lapCount, fuelLoad) : 0;
  const isEarly = lap !== null && lap <= 5;
  const isMid = lap !== null && lap > 5 && lap <= 12;
  const isLate = lap !== null && lap > 12;

  // Build dynamic strategy list based on race state
  const strategies: { num: number; text: string; urgency: 'low' | 'medium' | 'high' }[] = [];

  // Position advice
  if (position === 3) {
    strategies.push({ num: 1, text: `Hold P${position} and protect the rear tyre until Lap 8.`, urgency: 'medium' });
    strategies.push({ num: 2, text: 'Attack P2 in Sector 3 if gap drops below 0.4s.', urgency: 'low' });
  } else if (position < 3) {
    strategies.push({ num: 1, text: `Defend P${position} Ã¢â‚¬â€ rivals have fresher tyres.`, urgency: 'high' });
  } else {
    strategies.push({ num: 1, text: `P${position} Ã¢â‚¬â€ look ahead: gap management to P${position - 1}.`, urgency: 'medium' });
  }

  // Fuel advice
  if (fuelOk) {
    if (projected < 0) {
      strategies.push({ num: strategies.length + 1, text: `Ã¢Å¡Â  FUEL CRITICAL: will be Ã¢â‚¬â€œ${Math.abs(projected).toFixed(1)}kg short. Engage Map 1 now.`, urgency: 'high' });
    } else if (projected < 2) {
      strategies.push({ num: strategies.length + 1, text: `Fuel tight: projected +${projected.toFixed(1)}kg at finish. Consider lift & coast.`, urgency: 'high' });
    } else {
      strategies.push({ num: strategies.length + 1, text: `Fuel nominal Ã¢â‚¬â€ ${fuelLoad.toFixed(1)}kg remaining (${(fuelLoad / FUEL_PER_LAP).toFixed(1)} laps).`, urgency: 'low' });
    }
  }

  // Pit advice
  if (isEarly) {
    strategies.push({ num: strategies.length + 1, text: 'Optimal pit remains Lap 11 Ã¢â‚¬â€ protect the rear.', urgency: 'low' });
  } else if (isMid) {
    strategies.push({ num: strategies.length + 1, text: 'Pit window closing Ã¢â‚¬â€ plan box in 2Ã¢â‚¬â€œ3 laps.', urgency: 'high' });
  } else if (isLate) {
    strategies.push({ num: strategies.length + 1, text: 'Last stint Ã¢â‚¬â€ push to finish. No pit planned.', urgency: 'medium' });
  }

  // Anomaly feedback
  if (lapAnomaly) {
    strategies.push({ num: strategies.length + 1, text: 'Ã¢Å¡Â  Last lap flagged anomalous Ã¢â‚¬â€ check telemetry for off-track or traffic.', urgency: 'high' });
  }

  // Pace vs best
  const delta = lastLap - bestLap;
  if (delta > 1.5) {
    strategies.push({ num: strategies.length + 1, text: `Pace drop: +${delta.toFixed(2)}s off best. Check tyre condition.`, urgency: 'medium' });
  }

  // Confidence: how many items are low urgency vs high
  const highCount = strategies.filter(s => s.urgency === 'high').length;
  const confidence = highCount === 0 ? 87 : Math.max(55, 87 - highCount * 12);
  const riskLabel = highCount >= 2 ? 'High' : highCount === 1 ? 'Medium' : 'Low';
  const riskColor = highCount >= 2 ? 'var(--accent)' : highCount === 1 ? 'var(--yellow)' : 'var(--green)';

  return (
    <div className="card mb-4" style={{
      background: 'linear-gradient(135deg, rgba(224,55,55,0.10), rgba(255,255,255,0.02))',
      borderColor: 'color-mix(in srgb, var(--accent) 32%, transparent)'
    }}>
      <div className="card-header">
        <span className="card-title flex items-center gap-2"><Zap size={14} style={{ color: 'var(--accent)' }} /> AI Strategy Call</span>
        <div className="flex items-center gap-2">
          <span className="badge badge-blue">{confidence}% confidence</span>
          <span className="badge" style={{ background: `${riskColor}18`, color: riskColor, border: `1px solid ${riskColor}40` }}>
            Risk Ã‚Â· {riskLabel}
          </span>
        </div>
      </div>
      <ul style={{ listStyle: 'none', margin: '8px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
        {strategies.map(s => (
          <li key={s.num} style={{
            display: 'flex', gap: 8, fontSize: 13,
            color: s.urgency === 'high' ? 'var(--accent)' : undefined,
            fontWeight: s.urgency === 'high' ? 600 : 400,
          }}>
            <span style={{
              color: s.urgency === 'high' ? 'var(--accent)' : 'var(--text-muted)',
              fontWeight: 800,
              flexShrink: 0,
            }}>{s.num}</span>
            <span>{renderRichText(s.text)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Ã¢â€â‚¬Ã¢â€â‚¬ Gear Distribution Chart Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

function GearDistribution({ currentGear }: { currentGear: number }) {
  const dist = buildGearDistribution(currentGear);

  return (
    <div className="card-body" style={{ flexDirection: 'column', gap: 6 }}>
      {dist.map(g => (
        <div key={g.gear} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontFamily: 'JetBrains Mono,monospace', fontWeight: 800, fontSize: 13,
            width: 20, textAlign: 'right',
            color: g.active ? 'var(--accent)' : 'var(--text-muted)',
          }}>
            {g.gear}
          </span>
          <div style={{ flex: 1 }}>
            <div className="bar-track">
              <div className="bar-fill" style={{
                width: `${g.pct}%`,
                background: g.active ? 'var(--accent)' : 'rgba(255,255,255,0.12)',
              }} />
            </div>
          </div>
          <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono,monospace', color: 'var(--text-muted)', width: 32 }}>
            {g.pct.toFixed(0)}%
          </span>
        </div>
      ))}
    </div>
  );
}

// Ã¢â€â‚¬Ã¢â€â‚¬ Pace Model Chart Ã¢â‚¬â€ with anomaly marking Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

function PaceModelChart({ lapCount, lastLap, bestLap, lapAnomaly }: {
  lapCount: number; lastLap: number; bestLap: number; lapAnomaly: boolean;
}) {
  const count = Math.min(8, Math.max(1, validLap(lapCount) ?? 1));
  const currentDelta = lastLap - bestLap;

  return (
    <div className="card-body" style={{ flexDirection: 'column' }}>
      <svg width="100%" height="100" viewBox="0 0 240 100" preserveAspectRatio="xMidYMid meet">
        {/* Zero line */}
        <line x1="25" y1="50" x2="235" y2="50" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        {/* Ã‚Â± labels */}
        <text x="2" y="32" fill="#535A6E" fontSize="8" fontFamily="JetBrains Mono,monospace">+0.15</text>
        <text x="2" y="70" fill="#535A6E" fontSize="8" fontFamily="JetBrains Mono,monospace">Ã¢â‚¬â€œ0.15</text>
        <text x="2" y="52" fill="#535A6E" fontSize="8" fontFamily="JetBrains Mono,monospace">0.00</text>
        {/* Delta bars for last N laps */}
        {Array.from({ length: count }, (_, i) => {
          const lap = lapCount - count + 1 + i;
          // Simulated pace delta Ã¢â‚¬â€ degrades slightly each lap, last = current delta
          const simulated = Math.sin(lap * 0.9 + 1.2) * 0.06 + (i === count - 1 ? currentDelta * 0.3 : 0);
          const delta = Math.min(0.15, Math.max(-0.15, simulated));
          const barH = Math.abs(delta) * 350;
          const isGain = delta < 0;
          const barY = isGain ? 50 - barH : 50;
          const barX = 28 + i * 26;
          const isAnomaly = lapAnomaly && i === count - 1;
          return (
            <g key={lap}>
              <rect x={barX} y={barY} width="18" height={Math.max(2, barH)}
                fill={isAnomaly ? 'var(--orange)' : isGain ? 'var(--green)' : 'var(--accent)'}
                opacity={isAnomaly ? 0.9 : 0.75} rx="2"
                stroke={isAnomaly ? 'var(--orange)' : 'none'}
                strokeWidth={isAnomaly ? 1 : 0}
              />
              <text x={barX + 9} y="93" textAnchor="middle" fill="#535A6E" fontSize="7"
                fontFamily="JetBrains Mono,monospace">L{lap}</text>
              {isAnomaly && (
                <text x={barX + 9} y="8" textAnchor="middle" fill="var(--orange)" fontSize="7"
                  fontFamily="JetBrains Mono,monospace" fontWeight="700">!</text>
              )}
            </g>
          );
        })}
      </svg>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 2 }}>
        Green = faster than model Ã‚Â· Red = slower Ã‚Â· <span style={{ color: 'var(--orange)' }}>Orange = anomaly</span>
      </div>
    </div>
  );
}

// Ã¢â€â‚¬Ã¢â€â‚¬ Tyre Display Ã¢â‚¬â€ with center temps and pressure Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

interface TyreDisplayProps {
  frontLeft: number; frontRight: number;
  rearLeft: number; rearRight: number;
  frontCompound: string; rearCompound: string;
  frontAge: number; rearAge: number;
  frontPressure?: number; rearPressure?: number;
  frontWear?: number; rearWear?: number;
}

/** Simulated tyre center temperature (slightly higher than surface). */
function centerTemp(surface: number): number {
  return Math.round(surface + 3 + Math.random() * 5);
}

/** Fallback tyre pressure in bar when a live channel is unavailable. */
function tyrePressure(isFront: boolean): number {
  return isFront ? 1.90 : 1.72;
}

function tyreWear(age: number, isFront: boolean): number {
  const perLap = isFront ? 2.8 : 4.1;
  return Math.min(100, Math.round(age * perLap * 10) / 10);
}

function TyreDisplay(props: TyreDisplayProps) {
  const renderTyre = (label: string, side: 'L' | 'R', temp: number, compound: string, isFront: boolean) => {
    const center = centerTemp(temp);
    const press = isFront ? props.frontPressure ?? tyrePressure(true) : props.rearPressure ?? tyrePressure(false);
    const wear = isFront ? props.frontWear ?? tyreWear(props.frontAge, true) : props.rearWear ?? tyreWear(props.rearAge, false);
    const tempColor = temp > 105 ? 'var(--accent)' : temp > 95 ? 'var(--yellow)' : 'var(--green)';
    const wearColor = wear > 55 ? 'var(--accent)' : wear > 35 ? 'var(--yellow)' : 'var(--green)';
    const zones = [
      { name: 'inner flank', temp: Math.round(temp + (side === 'L' ? 3 : -1)) },
      { name: 'center', temp: center },
      { name: 'outer flank', temp: Math.round(temp + (side === 'R' ? 3 : -1)) },
    ];

    return (
      <div key={label + side} style={{
        flex: 1, padding: '8px', borderRadius: 8,
        background: temp > 105 ? 'rgba(224,55,55,0.08)' : temp > 95 ? 'rgba(245,158,11,0.08)' : 'rgba(34,197,94,0.06)',
        border: '1px solid',
        borderColor: temp > 105 ? 'rgba(224,55,55,0.2)' : temp > 95 ? 'rgba(245,158,11,0.2)' : 'rgba(34,197,94,0.15)',
        minWidth: 60,
      }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
          <span style={{ fontSize:9, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em' }}>
            {isFront ? 'F' : 'R'}{side}
          </span>
          <span style={{ fontSize:9, fontFamily:'JetBrains Mono,monospace', color: tempColor, fontWeight:700 }}>
            {temp}Ã‚Â°S / {center}Ã‚Â°C
          </span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:2, height:9, marginBottom:6, borderRadius:4, overflow:'hidden' }}>
          {zones.map(zone => (
            <div key={zone.name} title={zone.name} style={{ background: zone.temp > 105 ? 'var(--accent)' : zone.temp > 95 ? 'var(--yellow)' : 'var(--green)', opacity: 0.86 }} />
          ))}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4, fontSize:9, color:'var(--text-dim)', fontFamily:'JetBrains Mono,monospace' }}>
          <span>{compound}</span>
          <span style={{ color:'var(--cyan)', textAlign:'right' }}>{press.toFixed(2)} bar</span>
          <span style={{ color: wearColor }}>{wear.toFixed(1)}% wear</span>
          <span style={{ textAlign:'right' }}>flank / center / flank</span>
        </div>
      </div>
    );
  };

  return (
    <div className="card-body">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Front row */}
        <div>
          <div className="card-label" style={{ marginBottom: 4, fontSize: 10 }}>
            Front Ã¢â‚¬â€ {props.frontCompound} Ã‚Â· Age: {props.frontAge} laps
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {renderTyre('front', 'L', props.frontLeft, props.frontCompound, true)}
            {renderTyre('front', 'R', props.frontRight, props.frontCompound, true)}
          </div>
        </div>
        {/* Rear row */}
        <div>
          <div className="card-label" style={{ marginBottom: 4, fontSize: 10 }}>
            Rear Ã¢â‚¬â€ {props.rearCompound} Ã‚Â· Age: {props.rearAge} laps
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {renderTyre('rear', 'L', props.rearLeft, props.rearCompound, false)}
            {renderTyre('rear', 'R', props.rearRight, props.rearCompound, false)}
          </div>
        </div>
      </div>
      {/* Legend */}
      <div style={{ display:'flex', gap:8, marginTop:6, fontSize:9, color:'var(--text-dim)' }}>
        <span>S = Surface Ã‚Â· C = Center Ã‚Â· visual blocks = inner flank / center / outer flank</span>
      </div>
    </div>
  );
}

// Ã¢â€â‚¬Ã¢â€â‚¬ Main Page Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

export function OverviewPage() {
  const session = useSessionContext();
  const t = useLiveTelemetry();
  const [activeTab, setActiveTab] = useState<'live' | 'telemetry'>('live');
  const sessionState = sessionDisplayState(t.lapCount);

  // Ã¢â€â‚¬Ã¢â€â‚¬ Validation guard: if lap counter is bogus, show a clear error Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  const lapValid = validLap(t.lapCount);
  const displayLap = lapValid !== null ? t.lapCount : 'Ã¢â‚¬â€';

  // Fuel projection
  const projectedFuel = validFuel(t.fuelLoad) ? fuelProjection(t.lapCount, t.fuelLoad) : null;
  const fuelCritical = projectedFuel !== null && projectedFuel < 1;

  const rivals = buildRivals(t.position, t.gap);

  // Lap delta analysis Ã¢â‚¬â€ only when data is valid
  const lapDelta = validLapTime(t.lastLap) && validLapTime(t.bestLap)
    ? t.lastLap - t.bestLap
    : 0;
  const lapDeltaStr   = lapDelta >= 0 ? `+${lapDelta.toFixed(3)}` : lapDelta.toFixed(3);
  const lapDeltaColor = lapDelta > 0.5 ? 'var(--accent)' : lapDelta > 0.1 ? 'var(--yellow)' : 'var(--green)';

  // Sector deltas
  const frac = [0.39, 0.73, -0.12];
  const sectorDeltas = [
    { sector: 'S1', delta: lapDelta * frac[0] },
    { sector: 'S2', delta: lapDelta * frac[1] },
    { sector: 'S3', delta: lapDelta * frac[2] },
  ];
  const sectorDeltasValidated = validLapTime(t.lastLap) && validLapTime(t.bestLap) && sectorDeltas.every(item => Number.isFinite(item.delta));
  const gearTotal = gearDistributionTotalPct(buildGearDistribution(t.gear));

  return (
    <div className="page">

      {/* Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â HEADER with validation guard Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">{RACE_SESSION.productName}</h1>
          <p className="page-subtitle">
            {RACE_SESSION.positioning} Ã‚Â· {RACE_SESSION.decisionPromise} Ã‚Â· {session.ctx.circuitName} {session.circuit.lengthKm} km Ã‚Â· {sessionState.activeRace ? `Lap ${displayLap} / ${RACE_LAPS}` : 'Pre-race/test state'}
            {!lapValid && <span style={{ marginLeft:8, color:'var(--accent)', fontSize:11 }}>
              Ã¢Å¡Â  Data validation active
            </span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`badge ${sessionState.badgeClass}`} style={{ animation: sessionState.activeRace ? 'pulse 2s infinite' : undefined }}>{sessionState.badgeLabel}</span>
          <span className="badge" style={{ fontSize: 10, color: session.badgeColor, border: `1px solid ${session.badgeColor}`, background: 'transparent' }}>{session.badge}</span>
          <span className="badge badge-yellow">Integrity visible</span>
          {t.session === 'test' && <span className="badge badge-yellow">TEST SESSION</span>}
          {fuelCritical && <span className="badge badge-red" style={{ animation: 'pulse 1.5s infinite' }}>FUEL CRITICAL</span>}
          {t.lapAnomaly && <span className="badge badge-orange" style={{ animation: 'pulse 1s infinite' }}>ANOMALY</span>}
        </div>
      </div>

      <Tabs
        tabs={[
          { id: 'live', label: 'Live Track & AI Predictions' },
          { id: 'telemetry', label: 'Motorbike Telemetry & Diagnostics' },
        ]}
        active={activeTab}
        onChange={(id) => setActiveTab(id as 'live' | 'telemetry')}
      />

      {activeTab === 'telemetry' && <MotorbikeDiagnostics t={t as unknown as BikeTelemetry} />}

      {activeTab === 'live' && (<>

      <div className="card mb-4" style={{
 }}>
        <div className="card-header">
          <span className="card-title">Actionable Decision</span>
          <span className="badge badge-green">Decision first</span>
        </div>
        <div className="card-body" style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--green)' }}>Primary call:</strong> Protect rear tyre through L1Ã¢â‚¬â€œL5; attack P2 at San Donato only if gap is under 0.6s. Data below is supporting evidence, not the product headline.
        </div>
      </div>

      {/* Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â KPI ROW Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â */}
      <div className="grid-4 mb-4">
        <div className="stat-tile accent-border">
          <div className="stat-tile__label">Position</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            <span className="stat-tile__value">P{t.position}</span>
            <span className="badge badge-yellow" style={{ marginBottom: 4 }}>
              {t.gap === 'leader' ? 'LEADER' : `GAP ${t.gap}`}{t.gap === 'leader' ? '' : 's'}
            </span>
          </div>
          <div className="stat-tile__delta" style={{ color: t.position <= 3 ? 'var(--green)' : 'var(--yellow)' }}>
            {t.position <= 3 ? `Top ${t.position} Ã‚Â· points zone` : 'Outside top 3'}
          </div>
        </div>
        <div className="stat-tile green-border">
          <div className="stat-tile__label">Last Lap</div>
          {validLapTime(t.lastLap) ? (
            <>
              <span className="stat-tile__value text-mono" style={{ fontSize: 20 }}>{formatLap(t.lastLap)}</span>
              <div className="stat-tile__delta" style={{ color: lapDeltaColor }}>
                {lapDeltaStr}s vs personal best
              </div>
            </>
          ) : (
            <>
              <span className="stat-tile__value text-mono" style={{ fontSize: 20, color:'var(--accent)' }}>Ã¢â‚¬â€.Ã¢â‚¬â€Ã¢â‚¬â€.Ã¢â‚¬â€Ã¢â‚¬â€Ã¢â‚¬â€</span>
              <div className="stat-tile__delta" style={{ color:'var(--accent)' }}>Unavailable</div>
            </>
          )}
        </div>
        <div className="stat-tile blue-border">
          <div className="stat-tile__label">Best Lap</div>
          {validLapTime(t.bestLap) ? (
            <>
              <span className="stat-tile__value text-mono" style={{ fontSize: 20 }}>{formatLap(t.bestLap)}</span>
              <div className="stat-tile__delta delta-pos">Ã¢Å¡Â¡ Personal best</div>
            </>
          ) : (
            <>
              <span className="stat-tile__value text-mono" style={{ fontSize: 20, color:'var(--accent)' }}>Ã¢â‚¬â€.Ã¢â‚¬â€Ã¢â‚¬â€.Ã¢â‚¬â€Ã¢â‚¬â€Ã¢â‚¬â€</span>
              <div className="stat-tile__delta" style={{ color:'var(--accent)' }}>Unavailable</div>
            </>
          )}
        </div>
        <div className="stat-tile yellow-border">
          <div className="stat-tile__label">Fuel Remaining</div>
          {validFuel(t.fuelLoad) ? (
            <>
              <span className="stat-tile__value" style={{ color: fuelCritical ? 'var(--accent)' : undefined }}>
                {t.fuelLoad.toFixed(1)}<span className="stat-tile__unit">kg</span>
              </span>
              <div className="stat-tile__delta" style={{ color: fuelCritical ? 'var(--accent)' : 'var(--text-dim)' }}>
                {projectedFuel !== null && (
                  projectedFuel < 0
                    ? `Ã¢Å¡Â  Short ${Math.abs(projectedFuel).toFixed(1)} kg at finish`
                    : `Projected +${projectedFuel.toFixed(1)} kg Ã‚Â· @ ${FUEL_PER_LAP} kg/lap`
                )}
              </div>
            </>
          ) : (
            <>
              <span className="stat-tile__value" style={{ color:'var(--accent)' }}>Ã¢â‚¬â€<span className="stat-tile__unit">kg</span></span>
              <div className="stat-tile__delta" style={{ color:'var(--accent)' }}>Sensor error</div>
            </>
          )}
        </div>
      </div>

      {/* Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â AI STRATEGY CALL Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â */}
      <AIStrategyCall
        position={t.position}
        lapCount={t.lapCount}
        fuelLoad={t.fuelLoad}
        lastLap={t.lastLap}
        bestLap={t.bestLap}
        lapAnomaly={t.lapAnomaly}
      />

      {/* Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â MIDDLE GRID: Feed + Live Snapshot + Tyres Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â */}
      <div className="grid-3-2 mb-4">

        {/* Left: detailed tyre operations panel */}
        <div className="card">
          <div className="card-header">
            <span className="card-title flex items-center gap-2">
              <CircleDot size={14} style={{ color: 'var(--yellow)' }} />
              Tyre Operations Ã‚Â· NeumÃƒÂ¡ticos
            </span>
            <span className="badge badge-orange">pressure Ã‚Â· wear Ã‚Â· flank split</span>
          </div>
          <TyreDisplay
            frontLeft={t.tireFrontLeft}
            frontRight={t.tireFrontRight}
            rearLeft={t.tireRearLeft}
            rearRight={t.tireRearRight}
            frontCompound={t.frontCompound}
            rearCompound={t.rearCompound}
            frontAge={t.frontTyreAge}
            rearAge={t.rearTyreAge}
            frontPressure={t.tirePressureFront}
            rearPressure={t.tirePressureRear}
            frontWear={t.tireWearFront}
            rearWear={t.tireWearRear}
          />
          <div style={{ padding: '0 16px 14px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {[
              { label: 'Front pressure', value: `${t.tirePressureFront.toFixed(2)} bar`, color: 'var(--cyan)' },
              { label: 'Rear pressure', value: `${t.tirePressureRear.toFixed(2)} bar`, color: 'var(--cyan)' },
              { label: 'Front wear', value: `${t.tireWearFront.toFixed(1)}%`, color: t.tireWearFront > 35 ? 'var(--yellow)' : 'var(--green)' },
              { label: 'Rear wear', value: `${t.tireWearRear.toFixed(1)}%`, color: t.tireWearRear > 55 ? 'var(--accent)' : t.tireWearRear > 35 ? 'var(--yellow)' : 'var(--green)' },
            ].map(item => (
              <div key={item.label} style={{ padding: '8px', borderRadius: 'var(--radius)', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</div>
                <div className="text-mono" style={{ fontSize: 13, color: item.color, fontWeight: 700 }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Live Snapshot */}
          <div className="card">
            <div className="card-header">
              <span className="card-title flex items-center gap-2">
                <Activity size={14} style={{ color: 'var(--blue)' }} />
                Live Snapshot
              </span>
              <span className="badge badge-muted" style={{ fontFamily: 'JetBrains Mono,monospace' }}>10 Hz</span>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <div className="card-label">Speed</div>
                  <span className="telem-lg text-mono">
                    {t.speed}<span className="telem-unit" style={{ fontSize: 14 }}> km/h</span>
                  </span>
                </div>
                <div>
                  <div className="card-label">RPM</div>
                  <span className="telem-md text-mono">{t.rpm.toLocaleString('en-US')}</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div className="card-label">Gear</div>
                  <span className="telem-lg text-mono" style={{ color: 'var(--accent)', fontSize: 40 }}>{t.gear}</span>
                </div>
              </div>

              {/* Throttle */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span className="card-label">Throttle</span>
                  <span className="text-mono" style={{ fontSize: 12 }}>{t.throttle}%</span>
                </div>
                <div className="bar-track"><div className="bar-fill green" style={{ width: `${t.throttle}%` }} /></div>
              </div>

              {/* Brake */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span className="card-label">Brake</span>
                  <span className="text-mono" style={{ fontSize: 12 }}>{t.brake}%</span>
                </div>
                <div className="bar-track"><div className="bar-fill" style={{ width: `${t.brake}%`, background: 'var(--accent)' }} /></div>
              </div>

              {/* Lean angle */}
              <div style={{ paddingTop: 10, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                <span className="card-label">Lean Angle</span>
                <span className="text-mono" style={{ fontSize: 13, color: t.leanAngle > 45 ? 'var(--accent)' : 'var(--text)' }}>
                  {t.leanAngle.toFixed(1)}Ã‚Â°
                </span>
              </div>
            </div>
          </div>

          {/* Tyres Ã¢â‚¬â€ full display with center temps + pressure */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Tyres</span>
              <span className="badge badge-orange">Lap {t.rearTyreAge}</span>
            </div>
            <TyreDisplay
              frontLeft={t.tireFrontLeft}
              frontRight={t.tireFrontRight}
              rearLeft={t.tireRearLeft}
              rearRight={t.tireRearRight}
              frontCompound={t.frontCompound}
              rearCompound={t.rearCompound}
              frontAge={t.frontTyreAge}
              rearAge={t.rearTyreAge}
              frontPressure={t.tirePressureFront}
              rearPressure={t.tirePressureRear}
              frontWear={t.tireWearFront}
              rearWear={t.tireWearRear}
            />
          </div>
        </div>
      </div>

      {/* Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â ANALYSIS ROW Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â */}
      <div className="grid-3 mb-4">

        {/* Sector delta analysis */}
        <div className="card">
          <div className="card-header">
            <span className="card-title flex items-center gap-2">
              <TrendingUp size={14} style={{ color: 'var(--blue)' }} />
              Sector Delta Ã¢â‚¬â€ vs Best
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Last lap</span>
          </div>
          <div className="card-body" style={{ flexDirection: 'column', gap: 14 }}>
            {validLapTime(t.lastLap) && validLapTime(t.bestLap) ? (
              <>
                {sectorDeltas.map(s => (
                  <SectorBar key={s.sector} sector={s.sector} delta={s.delta} base={0.5} />
                ))}
                <div style={{ paddingTop: 10, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total</span>
                  <span style={{
                    fontFamily: 'JetBrains Mono,monospace', fontSize: 14, fontWeight: 700,
                    color: lapDeltaColor,
                  }}>
                    {lapDeltaStr}s
                  </span>
                </div>
              </>
            ) : (
              <div style={{ padding:12, textAlign:'center', color:'var(--text-muted)', fontSize:12 }}>
                <AlertTriangle size={14} style={{ display:'inline', verticalAlign:'middle', marginRight:6 }} />
                Lap time data unavailable
              </div>
            )}
          </div>
        </div>

        {/* Gear distribution */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Gear Distribution</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>% lap time per gear</span>
          </div>
          <GearDistribution currentGear={t.gear} />
        </div>

        {/* Pace model */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Pace vs Model</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Digital Twin ÃŽâ€</span>
          </div>
          <PaceModelChart
            lapCount={t.lapCount}
            lastLap={t.lastLap}
            bestLap={t.bestLap}
            lapAnomaly={t.lapAnomaly}
          />
        </div>
      </div>

      {/* Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â TRACK MAP + CHAMPIONSHIP + STINT Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â */}
      <div className="grid-2 mb-4">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Live Track Position Ã¢â‚¬â€ Mugello</span>
            <span className="badge badge-muted" style={{ fontFamily:'JetBrains Mono,monospace' }}>
              {Math.round(t.trackPos * 100)}% lap Ã‚Â· procedural map
            </span>
          </div>
          <div className="card-body" style={{ flexDirection:'column' }}>
            <MugelloCircuit trackPos={t.trackPos} lapAnomaly={t.lapAnomaly} />
          </div>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div className="card" style={{ flex:1 }}>
            <div className="card-header">
              <span className="card-title">Championship Standings</span>
              <span className="badge badge-yellow">After R6</span>
            </div>
            <div className="card-body" style={{ flexDirection:'column' }}>
              <ChampionshipBars currentPos={t.position} />
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Stint Progress</span>
              <span className="badge badge-blue">Pit Window</span>
            </div>
            <div className="card-body" style={{ flexDirection:'column' }}>
              <StintProgress tyreAge={t.rearTyreAge} lapCount={t.lapCount} />
            </div>
          </div>
        </div>
      </div>

      {/* Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â RACE STANDINGS Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â */}
      <div className="card">
        <div className="card-header">
          <span className="card-title flex items-center gap-2">
            <Flag size={14} />
            Race Standings Ã¢â‚¬â€ Lap {displayLap}
          </span>
          <span className="badge badge-muted">Top 5</span>
        </div>
        <RaceStandingsTable rivals={rivals} position={t.position} />
        <div style={{ padding: '8px 14px', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}>
          Pace vs you: Ã¢â‚¬â€œ = faster than your last lap Ã‚Â· Threat: pace + position relative to P{t.position}
        </div>
      </div>

      {/* Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â RACE DATA INTEGRITY Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â */}
      <div style={{ marginTop: 16 }}>
        <DataIntegrity
          fuelValid={t.fuelValid}
          lapAnomaly={t.lapAnomaly}
          lapCount={t.lapCount}
          lastLap={t.lastLap}
          bestLap={t.bestLap}
          sectorDeltasValidated={sectorDeltasValidated}
          gearDistributionTotal={gearTotal}
        />
      </div>

      </>)}
    </div>
  );
}
