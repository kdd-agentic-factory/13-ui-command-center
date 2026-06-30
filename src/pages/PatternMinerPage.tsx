/**
 * PatternMinerPage  —  Multi-Session Pattern Miner.
 *
 * Recurring losses/risks/setup-issues across many sessions, each with a source
 * split (rider / bike / circuit), the affected corners, validated corrections,
 * a historical comparison, setup-effectiveness history and the Oracle's
 * historical context. From single-stint analysis to longitudinal intelligence.
 */
import type { CSSProperties } from 'react';
import { Layers, ArrowRight, TrendingUp, Sparkles } from 'lucide-react';
import { useNavigate } from '../context/NavContext';
import { useGarage } from '../hooks/useGarage';
import { buildPatternMine, riskColor, trendColor, PatternCard } from '../domain/patternMiner';

const MONO = 'JetBrains Mono, monospace';

function SourceBar({ s }: { s: PatternCard['source'] }) {
  const seg = [
    { k: 'rider', v: s.rider, c: 'var(--cyan)' },
    { k: 'bike', v: s.bike, c: 'var(--yellow)' },
    { k: 'circuit', v: s.circuit, c: 'var(--violet)' },
  ];
  return (
    <div>
      <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', border: '1px solid var(--border)' }}>
        {seg.map(x => <div key={x.k} style={{ width: `${x.v}%`, background: x.c }} title={`${x.k} ${x.v}%`} />)}
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 9.5, fontFamily: MONO }}>
        {seg.map(x => <span key={x.k} style={{ color: x.c }}>{x.k} {x.v}%</span>)}
      </div>
    </div>
  );
}

function PatternCardView({ p, onNav }: { p: PatternCard; onNav: (t: 'learning-path' | 'setup-lab') => void }) {
  const maxLoss = Math.max(...p.corners.map(c => c.loss), 0.01);
  return (
    <div className="card" style={{ padding: 16,
 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text)', flex: 1 }}>{p.pattern}</span>
        <span style={{ fontSize: 9, fontFamily: MONO, color: 'var(--accent)', border: '1px solid var(--accent)', borderRadius: 999, padding: '1px 8px' }}>{p.detectedIn}</span>
      </div>
      <div style={{ fontSize: 10.5, fontFamily: MONO, color: 'var(--text-muted)', marginBottom: 10 }}>
        {p.circuits.join(' ─—· ')} ─—· avg +{p.avgLoss.toFixed(2)}s/corner ─—· risk <span style={{ color: riskColor(p.riskImpact) }}>{p.riskImpact}</span> ─—· conf {p.confidence}%
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 14 }}>
        {/* recurring corner loss */}
        <div>
          <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 5 }}>Recurring loss by corner</div>
          {p.corners.map(c => (
            <div key={c.corner} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ width: 120, fontSize: 10.5, color: 'var(--text)' }}>{c.corner}</span>
              <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <div style={{ width: `${(c.loss / maxLoss) * 100}%`, height: '100%', background: 'linear-gradient(90deg, var(--yellow), var(--accent))' }} />
              </div>
              <span style={{ width: 40, textAlign: 'right', fontSize: 10, fontFamily: MONO, color: 'var(--accent)' }}>+{c.loss.toFixed(2)}</span>
            </div>
          ))}
        </div>
        {/* source split + telemetry */}
        <div>
          <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 5 }}>Likely source</div>
          <SourceBar s={p.source} />
          <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase', margin: '8px 0 4px' }}>Associated telemetry</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {p.telemetry.map(t => <span key={t} style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 6px' }}>{t}</span>)}
          </div>
        </div>
      </div>

      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', margin: '10px 0 6px' }}><b style={{ color: 'var(--text)' }}>Diagnosis:</b> {p.diagnosis}</div>
      <div style={{ padding: '8px 11px', borderRadius: 'var(--radius)', background: 'rgba(0,230,118,0.05)', border: '1px solid rgba(0,230,118,0.2)', fontSize: 11.5, color: 'var(--text)' }}>
        <b style={{ color: 'var(--green)' }}>Best validated correction:</b> {p.bestCorrection}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
        <button onClick={() => onNav('learning-path')} style={chip('var(--cyan)')}>{p.trainingBlock} <ArrowRight size={11} /></button>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>setup check: {p.setupCheck.join(', ')}</span>
        <button onClick={() => onNav('setup-lab')} style={{ ...chip('var(--text-muted)'), marginLeft: 'auto' }}>Setup Lab</button>
      </div>
    </div>
  );
}

