import { Flag, Radio, TrendingUp, Zap, AlertTriangle, CheckCircle } from 'lucide-react';
import { useLiveTelemetry } from '../hooks/useLiveTelemetry';

const SESSION_EVENTS = [
  { time: '14:22', color: 'var(--green)',  text: 'Crew Chief — <strong>Sector 3 gain +0.15s</strong> vs Lap 5 baseline' },
  { time: '14:19', color: 'var(--blue)',   text: 'Digital Twin — Soft rear degradation above model at <strong>1.2% / lap</strong>' },
  { time: '14:17', color: 'var(--yellow)', text: 'Tire Agent — <strong>Pit window opens Lap 9</strong> — optimal Lap 11' },
  { time: '14:15', color: 'var(--accent)', text: 'Race Control — <strong>Yellow flag sector 5</strong> — Gap control active' },
  { time: '14:12', color: 'var(--green)',  text: 'Setup Agent — Engine map 6 delivering +2.1 km/h top speed' },
  { time: '14:09', color: 'var(--blue)',   text: 'KDD Pipeline — Lap 4 telemetry processed — <strong>12,400 samples</strong>' },
];

const RIVALS = [
  { pos: 1, rider: 'M. Marquez',   team: 'Ducati', gap: 'LEADER', gap_s: '', trend: 'up' },
  { pos: 2, rider: 'P. Espargaro', team: 'Aprilia', gap: '+0.421', gap_s: '–0.421', trend: 'down' },
  { pos: 3, rider: '#47 KDD',      team: 'KDD Racing', gap: '+0.842', gap_s: '–0.842', trend: 'stable', self: true },
  { pos: 4, rider: 'J. Martin',    team: 'Pramac', gap: '+1.105', gap_s: '+0.263', trend: 'up' },
  { pos: 5, rider: 'E. Bastianini',team: 'Ducati', gap: '+1.874', gap_s: '+1.032', trend: 'up' },
];

function formatLap(s: number): string {
  const m = Math.floor(s / 60);
  const sec = (s % 60).toFixed(3).padStart(6, '0');
  return `${m}:${sec}`;
}

export function OverviewPage() {
  const t = useLiveTelemetry();

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Race Overview</h1>
          <p className="page-subtitle">GP Mugello · Round 7 of 20 · Lap {t.lapCount} / 23</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-red">RACE IN PROGRESS</span>
          <span className="badge badge-green">All agents nominal</span>
        </div>
      </div>

      {/* ── KPI row ─────────────────────────────────────────────────────── */}
      <div className="grid-4 mb-4">
        <div className="stat-tile accent-border">
          <div className="stat-tile__label">Position</div>
          <div className="flex items-center gap-2">
            <span className="stat-tile__value" style={{ color: 'var(--text)' }}>P{t.position}</span>
            <span className="badge badge-yellow">GAP {t.gap}</span>
          </div>
        </div>
        <div className="stat-tile green-border">
          <div className="stat-tile__label">Last Lap</div>
          <span className="stat-tile__value text-mono" style={{ fontSize: 22 }}>{formatLap(t.lastLap)}</span>
          <div className="stat-tile__delta delta-neg">+0.254 vs best</div>
        </div>
        <div className="stat-tile blue-border">
          <div className="stat-tile__label">Best Lap</div>
          <span className="stat-tile__value text-mono" style={{ fontSize: 22 }}>{formatLap(t.bestLap)}</span>
          <div className="stat-tile__delta delta-pos">⚡ Personal best</div>
        </div>
        <div className="stat-tile yellow-border">
          <div className="stat-tile__label">Fuel Remaining</div>
          <span className="stat-tile__value">{t.fuelLoad}<span className="stat-tile__unit">kg</span></span>
          <div className="stat-tile__delta delta-neu">{(t.lapCount * 2.2).toFixed(1)} kg used</div>
        </div>
      </div>

      {/* ── Middle grid ─────────────────────────────────────────────────── */}
      <div className="grid-3-2 mb-4">

        {/* Left — Agent event feed */}
        <div className="card">
          <div className="card-header">
            <span className="card-title flex items-center gap-2">
              <Zap size={14} className="text-accent" />
              Agent Activity Feed
            </span>
            <span className="badge badge-muted">live</span>
          </div>
          <div className="event-feed">
            {SESSION_EVENTS.map((ev, i) => (
              <div className="event-item" key={i}>
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
            </div>
            <div className="card-body">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="card-label">Speed</div>
                  <span className="telem-lg text-mono">{t.speed}<span className="telem-unit" style={{ fontSize: 14 }}>km/h</span></span>
                </div>
                <div>
                  <div className="card-label">RPM</div>
                  <span className="telem-md text-mono">{t.rpm.toLocaleString()}</span>
                </div>
                <div>
                  <div className="card-label">Gear</div>
                  <span className="telem-lg text-mono" style={{ color: 'var(--accent)' }}>{t.gear}</span>
                </div>
              </div>

              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="card-label">Throttle</span>
                  <span className="text-mono" style={{ fontSize: 12 }}>{t.throttle}%</span>
                </div>
                <div className="bar-track">
                  <div className="bar-fill green" style={{ width: `${t.throttle}%` }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="card-label">Brake</span>
                  <span className="text-mono" style={{ fontSize: 12 }}>{t.brake}%</span>
                </div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${t.brake}%`, background: 'var(--accent)' }} />
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
              <div className="flex gap-3">
                <div style={{ flex: 1 }}>
                  <div className="card-label mb-3" style={{ marginBottom: 6 }}>Front — {t.frontCompound}</div>
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
                  <div className="card-label mb-3" style={{ marginBottom: 6 }}>Rear — {t.rearCompound}</div>
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
              <th>Gap to Behind</th>
              <th style={{ width: 80 }}>Trend</th>
            </tr>
          </thead>
          <tbody>
            {RIVALS.map(r => {
              const posColor = r.pos === 1 ? 'var(--yellow)' : r.pos === 2 ? '#C0C0C0' : r.pos === 3 ? '#CD7F32' : 'var(--text-muted)';
              return (
                <tr key={r.pos} style={r.self ? { background: 'var(--accent-dim)' } : {}}>
                  <td>
                    <span className="text-mono" style={{ fontWeight: 800, fontSize: 13, color: posColor }}>P{r.pos}</span>
                  </td>
                  <td>
                    <span style={{ fontWeight: r.self ? 700 : 500, color: r.self ? 'var(--accent)' : 'var(--text)' }}>
                      {r.rider}
                    </span>
                    {r.self && <span className="badge badge-red" style={{ marginLeft: 8, fontSize: 9 }}>YOU</span>}
                  </td>
                  <td style={{ color: 'var(--text-dim)', fontSize: 12 }}>{r.team}</td>
                  <td className="mono" style={{ fontSize: 13 }}>{r.gap}</td>
                  <td className="mono" style={{ fontSize: 13, color: r.trend === 'up' ? 'var(--green)' : r.trend === 'down' ? 'var(--accent)' : 'var(--text-dim)' }}>
                    {r.gap_s || '—'}
                  </td>
                  <td>
                    <span style={{ fontSize: 16, lineHeight: 1 }}>
                      {r.trend === 'up' ? '↑' : r.trend === 'down' ? '↓' : '–'}
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
