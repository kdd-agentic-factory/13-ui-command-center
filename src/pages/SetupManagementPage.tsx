/**
 * SetupManagementPage — Expert setup engineering console.
 *
 * Expert additions:
 *   • Setup impact estimator — predicted lap time delta from parameter changes
 *   • Radar chart — current setup vs baseline across 6 performance axes
 *   • Group deviation bars — visual %-change summary per group at a glance
 *   • Setup comparison table — current vs FP3 baseline side-by-side delta
 *   • AI insights that reference live parameter changes
 */
import { useState, useCallback, useMemo } from 'react';
import { Save, RotateCcw, CheckCircle, TrendingDown, TrendingUp } from 'lucide-react';
import { useToast } from '../components/ToastProvider';

// ── Setup parameter definitions ────────────────────────────────────────────────

interface SetupParam {
  group: string;
  name: string;
  defaultValue: number;
  min: number; max: number;
  unit: string;
  baseline: number;
  lapTimeImpactPerUnit: number;  // seconds per unit change (signed: + = slower)
}

const SETUP_PARAMS: SetupParam[] = [
  // Suspension
  { group: 'Suspension', name: 'Front Spring Preload', defaultValue: 12.5, min: 8,    max: 18,   unit: 'mm',     baseline: 11.0, lapTimeImpactPerUnit: -0.008 },
  { group: 'Suspension', name: 'Front Compression',    defaultValue: 14,   min: 8,    max: 20,   unit: 'clicks', baseline: 12,   lapTimeImpactPerUnit: +0.006 },
  { group: 'Suspension', name: 'Front Rebound',        defaultValue: 16,   min: 8,    max: 22,   unit: 'clicks', baseline: 14,   lapTimeImpactPerUnit: +0.004 },
  { group: 'Suspension', name: 'Rear Preload',         defaultValue: 9.5,  min: 6,    max: 14,   unit: 'mm',     baseline: 8.5,  lapTimeImpactPerUnit: -0.006 },
  { group: 'Suspension', name: 'Rear Compression',     defaultValue: 18,   min: 10,   max: 25,   unit: 'clicks', baseline: 16,   lapTimeImpactPerUnit: +0.007 },
  { group: 'Suspension', name: 'Rear Rebound',         defaultValue: 20,   min: 12,   max: 28,   unit: 'clicks', baseline: 18,   lapTimeImpactPerUnit: +0.005 },
  // Aerodynamics
  { group: 'Aerodynamics', name: 'Front Downforce',    defaultValue: 4,    min: 1,    max: 9,    unit: 'level',  baseline: 3,    lapTimeImpactPerUnit: +0.020 },
  { group: 'Aerodynamics', name: 'Ride Height Front',  defaultValue: 110,  min: 90,   max: 130,  unit: 'mm',     baseline: 108,  lapTimeImpactPerUnit: -0.002 },
  { group: 'Aerodynamics', name: 'Ride Height Rear',   defaultValue: 130,  min: 110,  max: 150,  unit: 'mm',     baseline: 128,  lapTimeImpactPerUnit: -0.001 },
  { group: 'Aerodynamics', name: 'Rake Angle',         defaultValue: 1.2,  min: 0,    max: 3,    unit: '°',      baseline: 1.1,  lapTimeImpactPerUnit: -0.015 },
  // Electronics
  { group: 'Electronics', name: 'Traction Control',    defaultValue: 3,    min: 1,    max: 9,    unit: 'TC',     baseline: 4,    lapTimeImpactPerUnit: +0.018 },
  { group: 'Electronics', name: 'Engine Brake',        defaultValue: 4,    min: 1,    max: 9,    unit: 'EB',     baseline: 3,    lapTimeImpactPerUnit: +0.012 },
  { group: 'Electronics', name: 'Engine Map',          defaultValue: 6,    min: 1,    max: 9,    unit: 'MAP',    baseline: 5,    lapTimeImpactPerUnit: -0.022 },
  { group: 'Electronics', name: 'Wheelie Control',     defaultValue: 2,    min: 1,    max: 5,    unit: 'WC',     baseline: 2,    lapTimeImpactPerUnit: +0.008 },
  // Geometry
  { group: 'Geometry', name: 'Front Camber',           defaultValue: -0.4, min: -1.5, max: 0,    unit: '°',      baseline: -0.3, lapTimeImpactPerUnit: -0.030 },
  { group: 'Geometry', name: 'Rear Camber',            defaultValue: 0.0,  min: -0.5, max: 0.5,  unit: '°',      baseline: 0.0,  lapTimeImpactPerUnit: -0.010 },
  { group: 'Geometry', name: 'Steering Head Angle',    defaultValue: 23.5, min: 22,   max: 26,   unit: '°',      baseline: 23.2, lapTimeImpactPerUnit: +0.025 },
  { group: 'Geometry', name: 'Front Axle Offset',      defaultValue: 28,   min: 20,   max: 36,   unit: 'mm',     baseline: 26,   lapTimeImpactPerUnit: -0.004 },
];

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
  { name: 'Current Setup (Q3)',  session: 'Q3',  lapTime: '1:33.412', notes: 'Active'     },
  { name: 'Race Baseline',       session: 'FP3', lapTime: '1:33.847', notes: 'Reference'  },
  { name: 'Soft Front Option',   session: 'FP2', lapTime: '1:33.201', notes: 'Warm cond.' },
  { name: 'High Grip Mugello',   session: 'FP1', lapTime: '1:34.102', notes: 'Conservative' },
];

