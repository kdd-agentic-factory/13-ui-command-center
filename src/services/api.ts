/**
 * HTTP client for KDD backend services (deployed on Fly.io).
 * Each service has its own base URL (overridable via VITE_<SVC>_URL); data
 * endpoints live under /api/v1 and the health probe at /health.
 * Falls back gracefully — callers receive null on any network error.
 */

// Same-origin proxy prefixes — the UI's own nginx (BFF) proxies these to the Fly
// services and injects the internal API key server-side (no CORS, no key in the
// browser). Overridable via VITE_<SVC>_URL for direct-call setups (the InsForge
// static deployment points these at the Fly BFF cross-origin).
// NOTE: read import.meta.env.<KEY> directly — Vite only statically inlines these
// literal member expressions at build time, not aliased/dynamic property access.
const BASE = {
  governance:   import.meta.env.VITE_GOVERNANCE_URL   ?? '/api/governance',
  orchestrator: import.meta.env.VITE_ORCHESTRATOR_URL ?? '/api/orchestrator',
  skills:       import.meta.env.VITE_SKILLS_URL       ?? '/api/skills',
  workflows:    import.meta.env.VITE_WORKFLOWS_URL    ?? '/api/workflows',
  experiments:  import.meta.env.VITE_EXPERIMENTS_URL  ?? '/api/experiments',
  mcp:          import.meta.env.VITE_MCP_URL          ?? '/api/mcp',
} as const;

// Telemetry dataset service is consumed by specific modules (Data Cube), not the
// 6-service health panel, so it lives outside BASE to keep HealthMap unchanged.
const TELEMETRY_BASE = import.meta.env.VITE_TELEMETRY_URL ?? '/api/telemetry';
// Digital Twin Simulation Lab — consumed on-demand by the Scenario Sandbox.
const TWIN_BASE = import.meta.env.VITE_TWIN_URL ?? '/api/twin';
// RAG/CAG knowledge layer — grounds the Debrief Room. The service is API-key
// protected, so the key must NEVER be baked into the browser bundle: it is
// injected server-side by a same-origin proxy (default base). VITE_RAG_KEY is
// only for trusted/local builds, not the public deployment.
const RAG_BASE = import.meta.env.VITE_RAG_URL ?? '/api/rag';
const RAG_KEY = import.meta.env.VITE_RAG_KEY ?? '';
// Security/governance policy engine — gates the Decision Center. INTERNAL
// service-to-service: the X-Internal-API-Key + principal headers are injected by
// a same-origin proxy server-side; never bake them into the browser.
const SECURITY_BASE = import.meta.env.VITE_SECURITY_URL ?? '/api/security';
// KDD data pipelines — backs the Data Trust Center lineage. API-key protected,
// so the key is injected by a same-origin proxy server-side, never in the browser.
const PIPELINES_BASE = import.meta.env.VITE_PIPELINES_URL ?? '/api/pipelines';

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

// ──── Service health ────

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

// ──── Governance ────

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

// ──── Workflows ────

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

// ──── Skills ────

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

// ──── Experiments ────

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

// ──── Agents ────

export interface AgentEntry {
  name: string;
}
export async function fetchAgents(): Promise<AgentEntry[] | null> {
  const data = await safeFetch<{ agents: string[] }>(`${BASE.orchestrator}${V1}/agents`);
  if (!data) return null;
  return (data.agents ?? []).map((name) => ({ name }));
}

