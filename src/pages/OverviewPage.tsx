import { useState, useEffect, useRef } from 'react';
import { Flag, Zap } from 'lucide-react';
import { useLiveTelemetry } from '../hooks/useLiveTelemetry';

// ── Types ─────────────────────────────────────────────────────────────────────

interface FeedEvent {
  id: number;
  time: string;
  color: string;
  text: string;
}

// ── Baseline feed (shown on page load) ───────────────────────────────────────

const INITIAL_EVENTS: FeedEvent[] = [
  { id: 1, time: '14:22', color: 'var(--green)',  text: 'Crew Chief — <strong>Sector 3 gain +0.15s</strong> vs Lap 5 baseline' },
  { id: 2, time: '14:19', color: 'var(--blue)',   text: 'Digital Twin — Soft rear degradation above model at <strong>1.2% / lap</strong>' },
  { id: 3, time: '14:17', color: 'var(--yellow)', text: 'Tire Agent — <strong>Pit window opens Lap 9</strong> — optimal Lap 11' },
  { id: 4, time: '14:15', color: 'var(--accent)', text: 'Race Control — <strong>Yellow flag sector 5</strong> — Gap control active' },
  { id: 5, time: '14:12', color: 'var(--green)',  text: 'Setup Agent — Engine map 6 delivering +2.1 km/h top speed' },
  { id: 6, time: '14:09', color: 'var(--blue)',   text: 'KDD Pipeline — Lap 4 telemetry processed — <strong>12,400 samples</strong>' },
];

// Template pool for generated feed events
type FeedFn = (gap: string, speed: number, fuel: number, lap: number) => { color: string; text: string };

const FEED_TEMPLATES: FeedFn[] = [
  (gap)               => ({ color: 'var(--blue)',    text: `Gap Monitor — P2 gap now <strong>${gap}</strong>` }),
  (_gap, speed)       => ({ color: 'var(--green)',   text: `Telemetry — Top speed on Straight 1: <strong>${speed} km/h</strong>` }),
  ()                  => ({ color: 'var(--yellow)',  text: 'Tyre Agent — Rear temp stable at 98°C · degradation nominal' }),
  (_gap, _spd, fuel)  => ({ color: 'var(--orange)',  text: `Fuel Model — Estimated remaining: <strong>${fuel.toFixed(1)} kg</strong>` }),
  ()                  => ({ color: 'var(--blue)',    text: 'KDD Pipeline — Telemetry batch processed · 12,400 samples' }),
  (_g, _s, _f, lap)   => ({ color: 'var(--green)',   text: `Digital Twin — Lap ${lap} delta: <strong>–0.08s</strong> vs predicted` }),
];

// ── Rivals table — base positions ─────────────────────────────────────────────

const BASE_RIVALS = [
  { basePos: 1, rider: 'M. Marquez',    team: 'Ducati',      self: false },
  { basePos: 2, rider: 'P. Espargaro',  team: 'Aprilia',     self: false },
  { basePos: 3, rider: '#47 KDD',       team: 'KDD Racing',  self: true  },
  { basePos: 4, rider: 'J. Martin',     team: 'Pramac',      self: false },
  { basePos: 5, rider: 'E. Bastianini', team: 'Ducati',      self: false },
];

