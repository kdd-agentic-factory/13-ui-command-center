/**
 * palette.ts — shared semantic colour scale.
 *
 * A canonical low/medium/high → green/yellow/accent scale used across modules
 * (race-strategy risk, rival threat, aero overtake difficulty …). One source so
 * the severity language stays identical everywhere.
 */
export type Severity = 'low' | 'medium' | 'high';

const SEVERITY_COLOR: Record<Severity, string> = {
  low: 'var(--green)', medium: 'var(--yellow)', high: 'var(--accent)',
};

export function severityColor(s: Severity): string { return SEVERITY_COLOR[s]; }

/**
 * Canonical good/warn/bad grade scale — green/yellow/accent. Modules whose
 * status is a three-step health (compliance, fuel margin, scrutineering …) map
 * their domain status to a Grade and call this, so the colours stay identical.
 */
export type Grade = 'good' | 'warn' | 'bad';

const GRADE_COLOR: Record<Grade, string> = {
  good: 'var(--green)', warn: 'var(--yellow)', bad: 'var(--accent)',
};

export function gradeColor(g: Grade): string { return GRADE_COLOR[g]; }
