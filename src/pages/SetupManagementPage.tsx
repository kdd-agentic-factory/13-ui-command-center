/**
 * SetupManagementPage — Garage Setup Lab: expert moto setup engineering console.
 *
 * Engineer review pass:
 *   • 100% moto-credible parameters — removed car-style front/rear camber,
 *     unified Rake Angle (no duplicate), aero block reframed as Aero / Ride Height.
 *   • Separates deviation, lap-time impact, confidence and risk (not just numbers).
 *   • Turns "18 modified" into decisions: contributors, interpretation, complexity,
 *     rider feedback ↔ telemetry correlation, change history and variant actions.
 */
import { useState, useCallback, useMemo } from 'react';
import { Save, RotateCcw, CheckCircle, TrendingDown, TrendingUp, ArrowUpToLine, FileDown, AlertTriangle, History, MessageSquare } from 'lucide-react';
import { useToast } from '../components/ToastProvider';

// ── Setup parameter definitions ────────────────────────────────────────────────

interface SetupParam {
  group: string;
  name: string;
  defaultValue: number;
  min: number; max: number;
  unit: string;
  baseline: number;
  lapTimeImpactPerUnit: number;  // seconds per unit change (signed: + = slower, − = faster)
}

// Values reflect a worked Q3 setup vs the FP3 Race Baseline. Geometry is moto-real
// (rake / trail / fork offset / swingarm pivot) — no four-wheel camber.
const SETUP_PARAMS: SetupParam[] = [
  // Suspension
  { group: 'Suspension', name: 'Front Spring Preload', defaultValue: 12.4, min: 8,    max: 18,   unit: 'mm',     baseline: 11.0, lapTimeImpactPerUnit: -0.008 },
  { group: 'Suspension', name: 'Front Compression',    defaultValue: 13.6, min: 8,    max: 20,   unit: 'clicks', baseline: 12.0, lapTimeImpactPerUnit: +0.006 },
  { group: 'Suspension', name: 'Front Rebound',        defaultValue: 11.1, min: 8,    max: 22,   unit: 'clicks', baseline: 14.0, lapTimeImpactPerUnit: +0.004 },
  { group: 'Suspension', name: 'Rear Preload',         defaultValue: 10.4, min: 6,    max: 14,   unit: 'mm',     baseline: 8.5,  lapTimeImpactPerUnit: -0.006 },
  { group: 'Suspension', name: 'Rear Compression',     defaultValue: 18.1, min: 10,   max: 25,   unit: 'clicks', baseline: 16.0, lapTimeImpactPerUnit: +0.007 },
  { group: 'Suspension', name: 'Rear Rebound',         defaultValue: 14.9, min: 12,   max: 28,   unit: 'clicks', baseline: 18.0, lapTimeImpactPerUnit: +0.005 },
  // Aero / Ride Height
  { group: 'Aero / Ride Height', name: 'Aero Load',          defaultValue: 4.3,   min: 1,    max: 9,    unit: 'level', baseline: 3.0,   lapTimeImpactPerUnit: +0.020 },
  { group: 'Aero / Ride Height', name: 'Front Ride Height',  defaultValue: 114.8, min: 90,   max: 130,  unit: 'mm',    baseline: 108.0, lapTimeImpactPerUnit: -0.0025 },
  { group: 'Aero / Ride Height', name: 'Rear Ride Height',   defaultValue: 137.6, min: 110,  max: 150,  unit: 'mm',    baseline: 128.0, lapTimeImpactPerUnit: -0.0012 },
  { group: 'Aero / Ride Height', name: 'Wheelbase',          defaultValue: 1435,  min: 1420, max: 1450, unit: 'mm',    baseline: 1429,  lapTimeImpactPerUnit: -0.0005 },
  // Electronics
  { group: 'Electronics', name: 'Traction Control',    defaultValue: 3,    min: 1,    max: 9,    unit: 'TC',     baseline: 4,    lapTimeImpactPerUnit: +0.018 },
  { group: 'Electronics', name: 'Engine Brake',        defaultValue: 4,    min: 1,    max: 9,    unit: 'EB',     baseline: 3,    lapTimeImpactPerUnit: +0.012 },
  { group: 'Electronics', name: 'Engine Map',          defaultValue: 6.2,  min: 1,    max: 9,    unit: 'MAP',    baseline: 5,    lapTimeImpactPerUnit: -0.022 },
  { group: 'Electronics', name: 'Wheelie Control',     defaultValue: 2.6,  min: 1,    max: 5,    unit: 'WC',     baseline: 2,    lapTimeImpactPerUnit: +0.008 },
  // Geometry (moto-real — rake / trail / fork offset / swingarm pivot)
  { group: 'Geometry', name: 'Rake Angle',             defaultValue: 23.7, min: 22,   max: 26,   unit: '°',      baseline: 23.2, lapTimeImpactPerUnit: +0.025 },
  { group: 'Geometry', name: 'Trail',                  defaultValue: 98.4, min: 90,   max: 105,  unit: 'mm',     baseline: 96.3, lapTimeImpactPerUnit: +0.003 },
  { group: 'Geometry', name: 'Fork Offset',            defaultValue: 29.3, min: 22,   max: 34,   unit: 'mm',     baseline: 26.0, lapTimeImpactPerUnit: -0.004 },
  { group: 'Geometry', name: 'Swingarm Pivot Height',  defaultValue: 1.5,  min: -3,   max: 5,    unit: 'mm',     baseline: 0.0,  lapTimeImpactPerUnit: -0.001 },
];

