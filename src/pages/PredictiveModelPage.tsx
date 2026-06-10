import { useMemo, useState } from 'react';
import { TrendingDown, Sparkles, Check, X, AlertTriangle, Target, Shield, Zap, Brain, BarChart3, Info } from 'lucide-react';

/**
 * Predictive Improvement Model — turns analysis into a forward projection:
 * "if you do X at this Mugello corner, you gain Y". Select levers to build
 * a next-lap plan with transparent gain calculation, risk-aware scenarios
 * and Safety Guardian cross-check.
 *
 * Circuit: Mugello GP · 5.245 km · 15 turns · 1,141 m main straight
 * Class: KDD Prototype / AI Racing Simulation
 */

const CURRENT_S = 103.912; // 1:43.912
const OPTIMAL_S = 102.05;  // 1:42.050 theoretical best

const MODE_PRESETS = {
  'fastest-lap':  { selected: ['t15-open','t1-brake','t15-pickup','t12-square'], gain: 0.512, risk: 'High'       },
  'attack-p2':    { selected: ['t15-open','t1-brake','t12-square'],              gain: 0.363, risk: 'Medium'     },
  'defend-p4':    { selected: ['t1-brake','t12-square','t15-pickup'],            gain: 0.311, risk: 'Low-Medium' },
  'race-safe':    { selected: ['t1-brake','t12-square','setup-tc'],              gain: 0.251, risk: 'Low'        },
  'tyre-saving':  { selected: ['setup-tc','t12-square'],                         gain: 0.118, risk: 'Very Low'   },
} as const;

type ModeId = keyof typeof MODE_PRESETS;

const MODE_LABELS: Record<ModeId, string> = {
  'fastest-lap': 'Fastest Lap',
  'attack-p2':   'Attack P2',
  'defend-p4':   'Defend P4',
  'race-safe':   'Race Safe',
  'tyre-saving': 'Tyre Saving',
};

const MODE_ICONS: Record<ModeId, typeof Zap> = {
  'fastest-lap': Zap,
  'attack-p2':   Target,
  'defend-p4':   Shield,
  'race-safe':   Shield,
  'tyre-saving': BarChart3,
};

/* ── Lever model ─────────────────────────────────────── */

interface Lever {
  id: string;
  action: string;
  corner: string;        // display name
  gain: number;          // seconds saved (negative)
  difficulty: 'easy' | 'medium' | 'hard';
  risk: 'low' | 'low-medium' | 'medium' | 'medium-high' | 'high';
  confidence: number;    // 0–1
  reason: string;
  whyNotSelected?: string;
}

const ALL_LEVERS: Lever[] = [
  {
    id: 't15-open',
    action: 'Open throttle 0.3s earlier with lower lean',
    corner: 'T15 Bucine',
    gain: 0.284,
    difficulty: 'medium',
    risk: 'medium-high',
    confidence: 0.88,
    reason: 'Late throttle pickup while still above 55° lean reduces drive onto the main straight.',
  },
  {
    id: 't1-brake',
    action: 'Brake 9 m earlier and release more progressively',
    corner: 'T1 San Donato',
    gain: 0.216,
    difficulty: 'medium',
    risk: 'medium',
    confidence: 0.82,
    reason: 'Current braking point forces late release and reduces apex stability.',
  },
  {
    id: 't12-square',
    action: 'Square the corner for a cleaner exit',
    corner: 'T12 Correntaio',
    gain: 0.142,
    difficulty: 'easy',
    risk: 'low-medium',
    confidence: 0.79,
    reason: 'Cleaner rotation reduces throttle delay and improves exit speed onto the straight.',
  },
  {
    id: 't15-pickup',
    action: 'Pick the bike up sooner onto the straight',
    corner: 'T15 Bucine',
    gain: 0.131,
    difficulty: 'easy',
    risk: 'medium',
    confidence: 0.80,
    reason: 'Earlier upright transition at T15 exit improves drive onto the main straight.',
    whyNotSelected: 'Overlaps with earlier throttle change at Bucine. Combined benefit would be lower than independent gain.',
  },
  {
    id: 'setup-tc',
    action: 'Raise traction control +1 to stop slow-corner slip',
    corner: 'Setup · Sector 3',
    gain: 0.090,
    difficulty: 'easy',
    risk: 'low',
    confidence: 0.74,
    reason: 'TC intervention in S3 reduces rear slip exiting slow corners like Correntaio.',
    whyNotSelected: 'Safer but slower than rider-input correction. Use if rear slip persists for two consecutive laps.',
  },
  {
    id: 't8-lean',
    action: 'Use less lean, 57° → 54°, with smoother steering',
    corner: 'T8/T9 Arrabbiata',
    gain: 0.074,
    difficulty: 'hard',
    risk: 'medium-high',
    confidence: 0.66,
    reason: 'High-speed section. Lower lean reduces edge grip demand but costs lap time.',
    whyNotSelected: 'High-speed left-right complex. Lower confidence and greater execution risk at current tyre temperature.',
  },
];

