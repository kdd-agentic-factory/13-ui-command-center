/**
 * ChassisPage — KDD Chassis & Geometry Lab.
 *
 * The bike geometry, the weight distribution, the fork/shock settings in clicks,
 * the front/rear balance read, the corner-phase behaviour and the specific
 * chassis changes — turning "it pushes on entry" into a click.
 */
import { Bike, Ruler, SlidersVertical, Scale, ListChecks } from 'lucide-react';
import { useGarage } from '../hooks/useGarage';
import { useSessionContext } from '../hooks/useSessionContext';
import { buildChassis, balanceColor } from '../domain/chassis';

const MONO = 'JetBrains Mono, monospace';

export function ChassisPage() {
  const garage = useGarage();
  const { ctx, circuit } = useSessionContext();
  const c = buildChassis(
    garage.profile.rider.name,
    `${garage.profile.bike.brand} ${garage.profile.bike.model}`,
    ctx.circuitName, circuit.turns,
  );

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2"><Bike size={18} /> Chassis & Geometry Lab</h1>
          <p className="page-subtitle">Mechanical grip · weight {c.weightDist.frontPct}/{c.weightDist.rearPct} — {c.combo}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Balance</div>
          <div style={{ fontSize: 20, fontWeight: 800, fontFamily: MONO, color: balanceColor(c.balance.state), textTransform: 'capitalize' }}>{c.balance.state}</div>
        </div>
      </div>

      {/* verdict */}
      <div className="card mb-4" style={{ padding: 14,
 }}>
        <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>KDD verdict</div>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>{c.verdict}</div>
        <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 4, fontStyle: 'italic' }}>{c.punchline}</div>
      </div>

      {/* balance read */}
      <div className="card mb-4" style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}><Scale size={14} style={{ color: 'var(--cyan)' }} /><span style={hdr}>Grip balance · front vs rear</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', width: 42 }}>front</span>
          <div style={{ flex: 1, height: 10, background: 'var(--border)', borderRadius: 4 }}><span style={{ display: 'block', height: '100%', width: `${c.balance.frontGrip * 100}%`, background: 'var(--cyan)', borderRadius: 4 }} /></div>
          <span style={{ fontFamily: MONO, fontSize: 10, color: 'var(--cyan)', width: 36 }}>{c.balance.frontGrip.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
          <span style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', width: 42 }}>rear</span>
          <div style={{ flex: 1, height: 10, background: 'var(--border)', borderRadius: 4 }}><span style={{ display: 'block', height: '100%', width: `${c.balance.rearGrip * 100}%`, background: 'var(--violet)', borderRadius: 4 }} /></div>
          <span style={{ fontFamily: MONO, fontSize: 10, color: 'var(--violet)', width: 36 }}>{c.balance.rearGrip.toFixed(2)}</span>
        </div>
        <div style={{ fontSize: 9.5, color: 'var(--text-muted)', marginTop: 6 }}>{c.balance.note}</div>
      </div>

      {/* geometry + suspension */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}><Ruler size={14} style={{ color: 'var(--cyan)' }} /><span style={hdr}>Geometry</span></div>
          {c.geometry.map(g => (
            <div key={g.name} style={{ display: 'flex', alignItems: 'baseline', gap: 8, fontSize: 10.5, marginBottom: 5 }}>
              <span style={{ color: 'var(--text)', fontWeight: 600, width: 110 }}>{g.name}</span>
              <span style={{ fontFamily: MONO, fontSize: 11, color: 'var(--text)', width: 70, textAlign: 'right' }}>{g.value}{g.unit ? ` ${g.unit}` : ''}</span>
              <span style={{ fontSize: 9, color: 'var(--text-muted)', flex: 1 }}>{g.effect}</span>
            </div>
          ))}
          <div style={{ fontSize: 9.5, color: 'var(--text-muted)', marginTop: 6 }}>{c.weightDist.note}</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}><SlidersVertical size={14} style={{ color: 'var(--violet)' }} /><span style={hdr}>Suspension · clicks</span></div>
          {c.suspension.map(s => (
            <div key={s.item} style={{ marginBottom: 7 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5 }}>
                <span style={{ color: 'var(--text)', fontWeight: 600 }}>{s.item}</span>
                <span style={{ fontFamily: MONO, fontSize: 9.5, color: 'var(--text-muted)' }}>{s.clicks}/{s.range}</span>
              </div>
              <div style={{ height: 5, background: 'var(--border)', borderRadius: 3, marginTop: 2 }}>
                <span style={{ display: 'block', height: '100%', width: `${(s.clicks / s.range) * 100}%`, background: 'var(--violet)', borderRadius: 3 }} />
              </div>
              <div style={{ fontSize: 8.5, color: 'var(--text-muted)', marginTop: 1 }}>{s.effect}</div>
            </div>
          ))}
        </div>
      </div>

      {/* corner phases + changes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 14, marginTop: 14 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}><Bike size={14} style={{ color: 'var(--cyan)' }} /><span style={hdr}>Corner-phase behaviour</span></div>
          {c.corners.map(p => (
            <div key={p.phase} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)' }}>{p.phase}</div>
              <div style={{ fontSize: 10, color: 'var(--accent)' }}>{p.issue}</div>
              <div style={{ fontSize: 9.5, color: 'var(--text-muted)' }}>→ {p.lever}</div>
            </div>
          ))}
        </div>
        <div className="card" style={{ padding: 16,
 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}><ListChecks size={14} style={{ color: 'var(--green)' }} /><span style={hdr}>Recommended changes</span></div>
          {c.changes.map((ch, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 8, fontSize: 10.5, marginBottom: 6 }}>
              <span style={{ fontSize: 8, fontFamily: MONO, color: 'var(--text-muted)', width: 64 }}>{ch.phase}</span>
              <span style={{ color: 'var(--text)', fontWeight: 600, width: 120 }}>{ch.param}</span>
              <span style={{ fontFamily: MONO, fontSize: 9, color: 'var(--cyan)', width: 110 }}>{ch.direction}</span>
              <span style={{ fontSize: 9, color: 'var(--text-muted)', flex: 1 }}>{ch.effect}</span>
            </div>
          ))}
          <div style={{ fontSize: 9.5, color: 'var(--text-muted)', marginTop: 6 }}>{c.mechanicalNote}</div>
        </div>
      </div>

      <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', marginTop: 14, fontStyle: 'italic' }}>
        Representative chassis model derived from circuit shape. Not a live suspension-potentiometer feed.
      </div>
    </div>
  );
}

const hdr: React.CSSProperties = { fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase' };

export default ChassisPage;
