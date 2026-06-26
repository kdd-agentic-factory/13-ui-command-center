/**
 * RaceStrategyPage â€” KDD Race Strategy Command.
 *
 * The pit-wall decision surface: race sizing, tyre-degradation curve, the
 * pit / flag-to-flag window, ranked strategy options, undercut/overcut maths
 * vs a named rival, the armed weather trigger, a push/manage pace plan and the
 * live decision rules â€” ending in one defensible call.
 */
import { Flag, Circle, CloudRain, Swords, Timer, ListChecks, Gauge } from 'lucide-react';
import { useGarage } from '../hooks/useGarage';
import { useSessionContext } from '../hooks/useSessionContext';
import { buildRaceStrategy, riskColor } from '../domain/raceStrategy';

const MONO = 'JetBrains Mono, monospace';

export function RaceStrategyPage() {
  const garage = useGarage();
  const { ctx, circuit } = useSessionContext();
  const s = buildRaceStrategy(
    garage.profile.rider.name,
    `${garage.profile.bike.brand} ${garage.profile.bike.model}`,
    ctx.circuitName, circuit.lengthKm, circuit.turns,
  );
  const maxDeg = Math.max(...s.degCurve.map(d => d.paceDelta), 0.1);
  const modeColor = (m: string) => m === 'attack' ? 'var(--accent)' : m === 'push' ? 'var(--cyan)' : 'var(--yellow)';

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2"><Flag size={18} /> Race Strategy Command</h1>
          <p className="page-subtitle">Recommended: {s.recommendedStrategy} â€” {s.combo}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Confidence</div>
          <div style={{ fontSize: 24, fontWeight: 800, fontFamily: MONO, color: s.confidence >= 0.8 ? 'var(--green)' : 'var(--yellow)' }}>{Math.round(s.confidence * 100)}%</div>
        </div>
      </div>

      {/* verdict banner */}
      <div className="card mb-4" style={{ padding: 14,
 }}>
        <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>KDD verdict</div>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>{s.verdict}</div>
        <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 4, fontStyle: 'italic' }}>{s.punchline}</div>
      </div>

      {/* race sizing */}
      <div className="card mb-4" style={{ padding: 12, display: 'flex', gap: 26, flexWrap: 'wrap' }}>
        {[['Race laps', s.raceLaps], ['Distance', `${s.raceKm} km`], ['Lap length', `${s.lengthKm} km`], ['Window', `L${s.pitWindow.openLap}â€“${s.pitWindow.closeLap}`], ['Optimal', `L${s.pitWindow.optimalLap}`]].map(([k, v]) => (
        <div key={k as string}><div style={{ fontSize: 16, fontWeight: 800, fontFamily: MONO, color: 'var(--text)' }}>{v}</div><div style={{ fontSize: 8.5, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{k}</div></div>
        ))}
      </div>

      {/* tyre deg curve */}
      <div className="card" style={{ padding: 16, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}><Timer size={14} style={{ color: 'var(--cyan)' }} /><span style={hdr}>Rear tyre degradation Â· pace lost vs fresh (s/lap)</span></div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 88 }}>
          {s.degCurve.map(d => {
            const past = d.lap > s.pitWindow.closeLap - 1;
            const cliff = d.paceDelta > maxDeg * 0.7;
            return (
              <div key={d.lap} title={`Lap ${d.lap}: +${d.paceDelta.toFixed(2)} s/lap`} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', height: '100%' }}>
                <span style={{ width: '100%', height: `${Math.max(4, (d.paceDelta / maxDeg) * 100)}%`, background: cliff ? 'var(--accent)' : past ? 'var(--yellow)' : 'var(--cyan)', borderRadius: '2px 2px 0 0' }} />
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8.5, fontFamily: MONO, color: 'var(--text-muted)', marginTop: 4 }}>
          <span>Lap 1</span><span style={{ color: 'var(--accent)' }}>â—¤ rear cliff â‰ˆ L{s.pitWindow.closeLap}</span><span>Lap {s.raceLaps}</span>
        </div>
      </div>

      {/* compounds + strategy options */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}><Circle size={14} style={{ color: 'var(--cyan)' }} /><span style={hdr}>Tyre compounds</span></div>
          {s.compounds.map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, marginBottom: 6 }}>
              <span style={{ fontWeight: 700, color: 'var(--text)', width: 96 }}>{c.position} {c.name}</span>
              <span style={{ fontFamily: MONO, fontSize: 9.5, color: 'var(--text-muted)', width: 92 }}>{c.degPerLap.toFixed(3)} s/lap</span>
              <span style={{ fontSize: 9, fontFamily: MONO, color: 'var(--cyan)', width: 78 }}>{c.window}</span>
              <span style={{ fontSize: 9.5, color: 'var(--text-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.note}>{c.note}</span>
            </div>
          ))}
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}><Gauge size={14} style={{ color: 'var(--violet)' }} /><span style={hdr}>Strategy options Â· ranked</span></div>
          {s.options.map(o => (
            <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, marginBottom: 6, opacity: o.recommended ? 1 : 0.82 }}>
              <span style={{ width: 7, height: 7, borderRadius: 999, background: o.recommended ? 'var(--green)' : 'var(--text-muted)', flexShrink: 0 }} />
              <span style={{ fontWeight: o.recommended ? 700 : 600, color: 'var(--text)', flex: 1 }}>{o.name}{o.recommended && <span style={{ fontSize: 8, fontFamily: MONO, color: 'var(--green)', marginLeft: 6 }}>PICK</span>}</span>
              <span style={{ fontFamily: MONO, fontSize: 9.5, color: o.projectedDelta === 0 ? 'var(--green)' : 'var(--text-muted)', width: 46, textAlign: 'right' }}>{o.projectedDelta === 0 ? 'base' : `+${o.projectedDelta.toFixed(1)}s`}</span>
              <span style={{ fontSize: 8.5, fontFamily: MONO, color: riskColor(o.risk), border: `1px solid ${riskColor(o.risk)}`, borderRadius: 3, padding: '0 5px' }}>{o.risk}</span>
            </div>
          ))}
          <div style={{ fontSize: 9.5, color: 'var(--text-muted)', marginTop: 4 }}>Î” = projected race time vs the recommended baseline.</div>
        </div>
      </div>

      {/* rival + weather */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 14, marginTop: 14 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}><Swords size={14} style={{ color: 'var(--accent)' }} /><span style={hdr}>Rival battle Â· undercut vs overcut</span></div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{s.rival.rival}</span>
            <span style={{ fontFamily: MONO, fontSize: 12, color: 'var(--text)' }}>+{s.rival.gap.toFixed(1)}s</span>
            <span style={{ fontSize: 9.5, fontFamily: MONO, color: s.rival.trend === 'closing' ? 'var(--accent)' : 'var(--text-muted)' }}>{s.rival.trend}</span>
            <span style={{ fontSize: 8.5, fontFamily: MONO, color: 'var(--cyan)', border: '1px solid var(--cyan)', borderRadius: 3, padding: '0 6px', textTransform: 'uppercase' }}>{s.rival.move}</span>
            <span style={{ fontFamily: MONO, fontSize: 9.5, color: 'var(--green)' }}>+{s.rival.gainPerLap.toFixed(2)} s/lap</span>
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginBottom: 4 }}>Edge: <span style={{ color: 'var(--text)' }}>{s.rival.where}</span></div>
          <div style={{ fontSize: 11.5, color: 'var(--text)', fontWeight: 600 }}>{s.rival.verdict}</div>
        </div>
        <div className="card" style={{ padding: 16,
 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}><CloudRain size={14} style={{ color: 'var(--yellow)' }} /><span style={hdr}>Weather trigger</span></div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{s.weather.condition}</div>
          <div style={{ display: 'flex', gap: 14, margin: '6px 0', fontSize: 11, fontFamily: MONO }}>
            <span>prob <b style={{ color: s.weather.probability >= 0.5 ? 'var(--accent)' : 'var(--text)' }}>{Math.round(s.weather.probability * 100)}%</b></span>
            <span>by <b style={{ color: 'var(--text)' }}>L{s.weather.byLap}</b></span>
            <span style={{ color: s.weather.armed ? 'var(--yellow)' : 'var(--text-muted)' }}>{s.weather.armed ? 'â— armed' : 'â—‹ idle'}</span>
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--yellow)' }}>{s.weather.action}</div>
        </div>
      </div>

      {/* phase plan */}
      <div className="card" style={{ padding: 16, marginTop: 14 }}>
        <div style={hdr}>Pace plan Â· push / manage by phase</div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${s.phasePlan.length}, 1fr)`, gap: 10, marginTop: 8 }}>
          {s.phasePlan.map(p => (
            <div key={p.phase} style={{ borderTop: `2px solid ${modeColor(p.mode)}`, paddingTop: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)' }}>{p.phase}</div>
              <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)' }}>Laps {p.laps}</div>
              <div style={{ fontSize: 8.5, fontFamily: MONO, color: modeColor(p.mode), textTransform: 'uppercase', margin: '2px 0' }}>{p.mode}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{p.target}</div>
            </div>
          ))}
        </div>
      </div>

      {/* triggers + contingency */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 14, marginTop: 14 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}><ListChecks size={14} style={{ color: 'var(--cyan)' }} /><span style={hdr}>Live decision rules</span></div>
          {s.triggers.map((t, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, fontSize: 10.5, marginBottom: 5, alignItems: 'baseline' }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: riskColor(t.priority), flexShrink: 0, marginTop: 4 }} />
              <span style={{ color: 'var(--text-muted)' }}>IF <span style={{ color: 'var(--text)' }}>{t.when}</span> â†’ <span style={{ color: 'var(--cyan)' }}>{t.then}</span></span>
            </div>
          ))}
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={hdr}>Contingencies</div>
          {s.contingency.map((c, i) => (
            <div key={i} style={{ fontSize: 10.5, color: 'var(--text-muted)', marginBottom: 5 }}>â€¢ {c}</div>
          ))}
        </div>
      </div>

      <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', marginTop: 14, fontStyle: 'italic' }}>
        Representative strategy model derived from circuit length + corner count. Not a live timing or weather-radar feed.
      </div>
    </div>
  );
}

const hdr: React.CSSProperties = { fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase' };
