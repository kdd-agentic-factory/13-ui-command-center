import { useMemo, useState } from 'react';
import { TrendingDown, Sparkles, Check } from 'lucide-react';

/**
 * Predictive Improvement Model (engineer Phase 3 #3) — turns the analysis into a
 * forward projection: "if you do X, you gain Y". Pick the changes you'll work on
 * and watch the projected lap time fall, with each lever's gain, difficulty and
 * model confidence. Built on the §10/§14 inverse-dynamics + tyre models.
 */

const CURRENT_S = 103.912;   // 1:43.912
const OPTIMAL_S = 102.05;    // theoretical best from the model

interface Lever {
  id: string; action: string; where: string;
  gain: number;            // seconds saved
  difficulty: 'easy' | 'medium' | 'hard';
  confidence: number;      // 0–1
}

const LEVERS: Lever[] = [
  { id: 't7', action: 'Open the throttle 0.3 s earlier (lower lean)', where: 'Turn 7', gain: 0.284, difficulty: 'medium', confidence: 0.88 },
  { id: 't3', action: 'Brake 9 m earlier, carry more mid-corner speed', where: 'Turn 3', gain: 0.216, difficulty: 'medium', confidence: 0.82 },
  { id: 't9', action: 'Square the corner for a cleaner exit', where: 'Turn 9', gain: 0.142, difficulty: 'easy', confidence: 0.79 },
  { id: 't5', action: 'Pick the bike up sooner onto the straight', where: 'Turn 5', gain: 0.131, difficulty: 'easy', confidence: 0.80 },
  { id: 'tc', action: 'Raise traction control +1 to stop slow-corner slip', where: 'Setup · S2', gain: 0.090, difficulty: 'easy', confidence: 0.74 },
  { id: 't6', action: 'Use less lean (57°→54°), more steering', where: 'Turn 6', gain: 0.074, difficulty: 'hard', confidence: 0.66 },
];

const diffColor = (d: Lever['difficulty']) => (d === 'easy' ? 'var(--green)' : d === 'medium' ? 'var(--yellow)' : 'var(--accent)');

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toFixed(3).padStart(6, '0')}`;
}

export function PredictiveModelPage() {
  const [picked, setPicked] = useState<Set<string>>(new Set(['t9', 't5', 'tc']));

  const { gain, projected, pctToOptimal } = useMemo(() => {
    const gain = LEVERS.filter(l => picked.has(l.id)).reduce((a, l) => a + l.gain, 0);
    const projected = Math.max(OPTIMAL_S, CURRENT_S - gain);
    const pctToOptimal = Math.min(100, (gain / (CURRENT_S - OPTIMAL_S)) * 100);
    return { gain, projected, pctToOptimal };
  }, [picked]);

  function toggle(id: string) {
    setPicked(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Predictive Improvement Model</h1>
          <p className="page-subtitle">Mugello · Lap Time Optimizer AI · pick what you'll work on</p>
        </div>
        <span className="badge badge-blue"><Sparkles size={11} style={{ verticalAlign: -1, marginRight: 4 }} /> projection</span>
      </div>

      {/* Projection hero */}
      <div className="card mb-4" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.10), rgba(34,197,94,0.06))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.12em', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>CURRENT BEST</div>
            <div style={{ fontSize: 30, fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>{fmt(CURRENT_S)}</div>
          </div>
          <TrendingDown size={26} style={{ color: 'var(--green)' }} />
          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.12em', color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>PROJECTED</div>
            <div style={{ fontSize: 38, fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--green)' }}>{fmt(projected)}</div>
          </div>
          <div style={{ textAlign: 'center', flex: 'none' }}>
            <div style={{ fontSize: 40, fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--green)', lineHeight: 1 }}>−{gain.toFixed(3)}<span style={{ fontSize: 16 }}>s</span></div>
            <div style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>FROM {picked.size} CHANGES</div>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>
              <span>current</span><span>theoretical best {fmt(OPTIMAL_S)}</span>
            </div>
            <div style={{ height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.07)' }}>
              <div style={{ width: `${pctToOptimal}%`, height: '100%', borderRadius: 5, background: 'linear-gradient(90deg, var(--blue), var(--green))', transition: 'width 0.3s' }} />
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>{pctToOptimal.toFixed(0)}% of the way to the model's theoretical best</div>
          </div>
        </div>
      </div>

      {/* Improvement levers */}
      <div className="card">
        <div className="card-header"><span className="card-title">Improvement levers</span><span className="badge badge-green">{picked.size} selected</span></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
          {LEVERS.map(l => {
            const on = picked.has(l.id);
            return (
              <button
                key={l.id}
                onClick={() => toggle(l.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', width: '100%',
                  padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                  border: `1px solid ${on ? 'color-mix(in srgb, var(--green) 45%, transparent)' : 'var(--border)'}`,
                  background: on ? 'var(--green-dim)' : 'transparent', transition: 'background 0.15s, border-color 0.15s',
                }}
              >
                <span style={{ width: 20, height: 20, borderRadius: 5, flex: 'none', display: 'grid', placeItems: 'center', background: on ? 'var(--green)' : 'rgba(255,255,255,0.06)', color: '#0B0D12' }}>
                  {on && <Check size={13} />}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{l.action}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{l.where} · {(l.confidence * 100).toFixed(0)}% confidence</div>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: diffColor(l.difficulty), textTransform: 'uppercase', padding: '2px 7px', borderRadius: 4, background: `color-mix(in srgb, ${diffColor(l.difficulty)} 14%, transparent)` }}>{l.difficulty}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 800, color: 'var(--green)', minWidth: 64, textAlign: 'right' }}>−{l.gain.toFixed(3)}s</span>
              </button>
            );
          })}
        </div>
        <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          Gains are modelled independently; real combined gain is typically 85–95% of the sum.
        </div>
      </div>
    </div>
  );
}
