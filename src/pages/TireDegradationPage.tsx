/**
 * TireDegradationPage - Tyre & Grip Intelligence console (Mugello GP - MotoGP dry race mode).
 *
 * Sections:
 *   1. Tyre Status Summary (Front/Rear with avg/peak/shoulder/center)
 *   2. AI Tyre Alerts
 *   3. Compound Temperature Windows
 * 4. Tyre Thermal Map - Front/Rear Left shoulder - Center - Right shoulder
 *   5. Mugello Thermal Load Map
 * 6. Thermal History - 6 tyre zones last 8 laps
 *   7. Grip Cliff Predictor
 *   8. Grip Budget Meter
 *   9. Compound Comparison cards
 *  10. Compound Radar (5-axis)
 * 11. Tyre Management Strategy - Dry Race Mode
 *  12. Safety Guardian Link
 *  13. Tyre Model Confidence + Strategy Integrity
 */
import { useState, useMemo } from 'react';
import {
  AlertTriangle, Thermometer, Target, TrendingDown,
  ChevronDown, ChevronUp, Circle,
} from 'lucide-react';
import { useLiveTelemetry } from '../hooks/useLiveTelemetry';
import { TireModel3D } from '../components/babylon/lazy';
import { MUGELLO_CIRCUIT } from '../domain/sessionTruth';
import { useSessionContext } from '../hooks/useSessionContext';

// -- Mugello constants ---------------------------------------------------------

const MUGELLO = {
  highThermalZones: ['T8 Arrabbiata 1', 'T9 Arrabbiata 2', 'T12 Correntaio', 'T15 Bucine'],
  rearStressZones: ['T15 Bucine (exit)'],
  frontStressZones: ['T1 San Donato (braking)', 'T12 Correntaio (braking)'],
  leftShoulderZones: 'Long loaded sections and corner exits',
};

// -- Compound definitions ------------------------------------------------------

type CompoundId = 'SOFT' | 'MEDIUM' | 'HARD';

const COMPOUNDS: Record<CompoundId, {
  name: string; color: string;
  grip0: number;            // peak grip %
  gripLossPerLap: number;   // % grip lost per lap (linear phase)
  cliffAt: number;          // grip % at which cliff begins
  cliffMult: number;        // cliff degradation multiplier
  heatUpLaps: number;
  optWindow: [number, number];
  optTempLow: number; optTempHigh: number;
}> = {
  SOFT: {
    name: 'Soft',   color: 'var(--accent)',
    grip0: 96,      gripLossPerLap: 3.6,  cliffAt: 55, cliffMult: 2.8,
    heatUpLaps: 2,  optWindow: [6, 10],
    optTempLow: 76, optTempHigh: 95,
  },
  MEDIUM: {
    name: 'Medium', color: 'var(--yellow)',
    grip0: 89,      gripLossPerLap: 2.4,  cliffAt: 50, cliffMult: 2.4,
    heatUpLaps: 4,  optWindow: [10, 15],
    optTempLow: 70, optTempHigh: 102,
  },
  HARD: {
    name: 'Hard',   color: 'var(--text-dim)',
    grip0: 80,      gripLossPerLap: 1.4,  cliffAt: 44, cliffMult: 2.0,
    heatUpLaps: 6,  optWindow: [16, 23],
    optTempLow: 64, optTempHigh: 108,
  },
};

// -- Temperature helpers -------------------------------------------------------

function tempColor(t: number): string {
  if (t < 56) return 'var(--blue)';
  if (t < 72) return 'var(--green)';
  if (t < 93) return 'var(--yellow)';
  if (t < 109) return 'var(--orange)';
  return 'var(--accent)';
}

function tempLabel(t: number): string {
  if (t < 56)  return 'COLD';
  if (t < 72)  return 'WARMING';
  if (t < 93)  return 'OPTIMAL';
  if (t < 109) return 'HOT';
  return 'CRITICAL';
}

function tempStatus(t: number, cmpLow: number, cmpHigh: number): 'OK' | 'HOT' | 'CRITICAL' {
  if (t <= cmpHigh) return 'OK';
  if (t <= cmpHigh + 14) return 'HOT';
  return 'CRITICAL';
}

// -- Grip model ----------------------------------------------------------------

function gripAt(compound: CompoundId, lap: number): number {
  const c = COMPOUNDS[compound];
  const raw = c.grip0 - c.gripLossPerLap * Math.max(0, lap - c.heatUpLaps);
  if (raw < c.cliffAt) return Math.max(0, c.cliffAt - (c.cliffAt - raw) * c.cliffMult);
  return Math.max(0, raw);
}

function cliffLapFor(compound: CompoundId): number {
  for (let i = 0; i <= 23; i++) {
    if (gripAt(compound, i) < COMPOUNDS[compound].cliffAt) return i;
  }
  return 24;
}

function lapsToCliffNow(compound: CompoundId, currentGrip: number): number {
  const c = COMPOUNDS[compound];
  if (currentGrip <= c.cliffAt) return 0;
  return Math.max(0, Math.round((currentGrip - c.cliffAt) / c.gripLossPerLap));
}

// -- Compound radar chart (5-axis) ---------------------------------------------

const RADAR_AXES = ['Grip Peak', 'Durability', 'Heat Speed', 'Cliff Safety', 'Temp Range'];

function compoundRadarValues(id: CompoundId): number[] {
  const c = COMPOUNDS[id];
  const gripPeak   = c.grip0;
  const durability = Math.round(Math.max(0, 100 - c.gripLossPerLap * 20));
  const heatSpeed  = Math.round(Math.max(0, 100 - c.heatUpLaps * 12));
  const cliffSafe  = Math.round(Math.max(0, 100 - (c.cliffMult - 1.8) * 40));
  const tempRange  = Math.round((c.optTempHigh - c.optTempLow) / 0.6);
  return [gripPeak, durability, heatSpeed, cliffSafe, tempRange];
}

