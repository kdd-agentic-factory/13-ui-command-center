import { useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, Flag, AlertTriangle, Gauge, Activity, ChevronRight } from 'lucide-react';
import { TrackMap3D } from '../components/babylon/TrackMap3D';
import { DigitalTwinViewer3D } from '../components/babylon/DigitalTwinViewer3D';
import { trackSpeed } from '../hooks/useLiveTelemetry';

/**
 * Lap Replay (engineer feedback #10) — scrub a recorded lap and watch the 3D
 * track map + bike attitude move with it, with the synchronised telemetry
 * readout, the delta vs the best lap, and an event feed annotated by the AI.
 */

const LAP_TIME_S = 101.882; // 1:41.882

interface ReplayEvent {
  pos: number;            // 0–1 lap fraction
  t: string;              // mm:ss
  where: string;
  text: string;
  kind: 'brake' | 'lean' | 'warn' | 'alert' | 'sector' | 'ok';
}

const EVENTS: ReplayEvent[] = [
  { pos: 0.05, t: '00:07', where: 'Turn 1', text: 'Brake peak 43 bar', kind: 'brake' },
  { pos: 0.10, t: '00:11', where: 'Turn 1', text: 'Max lean 56.4°', kind: 'lean' },
  { pos: 0.15, t: '00:15', where: 'Turn 2', text: 'Late throttle opening (+0.18 s)', kind: 'warn' },
  { pos: 0.20, t: '00:20', where: 'Turn 3', text: 'Rear slip detected on exit', kind: 'alert' },
  { pos: 0.33, t: '00:34', where: 'Sector 1', text: 'Sector 1 complete · +0.183 s', kind: 'sector' },
  { pos: 0.52, t: '00:53', where: 'Turn 7', text: 'Throttle 0.40 s late · −0.284 s', kind: 'alert' },
  { pos: 0.66, t: '01:08', where: 'Sector 2', text: 'Sector 2 complete · +0.401 s', kind: 'sector' },
  { pos: 0.88, t: '01:30', where: 'Turn 10', text: 'Clean exit · on reference', kind: 'ok' },
  { pos: 1.00, t: '01:41', where: 'Finish', text: 'Lap 1:41.882 · +0.438 vs best', kind: 'sector' },
];

const KIND_COLOR: Record<ReplayEvent['kind'], string> = {
  brake: 'var(--blue)', lean: 'var(--purple)', warn: 'var(--yellow)',
  alert: 'var(--accent)', sector: 'var(--text-dim)', ok: 'var(--green)',
};

function sampleAt(pos: number) {
  const sp = trackSpeed(pos);
  const speed = Math.round(sp * 330 + 10);
  const braking = sp < 0.35;
  const accel = sp > 0.65;
  const throttle = accel ? 92 : braking ? 4 : 48;
  const brake = braking ? 78 : 2;
  const lean = Math.round((1 - sp) * 55 * 10) / 10;
  const gear = Math.max(1, Math.min(6, Math.round(speed / 55)));
  const rpm = Math.min(15500, Math.round(speed * 45 + 2000));
  const delta = 0.438 * pos + 0.12 * Math.sin(pos * 7);
  return { speed, throttle, brake, lean, gear, rpm, delta };
}

function fmtTime(pos: number): string {
  const s = pos * LAP_TIME_S;
  const m = Math.floor(s / 60);
  const sec = (s % 60).toFixed(1).padStart(4, '0');
  return `${m}:${sec}`;
}

function Read({ label, value, unit, color }: { label: string; value: string | number; unit?: string; color?: string }) {
  return (
    <div className="stat-tile">
      <div className="stat-tile__label">{label}</div>
      <span className="stat-tile__value" style={{ fontSize: 20, color }}>
        {value}{unit && <span className="stat-tile__unit">{unit}</span>}
      </span>
    </div>
  );
}

