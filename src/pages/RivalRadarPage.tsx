/**
 * RivalRadarPage — KDD Rival Radar / Grid Intelligence.
 *
 * The competitive picture: the grid read with per-rival threat, the
 * sector-by-sector edge against the top threat, the real overtaking zones,
 * the grid-start projection and the head-to-head plan — ending in one call on
 * who to fear, where, and how to beat them.
 */
import { Radar, Swords, Crosshair, Flag, Target } from 'lucide-react';
import { useGarage } from '../hooks/useGarage';
import { useSessionContext } from '../hooks/useSessionContext';
import { buildRivalRadar, threatColor } from '../domain/rivalRadar';

const MONO = 'JetBrains Mono, monospace';

export function RivalRadarPage() {
  const garage = useGarage();
  const { ctx, circuit } = useSessionContext();
  const r = buildRivalRadar(
    garage.profile.rider.name,
    `${garage.profile.bike.brand} ${garage.profile.bike.model}`,
    ctx.circuitName, circuit.turns,
  );
  const maxEdge = Math.max(...r.sectorEdge.map(s => Math.abs(s.deltaS)), 0.01);
  const diffColor = (d: string) => d === 'easy' ? 'var(--green)' : d === 'medium' ? 'var(--yellow)' : 'var(--accent)';

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2"><Radar size={18} /> Rival Radar · Grid Intelligence</h1>
          <p className="page-subtitle">Top threat: {r.topThreat} — {r.combo}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Confidence</div>
          <div style={{ fontSize: 24, fontWeight: 800, fontFamily: MONO, color: r.confidence >= 0.8 ? 'var(--green)' : 'var(--yellow)' }}>{Math.round(r.confidence * 100)}%</div>
        </div>
      </div>

      {/* verdict */}
      <div className="card mb-4" style={{ padding: 14, borderLeft: '3px solid var(--accent)' }}>
        <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>KDD verdict</div>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>{r.verdict}</div>
        <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 4, fontStyle: 'italic' }}>{r.punchline}</div>
      </div>

      {/* threat board */}
      <div className="card mb-4" style={{ padding: 12, display: 'flex', gap: 26, flexWrap: 'wrap', alignItems: 'center' }}>
        {[['High threat', r.threatBoard.high, 'high'], ['Medium', r.threatBoard.medium, 'medium'], ['Low', r.threatBoard.low, 'low']].map(([k, v, t]) => (
          <div key={k as string}><div style={{ fontSize: 16, fontWeight: 800, fontFamily: MONO, color: threatColor(t as 'high') }}>{v}</div><div style={{ fontSize: 8.5, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{k}</div></div>
        ))}
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ fontSize: 13, fontWeight: 700, fontFamily: MONO, color: 'var(--text)' }}>{r.yourQuali} · {r.yourRacePace}</div>
          <div style={{ fontSize: 8.5, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase' }}>your quali · race pace · grid P{r.gridSlot}</div>
        </div>
      </div>

      {/* grid read */}
      <div className="card" style={{ padding: 16, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}><Swords size={14} style={{ color: 'var(--accent)' }} /><span style={hdr}>Grid read · threat · strength vs soft spot</span></div>
        {r.rivals.map(rv => (
          <div key={rv.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, marginBottom: 6 }}>
            <span style={{ fontFamily: MONO, fontSize: 9, color: 'var(--text-muted)', width: 22 }}>P{rv.grid}</span>
            <span style={{ fontWeight: 700, color: 'var(--text)', width: 88 }}>{rv.name}</span>
            <span style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', width: 56 }}>{rv.bike}</span>
            <span style={{ fontFamily: MONO, fontSize: 9.5, color: rv.paceGap < 0 ? 'var(--accent)' : 'var(--green)', width: 70 }}>{rv.paceGap >= 0 ? '+' : ''}{rv.paceGap.toFixed(2)} s/lap</span>
            <span style={{ fontSize: 8.5, fontFamily: MONO, color: threatColor(rv.threat), border: `1px solid ${threatColor(rv.threat)}`, borderRadius: 3, padding: '0 5px', width: 54, textAlign: 'center' }}>{rv.threat}</span>
            <span style={{ fontSize: 9.5, color: 'var(--green)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={`Strong: ${rv.strongAt}`}>↑ {rv.strongAt}</span>
            <span style={{ fontSize: 9.5, color: 'var(--accent)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={`Attack: ${rv.weakAt}`}>↓ {rv.weakAt}</span>
          </div>
        ))}
        <div style={{ fontSize: 9.5, color: 'var(--text-muted)', marginTop: 4 }}>Pace gap is race pace vs you (− = faster). ↑ where they beat you · ↓ where you attack.</div>
      </div>

      {/* sector edge + grid start */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}><Target size={14} style={{ color: 'var(--cyan)' }} /><span style={hdr}>Sector edge vs {r.topThreat}</span></div>
          {r.sectorEdge.map(s => {
            const w = (Math.abs(s.deltaS) / maxEdge) * 50;
            const col = s.status === 'gain' ? 'var(--green)' : s.status === 'loss' ? 'var(--accent)' : 'var(--text-muted)';
            return (
              <div key={s.sector} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10.5, marginBottom: 7 }}>
                <span style={{ width: 150, color: 'var(--text)' }}>{s.sector}</span>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', height: 14 }}>
                  <span style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'var(--border)' }} />
                  <span style={{ position: 'absolute', left: s.deltaS >= 0 ? '50%' : `${50 - w}%`, width: `${w}%`, height: 8, background: col, borderRadius: 2 }} />
                </div>
                <span style={{ fontFamily: MONO, fontSize: 10, color: col, width: 60, textAlign: 'right' }}>{s.deltaS >= 0 ? '+' : ''}{s.deltaS.toFixed(3)}</span>
              </div>
            );
          })}
          <div style={{ fontSize: 9.5, color: 'var(--text-muted)', marginTop: 2 }}>Right of centre = you gain · left = you lose.</div>
        </div>
        <div className="card" style={{ padding: 16, borderLeft: '3px solid var(--cyan)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}><Flag size={14} style={{ color: 'var(--cyan)' }} /><span style={hdr}>Grid start</span></div>
          <div style={{ fontSize: 22, fontWeight: 800, fontFamily: MONO, color: 'var(--text)' }}>P{r.gridStart.slot}</div>
          <div style={{ fontSize: 11, fontFamily: MONO, color: 'var(--green)', marginBottom: 4 }}>+1 place prob {Math.round(r.gridStart.gainProb * 100)}%</div>
          <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{r.gridStart.note}</div>
        </div>
      </div>

      {/* overtake zones + head to head */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 14, marginTop: 14 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}><Crosshair size={14} style={{ color: 'var(--violet)' }} /><span style={hdr}>Overtaking zones</span></div>
          {r.overtakeZones.map(z => (
            <div key={z.corner} style={{ display: 'flex', alignItems: 'baseline', gap: 8, fontSize: 10.5, marginBottom: 6 }}>
              <span style={{ fontSize: 8.5, fontFamily: MONO, color: diffColor(z.difficulty), border: `1px solid ${diffColor(z.difficulty)}`, borderRadius: 3, padding: '0 5px' }}>{z.difficulty}</span>
              <span style={{ color: 'var(--text)', fontWeight: 600, width: 150 }}>{z.corner}</span>
              <span style={{ color: 'var(--text-muted)', flex: 1 }}>{z.note}</span>
            </div>
          ))}
        </div>
        <div className="card" style={{ padding: 16, borderLeft: '3px solid var(--accent)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}><Swords size={14} style={{ color: 'var(--accent)' }} /><span style={hdr}>Head-to-head plan · {r.headToHead.rival}</span></div>
          <div style={{ fontSize: 11.5, color: 'var(--text)', marginBottom: 6 }}>{r.headToHead.plan}</div>
          <div style={{ display: 'flex', gap: 14, fontSize: 10.5, fontFamily: MONO }}>
            <span style={{ color: 'var(--text-muted)' }}>window <b style={{ color: 'var(--cyan)' }}>{r.headToHead.window}</b></span>
            <span style={{ color: 'var(--text-muted)' }}>risk <b style={{ color: threatColor(r.headToHead.risk) }}>{r.headToHead.risk}</b></span>
          </div>
        </div>
      </div>

      <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', marginTop: 14, fontStyle: 'italic' }}>
        Representative grid read derived from circuit shape + timing model. Not a live timing-screen feed.
      </div>
    </div>
  );
}

const hdr: React.CSSProperties = { fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase' };
