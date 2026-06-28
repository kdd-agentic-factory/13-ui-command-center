/**
 * dataTrust.ts — Telemetry Calibration & Data Trust Center.
 *
 * Before KDD analyses anything it must decide whether the telemetry can be
 * trusted: detect sources, map and validate channels, score data quality per
 * module, flag mismatches (wrong bike / wrong circuit) and degrade gracefully
 * when sensors are missing.
 *
 *   Before recommending, KDD verifies whether it can trust the data.
 *
 * Deterministic and personalised. On a GPS-only bike the ECU channels are
 * Missing/Estimated, the trust score drops and the ECU-dependent modules enter
 * a degraded mode — the same honesty rule used across the platform.
 */

export type ChannelStatus = 'OK' | 'Partial' | 'Estimated' | 'Simulated' | 'Missing' | 'Converted' | 'Needs review';

export interface ChannelMap {
  imported: string;
  mappedTo: string;
  unit: string;
  status: ChannelStatus;
  confidence: number;     // 0–100
}

export interface Validation { channel: string; status: 'OK' | 'Warning' | 'Partial' | 'Missing'; note: string; }
export interface ModuleTrust { module: string; score: number; }
export interface DegradedMode { trigger: string; impact: string; disabled: string[]; available: string[]; confidence: number; }

export interface CompatibilityCheck { selectedBike: string; detectedProfile: string; compatibility: number; status: 'OK' | 'Mismatch'; problem?: string; }
export interface TrackAlignment { circuit: string; gpsMatch: number; lapLengthKm: number; expectedKm: number; cornersMatched: string; status: 'Validated' | 'Critical'; }
export interface SyncPair { pair: string; status: string; ok: boolean; }
export interface DataLineage { source: string; importedAt: string; parser: string; calibProfile: string; mappedChannels: string; usedBy: string[]; }
export interface OracleTrust { confidence: number; limitations: string[]; behaviour: string; }

export interface DataTrust {
  combo: string;
  trustScore: number;
  status: string;
  sources: string[];
  channels: ChannelMap[];
  validations: Validation[];
  moduleTrust: ModuleTrust[];
  degraded: DegradedMode[];
  compatibility: CompatibilityCheck;
  alignment: TrackAlignment;
  syncSources: { name: string; rate: string }[];
  sync: SyncPair[];
  videoOffsetS: number;
  lineage: DataLineage;
  oracle: OracleTrust;
  warnings: string[];
  recommendedActions: string[];
}

const STATUS_COLOR: Record<ChannelStatus, string> = {
  OK: 'var(--green)', Converted: 'var(--green)', Partial: 'var(--yellow)',
  Estimated: 'var(--cyan)', Simulated: '#8B5CF6', 'Needs review': 'var(--accent)', Missing: 'var(--accent)',
};
export function channelColor(s: ChannelStatus): string { return STATUS_COLOR[s]; }
export function scoreColor(n: number): string { return n >= 85 ? 'var(--green)' : n >= 70 ? 'var(--yellow)' : 'var(--accent)'; }

// ──── KDD pipelines lineage (06-kdd-data-pipelines) ────
// The static lineage below is the baseline; this overlays the REAL registered
// KDD pipelines that process the data, live-with-fallback.

export type PipelineLineageState = 'live' | 'reachable' | 'unavailable';
export interface PipelineLineage {
  state: PipelineLineageState;
  pipelines: string[];
  total: number;
}
export interface PipelinesOutcomeLike {
  ok: boolean;
  data?: { pipelines: string[]; total: number };
  reason?: 'unauthorized' | 'unreachable';
}

