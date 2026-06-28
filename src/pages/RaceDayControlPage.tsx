/**
 * RaceDayControlPage —” KDD Race Day Control (unified race-day surface).
 *
 * Composes the five race-day modules —” Strategy, Weather, Tyres, Tyre Pressure
 * and Fuel —” into one status board. Each card shows the module's headline + key
 * metric, is colour-coded by status, and links straight to that module. The
 * watch item (worst status) is called out at the top.
 */
import { ClipboardList, ChevronRight, AlertTriangle } from 'lucide-react';
import { useGarage } from '../hooks/useGarage';
import { useSessionContext } from '../hooks/useSessionContext';
import { useNavigate } from '../context/NavContext';
import { buildRaceDayControl, cardStatusColor } from '../domain/raceDayControl';

const MONO = 'JetBrains Mono, monospace';

export function RaceDayControlPage() {
  const garage = useGarage();
  const { ctx, circuit } = useSessionContext();
  const navigate = useNavigate();
  const r = buildRaceDayControl(
    garage.profile.rider.name,
    `${garage.profile.bike.brand} ${garage.profile.bike.model}`,
    ctx.circuitName, circuit.lengthKm, circuit.turns,
  );

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2"><ClipboardList size={18} /> Race Day Control</h1>
          <p className="page-subtitle">Strategy · Weather · Tyres · Pressure · Fuel —” one board · {r.raceLaps} laps —” {r.combo}</p>
        </div>
        <div style={{ display: 'flex', gap: 16, textAlign: 'right' }}>
          {[['green', r.counts.good, 'var(--green)'], ['watch', r.counts.warn, 'var(--yellow)'], ['risk', r.counts.bad, 'var(--accent)']].map(([k, v, c]) => (
            <div key={k as string}><div style={{ fontSize: 22, fontWeight: 800, fontFamily: MONO, color: c as string }}>{v}</div><div style={{ fontSize: 8.5, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{k}</div></div>
          ))}
        </div>
      </div>

      {/* verdict / watch item */}
      <div className="card mb-4" style={{ padding: 14,
 }}>
        <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>KDD verdict</div>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>{r.verdict}</div>
        <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 4, fontStyle: 'italic' }}>{r.punchline}</div>
      </div>

      {/* priority callout */}
      {r.priority.status !== 'good' && (
        <button onClick={() => navigate(r.priority.tab)} style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, padding: 12, marginBottom: 14, background: 'var(--bg-surface)', border: `1px solid ${cardStatusColor(r.priority.status)}`, borderRadius: 8, cursor: 'pointer' }}>
          <AlertTriangle size={16} style={{ color: cardStatusColor(r.priority.status), flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Watch item: <b style={{ color: 'var(--text)' }}>{r.priority.title}</b> —” {r.priority.headline}</span>
          <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontFamily: MONO, color: cardStatusColor(r.priority.status) }}>open <ChevronRight size={13} /></span>
        </button>
      )}

      {/* status board */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        {r.cards.map(c => (
          <button key={c.tab} onClick={() => navigate(c.tab)} style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 8, padding: 16, background: 'var(--color-surface, var(--bg-surface))', border: '1px solid var(--border)', borderTop: `3px solid ${cardStatusColor(c.status)}`, borderRadius: 8, cursor: 'pointer' }} className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 9, height: 9, borderRadius: 999, background: cardStatusColor(c.status), flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{c.title}</span>
              <ChevronRight size={13} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 22, fontWeight: 800, fontFamily: MONO, color: cardStatusColor(c.status) }}>{c.metric}</span>
              <span style={{ fontSize: 8.5, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{c.metricLabel}</span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4 }}>{c.headline}</div>
          </button>
        ))}
      </div>

      <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', marginTop: 14, fontStyle: 'italic' }}>
        Each card is sourced live from its own module —” open it for the full picture. Composed view, deterministic.
      </div>
    </div>
  );
}
