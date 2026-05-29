/**
 * TireDegradationPage — Expert-level tyre engineering console.
 *
 * Sections:
 *   1. Tyre Thermal Map — per-corner Inner/Mid/Outer temp zones
 *   2. KPI tiles — Rear Grip %, Front Grip %, Laps-to-Cliff, Optimal Pit
 *   3. Grip Level Chart — degradation model with area fills + cliff zone
 *   4. Strategy Optimizer — 4 selectable strategies with Gantt timeline
 *   5. Compound Cards — detailed compound comparison
 *   6. [Toggle] 3D BabylonJS models
 */
import { useState, useMemo } from 'react';
import {
  AlertTriangle, Thermometer, Target, TrendingDown,
  ChevronDown, ChevronUp, CheckCircle,
} from 'lucide-react';
import { useLiveTelemetry } from '../hooks/useLiveTelemetry';
import { TireModel3D } from '../components/babylon/TireModel3D';

// ── Compound definitions ──────────────────────────────────────────────────────

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
    name: 'Soft',   color: '#E03737',
    grip0: 96,      gripLossPerLap: 3.6,  cliffAt: 55, cliffMult: 2.8,
    heatUpLaps: 2,  optWindow: [6, 10],
    optTempLow: 76, optTempHigh: 95,
  },
  MEDIUM: {
    name: 'Medium', color: '#F59E0B',
    grip0: 89,      gripLossPerLap: 2.4,  cliffAt: 50, cliffMult: 2.4,
    heatUpLaps: 4,  optWindow: [10, 15],
    optTempLow: 70, optTempHigh: 102,
  },
  HARD: {
    name: 'Hard',   color: '#D1D5DB',
    grip0: 80,      gripLossPerLap: 1.4,  cliffAt: 44, cliffMult: 2.0,
    heatUpLaps: 6,  optWindow: [16, 23],
    optTempLow: 64, optTempHigh: 108,
  },
};

// ── Temperature → colour + label ─────────────────────────────────────────────

function tempColor(t: number): string {
  if (t < 56) return '#60A5FA';
  if (t < 72) return '#34D399';
  if (t < 93) return '#FCD34D';
  if (t < 109) return '#F97316';
  return '#EF4444';
}

function tempLabel(t: number): string {
  if (t < 56)  return 'COLD';
  if (t < 72)  return 'WARMING';
  if (t < 93)  return 'OPTIMAL';
  if (t < 109) return 'HOT';
  return 'CRITICAL';
}

// ── Grip model ────────────────────────────────────────────────────────────────

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

// ── Sub-components ────────────────────────────────────────────────────────────

// Per-corner thermal card: shows 3 temperature zones (Inner · Mid · Outer)
interface TireCardProps {
  label: string; compound: string; temp: number;
  age: number; wear: number; grip: number;
}