function CompoundRadarChart() {
  const cx = 100; const cy = 100; const R = 72;
  const N = RADAR_AXES.length;
  const angleOf = (i: number) => (i * 2 * Math.PI) / N - Math.PI / 2;
  const polarXY = (val: number, idx: number): [number, number] => {
    const r = (val / 100) * R;
    return [cx + r * Math.cos(angleOf(idx)), cy + r * Math.sin(angleOf(idx))];
  };
  const gridPoly = (pct: number) =>
    Array.from({ length: N }, (_, i) => {
      const r = (pct / 100) * R;
      return `${cx + r * Math.cos(angleOf(i))},${cy + r * Math.sin(angleOf(i))}`;
    }).join(' ');

  return (
    <svg width="100%" height="240" viewBox="0 0 200 240" preserveAspectRatio="xMidYMid meet">
      {[25, 50, 75, 100].map(pct => (
        <polygon key={pct} points={gridPoly(pct)}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      ))}
      {Array.from({ length: N }, (_, i) => {
        const [x, y] = polarXY(100, i);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.07)" strokeWidth="1" />;
      })}
      {(Object.keys(COMPOUNDS) as CompoundId[]).map(id => {
        const vals = compoundRadarValues(id);
        const pts = vals.map((v, i) => polarXY(v, i).join(',')).join(' ');
        return (
          <polygon key={id} points={pts}
            fill={COMPOUNDS[id].color} fillOpacity="0.12"
            stroke={COMPOUNDS[id].color} strokeWidth="2" strokeOpacity="0.85" />
        );
      })}
      {(Object.keys(COMPOUNDS) as CompoundId[]).map(id =>
        compoundRadarValues(id).map((v, i) => {
          const [dx, dy] = polarXY(v, i);
          return <circle key={`${id}-${i}`} cx={dx} cy={dy} r="2.5" fill={COMPOUNDS[id].color} />;
        })
      )}
      {RADAR_AXES.map((label, i) => {
        const [lx, ly] = polarXY(115, i);
        return (
          <text key={label} x={lx} y={ly} textAnchor="middle" dominantBaseline="central"
            fill="#8B929F" fontSize="7.5" fontFamily="JetBrains Mono,monospace" fontWeight="600">
            {label}
          </text>
        );
      })}
      {(Object.keys(COMPOUNDS) as CompoundId[]).map((id, i) => (
        <g key={id} transform={`translate(${8 + i * 62}, 226)`}>
          <rect x="0" y="0" width="10" height="3" rx="1" fill={COMPOUNDS[id].color} />
          <text x="13" y="4" fill="#8B929F" fontSize="8" fontFamily="JetBrains Mono,monospace">
            {COMPOUNDS[id].name}
          </text>
        </g>
      ))}
    </svg>
  );
}

// -- Grip budget meter ---------------------------------------------------------

