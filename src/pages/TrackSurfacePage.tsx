/**
 * TrackSurfacePage — Track Surface Intelligence.
 *
 * The circuit as a living surface: per-corner grip map, the Grip Budget (how
 * available grip is spent on lean / throttle / degradation), track-evolution
 * windows, a racing-line adaptation for the grip available now, surface risk
 * alerts and the surface-aware Oracle verdict.
 */
import { useState } from 'react';
import { Mountain, AlertTriangle, Sparkles, Route } from 'lucide-react';
import { useGarage } from '../hooks/useGarage';
import { useSessionContext } from '../hooks/useSessionContext';
import { buildTrackSurface, gripColor, budgetColor, GripBudget } from '../domain/trackSurface';

const MONO = 'JetBrains Mono, monospace';

const EVO_COLOR = { stabilizing: 'var(--text-muted)', peak: 'var(--green)', dropping: 'var(--yellow)', risk: 'var(--accent)' } as const;

function BudgetBar({ b }: { b: GripBudget }) {
  const seg = [
    { k: 'lean', v: b.lean, c: 'var(--yellow)' },
    { k: 'throttle', v: b.throttle, c: 'var(--green)' },
    { k: 'degradation', v: b.degradation, c: '#FF6A00' },
    { k: 'margin', v: b.margin, c: b.margin <= 5 ? 'var(--accent)' : 'rgba(255,255,255,0.15)' },
  ];
  return (
    <div>
      <div style={{ display: 'flex', height: 14, borderRadius: 5, overflow: 'hidden', border: '1px solid var(--border)' }}>
        {seg.map(s => <div key={s.k} style={{ width: `${s.v}%`, background: s.c }} title={`${s.k} ${s.v}%`} />)}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 5, fontSize: 9.5, fontFamily: MONO }}>
        {seg.map(s => <span key={s.k} style={{ color: s.c === 'rgba(255,255,255,0.15)' ? 'var(--text-muted)' : s.c }}>{s.k} {s.v}%</span>)}
      </div>
    </div>
  );
}