// Intent classification / routing via the orchestrator (POST /orchestrate).
export interface OrchestrationResult { status: string; agent_used?: string; result?: unknown }
export async function orchestrate(userInput: string): Promise<OrchestrationResult | null> {
  try {
    const r = await fetch(`${BASE.orchestrator}/orchestrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_input: userInput }),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return null;
    return r.json() as Promise<OrchestrationResult>;
  } catch {
    return null;
  }
}

// ──── MCP tools ────

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

// ──── Telemetry dataset (18-telemetry-dataset) ────
// Real session catalogue from the FastAPI telemetry service. Used to drive the
// Data Cube from live data, with a deterministic fallback when the service is
// asleep / unreachable. Endpoint: GET /api/v1/sessions (open in dev mode; the
// BFF injects X-API-Key when the service is key-protected).

export interface TelemetrySession {
  session_id: string;
  circuit_id: string;
  total_laps: number;
  classification?: string;
  session_type?: string;
  status?: string;
  best_lap_time_s?: number | null;
  quality_score?: number | null;
}

export async function fetchTelemetrySessions(): Promise<TelemetrySession[] | null> {
  const data = await safeFetch<TelemetrySession[] | { sessions: TelemetrySession[] }>(
    `${TELEMETRY_BASE}${V1}/sessions`
  );
  if (!data) return null;
  return Array.isArray(data) ? data : data.sessions ?? null;
}

// ── Digital Twin what-if (17-digital-twin-simulation-lab) ─────────────────────
// On-demand validation for the Scenario Sandbox: POST a proposed setup and get
// the twin's delta metrics + risk verdict. Returns null on failure so the
// Sandbox keeps its instant local model.

export interface WhatIfRequest {
  scenario_id: string;
  circuit_id: string;
  session_id: string;
  baseline_setup_id: string;
  proposed_setup: Record<string, number>;
  laps: number;
  ambient_temp_c: number;
  track_temp_c: number;
  tire_compound: string;
}

export interface WhatIfResult {
  delta_metrics?: { lap_time_delta_s: number; stability_score_delta: number; rear_temp_delta_c: number };
  risk_level?: string;
  approval_required?: boolean;
  explanation?: string;
  limitations?: string[];
}

export async function runWhatIf(req: WhatIfRequest): Promise<WhatIfResult | null> {
  try {
    const r = await fetch(`${TWIN_BASE}${V1}/what-if`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return null;
    return r.json() as Promise<WhatIfResult>;
  } catch {
    return null;
  }
}

// ── RAG/CAG knowledge layer (03-rag-cag-knowledge-layer) ──────────────────────
// Grounds the AI Debrief Room. Distinguishes reachable-but-credentialed (401)
// from unreachable so the UI can say honestly whether the knowledge base is
// connected — without ever exposing the API key in the browser.

export interface RagEvidenceItem {
  source_id: string;
  text_excerpt?: string;
  text?: string;
  score: number;
}
export interface RagSearchResult {
  query: string;
  results: { source_id: string; text: string; score: number }[];
  evidence: RagEvidenceItem[];
  evidence_count: number;
  mode?: string;
}
export type RagOutcome =
  | { ok: true; data: RagSearchResult }
  // reached the service (auth ok / server-side issue) vs no response at all
  | { ok: false; reason: 'unauthorized' | 'server-error' | 'unreachable' };

export async function ragSearch(query: string, topK = 4): Promise<RagOutcome> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (RAG_KEY) headers['X-API-Key'] = RAG_KEY;
    const r = await fetch(`${RAG_BASE}${V1}/search`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, top_k: topK, include_evidence: true }),
      signal: AbortSignal.timeout(8000),
    });
    if (r.status === 401 || r.status === 403) return { ok: false, reason: 'unauthorized' };
    // 5xx = reached + (via the BFF) authenticated, but the service can't serve
    // (e.g. no vector index provisioned) — that's "reachable", not offline.
    if (r.status >= 500) return { ok: false, reason: 'server-error' };
    if (!r.ok) return { ok: false, reason: 'unreachable' };
    return { ok: true, data: (await r.json()) as RagSearchResult };
  } catch {
    return { ok: false, reason: 'unreachable' };
  }
}

// ── Security policy engine (24-security-governance-compliance) ────────────────

export interface PolicyEvaluation {
  action: string;
  actor?: string;
  allowed: boolean;
  violated_policies?: string[];
  required_mitigations?: string[];
  risk_level?: string;
}
export type PolicyOutcome =
  | { ok: true; data: PolicyEvaluation }
  | { ok: false; reason: 'not-configured' | 'unreachable' };

export async function evaluatePolicy(action: string, context: Record<string, unknown> = {}): Promise<PolicyOutcome> {
  try {
    const r = await fetch(`${SECURITY_BASE}${V1}/policies/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, context }),
      signal: AbortSignal.timeout(8000),
    });
    // 503 = engine up but internal auth not configured server-side.
    if (r.status === 503) return { ok: false, reason: 'not-configured' };
    if (!r.ok) return { ok: false, reason: 'unreachable' };
    return { ok: true, data: (await r.json()) as PolicyEvaluation };
  } catch {
    return { ok: false, reason: 'unreachable' };
  }
}

// ──── KDD data pipelines (06-kdd-data-pipelines) ────

export interface PipelinesList { pipelines: string[]; total: number }
export type PipelinesOutcome =
  | { ok: true; data: PipelinesList }
  | { ok: false; reason: 'unauthorized' | 'unreachable' };

export async function fetchPipelines(): Promise<PipelinesOutcome> {
  try {
    const r = await fetch(`${PIPELINES_BASE}${V1}/pipelines/`, { signal: AbortSignal.timeout(8000) });
    if (r.status === 401 || r.status === 403) return { ok: false, reason: 'unauthorized' };
    if (!r.ok) return { ok: false, reason: 'unreachable' };
    return { ok: true, data: (await r.json()) as PipelinesList };
  } catch {
    return { ok: false, reason: 'unreachable' };
  }
}
