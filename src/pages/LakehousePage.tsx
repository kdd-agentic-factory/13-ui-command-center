/**
 * LakehousePage — KDD Motorsport Data Lakehouse & Feature Store.
 *
 * The data foundation: six zones, a platform asset summary, a Query Studio over
 * the data, a data explorer, the feature store (+ a sample feature), event /
 * decision stores, the model registry, feature lineage, data versioning and the
 * privacy-aware federated export.
 */
import { useState } from 'react';
import { Database, Search, GitBranch, Boxes, Cpu, Lock } from 'lucide-react';
import { useGarage } from '../hooks/useGarage';
import { useSessionContext } from '../hooks/useSessionContext';
import { buildLakehouse } from '../domain/lakehouse';

const MONO = 'JetBrains Mono, monospace';

export function LakehousePage() {
  const garage = useGarage();
  const { ctx } = useSessionContext();
  const session = ctx.setup.stint ?? ctx.setup.session ?? 'Stint 03';
  const l = buildLakehouse(garage.profile.rider.name, `${garage.profile.bike.brand} ${garage.profile.bike.model}`, ctx.circuitName, session, garage.telemetryLimited);

  const [qid, setQid] = useState(l.queries[0].id);
  const q = l.queries.find(x => x.id === qid) ?? l.queries[0];
  const stat = (label: string, value: string | number) => (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 18, fontWeight: 800, fontFamily: MONO, color: 'var(--text)' }}>{value}</div>
      <div style={{ fontSize: 8.5, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</div>
    </div>
  );

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2"><Database size={18} /> Motorsport Data Lakehouse</h1>
          <p className="page-subtitle">Raw · clean · features · events · decisions · models · learning memory — {l.combo}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Data trust avg</div>
          <div style={{ fontSize: 24, fontWeight: 800, fontFamily: MONO, color: l.summary.dataTrustAvg >= 85 ? 'var(--green)' : 'var(--yellow)' }}>{l.summary.dataTrustAvg}%</div>
        </div>
      </div>

      {/* zones */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, marginBottom: 14 }}>
        {l.zones.map(z => (
          <div key={z.layer} className="card" style={{ padding: 10, borderTop: `2px solid ${z.status === 'Healthy' ? 'var(--green)' : 'var(--yellow)'}` }}>
            <div style={{ fontSize: 8.5, fontFamily: MONO, color: 'var(--text-muted)' }}>L{z.layer}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)' }}>{z.name}</div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', lineHeight: 1.3, marginTop: 2 }}>{z.desc}</div>
            <div style={{ fontSize: 9.5, fontFamily: MONO, color: 'var(--cyan)', marginTop: 4 }}>{z.count}</div>
          </div>
        ))}
      </div>

      {/* asset summary */}
      <div className="card mb-4" style={{ padding: 14, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        {stat('sessions', l.summary.sessions)}{stat('laps', l.summary.laps)}{stat('samples', l.summary.samples)}
        {stat('events', l.summary.events)}{stat('decisions', l.summary.decisions)}{stat('validated', l.summary.validatedLearnings)}
        {stat('features', l.summary.features.toLocaleString())}{stat('models', l.summary.models)}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Most repeated issue</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{l.summary.mostRepeatedIssue}</div>
        </div>
      </div>

      {/* query studio + explorer */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 14 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
            <Search size={14} style={{ color: 'var(--cyan)' }} />
            <span style={hdr}>Query studio</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
            {l.queries.map(x => (
              <button key={x.id} onClick={() => setQid(x.id)}
                style={{ fontSize: 10, fontFamily: MONO, padding: '4px 8px', borderRadius: 5, cursor: 'pointer', textAlign: 'left',
                  background: qid === x.id ? 'rgba(0,183,255,0.12)' : 'transparent', border: `1px solid ${qid === x.id ? 'var(--cyan)' : 'var(--border)'}`, color: qid === x.id ? 'var(--cyan)' : 'var(--text-muted)' }}>{x.query}</button>
            ))}
          </div>
          <div style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 3 }}>Result</div>
            <div style={{ fontSize: 12, color: 'var(--text)' }}>{q.result}</div>
          </div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={hdr}>Data explorer</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 8 }}>
            {Object.entries(l.explorer).map(([k, v]) => (
              <div key={k} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 800, fontFamily: MONO, color: 'var(--text)' }}>{v.toLocaleString()}</div>
                <div style={{ fontSize: 8, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{k}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 9.5, fontFamily: MONO, color: 'var(--text-muted)', marginTop: 8 }}>Circuit → Session → Lap → Corner → Event → Decision → Result</div>
        </div>
      </div>

      {/* feature store + sample feature */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 14, marginTop: 14 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}><Boxes size={14} style={{ color: 'var(--violet)' }} /><span style={hdr}>Feature store · {l.summary.features.toLocaleString()} sets</span></div>
          {l.featureGroups.map(g => (
            <div key={g.scope} style={{ marginBottom: 7 }}>
              <div style={{ fontSize: 9.5, fontFamily: MONO, color: 'var(--cyan)', textTransform: 'uppercase' }}>{g.scope}</div>
              <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{g.features.join(' · ')}</div>
            </div>
          ))}
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={hdr}>Sample feature (one source of truth)</div>
          <pre style={{ fontSize: 9.5, fontFamily: MONO, color: 'var(--text)', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 10, overflowX: 'auto', lineHeight: 1.5, marginTop: 8 }}>
{JSON.stringify(l.sampleFeature, null, 2)}
          </pre>
        </div>
      </div>

      {/* event + decision stores */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={hdr}>Event store</div>
          {l.events.map(e => (
            <div key={e.event} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, marginBottom: 5 }}>
              <span style={{ flex: 1, color: 'var(--text)' }}>{e.event}</span>
              <span style={{ fontSize: 9.5, fontFamily: MONO, color: 'var(--text-muted)' }}>{e.location}</span>
              <span style={{ fontSize: 9, fontFamily: MONO, color: e.outcome === 'Validated' ? 'var(--green)' : e.outcome === 'Recurring' ? 'var(--accent)' : 'var(--yellow)' }}>{e.outcome}</span>
            </div>
          ))}
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={hdr}>Decision store · linked to outcome</div>
          {l.decisions.map(d => (
            <div key={d.decision} style={{ marginBottom: 7 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text)', flex: 1 }}>{d.decision}</span>
                <span style={{ fontSize: 9, fontFamily: MONO, color: d.outcome === 'Validated' ? 'var(--green)' : 'var(--accent)' }}>{d.outcome}</span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>exp: {d.expected} · act: {d.actual}</div>
            </div>
          ))}
        </div>
      </div>

      {/* model registry + lineage */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 14, marginTop: 14 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}><Cpu size={14} style={{ color: 'var(--violet)' }} /><span style={hdr}>Model registry</span></div>
          {l.models.map(m => (
            <div key={m.model} style={{ marginBottom: 7, paddingBottom: 7, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text)', flex: 1 }}>{m.model}</span>
                <span style={{ fontSize: 9.5, fontFamily: MONO, color: 'var(--text-muted)' }}>{m.version}</span>
                <span style={{ fontSize: 9.5, fontFamily: MONO, color: 'var(--green)' }}>{m.score}</span>
                <span style={{ fontSize: 9, fontFamily: MONO, color: 'var(--cyan)' }}>{m.status}</span>
              </div>
              <div style={{ fontSize: 9.5, color: 'var(--text-muted)' }}>{m.limitation}</div>
            </div>
          ))}
        </div>
        <div className="card" style={{ padding: 16, borderLeft: '3px solid var(--cyan)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}><GitBranch size={14} style={{ color: 'var(--cyan)' }} /><span style={hdr}>Feature lineage · {l.lineage.confidence}%</span></div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{l.lineage.recommendation}</div>
          <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase', margin: '6px 0 3px' }}>Based on</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {l.lineage.basedOn.map(b => <span key={b} style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 5px' }}>{b}</span>)}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6 }}>Sources: {l.lineage.sources.join(' · ')}</div>
        </div>
      </div>

      {/* versioning + federated export */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 14, marginTop: 14 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={hdr}>Session versioning</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
            {l.versions.map((v, i) => (
              <span key={v.version} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10, fontFamily: MONO, color: i === l.versions.length - 1 ? 'var(--green)' : 'var(--text)' }}><b>{v.version}</b> {v.label}</span>
                {i < l.versions.length - 1 && <span style={{ color: 'rgba(255,255,255,0.2)' }}>→</span>}
              </span>
            ))}
          </div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}><Lock size={13} style={{ color: 'var(--green)' }} /><span style={hdr}>Federated export</span></div>
          <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--green)', textTransform: 'uppercase' }}>Shared (aggregated)</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>{l.federatedExport.shared.join(' · ')}</div>
          <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--accent)', textTransform: 'uppercase' }}>Never shared</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{l.federatedExport.notShared.join(' · ')}</div>
        </div>
      </div>
    </div>
  );
}

const hdr: React.CSSProperties = { fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase' };