function GripBudgetMeter({ compound, lapAge }: { compound: CompoundId; lapAge: number }) {
  const c = COMPOUNDS[compound];
  const currentGrip = gripAt(compound, lapAge);
  const cliffLap    = cliffLapFor(compound);
  const safeMargin  = Math.max(0, currentGrip - c.cliffAt);
  const usedPct     = ((c.grip0 - currentGrip) / c.grip0) * 100;
  const color       = currentGrip <= c.cliffAt ? 'var(--accent)' : safeMargin < 10 ? 'var(--yellow)' : 'var(--green)';

  return (
    <div className="flex-col gap-3">
      <div className="flex justify-between items-center">
        <span className="fs-13 fw-700">{c.name} — Grip Budget</span>
        <span className="text-mono fs-14 fw-800" style={{ color }}>
          {currentGrip.toFixed(1)}%
        </span>
      </div>
      <div style={{ position: 'relative', height: 18, background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius)' }}>
        <div style={{ position:'absolute', left:0, top:0, bottom:0, width:`${c.cliffAt}%`, background:'rgba(224,55,55,0.18)', borderRadius:'var(--radius) 0 0 var(--radius)' }} />
        <div style={{ position:'absolute', left:`${c.cliffAt}%`, top:0, bottom:0, width:`${100 - c.cliffAt}%`, background:'rgba(34,197,94,0.08)', borderRadius:'0 var(--radius) var(--radius) 0' }} />
        <div style={{ position:'absolute', left:0, top:0, bottom:0, width:'100%', background:color, borderRadius:'var(--radius)', opacity:0.65, transform:`scaleX(${currentGrip / 100})`, transformOrigin:'left center', transition:'transform 0.5s var(--ease-ui)' }} />
        <div style={{ position:'absolute', left:`${c.cliffAt}%`, top:0, bottom:0, width:2, background:'rgba(224,55,55,0.7)' }} />
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, fontFamily:'JetBrains Mono,monospace', color:'white', textShadow:'0 1px 3px rgba(0,0,0,0.8)' }}>
          {currentGrip.toFixed(0)}% GRIP
        </div>
      </div>
      <div className="flex justify-between fs-9 text-mono">
        <span style={{ color: 'rgba(224,55,55,0.55)' }}>CLIFF: {c.cliffAt}%</span>
        <span style={{ color: 'rgba(34,197,94,0.55)' }}>SAFE +{safeMargin.toFixed(1)}%</span>
      </div>
      <div className="grid-4" style={{ gap: 6 }}>
        {([
          { label: 'Grip Now',    value: `${currentGrip.toFixed(0)}%`, color },
          { label: 'Used',        value: `${usedPct.toFixed(0)}%`,     color: 'var(--accent)' },
          { label: 'Safe Margin', value: `+${safeMargin.toFixed(1)}%`, color: 'var(--green)' },
          { label: 'Cliff Lap',   value: `L${cliffLap}`,               color: cliffLap <= lapAge + 3 ? 'var(--yellow)' : 'var(--text-muted)' },
        ] as { label:string; value:string; color:string }[]).map(s => (
          <div key={s.label} className="ta-center">
            <div className="fs-8 text-muted tt-upper mb-1 ls-06em">{s.label}</div>
            <div className="text-mono fw-800 fs-12" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// -- Degradation curve ---------------------------------------------------------

function DegCurveArea({ compound, currentLap }: { compound: CompoundId; currentLap: number }) {
  const c = COMPOUNDS[compound];
  const W = 560; const H = 100; const TOTAL = 23;
  const pts = Array.from({ length: TOTAL + 1 }, (_, i) => {
    const g = gripAt(compound, i);
    return { x: (i / TOTAL) * W, y: H - (g / 100) * H };
  });
  const linePts = pts.map(p => `${p.x},${p.y}`).join(' ');
  const areaPath = `M 0,${H} L ${linePts.replace(' ', ' L ')} L ${W},${H} Z`;
  const cliffLap = cliffLapFor(compound);
  const curX = (Math.min(currentLap, TOTAL) / TOTAL) * W;
  const curY = H - (gripAt(compound, currentLap) / 100) * H;

  return (
    <g>
      <path d={areaPath} fill={c.color} opacity="0.07" />
      <polyline points={linePts} fill="none" stroke={c.color} strokeWidth="2" />
      {cliffLap <= TOTAL && (
        <line x1={(cliffLap / TOTAL) * W} y1="0"
          x2={(cliffLap / TOTAL) * W} y2={H}
          stroke={c.color} strokeWidth="1" strokeDasharray="3,3" opacity="0.55" />
      )}
      {currentLap > 0 && currentLap <= TOTAL && (
        <circle cx={curX} cy={curY} r="4.5" fill={c.color} stroke="#0D1117" strokeWidth="1.5" />
      )}
    </g>
  );
}

// -- Tyre Status Card (Front/Rear with 3-zone temps) ---------------------------

interface TyreStatusCardProps {
  position: 'Front' | 'Rear';
  compound: string;
  leftShoulder: number;
  center: number;
  rightShoulder: number;
  age: number;
  wear: number;
  grip: number;
  pressure: number;
}

function TyreStatusCard({ position, compound, leftShoulder, center, rightShoulder, age, wear, grip, pressure }: TyreStatusCardProps) {
  const avgTemp = Math.round((leftShoulder + center + rightShoulder) / 3);
  const peakTemp = Math.max(leftShoulder, center, rightShoulder);
  const peakZone =
    peakTemp === leftShoulder ? 'left shoulder' :
    peakTemp === center ? 'center' : 'right shoulder';

  const cmpKey = (compound in COMPOUNDS ? compound : 'SOFT') as CompoundId;
  const cmp = COMPOUNDS[cmpKey];
  const status = tempStatus(peakTemp, cmp.optTempLow, cmp.optTempHigh);
  const statusColor = status === 'OK' ? 'var(--green)' : status === 'HOT' ? 'var(--yellow)' : 'var(--accent)';
  const inWindow = avgTemp >= cmp.optTempLow && avgTemp <= cmp.optTempHigh;

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: `1px solid ${inWindow ? 'rgba(34,197,94,0.4)' : status === 'CRITICAL' ? 'rgba(224,55,55,0.4)' : 'var(--border)'}`,
      borderRadius: 'var(--radius-lg)', padding: 14,
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center" style={{ gap: 8 }}>
          <span className="text-mono fw-700 fs-16">
            {position} TYRE
          </span>
          <span className="fs-10 fw-700 tt-upper ls-07em" style={{
            padding: '2px 6px', borderRadius: 4,
            background: `${cmp.color}22`, color: cmp.color,
          }}>
            {compound}
          </span>
        </div>
        <span className="fs-10 fw-700 tt-upper ls-08em" style={{
          padding: '2px 8px', borderRadius: 4,
          background: `color-mix(in srgb, ${statusColor} 18%, transparent)`,
          color: statusColor,
        }}>
          {status}
        </span>
      </div>

      {/* Temp row */}
      <div className="grid-3" style={{ gap: 6 }}>
        {[
          { label: 'Left shoulder', temp: leftShoulder },
          { label: 'Center', temp: center },
          { label: 'Right shoulder', temp: rightShoulder },
        ].map(z => (
          <div key={z.label} className="ta-center br-4" style={{
            padding: '6px 4px',
            background: `color-mix(in srgb, ${tempColor(z.temp)} 18%, transparent)`,
            border: `1px solid color-mix(in srgb, ${tempColor(z.temp)} 30%, transparent)`,
          }}>
            <div className="fs-16 fw-800 text-mono" style={{ color: tempColor(z.temp) }}>
              {z.temp}°
            </div>
            <div className="fs-9 text-muted mt-1">{z.label}</div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="mt-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
        {([
          { label: 'Avg temp', value: `${avgTemp}°C` },
          { label: 'Peak', value: `${peakTemp}°C ${peakZone}` },
          { label: 'Pressure', value: `${pressure.toFixed(2)} bar` },
          { label: 'Wear', value: `${wear.toFixed(0)}%` },
          { label: 'Grip', value: `${grip.toFixed(1)}%` },
        ] as { label: string; value: string }[]).map(s => (
          <div key={s.label} className="ta-center">
            <div className="fs-8 text-muted tt-upper mb-1 ls-06em">{s.label}</div>
            <div className="text-mono fw-700 fs-10 text-dim">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Window indicator */}
      <div className="fs-10 fw-700 ta-center br-4 ls-05em" style={{
        padding: '3px 0',
        background: inWindow ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)',
        color: inWindow ? 'var(--green)' : 'var(--yellow)',
      }}>
        {inWindow
          ? '✓—œ Within optimal temperature window'
          : `Outside optimal window · OPT ${cmp.optTempLow}–${cmp.optTempHigh}°C`
        }
      </div>
    </div>
  );
}

// -- Compound Temperature Windows ----------------------------------------------

function CompoundTempWindows() {
  return (
    <div className="flex" style={{ gap: 8, flexWrap: 'wrap' }}>
      {(Object.entries(COMPOUNDS) as [CompoundId, typeof COMPOUNDS.SOFT][]).map(([id, c]) => (
        <div key={id} className="flex-1 br-8 border" style={{ minWidth: 180, padding: '10px 12px', background: 'rgba(255,255,255,0.02)' }}>
          <div className="flex items-center mb-2" style={{ gap: 6 }}>
            <span className="d-inline-block" style={{ width: 8, height: 8, borderRadius: '50%', background: c.color }} />
            <span className="text-mono fs-11 fw-700">{c.name}</span>
          </div>
          <div className="flex-col text-mono fs-10" style={{ gap: 3 }}>
            <div className="flex justify-between">
              <span className="text-green">Optimal</span><span>{c.optTempLow}–{c.optTempHigh}°C</span>
            </div>
            <div className="flex justify-between">
              <span className="text-yellow">Hot</span><span>{c.optTempHigh + 1}–{c.optTempHigh + 14}°C</span>
            </div>
            <div className="flex justify-between">
              <span className="text-accent">Critical</span><span>&gt;{c.optTempHigh + 14}°C</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// -- Temperature history heatmap (6 tyre zones) --------------------------------

interface ZoneRow {
  fl: number; fc: number; fr: number;
  rl: number; rc: number; rr: number;
}

function buildSixZoneHistory(
  fl: number, fr: number, rl: number, rr: number, lapAge: number
): ZoneRow[] {
  return Array.from({ length: 8 }, (_, j) => {
    const age = Math.max(0, lapAge - (7 - j));
    const wave = (base: number, phase: number) => Math.round(base + Math.sin(age * 0.75 + phase) * 3.5 - (7 - j) * 0.6);
    const fl_ = wave(fl, 0);
    const fr_ = wave(fr, 0.5);
    const rl_ = wave(rl, 1.0);
    const rr_ = wave(rr, 1.5);
    return {
      fl: fl_, fc: Math.round((fl_ + fr_) * 0.47), fr: fr_,
      rl: rl_, rc: Math.round((rl_ + rr_) * 0.47), rr: rr_,
    };
  });
}

function TempHistoryHeatmap({
  fl, fr, rl, rr, lapAge, currentLap,
}: { fl: number; fr: number; rl: number; rr: number; lapAge: number; currentLap: number }) {
  const history = buildSixZoneHistory(fl, fr, rl, rr, lapAge);
  const zones: { key: keyof ZoneRow; label: string }[] = [
    { key: 'fl', label: 'F L' },
    { key: 'fc', label: 'F C' },
    { key: 'fr', label: 'F R' },
    { key: 'rl', label: 'R L' },
    { key: 'rc', label: 'R C' },
    { key: 'rr', label: 'R R' },
  ];

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'36px repeat(6, 1fr)', gap:3, marginBottom:4 }}>
        <span />
        {zones.map(z => (
          <span key={z.key} className="ta-center fs-9 text-muted text-mono fw-700">{z.label}</span>
        ))}
      </div>
      {history.map((row, i) => {
        const lap = Math.max(1, currentLap - 7 + i);
        const isLatest = i === 7;
        return (
          <div key={i} style={{ display:'grid', gridTemplateColumns:'36px repeat(6, 1fr)', gap:3, marginBottom:2 }}>
            <span className="fs-9 text-mono lh-1_3" style={{ color: isLatest ? 'var(--text)' : 'var(--text-muted)', fontWeight: isLatest ? 700 : 400, lineHeight: '26px' }}>
              L{lap}
            </span>
            {zones.map(z => {
              const temp = row[z.key];
              return (
                <div className="flex items-center justify-center br-4" style={{ height: 26, background: tempColor(temp), border: isLatest ? '1px solid rgba(255,255,255,0.3)' : '1px solid transparent', opacity: 0.55 + i * 0.06 }}>
                  <span className="fs-9 fw-700 text-mono" style={{ color: 'var(--bg-base)' }}>{temp}°</span>
                </div>
              );
            })}
          </div>
        );
      })}
      {/* Legend */}
      <div className="flex justify-center mt-2" style={{ gap: 8, flexWrap: 'wrap' }}>
        {([['<56°','var(--blue)','Cold'],['56–72°','var(--green)','Warm'],['72–93°','var(--yellow)','Opt.'],['93–109°','var(--orange)','Hot'],['>109°','var(--accent)','Crit.']] as [string,string,string][]).map(([range, col, label]) => (
          <span key={label} className="flex items-center fs-9 text-muted" style={{ gap: 3 }}>
            <span className="d-inline-block br-2" style={{ width: 8, height: 8, background: col }} />
            {label} ({range})
          </span>
        ))}
      </div>
      <div className="fs-9 text-muted ta-center mt-1">
        F = Front · R = Rear · L = Left shoulder · C = Center · R = Right shoulder
      </div>
    </div>
  );
}

// -- Mugello Thermal Load Map ------------------------------------------------

function MugelloThermalLoadMap() {
  return (
    <div className="flex-col gap-3">
      {[
        { title: 'High thermal load zones', items: MUGELLO.highThermalZones, color: 'var(--accent)' },
        { title: 'Rear tyre stress', items: MUGELLO.rearStressZones, color: 'var(--yellow)' },
        { title: 'Front tyre stress', items: MUGELLO.frontStressZones, color: 'var(--blue)' },
        { title: 'Left shoulder overload', items: [MUGELLO.leftShoulderZones], color: 'var(--orange)' },
      ].map(section => (
        <div key={section.title} className="flex items-center" style={{ gap: 8, alignItems: 'flex-start' }}>
          <span className="fs-11 fw-600 text-dim shrink-0" style={{ minWidth: 140 }}>{section.title}</span>
          <div className="flex" style={{ gap: 4, flexWrap: 'wrap' }}>
            {section.items.map(item => (
              <span key={item} className="text-mono fs-10 fw-600 br-4" style={{
                padding: '2px 7px',
                background: `color-mix(in srgb, ${section.color} 14%, transparent)`,
                color: section.color,
              }}>
                {item}
              </span>
            ))}
          </div>
        </div>
      ))}
      <div className="mt-1 fs-11 text-muted lh-1_6 br-4" style={{ padding: '8px 10px', background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.1)' }}>
        <strong style={{ color: 'var(--green)' }}>AI diagnosis:</strong> Rear soft is thermally overloaded but still delivering usable grip. Left shoulder overload is concentrated in high-load sections and corner exits.
      </div>
    </div>
  );
}

// -- Grip Cliff Predictor ------------------------------------------------------

function GripCliffPredictor({ compound, lapAge, grip }: { compound: CompoundId; lapAge: number; grip: number }) {
  const c = COMPOUNDS[compound];
  const cliff = lapsToCliffNow(compound, grip);
  const cliffLap = cliffLapFor(compound);
  const danger = grip <= c.cliffAt ? 'var(--accent)' : cliff <= 3 ? 'var(--yellow)' : 'var(--green)';

  return (
    <div className="flex-col" style={{ gap: 8 }}>
      <div className="grid-4" style={{ gap: 8 }}>
        {[
          { label: 'Current lap', value: `L${lapAge}` },
          { label: 'Rear grip', value: `${grip.toFixed(1)}%` },
          { label: 'Estimated cliff lap', value: `L${cliffLap}` },
          { label: 'Laps to cliff', value: cliff > 0 ? `${cliff}` : '!', color: danger },
        ].map(s => (
          <div key={s.label} className="ta-center br-4" style={{ padding: '6px 4px', background: 'rgba(255,255,255,0.02)' }}>
            <div className="fs-8 text-muted tt-upper ls-06em">{s.label}</div>
            <div className="text-mono fw-800 fs-16" style={{ color: s.color || 'var(--text)' }}>{s.value}</div>
          </div>
        ))}
      </div>
      <div className="flex items-center br-4" style={{ gap: 6, alignItems: 'flex-start', padding: '6px 8px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.1)' }}>
        <span className="fs-10 text-green fw-700 shrink-0">AI note</span>
        <span className="fs-10 text-muted lh-1_5">
          Grip remains usable, but thermal overload is accelerating degradation.
          Risk increases if rear peak temperature stays above 125°C for two consecutive laps.
        </span>
      </div>
    </div>
  );
}

// -- Tyre Management Strategy - Dry Race Mode ---------------------------------

function TyreManagementStrategy({ lapAge, rearGrip }: { lapAge: number; rearGrip: number }) {
  const session = useSessionContext();
  const riskActive = rearGrip < 78;
  const recActions = [
    { n: 1, text: 'Smooth throttle pickup at T15 Bucine.' },
    { n: 2, text: 'Avoid TC reduction while rear temp remains above 118°C.' },
    { n: 3, text: 'Use TC +1 in Sector 3 if rear slip exceeds 12%.' },
    { n: 4, text: 'Avoid aggressive kerb use through Biondetti 1/2.' },
    { n: 5, text: 'Reduce lean target by 2° when rear peak exceeds 124°C.' },
  ];

  return (
    <div className="flex-col gap-3">
      {/* Info bar */}
      <div className="flex" style={{ gap: 10, flexWrap: 'wrap' }}>
        {[
          { label: 'Race mode', value: session.ctx.setup.rules ?? 'Dry GP race', color: 'var(--blue)' },
          { label: 'Pit stop', value: session.ctx.pitStrategyEnabled ? 'Strategy enabled' : 'Not planned', color: 'var(--text-muted)' },
          { label: 'Objective', value: `Manage rear soft to race distance (L23)`, color: 'var(--green)' },
          { label: 'Risk point', value: `From L${lapAge + Math.max(1, Math.round((78 - rearGrip) / 3.6))}`, color: 'var(--yellow)' },
        ].map(s => (
          <div key={s.label} className="flex-1 br-4 border" style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.02)', minWidth: 120 }}>
            <div className="fs-8 text-muted tt-upper ls-08em mb-1">{s.label}</div>
            <div className="fs-12 fw-600 text-mono" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Recommended mode */}
      <div className="br-4" style={{
        padding: '8px 12px',
        background: riskActive ? 'rgba(245,158,11,0.08)' : 'rgba(34,197,94,0.06)',
        border: `1px solid ${riskActive ? 'rgba(245,158,11,0.2)' : 'rgba(34,197,94,0.1)'}`,
      }}>
        <div className="fs-11 fw-700 text-mono mb-2">
          {riskActive ? '⚠ Rear tyre protection recommended · L6–L13' : '✓—œ Tyre condition normal'}
        </div>
        {riskActive && (
          <>
            <div className="fs-10 text-muted mb-2">Actions:</div>
            <div className="flex-col" style={{ gap: 3 }}>
              {recActions.map(a => (
                <div key={a.n} className="flex items-center fs-10 text-dim" style={{ gap: 6, alignItems: 'flex-start' }}>
                  <span className="text-yellow fw-700 shrink-0">{a.n}.</span>
                  <span>{a.text}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Expected effect */}
      <div className="flex" style={{ gap: 14 }}>
        {[
          { label: 'Risk change', value: '—¢11 pts', color: 'var(--green)' },
          { label: 'Lap-time cost', value: '+0.040s/lap', color: 'var(--yellow)' },
        ].map(s => (
          <div key={s.label} className="ta-center flex-1 br-4" style={{ padding: '6px 8px', background: 'rgba(255,255,255,0.02)' }}>
            <div className="fs-8 text-muted tt-upper ls-06em">{s.label}</div>
            <div className="text-mono fw-800 fs-14" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// -- Model Integrity -----------------------------------------------------------

function ModelIntegrity() {
  const session = useSessionContext();
  return (
    <div className="flex-col" style={{ gap: 8 }}>
      {/* Confidence */}
      <div className="flex" style={{ gap: 10, flexWrap: 'wrap' }}>
        <div className="flex-1 br-8 border" style={{ minWidth: 160, padding: '8px 12px', background: 'rgba(255,255,255,0.02)' }}>
          <div className="fs-9 text-muted tt-upper ls-08em mb-1">Tyre Model Confidence</div>
          <div className="fs-24 fw-900 text-mono text-green">87%</div>
          <div className="mt-1 br-2" style={{ height: 4, background: 'rgba(255,255,255,0.07)' }}>
            <div className="br-2" style={{ width: '87%', height: '100%', background: 'var(--green)' }} />
          </div>
        </div>
        <div className="flex-2 br-8 border" style={{ minWidth: 240, padding: '8px 12px', background: 'rgba(255,255,255,0.02)' }}>
          <div className="fs-9 text-muted tt-upper ls-08em mb-2">Inputs</div>
          <div className="text-mono fs-10" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
            {[
              ['Tyre temperature', 'OK'], ['Pressure', 'OK'], ['IMU', 'OK'],
              ['Rear grip', 'estimated'], ['Track temperature', 'OK'], ['Wear model', 'simulated'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-muted">{k}</span>
                <span style={{ color: v === 'OK' ? 'var(--green)' : 'var(--yellow)' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Strategy Integrity */}
      <div className="grid-4 mt-1" style={{ gap: 6 }}>
        {[
          ['Race mode', session.ctx.setup.rules ?? 'Dry GP race', 'var(--blue)'],
          ['Scheduled pit stops', session.ctx.pitStrategyEnabled ? 'Enabled (simulation)' : 'Disabled', 'var(--text-muted)'],
          ['Strategy model', 'Tyre management', 'var(--green)'],
          ['Warnings', 'None', 'var(--green)'],
        ].map(([k, v, c]) => (
          <div key={k} className="ta-center br-4" style={{ padding: '6px 4px', background: 'rgba(255,255,255,0.02)' }}>
            <div className="fs-8 text-muted tt-upper ls-06em">{k}</div>
            <div className="text-mono fw-700 fs-11" style={{ color: c as string }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// -- Main Page -----------------------------------------------------------------

export function TireDegradationPage() {
  const session = useSessionContext();
  const t = useLiveTelemetry();
  const [show3D, setShow3D] = useState(false);

  const lapAge    = t.rearTyreAge;
  const rearWear  = Math.min(99, lapAge * 4.8);
  const frontWear = Math.min(99, lapAge * 3.2);
  const rearGrip  = gripAt('SOFT', lapAge);
  const frontGrip = gripAt('MEDIUM', lapAge);

  // 3-zone temps from telemetry
  const frontLeft  = t.tireFrontLeft;
  const frontRight = t.tireFrontRight;
  const rearLeft   = t.tireRearLeft;
  const rearRight  = t.tireRearRight;
  const frontCenter = Math.round((frontLeft + frontRight) * 0.47);
  const rearCenter  = Math.round((rearLeft + rearRight) * 0.47);
  const lapsToCliff = useMemo(() => lapsToCliffNow('SOFT', rearGrip), [rearGrip]);
  const cliffColor = lapsToCliff <= 2 ? 'var(--accent)' : lapsToCliff <= 5 ? 'var(--yellow)' : 'var(--green)';
  const rearStatus = tempStatus(Math.max(rearLeft, rearCenter, rearRight), COMPOUNDS.SOFT.optTempLow, COMPOUNDS.SOFT.optTempHigh);

  return (
    <div className="page">

      {/* -- Header -------------------------------------------------------- */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="page-title">Tyre &amp; Grip Intelligence</h1>
          <p className="page-subtitle">Mugello · Thermal analysis · Grip model · Cliff predictor · Stint strategy</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-orange">Rear {t.rearCompound} · L{lapAge}</span>
          <span className="badge badge-blue">Front {t.frontCompound}</span>
          <span className="badge" style={{ fontSize: 10, background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
            Data quality 94%
          </span>
          <button
            className="btn btn-ghost btn-sm flex items-center gap-1"
            onClick={() => setShow3D(v => !v)}
          >
            {show3D ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            3D
          </button>
        </div>
      </div>

      {/* -- TYRE PASSPORT - life history of the current set ----------------- */}
      <div className="card mb-4">
        <div className="card-header">
          <span className="card-title flex items-center gap-2"><Circle size={14} style={{ color: 'var(--orange)' }} /> Tyre Passport</span>
          <span className="badge" style={{ fontSize: 9, fontFamily: 'JetBrains Mono,monospace', color: 'var(--text-muted)' }}>Rear Soft · Set R03</span>
        </div>
        <div className="mt-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
          {[
            ['Stint history', '01·5 / 02·6 / 03·8'],
            ['Total laps', String(5 + 6 + Math.max(0, t.lapCount))],
            ['Peak temp', '124°C'],
            ['Grip trend', `-${Math.min(40, Math.round(t.lapCount * 1.3))}%`],
            ['Cliff prediction', 'L16-equiv'],
            ['Status', t.lapCount > 13 ? 'Warm-up only' : 'Race-usable'],
          ].map(([k, v]) => (
            <div key={k}>
              <div className="fs-9 text-muted tt-upper ls-08em">{k}</div>
              <div className="fs-15 text-mono fw-700" style={{ color: k === 'Status' && t.lapCount > 13 ? 'var(--accent)' : 'var(--text)' }}>{v}</div>
            </div>
          ))}
        </div>
        <div className="fs-10 text-muted mt-2">
          A tyre's life follows the set across stints — total laps, peak temperature and grip trend decide whether it goes back on for the race or is retired to warm-up duty.
        </div>
      </div>

      {/* Circuit validation */}
      <div className="flex" style={{ gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        <span className="badge badge-green" style={{ fontSize: 10 }}>{MUGELLO_CIRCUIT.shortName} GP · Race Lap {t.lapCount}/{MUGELLO_CIRCUIT.raceLaps}</span>
        <span className="badge" style={{ fontSize: 10, background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>{session.ctx.pitStrategyEnabled ? 'KDD Simulation Mode · Pit strategy enabled' : 'Dry race mode · No scheduled pit stops'}</span>
      </div>

      {/* -- AI Tyre Alerts ------------------------------------------------- */}
      <div className="card mb-4" style={{
        background: 'rgba(224,55,55,0.04)',
      }}>
        <div className="card-header">
          <span className="card-title"><AlertTriangle size={13} style={{ marginRight: 4, verticalAlign: -1 }} />AI Tyre Alerts</span>
        </div>
        <div className="flex-col" style={{ padding: '8px 16px 12px', gap: 4, fontSize: 12 }}>
          <div className="text-accent fw-600">Rear soft running hot from Lap {Math.max(1, lapAge - 1)}.</div>
          <div className="text-dim">Peak rear temperature: {Math.max(rearLeft, rearRight)}°C on left shoulder.</div>
          <div className="text-yellow">Front pressure slightly above optimal at 2.10 bar.</div>
          <div className="text-dim">Grip drop detected on corner exits, especially T15 Bucine.</div>
        </div>
      </div>

      {/* -- 3D Models (collapsible) ---------------------------------------- */}
      {show3D && (
        <div className="card mb-4">
          <div className="card-header">
            <span className="card-title">3D Tyre Visualization</span>
          </div>
          <div className="grid-4" style={{ gap: 8, padding: '12px 16px' }}>
            <TireModel3D temperature={t.tireFrontLeft}  compound={t.frontCompound} label="Front L" height={160} />
            <TireModel3D temperature={t.tireFrontRight} compound={t.frontCompound} label="Front R" height={160} />
            <TireModel3D temperature={t.tireRearLeft}   compound={t.rearCompound}  label="Rear L" height={160} />
            <TireModel3D temperature={t.tireRearRight}  compound={t.rearCompound}  label="Rear R" height={160} />
          </div>
        </div>
      )}

      {/* -- Tyre Status Summary -------------------------------------------- */}
      <div className="mb-4">
        <div className="card-header" style={{ padding: '0 0 8px 0' }}>
          <span className="card-title"><Thermometer size={14} style={{ color: 'var(--accent)', verticalAlign: -1, marginRight: 4 }} />Tyre Status Summary</span>
        </div>
        <div className="grid-2" style={{ gap: 12 }}>
          <TyreStatusCard
            position="Front"
            compound={t.frontCompound}
            leftShoulder={frontLeft}
            center={frontCenter}
            rightShoulder={frontRight}
            age={lapAge}
            wear={frontWear}
            grip={frontGrip}
            pressure={2.10}
          />
          <TyreStatusCard
            position="Rear"
            compound={t.rearCompound}
            leftShoulder={rearLeft}
            center={rearCenter}
            rightShoulder={rearRight}
            age={lapAge}
            wear={rearWear}
            grip={rearGrip}
            pressure={1.90}
          />
        </div>
      </div>

      {/* -- Compound Temperature Windows ----------------------------------- */}
      <div className="card mb-4">
        <div className="card-header">
          <span className="card-title">Compound Temperature Windows</span>
        </div>
        <div style={{ padding: '6px 16px 12px' }}>
          <CompoundTempWindows />
        </div>
      </div>

      {/* -- Tyre Thermal Map ----------------------------------------------- */}
      <div className="card mb-4">
        <div className="card-header">
          <span className="card-title flex items-center gap-2">
            <Thermometer size={14} style={{ color: 'var(--accent)' }} />
            Tyre Thermal Map — Left shoulder · Center · Right shoulder
          </span>
          <div className="flex items-center" style={{ gap: 8, alignItems: 'center' }}>
            {([
              ['<56°', 'var(--blue)'], ['56–72°', 'var(--green)'], ['72–93°', 'var(--yellow)'],
              ['93–109°', 'var(--orange)'], ['>109°', 'var(--accent)'],
            ] as [string, string][]).map(([l, col]) => (
              <span key={l} className="flex items-center fs-10 text-muted" style={{ gap: 3 }}>
                <span className="d-inline-block br-2" style={{ width: 8, height: 8, background: col }} />
                {l}
              </span>
            ))}
          </div>
        </div>
        <div className="grid-2" style={{ gap: 12, padding: '12px 16px' }}>
          {/* Front Tyre zones */}
          <div className="br-8 border" style={{ padding: 10, background: 'rgba(255,255,255,0.02)' }}>
            <div className="text-mono fw-700 fs-13 mb-2">
              Front Tyre · {t.frontCompound}</div>
            <div className="grid-3" style={{ gap: 6 }}>
              {[
                { label: 'Left shoulder', temp: frontLeft },
                { label: 'Center', temp: frontCenter },
                { label: 'Right shoulder', temp: frontRight },
              ].map(z => (
                <div key={z.label} className="ta-center br-4" style={{
                  padding: '8px 4px',
                  background: `color-mix(in srgb, ${tempColor(z.temp)} 18%, transparent)`,
                }}>
                  <div className="fs-18 fw-800 text-mono" style={{ color: tempColor(z.temp) }}>{z.temp}°</div>
                  <div className="fs-9 text-muted">{z.label}</div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-mono fs-10">
              <span className="text-muted">Age: {lapAge}L</span>
              <span style={{ color: frontWear > 65 ? 'var(--accent)' : 'var(--yellow)' }}>Wear: {frontWear.toFixed(0)}%</span>
              <span style={{ color: frontGrip < 62 ? 'var(--accent)' : 'var(--green)' }}>Grip: {frontGrip.toFixed(0)}%</span>
            </div>
          </div>
          {/* Rear Tyre zones */}
          <div className="br-8 border" style={{ padding: 10, background: 'rgba(255,255,255,0.02)' }}>
            <div className="text-mono fw-700 fs-13 mb-2">
              Rear Tyre · {t.rearCompound}</div>
            <div className="grid-3" style={{ gap: 6 }}>
              {[
                { label: 'Left shoulder', temp: rearLeft },
                { label: 'Center', temp: rearCenter },
                { label: 'Right shoulder', temp: rearRight },
              ].map(z => (
                <div key={z.label} className="ta-center br-4" style={{
                  padding: '8px 4px',
                  background: `color-mix(in srgb, ${tempColor(z.temp)} 18%, transparent)`,
                }}>
                  <div className="fs-18 fw-800 text-mono" style={{ color: tempColor(z.temp) }}>{z.temp}°</div>
                  <div className="fs-9 text-muted">{z.label}</div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-mono fs-10">
              <span className="text-muted">Age: {lapAge}L</span>
              <span style={{ color: rearWear > 65 ? 'var(--accent)' : 'var(--yellow)' }}>Wear: {rearWear.toFixed(0)}%</span>
              <span style={{ color: rearGrip < 62 ? 'var(--accent)' : 'var(--green)' }}>Grip: {rearGrip.toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* -- Mugello Thermal Load Map --------------------------------------- */}
      <div className="card mb-4">
        <div className="card-header">
          <span className="card-title">Mugello Thermal Load Map</span>
          <span className="badge badge-blue">circuit overlay</span>
        </div>
        <div style={{ padding: '12px 16px' }}>
          <MugelloThermalLoadMap />
        </div>
      </div>

      {/* -- Temperature History Heatmap (6 zones) -------------------------- */}
      <div className="card mb-4">
        <div className="card-header">
          <span className="card-title flex items-center gap-2">
            <Thermometer size={14} style={{ color: 'var(--orange)' }} />
            Thermal History — Last 8 Laps →— 6 Tyre Zones
          </span>
          <span className="fs-9 text-muted">Darker rows = older laps</span>
        </div>
        <div style={{ padding: '12px 16px' }}>
          <TempHistoryHeatmap
            fl={t.tireFrontLeft} fr={t.tireFrontRight}
            rl={t.tireRearLeft}  rr={t.tireRearRight}
            lapAge={lapAge} currentLap={t.lapCount}
          />
        </div>
      </div>

      {/* -- KPI tiles ------------------------------------------------------ */}
      <div className="grid-4 mb-4">
        <div className="stat-tile" style={{ border: `1px solid ${rearGrip < 62 ? 'var(--accent)' : rearGrip < 78 ? 'rgba(245,158,11,0.5)' : 'rgba(34,197,94,0.4)'}` }}>
          <div className="stat-tile__label">Rear Grip Level</div>
          <div className="stat-tile__value" style={{ color: rearGrip < 62 ? 'var(--accent)' : rearGrip < 78 ? 'var(--yellow)' : 'var(--green)' }}>
            {rearGrip.toFixed(1)}<span className="stat-tile__unit">%</span>
          </div>
          <div className="bar-track mt-2">
            <div className="bar-fill" style={{
              width: `${rearGrip}%`,
              background: rearGrip < 62 ? 'var(--accent)' : rearGrip < 78 ? 'var(--yellow)' : 'var(--green)',
            }} />
          </div>
        </div>

        <div className="stat-tile blue-border">
          <div className="stat-tile__label">Front Grip Level</div>
          <div className="stat-tile__value" style={{ color: 'var(--blue)' }}>
            {frontGrip.toFixed(1)}<span className="stat-tile__unit">%</span>
          </div>
          <div className="bar-track mt-2">
            <div className="bar-fill blue" style={{ width: `${frontGrip}%` }} />
          </div>
        </div>

        <div className="stat-tile" style={{ border: `1px solid ${cliffColor}44` }}>
          <div className="stat-tile__label flex items-center" style={{ gap: 4 }}>
            <AlertTriangle size={11} style={{ color: cliffColor, flexShrink: 0 }} />
            Laps to Cliff
          </div>
          <div className="stat-tile__value text-mono" style={{ color: cliffColor }}>
            {lapsToCliff > 0 ? lapsToCliff : '!'}
          </div>
          <div className="fs-11 text-muted mt-1">
            {lapsToCliff <= 0 ? '⚠ CLIFF REACHED' : lapsToCliff <= 3 ? 'CRITICAL — manage rear' : 'until grip drop'}
          </div>
        </div>

        <div className="stat-tile" style={{ border: `1px solid ${rearStatus === 'CRITICAL' ? 'rgba(224,55,55,0.5)' : 'rgba(245,158,11,0.4)'}` }}>
          <div className="stat-tile__label flex items-center" style={{ gap: 4 }}>
            <Target size={11} className="shrink-0" />
            Peak Rear Temp
          </div>
          <div className="stat-tile__value text-mono" style={{ color: rearStatus === 'CRITICAL' ? 'var(--accent)' : 'var(--yellow)' }}>
            {Math.max(rearLeft, rearRight)}°
          </div>
          <div className="fs-11 text-muted mt-1">
            left shoulder · {tempLabel(Math.max(rearLeft, rearRight))}
          </div>
        </div>
      </div>

      {/* -- Grip Level Chart ----------------------------------------------- */}
      <div className="card mb-4">
        <div className="card-header">
          <span className="card-title flex items-center gap-2">
            <TrendingDown size={14} style={{ color: 'var(--text-muted)' }} />
            Grip Level Model — All Compounds
          </span>
          <div className="flex items-center" style={{ gap: 14, alignItems: 'center' }}>
            {(Object.entries(COMPOUNDS) as [CompoundId, typeof COMPOUNDS.SOFT][]).map(([id, c]) => (
              <span key={id} className="flex items-center fs-12 text-muted" style={{ gap: 5 }}>
                <span className="d-inline-block br-2" style={{ width: 14, height: 3, background: c.color }} />
                {c.name}
              </span>
            ))}
          </div>
        </div>
        <div className="card-body">
          <svg width="100%" height="140" viewBox="0 0 600 140" preserveAspectRatio="xMidYMid meet">
            {[100, 75, 50, 25].map(pct => (
              <g key={pct}>
                <line x1="30" y1={10 + (1 - pct / 100) * 100} x2="590" y2={10 + (1 - pct / 100) * 100}
                  stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <text x="26" y={14 + (1 - pct / 100) * 100} fill="#535A6E" fontSize="9"
                  textAnchor="end" fontFamily="JetBrains Mono,monospace">{pct}%</text>
              </g>
            ))}
            <rect x="30" y={10 + (1 - 0.58) * 100} width="560" height={0.58 * 100}
              fill="rgba(224,55,55,0.04)" />
            <line x1="30" y1={10 + (1 - 0.58) * 100} x2="590" y2={10 + (1 - 0.58) * 100}
              stroke="rgba(224,55,55,0.22)" strokeWidth="1" strokeDasharray="4,3" />
            <text x="34" y={8 + (1 - 0.58) * 100} fill="rgba(224,55,55,0.5)" fontSize="8"
              fontFamily="JetBrains Mono,monospace">CLIFF ZONE</text>
            {[0, 5, 10, 15, 20, 23].map(lap => (
              <text key={lap} x={30 + (lap / 23) * 560} y="135" fill="#535A6E" fontSize="9"
                textAnchor="middle" fontFamily="JetBrains Mono,monospace">L{lap}</text>
            ))}
            <g transform="translate(30, 10)">
              {(Object.keys(COMPOUNDS) as CompoundId[]).map(id => (
                <DegCurveArea key={id} compound={id} currentLap={lapAge} />
              ))}
              <line x1={(lapAge / 23) * 560} y1="0" x2={(lapAge / 23) * 560} y2="100"
                stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" />
              <text x={(lapAge / 23) * 560 + 4} y="11" fill="white" fontSize="8"
                fontFamily="JetBrains Mono,monospace">NOW</text>
            </g>
          </svg>
        </div>
      </div>

      {/* -- Grip Cliff Predictor ------------------------------------------- */}
      <div className="card mb-4">
        <div className="card-header">
          <span className="card-title"><AlertTriangle size={13} style={{ verticalAlign: -1, marginRight: 4 }} />Grip Cliff Predictor</span>
          <span className="badge badge-orange">Rear {t.rearCompound}</span>
        </div>
        <div style={{ padding: '12px 16px' }}>
          <GripCliffPredictor compound="SOFT" lapAge={lapAge} grip={rearGrip} />
        </div>
      </div>

      {/* -- Compound Radar + Grip Budget ----------------------------------- */}
      <div className="grid-2 mb-4">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Compound Radar — 5-Axis Performance</span>
            <span className="fs-11 text-muted">Scale 0–100 · model-estimated</span>
          </div>
          <div className="card-body" style={{ justifyContent: 'center' }}>
            <CompoundRadarChart />
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Grip Budget Meter</span>
            <span className="badge badge-orange">Current: {t.rearCompound}</span>
          </div>
          <div className="card-body flex-col" style={{ gap: 20 }}>
            {(Object.keys(COMPOUNDS) as CompoundId[]).map(id => (
              <GripBudgetMeter key={id} compound={id} lapAge={lapAge} />
            ))}
          </div>
        </div>
      </div>

      {/* -- Tyre Management Strategy - Dry Race Mode --------------------------- */}
      <div className="card mb-4">
        <div className="card-header">
          <span className="card-title"><Target size={13} style={{ verticalAlign: -1, marginRight: 4 }} />Tyre Management Strategy · Dry Race Mode</span>
          <span className="badge badge-green">MotoGP</span>
        </div>
        <div style={{ padding: '12px 16px' }}>
          <TyreManagementStrategy lapAge={lapAge} rearGrip={rearGrip} />
        </div>
      </div>

      {/* -- Safety Guardian Link ------------------------------------------- */}
      <div className="card mb-4">
        <div className="card-header">
          <span className="card-title"><AlertTriangle size={13} style={{ verticalAlign: -1, marginRight: 4 }} />Safety Guardian Link</span>
        </div>
        <div className="fs-12 lh-1_6" style={{ padding: '10px 16px 14px' }}>
          <p className="text-accent fw-600">
            Rear tyre thermal risk is active.
          </p>
          <p className="text-dim mt-1">
            Do not combine earlier throttle at <strong>T15 Bucine</strong> with TC reduction until rear temperature drops below <strong>116°C</strong>.
          </p>
          <div className="mt-2 br-4" style={{ padding: '6px 8px', background: 'color-mix(in srgb, var(--yellow) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--yellow) 15%, transparent)' }}>
            <div className="flex items-center" style={{ gap: 6, alignItems: 'flex-start' }}>
              <AlertTriangle size={12} className="text-yellow mt-1 shrink-0" />
              <div>
                <div className="fw-600 fs-11">Risk +6 points if ignored</div>
                <div className="fs-10 text-muted mt-1">
                  Aggressive throttle at Bucine with rear tyre above 118°C increases high-side probability, especially at Arrabbiata exit.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* -- Compound comparison cards -------------------------------------- */}
      <div className="grid-3 mb-4">
        {(Object.entries(COMPOUNDS) as [CompoundId, typeof COMPOUNDS.SOFT][]).map(([id, c]) => (
          <div key={id} className="card">
            <div className="card-header">
              <span className="card-title flex items-center gap-2">
              <span className="d-inline-block" style={{ width: 8, height: 8, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                {c.name}
              </span>
              {t.rearCompound === id && <span className="badge badge-orange">FITTED</span>}
            </div>
            <div className="card-body flex-col" style={{ gap: 10 }}>
              {([
                { l: 'Grip at peak',     v: `${c.grip0}%` },
                { l: 'Loss rate',        v: `${c.gripLossPerLap.toFixed(1)}% / lap` },
                { l: 'Cliff at',         v: `${c.cliffAt}% grip` },
                { l: 'Heat-up',          v: `${c.heatUpLaps} laps` },
                { l: 'Optimal stint',    v: `L${c.optWindow[0]}–${c.optWindow[1]}` },
                { l: 'Temp window',      v: `${c.optTempLow}–${c.optTempHigh}°C` },
                { l: 'Est. cliff lap',   v: `L${cliffLapFor(id)}` },
              ] as { l: string; v: string }[]).map(p => (
                <div key={p.l} className="flex justify-between items-center">
                  <span className="fs-12 text-muted">{p.l}</span>
                  <span className="text-mono fs-13 fw-600">{p.v}</span>
                </div>
              ))}
              <div className="bar-track mt-1">
                <div className="bar-fill" style={{ width: `${c.grip0}%`, background: c.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* -- Model Integrity ------------------------------------------------ */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Model Integrity</span>
        </div>
        <div style={{ padding: '12px 16px' }}>
          <ModelIntegrity />
        </div>
      </div>

    </div>
  );
}

export default TireDegradationPage;
