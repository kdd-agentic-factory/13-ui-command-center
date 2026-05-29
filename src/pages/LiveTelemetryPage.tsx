/**
 * LiveTelemetryPage — Dual-mode AiM RaceStudio3-inspired telemetry dashboard.
 *
 * LIVE mode   — Speed gauge, RPM, controls, tyre thermals, lap times, lap
 *               delta history, sector splits, animated KPI counts,
 *               Wi-Fi device connect panel.
 * ANALYSIS mode — AiM RaceStudio3-style stacked multi-channel chart for the
 *               last 300 samples (30 s @ 10 Hz): Speed, RPM, Throttle, Brake,
 *               Lean Angle, Gear — with crosshair cursor, statistics strip,
 *               and per-channel min/avg/max panel.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Activity, BarChart2, Radio, Wifi, Zap } from 'lucide-react';
import { useLiveTelemetry } from '../hooks/useLiveTelemetry';
import { useAnimeCount } from '../hooks/useAnimeCount';
import { MultiChannelChart, Channel } from '../components/MultiChannelChart';
import { WiFiDevicePanel } from '../components/WiFiDevicePanel';

// ── Constants ─────────────────────────────────────────────────────────────────

const ANALYSIS_LEN = 300;  // 30 s @ 10 Hz
const LIVE_LEN     = 80;   // live speed trace

type Mode = 'live' | 'analysis';

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

// ── Tyre Thermal Corner Card ──────────────────────────────────────────────────

function TyreCornerCard({ label, temp, compound }: { label: string; temp: number; compound: string }) {
  const hot   = temp > 105; const warm = temp > 90; const cold = temp < 75;
  const color = hot ? 'var(--accent)' : warm ? 'var(--yellow)' : cold ? 'var(--blue)' : 'var(--green)';
  const pct   = Math.min(100, Math.max(0, ((temp - 60) / 60) * 100));

  // 3-zone thermal bar (inner / mid / outer)
  const innerTemp = temp + (Math.random() * 4 - 2);
  const outerTemp = temp - (Math.random() * 6 + 2);
  const zoneColors = [innerTemp, temp, outerTemp].map(t => {
    if (t > 105) return '#E03737';
    if (t > 90)  return '#F59E0B';
    if (t < 75)  return '#3B82F6';
    return '#22C55E';
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span className="card-label">{label}</span>
        <span className="text-mono" style={{ color, fontWeight: 700, fontSize: 16 }}>{temp}°C</span>
      </div>
      {/* 3-zone thermal strip */}
      <div style={{ display: 'flex', gap: 2, height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 4 }}>
        {zoneColors.map((c, i) => (
          <div key={i} style={{ flex: 1, background: c, opacity: 0.85 }} />
        ))}
      </div>
      <div className="bar-track" style={{ height: 4 }}>
        <div className="bar-fill" style={{
          width: `${pct}%`, background: color, transition: 'all 0.3s',
        }} />
      </div>
      <div style={{
        fontSize: 9, color: 'var(--text-muted)',
        fontFamily: 'JetBrains Mono,monospace', marginTop: 2,
        display: 'flex', justifyContent: 'space-between',
      }}>
        <span>IN</span>
        <span style={{ color }}>{compound}</span>
        <span>OUT</span>
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

  const [speedHistory,      setSpeedHistory]      = useState<number[]>([]);
  const [analysisSnapshot,  setAnalysisSnapshot]  = useState<number[][]>([[], [], [], [], [], []]);
  const [lapRecords,        setLapRecords]         = useState<LapRecord[]>([]);
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
      ]);
    }
  }, [t.speed, t.rpm, t.throttle, t.brake, t.leanAngle, t.gear,
      t.lapCount, t.lastLap, mode]);

  const handleModeChange = useCallback((m: Mode) => {
    if (m === 'analysis') {
      setAnalysisSnapshot([
        [...speedBuf.current],
        [...rpmBuf.current],
        [...throttleBuf.current],
        [...brakeBuf.current],
        [...leanBuf.current],
        [...gearBuf.current],
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
  const CHANNEL_DEFS: Omit<Channel, 'data'>[] = [
    { id: 'speed',  name: 'SPEED',    unit: 'km/h', color: '#E03737', range: [0, 350],   panelHeight: 72 },
    { id: 'rpm',    name: 'RPM',      unit: 'rpm',  color: '#38BDF8', range: [0, 15500], panelHeight: 60 },
    { id: 'thr',    name: 'THROTTLE', unit: '%',    color: '#22C55E', range: [0, 100],   panelHeight: 52 },
    { id: 'brake',  name: 'BRAKE',    unit: '%',    color: '#F59E0B', range: [0, 100],   panelHeight: 52 },
    { id: 'lean',   name: 'LEAN',     unit: '°',    color: '#A78BFA', range: [0, 63],    panelHeight: 52 },
    { id: 'gear',   name: 'GEAR',     unit: '',     color: '#FCD34D', range: [1, 6],     panelHeight: 44 },
  ];

  const channels: Channel[] = CHANNEL_DEFS.map((def, i) => ({
    ...def,
    data: analysisSnapshot[i] ?? [],
  }));

  return (
    <div className="page">

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Live Telemetry</h1>
          <p className="page-subtitle">
            Real-time data stream · 10 Hz · Lap {t.lapCount}
            {mode === 'analysis' && ` · Analysis window: ${ANALYSIS_LEN / 10}s`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Wi-Fi toggle */}
          <button
            onClick={() => setShowWifi(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px',
              background: showWifi ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${showWifi ? 'rgba(56,189,248,0.5)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 6, cursor: 'pointer',
              color: showWifi ? '#38BDF8' : 'var(--text-muted)',
              fontSize: 12, fontFamily: 'JetBrains Mono,monospace', letterSpacing: '0.06em',
              transition: 'background 0.15s, border-color 0.15s, color 0.15s',
            }}
          >
            <Wifi size={13} />WI-FI
          </button>

          {/* Mode selector */}
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

      {/* ── Wi-Fi device panel ────────────────────────────────────────────── */}
      {showWifi && (
        <div style={{ marginBottom: 24, animation: 'pageEnter 0.2s var(--ease-out) both' }}>
          <WiFiDevicePanel onClose={() => setShowWifi(false)} />
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* LIVE MODE                                                           */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {mode === 'live' && (
        <>
          {/* Animated KPI strip */}
          <div className="grid-4 mb-4">
            <AnimKpi label="Speed"      target={t.speed}     unit="km/h" color="var(--accent)"  />
            <AnimKpi label="RPM"        target={t.rpm}       unit="rpm"  color="var(--blue)"    />
            <AnimKpi label="Fuel Load"  target={t.fuelLoad}  unit="kg"   color="var(--orange)"  decimals={1} />
            <AnimKpi label="Lean Angle" target={t.leanAngle} unit="°"    color="var(--purple)"  decimals={1} />
          </div>

          {/* Sector timing strip */}
          <div className="card mb-4">
            <div className="card-header">
              <span className="card-title">Sector Splits — Lap {t.lapCount}</span>
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
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span className="card-label">Brake Pressure</span>
                    <span className="telem-md text-mono" style={{ color: 'var(--accent)' }}>{t.brake}%</span>
                  </div>
                  <div className="bar-track" style={{ height: 20 }}>
                    <div className="bar-fill" style={{ width: `${t.brake}%`, background: 'var(--accent)', transition: 'width 0.1s' }} />
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

          {/* Speed trace */}
          <div className="card mb-4">
            <div className="card-header">
              <span className="card-title">Speed Trace — Last {LIVE_LEN} samples</span>
              <span className="text-mono text-muted" style={{ fontSize: 12 }}>{t.speed} km/h</span>
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
                  last 8 laps vs best
                </span>
              </div>
              <div className="card-body">
                <LapDeltaHistory records={lapRecords} />
              </div>
            </div>

            {/* Tyre Temperatures */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Tyre Temperatures</span>
                <span className="badge badge-orange">
                  {t.rearCompound} / Age {t.rearTyreAge} laps
                </span>
              </div>
              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  {[
                    { label: 'Front Left',  temp: t.tireFrontLeft,  compound: t.frontCompound ?? 'M' },
                    { label: 'Front Right', temp: t.tireFrontRight, compound: t.frontCompound ?? 'M' },
                    { label: 'Rear Left',   temp: t.tireRearLeft,   compound: t.rearCompound  ?? 'S' },
                    { label: 'Rear Right',  temp: t.tireRearRight,  compound: t.rearCompound  ?? 'S' },
                  ].map(tire => (
                    <TyreCornerCard key={tire.label} {...tire} />
                  ))}
                </div>
              </div>
            </div>

            {/* Fuel & Engine */}
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
                    <div className="bar-fill orange" style={{ width: `${(t.fuelLoad / 22) * 100}%`, transition: 'all 0.3s' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>0 kg</span>
                    <span style={{ fontSize: 11, color: 'var(--orange)', fontFamily: 'JetBrains Mono,monospace' }}>
                      ~{((t.fuelLoad / 22) * 23).toFixed(1)} laps range
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>22 kg</span>
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
          {/* Header stats */}
          <div className="grid-4 mb-4">
            <AnimKpi label="Current Speed" target={t.speed}    unit="km/h" color="var(--accent)"  />
            <AnimKpi label="RPM"           target={t.rpm}      unit="rpm"  color="var(--blue)"    />
            <AnimKpi label="Throttle"      target={t.throttle} unit="%"    color="var(--green)"   />
            <AnimKpi label="Brake"         target={t.brake}    unit="%"    color="var(--orange)"  />
          </div>

          {/* Multi-channel chart */}
          <div className="card mb-4">
            <div className="card-header">
              <span className="card-title">Multi-Channel Analysis — {ANALYSIS_LEN / 10}s window</span>
              <div className="flex items-center gap-3">
                {CHANNEL_DEFS.map(ch => (
                  <div key={ch.id} className="flex items-center gap-1"
                    style={{ fontSize: 10, fontFamily: 'JetBrains Mono,monospace' }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: 2,
                      background: ch.color, flexShrink: 0,
                    }} />
                    <span style={{ color: 'var(--text-muted)' }}>{ch.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: 'rgba(11,13,18,0.4)' }}>
              <MultiChannelChart channels={channels} svgWidth={1040} />
            </div>
          </div>

          {/* Channel statistics */}
          <div className="card mb-4">
            <div className="card-header">
              <span className="card-title">Channel Statistics</span>
              <span style={{
                fontSize: 11, color: 'var(--text-muted)',
                fontFamily: 'JetBrains Mono,monospace',
              }}>
                {analysisSnapshot[0]?.length ?? 0} / {ANALYSIS_LEN} samples
              </span>
            </div>
            <div className="card-body">
              <ChannelStatsStrip channels={channels} />
            </div>
          </div>

          {/* Analysis hint */}
          <div style={{
            padding: '10px 16px',
            background: 'rgba(56,189,248,0.06)',
            border: '1px solid rgba(56,189,248,0.15)',
            borderRadius: 8, fontSize: 12,
            color: 'var(--text-muted)',
            fontFamily: 'JetBrains Mono,monospace',
          }}>
            <span style={{ color: '#38BDF8', marginRight: 8 }}>ℹ</span>
            Hover over the chart to read exact values at any sample point.
            Each channel panel is scaled independently to its min–max range.
          </div>
        </>
      )}
    </div>
  );
}
