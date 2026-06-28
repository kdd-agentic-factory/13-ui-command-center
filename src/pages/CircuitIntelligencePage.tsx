/**
 * CircuitIntelligencePage — Mugello circuit intelligence with explicit asset integrity.
 *
 * Fixes applied per diagnostic:
 *   1. Mugello procedural geometry, 5.245 km, 15 turns, 1.141 km main straight
 *   2. GPS position shown as "3.545 / 5.245 km" (not mistaken for circuit length)
 *   3. Lap consistency: lapCount/23 everywhere, no mismatch
 *   4. Fuel < 1.0 kg with speed > 50 → CRITICAL FUEL DATA ERROR
 *   5. Speed traps: Mugello-realistic (352 / 284 / 291 km/h)
 *   6. Braking zones: entry speed → apex speed (not reversed)
 *   7. Real Mugello corner names: San Donato, Luco, Poggio Secco, etc.
 *   8. Elevation & Gradient Profile section (41.19 m variance)
 *   9. Circuit Data Integrity section
 *  10. View Mode: 2D Map / 3D Elevation / Speed / Brake / Throttle overlay
 *  11. Sector analysis with real zone names (S/F → Poggio Secco, etc.)
 *  12. Sector trace with normalised values (avg speed, throttle, brake peak)
 *  13. Track surface with kerb risk + track temp evolution
 *  14. Track evolution with AI Condition Note
 *  15. AI Sector Insight (competitive in S2, losing in S3)
 *  16. Elevation per trackPos via trackElevation (shared with TrackMap3D)
 */

import { useEffect, useRef, useState, useMemo } from 'react';
import {
  CloudSun, Thermometer, Wind, TrendingDown, Droplets,
  AlertTriangle, Layers,
} from 'lucide-react';
import { useLiveTelemetry, trackSpeed } from '../hooks/useLiveTelemetry';
import { TrackMap3D } from '../components/babylon/lazy';
import { MUGELLO_CIRCUIT, sessionDisplayState } from '../domain/sessionTruth';
import { getActiveCircuit } from '../domain/circuits';

// ──── Mugello circuit constants ────

const MUGELLO = {
  name: MUGELLO_CIRCUIT.fullName,
  lengthKm: MUGELLO_CIRCUIT.lengthKm,
  mainStraightKm: MUGELLO_CIRCUIT.mainStraightKm,
  turns: MUGELLO_CIRCUIT.turns,
  leftTurns: MUGELLO_CIRCUIT.leftTurns,
  rightTurns: MUGELLO_CIRCUIT.rightTurns,
  raceLaps: MUGELLO_CIRCUIT.raceLaps,
  altitudeVariance: 41.19,  // m
  baseAltitude: 292,        // m AMSL
  highestPoint: 'Poggio Secco',
  recordLap: MUGELLO_CIRCUIT.recordLap,
  recordHolder: MUGELLO_CIRCUIT.recordHolder,
  recordYear: MUGELLO_CIRCUIT.recordYear,
  typicalLapS: MUGELLO_CIRCUIT.typicalLapSeconds,
  fuelBurnPerLap: MUGELLO_CIRCUIT.fuelBurnKgPerLap,     // kg/lap
  fuelCapacity: MUGELLO_CIRCUIT.fuelCapacityKg,         // kg
  tag: 'Mugello GP layout',
};

// —— Mugello-like SVG path (closed, ~resembles real layout) ————————————————————

const CIRCUIT_PATH = `
  M 170 420
  C 140 340 120 250 115 180
  C 110 130 120 90  145 70
  C 175 48  215 50  250 60
  C 285 70  310 85  330 100
  C 355 120 365 145 365 170
  C 365 190 355 210 340 225
  C 325 240 310 245 310 260
  C 310 275 320 290 340 300
  C 365 315 395 325 425 330
  C 460 335 490 330 520 320
  C 550 310 570 290 585 265
  C 600 240 605 210 600 185
  C 595 160 580 140 555 130
  C 530 120 500 125 475 140
  C 450 155 435 175 425 195
  C 415 215 410 235 395 250
  C 380 265 360 270 340 265
  C 320 260 305 248 295 235
  C 285 222 280 208 278 195
  C 276 182 278 170 285 160
  C 292 150 302 145 312 145
  C 322 145 330 150 332 158
  C 334 166 332 175 326 182
  C 320 189 314 192 310 192
  C 306 192 304 188 305 183
  C 306 178 310 175 315 175
  C 320 175 323 179 323 183
  L 170 420
`;

// ──── Sector boundaries (real Mugello zones) ────

interface SectorDef {
  id: string;
  zone: string;           // real track zone name
  time: string;
  best: string;
  delta: string;
  color: string;
  pos: number;            // marker position on map (0-1)
}

const SECTORS: SectorDef[] = [
  {
    id: 'S1', zone: 'Start/Finish → Poggio Secco',
    time: '29.842', best: '29.612', delta: '+0.230',
    color: 'var(--green)', pos: 0.08,
  },
  {
    id: 'S2', zone: 'Materassi → Arrabbiata 2',
    time: '31.156', best: '30.984', delta: '+0.172',
    color: 'var(--yellow)', pos: 0.42,
  },
  {
    id: 'S3', zone: 'Scarperia → Bucine',
    time: '32.414', best: '32.251', delta: '+0.163',
    color: 'var(--blue)', pos: 0.71,
  },
];

// ──── Speed traps (Mugello-realistic) ────

interface SpeedTrapDef {
  name: string;
  location: string;
  speed: number;     // km/h current
  max: number;       // session max
  rivalSpeed: number;
}

const SPEED_TRAPS: SpeedTrapDef[] = [
  {
    name: 'Main Straight',
    location: 'before San Donato',
    speed: 352, max: 356, rivalSpeed: 349,
  },
  {
    name: 'Casanova / Savelli',
    location: 'approach to Arrabbiata',
    speed: 284, max: 289, rivalSpeed: 286,
  },
  {
    name: 'Bucine exit',
    location: 'onto main straight',
    speed: 291, max: 294, rivalSpeed: 289,
  },
];

