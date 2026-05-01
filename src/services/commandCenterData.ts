import {
  BrainCircuit,
  DatabaseZap,
  FlaskConical,
  Hammer,
  Network,
  ShieldCheck
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type HealthState = 'healthy' | 'warning' | 'critical' | 'idle';

export interface AgentStatus {
  id: string;
  name: string;
  role: string;
  state: HealthState;
  currentTask: string;
  queueDepth: number;
  successRate: number;
  latencyMs: number;
}

export interface PipelineStage {
  id: string;
  name: string;
  state: HealthState;
  progress: number;
  owner: string;
  lastRun: string;
}

export interface RetrievalMetric {
  label: string;
  value: string;
  state: HealthState;
  detail: string;
}

export interface ToolStatus {
  name: string;
  namespace: string;
  state: HealthState;
  calls24h: number;
  p95Ms: number;
  errorRate: number;
}

export interface SkillEntry {
  name: string;
  scope: string;
  state: HealthState;
  version: string;
  lastUsed: string;
}

export interface Experiment {
  name: string;
  owner: string;
  state: HealthState;
  metric: string;
  delta: string;
  sampleSize: string;
}

export interface Capability {
  label: string;
  value: string;
  icon: LucideIcon;
  state: HealthState;
}

export const agents: AgentStatus[] = [
  {
    id: 'orch-01',
    name: 'Orchestrator',
    role: 'Planificacion y handoff',
    state: 'healthy',
    currentTask: 'Priorizando batch de experimentos',
    queueDepth: 3,
    successRate: 98,
    latencyMs: 420
  },
  {
    id: 'data-02',
    name: 'Data Scout',
    role: 'Ingestion y perfilado',
    state: 'warning',
    currentTask: 'Validando drift en fuentes externas',
    queueDepth: 8,
    successRate: 91,
    latencyMs: 980
  },
  {
    id: 'eval-03',
    name: 'Evaluator',
    role: 'Metricas y regresiones',
    state: 'healthy',
    currentTask: 'Comparando variantes RAG/CAG',
    queueDepth: 2,
    successRate: 96,
    latencyMs: 610
  },
  {
    id: 'ops-04',
    name: 'Ops Sentinel',
    role: 'Guardrails y auditoria',
    state: 'critical',
    currentTask: 'Reintentando toolchain MCP externo',
    queueDepth: 11,
    successRate: 84,
    latencyMs: 1460
  }
];

export const pipelineStages: PipelineStage[] = [
  { id: 'selection', name: 'Seleccion', state: 'healthy', progress: 100, owner: 'Data Scout', lastRun: '10:42' },
  { id: 'preprocessing', name: 'Preprocesado', state: 'healthy', progress: 86, owner: 'Cleaner', lastRun: '10:51' },
  { id: 'transformation', name: 'Transformacion', state: 'warning', progress: 64, owner: 'Feature Agent', lastRun: '11:07' },
  { id: 'mining', name: 'Mineria', state: 'idle', progress: 38, owner: 'Model Agent', lastRun: '11:16' },
  { id: 'interpretation', name: 'Interpretacion', state: 'idle', progress: 12, owner: 'Evaluator', lastRun: 'pendiente' }
];

export const retrievalMetrics: RetrievalMetric[] = [
  { label: 'Recall@5', value: '0.87', state: 'healthy', detail: '+4.2% vs baseline' },
  { label: 'Context freshness', value: '18m', state: 'healthy', detail: 'sincronizado' },
  { label: 'Cache hit CAG', value: '62%', state: 'warning', detail: 'por debajo de objetivo 70%' },
  { label: 'Hallucination risk', value: 'bajo', state: 'healthy', detail: 'guardrail activo' }
];

export const tools: ToolStatus[] = [
  { name: 'github', namespace: 'mcp.repo', state: 'healthy', calls24h: 418, p95Ms: 520, errorRate: 0.8 },
  { name: 'drive', namespace: 'mcp.docs', state: 'healthy', calls24h: 96, p95Ms: 740, errorRate: 1.1 },
  { name: 'warehouse', namespace: 'mcp.data', state: 'warning', calls24h: 231, p95Ms: 1280, errorRate: 4.6 },
  { name: 'notebook-runner', namespace: 'mcp.compute', state: 'critical', calls24h: 44, p95Ms: 2100, errorRate: 9.3 }
];

export const skills: SkillEntry[] = [
  { name: 'openai-docs', scope: 'documentacion oficial', state: 'healthy', version: '1.4.0', lastUsed: 'hace 12m' },
  { name: 'imagegen', scope: 'activos raster', state: 'idle', version: '1.1.2', lastUsed: 'ayer' },
  { name: 'skill-creator', scope: 'nuevas capacidades', state: 'healthy', version: '1.0.8', lastUsed: 'hace 2h' },
  { name: 'plugin-creator', scope: 'plugins locales', state: 'warning', version: '0.9.5', lastUsed: 'hace 5d' }
];

export const experiments: Experiment[] = [
  { name: 'rag-window-8k', owner: 'Evaluator', state: 'healthy', metric: 'NDCG', delta: '+6.1%', sampleSize: '12.4k' },
  { name: 'cag-hot-cache-v2', owner: 'Orchestrator', state: 'warning', metric: 'Latency', delta: '-18%', sampleSize: '7.8k' },
  { name: 'feature-pruning', owner: 'Model Agent', state: 'idle', metric: 'F1', delta: '+1.7%', sampleSize: '3.1k' }
];

export const capabilities: Capability[] = [
  { label: 'Agentes activos', value: '4', icon: BrainCircuit, state: 'healthy' },
  { label: 'Pipeline KDD', value: '64%', icon: Network, state: 'warning' },
  { label: 'Tools MCP', value: '12', icon: Hammer, state: 'warning' },
  { label: 'Guardrails', value: 'on', icon: ShieldCheck, state: 'healthy' },
  { label: 'Datasets', value: '9', icon: DatabaseZap, state: 'healthy' },
  { label: 'Experimentos', value: '3', icon: FlaskConical, state: 'idle' }
];

export const stateLabels: Record<HealthState, string> = {
  healthy: 'activo',
  warning: 'degradado',
  critical: 'bloqueado',
  idle: 'pendiente'
};