// Compute dynamic gap strings based on live position + gap
function buildRivals(position: number, gap: string) {
  return BASE_RIVALS.map(r => {
    // Adjust the self-row to reflect live position
    const livePos = r.self ? position : r.basePos >= position ? r.basePos + (position === 4 ? 0 : 0) : r.basePos;
    const displayPos = r.self ? position : r.basePos === position ? r.basePos + 1 : r.basePos;
    const gapToLead = r.self ? (position === 1 ? 'LEADER' : gap) : r.basePos === 1 ? 'LEADER' : '+' + (r.basePos * 0.421).toFixed(3);
    return { ...r, pos: displayPos, gap: gapToLead };
  }).sort((a, b) => a.pos - b.pos);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatLap(s: number): string {
  const m = Math.floor(s / 60);
  const sec = (s % 60).toFixed(3).padStart(6, '0');
  return `${m}:${sec}`;
}

function now(): string {
  return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

// ── Page ───────────────────────────────────────────────────────────────────────

export function OverviewPage() {
  const t = useLiveTelemetry();
  const [feedEvents, setFeedEvents] = useState<FeedEvent[]>(INITIAL_EVENTS);
  const templateIdx = useRef(0);
  const lastLapRef = useRef(t.lapCount);

  // ── Generate feed events ────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      const idx = templateIdx.current % FEED_TEMPLATES.length;
      templateIdx.current += 1;
      const tmpl = FEED_TEMPLATES[idx];
      const { color, text } = tmpl(t.gap, t.speed, t.fuelLoad, t.lapCount);
      setFeedEvents(prev => [
        { id: Date.now(), time: now(), color, text },
        ...prev.slice(0, 9),
      ]);
    }, 9000);
    return () => clearInterval(interval);
  }, [t.gap, t.speed, t.fuelLoad, t.lapCount]);

  // ── Emit lap-completion event ───────────────────────────────────────────
  useEffect(() => {
    if (t.lapCount > lastLapRef.current) {
      lastLapRef.current = t.lapCount;
      setFeedEvents(prev => [
        {
          id: Date.now(),
          time: now(),
          color: 'var(--accent)',
          text: `<strong>LAP ${t.lapCount} COMPLETE</strong> — ${formatLap(t.lastLap)} · Best ${formatLap(t.bestLap)}`,
        },
        ...prev.slice(0, 9),
      ]);
    }
  }, [t.lapCount, t.lastLap, t.bestLap]);

  // Live rivals
  const rivals = buildRivals(t.position, t.gap);

  // Last lap delta
  const lapDelta = t.lastLap - t.bestLap;
  const lapDeltaStr = lapDelta >= 0 ? `+${lapDelta.toFixed(3)}` : lapDelta.toFixed(3);
  const lapDeltaColor = lapDelta > 0.5 ? 'var(--accent)' : lapDelta > 0.1 ? 'var(--yellow)' : 'var(--green)';

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Race Overview</h1>
          <p className="page-subtitle">GP Mugello · Round 7 of 20 · Lap {t.lapCount} / 23</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-red" style={{ animation: 'pulse 2s infinite' }}>RACE IN PROGRESS</span>
          <span className="badge badge-green">All agents nominal</span>
        </div>
      </div>

      {/* ── KPI row ─────────────────────────────────────────────────────── */}
      <div className="grid-4 mb-4">
        <div className="stat-tile accent-border">
          <div className="stat-tile__label">Position</div>
          <div className="flex items-center gap-2" style={{ alignItems: 'flex-end', gap: 8 }}>
            <span className="stat-tile__value">P{t.position}</span>
            <span className="badge badge-yellow" style={{ marginBottom: 4 }}>GAP {t.gap}</span>
          </div>
          <div className="stat-tile__delta" style={{ color: t.position <= 3 ? 'var(--green)' : 'var(--yellow)' }}>
            {t.position <= 3 ? `Top ${t.position} — points position` : 'Outside top 3'}
          </div>
        </div>
        <div className="stat-tile green-border">
          <div className="stat-tile__label">Last Lap</div>
          <span className="stat-tile__value text-mono" style={{ fontSize: 22 }}>{formatLap(t.lastLap)}</span>
          <div className="stat-tile__delta" style={{ color: lapDeltaColor }}>
            {lapDeltaStr} vs best
          </div>
        </div>
        <div className="stat-tile blue-border">
          <div className="stat-tile__label">Best Lap</div>
          <span className="stat-tile__value text-mono" style={{ fontSize: 22 }}>{formatLap(t.bestLap)}</span>
          <div className="stat-tile__delta delta-pos">⚡ Personal best</div>
        </div>
        <div className="stat-tile yellow-border">
          <div className="stat-tile__label">Fuel Remaining</div>
          <span className="stat-tile__value" style={{ color: t.fuelLoad < 5 ? 'var(--accent)' : undefined }}>
            {t.fuelLoad.toFixed(1)}<span className="stat-tile__unit">kg</span>
          </span>
          <div className="stat-tile__delta delta-neu">{(t.lapCount * 2.2).toFixed(1)} kg consumed</div>
        </div>
      </div>

      {/* ── Middle grid ─────────────────────────────────────────────────── */}
      <div className="grid-3-2 mb-4">

        {/* Left — Agent event feed */}
        <div className="card">
          <div className="card-header">
            <span className="card-title flex items-center gap-2">
              <Zap size={14} style={{ color: 'var(--accent)' }} />
              Agent Activity Feed
            </span>
            <span className="badge badge-green" style={{ animation: 'pulse 2s infinite' }}>LIVE</span>
          </div>
          <div className="event-feed">
            {feedEvents.map(ev => (
              <div className="event-item" key={ev.id}>
                <div className="event-dot" style={{ background: ev.color }} />
                <span className="event-time text-mono">{ev.time}</span>
                <span
                  className="event-text"
                  dangerouslySetInnerHTML={{ __html: ev.text }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Right — Live mini stats + tire */}
        <div className="flex-col gap-3">

          <div className="card">
            <div className="card-header">
              <span className="card-title">Live Snapshot</span>
              <span className="badge badge-muted" style={{ fontFamily: 'JetBrains Mono,monospace' }}>10 Hz</span>
            </div>
            <div className="card-body">
              <div className="flex items-center justify-between mb-3" style={{ marginBottom: 16 }}>
                <div>
                  <div className="card-label">Speed</div>
                  <span className="telem-lg text-mono">{t.speed}<span className="telem-unit" style={{ fontSize: 14 }}>km/h</span></span>
                </div>
                <div>
                  <div className="card-label">RPM</div>
                  <span className="telem-md text-mono">{t.rpm.toLocaleString()}</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div className="card-label">Gear</div>
                  <span className="telem-lg text-mono" style={{ color: 'var(--accent)', fontSize: 40 }}>{t.gear}</span>
                </div>
              </div>

              <div className="mb-3" style={{ marginBottom: 12 }}>
                <div className="flex items-center justify-between mb-1" style={{ marginBottom: 4 }}>
                  <span className="card-label">Throttle</span>
                  <span className="text-mono" style={{ fontSize: 12 }}>{t.throttle}%</span>
                </div>
                <div className="bar-track">
                  <div className="bar-fill green" style={{ width: `${t.throttle}%` }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1" style={{ marginBottom: 4 }}>
                  <span className="card-label">Brake</span>
                  <span className="text-mono" style={{ fontSize: 12 }}>{t.brake}%</span>
                </div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${t.brake}%`, background: 'var(--accent)' }} />
                </div>
              </div>

              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between">
                  <span className="card-label">Lean Angle</span>
                  <span className="text-mono" style={{ fontSize: 13, color: t.leanAngle > 45 ? 'var(--accent)' : 'var(--text)' }}>
                    {t.leanAngle.toFixed(1)}°
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Tyres</span>
              <span className="badge badge-orange">Lap {t.rearTyreAge}</span>
            </div>
            <div className="card-body">
              <div className="flex gap-3" style={{ gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div className="card-label" style={{ marginBottom: 6 }}>Front — {t.frontCompound}</div>
                  <div className="flex gap-2">
                    <div className={`tire ${t.tireFrontLeft > 100 ? 'hot' : t.tireFrontLeft > 90 ? 'warm' : 'nominal'}`}>
                      <span className="t-temp">{t.tireFrontLeft}°</span>
                      <span className="t-label">FL</span>
                    </div>
                    <div className={`tire ${t.tireFrontRight > 100 ? 'hot' : t.tireFrontRight > 90 ? 'warm' : 'nominal'}`}>
                      <span className="t-temp">{t.tireFrontRight}°</span>
                      <span className="t-label">FR</span>
                    </div>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="card-label" style={{ marginBottom: 6 }}>Rear — {t.rearCompound}</div>
                  <div className="flex gap-2">
                    <div className={`tire ${t.tireRearLeft > 105 ? 'hot' : t.tireRearLeft > 95 ? 'warm' : 'nominal'}`}>
                      <span className="t-temp">{t.tireRearLeft}°</span>
                      <span className="t-label">RL</span>
                    </div>
                    <div className={`tire ${t.tireRearRight > 105 ? 'hot' : t.tireRearRight > 95 ? 'warm' : 'nominal'}`}>
                      <span className="t-temp">{t.tireRearRight}°</span>
                      <span className="t-label">RR</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Race standings ────────────────────────────────────────────────── */}
      <div className="card">
        <div className="card-header">
          <span className="card-title flex items-center gap-2">
            <Flag size={14} />
            Race Standings — Lap {t.lapCount}
          </span>
          <span className="badge badge-muted">Top 5</span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 48 }}>Pos</th>
              <th>Rider</th>
              <th>Team</th>
              <th>Gap to Lead</th>
              <th style={{ width: 80 }}>Trend</th>
            </tr>
          </thead>
          <tbody>
            {rivals.map(r => {
              const posColor =
                r.pos === 1 ? '#F59E0B' :
                r.pos === 2 ? '#C0C0C0' :
                r.pos === 3 ? '#CD7F32' :
                'var(--text-muted)';
              return (
                <tr key={r.rider} style={r.self ? { background: 'var(--accent-dim)' } : {}}>
                  <td>
                    <span className="text-mono" style={{ fontWeight: 800, fontSize: 13, color: posColor }}>
                      P{r.pos}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: r.self ? 700 : 500, color: r.self ? 'var(--accent)' : 'var(--text)' }}>
                      {r.rider}
                    </span>
                    {r.self && <span className="badge badge-red" style={{ marginLeft: 8, fontSize: 9 }}>YOU</span>}
                  </td>
                  <td style={{ color: 'var(--text-dim)', fontSize: 12 }}>{r.team}</td>
                  <td className="mono" style={{ fontSize: 13, color: r.self ? 'var(--yellow)' : 'var(--text)' }}>
                    {r.gap}
                  </td>
                  <td>
                    <span style={{ fontSize: 16, lineHeight: 1 }}>
                      {r.self ? (t.position === 3 ? '–' : '↓') : r.pos <= 2 ? '↑' : '–'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
