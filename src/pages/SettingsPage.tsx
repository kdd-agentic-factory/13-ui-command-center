import { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle, XCircle, Eye, EyeOff, ExternalLink,
  Loader, RefreshCw, Server, ShieldCheck, Database,
} from 'lucide-react';

// ── Project constants ─────────────────────────────────────────────────────────
const PROJECT_ID = '03aba6c5-1146-4dde-848e-528daa1bab11';
const fly = (name: string) => `https://${name}-${PROJECT_ID}.fly.dev`;

type SvcStatus = 'up' | 'down' | 'deploying' | 'unknown';

interface ServiceStatus {
  name: string;
  group: string;
  url: string;
  status: SvcStatus;
  latency?: string;
  latencyMs?: number;
  description: string;
}

const SERVICES: ServiceStatus[] = [
  // Core
  { group: 'Core',       name: 'InsForge API',         url: 'https://vdf553wq.eu-central.insforge.app',  status: 'up',        latency: '42ms',  latencyMs: 42,  description: 'Database · Auth · AI Gateway' },
  // Race
  { group: 'Race',       name: 'Race AI Copilot',      url: fly('race-ai-copilot'),    status: 'up',        latency: '180ms', latencyMs: 180, description: 'Strategy · Chat · Analysis' },
  { group: 'Race',       name: 'Race Command Center',  url: fly('race-command-center'), status: 'up',       latency: '150ms', latencyMs: 150, description: 'Race ops · Flag management' },
  { group: 'Race',       name: 'Digital Twin Lab',     url: fly('kdd-digital-twin'),   status: 'deploying', latency: '—',     description: 'Simulation · Scenario runs' },
  { group: 'Race',       name: 'Telemetry Dataset',    url: fly('kdd-telemetry'),      status: 'deploying', latency: '—',     description: 'Historical data · KDD pipeline' },
  // Agents
  { group: 'Agents',     name: 'Agent Orchestrator',   url: fly('agent-orchestrator'), status: 'up',        latency: '140ms', latencyMs: 140, description: 'Multi-agent coordination · Task routing' },
  { group: 'Agents',     name: 'MCP Gateway',          url: fly('mcp-gateway'),        status: 'up',        latency: '120ms', latencyMs: 120, description: 'Tool access · External APIs' },
  { group: 'Agents',     name: 'Skills Registry',      url: fly('kdd-skills'),         status: 'deploying', latency: '—',     description: 'AutoSkills · Tool registry' },
  { group: 'Agents',     name: 'RAG Knowledge Layer',  url: fly('kdd-rag'),            status: 'deploying', latency: '—',     description: 'Embeddings · Vector search · CAG' },
  { group: 'Agents',     name: 'Documentation Agent',  url: fly('kdd-docs'),           status: 'deploying', latency: '—',     description: 'Auto-docs · KB generation' },
  // Governance
  { group: 'Governance', name: 'KDD Governance',       url: fly('kdd-governance'),     status: 'up',        latency: '—',     description: 'Policy · Guardrails · Actor roles' },
  { group: 'Governance', name: 'Security & Compliance',url: fly('kdd-security'),       status: 'deploying', latency: '—',     description: 'RBAC · Audit · Policy enforcement' },
  { group: 'Governance', name: 'Agentic Workflows',    url: fly('kdd-workflows'),      status: 'deploying', latency: '—',     description: 'Workflow registry · DAG execution' },
  { group: 'Governance', name: 'Experimentation Lab',  url: fly('kdd-experiments'),    status: 'deploying', latency: '—',     description: 'A/B tests · Hypothesis tracking' },
  // Data
  { group: 'Data',       name: 'KDD Pipelines',        url: fly('kdd-pipelines'),      status: 'deploying', latency: '—',     description: 'Feature extraction · Mining · Preprocessing' },
  { group: 'Data',       name: 'Paper Reproducibility',url: fly('kdd-paper-kit'),      status: 'deploying', latency: '—',     description: 'Experiment reproducibility · Paper evidence' },
];