const MODEL_CONFIDENCE = 68; // %
const STORAGE_KEY = 'kdd-setup-v1';

function loadSavedValues(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Record<string, number>;
  } catch { /* ignore */ }
  return Object.fromEntries(SETUP_PARAMS.map(p => [p.name, p.defaultValue]));
}

function baselineValues(): Record<string, number> {
  return Object.fromEntries(SETUP_PARAMS.map(p => [p.name, p.baseline]));
}

// ── Setup variants ────────────────────────────────────────────────────────────

const SETUP_VARIANTS = [
  { name: 'Current Setup (Q3)', session: 'Q3',  lapTime: '1:33.412', status: 'Active',       cond: 'dry · 42°C' },
  { name: 'Race Baseline',      session: 'FP3', lapTime: '1:33.847', status: 'Reference',    cond: 'dry · 38°C' },
  { name: 'Soft Front Option',  session: 'FP2', lapTime: '1:33.201', status: 'Fastest',      cond: 'warm · 46°C' },
  { name: 'High Grip Option',   session: 'FP1', lapTime: '1:34.102', status: 'Safe',         cond: 'cool · 31°C' },
];

// ── Radar chart ───────────────────────────────────────────────────────────────

type RadarAxis = 'Stability' | 'Turn-in' | 'Braking' | 'Exit Drive' | 'Traction' | 'Top Speed';

const RADAR_AXES: RadarAxis[] = ['Stability', 'Turn-in', 'Braking', 'Exit Drive', 'Traction', 'Top Speed'];

function RadarChart({ values, baseline }: { values: Record<string, number>; baseline: Record<string, number> }) {
  // Normalize each axis 0–100 from parameter changes
  const axisScore = (axis: RadarAxis, vals: Record<string, number>): number => {
    const paramMap: Record<RadarAxis, string[]> = {
      Stability:   ['Front Spring Preload', 'Rear Preload', 'Rake Angle'],
      'Turn-in':   ['Rake Angle', 'Trail', 'Fork Offset'],
      Braking:     ['Front Compression', 'Front Rebound', 'Engine Brake'],
      'Exit Drive':['Rear Compression', 'Rear Rebound', 'Wheelie Control'],
      Traction:    ['Traction Control', 'Rear Rebound', 'Rear Ride Height'],
      'Top Speed': ['Aero Load', 'Engine Map', 'Front Ride Height'],
    };
    const params = paramMap[axis];
    let score = 50;
    params.forEach(name => {
      const p = SETUP_PARAMS.find(sp => sp.name === name);
      if (!p) return;
      const normalised = (vals[name] - p.min) / (p.max - p.min);
      score += (normalised - 0.5) * 30;
    });
    return Math.max(10, Math.min(90, score));
  };

  const N = RADAR_AXES.length;
  const CX = 100; const CY = 100; const R = 75;

  const polygon = (scores: number[]) => {
    return scores.map((s, i) => {
      const angle = (i / N) * 2 * Math.PI - Math.PI / 2;
      const r = (s / 100) * R;
      return `${CX + r * Math.cos(angle)},${CY + r * Math.sin(angle)}`;
    }).join(' ');
  };

  const curScores = RADAR_AXES.map(a => axisScore(a, values));
  const basScores = RADAR_AXES.map(a => axisScore(a, baseline));

  return (
    <svg width="200" height="200" viewBox="0 0 200 200">
      {/* Grid rings */}
      {[25, 50, 75, 100].map(pct => (
        <polygon key={pct} points={RADAR_AXES.map((_, i) => {
          const angle = (i / N) * 2 * Math.PI - Math.PI / 2;
          const r = (pct / 100) * R;
          return `${CX + r * Math.cos(angle)},${CY + r * Math.sin(angle)}`;
        }).join(' ')}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      ))}
      {/* Axis lines */}
      {RADAR_AXES.map((_, i) => {
        const angle = (i / N) * 2 * Math.PI - Math.PI / 2;
        return (
          <line key={i}
            x1={CX} y1={CY}
            x2={CX + R * Math.cos(angle)} y2={CY + R * Math.sin(angle)}
            stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        );
      })}
      {/* Baseline polygon */}
      <polygon points={polygon(basScores)}
        fill="rgba(59,130,246,0.1)" stroke="rgba(59,130,246,0.4)" strokeWidth="1.5" />
      {/* Current polygon */}
      <polygon points={polygon(curScores)}
        fill="rgba(224,55,55,0.12)" stroke="var(--accent)" strokeWidth="2" />
      {/* Axis labels */}
      {RADAR_AXES.map((axis, i) => {
        const angle = (i / N) * 2 * Math.PI - Math.PI / 2;
        const labelR = R + 16;
        return (
          <text key={axis}
            x={CX + labelR * Math.cos(angle)}
            y={CY + labelR * Math.sin(angle) + 3}
            textAnchor="middle" fill="#8A92A6" fontSize="8"
            fontFamily="sans-serif">
            {axis}
          </text>
        );
      })}
    </svg>
  );
}

