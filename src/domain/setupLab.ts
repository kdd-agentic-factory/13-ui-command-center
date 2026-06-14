/**
 * setupLab.ts — version control for the bike setup (a "git of the setup").
 *
 * Every change creates a SetupVersion with its parent, the params that moved,
 * the reason, the measured result and a status (validated / pending / reverted).
 * The lab can diff any two versions and revert to a previous one — so an
 * engineer can answer "what did we change, why, and did it work?".
 */

export interface SetupParams {
  frontComp: number;   // clicks
  frontReb: number;    // clicks
  rearComp: number;    // clicks
  rearReb: number;     // clicks
  tc: number;          // 1-10
  engineBrake: string; // EB1..EB4
  powerMap: string;    // MAP-n
  rearPreload: number; // turns
}

export type VersionStatus = 'validated' | 'pending' | 'reverted' | 'baseline';

export interface SetupVersion {
  id: string;
  label: string;
  parentId: string | null;
  params: SetupParams;
  reason: string;
  result: string;       // measured outcome ('—' until run)
  status: VersionStatus;
  source: 'baseline' | 'engineer' | 'oracle';
  createdAt: string;
}

export interface ParamDiff {
  key: keyof SetupParams;
  label: string;
  from: string | number;
  to: string | number;
}

// Fields an engineer should NOT touch for this baseline (spec "DO NOT CHANGE").
export const DO_NOT_CHANGE: Array<{ label: string; why: string }> = [
  { label: 'Front preload', why: 'Front geometry is dialled — moving it disturbs the validated braking platform.' },
  { label: 'Rear ride height', why: 'Sets the anti-squat balance the rear-grip model is calibrated against.' },
  { label: 'Power map', why: 'MAP-6 matches the tyre thermal window; changing it re-opens the cliff prediction.' },
];

const PARAM_LABELS: Record<keyof SetupParams, string> = {
  frontComp: 'Front compression', frontReb: 'Front rebound',
  rearComp: 'Rear compression', rearReb: 'Rear rebound',
  tc: 'Traction control', engineBrake: 'Engine brake',
  powerMap: 'Power map', rearPreload: 'Rear preload',
};

const BASE: SetupParams = {
  frontComp: 8, frontReb: 11, rearComp: 9, rearReb: 7,
  tc: 4, engineBrake: 'EB4', powerMap: 'MAP-6', rearPreload: 1.0,
};

// ── Version store (seeded with a real stint progression) ─────────────────────

let versions: SetupVersion[] = [
  {
    id: 'v0', label: 'Mugello R1 · Baseline', parentId: null, params: { ...BASE },
    reason: 'Most stable configuration recorded at this circuit.',
    result: 'Best 1:58.4 · stable braking into T1', status: 'baseline', source: 'baseline',
    createdAt: '2026-06-07T09:00:00Z',
  },
  {
    id: 'v1', label: 'Stint 01 · softer rear', parentId: 'v0',
    params: { ...BASE, rearReb: 9 },
    reason: 'Rear too harsh over Correntaio kerb.',
    result: 'Calmer rear, but lazy direction change T13-T14', status: 'reverted', source: 'engineer',
    createdAt: '2026-06-07T10:20:00Z',
  },
  {
    id: 'v2', label: 'Stint 02 · TC + rebound', parentId: 'v0',
    params: { ...BASE, rearReb: 9, tc: 5 },
    reason: 'Rear slip on Bucine exit above 40% throttle.',
    result: 'Rear slip 14%→11%, exit +3 km/h', status: 'validated', source: 'engineer',
    createdAt: '2026-06-07T11:05:00Z',
  },
  {
    id: 'v3', label: 'Oracle recommendation', parentId: 'v2',
    params: { ...BASE, rearReb: 9, tc: 5, engineBrake: 'EB3' },
    reason: 'Oracle: add engine-brake release to settle entry without losing the v2 gains.',
    result: '—', status: 'pending', source: 'oracle',
    createdAt: '2026-06-07T11:40:00Z',
  },
];

export function getVersions(): SetupVersion[] { return versions; }
export function getVersion(id: string): SetupVersion | undefined { return versions.find(v => v.id === id); }

/** Diff two versions field by field. */
export function diffVersions(fromId: string, toId: string): ParamDiff[] {
  const a = getVersion(fromId), b = getVersion(toId);
  if (!a || !b) return [];
  return (Object.keys(PARAM_LABELS) as Array<keyof SetupParams>)
    .filter(k => a.params[k] !== b.params[k])
    .map(k => ({ key: k, label: PARAM_LABELS[k], from: a.params[k], to: b.params[k] }));
}

/** Apply a version as the new head (engineer change). */
export function commitVersion(parentId: string, label: string, params: SetupParams, reason: string): SetupVersion {
  const v: SetupVersion = {
    id: `v${versions.length}`, label, parentId, params: { ...params },
    reason, result: '—', status: 'pending', source: 'engineer',
    createdAt: new Date().toISOString(),
  };
  versions = [...versions, v];
  return v;
}

export function validateVersion(id: string, result: string): void {
  versions = versions.map(v => v.id === id ? { ...v, status: 'validated', result } : v);
}

/** Revert: mark a version reverted and re-commit its parent's params as head. */
export function revertVersion(id: string): SetupVersion | null {
  const v = getVersion(id);
  const parent = v?.parentId ? getVersion(v.parentId) : null;
  if (!v || !parent) return null;
  versions = versions.map(x => x.id === id ? { ...x, status: 'reverted' } : x);
  return commitVersion(parent.id, `Revert to ${parent.label}`, parent.params, `Reverted ${v.label}: ${v.result}`);
}

export function _resetSetupLab(): void {
  versions = versions.slice(0, 4).map(v => ({ ...v }));
}

export const STATUS_META: Record<VersionStatus, { color: string; label: string }> = {
  baseline:  { color: 'var(--text-muted)', label: 'BASELINE' },
  validated: { color: 'var(--green)',       label: 'VALIDATED' },
  pending:   { color: 'var(--yellow)',      label: 'PENDING' },
  reverted:  { color: 'var(--accent)',      label: 'REVERTED' },
};
