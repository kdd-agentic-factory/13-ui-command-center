/**
 * RaceControlPage — KDD Race Control & Compliance.
 *
 * The team's officiating surface: flag state, the track-limit count creeping
 * toward a long-lap penalty, penalties pending/served, incidents under
 * investigation and the scrutineering / parc-fermé checklist — so a result
 * isn't lost to a rule that could have been managed.
 */
import { Gavel, Flag, AlertTriangle, ClipboardCheck, ListChecks } from 'lucide-react';
import { useGarage } from '../hooks/useGarage';
import { useSessionContext } from '../hooks/useSessionContext';
import { buildRaceControl, checkColor, flagColor } from '../domain/raceControl';

const MONO = 'JetBrains Mono, monospace';
const penColor = (s: string) => s === 'pending' ? 'var(--accent)' : s === 'investigation' ? 'var(--yellow)' : 'var(--text-muted)';

export function RaceControlPage() {
  const garage = useGarage();
  const { ctx, circuit } = useSessionContext();
  const r = buildRaceControl(
    garage.profile.rider.name,
    `${garage.profile.bike.brand} ${garage.profile.bike.model}`,
    ctx.circuitName, circuit.turns,
  );

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2"><Gavel size={18} /> Race Control & Compliance</h1>
          <p className="page-subtitle">Track limits, penalties & scrutineering — {r.combo}</p>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Flag</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 12, height: 12, borderRadius: 3, background: flagColor(r.flag) }} /><span style={{ fontSize: 13, fontWeight: 800, fontFamily: MONO, color: 'var(--text)', textTransform: 'uppercase' }}>{r.flag}</span></div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Penalty risk</div>
            <div style={{ fontSize: 20, fontWeight: 800, fontFamily: MONO, color: checkColor(r.penaltyRisk), textTransform: 'uppercase' }}>{r.penaltyRisk === 'pass' ? 'low' : r.penaltyRisk === 'check' ? 'watch' : 'high'}</div>
          </div>
        </div>
      </div>

      {/* verdict */}
      <div className="card mb-4" style={{ padding: 14, borderLeft: `3px solid ${checkColor(r.penaltyRisk)}` }}>
        <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>KDD verdict</div>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>{r.verdict}</div>
        <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 4, fontStyle: 'italic' }}>{r.punchline}</div>
      </div>

      {/* track limits */}
      <div className="card mb-4" style={{ padding: 16, borderLeft: `3px solid ${checkColor(r.trackLimits.status)}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}><AlertTriangle size={14} style={{ color: checkColor(r.trackLimits.status) }} /><span style={hdr}>Track limits · {r.trackLimits.warnings} / {r.trackLimits.limit} strikes</span></div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          {Array.from({ length: r.trackLimits.limit }, (_, i) => (
            <span key={i} style={{ flex: 1, height: 10, borderRadius: 3, background: i < r.trackLimits.warnings ? checkColor(r.trackLimits.status) : 'var(--border)' }} />
          ))}
          <span style={{ flex: 0.5, height: 10, borderRadius: 3, background: 'var(--accent)', opacity: 0.4 }} title="4th = long lap" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {r.trackLimits.corners.map(c => (
            <div key={c.corner} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10.5 }}>
              <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 800, color: c.count >= 2 ? 'var(--accent)' : c.count === 1 ? 'var(--yellow)' : 'var(--text-muted)' }}>{c.count}</span>
              <span style={{ color: 'var(--text-muted)' }}>{c.corner}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 9.5, color: 'var(--text-muted)', marginTop: 8 }}>{r.trackLimits.note}</div>
      </div>

      {/* penalties + incidents */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}><Gavel size={14} style={{ color: 'var(--cyan)' }} /><span style={hdr}>Penalties</span></div>
          {r.penalties.map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 8, fontSize: 10.5, marginBottom: 6 }}>
              <span style={{ fontSize: 8, fontFamily: MONO, color: penColor(p.status), border: `1px solid ${penColor(p.status)}`, borderRadius: 3, padding: '0 5px', textTransform: 'uppercase' }}>{p.status}</span>
              <div>
                <div style={{ color: 'var(--text)', fontWeight: 600 }}>{p.type}</div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{p.detail}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}><Flag size={14} style={{ color: 'var(--violet)' }} /><span style={hdr}>Incident log</span></div>
          {r.incidents.map((inc, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 8, fontSize: 10.5, marginBottom: 6 }}>
              <span style={{ fontFamily: MONO, fontSize: 9, color: 'var(--text-muted)', width: 36 }}>L{inc.lap}</span>
              <div>
                <div style={{ color: 'var(--text)' }}>{inc.type}</div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>→ {inc.outcome}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* scrutineering + recommendations */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 14, marginTop: 14 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}><ClipboardCheck size={14} style={{ color: 'var(--cyan)' }} /><span style={hdr}>Scrutineering · parc fermé</span></div>
          {r.scrutineering.map(c => (
            <div key={c.item} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10.5, marginBottom: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: checkColor(c.status), flexShrink: 0 }} />
              <span style={{ color: 'var(--text)', width: 170 }}>{c.item}</span>
              <span style={{ fontSize: 9, color: 'var(--text-muted)', flex: 1 }}>{c.note}</span>
            </div>
          ))}
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}><ListChecks size={14} style={{ color: 'var(--cyan)' }} /><span style={hdr}>Compliance plan</span></div>
          {r.recommendations.map((rec, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, fontSize: 10.5, marginBottom: 5, alignItems: 'baseline' }}>
              <span style={{ color: 'var(--cyan)', fontFamily: MONO }}>{i + 1}</span>
              <span style={{ color: 'var(--text-muted)' }}>{rec}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', marginTop: 14, fontStyle: 'italic' }}>
        Representative race-control model. Not a live Race Direction feed.
      </div>
    </div>
  );
}

const hdr: React.CSSProperties = { fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase' };
