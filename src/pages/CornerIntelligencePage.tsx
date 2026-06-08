import { useMemo, useState } from 'react';
import { Flag, AlertTriangle, ChevronRight, Gauge, Activity, TrendingDown, RotateCcw } from 'lucide-react';
import { useNavigate } from '../context/NavContext';
import { useToast } from '../components/ToastProvider';

/**
 * Corner Intelligence (engineer feedback #6) — the rider-facing, corner-by-corner
 * analysis that answers "which corner do I get wrong, why, and what do I change?".
 * Each corner is scored (entry / apex / exit), with the time lost vs the ideal lap,
 * the main issue and an actionable AI recommendation.
 */

interface Corner {
  n: number;
  name: string;
  entry: number;   // 0–100
  apex: number;
  exit: number;
  lossS: number;   // seconds lost vs ideal lap
  maxLean: number; // deg
  brakeDeltaM: number;   // metres late (+) / early (−) on the brake point
  throttleDeltaS: number; // seconds late (+) opening the throttle
  issue: string;
  rec: string;
}

// Representative Jarama lap (synthetic but plausible) — Turn 7 is the critical one.
const CORNERS: Corner[] = [
  { n: 1, name: 'Nuvolari', entry: 86, apex: 83, exit: 81, lossS: 0.061, maxLean: 51, brakeDeltaM: 1, throttleDeltaS: 0.05, issue: 'Minor late apex', rec: 'Tidy — turn in a touch earlier to free the exit.' },
  { n: 2, name: 'Le Mans', entry: 90, apex: 88, exit: 86, lossS: 0.022, maxLean: 48, brakeDeltaM: -1, throttleDeltaS: 0.0, issue: 'On reference', rec: 'Keep it. Reference-lap quality.' },
  { n: 3, name: 'Tunel', entry: 74, apex: 71, exit: 70, lossS: 0.216, maxLean: 55, brakeDeltaM: 9, throttleDeltaS: 0.18, issue: 'Braking 9 m late', rec: 'Release the brake earlier and roll more mid-corner speed; open the throttle progressively.' },
  { n: 4, name: 'Ascari', entry: 82, apex: 79, exit: 77, lossS: 0.088, maxLean: 53, brakeDeltaM: 3, throttleDeltaS: 0.08, issue: 'Slight understeer', rec: 'Trail less front brake to settle the front and rotate.' },
  { n: 5, name: 'Bus Stop', entry: 80, apex: 76, exit: 72, lossS: 0.131, maxLean: 49, brakeDeltaM: 4, throttleDeltaS: 0.12, issue: 'Late throttle', rec: 'Pick the bike up sooner to get drive onto the back straight.' },
  { n: 6, name: 'Pedrosa', entry: 84, apex: 81, exit: 78, lossS: 0.074, maxLean: 56, brakeDeltaM: 2, throttleDeltaS: 0.06, issue: 'Over-leaning', rec: 'Use less lean and more steering to save the tyre.' },
  { n: 7, name: 'Portago', entry: 70, apex: 66, exit: 61, lossS: 0.284, maxLean: 57, brakeDeltaM: 7, throttleDeltaS: 0.40, issue: 'Late throttle + rear slip', rec: 'Open the throttle 0.3 s earlier with lower lean; raise TC +1 to control the rear on exit.' },
  { n: 8, name: 'Fonsi', entry: 88, apex: 85, exit: 84, lossS: 0.030, maxLean: 47, brakeDeltaM: 0, throttleDeltaS: 0.02, issue: 'On reference', rec: 'Strong corner — no change.' },
  { n: 9, name: 'Nieto', entry: 79, apex: 75, exit: 73, lossS: 0.142, maxLean: 54, brakeDeltaM: 5, throttleDeltaS: 0.10, issue: 'Wide entry', rec: 'Brake 5 m earlier, square the corner for a better exit.' },
  { n: 10, name: 'Bugatti', entry: 87, apex: 84, exit: 82, lossS: 0.048, maxLean: 50, brakeDeltaM: 1, throttleDeltaS: 0.03, issue: 'Minor', rec: 'Hold the line.' },
];

function scoreColor(s: number): string {
  if (s >= 85) return 'var(--green)';
  if (s >= 75) return 'var(--yellow)';
  return 'var(--accent)';
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: 9, letterSpacing: '0.08em', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: scoreColor(value), fontFamily: 'var(--font-mono)' }}>{value}</span>
      </div>
      <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', background: scoreColor(value), borderRadius: 3, transition: 'width 0.5s' }} />
      </div>
    </div>
  );
}

