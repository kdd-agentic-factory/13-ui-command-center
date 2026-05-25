import { useState, useEffect, useCallback } from 'react';
import {
  fetchAllServiceHealth,
  fetchKddStages,
  fetchWorkflows,
  fetchExperiments,
  fetchMcpTools,
  type HealthMap,
} from '../services/api';

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
  });

  const refresh = useCallback(async () => {
    const [health, stages, workflows, experiments, tools] = await Promise.all([
      fetchAllServiceHealth(),
      fetchKddStages(),
      fetchWorkflows(),
      fetchExperiments(),
      fetchMcpTools(),
    ]);

    const servicesUp = Object.values(health).filter(Boolean).length;

    setData({
      health,
      kddStagesCount: stages?.stages?.length ?? 0,
      workflowsCount: workflows?.length ?? 0,
      experimentsCount: experiments?.length ?? 0,
      mcpToolsCount: tools?.length ?? 0,
      servicesUp,
      servicesTotal: Object.keys(health).length,
      lastUpdated: new Date(),
      loading: false,
    });
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  return { ...data, refresh };
}