// ── Setup slider ──────────────────────────────────────────────────────────────

interface SliderProps {
  param: SetupParam;
  value: number;
  onChange: (name: string, v: number) => void;
}

function SetupSlider({ param, value, onChange }: SliderProps) {
  const diff = value - param.baseline;
  const diffStr = diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1);
  const hasChange = Math.abs(diff) >= 0.01;
  const impact = diff * param.lapTimeImpactPerUnit;
  const impactStr = impact > 0 ? `+${impact.toFixed(3)}s` : `${impact.toFixed(3)}s`;

  return (
    <div className="setup-row">
      <span className="setup-name" title={`Impact: ${impactStr}/lap (${impact < 0 ? 'gain' : 'penalty'})`}>{param.name}</span>
      <input
        type="range"
        min={param.min}
        max={param.max}
        step={(param.max - param.min) / 100}
        value={value}
        onChange={e => onChange(param.name, parseFloat(e.target.value))}
        style={{ flex: 1, accentColor: 'var(--accent)' }}
      />
      <span className="setup-val text-mono">{value.toFixed(1)}</span>
      <span style={{
        fontSize: 11,
        color: hasChange ? (impact < 0 ? 'var(--green)' : 'var(--yellow)') : 'var(--text-muted)',
        minWidth: 44,
        textAlign: 'right',
        fontFamily: 'JetBrains Mono,monospace',
      }}>
        {hasChange ? diffStr : '—'}
      </span>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 36 }}>{param.unit}</span>
    </div>
  );
}

// ── Session comparison chart ──────────────────────────────────────────────────

function SessionComparisonChart() {
  const parseLap = (s: string) => {
    const [m, sec] = s.split(':');
    return parseInt(m, 10) * 60 + parseFloat(sec);
  };
  const times = SETUP_VARIANTS.map(v => parseLap(v.lapTime));
  const fastest = Math.min(...times);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {SETUP_VARIANTS.map((v, i) => {
        const delta = times[i] - fastest;
        const barPct = Math.max(35, 100 - (delta / 1.0) * 65);
        const isActive = v.status === 'Active';
        const isFastest = delta < 0.001;
        return (
          <div key={v.name}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
              <span style={{ fontSize:11, fontWeight:isActive ? 700 : 400, color:isActive ? 'var(--accent)' : 'var(--text)' }}>
                {v.name.replace(/\s*\(.*\)/, '')}
                {isActive && <span className="badge badge-red" style={{ marginLeft:4, fontSize:8 }}>ACTIVE</span>}
                <span style={{ marginLeft:6, fontSize:9, color:'var(--text-muted)', fontFamily:'JetBrains Mono,monospace' }}>{v.cond}</span>
              </span>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <span style={{ fontSize:11, fontFamily:'JetBrains Mono,monospace', color: isActive ? 'var(--accent)' : 'var(--text-muted)' }}>
                  {v.lapTime}
                </span>
                {isFastest
                  ? <span style={{ fontSize:9, fontWeight:700, color:'var(--green)', letterSpacing:'0.05em' }}>FASTEST</span>
                  : <span style={{ fontSize:11, fontFamily:'JetBrains Mono,monospace', color:'var(--accent)' }}>+{delta.toFixed(3)}s</span>
                }
              </div>
            </div>
            <div className="bar-track" style={{ height:8, borderRadius:3 }}>
              <div style={{ width:`${barPct}%`, height:8, borderRadius:3, background:isActive ? 'var(--accent)' : isFastest ? 'var(--green)' : 'rgba(255,255,255,0.14)' }} />
            </div>
          </div>
        );
      })}
      <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:2, lineHeight:1.45 }}>
        Soft Front Option was fastest in warmer conditions — model predicts only <strong style={{ color:'var(--yellow)' }}>62%</strong> transferability to current track temp.
      </div>
    </div>
  );
}

