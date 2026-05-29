import { useMemo, useState } from 'react';
import { Calendar, CloudRain, Sun, Wind, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp } from 'lucide-react';
import { useLiveTelemetry } from '../hooks/useLiveTelemetry';

// ── Static data ───────────────────────────────────────────────────────────────

const BASE_SCHEDULE = [
  { session: 'FP1',  day: 'Fri', time: '09:00', done: true,  result: '3rd — 1:34.102', pace: 94.102 },
  { session: 'FP2',  day: 'Fri', time: '14:00', done: true,  result: '5th — 1:33.847', pace: 93.847 },
  { session: 'FP3',  day: 'Sat', time: '09:30', done: true,  result: '4th — 1:33.612', pace: 93.612 },
  { session: 'Q1',   day: 'Sat', time: '14:30', done: true,  result: 'Q2 direct · P6',  pace: null  },
  { session: 'Q2',   day: 'Sat', time: '15:00', done: true,  result: 'P3 — 1:33.201',  pace: 93.201 },
  { session: 'RACE', day: 'Sun', time: '14:00', done: false, result: '',               pace: null  },
];

const WEATHER_FORECAST = [
  { time: '12:00', icon: 'sun',  temp: 25, wind: 8,  rain: 0,  humidity: 42 },
  { time: '13:00', icon: 'sun',  temp: 27, wind: 11, rain: 0,  humidity: 44 },
  { time: '14:00', icon: 'sun',  temp: 28, wind: 12, rain: 5,  humidity: 48 },
  { time: '15:00', icon: 'sun',  temp: 28, wind: 14, rain: 10, humidity: 52 },
  { time: '16:00', icon: 'rain', temp: 26, wind: 18, rain: 35, humidity: 68 },
];

interface Rival {
  rider: string;
  team: string;
  avg: string;
  avgSec: number;
  tyreChoice: string;
  strength: string;
  threat: string;
  self?: boolean;
  gridPos: number;
  s1: number; // sector delta vs KDD rider (s), negative = faster
  s2: number;
  s3: number;
  trend: 'up' | 'down' | 'flat';
}

const RIVALS_ANALYSIS: Rival[] = [
  { rider: 'M. Marquez',   team: 'Ducati',  avg: '1:33.04', avgSec: 93.04, tyreChoice: 'M/S', strength: 'Sector 3', threat: 'HIGH', gridPos: 1, s1: -0.09, s2: +0.05, s3: -0.33, trend: 'up'   },
  { rider: 'P. Espargaro', team: 'Aprilia', avg: '1:33.18', avgSec: 93.18, tyreChoice: 'M/M', strength: 'Sector 1', threat: 'MED',  gridPos: 2, s1: -0.12, s2: +0.11, s3: -0.22, trend: 'flat' },
  { rider: '#47 KDD',      team: 'KDD',     avg: '1:33.41', avgSec: 93.41, tyreChoice: 'M/S', strength: 'Sector 2', threat: '—',    gridPos: 3, s1: 0,      s2: 0,     s3: 0,     trend: 'up', self: true },
  { rider: 'J. Martin',    team: 'Pramac',  avg: '1:33.55', avgSec: 93.55, tyreChoice: 'S/S', strength: 'Sector 3', threat: 'LOW',  gridPos: 4, s1: +0.07, s2: -0.04, s3: +0.03, trend: 'down' },
];

const TYRE_ALLOCATION = [
  { compound: 'SOFT',   color: '#E03737', allocated: 3, remaining: 3, label: 'S' },
  { compound: 'MEDIUM', color: '#F59E0B', allocated: 5, remaining: 4, label: 'M' },
  { compound: 'HARD',   color: '#D1D5DB', allocated: 3, remaining: 3, label: 'H' },
];

// Sessions for pace evolution chart (exclude Q1 which has no lap time)
const PACE_SESSIONS = BASE_SCHEDULE.filter(s => s.pace !== null) as (typeof BASE_SCHEDULE[0] & { pace: number })[];

