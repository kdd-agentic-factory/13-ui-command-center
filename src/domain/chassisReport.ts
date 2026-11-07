import type { ComparisonRun } from './chassisComparison';
import type { EngineeringReport } from './engineeringSession';
export interface ChassisReportDocument {schema_version:'1.0.0';classification:'restricted';comparison:ComparisonRun;session:{id:string;source:'aim'|'2d';reader:string;reader_version:string;sha256:string;validation:Record<string,unknown>|null};limitations:string[]}
export function serializeChassisReport(document:ChassisReportDocument){return JSON.stringify(document,null,2);}
/** Preserve saved historical JSON fields; never inject live authority or defaults. */
export function serializeEngineeringReport(document:EngineeringReport){return JSON.stringify(document,null,2);}


const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/;
const code = /^[a-z][a-z0-9_]{0,63}$/;
const sha256 = /^[0-9a-f]{64}$/;
const seconds = /^\d+(?:\.\d+)?$/;
const object = (value: unknown): Record<string, unknown> | undefined =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;

export function suspensionEvidence(entries: unknown, kind: 'report' | 'guide') {
  if (!Array.isArray(entries)) return [];
  const seen = new Set<string>();
  return entries.slice(0, kind === 'guide' ? 4 : 20).flatMap(value => {
    const entry = object(value);
    if (!entry) return [];
    const ref = object(entry.analysis_reference);
    const scope = object(entry.selected_signal_scope);
    const id = entry.evidence_id;
    const metric = entry.metric;
    const eligibility = entry.eligibility;
    const revision = ref?.revision;
    const analysis = typeof ref?.id === 'string' && uuid.test(ref.id) ? ref.id : null;
    const digest = typeof ref?.digest === 'string' && sha256.test(ref.digest) ? ref.digest : null;
    if (typeof id !== 'string' || seen.has(id) ||
        typeof metric !== 'string' || !code.test(metric) ||
        (kind === 'report'
          ? !uuid.test(id) || (eligibility !== 'eligible_for_review' && eligibility !== 'exploratory' && eligibility !== 'blocked')
          : !analysis || !digest || id !== `suspension:${analysis}@${revision}:${digest}:${metric}`) ||
        typeof revision !== 'number' || !Number.isSafeInteger(revision) || revision < 1) return [];
    seen.add(id);
    const bounds = scope?.interval_s;
    const interval = Array.isArray(bounds) && bounds.length === 2 &&
      bounds.every(bound => typeof bound === 'string' && bound.length <= 64 &&
        seconds.test(bound) && Number.isFinite(Number(bound))) &&
      Number(bounds[1]) > Number(bounds[0]) ? [String(bounds[0]), String(bounds[1])] : null;
    const sensor = scope?.selected_sensor_id;
    const source = scope?.source_id;
    const measures = Array.isArray(entry.measurements) ? entry.measurements.slice(0, 3).flatMap(raw => {
      const value = object(raw);
      return (value?.name === 'min' || value?.name === 'max' || value?.name === 'value') &&
        typeof value.value_si === 'string' && value.value_si.length <= 128 && /^-?\d+(?:\.\d+)?$/.test(value.value_si)
        ? [{name: value.name, value: value.value_si} as const] : [];
    }) : [];
    return [{id, metric, revision, interval, analysis, digest, measures,
      eligibility: kind === 'guide' ? 'eligible_for_review' :
        eligibility === 'eligible_for_review' || eligibility === 'exploratory' || eligibility === 'blocked' ? eligibility : null,
      source: typeof source === 'string' && uuid.test(source) ? source : null,
      sensor: typeof sensor === 'string' && code.test(sensor) ? sensor : null,
      method: typeof entry.method === 'string' && code.test(entry.method) ? entry.method : null,
      unit: typeof entry.unit === 'string' && ['m', 'm/s', 'Hz', 'N', 'J'].includes(entry.unit) ? entry.unit : null,
      samples: typeof entry.sample_count === 'number' && Number.isSafeInteger(entry.sample_count) && entry.sample_count > 0
        ? entry.sample_count : null,
      qualifications: Array.isArray(entry.qualifications) ? entry.qualifications.slice(0, 20)
        .filter((value): value is string => typeof value === 'string' && code.test(value)) : [],
    } as const];
  });
}

export type SuspensionEvidence = ReturnType<typeof suspensionEvidence>[number];

export function reportSuspensionEvidence(snapshot: EngineeringReport['snapshot']) {
  return suspensionEvidence(object(snapshot?.evidence)?.suspension_evidence, 'report');
}
