/**
 * BikeComparisonPage — side-by-side bike comparison for the active circuit.
 *
 * A rider with more than one machine needs to see which bike is faster, which
 * loads the rear harder and which has real data here. Honesty kept: bikes with
 * no session at this circuit show "– and a 'generic model only' note rather
 * than invented numbers.
 */
import { GitCompare, Bike, Zap } from 'lucide-react';
import { useGarage } from '../hooks/useGarage';
import { useSessionContext } from '../hooks/useSessionContext';
import { compareBikes } from '../domain/garageProfile';

const MONO = 'JetBrains Mono, monospace';

export function BikeComparisonPage() {
  const { ctx } = useSessionContext();
  const garage = useGarage();
  const rows = compareBikes(ctx.selectedCircuit || 'mugello');
  const fastest = rows.filter(r => r.hasData).sort((a, b) => a.bestLap.localeCompare(b.bestLap))[0];

  const METRICS: Array<[string, (r: typeof rows[number]) => string, (r: typeof rows[number]) => string]> = [
    ['Best lap (this circuit)', r => r.bestLap, r => (r.bikeId === fastest?.bikeId ? 'var(--green)' : 'var(--text)')],
    ['Top speed', r => (r.topSpeed ? `${r.topSpeed} km/h` : '—'), () => 'var(--text)'],
    ['Power class', r => r.powerClass, r => (r.powerClass === 'Very high' ? 'var(--accent)' : 'var(--text)')],
    ['Rear grip drop / stint', r => r.rearGripDrop, r => (r.rearGripDrop !== '—' && parseInt(r.rearGripDrop) > 13 ? 'var(--yellow)' : 'var(--text)')],
    ['Telemetry', r => r.telemetry, r => (r.telemetry === 'GPS only' ? 'var(--accent)' : 'var(--green)')],
    ['Data status', r => (r.hasData ? 'Real sessions' : 'Generic model only'), r => (r.hasData ? 'var(--green)' : 'var(--text-muted)')],
  ];

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2"><GitCompare size={18} /> Bike Comparison</h1>
          <p className="page-subtitle">{ctx.circuitName} · {rows.length} machines · active: {garage.profile.bike.brand} {garage.profile.bike.model}</p>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Header row */}
        <div style={{ display: 'grid', gridTemplateColumns: `200px repeat(${rows.length}, 1fr)`, borderBottom: '1px solid var(--border)' }}>
          <div style={{ padding: '12px 14px', fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Metric</div>
          {rows.map(r => (
            <div key={r.bikeId} style={{ padding: '12px 14px',
 background: r.bikeId === garage.profile.bike.id ? 'rgba(0,183,255,0.06)' : 'transparent' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Bike size={13} style={{ color: r.bikeId === garage.profile.bike.id ? 'var(--cyan)' : 'var(--text-muted)' }} />
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>{r.label}</span>
              </div>
              {r.bikeId === garage.profile.bike.id && <span style={{ fontSize: 9, fontFamily: MONO, color: 'var(--cyan)' }}>ACTIVE</span>}
              {r.bikeId === fastest?.bikeId && <span style={{ fontSize: 9, fontFamily: MONO, color: 'var(--green)', marginLeft: 6 }}>FASTEST</span>}
            </div>
          ))}
        </div>
        {/* Metric rows */}
        {METRICS.map(([label, val, color], i) => (
          <div key={label} style={{ display: 'grid', gridTemplateColumns: `200px repeat(${rows.length}, 1fr)`, borderBottom: i < METRICS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
            <div style={{ padding: '11px 14px', fontSize: 11.5, color: 'var(--text-muted)' }}>{label}</div>
            {rows.map(r => (
              <div key={r.bikeId} style={{ padding: '11px 14px',
 fontSize: 13, fontFamily: MONO, fontWeight: 700, color: color(r), background: r.bikeId === garage.profile.bike.id ? 'rgba(0,183,255,0.04)' : 'transparent' }}>
                {val(r)}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', fontSize: 11, color: 'var(--text-muted)' }}>
        <Zap size={11} style={{ verticalAlign: -1, marginRight: 5, color: 'var(--cyan)' }} />
        Comparison uses real session data where available; bikes without a session at {ctx.circuitName} show "– and run on a generic category model until calibrated.
      </div>
    </div>
  );
}

export default BikeComparisonPage;
