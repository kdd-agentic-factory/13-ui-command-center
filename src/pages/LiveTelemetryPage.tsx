/**
 * LiveTelemetryPage — Unified race telemetry dashboard.
 *
 * Structure:
 *   1. RACE HEADER — GP Mugello context, lap, position, speed, fuel, track status
 *   2. DATA LINK STATUS — Wi-Fi, ECU, IMU, GPS, logger quality
 *   3. MODE TOGGLE — live / analysis
 *   4. LIVE MODE: telemetry snapshot, sector splits, gauges, lap times,
 *                 speed trace, lap delta history, moto tyre temps, fuel & engine
 *   5. ANALYSIS MODE: synchronized multi-channel chart with controls
 *                     (window, axis, scale), channel panel, unified stats
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Activity, BarChart2, Radio, Wifi, Zap } from 'lucide-react';
import { useLiveTelemetry } from '../hooks/useLiveTelemetry';
import { useAnimeCount } from '../hooks/useAnimeCount';
import { MultiChannelChart, Channel, XAxisMode, ScaleMode } from '../components/MultiChannelChart';
import { WiFiDevicePanel } from '../components/WiFiDevicePanel';
import { MUGELLO_CIRCUIT } from '../domain/sessionTruth';
import { useSessionContext } from '../hooks/useSessionContext';
import { useGarage } from '../hooks/useGarage';

// ── Constants ─────────────────────────────────────────────────────────────────

const ANALYSIS_LEN = 300;            // 30 s @ 10 Hz
const LIVE_LEN     = 80;             // live speed trace
const RACE_LAPS    = 23;
const FUEL_BURN    = 0.95;           // kg/lap (matches useLiveTelemetry hook)
const FUEL_CAP     = 22;
const FUEL_CRITICAL_THRESHOLD = 2.5; // kg — below this triggers CRITICAL
const MUGELLO_TRACK_KM = MUGELLO_CIRCUIT.lengthKm;
const MUGELLO_TURNS = 15;
const MUGELLO_MAIN_STRAIGHT_M = 1141;

type Mode = 'live' | 'analysis';

// ── Race Header ───────────────────────────────────────────────────────────────

function RaceHeader({ lap, totalLaps, pos, gap, speed, fuel, clock, anomaly }: {
  lap: number; totalLaps: number; pos: number; gap: string; speed: number;
  fuel: number; clock: string; anomaly: boolean;
}) {
  const fuelCritical = fuel <= FUEL_CRITICAL_THRESHOLD;
  const fuelRange    = fuelCritical ? 0 : Math.max(0, +(fuel / FUEL_BURN).toFixed(1));

  return (
    <div className="card mb-4" style={{
      background: 'linear-gradient(135deg, rgba(224,55,55,0.12) 0%, rgba(11,13,18,0.8) 100%)',
      border: '1px solid rgba(224,55,55,0.25)',
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 12, alignItems: 'center' }}>
        {/* Left: Session info */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--accent)', fontFamily: 'JetBrains Mono,monospace', textTransform: 'uppercase' }}>RACE</div>
          <div style={{ fontSize: 12, fontFamily: 'JetBrains Mono,monospace', color: 'var(--text)' }}>
            GP Mugello · Italy · Round 7/20 · 2026
          </div>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace', marginTop: 2 }}>
            {MUGELLO_TRACK_KM} km · {MUGELLO_TURNS} turns · main straight {MUGELLO_MAIN_STRAIGHT_M} m
          </div>
        </div>

        {/* Center: Key metrics */}
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace', letterSpacing: '0.06em' }}>LAP</div>
            <div className="text-mono" style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', lineHeight: 1.1 }}>
              {lap}<span style={{ fontSize: 14, color: 'var(--text-muted)' }}>/{totalLaps}</span>
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace', letterSpacing: '0.06em' }}>POSITION</div>
            <div className="text-mono" style={{ fontSize: 22, fontWeight: 700, color: 'var(--yellow)', lineHeight: 1.1 }}>P{pos}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace', letterSpacing: '0.06em' }}>GAP</div>
            <div className="text-mono" style={{ fontSize: 16, fontWeight: 700, color: gap.includes('leader') ? 'var(--green)' : gap.startsWith('–') ? 'var(--green)' : 'var(--accent)', lineHeight: 1.1 }}>
              {gap.includes('leader') ? 'LEADER' : `${gap}s`}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace', letterSpacing: '0.06em' }}>SPEED</div>
            <div className="text-mono" style={{ fontSize: 16, fontWeight: 700, color: speed > 300 ? 'var(--accent)' : 'var(--text)', lineHeight: 1.1 }}>
              {speed}<span style={{ fontSize: 11, color: 'var(--text-muted)' }}> km/h</span>
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace', letterSpacing: '0.06em' }}>FUEL</div>
            <div className="text-mono" style={{ fontSize: 16, fontWeight: 700, color: fuelCritical ? 'var(--accent)' : 'var(--orange)', lineHeight: 1.1 }}>
              {fuel.toFixed(1)}<span style={{ fontSize: 11, color: 'var(--text-muted)' }}> kg</span>
            </div>
            {fuelCritical && (
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--accent)', fontFamily: 'JetBrains Mono,monospace', animation: 'pulse 1.5s ease-in-out infinite' }}>
                CRITICAL · {fuelRange} lap{fuelRange !== 1 ? 's' : ''} range
              </div>
            )}
            {!fuelCritical && (
              <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace' }}>
                ~{fuelRange} lap{fuelRange !== 1 ? 's' : ''} range
              </div>
            )}
          </div>
        </div>

        {/* Right: Track status */}
        <div style={{ textAlign: 'right' }}>
          <div style={{
            display: 'inline-block', padding: '3px 10px', borderRadius: 4,
            background: anomaly ? 'rgba(224,55,55,0.15)' : 'rgba(34,197,94,0.15)',
            border: `1px solid ${anomaly ? 'rgba(224,55,55,0.3)' : 'rgba(34,197,94,0.3)'}`,
            fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
            color: anomaly ? 'var(--accent)' : 'var(--green)',
            fontFamily: 'JetBrains Mono,monospace',
          }}>
            {anomaly ? 'YELLOW FLAG' : 'GREEN FLAG'}
          </div>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace', marginTop: 4 }}>
            {anomaly ? 'Incident on track' : 'All sectors clear'} · {clock}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Data Link Status ───────────────────────────────────────────────────────────