// ── Sub-components ────────────────────────────────────────────────────────────

function WeatherIcon({ icon }: { icon: string }) {
  if (icon === 'rain') return <CloudRain size={22} style={{ color: 'var(--blue)' }} />;
  if (icon === 'wind') return <Wind size={22} style={{ color: 'var(--text-muted)' }} />;
  return <Sun size={22} style={{ color: 'var(--yellow)' }} />;
}

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'flat' }) {
  if (trend === 'up')   return <TrendingUp   size={12} style={{ color: 'var(--green)' }} />;
  if (trend === 'down') return <TrendingDown size={12} style={{ color: 'var(--accent)' }} />;
  return <Minus size={12} style={{ color: 'var(--text-muted)' }} />;
}

// Session pace evolution chart
function PaceEvolutionChart({ sessions }: { sessions: (typeof PACE_SESSIONS) }) {
  const W = 560; const H = 80;
  const PAD = { t: 10, r: 16, b: 24, l: 44 };
  const cw = W - PAD.l - PAD.r;
  const ch = H - PAD.t - PAD.b;

  const paces = sessions.map(s => s.pace);
  const minP  = Math.min(...paces) - 0.3;
  const maxP  = Math.max(...paces) + 0.3;

  const xOf = (i: number) => PAD.l + (i / (sessions.length - 1)) * cw;
  const yOf = (p: number) => PAD.t + ch - ((p - minP) / (maxP - minP)) * ch;

  const pts = sessions.map((s, i) => `${xOf(i)},${yOf(s.pace)}`).join(' ');
  const bestPace = Math.min(...paces);

  return (
    <svg width="100%" height={H + 4}
      viewBox={`0 0 ${W} ${H + 4}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ display: 'block' }}>
      <defs>
        <linearGradient id="paceGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid */}
      {[minP + 0.3, minP + 0.6, minP + 0.9].map((p, i) => (
        <line key={i} x1={PAD.l} y1={yOf(p)} x2={W - PAD.r} y2={yOf(p)}
          stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      ))}

      {/* Area fill */}
      <polygon
        points={`${PAD.l},${PAD.t + ch} ${pts} ${W - PAD.r},${PAD.t + ch}`}
        fill="url(#paceGrad)" />

      {/* Line */}
      <polyline points={pts} fill="none"
        stroke="#3B82F6" strokeWidth="1.8" strokeLinejoin="round" />

      {/* Data points + labels */}
      {sessions.map((s, i) => {
        const cx = xOf(i); const cy = yOf(s.pace);
        const isBest = s.pace === bestPace;
        return (
          <g key={s.session}>
            <circle cx={cx} cy={cy} r={isBest ? 5 : 3.5}
              fill={isBest ? 'var(--green)' : '#3B82F6'}
              stroke={isBest ? 'rgba(34,197,94,0.4)' : 'rgba(59,130,246,0.4)'}
              strokeWidth={isBest ? 3 : 2} />
            <text x={cx} y={H - 2} textAnchor="middle"
              fill={isBest ? 'var(--green)' : '#535A6E'}
              fontSize="8" fontFamily="JetBrains Mono,monospace" fontWeight={isBest ? 700 : 400}>
              {s.session}
            </text>
          </g>
        );
      })}

      {/* Best pace annotation */}
      {(() => {
        const bi = paces.indexOf(bestPace);
        const cx = xOf(bi); const cy = yOf(bestPace);
        return (
          <text x={cx + 8} y={cy - 2}
            fill="var(--green)" fontSize="7"
            fontFamily="JetBrains Mono,monospace">
            ⚡ BEST
          </text>
        );
      })()}
    </svg>
  );
}

// Rival gap horizontal chart
function RivalGapChart({ rivals, selfAvgSec }: { rivals: Rival[]; selfAvgSec: number }) {
  const maxGap = 0.6;
  return (
    <div>
      {rivals.map(r => {
        const delta    = r.avgSec - selfAvgSec; // negative = rival faster
        const absDelta = Math.abs(delta);
        const pct      = Math.min(100, (absDelta / maxGap) * 100);
        const isFaster = delta < 0;
        return (
          <div key={r.rider} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{
                fontSize: 11,
                fontWeight: r.self ? 700 : 400,
                color: r.self ? 'var(--accent)' : 'var(--text)',
              }}>
                {r.rider}
                {r.self && <span style={{ marginLeft: 6, fontSize: 9, color: 'var(--accent)',
                  fontFamily: 'JetBrains Mono,monospace' }}>YOU</span>}
              </span>
              <span style={{
                fontSize: 10, fontFamily: 'JetBrains Mono,monospace',
                color: r.self ? 'var(--text-muted)' : isFaster ? 'var(--accent)' : 'var(--green)',
                fontWeight: 700,
              }}>
                {r.self ? 'REF' : `${isFaster ? '-' : '+'}${absDelta.toFixed(3)}s`}
              </span>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', height: 6,
              background: 'rgba(255,255,255,0.04)', borderRadius: 3, overflow: 'hidden',
            }}>
              {r.self ? (
                <div style={{ width: '100%', background: 'var(--accent)', opacity: 0.3, borderRadius: 3 }} />
              ) : (
                <>
                  {isFaster && (
                    <div style={{
                      width: `${pct}%`, background: 'var(--accent)',
                      borderRadius: 3, transition: 'width 0.5s',
                    }} />
                  )}
                  {!isFaster && (
                    <div style={{
                      width: `${pct}%`, background: 'var(--green)',
                      borderRadius: 3, transition: 'width 0.5s',
                    }} />
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export function PreGrandPrixPage() {
  const t = useLiveTelemetry();
  const [showRivalDetail, setShowRivalDetail] = useState(false);

  const lapCount  = t.lapCount;
  const position  = t.position;
  const lastLapSec = t.lastLap;

  const m = Math.floor(lastLapSec / 60);
  const s = lastLapSec % 60;
  const lastLapFormatted = `${m}:${s.toFixed(3).padStart(6, '0')}`;

  const raceStatus = lapCount < 23
    ? `Lap ${lapCount} / 23 · P${position} · ${lastLapFormatted}`
    : 'Race Complete';

  const schedule = BASE_SCHEDULE.map(row =>
    row.session === 'RACE' ? { ...row, result: raceStatus } : row
  );
  const racePct = Math.round((lapCount / 23) * 100);

  const selfRival  = RIVALS_ANALYSIS.find(r => r.self)!;
  const selfAvgSec = selfRival.avgSec;

  // Sector delta summary for self
  const sectorSummary = useMemo(() => [
    { sec: 'S1', delta: selfRival.s1, rivals: RIVALS_ANALYSIS.filter(r => !r.self).map(r => ({ name: r.rider, d: r.s1 })) },
    { sec: 'S2', delta: selfRival.s2, rivals: RIVALS_ANALYSIS.filter(r => !r.self).map(r => ({ name: r.rider, d: r.s2 })) },
    { sec: 'S3', delta: selfRival.s3, rivals: RIVALS_ANALYSIS.filter(r => !r.self).map(r => ({ name: r.rider, d: r.s3 })) },
  ], []);

  return (
    <div className="page">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Pre Grand Prix</h1>
          <p className="page-subtitle">GP Mugello · Italy · Round 7 of 20 · 2026 Season</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-red" style={{ animation: 'pulse 2s infinite' }}>RACE ACTIVE</span>
          <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
        </div>
      </div>

      {/* ── Race progress bar ────────────────────────────────────────────────── */}
      <div className="card mb-4">
        <div className="card-body" style={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>
              Race Progress — Lap {lapCount} of 23
            </span>
            <span className="text-mono" style={{ fontSize: 12, color: 'var(--accent)' }}>
              {racePct}%
            </span>
          </div>
          <div className="bar-track" style={{ height: 8 }}>
            <div className="bar-fill" style={{
              width: `${racePct}%`,
              background: 'var(--accent)',
              transition: 'width 1s ease',
            }} />
          </div>
          {/* Lap markers */}
          <div style={{ position: 'relative', height: 12 }}>
            {[6, 11, 17].map(l => (
              <div key={l} style={{
                position: 'absolute', left: `${(l / 23) * 100}%`,
                top: 2, transform: 'translateX(-50%)',
                fontSize: 8, color: 'var(--yellow)',
                fontFamily: 'JetBrains Mono,monospace',
              }}>
                L{l}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Start</span>
            <div style={{ display: 'flex', gap: 16 }}>
              <span style={{ fontSize: 11, color: 'var(--yellow)' }}>P{position} · {t.gap}</span>
              <span style={{ fontSize: 11, color: 'var(--green)' }}>Last: {lastLapFormatted}</span>
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Finish</span>
          </div>
        </div>
      </div>

      {/* ── Row 1: Schedule + Weather ────────────────────────────────────────── */}
      <div className="grid-2 mb-4">

        <div className="card">
          <div className="card-header">
            <span className="card-title">Weekend Schedule</span>
            <span className="badge badge-muted">Mugello · 5.245 km</span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Session</th><th>Day / Time</th><th>Result</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map(row => (
                <tr key={row.session}
                  style={row.session === 'RACE' ? { background: 'var(--accent-dim)' } : {}}>
                  <td>
                    <span className={`badge ${row.session === 'RACE' ? 'badge-red' : row.done ? 'badge-muted' : 'badge-green'}`}>
                      {row.session}
                    </span>
                  </td>
                  <td className="mono text-dim">{row.day} {row.time}</td>
                  <td style={{
                    fontSize: 13,
                    color: row.session === 'RACE' ? 'var(--accent)' : row.done ? 'var(--text)' : 'var(--text-muted)',
                    fontWeight: row.session === 'RACE' ? 700 : 400,
                  }}>
                    {row.result}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Pace evolution chart */}
          <div style={{ borderTop: '1px solid var(--border)', padding: '10px 10px 4px' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6,
              fontFamily: 'JetBrains Mono,monospace' }}>
              Practice → Qualifying pace evolution
            </div>
            <PaceEvolutionChart sessions={PACE_SESSIONS} />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Race Day Weather Forecast</span>
            <span className="badge badge-yellow">35% rain risk</span>
          </div>
          <div className="card-body">
            {/* Hourly forecast */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              {WEATHER_FORECAST.map(w => (
                <div key={w.time} style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{
                    fontSize: 10, color: 'var(--text-muted)', marginBottom: 6,
                    fontFamily: 'JetBrains Mono,monospace',
                  }}>
                    {w.time}
                  </div>
                  <WeatherIcon icon={w.icon} />
                  <div className="text-mono" style={{ fontSize: 15, fontWeight: 700, marginTop: 6 }}>
                    {w.temp}°
                  </div>
                  {/* Rain probability bar */}
                  <div style={{ marginTop: 6, marginBottom: 2 }}>
                    <div style={{
                      height: 28, background: 'rgba(255,255,255,0.04)',
                      borderRadius: 4, overflow: 'hidden',
                      position: 'relative', display: 'flex', alignItems: 'flex-end',
                    }}>
                      <div style={{
                        width: '100%',
                        height: `${Math.max(2, w.rain)}%`,
                        background: w.rain > 20
                          ? 'rgba(59,130,246,0.7)'
                          : w.rain > 0
                            ? 'rgba(59,130,246,0.4)'
                            : 'transparent',
                        transition: 'height 0.5s',
                      }} />
                    </div>
                    <div style={{
                      fontSize: 10, color: w.rain > 0 ? 'var(--blue)' : 'var(--text-muted)',
                      fontFamily: 'JetBrains Mono,monospace', marginTop: 2, fontWeight: w.rain > 20 ? 700 : 400,
                    }}>
                      {w.rain > 0 ? `${w.rain}%` : '—'}
                    </div>
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 1 }}>
                    {w.wind} km/h
                  </div>
                </div>
              ))}
            </div>

            <div className="divider" style={{ margin: '14px 0' }} />

            {/* Tyre allocation */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>
                Tyre Allocation
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                {TYRE_ALLOCATION.map(ty => (
                  <div key={ty.compound} style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      border: `3px solid ${ty.color}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 6px',
                      background: `${ty.color}18`,
                    }}>
                      <span className="text-mono" style={{
                        fontSize: 13, fontWeight: 700, color: ty.color,
                      }}>
                        {ty.label}
                      </span>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      {ty.remaining}/{ty.allocated} left
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="insight-panel" style={{ ['--dot-color' as string]: 'var(--yellow)' }}>
              <div className="insight-panel__title" style={{ color: 'var(--yellow)' }}>Rain Risk Alert</div>
              <p className="insight-panel__body">
                35% probability of light rain after 16:00. Race likely finishes dry.
                Wet compound allocation approved and loaded. Intermediate on standby.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 2: Rival intelligence ────────────────────────────────────────── */}
      <div className="card mb-4">
        <div className="card-header">
          <span className="card-title">Rival Intelligence Analysis</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="badge badge-blue">KDD Scout Agent</span>
            <button
              onClick={() => setShowRivalDetail(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '4px 10px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 5, cursor: 'pointer',
                color: 'var(--text-muted)',
                fontSize: 11, fontFamily: 'JetBrains Mono,monospace',
              }}
            >
              {showRivalDetail ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              {showRivalDetail ? 'Hide' : 'Sector detail'}
            </button>
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Grid</th><th>Rider</th><th>Team</th>
              <th>Race Pace</th><th>Tyre</th>
              <th>Strength</th><th>Trend</th><th>Threat</th>
            </tr>
          </thead>
          <tbody>
            {RIVALS_ANALYSIS.map(r => (
              <tr key={r.rider} style={r.self ? { background: 'var(--accent-dim)' } : {}}>
                <td className="mono" style={{ color: 'var(--text-muted)' }}>P{r.gridPos}</td>
                <td style={{
                  fontWeight: r.self ? 700 : 400,
                  color: r.self ? 'var(--accent)' : 'var(--text)',
                }}>
                  {r.rider}
                  {r.self && (
                    <span className="badge badge-red" style={{ marginLeft: 6, fontSize: 9 }}>
                      YOU
                    </span>
                  )}
                </td>
                <td className="text-dim">{r.team}</td>
                <td className="mono">{r.avg}</td>
                <td className="mono text-dim">{r.tyreChoice}</td>
                <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.strength}</td>
                <td><TrendIcon trend={r.trend} /></td>
                <td>
                  {r.threat !== '—' ? (
                    <span className={`badge ${r.threat === 'HIGH' ? 'badge-red' : r.threat === 'MED' ? 'badge-yellow' : 'badge-muted'}`}>
                      {r.threat}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Collapsible: gap chart + sector breakdown */}
        {showRivalDetail && (
          <div style={{
            borderTop: '1px solid var(--border)',
            padding: '16px',
            animation: 'pageEnter 0.2s var(--ease-out) both',
          }}>
            <div className="grid-2">
              {/* Gap chart */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>
                  Race Pace Gap to #47 KDD
                </div>
                <RivalGapChart rivals={RIVALS_ANALYSIS} selfAvgSec={selfAvgSec} />
              </div>

              {/* Sector breakdown */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>
                  Sector Time Delta vs #47 KDD (s)
                </div>
                <table className="data-table" style={{ fontSize: 11 }}>
                  <thead>
                    <tr><th>Rider</th><th>S1</th><th>S2</th><th>S3</th></tr>
                  </thead>
                  <tbody>
                    {RIVALS_ANALYSIS.map(r => (
                      <tr key={r.rider} style={r.self ? { background: 'var(--accent-dim)' } : {}}>
                        <td style={{ fontWeight: r.self ? 700 : 400 }}>{r.rider.split(' ')[1] ?? r.rider}</td>
                        {[r.s1, r.s2, r.s3].map((d, i) => (
                          <td key={i} className="mono" style={{
                            color: r.self ? 'var(--text-muted)' : d < 0 ? 'var(--accent)' : d > 0 ? 'var(--green)' : 'var(--text-muted)',
                            fontWeight: Math.abs(d) > 0.15 ? 700 : 400,
                          }}>
                            {r.self ? 'REF' : `${d > 0 ? '+' : ''}${d.toFixed(3)}`}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{
                  marginTop: 10, fontSize: 10, color: 'var(--text-muted)',
                  fontFamily: 'JetBrains Mono,monospace',
                }}>
                  negative = rival faster than KDD rider
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── KDD Pre-Race analysis ────────────────────────────────────────────── */}
      <div className="card mb-4">
        <div className="card-header">
          <span className="card-title">KDD Pre-Race Analysis</span>
          <span className="badge badge-green">Completed</span>
        </div>
        <div className="card-body">
          <div className="grid-3">
            {[
              {
                title: 'Qualifying P3 — Race pace P2',
                color: 'var(--green)',
                text: '17-lap simulation on Digital Twin predicts P2 finish with 1-stop strategy (L11, Hard rear). Race pace +0.2s/lap advantage over Martin. Start-line position P3 favors inside line at T1.',
              },
              {
                title: 'Tyre Strategy: 1-stop optimal',
                color: 'var(--yellow)',
                text: 'Medium front / Soft rear for 11 laps → Hard rear for 12 laps. Soft provides peak grip in laps 5–9. Hard compound stable to L23 at 78% wear. 2-stop only valid under SC window.',
              },
              {
                title: 'Sector 2 Opportunity',
                color: 'var(--blue)',
                text: 'KDD model identifies 0.08s gap to P2 in S2. Adjusted rear compression (–2 clicks) and engine brake EB3→EB4 should close the gap in laps 5–10. Marquez –0.33s in S3: concede, protect T2/T3.',
              },
            ].map(i => (
              <div key={i.title} className="insight-panel" style={{ ['--dot-color' as string]: i.color }}>
                <div className="insight-panel__title" style={{ color: i.color }}>{i.title}</div>
                <p className="insight-panel__body">{i.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Grid start strategy ──────────────────────────────────────────────── */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Grid Start Strategy</span>
          <span className="badge badge-muted">P3 — Row 1</span>
        </div>
        <div className="card-body">
          <div className="grid-4">
            {[
              { label: 'Grid Position',   value: 'P3',      color: 'var(--yellow)' },
              { label: 'Row',             value: 'Row 1',   color: 'var(--text)' },
              { label: 'Launch Map',      value: 'MAP-4',   color: 'var(--cyan)' },
              { label: 'TC Start',        value: 'TC6',     color: 'var(--green)' },
              { label: 'Target T1',       value: 'Inside',  color: 'var(--text)' },
              { label: 'Wheel-spin Risk', value: 'MED',     color: 'var(--yellow)' },
              { label: 'Clutch Slip',     value: '8%',      color: 'var(--text)' },
              { label: 'First Corner',    value: 'San Donato', color: 'var(--text-muted)' },
            ].map(m => (
              <div key={m.label}>
                <div className="card-label">{m.label}</div>
                <div className="text-mono" style={{ fontSize: 15, fontWeight: 700, color: m.color }}>
                  {m.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
