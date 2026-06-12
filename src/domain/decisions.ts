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
  decisions = decisions.map(d => d.id === id
    ? { ...d, status: 'decided', decidedOption: optionIdx, decidedAt: new Date().toISOString(), decidedLap: lap }
    : d);
  emit();
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
