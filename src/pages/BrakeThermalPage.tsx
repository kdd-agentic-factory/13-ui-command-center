/**
 * BrakeThermalPage — KDD Brake Thermal Lab.
 *
 * The carbon-disc operating window, the per-corner brake energy + peak disc
 * temperature, the lap thermal curve against the window band, the cooling-duct
 * trade-off and the fade / cold-disc risk — ending in a duct + bias call.
 */
import { Disc, Thermometer, Wind, AlertTriangle, ListChecks } from 'lucide-react';
import { useGarage } from '../hooks/useGarage';
import { useSessionContext } from '../hooks/useSessionContext';
import { buildBrakeThermal, thermColor } from '../domain/brakeThermal';

const MONO = 'JetBrains Mono, monospace';

export function BrakeThermalPage() {
  const garage = useGarage();
  const { ctx, circuit } = useSessionContext();
  const b = buildBrakeThermal(
    garage.profile.rider.name,
    `${garage.profile.bike.brand} ${garage.profile.bike.model}`,
    ctx.circuitName, circuit.turns,
  );
  const scaleMax = b.disc.windowHigh + 120;
  const scaleMin = b.disc.windowLow - 180;
  const pct = (t: number) => ((t - scaleMin) / (scaleMax - scaleMin)) * 100;

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2"><Disc size={18} /> Brake Thermal Lab</h1>
          <p className="page-subtitle">{b.disc.diameterMm}mm carbon · severity {b.severity}/10 ({b.severityLabel}) — {b.combo}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Peak disc temp</div>
          <div style={{ fontSize: 24, fontWeight: 800, fontFamily: MONO, color: thermColor(b.state.status) }}>{b.state.peakTempC}°C</div>
        </div>
      </div>

      {/* verdict */}
      <div className="card mb-4" style={{ padding: 14, borderLeft: '3px solid var(--accent)' }}>
        <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>KDD verdict</div>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>{b.verdict}</div>
        <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 4, fontStyle: 'italic' }}>{b.punchline}</div>
      </div>

      {/* summary */}
      <div className="card mb-4" style={{ padding: 12, display: 'flex', gap: 26, flexWrap: 'wrap', alignItems: 'center' }}>
        {[['Disc', `${b.disc.diameterMm}mm`], ['Window', `${b.disc.windowLow}–${b.disc.windowHigh}°C`], ['Peak', `${b.state.peakTempC}°C`], ['Avg', `${b.state.avgTempC}°C`], ['Mass', `${b.disc.massKg}kg`]].map(([k, v]) => (
          <div key={k as string}><div style={{ fontSize: 15, fontWeight: 800, fontFamily: MONO, color: 'var(--text)' }}>{v}</div><div style={{ fontSize: 8.5, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{k}</div></div>
        ))}
        <div style={{ marginLeft: 'auto', fontSize: 10, fontFamily: MONO, color: thermColor(b.state.status), border: `1px solid ${thermColor(b.state.status)}`, borderRadius: 4, padding: '3px 8px', textTransform: 'uppercase' }}>
          {b.state.inWindow ? 'in window' : 'out of window'} · {b.state.status}
        </div>
      </div>

      {/* lap thermal curve vs window band */}
      <div className="card" style={{ padding: 16, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}><Thermometer size={14} style={{ color: 'var(--accent)' }} /><span style={hdr}>Lap thermal curve vs operating window</span></div>
        <div style={{ position: 'relative', height: 120, display: 'flex', alignItems: 'flex-end', gap: 10 }}>
          {/* window band */}
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: `${pct(b.disc.windowLow)}%`, height: `${pct(b.disc.windowHigh) - pct(b.disc.windowLow)}%`, background: 'rgba(0,230,118,0.08)', borderTop: '1px dashed var(--green)', borderBottom: '1px dashed var(--green)' }} />
          {b.curve.map(p => {
            const cold = p.tempC < b.disc.windowLow, over = p.tempC > b.disc.windowHigh;
            const col = over ? 'var(--accent)' : cold ? 'var(--cyan)' : 'var(--green)';
            return (
              <div key={p.point} title={`${p.point}: ${p.tempC}°C`} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', height: '100%', zIndex: 1 }}>
                <span style={{ fontSize: 8, fontFamily: MONO, color: col }}>{p.tempC}°</span>
                <span style={{ width: '70%', height: `${Math.max(4, pct(p.tempC))}%`, background: col, borderRadius: '2px 2px 0 0' }} />
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          {b.curve.map(p => <span key={p.point} style={{ flex: 1, fontSize: 8, fontFamily: MONO, color: 'var(--text-muted)', textAlign: 'center' }}>{p.point}</span>)}
        </div>
      </div>

      {/* brake zones + ducts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}><Disc size={14} style={{ color: 'var(--cyan)' }} /><span style={hdr}>Brake zones · energy & peak temp</span></div>
          {b.zones.map(z => (
            <div key={z.corner} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, marginBottom: 6 }}>
              <span style={{ width: 9, height: 9, borderRadius: 999, background: thermColor(z.status), flexShrink: 0 }} />
              <span style={{ color: 'var(--text)', flex: 1 }}>{z.corner}</span>
              <span style={{ fontFamily: MONO, fontSize: 9.5, color: 'var(--text-muted)', width: 64 }}>{z.entrySpeed} km/h</span>
              <span style={{ fontFamily: MONO, fontSize: 9.5, color: 'var(--text-muted)', width: 44 }}>{z.decelG}g</span>
              <span style={{ fontFamily: MONO, fontSize: 9.5, color: 'var(--text-muted)', width: 56 }}>{z.energyMJ} MJ</span>
              <span style={{ fontFamily: MONO, fontSize: 10, color: thermColor(z.status), width: 56, textAlign: 'right' }}>{z.peakTempC}°C</span>
            </div>
          ))}
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}><Wind size={14} style={{ color: 'var(--violet)' }} /><span style={hdr}>Cooling ducts</span></div>
          {b.ducts.map(d => (
            <div key={d.size} style={{ display: 'flex', gap: 8, fontSize: 10.5, marginBottom: 6, alignItems: 'baseline', padding: d.chosen ? '4px 6px' : '0 6px', background: d.chosen ? 'var(--bg-surface)' : 'transparent', borderRadius: 5, border: d.chosen ? '1px solid var(--border)' : '1px solid transparent' }}>
              <span style={{ fontFamily: MONO, fontWeight: 800, color: d.chosen ? 'var(--violet)' : 'var(--text-muted)', width: 16 }}>{d.size}</span>
              <div>
                <div style={{ color: 'var(--text)' }}>{d.cooling}{d.chosen && <span style={{ fontSize: 8, fontFamily: MONO, color: 'var(--violet)', marginLeft: 6 }}>CHOSEN</span>}</div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{d.warmupRisk}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* fade risk + recommendations */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 14, marginTop: 14 }}>
        <div className="card" style={{ padding: 16, borderLeft: '3px solid var(--yellow)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}><AlertTriangle size={14} style={{ color: 'var(--yellow)' }} /><span style={hdr}>Risk</span></div>
          {[['Fade (overheat)', b.fade.fadeRiskPct, 'var(--accent)'], ['Cold disc (lap 1 / wet)', b.fade.coldRiskPct, 'var(--cyan)']].map(([k, v, c]) => (
            <div key={k as string} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5 }}><span style={{ color: 'var(--text)' }}>{k}</span><span style={{ fontFamily: MONO, color: c as string }}>{v}%</span></div>
              <div style={{ height: 5, background: 'var(--border)', borderRadius: 3, marginTop: 2 }}><span style={{ display: 'block', height: '100%', width: `${v}%`, background: c as string, borderRadius: 3 }} /></div>
            </div>
          ))}
          <div style={{ fontSize: 9.5, color: 'var(--text-muted)', marginTop: 4 }}>{b.fade.note}</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}><ListChecks size={14} style={{ color: 'var(--cyan)' }} /><span style={hdr}>Recommendations</span></div>
          {b.recommendations.map((rec, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, fontSize: 10.5, marginBottom: 5, alignItems: 'baseline' }}>
              <span style={{ color: 'var(--cyan)', fontFamily: MONO }}>{i + 1}</span>
              <span style={{ color: 'var(--text-muted)' }}>{rec}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', marginTop: 14, fontStyle: 'italic' }}>
        Representative thermal model derived from circuit shape + brake energy. Not live disc telemetry.
      </div>
    </div>
  );
}

const hdr: React.CSSProperties = { fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase' };
