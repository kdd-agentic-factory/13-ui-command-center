/** Workboard v1 wire contracts. Agent execution and human authority stay separate. */
export type WorkProfile = 'pilot' | 'mechanic' | 'engineer' | 'analyst' | 'crew_chief' | 'observer';
export type WorkState = 'proposed' | 'pending' | 'in_progress' | 'in_review' | 'closed' | 'blocked';
export interface WorkEstimate {
  minutes: number | null;
  author: string | null;
  basis: string | null;
  uncertainty: 'low' | 'medium' | 'high' | null;
}
export interface TaskCandidate {
  schema_version: '1.0.0'; title: string; instructions: string;
  kind: 'measurement' | 'inspection' | 'analysis' | 'controlled_test' | 'setup_change' | 'product_idea';
  target_profile: WorkProfile; acceptance: string; responsible_id: string | null;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  dependencies: string[]; evidence: string[];
  agent_id: string | null; leader_id: string | null; proposal_id: string | null;
  candidate_id: string | null; snapshot_id: string | null; snapshot_digest: string | null;
  execution_estimate: WorkEstimate; review_estimate: WorkEstimate; due_at: string | null;
}
export interface WorkTask extends TaskCandidate {
  id: string; team_id: string; session_id: string; session_revision: number;
  revision: number; state: WorkState; created_by: string; created_at: string;
  actual_minutes: number | null; blocked_reason: string | null;
}
interface SessionRecord {
  schema_version: '1.0.0'; id: string; team_id: string;
  session_id: string; session_revision: number; created_at: string;
}
export interface WorkReview extends SessionRecord {
  task_id: string; task_revision: number; task_digest: string;
  evidence: string[]; summary: string; limitations: string; submitted_by: string;
}
export interface GuideTurn extends SessionRecord {
  created_by: string; message: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'interrupted';
  snapshot_id: string | null; snapshot_digest: string | null;
  model: string | null; answer: string | null; evidence: string[]; error: string | null;
}