/* ── Helpers ─────────────────────────────────────────── */

const fmt = (s: number) => {
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toFixed(3).padStart(6, '0')}`;
};

const diffColor = (d: Lever['difficulty']) =>
  d === 'easy' ? 'var(--green)' : d === 'medium' ? 'var(--yellow)' : 'var(--accent)';

const riskColor = (r: Lever['risk']) => {
  const map: Record<string, string> = {
    'low': 'var(--green)', 'low-medium': '#a3e635', 'medium': 'var(--yellow)',
    'medium-high': 'var(--accent)', 'high': 'var(--red)',
  };
  return map[r] || 'var(--text-muted)';
};

/** Interaction penalty: overlap between selected levers reduces combined benefit. */
function interactionPenalty(rawGain: number, count: number): number {
  if (count <= 1) return 0;
  if (count === 2) return rawGain * 0.30;
  if (count === 3) return rawGain * 0.435;
  return rawGain * 0.55; // 4+
}

/* ── Component ───────────────────────────────────────── */

export function PredictiveModelPage() {
  const [mode, setMode] = useState<ModeId>('attack-p2');
  const [picked, setPicked] = useState<Set<string>>(new Set(MODE_PRESETS['attack-p2'].selected));
  const [showCalc, setShowCalc] = useState(false);

  const selected = useMemo(() => ALL_LEVERS.filter(l => picked.has(l.id)), [picked]);
  const unselected = useMemo(() => ALL_LEVERS.filter(l => !picked.has(l.id)), [picked]);

  const { rawGain, penalty, realisticGain, projected, pctToOptimal, modelConfidence } = useMemo(() => {
    const raw = selected.reduce((a, l) => a + l.gain, 0);
    const pen = interactionPenalty(raw, selected.length);
    const real = raw - pen;
    const proj = Math.max(OPTIMAL_S, CURRENT_S - real);
    const pct = Math.min(100, (real / (CURRENT_S - OPTIMAL_S)) * 100);

    // Model confidence = weighted average of lever confidences with a small mode penalty
    const base = selected.length
      ? selected.reduce((a, l) => a + l.confidence, 0) / selected.length
      : 0.5;
    const adj = Math.round(Math.min(0.95, base * (1 - selected.length * 0.025)) * 100);
    return { rawGain: raw, penalty: pen, realisticGain: real, projected: proj, pctToOptimal: pct, modelConfidence: adj };
  }, [selected]);

  /* Switch mode → reset selection */
  const applyMode = (m: ModeId) => {
    setMode(m);
    setPicked(new Set(MODE_PRESETS[m].selected));
  };

  const toggle = (id: string) => {
    setPicked(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const resetToMode = () => setPicked(new Set(MODE_PRESETS[mode].selected));

  return (
    <div className="page">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="page-title">Predictive Improvement Model</h1>
          <p className="page-subtitle">Mugello · Lap Time Optimizer AI · select your next-lap improvement plan</p>
        </div>
        <span className="badge badge-blue"><Sparkles size={11} style={{ verticalAlign: -1, marginRight: 4 }} />KDD Prototype</span>
      </div>

      {/* ── Circuit validation ── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        <span className="badge badge-green" style={{ fontSize: 10 }}>Mugello GP · 5.245 km · 15 turns · 3D elevation active</span>
        <span className="badge" style={{ fontSize: 10, background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>AI Racing Simulation</span>
      </div>

      {/* ── Optimization mode selector ── */}
      <div className="card mb-4">
        <div className="card-header">
          <span className="card-title">Optimization mode</span>
          <span className="badge badge-blue" style={{ fontSize: 10 }}>{MODE_LABELS[mode]}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
          {(Object.keys(MODE_PRESETS) as ModeId[]).map(m => {
            const Icon = MODE_ICONS[m];
            const active = m === mode;
            return (
              <button key={m} onClick={() => applyMode(m)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20,
                  fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)', cursor: 'pointer',
                  border: `1px solid ${active ? 'var(--blue)' : 'var(--border)'}`,
                  background: active ? 'rgba(59,130,246,0.15)' : 'transparent',
                  color: active ? 'var(--blue)' : 'var(--text-dim)',
                  transition: 'all 0.15s',
                }}
              >
                <Icon size={12} />
                {MODE_LABELS[m]}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Model Projection ── */}
      <div className="card mb-4" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.10), rgba(34,197,94,0.06))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap' }}>
          {/* Current */}
          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.12em', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>CURRENT BEST</div>
            <div style={{ fontSize: 30, fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>{fmt(CURRENT_S)}</div>
          </div>
          <TrendingDown size={26} style={{ color: 'var(--green)' }} />
          {/* Projected */}
          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.12em', color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>PROJECTED</div>
            <div style={{ fontSize: 38, fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--green)' }}>{fmt(projected)}</div>
          </div>
          {/* Gain */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--green)', lineHeight: 1 }}>
              −{realisticGain.toFixed(3)}<span style={{ fontSize: 16 }}>s</span>
            </div>
            <div style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              FROM {picked.size} CHANGES
            </div>
          </div>
          {/* Theoretical progress bar */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>
              <span>current</span><span>theoretical best {fmt(OPTIMAL_S)}</span>
            </div>
            <div style={{ height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.07)' }}>
              <div style={{ width: `${pctToOptimal}%`, height: '100%', borderRadius: 5, background: 'linear-gradient(90deg, var(--blue), var(--green))', transition: 'width 0.3s' }} />
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
              {pctToOptimal.toFixed(0)}% progress to theoretical best
            </div>
          </div>
        </div>

        {/* ── Gain calculation breakdown ── */}
        <div style={{ marginTop: 14, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          <button onClick={() => setShowCalc(v => !v)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Info size={12} />{showCalc ? 'Hide' : 'Show'} gain calculation
          </button>
          {showCalc && (
            <div style={{ marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: 360 }}>
                <span style={{ color: 'var(--text-muted)' }}>Raw selected gain</span>
                <span style={{ color: 'var(--green)', fontWeight: 700 }}>−{rawGain.toFixed(3)}s</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: 360 }}>
                <span style={{ color: 'var(--text-muted)' }}>Interaction penalty ×{picked.size} levers</span>
                <span style={{ color: 'var(--accent)', fontWeight: 700 }}>+{penalty.toFixed(3)}s</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: 360, borderTop: '1px solid var(--border)', paddingTop: 4 }}>
                <span style={{ color: 'var(--green)', fontWeight: 700 }}>Realistic combined gain</span>
                <span style={{ color: 'var(--green)', fontWeight: 900 }}>−{realisticGain.toFixed(3)}s</span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                Gains are modelled independently. Overlapping changes (same corner, same phase) share benefit.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Model confidence row ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div className="card" style={{ flex: 1, minWidth: 160 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>MODEL CONFIDENCE</div>
          <div style={{ fontSize: 28, fontWeight: 900, fontFamily: 'var(--font-mono)', color: modelConfidence >= 75 ? 'var(--green)' : modelConfidence >= 60 ? 'var(--yellow)' : 'var(--accent)' }}>
            {modelConfidence}%
          </div>
          <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.07)', marginTop: 4 }}>
            <div style={{ width: `${modelConfidence}%`, height: '100%', borderRadius: 2, background: modelConfidence >= 75 ? 'var(--green)' : modelConfidence >= 60 ? 'var(--yellow)' : 'var(--accent)' }} />
          </div>
        </div>
        <div className="card" style={{ flex: 2, minWidth: 280 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>DATA INPUTS</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
            {[
              ['Telemetry', 'OK'],
              ['GPS', 'OK'],
              ['Tyre model', 'OK'],
              ['Rider consistency', '86%'],
              ['Rear grip', 'estimated'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                <span style={{ color: v === 'OK' ? 'var(--green)' : 'var(--yellow)' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Improvement levers ── */}
      <div className="card mb-4">
        <div className="card-header">
          <span className="card-title">Improvement levers</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="badge badge-green">{picked.size} selected</span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>/ {ALL_LEVERS.length} available</span>
            <button onClick={resetToMode}
              style={{
                marginLeft: 8, padding: '3px 8px', borderRadius: 4, fontSize: 10,
                fontFamily: 'var(--font-mono)', cursor: 'pointer',
                background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
                color: 'var(--text-muted)',
              }}
            >reset to {MODE_LABELS[mode]}</button>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
          {/* Selected first */}
          {selected.map(l => <LeverCard key={l.id} lever={l} picked onToggle={toggle} />)}
          {/* Unselected */}
          {unselected.map(l => <LeverCard key={l.id} lever={l} picked={false} onToggle={toggle} />)}
        </div>
      </div>

      {/* ── Opportunity Map ── */}
      <div className="card mb-4">
        <div className="card-header">
          <span className="card-title">Opportunity Map · Mugello</span>
          <span className="badge badge-blue">real circuit geometry</span>
        </div>
        <div style={{ marginTop: 6 }}>
          {/* Mini circuit bar showing highest-gain corners */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
            {[...ALL_LEVERS].sort((a, b) => b.gain - a.gain).slice(0, 5).map(l => {
              const pct = (l.gain / ALL_LEVERS[0].gain) * 100;
              return (
                <div key={l.id} style={{
                  flex: 1, minWidth: 120, padding: '8px 10px', borderRadius: 6,
                  background: picked.has(l.id) ? 'var(--green-dim)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${picked.has(l.id) ? 'color-mix(in srgb, var(--green) 35%, transparent)' : 'var(--border)'}`,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{l.corner}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.07)' }}>
                      <div style={{ width: `${pct}%`, height: '100%', borderRadius: 2, background: picked.has(l.id) ? 'var(--green)' : 'var(--blue)' }} />
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--green)' }}>−{l.gain.toFixed(3)}s</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 10, fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            <span>Gain ·</span><span style={{ color: 'var(--green)' }}>● selected</span>
            <span style={{ color: 'var(--blue)' }}>● available</span>
          </div>
        </div>
      </div>

      {/* Two-column layout for plan + safety */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
        {/* ── Plan Summary ── */}
        <div className="card" style={{ flex: 1.4, minWidth: 280 }}>
          <div className="card-header"><span className="card-title">Plan Summary</span></div>
          <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              ['Selected plan', `${picked.size} changes`],
              ['Focus', selected.length > 0 ? cornerExitFocus(selected) : '—'],
              ['Expected gain', `−${realisticGain.toFixed(3)}s`],
              ['Risk impact', `+${(picked.size * 3).toFixed(0)} points`],
              ['Safety mode', picked.size <= 2 ? 'Not required' : 'Recommended (rear tyre protection)'],
              ['Recommended execution', selected.length <= 2 ? 'Next lap' : 'Next 2 laps'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                <span style={{ fontWeight: 600, color: k === 'Expected gain' ? 'var(--green)' : 'var(--text-dim)' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Safety Guardian Note ── */}
        <div className="card" style={{ flex: 1, minWidth: 240, borderLeft: '3px solid var(--accent)' }}>
          <div className="card-header">
            <span className="card-title"><Brain size={14} style={{ verticalAlign: -2, marginRight: 4 }} />Safety Guardian</span>
          </div>
          <div style={{ marginTop: 6, fontSize: 12, lineHeight: 1.6 }}>
            <p style={{ color: 'var(--text-dim)' }}>
              Do not combine earlier throttle at <strong>T15 Bucine</strong> with TC reduction while rear tyre remains above <strong>118°C</strong>.
            </p>
            <div style={{ marginTop: 8, padding: '6px 8px', borderRadius: 4, background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.15)' }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                <AlertTriangle size={12} style={{ color: 'var(--yellow)', marginTop: 2, flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 11 }}>Risk +6 points</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                    Aggressive throttle at Bucine &amp; Arrabbiata lean reduction share rear-grip risk. Execute separately or increase TC by +1 in S3.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Rider Coach Plan ── */}
      <div className="card mb-4">
        <div className="card-header"><span className="card-title">Rider Coach Plan</span></div>
        <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {selected.slice(0, 3).map((l, i) => (
            <div key={l.id} style={{
              display: 'flex', gap: 10, padding: '8px 10px', borderRadius: 6,
              background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
            }}>
              <span style={{
                width: 20, height: 20, borderRadius: '50%', display: 'grid', placeItems: 'center',
                background: 'var(--blue)', color: '#0B0D12', fontFamily: 'var(--font-mono)',
                fontSize: 10, fontWeight: 800, flexShrink: 0,
              }}>{i + 1}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{l.corner}</div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{l.action}</div>
              </div>
            </div>
          ))}
          {selected.length === 0 && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Select at least one improvement lever.</div>}
        </div>
      </div>

      {/* ── Alternative Plans ── */}
      <div className="card mb-4">
        <div className="card-header">
          <span className="card-title">Alternative Plans</span>
          <span className="badge badge-blue">scenario comparison</span>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
          {(Object.keys(MODE_PRESETS) as ModeId[]).filter(m => m !== mode).map(m => {
            const p = MODE_PRESETS[m];
            return (
              <button key={m} onClick={() => applyMode(m)}
                style={{
                  flex: 1, minWidth: 140, padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                  textAlign: 'left', border: '1px solid var(--border)',
                  background: 'rgba(255,255,255,0.02)', transition: 'background 0.15s',
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{MODE_LABELS[m]}</div>
                <div style={{ fontSize: 13, fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--green)', marginTop: 2 }}>−{p.gain.toFixed(3)}s</div>
                <div style={{ fontSize: 10, color: riskColorFromStr(p.risk), fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                  Risk {p.risk}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Model Integrity ── */}
      <div className="card">
        <div className="card-header"><span className="card-title">Model Integrity</span></div>
        <div style={{ marginTop: 6, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: 11, fontFamily: 'var(--font-mono)', maxWidth: 400 }}>
          {[
            ['Circuit selected', 'Mugello GP'],
            ['Loaded optimizer', 'Mugello'],
            ['Corner set', '15 / 15 Mugello corners'],
            ['Warnings', 'None'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.02)' }}>
              <span style={{ color: 'var(--text-muted)' }}>{k}</span>
              <span style={{ fontWeight: 600, color: v === 'None' || v === 'OK' ? 'var(--green)' : 'var(--text-dim)' }}>{v}</span>
            </div>
          ))}
        </div>
        {false && ( // hidden — circuits match, no error
          <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 6, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <AlertTriangle size={14} style={{ color: 'var(--red)', flexShrink: 0 }} />
              <div style={{ fontSize: 11 }}>
                <strong>MODEL ERROR:</strong> Race circuit is Mugello, but improvement model loaded Jarama. Reload Mugello optimizer.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────── */

function LeverCard({ lever, picked, onToggle }: { lever: Lever; picked: boolean; onToggle: (id: string) => void }) {
  return (
    <div>
      <button
        onClick={() => onToggle(lever.id)}
        style={{
          display: 'flex', alignItems: 'flex-start', gap: 12, textAlign: 'left', width: '100%',
          padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
          border: `1px solid ${picked ? 'color-mix(in srgb, var(--green) 45%, transparent)' : 'var(--border)'}`,
          background: picked ? 'var(--green-dim)' : 'transparent',
          transition: 'background 0.15s, border-color 0.15s',
        }}
      >
        {/* Checkbox */}
        <span style={{
          width: 20, height: 20, borderRadius: 5, flex: 'none', display: 'grid', placeItems: 'center',
          marginTop: 1,
          background: picked ? 'var(--green)' : 'rgba(255,255,255,0.06)',
          color: '#0B0D12',
        }}>
          {picked ? <Check size={13} /> : <X size={11} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />}
        </span>
        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{lever.action}</div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginTop: 1 }}>
            {lever.corner}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.5 }}>
            {lever.reason}
          </div>
          {/* Tags row */}
          <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            <span style={tagStyle(diffColor(lever.difficulty))}>{lever.difficulty}</span>
            <span style={tagStyle(riskColor(lever.risk))}>{lever.risk}</span>
            <span style={tagStyle('var(--blue)')}>{(lever.confidence * 100).toFixed(0)}% conf</span>
          </div>
          {/* Why not selected */}
          {!picked && lever.whyNotSelected && (
            <div style={{
              marginTop: 6, padding: '5px 7px', borderRadius: 4,
              background: 'rgba(250,204,21,0.06)', border: '1px solid rgba(250,204,21,0.1)',
              fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.5,
            }}>
              <strong style={{ color: 'var(--yellow)' }}>Why not selected:</strong> {lever.whyNotSelected}
            </div>
          )}
        </div>
        {/* Gain badge */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 800, color: 'var(--green)' }}>
            −{lever.gain.toFixed(3)}<span style={{ fontSize: 10 }}>s</span>
          </div>
        </div>
      </button>
    </div>
  );
}

const tagStyle = (color: string) => ({
  display: 'inline-block',
  fontFamily: 'var(--font-mono)' as const,
  fontSize: 9,
  fontWeight: 700,
  textTransform: 'uppercase' as const,
  padding: '2px 6px',
  borderRadius: 4,
  color,
  background: `color-mix(in srgb, ${color} 14%, transparent)`,
  letterSpacing: '0.04em',
});

/* ── Helpers ─────────────────────────────────────────── */

function cornerExitFocus(levers: Lever[]): string {
  const exits = levers.filter(l => l.action.toLowerCase().includes('throttle') || l.action.toLowerCase().includes('exit'));
  const braking = levers.filter(l => l.action.toLowerCase().includes('brake'));
  const parts: string[] = [];
  if (exits.length >= 1) parts.push('Corner exits');
  if (braking.length >= 1) parts.push('Braking stability');
  if (parts.length === 0) parts.push('Mixed');
  return parts.join(' + ');
}

function riskColorFromStr(risk: string): string {
  const map: Record<string, string> = {
    'High': 'var(--red)', 'Medium': 'var(--yellow)', 'Low': 'var(--green)',
    'Very Low': 'var(--green)', 'Low-Medium': '#a3e635',
  };
  return map[risk] || 'var(--text-muted)';
}
