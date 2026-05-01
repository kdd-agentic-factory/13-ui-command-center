import {
  agents,
  capabilities,
  experiments,
  pipelineStages,
  retrievalMetrics,
  skills,
  tools
} from '../services/commandCenterData';
import { AgentStatusCard } from '../components/AgentStatusCard';
import { ExperimentDashboard } from '../components/ExperimentDashboard';
import { KDDPipelineView } from '../components/KDDPipelineView';
import { MCPToolMonitor } from '../components/MCPToolMonitor';
import { RAGCAGMonitor } from '../components/RAGCAGMonitor';
import { SkillsRegistryView } from '../components/SkillsRegistryView';

export function CommandCenterPage() {
  return (
    <main className="dashboard">
      <section className="capability-grid" aria-label="Resumen del sistema">
        {capabilities.map((capability) => {
          const Icon = capability.icon;
          return (
            <article className="capability" key={capability.label}>
              <span className={`capability__icon state-${capability.state} surface-${capability.state}`}>
                <Icon size={20} aria-hidden="true" />
              </span>
              <span>
                <span className="capability__value">{capability.value}</span>
                <span className="capability__label">{capability.label}</span>
              </span>
            </article>
          );
        })}
      </section>

      <section className="dashboard-grid" aria-label="Paneles operativos">
        <AgentStatusCard agents={agents} />
        <KDDPipelineView stages={pipelineStages} />
        <RAGCAGMonitor metrics={retrievalMetrics} />
        <MCPToolMonitor tools={tools} />
        <SkillsRegistryView skills={skills} />
        <ExperimentDashboard experiments={experiments} />
      </section>
    </main>
  );
}
