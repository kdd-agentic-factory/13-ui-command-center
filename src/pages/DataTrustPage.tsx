/**
 * DataTrustPage — Telemetry Calibration & Data Trust Center.
 *
 * Validates, maps, syncs and scores the telemetry before advanced analysis is
 * allowed: a global Data Trust Score, channel mapping, automatic validation,
 * per-module trust, graceful degraded modes, bike/circuit compatibility, time
 * sync, data lineage and the Oracle's data-trust posture.
 */
import { ShieldCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useGarage } from '../hooks/useGarage';
import { useSessionContext } from '../hooks/useSessionContext';
import { buildDataTrust, channelColor, scoreColor } from '../domain/dataTrust';

const MONO = 'JetBrains Mono, monospace';

export function DataTrustPage() {
  const garage = useGarage();
  const { ctx } = useSessionContext();
  const session = ctx.setup.stint ?? ctx.setup.session ?? 'Stint 03';
  const d = buildDataTrust(garage.profile.rider.name, `${garage.profile.bike.brand} ${garage.profile.bike.model}`, ctx.circuitName, session, garage.telemetryLimited);

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2"><ShieldCheck size={18} /> Telemetry Calibration & Data Trust</h1>
          <p className="page-subtitle">Sensor mapping · channel validation · data quality · trust score — {d.combo}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Data trust score</div>
          <div style={{ fontSize: 30, fontWeight: 800, fontFamily: MONO, color: scoreColor(d.trustScore) }}>{d.trustScore}%</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: scoreColor(d.trustScore) }}>{d.status}</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        <span style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase', alignSelf: 'center' }}>Sources</span>
        {d.sources.map(s => <span key={s} style={{ fontSize: 10, fontFamily: MONO, color: 'var(--cyan)', border: '1px solid rgba(0,183,255,0.3)', borderRadius: 5, padding: '2px 8px' }}>{s}</span>)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16, alignItems: 'start' }}>
        {/* Channel mapping */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>Channel mapping studio</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr auto auto', gap: '5px 10px', fontSize: 11, alignItems: 'center' }}>
            <span style={hdr}>Imported</span><span style={hdr}>Mapped to</span><span style={hdr}>Status</span><span style={{ ...hdr, textAlign: 'right' }}>Conf.</span>
            {d.channels.map(c => (
              <Row key={c.imported} a={c.imported} b={`${c.mappedTo}${c.unit ? ` · ${c.unit}` : ''}`} status={c.status} conf={c.confidence} />
            ))}
          </div>
        </div>

        {/* Module trust */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>Module trust score</div>
          {d.moduleTrust.map(m => (
            <div key={m.module} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ width: 130, fontSize: 11, color: 'var(--text)' }}>{m.module}</span>
              <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <div style={{ width: `${m.score}%`, height: '100%', background: scoreColor(m.score) }} />
              </div>
              <span style={{ width: 30, textAlign: 'right', fontSize: 10.5, fontFamily: MONO, color: scoreColor(m.score) }}>{m.score}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Automatic validation */}
      <div className="card" style={{ padding: 16, marginTop: 14 }}>
        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>Automatic validation</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px' }}>
          {d.validations.map(v => {
            const color = v.status === 'OK' ? 'var(--green)' : v.status === 'Missing' ? 'var(--accent)' : 'var(--yellow)';
            return (
              <div key={v.channel} style={{ display: 'flex', gap: 8, fontSize: 11.5 }}>
                <span style={{ color, fontFamily: MONO, fontSize: 9.5, border: `1px solid ${color}`, borderRadius: 3, padding: '0 5px', height: 16, alignSelf: 'flex-start' }}>{v.status.toUpperCase()}</span>
                <span><b style={{ color: 'var(--text)' }}>{v.channel}</b> <span style={{ color: 'var(--text-muted)' }}>{v.note}</span></span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Degraded modes */}
      <div style={{ display: 'grid', gridTemplateColumns: d.degraded.length > 1 ? '1fr 1fr' : '1fr', gap: 14, marginTop: 14 }}>
        {d.degraded.map(g => (
          <div key={g.trigger} className="card" style={{ padding: 16, borderLeft: '3px solid var(--yellow)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={14} style={{ color: 'var(--yellow)' }} />
              <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--text)', flex: 1 }}>{g.trigger}</span>
              <span style={{ fontSize: 10, fontFamily: MONO, color: scoreColor(g.confidence) }}>{g.confidence}%</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 8px' }}>{g.impact}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 3 }}>Disabled</div>
                {g.disabled.map(x => <div key={x} style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>· {x}</div>)}
              </div>
              <div>
                <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--green)', textTransform: 'uppercase', marginBottom: 3 }}>Still available</div>
                {g.available.map(x => <div key={x} style={{ fontSize: 10.5, color: 'var(--text)' }}>· {x}</div>)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Compatibility + alignment + sync + lineage */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginTop: 14 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={cardHdr}>Telemetry compatibility</div>
          <Line k="Selected bike" v={d.compatibility.selectedBike} />
          <Line k="Detected profile" v={d.compatibility.detectedProfile} />
          <Line k="Compatibility" v={`${d.compatibility.compatibility}%`} color="var(--green)" />
          <Line k="Status" v={d.compatibility.status} color={d.compatibility.status === 'OK' ? 'var(--green)' : 'var(--accent)'} />
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={cardHdr}>Track alignment</div>
          <Line k="Circuit" v={d.alignment.circuit} />
          <Line k="GPS trace match" v={`${d.alignment.gpsMatch}%`} color="var(--green)" />
          <Line k="Lap length" v={`${d.alignment.lapLengthKm} km (exp ${d.alignment.expectedKm})`} />
          <Line k="Corners" v={d.alignment.cornersMatched} />
          <Line k="Status" v={d.alignment.status} color="var(--green)" />
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={cardHdr}>Time sync studio</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
            {d.syncSources.map(s => <span key={s.name} style={{ fontSize: 10, fontFamily: MONO, color: 'var(--text-muted)' }}>{s.name} <span style={{ color: 'var(--text)' }}>{s.rate}</span></span>)}
          </div>
          {d.sync.map(s => (
            <div key={s.pair} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, marginBottom: 3 }}>
              {s.ok ? <CheckCircle2 size={12} style={{ color: 'var(--green)' }} /> : <AlertTriangle size={12} style={{ color: 'var(--yellow)' }} />}
              <span style={{ color: 'var(--text)', flex: 1 }}>{s.pair}</span>
              <span style={{ fontFamily: MONO, fontSize: 10, color: s.ok ? 'var(--green)' : 'var(--yellow)' }}>{s.status}</span>
            </div>
          ))}
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={cardHdr}>Data lineage</div>
          <Line k="Source" v={d.lineage.source} />
          <Line k="Imported" v={d.lineage.importedAt} />
          <Line k="Calibration" v={d.lineage.calibProfile} />
          <Line k="Mapped channels" v={d.lineage.mappedChannels} />
          <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase', margin: '6px 0 3px' }}>Used by</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {d.lineage.usedBy.map(u => <span key={u} style={{ fontSize: 9.5, fontFamily: MONO, color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 6px' }}>{u}</span>)}
          </div>
        </div>
      </div>

      {/* Oracle data trust + actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
        <div className="card" style={{ padding: 16, background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.3)' }}>
          <div style={{ ...cardHdr, color: '#8B5CF6' }}>Oracle data trust · {d.oracle.confidence}%</div>
          {d.oracle.limitations.map(l => <div key={l} style={{ fontSize: 11, color: 'var(--text-muted)' }}>· {l}</div>)}
          <div style={{ fontSize: 11, color: 'var(--text)', marginTop: 6 }}>{d.oracle.behaviour}</div>
        </div>
        <div className="card" style={{ padding: 16, borderLeft: '3px solid var(--cyan)' }}>
          <div style={cardHdr}>Recommended actions</div>
          <ol style={{ margin: 0, paddingLeft: 18, fontSize: 11.5, color: 'var(--text)', lineHeight: 1.7 }}>
            {d.recommendedActions.map(a => <li key={a}>{a}</li>)}
          </ol>
        </div>
      </div>
    </div>
  );
}

const hdr: React.CSSProperties = { fontSize: 8.5, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase' };
const cardHdr: React.CSSProperties = { fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 };

function Row({ a, b, status, conf }: { a: string; b: string; status: string; conf: number }) {
  return (
    <>
      <span style={{ fontFamily: MONO, fontSize: 10.5, color: 'var(--text-muted)' }}>{a}</span>
      <span style={{ fontSize: 11, color: 'var(--text)' }}>{b}</span>
      <span style={{ fontSize: 9.5, fontFamily: MONO, color: channelColor(status as never), border: `1px solid ${channelColor(status as never)}`, borderRadius: 3, padding: '0 5px' }}>{status}</span>
      <span style={{ fontSize: 10, fontFamily: MONO, color: scoreColor(conf), textAlign: 'right' }}>{conf ? `${conf}%` : '—'}</span>
    </>
  );
}

function Line({ k, v, color }: { k: string; v: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 11.5, marginBottom: 3 }}>
      <span style={{ color: 'var(--text-muted)' }}>{k}</span>
      <span style={{ color: color ?? 'var(--text)', fontFamily: MONO, textAlign: 'right' }}>{v}</span>
    </div>
  );
}
