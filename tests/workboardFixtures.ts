import type {TaskCandidate, WorkTask} from '../src/domain/sessionWorkboard';
export const teamId='10000000-0000-4000-8000-000000000001';
export const userId='10000000-0000-4000-8000-000000000002';
export const sessionId='10000000-0000-4000-8000-000000000003';
export const taskId='10000000-0000-4000-8000-000000000004';
export const snapshotId='10000000-0000-4000-8000-000000000005';
export const reviewId='10000000-0000-4000-8000-000000000006';
const estimate={minutes:null,author:null,basis:null,uncertainty:null};
export const candidate:TaskCandidate={schema_version:'1.0.0',title:'Medir recorrido delantero',instructions:'Registrar tres medidas con el sensor calibrado.',kind:'measurement',target_profile:'mechanic',acceptance:'Tres lecturas con su procedencia',responsible_id:null,priority:'normal',dependencies:[],evidence:[],agent_id:null,leader_id:null,proposal_id:null,candidate_id:null,snapshot_id:null,snapshot_digest:null,execution_estimate:estimate,review_estimate:estimate,due_at:null};
export const task=(changes:Partial<WorkTask>={}):WorkTask=>({...candidate,id:taskId,team_id:teamId,session_id:sessionId,session_revision:1,revision:1,state:'proposed',created_by:userId,created_at:'2026-11-03T10:00:00Z',actual_minutes:null,blocked_reason:null,...changes});
export function delivery(){return {schema_version:'1.0.0' as const,base_task_revision:3,task:task({revision:4,state:'in_review'}),review:{schema_version:'1.0.0' as const,id:reviewId,team_id:teamId,session_id:sessionId,session_revision:1,created_at:'2026-11-03T10:00:00Z',task_id:taskId,task_revision:4,task_digest:'a'.repeat(64),evidence:[`snapshot:${snapshotId}@1:${'b'.repeat(64)}`],summary:'Tres medidas registradas',limitations:'Sin validación física externa',submitted_by:userId},snapshots:[{id:snapshotId,revision:1,snapshot_digest:'b'.repeat(64),content_digest:'c'.repeat(64),analyzable:false,blocked_reasons:['no_telemetry']}],digest:'d'.repeat(64)};}
