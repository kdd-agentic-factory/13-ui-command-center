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
// Documentation agent — generates evidence-backed reports and paper sections.
const DOCUMENTATION_BASE = import.meta.env.VITE_DOCUMENTATION_URL ?? '/api/documentation';
// Race AI Copilot — BFF prefix for the 16-race-ai-copilot service.
const COPILOT_BASE = import.meta.env.VITE_COPILOT_URL ?? '/api/copilot-service';
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

export const SERVICE_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  DEGRADED: 'degraded',
  NOT_CONFIGURED: 'not_configured',
} as const;

export type ServiceStatus = (typeof SERVICE_STATUS)[keyof typeof SERVICE_STATUS];

export const SERVICE_CRITICALITY = {
  CORE: 'core',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  INFORMATIONAL: 'informational',
} as const;

export type ServiceCriticality = (typeof SERVICE_CRITICALITY)[keyof typeof SERVICE_CRITICALITY];

export interface ServiceRegistryEntry {
  id: string;
  repo: string;
  name: string;
  category: string;
  baseUrl: string;
  healthPath: string;
  criticality: ServiceCriticality;
  purpose: string;
}

export interface ServiceRegistryHealthEntry extends ServiceRegistryEntry {
  status: ServiceStatus;
  detail: string;
}

export const SERVICE_REGISTRY: ServiceRegistryEntry[] = [
  {
    id: 'governance',
    repo: '00/24-governance-platform',
    name: 'Governance Platform',
    category: 'Core platform services',
    baseUrl: BASE.governance,
    healthPath: '/health',
    criticality: SERVICE_CRITICALITY.CORE,
    purpose: 'KDD lifecycle stages and platform rules.',
  },
  {
    id: 'security',
    repo: '24-security-governance-compliance',
    name: 'Security Governance Compliance',
    category: 'Core platform services',
    baseUrl: SECURITY_BASE,
    healthPath: '/health',
    criticality: SERVICE_CRITICALITY.CORE,
    purpose: 'Policy evaluation and compliance gates.',
  },
  {
    id: 'orchestrator',
    repo: '01-agent-orchestrator',
    name: 'Agent Orchestrator',
    category: 'Core platform services',
    baseUrl: BASE.orchestrator,
    healthPath: '/health',
    criticality: SERVICE_CRITICALITY.CORE,
    purpose: 'Intent routing and agent catalogue.',
  },
  {
    id: 'mcp',
    repo: '02-mcp-gateway',
    name: 'MCP Gateway',
    category: 'Core platform services',
    baseUrl: BASE.mcp,
    healthPath: '/health',
    criticality: SERVICE_CRITICALITY.HIGH,
    purpose: 'Tool discovery and external command gateway.',
  },
  {
    id: 'rag',
    repo: '03-rag-cag-knowledge-layer',
    name: 'RAG/CAG Knowledge Layer',
    category: 'AI and knowledge capabilities',
    baseUrl: RAG_BASE,
    healthPath: '/health',
    criticality: SERVICE_CRITICALITY.HIGH,
    purpose: 'Grounded retrieval for debrief and copilots.',
  },
  {
    id: 'skills',
    repo: '04-skills-autoskills-registry',
    name: 'Skills Registry',
    category: 'AI and knowledge capabilities',
    baseUrl: BASE.skills,
    healthPath: '/health',
    criticality: SERVICE_CRITICALITY.HIGH,
    purpose: 'Autoskills catalogue and capability lookup.',
  },
  {
    id: 'documentation',
    repo: '05-documentation-agent',
    name: 'Documentation Agent',
    category: 'AI and knowledge capabilities',
    baseUrl: DOCUMENTATION_BASE,
    healthPath: '/health',
    criticality: SERVICE_CRITICALITY.MEDIUM,
    purpose: 'Documentation generation and project explanations.',
  },
  {
    id: 'pipelines',
    repo: '06-kdd-data-pipelines',
    name: 'KDD Data Pipelines',
    category: 'Data and simulation capabilities',
    baseUrl: PIPELINES_BASE,
    healthPath: '/health',
    criticality: SERVICE_CRITICALITY.HIGH,
    purpose: 'Lineage and ingestion pipeline visibility.',
  },
  {
    id: 'workflows',
    repo: '07-agentic-workflows',
    name: 'Agentic Workflows',
    category: 'Core platform services',
    baseUrl: BASE.workflows,
    healthPath: '/health',
    criticality: SERVICE_CRITICALITY.HIGH,
    purpose: 'Workflow definitions and execution surface.',
  },
  {
    id: 'experiments',
    repo: '08-experimentation-lab',
    name: 'Experimentation Lab',
    category: 'Data and simulation capabilities',
    baseUrl: BASE.experiments,
    healthPath: '/health',
    criticality: SERVICE_CRITICALITY.MEDIUM,
    purpose: 'Experiment catalogue and lab status.',
  },
  {
    id: 'observability',
    repo: '09-observability-platform',
    name: 'Observability Platform',
    category: 'Infrastructure and operations',
    baseUrl: '',
    healthPath: '',
    criticality: SERVICE_CRITICALITY.INFORMATIONAL,
    purpose: 'Grafana dashboards and telemetry definitions; validated outside browser probes.',
  },
  {
    id: 'docker-infra',
    repo: '10-infra-docker',
    name: 'Docker Infrastructure',
    category: 'Infrastructure and operations',
    baseUrl: '',
    healthPath: '',
    criticality: SERVICE_CRITICALITY.INFORMATIONAL,
    purpose: 'Local/container composition and service migration assets.',
  },
  {
    id: 'kubernetes-infra',
    repo: '11-infra-kubernetes',
    name: 'Kubernetes Infrastructure',
    category: 'Infrastructure and operations',
    baseUrl: '',
    healthPath: '',
    criticality: SERVICE_CRITICALITY.INFORMATIONAL,
    purpose: 'Cluster manifests and deployment topology; not browser-probed.',
  },
  {
    id: 'ci-cd-security',
    repo: '12-ci-cd-security',
    name: 'CI/CD Security',
    category: 'Infrastructure and operations',
    baseUrl: '',
    healthPath: '',
    criticality: SERVICE_CRITICALITY.INFORMATIONAL,
    purpose: 'Pipeline security controls and release guardrails.',
  },
  {
    id: 'ui-command-center',
    repo: '13-ui-command-center',
    name: 'KDD Command Center',
    category: 'Command center surfaces',
    baseUrl: '',
    healthPath: '',
    criticality: SERVICE_CRITICALITY.CORE,
    purpose: 'Canonical pit-wall product surface served at /pit-wall/app.',
  },
  {
    id: 'paper-reproducibility-kit',
    repo: '14-paper-reproducibility-kit',
    name: 'Paper Reproducibility Kit',
    category: 'Command center surfaces',
    baseUrl: '',
    healthPath: '',
    criticality: SERVICE_CRITICALITY.INFORMATIONAL,
    purpose: 'Research artifacts, paper sections, and reproducibility assets; not a live UI backend.',
  },
  {
    id: 'legacy-race-command-center',
    repo: '15-race-command-center',
    name: 'Legacy Race Command Center',
    category: 'Command center surfaces',
    baseUrl: '',
    healthPath: '',
    criticality: SERVICE_CRITICALITY.LOW,
    purpose: 'Legacy/lite command-center surface retained for compatibility and reference contracts.',
  },
  {
    id: 'copilot',
    repo: '16-race-ai-copilot',
    name: 'Race AI Copilot',
    category: 'AI and knowledge capabilities',
    baseUrl: COPILOT_BASE,
    healthPath: '/health',
    criticality: SERVICE_CRITICALITY.MEDIUM,
    purpose: 'Racing assistance and conversational guidance.',
  },
  {
    id: 'twin',
    repo: '17-digital-twin-simulation-lab',
    name: 'Digital Twin Simulation Lab',
    category: 'Data and simulation capabilities',
    baseUrl: TWIN_BASE,
    healthPath: '/health',
    criticality: SERVICE_CRITICALITY.HIGH,
    purpose: 'What-if setup simulation and risk verdicts.',
  },
  {
    id: 'telemetry',
    repo: '18-telemetry-dataset',
    name: 'Telemetry Dataset',
    category: 'Data and simulation capabilities',
    baseUrl: TELEMETRY_BASE,
    healthPath: `${V1}/health`,
    criticality: SERVICE_CRITICALITY.HIGH,
    purpose: 'Live session catalogue and telemetry-backed data cube.',
  },
  {
    id: 'agent-runtime-hermes',
    repo: '19-agent-runtime-hermes',
    name: 'Hermes Agent Runtime',
    category: 'Agent runtime capabilities',
    baseUrl: '',
    healthPath: '',
    criticality: SERVICE_CRITICALITY.INFORMATIONAL,
    purpose: 'Agent runtime composition; integrated through orchestrator and skills registry, not direct browser calls.',
  },
  {
    id: 'paperclip-control-plane',
    repo: '20-agentic-control-plane-paperclip',
    name: 'Paperclip Control Plane',
    category: 'Agent runtime capabilities',
    baseUrl: '',
    healthPath: '',
    criticality: SERVICE_CRITICALITY.INFORMATIONAL,
    purpose: 'Agentic control-plane assets and local composition.',
  },
  {
    id: 'insforge-backend',
    repo: '21-agentic-backend-insforge',
    name: 'InsForge Backend Platform',
    category: 'External capabilities',
    baseUrl: '',
    healthPath: '',
    criticality: SERVICE_CRITICALITY.INFORMATIONAL,
    purpose: 'Auth, database, functions, migrations, and deployment scripts consumed through browser-safe InsForge proxies.',
  },
  {
    id: 'fluent-bit-telemetry',
    repo: '22-log-telemetry-fluent-bit',
    name: 'Fluent Bit Log Telemetry',
    category: 'Infrastructure and operations',
    baseUrl: '',
    healthPath: '',
    criticality: SERVICE_CRITICALITY.INFORMATIONAL,
    purpose: 'Log forwarding/runtime telemetry infrastructure; validated by observability stack.',
  },
  {
    id: 'storage',
    repo: '23-object-storage-minio / InsForge Storage',
    name: 'Object Storage',
    category: 'External capabilities',
    baseUrl: '',
    healthPath: '',
    criticality: SERVICE_CRITICALITY.INFORMATIONAL,
    purpose: 'Informational only: storage is validated by server-side services, not browser probes.',
  },
];

