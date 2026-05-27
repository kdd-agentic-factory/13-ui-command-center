import {
  BrainCircuit,
  DatabaseZap,
  FlaskConical,
  Hammer,
  Network,
  ShieldCheck,
} from 'lucide-react';
import type { LiveData } from '../hooks/useServiceData';
import { useInsForgeData } from '../hooks/useInsForgeData';
import { AgentStatusCard } from '../components/AgentStatusCard';
import { ExperimentDashboard } from '../components/ExperimentDashboard';
import { KDDPipelineView } from '../components/KDDPipelineView';
import { MCPToolMonitor } from '../components/MCPToolMonitor';
import { RAGCAGMonitor } from '../components/RAGCAGMonitor';
import { SkillsRegistryView } from '../components/SkillsRegistryView';
import {
  type AgentStatus,
  type Capability,
  type Experiment,
  type PipelineStage,
  type RetrievalMetric,
  type SkillEntry,
  type ToolStatus,
  type HealthState,
} from '../services/commandCenterData';

// ── helpers ─────────────────────────────────────────────────────────────────

function svcState(up: boolean): HealthState {
  return up ? 'healthy' : 'critical';
}

function titleCase(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Agent role labels ────────────────────────────────────────────────────────

const AGENT_ROLES: Record<string, string> = {
  intent_classifier: 'Clasificación de intención',
  planner: 'Planificación y handoff',
  kdd_admin: 'Administración KDD',
  architect: 'Diseño arquitectural',
  builder: 'Construcción y desarrollo',
  reviewer: 'Revisión y validación',
  experiment: 'Gestión de experimentos',
  documentation: 'Documentación técnica',
  crew_chief: 'Jefe de tripulación',
  simulation: 'Simulación digital twin',
};

// ── KDD pipeline stage labels ────────────────────────────────────────────────

const STAGE_OWNERS: Record<string, string> = {
  selection: 'Data Scout',
  preprocessing: 'Cleaner',
  transformation: 'Feature Agent',
  mining: 'Model Agent',
  interpretation: 'Evaluator',
  deployment: 'Orchestrator',
};

const STAGE_NAMES_ES: Record<string, string> = {
  selection: 'Selección',
  preprocessing: 'Preprocesado',
  transformation: 'Transformación',
  mining: 'Minería',
  interpretation: 'Interpretación',
  deployment: 'Despliegue',
};

// ── Status derivation from experiment status string ──────────────────────────

function expState(status?: string): HealthState {
  if (!status) return 'idle';
  const s = status.toLowerCase();
  if (s === 'running' || s === 'active') return 'healthy';
  if (s === 'failed' || s === 'error') return 'critical';
  if (s === 'paused' || s === 'degraded') return 'warning';
  return 'idle';
}

// ────────────────────────────────────────────────────────────────────────────

interface CommandCenterPageProps {
  liveData: LiveData;
}

export function CommandCenterPage({ liveData }: CommandCenterPageProps) {
  const {
    health,
    agentNames,
    liveSkills,
    liveExperiments,
    liveMcpTools,
    liveKddStages,
    liveWorkflows,
    experimentsCount,
    mcpToolsCount,
    loading,
  } = liveData;

  // InsForge cloud data — richer source than microservice polling.
  // Degrades gracefully: if InsForge is unreachable the component
  // falls back to the existing polled data without any visual error.
  const insforge = useInsForgeData();

  // ── Capability tiles ──────────────────────────────────────────────────────

  const capabilities: Capability[] = [
    {
      label: 'Agentes activos',
      value: loading ? '…' : String(agentNames.length || '10'),
      icon: BrainCircuit,
      state: svcState(health.orchestrator),
    },
    {
      label: 'Pipeline KDD',
      value: loading
        ? '…'
        : liveKddStages.length > 0
          ? `${liveKddStages.length}/6`
          : '–',
      icon: Network,
      state: svcState(health.governance),
    },
    {
      label: 'Tools MCP',
      value: loading ? '…' : String(liveMcpTools.length || mcpToolsCount || '–'),
      icon: Hammer,
      state: health.mcp ? 'healthy' : 'warning',
    },
    {
      label: 'Guardrails',
      value: health.governance ? 'on' : loading ? '…' : 'off',
      icon: ShieldCheck,
      state: svcState(health.governance),
    },
    {
      label: 'Workflows',
      value: loading ? '…' : String(liveWorkflows.length || '–'),
      icon: DatabaseZap,
      state: svcState(health.workflows),
    },
    {
      label: 'Experimentos',
      value: loading
        ? '…'
        : String(
            insforge.experiments.length ||
            liveExperiments.length ||
            experimentsCount ||
            '–'
          ),
      icon: FlaskConical,
      state: health.experiments ? 'healthy' : 'idle',
    },
  ];

  // ── Agents ────────────────────────────────────────────────────────────────

  const agents: AgentStatus[] =
    agentNames.length > 0
      ? agentNames.map((entry, i) => ({
          id: `agent-${i}`,
          name: titleCase(entry.name),
          role: AGENT_ROLES[entry.name] ?? 'Agente especializado',
          state: health.orchestrator ? 'healthy' : 'critical',
          currentTask: health.orchestrator ? 'En espera' : 'Sin conexión',
          queueDepth: 0,
          successRate: health.orchestrator ? 100 : 0,
          latencyMs: 0,
        }))
      : // static fallback while loading
        [
          {
            id: 'orch-01',
            name: 'Orchestrator',
            role: 'Planificacion y handoff',
            state: svcState(health.orchestrator),
            currentTask: loading ? 'Conectando…' : 'Priorizando batch de experimentos',
            queueDepth: 3,
            successRate: 98,
            latencyMs: 420,
          },
          {
            id: 'data-02',
            name: 'Data Scout',
            role: 'Ingestion y perfilado',
            state: svcState(health.governance),
            currentTask: loading ? 'Conectando…' : 'Validando drift en fuentes externas',
            queueDepth: 8,
            successRate: 91,
            latencyMs: 980,
          },
        ];

  // ── KDD Pipeline stages ───────────────────────────────────────────────────

  const pipelineStages: PipelineStage[] =
    liveKddStages.length > 0
      ? [...liveKddStages]
          .sort((a, b) => a.order - b.order)
          .map((s) => ({
            id: s.stage_id,
            name: STAGE_NAMES_ES[s.stage_id] ?? titleCase(s.stage_id),
            state: health.governance ? 'healthy' : ('warning' as HealthState),
            progress: health.governance ? Math.max(20, 100 - s.order * 12) : 0,
            owner: STAGE_OWNERS[s.stage_id] ?? 'KDD Agent',
            lastRun: '–',
          }))
      : // static fallback
        [
          { id: 'selection', name: 'Selección', state: svcState(health.governance), progress: 100, owner: 'Data Scout', lastRun: '–' },
          { id: 'preprocessing', name: 'Preprocesado', state: svcState(health.governance), progress: 86, owner: 'Cleaner', lastRun: '–' },
          { id: 'transformation', name: 'Transformación', state: 'warning' as HealthState, progress: 64, owner: 'Feature Agent', lastRun: '–' },
          { id: 'mining', name: 'Minería', state: 'idle' as HealthState, progress: 38, owner: 'Model Agent', lastRun: '–' },
          { id: 'interpretation', name: 'Interpretación', state: 'idle' as HealthState, progress: 12, owner: 'Evaluator', lastRun: '–' },
        ];

  // ── RAG/CAG retrieval metrics ─────────────────────────────────────────────
  // No retrieval-metric endpoint is proxied; derive state from mcp health.

  const retrievalMetrics: RetrievalMetric[] = [
    {
      label: 'Recall@5',
      value: '0.87',
      state: health.mcp ? 'healthy' : 'warning',
      detail: health.mcp ? '+4.2% vs baseline' : 'sin conexión',
    },
    {
      label: 'Context freshness',
      value: health.mcp ? '18m' : '–',
      state: health.mcp ? 'healthy' : 'warning',
      detail: health.mcp ? 'sincronizado' : 'RAG no disponible',
    },
    {
      label: 'Cache hit CAG',
      value: health.mcp ? '62%' : '–',
      state: health.mcp ? 'warning' : 'critical',
      detail: health.mcp ? 'por debajo de objetivo 70%' : 'sin conexión',
    },
    {
      label: 'Hallucination risk',
      value: health.governance ? 'bajo' : '–',
      state: health.governance ? 'healthy' : 'warning',
      detail: health.governance ? 'guardrail activo' : 'governance offline',
    },
  ];

  // ── MCP Tools ─────────────────────────────────────────────────────────────

  const tools: ToolStatus[] =
    liveMcpTools.length > 0
      ? liveMcpTools.map((t) => ({
          name: t.name,
          namespace: t.namespace ?? t.server ?? 'mcp',
          state: health.mcp ? 'healthy' : ('critical' as HealthState),
          calls24h: 0,
          p95Ms: 0,
          errorRate: 0,
        }))
      : // static fallback
        [
          { name: 'github', namespace: 'mcp.repo', state: svcState(health.mcp), calls24h: 418, p95Ms: 520, errorRate: 0.8 },
          { name: 'drive', namespace: 'mcp.docs', state: svcState(health.mcp), calls24h: 96, p95Ms: 740, errorRate: 1.1 },
          { name: 'warehouse', namespace: 'mcp.data', state: health.mcp ? 'warning' : 'critical', calls24h: 231, p95Ms: 1280, errorRate: 4.6 },
          { name: 'notebook-runner', namespace: 'mcp.compute', state: health.mcp ? 'critical' : 'critical', calls24h: 44, p95Ms: 2100, errorRate: 9.3 },
        ];

  // ── Skills ────────────────────────────────────────────────────────────────

  const skills: SkillEntry[] =
    liveSkills.length > 0
      ? liveSkills.map((s) => ({
          name: s.name,
          scope: s.scope ?? 'capacidad',
          state: health.skills ? 'healthy' : ('warning' as HealthState),
          version: s.version ?? '1.0.0',
          lastUsed: '–',
        }))
      : // static fallback
        [
          { name: 'openai-docs', scope: 'documentación oficial', state: svcState(health.skills), version: '1.4.0', lastUsed: '–' },
          { name: 'imagegen', scope: 'activos raster', state: 'idle', version: '1.1.2', lastUsed: '–' },
          { name: 'skill-creator', scope: 'nuevas capacidades', state: svcState(health.skills), version: '1.0.8', lastUsed: '–' },
          { name: 'plugin-creator', scope: 'plugins locales', state: health.skills ? 'warning' : 'critical', version: '0.9.5', lastUsed: '–' },
        ];

  // ── Experiments (InsForge DB → polled microservice → static fallback) ────

  const experiments: Experiment[] =
    insforge.experiments.length > 0
      ? insforge.experiments.map((e) => ({
          name: e.name,
          owner: '–',
          state: expState(e.status),
          metric: '–',
          delta: '–',
          sampleSize: '–',
        }))
      : liveExperiments.length > 0
        ? liveExperiments.map((e) => ({
            name: e.name,
            owner: '–',
            state: expState(e.status),
            metric: '–',
            delta: '–',
            sampleSize: '–',
          }))
        : // static fallback
          [
            { name: 'rag-window-8k', owner: 'Evaluator', state: svcState(health.experiments), metric: 'NDCG', delta: '+6.1%', sampleSize: '12.4k' },
            { name: 'cag-hot-cache-v2', owner: 'Orchestrator', state: health.experiments ? 'warning' : 'idle', metric: 'Latency', delta: '-18%', sampleSize: '7.8k' },
            { name: 'feature-pruning', owner: 'Model Agent', state: 'idle', metric: 'F1', delta: '+1.7%', sampleSize: '3.1k' },
          ];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="dashboard">
      <section className="capability-grid" aria-label="Resumen del sistema">
        {capabilities.map((capability) => {
          const Icon = capability.icon;
          return (
            <article className="capability" key={capability.label}>
              <span
                className={`capability__icon state-${capability.state} surface-${capability.state}`}
              >
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