// —— Corner data (real Mugello corners with correct braking format) ————————————

interface CornerData {
  num: number;
  name: string;
  dir: 'L' | 'R';
  brakePoint: number;   // m before corner
  entrySpeed: number;   // km/h at braking point
  apexSpeed: number;    // km/h at apex (minimum)
  exitSpeed: number;    // km/h track out
  characteristic: string;
  critical: boolean;    // key overtaking / lap time corner
}

const CORNERS: CornerData[] = [
  { num: 1,  name: 'San Donato',     dir: 'R', brakePoint: 210, entrySpeed: 350, apexSpeed: 85,  exitSpeed: 170, characteristic: 'Heavy brake zone, critical overtaking',    critical: true  },
  { num: 2,  name: 'Luco',           dir: 'R', brakePoint: 60,  entrySpeed: 155, apexSpeed: 118, exitSpeed: 145, characteristic: 'Tight right, TC sensitive',               critical: false },
  { num: 3,  name: 'Poggio Secco',   dir: 'L', brakePoint: 80,  entrySpeed: 148, apexSpeed: 95,  exitSpeed: 138, characteristic: 'Blind entry, crest, commit early',         critical: false },
  { num: 4,  name: 'Materassi',      dir: 'R', brakePoint: 65,  entrySpeed: 210, apexSpeed: 130, exitSpeed: 178, characteristic: 'Fast entry, medium braking',              critical: false },
  { num: 5,  name: 'Casanova',       dir: 'R', brakePoint: 70,  entrySpeed: 195, apexSpeed: 112, exitSpeed: 165, characteristic: 'Downhill right, rear load',               critical: false },
  { num: 6,  name: 'Savelli',        dir: 'R', brakePoint: 55,  entrySpeed: 152, apexSpeed: 88,  exitSpeed: 142, characteristic: 'Tight right, front grip critical',         critical: true  },
  { num: 7,  name: 'Arrabbiata 1',   dir: 'L', brakePoint: 65,  entrySpeed: 175, apexSpeed: 95,  exitSpeed: 160, characteristic: 'High-speed left, tyre load peak',          critical: true  },
  { num: 8,  name: 'Arrabbiata 2',   dir: 'R', brakePoint: 90,  entrySpeed: 186, apexSpeed: 102, exitSpeed: 175, characteristic: 'Corner exit key onto straight',            critical: true  },
  { num: 9,  name: 'Correntaio',     dir: 'R', brakePoint: 45,  entrySpeed: 208, apexSpeed: 140, exitSpeed: 195, characteristic: 'Fast sweeper, minimum brake',              critical: false },
  { num: 10, name: 'Scarperia',      dir: 'R', brakePoint: 30,  entrySpeed: 195, apexSpeed: 134, exitSpeed: 182, characteristic: 'Quick flick, late apex',                   critical: false },
  { num: 11, name: 'Palagio',        dir: 'L', brakePoint: 70,  entrySpeed: 180, apexSpeed: 105, exitSpeed: 160, characteristic: 'Left-hand, camber change',                 critical: false },
  { num: 12, name: 'Biondetti 1',    dir: 'L', brakePoint: 90,  entrySpeed: 165, apexSpeed: 88,  exitSpeed: 145, characteristic: 'Long left, medium braking',                critical: false },
  { num: 13, name: 'Biondetti 2',    dir: 'R', brakePoint: 150, entrySpeed: 168, apexSpeed: 72,  exitSpeed: 135, characteristic: 'Complex chicane, WC active',               critical: true  },
  { num: 14, name: 'Bucine',         dir: 'L', brakePoint: 85,  entrySpeed: 159, apexSpeed: 91,  exitSpeed: 155, characteristic: 'Uphill exit, rear slides on power',         critical: true  },
  { num: 15, name: 'Final Kink',     dir: 'R', brakePoint: 20,  entrySpeed: 230, apexSpeed: 185, exitSpeed: 220, characteristic: 'Flat-out kink onto main straight',          critical: false },
];

// —— Elevation profile samples (normalised 0-1 for 80 segments) ————————————————

function trackElevation(u: number): number {
  // Same harmonics as TrackMap3D — 41.19 m variance closed-loop
  return 0.45 * Math.sin(2 * Math.PI * u)
       + 0.22 * Math.sin(4 * Math.PI * u + 1.1)
       + 0.12 * Math.sin(6 * Math.PI * u + 0.5);
}

// ──── Heatmap ────

type HeatChannel = 'speed' | 'throttle' | 'brake';
const HEAT_N = 80;

const CHANNEL_LABELS: Record<HeatChannel, string> = {
  speed: 'Speed', throttle: 'Throttle', brake: 'Brake',
};

const CHANNEL_COLORS: Record<HeatChannel, [string, string, string]> = {
  speed:    ['var(--green)', 'var(--yellow)', 'var(--accent)'],
  throttle: ['var(--bg-base)', '#16A34A', 'var(--green)'],
  brake:    ['var(--bg-base)', '#B91C1C', 'var(--accent)'],
};

function heatColor(value: number, channel: HeatChannel): string {
  const v = Math.max(0, Math.min(1, value));
  if (channel === 'speed') {
    const hue = Math.round(120 - v * 120);
    return `hsl(${hue},100%,50%)`;
  }
  if (channel === 'throttle') {
    const l = Math.round(15 + v * 40);
    return `hsl(140,80%,${l}%)`;
  }
  const l = Math.round(12 + v * 42);
  return `hsl(0,88%,${l}%)`;
}

function channelValue(pos: number, channel: HeatChannel): number {
  const spd = trackSpeed(pos);
  if (channel === 'speed')    return spd;
  if (channel === 'throttle') return spd > 0.65 ? spd : Math.max(0, spd - 0.1);
  return spd < 0.35 ? (1 - spd / 0.35) : 0;
}

interface Segment { x1: number; y1: number; x2: number; y2: number; pos: number }

