import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchAllServiceHealth,
  fetchKddStages,
  fetchWorkflows,
  fetchExperiments,
  fetchMcpTools,
  fetchSkills,
  fetchAgents,
  type HealthMap,
  type KddStage,
  type WorkflowEntry,
  type ExperimentEntry,
  type McpTool,
  type SkillEntry,
  type AgentEntry,
} from '../services/api';
import {
  trackDashboardLoaded,
  trackHealthChanged,
  trackHealthSnapshot,
} from '../lib/analytics';

export interface LiveData {
  health: HealthMap;
  kddStagesCount: number;
  workflowsCount: number;
  experimentsCount: number;
  mcpToolsCount: number;
  servicesUp: number;
  servicesTotal: number;
  lastUpdated: Date | null;
  loading: boolean;
  // Per-component live lists
  agentNames: AgentEntry[];
  liveSkills: SkillEntry[];
  liveExperiments: ExperimentEntry[];
  liveMcpTools: McpTool[];
  liveKddStages: KddStage[];
  liveWorkflows: WorkflowEntry[];
}

const EMPTY_HEALTH: HealthMap = {
  governance: false,
  orchestrator: false,
  skills: false,
  workflows: false,
  experiments: false,
  mcp: false,
};

const POLL_MS = 30_000;

export function useServiceData(): LiveData & { refresh: () => void } {
  const [data, setData] = useState<LiveData>({
    health: EMPTY_HEALTH,
    kddStagesCount: 0,
    workflowsCount: 0,
    experimentsCount: 0,
    mcpToolsCount: 0,
    servicesUp: 0,
    servicesTotal: Object.keys(EMPTY_HEALTH).length,
    lastUpdated: null,
    loading: true,
    agentNames: [],
    liveSkills: [],
    liveExperiments: [],
    liveMcpTools: [],
    liveKddStages: [],
    liveWorkflows: [],
  });

  // Track whether this is the very first load so we fire dashboard_loaded once.
  const isFirstLoad = useRef(true);
  const prevServicesUp = useRef<number | null>(null);
  const loadStartMs = useRef<number>(Date.now());

  const refresh = useCallback(async () => {
    loadStartMs.current = Date.now();

    const [health, stages, workflows, experiments, tools, skills, agents] =
      await Promise.all([
        fetchAllServiceHealth(),
        fetchKddStages(),
        fetchWorkflows(),
        fetchExperiments(),
        fetchMcpTools(),
        fetchSkills(),
        fetchAgents(),
      ]);

    const servicesUp = Object.values(health).filter(Boolean).length;
    const servicesTotal = Object.keys(health).length;
    const liveStages = stages?.stages ?? [];

// ──── Analytics ────

    // Fire dashboard_loaded exactly once, on the first successful fetch.
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      trackDashboardLoaded({
        servicesUp,
        servicesTotal,
        loadDurationMs: Date.now() - loadStartMs.current,
      });
    }

    // Track health changes between polls.
    if (prevServicesUp.current !== null && prevServicesUp.current !== servicesUp) {
      trackHealthChanged({
        previousUp: prevServicesUp.current,
        currentUp: servicesUp,
        servicesTotal,
        direction:
          servicesUp > prevServicesUp.current
            ? 'improved'
            : servicesUp < prevServicesUp.current
              ? 'degraded'
              : 'unchanged',
      });
    }
    prevServicesUp.current = servicesUp;

    // Health snapshot on every successful poll.
    trackHealthSnapshot({
      servicesUp,
      servicesTotal,
      governance: health.governance,
      orchestrator: health.orchestrator,
      skills: health.skills,
      workflows: health.workflows,
      experiments: health.experiments,
      mcp: health.mcp,
    });

    // ──────────────────────────────────────────────────────────────────────

    setData({
      health,
      kddStagesCount: liveStages.length,
      workflowsCount: workflows?.length ?? 0,
      experimentsCount: experiments?.length ?? 0,
      mcpToolsCount: tools?.length ?? 0,
      servicesUp,
      servicesTotal,
      lastUpdated: new Date(),
      loading: false,
      agentNames: agents ?? [],
      liveSkills: skills ?? [],
      liveExperiments: experiments ?? [],
      liveMcpTools: tools ?? [],
      liveKddStages: liveStages,
      liveWorkflows: workflows ?? [],
    });
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  return { ...data, refresh };
}
