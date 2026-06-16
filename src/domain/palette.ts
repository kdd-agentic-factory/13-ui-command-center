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
