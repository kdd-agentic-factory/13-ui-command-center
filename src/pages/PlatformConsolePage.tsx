/**
 * PlatformConsolePage — the live platform surface.
 *
 * Promotes the KDD backends from a single health dot to real features:
 * renders the live data they actually return — KDD lifecycle stages
 * (governance), agents + intent routing (orchestrator), skills, workflows,
 * experiments and MCP tools — while also showing the conservative service
 * registry health matrix for canonical app and external capabilities.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { Server, Cpu, Workflow, FlaskConical, Wrench, Layers, Bot, Send, Loader2 } from 'lucide-react';
import { useServiceData } from '../hooks/useServiceData';
import { useInsForgeData } from '../hooks/useInsForgeData';
import {
  fetchServiceRegistryHealth,
  orchestrate,
  SERVICE_STATUS,
  type OrchestrationResult,
  type ServiceRegistryHealthEntry,
} from '../services/api';

const MONO = 'JetBrains Mono, monospace';

function Panel({ icon: Icon, title, count, online, children }: {
  icon: typeof Server; title: string; count: number; online: boolean; children: ReactNode;
}) {
  return (
    <div className="card" style={{ padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Icon size={14} style={{ color: 'var(--cyan)' }} />
        <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--text)', flex: 1 }}>{title}</span>
        <span style={{ fontSize: 9, fontFamily: MONO, color: online ? 'var(--green)' : 'var(--text-muted)', border: `1px solid ${online ? 'rgba(0,230,118,0.4)' : 'var(--border)'}`, borderRadius: 5, padding: '1px 7px' }}>
          {online ? `LIVE —· ${count}` : 'OFFLINE'}
        </span>
      </div>
      {online ? children : <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Service asleep / unreachable — no live data.</div>}
    </div>
  );
}

function statusColor(status: ServiceRegistryHealthEntry['status']) {
  if (status === SERVICE_STATUS.ONLINE) return 'var(--green)';
  if (status === SERVICE_STATUS.DEGRADED) return 'var(--accent)';
  if (status === SERVICE_STATUS.NOT_CONFIGURED) return 'var(--text-muted)';
  return 'var(--red)';
}

function statusLabel(status: ServiceRegistryHealthEntry['status']) {
  return status.replace('_', ' ');
}

function HealthMatrix({ entries, loading }: { entries: ServiceRegistryHealthEntry[]; loading: boolean }) {
  const grouped = entries.reduce<Record<string, ServiceRegistryHealthEntry[]>>((acc, entry) => {
    acc[entry.category] = [...(acc[entry.category] ?? []), entry];
    return acc;
  }, {});

  const online = entries.filter((entry) => entry.status === SERVICE_STATUS.ONLINE).length;
  const probed = entries.filter((entry) => entry.status !== SERVICE_STATUS.NOT_CONFIGURED).length;

  return (
    <div className="card mb-4" style={{ padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Server size={14} style={{ color: 'var(--cyan)' }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Service Registry —· health matrix
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            Canonical app services and external capabilities. Browser probes stay conservative: no secret headers and no storage calls.
          </div>
        </div>
        <span style={{ fontSize: 10, fontFamily: MONO, color: online > 0 ? 'var(--green)' : 'var(--text-muted)' }}>
          {loading ? 'checking—…' : `${online}/${probed} probed online`}
        </span>
      </div>

      {Object.entries(grouped).map(([category, services]) => (
        <div key={category} style={{ marginTop: 12 }}>
          <div style={{ fontSize: 10, fontFamily: MONO, color: category === 'External capabilities' ? 'var(--accent)' : 'var(--cyan)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 7 }}>
            {category}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 8 }}>
            {services.map((service) => (
              <div key={service.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 10, background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text)' }}>{service.name}</div>
                    <div style={{ fontSize: 10, fontFamily: MONO, color: 'var(--text-muted)', marginTop: 2 }}>{service.repo}</div>
                  </div>
                  <span style={{ fontSize: 9, fontFamily: MONO, color: statusColor(service.status), border: `1px solid ${statusColor(service.status)}`, borderRadius: 5, padding: '1px 6px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                    {statusLabel(service.status)}
                  </span>
                </div>
                <div style={{ marginTop: 7, fontSize: 11, color: 'var(--text)' }}>{service.purpose}</div>
                <div style={{ marginTop: 7, display: 'grid', gap: 3, fontSize: 10, fontFamily: MONO, color: 'var(--text-muted)' }}>
                  <span>base: {service.baseUrl || 'informational only'}</span>
                  <span>health: {service.healthPath || 'not probed'}</span>
                  <span>criticality: {service.criticality}</span>
                  <span>{service.detail}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Chips({ items }: { items: string[] }) {
  if (!items.length) return <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>No records returned.</div>;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
      {items.slice(0, 24).map((x, i) => (
        <span key={i} style={{ fontSize: 10, fontFamily: MONO, color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 5, padding: '2px 7px' }}>{x}</span>
      ))}
    </div>
  );
}

export function PlatformConsolePage() {
  const live = useServiceData();
  const insforge = useInsForgeData();
  const [registryHealth, setRegistryHealth] = useState<ServiceRegistryHealthEntry[]>([]);
  const [registryLoading, setRegistryLoading] = useState(true);
  const [intent, setIntent] = useState('');
  const [routing, setRouting] = useState(false);
  const [routed, setRouted] = useState<OrchestrationResult | 'fail' | null>(null);

  useEffect(() => {
    let active = true;

    const refreshRegistry = async () => {
      setRegistryLoading(true);
      const health = await fetchServiceRegistryHealth();
      if (!active) return;
      setRegistryHealth(health);
      setRegistryLoading(false);
    };

    refreshRegistry();
    const id = setInterval(refreshRegistry, 30_000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  const runIntent = async () => {
    if (!intent.trim()) return;
    setRouting(true); setRouted(null);
    const r = await orchestrate(intent.trim());
    setRouted(r ?? 'fail'); setRouting(false);
  };

  const h = live.health;
  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2"><Server size={18} /> Platform Console</h1>
          <p className="page-subtitle">Live data from the KDD backend services — not just health</p>
        </div>
        <span style={{ fontSize: 10, fontFamily: MONO, color: live.servicesUp > 0 ? 'var(--green)' : 'var(--accent)' }}>
          {live.loading ? 'syncing—…' : `${live.servicesUp}/${live.servicesTotal} services online`}
        </span>
      </div>

      <HealthMatrix entries={registryHealth} loading={registryLoading} />

      <div className="card mb-4" style={{ padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Workflow size={14} style={{ color: insforge.error ? 'var(--text-muted)' : 'var(--cyan)' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              InsForge operations · database + realtime
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              Live operational backing for experiments, workflow executions and approval queue.
            </div>
          </div>
          <span style={{ fontSize: 9, fontFamily: MONO, color: insforge.realtimeConnected ? 'var(--green)' : 'var(--text-muted)', border: `1px solid ${insforge.realtimeConnected ? 'rgba(0,230,118,0.4)' : 'var(--border)'}`, borderRadius: 5, padding: '1px 7px', textTransform: 'uppercase' }}>
            {insforge.realtimeConnected ? 'realtime live' : insforge.isLoading ? 'loading' : 'realtime offline'}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
          {[
            ['experiments', insforge.experiments.length],
            ['workflow executions', insforge.workflowExecutions.length],
            ['pending approvals', insforge.pendingApprovals.length],
          ].map(([label, value]) => (
            <div key={label as string} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 10, background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ fontSize: 18, fontWeight: 800, fontFamily: MONO, color: label === 'pending approvals' && Number(value) > 0 ? 'var(--accent)' : 'var(--text)' }}>{value}</div>
              <div style={{ fontSize: 8.5, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</div>
            </div>
          ))}
        </div>
        {insforge.error && <div style={{ marginTop: 8, fontSize: 10.5, color: 'var(--text-muted)' }}>InsForge operations unavailable: {insforge.error}</div>}
      </div>

      {/* Orchestrator intent routing */}
      <div className="card mb-4" style={{ padding: 14,
 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Bot size={14} style={{ color: 'var(--violet)' }} />
          <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Orchestrator —· intent routing</span>
          <span style={{ fontSize: 9, fontFamily: MONO, color: h?.orchestrator ? 'var(--green)' : 'var(--text-muted)', marginLeft: 'auto' }}>{h?.orchestrator ? 'LIVE' : 'offline'}</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={intent} onChange={e => setIntent(e.target.value)} onKeyDown={e => e.key === 'Enter' && runIntent()}
            placeholder="e.g. compare rear setup for Mugello and run a tyre strategy"
            style={{ flex: 1, fontSize: 12, background: 'var(--bg-surface)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '8px 10px' }} />
          <button onClick={runIntent} disabled={routing}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontFamily: MONO, color: 'var(--bg-base)', background: 'var(--violet)', border: 'none', borderRadius: 'var(--radius)', padding: '0 12px', cursor: routing ? 'default' : 'pointer', opacity: routing ? 0.6 : 1 }}>
            {routing ? <Loader2 size={12} className="spin" /> : <Send size={12} />} Route
          </button>
        </div>
        {routed && routed !== 'fail' && (
          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text)' }}>
            <span style={{ color: 'var(--text-muted)' }}>status </span><b style={{ color: 'var(--green)' }}>{routed.status}</b>
            {routed.workflow_id && <> —· <span style={{ color: 'var(--text-muted)' }}>workflow </span><b style={{ color: 'var(--cyan)' }}>{routed.workflow_id}</b></>}
            {routed.classification?.intent && <> —· <span style={{ color: 'var(--text-muted)' }}>intent </span><b style={{ color: 'var(--violet)' }}>{routed.classification.intent}</b></>}
            {routed.kdd?.kdd_stage && <> —· <span style={{ color: 'var(--text-muted)' }}>KDD </span><b style={{ color: 'var(--accent)' }}>{routed.kdd.kdd_stage}</b></>}
            {typeof routed.plan?.approval_required === 'boolean' && <> —· <span style={{ color: 'var(--text-muted)' }}>approval </span><b style={{ color: routed.plan.approval_required ? 'var(--accent)' : 'var(--green)' }}>{routed.plan.approval_required ? 'required' : 'not required'}</b></>}
            {routed.execution_status && <> —· <span style={{ color: 'var(--text-muted)' }}>execution </span><b style={{ color: 'var(--text)' }}>{routed.execution_status}</b></>}
          </div>
        )}
        {routed === 'fail' && <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>Orchestrator unavailable — try again when the service is awake.</div>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Panel icon={Layers} title="KDD lifecycle stages" count={live.liveKddStages.length} online={!!h?.governance}>
          <Chips items={live.liveKddStages.map(s => s.name)} />
        </Panel>
        <Panel icon={Cpu} title="Agents" count={live.agentNames.length} online={!!h?.orchestrator}>
          <Chips items={live.agentNames.map(a => a.name)} />
        </Panel>
        <Panel icon={Wrench} title="Skills" count={live.liveSkills.length} online={!!h?.skills}>
          <Chips items={live.liveSkills.map(s => s.name)} />
        </Panel>
        <Panel icon={Workflow} title="Workflows" count={live.liveWorkflows.length} online={!!h?.workflows}>
          <Chips items={live.liveWorkflows.map(w => w.name)} />
        </Panel>
        <Panel icon={FlaskConical} title="Experiments" count={live.liveExperiments.length} online={!!h?.experiments}>
          <Chips items={live.liveExperiments.map(e => e.name)} />
        </Panel>
        <Panel icon={Server} title="MCP tools" count={live.liveMcpTools.length} online={!!h?.mcp}>
          <Chips items={live.liveMcpTools.map(t => t.name)} />
        </Panel>
      </div>
    </div>
  );
}

export default PlatformConsolePage;
