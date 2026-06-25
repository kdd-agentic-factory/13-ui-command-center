/**
 * TyrePressurePage — KDD Tyre Pressure & Compliance.
 *
 * The front pressure rule, the cold→hot window, the live compliance vs the rule
 * (laps above the line), the lap pressure curve, the dirty-air effect and the
 * weekend tyre allocation — keeping you legal while you lead.
 */
import { Gauge, ShieldCheck, Wind, Circle } from 'lucide-react';
import { useGarage } from '../hooks/useGarage';
import { useSessionContext } from '../hooks/useSessionContext';
import { buildTyrePressure, complianceColor } from '../domain/tyrePressure';

const MONO = 'JetBrains Mono, monospace';

export function TyrePressurePage() {
  const garage = useGarage();
  const { ctx, circuit } = useSessionContext();
  const t = buildTyrePressure(
    garage.profile.rider.name,
    `${garage.profile.bike.brand} ${garage.profile.bike.model}`,
    ctx.circuitName, circuit.lengthKm,
  );
  const lo = Math.min(t.rule.minFrontBar - 0.08, ...t.curve.map(p => p.frontBar));
  const hi = Math.max(...t.curve.map(p => p.frontBar)) + 0.04;
  const y = (bar: number) => ((bar - lo) / (hi - lo)) * 100;

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2"><Gauge size={18} /> Tyre Pressure & Compliance</h1>
          <p className="page-subtitle">Front rule ≥ {t.rule.minFrontBar.toFixed(2)} bar for {t.rule.requiredPct}% of laps — {t.combo}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Compliance</div>
          <div style={{ fontSize: 24, fontWeight: 800, fontFamily: MONO, color: complianceColor(t.compliance.status) }}>{t.compliance.pct}%</div>
        </div>
      </div>

      {/* verdict */}
      <div className="card mb-4" style={{ padding: 14, borderLeft: '3px solid var(--accent)' }}>
        <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>KDD verdict</div>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>{t.verdict}</div>
        <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 4, fontStyle: 'italic' }}>{t.punchline}</div>
      </div>

      {/* compliance + window */}
      <div className="card mb-4" style={{ padding: 12, display: 'flex', gap: 26, flexWrap: 'wrap', alignItems: 'center' }}>
        {[['Laps above min', `${t.compliance.lapsAboveMin}/${t.raceLaps}`], ['Required', t.compliance.lapsRequired], ['Margin', `${t.compliance.marginLaps >= 0 ? '+' : ''}${t.compliance.marginLaps}`], ['Cold front', `${t.current.coldFrontBar.toFixed(2)}`], ['Hot front', `${t.current.hotFrontBar.toFixed(2)}`]].map(([k, v]) => (
          <div key={k as string}><div style={{ fontSize: 15, fontWeight: 800, fontFamily: MONO, color: 'var(--text)' }}>{v}</div><div style={{ fontSize: 8.5, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{k}</div></div>
        ))}
        <div style={{ marginLeft: 'auto', fontSize: 10, fontFamily: MONO, color: complianceColor(t.compliance.status), border: `1px solid ${complianceColor(t.compliance.status)}`, borderRadius: 4, padding: '3px 8px', textTransform: 'uppercase' }}>{t.compliance.status}</div>
      </div>

      {/* pressure curve vs min line */}
      <div className="card" style={{ padding: 16, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}><Gauge size={14} style={{ color: 'var(--cyan)' }} /><span style={hdr}>Front pressure through the race vs the {t.rule.minFrontBar.toFixed(2)} bar line</span></div>
        <div style={{ position: 'relative', height: 120, display: 'flex', alignItems: 'flex-end', gap: 12 }}>
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: `${y(t.rule.minFrontBar)}%`, borderTop: '1px dashed var(--accent)', zIndex: 2 }}>
            <span style={{ position: 'absolute', right: 0, top: -12, fontSize: 8, fontFamily: MONO, color: 'var(--accent)' }}>min {t.rule.minFrontBar.toFixed(2)}</span>
          </div>
          {t.curve.map(p => (
            <div key={p.phase} title={`${p.phase}: ${p.frontBar} bar`} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', height: '100%', zIndex: 1 }}>
              <span style={{ fontSize: 8.5, fontFamily: MONO, color: p.aboveMin ? 'var(--green)' : 'var(--accent)' }}>{p.frontBar.toFixed(2)}</span>
              <span style={{ width: '62%', height: `${Math.max(4, y(p.frontBar))}%`, background: p.aboveMin ? 'var(--green)' : 'var(--accent)', borderRadius: '2px 2px 0 0' }} />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
          {t.curve.map(p => <span key={p.phase} style={{ flex: 1, fontSize: 8, fontFamily: MONO, color: 'var(--text-muted)', textAlign: 'center' }}>{p.phase}</span>)}
        </div>
      </div>

      {/* dirty air + allocation */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 14 }}>
        <div className="card" style={{ padding: 16, borderLeft: '3px solid var(--cyan)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}><Wind size={14} style={{ color: 'var(--cyan)' }} /><span style={hdr}>Dirty-air effect</span></div>
          <div style={{ fontSize: 22, fontWeight: 800, fontFamily: MONO, color: 'var(--cyan)' }}>+{t.dirtyAir.riseBar.toFixed(2)} bar</div>
          <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)' }}>front rise when following</div>
          <div style={{ fontSize: 9.5, color: 'var(--text-muted)', marginTop: 6 }}>{t.dirtyAir.note}</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}><Circle size={14} style={{ color: 'var(--violet)' }} /><span style={hdr}>Weekend tyre allocation</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[['Front', t.allocationFront], ['Rear', t.allocationRear]].map(([label, sets]) => (
              <div key={label as string}>
                <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>{label as string}</div>
                {(sets as typeof t.allocationFront).map(s => (
                  <div key={s.compound} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, marginBottom: 3 }}>
                    <span style={{ color: 'var(--text)', width: 56 }}>{s.compound}</span>
                    <span style={{ display: 'flex', gap: 2 }}>
                      {Array.from({ length: s.allocated }, (_, i) => (
                        <span key={i} style={{ width: 9, height: 9, borderRadius: 2, background: i < s.used ? 'var(--text-muted)' : 'var(--green)' }} />
                      ))}
                    </span>
                    <span style={{ fontFamily: MONO, fontSize: 8.5, color: 'var(--text-muted)', marginLeft: 'auto' }}>{s.allocated - s.used} left</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 8.5, fontFamily: MONO, color: 'var(--text-muted)', marginTop: 6 }}>green = available · grey = used</div>
        </div>
      </div>

      {/* recommendations */}
      <div className="card" style={{ padding: 16, marginTop: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}><ShieldCheck size={14} style={{ color: 'var(--cyan)' }} /><span style={hdr}>Compliance plan</span></div>
        {t.recommendations.map((rec, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, fontSize: 10.5, marginBottom: 5, alignItems: 'baseline' }}>
            <span style={{ color: 'var(--cyan)', fontFamily: MONO }}>{i + 1}</span>
            <span style={{ color: 'var(--text-muted)' }}>{rec}</span>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', marginTop: 14, fontStyle: 'italic' }}>
        Representative compliance model derived from race length. Not a live tyre-pressure-monitor feed.
      </div>
    </div>
  );
}

const hdr: React.CSSProperties = { fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase' };