export function CornerIntelligencePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selected, setSelected] = useState<number | null>(7);

  const { totalGain, critical, sorted } = useMemo(() => {
    const totalGain = CORNERS.reduce((a, c) => a + c.lossS, 0);
    const critical = CORNERS.reduce((m, c) => (c.lossS > m.lossS ? c : m), CORNERS[0]);
    const sorted = [...CORNERS].sort((a, b) => b.lossS - a.lossS);
    return { totalGain, critical, sorted };
  }, []);

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Corner Intelligence</h1>
          <p className="page-subtitle">Jarama · corner-by-corner analysis vs your ideal lap</p>
        </div>
      </div>

      {/* Session + reina summary */}
      <div className="card mb-4" style={{ background: 'linear-gradient(135deg, rgba(224,55,55,0.10), rgba(255,255,255,0.02))' }}>
        <div className="card-header">
          <span className="card-title flex items-center gap-2"><Flag size={14} style={{ color: 'var(--accent)' }} /> Corner Intelligence · Jarama</span>
          <span className="badge badge-green" style={{ animation: 'pulse 2s infinite' }}>LIVE · STINT 03</span>
        </div>
        <div className="grid-4" style={{ marginTop: 8 }}>
          <div className="stat-tile" style={{ borderColor: 'color-mix(in srgb, var(--green) 40%, transparent)' }}>
            <div className="stat-tile__label">Potential gain</div>
            <span className="stat-tile__value" style={{ fontSize: 26, color: 'var(--green)' }}>−{totalGain.toFixed(3)}<span className="stat-tile__unit">s</span></span>
          </div>
          <div className="stat-tile">
            <div className="stat-tile__label">Critical corner</div>
            <span className="stat-tile__value" style={{ fontSize: 22, color: 'var(--accent)' }}>T{critical.n} · {critical.name}</span>
          </div>
          <div className="stat-tile">
            <div className="stat-tile__label">Main issue</div>
            <span className="stat-tile__value" style={{ fontSize: 15, color: 'var(--yellow)' }}>{critical.issue}</span>
          </div>
          <div className="stat-tile">
            <div className="stat-tile__label">Rider consistency</div>
            <span className="stat-tile__value" style={{ fontSize: 22 }}>86<span className="stat-tile__unit">%</span></span>
          </div>
        </div>
      </div>

      {/* Corner cards (sorted by time lost) */}
      <div className="grid-2" style={{ gap: 12 }}>
        {sorted.map(c => {
          const isCrit = c.n === critical.n;
          const open = selected === c.n;
          return (
            <div
              key={c.n}
              className="card"
              style={{
                cursor: 'pointer',
                borderColor: isCrit ? 'color-mix(in srgb, var(--accent) 55%, transparent)' : undefined,
                boxShadow: open ? '0 0 0 1px var(--accent)' : undefined,
              }}
              onClick={() => setSelected(open ? null : c.n)}
            >
              <div className="card-header" style={{ marginBottom: 8 }}>
                <span className="card-title flex items-center gap-2">
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 15,
                    color: isCrit ? 'var(--accent)' : 'var(--text)',
                  }}>T{c.n}</span>
                  <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>{c.name}</span>
                  {isCrit && <span className="badge badge-red" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><AlertTriangle size={10} /> CRITICAL</span>}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 16, color: c.lossS > 0.15 ? 'var(--accent)' : c.lossS > 0.07 ? 'var(--yellow)' : 'var(--green)' }}>
                  <TrendingDown size={13} /> +{c.lossS.toFixed(3)}s
                </span>
              </div>

              <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <ScoreBar label="ENTRY" value={c.entry} />
                <ScoreBar label="APEX" value={c.apex} />
                <ScoreBar label="EXIT" value={c.exit} />
              </div>

              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', marginBottom: open ? 10 : 0 }}>
                <span><Activity size={11} style={{ verticalAlign: -1, color: 'var(--purple)' }} /> {c.maxLean}° lean</span>
                <span><Gauge size={11} style={{ verticalAlign: -1, color: 'var(--blue)' }} /> brake {c.brakeDeltaM >= 0 ? '+' : ''}{c.brakeDeltaM} m</span>
                <span style={{ color: c.throttleDeltaS > 0.15 ? 'var(--accent)' : undefined }}>throttle +{c.throttleDeltaS.toFixed(2)}s</span>
              </div>

              {open && (
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 10 }}>
                  <div style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>ISSUE</div>
                  <div style={{ fontSize: 13, color: 'var(--yellow)', marginBottom: 10 }}>{c.issue}</div>
                  <div style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>RIDER COACH AI · RECOMMENDATION</div>
                  <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5, marginBottom: 12 }}>{c.rec}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      onClick={() => toast({ type: 'success', title: `T${c.n} ${c.name} · comparison loaded`, message: 'Overlaying your best lap for this corner.' })}>
                      <RotateCcw size={12} /> Compare to best lap
                    </button>
                    <button className="btn btn-ghost btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      onClick={() => navigate('replay')}>
                      Open in Lap Replay <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
