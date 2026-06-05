/**
 * HTTP client for KDD backend services (deployed on Fly.io).
 * Each service has its own base URL (overridable via VITE_<SVC>_URL); data
 * endpoints live under /api/v1 and the health probe at /health.
 * Falls back gracefully — callers receive null on any network error.
 */

const env = import.meta.env as Record<string, string | undefined>;

// Same-origin proxy prefixes — the UI's own nginx (BFF) proxies these to the Fly
// services and injects the internal API key server-side (no CORS, no key in the
// browser). Overridable via VITE_<SVC>_URL for direct-call setups.
const BASE = {
  governance:   env.VITE_GOVERNANCE_URL   ?? '/api/governance',
  orchestrator: env.VITE_ORCHESTRATOR_URL ?? '/api/orchestrator',
  skills:       env.VITE_SKILLS_URL       ?? '/api/skills',
  workflows:    env.VITE_WORKFLOWS_URL    ?? '/api/workflows',
  experiments:  env.VITE_EXPERIMENTS_URL  ?? '/api/experiments',
  mcp:          env.VITE_MCP_URL          ?? '/api/mcp',
} as const;

const V1 = '/api/v1';

type ServiceKey = keyof typeof BASE;

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
  const keys = Object.keys(BASE) as ServiceKey[];
  const results = await Promise.allSettled(
    keys.map((k) => safeFetch<object>(`${BASE[k]}/health`))
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
  return safeFetch(`${BASE.governance}${V1}/kdd/stages`);
}

// ── Workflows ───────────────────────────────────────────────────────────────

export interface WorkflowEntry {
  id: string;
  name: string;
  status?: string;
}
export async function fetchWorkflows(): Promise<WorkflowEntry[] | null> {
  const data = await safeFetch<WorkflowEntry[] | { workflows: WorkflowEntry[] }>(
    `${BASE.workflows}${V1}/workflows`
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
    `${BASE.skills}${V1}/skills`
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
    `${BASE.experiments}${V1}/experiments`
  );
  if (!data) return null;
  return Array.isArray(data) ? data : data.experiments;
}

// ── Agents ──────────────────────────────────────────────────────────────────

export interface AgentEntry {
  name: string;
}
export async function fetchAgents(): Promise<AgentEntry[] | null> {
  const data = await safeFetch<{ agents: string[] }>(`${BASE.orchestrator}${V1}/agents`);
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
    `${BASE.mcp}${V1}/tools`
  );
  if (!data) return null;
  return Array.isArray(data) ? data : data.tools;
}
