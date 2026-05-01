import { Bot } from 'lucide-react';
import type { AgentStatus } from '../services/commandCenterData';
import { PanelHeader } from './PanelHeader';
import { StateTag } from './StateTag';

interface AgentStatusCardProps {
  agents: AgentStatus[];
}

export function AgentStatusCard({ agents }: AgentStatusCardProps) {
  return (
    <section className="panel panel--wide" aria-labelledby="agent-status-title">
      <PanelHeader
        kicker="Agentes"
        title="Estado de ejecucion"
        titleId="agent-status-title"
        action={<StateTag state={agents.some((agent) => agent.state === 'critical') ? 'critical' : 'healthy'} />}
      />
      <div className="panel__body agent-list">
        {agents.map((agent) => (
          <article className="agent-card" key={agent.id}>
            <div className="agent-card__main">
              <h3 className="agent-card__name">
                <Bot size={18} aria-hidden="true" />
                {agent.name}
              </h3>
              <span className="agent-card__role">{agent.role}</span>
              <p className="agent-card__task">{agent.currentTask}</p>
            </div>
            <div className="agent-card__metrics" aria-label={`Metricas de ${agent.name}`}>
              <div className="metric-box">
                <strong>{agent.queueDepth}</strong>
                <span>cola</span>
              </div>
              <div className="metric-box">
                <strong>{agent.successRate}%</strong>
                <span>exito</span>
              </div>
              <div className="metric-box">
                <strong>{agent.latencyMs}ms</strong>
                <span>latencia</span>
              </div>
              <StateTag state={agent.state} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
