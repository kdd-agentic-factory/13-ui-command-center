/**
 * EdgeHubPage – KDD Trackside Edge Hub.
 *
 * Local pit-box operational status: connected devices + packet health, local
 * processing, offline-first capability, garage ready check, live event feed,
 * video sync, edge→"cloud sync, edge/cloud AI split, sim-to-real live check,
 * security and the session buffer. Offline-first, low-latency, multi-device.
 */
import { Radio, Wifi, CheckCircle2, AlertTriangle, Cloud, Cpu, Lock } from 'lucide-react';
import { useGarage } from '../hooks/useGarage';
import { useSessionContext } from '../hooks/useSessionContext';
import { buildEdgeHub, deviceColor } from '../domain/edgeHub';

const MONO = 'JetBrains Mono, monospace';

export function EdgeHubPage() {
  const garage = useGarage();
  const { ctx } = useSessionContext();
  const session = ctx.setup.stint ?? ctx.setup.session ?? 'Stint 03';
  const e = buildEdgeHub(garage.profile.rider.name, `${garage.profile.bike.brand} ${garage.profile.bike.model}`, ctx.circuitName, session, garage.telemetryLimited);

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2"><Radio size={18} /> KDD Trackside Edge Hub</h1>
          <p className="page-subtitle">Local telemetry gateway · edge processing · offline-first · secure sync – {e.combo}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9.5, fontFamily: MONO, color: 'var(--green)', display: 'inline-flex', alignItems: 'center', gap: 5 }}><Wifi size={12} /> {e.hubStatus}</div>
          <div style={{ fontSize: 10, fontFamily: MONO, color: 'var(--yellow)' }}>{e.internet}</div>
        </div>
      </div>

      <div className="card mb-4" style={{ padding: '8px 12px', background: 'var(--yellow-dim)', border: '1px solid var(--yellow-border)', fontSize: 10.5, color: 'var(--text)' }}>
        Representative edge state – no physical hardware is attached in this view; it shows how the trackside hub reports device health, packet loss, offline capability and cloud sync.
      </div>

      {/* status row */}
      <div className="card mb-4" style={{ padding: 14, display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <div><div style={hdr}>Data trust</div><div style={{ fontSize: 20, fontWeight: 800, fontFamily: MONO, color: e.dataTrust >= 85 ? 'var(--green)' : 'var(--yellow)' }}>{e.dataTrust}%</div></div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={hdr}>Cloud sync · {e.cloudSyncProgress}%</div>
          <div style={{ height: 7, borderRadius: 4, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginTop: 4 }}>
            <div style={{ width: `${e.cloudSyncProgress}%`, height: '100%', background: 'linear-gradient(90deg, var(--cyan), var(--green))' }} />
          </div>
        </div>
        <div style={{ textAlign: 'right' }}><div style={hdr}>Next action</div><div style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)' }}>{e.nextAction}</div></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
        {/* devices + packet health */}
        <div className="card" style={{ padding: 16 }}>
          <div style={card}>Connected sources · packet health</div>
          {e.devices.map(d => {
            const pk = e.packets.find(p => p.source.toLowerCase().startsWith(d.name.split(' ')[0].toLowerCase()) || d.name.toLowerCase().includes(p.source.toLowerCase()));
            return (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ width: 9, height: 9, borderRadius: 999, background: deviceColor(d.status), flexShrink: 0 }} />
                <span style={{ fontSize: 11.5, color: 'var(--text)', flex: 1 }}>{d.name}</span>
                <span style={{ fontSize: 9.5, fontFamily: MONO, color: 'var(--text-muted)' }}>{d.detail}</span>
                {pk && <span style={{ fontSize: 9, fontFamily: MONO, color: pk.status === 'OK' ? 'var(--green)' : 'var(--accent)', width: 70, textAlign: 'right' }}>{pk.rate} · {pk.packetLoss}%</span>}
              </div>
            );
          })}
        </div>

        {/* garage ready check */}
        <div className="card" style={{ padding: 16,
 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ ...card, marginBottom: 0, flex: 1 }}>Garage ready check</span>
            <span style={{ fontSize: 10, fontFamily: MONO, color: 'var(--green)', border: '1px solid rgba(0,230,118,0.4)', borderRadius: 4, padding: '1px 8px' }}>{e.readyStatus} · ready to start</span>
          </div>
          {e.garageReady.map(g => (
            <div key={g.item} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, marginBottom: 4 }}>
              {g.status === 'READY' ? <CheckCircle2 size={12} style={{ color: 'var(--green)' }} /> : <AlertTriangle size={12} style={{ color: 'var(--yellow)' }} />}
              <span style={{ color: 'var(--text)', width: 100 }}>{g.item}</span>
              <span style={{ fontSize: 10, color: g.status === 'READY' ? 'var(--text-muted)' : 'var(--yellow)' }}>{g.detail}</span>
            </div>
          ))}
        </div>
      </div>

      {/* local processing + offline-first */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={card}>Local edge processing · active</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {e.processing.map(p => <span key={p} style={{ fontSize: 9.5, fontFamily: MONO, color: 'var(--green)', border: '1px solid rgba(0,230,118,0.3)', borderRadius: 4, padding: '2px 7px' }}>{p}</span>)}
          </div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={card}>Offline-first</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--green)', textTransform: 'uppercase', marginBottom: 3 }}>Available locally</div>
              {e.offlineAvailable.slice(0, 8).map(x => <div key={x} style={{ fontSize: 10, color: 'var(--text)' }}>· {x}</div>)}
            </div>
            <div>
              <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 3 }}>Pending cloud</div>
              {e.pendingCloud.map(x => <div key={x} style={{ fontSize: 10, color: 'var(--text-muted)' }}>· {x}</div>)}
            </div>
          </div>
        </div>
      </div>

      {/* live feed + video sync */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
        <div className="card" style={{ padding: 16,
 }}>
          <div style={card}>Live event feed</div>
          <div style={{ fontSize: 11.5, color: 'var(--text)' }}><span style={{ color: 'var(--accent)' }}>NOW</span> · {e.liveFeed.now}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Last lap · {e.liveFeed.lastLap}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Trend · {e.liveFeed.trend}</div>
          <div style={{ fontSize: 11.5, color: 'var(--cyan)', marginTop: 4 }}>→ {e.liveFeed.recommendation}</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={card}>Video sync engine</div>
          <div style={{ fontSize: 11.5, color: 'var(--text)' }}>{e.videoSync.camera} · {e.videoSync.status}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>offset +{e.videoSync.offsetS}s · {e.videoSync.markers} markers · {e.videoSync.ready ? 'ready for debrief' : 'not ready'}</div>
        </div>
      </div>

      {/* edge→"cloud sync + AI split */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 14, marginTop: 14 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
            <Cloud size={14} style={{ color: 'var(--cyan)' }} />
            <span style={{ ...card, marginBottom: 0, flex: 1 }}>Edge → cloud sync · {e.sync.progress}%</span>
            <span style={{ fontSize: 9.5, fontFamily: MONO, color: 'var(--green)' }}>{e.sync.conflicts}</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ width: `${e.sync.progress}%`, height: '100%', background: 'var(--cyan)' }} />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {e.sync.items.map(x => <span key={x} style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 6px' }}>{x}</span>)}
          </div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
            <Cpu size={14} style={{ color: 'var(--violet)' }} />
            <span style={{ ...card, marginBottom: 0 }}>Edge AI vs Cloud AI</span>
          </div>
          <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--green)', textTransform: 'uppercase', marginBottom: 3 }}>Edge (local)</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6 }}>{e.edgeAI.join(' · ')}</div>
          <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--violet)', textTransform: 'uppercase', marginBottom: 3 }}>Cloud (heavy)</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{e.cloudAI.join(' · ')}</div>
        </div>
      </div>

      {/* sim-to-real live + security + buffer */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginTop: 14 }}>
        <div className="card" style={{ padding: 16,
 }}>
          <div style={card}>Sim-to-real live check</div>
          {e.simLive.rows.map(r => (
            <div key={r.metric} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, marginBottom: 3 }}>
              <span style={{ flex: 1, color: 'var(--text)' }}>{r.metric}</span>
              <span style={{ fontFamily: MONO, color: 'var(--text-muted)' }}>{r.expected}</span>
              <span style={{ fontFamily: MONO, color: r.ok ? 'var(--green)' : 'var(--yellow)' }}>{r.observed}</span>
            </div>
          ))}
          <div style={{ fontSize: 11, color: 'var(--yellow)', marginTop: 4 }}>{e.simLive.status}</div>
          <div style={{ fontSize: 10.5, color: 'var(--cyan)' }}>{e.simLive.recommendation}</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}><Lock size={13} style={{ color: 'var(--green)' }} /><span style={{ ...card, marginBottom: 0 }}>Edge security</span></div>
          {e.security.map(s => (
            <div key={s.field} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, marginBottom: 2 }}>
              <span style={{ color: 'var(--text-muted)' }}>{s.field}</span><span style={{ color: 'var(--green)', fontFamily: MONO }}>{s.status}</span>
            </div>
          ))}
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={card}>Session buffer</div>
          <div style={{ fontSize: 20, fontWeight: 800, fontFamily: MONO, color: 'var(--text)' }}>{e.buffer.sizeGB} GB</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{e.buffer.stored.join(' · ')}</div>
          <div style={{ fontSize: 10.5, color: 'var(--yellow)', marginTop: 4 }}>{e.buffer.syncStatus} · {e.buffer.retentionDays} days local</div>
        </div>
      </div>
    </div>
  );
}

const hdr: React.CSSProperties = { fontSize: 8.5, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase' };
const card: React.CSSProperties = { fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10 };
