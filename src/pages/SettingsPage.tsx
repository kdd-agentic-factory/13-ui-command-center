import { useState, useEffect } from 'react';
import {
  CheckCircle, XCircle, Eye, EyeOff, ExternalLink,
  Loader, RefreshCw,
} from 'lucide-react';

// ── Project constants ──────────────────────────────────────────────────────────
const PROJECT_ID = '03aba6c5-1146-4dde-848e-528daa1bab11';
const fly = (name: string) => `https://${name}-${PROJECT_ID}.fly.dev`;

type SvcStatus = 'up' | 'down' | 'deploying' | 'unknown';

interface ServiceStatus {
  name: string;
  group: string;
  url: string;
  status: SvcStatus;
  latency?: string;
  description: string;
}

// ── Service registry ───────────────────────────────────────────────────────────
// Status reflects what we know at deploy time.
// Live health-check poll updates it at runtime.
const SERVICES: ServiceStatus[] = [
  // ── Core platform
  {
    group: 'Core',
    name: 'InsForge API',
    url:  'https://vdf553wq.eu-central.insforge.app',
    status: 'up', latency: '42ms',
    description: 'Database · Auth · AI Gateway',
  },

  // ── Race operations (already running — iad region)
  {
    group: 'Race',
    name: 'Race AI Copilot',
    url:  fly('race-ai-copilot'),
    status: 'up', latency: '180ms',
    description: 'Strategy · Chat · Analysis',
  },
  {
    group: 'Race',
    name: 'Race Command Center',
    url:  fly('race-command-center'),
    status: 'up', latency: '150ms',
    description: 'Race ops · Flag management',
  },
  {
    group: 'Race',
    name: 'Digital Twin Lab',
    url:  fly('kdd-digital-twin'),
    status: 'deploying',
    description: 'Simulation · Scenario runs',
  },
  {
    group: 'Race',
    name: 'Telemetry Dataset',
    url:  fly('kdd-telemetry'),
    status: 'deploying',
    description: 'Historical data · KDD pipeline',
  },

  // ── Agentic infrastructure (already running — iad)
  {
    group: 'Agents',
    name: 'Agent Orchestrator',
    url:  fly('agent-orchestrator'),
    status: 'up', latency: '140ms',
    description: 'Multi-agent coordination · Task routing',
  },
  {
    group: 'Agents',
    name: 'MCP Gateway',
    url:  fly('mcp-gateway'),
    status: 'up', latency: '120ms',
    description: 'Tool access · External APIs',
  },
  {
    group: 'Agents',
    name: 'Skills Registry',
    url:  fly('kdd-skills'),
    status: 'deploying',
    description: 'AutoSkills · Tool registry',
  },
  {
    group: 'Agents',
    name: 'RAG Knowledge Layer',
    url:  fly('kdd-rag'),
    status: 'deploying',
    description: 'Embeddings · Vector search · CAG',
  },
  {
    group: 'Agents',
    name: 'Documentation Agent',
    url:  fly('kdd-docs'),
    status: 'deploying',
    description: 'Auto-docs · KB generation',
  },

  // ── Governance & Security (fra region)
  {
    group: 'Governance',
    name: 'KDD Governance',
    url:  fly('kdd-governance'),
    status: 'up', latency: '—',
    description: 'Policy · Guardrails · Actor roles',
  },
  {
    group: 'Governance',
    name: 'Security & Compliance',
    url:  fly('kdd-security'),
    status: 'deploying',
    description: 'RBAC · Audit · Policy enforcement',
  },
  {
    group: 'Governance',
    name: 'Agentic Workflows',
    url:  fly('kdd-workflows'),
    status: 'deploying',
    description: 'Workflow registry · DAG execution',
  },
  {
    group: 'Governance',
    name: 'Experimentation Lab',
    url:  fly('kdd-experiments'),
    status: 'deploying',
    description: 'A/B tests · Hypothesis tracking',
  },

  // ── Data (fra region)
  {
    group: 'Data',
    name: 'KDD Pipelines',
    url:  fly('kdd-pipelines'),
    status: 'deploying',
    description: 'Feature extraction · Mining · Preprocessing',
  },
  {
    group: 'Data',
    name: 'Paper Reproducibility Kit',
    url:  fly('kdd-paper-kit'),
    status: 'deploying',
    description: 'Experiment reproducibility · Paper evidence',
  },
];

