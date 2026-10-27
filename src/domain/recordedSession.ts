import { telemetryScope } from '../services/telemetryIdentity';
import { getSessionContext, setSessionContext } from './sessionContext';
export interface RecordedChannel {
  index: number; name: string; sensor_id: string | null; unit: string; kind?: string;
  sample_count: number; start_s: number; end_s: number; min: number; max: number; mean: number;
}
export interface RecordedSession {
  id: string; source: 'aim' | '2d'; filename: string; classification: 'restricted';
  reader: string; reader_version: string; sha256: string; geometry_version?: string | null;
  channels: RecordedChannel[]; laps: { index: number; start_s: number; duration_s: number }[]; warnings: string[];
  geometry?: { radius: number; rake: number; offset: number; provenance: string };
  validation?:{status:string;vendor_crosschecked:boolean;clock?:string;limitations?:string[]};excluded_channels?:{name:string;reason:string}[];measurement_path?:string;
}
export interface RecordedSignal { name: string; unit: string; times: number[]; values: number[]; preview: boolean; original_count: number }
export function calculateTrail(radiusMm: number, rakeDeg: number, offsetMm: number): number {
  if (![radiusMm, rakeDeg, offsetMm].every(Number.isFinite) || radiusMm <= 0 || rakeDeg <= 0 || rakeDeg >= 60 || offsetMm < 0 || offsetMm >= radiusMm)
    throw new Error('Introduce dimensiones medidas válidas');
  const angle = rakeDeg * Math.PI / 180;
  return (radiusMm * Math.sin(angle) - offsetMm) / Math.cos(angle);
}
export function channelStats(values: number[]) {
  if (!values.length || !values.every(Number.isFinite)) throw new Error('Sin muestras válidas');
  return { min: Math.min(...values), max: Math.max(...values), mean: values.reduce((a, b) => a + b, 0) / values.length };
}
const key = () => telemetryScope()==='local'?'kdd-recorded-session-id':`kdd-recorded-session-id:${telemetryScope()}`;
export function activeRecording(): string | null { return localStorage.getItem(key()); }
export function clearRecording() {
  localStorage.removeItem(key());
  const ctx = getSessionContext();
  setSessionContext({ ...ctx, demoMode: false, badge: 'SIN DATOS', setup: { ...ctx.setup, dataSource: 'none', dashboardTab: 'chassis' } });
  window.dispatchEvent(new Event('recorded-session-changed'));
}
export function selectRecording(session: RecordedSession) {
  localStorage.setItem(key(), session.id);
  const ctx = getSessionContext();
  setSessionContext({ ...ctx, demoMode: false, dataMode: 'recorded', sessionMode: 'replay', badge: 'RECORDED', setup: { ...ctx.setup, dashboardTab: 'chassis', dataSource: session.source } });
  window.dispatchEvent(new Event('recorded-session-changed'));
}
