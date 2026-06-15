/**
 * decisions.ts — the Decision Center domain: the platform as the pit-wall's
 * deciding assistant.
 *
 * Every pending call lives here with the structure a crew chief actually
 * decides on: situation → options (each with expected gain AND risk) →
 * Oracle recommendation with confidence → one-tap decide → logged with
 * lap/time for post-session accountability.
 *
 * Decisions are routed by role: the crew chief sees race calls, the engineer
 * sees setup validations, the team principal sees strategy/risk approvals.
 */
import type { ProfileId } from '../context/AuthContext';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DecisionOption {
  label: string;
  gain: string;      // expected upside, e.g. "−0.42s/lap"
  risk: string;      // expected downside, e.g. "rear temp +4°C"
  note?: string;
}

export interface Decision {
  id: string;
  title: string;
  situation: string;
  source: 'Oracle Pit Wall' | 'Safety Guardian' | 'Tyre Intelligence' | 'Garage Engineer' | 'Digital Twin';
  audience: ProfileId[];
  options: DecisionOption[];
  recommended: number;          // index into options
  confidence: number;           // 0..1
  rationale: string;
  window: string;               // decision window, e.g. "before lap 19"
  status: 'pending' | 'decided' | 'deferred';
  decidedOption?: number;
  decidedAt?: string;           // ISO time
  decidedLap?: number;
}

// ── Seeded pending decisions (per-role routing) ───────────────────────────────

const SEED: Decision[] = [
  {
    id: 'tc-step', title: 'Raise traction control before the rear cliff',
    situation: 'Rear soft grip 78% and falling 1.8%/lap. Cliff predicted lap 19. Rival P4 closing 0.3s/lap.',
    source: 'Tyre Intelligence', audience: ['race-engineer', 'team-principal'],
    options: [
      { label: 'TC4 → TC5 now', gain: 'risk −12 pts', risk: '+0.047s/lap', note: 'protects rear to flag' },
      { label: 'Hold TC4, manage with throttle', gain: '0.0s/lap', risk: 'crash-risk 76/100 on exits', note: 'depends on rider discipline' },
      { label: 'TC5 + engine brake EB2', gain: 'risk −16 pts', risk: '+0.09s/lap', note: 'most conservative' },
    ],
    recommended: 0, confidence: 0.88,
    rationale: 'Twin sims: TC5 holds P3 with 92% probability; TC4 drops to 61% if grip crosses the cliff before lap 21.',
    window: 'before lap 19', status: 'pending',
  },
  {
    id: 'rebound-validation', title: 'Approve rear rebound +2 clicks for next stint',
    situation: 'Stint 03 validation: rear slip 9.4% (<10% target), exit speed +5.2 km/h at Bucine, no crash-risk increase.',
    source: 'Garage Engineer', audience: ['race-engineer', 'mechanic'],
    options: [
      { label: 'Approve — make permanent', gain: '−0.18s/lap validated', risk: 'slower direction change (T13-T14)' },
      { label: 'One more validation stint', gain: 'higher certainty', risk: 'costs a stint of track time' },
      { label: 'Revert to baseline', gain: 'agility back', risk: 'rear instability returns on exits' },
    ],
    recommended: 0, confidence: 0.91,
    rationale: 'All three validation targets met on laps 2–4 (clean comparison window). Trade-off at T13-T14 measured at +0.03s, net gain stands.',
    window: 'before next stint', status: 'pending',
  },
  {
    id: 'attack-p2', title: 'Authorize attack plan on P2',
    situation: 'Gap to P2: 1.4s and closing 0.2s/lap. Best overtake zone T1 (brake delta −7m). Fuel margin OK.',
    source: 'Oracle Pit Wall', audience: ['team-principal', 'race-engineer'],
    options: [
      { label: 'Authorize attack — 3-lap push', gain: 'P2 catch probability 74%', risk: 'rear temp +4°C, cliff moves to lap 18' },
      { label: 'Hold position, defend P3', gain: 'podium probability 89%', risk: 'gives up 4 championship points' },
    ],
    recommended: 1, confidence: 0.72,
    rationale: 'Championship math favours the safe podium: P2 catch burns the rear into P4-defence territory. Attack only if P4 gap stays >2.5s.',
    window: 'laps 14–16', status: 'pending',
  },
];