// ── Group deviation heatmap ───────────────────────────────────────────────────

function GroupDeviationGrid({ values }: { values: Record<string, number> }) {
  const groups = [...new Set(SETUP_PARAMS.map(p => p.group))];
  const cellBg = (pct: number) => {
    const abs = Math.abs(pct);
    if (abs < 4)  return 'rgba(255,255,255,0.05)';
    if (abs < 12) return 'rgba(245,158,11,0.25)';
    if (abs < 25) return 'rgba(245,158,11,0.50)';
    return 'rgba(224,55,55,0.55)';
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
      {groups.map(group => {
        const params = SETUP_PARAMS.filter(p => p.group === group);
        return (
          <div key={group} style={{ display:'flex', gap:4, alignItems:'center' }}>
            <span style={{ width:120, fontSize:9, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em', flexShrink:0, whiteSpace:'nowrap' }}>
              {group}
            </span>
            {params.map(p => {
              const range = p.max - p.min;
              const pct   = range > 0 ? ((values[p.name] - p.baseline) / range) * 100 : 0;
              const changed = Math.abs(values[p.name] - p.baseline) >= 0.01;
              return (
                <div key={p.name} title={`${p.name}: ${values[p.name].toFixed(1)} ${p.unit} (${pct > 0 ? '+' : ''}${pct.toFixed(0)}%)`}
                  style={{ flex:1, height:20, borderRadius:3, background:cellBg(pct), border:changed ? '1px solid rgba(255,255,255,0.18)' : '1px solid transparent', cursor:'default' }} />
              );
            })}
          </div>
        );
      })}
      <div style={{ display:'flex', gap:14, flexWrap:'wrap', fontSize:9, color:'var(--text-muted)', marginTop:4 }}>
        <span><span style={{ display:'inline-block', width:8, height:8, borderRadius:2, background:'rgba(255,255,255,0.10)', marginRight:4, verticalAlign:-1 }} />Unchanged</span>
        <span><span style={{ display:'inline-block', width:8, height:8, borderRadius:2, background:'rgba(245,158,11,0.45)', marginRight:4, verticalAlign:-1 }} />Minor deviation</span>
        <span><span style={{ display:'inline-block', width:8, height:8, borderRadius:2, background:'rgba(224,55,55,0.55)', marginRight:4, verticalAlign:-1 }} />Major deviation</span>
        <span style={{ color:'var(--text-dim)' }}>· hover a cell for detail</span>
      </div>
    </div>
  );
}

// ── Top-impact parameters ─────────────────────────────────────────────────────

function TopImpactParams({ values }: { values: Record<string, number> }) {
  const candidates = SETUP_PARAMS.map(p => {
    const bestVal      = p.lapTimeImpactPerUnit < 0 ? p.max : p.min;
    const potentialGain = Math.abs((bestVal - values[p.name]) * p.lapTimeImpactPerUnit);
    const currentImpact = (values[p.name] - p.baseline) * p.lapTimeImpactPerUnit;
    return { ...p, potentialGain, currentImpact };
  }).sort((a, b) => b.potentialGain - a.potentialGain).slice(0, 6);

  const maxGain = candidates[0]?.potentialGain ?? 0.1;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
      {candidates.map(p => {
        const isBeneficial = p.currentImpact < 0;
        return (
          <div key={p.name}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
              <span style={{ fontSize:11, color:'var(--text-dim)' }}>{p.name}</span>
              <span style={{ fontSize:11, fontFamily:'JetBrains Mono,monospace', color:'var(--green)', fontWeight:700 }}>
                −{p.potentialGain.toFixed(3)}s
              </span>
            </div>
            <div className="bar-track" style={{ height:6, borderRadius:3 }}>
              <div style={{ width:`${(p.potentialGain / maxGain) * 100}%`, height:6, borderRadius:3, background:isBeneficial ? 'var(--blue)' : 'var(--green)' }} />
            </div>
          </div>
        );
      })}
      <div style={{ fontSize:9, color:'var(--text-muted)', lineHeight:1.45 }}>
        Gains are estimated <strong>independently</strong> — combined gain may be lower due to parameter interaction.
      </div>
    </div>
  );
}

// ── Rider feedback ────────────────────────────────────────────────────────────

const RIDER_FEEDBACK = [
  { label: 'Entry stability',  value: 'Good',                  tone: 'var(--green)'  },
  { label: 'Mid-corner feel',  value: 'Understeer at T4/T5',   tone: 'var(--yellow)' },
  { label: 'Exit traction',    value: 'Rear moving at T7/T9',  tone: 'var(--accent)' },
  { label: 'Braking support',  value: 'Stable, slight dive',   tone: 'var(--text)'   },
];

const CHANGE_HISTORY = [
  { t: '01:16:07', e: 'Saved Current Setup Q3' },
  { t: '01:12:44', e: 'Traction Control 4 → 3' },
  { t: '01:11:20', e: 'Engine Map 5 → 6' },
  { t: '01:08:05', e: 'Rear Rebound −2 clicks' },
  { t: '01:04:30', e: 'Front Preload +1 mm' },
];

// ── Page ───────────────────────────────────────────────────────────────────────

export function SetupManagementPage() {
  const { toast } = useToast();
  const [values, setValues] = useState<Record<string, number>>(loadSavedValues);
  const [savedAt, setSavedAt] = useState<string | null>(() => {
    try { return localStorage.getItem(`${STORAGE_KEY}-ts`); } catch { return null; }
  });

  const groups = [...new Set(SETUP_PARAMS.map(p => p.group))];
  const changedParams = SETUP_PARAMS.filter(p => Math.abs(values[p.name] - p.baseline) >= 0.01);
  const changedCount  = changedParams.length;

  // Predicted lap time delta from all changed parameters
  const lapTimeDelta = useMemo(() => {
    return SETUP_PARAMS.reduce((acc, p) => {
      const diff = values[p.name] - p.baseline;
      return acc + diff * p.lapTimeImpactPerUnit;
    }, 0);
  }, [values]);

  // Per-group impact → contributors + interpretation
  const groupImpacts = useMemo(() => groups.map(g => {
    const impact = SETUP_PARAMS.filter(p => p.group === g)
      .reduce((a, p) => a + (values[p.name] - p.baseline) * p.lapTimeImpactPerUnit, 0);
    return { g, impact };
  }), [values, groups]);

  const contributors = useMemo(() => [...groupImpacts].sort((a, b) => a.impact - b.impact), [groupImpacts]);
  const gainers = contributors.filter(c => c.impact < -0.001).map(c => c.g);
  const losers  = contributors.filter(c => c.impact >  0.001).map(c => c.g);
  const interpretation = changedCount === 0
    ? 'Setup is at baseline — no predicted change.'
    : `Current setup is ${lapTimeDelta < 0 ? 'slightly faster than' : 'slower than'} baseline. `
      + (gainers.length ? `Most predicted gain comes from ${gainers.slice(0, 2).join(' and ')}. ` : '')
      + (losers.length ? `${losers.join(' and ')} add a small stability / turn-in trade-off.` : '');

  const risk = changedCount >= 12 ? 'Medium' : changedCount >= 6 ? 'Low–Medium' : 'Low';

  const handleChange = useCallback((name: string, v: number) => {
    setValues(prev => ({ ...prev, [name]: v }));
  }, []);

  function nowStamp() {
    return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  function handleSave() {
    const ts = nowStamp();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
      localStorage.setItem(`${STORAGE_KEY}-ts`, ts);
      setSavedAt(ts);
    } catch { /* quota exceeded */ }
    toast({
      type: 'success', title: 'Setup variant saved',
      message: `${changedCount > 0 ? changedCount + ' params modified from baseline' : 'No changes from baseline'}. Saved ${ts}.`,
    });
  }

  function handleReset() {
    const base = baselineValues();
    setValues(base);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(`${STORAGE_KEY}-ts`);
    } catch { /* ignore */ }
    setSavedAt(null);
    toast({ type: 'info', title: 'Reset to baseline', message: `All ${SETUP_PARAMS.length} parameters restored to race baseline values.` });
  }

  function handleApplyStint() {
    toast({
      type: 'success', title: 'Setup applied to next stint',
      message: `${changedCount} parameters · confidence ${MODEL_CONFIDENCE}% · risk ${risk}. Safety check passed.`,
    });
  }

  function handleExport() {
    toast({ type: 'info', title: 'Setup sheet', message: 'Generating printable setup sheet…' });
    setTimeout(() => window.print(), 200);
  }

  const deltaColor = lapTimeDelta < -0.05 ? 'var(--green)' : lapTimeDelta > 0.05 ? 'var(--accent)' : 'var(--yellow)';
  const baseline = baselineValues();

  return (
    <div className="page">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="page-title">Garage Setup Lab</h1>
          <p className="page-subtitle">Live setup control · Lap-time impact prediction · Variant management</p>
        </div>
        <div className="flex items-center gap-2">
          {changedCount > 0 && <span className="badge badge-yellow">{changedCount} modified</span>}
          {savedAt && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace' }}>
              saved {savedAt}
            </span>
          )}
          <button className="btn btn-ghost btn-sm flex items-center gap-2" onClick={handleReset}>
            <RotateCcw size={14} />Reset
          </button>
          <button className="btn btn-ghost btn-sm flex items-center gap-2" onClick={handleExport}>
            <FileDown size={14} />Export
          </button>
          <button className="btn btn-ghost btn-sm flex items-center gap-2" onClick={handleApplyStint}>
            <ArrowUpToLine size={14} />Apply to Next Stint
          </button>
          <button className="btn btn-primary btn-sm flex items-center gap-2" onClick={handleSave}>
            <Save size={14} />{savedAt ? 'Update' : 'Save Variant'}
          </button>
        </div>
      </div>

      {/* Context strip — session / track / baseline / confidence */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:16, alignItems:'center', marginBottom:16, padding:'8px 14px', borderRadius:8, border:'1px solid var(--border)', background:'rgba(255,255,255,0.02)', fontSize:12, fontFamily:'JetBrains Mono,monospace' }}>
        <span style={{ color:'var(--text-dim)' }}>Mugello · Q3 · Dry · Track 42°C · Rider #47</span>
        <span style={{ color:'var(--text-muted)' }}>Current: <strong style={{ color:'var(--accent)' }}>Q3 Active</strong></span>
        <span style={{ color:'var(--text-muted)' }}>Baseline: <strong style={{ color:'var(--text-dim)' }}>Race Baseline FP3</strong></span>
        <span style={{ marginLeft:'auto', color:'var(--text-muted)' }}>Model confidence <strong style={{ color:'var(--blue)' }}>{MODEL_CONFIDENCE}%</strong></span>
      </div>

      {/* ── Lap time impact estimator ──────────────────────────────────────── */}
      {changedCount > 0 && (
        <div style={{
          padding: '14px 20px', marginBottom: 16, borderRadius: 10,
          border: `1px solid ${deltaColor}44`,
          background: `${deltaColor}0D`,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, minWidth: 280, flex: 1 }}>
              {lapTimeDelta < 0
                ? <TrendingDown size={18} style={{ color: deltaColor, marginTop: 2 }} />
                : <TrendingUp size={18} style={{ color: deltaColor, marginTop: 2 }} />
              }
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Setup Impact Estimator</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                  Predicted lap-time impact vs Race Baseline
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-dim)', lineHeight: 1.5, maxWidth: 520 }}>
                  <span style={{ fontSize:10, letterSpacing:'0.1em', color:'var(--text-muted)', display:'block', marginBottom:2 }}>AI INTERPRETATION</span>
                  {interpretation}
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: 28, color: deltaColor }}>
                {lapTimeDelta >= 0 ? '+' : ''}{lapTimeDelta.toFixed(3)}s
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>per lap</div>
              <div style={{ display:'flex', gap:6, justifyContent:'flex-end', marginTop:6 }}>
                <span className="badge badge-blue">confidence {MODEL_CONFIDENCE}%</span>
                <span className="badge badge-yellow">risk {risk}</span>
              </div>
            </div>
          </div>

          {/* Contributors + complexity */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:12, alignItems:'center', marginTop:12, paddingTop:10, borderTop:`1px solid ${deltaColor}22` }}>
            <span style={{ fontSize:10, letterSpacing:'0.1em', color:'var(--text-muted)' }}>MAIN CONTRIBUTORS</span>
            {contributors.filter(c => Math.abs(c.impact) >= 0.001).map(c => (
              <span key={c.g} style={{ fontSize:11, fontFamily:'JetBrains Mono,monospace', color: c.impact < 0 ? 'var(--green)' : 'var(--accent)' }}>
                {c.g}: {c.impact >= 0 ? '+' : ''}{c.impact.toFixed(3)}s
              </span>
            ))}
            <span style={{ marginLeft:'auto', fontSize:11, color:'var(--yellow)', display:'flex', alignItems:'center', gap:5 }}>
              <AlertTriangle size={12} /> Complexity {changedCount}/{SETUP_PARAMS.length} · validate electronics → suspension → ride height → geometry
            </span>
          </div>
        </div>
      )}

      {/* ── Group deviation overview ────────────────────────────────────────── */}
      <div className="card mb-4">
        <div className="card-header">
          <span className="card-title">Parameter Deviation Map</span>
          <span style={{ fontSize:11, color:'var(--text-muted)' }}>Current setup vs Race Baseline</span>
        </div>
        <div className="card-body" style={{ flexDirection:'column', paddingTop:8 }}>
          <GroupDeviationGrid values={values} />
        </div>
      </div>

      <div className="grid-2-1">

        {/* ── Setup parameters ──────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {groups.map(group => {
            const groupParams = SETUP_PARAMS.filter(p => p.group === group);
            const groupChanged = groupParams.filter(p => Math.abs(values[p.name] - p.baseline) >= 0.01).length;
            const groupImpact = groupParams.reduce((acc, p) => {
              const diff = values[p.name] - p.baseline;
              return acc + diff * p.lapTimeImpactPerUnit;
            }, 0);
            const isSusp = group === 'Suspension';
            return (
              <div className="card" key={group}>
                <div className="card-header">
                  <span className="card-title">{group}</span>
                  <div className="flex items-center gap-2">
                    {groupChanged > 0 && (
                      <>
                        <span className="badge badge-yellow">{groupChanged} changed</span>
                        <span style={{
                          fontFamily: 'JetBrains Mono,monospace', fontSize: 12, fontWeight: 700,
                          color: groupImpact < 0 ? 'var(--green)' : 'var(--accent)',
                        }}>
                          {groupImpact >= 0 ? '+' : ''}{groupImpact.toFixed(3)}s
                        </span>
                      </>
                    )}
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {groupParams.length} params
                    </span>
                  </div>
                </div>
                <div>
                  {isSusp ? (
                    ['Front', 'Rear'].map(side => (
                      <div key={side}>
                        <div style={{ fontSize:9, letterSpacing:'0.12em', color:'var(--text-muted)', fontFamily:'JetBrains Mono,monospace', padding:'6px 16px 2px' }}>{side.toUpperCase()}</div>
                        {groupParams.filter(p => p.name.startsWith(side)).map(p => (
                          <SetupSlider key={p.name} param={p} value={values[p.name]} onChange={handleChange} />
                        ))}
                      </div>
                    ))
                  ) : (
                    groupParams.map(p => (
                      <SetupSlider key={p.name} param={p} value={values[p.name]} onChange={handleChange} />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Sidebar ───────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Radar chart: current vs baseline */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Setup Profile</span>
              <span style={{ fontSize:10, color:'var(--text-muted)' }}>scale 0–100 · est. from setup + telemetry</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 16px' }}>
              <RadarChart values={values} baseline={baseline} />
              <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 10, color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 12, height: 3, background: 'var(--accent)', display: 'inline-block', borderRadius: 2 }} />
                  Current
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 12, height: 3, background: 'rgba(59,130,246,0.6)', display: 'inline-block', borderRadius: 2 }} />
                  Baseline
                </span>
              </div>
            </div>
          </div>

          {/* Changed parameters summary */}
          {changedCount > 0 && (
            <div className="card" style={{ borderColor: 'rgba(245,158,11,0.3)' }}>
              <div className="card-header">
                <span className="card-title" style={{ color: 'var(--yellow)' }}>Modified Parameters</span>
                <span className="badge badge-yellow">{changedCount}</span>
              </div>
              <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                {[...changedParams]
                  .sort((a, b) => Math.abs((values[b.name] - b.baseline) * b.lapTimeImpactPerUnit) - Math.abs((values[a.name] - a.baseline) * a.lapTimeImpactPerUnit))
                  .map(p => {
                    const diff = values[p.name] - p.baseline;
                    const impact = diff * p.lapTimeImpactPerUnit;
                    return (
                      <div key={p.name} style={{
                        padding: '7px 16px',
                        borderBottom: '1px solid var(--border)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}>
                        <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{p.name}</span>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 12, fontFamily: 'JetBrains Mono,monospace', color: 'var(--yellow)' }}>
                            {values[p.name].toFixed(1)} {p.unit} ({diff > 0 ? '+' : ''}{diff.toFixed(1)})
                          </div>
                          <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono,monospace', color: impact < 0 ? 'var(--green)' : 'var(--accent)' }}>
                            {impact >= 0 ? '+' : ''}{impact.toFixed(3)}s · {impact < 0 ? 'gain' : 'penalty'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Saved confirmation */}
          {changedCount === 0 && savedAt && (
            <div className="card" style={{ borderColor: 'rgba(34,197,94,0.3)' }}>
              <div className="card-body" style={{ gap: 10, alignItems: 'center' }}>
                <CheckCircle size={16} style={{ color: 'var(--green)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)' }}>Setup at baseline</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Last saved {savedAt}</div>
                </div>
              </div>
            </div>
          )}

          {/* Session comparison chart */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Session Comparison</span>
              <span style={{ fontSize:11, color:'var(--text-muted)' }}>delta vs fastest</span>
            </div>
            <div className="card-body" style={{ flexDirection:'column' }}>
              <SessionComparisonChart />
            </div>
          </div>

          {/* Top-impact parameters */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Top Gain Opportunities</span>
              <span className="badge badge-green">Δ vs Optimal</span>
            </div>
            <div className="card-body" style={{ flexDirection:'column' }}>
              <TopImpactParams values={values} />
            </div>
          </div>

          {/* Variants */}
          <div className="card">
            <div className="card-header"><span className="card-title">Setup Variants</span></div>
            <table className="data-table">
              <thead>
                <tr><th>Variant</th><th>Sess.</th><th>Best Lap</th><th></th></tr>
              </thead>
              <tbody>
                {SETUP_VARIANTS.map(v => {
                  const isActive = v.status === 'Active';
                  return (
                    <tr key={v.name} style={isActive ? { background: 'var(--accent-dim)' } : {}}>
                      <td>
                        <div style={{ fontWeight: isActive ? 700 : 400, fontSize: 12 }}>{v.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{v.status} · {v.cond}</div>
                      </td>
                      <td className="mono" style={{ fontSize: 11, color: 'var(--text-dim)' }}>{v.session}</td>
                      <td className="mono" style={{ color: isActive ? 'var(--accent)' : 'var(--text)', fontSize: 12 }}>
                        {v.lapTime}
                      </td>
                      <td style={{ textAlign:'right' }}>
                        <button className="btn btn-ghost btn-sm" style={{ fontSize:10, padding:'2px 8px' }}
                          onClick={() => toast({
                            type: isActive ? 'info' : 'success',
                            title: isActive ? `${v.name} is active` : `Compare · ${v.name}`,
                            message: isActive ? 'This is your current setup.' : `Overlaying ${v.name} (${v.cond}) vs current Q3 setup.`,
                          })}>
                          {isActive ? 'Active' : 'Compare'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Rider feedback ↔ telemetry correlation */}
          <div className="card">
            <div className="card-header">
              <span className="card-title flex items-center gap-2"><MessageSquare size={13} style={{ color:'var(--blue)' }} /> Rider Feedback</span>
              <span className="badge badge-blue">7/10 confidence</span>
            </div>
            <div className="card-body" style={{ flexDirection:'column', gap:7 }}>
              {RIDER_FEEDBACK.map(f => (
                <div key={f.label} style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
                  <span style={{ color:'var(--text-muted)' }}>{f.label}</span>
                  <span style={{ color:f.tone, fontWeight:600 }}>{f.value}</span>
                </div>
              ))}
              <div style={{ marginTop:4, padding:'8px 10px', borderRadius:6, background:'rgba(59,130,246,0.08)', border:'1px solid rgba(59,130,246,0.2)', fontSize:11.5, color:'var(--text-dim)', lineHeight:1.5 }}>
                <span style={{ fontSize:10, letterSpacing:'0.1em', color:'var(--blue)', display:'block', marginBottom:2 }}>AI CORRELATION</span>
                Rider reports rear movement at T7/T9. Telemetry confirms rear slip increase after 70% throttle — supports the TC2 trial.
              </div>
            </div>
          </div>

          {/* Change history */}
          <div className="card">
            <div className="card-header">
              <span className="card-title flex items-center gap-2"><History size={13} style={{ color:'var(--text-muted)' }} /> Change History</span>
            </div>
            <div style={{ padding:'4px 0' }}>
              {CHANGE_HISTORY.map((h, i) => (
                <div key={i} style={{ display:'flex', gap:10, padding:'5px 16px', fontSize:11.5, alignItems:'baseline' }}>
                  <span className="mono" style={{ color:'var(--text-muted)', fontSize:10.5, flexShrink:0 }}>{h.t}</span>
                  <span style={{ color:'var(--text-dim)' }}>{h.e}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI insights */}
          <div className="card">
            <div className="card-header">
              <span className="card-title" style={{ color: 'var(--accent)' }}>AI Setup Insights</span>
              <span className="badge badge-blue">KDD Agent · {MODEL_CONFIDENCE}%</span>
            </div>
            <div className="card-body" style={{ flexDirection: 'column', gap: 12 }}>
              {[
                {
                  title: 'TC Reduction Opportunity',
                  color: 'var(--yellow)',
                  text: `TC ${values['Traction Control']?.toFixed(0) ?? '3'} → TC 2 predicted gain: −0.023s/lap. Rear temperature supports lower TC, but monitor rear slip at T7–T9. Risk: Medium.`,
                },
                {
                  title: 'Engine Map Optimization',
                  color: 'var(--green)',
                  text: `Map ${values['Engine Map']?.toFixed(0) ?? '6'} → Map 7 gives +0.12 km/h top speed at a cost of +0.08 kg/lap fuel. ${(values['Engine Map'] ?? 6) < 7 ? 'Recommended only if fuel margin stays above +0.4 laps.' : 'Already at upper map.'}`,
                },
                {
                  title: 'Geometry Delta Note',
                  color: 'var(--blue)',
                  text: `Rake angle ${values['Rake Angle']?.toFixed(1) ?? '23.7'}° (+${((values['Rake Angle'] ?? 23.7) - 23.2).toFixed(1)}° vs baseline). Stability improves under braking, but turn-in response may slow. Monitor front shoulder temp and T4/T5 entry.`,
                },
              ].map(ins => (
                <div key={ins.title} className="insight-panel" style={{ ['--dot-color' as string]: ins.color }}>
                  <div className="insight-panel__title" style={{ color: ins.color }}>{ins.title}</div>
                  <p className="insight-panel__body">{ins.text}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
