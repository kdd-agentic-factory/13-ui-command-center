/**
 * EngineeringControlPage – KDD Engineering Control (unified garage board).
 *
 * Composes the six engineering pillars – Aero, Chassis, Brakes, Electronics,
 * Fuel and Gearing – into one readiness board. Each card shows the pillar's
 * headline + key metric, is colour-coded by status and links straight to that
 * lab. The open item (worst status) is called out at the top.
 */
import { SlidersHorizontal, ChevronRight, AlertTriangle } from 'lucide-react';
import { useGarage } from '../hooks/useGarage';
import { useSessionContext } from '../hooks/useSessionContext';
import { useNavigate } from '../context/NavContext';
import { buildEngineeringControl, engCardColor } from '../domain/engineeringControl';

const MONO = 'JetBrains Mono, monospace';

export function EngineeringControlPage() {
  const garage = useGarage();
  const { ctx, circuit } = useSessionContext();
  const navigate = useNavigate();
  const e = buildEngineeringControl(
    garage.profile.rider.name,
    `${garage.profile.bike.brand} ${garage.profile.bike.model}`,
    ctx.circuitName, circuit.lengthKm, circuit.turns, circuit.mainStraightKm,
  );

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2"><SlidersHorizontal size={18} /> Engineering Control</h1>
          <p className="page-subtitle">Aero · Chassis · Brakes · Electronics · Fuel · Gearing – one board – {e.combo}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Setup readiness</div>
          <div style={{ fontSize: 24, fontWeight: 800, fontFamily: MONO, color: e.readinessPct >= 80 ? 'var(--green)' : 'var(--yellow)' }}>{e.readinessPct}%</div>
        </div>
      </div>

      {/* verdict */}
      <div className="card mb-4" style={{ padding: 14,
 }}>
        <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>KDD verdict</div>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>{e.verdict}</div>
        <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 4, fontStyle: 'italic' }}>{e.punchline}</div>
      </div>

      {/* open item */}
      {e.priority.status !== 'good' && (
        <button onClick={() => navigate(e.priority.tab)} style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, padding: 12, marginBottom: 14, background: 'var(--bg-surface)', border: `1px solid ${engCardColor(e.priority.status)}`, borderRadius: 8, cursor: 'pointer' }}>
          <AlertTriangle size={16} style={{ color: engCardColor(e.priority.status), flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Open item: <b style={{ color: 'var(--text)' }}>{e.priority.title}</b> – {e.priority.headline}</span>
          <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontFamily: MONO, color: engCardColor(e.priority.status) }}>open <ChevronRight size={13} /></span>
        </button>
      )}

      {/* readiness board */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 }}>
        {e.cards.map(c => (
          <button key={c.tab} onClick={() => navigate(c.tab)} className="card" style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 8, padding: 16, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderTop: `3px solid ${engCardColor(c.status)}`, borderRadius: 8, cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 9, height: 9, borderRadius: 999, background: engCardColor(c.status), flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{c.title}</span>
              <ChevronRight size={13} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 22, fontWeight: 800, fontFamily: MONO, color: engCardColor(c.status) }}>{c.metric}</span>
              <span style={{ fontSize: 8.5, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{c.metricLabel}</span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4 }}>{c.headline}</div>
          </button>
        ))}
      </div>

      <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', marginTop: 14, fontStyle: 'italic' }}>
        Each card is sourced live from its own lab – open it to tune it. Composed view, deterministic.
      </div>
    </div>
  );
}

export default EngineeringControlPage;