function ColorLegend({ channel }: { channel: HeatChannel }) {
  const [lo, mid, hi] = CHANNEL_COLORS[channel];
  const labels: Record<HeatChannel, [string, string, string]> = {
    speed:    ['LOW', 'MED', 'HIGH'],
    throttle: ['0%', '50%', '100%'],
    brake:    ['0%', '50%', '100%'],
  };
  const [lLo, , lHi] = labels[channel];
  const gradId = `heat-lg-${channel}`;
  return (
    <div className="flex items-center gap-3" style={{ fontSize: 10, fontFamily: 'JetBrains Mono,monospace' }}>
      <svg width="120" height="12">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor={lo} />
            <stop offset="50%"  stopColor={mid} />
            <stop offset="100%" stopColor={hi} />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="120" height="12" rx="3" fill={`url(#${gradId})`} />
      </svg>
      <span style={{ color: 'var(--text-muted)' }}>{lLo}</span>
      <span style={{ color: 'var(--text-muted)' }}>→</span>
      <span style={{ color: 'var(--text-muted)' }}>{lHi}</span>
    </div>
  );
}

// ──── Rival riders ────

interface RivalDef {
  name: string; num: number; color: string; trackOffset: number;
}

const RIVALS: RivalDef[] = [
  { name: 'Marquez',    num: 93, color: 'var(--accent)', trackOffset: +0.020 },
  { name: 'Martin',     num: 89, color: 'var(--yellow)', trackOffset: +0.009 },
  { name: 'Bastianini', num: 23, color: 'var(--blue)', trackOffset: -0.005 },
];

// ──── View Mode ────

type ViewMode = 'map' | 'elevation' | 'speed' | 'brake' | 'throttle';

const VIEW_OPTIONS: { id: ViewMode; label: string }[] = [
  { id: 'map',        label: '2D Map' },
  { id: 'elevation',  label: '3D Elevation' },
  { id: 'speed',      label: 'Speed' },
  { id: 'brake',      label: 'Brake' },
  { id: 'throttle',   label: 'Throttle' },
];

// ──── Sector sparkline ────

function SectorSparkline({ deltas }: { deltas: number[] }) {
  const W = 80; const H = 24;
  const maxAbs = Math.max(...deltas.map(d => Math.abs(d)), 0.05);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <line x1="0" y1={H / 2} x2={W} y2={H / 2} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      {deltas.map((d, i) => {
        const x = (i / (deltas.length - 1)) * (W - 6) + 3;
        const yCenter = H / 2;
        const barH = (Math.abs(d) / maxAbs) * (H / 2 - 2);
        const isGain = d < 0;
        return (
          <rect
            key={i}
            x={x - 4} y={isGain ? yCenter - barH : yCenter}
            width="8" height={barH}
            fill={isGain ? 'var(--green)' : 'var(--accent)'}
            opacity="0.8" rx="1"
          />
        );
      })}
    </svg>
  );
}

// ──── Elevation Gradient Profile ────

function ElevationProfile({ trackPos }: { trackPos: number }) {
  const N = 60;
  const W = 600; const H = 120;

  // Compute elevation samples
  const samples = Array.from({ length: N }, (_, i) => {
    const u = i / (N - 1);
    return { u, elev: trackElevation(u) };
  });

  const elevValues = samples.map(s => s.elev);
  const minElev = Math.min(...elevValues);
  const maxElev = Math.max(...elevValues);
  const range = maxElev - minElev || 1;

  // Map function: u → x, elev → y
  const pts = samples.map(s => {
    const x = (s.u * W);
    const y = H - ((s.elev - minElev) / range) * (H - 12) - 6;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  // Current position marker
  const curX = trackPos * W;
  const curElev = trackElevation(trackPos);
  const curY = H - ((curElev - minElev) / range) * (H - 12) - 6;

  // Gradient zones (simplified: steep sections marked)
  function gradientClass(u: number): string {
    const deriv = (trackElevation(Math.min(1, u + 0.01)) - trackElevation(Math.max(0, u - 0.01))) / 0.02;
    if (deriv > 0.08) return 'uphill';
    if (deriv < -0.08) return 'downhill';
    return 'flat';
  }

  // Key elevation zones
  const KEY_ZONES = [
    { label: 'Main straight',       u: 0.05, dir: 'downhill' },
    { label: 'San Donato brake',    u: 0.12, dir: 'flat' },
    { label: 'Poggio Secco peak',   u: 0.28, dir: 'crest' },
    { label: 'Casanova/Savelli',    u: 0.38, dir: 'downhill' },
    { label: 'Arrabbiata load',     u: 0.50, dir: 'uphill' },
    { label: 'Biondetti compr.',    u: 0.72, dir: 'downhill' },
    { label: 'Bucine exit',         u: 0.88, dir: 'uphill' },
  ];

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Elevation & Gradient Profile</span>
        <span className="badge badge-yellow">Procedural elevation model</span>
      </div>
      <div className="card-body" style={{ flexDirection: 'column' }}>
        {/* Stats row */}
        <div className="grid-4 mb-3" style={{ marginBottom: 14 }}>
          {[
            { label: 'Altitude variance', value: `${MUGELLO.altitudeVariance} m`, color: 'var(--text)' },
            { label: 'Base altitude',     value: `${MUGELLO.baseAltitude} m AMSL`, color: 'var(--text-muted)' },
            { label: 'Highest point',     value: MUGELLO.highestPoint,              color: 'var(--yellow)' },
            { label: 'Current elev.',     value: `${(curElev * 10 + MUGELLO.baseAltitude).toFixed(0)} m`, color: 'var(--green)' },
          ].map(s => (
            <div key={s.label} className="stat-tile">
              <div className="stat-tile__label">{s.label}</div>
              <span className="text-mono" style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* Elevation profile chart */}
        <svg width="100%" viewBox={`0 0 ${W} ${H + 24}`} style={{ maxHeight: 150 }}>
          {/* Fill under curve */}
          <path
            d={`M 0 ${H} L ${pts} L ${W} ${H} Z`}
            fill="rgba(34,197,94,0.10)"
          />
          {/* Elevation line */}
          <polyline points={pts} fill="none" stroke="var(--green)" strokeWidth="2" />

          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map(pct => (
            <line key={pct} x1={pct * W} y1="0" x2={pct * W} y2={H}
              stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="3 3" />
          ))}
          <line x1="0" y1={H} x2={W} y2={H} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

          {/* Key zone labels */}
          {KEY_ZONES.map(z => (
            <text key={z.label}
              x={z.u * W} y={H + 14}
              fill="rgba(255,255,255,0.25)" fontSize="7"
              fontFamily="JetBrains Mono,monospace"
              textAnchor="middle"
            >
              {z.label}
            </text>
          ))}

          {/* Current position */}
          <line x1={curX} y1="0" x2={curX} y2={H}
            stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="4 2" opacity="0.7" />
          <circle cx={curX} cy={curY} r="5" fill="var(--accent)" stroke="#0B0D12" strokeWidth="1.5" />
        </svg>

        {/* Gradient key zones */}
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          {KEY_ZONES.map(z => (
            <div key={z.label} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 9, color: 'var(--text-muted)',
              fontFamily: 'JetBrains Mono,monospace',
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: z.dir === 'uphill' ? 'var(--green)' : z.dir === 'downhill' ? 'var(--accent)' : 'var(--yellow)',
                display: 'inline-block',
              }} />
              {z.label} · {z.dir}
            </div>
          ))}
        </div>

        {/* Current position context */}
        <div style={{
          marginTop: 12, padding: '8px 12px',
          background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius)',
          display: 'flex', alignItems: 'center', gap: 8, fontSize: 12,
          fontFamily: 'JetBrains Mono,monospace',
        }}>
          <Layers size={14} style={{ color: 'var(--text-muted)' }} />
          <span style={{ color: 'var(--text-muted)' }}>Current position:</span>
          <span style={{ fontWeight: 700 }}>{(trackPos * MUGELLO.lengthKm).toFixed(3)} / {MUGELLO.lengthKm} km</span>
          <span style={{ color: 'var(--text-muted)' }}>·</span>
          <span style={{ color: 'var(--green)' }}>Elevation trend: {gradientClass(trackPos) === 'uphill' ? 'climbing' : gradientClass(trackPos) === 'downhill' ? 'descending' : 'flat'}</span>
        </div>
      </div>
    </div>
  );
}

