/**
 * DevHubPage — KDD Open Motorsport Protocol & Developer / Integration Hub.
 *
 * The extensibility surface: the common data schema, official connectors with
 * health, a typed plugin ecosystem with trust levels + permissions, the SDK/API
 * surface, a plugin sandbox run, the plugin→orchestrator flow and a marketplace.
 */
import type { CSSProperties } from 'react';
import { Plug, Boxes, Code2, ShieldCheck, Store, GitMerge } from 'lucide-react';
import { useGarage } from '../hooks/useGarage';
import { useSessionContext } from '../hooks/useSessionContext';
import { useServiceData } from '../hooks/useServiceData';
import { buildDevHub, connColor, trustColor } from '../domain/devHub';

const MONO = 'JetBrains Mono, monospace';

export function DevHubPage() {
  const garage = useGarage();
  const { ctx } = useSessionContext();
  const live = useServiceData();
  const d = buildDevHub(garage.profile.rider.name, `${garage.profile.bike.brand} ${garage.profile.bike.model}`, ctx.circuitName);
  const mcpOnline = Boolean(live.health.mcp);

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2"><Plug size={18} /> Developer & Integration Hub</h1>
          <p className="page-subtitle">Open Motorsport Protocol · connectors · plugins · SDK · marketplace — {d.combo}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Integration health</div>
          <div style={{ fontSize: 24, fontWeight: 800, fontFamily: MONO, color: d.integrationHealth >= 85 ? 'var(--green)' : 'var(--yellow)' }}>{d.integrationHealth}%</div>
        </div>
      </div>

      <div className="card mb-4" style={{ padding: 12, display: 'flex', gap: 26, flexWrap: 'wrap' }}>
        {[['Installed plugins', d.installedPlugins], ['Verified', d.verifiedPlugins], ['Team-private', d.privatePlugins], ['Connectors', d.connectors.length], ['MCP tools', live.liveMcpTools.length], ['SDKs', d.sdks.length]].map(([k, v]) => (
          <div key={k as string}><div style={{ fontSize: 16, fontWeight: 800, fontFamily: MONO, color: 'var(--text)' }}>{v}</div><div style={{ fontSize: 8.5, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{k}</div></div>
        ))}
        <div style={{ marginLeft: 'auto', alignSelf: 'center', fontSize: 10, fontFamily: MONO, color: 'var(--text-muted)' }}>SDKs: {d.sdks.join(' · ')}</div>
      </div>

      {/* live MCP registry */}
      <div className="card mb-4" style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
          <GitMerge size={14} style={{ color: mcpOnline ? 'var(--cyan)' : 'var(--text-muted)' }} />
          <span style={hdr}>02 MCP Gateway · live tool registry</span>
          <span style={{ marginLeft: 'auto', fontSize: 9, fontFamily: MONO, color: mcpOnline ? 'var(--green)' : 'var(--text-muted)', border: `1px solid ${mcpOnline ? 'rgba(0,230,118,0.35)' : 'var(--border)'}`, borderRadius: 4, padding: '1px 7px', textTransform: 'uppercase' }}>
            {mcpOnline ? `live · ${live.liveMcpTools.length}` : 'offline'}
          </span>
        </div>
        <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginBottom: 8 }}>
          Browser surface is registry/read-only. Tool execution stays behind orchestrator approval and server-side principal headers.
        </div>
        {mcpOnline && live.liveMcpTools.length > 0 ? (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {live.liveMcpTools.slice(0, 24).map((tool) => (
              <span key={`${tool.server ?? 'mcp'}:${tool.name}`} style={{ fontSize: 9.5, fontFamily: MONO, color: 'var(--cyan)', border: '1px solid rgba(0,183,255,0.3)', borderRadius: 5, padding: '2px 7px', background: 'rgba(0,183,255,0.06)' }}>
                {tool.namespace ? `${tool.namespace}.` : ''}{tool.name}
              </span>
            ))}
            {live.liveMcpTools.length > 24 && <span style={{ fontSize: 9.5, fontFamily: MONO, color: 'var(--text-muted)', padding: '2px 7px' }}>+{live.liveMcpTools.length - 24} more</span>}
          </div>
        ) : (
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            MCP Gateway is asleep, unreachable, or returned an empty registry. Static plugin catalogue remains available below.
          </div>
        )}
      </div>

      {/* schema + sample */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 16, alignItems: 'start' }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}><Boxes size={14} style={{ color: 'var(--cyan)' }} /><span style={hdr}>Open Motorsport Data Schema</span></div>
          {d.schema.map(f => (
            <div key={f.field} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, marginBottom: 3 }}>
              <span style={{ fontFamily: MONO, color: 'var(--text)', flex: 1 }}>{f.field}</span>
              <span style={{ fontFamily: MONO, fontSize: 9.5, color: 'var(--text-muted)' }}>{f.type}</span>
              <span style={{ fontSize: 8.5, fontFamily: MONO, color: f.required ? 'var(--accent)' : 'var(--text-muted)' }}>{f.required ? 'required' : 'optional'}</span>
            </div>
          ))}
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={hdr}>Sample · one common language for any source</div>
          <pre style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text)', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 10, overflowX: 'auto', lineHeight: 1.45, marginTop: 8 }}>
{JSON.stringify(d.sampleSchemaJson, null, 2)}
          </pre>
        </div>
      </div>

      {/* connectors */}
      <div className="card" style={{ padding: 16, marginTop: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}><Plug size={14} style={{ color: 'var(--cyan)' }} /><span style={hdr}>Official connectors</span></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px' }}>
          {d.connectors.map(c => (
            <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
              <span style={{ width: 9, height: 9, borderRadius: 999, background: connColor(c.status), flexShrink: 0 }} />
              <span style={{ fontWeight: 700, color: 'var(--text)', width: 110 }}>{c.name}</span>
              <span style={{ fontFamily: MONO, fontSize: 9, color: connColor(c.status) }}>{c.status}{c.confidence ? ` ${c.confidence}%` : ''}</span>
              <span style={{ fontSize: 9.5, color: 'var(--text-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.note}>{c.note}</span>
            </div>
          ))}
        </div>
      </div>

      {/* plugins */}
      <div className="card" style={{ padding: 16, marginTop: 14 }}>
        <div style={hdr}>Plugin ecosystem · permissions & trust</div>
        <div style={{ marginTop: 8 }}>
          {d.plugins.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: 11 }}>
              <span style={{ fontWeight: 700, color: 'var(--text)', width: 180 }}>{p.name}</span>
              <span style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', width: 100 }}>{p.type}</span>
              <span style={{ fontSize: 8.5, fontFamily: MONO, color: trustColor(p.trust), border: `1px solid ${trustColor(p.trust)}`, borderRadius: 3, padding: '0 5px' }}>{p.trust}</span>
              <span style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
                {[['read', p.permissions.read], ['events', p.permissions.createEvents], ['recommend', p.permissions.recommend], ['export-raw', p.permissions.exportRaw]].map(([k, v]) => (
                  <span key={k as string} style={{ fontSize: 8, fontFamily: MONO, color: v ? 'var(--green)' : 'var(--text-muted)', border: `1px solid ${v ? 'rgba(0,230,118,0.3)' : 'var(--border)'}`, borderRadius: 3, padding: '0 4px' }}>{v ? '✓' : '✕'} {k}</span>
                ))}
              </span>
              <span style={{ fontSize: 9, fontFamily: MONO, color: p.installed ? 'var(--cyan)' : 'var(--text-muted)', width: 64, textAlign: 'right' }}>{p.installed ? 'installed' : 'available'}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 9.5, color: 'var(--text-muted)', marginTop: 6 }}>No plugin can modify setup, send rider alerts or export raw data without team-admin approval.</div>
      </div>

      {/* APIs + sandbox */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 14, marginTop: 14 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}><Code2 size={14} style={{ color: 'var(--violet)' }} /><span style={hdr}>API surface</span></div>
          {d.apis.map(a => (
            <div key={a.path} style={{ display: 'flex', gap: 8, fontSize: 10.5, marginBottom: 4 }}>
              <span style={{ fontFamily: MONO, fontWeight: 700, color: 'var(--cyan)', width: 42 }}>{a.method}</span>
              <span style={{ fontFamily: MONO, color: 'var(--text)', width: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.path}</span>
              <span style={{ color: 'var(--text-muted)', flex: 1 }}>{a.desc}</span>
            </div>
          ))}
        </div>
        <div className="card" style={{ padding: 16,
 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}><ShieldCheck size={14} style={{ color: 'var(--yellow)' }} /><span style={hdr}>Plugin sandbox</span></div>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text)' }}>{d.sandbox.plugin}</div>
          <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{d.sandbox.dataset}</div>
          <div style={{ display: 'flex', gap: 14, marginTop: 6, fontSize: 11, fontFamily: MONO }}>
            <span>events <b style={{ color: 'var(--text)' }}>{d.sandbox.events}</b></span>
            <span>FP <b style={{ color: 'var(--accent)' }}>{d.sandbox.falsePositives}</b></span>
            <span>{d.sandbox.runtimeMs}ms/lap</span>
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--yellow)', marginTop: 4 }}>{d.sandbox.status}</div>
        </div>
      </div>

      {/* plugin flow + marketplace + trust levels */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 14, marginTop: 14 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}><GitMerge size={14} style={{ color: 'var(--cyan)' }} /><span style={hdr}>Plugin → orchestrator flow</span></div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', fontSize: 10.5 }}>
            {d.pluginFlow.map((s, i) => (
              <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: i === 0 || i === d.pluginFlow.length - 1 ? 'var(--cyan)' : 'var(--text)' }}>{s}</span>
                {i < d.pluginFlow.length - 1 && <span style={{ color: 'rgba(255,255,255,0.25)' }}>→</span>}
              </span>
            ))}
          </div>
          <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase', margin: '10px 0 4px' }}>Plugin manifest</div>
          <pre style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text)', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 10, overflowX: 'auto', lineHeight: 1.4 }}>
{JSON.stringify(d.manifestSample, null, 2)}
          </pre>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}><Store size={14} style={{ color: 'var(--violet)' }} /><span style={hdr}>Marketplace</span></div>
            {d.marketplace.map(m => (
              <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, marginBottom: 4 }}>
                <span style={{ color: 'var(--text)', flex: 1 }}>{m.name}</span>
                <span style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)' }}>{m.category}</span>
                <span style={{ fontSize: 8.5, fontFamily: MONO, color: trustColor(m.trust) }}>{m.trust}</span>
                <span style={{ fontSize: 9, fontFamily: MONO, color: m.installed ? 'var(--green)' : 'var(--cyan)', width: 56, textAlign: 'right' }}>{m.installed ? 'installed' : 'install'}</span>
              </div>
            ))}
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div style={hdr}>Plugin trust levels</div>
            {d.trustLevels.map(t => (
              <div key={t.level} style={{ fontSize: 10.5, marginBottom: 2 }}><b style={{ color: 'var(--text)' }}>{t.level}</b> <span style={{ color: 'var(--text-muted)' }}>· {t.desc}</span></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const hdr: CSSProperties = { fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase' };

export default DevHubPage;