interface HealthPayload {
  status?: string;
  state?: string;
  healthy?: boolean;
  ok?: boolean;
}

function getHealthStatus(payload: object | null, configured: boolean): ServiceStatus {
  if (!configured) return SERVICE_STATUS.NOT_CONFIGURED;
  if (!payload) return SERVICE_STATUS.OFFLINE;

  const health = payload as HealthPayload;
  const textStatus = (health.status ?? health.state ?? '').toLowerCase();
  if (textStatus.includes('degraded') || textStatus.includes('warn')) return SERVICE_STATUS.DEGRADED;
  if (textStatus.includes('down') || textStatus.includes('fail') || textStatus.includes('unhealthy')) return SERVICE_STATUS.DEGRADED;
  if (health.healthy === false || health.ok === false) return SERVICE_STATUS.DEGRADED;
  return SERVICE_STATUS.ONLINE;
}

function getHealthDetail(entry: ServiceRegistryEntry, status: ServiceStatus): string {
  if (status === SERVICE_STATUS.NOT_CONFIGURED) return 'No browser-safe health probe configured.';
  if (status === SERVICE_STATUS.OFFLINE) return `No successful response from ${entry.healthPath}.`;
  if (status === SERVICE_STATUS.DEGRADED) return `Probe responded from ${entry.healthPath}, but reported a non-healthy state.`;
  return `Probe responded from ${entry.healthPath}.`;
}

