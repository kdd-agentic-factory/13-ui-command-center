/**
 * FuelPage —” KDD Fuel & Energy Lab.
 *
 * Tank vs race sizing, per-lap consumption + safety margin, the fuel-weight
 * lap-time penalty, the lift-and-coast zones, the burn plan and the 2027
 * sustainable-fuel transition —” turning fuel into a how-much-to-carry call.
 */
import { Fuel, Scale, Leaf, TrendingDown, ListChecks } from 'lucide-react';
import { useGarage } from '../hooks/useGarage';
import { useSessionContext } from '../hooks/useSessionContext';
import { buildFuel, fuelStatusColor } from '../domain/fuel';

const MONO = 'JetBrains Mono, monospace';
const modeColor = (m: string) => m === 'push' ? 'var(--accent)' : m === 'save' ? 'var(--green)' : 'var(--text-muted)';

export function FuelPage() {
  const garage = useGarage();
  const { ctx, circuit } = useSessionContext();
  const f = buildFuel(
    garage.profile.rider.name,
    `${garage.profile.bike.brand} ${garage.profile.bike.model}`,
    ctx.circuitName, circuit.lengthKm, circuit.turns,
  );
  const fillPct = Math.min(100, (f.tank.startLoadL / f.tank.capacityL) * 100);

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2"><Fuel size={18} /> Fuel & Energy Lab</h1>
          <p className="page-subtitle">{f.raceLaps} laps · {f.consumption.perLapL}L/lap · {f.tank.fullThrottlePct}% full throttle —” {f.combo}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Margin</div>
          <div style={{ fontSize: 24, fontWeight: 800, fontFamily: MONO, color: fuelStatusColor(f.consumption.status) }}>{f.consumption.marginL}L</div>
        </div>
      </div>

      {/* verdict */}
      <div className="card mb-4" style={{ padding: 14,
 }}>
        <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>KDD verdict</div>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>{f.verdict}</div>
        <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 4, fontStyle: 'italic' }}>{f.punchline}</div>
      </div>

      {/* tank + consumption */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 14 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}><Fuel size={14} style={{ color: 'var(--cyan)' }} /><span style={hdr}>Tank load</span></div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
            <div style={{ width: 54, height: 90, border: '2px solid var(--border)', borderRadius: 'var(--radius)', position: 'relative', overflow: 'hidden' }}>
              <span style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: `${fillPct}%`, background: fuelStatusColor(f.consumption.status), opacity: 0.7 }} />
              <span style={{ position: 'absolute', left: 0, right: 0, bottom: `${(f.consumption.projectedTotalL / f.tank.capacityL) * 100}%`, borderTop: '2px dashed var(--text)', fontSize: 7, fontFamily: MONO, color: 'var(--text)', paddingLeft: 2 }}>burn</span>
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, fontFamily: MONO, color: 'var(--text)' }}>{f.tank.startLoadL}L</div>
              <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)' }}>of {f.tank.capacityL}L cap</div>
              <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', marginTop: 4 }}>burn {f.consumption.projectedTotalL}L</div>
              <div style={{ fontSize: 9, fontFamily: MONO, color: fuelStatusColor(f.consumption.status), textTransform: 'uppercase' }}>{f.consumption.status}</div>
            </div>
          </div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}><TrendingDown size={14} style={{ color: 'var(--cyan)' }} /><span style={hdr}>Burn plan by phase</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${f.phases.length}, 1fr)`, gap: 10 }}>
            {f.phases.map(p => (
              <div key={p.phase} style={{ borderTop: `2px solid ${modeColor(p.mode)}`, paddingTop: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)' }}>{p.phase}</div>
                <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)' }}>L {p.laps}</div>
                <div style={{ fontSize: 8.5, fontFamily: MONO, color: modeColor(p.mode), textTransform: 'uppercase', margin: '2px 0' }}>{p.mode}</div>
                <div style={{ fontSize: 10, fontFamily: MONO, color: 'var(--text)' }}>{p.perLapL.toFixed(2)} L/lap</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* weight + lift-coast */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 14, marginTop: 14 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}><Scale size={14} style={{ color: 'var(--violet)' }} /><span style={hdr}>Fuel weight penalty</span></div>
          <div style={{ fontSize: 22, fontWeight: 800, fontFamily: MONO, color: 'var(--text)' }}>{f.weight.fuelMassKg} kg</div>
          <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)' }}>fuel at lights-out</div>
          <div style={{ fontSize: 11, color: 'var(--accent)', fontFamily: MONO, marginTop: 6 }}>âˆ’{f.weight.startEndDeltaS}s/lap heavier at the start</div>
          <div style={{ fontSize: 9.5, color: 'var(--text-muted)', marginTop: 2 }}>~{f.weight.lapCostPerKgS}s/lap per kg · the bike quickens as the tank empties.</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}><TrendingDown size={14} style={{ color: 'var(--green)' }} /><span style={hdr}>Lift-and-coast zones</span></div>
          {f.liftCoast.map(z => (
            <div key={z.corner} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10.5, marginBottom: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: z.worthIt ? 'var(--green)' : 'var(--text-muted)', flexShrink: 0 }} />
              <span style={{ color: 'var(--text)', flex: 1 }}>{z.corner}</span>
              <span style={{ fontFamily: MONO, fontSize: 9.5, color: 'var(--green)', width: 64 }}>save {z.saveL.toFixed(2)}L</span>
              <span style={{ fontFamily: MONO, fontSize: 9.5, color: 'var(--accent)', width: 56 }}>+{z.lapTimeCostS.toFixed(2)}s</span>
              <span style={{ fontSize: 8.5, fontFamily: MONO, color: z.worthIt ? 'var(--green)' : 'var(--text-muted)', width: 48, textAlign: 'right' }}>{z.worthIt ? 'worth it' : 'skip'}</span>
            </div>
          ))}
          <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 4 }}>Coast where the litres-saved beat the lap-time cost.</div>
        </div>
      </div>

      {/* sustainable + recommendations */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 14, marginTop: 14 }}>
        <div className="card" style={{ padding: 16,
 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}><Leaf size={14} style={{ color: 'var(--green)' }} /><span style={hdr}>Sustainable fuel</span></div>
          <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{f.sustainable}</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}><ListChecks size={14} style={{ color: 'var(--cyan)' }} /><span style={hdr}>Recommendations</span></div>
          {f.recommendations.map((rec, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, fontSize: 10.5, marginBottom: 5, alignItems: 'baseline' }}>
              <span style={{ color: 'var(--cyan)', fontFamily: MONO }}>{i + 1}</span>
              <span style={{ color: 'var(--text-muted)' }}>{rec}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', marginTop: 14, fontStyle: 'italic' }}>
        Representative energy model derived from circuit shape. Not a live flow-meter feed.
      </div>
    </div>
  );
}

const hdr: React.CSSProperties = { fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase' };
