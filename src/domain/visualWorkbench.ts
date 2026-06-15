/**
 * visualWorkbench.ts — Telemetry Visualization OS.
 *
 * One visual grammar for the whole platform: a Master Cursor that ties together
 * the track position, telemetry traces, the event timeline and the corner card;
 * a Visual Replay of the session; a Before/After lens; a Data Story; and the
 * shared confidence overlay, colour grammar and saved workspaces.
 *
 *   KDD doesn't show charts — it synchronises the whole session into one view.
 *
 * Composes the existing telemetry track (videoStudio) and detected events
 * (eventEngine) so every surface reads the same source. Deterministic.
 */
import { buildVideoTrack } from './videoStudio';
import { buildEventEngine } from './eventEngine';

// Corner anchors along the lap (shared with the telemetry track model).
const CORNERS: Array<{ name: string; pct: number }> = [
  { name: 'T1 San Donato', pct: 0.10 }, { name: 'T2 Luco', pct: 0.18 },
  { name: 'T4 Materassi', pct: 0.26 }, { name: 'T6 Savelli', pct: 0.36 },
  { name: 'T8/T9 Arrabbiata', pct: 0.50 }, { name: 'T10 Scarperia', pct: 0.60 },
  { name: 'T12 Correntaio', pct: 0.66 }, { name: 'T14 Biondetti', pct: 0.80 },
  { name: 'T15 Bucine', pct: 0.88 },
];

export function cornerAt(pct: number): { corner: string; phase: string } {
  let best = CORNERS[0], d = 1;
  for (const c of CORNERS) { const dd = Math.abs(pct - c.pct); if (dd < d) { d = dd; best = c; } }
  if (d > 0.045) return { corner: 'Straight', phase: 'Run' };
  const phase = pct < best.pct - 0.012 ? 'Entry' : pct > best.pct + 0.012 ? 'Exit' : 'Apex';
  return { corner: best.name, phase };
}

export interface WorkbenchFrame {
  t: number; distPct: number; distM: number;
  corner: string; phase: string;
  speed: number; throttle: number; brake: number; lean: number; rearSlip: number;
  event?: string; eventSeverity?: string;
}

export interface BeforeAfterRow { metric: string; before: string; after: string; betterIsLower: boolean; deltaPct: number }
export interface GrammarToken { token: string; meaning: string; color: string }
export interface ConfidenceMode { label: string; dash: string; note: string }
export interface Workspace { id: string; name: string; role: string; includes: string[]; tab: string }

export interface VisualWorkbench {
  combo: string; lap: string; durationS: number; lapLengthM: number;
  frames: WorkbenchFrame[];
  beforeAfter: BeforeAfterRow[]; beforeAfterHeadline: string;
  dataStory: string;
  grammar: GrammarToken[];
  confidence: ConfidenceMode[];
  workspaces: Workspace[];
}

const LAP_LENGTH_M = 5245;