// ── Radar chart ───────────────────────────────────────────────────────────────

type RadarAxis = 'Stability' | 'Cornering' | 'Braking' | 'Top Speed' | 'Traction' | 'Aero';

const RADAR_AXES: RadarAxis[] = ['Stability', 'Cornering', 'Braking', 'Top Speed', 'Traction', 'Aero'];

function RadarChart({ values, baseline }: { values: Record<string, number>; baseline: Record<string, number> }) {
  // Normalize each axis 0–100 from parameter changes
  const axisScore = (axis: RadarAxis, vals: Record<string, number>): number => {
    const paramMap: Record<RadarAxis, string[]> = {
      Stability:  ['Front Spring Preload', 'Rear Preload', 'Rear Compression'],
      Cornering:  ['Front Camber', 'Steering Head Angle', 'Front Axle Offset'],
      Braking:    ['Front Compression', 'Front Rebound', 'Engine Brake'],
      'Top Speed': ['Front Downforce', 'Rake Angle', 'Engine Map'],
      Traction:   ['Traction Control', 'Rear Rebound', 'Rear Camber'],
      Aero:       ['Ride Height Front', 'Ride Height Rear', 'Rake Angle'],
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
        const labelR = R + 14;
        return (
          <text key={axis}
            x={CX + labelR * Math.cos(angle)}
            y={CY + labelR * Math.sin(angle) + 3}
            textAnchor="middle" fill="#6B7280" fontSize="8"
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
      <span className="setup-name" title={`Impact: ${impactStr}/lap`}>{param.name}</span>
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
        const isActive = v.notes === 'Active';
        const isFastest = delta < 0.001;
        return (
          <div key={v.name}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
              <span style={{ fontSize:11, fontWeight:isActive ? 700 : 400, color:isActive ? 'var(--accent)' : 'var(--text)' }}>
                {v.name.replace(/\s*\(.*\)/, '')}
                {isActive && <span className="badge badge-red" style={{ marginLeft:4, fontSize:8 }}>ACTIVE</span>}
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
            <span style={{ width:76, fontSize:9, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em', flexShrink:0 }}>
              {group.slice(0, 9)}
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
      <div style={{ fontSize:9, color:'var(--text-muted)', marginTop:2 }}>
        Cells: grey=baseline · amber=minor change · red=large change · hover for detail
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
                –{p.potentialGain.toFixed(3)}s
              </span>
            </div>
            <div className="bar-track" style={{ height:6, borderRadius:3 }}>
              <div style={{ width:`${(p.potentialGain / maxGain) * 100}%`, height:6, borderRadius:3, background:isBeneficial ? 'var(--blue)' : 'var(--green)' }} />
            </div>
          </div>
        );
      })}
      <div style={{ fontSize:9, color:'var(--text-muted)' }}>Max gain if each param is set to optimal value</div>
    </div>
  );
}

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

  // Calculate predicted lap time delta from all changed parameters
  const lapTimeDelta = useMemo(() => {
    return SETUP_PARAMS.reduce((acc, p) => {
      const diff = values[p.name] - p.baseline;
      return acc + diff * p.lapTimeImpactPerUnit;
    }, 0);
  }, [values]);

  const handleChange = useCallback((name: string, v: number) => {
    setValues(prev => ({ ...prev, [name]: v }));
  }, []);

  function handleSave() {
    const ts = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
      localStorage.setItem(`${STORAGE_KEY}-ts`, ts);
      setSavedAt(ts);
    } catch { /* quota exceeded */ }
    toast({
      type: 'success', title: 'Setup saved',
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
    toast({ type: 'info', title: 'Reset to baseline', message: 'All 18 parameters restored to race baseline values.' });
  }

  const deltaColor = lapTimeDelta < -0.05 ? 'var(--green)' : lapTimeDelta > 0.05 ? 'var(--accent)' : 'var(--yellow)';
  const baseline = baselineValues();

  return (
    <div className="page">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Setup Management</h1>
          <p className="page-subtitle">Live parameter control · Impact prediction · Variant management</p>
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
          <button className="btn btn-primary btn-sm flex items-center gap-2" onClick={handleSave}>
            <Save size={14} />
            {savedAt ? 'Update' : 'Save Variant'}
          </button>
        </div>
      </div>

      {/* ── Lap time impact banner ─────────────────────────────────────────── */}
      {changedCount > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 20px', marginBottom: 16, borderRadius: 10,
          border: `1px solid ${deltaColor}44`,
          background: `${deltaColor}0D`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {lapTimeDelta < 0
              ? <TrendingDown size={18} style={{ color: deltaColor }} />
              : <TrendingUp size={18} style={{ color: deltaColor }} />
            }
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Setup Impact Estimator</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Predicted lap time change from {changedCount} parameter{changedCount !== 1 ? 's' : ''} vs baseline
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: 28, color: deltaColor }}>
              {lapTimeDelta >= 0 ? '+' : ''}{lapTimeDelta.toFixed(3)}s
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>per lap · model confidence: 68%</div>
          </div>
        </div>
      )}

      {/* ── Group deviation overview ────────────────────────────────────────── */}
      <div className="card mb-4">
        <div className="card-header">
          <span className="card-title">Parameter Deviation Map — All Groups</span>
          <span style={{ fontSize:11, color:'var(--text-muted)' }}>Current vs Race Baseline</span>
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
                  {groupParams.map(p => (
                    <SetupSlider key={p.name} param={p} value={values[p.name]} onChange={handleChange} />
                  ))}
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
              <span className="card-title">Setup Profile Radar</span>
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
              <div style={{ maxHeight: 180, overflowY: 'auto' }}>
                {changedParams.map(p => {
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
                          {impact >= 0 ? '+' : ''}{impact.toFixed(3)}s
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
              <span style={{ fontSize:11, color:'var(--text-muted)' }}>Lap time · delta</span>
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
                <tr><th>Name</th><th>Sess.</th><th>Lap Time</th></tr>
              </thead>
              <tbody>
                {SETUP_VARIANTS.map(v => (
                  <tr key={v.name} style={v.notes === 'Active' ? { background: 'var(--accent-dim)' } : {}}>
                    <td>
                      <div style={{ fontWeight: v.notes === 'Active' ? 700 : 400, fontSize: 12 }}>{v.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{v.notes}</div>
                    </td>
                    <td className="mono" style={{ fontSize: 11, color: 'var(--text-dim)' }}>{v.session}</td>
                    <td className="mono" style={{ color: v.notes === 'Active' ? 'var(--accent)' : 'var(--text)', fontSize: 12 }}>
                      {v.lapTime}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* AI insights */}
          <div className="card">
            <div className="card-header">
              <span className="card-title" style={{ color: 'var(--accent)' }}>AI Setup Insight</span>
              <span className="badge badge-blue">KDD Agent</span>
            </div>
            <div className="card-body" style={{ flexDirection: 'column', gap: 12 }}>
              {[
                {
                  title: 'TC Reduction Opportunity',
                  color: 'var(--yellow)',
                  text: `TC ${values['Traction Control']?.toFixed(0) ?? '3'} → TC2 predicted +0.023s/lap gain. Current rear temp supports lower TC. Monitor exit of T7–T9.`,
                },
                {
                  title: 'Engine Map Optimization',
                  color: 'var(--green)',
                  text: `Map ${values['Engine Map']?.toFixed(0) ?? '6'} current. Map 7 gives +0.12 km/h top speed at cost of +0.08 kg/lap fuel. ${(values['Engine Map'] ?? 6) < 7 ? 'Upgrade recommended.' : 'Already optimal.'}`,
                },
                {
                  title: 'Geometry Delta Note',
                  color: 'var(--blue)',
                  text: `Front camber ${values['Front Camber']?.toFixed(1) ?? '-0.4'}° vs baseline ${-0.3}°. Slight increase in front load. Observe tyre degradation inner edge.`,
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
