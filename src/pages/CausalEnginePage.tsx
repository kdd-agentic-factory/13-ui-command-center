/**
 * CausalEnginePage — Causal Performance Engine.
 *
 * Correlation → cause → intervention → validation: a causal graph, cause ranking
 * with correlation-vs-cause classification, the single best intervention (and
 * what not to change), the causal experiment + result, causal memory, a setup
 * causal check and causal risk analysis.
 */
import { GitMerge, ArrowDown, Zap, FlaskConical, Brain, ShieldAlert, Sliders } from 'lucide-react';
import { useGarage } from '../hooks/useGarage';
import { useSessionContext } from '../hooks/useSessionContext';
import { buildCausal, classMeta, CauseClass } from '../domain/causal';

const MONO = 'JetBrains Mono, monospace';

export function CausalEnginePage() {
  const garage = useGarage();
  const { ctx } = useSessionContext();
  const session = ctx.setup.stint ?? ctx.setup.session ?? 'Stint 03';
  const c = buildCausal(garage.profile.rider.name, `${garage.profile.bike.brand} ${garage.profile.bike.model}`, ctx.circuitName, session);
  const maxW = Math.max(...c.factors.map(f => f.weight), 1);

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2"><GitMerge size={18} /> Causal Performance Engine</h1>
          <p className="page-subtitle">Correlation → cause → intervention → validation — {c.combo}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Causal confidence</div>
          <div style={{ fontSize: 24, fontWeight: 800, fontFamily: MONO, color: 'var(--cyan)' }}>{c.confidence}%</div>
        </div>
      </div>

      {/* verdict */}
      <div className="card mb-4" style={{ padding: 14,
 }}>
        <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Observed problem · {c.problem}</div>
        <div style={{ fontSize: 12.5, color: 'var(--text)', marginTop: 4, lineHeight: 1.5 }}>{c.verdict}</div>
        <div style={{ fontSize: 12, color: 'var(--cyan)', fontStyle: 'italic', marginTop: 6 }}>“{c.punchline}”</div>
        <div style={{ display: 'flex', gap: 18, marginTop: 6, fontSize: 10.5, flexWrap: 'wrap' }}>
          <span><span style={{ color: 'var(--text-muted)' }}>Secondary: </span>{c.secondary.join(', ')}</span>
          <span><span style={{ color: 'var(--text-muted)' }}>Rejected: </span><span style={{ color: 'var(--text-muted)' }}>{c.rejected.join(', ')}</span></span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 16, alignItems: 'start' }}>
        {/* causal graph */}
        <div className="card" style={{ padding: 16 }}>
          <div style={hdr}>Causal graph</div>
          <div style={{ marginTop: 10 }}>
            {c.graph.map((n, i) => (
              <div key={n}>
                <div style={{ fontSize: 11.5, color: i === 0 ? 'var(--accent)' : i === c.graph.length - 1 ? 'var(--accent)' : 'var(--text)', fontWeight: i === 0 || i === c.graph.length - 1 ? 700 : 400 }}>{n}</div>
                {i < c.graph.length - 1 && <ArrowDown size={12} style={{ color: 'rgba(255,255,255,0.25)', margin: '1px 0 1px 8px' }} />}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: 10.5, color: 'var(--text-muted)' }}>
            Effect: <span style={{ color: 'var(--accent)' }}>{c.effect}</span> · direct cause: {c.directCause}
          </div>
        </div>

        {/* cause ranking */}
        <div className="card" style={{ padding: 16 }}>
          <div style={hdr}>Cause ranking · causal weight</div>
          {c.factors.map(f => (
            <div key={f.factor} style={{ marginBottom: 9 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <span style={{ fontSize: 11.5, color: 'var(--text)', flex: 1 }}>{f.factor}</span>
                <span style={{ fontSize: 8.5, fontFamily: MONO, color: classMeta(f.klass).color, border: `1px solid ${classMeta(f.klass).color}`, borderRadius: 3, padding: '0 5px' }}>{classMeta(f.klass).label}</span>
                <span style={{ fontSize: 10.5, fontFamily: MONO, color: 'var(--text)', width: 32, textAlign: 'right' }}>{f.weight}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <div style={{ width: `${(f.weight / maxW) * 100}%`, height: '100%', background: classMeta(f.klass).color }} />
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 10, marginTop: 6, fontSize: 8.5, fontFamily: MONO, flexWrap: 'wrap' }}>
            {(['confirmed-causal', 'likely-causal', 'correlated', 'rejected'] as CauseClass[]).map(k => (
              <span key={k} style={{ color: classMeta(k).color }}>● {classMeta(k).label}</span>
            ))}
          </div>
        </div>
      </div>

      {/* intervention planner */}
      <div className="card" style={{ padding: 16, marginTop: 14, background: 'rgba(0,183,255,0.05)', border: '1px solid rgba(0,183,255,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <Zap size={15} style={{ color: 'var(--cyan)' }} />
          <span style={{ fontSize: 9, fontFamily: MONO, color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Intervention planner</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>{c.intervention.action}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, fontSize: 11 }}>
          <div><div style={sub}>Why first</div><div style={{ color: 'var(--text-muted)' }}>{c.intervention.whyFirst}</div><div style={{ color: 'var(--text-muted)', marginTop: 4 }}>Risk: {c.intervention.risk} · {c.intervention.validation}</div></div>
          <div><div style={{ ...sub, color: 'var(--green)' }}>Expected</div>{c.intervention.expected.map(x => <div key={x} style={{ color: 'var(--text)' }}>· {x}</div>)}</div>
          <div><div style={{ ...sub, color: 'var(--accent)' }}>Do not change</div>{c.intervention.doNotChange.map(x => <div key={x} style={{ color: 'var(--text-muted)' }}>· {x}</div>)}</div>
        </div>
      </div>

      {/* causal experiment + result */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}><FlaskConical size={14} style={{ color: 'var(--violet)' }} /><span style={hdr}>Causal experiment design</span></div>
          <div style={{ fontSize: 11.5, color: 'var(--text)', marginBottom: 6 }}>{c.experiment.hypothesis}</div>
          <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Intervention</div>
          <div style={{ fontSize: 11, color: 'var(--cyan)', marginBottom: 6 }}>{c.experiment.intervention}</div>
          <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--green)', textTransform: 'uppercase' }}>Success criteria</div>
          <div style={{ fontSize: 10.5, color: 'var(--text)', marginBottom: 6 }}>{c.experiment.successCriteria.join(' · ')}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{c.experiment.causalValidation}</div>
        </div>
        <div className="card" style={{ padding: 16,
 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ ...hdr, flex: 1 }}>Causal result</span>
            <span style={{ fontSize: 9.5, fontFamily: MONO, color: 'var(--green)', border: '1px solid rgba(0,230,118,0.4)', borderRadius: 4, padding: '1px 8px' }}>{c.result.status.toUpperCase()}</span>
          </div>
          {c.result.evidence.map(e => <div key={e} style={{ fontSize: 11, color: 'var(--text)' }}>· {e}</div>)}
          <div style={{ fontSize: 11.5, color: 'var(--green)', marginTop: 6 }}>{c.result.conclusion}</div>
        </div>
      </div>

      {/* causal memory + setup check + risk */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 1fr', gap: 14, marginTop: 14 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}><Brain size={13} style={{ color: 'var(--cyan)' }} /><span style={hdr}>Causal memory</span></div>
          {c.memory.map(m => (
            <div key={m.pattern} style={{ marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text)' }}>{m.pattern}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>cause: {m.confirmedCause}</div>
              <div style={{ fontSize: 10, color: 'var(--green)' }}>{m.intervention} · {m.effect} · {m.confidence} ({m.sessions.length} stints)</div>
            </div>
          ))}
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}><Sliders size={13} style={{ color: 'var(--yellow)' }} /><span style={hdr}>Setup causal check</span></div>
          <div style={{ fontSize: 11.5, color: 'var(--text)', marginBottom: 4 }}>{c.setupCheck.question}</div>
          <div style={{ fontSize: 9.5, color: 'var(--green)' }}>For: {c.setupCheck.evidenceFor.join(' · ')}</div>
          <div style={{ fontSize: 9.5, color: 'var(--accent)' }}>Against: {c.setupCheck.evidenceAgainst.join(' · ')}</div>
          <div style={{ fontSize: 10.5, color: 'var(--text)', marginTop: 4 }}>{c.setupCheck.verdict}</div>
          <div style={{ fontSize: 10.5, color: 'var(--cyan)', marginTop: 2 }}>{c.setupCheck.decision}</div>
        </div>
        <div className="card" style={{ padding: 16,
 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}><ShieldAlert size={13} style={{ color: 'var(--accent)' }} /><span style={hdr}>Causal risk analysis</span></div>
          <div style={{ fontSize: 11, color: 'var(--text)' }}>{c.riskAnalysis.observed}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>cause: {c.riskAnalysis.cause} · amp: {c.riskAnalysis.amplifier} · human: {c.riskAnalysis.humanFactor}</div>
          <div style={{ fontSize: 10.5, color: 'var(--cyan)', marginTop: 4 }}>{c.riskAnalysis.intervention}</div>
          <div style={{ fontSize: 11, color: 'var(--green)', marginTop: 2 }}>Risk {c.riskAnalysis.riskReduction}</div>
        </div>
      </div>
    </div>
  );
}

const hdr: React.CSSProperties = { fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase' };
const sub: React.CSSProperties = { fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 3 };
