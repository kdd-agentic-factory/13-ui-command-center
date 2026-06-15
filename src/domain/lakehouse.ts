/**
 * lakehouse.ts — KDD Motorsport Data Lakehouse & Feature Store.
 *
 * The data foundation under every module: each session becomes a reusable asset
 * across six zones (raw → clean → feature → event → intelligence → model), with
 * a feature store, event/decision stores, a model registry, feature lineage,
 * data versioning and a query studio.
 *
 *   Every lap feeds KDD's future intelligence.
 *
 * Deterministic asset model. The counts are representative platform totals.
 */

export interface Zone { layer: number; name: string; desc: string; count: string; status: 'Healthy' | 'Partial' }
export interface AssetSummary {
  sessions: number; cleanSessions: number; laps: number; samples: string; events: number;
  decisions: number; validatedLearnings: number; features: number; models: number; dataTrustAvg: number;
  mostStudiedCircuit: string; mostRepeatedIssue: string;
}
export interface FeatureGroup { scope: string; features: string[] }
export interface EventRecord { event: string; location: string; impact: string; outcome: string }
export interface DecisionRecord { decision: string; expected: string; actual: string; outcome: string }
export interface ModelEntry { model: string; version: string; score: number; status: string; limitation: string }
export interface Lineage { recommendation: string; basedOn: string[]; sources: string[]; confidence: number }
export interface VersionRow { version: string; label: string }
export interface QueryTemplate { id: string; query: string; result: string }
export interface Explorer { riders: number; bikes: number; circuits: number; sessions: number; laps: number; corners: number; events: number; decisions: number; experiments: number }
export interface FederatedExport { shared: string[]; notShared: string[] }

export interface Lakehouse {
  combo: string;
  zones: Zone[];
  summary: AssetSummary;
  rawSources: string[];
  cleanWarnings: string[];
  cleanDataTrust: number;
  channelMapping: string;
  featureGroups: FeatureGroup[];
  sampleFeature: Record<string, string | number>;
  events: EventRecord[];
  decisions: DecisionRecord[];
  models: ModelEntry[];
  lineage: Lineage;
  versions: VersionRow[];
  queries: QueryTemplate[];
  explorer: Explorer;
  federatedExport: FederatedExport;
}