const chip = (color: string): CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontFamily: MONO, color,
  background: 'none', border: `1px solid ${color}`, borderRadius: 5, padding: '3px 8px', cursor: 'pointer',
});

export function PatternMinerPage() {
  const navigate = useNavigate();
  const garage = useGarage();
  const m = buildPatternMine(garage.profile.rider.name, `${garage.profile.bike.brand} ${garage.profile.bike.model}`, garage.telemetryLimited);

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2"><Layers size={18} /> Multi-Session Pattern Miner</h1>
          <p className="page-subtitle">Recurring patterns across sessions, circuits & conditions  —  {m.combo} ─—· {m.scope}</p>
        </div>
      </div>

      {/* Oracle historical context */}
      <div className="card mb-4" style={{ padding: 14, background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
          <Sparkles size={14} style={{ color: 'var(--violet)' }} />
          <span style={{ fontSize: 9, fontFamily: MONO, color: 'var(--violet)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Oracle historical context</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.55 }}>{m.oracleContext}</div>
      </div>

      {/* Pattern cards */}
      <div style={{ display: 'grid', gap: 14 }}>
        {m.patterns.map(p => <PatternCardView key={p.id} p={p} onNav={navigate} />)}
      </div>

      {/* Historical comparison + setup effectiveness */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 14, marginTop: 14 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>Historical comparison</div>
          {m.comparisons.map(c => (
            <div key={c.metric} style={{ marginBottom: 9 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, fontSize: 11 }}>
                <span style={{ flex: 1, color: 'var(--text)' }}>{c.metric}</span>
                <span style={{ fontFamily: MONO, color: 'var(--text)' }}>{c.current}</span>
                <span style={{ fontFamily: MONO, color: 'var(--text-muted)', fontSize: 9.5 }}>avg5 {c.avgLast5} ─—· tgt {c.target}</span>
                <span style={{ fontSize: 9.5, fontFamily: MONO, color: trendColor(c.trend) }}>{c.trend}</span>
              </div>
              <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginTop: 3, position: 'relative' }}>
                <div style={{ position: 'absolute', left: `${Math.min(100, c.target)}%`, top: -1, bottom: -1, width: 1, background: 'rgba(255,255,255,0.4)' }} />
                <div style={{ width: `${Math.min(100, c.current)}%`, height: '100%', background: trendColor(c.trend) }} />
              </div>
            </div>
          ))}
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>Setup effectiveness history</div>
          {m.setupHistory.map(s => (
            <div key={s.change} style={{ marginBottom: 9, paddingBottom: 9, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text)', flex: 1 }}>{s.change}</span>
                <span style={{ fontSize: 9.5, fontFamily: MONO, color: s.validated > 0 ? 'var(--green)' : 'var(--accent)' }}>{s.validated}/{s.applied} validated</span>
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: 10, fontFamily: MONO, color: 'var(--text-muted)', marginTop: 2 }}>
                <span>slip {s.avgSlipReduction}</span><span>lap {s.avgLapGain}</span><span>risk {s.riskImpact}</span>
              </div>
              <div style={{ fontSize: 10.5, color: s.validated > 0 ? 'var(--green)' : 'var(--text-muted)', marginTop: 2 }}>{s.status}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Progress insight */}
      <div className="card" style={{ padding: 16, marginTop: 14,
 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
          <TrendingUp size={14} style={{ color: 'var(--green)' }} />
          <span style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Progress insight</span>
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{m.progress.headline}</div>
        <div style={{ display: 'flex', gap: 24, marginTop: 8, fontSize: 11.5 }}>
          <span><span style={{ color: 'var(--text-muted)' }}>Most improved: </span><span style={{ color: 'var(--green)' }}>{m.progress.mostImproved}</span></span>
          <span><span style={{ color: 'var(--text-muted)' }}>Still unresolved: </span><span style={{ color: 'var(--accent)' }}>{m.progress.stillUnresolved}</span></span>
        </div>
      </div>
    </div>
  );
}

export default PatternMinerPage;
