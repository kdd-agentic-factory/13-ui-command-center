/**
 * HTTP client for KDD backend services.
 * All requests route through nginx reverse-proxy prefixes (/api/<service>/).
 * Falls back gracefully — callers receive null on any network error.
 */

const PROXY = {
  governance:  '/api/governance',
  orchestrator: '/api/orchestrator',
  skills:       '/api/skills',
  workflows:    '/api/workflows',
  experiments:  '/api/experiments',
  mcp:          '/api/mcp',
} as const;

type ServiceKey = keyof typeof PROXY;

async function safeFetch<T>(url: string): Promise<T | null> {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!r.ok) return null;
    return r.json() as Promise<T>;
  } catch {
    return null;
  }
}

// ── Service health ──────────────────────────────────────────────────────────

export type HealthMap = Record<ServiceKey, boolean>;

export async function fetchAllServiceHealth(): Promise<HealthMap> {
  const keys = Object.keys(PROXY) as ServiceKey[];
  const results = await Promise.allSettled(
    keys.map((k) => safeFetch<object>(`${PROXY[k]}/health`))
  );
  return Object.fromEntries(
    keys.map((k, i) => [k, results[i].status === 'fulfilled' && results[i].value !== null])
  ) as HealthMap;
}

// ── Governance ──────────────────────────────────────────────────────────────

export interface KddStage {
  /** Canonical stage ID (e.g. "selection", "preprocessing") */
  stage_id: string;
  name: string;
  order: number;
  description: string;
}
export interface KddStagesResponse {
  stages: KddStage[];
}
export async function fetchKddStages(): Promise<KddStagesResponse | null> {
  return safeFetch(`${PROXY.governance}/kdd/stages`);
}

// ── Workflows ───────────────────────────────────────────────────────────────

export interface WorkflowEntry {
  id: string;
  name: string;
  status?: string;
}
export async function fetchWorkflows(): Promise<WorkflowEntry[] | null> {
  const data = await safeFetch<WorkflowEntry[] | { workflows: WorkflowEntry[] }>(
    `${PROXY.workflows}/workflows`
  );
  if (!data) return null;
  return Array.isArray(data) ? data : data.workflows;
}

// ── Skills ──────────────────────────────────────────────────────────────────

export interface SkillEntry {
  name: string;
  version?: string;
  scope?: string;
}
export async function fetchSkills(): Promise<SkillEntry[] | null> {
  const data = await safeFetch<SkillEntry[] | { skills: SkillEntry[] }>(
    `${PROXY.skills}/skills`
  );
  if (!data) return null;
  return Array.isArray(data) ? data : data.skills;
}

// ── Experiments ─────────────────────────────────────────────────────────────

export interface ExperimentEntry {
  experiment_id?: string;
  id?: string;
  name: string;
  status?: string;
}
export async function fetchExperiments(): Promise<ExperimentEntry[] | null> {
  const data = await safeFetch<ExperimentEntry[] | { experiments: ExperimentEntry[] }>(
    `${PROXY.experiments}/experiments`
  );
  if (!data) return null;
  return Array.isArray(data) ? data : data.experiments;
}

// ── Agents ──────────────────────────────────────────────────────────────────

export interface AgentEntry {
  name: string;
}
export async function fetchAgents(): Promise<AgentEntry[] | null> {
  const data = await safeFetch<{ agents: string[] }>(`${PROXY.orchestrator}/agents`);
  if (!data) return null;
  return (data.agents ?? []).map((name) => ({ name }));
}

// ── MCP tools ───────────────────────────────────────────────────────────────

export interface McpTool {
  name: string;
  namespace?: string;
  server?: string;
}
export async function fetchMcpTools(): Promise<McpTool[] | null> {
  const data = await safeFetch<McpTool[] | { tools: McpTool[] }>(
    `${PROXY.mcp}/tools`
  );
  if (!data) return null;
  return Array.isArray(data) ? data : data.tools;
}