function TireThermalCard({ label, compound, temp, age, wear, grip }: TireCardProps) {
  const tIn  = temp + 9;   // inner edge runs hottest (camber load)
  const tMid = temp;
  const tOut = temp - 6;
  const cmpKey = (compound in COMPOUNDS ? compound : 'SOFT') as CompoundId;
  const cmp = COMPOUNDS[cmpKey];
  const inWindow = temp >= cmp.optTempLow && temp <= cmp.optTempHigh;

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: `1px solid ${inWindow ? 'rgba(34,197,94,0.4)' : 'var(--border)'}`,
      borderRadius: 10, padding: 12,
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'JetBrains Mono,monospace', fontWeight: 700, fontSize: 15 }}>
          {label}
        </span>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
          background: `${cmp.color}22`, color: cmp.color,
          textTransform: 'uppercase', letterSpacing: '0.07em',
        }}>
          {compound}
        </span>
      </div>

      {/* 3-zone thermal bars */}
      <svg width="100%" height="62" viewBox="0 0 126 62">
        {([
          { name: 'IN',  t: tIn },
          { name: 'MID', t: tMid },
          { name: 'OUT', t: tOut },
        ] as { name: string; t: number }[]).map((z, i) => (
          <g key={z.name} transform={`translate(${i * 42 + 2}, 0)`}>
            <rect x="0" y="0" width="38" height="46" rx="4" fill={tempColor(z.t)} opacity="0.88" />
            <text x="19" y="28" textAnchor="middle" fill="#111" fontSize="12"
              fontWeight="800" fontFamily="JetBrains Mono,monospace">
              {Math.round(z.t)}°
            </text>
            <text x="19" y="58" textAnchor="middle" fill="#6B7280" fontSize="9">
              {z.name}
            </text>
          </g>
        ))}
      </svg>

      {/* Stats row */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {([
          { label: 'Age',  value: `${age}L`,             color: 'var(--text)' },
          { label: 'Wear', value: `${wear.toFixed(0)}%`, color: wear > 65 ? 'var(--accent)' : 'var(--yellow)' },
          { label: 'Grip', value: `${grip.toFixed(0)}%`, color: grip < 62 ? 'var(--accent)' : 'var(--green)' },
        ] as { label: string; value: string; color: string }[]).map(s => (
          <div key={s.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono,monospace', color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Temp window indicator */}
      <div style={{
        fontSize: 10, fontWeight: 700, textAlign: 'center',
        padding: '3px 0', borderRadius: 4,
        background: inWindow ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)',
        color: inWindow ? 'var(--green)' : 'var(--yellow)',
        letterSpacing: '0.05em',
      }}>
        {tempLabel(tMid)} · {inWindow ? '✓ IN WINDOW' : `OPT ${cmp.optTempLow}–${cmp.optTempHigh}°C`}
      </div>
    </div>
  );
}

// Grip degradation curve with area fill and cliff marker
interface CurveProps {
  compound: CompoundId; currentLap: number;
}

function DegCurveArea({ compound, currentLap }: CurveProps) {
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

// Strategy row with horizontal Gantt bar
interface Stint { compound: CompoundId; from: number; to: number }
interface Strategy {
  id: string; label: string; stints: Stint[];
  projectedPos: string; pitLoss: number; note: string;
  rating: 'optimal' | 'risky' | 'safe';
}

function StrategyRow({
  s, currentLap, isActive, onSelect,
}: {
  s: Strategy; currentLap: number; isActive: boolean; onSelect: () => void;
}) {
  const TOTAL = 23; const W = 540;
  const rColors = {
    optimal: { bg: 'rgba(34,197,94,0.12)', fg: 'var(--green)' },
    risky:   { bg: 'rgba(245,158,11,0.12)', fg: 'var(--yellow)' },
    safe:    { bg: 'rgba(59,130,246,0.12)',  fg: 'var(--blue)' },
  };
  const rc = rColors[s.rating];

  return (
    <div
      onClick={onSelect}
      style={{
        padding: '10px 14px', borderRadius: 8,
        border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
        background: isActive ? 'rgba(224,55,55,0.05)' : 'var(--bg-surface)',
        cursor: 'pointer', marginBottom: 8,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {isActive && <CheckCircle size={13} style={{ color: 'var(--accent)', flexShrink: 0 }} />}
          <span style={{ fontWeight: 700, fontSize: 13, color: isActive ? 'var(--text)' : 'var(--text-dim)' }}>
            {s.label}
          </span>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
            background: rc.bg, color: rc.fg,
            textTransform: 'uppercase', letterSpacing: '0.07em',
          }}>
            {s.rating}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            –{s.pitLoss.toFixed(1)}s pit
          </span>
          <span style={{
            fontFamily: 'JetBrains Mono,monospace', fontWeight: 700, fontSize: 13,
            color: s.rating === 'optimal' ? 'var(--green)' : 'var(--text)',
          }}>
            {s.projectedPos}
          </span>
        </div>
      </div>

      {/* Gantt bar */}
      <svg width="100%" height="22" viewBox={`0 0 ${W} 22`} preserveAspectRatio="none">
        <rect x="0" y="5" width={W} height="12" rx="2" fill="var(--bg-card)" />
        {s.stints.map(st => (
          <rect
            key={`${st.compound}-${st.from}`}
            x={(st.from / TOTAL) * W}
            y="5"
            width={((st.to - st.from) / TOTAL) * W - 1}
            height="12"
            fill={COMPOUNDS[st.compound].color}
            opacity="0.72"
            rx="2"
          />
        ))}
        {/* Pit stop markers */}
        {s.stints.slice(1).map(st => (
          <line key={`pit-${st.from}`}
            x1={(st.from / TOTAL) * W} y1="0"
            x2={(st.from / TOTAL) * W} y2="22"
            stroke="white" strokeWidth="2" />
        ))}
        {/* Current lap */}
        <line
          x1={(Math.min(currentLap, TOTAL) / TOTAL) * W} y1="0"
          x2={(Math.min(currentLap, TOTAL) / TOTAL) * W} y2="22"
          stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" strokeDasharray="2,2" />
        {/* Lap labels */}
        {[0, 5, 10, 15, 20, 23].map(lap => (
          <text key={lap} x={(lap / TOTAL) * W} y="22"
            fill="#535A6E" fontSize="7" textAnchor="middle" fontFamily="JetBrains Mono,monospace">
            {lap}
          </text>
        ))}
      </svg>

      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5, lineHeight: 1.5 }}>
        {s.note}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function TireDegradationPage() {
  const t = useLiveTelemetry();
  const [show3D, setShow3D]       = useState(false);
  const [activeStrat, setActive]  = useState('A');

  const lapAge    = t.rearTyreAge;
  const rearWear  = Math.min(99, lapAge * 4.8);
  const frontWear = Math.min(99, lapAge * 3.2);

  // Grip using physics model — non-linear cliff
  const rearGrip  = gripAt('SOFT', lapAge);
  const frontGrip = gripAt('MEDIUM', lapAge);

  // Laps until SOFT cliff threshold
  const lapsToCliff = useMemo(() => {
    const cliff = COMPOUNDS.SOFT.cliffAt;
    if (rearGrip <= cliff) return 0;
    const lossPerLap = COMPOUNDS.SOFT.gripLossPerLap;
    return Math.max(0, Math.round((rearGrip - cliff) / lossPerLap));
  }, [rearGrip]);

  const optPit = Math.max(t.lapCount + 1, t.lapCount + Math.round((18 - lapAge) / 1.5));

  // Strategy definitions
  const strategies = useMemo<Strategy[]>(() => [
    {
      id: 'A',
      label: `1-Stop · Pit L${optPit} → Hard`,
      stints: [
        { compound: 'SOFT', from: 0, to: optPit },
        { compound: 'HARD', from: optPit, to: 23 },
      ],
      projectedPos: 'P2–P3',
      pitLoss: 22.4,
      rating: 'optimal',
      note: `Recommended. Hard tyre covers ${23 - optPit} laps without cliff risk. KDD confidence: 87%.`,
    },
    {
      id: 'B',
      label: `1-Stop · Push to L${optPit + 3} → Medium`,
      stints: [
        { compound: 'SOFT', from: 0, to: optPit + 3 },
        { compound: 'MEDIUM', from: optPit + 3, to: 23 },
      ],
      projectedPos: 'P1–P3',
      pitLoss: 22.4,
      rating: 'risky',
      note: lapsToCliff > 3
        ? `Cliff risk at L${lapAge + lapsToCliff}. Monitor grip lap-by-lap. High reward if tyre holds.`
        : `⚠ Cliff imminent — high risk. Only attempt if DRS gap is critical.`,
    },
    {
      id: 'C',
      label: '2-Stop · L8 + L17 (Soft → Medium → Soft)',
      stints: [
        { compound: 'SOFT', from: 0, to: 8 },
        { compound: 'MEDIUM', from: 8, to: 17 },
        { compound: 'SOFT', from: 17, to: 23 },
      ],
      projectedPos: 'P2–P5',
      pitLoss: 44.8,
      rating: 'risky',
      note: '44.8s total pit loss. Only viable with safety car in final stint or to attack rival strategy.',
    },
    {
      id: 'D',
      label: `1-Stop · Undercut L${Math.max(t.lapCount + 1, optPit - 3)} → Hard`,
      stints: [
        { compound: 'SOFT', from: 0, to: Math.max(t.lapCount + 1, optPit - 3) },
        { compound: 'HARD', from: Math.max(t.lapCount + 1, optPit - 3), to: 23 },
      ],
      projectedPos: 'P3–P5',
      pitLoss: 22.4,
      rating: 'safe',
      note: 'Conservative undercut. Sacrifices track position for tyre stability and clean air in final stint.',
    },
  ], [optPit, lapAge, lapsToCliff, t.lapCount]);

  const corners: TireCardProps[] = [
    { label: 'FL', compound: t.frontCompound, temp: t.tireFrontLeft,  age: lapAge, wear: frontWear, grip: frontGrip },
    { label: 'FR', compound: t.frontCompound, temp: t.tireFrontRight, age: lapAge, wear: frontWear, grip: frontGrip },
    { label: 'RL', compound: t.rearCompound,  temp: t.tireRearLeft,   age: lapAge, wear: rearWear,  grip: rearGrip  },
    { label: 'RR', compound: t.rearCompound,  temp: t.tireRearRight,  age: lapAge, wear: rearWear,  grip: rearGrip  },
  ];

  const cliffColor = lapsToCliff <= 2 ? 'var(--accent)' : lapsToCliff <= 5 ? 'var(--yellow)' : 'var(--green)';

  return (
    <div className="page">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Tyre Degradation</h1>
          <p className="page-subtitle">Thermal analysis · Grip model · Cliff predictor · Strategy optimizer</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-orange">Rear {t.rearCompound} · L{lapAge}</span>
          <span className="badge badge-blue">Front {t.frontCompound}</span>
          <button
            className="btn btn-ghost btn-sm flex items-center gap-1"
            onClick={() => setShow3D(v => !v)}
          >
            {show3D ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            3D
          </button>
        </div>
      </div>

      {/* ── 3D Models (collapsible) ──────────────────────────────────────────── */}
      {show3D && (
        <div className="card mb-4">
          <div className="card-header">
            <span className="card-title">3D Tyre Visualization</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, padding: '12px 16px' }}>
            <TireModel3D temperature={t.tireFrontLeft}  compound={t.frontCompound} label="FL" height={160} />
            <TireModel3D temperature={t.tireFrontRight} compound={t.frontCompound} label="FR" height={160} />
            <TireModel3D temperature={t.tireRearLeft}   compound={t.rearCompound}  label="RL" height={160} />
            <TireModel3D temperature={t.tireRearRight}  compound={t.rearCompound}  label="RR" height={160} />
          </div>
        </div>
      )}

      {/* ── Thermal map ─────────────────────────────────────────────────────── */}
      <div className="card mb-4">
        <div className="card-header">
          <span className="card-title flex items-center gap-2">
            <Thermometer size={14} style={{ color: 'var(--accent)' }} />
            Tyre Thermal Map — Inner · Mid · Outer zones
          </span>
          {/* Temperature legend */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {([
              ['<56°', '#60A5FA'], ['56–72°', '#34D399'], ['72–93°', '#FCD34D'],
              ['93–109°', '#F97316'], ['>109°', '#EF4444'],
            ] as [string, string][]).map(([l, col]) => (
              <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: 'var(--text-muted)' }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: col, display: 'inline-block' }} />
                {l}
              </span>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, padding: '12px 16px' }}>
          {corners.map(c => <TireThermalCard key={c.label} {...c} />)}
        </div>
      </div>

      {/* ── KPI tiles ───────────────────────────────────────────────────────── */}
      <div className="grid-4 mb-4">
        <div className="stat-tile" style={{ border: `1px solid ${rearGrip < 62 ? 'var(--accent)' : rearGrip < 78 ? 'rgba(245,158,11,0.5)' : 'rgba(34,197,94,0.4)'}` }}>
          <div className="stat-tile__label">Rear Grip Level</div>
          <div className="stat-tile__value" style={{ color: rearGrip < 62 ? 'var(--accent)' : rearGrip < 78 ? 'var(--yellow)' : 'var(--green)' }}>
            {rearGrip.toFixed(1)}<span className="stat-tile__unit">%</span>
          </div>
          <div className="bar-track" style={{ marginTop: 8 }}>
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
          <div className="bar-track" style={{ marginTop: 8 }}>
            <div className="bar-fill blue" style={{ width: `${frontGrip}%` }} />
          </div>
        </div>

        <div className="stat-tile" style={{ border: `1px solid ${cliffColor}44` }}>
          <div className="stat-tile__label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <AlertTriangle size={11} style={{ color: cliffColor, flexShrink: 0 }} />
            Laps to Cliff
          </div>
          <div className="stat-tile__value text-mono" style={{ color: cliffColor }}>
            {lapsToCliff > 0 ? lapsToCliff : '!'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            {lapsToCliff <= 0 ? '⚠ CLIFF REACHED' : lapsToCliff <= 3 ? 'CRITICAL — pit soon' : 'until grip drop'}
          </div>
        </div>

        <div className="stat-tile green-border">
          <div className="stat-tile__label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Target size={11} style={{ flexShrink: 0 }} />
            Optimal Pit Lap
          </div>
          <div className="stat-tile__value text-mono" style={{ color: 'var(--green)' }}>
            L{optPit}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            +{Math.max(0, optPit - t.lapCount)} laps from now
          </div>
        </div>
      </div>

      {/* ── Grip level chart ─────────────────────────────────────────────────── */}
      <div className="card mb-4">
        <div className="card-header">
          <span className="card-title flex items-center gap-2">
            <TrendingDown size={14} style={{ color: 'var(--text-muted)' }} />
            Grip Level Model — All Compounds
          </span>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            {(Object.entries(COMPOUNDS) as [CompoundId, typeof COMPOUNDS.SOFT][]).map(([id, c]) => (
              <span key={id} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-muted)' }}>
                <span style={{ width: 14, height: 3, background: c.color, borderRadius: 2, display: 'inline-block' }} />
                {c.name}
              </span>
            ))}
          </div>
        </div>
        <div className="card-body">
          <svg width="100%" height="140" viewBox="0 0 600 140" preserveAspectRatio="xMidYMid meet">
            {/* Y-axis grid lines */}
            {[100, 75, 50, 25].map(pct => (
              <g key={pct}>
                <line x1="30" y1={10 + (1 - pct / 100) * 100} x2="590" y2={10 + (1 - pct / 100) * 100}
                  stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <text x="26" y={14 + (1 - pct / 100) * 100} fill="#535A6E" fontSize="9"
                  textAnchor="end" fontFamily="JetBrains Mono,monospace">{pct}%</text>
              </g>
            ))}
            {/* Cliff zone shading (below ~58% grip) */}
            <rect x="30" y={10 + (1 - 0.58) * 100} width="560" height={0.58 * 100}
              fill="rgba(224,55,55,0.04)" />
            <line x1="30" y1={10 + (1 - 0.58) * 100} x2="590" y2={10 + (1 - 0.58) * 100}
              stroke="rgba(224,55,55,0.22)" strokeWidth="1" strokeDasharray="4,3" />
            <text x="34" y={8 + (1 - 0.58) * 100} fill="rgba(224,55,55,0.5)" fontSize="8"
              fontFamily="JetBrains Mono,monospace">CLIFF ZONE</text>
            {/* Lap axis */}
            {[0, 5, 10, 15, 20, 23].map(lap => (
              <text key={lap} x={30 + (lap / 23) * 560} y="135" fill="#535A6E" fontSize="9"
                textAnchor="middle" fontFamily="JetBrains Mono,monospace">L{lap}</text>
            ))}
            {/* Curves */}
            <g transform="translate(30, 10)">
              {(Object.keys(COMPOUNDS) as CompoundId[]).map(id => (
                <DegCurveArea key={id} compound={id} currentLap={lapAge} />
              ))}
              {/* NOW marker */}
              <line x1={(lapAge / 23) * 560} y1="0" x2={(lapAge / 23) * 560} y2="100"
                stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" />
              <text x={(lapAge / 23) * 560 + 4} y="11" fill="white" fontSize="8"
                fontFamily="JetBrains Mono,monospace">NOW</text>
            </g>
          </svg>
        </div>
      </div>

      {/* ── Strategy optimizer ──────────────────────────────────────────────── */}
      <div className="card mb-4">
        <div className="card-header">
          <span className="card-title">Strategy Optimizer</span>
          <span className="badge badge-green">AI Recommended</span>
        </div>
        <div style={{ padding: '12px 16px' }}>
          {strategies.map(s => (
            <StrategyRow
              key={s.id}
              s={s}
              currentLap={t.lapCount}
              isActive={activeStrat === s.id}
              onSelect={() => setActive(s.id)}
            />
          ))}
        </div>
      </div>

      {/* ── Compound comparison cards ────────────────────────────────────────── */}
      <div className="grid-3">
        {(Object.entries(COMPOUNDS) as [CompoundId, typeof COMPOUNDS.SOFT][]).map(([id, c]) => (
          <div key={id} className="card">
            <div className="card-header">
              <span className="card-title flex items-center gap-2">
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.color, flexShrink: 0, display: 'inline-block' }} />
                {c.name}
              </span>
              {t.rearCompound === id && <span className="badge badge-orange">FITTED</span>}
            </div>
            <div className="card-body" style={{ flexDirection: 'column', gap: 10 }}>
              {([
                { l: 'Grip at peak',     v: `${c.grip0}%` },
                { l: 'Loss rate',        v: `${c.gripLossPerLap.toFixed(1)}% / lap` },
                { l: 'Cliff at',         v: `${c.cliffAt}% grip` },
                { l: 'Heat-up',          v: `${c.heatUpLaps} laps` },
                { l: 'Optimal stint',    v: `L${c.optWindow[0]}–${c.optWindow[1]}` },
                { l: 'Temp window',      v: `${c.optTempLow}–${c.optTempHigh}°C` },
                { l: 'Est. cliff lap',   v: `L${cliffLapFor(id)}` },
              ] as { l: string; v: string }[]).map(p => (
                <div key={p.l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.l}</span>
                  <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 13, fontWeight: 600 }}>{p.v}</span>
                </div>
              ))}
              <div className="bar-track" style={{ marginTop: 4 }}>
                <div className="bar-fill" style={{ width: `${c.grip0}%`, background: c.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