export function buildVisualWorkbench(rider: string, bike: string, circuit: string, session: string): VisualWorkbench {
  const track = buildVideoTrack(rider, bike, circuit, `${session} · Lap 4`);
  const eng = buildEventEngine(rider, bike, circuit, session);

  // index events by corner leading token (T1, T15, T8 …) for cursor sync
  const evByCorner = new Map<string, { name: string; severity: string }>();
  for (const e of eng.events) {
    const tok = e.corner.split(' ')[0];
    if (!evByCorner.has(tok)) evByCorner.set(tok, { name: e.name, severity: e.severity });
  }

  const frames: WorkbenchFrame[] = track.frames.map(f => {
    const { corner, phase } = cornerAt(f.distPct);
    const ev = corner !== 'Straight' && phase === 'Apex' ? evByCorner.get(corner.split(' ')[0]) : undefined;
    return {
      t: f.t, distPct: f.distPct, distM: Math.round(f.distPct * LAP_LENGTH_M),
      corner, phase, speed: f.speed, throttle: f.throttle, brake: f.brake, lean: f.lean, rearSlip: f.rearSlip,
      event: ev?.name, eventSeverity: ev?.severity,
    };
  });

  return {
    combo: `${circuit} · ${rider} · ${bike} · ${session}`,
    lap: 'Lap 4', durationS: track.duration, lapLengthM: LAP_LENGTH_M,
    frames,
    beforeAfter: [
      { metric: 'Rear slip', before: '14.0%', after: '9.8%', betterIsLower: true, deltaPct: -30 },
      { metric: 'Loss at Bucine', before: '+0.284s', after: '+0.091s', betterIsLower: true, deltaPct: -68 },
      { metric: 'Throttle pickup late', before: '0.40s', after: '0.12s', betterIsLower: true, deltaPct: -70 },
      { metric: 'Exit speed', before: '184 km/h', after: '190 km/h', betterIsLower: false, deltaPct: 3 },
      { metric: 'Risk score', before: '68', after: '49', betterIsLower: true, deltaPct: -28 },
    ],
    beforeAfterHeadline: 'Stint 03 → Stint 04 · rear rebound +2 clicks + throttle-pickup drill',
    dataStory:
      'Your best lap was Lap 4. It was strong in Sector 2, especially through Arrabbiata 1 and 2. '
      + 'The main time loss appeared at T15 Bucine — and it was not created at entry, but during the exit phase: '
      + 'lean remained too high when throttle started, so rear slip increased, exit speed dropped and the main straight '
      + 'was compromised. Recommended next action: focus on earlier bike pickup before adding throttle.',
    grammar: [
      { token: 'LIVE', meaning: 'Real telemetry', color: 'var(--cyan)' },
      { token: 'AI DECISION', meaning: 'AI / Oracle / Digital Twin', color: 'var(--violet)' },
      { token: 'CRITICAL LOSS', meaning: 'Risk, loss or critical alert', color: 'var(--accent)' },
      { token: 'TYRE / TEMP', meaning: 'Temperature, tyre, degradation', color: '#FF6A00' },
      { token: 'VALIDATED', meaning: 'Improvement, validation, good grip', color: 'var(--green)' },
      { token: 'LOW CONFIDENCE', meaning: 'Warning or partial confidence', color: 'var(--yellow)' },
      { token: 'HISTORIC', meaning: 'Neutral / context / historical', color: 'var(--text-muted)' },
    ],
    confidence: [
      { label: 'Measured', dash: 'solid', note: 'Real sensor data' },
      { label: 'Estimated', dash: 'dashed', note: 'Derived / model-inferred' },
      { label: 'Simulated', dash: 'dotted', note: 'Digital twin / synthetic' },
    ],
    workspaces: [
      { id: 'rider', name: 'Rider Debrief', role: 'Rider', includes: ['Ghost Lap', 'T15 Bucine replay', 'Before / After', 'Next-stint cues'], tab: 'ghost-lap' },
      { id: 'engineer', name: 'Engineer', role: 'Race Engineer', includes: ['Telemetry traces', 'Setup impact', 'Tyre model', 'Event timeline'], tab: 'studio' },
      { id: 'coach', name: 'Coach', role: 'Coach', includes: ['Video', 'Line', 'Throttle/braking', 'Learning Path'], tab: 'learning-path' },
      { id: 'oracle', name: 'Oracle', role: 'Strategy', includes: ['Events', 'Decisions', 'Experiments', 'Confidence'], tab: 'events' },
    ],
  };
}

export function frameAtTime(wb: VisualWorkbench, t: number): WorkbenchFrame {
  const i = Math.max(0, Math.min(wb.frames.length - 1, Math.round((t / wb.durationS) * (wb.frames.length - 1))));
  return wb.frames[i];
}

export function clockFromS(sec: number): string {
  const m = Math.floor(sec / 60);
  return `${m}:${(sec - m * 60).toFixed(3).padStart(6, '0')}`;
}
