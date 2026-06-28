/**
 * EventEnginePage â¢Ã¢—š¬—” Telemetry Event Engine.
 *
 * From raw telemetry to race intelligence: a filterable event timeline, a
 * per-corner event map, the selected event card (evidence â¢—Â —â„¢ cause â¢—Â —â„¢ impact â¢—Â —â„¢
 * recommendation â¢—Â —â„¢ action), root-cause clusters and the Oracle's event context.
 */
import { useState } from 'react';
import { Zap, MapPin, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { useGarage } from '../hooks/useGarage';
import { useSessionContext } from '../hooks/useSessionContext';
import { buildEventEngine, severityColor, categoryColor, EVENT_CATEGORIES, EventCategory } from '../domain/eventEngine';

const MONO = 'JetBrains Mono, monospace';
type Filter = 'all' | 'critical' | 'resolved' | EventCategory;

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 22, fontWeight: 800, fontFamily: MONO, color }}>{value}</div>
      <div style={{ fontSize: 8.5, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</div>
    </div>
  );
}

export function EventEnginePage() {
  const garage = useGarage();
  const { ctx } = useSessionContext();
  const session = ctx.setup.stint ?? ctx.setup.session ?? 'Stint 03';
  const eng = buildEventEngine(garage.profile.rider.name, `${garage.profile.bike.brand} ${garage.profile.bike.model}`, ctx.circuitName, session, garage.telemetryLimited);

  const [filter, setFilter] = useState<Filter>('all');
  const [selId, setSelId] = useState<string>(eng.mainEvent.id);

  const filtered = eng.events.filter(e =>
    filter === 'all' ? true
    : filter === 'critical' ? e.severity === 'critical'
    : filter === 'resolved' ? e.resolved
    : e.category === filter);
  const sel = eng.events.find(e => e.id === selId) ?? eng.events[0];

  const FILTERS: Filter[] = ['all', 'critical', ...EVENT_CATEGORIES, 'resolved'];

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2"><Zap size={18} /> Telemetry Event Engine</h1>
          <p className="page-subtitle">From raw telemetry to race intelligence â¢Ã¢—š¬—” {eng.combo}</p>
        </div>
      </div>

      {/* Summary */}
      <div className="card mb-4" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <Stat label="events" value={eng.summary.total} color="var(--text)" />
        <Stat label="critical" value={eng.summary.critical} color="var(--accent)" />
        <Stat label="performance" value={eng.summary.performance} color="var(--green)" />
        <Stat label="risk" value={eng.summary.risk} color="var(--accent)" />
        <Stat label="rider" value={eng.summary.rider} color="var(--cyan)" />
        <Stat label="setup" value={eng.summary.setup} color="var(--yellow)" />
        <Stat label="data" value={eng.summary.data} color="var(--violet)" />
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Main event</div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: severityColor(eng.mainEvent.severity) }}>{eng.mainEvent.corner} â—š—· {eng.mainEvent.name}</div>
          <div style={{ fontSize: 10, fontFamily: MONO, color: 'var(--text-muted)' }}>{eng.mainEvent.impact}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ fontSize: 10, fontFamily: MONO, padding: '3px 9px', borderRadius: 5, cursor: 'pointer', textTransform: 'capitalize',
              background: filter === f ? 'rgba(0,183,255,0.12)' : 'transparent', border: `1px solid ${filter === f ? 'var(--cyan)' : 'var(--border)'}`, color: filter === f ? 'var(--cyan)' : 'var(--text-muted)' }}>
            {f}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
        {/* Timeline */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>Event timeline â—š—· {filtered.length}</div>
          <div style={{ position: 'relative', paddingLeft: 4 }}>
            {filtered.map((e, i) => (
              <div key={e.id} onClick={() => setSelId(e.id)} style={{ display: 'flex', gap: 10, paddingBottom: 12, cursor: 'pointer', position: 'relative' }}>
                {i < filtered.length - 1 && <span style={{ position: 'absolute', left: 5, top: 14, bottom: 0, width: 1, background: 'rgba(255,255,255,0.1)' }} />}
                <span style={{ width: 11, height: 11, borderRadius: 999, background: severityColor(e.severity), marginTop: 2, flexShrink: 0, boxShadow: `0 0 6px ${severityColor(e.severity)}`, opacity: e.resolved ? 0.5 : 1 }} />
                <div style={{ flex: 1, opacity: e.id === selId ? 1 : 0.85 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 9.5, fontFamily: MONO, color: 'var(--text-muted)' }}>L{e.lap} â—š—· {e.corner}</span>
                    <span style={{ fontSize: 8.5, fontFamily: MONO, color: categoryColor(e.category), border: `1px solid ${categoryColor(e.category)}`, borderRadius: 3, padding: '0 4px' }}>{e.category}</span>
                    {e.resolved && <CheckCircle2 size={11} style={{ color: 'var(--green)' }} />}
                  </div>
                  <div style={{ fontSize: 12, color: e.id === selId ? 'var(--text)' : 'var(--text)', fontWeight: e.id === selId ? 700 : 400 }}>{e.name} <span style={{ fontFamily: MONO, fontSize: 10, color: severityColor(e.severity) }}>{e.impact}</span></div>
                </div>
              </div>
            ))}
          </div>

          {/* Corner event map */}
          <div style={{ marginTop: 8, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <MapPin size={12} style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Event map</span>
            </div>
            {eng.cornerMap.map(c => (
              <div key={c.corner} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <span style={{ width: 130, fontSize: 10.5, color: 'var(--text)' }}>{c.corner}</span>
                <span style={{ fontSize: 10, fontFamily: MONO, color: severityColor(c.topSeverity) }}>{c.total} event{c.total === 1 ? '' : 's'}</span>
                <div style={{ display: 'flex', gap: 3, marginLeft: 'auto' }}>
                  {c.categories.map(cat => <span key={cat} title={cat} style={{ width: 8, height: 8, borderRadius: 999, background: categoryColor(cat) }} />)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected event card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card" style={{ padding: 16,
 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', flex: 1 }}>{sel.name}</span>
              <span style={{ fontSize: 9, fontFamily: MONO, color: severityColor(sel.severity), border: `1px solid ${severityColor(sel.severity)}`, borderRadius: 4, padding: '1px 7px', textTransform: 'uppercase' }}>{sel.severity}</span>
            </div>
            <div style={{ fontSize: 10.5, fontFamily: MONO, color: 'var(--text-muted)', marginBottom: 8 }}>L{sel.lap} â—š—· {sel.corner} â—š—· {sel.phase} phase â—š—· <span style={{ color: categoryColor(sel.category) }}>{sel.category}</span></div>
            <div style={{ fontSize: 12, color: 'var(--text)', marginBottom: 8 }}>{sel.pattern}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
              {sel.evidence.map(ev => <span key={ev} style={{ fontSize: 9.5, fontFamily: MONO, color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 5, padding: '2px 7px' }}>{ev}</span>)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', fontSize: 11.5, marginBottom: 8 }}>
              <div><span style={{ color: 'var(--text-muted)' }}>Impact: </span><span style={{ color: severityColor(sel.severity), fontFamily: MONO }}>{sel.impact}</span></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Cause: </span><span style={{ color: 'var(--text)' }}>{sel.cause}</span></div>
            </div>
            <div style={{ padding: '8px 11px', borderRadius: 'var(--radius)', background: 'rgba(0,230,118,0.05)', border: '1px solid rgba(0,230,118,0.2)', fontSize: 11.5, color: 'var(--text)', marginBottom: 6 }}>
              <b style={{ color: 'var(--green)' }}>Recommendation:</b> {sel.recommendation}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5 }}>
              <ArrowRight size={13} style={{ color: 'var(--cyan)' }} />
              <span><span style={{ color: 'var(--text-muted)' }}>Action: </span><span style={{ color: 'var(--cyan)' }}>{sel.action}</span></span>
            </div>
          </div>

          {/* Clusters */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>Event clusters â—š—· root cause</div>
            {eng.clusters.map(cl => (
              <div key={cl.name} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text)', flex: 1 }}>{cl.name}</span>
                  <span style={{ fontSize: 9.5, fontFamily: MONO, color: 'var(--accent)' }}>{cl.avgLoss} â—š—· {cl.frequency}</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, margin: '4px 0' }}>
                  {cl.events.map(e => <span key={e} style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 6px' }}>{e}</span>)}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{cl.rootCause}</div>
              </div>
            ))}
          </div>

          {/* Oracle context */}
          <div className="card" style={{ padding: 14, background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
              <Sparkles size={14} style={{ color: 'var(--violet)' }} />
              <span style={{ fontSize: 9, fontFamily: MONO, color: 'var(--violet)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Oracle event context</span>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text)', lineHeight: 1.5 }}>{eng.oracleContext}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