export function buildLakehouse(rider: string, bike: string, circuit: string, session: string, telemetryLimited = false): Lakehouse {
  const ecu = !telemetryLimited;
  return {
    combo: `${rider} · ${bike} · ${circuit} · ${session}`,
    zones: [
      { layer: 1, name: 'Raw Zone', desc: 'Original sources, unmodified, read-only.', count: '18 sessions', status: 'Healthy' },
      { layer: 2, name: 'Clean Zone', desc: 'Normalised, calibrated, lap/corner segmented.', count: '17 sessions', status: 'Healthy' },
      { layer: 3, name: 'Feature Zone', desc: 'Reusable features per lap/corner/phase/channel.', count: '34,820 features', status: 'Healthy' },
      { layer: 4, name: 'Event Zone', desc: 'Detected, labelled events.', count: '438 events', status: 'Healthy' },
      { layer: 5, name: 'Intelligence Zone', desc: 'Hypotheses, decisions, experiments, learnings.', count: '64 decisions', status: 'Healthy' },
      { layer: 6, name: 'Model Zone', desc: 'Models, versions, metrics, training sets.', count: '8 models', status: ecu ? 'Healthy' : 'Partial' },
    ],
    summary: {
      sessions: 18, cleanSessions: 17, laps: 146, samples: '12.4M', events: 438,
      decisions: 64, validatedLearnings: 27, features: 34820, models: 8, dataTrustAvg: 89,
      mostStudiedCircuit: 'Mugello', mostRepeatedIssue: 'Late throttle pickup',
    },
    rawSources: ['CSV / AiM / 2D export', 'GPX', 'Onboard video', 'ECU', 'IMU', 'GPS', 'Heart-rate', 'Weather', 'Setup sheet', 'Tyre sheet', 'Rider notes'],
    cleanWarnings: [ecu ? 'Brake pressure partially calibrated' : 'ECU channels missing (GPS-only)', 'Tyre pressure missing'],
    cleanDataTrust: ecu ? 91 : 72,
    channelMapping: ecu ? '42 / 48 channels' : '21 / 48 channels',
    featureGroups: [
      { scope: 'Per session', features: ['Best lap', 'Average lap', 'Consistency', 'Risk score', 'Fatigue trend'] },
      { scope: 'Per lap', features: ['Lap time', 'Sector delta', 'Tyre degradation', 'Grip margin', 'Error count'] },
      { scope: 'Per corner', features: ['Entry/apex/exit speed', 'Brake point', 'Throttle pickup', 'Lean at pickup', 'Rear slip peak', 'Line deviation', 'Time loss'] },
      { scope: 'Per phase', features: ['Entry', 'Brake release', 'Apex', 'Exit', 'Transition'] },
      { scope: 'Per rider', features: ['Style DNA', 'Throttle smoothness', 'Braking aggression', 'Lean reliance', 'Confidence index'] },
      { scope: 'Per bike', features: ['Setup sensitivity', 'Rear instability tendency', 'Tyre load pattern', 'Electronics usage'] },
    ],
    sampleFeature: {
      feature_id: 'mugello_stint03_lap04_t15_exit',
      circuit: 'Mugello GP', corner: 'T15 Bucine', phase: 'exit', rider, bike, lap: 4,
      entry_speed_kmh: 142, apex_speed_kmh: 118, exit_speed_kmh: 184, target_exit_speed_kmh: 190,
      lean_at_throttle_deg: 57, throttle_pickup_delay_s: 0.40, rear_slip_pct: 14,
      time_loss_s: 0.284, risk_score: 68, data_confidence: ecu ? 0.91 : 0.72,
    },
    events: [
      { event: 'High lean throttle event', location: 'T15 Bucine · exit', impact: '+0.284s', outcome: 'Validated' },
      { event: 'Rear slip spike', location: 'T15 Bucine · exit', impact: 'Cliff risk', outcome: 'Pending' },
      { event: 'Wide entry', location: 'T12 Correntaio', impact: '+0.14s', outcome: 'Recurring' },
    ],
    decisions: [
      { decision: 'Rear rebound +2 clicks slower', expected: 'Rear slip <10%, exit +5 km/h', actual: 'Rear slip 9.8%, exit +5 km/h', outcome: 'Validated' },
      { decision: 'TC4 → TC5 in Sector 3', expected: 'Fewer spins, +0.05s cost', actual: '+0.11s cost', outcome: 'Rejected' },
    ],
    models: [
      { model: 'Crash Risk Model', version: 'v1.8.2', score: 0.87, status: 'Production', limitation: 'Tyre pressure unavailable in 32% of sessions' },
      { model: 'Tyre Degradation Model', version: 'v1.4.0', score: 0.83, status: 'Production', limitation: 'Hot-track samples limited' },
      { model: 'Exit-Drive Event Detector', version: 'v2.1.1', score: 0.9, status: 'Production', limitation: 'GPS-only bikes use estimated lean' },
    ],
    lineage: {
      recommendation: 'Rear rebound +2 clicks slower',
      basedOn: ['rear_slip_pct', 'lean_at_throttle_deg', 'exit_speed_deficit', 'rear_grip_drop', 'setup_history', 'similar_events'],
      sources: ['Mugello Stint 02', 'Mugello Stint 03', 'Jarama Stint 05'],
      confidence: 84,
    },
    versions: [
      { version: 'v0', label: 'Original import' },
      { version: 'v1', label: 'Basic parsing' },
      { version: 'v2', label: 'Corrected brake scale' },
      { version: 'v3', label: 'GPS corrected' },
      { version: 'v4', label: 'Event labels added' },
      { version: 'v5', label: 'Final validated' },
    ],
    queries: [
      { id: 'q1', query: 'rear_slip > 12% at T15 Bucine', result: '7 events · 4 sessions · avg loss +0.31s · best fix: rear rebound +2 clicks (validated)' },
      { id: 'q2', query: 'throttle_pickup_delay > 0.3s on exits', result: '11 events · 5 sessions · main zones T15, T12, T7 · training: Exit Drive Mastery' },
      { id: 'q3', query: 'validated decisions, last 9 sessions', result: '27 validated · top: rear rebound +2 (2/3) · medium for long stints (1/2)' },
      { id: 'q4', query: 'tyre cliff onset by compound', result: 'Soft ~L19 · Medium ~L22 · switch saves end-stint pace on hot tracks' },
    ],
    explorer: { riders: 1, bikes: 3, circuits: 3, sessions: 18, laps: 146, corners: 2190, events: 438, decisions: 64, experiments: 12 },
    federatedExport: {
      shared: ['Aggregated corner features', 'Benchmark percentiles', 'Anonymous event patterns', 'Validated setup outcomes'],
      notShared: ['Raw telemetry', 'Video', 'Rider identity', 'Team setup sheets', 'Private notes'],
    },
  };
}