export async function fetchAllServiceHealth(): Promise<HealthMap> {
  const keys = Object.keys(BASE) as ServiceKey[];
  const results = await Promise.allSettled(
    keys.map((k) => safeFetch<object>(`${BASE[k]}/health`))
  );
  return Object.fromEntries(
    keys.map((k, i) => [k, results[i].status === 'fulfilled' && results[i].value !== null])
  ) as HealthMap;
}

export async function fetchServiceRegistryHealth(): Promise<ServiceRegistryHealthEntry[]> {
  const results = await Promise.all(
    SERVICE_REGISTRY.map(async (entry) => {
      const configured = Boolean(entry.baseUrl && entry.healthPath);
      const payload = configured ? await safeFetch<object>(`${entry.baseUrl}${entry.healthPath}`) : null;
      const status = getHealthStatus(payload, configured);
      return {
        ...entry,
        status,
        detail: getHealthDetail(entry, status),
      };
    })
  );
  return results;
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
  workflow_id?: string;
  name: string;
  description?: string;
  version?: string;
  triggers?: string[];
  status?: string;
}
export async function fetchWorkflows(): Promise<WorkflowEntry[] | null> {
  const data = await safeFetch<WorkflowEntry[] | { workflows: WorkflowEntry[] }>(
    `${BASE.workflows}${V1}/workflows`
  );
  if (!data) return null;
  const workflows = Array.isArray(data) ? data : data.workflows;
  return workflows.map((workflow) => ({
    ...workflow,
    id: workflow.id ?? workflow.workflow_id ?? workflow.name,
  }));
}

// ──── Skills ────

