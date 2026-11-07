import type { ComparisonRun } from './chassisComparison';
import type { EngineeringReport } from './engineeringSession';
export interface ChassisReportDocument {schema_version:'1.0.0';classification:'restricted';comparison:ComparisonRun;session:{id:string;source:'aim'|'2d';reader:string;reader_version:string;sha256:string;validation:Record<string,unknown>|null};limitations:string[]}
export function serializeChassisReport(document:ChassisReportDocument){return JSON.stringify(document,null,2);}
/** Preserve saved historical JSON fields; never inject live authority or defaults. */
export function serializeEngineeringReport(document:EngineeringReport){return JSON.stringify(document,null,2);}


const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/;
const code = /^[a-z][a-z0-9_]{0,63}$/;
const seconds = /^\d+(?:\.\d+)?$/;
const object = (value: unknown): Record<string, unknown> | undefined =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;

export function reportSuspensionEvidence(snapshot: EngineeringReport['snapshot']) {
  const entries = object(snapshot?.evidence)?.suspension_evidence;
  if (!Array.isArray(entries)) return [];
  const seen = new Set<string>();
  return entries.slice(0, 20).flatMap(value => {
    const entry = object(value);
    const ref = object(entry?.analysis_reference);
    const scope = object(entry?.selected_signal_scope);
    const id = entry?.evidence_id;
    const metric = entry?.metric;
    const eligibility = entry?.eligibility;
    const revision = ref?.revision;
    if (typeof id !== 'string' || !uuid.test(id) || seen.has(id) ||
        typeof metric !== 'string' || !code.test(metric) ||
        (eligibility !== 'eligible_for_review' && eligibility !== 'exploratory' && eligibility !== 'blocked') ||
        typeof revision !== 'number' || !Number.isSafeInteger(revision) || revision < 1) return [];
    seen.add(id);
    const bounds = scope?.interval_s;
    const interval = Array.isArray(bounds) && bounds.length === 2 &&
      bounds.every(bound => typeof bound === 'string' && bound.length <= 64 &&
        seconds.test(bound) && Number.isFinite(Number(bound))) &&
      Number(bounds[1]) > Number(bounds[0]) ? [String(bounds[0]), String(bounds[1])] : null;
    const sensor = scope?.selected_sensor_id;
    const source = scope?.source_id;
    return [{id, metric, eligibility, revision, interval,
      source: typeof source === 'string' && uuid.test(source) ? source : null,
      sensor: typeof sensor === 'string' && code.test(sensor) ? sensor : null} as const];
  });
}
