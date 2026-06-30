/**
 * ElectronicsPage – KDD Electronics Control Lab (ECU & rider aids).
 *
 * Power maps, the rider-aid levels with intervention telemetry, the launch /
 * holeshot + ride-height devices, the corner-by-corner electronics map and the
 * recommendations – turning "the bike feels nervous on exit" into a map change.
 */
import { CircuitBoard, Gauge, Rocket, ArrowDownNarrowWide, ListChecks, Activity } from 'lucide-react';
import { useGarage } from '../hooks/useGarage';
import { useSessionContext } from '../hooks/useSessionContext';
import { buildElectronics, aidColor } from '../domain/electronics';

const MONO = 'JetBrains Mono, monospace';
const typeColor = (t: string) => t === 'slow' ? 'var(--accent)' : t === 'fast' ? 'var(--green)' : 'var(--yellow)';

export function ElectronicsPage() {
  const garage = useGarage();
  const { ctx, circuit } = useSessionContext();
  const e = buildElectronics(
    garage.profile.rider.name,
    `${garage.profile.bike.brand} ${garage.profile.bike.model}`,
    ctx.circuitName, circuit.turns,
  );
  const chosenMap = e.maps.find(m => m.chosen);

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2"><CircuitBoard size={18} /> Electronics Control Lab</h1>
          <p className="page-subtitle">ECU & rider aids · {chosenMap?.name} – {e.combo}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase' }}>TC cuts / lap</div>
          <div style={{ fontSize: 24, fontWeight: 800, fontFamily: MONO, color: e.intervention.tcPerLap > 25 ? 'var(--accent)' : 'var(--green)' }}>{e.intervention.tcPerLap}</div>
        </div>
      </div>

      {/* verdict */}
      <div className="card mb-4" style={{ padding: 14,
 }}>
        <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>KDD verdict</div>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>{e.verdict}</div>
        <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 4, fontStyle: 'italic' }}>{e.punchline}</div>
      </div>

      {/* power maps */}
      <div className="card mb-4" style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}><Gauge size={14} style={{ color: 'var(--violet)' }} /><span style={hdr}>Power maps</span></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {e.maps.map(m => (
            <div key={m.id} style={{ padding: 10, borderRadius: 'var(--radius)', border: `1px solid ${m.chosen ? 'var(--violet)' : 'var(--border)'}`, background: m.chosen ? 'var(--bg-surface)' : 'transparent' }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text)' }}>{m.name}{m.chosen && <span style={{ fontSize: 8, fontFamily: MONO, color: 'var(--violet)', marginLeft: 6 }}>ACTIVE</span>}</div>
              <div style={{ fontSize: 9.5, color: 'var(--text-muted)', marginTop: 2 }}>{m.character}</div>
            </div>
          ))}
        </div>
      </div>

      {/* aids + intervention */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 14 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}><Activity size={14} style={{ color: 'var(--cyan)' }} /><span style={hdr}>Rider aids · level</span></div>
          {e.aids.map(a => (
            <div key={a.aid} style={{ marginBottom: 9 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
                <span style={{ color: 'var(--text)', fontWeight: 600 }}>{a.aid}</span>
                <span style={{ fontFamily: MONO, fontSize: 10 }}><b style={{ color: aidColor(a.status) }}>{a.level}</b><span style={{ color: 'var(--text-muted)' }}>/{a.max} · {a.status}</span></span>
              </div>
              <div style={{ display: 'flex', gap: 2 }}>
                {Array.from({ length: a.max }, (_, i) => (
                  <span key={i} style={{ flex: 1, height: 6, borderRadius: 2, background: i < a.level ? aidColor(a.status) : 'var(--border)' }} />
                ))}
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>{a.note}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}><Activity size={14} style={{ color: 'var(--accent)' }} /><span style={hdr}>Intervention / lap</span></div>
            <div style={{ display: 'flex', gap: 18 }}>
              <div><div style={{ fontSize: 20, fontWeight: 800, fontFamily: MONO, color: e.intervention.tcPerLap > 25 ? 'var(--accent)' : 'var(--text)' }}>{e.intervention.tcPerLap}</div><div style={{ fontSize: 8.5, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase' }}>TC cuts</div></div>
              <div><div style={{ fontSize: 20, fontWeight: 800, fontFamily: MONO, color: 'var(--text)' }}>{e.intervention.wheeliePerLap}</div><div style={{ fontSize: 8.5, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase' }}>anti-wheelie</div></div>
            </div>
            <div style={{ fontSize: 9.5, color: 'var(--text-muted)', marginTop: 6 }}>{e.intervention.note}</div>
          </div>
          <div className="card" style={{ padding: 16,
 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}><Rocket size={14} style={{ color: 'var(--green)' }} /><span style={hdr}>Launch / holeshot</span></div>
            <div style={{ fontSize: 11, color: 'var(--text)' }}>{e.launch.launchControl ? '─ Launch control' : '─ Launch control'} · {e.launch.holeshotDevice ? '─ Holeshot' : '─ Holeshot'}</div>
            <div style={{ fontSize: 14, fontWeight: 800, fontFamily: MONO, color: 'var(--green)', margin: '2px 0' }}>−{e.launch.gainS.toFixed(2)}s into T1</div>
            <div style={{ fontSize: 9.5, color: 'var(--text-muted)' }}>{e.launch.note}</div>
          </div>
        </div>
      </div>

      {/* corner map + ride height */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14, marginTop: 14 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}><CircuitBoard size={14} style={{ color: 'var(--cyan)' }} /><span style={hdr}>Corner-by-corner electronics</span></div>
          <div style={{ display: 'flex', fontSize: 8.5, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
            <span style={{ flex: 1 }}>Corner</span><span style={{ width: 40, textAlign: 'center' }}>Type</span><span style={{ width: 34, textAlign: 'center' }}>TC</span><span style={{ width: 34, textAlign: 'center' }}>AW</span><span style={{ width: 34, textAlign: 'center' }}>EB</span>
          </div>
          {e.corners.map(c => (
            <div key={c.corner} style={{ display: 'flex', alignItems: 'center', fontSize: 10.5, marginBottom: 5 }}>
              <span style={{ flex: 1, color: 'var(--text)' }}>{c.corner}</span>
              <span style={{ width: 40, textAlign: 'center', fontSize: 8, fontFamily: MONO, color: typeColor(c.type) }}>{c.type}</span>
              <span style={{ width: 34, textAlign: 'center', fontFamily: MONO, color: 'var(--text)' }}>{c.tc}</span>
              <span style={{ width: 34, textAlign: 'center', fontFamily: MONO, color: 'var(--text)' }}>{c.antiWheelie}</span>
              <span style={{ width: 34, textAlign: 'center', fontFamily: MONO, color: 'var(--text)' }}>{c.engineBrake}</span>
            </div>
          ))}
          <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 4 }}>TC traction · AW anti-wheelie · EB engine braking (0–8).</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}><ArrowDownNarrowWide size={14} style={{ color: 'var(--violet)' }} /><span style={hdr}>Ride-height device</span></div>
          <div style={{ fontSize: 10.5, color: 'var(--text)', marginBottom: 3 }}><b>Front:</b> {e.rideHeight.frontDevice}</div>
          <div style={{ fontSize: 10.5, color: 'var(--text)', marginBottom: 6 }}><b>Rear:</b> {e.rideHeight.rearDevice}</div>
          <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 3 }}>Deploy zones</div>
          {e.rideHeight.zones.map(z => <div key={z} style={{ fontSize: 10, color: 'var(--cyan)', marginBottom: 1 }}>→" {z}</div>)}
          <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 6 }}>{e.rideHeight.note}</div>
        </div>
      </div>

      {/* recommendations */}
      <div className="card" style={{ padding: 16, marginTop: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}><ListChecks size={14} style={{ color: 'var(--cyan)' }} /><span style={hdr}>Recommendations</span></div>
        {e.recommendations.map((rec, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, fontSize: 10.5, marginBottom: 5, alignItems: 'baseline' }}>
            <span style={{ color: 'var(--cyan)', fontFamily: MONO }}>{i + 1}</span>
            <span style={{ color: 'var(--text-muted)' }}>{rec}</span>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', marginTop: 14, fontStyle: 'italic' }}>
        Representative ECU model derived from circuit shape. Not a live ECU datalog.
      </div>
    </div>
  );
}

const hdr: React.CSSProperties = { fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase' };

export default ElectronicsPage;