// Values are fully masked on purpose — never echo real key fragments in the UI.
const API_KEYS = [
  { name: 'InsForge API Key',     envKey: 'VITE_INSFORGE_ANON_KEY', value: '••••••••', status: 'set' },
  { name: 'OpenRouter API Key',   envKey: 'VITE_OPENROUTER_KEY',    value: '••••••••', status: 'set' },
  { name: 'KDD Internal API Key', envKey: 'VITE_KDD_INTERNAL_KEY',  value: '••••••••', status: 'set' },
  { name: 'PostHog API Key',      envKey: 'VITE_POSTHOG_KEY',       value: '••••••••', status: 'set' },
];

const DATA_CONFIG = [
  { name: 'Telemetry refresh rate', value: '100ms',      note: '10 Hz live data' },
  { name: 'Service health poll',    value: '30s',        note: 'Background polling' },
  { name: 'InsForge DB sync',       value: '5s',         note: 'Experiment data' },
  { name: 'AI model',               value: 'gpt-4o-mini',note: 'via InsForge Gateway' },
  { name: 'Max tokens (chat)',       value: '1024',       note: 'Per response' },
  { name: 'Fly.io — Race region',   value: 'iad',        note: 'US East · existing services' },
  { name: 'Fly.io — New region',    value: 'fra',        note: 'EU Central · new services' },
];

const GROUPS = ['Core', 'Race', 'Agents', 'Governance', 'Data'];

const GROUP_ICONS: Record<string, React.ReactNode> = {
  Core:       <Database size={12} />,
  Race:       <Server   size={12} />,
  Agents:     <Server   size={12} />,
  Governance: <ShieldCheck size={12} />,
  Data:       <Database size={12} />,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusColor(s: SvcStatus) {
  if (s === 'up')        return 'var(--green)';
  if (s === 'down')      return 'var(--accent)';
  if (s === 'deploying') return 'var(--yellow)';
  return 'var(--text-muted)';
}

function StatusCell({ svc, live }: { svc: ServiceStatus; live?: SvcStatus }) {
  const status = live ?? svc.status;
  if (status === 'up')        return <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--green)' }}><CheckCircle size={13} /><span style={{ fontSize: 11, fontWeight: 700 }}>Online</span></span>;
  if (status === 'down')      return <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--accent)' }}><XCircle size={13} /><span style={{ fontSize: 11, fontWeight: 700 }}>Offline</span></span>;
  if (status === 'deploying') return <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--yellow)' }}><Loader size={13} style={{ animation: 'spin 1.4s linear infinite' }} /><span style={{ fontSize: 11, fontWeight: 700 }}>Deploying</span></span>;
  return <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Unknown</span>;
}

// ── Health Ring (SVG donut) ───────────────────────────────────────────────────

