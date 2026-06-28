/**
 * ExperimentEnginePage  —  Performance Experiment Engine.
 *
 * Every recommendation becomes a controlled on-track experiment: hypothesis +
 * confidence, change set, controlled variables, success criteria, expected
 * gain and risk for the active one; a before/after metric table, validation
 * status, learning and next recommendation for the closed ones. KDD stops
 * being a dashboard that analyses and becomes a system that improves.
 */
import { TestTubes, CheckCircle2, XCircle, ArrowRight, FlaskConical } from 'lucide-react';
import { useNavigate } from '../context/NavContext';
import { useGarage } from '../hooks/useGarage';
import { useSessionContext } from '../hooks/useSessionContext';
import { buildExperiments, statusMeta, EXPERIMENT_LOOP, Experiment } from '../domain/experimentEngine';

const MONO = 'JetBrains Mono, monospace';

function StatusPill({ status }: { status: Experiment['status'] }) {
  const m = statusMeta(status);
  return (
    <span style={{ fontSize: 9, fontFamily: MONO, color: m.color, border: `1px solid ${m.color}`, borderRadius: 4, padding: '1px 7px', whiteSpace: 'nowrap' }}>
      {m.label}
    </span>
  );
}

function ActiveExperiment({ exp, onNav }: { exp: Experiment; onNav: (t: 'black-box') => void }) {
  return (
    <div className="card" style={{ padding: 18,
 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
        <FlaskConical size={16} style={{ color: 'var(--cyan)' }} />
        <span style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Active experiment ─—· {exp.id} ─—· {exp.type}</span>
        <span style={{ marginLeft: 'auto' }}><StatusPill status={exp.status} /></span>
      </div>
      <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)' }}>{exp.title}</div>
      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>{exp.problem}</div>

      <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 8, background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.25)' }}>
        <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--violet)', textTransform: 'uppercase', marginBottom: 3 }}>Hypothesis ─—· confidence {exp.confidence}%</div>
        <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.5 }}>{exp.hypothesis}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 12 }}>
        <div>
          <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--cyan)', textTransform: 'uppercase', marginBottom: 5 }}>Change set</div>
          <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11.5, color: 'var(--text)', lineHeight: 1.7 }}>
            {exp.changeSet.map(c => <li key={c}>{c}</li>)}
          </ul>
        </div>
        <div>
          <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 5 }}>Controlled variables</div>
          <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.7 }}>
            {exp.controlled.map(c => <li key={c}>{c}</li>)}
          </ul>
        </div>
      </div>

      {exp.riderCue && (
        <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text)' }}>
          <span style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: 6 }}>Rider cue</span>
           — {exp.riderCue} — 
        </div>
      )}

      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Live validation ─—· {exp.targetLaps} laps vs {exp.baseline}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {exp.successCriteria.map(sc => (
            <span key={sc.metric} style={{ fontSize: 10, fontFamily: MONO, color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 5, padding: '3px 8px' }}>
              {sc.metric} <span style={{ color: 'var(--cyan)' }}>{sc.target}</span>
            </span>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <span style={{ fontSize: 11 }}><span style={{ color: 'var(--text-muted)' }}>Expected gain: </span><span style={{ color: 'var(--green)', fontFamily: MONO }}>{exp.expectedGain}</span></span>
        <span style={{ fontSize: 11 }}><span style={{ color: 'var(--text-muted)' }}>Risk: </span><span style={{ color: 'var(--yellow)' }}>{exp.risk}</span></span>
        <button onClick={() => onNav('black-box')} style={{ marginLeft: 'auto', fontSize: 10, fontFamily: MONO, color: 'var(--cyan)', background: 'none', border: '1px solid rgba(0,183,255,0.3)', borderRadius: 5, padding: '4px 9px', cursor: 'pointer' }}>
          log in Black Box  — 
        </button>
      </div>
    </div>
  );
}

function ResultCard({ exp, onNav }: { exp: Experiment; onNav: (t: 'knowledge') => void }) {
  const r = exp.result!;
  return (
    <div className="card" style={{ padding: 16,
 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)' }}>{exp.id} ─—· {exp.type}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', flex: 1 }}>{exp.title}</span>
        <StatusPill status={r.status} />
      </div>

      {/* before  —  after table */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr auto', gap: '4px 10px', fontSize: 11, marginBottom: 8 }}>
        <span style={{ fontSize: 8.5, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Metric</span>
        <span style={{ fontSize: 8.5, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Before</span>
        <span style={{ fontSize: 8.5, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase' }}>After</span>
        <span />
        {r.metrics.map(m => (
          <Row key={m.metric} m={m} />
        ))}
      </div>

      {r.improved && <div style={{ fontSize: 11, color: 'var(--text)' }}><span style={{ color: 'var(--green)' }}>Improved: </span>{r.improved}</div>}
      {r.worsened && <div style={{ fontSize: 11, color: 'var(--text)', marginTop: 2 }}><span style={{ color: 'var(--accent)' }}>Worsened: </span>{r.worsened}</div>}

      <div style={{ marginTop: 8, padding: '8px 11px', borderRadius: 'var(--radius)', background: 'rgba(0,230,118,0.05)', border: '1px solid rgba(0,230,118,0.2)' }}>
        <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--green)', textTransform: 'uppercase', marginBottom: 2 }}>Learning</div>
        <div style={{ fontSize: 11.5, color: 'var(--text)', lineHeight: 1.5 }}>{r.learning}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
        <ArrowRight size={13} style={{ color: 'var(--text-muted)' }} />
        <span style={{ fontSize: 11.5, color: 'var(--text-muted)', flex: 1 }}>{r.nextRecommendation}</span>
        {r.status !== 'rejected' && (
          <button onClick={() => onNav('knowledge')} style={{ fontSize: 9.5, fontFamily: MONO, color: 'var(--cyan)', background: 'none', border: 'none', cursor: 'pointer' }}>
             —  Knowledge Graph
          </button>
        )}
      </div>
    </div>
  );
}

function Row({ m }: { m: { metric: string; before: string; after: string; met: boolean } }) {
  return (
    <>
      <span style={{ color: 'var(--text)' }}>{m.metric}</span>
      <span style={{ fontFamily: MONO, color: 'var(--text-muted)' }}>{m.before}</span>
      <span style={{ fontFamily: MONO, color: m.met ? 'var(--green)' : 'var(--accent)' }}>{m.after}</span>
      {m.met ? <CheckCircle2 size={13} style={{ color: 'var(--green)' }} /> : <XCircle size={13} style={{ color: 'var(--accent)' }} />}
    </>
  );
}

export function ExperimentEnginePage() {
  const navigate = useNavigate();
  const garage = useGarage();
  const { ctx } = useSessionContext();
  const experiments = buildExperiments(
    garage.profile.rider.name,
    `${garage.profile.bike.brand} ${garage.profile.bike.model}`,
    ctx.circuitName,
  );
  const active = experiments.filter(e => e.status === 'running' || e.status === 'planned');
  const completed = experiments.filter(e => e.result);

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2"><TestTubes size={18} /> Performance Experiment Engine</h1>
          <p className="page-subtitle">Hypothesis ─—· test plan ─—· validation ─—· learning loop  —  {garage.profile.rider.name} ─—· {garage.profile.bike.brand} {garage.profile.bike.model} ─—· {ctx.circuitName}</p>
        </div>
      </div>

      {/* method loop strip */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginBottom: 16, fontSize: 9.5, fontFamily: MONO, color: 'var(--text-muted)' }}>
        {EXPERIMENT_LOOP.map((step, i) => (
          <span key={step} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: i === EXPERIMENT_LOOP.length - 1 ? 'var(--cyan)' : 'var(--text-muted)' }}>{step}</span>
            {i < EXPERIMENT_LOOP.length - 1 && <span style={{ color: 'rgba(255,255,255,0.2)' }}> — </span>}
          </span>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 16, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {active.map(e => <ActiveExperiment key={e.id} exp={e} onNav={navigate} />)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Result history & learning memory</div>
          {completed.map(e => <ResultCard key={e.id} exp={e} onNav={navigate} />)}
        </div>
      </div>
    </div>
  );
}
