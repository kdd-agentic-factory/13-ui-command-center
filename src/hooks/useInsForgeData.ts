/**
 * useInsForgeData — fetches live data from InsForge cloud (PostgreSQL + realtime).
 *
 * Runs alongside the existing useServiceData polling hook. When InsForge data
 * is available it takes priority; otherwise the component falls back to the
 * polled microservice data.
 *
 * Tables queried:
 *   experiments          (08-experimentation-lab)
 *   workflow_executions  (01-agent-orchestrator / 07-agentic-workflows)
 *   agent_approvals      (01-agent-orchestrator)
 *
 * Realtime channels subscribed:
 *   experiments          — experiment_created, experiment_updated, run_completed
 *   workflow_executions  — workflow_started, workflow_completed, workflow_failed
 *   agent_approvals      — approval_requested, approval_resolved
 */
import { useState, useEffect, useRef } from 'react';
import type { SocketMessage } from '@insforge/sdk';
import { insforge } from '../lib/insforge';

// ── Domain types (match migration schema) ────────────────────────────────────

export interface InsForgeExperiment {
  experiment_id: string;
  name: string;
  status: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface InsForgeWorkflowExecution {
  execution_id: string;
  workflow_id: string;
  status: string;
  steps_completed: number;
  triggered_by?: string;
  created_at?: string;
  completed_at?: string;
}

export interface InsForgeApproval {
  approval_id: string;
  step_name: string;
  requested_by: string;
  approved_by?: string;
  status: string;
  created_at?: string;
}

export interface InsForgeData {
  /** Live experiments from InsForge DB */
  experiments: InsForgeExperiment[];
  /** Recent workflow executions */
  workflowExecutions: InsForgeWorkflowExecution[];
  /** Approvals currently waiting for human sign-off */
  pendingApprovals: InsForgeApproval[];
  /** Whether the realtime WebSocket is connected */
  realtimeConnected: boolean;
  /** True while the initial DB fetch is in flight */
  isLoading: boolean;
  /** Non-null when InsForge is unreachable or queries fail */
  error: string | null;
}

const EMPTY: InsForgeData = {
  experiments: [],
  workflowExecutions: [],
  pendingApprovals: [],
  realtimeConnected: false,
  isLoading: true,
  error: null,
};

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useInsForgeData(): InsForgeData {
  const [state, setState] = useState<InsForgeData>(EMPTY);
  const realtimeRef = useRef(false);

  // ── Initial DB fetch ────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      try {
        const [expRes, wfRes, appRes] = await Promise.allSettled([
          insforge.database
            .from('experiments')
            .select('experiment_id, name, status, description, created_at, updated_at')
            .order('updated_at', { ascending: false })
            .limit(20),
          insforge.database
            .from('workflow_executions')
            .select('execution_id, workflow_id, status, steps_completed, triggered_by, created_at, completed_at')
            .order('created_at', { ascending: false })
            .limit(20),
          insforge.database
            .from('agent_approvals')
            .select('approval_id, step_name, requested_by, approved_by, status, created_at')
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(10),
        ]);

        if (cancelled) return;

        setState(prev => ({
          ...prev,
          isLoading: false,
          experiments:
            expRes.status === 'fulfilled' && expRes.value.data
              ? (expRes.value.data as InsForgeExperiment[])
              : prev.experiments,
          workflowExecutions:
            wfRes.status === 'fulfilled' && wfRes.value.data
              ? (wfRes.value.data as InsForgeWorkflowExecution[])
              : prev.workflowExecutions,
          pendingApprovals:
            appRes.status === 'fulfilled' && appRes.value.data
              ? (appRes.value.data as InsForgeApproval[])
              : prev.pendingApprovals,
          error: null,
        }));
      } catch (err) {
        if (cancelled) return;
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: err instanceof Error ? err.message : 'InsForge fetch failed',
        }));
      }
    }

    fetchAll();
    return () => { cancelled = true; };
  }, []);

  // ── Realtime subscriptions ──────────────────────────────────────────────

  useEffect(() => {
    if (realtimeRef.current) return;
    realtimeRef.current = true;

    const rt = insforge.realtime;

    async function setup() {
      try {
        await rt.connect();
        setState(prev => ({ ...prev, realtimeConnected: true }));

        await Promise.allSettled([
          rt.subscribe('experiments'),
          rt.subscribe('workflow_executions'),
          rt.subscribe('agent_approvals'),
        ]);

        // ── Experiment events ────────────────────────────────────────────

        rt.on<SocketMessage>('experiment_created', (msg) => {
          const exp = msg.payload as Partial<InsForgeExperiment>;
          if (!exp.experiment_id) return;
          setState(prev => ({
            ...prev,
            experiments: [exp as InsForgeExperiment, ...prev.experiments].slice(0, 20),
          }));
        });

        rt.on<SocketMessage>('experiment_updated', (msg) => {
          const exp = msg.payload as Partial<InsForgeExperiment>;
          if (!exp.experiment_id) return;
          setState(prev => ({
            ...prev,
            experiments: prev.experiments.some(e => e.experiment_id === exp.experiment_id)
              ? prev.experiments.map(e =>
                  e.experiment_id === exp.experiment_id ? { ...e, ...exp } : e
                )
              : [exp as InsForgeExperiment, ...prev.experiments].slice(0, 20),
          }));
        });

        rt.on<SocketMessage>('run_completed', (msg) => {
          // Refresh the parent experiment's status when a run finishes
          const { experiment_id } = msg.payload as { experiment_id?: string };
          if (!experiment_id) return;
          insforge.database
            .from('experiments')
            .select('experiment_id, name, status, description, updated_at')
            .eq('experiment_id', experiment_id)
            .single()
            .then(({ data }) => {
              if (!data) return;
              setState(prev => ({
                ...prev,
                experiments: prev.experiments.map(e =>
                  e.experiment_id === experiment_id ? { ...e, ...(data as InsForgeExperiment) } : e
                ),
              }));
            });
        });

        // ── Workflow execution events ────────────────────────────────────

        rt.on<SocketMessage>('workflow_started', (msg) => {
          const wf = msg.payload as Partial<InsForgeWorkflowExecution>;
          if (!wf.execution_id) return;
          setState(prev => ({
            ...prev,
            workflowExecutions: [wf as InsForgeWorkflowExecution, ...prev.workflowExecutions].slice(0, 20),
          }));
        });

        rt.on<SocketMessage>('workflow_completed', (msg) => {
          const update = msg.payload as Partial<InsForgeWorkflowExecution>;
          if (!update.execution_id) return;
          setState(prev => ({
            ...prev,
            workflowExecutions: prev.workflowExecutions.map(w =>
              w.execution_id === update.execution_id ? { ...w, ...update } : w
            ),
          }));
        });

        rt.on<SocketMessage>('workflow_failed', (msg) => {
          const update = msg.payload as Partial<InsForgeWorkflowExecution>;
          if (!update.execution_id) return;
          setState(prev => ({
            ...prev,
            workflowExecutions: prev.workflowExecutions.map(w =>
              w.execution_id === update.execution_id ? { ...w, ...update, status: 'failed' } : w
            ),
          }));
        });

        // ── Approval events ──────────────────────────────────────────────

        rt.on<SocketMessage>('approval_requested', (msg) => {
          const approval = msg.payload as InsForgeApproval;
          if (!approval.approval_id) return;
          setState(prev => ({
            ...prev,
            pendingApprovals: [approval, ...prev.pendingApprovals].slice(0, 10),
          }));
        });

        rt.on<SocketMessage>('approval_resolved', (msg) => {
          const { approval_id } = msg.payload as { approval_id: string };
          if (!approval_id) return;
          setState(prev => ({
            ...prev,
            pendingApprovals: prev.pendingApprovals.filter(a => a.approval_id !== approval_id),
          }));
        });

        // ── Connection lifecycle ─────────────────────────────────────────

        rt.on('disconnect', () => {
          setState(prev => ({ ...prev, realtimeConnected: false }));
        });

        rt.on('connect', () => {
          setState(prev => ({ ...prev, realtimeConnected: true }));
        });

      } catch {
        // Realtime is optional — degrade gracefully if server is unreachable
        setState(prev => ({ ...prev, realtimeConnected: false }));
      }
    }

    setup();

    return () => {
      rt.unsubscribe('experiments');
      rt.unsubscribe('workflow_executions');
      rt.unsubscribe('agent_approvals');
      rt.disconnect();
    };
  }, []);

  return state;
}