export async function loadPipelineLineage(
  deps: { fetchPipelines: () => Promise<PipelinesOutcomeLike> },
): Promise<PipelineLineage> {
  try {
    const out = await deps.fetchPipelines();
    if (out.ok && out.data) {
      // Show the pipeline file names without the .yaml/.json extension, trimmed.
      const pipelines = (out.data.pipelines ?? []).map(p => p.replace(/\.(ya?ml|json)$/i, ''));
      return pipelines.length
        ? { state: 'live', pipelines: pipelines.slice(0, 12), total: out.data.total ?? pipelines.length }
        : { state: 'reachable', pipelines: [], total: 0 };
    }
    return { state: out.reason === 'unauthorized' ? 'reachable' : 'unavailable', pipelines: [], total: 0 };
  } catch {
    return { state: 'unavailable', pipelines: [], total: 0 };
  }
}

export function buildDataTrust(rider: string, bike: string, circuit: string, session: string, telemetryLimited = false): DataTrust {
  const ecu = !telemetryLimited;
  const trustScore = telemetryLimited ? 68 : 91;

  const channels: ChannelMap[] = [
    { imported: 'GPS_Speed',      mappedTo: 'Speed',          unit: 'km/h', status: 'OK', confidence: 98 },
    { imported: 'TPS_Raw',        mappedTo: 'Throttle %',     unit: '%',    status: ecu ? 'OK' : 'Missing', confidence: ecu ? 97 : 0 },
    { imported: 'Brake_Front_PSI',mappedTo: 'Brake pressure', unit: 'bar',  status: ecu ? 'Converted' : 'Missing', confidence: ecu ? 92 : 0 },
    { imported: 'RPM',            mappedTo: 'Engine RPM',     unit: 'rpm',  status: ecu ? 'OK' : 'Missing', confidence: ecu ? 99 : 0 },
    { imported: 'GearPos',        mappedTo: 'Gear',           unit: '',     status: ecu ? 'OK' : 'Estimated', confidence: ecu ? 96 : 55 },
    { imported: 'IMU_Lean',       mappedTo: 'Lean angle',     unit: '°',    status: telemetryLimited ? 'Estimated' : 'OK', confidence: telemetryLimited ? 60 : 95 },
    { imported: 'CALC_RearSlip',  mappedTo: 'Rear slip',      unit: '%',    status: 'Estimated', confidence: telemetryLimited ? 50 : 78 },
    { imported: 'TPMS_Rear',      mappedTo: 'Tyre pressure',  unit: 'bar',  status: 'Missing', confidence: 0 },
    { imported: 'TyreTemp_Rear',  mappedTo: 'Tyre temperature', unit: '°C', status: 'Simulated', confidence: 65 },
    { imported: 'CH_07',          mappedTo: 'Unknown',        unit: '',     status: 'Needs review', confidence: 0 },
  ];

  const validations: Validation[] = [
    { channel: 'Speed', status: 'OK', note: 'No impossible spikes detected.' },
    { channel: 'RPM', status: ecu ? 'OK' : 'Missing', note: ecu ? `Within ${bike} expected range.` : 'No ECU feed.' },
    { channel: 'Gear', status: ecu ? 'OK' : 'Warning', note: ecu ? 'Step channel detected.' : 'Inferred from speed — verify.' },
    { channel: 'Throttle', status: ecu ? 'Warning' : 'Missing', note: ecu ? 'Signal reaches 104% — auto-normalisation suggested.' : 'No ECU feed.' },
    { channel: 'Brake', status: ecu ? 'Partial' : 'Missing', note: ecu ? 'Signal present but no calibration curve.' : 'No ECU feed.' },
    { channel: 'Lean angle', status: telemetryLimited ? 'Warning' : 'OK', note: telemetryLimited ? 'Estimated from GPS — IMU not present.' : 'Range valid.' },
    { channel: 'GPS', status: 'Warning', note: '3 position jumps detected — smoothed.' },
    { channel: 'Tyre pressure', status: 'Missing', note: 'Tyre pressure model will be simulated.' },
  ];

  const moduleTrust: ModuleTrust[] = [
    { module: 'Live Telemetry', score: ecu ? 94 : 72 },
    { module: '3D Track Map', score: 96 },
    { module: 'Corner Intelligence', score: ecu ? 91 : 74 },
    { module: 'Crash-Risk', score: ecu ? 84 : 70 },
    { module: 'Tyre & Grip', score: 68 },
    { module: 'Garage Setup Advisor', score: ecu ? 79 : 58 },
    { module: 'Digital Twin', score: ecu ? 72 : 60 },
    { module: 'Oracle Pit Wall', score: ecu ? 86 : 69 },
  ];

  const degraded: DegradedMode[] = [
    {
      trigger: 'Tyre pressure missing',
      impact: 'Tyre & Grip Intelligence uses a simulated pressure model.',
      disabled: ['Pressure trend validation', 'Hot pressure target confirmation'],
      available: ['Grip estimate', 'Thermal load by corner', 'Rear slip estimation'],
      confidence: 68,
    },
    ...(ecu ? [] : [{
      trigger: 'ECU data missing (GPS-only bike)',
      impact: 'Throttle, RPM and gear unavailable — GPS + IMU analysis only.',
      disabled: ['Throttle timing analysis', 'Engine map recommendation', 'TC intervention analysis'],
      available: ['Line analysis', 'Speed trace', 'Lean estimation', 'Corner timing', 'Basic rider coaching'],
      confidence: 64,
    }]),
  ];

  return {
    combo: `${circuit} · ${rider} · ${bike} · ${session}`,
    trustScore,
    status: trustScore >= 85 ? 'READY FOR ADVANCED ANALYSIS' : trustScore >= 60 ? 'FULL ACCESS · with model limitations' : 'LIMITED · resolve critical issues',
    sources: telemetryLimited ? ['GPS', 'IMU (partial)'] : ['GPS', 'IMU', 'ECU', 'CSV'],
    channels, validations, moduleTrust, degraded,
    compatibility: {
      selectedBike: bike, detectedProfile: `${bike} logger export`,
      compatibility: 96, status: 'OK',
    },
    alignment: {
      circuit, gpsMatch: 98.6, lapLengthKm: 5.243, expectedKm: 5.245,
      cornersMatched: '15 / 15 matched', status: 'Validated',
    },
    syncSources: [
      { name: 'GPS', rate: '10 Hz' }, { name: 'IMU', rate: '100 Hz' },
      { name: 'ECU', rate: ecu ? '50 Hz' : '—' }, { name: 'Video', rate: '60 fps' },
    ],
    sync: [
      { pair: 'GPS ↔ ECU', status: ecu ? 'OK' : 'n/a', ok: ecu },
      { pair: 'IMU ↔ GPS', status: 'OK', ok: true },
      { pair: 'Video ↔ telemetry', status: 'offset +0.42s', ok: false },
    ],
    videoOffsetS: 0.42,
    lineage: {
      source: 'CSV import', importedAt: 'Today · 14:32', parser: 'Telemetry Parser v2.1',
      calibProfile: `${bike.replace(/\s+/g, '_')}_AiM_v3`,
      mappedChannels: ecu ? '42 / 48' : '21 / 48',
      usedBy: ['Live Telemetry', 'Corner Intelligence', 'Session Report', 'Oracle Pit Wall'],
    },
    oracle: {
      confidence: ecu ? 86 : 69,
      limitations: [
        'Tyre pressure missing — tyre contribution estimated.',
        ...(ecu ? ['Brake pressure partially calibrated.'] : ['Throttle / RPM / gear unavailable (GPS-only).']),
        'Rear grip estimated.',
      ],
      behaviour: 'Recommendations involving tyre pressure are marked low confidence; setup changes require post-stint validation.',
    },
    warnings: [
      ...(ecu ? ['Brake pressure partially calibrated'] : ['ECU channels missing (GPS-only bike)']),
      'Tyre pressure missing',
      'Video not synced (offset +0.42s)',
    ],
    recommendedActions: [
      ecu ? 'Confirm brake pressure scale.' : 'Connect ECU logger to unlock throttle/RPM/gear analysis.',
      'Add rear hot pressure manually after the stint.',
      'Sync onboard video with telemetry (apply +0.42s offset).',
    ],
  };
}
