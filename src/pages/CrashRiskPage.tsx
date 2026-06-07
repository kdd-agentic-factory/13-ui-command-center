import { ShieldAlert, AlertTriangle, ShieldCheck, Activity, ChevronRight } from 'lucide-react';

/**
 * Crash-Risk Index (engineer Phase 3 #4) — a safety-first read on how close the
 * rider is to the edge: an overall index, the contributing factors, the riskiest
 * corners with their dominant cause, recent near-misses, and the Safety Guardian
 * AI call. Risk is always communicated with colour + an explicit label (WCAG).
 */

const RISK_SCORE = 58; // 0–100
const level = RISK_SCORE < 34 ? 'LOW' : RISK_SCORE < 67 ? 'MEDIUM' : 'HIGH';
const levelColor = level === 'LOW' ? 'var(--green)' : level === 'MEDIUM' ? 'var(--yellow)' : 'var(--accent)';

interface Factor { label: string; value: number; level: 'low' | 'med' | 'high'; note: string; }
const FACTORS: Factor[] = [
  { label: 'Lean margin', value: 78, level: 'high', note: 'Peaks 57° — close to the front-tyre edge in T6/T7' },
  { label: 'Rear grip', value: 62, level: 'med', note: 'Grip down 12% — slides on slow-corner exits' },
  { label: 'Front grip', value: 30, level: 'low', note: 'Front stable under braking' },
  { label: 'Track surface', value: 40, level: 'low', note: 'Dry, clean — one damp patch flagged at T3' },
  { label: 'Braking stability', value: 48, level: 'med', note: 'Slight chatter into T3 (18 Hz)' },
  { label: 'Throttle aggression', value: 66, level: 'med', note: 'Sharp on-throttle out of T5–T7' },
];

const lvlColor = (l: Factor['level']) => (l === 'low' ? 'var(--green)' : l === 'med' ? 'var(--yellow)' : 'var(--accent)');
const lvlText = (l: Factor['level']) => (l === 'low' ? 'LOW' : l === 'med' ? 'ELEVATED' : 'HIGH');

const CORNER_RISK = [
  { t: 'T7 · Portago', score: 74, cause: 'Rear slip + late throttle' },
  { t: 'T6 · Pedrosa', score: 68, cause: 'Over-leaning (57°)' },
  { t: 'T3 · Tunel', score: 55, cause: 'Brake chatter + damp patch' },
];

const NEAR_MISSES = [
  { lap: 'Lap 06', where: 'T7', text: 'Rear stepped out on exit — caught at 14% slip' },
  { lap: 'Lap 09', where: 'T6', text: 'Front pushed wide at max lean' },
];

export function CrashRiskPage() {
  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Crash-Risk Index</h1>
          <p className="page-subtitle">Jarama · Stint 03 · Safety Guardian AI</p>
        </div>
        <span className="badge" style={{ background: `color-mix(in srgb, ${levelColor} 16%, transparent)`, color: levelColor, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <ShieldAlert size={12} /> {level} RISK
        </span>
      </div>

      {/* Overall index meter */}
      <div className="card mb-4">
        <div className="card-header"><span className="card-title flex items-center gap-2"><Activity size={14} style={{ color: levelColor }} /> Overall risk index</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 8, flexWrap: 'wrap' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: 56, lineHeight: 1, color: levelColor }}>{RISK_SCORE}<span style={{ fontSize: 18, color: 'var(--text-muted)' }}>/100</span></div>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ position: 'relative', height: 14, borderRadius: 7, background: 'linear-gradient(90deg, var(--green), var(--yellow) 55%, var(--accent))' }}>
              <div style={{ position: 'absolute', top: -4, left: `calc(${RISK_SCORE}% - 3px)`, width: 6, height: 22, borderRadius: 3, background: '#fff', boxShadow: '0 0 6px rgba(0,0,0,0.6)' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginTop: 6 }}>
              <span>LOW</span><span>MEDIUM</span><span>HIGH</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: 16, alignItems: 'start' }}>
        {/* Risk factors */}
        <div className="card">
          <div className="card-header"><span className="card-title">Contributing factors</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 6 }}>
            {FACTORS.map(f => (
              <div key={f.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{f.label}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: lvlColor(f.level), padding: '1px 7px', borderRadius: 4, background: `color-mix(in srgb, ${lvlColor(f.level)} 14%, transparent)` }}>{lvlText(f.level)}</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.07)' }}>
                  <div style={{ width: `${f.value}%`, height: '100%', borderRadius: 3, background: lvlColor(f.level) }} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 3 }}>{f.note}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Riskiest corners + near misses + guardian note */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-header"><span className="card-title flex items-center gap-2"><AlertTriangle size={14} style={{ color: 'var(--accent)' }} /> Riskiest corners</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
              {CORNER_RISK.map(c => (
                <div key={c.t} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12, minWidth: 104 }}>{c.t}</span>
                  <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.07)' }}>
                    <div style={{ width: `${c.score}%`, height: '100%', borderRadius: 3, background: c.score > 67 ? 'var(--accent)' : 'var(--yellow)' }} />
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-dim)', minWidth: 130 }}>{c.cause}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title">Near-misses this stint</span><span className="badge badge-yellow">{NEAR_MISSES.length}</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
              {NEAR_MISSES.map((m, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', minWidth: 48 }}>{m.lap}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--accent)', minWidth: 30 }}>{m.where}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{m.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ borderColor: 'color-mix(in srgb, var(--green) 35%, transparent)' }}>
            <div className="card-header"><span className="card-title flex items-center gap-2"><ShieldCheck size={14} style={{ color: 'var(--green)' }} /> Safety Guardian AI</span></div>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-dim)', margin: '6px 0 10px' }}>
              Risk is <strong style={{ color: levelColor }}>medium and manageable</strong>. The exposure is concentrated in T6–T7: easing 2–3° of lean and softening the on-throttle there cuts the rear-slip risk without costing lap time. Hold current pace elsewhere.
            </p>
            <button className="btn btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>Open T7 in Lap Replay <ChevronRight size={12} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
