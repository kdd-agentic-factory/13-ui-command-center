/**
 * PlatformConsolePage Ã¢â‚¬â€ the live platform surface.
 *
 * Promotes the six KDD backends from a single health dot to real features:
 * renders the live data they actually return Ã¢â‚¬â€ KDD lifecycle stages
 * (governance), agents + intent routing (orchestrator), skills, workflows,
 * experiments and MCP tools Ã¢â‚¬â€ each via the existing live-with-fallback feed
 * (useServiceData), with an honest per-service health badge.
 */
import { useState } from 'react';
import { Server, Cpu, Workflow, FlaskConical, Wrench, Layers, Bot, Send, Loader2 } from 'lucide-react';
import { useServiceData } from '../hooks/useServiceData';
import { orchestrate, OrchestrationResult } from '../services/api';

const MONO = 'JetBrains Mono, monospace';

function Panel({ icon: Icon, title, count, online, children }: {
  icon: typeof Server; title: string; count: number; online: boolean; children: React.ReactNode;
}) {
  return (
    <div className="card" style={{ padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Icon size={14} style={{ color: 'var(--cyan)' }} />
        <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--text)', flex: 1 }}>{title}</span>
        <span style={{ fontSize: 9, fontFamily: MONO, color: online ? 'var(--green)' : 'var(--text-muted)', border: `1px solid ${online ? 'rgba(0,230,118,0.4)' : 'var(--border)'}`, borderRadius: 5, padding: '1px 7px' }}>
          {online ? `LIVE Ã‚Â· ${count}` : 'OFFLINE'}
        </span>
      </div>
      {online ? children : <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Service asleep / unreachable Ã¢â‚¬â€ no live data.</div>}
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
  const [intent, setIntent] = useState('');
  const [routing, setRouting] = useState(false);
  const [routed, setRouted] = useState<OrchestrationResult | 'fail' | null>(null);

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
          <p className="page-subtitle">Live data from the KDD backend services Ã¢â‚¬â€ not just health</p>
        </div>
        <span style={{ fontSize: 10, fontFamily: MONO, color: live.servicesUp > 0 ? 'var(--green)' : 'var(--accent)' }}>
          {live.loading ? 'syncingÃ¢â‚¬Â¦' : `${live.servicesUp}/${live.servicesTotal} services online`}
        </span>
      </div>

      {/* Orchestrator intent routing */}
      <div className="card mb-4" style={{ padding: 14,
 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Bot size={14} style={{ color: 'var(--violet)' }} />
          <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Orchestrator Ã‚Â· intent routing</span>
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
            {routed.agent_used && <> Ã‚Â· <span style={{ color: 'var(--text-muted)' }}>routed to </span><b style={{ color: 'var(--violet)' }}>{routed.agent_used}</b></>}
          </div>
        )}
        {routed === 'fail' && <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>Orchestrator unavailable Ã¢â‚¬â€ try again when the service is awake.</div>}
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
