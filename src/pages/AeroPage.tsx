/**
 * AeroPage — KDD Aerodynamics Lab.
 *
 * The downforce/drag trade-off: how aero-sensitive the circuit is, the ranked
 * downforce packages with their top-speed cost, the front/rear balance, the
 * dirty-air loss when following and the corner-by-corner aero gain — ending in
 * a package call.
 */
import { Wind, Gauge, Scale, Users, ListChecks } from 'lucide-react';
import { useGarage } from '../hooks/useGarage';
import { useSessionContext } from '../hooks/useSessionContext';
import { buildAero, difficultyColor, aeroTypeColor } from '../domain/aero';

const MONO = 'JetBrains Mono, monospace';

export function AeroPage() {
  const garage = useGarage();
  const { ctx, circuit } = useSessionContext();
  const a = buildAero(
    garage.profile.rider.name,
    `${garage.profile.bike.brand} ${garage.profile.bike.model}`,
    ctx.circuitName, circuit.turns, circuit.mainStraightKm,
  );
  const chosen = a.packages.find(p => p.chosen)!;
  const maxGain = Math.max(...a.corners.map(c => c.aeroGain), 0.01);

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2"><Wind size={18} /> Aerodynamics Lab</h1>
          <p className="page-subtitle">{a.sensitivityLabel} ({a.sensitivity}/10) · {chosen.name} — {a.combo}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Trap speed</div>
          <div style={{ fontSize: 24, fontWeight: 800, fontFamily: MONO, color: 'var(--text)' }}>{a.topSpeedTrapKmh}<span style={{ fontSize: 12, color: 'var(--text-muted)' }}> km/h</span></div>
        </div>
      </div>

      {/* verdict */}
      <div className="card mb-4" style={{ padding: 14, borderLeft: '3px solid var(--accent)' }}>
        <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>KDD verdict</div>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>{a.verdict}</div>
        <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 4, fontStyle: 'italic' }}>{a.punchline}</div>
      </div>

      {/* packages */}
      <div className="card mb-4" style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}><Gauge size={14} style={{ color: 'var(--violet)' }} /><span style={hdr}>Downforce packages · the trade-off</span></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {a.packages.map(p => (
            <div key={p.id} style={{ padding: 10, borderRadius: 6, border: `1px solid ${p.chosen ? 'var(--violet)' : 'var(--border)'}`, background: p.chosen ? 'var(--bg-surface)' : 'transparent' }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text)' }}>{p.name}{p.chosen && <span style={{ fontSize: 8, fontFamily: MONO, color: 'var(--violet)', marginLeft: 6 }}>RUN</span>}</div>
              <div style={{ display: 'flex', gap: 12, margin: '6px 0', fontSize: 9.5, fontFamily: MONO }}>
                <span style={{ color: 'var(--green)' }}>DF {p.downforce}</span>
                <span style={{ color: 'var(--accent)' }}>drag {p.drag}</span>
                <span style={{ color: 'var(--text)' }}>{p.topSpeedKmh} km/h</span>
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{p.note}</div>
            </div>
          ))}
        </div>
      </div>

      {/* balance + dirty air */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 14 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}><Scale size={14} style={{ color: 'var(--cyan)' }} /><span style={hdr}>Aero balance</span></div>
          <div style={{ display: 'flex', height: 26, borderRadius: 5, overflow: 'hidden', marginBottom: 6 }}>
            <span style={{ width: `${a.balance.frontPct}%`, background: 'var(--cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontFamily: MONO, color: '#000' }}>F {a.balance.frontPct}%</span>
            <span style={{ width: `${a.balance.rearPct}%`, background: 'var(--violet)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontFamily: MONO, color: '#fff' }}>R {a.balance.rearPct}%</span>
          </div>
          <div style={{ fontSize: 9.5, color: 'var(--text-muted)' }}>{a.balance.note}</div>
        </div>
        <div className="card" style={{ padding: 16, borderLeft: `3px solid ${difficultyColor(a.dirtyAir.overtakeDifficulty)}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}><Users size={14} style={{ color: difficultyColor(a.dirtyAir.overtakeDifficulty) }} /><span style={hdr}>Dirty air · following</span></div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <span style={{ fontSize: 22, fontWeight: 800, fontFamily: MONO, color: 'var(--accent)' }}>−{a.dirtyAir.downforceLossPct}%</span>
            <span style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)' }}>front downforce when following</span>
            <span style={{ marginLeft: 'auto', fontSize: 8.5, fontFamily: MONO, color: difficultyColor(a.dirtyAir.overtakeDifficulty), border: `1px solid ${difficultyColor(a.dirtyAir.overtakeDifficulty)}`, borderRadius: 3, padding: '0 6px' }}>overtake {a.dirtyAir.overtakeDifficulty}</span>
          </div>
          <div style={{ fontSize: 9.5, color: 'var(--text-muted)', marginTop: 6 }}>{a.dirtyAir.note}</div>
        </div>
      </div>

      {/* corner gain + recommendations */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 14, marginTop: 14 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}><Wind size={14} style={{ color: 'var(--cyan)' }} /><span style={hdr}>Aero gain by corner</span></div>
          {a.corners.map(c => (
            <div key={c.corner} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10.5, marginBottom: 6 }}>
              <span style={{ color: 'var(--text)', width: 150 }}>{c.corner}</span>
              <span style={{ fontSize: 8, fontFamily: MONO, color: aeroTypeColor(c.type), width: 44 }}>{c.type}</span>
              <div style={{ flex: 1, height: 8, background: 'var(--border)', borderRadius: 3 }}>
                <span style={{ display: 'block', height: '100%', width: `${(c.aeroGain / maxGain) * 100}%`, background: aeroTypeColor(c.type), borderRadius: 3 }} />
              </div>
              <span style={{ fontFamily: MONO, fontSize: 9.5, color: 'var(--green)', width: 52, textAlign: 'right' }}>−{c.aeroGain.toFixed(2)}s</span>
            </div>
          ))}
          <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 4 }}>Lap time the downforce buys in each zone — fast corners pay the most.</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}><ListChecks size={14} style={{ color: 'var(--cyan)' }} /><span style={hdr}>Recommendations</span></div>
          {a.recommendations.map((rec, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, fontSize: 10.5, marginBottom: 5, alignItems: 'baseline' }}>
              <span style={{ color: 'var(--cyan)', fontFamily: MONO }}>{i + 1}</span>
              <span style={{ color: 'var(--text-muted)' }}>{rec}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', marginTop: 14, fontStyle: 'italic' }}>
        Representative aero model derived from circuit shape. Not a CFD / wind-tunnel run.
      </div>
    </div>
  );
}

const hdr: React.CSSProperties = { fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase' };