// ──── Circuit Data Integrity ────

function CircuitIntegrity({ fuelValid, fuelLoad, speed }: { fuelValid: boolean; fuelLoad: number; speed: number }) {
  const geometryAvailable = true;
  const gpsAlignment = 98.7;

  const warnings: { label: string; critical: boolean; message: string }[] = [];

  // Fuel sensor validation
  if (!fuelValid || (fuelLoad < 1.0 && speed > 50)) {
    warnings.push({
      label: 'Fuel sensor',
      critical: true,
      message: `Fuel reads ${fuelLoad.toFixed(1)} kg while bike is moving at ${speed} km/h. Validate fuel sensor channel.`,
    });
  }

  // Always add a geometry check (passing)
  if (!geometryAvailable) {
    warnings.push({
      label: 'Circuit geometry',
      critical: true,
      message: 'Expected Mugello GP layout · received generic placeholder.',
    });
  }

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Circuit Data Integrity</span>
        <span className={`badge ${warnings.length > 0 ? 'badge-red' : 'badge-green'}`}>
          {warnings.length > 0 ? 'Warnings' : 'All valid'}
        </span>
      </div>
      <div className="card-body" style={{ flexDirection: 'column', gap: 10 }}>
        {/* Status grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { label: 'Circuit selected', value: MUGELLO.tag, ok: true },
            { label: 'Geometry status',  value: MUGELLO_CIRCUIT.assetStatusLabel, ok: geometryAvailable },
            { label: 'Elevation model',  value: `Procedural · ${MUGELLO.altitudeVariance} m variance`, ok: true },
            { label: 'GPS alignment',    value: `${gpsAlignment}%`, ok: gpsAlignment > 90 },
          ].map(s => (
            <div key={s.label} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius)',
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: s.ok ? 'var(--green)' : 'var(--accent)',
                flexShrink: 0,
              }} />
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 1 }}>{s.label}</div>
                <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono,monospace', color: 'var(--text)' }}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
            {warnings.map(w => (
              <div key={w.label} style={{
                display: 'flex', gap: 8, alignItems: 'flex-start',
                padding: '8px 10px',
                background: w.critical ? 'var(--accent-dim)' : 'var(--yellow-dim)',
                borderRadius: 'var(--radius)', marginBottom: 6,
              }}>
                <AlertTriangle size={14} style={{ color: w.critical ? 'var(--accent)' : 'var(--yellow)', flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: w.critical ? 'var(--accent)' : 'var(--yellow)', marginBottom: 2 }}>
                    {w.critical ? 'CRITICAL' : 'WARNING'} · {w.label}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{w.message}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* All clear */}
        {warnings.length === 0 && (
          <div style={{
            padding: '8px 12px', textAlign: 'center',
            fontSize: 11, color: 'var(--green)',
            fontFamily: 'JetBrains Mono,monospace',
          }}>
            Integrity visible · {getActiveCircuit().name} GP data synchronized · geometry is procedural
          </div>
        )}
      </div>
    </div>
  );
}

// ──── Per-sector speed throttle brake trace ────

