/**
 * GearingPage — KDD Gearing & Transmission Lab.
 *
 * The six ratios with their top speeds, the final drive, the shift points
 * corner by corner, the rpm drop between gears and the call — turning the
 * gearbox into a top-speed-vs-acceleration decision.
 */
import { Cog, ArrowUpDown, TrendingUp, ListChecks } from 'lucide-react';
import { useGarage } from '../hooks/useGarage';
import { useSessionContext } from '../hooks/useSessionContext';
import { buildGearing, gapColor } from '../domain/gearing';

const MONO = 'JetBrains Mono, monospace';
const actColor = (a: string) => a === 'up' ? 'var(--green)' : a === 'down' ? 'var(--accent)' : 'var(--text-muted)';

export function GearingPage() {
  const garage = useGarage();
  const { ctx, circuit } = useSessionContext();
  const g = buildGearing(
    garage.profile.rider.name,
    `${garage.profile.bike.brand} ${garage.profile.bike.model}`,
    ctx.circuitName, circuit.turns, circuit.mainStraightKm,
  );
  const maxTop = Math.max(...g.gears.map(x => x.topSpeedKmh));

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2"><Cog size={18} /> Gearing & Transmission Lab</h1>
          <p className="page-subtitle">Final drive {g.finalDrive.front}/{g.finalDrive.rear} · rev limit {g.revLimit.toLocaleString()} — {g.combo}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Top speed (6th)</div>
          <div style={{ fontSize: 24, fontWeight: 800, fontFamily: MONO, color: 'var(--text)' }}>{g.topSpeed6thKmh}<span style={{ fontSize: 12, color: 'var(--text-muted)' }}> km/h</span></div>
        </div>
      </div>

      {/* verdict */}
      <div className="card mb-4" style={{ padding: 14,
 }}>
        <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>KDD verdict</div>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>{g.verdict}</div>
        <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 4, fontStyle: 'italic' }}>{g.punchline}</div>
      </div>

      {/* ratios ladder */}
      <div className="card mb-4" style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}><TrendingUp size={14} style={{ color: 'var(--cyan)' }} /><span style={hdr}>Gear ratios · top speed each gear</span></div>
        {g.gears.map(x => (
          <div key={x.gear} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, marginBottom: 5 }}>
            <span style={{ fontFamily: MONO, fontWeight: 800, color: 'var(--text)', width: 22 }}>{x.gear}</span>
            <span style={{ fontFamily: MONO, fontSize: 9.5, color: 'var(--text-muted)', width: 44 }}>{x.ratio.toFixed(2)}</span>
            <div style={{ flex: 1, height: 9, background: 'var(--border)', borderRadius: 3 }}>
              <span style={{ display: 'block', height: '100%', width: `${(x.topSpeedKmh / maxTop) * 100}%`, background: x.gear === 6 ? 'var(--green)' : 'var(--cyan)', borderRadius: 3 }} />
            </div>
            <span style={{ fontFamily: MONO, fontSize: 10, color: 'var(--text)', width: 64, textAlign: 'right' }}>{x.topSpeedKmh} km/h</span>
            <span style={{ fontSize: 8.5, color: 'var(--text-muted)', width: 130 }}>{x.note}</span>
          </div>
        ))}
      </div>

      {/* shift points + rpm gaps */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 14 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}><ArrowUpDown size={14} style={{ color: 'var(--violet)' }} /><span style={hdr}>Shift points by corner</span></div>
          {g.shifts.map(s => (
            <div key={s.corner} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10.5, marginBottom: 5 }}>
              <span style={{ color: 'var(--text)', flex: 1 }}>{s.corner}</span>
              <span style={{ fontSize: 8, fontFamily: MONO, color: actColor(s.action), border: `1px solid ${actColor(s.action)}`, borderRadius: 3, padding: '0 5px', textTransform: 'uppercase' }}>{s.action}</span>
              <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: 'var(--text)', width: 24, textAlign: 'center' }}>{s.gear}</span>
              <span style={{ fontFamily: MONO, fontSize: 9, color: 'var(--text-muted)', width: 64, textAlign: 'right' }}>{s.rpm.toLocaleString()}</span>
            </div>
          ))}
          <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 4 }}>Gear carried through each corner, with the shift action + rpm.</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}><Cog size={14} style={{ color: 'var(--cyan)' }} /><span style={hdr}>RPM drop between gears</span></div>
          {g.rpmGaps.map(gap => (
            <div key={gap.fromTo} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10.5, marginBottom: 6 }}>
              <span style={{ fontFamily: MONO, color: 'var(--text)', width: 44 }}>{gap.fromTo}</span>
              <div style={{ flex: 1, height: 8, background: 'var(--border)', borderRadius: 3 }}>
                <span style={{ display: 'block', height: '100%', width: `${Math.min(100, (gap.dropRpm / 4000) * 100)}%`, background: gapColor(gap.status), borderRadius: 3 }} />
              </div>
              <span style={{ fontFamily: MONO, fontSize: 9.5, color: 'var(--text)', width: 56, textAlign: 'right' }}>{gap.dropRpm.toLocaleString()}</span>
              <span style={{ fontSize: 8, fontFamily: MONO, color: gapColor(gap.status), width: 40, textAlign: 'right', textTransform: 'uppercase' }}>{gap.status}</span>
            </div>
          ))}
          <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 4 }}>Even spacing keeps the engine in the powerband between shifts.</div>
        </div>
      </div>

      {/* recommendations */}
      <div className="card" style={{ padding: 16, marginTop: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}><ListChecks size={14} style={{ color: 'var(--cyan)' }} /><span style={hdr}>Recommendations</span></div>
        {g.recommendations.map((rec, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, fontSize: 10.5, marginBottom: 5, alignItems: 'baseline' }}>
            <span style={{ color: 'var(--cyan)', fontFamily: MONO }}>{i + 1}</span>
            <span style={{ color: 'var(--text-muted)' }}>{rec}</span>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', marginTop: 14, fontStyle: 'italic' }}>
        Representative transmission model derived from circuit shape. Not a live gearbox datalog.
      </div>
    </div>
  );
}

const hdr: React.CSSProperties = { fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase' };

export default GearingPage;
