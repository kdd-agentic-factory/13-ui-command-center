/**
 * edgeHub.ts — KDD Trackside Edge Hub.
 *
 * The local pit-box node: captures, validates, processes and syncs telemetry in
 * real time — offline-first, low-latency, multi-device. Bridges the bike on
 * track to the full KDD intelligence stack.
 *
 *   KDD doesn't start when you upload the data. KDD starts in the garage.
 *
 * Deterministic operational status model. HONESTY: this is a representative edge
 * state — no physical hardware is attached here; it shows how the trackside hub
 * would report device health, packet loss, offline capability and cloud sync.
 */

export type DeviceStatus = 'OK' | 'Sync pending' | 'Warning';
export interface DeviceHealth { name: string; status: DeviceStatus; detail: string }
export interface PacketHealth { source: string; rate: string; packetLoss: number; status: 'OK' | 'Warning' }
export interface TrustChannel { channel: string; status: 'OK' | 'Partial' }
export interface GarageReadyItem { item: string; status: 'READY' | 'pending'; detail?: string }
export interface VideoSync { camera: string; status: string; offsetS: number; markers: number; ready: boolean }
export interface SyncJob { items: string[]; progress: number; conflicts: string }
export interface SimLiveRow { metric: string; expected: string; observed: string; ok: boolean }
export interface SessionBuffer { sizeGB: number; stored: string[]; retentionDays: number; syncStatus: string }

export interface EdgeHub {
  combo: string;
  hubStatus: string;
  internet: string;
  dataTrust: number;
  cloudSyncProgress: number;
  devices: DeviceHealth[];
  packets: PacketHealth[];
  processing: string[];
  offlineAvailable: string[];
  pendingCloud: string[];
  trustChannels: TrustChannel[];
  trustCompatibility: number;
  liveFeed: { now: string; lastLap: string; trend: string; recommendation: string };
  videoSync: VideoSync;
  garageReady: GarageReadyItem[];
  readyStatus: 'GREEN' | 'NOT READY';
  sync: SyncJob;
  edgeAI: string[];
  cloudAI: string[];
  security: { field: string; status: string }[];
  simLive: { rows: SimLiveRow[]; status: string; recommendation: string };
  buffer: SessionBuffer;
  missionName: string;
  nextAction: string;
}

export function deviceColor(s: DeviceStatus): string { return s === 'OK' ? 'var(--green)' : s === 'Warning' ? 'var(--accent)' : 'var(--yellow)'; }