// ── Store ─────────────────────────────────────────────────────────────────────

let decisions: Decision[] = SEED.map(d => ({ ...d }));
const listeners = new Set<() => void>();

export function subscribeDecisions(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function emit() { listeners.forEach(fn => fn()); }

export function decisionsFor(profile: ProfileId | null): Decision[] {
  if (!profile) return [];
  return decisions.filter(d => d.audience.includes(profile));
}

export function pendingCount(profile: ProfileId | null): number {
  return decisionsFor(profile).filter(d => d.status === 'pending').length;
}

export function decide(id: string, optionIdx: number, lap: number): void {
  const target = decisions.find(d => d.id === id);
  decisions = decisions.map(d => d.id === id
    ? { ...d, status: 'decided', decidedOption: optionIdx, decidedAt: new Date().toISOString(), decidedLap: lap }
    : d);
  emit();
  if (target) {
    void persistDecisionLog(target, optionIdx, lap);
    if (target.id.startsWith('approval_')) void pushApprovalDecision(target, optionIdx);
  }
}

// ── Persistence: decision_log table (accountability trail) ──────────────────

async function persistDecisionLog(d: Decision, optionIdx: number, lap: number): Promise<void> {
  try {
    const { insforge } = await import('../lib/insforge');
    const { data: user } = await insforge.auth.getCurrentUser();
    const uid = (user as { user?: { id?: string } } | null)?.user?.id;
    if (!uid) return; // anonymous sessions stay local
    const { getSessionContext } = await import('./sessionContext');
    await insforge.database.from('decision_log').insert([{
      decision_id: d.id, title: d.title, source: d.source,
      chosen_option: d.options[optionIdx].label,
      recommended_followed: optionIdx === d.recommended,
      lap, circuit_id: getSessionContext().selectedCircuit,
      profile: d.audience[0], created_by: uid,
    }]);
  } catch { /* non-blocking */ }
}

// ── Real backend feed: orchestrator approval queue ───────────────────────────

const ORCH_BASE = (import.meta.env?.VITE_ORCHESTRATOR_URL as string | undefined) ?? '/api/orchestrator';

interface BackendApproval {
  approval_id: string;
  action?: string;
  required_level?: string;
  status?: string;
  context?: Record<string, string | number | boolean>;
}

function approvalToDecision(a: BackendApproval): Decision {
  const action = a.action ?? a.approval_id.replace(/^approval_/, '').split('_-')[0];
  const level = a.required_level ?? 'admin';
  return {
    id: a.approval_id,
    title: `Approve: ${String(action).replace(/_/g, ' ')}`,
    situation: `Orchestrator requests ${level.toUpperCase()}-level approval for "${action}"${a.context?.requested_by ? ` (requested by ${a.context.requested_by})` : ''}.`,
    source: 'Oracle Pit Wall',
    audience: ['race-engineer', 'team-principal'],
    options: [
      { label: 'Approve', gain: 'workflow proceeds', risk: level === 'admin' ? 'admin-level action executes' : 'user-level action executes' },
      { label: 'Reject', gain: 'no side effects', risk: 'workflow blocked until re-requested' },
    ],
    recommended: level === 'admin' ? 1 : 0,
    confidence: 0.7,
    rationale: level === 'admin'
      ? 'Admin-level actions default to reject unless the engineer confirms the context.'
      : 'User-level action with no elevated risk flags — safe to approve.',
    window: 'awaiting pit-wall', status: 'pending',
  };
}

/** Pull pending approvals from the orchestrator (through the BFF) into the
 *  queue. Silent no-op when the backend is unreachable. */
export async function syncDecisionsFromBackend(): Promise<void> {
  try {
    const res = await fetch(`${ORCH_BASE}/api/v1/approvals`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return;
    const body = await res.json() as { approvals?: BackendApproval[] };
    for (const a of body.approvals ?? []) {
      if (!a.approval_id || decisions.some(d => d.id === a.approval_id)) continue;
      decisions = [approvalToDecision(a), ...decisions];
    }
    emit();
  } catch { /* offline / BFF not configured */ }
}

/** Write the verdict back to the orchestrator for backend-fed approvals. */
async function pushApprovalDecision(d: Decision, optionIdx: number): Promise<void> {
  try {
    await fetch(`${ORCH_BASE}/api/v1/approvals/${encodeURIComponent(d.id)}/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approved: d.options[optionIdx].label === 'Approve', decided_by: 'pit-wall-ui' }),
      signal: AbortSignal.timeout(8000),
    });
  } catch { /* non-blocking */ }
}

export function defer(id: string): void {
  decisions = decisions.map(d => d.id === id ? { ...d, status: 'deferred' } : d);
  emit();
}

export function reopen(id: string): void {
  decisions = decisions.map(d => d.id === id ? { ...d, status: 'pending' } : d);
  emit();
}

/** Test helper — reset to the seeded state. */
export function _resetDecisions(): void {
  decisions = SEED.map(d => ({ ...d }));
  emit();
}

// ── Policy gate (24-security-governance-compliance) ───────────────────────────
// Each decision is run through the real security policy engine before it can be
// approved: is the action allowed, what's the risk level, does it need
// escalation? Live-with-fallback — if the gate is unreachable / not configured
// the Decision Center still works (state 'offline'), it just can't show the
// verdict. The engine is an INTERNAL service: the credential + principal are
// injected by a same-origin proxy server-side, never in the browser.

export type PolicyState = 'allowed' | 'blocked' | 'approval' | 'offline';
export interface PolicyVerdict {
  state: PolicyState;
  riskLevel?: string;
  mitigations?: string[];
  violated?: string[];
}

export interface PolicyEvaluationLike {
  allowed: boolean;
  risk_level?: string;
  required_mitigations?: string[];
  violated_policies?: string[];
}
export type PolicyOutcomeLike =
  | { ok: true; data: PolicyEvaluationLike }
  | { ok: false; reason: 'not-configured' | 'unreachable' };

/** Map a decision to the canonical action the security engine evaluates
 *  (24-security vocabulary), so verdicts reflect the real approval matrix. */
export function decisionAction(d: Decision): string {
  if (d.title.toLowerCase().startsWith('approve:')) return 'workflow.approve';
  if (d.source === 'Tyre Intelligence') return 'race.apply_tire_strategy';      // race_engineer can approve
  if (d.source === 'Safety Guardian') return 'race.apply_engine_map_change';    // high-risk → escalate
  return 'race.apply_setup_change';                                             // high-risk → escalate to crew_chief
}

export async function gateDecision(
  d: Decision,
  deps: { evaluatePolicy: (action: string, context?: Record<string, unknown>) => Promise<PolicyOutcomeLike> },
): Promise<PolicyVerdict> {
  try {
    const out = await deps.evaluatePolicy(decisionAction(d), { decision_id: d.id, source: d.source });
    if (!out.ok) return { state: 'offline' };
    const r = out.data;
    const needsApproval = (r.required_mitigations ?? []).some(m => m === 'require_approval' || m.startsWith('escalate_to:'));
    const state: PolicyState = !r.allowed ? 'blocked' : needsApproval ? 'approval' : 'allowed';
    return { state, riskLevel: r.risk_level, mitigations: r.required_mitigations, violated: r.violated_policies };
  } catch {
    return { state: 'offline' };
  }
}