function DataLinkStatus({ showWifi, onToggleWifi }: {
  showWifi: boolean; onToggleWifi: () => void;
}) {
  const links = [
    { label: 'ECU OK',     color: '#22C55E' },
    { label: 'IMU active', color: '#22C55E' },
    { label: 'GPS 12 SAT', color: '#22C55E' },
    { label: 'Logger 99%', color: '#22C55E' },
    { label: 'Data 94%',   color: '#F59E0B' },
  ];

  return (
    <div className="card mb-4" style={{ padding: '6px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <button
          onClick={onToggleWifi}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '3px 10px', borderRadius: 5,
            background: showWifi ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${showWifi ? 'rgba(56,189,248,0.4)' : 'rgba(255,255,255,0.08)'}`,
            cursor: 'pointer', color: showWifi ? '#38BDF8' : 'var(--text-muted)',
            fontSize: 10, fontFamily: 'JetBrains Mono,monospace',
            transition: 'all 0.15s',
          }}
        ><Wifi size={11} /> WI-FI</button>
        {links.map(l => (
          <span key={l.label} style={{
            fontSize: 9, fontFamily: 'JetBrains Mono,monospace',
            padding: '2px 7px', borderRadius: 4,
            color: l.color, background: `color-mix(in srgb, ${l.color} 14%, transparent)`,
            letterSpacing: '0.04em',
          }}>{l.label}</span>
        ))}
        <span className="badge badge-green" style={{ marginLeft: 'auto' }}>● LIVE</span>
      </div>
    </div>
  );
}

// ── Speed Gauge SVG ───────────────────────────────────────────────────────────

function SpeedGaugeSVG({ value, max = 350 }: { value: number; max?: number }) {
  const pct = Math.min(1, value / max);
  const r = 68; const cx = 90; const cy = 95;
  const startAngle = -215; const sweepAngle = 250;
  const angle = startAngle + sweepAngle * pct;
  const toRad = (d: number) => (d * Math.PI) / 180;

  const arcPath = (start: number, end: number, radius: number) => {
    const s = toRad(start); const e = toRad(end);
    const x1 = cx + radius * Math.cos(s); const y1 = cy + radius * Math.sin(s);
    const x2 = cx + radius * Math.cos(e); const y2 = cy + radius * Math.sin(e);
    const large = Math.abs(end - start) > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2}`;
  };

  const needleX = cx + (r - 10) * Math.cos(toRad(angle));
  const needleY = cy + (r - 10) * Math.sin(toRad(angle));
  const isRedline = value > 300; const isWarning = value > 220;
  const arcColor  = isRedline ? '#E03737' : isWarning ? '#F59E0B' : '#22C55E';
  const glowId    = 'sg-glow';

  const ticks = [0, 50, 100, 150, 200, 250, 300, 350].map(v => {
    const a = toRad(startAngle + sweepAngle * (v / max));
    return {
      x1: cx + (r - 6) * Math.cos(a), y1: cy + (r - 6) * Math.sin(a),
      x2: cx + (r + 2) * Math.cos(a), y2: cy + (r + 2) * Math.sin(a),
      label: v,
    };
  });

  return (
    <svg width="180" height="175" viewBox="0 0 180 175" style={{ overflow: 'visible' }}>
      <defs>
        <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={isRedline ? '4' : '2'} result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="needle-glow">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <path d={arcPath(startAngle, startAngle + sweepAngle, r)} fill="none"
        stroke="rgba(255,255,255,0.05)" strokeWidth="10" strokeLinecap="round" />
      <path d={arcPath(startAngle, angle, r)} fill="none"
        stroke={arcColor} strokeWidth="10" strokeLinecap="round"
        filter={isRedline || isWarning ? `url(#${glowId})` : undefined}
        style={{ transition: 'stroke 0.15s cubic-bezier(0.16,1,0.3,1)' }} />
      {ticks.map(tk => (
        <line key={tk.label}
          x1={tk.x1} y1={tk.y1} x2={tk.x2} y2={tk.y2}
          stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeLinecap="round" />
      ))}
      <line x1={cx} y1={cy} x2={needleX} y2={needleY}
        stroke="white" strokeWidth="2" strokeLinecap="round"
        filter="url(#needle-glow)"
        style={{ transition: 'x2 0.1s cubic-bezier(0.16,1,0.3,1), y2 0.1s cubic-bezier(0.16,1,0.3,1)' }} />
      <circle cx={cx} cy={cy} r="5" fill={arcColor} style={{ transition: 'fill 0.15s' }} />
      <circle cx={cx} cy={cy} r="2.5" fill="white" />
      <text x={cx} y={cy + 26} textAnchor="middle" fill="white"
        fontSize="30" fontFamily="JetBrains Mono,monospace" fontWeight="700"
        style={{ fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </text>
      <text x={cx} y={cy + 42} textAnchor="middle" fill="#535A6E"
        fontSize="10" fontFamily="JetBrains Mono,monospace" letterSpacing="0.12em">
        KM/H
      </text>
    </svg>
  );
}

// ── Speed trace mini-chart ─────────────────────────────────────────────────────

function SpeedTrace({ history }: { history: number[] }) {
  const max = 350; const w = 600; const h = 80;
  if (history.length < 2) return null;
  const pts = history.map((v, i) => {
    const x = (i / (LIVE_LEN - 1)) * w;
    const y = h - (v / max) * h;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="speedGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E03737" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#E03737" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill="url(#speedGrad)" />
      <polyline points={pts} fill="none" stroke="#E03737" strokeWidth="1.5" />
    </svg>
  );
}

// ── RPM bar ───────────────────────────────────────────────────────────────────

function RPMBar({ value }: { value: number }) {
  const pct     = Math.min(100, (value / 15500) * 100);
  const redline = value > 14000;
  return (
    <div className="bar-track" style={{ height: 16 }}>
      <div className="bar-fill" style={{
        width: `${pct}%`,
        background: redline ? 'var(--accent)' : 'linear-gradient(90deg, var(--blue), var(--cyan))',
        transition: 'width 0.1s',
      }} />
    </div>
  );
}

// ── Animated KPI tile ─────────────────────────────────────────────────────────

function AnimKpi({ label, target, unit, color, decimals = 0 }: {
  label: string; target: number; unit: string; color: string; decimals?: number;
}) {
  const display = useAnimeCount(target, decimals, 700);
  return (
    <div className="stat-tile" style={{ textAlign: 'center' }}>
      <div className="stat-tile__label">{label}</div>
      <div className="text-mono" style={{
        fontSize: 28, fontWeight: 700, color, lineHeight: 1.1,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {display}
        <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 3 }}>{unit}</span>
      </div>
    </div>
  );
}

// ── Lap Delta History ─────────────────────────────────────────────────────────

interface LapRecord { lap: number; time: number; best: number; }

function LapDeltaHistory({ records }: { records: LapRecord[] }) {
  if (records.length === 0) {
    return (
      <div style={{
        textAlign: 'center', padding: '20px',
        color: 'var(--text-muted)', fontSize: 12,
      }}>
        Accumulating lap data…
      </div>
    );
  }
  const maxDelta = 2.5;
  return (
    <div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 56 }}>
        {records.map(r => {
          const delta  = r.time - r.best;
          const isBase = delta === 0;
          const pct    = isBase ? 4 : Math.min(100, (Math.abs(delta) / maxDelta) * 100);
          const color  = isBase ? 'var(--yellow)' : delta < 0 ? 'var(--green)' : 'var(--accent)';
          return (
            <div key={r.lap} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: '70%', height: `${Math.max(4, pct)}%`,
                minHeight: 4, maxHeight: 48,
                background: color, borderRadius: '2px 2px 0 0',
                transition: 'height 0.4s cubic-bezier(0.16,1,0.3,1)',
              }} />
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
        {records.map(r => {
          const delta = r.time - r.best;
          const isBase = delta === 0;
          return (
            <div key={r.lap} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{
                fontSize: 9, fontFamily: 'JetBrains Mono,monospace',
                color: isBase ? 'var(--yellow)' : delta < 0 ? 'var(--green)' : 'var(--accent)',
                fontWeight: isBase ? 700 : 400,
              }}>
                {isBase ? 'BEST' : `${delta > 0 ? '+' : ''}${delta.toFixed(2)}`}
              </div>
              <div style={{ fontSize: 8, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace' }}>
                L{r.lap}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Moto Tyre Card (shoulder/center layout) ────────────────────────────────────

function MotoTyreCard({ label, leftTemp, centerTemp, rightTemp, compound, age, pressure, wear }: {
  label: string; leftTemp: number; centerTemp: number; rightTemp: number;
  compound: string; age: number; pressure: number; wear: number;
}) {
  const sections = [
    { name: 'Left shoulder', temp: leftTemp },
    { name: 'Center',        temp: centerTemp },
    { name: 'Right shoulder', temp: rightTemp },
  ];

  const tempColor = (t: number) => {
    if (t > 105) return '#E03737';
    if (t > 90)  return '#F59E0B';
    if (t < 75)  return '#3B82F6';
    return '#22C55E';
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span className="card-label">{label}</span>
        <span style={{ fontSize: 9, fontFamily: 'JetBrains Mono,monospace', color: 'var(--text-muted)' }}>
          {compound} · {age} laps · {pressure.toFixed(2)} bar · {wear.toFixed(1)}% wear
        </span>
      </div>
      {/* 3-zone thermal bar */}
      <div style={{ display: 'flex', gap: 2, height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 4 }}>
        {sections.map((s, i) => (
          <div key={i} style={{ flex: 1, background: tempColor(s.temp), opacity: 0.9 }} />
        ))}
      </div>
      {sections.map((s, i) => (
        <div key={i} style={{
          display: 'flex', justifyContent: 'space-between', marginBottom: 2,
          fontSize: 11, fontFamily: 'JetBrains Mono,monospace',
        }}>
          <span style={{ color: 'var(--text-muted)' }}>{s.name}</span>
          <span style={{ color: tempColor(s.temp), fontWeight: 600 }}>{s.temp}°C</span>
        </div>
      ))}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 6 }}>
        <div style={{ padding: '5px 7px', borderRadius: 5, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>Pressure</div>
          <div className="text-mono" style={{ fontSize: 12, color: 'var(--cyan)', fontWeight: 700 }}>{pressure.toFixed(2)} bar</div>
        </div>
        <div style={{ padding: '5px 7px', borderRadius: 5, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>Wear</div>
          <div className="text-mono" style={{ fontSize: 12, color: wear > 55 ? 'var(--accent)' : wear > 35 ? 'var(--yellow)' : 'var(--green)', fontWeight: 700 }}>{wear.toFixed(1)}%</div>
        </div>
      </div>
    </div>
  );
}

// ── Sector Timing Strip ───────────────────────────────────────────────────────

function SectorTimingStrip({ trackPos }: { trackPos: number }) {
  // Mugello sector boundaries (approx track position fractions)
  const sectors = [
    { id: 'S1', from: 0,    to: 0.33, bestDelta: -0.012 },
    { id: 'S2', from: 0.33, to: 0.66, bestDelta: +0.034 },
    { id: 'S3', from: 0.66, to: 1.00, bestDelta: -0.008 },
  ];

  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {sectors.map(sec => {
        const active   = trackPos >= sec.from && trackPos < sec.to;
        const done     = trackPos >= sec.to;
        const isFaster = sec.bestDelta < 0;
        return (
          <div key={sec.id} style={{
            flex: 1, padding: '8px 10px',
            background: active
              ? 'rgba(255,255,255,0.07)'
              : done
                ? `${isFaster ? 'rgba(34,197,94,0.08)' : 'rgba(224,55,55,0.08)'}`
                : 'rgba(255,255,255,0.03)',
            border: `1px solid ${active ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.06)'}`,
            borderRadius: 6,
            transition: 'all 0.3s',
          }}>
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
              color: active ? 'var(--text)' : done ? (isFaster ? 'var(--green)' : 'var(--accent)') : 'var(--text-muted)',
              fontFamily: 'JetBrains Mono,monospace',
            }}>
              {sec.id}
            </div>
            {done && (
              <div className="text-mono" style={{
                fontSize: 13, fontWeight: 700, marginTop: 2,
                color: isFaster ? 'var(--green)' : 'var(--accent)',
              }}>
                {sec.bestDelta > 0 ? '+' : ''}{sec.bestDelta.toFixed(3)}s
              </div>
            )}
            {active && (
              <div style={{
                width: '100%', height: 2, background: 'rgba(255,255,255,0.3)',
                borderRadius: 1, marginTop: 6,
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute', left: 0, top: 0, height: '100%',
                  width: `${((trackPos - sec.from) / (sec.to - sec.from)) * 100}%`,
                  background: 'white',
                  transition: 'width 0.1s linear',
                }} />
              </div>
            )}
            {!done && !active && (
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>—</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Channel statistics strip (analysis mode) ──────────────────────────────────

function ChannelStatsStrip({ channels }: { channels: Channel[] }) {
  const stats = useMemo(() => channels.map(ch => {
    const d = ch.data;
    if (d.length === 0) return { id: ch.id, name: ch.name, unit: ch.unit, color: ch.color, min: 0, max: 0, avg: 0, last: 0 };
    const min = Math.min(...d);
    const max = Math.max(...d);
    const avg = d.reduce((a, b) => a + b, 0) / d.length;
    const last = d[d.length - 1] ?? 0;
    return { id: ch.id, name: ch.name, unit: ch.unit, color: ch.color, min, max, avg, last };
  }), [channels]);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(6, 1fr)',
      gap: 8,
    }}>
      {stats.map(s => (
        <div key={s.id} style={{
          padding: '10px 12px',
          background: 'rgba(255,255,255,0.03)',
          border: `1px solid ${s.color}33`,
          borderRadius: 6,
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            marginBottom: 8,
          }}>
            <span style={{
              fontSize: 10, fontWeight: 700,
              color: s.color, letterSpacing: '0.08em',
              fontFamily: 'JetBrains Mono,monospace',
            }}>
              {s.name}
            </span>
            <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace' }}>
              {s.unit}
            </span>
          </div>
          {[
            { label: 'MAX',  val: s.max,  color: s.color },
            { label: 'AVG',  val: s.avg,  color: 'var(--text-muted)' },
            { label: 'MIN',  val: s.min,  color: 'var(--text-muted)' },
            { label: 'LAST', val: s.last, color: 'var(--text)' },
          ].map(row => (
            <div key={row.label} style={{
              display: 'flex', justifyContent: 'space-between',
              marginBottom: 3,
            }}>
              <span style={{
                fontSize: 9, color: 'var(--text-muted)',
                fontFamily: 'JetBrains Mono,monospace',
              }}>
                {row.label}
              </span>
              <span style={{
                fontSize: 10, fontFamily: 'JetBrains Mono,monospace',
                color: row.color, fontWeight: row.label === 'MAX' ? 700 : 400,
              }}>
                {s.id === 'gear'
                  ? row.val.toFixed(0)
                  : row.val >= 1000
                    ? (row.val / 1000).toFixed(1) + 'k'
                    : row.val.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function LiveTelemetryPage() {
  const session = useSessionContext();
  const garage = useGarage();
  const t = useLiveTelemetry();
  const [mode, setMode]         = useState<Mode>('live');
  const [showWifi, setShowWifi] = useState(false);

  // ── History buffers ───────────────────────────────────────────────────────
  const speedBuf    = useRef<number[]>([]);
  const rpmBuf      = useRef<number[]>([]);
  const throttleBuf = useRef<number[]>([]);
  const brakeBuf    = useRef<number[]>([]);
  const leanBuf     = useRef<number[]>([]);
  const gearBuf     = useRef<number[]>([]);
  const latgBuf     = useRef<number[]>([]);
  const ftyreBuf    = useRef<number[]>([]);
  const rtyreBuf    = useRef<number[]>([]);
  const rgripBuf    = useRef<number[]>([]);

  const [speedHistory,      setSpeedHistory]      = useState<number[]>([]);
  const [analysisSnapshot,  setAnalysisSnapshot]  = useState<number[][]>([[], [], [], [], [], [], [], [], [], []]);
  const [lapRecords,        setLapRecords]         = useState<LapRecord[]>([]);
  const [visibleCh,         setVisibleCh]          = useState<Set<string>>(() => new Set(['speed', 'rpm', 'thr', 'brake', 'lean', 'gear']));
  const prevLapCount = useRef<number>(0);
  const bestLapRef   = useRef<number>(Infinity);

  useEffect(() => {
    const push = (buf: React.MutableRefObject<number[]>, val: number, cap: number) => {
      buf.current = [...buf.current, val].slice(-cap);
    };
    push(speedBuf,    t.speed,     ANALYSIS_LEN);
    push(rpmBuf,      t.rpm,       ANALYSIS_LEN);
    push(throttleBuf, t.throttle,  ANALYSIS_LEN);
    push(brakeBuf,    t.brake,     ANALYSIS_LEN);
    push(leanBuf,     t.leanAngle, ANALYSIS_LEN);
    push(gearBuf,     t.gear,      ANALYSIS_LEN);
    const rtyreVal = (t.tireRearLeft + t.tireRearRight) / 2;
    push(latgBuf,  Math.abs(Math.tan((t.leanAngle * Math.PI) / 180)), ANALYSIS_LEN);
    push(ftyreBuf, (t.tireFrontLeft + t.tireFrontRight) / 2, ANALYSIS_LEN);
    push(rtyreBuf, rtyreVal, ANALYSIS_LEN);
    push(rgripBuf, Math.max(60, 96 - (t.rearTyreAge || 0) * 0.6 - Math.max(0, rtyreVal - 110) * 0.4), ANALYSIS_LEN);

    setSpeedHistory(prev => [...prev, t.speed].slice(-LIVE_LEN));

    // Track new laps for delta history
    if (t.lapCount > prevLapCount.current && t.lastLap > 0) {
      if (t.lastLap < bestLapRef.current) bestLapRef.current = t.lastLap;
      const best = bestLapRef.current;
      setLapRecords(prev => [
        ...prev,
        { lap: t.lapCount, time: t.lastLap, best },
      ].slice(-8));
    }
    prevLapCount.current = t.lapCount;

    if (mode === 'analysis') {
      setAnalysisSnapshot([
        [...speedBuf.current],
        [...rpmBuf.current],
        [...throttleBuf.current],
        [...brakeBuf.current],
        [...leanBuf.current],
        [...gearBuf.current],
        [...latgBuf.current],
        [...ftyreBuf.current],
        [...rtyreBuf.current],
        [...rgripBuf.current],
      ]);
    }
  }, [t.speed, t.rpm, t.throttle, t.brake, t.leanAngle, t.gear,
      t.lapCount, t.lastLap, t.tireFrontLeft, t.tireFrontRight,
      t.tireRearLeft, t.tireRearRight, t.rearTyreAge, mode]);

  const handleModeChange = useCallback((m: Mode) => {
    if (m === 'analysis') {
      setAnalysisSnapshot([
        [...speedBuf.current],
        [...rpmBuf.current],
        [...throttleBuf.current],
        [...brakeBuf.current],
        [...leanBuf.current],
        [...gearBuf.current],
        [...latgBuf.current],
        [...ftyreBuf.current],
        [...rtyreBuf.current],
        [...rgripBuf.current],
      ]);
    }
    setMode(m);
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = (s % 60).toFixed(3).padStart(6, '0');
    return `${m}:${sec}`;
  };

  // G-force estimate from lean angle (lateral G ≈ tan(lean°))
  const gForce = useMemo(() => {
    const radLean = (t.leanAngle * Math.PI) / 180;
    return Math.abs(Math.tan(radLean));
  }, [t.leanAngle]);

  // ── Analysis channels ─────────────────────────────────────────────────────
  const CHANNEL_DEFS: (Omit<Channel, 'data'> & { group: string; quality: string })[] = [
    { id: 'speed',  name: 'SPEED',    unit: 'km/h', color: '#E03737', range: [0, 350],   panelHeight: 60, group: 'Bike Dynamics', quality: 'OK' },
    { id: 'rpm',    name: 'RPM',      unit: 'rpm',  color: '#38BDF8', range: [0, 15500], panelHeight: 52, group: 'Bike Dynamics', quality: 'OK' },
    { id: 'thr',    name: 'THROTTLE', unit: '%',    color: '#22C55E', range: [0, 100],   panelHeight: 48, group: 'Rider Inputs',  quality: 'OK' },
    { id: 'brake',  name: 'BRAKE',    unit: '%',    color: '#F59E0B', range: [0, 100],   panelHeight: 48, group: 'Rider Inputs',  quality: 'OK' },
    { id: 'lean',   name: 'LEAN',     unit: '°',    color: '#A78BFA', range: [0, 63],    panelHeight: 48, group: 'Bike Dynamics', quality: 'OK' },
    { id: 'gear',   name: 'GEAR',     unit: '',     color: '#FCD34D', range: [1, 6],     panelHeight: 40, group: 'Bike Dynamics', quality: 'OK', step: true },
    { id: 'latg',   name: 'LAT G',    unit: 'g',    color: '#F472B6', range: [0, 2],     panelHeight: 46, group: 'Bike Dynamics', quality: 'OK' },
    { id: 'ftyre',  name: 'F TYRE',   unit: '°C',   color: '#60A5FA', range: [40, 140],  panelHeight: 46, group: 'Tyres / Grip',  quality: 'OK' },
    { id: 'rtyre',  name: 'R TYRE',   unit: '°C',   color: '#FB923C', range: [40, 140],  panelHeight: 46, group: 'Tyres / Grip',  quality: 'OK' },
    { id: 'rgrip',  name: 'R GRIP',   unit: '%',    color: '#34D399', range: [60, 100],  panelHeight: 46, group: 'Tyres / Grip',  quality: 'est' },
  ];

  // ── Analysis controls state — MUST be before allChannels (avoids TDZ) ──
  const [xAxisMode,    setXAxisMode]    = useState<XAxisMode>('time');
  const [scaleMode,    setScaleMode]    = useState<ScaleMode>('auto');
  const [analysisWin,  setAnalysisWin]  = useState<number>(ANALYSIS_LEN);
  const [compare,      setCompare]      = useState<'none' | 'best' | 'previous' | 'ideal'>('none');
  const [cursorValues, setCursorValues] = useState<Record<string, number> | null>(null);
  const [cursorIndex,  setCursorIndex]  = useState<number | null>(null);

  const handleCursor = useCallback((cursor: { index: number; values: Record<string, number> } | null) => {
    setCursorIndex(cursor?.index ?? null);
    setCursorValues(cursor?.values ?? null);
  }, []);

  // ── Windowed analysis snapshot ───────────────────────────────────────
  const displaySnapshot = useMemo(() => {
    const win = Math.min(analysisWin, analysisSnapshot[0]?.length || 0);
    if (win === 0 || analysisSnapshot[0]?.length === undefined) return analysisSnapshot;
    return analysisSnapshot.map(buf => buf.slice(-win));
  }, [analysisSnapshot, analysisWin]);

  // Reference ghost per compare mode: best = cleaner/faster, previous = the
  // same shape slightly slower and shifted, ideal = the noise-free line.
  function refSeries(data: number[]): number[] | undefined {
    if (compare === 'none' || data.length < 8) return undefined;
    const smooth = (w: number) => data.map((_, i) => {
      let acc = 0, n = 0;
      for (let j = Math.max(0, i - w); j <= Math.min(data.length - 1, i + w); j++) { acc += data[j]; n++; }
      return acc / n;
    });
    if (compare === 'ideal') return smooth(6);
    if (compare === 'best') return smooth(3).map(v => v * 0.985);
    const sm = smooth(3).map(v => v * 1.012); // previous lap: slightly slower, shifted
    return sm.map((_, i) => sm[Math.max(0, i - 4)]);
  }

  const allChannels = CHANNEL_DEFS.map((def, i) => {
    const data = displaySnapshot[i] ?? [];
    return { ...def, data, refData: def.id === 'gear' ? undefined : refSeries(data) };
  });
  const channels: Channel[] = allChannels.filter(c => visibleCh.has(c.id))
    .map(({ id, name, unit, color, range, panelHeight, data }) => ({ id, name, unit, color, range, panelHeight, data }));
  const channelGroups = ['Rider Inputs', 'Bike Dynamics', 'Tyres / Grip'];
  function toggleCh(id: string) {
    setVisibleCh(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  // ── Live Telemetry clock ─────────────────────────────────────────────────
  const [clock, setClock] = useState('');

  useEffect(() => {
    const id = setInterval(() => {
      setClock(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // ── Speed trace min/max/current ──────────────────────────────────────
  const speedStats = useMemo(() => {
    if (speedHistory.length < 2) return { min: t.speed, max: t.speed, current: t.speed };
    return {
      min: Math.min(...speedHistory),
      max: Math.max(...speedHistory),
      current: t.speed,
    };
  }, [speedHistory, t.speed]);

  return (
    <div className="page">

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* RACE HEADER                                                        */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <RaceHeader
        lap={t.lapCount}
        totalLaps={RACE_LAPS}
        pos={t.position}
        gap={t.gap}
        speed={t.speed}
        fuel={t.fuelLoad}
        clock={clock}
        anomaly={t.lapAnomaly}
      />

      {/* DATA LINK STATUS */}
      <DataLinkStatus showWifi={showWifi} onToggleWifi={() => setShowWifi(v => !v)} />
      {garage.telemetryLimited && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderRadius: 8, margin: '0 0 10px', background: 'rgba(225,6,0,0.06)', border: '1px solid var(--accent)', fontSize: 11, color: 'var(--text)' }}>
          <Zap size={12} style={{ color: 'var(--accent)' }} />
          <strong style={{ color: 'var(--accent)', fontFamily: 'JetBrains Mono,monospace' }}>LIMITED TELEMETRY</strong>
          <span>{garage.profile.bike.brand} {garage.profile.bike.model} provides GPS only — ECU channels (throttle, RPM, gear, TC) are estimated from GPS/IMU, not measured.</span>
        </div>
      )}

      {/* Wi-Fi device panel */}
      {showWifi && (
        <div style={{ marginBottom: 24, animation: 'pageEnter 0.2s var(--ease-out) both' }}>
          <WiFiDevicePanel onClose={() => setShowWifi(false)} />
        </div>
      )}

      {/* ── Mode toggle ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Live Telemetry</h1>
          <p className="page-subtitle">
            {session.ctx.dataMode === 'live' ? 'Real-time data stream' : session.ctx.dataMode === 'recorded' ? 'Recorded session stream (replay)' : 'Sample data stream (not live)'}{session.ctx.setup.source ? ` · ${session.ctx.setup.source}` : ''} · 10 Hz · Lap {t.lapCount}
            {mode === 'analysis' && ` · Analysis window: ${analysisWin / 10}s`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div style={{
            display: 'flex', background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 3,
          }}>
            {(['live', 'analysis'] as Mode[]).map(m => (
              <button key={m}
                onClick={() => handleModeChange(m)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 14px',
                  background: mode === m ? 'rgba(255,255,255,0.09)' : 'transparent',
                  border: 'none', borderRadius: 6, cursor: 'pointer',
                  color: mode === m ? 'var(--text)' : 'var(--text-muted)',
                  fontSize: 11, fontFamily: 'JetBrains Mono,monospace',
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  transition: 'background 0.15s, color 0.15s',
                }}
              >
                {m === 'live' ? <Activity size={11} /> : <BarChart2 size={11} />}
                {m}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Radio size={14} style={{ color: 'var(--green)' }} />
            <span className="badge badge-green">LIVE</span>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* LIVE MODE                                                           */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {mode === 'live' && (
        <>
          {/* Live Snapshot — current zone, phase, key values */}
          <div className="card mb-4">
            <div className="card-header">
              <span className="card-title">LIVE SNAPSHOT</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace' }}>
                Lap {t.lapCount} · track pos {(t.trackPos * 100).toFixed(0)}%
              </span>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
                {[
                  { label: 'Speed',     val: `${t.speed} km/h`,            color: 'var(--accent)' },
                  { label: 'RPM',       val: t.rpm.toLocaleString(),       color: 'var(--blue)' },
                  { label: 'Gear',      val: String(t.gear),               color: 'var(--yellow)' },
                  { label: 'Throttle',  val: `${t.throttle}%`,             color: 'var(--green)' },
                  { label: 'Brake',     val: `${t.brake}%`,                color: 'var(--orange)' },
                  { label: 'Lean',      val: `${t.leanAngle}°`,            color: 'var(--purple)' },
                  { label: 'Lat G',     val: `${gForce.toFixed(2)}g`,      color: 'var(--cyan)' },
                ].map(k => (
                  <div key={k.label} style={{ textAlign: 'center', padding: '8px 4px', background: 'rgba(255,255,255,0.03)', borderRadius: 6 }}>
                    <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace', letterSpacing: '0.06em' }}>{k.label}</div>
                    <div className="text-mono" style={{ fontSize: 16, fontWeight: 700, color: k.color, lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}>{k.val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sector timing strip */}
          <div className="card mb-4">
            <div className="card-header">
              <span className="card-title">SECTOR SPLITS — Lap {t.lapCount}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace' }}>
                track pos {(t.trackPos * 100).toFixed(0)}%
              </span>
            </div>
            <div className="card-body" style={{ padding: '10px 16px' }}>
              <SectorTimingStrip trackPos={t.trackPos} />
            </div>
          </div>

          {/* Primary gauges */}
          <div className="grid-4 mb-4">
            {/* Speed gauge */}
            <div className="card">
              <div className="card-header"><span className="card-title">Speed</span></div>
              <div className="card-body" style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 0' }}>
                <SpeedGaugeSVG value={t.speed} />
              </div>
            </div>

            {/* Gear + RPM */}
            <div className="card flex-col">
              <div className="card-header"><span className="card-title">Gear / RPM</span></div>
              <div className="card-body" style={{ flex: 1 }}>
                <div className="gear-display" style={{ fontSize: 80, marginBottom: 16 }}>{t.gear}</div>
                <div className="card-label mb-3" style={{ marginBottom: 4 }}>RPM — {t.rpm.toLocaleString()}</div>
                <RPMBar value={t.rpm} />
                <div className="flex items-center justify-between mt-2">
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>0</span>
                  <span style={{ fontSize: 11, color: 'var(--accent)' }}>14k REDLINE</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>15.5k</span>
                </div>
              </div>
            </div>

            {/* Throttle / Brake / G-Force */}
            <div className="card">
              <div className="card-header"><span className="card-title">Controls</span></div>
              <div className="card-body flex-col gap-4" style={{ gap: 18 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span className="card-label">Throttle</span>
                    <span className="telem-md text-mono" style={{ color: 'var(--green)' }}>{t.throttle}%</span>
                  </div>
                  <div className="bar-track" style={{ height: 20 }}>
                    <div className="bar-fill green" style={{ width: `${t.throttle}%`, transition: 'width 0.1s' }} />
                  </div>
                </div>
                <div style={{ padding: 10, borderRadius: 8, border: '1px solid rgba(224,55,55,0.18)', background: 'rgba(224,55,55,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span className="card-label">Brake pressure split</span>
                    <span className="text-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>total {t.brake}%</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span className="card-label">Front brake</span>
                        <span className="telem-md text-mono" style={{ color: 'var(--accent)' }}>{(t.brakePressureFront * 0.11).toFixed(1)} bar</span>
                      </div>
                      <div className="bar-track" style={{ height: 14 }}>
                        <div className="bar-fill" style={{ width: `${(t.brakePressureFront * 0.11).toFixed(1)} bar`, background: 'var(--accent)', transition: 'width 0.1s' }} />
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span className="card-label">Rear brake</span>
                        <span className="telem-md text-mono" style={{ color: 'var(--orange)' }}>{(t.brakePressureRear * 0.05).toFixed(1)} bar</span>
                      </div>
                      <div className="bar-track" style={{ height: 14 }}>
                        <div className="bar-fill" style={{ width: `${(t.brakePressureRear * 0.05).toFixed(1)} bar`, background: 'var(--orange)', transition: 'width 0.1s' }} />
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span className="card-label">Lean / Lateral G</span>
                    <span style={{ display: 'flex', gap: 8 }}>
                      <span className="telem-md text-mono" style={{ color: 'var(--purple)' }}>{t.leanAngle}°</span>
                      <span className="text-mono" style={{ fontSize: 13, color: 'var(--cyan)', fontWeight: 600 }}>
                        <Zap size={10} style={{ display: 'inline', verticalAlign: 'middle' }} />{gForce.toFixed(2)}G
                      </span>
                    </span>
                  </div>
                  <div className="bar-track" style={{ height: 20 }}>
                    <div className="bar-fill" style={{ width: `${(t.leanAngle / 63) * 100}%`, background: 'var(--purple)', transition: 'width 0.1s' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Lap times */}
            <div className="card">
              <div className="card-header"><span className="card-title">Lap Times</span></div>
              <div className="card-body flex-col gap-4" style={{ gap: 16 }}>
                <div>
                  <div className="card-label">Current Lap</div>
                  <div className="telem-md text-mono">{formatTime(t.lapTime)}</div>
                </div>
                <div className="divider" />
                <div>
                  <div className="card-label">Last Lap</div>
                  <div className="telem-md text-mono">{formatTime(t.lastLap)}</div>
                  <div style={{
                    fontSize: 12, marginTop: 2,
                    color: t.lastLap > t.bestLap ? 'var(--accent)' : 'var(--green)',
                  }}>
                    {t.lastLap > t.bestLap
                      ? `+${(t.lastLap - t.bestLap).toFixed(3)} vs best`
                      : '⚡ New best!'}
                  </div>
                </div>
                <div className="divider" />
                <div>
                  <div className="card-label">Personal Best</div>
                  <div className="telem-md text-mono" style={{ color: 'var(--yellow)' }}>{formatTime(t.bestLap)}</div>
                  <div style={{ fontSize: 12, color: 'var(--yellow)', marginTop: 2 }}>⚡ Best of race</div>
                </div>
              </div>
            </div>
          </div>

          {/* Speed trace with min/max/current */}
          <div className="card mb-4">
            <div className="card-header">
              <span className="card-title">Speed Trace — Last {LIVE_LEN} samples · {LIVE_LEN / 10}s window</span>
              <div className="flex items-center gap-3">
                <span className="text-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                  min {speedStats.min} · max {speedStats.max}
                </span>
                <span className="text-mono" style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700 }}>
                  {t.speed} km/h
                </span>
              </div>
            </div>
            <div style={{ background: 'var(--bg-surface)' }}>
              <SpeedTrace history={speedHistory} />
            </div>
          </div>

          {/* Lap delta history + Tyres + Fuel */}
          <div className="grid-3 mb-4">

            {/* Lap delta history */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Lap Delta History</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace' }}>
                  last 8 laps vs personal best
                </span>
              </div>
              <div className="card-body">
                <LapDeltaHistory records={lapRecords} />
              </div>
            </div>

            {/* Moto Tyre Temperatures — shoulder/center layout */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Tyre Temperatures</span>
                <span className="badge badge-orange">
                  Front {t.frontCompound} · Rear {t.rearCompound} · age {t.rearTyreAge} laps
                </span>
              </div>
              <div className="card-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <MotoTyreCard
                    label="FRONT TYRE"
                    leftTemp={t.tireFrontLeft}
                    centerTemp={Math.round((t.tireFrontLeft + t.tireFrontRight) / 2)}
                    rightTemp={t.tireFrontRight}
                    compound={t.frontCompound}
                    age={t.frontTyreAge}
                    pressure={t.tirePressureFront}
                    wear={t.tireWearFront}
                  />
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '4px 0' }} />
                  <MotoTyreCard
                    label="REAR TYRE"
                    leftTemp={t.tireRearLeft}
                    centerTemp={Math.round((t.tireRearLeft + t.tireRearRight) / 2)}
                    rightTemp={t.tireRearRight}
                    compound={t.rearCompound}
                    age={t.rearTyreAge}
                    pressure={t.tirePressureRear}
                    wear={t.tireWearRear}
                  />
                </div>
              </div>
            </div>

            {/* Fuel & Engine — fixed range calculation */}
            <div className="card">
              <div className="card-header"><span className="card-title">Fuel & Engine</span></div>
              <div className="card-body">
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span className="card-label">Fuel Load</span>
                    <span className="telem-md text-mono">
                      {t.fuelLoad}
                      <span style={{ color: 'var(--text-muted)', fontSize: 14 }}> kg</span>
                    </span>
                  </div>
                  <div className="bar-track" style={{ height: 14 }}>
                    <div className="bar-fill" style={{
                      width: `${(t.fuelLoad / FUEL_CAP) * 100}%`,
                      background: t.fuelLoad <= FUEL_CRITICAL_THRESHOLD ? 'var(--accent)' : 'var(--orange)',
                      transition: 'all 0.3s',
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>0 kg</span>
                    <span style={{
                      fontSize: 11, fontFamily: 'JetBrains Mono,monospace',
                      color: t.fuelLoad <= FUEL_CRITICAL_THRESHOLD ? 'var(--accent)' : 'var(--orange)',
                      fontWeight: t.fuelLoad <= FUEL_CRITICAL_THRESHOLD ? 700 : 400,
                    }}>
                      ~{(t.fuelLoad / FUEL_BURN).toFixed(1)} laps range
                      {t.fuelLoad <= FUEL_CRITICAL_THRESHOLD && ' · CRITICAL'}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{FUEL_CAP} kg</span>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace', marginTop: 2 }}>
                    Fuel burn {FUEL_BURN} kg/lap
                  </div>
                </div>
                <div className="divider" />
                <div style={{ marginTop: 14 }}>
                  <div className="card-label" style={{ marginBottom: 10 }}>Engine Parameters</div>
                  {[
                    { name: 'Engine Map',      value: '6'   },
                    { name: 'Traction Control', value: 'TC3' },
                    { name: 'Engine Brake',     value: 'EB4' },
                    { name: 'Wheelie Control',  value: 'WC2' },
                    { name: 'Anti-hop Clutch',  value: 'ON'  },
                  ].map(p => (
                    <div key={p.name} className="setup-row" style={{ padding: '6px 0' }}>
                      <span className="setup-name">{p.name}</span>
                      <span className="setup-val text-mono" style={{ color: 'var(--cyan)' }}>{p.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* ANALYSIS MODE                                                       */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {mode === 'analysis' && (
        <>
          {/* Current values strip — readout mode */}
          <div className="grid-4 mb-4">
            <AnimKpi label="Current Speed" target={t.speed}    unit="km/h" color="var(--accent)"  />
            <AnimKpi label="RPM"           target={t.rpm}      unit="rpm"  color="var(--blue)"    />
            <AnimKpi label="Throttle"      target={t.throttle} unit="%"    color="var(--green)"   />
            <AnimKpi label="Brake"         target={t.brake}    unit="%"    color="var(--orange)"  />
          </div>

          {/* Chart controls */}
          <div className="card mb-4" style={{ padding: '8px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              {/* Window selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Window</span>
                <div style={{ display: 'flex', gap: 2 }}>
                  {[
                    { label: '10s',  val: 100 },
                    { label: '30s',  val: 300 },
                    { label: '60s',  val: 600 },
                  ].map(w => (
                    <button key={w.label} onClick={() => setAnalysisWin(w.val)}
                      style={{
                        padding: '2px 8px', borderRadius: 4, border: 'none', cursor: 'pointer',
                        fontSize: 10, fontFamily: 'JetBrains Mono,monospace',
                        background: analysisWin === w.val ? 'rgba(255,255,255,0.1)' : 'transparent',
                        color: analysisWin === w.val ? 'var(--text)' : 'var(--text-muted)',
                      }}
                    >{w.label}</button>
                  ))}
                </div>
              </div>

              {/* X-axis selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace', letterSpacing: '0.06em', textTransform: 'uppercase' }}>X-axis</span>
                <div style={{ display: 'flex', gap: 2 }}>
                  {(['time', 'distance', 'trackPos'] as XAxisMode[]).map(m => (
                    <button key={m} onClick={() => setXAxisMode(m)}
                      style={{
                        padding: '2px 8px', borderRadius: 4, border: 'none', cursor: 'pointer',
                        fontSize: 10, fontFamily: 'JetBrains Mono,monospace',
                        background: xAxisMode === m ? 'rgba(255,255,255,0.1)' : 'transparent',
                        color: xAxisMode === m ? 'var(--text)' : 'var(--text-muted)',
                      }}
                    >{m === 'trackPos' ? 'Track %' : m.charAt(0).toUpperCase() + m.slice(1)}</button>
                  ))}
                </div>
              </div>

              {/* Compare selector — reference ghost trace */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Compare</span>
                <div style={{ display: 'flex', gap: 2 }}>
                  {(['none', 'best', 'previous', 'ideal'] as const).map(m => (
                    <button key={m} onClick={() => setCompare(m)}
                      style={{
                        padding: '2px 8px', borderRadius: 4, border: 'none', cursor: 'pointer',
                        fontSize: 10, fontFamily: 'JetBrains Mono,monospace',
                        background: compare === m ? 'rgba(255,255,255,0.1)' : 'transparent',
                        color: compare === m ? 'var(--text)' : 'var(--text-muted)',
                      }}
                    >{m === 'none' ? 'None' : m === 'best' ? 'Best lap' : m === 'previous' ? 'Prev lap' : 'Ideal'}</button>
                  ))}
                </div>
                {compare !== 'none' && (
                  <span style={{ fontSize: 9, fontFamily: 'JetBrains Mono,monospace', color: 'var(--text-muted)' }}>
                    ╌ dashed = {compare === 'best' ? 'best lap' : compare === 'previous' ? 'previous lap' : 'ideal line'}
                  </span>
                )}
              </div>

              {/* Scale selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Scale</span>
                <div style={{ display: 'flex', gap: 2 }}>
                  {(['auto', 'manual'] as ScaleMode[]).map(m => (
                    <button key={m} onClick={() => setScaleMode(m)}
                      style={{
                        padding: '2px 8px', borderRadius: 4, border: 'none', cursor: 'pointer',
                        fontSize: 10, fontFamily: 'JetBrains Mono,monospace',
                        background: scaleMode === m ? 'rgba(255,255,255,0.1)' : 'transparent',
                        color: scaleMode === m ? 'var(--text)' : 'var(--text-muted)',
                      }}
                    >{m.charAt(0).toUpperCase() + m.slice(1)}</button>
                  ))}
                </div>
              </div>

              {/* Readout mode */}
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  fontSize: 9, fontFamily: 'JetBrains Mono,monospace',
                  padding: '2px 7px', borderRadius: 4,
                  color: 'var(--blue)', background: 'rgba(56,189,248,0.12)',
                  letterSpacing: '0.04em',
                }}>
                  {cursorIndex !== null ? `Cursor #${cursorIndex}` : 'Live now'}
                </span>
              </div>
            </div>
          </div>

          {/* Channels panel + synchronized stacked chart */}
          <div className="card mb-4">
            <div className="card-header">
              <span className="card-title">Synchronized Channel Analysis · Last {analysisWin / 10}s · Lap {t.lapCount}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace' }}>
                {analysisSnapshot[0]?.length ?? 0} / {analysisWin} samples
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '212px 1fr', gap: 0 }}>
              {/* Channels panel */}
              <div style={{ borderRight: '1px solid var(--border)', padding: '8px 6px', maxHeight: 540, overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px 6px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)' }}>CHANNELS</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--blue)' }}>{visibleCh.size}/{CHANNEL_DEFS.length}</span>
                </div>
                {channelGroups.map(g => (
                  <div key={g} style={{ marginBottom: 6 }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, letterSpacing: '0.08em', color: 'var(--text-muted)', padding: '4px 4px 2px', textTransform: 'uppercase' }}>{g}</div>
                    {allChannels.filter(c => c.group === g).map(c => {
                      const on = visibleCh.has(c.id);
                      return (
                        <button key={c.id} onClick={() => toggleCh(c.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: 7, width: '100%', padding: '5px 6px', borderRadius: 5, border: 'none', cursor: 'pointer', background: on ? 'rgba(255,255,255,0.05)' : 'transparent', textAlign: 'left' }}>
                          <span style={{ width: 9, height: 9, borderRadius: 2, flex: 'none', background: on ? c.color : 'transparent', border: `1.5px solid ${c.color}` }} />
                          <span style={{ flex: 1, fontSize: 11, fontWeight: on ? 700 : 400, color: on ? 'var(--text)' : 'var(--text-dim)' }}>{c.name}</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, color: 'var(--text-muted)' }}>{c.unit || '—'}</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, padding: '0 4px', borderRadius: 3, color: c.quality === 'OK' ? 'var(--green)' : 'var(--yellow)', background: c.quality === 'OK' ? 'var(--green-dim)' : 'var(--yellow-dim)' }}>{c.quality}</span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
              {/* Stacked synchronized chart */}
              <div style={{ background: 'rgba(11,13,18,0.4)', minWidth: 0 }}>
                {channels.length > 0
                  ? <MultiChannelChart
                      channels={channels}
                      svgWidth={860}
                      xAxisMode={xAxisMode}
                      scaleMode={scaleMode}
                      trackLength={MUGELLO_TRACK_KM * 1000}
                      onCursorChange={handleCursor}
                    />
                  : <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>Select channels from the panel to plot.</div>}
              </div>
            </div>
          </div>

          {/* Unified Channel Summary */}
          <div className="card mb-4">
            <div className="card-header">
              <span className="card-title">Channel Summary</span>
              <span style={{
                fontSize: 11, color: 'var(--text-muted)',
                fontFamily: 'JetBrains Mono,monospace',
              }}>
                {analysisSnapshot[0]?.length ?? 0} / {analysisWin} samples · {cursorValues ? 'Cursor readout' : 'Window stats'}
              </span>
            </div>
            <div className="card-body">
              <ChannelStatsStrip channels={channels} />
            </div>
          </div>

          {/* Analysis footer */}
          <div style={{
            padding: '10px 16px',
            background: 'rgba(56,189,248,0.06)',
            border: '1px solid rgba(56,189,248,0.15)',
            borderRadius: 8, fontSize: 12,
            color: 'var(--text-muted)',
            fontFamily: 'JetBrains Mono,monospace',
          }}>
            <span style={{ color: '#38BDF8', marginRight: 8 }}>ℹ</span>
            Move the cursor over the chart to sync channel values, track position and lap phase.
            Scale mode: {scaleMode === 'auto' ? 'Auto per channel' : 'Manual per channel range'}. Window: {analysisWin / 10}s at 10 Hz.
          </div>
        </>
      )}
    </div>
  );
}