export function LapReplayPage() {
  const [pos, setPos] = useState(0.0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing) return;
    // Drive the replay with setInterval at ~20 fps rather than requestAnimationFrame
    // at 60 fps: two Babylon engines (track map + bike) re-rendered 60×/s freezes
    // the tab. 20 fps state updates are plenty smooth (the WebGL scenes still render
    // at their own 60 fps) and keep the page responsive.
    const STEP = 1 / 20;                 // seconds per update
    const id = setInterval(() => {
      setPos(p => (p + STEP / LAP_TIME_S) % 1);
    }, STEP * 1000);
    return () => clearInterval(id);
  }, [playing]);

  const s = sampleAt(pos);
  const activeIdx = EVENTS.reduce((acc, e, i) => (e.pos <= pos + 1e-6 ? i : acc), -1);
  const deltaPos = s.delta >= 0;

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Lap Replay</h1>
          <p className="page-subtitle">Jarama · Lap 08 · 1:41.882 · synchronised telemetry + AI notes</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge" style={{ background: deltaPos ? 'var(--accent-dim)' : 'var(--green-dim)', color: deltaPos ? 'var(--accent)' : 'var(--green)' }}>
            Δ {deltaPos ? '+' : ''}{s.delta.toFixed(3)} s vs best
          </span>
        </div>
      </div>

      <div className="grid-2" style={{ gap: 16, alignItems: 'start' }}>
        {/* Left — 3D map + transport */}
        <div className="card">
          <div className="card-header">
            <span className="card-title flex items-center gap-2"><Flag size={14} style={{ color: 'var(--accent)' }} /> Track position</span>
            <span className="badge badge-blue">{fmtTime(pos)} / 1:41.9</span>
          </div>
          <TrackMap3D trackPos={pos} height={300} />

          {/* Transport controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
            <button className="btn btn-sm" onClick={() => setPlaying(p => !p)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 88, justifyContent: 'center' }}>
              {playing ? <><Pause size={13} /> Pause</> : <><Play size={13} /> Play</>}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => { setPos(0); }} title="Restart"><RotateCcw size={13} /></button>
            <input
              type="range" min={0} max={1} step={0.001} value={pos}
              onChange={e => { setPlaying(false); setPos(parseFloat(e.target.value)); }}
              style={{ flex: 1, accentColor: 'var(--accent)' }}
            />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)', minWidth: 64, textAlign: 'right' }}>{fmtTime(pos)}</span>
          </div>

          {/* Throttle / brake traces at the scrub point */}
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'THROTTLE', v: s.throttle, color: 'var(--green)' },
              { label: 'BRAKE', v: s.brake, color: 'var(--accent)' },
            ].map(tr => (
              <div key={tr.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>
                  <span>{tr.label}</span><span style={{ color: tr.color }}>{tr.v}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.07)' }}>
                  <div style={{ width: `${tr.v}%`, height: '100%', background: tr.color, borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — bike attitude + readouts + events */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title flex items-center gap-2"><Activity size={14} style={{ color: 'var(--accent)' }} /> Bike attitude</span>
              <span className="badge badge-green">LEAN {Math.abs(s.lean).toFixed(1)}°</span>
            </div>
            <DigitalTwinViewer3D leanAngle={s.lean} pitchAngle={s.brake * 0.08 - s.throttle * 0.04} height={220} />
            <div className="grid-4" style={{ marginTop: 12 }}>
              <Read label="Speed" value={s.speed} unit="km/h" color="var(--blue)" />
              <Read label="Gear" value={s.gear} />
              <Read label="RPM" value={s.rpm.toLocaleString()} />
              <Read label="Lean" value={Math.abs(s.lean).toFixed(0)} unit="°" color="var(--purple)" />
            </div>
          </div>

          {/* Event feed */}
          <div className="card">
            <div className="card-header">
              <span className="card-title flex items-center gap-2"><Gauge size={14} style={{ color: 'var(--accent)' }} /> Lap events · Session Reporter AI</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4 }}>
              {EVENTS.map((e, i) => {
                const active = i === activeIdx;
                return (
                  <button
                    key={i}
                    onClick={() => { setPlaying(false); setPos(e.pos === 1 ? 0.999 : e.pos); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                      padding: '7px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                      background: active ? 'rgba(255,255,255,0.06)' : 'transparent',
                      borderLeft: `3px solid ${active ? KIND_COLOR[e.kind] : 'transparent'}`,
                      transition: 'background 0.15s',
                    }}
                  >
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', minWidth: 40 }}>{e.t}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: KIND_COLOR[e.kind], minWidth: 64 }}>{e.where}</span>
                    <span style={{ fontSize: 12, color: active ? 'var(--text)' : 'var(--text-dim)', flex: 1 }}>
                      {(e.kind === 'alert' || e.kind === 'warn') && <AlertTriangle size={11} style={{ verticalAlign: -1, marginRight: 4, color: KIND_COLOR[e.kind] }} />}
                      {e.text}
                    </span>
                  </button>
                );
              })}
            </div>
            <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
              <button className="btn btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>Compare to best lap <ChevronRight size={12} /></button>
              <button className="btn btn-ghost btn-sm">Export PDF</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