export interface SkillEntry {
  id?: string;
  name: string;
  version?: string;
  category?: string;
  status?: string;
  risk_level?: string;
  approval_required?: boolean;
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
  hypothesis?: string;
  baseline_id?: string;
  variant_id?: string;
  dataset_id?: string;
  metrics?: string[];
  status?: string;
}
export async function fetchExperiments(): Promise<ExperimentEntry[] | null> {
  const data = await safeFetch<ExperimentEntry[] | { experiments: ExperimentEntry[] }>(
    `${BASE.experiments}${V1}/experiments`
  );
  if (!data) return null;
  const experiments = Array.isArray(data) ? data : data.experiments;
  return experiments.map((experiment) => ({
    ...experiment,
    id: experiment.id ?? experiment.experiment_id ?? experiment.name,
  }));
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

// Intent classification / routing via the orchestrator.
// Contract verified in 01-agent-orchestrator:
//   POST /api/v1/workflows
//   body: WorkflowRequest { request, target_repository?, context }
export interface OrchestrationResult {
  workflow_id?: string;
  status: string;
  classification?: { intent?: string; confidence?: number; [key: string]: unknown };
  kdd?: { kdd_stage?: string; [key: string]: unknown };
  plan?: {
    selected_agents?: string[];
    required_tools?: string[];
    approval_required?: boolean;
    [key: string]: unknown;
  };
  execution_status?: string;
  agent_used?: string;
  result?: unknown;
}
export async function orchestrate(userInput: string): Promise<OrchestrationResult | null> {
  try {
    const r = await fetch(`${BASE.orchestrator}${V1}/workflows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        request: userInput,
        context: {
          source: 'ui-command-center',
          mode: 'plan_only',
          // Force ApprovalEngine.requires_approval() so the public UI can ask
          // the orchestrator for a real plan without auto-executing MCP tools.
          risk_level: 'high',
        },
      }),
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
  const data = await safeFetch<McpTool[] | string[] | { tools: McpTool[] | string[] }>(
    `${BASE.mcp}${V1}/tools`
  );
  if (!data) return null;
  const tools = Array.isArray(data) ? data : data.tools;
  return tools.map((tool) => (typeof tool === 'string' ? { name: tool } : tool));
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

// ── Documentation agent (05-documentation-agent) ─────────────────────────────

export const DOCUMENT_TYPE = {
  CREW_CHIEF_REPORT: 'crew_chief_report',
  TELEMETRY_EVIDENCE_REPORT: 'telemetry_evidence_report',
  SIMULATION_REPORT: 'simulation_report',
  PAPER_SECTION: 'paper_section',
} as const;

export type DocumentType = (typeof DOCUMENT_TYPE)[keyof typeof DOCUMENT_TYPE];

export interface DocumentGenerateRequest {
  document_type: DocumentType;
  title: string;
  target_repository?: string;
  output_path?: string;
  workflow_id?: string;
  context_query?: string;
  data: Record<string, unknown>;
  evidence_required?: boolean;
  write_file?: boolean;
}

export interface DocumentGenerateResult {
  document_id: string;
  document_type: string;
  title: string;
  content: string;
  output_path?: string | null;
  evidence: Record<string, unknown>[];
  validation: Record<string, unknown>;
  written: boolean;
}

export async function generateDocument(req: DocumentGenerateRequest): Promise<DocumentGenerateResult | null> {
  try {
    const r = await fetch(`${DOCUMENTATION_BASE}${V1}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) return null;
    return r.json() as Promise<DocumentGenerateResult>;
  } catch {
    return null;
  }
}

// ── Race AI Copilot (16-race-ai-copilot) ──────────────────────────────────────
// Canonical Command Center integration: POST
// /api/v1/integrations/race-command-center/chat. The same-origin BFF injects the
// internal API key; this browser client only sends the typed request envelope.

export const APPROVAL_SCOPE = {
  READ_ONLY: 'read_only',
  PROPOSE: 'propose',
  APPROVE: 'approve',
  EXECUTE: 'execute',
} as const;

export type ApprovalScope = (typeof APPROVAL_SCOPE)[keyof typeof APPROVAL_SCOPE];

export const COPILOT_ENVELOPE_KIND = {
  COMMAND_CENTER: 'command_center',
} as const;

export type CopilotEnvelopeKind = (typeof COPILOT_ENVELOPE_KIND)[keyof typeof COPILOT_ENVELOPE_KIND];

export interface CopilotTenantMetadata {
  tenant_id: string;
  user_role: string;
  approval_scope: ApprovalScope;
}

export interface CopilotRequestContext {
  tenant: CopilotTenantMetadata;
  request_id?: string;
  session_id?: string;
  correlation_id?: string;
  metadata: Record<string, unknown>;
}

export interface CopilotReportingMetadata {
  report_type: string;
  report_id?: string;
  source_system: string;
  correlation_id?: string;
  labels: Record<string, string>;
}

export interface RaceCopilotChatTurn {
  role: string;
  content: string;
}

export interface RaceCopilotVehicleContext {
  circuit_name: string;
  country: string;
  lap: number;
  total_laps: number;
  position: number;
  gap: string;
  speed_kmh: number;
  gear: number;
  rpm: number;
  throttle_pct: number;
  brake_pct: number;
  lean_angle_deg: number;
  last_lap_s: number;
  best_lap_s: number;
  lap_delta_s: number;
  rear_compound: string;
  rear_tyre_age_laps: number;
  rear_grip_pct: number;
  fuel_kg: number;
  tyre_temps_c: Record<string, number>;
}

export interface RaceCopilotRequestEnvelope {
  kind: CopilotEnvelopeKind;
  context: CopilotRequestContext;
  reporting: CopilotReportingMetadata;
  metadata: Record<string, unknown>;
  query: string;
  history: RaceCopilotChatTurn[];
  command_center_id: string;
  vehicle_context: RaceCopilotVehicleContext;
}

export interface RaceCopilotApproval {
  required: boolean;
  granted: boolean;
  scope: ApprovalScope;
  approver_role?: string | null;
  reason?: string | null;
}

export interface RaceCopilotResponseEnvelope {
  kind: CopilotEnvelopeKind;
  context: CopilotRequestContext;
  reporting?: CopilotReportingMetadata | null;
  metadata: Record<string, unknown>;
  answer: string;
  evidence: Record<string, unknown>[];
  tool_calls: Record<string, unknown>[];
  recommendations: Record<string, unknown>[];
  approval: RaceCopilotApproval;
  next_step?: string | null;
}

export interface RaceCopilotChatInput {
  query: string;
  history: RaceCopilotChatTurn[];
  vehicleContext: RaceCopilotVehicleContext;
  systemPrompt: string;
  commandCenterId?: string;
  tenantId?: string;
  userRole?: string;
}

function createCopilotEnvelope(input: RaceCopilotChatInput): RaceCopilotRequestEnvelope {
  const requestId = `cc-${Date.now()}`;
  const commandCenterId = input.commandCenterId ?? 'kdd-pit-wall-command-center';
  return {
    kind: COPILOT_ENVELOPE_KIND.COMMAND_CENTER,
    context: {
      tenant: {
        tenant_id: input.tenantId ?? 'kdd-demo',
        user_role: input.userRole ?? 'race_engineer',
        approval_scope: APPROVAL_SCOPE.PROPOSE,
      },
      request_id: requestId,
      session_id: commandCenterId,
      correlation_id: requestId,
      metadata: {
        source: '13-ui-command-center',
        surface: 'ai-copilot-page',
      },
    },
    reporting: {
      report_type: 'command_center_chat',
      source_system: '13-ui-command-center',
      correlation_id: requestId,
      labels: {
        repo: '13-ui-command-center',
        downstream: '16-race-ai-copilot',
      },
    },
    metadata: {
      system_prompt: input.systemPrompt,
      client_capabilities: ['live_context', 'fallback_gateway', 'read_only_chat'],
    },
    query: input.query,
    history: input.history,
    command_center_id: commandCenterId,
    vehicle_context: input.vehicleContext,
  };
}

export async function askRaceCopilot(input: RaceCopilotChatInput): Promise<RaceCopilotResponseEnvelope | null> {
  try {
    const r = await fetch(`${COPILOT_BASE}${V1}/integrations/race-command-center/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createCopilotEnvelope(input)),
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) return null;
    return r.json() as Promise<RaceCopilotResponseEnvelope>;
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

export interface PipelineEvidenceItem {
  evidence_id: string;
  description: string;
  confidence: number;
  kdd_stage: string;
}

export interface PipelineEvidenceList {
  evidence: PipelineEvidenceItem[];
  count: number;
  total: number;
}

export type PipelineEvidenceOutcome =
  | { ok: true; data: PipelineEvidenceList }
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

export async function fetchPipelineEvidence(): Promise<PipelineEvidenceOutcome> {
  try {
    const r = await fetch(`${PIPELINES_BASE}${V1}/evidence/`, { signal: AbortSignal.timeout(8000) });
    if (r.status === 401 || r.status === 403) return { ok: false, reason: 'unauthorized' };
    if (!r.ok) return { ok: false, reason: 'unreachable' };
    return { ok: true, data: (await r.json()) as PipelineEvidenceList };
  } catch {
    return { ok: false, reason: 'unreachable' };
  }
}
