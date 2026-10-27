import { telemetryFetch } from './telemetryIdentity';
import type { ChassisReportDocument } from '../domain/chassisReport';
import type { SetupInput, SetupRevision, ComparisonRun, Calibration } from '../domain/chassisComparison';
export type { SetupInput, SetupRevision, ComparisonRun } from '../domain/chassisComparison';
export interface ChassisState { bike_id: string | null; setups: SetupRevision[]; comparison: (ComparisonRun & { source_sha256?: string; version?: number }) | null; bindings: { id?: string; session_id?: string; setup_id: string; bike_id?: string; version?: number }[] }
const base = `${import.meta.env.VITE_TELEMETRY_URL ?? '/api/telemetry'}/api/v1/chassis`;
async function request<T>(path: string, body?: unknown): Promise<T> {
  const response = await telemetryFetch(`${base}${path}`, { method: body === undefined ? 'GET' : 'POST', headers: {
    'Content-Type': 'application/json', 'X-Actor-ID': 'local-operator', 'X-Workflow-ID': 'chassis-comparison', 'X-Trace-ID': crypto.randomUUID(),
  }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(30000) });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(typeof data?.detail === 'string' ? data.detail : `Error del servicio de chasis (${response.status})`);
  }
  return response.json() as Promise<T>;
}
export const getChassisState = (sessionId: string) => request<ChassisState>(`/sessions/${encodeURIComponent(sessionId)}/state`);
export const getChassisReport = (id:string) => request<ChassisReportDocument>(`/comparisons/${encodeURIComponent(id)}/report`);
export const createSetup = (input: SetupInput) => request<SetupRevision>('/setups', input);
export const bindSetup = (input: { session_id: string; setup_id: string; bike_id: string }) => request<unknown>('/bindings', input);
export const compareSetups = (input: { session_id: string; setup_a_id: string; setup_b_id: string; interval_s?: [number, number]; calibration?: Calibration }) => request<ComparisonRun>('/comparisons', input);