export function buildEdgeHub(rider: string, bike: string, circuit: string, session: string, telemetryLimited = false): EdgeHub {
  const ecu = !telemetryLimited;
  return {
    combo: `${circuit} · ${rider} · ${bike} · ${session}`,
    hubStatus: 'ONLINE LOCAL',
    internet: 'Weak · cloud sync pending',
    dataTrust: ecu ? 91 : 72,
    cloudSyncProgress: 38,
    devices: [
      { name: 'Bike logger', status: 'OK', detail: 'streaming' },
      { name: 'GPS', status: 'OK', detail: '10 Hz · locked' },
      { name: 'IMU', status: 'OK', detail: '100 Hz · calibrated' },
      { name: 'ECU', status: ecu ? 'OK' : 'Warning', detail: ecu ? '50 Hz' : 'not present (GPS-only bike)' },
      { name: 'Onboard camera', status: 'Sync pending', detail: 'offset +0.42s' },
      { name: 'Heart-rate sensor', status: 'OK', detail: '1 Hz · stable' },
      { name: 'Weather station', status: 'OK', detail: '0.2 Hz · stable' },
    ],
    packets: [
      { source: 'GPS', rate: '10 Hz', packetLoss: 0.4, status: 'OK' },
      { source: 'IMU', rate: '100 Hz', packetLoss: 1.2, status: 'OK' },
      { source: 'ECU', rate: ecu ? '50 Hz' : '—', packetLoss: ecu ? 0.8 : 0, status: ecu ? 'OK' : 'Warning' },
      { source: 'Video', rate: '60 fps', packetLoss: 0, status: 'Warning' },
      { source: 'Heart rate', rate: '1 Hz', packetLoss: 0, status: 'OK' },
      { source: 'Weather', rate: '0.2 Hz', packetLoss: 0, status: 'OK' },
    ],
    processing: ['Telemetry parser', 'Channel mapping', 'Timestamp align', 'Lap detection', 'Corner detection', 'Event detection', 'Risk scoring', 'Video markers', 'Local cache'],
    offlineAvailable: ['Live telemetry', 'Event detection', 'Crash-risk alerts', 'Session planner', 'Data trust center', 'Local replay', 'Basic Oracle recommendations', 'Session draft report'],
    pendingCloud: ['Federated benchmark', 'Heavy Digital Twin simulation', 'Long-term model training', 'Cloud backup'],
    trustChannels: [
      { channel: 'RPM', status: ecu ? 'OK' : 'Partial' }, { channel: 'Gear', status: ecu ? 'OK' : 'Partial' },
      { channel: 'Throttle', status: ecu ? 'OK' : 'Partial' }, { channel: 'Brake', status: 'Partial' },
      { channel: 'Lean', status: 'OK' }, { channel: 'GPS', status: 'OK' }, { channel: 'Speed', status: 'OK' },
    ],
    trustCompatibility: ecu ? 93 : 71,
    liveFeed: {
      now: 'T15 Bucine · rear slip spike · Medium risk',
      lastLap: 'T1 San Donato · braking improved',
      trend: 'Exit-drive issue repeated in 3 consecutive laps',
      recommendation: 'Next lap: simplify objective, focus only on pickup.',
    },
    videoSync: { camera: 'Onboard front', status: 'Connected', offsetS: 0.42, markers: 12, ready: true },
    garageReady: [
      { item: 'Circuit', status: 'READY', detail: circuit },
      { item: 'Rider', status: 'READY', detail: rider },
      { item: 'Bike', status: 'READY', detail: bike },
      { item: 'Logger', status: 'READY', detail: 'connected' },
      { item: 'GPS', status: 'READY', detail: 'locked' },
      { item: 'IMU', status: 'READY', detail: 'calibrated' },
      { item: 'ECU', status: ecu ? 'READY' : 'pending', detail: ecu ? 'streaming' : 'GPS-only — ECU analysis off' },
      { item: 'Onboard camera', status: 'pending', detail: 'sync +0.42s — start without video or retry' },
      { item: 'Tyres', status: 'READY', detail: 'pressure target loaded' },
      { item: 'Mission', status: 'READY', detail: 'Exit Drive Validation' },
    ],
    readyStatus: 'GREEN',
    sync: {
      items: ['Raw telemetry', 'Clean telemetry', 'Video markers', 'Event timeline', 'Session report draft', 'Calibration profile', 'Setup snapshot', 'Tyre passport update'],
      progress: 68, conflicts: 'No conflicts',
    },
    edgeAI: ['Event detection', 'Crash-risk scoring', 'Data quality validation', 'Lap segmentation', 'Corner phase detection', 'Anomaly detection', 'Session summary draft'],
    cloudAI: ['Heavy Digital Twin', 'Federated Intelligence', 'Long-term pattern mining', 'Advanced report generation', 'Model training', 'Cross-session benchmark'],
    security: [
      { field: 'Local encryption', status: 'Enabled' },
      { field: 'Device pairing', status: 'Trusted devices only' },
      { field: 'Session access', status: 'Role-based' },
      { field: 'Cloud sync', status: 'Encrypted' },
      { field: 'Raw telemetry sharing', status: 'Disabled' },
      { field: 'Federated mode', status: 'Aggregated patterns only' },
    ],
    simLive: {
      rows: [
        { metric: 'Rear slip', expected: '<10%', observed: '11.2%', ok: false },
        { metric: 'Exit speed', expected: '+5 km/h', observed: '+4 km/h', ok: false },
      ],
      status: 'Close to target',
      recommendation: 'Continue validation for one more lap.',
    },
    buffer: {
      sizeGB: 2.4,
      stored: ['Raw telemetry', 'Clean telemetry', 'Events', 'Video markers', 'Calibration profile', 'Session metadata'],
      retentionDays: 30, syncStatus: 'Pending upload',
    },
    missionName: 'Exit Drive Validation',
    nextAction: 'Start 5-lap validation stint',
  };
}
