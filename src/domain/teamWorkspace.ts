/**
 * teamWorkspace.ts — Team Workspace.
 *
 * The shared surface for the crew: who is on the wall, the task board for the
 * session (assigned, in progress, done), shared notes and an activity feed.
 * Turns KDD from a single-operator dashboard into a team operating space, fed
 * by the same decisions persisted in decision_log.
 *
 * Deterministic and personalised to the active rider/session.
 */

export type TaskStatus = 'todo' | 'doing' | 'done';
export const TASK_COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: 'todo',  label: 'Assigned' },
  { status: 'doing', label: 'In progress' },
  { status: 'done',  label: 'Done' },
];

export interface TeamMember { name: string; role: string; online: boolean; color: string; }
export interface WorkspaceTask { id: string; title: string; assignee: string; status: TaskStatus; priority: 'P1' | 'P2' | 'P3'; }
export interface SharedNote { author: string; t: string; text: string; }
export interface ActivityEvent { t: string; who: string; text: string; }

export interface TeamWorkspace {
  combo: string;
  members: TeamMember[];
  tasks: WorkspaceTask[];
  notes: SharedNote[];
  activity: ActivityEvent[];
}

export function buildTeamWorkspace(rider: string, circuit: string): TeamWorkspace {
  const members: TeamMember[] = [
    { name: 'A. Rossi',      role: 'Crew Chief',    online: true,  color: '#E03737' },
    { name: 'You',           role: 'Race Engineer', online: true,  color: '#00B7FF' },
    { name: 'M. Bianchi',    role: 'Data Analyst',  online: true,  color: '#3B82F6' },
    { name: 'L. Costa',      role: 'Mechanic',      online: false, color: '#22C55E' },
    { name: 'T. Principal',  role: 'Team Principal', online: false, color: '#F59E0B' },
  ];
  return {
    combo: `${rider} · ${circuit}`,
    members,
    tasks: [
      { id: 't1', title: 'Apply rear rebound +2 for Stint 04', assignee: 'L. Costa',   status: 'doing', priority: 'P1' },
      { id: 't2', title: 'Validate T15 Bucine exit experiment', assignee: 'You',        status: 'doing', priority: 'P1' },
      { id: 't3', title: 'Prep medium rear for long run',       assignee: 'L. Costa',   status: 'todo',  priority: 'P2' },
      { id: 't4', title: 'Pull Sector 3 traction overlay',      assignee: 'M. Bianchi', status: 'todo',  priority: 'P2' },
      { id: 't5', title: 'Confirm fuel for 12-lap stint',       assignee: 'A. Rossi',   status: 'todo',  priority: 'P3' },
      { id: 't6', title: 'Sign off Stint 03 baseline data',     assignee: 'M. Bianchi', status: 'done',  priority: 'P2' },
      { id: 't7', title: 'Brief rider on pickup cue',           assignee: 'A. Rossi',   status: 'done',  priority: 'P1' },
    ],
    notes: [
      { author: 'M. Bianchi', t: '14:18', text: 'Baseline locked from Stint 03 lap 5 — clean reference for the experiment.' },
      { author: 'A. Rossi',   t: '14:22', text: 'Rider happy to try the pickup cue. Keep TC unchanged this run.' },
      { author: 'You',        t: '14:31', text: 'Experiment EXP-04 running, watching rear slip live.' },
    ],
    activity: [
      { t: '14:31', who: 'You',        text: 'started experiment EXP-04 · Exit Drive Validation' },
      { t: '14:22', who: 'A. Rossi',   text: 'approved the rebound change for Stint 04' },
      { t: '14:20', who: 'Oracle',     text: 'logged verdict: rebound +2, confidence 84%' },
      { t: '14:18', who: 'M. Bianchi', text: 'signed off the Stint 03 baseline' },
    ],
  };
}