export function TrackSurfacePage() {
  const garage = useGarage();
  const { ctx } = useSessionContext();
  const session = ctx.setup.stint ?? ctx.setup.session ?? 'Stint 03';
  const s = buildTrackSurface(garage.profile.rider.name, `${garage.profile.bike.brand} ${garage.profile.bike.model}`, ctx.circuitName, session, garage.telemetryLimited);

  const [layer, setLayer] = useState(s.layers[0]);
  const [budgetCorner, setBudgetCorner] = useState(s.gripBudgets[0].corner);
  const budget = s.gripBudgets.find(b => b.corner === budgetCorner) ?? s.gripBudgets[0];

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2"><Mountain size={18} /> Track Surface Intelligence</h1>
          <p className="page-subtitle">Grip map · evolution · grip budget · line adaptation — {s.combo}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Overall grip · conf {s.confidence}%</div>
          <div style={{ fontSize: 26, fontWeight: 800, fontFamily: MONO, color: s.overallGrip >= 80 ? 'var(--green)' : 'var(--yellow)' }}>{s.overallGrip}<span style={{ fontSize: 12, color: 'var(--text-muted)' }}>/100</span></div>
        </div>
      </div>

      {/* verdict banner */}
      <div className="card mb-4" style={{ padding: 12, borderLeft: '3px solid var(--accent)' }}>
        <span style={{ fontSize: 12.5, color: 'var(--text)' }}><b>Surface verdict:</b> {s.mainConstraint}</span>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Best window {s.bestWindow} · degradation {s.degradationWindow} · critical: {s.criticalZones.join(', ')}</div>
      </div>

      {/* layer selector */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        <span style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase', alignSelf: 'center' }}>Layer</span>
        {s.layers.map(l => (
          <button key={l} onClick={() => setLayer(l)}
            style={{ fontSize: 9.5, fontFamily: MONO, padding: '3px 8px', borderRadius: 5, cursor: 'pointer',
              background: layer === l ? 'rgba(0,183,255,0.12)' : 'transparent', border: `1px solid ${layer === l ? 'var(--cyan)' : 'var(--border)'}`, color: layer === l ? 'var(--cyan)' : 'var(--text-muted)' }}>{l}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
        {/* Grip map */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>Grip map · {layer}</div>
          {s.corners.map(c => (
            <div key={c.corner} onClick={() => setBudgetCorner(c.corner)} style={{ marginBottom: 12, cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', flex: 1 }}>{c.corner}</span>
                <span style={{ fontSize: 9, fontFamily: MONO, color: gripColor(c.grip), border: `1px solid ${gripColor(c.grip)}`, borderRadius: 4, padding: '0 6px' }}>{c.grip}</span>
                <span style={{ fontSize: 9, fontFamily: MONO, color: c.thermalLoad === 'High' ? 'var(--accent)' : 'var(--text-muted)' }}>thermal {c.thermalLoad}</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <div style={{ width: `${c.gripPct}%`, height: '100%', background: gripColor(c.grip) }} />
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 3 }}><span style={{ color: 'var(--accent)' }}>{c.risk}</span> · {c.recommendation}</div>
            </div>
          ))}
        </div>

        {/* Grip budget + line adaptation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card" style={{ padding: 16, borderLeft: `3px solid ${budgetColor(budget.status)}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', flex: 1 }}>Grip budget</span>
              {s.gripBudgets.map(b => (
                <button key={b.corner} onClick={() => setBudgetCorner(b.corner)}
                  style={{ fontSize: 9, fontFamily: MONO, padding: '2px 6px', borderRadius: 4, cursor: 'pointer',
                    background: b.corner === budgetCorner ? 'rgba(0,183,255,0.12)' : 'transparent', border: `1px solid ${b.corner === budgetCorner ? 'var(--cyan)' : 'var(--border)'}`, color: b.corner === budgetCorner ? 'var(--cyan)' : 'var(--text-muted)' }}>
                  {b.corner.split(' ')[0]}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>{budget.corner}</span>
              <span style={{ fontSize: 10, fontFamily: MONO, color: budgetColor(budget.status), textTransform: 'uppercase' }}>{budget.status} · {budget.margin}% margin</span>
            </div>
            <BudgetBar b={budget} />
            <div style={{ fontSize: 11.5, color: 'var(--text)', marginTop: 10 }}>{budget.conclusion}</div>
          </div>

          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
              <Route size={14} style={{ color: 'var(--cyan)' }} />
              <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Racing line adaptation</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Normal: {s.lineAdaptation.normalLine}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>Condition: <span style={{ color: 'var(--accent)' }}>{s.lineAdaptation.condition}</span></div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {s.lineAdaptation.recommendedLine.map(r => <span key={r} style={{ fontSize: 10.5, fontFamily: MONO, color: 'var(--green)', border: '1px solid rgba(0,230,118,0.3)', borderRadius: 5, padding: '2px 7px' }}>{r}</span>)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>{s.lineAdaptation.reason}</div>
          </div>
        </div>
      </div>

      {/* Evolution + alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>Track evolution timeline</div>
          {s.evolution.map(e => (
            <div key={e.laps} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: 999, background: EVO_COLOR[e.state], marginTop: 3, flexShrink: 0 }} />
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: EVO_COLOR[e.state] }}>{e.laps}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>{e.note}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>Surface risk alerts</div>
          {s.alerts.map(a => (
            <div key={a.zone} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={12} style={{ color: 'var(--accent)' }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', flex: 1 }}>{a.zone}</span>
                <span style={{ fontSize: 10, color: 'var(--accent)' }}>{a.risk}</span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', margin: '3px 0' }}>{a.trigger.join(' · ')}</div>
              <div style={{ fontSize: 11, color: 'var(--cyan)' }}>→ {a.action}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Surface-aware oracle + limitations */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 14, marginTop: 14 }}>
        <div className="card" style={{ padding: 16, background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
            <Sparkles size={14} style={{ color: '#8B5CF6' }} />
            <span style={{ fontSize: 9, fontFamily: MONO, color: '#8B5CF6', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Surface-aware Oracle · {s.oracle.confidence}%</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.5 }}>{s.oracle.constraint}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginTop: 6 }}>{s.oracle.decision}</div>
          <div style={{ fontSize: 11.5, color: 'var(--green)', marginTop: 4 }}>{s.oracle.action}</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Surface model · confidence {s.confidence}%</div>
          <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Limitations</div>
          {s.limitations.map(l => <div key={l} style={{ fontSize: 11, color: 'var(--text-muted)' }}>· {l}</div>)}
        </div>
      </div>
    </div>
  );
}