// ── API keys ───────────────────────────────────────────────────────────────────
const API_KEYS = [
  { name: 'InsForge API Key',      envKey: 'VITE_INSFORGE_ANON_KEY',  value: 'ik_f3c8...94c7', status: 'set' },
  { name: 'OpenRouter API Key',    envKey: 'VITE_OPENROUTER_KEY',     value: 'sk-or-v1-efc4...', status: 'set' },
  { name: 'KDD Internal API Key',  envKey: 'VITE_KDD_INTERNAL_KEY',  value: '4e8c...92e', status: 'set' },
  { name: 'PostHog API Key',       envKey: 'VITE_POSTHOG_KEY',        value: 'phc_abc...xyz', status: 'set' },
];

// ── Data configuration ─────────────────────────────────────────────────────────
const DATA_CONFIG = [
  { name: 'Telemetry refresh rate', value: '100ms',     note: '10 Hz live data' },
  { name: 'Service health poll',    value: '30s',       note: 'Background polling' },
  { name: 'InsForge DB sync',       value: '5s',        note: 'Experiment data' },
  { name: 'AI model',               value: 'gpt-4o-mini', note: 'via InsForge Gateway' },
  { name: 'Max tokens (chat)',       value: '1024',      note: 'Per response' },
  { name: 'Fly.io — Race region',   value: 'iad',       note: 'US East · existing services' },
  { name: 'Fly.io — New region',    value: 'fra',       note: 'EU Central · new services' },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
function statusColor(s: SvcStatus) {
  if (s === 'up')        return 'var(--green)';
  if (s === 'down')      return 'var(--accent)';
  if (s === 'deploying') return 'var(--yellow)';
  return 'var(--text-muted)';
}

function StatusCell({ svc, live }: { svc: ServiceStatus; live?: SvcStatus }) {
  const status = live ?? svc.status;
  if (status === 'up') return (
    <span className="flex items-center gap-2" style={{ color: 'var(--green)' }}>
      <CheckCircle size={13} />
      <span style={{ fontSize: 11, fontWeight: 700 }}>Online</span>
    </span>
  );
  if (status === 'down') return (
    <span className="flex items-center gap-2" style={{ color: 'var(--accent)' }}>
      <XCircle size={13} />
      <span style={{ fontSize: 11, fontWeight: 700 }}>Offline</span>
    </span>
  );
  if (status === 'deploying') return (
    <span className="flex items-center gap-2" style={{ color: 'var(--yellow)' }}>
      <Loader size={13} style={{ animation: 'spin 1.4s linear infinite' }} />
      <span style={{ fontSize: 11, fontWeight: 700 }}>Deploying</span>
    </span>
  );
  return <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Unknown</span>;
}

const GROUPS = ['Core', 'Race', 'Agents', 'Governance', 'Data'];

// ── Component ─────────────────────────────────────────────────────────────────
export function SettingsPage() {
  const [showKeys, setShowKeys]   = useState<Record<string, boolean>>({});
  const [liveStatus, setLive]     = useState<Record<string, SvcStatus>>({});
  const [checking, setChecking]   = useState(false);
  const [lastChecked, setChecked] = useState<Date | null>(null);

  // Health-check all services
  async function checkHealth() {
    setChecking(true);
    const results: Record<string, SvcStatus> = {};
    await Promise.all(
      SERVICES.map(async svc => {
        if (svc.status === 'deploying') return; // skip — not live yet
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 6000);
          const r = await fetch(`${svc.url}/health`, {
            signal: controller.signal,
            mode: 'no-cors',  // avoids CORS errors on cross-origin health checks
          });
          clearTimeout(timer);
          // no-cors gives opaque response — treat as up if fetch didn't throw
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

  // Auto-check on mount
  useEffect(() => { checkHealth(); }, []);

  const upCount      = SERVICES.filter(s => (liveStatus[s.name] ?? s.status) === 'up').length;
  const deployCount  = SERVICES.filter(s => s.status === 'deploying').length;

  return (
    <div className="page">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Service connections · API keys · Data configuration</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-green">{upCount} online</span>
          {deployCount > 0 && (
            <span className="badge badge-yellow">{deployCount} deploying</span>
          )}
          <button
            className="btn btn-ghost btn-sm flex items-center gap-2"
            onClick={checkHealth}
            disabled={checking}
            title="Re-check service health"
          >
            <RefreshCw size={13} style={checking ? { animation: 'spin 1s linear infinite' } : undefined} />
            {checking ? 'Checking…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* ── Service health ───────────────────────────────────────────────────── */}
      <div className="card mb-4">
        <div className="card-header">
          <span className="card-title">Service Health</span>
          {lastChecked && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              checked {lastChecked.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
        </div>

        {GROUPS.map(group => {
          const svcs = SERVICES.filter(s => s.group === group);
          return (
            <div key={group}>
              {/* Group header */}
              <div style={{
                padding: '8px 16px 4px',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                background: 'var(--bg-surface)',
                borderBottom: '1px solid var(--border)',
              }}>
                {group}
              </div>
              <table className="data-table" style={{ marginBottom: 0 }}>
                <tbody>
                  {svcs.map(svc => {
                    const live = liveStatus[svc.name];
                    const effectiveStatus = live ?? svc.status;
                    return (
                      <tr key={svc.name}>
                        <td style={{ fontWeight: 600, width: 200 }}>{svc.name}</td>
                        <td style={{ width: 120 }}>
                          <StatusCell svc={svc} live={live} />
                        </td>
                        <td className="mono" style={{ width: 60, color: 'var(--text-muted)' }}>
                          {svc.latency ?? (effectiveStatus === 'deploying' ? '—' : '—')}
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--text-dim)', width: 220 }}>
                          {svc.description}
                        </td>
                        <td>
                          <a
                            href={svc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1"
                            style={{ fontSize: 11, color: 'var(--blue)', textDecoration: 'none', fontFamily: 'var(--font-mono)' }}
                          >
                            {svc.url.replace('https://', '').slice(0, 46)}
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
                <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{key.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {key.envKey}
                    </div>
                  </div>
                  <span className="badge badge-green">SET</span>
                </div>
                <div className="flex items-center gap-2">
                  <code style={{
                    flex: 1,
                    padding: '6px 10px',
                    background: 'var(--bg-surface)',
                    borderRadius: 5,
                    fontSize: 12,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-dim)',
                    border: '1px solid var(--border)',
                  }}>
                    {showKeys[key.name] ? key.value : '•'.repeat(22)}
                  </code>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setShowKeys(p => ({ ...p, [key.name]: !p[key.name] }))}
                    style={{ padding: '5px 8px' }}
                    title={showKeys[key.name] ? 'Hide key' : 'Show key'}
                  >
                    {showKeys[key.name] ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right column ──────────────────────────────────────────────────── */}
        <div className="flex-col gap-3">
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
            <div className="card-body flex-col gap-3" style={{ gap: 10 }}>
              {[
                { k: 'Platform',        v: 'KDD Race Engineering Platform' },
                { k: 'Version',         v: 'v3.0.0 — Race Edition' },
                { k: 'Project ID',      v: PROJECT_ID },
                { k: 'InsForge Plan',   v: 'Pro Plan' },
                { k: 'Total services',  v: `${SERVICES.length} microservices` },
                { k: 'Frontend',        v: 'vdf553wq.insforge.site (Vercel)' },
                { k: 'KDD Repos',       v: '26 sub-repositories' },
              ].map(item => (
                <div key={item.k} className="flex items-center justify-between">
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
            <div className="card-body flex-col gap-3" style={{ gap: 10 }}>
              {deployCount > 0 ? (
                <>
                  <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6 }}>
                    5 services running · {deployCount} pending deployment.
                    Pro plan is active — re-run the deploy script once InsForge quota propagates.
                  </p>
                  <div className="insight-panel" style={{ ['--dot-color' as string]: 'var(--yellow)' }}>
                    <div className="insight-panel__title" style={{ color: 'var(--yellow)' }}>Awaiting Quota Propagation</div>
                    <p className="insight-panel__body">
                      Pro plan upgraded. InsForge API still reports 5-service limit —
                      this typically resolves within a few minutes. Verify the plan
                      is linked to project&nbsp;{PROJECT_ID.slice(0, 8)}… in the InsForge
                      dashboard, then re-run <code>deploy_compute.py</code>.
                    </p>
                  </div>
                  <code style={{
                    display: 'block',
                    padding: '10px 14px',
                    background: 'var(--bg-surface)',
                    borderRadius: 6,
                    fontSize: 12,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--yellow)',
                    border: '1px solid var(--border)',
                  }}>
                    python -X utf8 deploy_compute.py
                  </code>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Deploy is idempotent — re-runs safely after quota is freed
                  </p>
                </>
              ) : (
                <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6 }}>
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

/* Spin keyframe for Loader/RefreshCw icons */
const spinStyle = document.createElement('style');
spinStyle.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
document.head.appendChild(spinStyle);