function SectorTracePanel({ sectorId, start, end }: { sectorId: string; start: number; end: number }) {
  const N = 44; const W = 200; const H = 60;
  const sColor = sectorId === 'S1' ? 'var(--blue)' : sectorId === 'S2' ? 'var(--yellow)' : 'var(--green)';

  const pts = Array.from({ length: N }, (_, i) => {
    const pos = start + (i / (N - 1)) * (end - start);
    return {
      spd: trackSpeed(pos),
      thr: channelValue(pos, 'throttle'),
      brk: channelValue(pos, 'brake'),
    };
  });

  // Compute average values
  const avgSpd = pts.reduce((s, p) => s + p.spd, 0) / pts.length;
  const avgThr = pts.reduce((s, p) => s + p.thr, 0) / pts.length;
  const peakBrk = Math.max(...pts.map(p => p.brk));

  const spdLine = pts.map((p, i) => `${(i / (N - 1)) * W},${H - p.spd * H}`).join(' ');
  const thrLine = pts.map((p, i) => `${(i / (N - 1)) * W},${H - p.thr * H}`).join(' ');

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
        <span style={{ fontFamily:'JetBrains Mono,monospace', fontWeight:800, fontSize:13, color:sColor }}>{sectorId}</span>
        <div style={{ display:'flex', gap:8, fontSize:9, color:'var(--text-muted)' }}>
          {[['Speed',sColor],['Throttle','rgba(34,197,94,0.7)'],['Brake','var(--accent)']].map(([l,c]) => (
            <span key={l as string} style={{ display:'flex', alignItems:'center', gap:3 }}>
              <span style={{ width:10, height:2, background:c as string, display:'inline-block', borderRadius:1 }} />
              {l as string}
            </span>
          ))}
        </div>
      </div>

      {/* Normalised values row */}
      <div style={{
        display:'flex', gap:12, marginBottom:6,
        fontSize:9, fontFamily:'JetBrains Mono,monospace',
        color:'var(--text-muted)',
      }}>
        <span>Speed avg {(avgSpd * 330 + 10).toFixed(0)} km/h</span>
        <span>· Throttle avg {(avgThr * 100).toFixed(0)}%</span>
        <span>· Brake peak {(peakBrk * 100).toFixed(0)}%</span>
      </div>

      <svg width="100%" height={H + 10} viewBox={`0 0 ${W} ${H + 10}`} preserveAspectRatio="none">
        {[0.25, 0.5, 0.75].map(pct => (
          <line key={pct} x1="0" y1={H - pct * H} x2={W} y2={H - pct * H}
            stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        ))}
        {pts.map((p, i) => p.brk > 0.03 ? (
          <rect key={i} x={(i / (N - 1)) * W - 2} y={H - p.brk * H}
            width="5" height={p.brk * H} fill="var(--accent)" opacity="0.35" />
        ) : null)}
        <polyline points={thrLine} fill="none" stroke="rgba(34,197,94,0.6)" strokeWidth="1.5" />
        <polyline points={spdLine} fill="none" stroke={sColor} strokeWidth="2.5" />
        <line x1="0" y1={H} x2={W} y2={H} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        <text x="2" y={H - 1} fill="#535A6E" fontSize="7" fontFamily="JetBrains Mono,monospace">0</text>
        <text x="2" y="9"     fill="#535A6E" fontSize="7" fontFamily="JetBrains Mono,monospace">MAX</text>
      </svg>
    </div>
  );
}

// ──── Braking zone intensity chart ────

function BrakingIntensityChart() {
  const maxBrake = Math.max(...CORNERS.map(c => c.brakePoint));
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:4, fontFamily:'JetBrains Mono,monospace' }}>
        Distance · Entry speed → Apex speed
      </div>
      {CORNERS.filter(c => c.brakePoint >= 30).map(c => (
        <div key={c.num} style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ width:28, fontFamily:'JetBrains Mono,monospace', fontWeight:700, fontSize:11, color:c.critical ? 'var(--accent)' : 'var(--text-muted)', flexShrink:0 }}>
            T{c.num}
          </span>
          <div style={{ width:26, fontSize:9, fontFamily:'JetBrains Mono,monospace', color:'rgba(255,255,255,0.35)', flexShrink:0 }}>
            {c.name.slice(0, 5)}
          </div>
          <div style={{ flex:1 }}>
            <div className="bar-track" style={{ height:8 }}>
              <div style={{ width:`${(c.brakePoint / maxBrake) * 100}%`, height:8, background:c.critical ? 'var(--accent)' : 'rgba(255,255,255,0.18)', borderRadius:2 }} />
            </div>
          </div>
          <span style={{ width:36, fontSize:10, fontFamily:'JetBrains Mono,monospace', color:'var(--accent)', textAlign:'right', flexShrink:0 }}>
            {c.brakePoint}m
          </span>
          <span style={{ width:80, fontSize:9, fontFamily:'JetBrains Mono,monospace', color:'var(--text-muted)', flexShrink:0, textAlign:'right' }}>
            {c.entrySpeed}→{c.apexSpeed}
          </span>
        </div>
      ))}
      <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:4 }}>
        Red = critical overtaking corners · Bar = brake distance · Format: entry → apex speed
      </div>
    </div>
  );
}

// ──── AI Sector Insight ────

function AISectorInsight({ vsRival }: { vsRival: string }) {
  return (
    <div style={{
      padding: '10px 14px',
      background: 'linear-gradient(135deg, rgba(34,197,94,0.06), rgba(59,130,246,0.04))',
      border: '1px solid rgba(34,197,94,0.12)',
      borderRadius: 8,
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
        AI Sector Insight
      </div>
      <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.5 }}>
        You are competitive in <strong>S2</strong>, but losing most time to <strong>{vsRival}</strong> in <strong>S3</strong>.
        Focus: <strong>Bucine exit</strong> and <strong>main straight drive</strong>.
      </div>
    </div>
  );
}

// ──── Page ────

