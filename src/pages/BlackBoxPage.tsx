/**
 * BlackBoxPage — KDD Black Box / Race Decision Timeline.
 *
 * The session's flight recorder: a chronological timeline of every telemetry
 * event, risk alert, Oracle verdict, engineer action and outcome, plus
 * decision cards (detection → recommendation → applied → result → status).
 * The box doesn't just analyse — it remembers, justifies and proves.
 */
import { CircleDot, CheckCircle2, XCircle, Clock3 } from 'lucide-react';
import { useGarage } from '../hooks/useGarage';
import { useSessionContext } from '../hooks/useSessionContext';
import { buildBlackBox, eventColor, kindColor, DecisionRecord } from '../domain/pitMemory';

const MONO = 'JetBrains Mono, monospace';

function StatusBadge({ status }: { status: DecisionRecord['status'] }) {
  const map = {
    validated: ['VALIDATED', 'var(--green)', CheckCircle2],
    rejected: ['REJECTED', 'var(--accent)', XCircle],
    pending: ['PENDING', 'var(--yellow)', Clock3],
  } as const;
  const [label, color, Icon] = map[status];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 9, fontFamily: MONO, color, border: `1px solid ${color}`, borderRadius: 4, padding: '1px 6px' }}>
      <Icon size={10} />{label}
    </span>
  );
}

export function BlackBoxPage() {
  const garage = useGarage();
  const { ctx } = useSessionContext();
  const session = ctx.setup.stint ?? ctx.setup.session ?? 'Stint 03';
  const bb = buildBlackBox(garage.profile.rider.name, `${garage.profile.bike.brand} ${garage.profile.bike.model}`, ctx.circuitName, session);

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2"><CircleDot size={18} /> KDD Black Box</h1>
          <p className="page-subtitle">Decision memory · evidence · outcome learning — {ctx.circuitName} · {garage.profile.rider.name} · {garage.profile.bike.brand} {garage.profile.bike.model} · {session}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
        {/* Timeline */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>Decision timeline</div>
          <div style={{ position: 'relative', paddingLeft: 4 }}>
            {bb.timeline.map((e, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, paddingBottom: 14, position: 'relative' }}>
                {/* rail */}
                {i < bb.timeline.length - 1 && <span style={{ position: 'absolute', left: 5, top: 14, bottom: 0, width: 1, background: 'rgba(255,255,255,0.1)' }} />}
                <span style={{ width: 11, height: 11, borderRadius: 999, background: kindColor(e.kind), marginTop: 2, flexShrink: 0, boxShadow: `0 0 6px ${kindColor(e.kind)}` }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10.5, color: 'var(--text-muted)' }}>{e.time}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: eventColor(e.source) }}>{e.source}</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text)', marginTop: 2, lineHeight: 1.45 }}>{e.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Decision cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Decision cards</div>
          {bb.decisions.map(d => (
            <div key={d.id} className="card" style={{ padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', flex: 1 }}>{d.decision}</span>
                <StatusBadge status={d.status} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>{d.reason}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
                {d.evidence.map(ev => (
                  <span key={ev} style={{ fontSize: 9.5, fontFamily: MONO, color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 5, padding: '2px 7px' }}>{ev}</span>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 11 }}>
                <div><span style={{ color: 'var(--text-muted)' }}>Expected: </span><span style={{ color: 'var(--text)' }}>{d.expectedEffect}</span></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Applied: </span><span style={{ color: d.applied ? 'var(--green)' : 'var(--text-muted)' }}>{d.applied ? 'Yes' : 'No'}</span></div>
                <div style={{ gridColumn: 'span 2' }}><span style={{ color: 'var(--text-muted)' }}>Result: </span><span style={{ color: d.result === '—' ? 'var(--yellow)' : 'var(--green)', fontFamily: MONO }}>{d.result}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default BlackBoxPage;