function HealthRing({ up, deploying, total }: { up: number; deploying: number; total: number }) {
  const down = total - up - deploying;
  const r = 44; const cx = 56; const cy = 56;
  const circ = 2 * Math.PI * r;

  const segments = [
    { value: up,        color: '#22C55E', label: 'Online'    },
    { value: deploying, color: '#F59E0B', label: 'Deploying' },
    { value: down,      color: '#E03737', label: 'Offline'   },
  ];

  let offset = circ * 0.25; // start from top
  const arcs = segments.map(s => {
    const dash   = (s.value / total) * circ;
    const gap    = circ - dash;
    const result = { ...s, dash, gap, offset };
    offset += dash;
    if (offset > circ) offset -= circ;
    return result;
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <svg width="112" height="112" viewBox="0 0 112 112">
        {/* Background ring */}
        <circle cx={cx} cy={cy} r={r} fill="none"
          stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
        {arcs.map((arc, i) => arc.value > 0 && (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={arc.color} strokeWidth="10"
            strokeLinecap="butt"
            strokeDasharray={`${arc.dash} ${arc.gap}`}
            strokeDashoffset={-arc.offset}
            transform={`rotate(-90 ${cx} ${cy})`}
            opacity="0.9"
          />
        ))}
        {/* Center text */}
        <text x={cx} y={cy - 4} textAnchor="middle" fill="white"
          fontSize="18" fontFamily="JetBrains Mono,monospace" fontWeight="700">
          {up}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="#535A6E"
          fontSize="9" fontFamily="JetBrains Mono,monospace">
          / {total}
        </text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {segments.map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 8, height: 8, borderRadius: 2,
              background: s.color,
              opacity: s.value === 0 ? 0.25 : 1,
            }} />
            <span style={{
              fontSize: 11, fontFamily: 'JetBrains Mono,monospace',
              color: s.value > 0 ? s.color : 'var(--text-muted)',
              fontWeight: s.value > 0 ? 700 : 400,
            }}>
              {s.value} {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Latency bar chart ─────────────────────────────────────────────────────────

function LatencyChart({ services }: { services: ServiceStatus[] }) {
  const online = services.filter(s => s.latencyMs != null);
  if (online.length === 0) return (
    <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: 16 }}>
      No latency data — services pending
    </div>
  );
  const maxMs = Math.max(...online.map(s => s.latencyMs!));

  return (
    <div>
      {online.map(s => {
        const pct   = (s.latencyMs! / maxMs) * 100;
        const color = s.latencyMs! < 100 ? 'var(--green)'
          : s.latencyMs! < 300 ? 'var(--yellow)'
          : 'var(--accent)';
        return (
          <div key={s.name} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontSize: 11, color: 'var(--text)' }}>{s.name}</span>
              <span style={{
                fontSize: 10, fontFamily: 'JetBrains Mono,monospace',
                color, fontWeight: 700,
              }}>
                {s.latencyMs}ms
              </span>
            </div>
            <div style={{ height: 5, background: 'rgba(255,255,255,0.04)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                width: `${pct}%`, height: '100%',
                background: color, borderRadius: 3,
                transition: 'width 0.5s',
              }} />
            </div>
          </div>
        );
      })}
      <div style={{
        marginTop: 10, fontSize: 10, color: 'var(--text-muted)',
        fontFamily: 'JetBrains Mono,monospace',
      }}>
        p95 latency · green &lt; 100ms · yellow &lt; 300ms · red ≥ 300ms
      </div>
    </div>
  );
}

// ── Group health summary cards ────────────────────────────────────────────────