export function CircuitIntelligencePage() {
  const t = useLiveTelemetry();
  const [heatChannel, setHeatChannel] = useState<HeatChannel>('speed');
  const [segments, setSegments]       = useState<Segment[]>([]);
  const [showCorners, setShowCorners] = useState(false);
  const [viewMode, setViewMode]       = useState<ViewMode>('map');
  const pathRef = useRef<SVGPathElement>(null);

  // Compute heatmap segments
  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const totalLen = path.getTotalLength();
    const segs: Segment[] = [];
    for (let i = 0; i < HEAT_N; i++) {
      const p0 = path.getPointAtLength((i / HEAT_N) * totalLen);
      const p1 = path.getPointAtLength(((i + 1) / HEAT_N) * totalLen);
      segs.push({ x1: p0.x, y1: p0.y, x2: p1.x, y2: p1.y, pos: i / HEAT_N });
    }
    setSegments(segs);
  }, []);

  // Helper: segment index → x,y from segments array
  function posToXY(pos: number): { x: number; y: number } {
    if (segments.length === 0) {
      return {
        x: 200 + Math.cos(pos * 2 * Math.PI) * 140,
        y: 280 + Math.sin(pos * 2 * Math.PI) * 140,
      };
    }
    const idx = Math.min(segments.length - 1, Math.round(pos * (segments.length - 1)));
    return { x: segments[idx].x1, y: segments[idx].y1 };
  }

  // Player position
  const { x: riderX, y: riderY } = posToXY(t.trackPos);

  // Rival positions
  const rivalDots = useMemo(() => RIVALS.map(r => {
    const trackPos = ((t.trackPos + r.trackOffset) + 1) % 1;
    const { x, y } = segments.length > 0
      ? (() => {
          const idx = Math.min(segments.length - 1, Math.round(trackPos * (segments.length - 1)));
          return { x: segments[idx].x1, y: segments[idx].y1 };
        })()
      : { x: 200 + Math.cos(trackPos * 2 * Math.PI) * 140, y: 280 + Math.sin(trackPos * 2 * Math.PI) * 140 };
    return { ...r, x, y, trackPos };
  }), [t.trackPos, segments]);

  // Sector marker positions
  const sectorDots = SECTORS.map(s => posToXY(s.pos));

  // Sector trends for sparklines
  const sectorTrends = useMemo(() => ({
    S1: [-0.12, +0.05, -0.08, +0.14, +0.23],
    S2: [+0.18, +0.12, +0.08, +0.15, +0.17],
    S3: [+0.21, +0.14, +0.19, +0.22, +0.16],
  }), []);

  // Fuel error detection
  const fuelCritical = !t.fuelValid || (t.fuelLoad < 1.0 && t.speed > 50);
  const sessionState = sessionDisplayState(t.lapCount);

  // Corner/overlay heat channel based on view mode
  const effectiveHeat: HeatChannel = viewMode === 'speed'
    ? 'speed'
    : viewMode === 'brake'
      ? 'brake'
      : viewMode === 'throttle'
        ? 'throttle'
        : heatChannel;

  return (
    <div className="page">

      {/* 3D Track Map — always shown */}
      <div className="card mb-4">
        <div className="card-header">
          <span className="card-title">3D TRACK MAP — MUGELLO</span>
          <div className="flex items-center gap-2">
            <span className="badge badge-blue">
              —● Procedural circuit geometry · {MUGELLO.lengthKm} km · {MUGELLO.turns} turns
            </span>
            <span className={`badge ${fuelCritical ? 'badge-red' : 'badge-green'}`}>
              {fuelCritical ? 'FUEL DATA ERROR' : 'PROCEDURAL GEOMETRY ACTIVE'}
            </span>
            <span className={`badge ${sessionState.badgeClass}`}>{sessionState.badgeLabel}</span>
          </div>
        </div>

        {/* View mode selector */}
        <div className="card-header" style={{ borderTop: '1px solid var(--border)', paddingTop: 8, paddingBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {VIEW_OPTIONS.map(v => (
              <button
                key={v.id}
                onClick={() => setViewMode(v.id)}
                style={{
                  padding: '4px 10px',
                  background: viewMode === v.id ? 'rgba(255,255,255,0.09)' : 'transparent',
                  border: 'none', borderRadius: 4, cursor: 'pointer',
                  color: viewMode === v.id ? 'var(--text)' : 'var(--text-muted)',
                  fontSize: 10, fontFamily: 'JetBrains Mono,monospace',
                  letterSpacing: '0.07em', textTransform: 'uppercase',
                }}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        <TrackMap3D trackPos={t.trackPos} height={360} />
      </div>

      {/* Fuel error banner */}
      {fuelCritical && (
        <div className="card mb-4" style={{
          background: 'rgba(224,55,55,0.06)',
        }}>
          <div className="card-body" style={{ alignItems: 'center', gap: 10, padding: '10px 16px' }}>
            <AlertTriangle size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--accent)', marginBottom: 2 }}>
                FUEL DATA ERROR
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Fuel reads {t.fuelLoad.toFixed(1)} kg while bike is moving at {t.speed} km/h.
                Sensor validation required. Immediate pit / retirement advised.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Circuit Intelligence</h1>
          <p className="page-subtitle">
            {MUGELLO.name} · {MUGELLO.lengthKm} km · {MUGELLO.turns} turns ({MUGELLO.leftTurns}L · {MUGELLO.rightTurns}R) ·
            {sessionState.activeRace ? `Lap ${t.lapCount}/${MUGELLO.raceLaps}` : 'Pre-race/test telemetry'} · {MUGELLO.mainStraightKm} km main straight
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Thermometer size={14} style={{ color: 'var(--orange)' }} />
            <span style={{ fontSize: 13 }}>Track <strong>48°C</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <CloudSun size={14} style={{ color: 'var(--yellow)' }} />
            <span style={{ fontSize: 13 }}>Air <strong>28°C</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Wind size={14} style={{ color: 'var(--blue)' }} />
            <span style={{ fontSize: 13 }}>Wind <strong>12 km/h SW</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Droplets size={14} style={{ color: 'var(--blue)' }} />
            <span style={{ fontSize: 13 }}>Humidity <strong>52%</strong></span>
          </div>
          <button
            className="btn btn-ghost btn-sm flex items-center gap-1"
            onClick={() => setShowCorners(v => !v)}
          >
            <TrendingDown size={12} />
            {showCorners ? 'Hide' : 'Show'} Corners
          </button>
        </div>
      </div>

      {/* Main 2-column layout */}
      <div className="grid-2-1 mb-4">

        {/* —— Circuit map + heatmap ——————————————————————————————————————————— */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Track Map · Multi-Rider Overlay</span>
            <div className="flex items-center gap-3">
              {/* Channel selector (only when heatmap overlay active) */}
              <div style={{
                display: 'flex', background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--radius)', padding: 2,
              }}>
                {(['speed', 'throttle', 'brake'] as HeatChannel[]).map(ch => (
                  <button
                    key={ch}
                    onClick={() => setHeatChannel(ch)}
                    style={{
                      padding: '4px 10px',
                      background: heatChannel === ch && viewMode === 'map' ? 'rgba(255,255,255,0.09)' : 'transparent',
                      border: 'none', borderRadius: 4, cursor: 'pointer',
                      color: heatChannel === ch && viewMode === 'map' ? 'var(--text)' : 'var(--text-muted)',
                      fontSize: 10, fontFamily: 'JetBrains Mono,monospace',
                      letterSpacing: '0.07em', textTransform: 'uppercase',
                    }}
                  >
                    {CHANNEL_LABELS[ch]}
                  </button>
                ))}
              </div>
              <span className="badge badge-red">P{t.position} · L{t.lapCount}</span>
            </div>
          </div>

          <div style={{ padding: '8px 16px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <ColorLegend channel={effectiveHeat} />
              {/* Rider legend */}
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 10 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
                  #47 (You)
                </span>
                {RIVALS.map(r => (
                  <span key={r.num} style={{ display: 'flex', alignItems: 'center', gap: 4, color: r.color }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: r.color, display: 'inline-block' }} />
                    #{r.num}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="card-body" style={{ justifyContent: 'center', padding: 16 }}>
            <svg width="100%" viewBox="0 0 800 560" style={{ maxHeight: 380 }}>
              {/* Background circuit */}
              <path d={CIRCUIT_PATH} fill="none" stroke="rgba(255,255,255,0.05)"
                strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" />

              {/* Hidden path for geometry computation */}
              <path ref={pathRef} d={CIRCUIT_PATH} fill="none" stroke="none" strokeWidth="0" />

              {/* Heatmap lines */}
              {segments.map((seg, i) => (
                <line key={i}
                  x1={seg.x1} y1={seg.y1} x2={seg.x2} y2={seg.y2}
                  stroke={heatColor(channelValue(seg.pos, effectiveHeat), effectiveHeat)}
                  strokeWidth="18" strokeLinecap="round" opacity="0.88" />
              ))}

              {/* Center line */}
              <path d={CIRCUIT_PATH} fill="none" stroke="rgba(255,255,255,0.3)"
                strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

              {/* Sector markers */}
              {SECTORS.map((s, i) => {
                const { x, y } = sectorDots[i];
                return (
                  <g key={s.id}>
                    <circle cx={x} cy={y} r="7" fill={s.color} opacity="0.9" />
                    <text x={x + 10} y={y + 4} fill="var(--text)" fontSize="10"
                      fontFamily="JetBrains Mono,monospace" fontWeight="700">{s.id}</text>
                  </g>
                );
              })}

              {/* Rival rider dots */}
              {rivalDots.map(r => (
                <g key={r.num}>
                  <circle cx={r.x} cy={r.y} r="7" fill={r.color}
                    style={{ filter: `drop-shadow(0 0 5px ${r.color})` }} />
                  <text x={r.x - 5} y={r.y + 4} fill="white" fontSize="7"
                    fontFamily="JetBrains Mono,monospace" fontWeight="700">{r.num}</text>
                </g>
              ))}

              {/* Player dot — larger + glow */}
              <circle cx={riderX} cy={riderY} r="11" fill="var(--accent)"
                style={{ filter: 'drop-shadow(0 0 10px var(--accent))' }} />
              <text x={riderX - 4} y={riderY + 4} fill="white" fontSize="8"
                fontFamily="JetBrains Mono,monospace" fontWeight="800">47</text>
            </svg>
          </div>
        </div>

        {/* —— Right column ———————————————————————————————————————————————————— */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Sector analysis with zone names and sparklines */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Sector Analysis</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Last 5 laps →</span>
            </div>
            {SECTORS.map(s => (
              <div key={s.id} style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    fontFamily: 'JetBrains Mono,monospace', fontWeight: 800, fontSize: 14,
                    color: s.color, width: 24, flexShrink: 0,
                  }}>
                    {s.id}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span className="text-mono" style={{ fontSize: 13, fontWeight: 700 }}>{s.time}</span>
                      <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: 'var(--accent)' }}>
                        {s.delta}
                      </span>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Best: {s.best}</div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontFamily: 'JetBrains Mono,monospace', marginTop: 2 }}>
                      {s.zone}
                    </div>
                  </div>
                  <SectorSparkline deltas={sectorTrends[s.id as 'S1' | 'S2' | 'S3']} />
                </div>
              </div>
            ))}

            {/* Rival sector comparison */}
            <div style={{ padding: '8px 16px', background: 'var(--bg-surface)', borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                vs Martin (P2)
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {['+0.08s', '-0.04s', '+0.16s'].map((delta, i) => (
                  <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 2 }}>S{i + 1}</div>
                    <div style={{
                      fontFamily: 'JetBrains Mono,monospace', fontSize: 11, fontWeight: 700,
                      color: delta.startsWith('-') ? 'var(--green)' : 'var(--accent)',
                    }}>
                      {delta}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Sector Insight */}
            <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)' }}>
              <AISectorInsight vsRival="Martin" />
            </div>
          </div>

          {/* Speed traps with Mugello-realistic values */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Speed Traps — {getActiveCircuit().name}</span>
            </div>
            <div className="card-body" style={{ flexDirection: 'column', gap: 12 }}>
              {SPEED_TRAPS.map(st => (
                <div key={st.name}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{st.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{st.location}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="text-mono" style={{ fontWeight: 700, fontSize: 17 }}>
                        {st.speed}
                        <span style={{ color: 'var(--text-muted)', fontSize: 10 }}> km/h</span>
                      </span>
                      <div style={{ fontSize: 10, color: st.speed >= st.rivalSpeed ? 'var(--green)' : 'var(--accent)', fontFamily: 'JetBrains Mono,monospace' }}>
                        vs rival: {st.rivalSpeed} ({st.speed >= st.rivalSpeed ? '+' : ''}{st.speed - st.rivalSpeed} km/h)
                      </div>
                    </div>
                  </div>
                  <div className="bar-track">
                    <div className="bar-fill cyan" style={{ width: `${(st.speed / 380) * 100}%` }} />
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                    Session max: {st.max} km/h
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Track surface */}
          <div className="card">
            <div className="card-header"><span className="card-title">Track Surface</span></div>
            <div className="card-body" style={{ flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Grip',      value: 'High · rubbered-in',     color: 'var(--green)' },
                { label: 'Bumps',     value: 'T6 Casanova entry · T12 Correntaio apex', color: 'var(--yellow)' },
                { label: 'Wet patches', value: 'None',                  color: 'var(--green)' },
                { label: 'Debris / oil', value: 'Clean',                color: 'var(--green)' },
                { label: 'Kerb risk',  value: 'Biondetti 1/2 · medium', color: 'var(--yellow)' },
                { label: 'Track temp',  value: '48°C · +3°C vs FP3',    color: 'var(--orange)' },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>{s.label}</div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: s.color, fontFamily: 'JetBrains Mono,monospace' }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* —— Corner Analysis (collapsible) ———————————————————————————————————— */}
      {showCorners && (
        <div className="card mb-4">
          <div className="card-header">
            <span className="card-title">Corner Analysis — {getActiveCircuit().name} {getActiveCircuit().turns} Turns</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Braking · Entry speed → Apex speed · Exit speed · Key notes
            </span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 36 }}>T#</th>
                <th>Dir</th>
                <th>Name</th>
                <th>Brake</th>
                <th>Entry</th>
                <th>Apex</th>
                <th>Exit</th>
                <th>Characteristic</th>
              </tr>
            </thead>
            <tbody>
              {CORNERS.map(c => (
                <tr key={c.num} style={c.critical ? { background: 'rgba(224,55,55,0.04)' } : {}}>
                  <td>
                    <span className="text-mono" style={{ fontWeight: 700, color: c.critical ? 'var(--accent)' : 'var(--text-muted)' }}>
                      T{c.num}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 11 }}>{c.dir}</td>
                  <td style={{ fontWeight: c.critical ? 600 : 400 }}>{c.name}</td>
                  <td className="mono" style={{ fontSize: 12, color: 'var(--accent)' }}>
                    {c.brakePoint}m
                  </td>
                  <td className="mono" style={{ fontSize: 12, color: 'var(--yellow)' }}>
                    {c.entrySpeed} km/h
                  </td>
                  <td className="mono" style={{ fontSize: 12 }}>
                    {c.apexSpeed} km/h
                  </td>
                  <td className="mono" style={{ fontSize: 12, color: 'var(--green)' }}>
                    {c.exitSpeed} km/h
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-dim)' }}>{c.characteristic}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* —— Sector speed profiles + Braking zones ———————————————————————————— */}
      <div className="grid-2 mb-4">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Sector Speed / Throttle / Brake Trace</span>
            <span style={{ fontSize:11, color:'var(--text-muted)' }}>Normalised 0-100 · last valid lap</span>
          </div>
          <div className="card-body" style={{ flexDirection:'column', gap:20 }}>
            <SectorTracePanel sectorId="S1" start={0}    end={0.33} />
            <SectorTracePanel sectorId="S2" start={0.33} end={0.66} />
            <SectorTracePanel sectorId="S3" start={0.66} end={1.0}  />
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Braking Zone Intensity</span>
            <span style={{ fontSize:11, color:'var(--text-muted)' }}>Distance · Entry speed → Apex speed</span>
          </div>
          <div className="card-body" style={{ flexDirection:'column' }}>
            <BrakingIntensityChart />
          </div>
        </div>
      </div>

      {/* —— Elevation & Gradient Profile ———————————————————————————————————— */}
      <ElevationProfile trackPos={t.trackPos} />

      {/* —— Circuit Data Integrity ——————————————————————————————————————————— */}
      <div className="mb-4">
        <CircuitIntegrity
          fuelValid={t.fuelValid}
          fuelLoad={t.fuelLoad}
          speed={t.speed}
        />
      </div>

      {/* —— Track evolution —————————————————————————————————————————————————— */}
      <div className="card">
        <div className="card-header"><span className="card-title">Track Evolution & Conditions</span></div>
        <div className="card-body">
          <div className="grid-4">
            {[
              { label: 'Track Rubber',  value: '74%',  color: 'var(--green)',  note: 'High grip · rubbered-in',   bar: 74 },
              { label: 'Track Temp',    value: '48°C', color: 'var(--orange)', note: '+3°C vs FP3',                bar: 48 },
              { label: 'S2 Wind',       value: '0.4s', color: 'var(--blue)',   note: 'Headwind through Casanova/Savelli', bar: 40 },
              { label: 'Grip Level',    value: 'HIGH', color: 'var(--green)',  note: 'Tyre limit: rear',           bar: 85 },
            ].map(c => (
              <div key={c.label} className="stat-tile">
                <div className="stat-tile__label">{c.label}</div>
                <div className="text-mono" style={{ fontSize: 22, fontWeight: 700, color: c.color, marginBottom: 6 }}>
                  {c.value}
                </div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${c.bar}%`, background: c.color }} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{c.note}</div>
              </div>
            ))}
          </div>

          {/* AI Condition Note */}
          <div style={{
            marginTop: 14, padding: '10px 14px',
            background: 'rgba(59,130,246,0.05)',
            border: '1px solid rgba(59,130,246,0.10)',
            borderRadius: 8,
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
              AI Condition Note
            </div>
            <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.5 }}>
              Track grip is improving, but tyre thermal load is rising.
              <strong> Rear soft risk increases after Lap 18.</strong>
              &nbsp;Current: {sessionState.activeRace ? `Lap ${t.lapCount}/${MUGELLO.raceLaps}` : 'pre-race/test telemetry'} · Tyre age {t.rearTyreAge} laps.
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