function GroupHealthCards({
  services, liveStatus,
}: {
  services: ServiceStatus[];
  liveStatus: Record<string, SvcStatus>;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 20 }}>
      {GROUPS.map(group => {
        const svcs   = services.filter(s => s.group === group);
        const up     = svcs.filter(s => (liveStatus[s.name] ?? s.status) === 'up').length;
        const deploy = svcs.filter(s => s.status === 'deploying').length;
        const total  = svcs.length;
        const allUp  = up === total;
        const hasDown = svcs.some(s => (liveStatus[s.name] ?? s.status) === 'down');
        const color  = hasDown ? 'var(--accent)' : allUp ? 'var(--green)' : 'var(--yellow)';

        return (
          <div key={group} style={{
            padding: '12px 14px',
            background: `${color === 'var(--green)' ? 'rgba(34,197,94' : color === 'var(--yellow)' ? 'rgba(245,158,11' : 'rgba(224,55,55'},0.07)`,
            border: `1px solid ${color === 'var(--green)' ? 'rgba(34,197,94' : color === 'var(--yellow)' ? 'rgba(245,158,11' : 'rgba(224,55,55'},0.25)`,
            borderRadius: 8,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
              color, fontSize: 10,
              fontWeight: 700, fontFamily: 'JetBrains Mono,monospace',
              letterSpacing: '0.05em',
            }}>
              {GROUP_ICONS[group]}
              {group.toUpperCase()}
            </div>
            <div style={{
              fontSize: 20, fontWeight: 700, fontFamily: 'JetBrains Mono,monospace',
              color,
            }}>
              {up}<span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>/{total}</span>
            </div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>
              {deploy > 0 ? `${deploy} deploying` : allUp ? 'all online' : hasDown ? 'service down' : 'degraded'}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function SettingsPage() {
  const [showKeys, setShowKeys]   = useState<Record<string, boolean>>({});
  const [liveStatus, setLive]     = useState<Record<string, SvcStatus>>({});
  const [checking, setChecking]   = useState(false);
  const [lastChecked, setChecked] = useState<Date | null>(null);

  async function checkHealth() {
    setChecking(true);
    const results: Record<string, SvcStatus> = {};
    await Promise.all(
      SERVICES.map(async svc => {
        if (svc.status === 'deploying') return;
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 6000);
          await fetch(`${svc.url}/health`, { signal: controller.signal, mode: 'no-cors' });
          clearTimeout(timer);
          results[svc.name] = 'up';
        } catch {
          results[svc.name] = 'down';
        }
      })
    );
    setLive(results);
    setChecked(new Date());
    setChecking(false);
  }

  useEffect(() => { checkHealth(); }, []);

  const upCount     = SERVICES.filter(s => (liveStatus[s.name] ?? s.status) === 'up').length;
  const deployCount = SERVICES.filter(s => s.status === 'deploying').length;
  const downCount   = SERVICES.filter(s => (liveStatus[s.name] ?? s.status) === 'down').length;

  const onlineServices = useMemo(() =>
    SERVICES.filter(s => s.latencyMs != null), []);

  return (
    <div className="page">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Service connections · API keys · Data configuration · Infrastructure health</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-green">{upCount} online</span>
          {deployCount > 0 && <span className="badge badge-yellow">{deployCount} deploying</span>}
          {downCount > 0   && <span className="badge badge-red">{downCount} offline</span>}
          <button
            className="btn btn-ghost btn-sm flex items-center gap-2"
            onClick={checkHealth}
            disabled={checking}
          >
            <RefreshCw size={13} style={checking ? { animation: 'spin 1s linear infinite' } : undefined} />
            {checking ? 'Checking…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* ── Health overview row: ring + latency chart ────────────────────── */}
      <div className="grid-2 mb-4">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Infrastructure Health</span>
            {lastChecked && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace' }}>
                {lastChecked.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
          </div>
          <div className="card-body">
            <HealthRing up={upCount} deploying={deployCount} total={SERVICES.length} />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Service Latency</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace' }}>
              online services only
            </span>
          </div>
          <div className="card-body">
            <LatencyChart services={onlineServices} />
          </div>
        </div>
      </div>

      {/* ── Group health cards ───────────────────────────────────────────── */}
      <GroupHealthCards services={SERVICES} liveStatus={liveStatus} />

      {/* ── Service health table ─────────────────────────────────────────── */}
      <div className="card mb-4">
        <div className="card-header">
          <span className="card-title">Service Registry</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace' }}>
            {SERVICES.length} microservices
          </span>
        </div>

        {GROUPS.map(group => {
          const svcs = SERVICES.filter(s => s.group === group);
          return (
            <div key={group}>
              <div style={{
                padding: '7px 16px 4px',
                fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: 'var(--text-muted)',
                background: 'var(--bg-surface)',
                borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                {GROUP_ICONS[group]}{group}
              </div>
              <table className="data-table" style={{ marginBottom: 0 }}>
                <tbody>
                  {svcs.map(svc => {
                    const live = liveStatus[svc.name];
                    const effectiveStatus = live ?? svc.status;
                    return (
                      <tr key={svc.name}>
                        <td style={{ fontWeight: 600, width: 200 }}>{svc.name}</td>
                        <td style={{ width: 130 }}><StatusCell svc={svc} live={live} /></td>
                        <td className="mono" style={{ width: 64, color: statusColor(effectiveStatus) }}>
                          {svc.latency ?? '—'}
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)', width: 240 }}>
                          {svc.description}
                        </td>
                        <td>
                          <a href={svc.url} target="_blank" rel="noopener noreferrer"
                            style={{
                              display: 'flex', alignItems: 'center', gap: 4,
                              fontSize: 11, color: 'var(--blue)', textDecoration: 'none',
                              fontFamily: 'JetBrains Mono,monospace',
                            }}>
                            {svc.url.replace('https://', '').slice(0, 44)}
                            <ExternalLink size={10} />
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>

      <div className="grid-2">
        {/* ── API Keys ──────────────────────────────────────────────────────── */}
        <div className="card">
          <div className="card-header"><span className="card-title">API Keys</span></div>
          <div>
            {API_KEYS.map(key => (
              <div key={key.name} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{key.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace' }}>
                      {key.envKey}
                    </div>
                  </div>
                  <span className="badge badge-green">SET</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <code style={{
                    flex: 1, padding: '6px 10px',
                    background: 'var(--bg-surface)', borderRadius: 5,
                    fontSize: 12, fontFamily: 'JetBrains Mono,monospace',
                    color: 'var(--text-muted)', border: '1px solid var(--border)',
                  }}>
                    {showKeys[key.name] ? key.value : '•'.repeat(22)}
                  </code>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setShowKeys(p => ({ ...p, [key.name]: !p[key.name] }))}
                    style={{ padding: '5px 8px' }}
                  >
                    {showKeys[key.name] ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right column ──────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Data config */}
          <div className="card">
            <div className="card-header"><span className="card-title">Data Configuration</span></div>
            <div>
              {DATA_CONFIG.map(c => (
                <div key={c.name} className="setup-row">
                  <span className="setup-name">{c.name}</span>
                  <span className="setup-val text-mono" style={{ color: 'var(--cyan)' }}>{c.value}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>{c.note}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Platform info */}
          <div className="card">
            <div className="card-header"><span className="card-title">Platform Information</span></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { k: 'Platform',        v: 'KDD Race Engineering Platform' },
                { k: 'Version',         v: 'v3.0.0 — Race Edition' },
                { k: 'Project ID',      v: PROJECT_ID },
                { k: 'InsForge Plan',   v: 'Pro Plan' },
                { k: 'Total services',  v: `${SERVICES.length} microservices` },
                { k: 'Frontend',        v: 'vdf553wq.insforge.site (Vercel)' },
                { k: 'KDD Repos',       v: '26 sub-repositories' },
              ].map(item => (
                <div key={item.k} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{item.k}</span>
                  <span className="text-mono" style={{ fontSize: 12, color: 'var(--text)' }}>{item.v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Deploy status */}
          <div className="card" style={{ borderColor: deployCount > 0 ? 'rgba(245,158,11,0.3)' : 'var(--border)' }}>
            <div className="card-header">
              <span className="card-title" style={{ color: deployCount > 0 ? 'var(--yellow)' : 'var(--green)' }}>
                {deployCount > 0 ? `${deployCount} Services Pending` : 'All Services Deployed'}
              </span>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {deployCount > 0 ? (
                <>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    {upCount} services running · {deployCount} pending deployment.
                    Pro plan is active — re-run the deploy script once InsForge quota propagates.
                  </p>
                  <div className="insight-panel" style={{ ['--dot-color' as string]: 'var(--yellow)' }}>
                    <div className="insight-panel__title" style={{ color: 'var(--yellow)' }}>Awaiting Quota Propagation</div>
                    <p className="insight-panel__body">
                      Pro plan upgraded. InsForge API still reports 5-service limit —
                      this typically resolves within a few minutes. Verify the plan is linked
                      to project {PROJECT_ID.slice(0, 8)}… then re-run{' '}
                      <code>deploy_compute.py</code>.
                    </p>
                  </div>
                  <code style={{
                    display: 'block', padding: '10px 14px',
                    background: 'var(--bg-surface)', borderRadius: 6,
                    fontSize: 12, fontFamily: 'JetBrains Mono,monospace',
                    color: 'var(--yellow)', border: '1px solid var(--border)',
                  }}>
                    python -X utf8 deploy_compute.py
                  </code>
                </>
              ) : (
                <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  All {SERVICES.length} services are deployed and running.
                  Use the Refresh button above to re-check live health status.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Spin keyframe */
const spinStyle = document.createElement('style');
spinStyle.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
document.head.appendChild(spinStyle);
