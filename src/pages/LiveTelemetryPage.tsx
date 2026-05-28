/**
 * LiveTelemetryPage — Dual-mode AiM RaceStudio3-inspired telemetry dashboard.
 *
 * LIVE mode   — Traditional real-time gauges (speed, RPM, controls, tires, lap times)
 *               plus animated KPI counts and Wi-Fi device connect panel.
 * ANALYSIS mode — AiM RaceStudio3-style stacked multi-channel chart for the last
 *               300 samples (30 s @ 10 Hz): Speed, RPM, Throttle, Brake,
 *               Lean Angle, Gear — with crosshair cursor and statistics strip.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Activity, BarChart2, Radio, Wifi } from 'lucide-react';
import { useLiveTelemetry } from '../hooks/useLiveTelemetry';
import { useAnimeCount } from '../hooks/useAnimeCount';
import { MultiChannelChart, Channel } from '../components/MultiChannelChart';
import { WiFiDevicePanel } from '../components/WiFiDevicePanel';

// ── Constants ─────────────────────────────────────────────────────────────────

const ANALYSIS_LEN = 300; // 30 s @ 10 Hz
const LIVE_LEN = 80;       // live speed trace

type Mode = 'live' | 'analysis';

// ── Speed Gauge SVG ───────────────────────────────────────────────────────────

function SpeedGaugeSVG({ value, max = 350 }: { value: number; max?: number }) {
  const pct = Math.min(1, value / max);
  const r = 68;
  const cx = 90; const cy = 95;
  const startAngle = -215;
  const sweepAngle = 250;
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

  const isRedline = value > 300;
  const isWarning = value > 220;
  const arcColor  = isRedline ? '#E03737' : isWarning ? '#F59E0B' : '#22C55E';
  const glowId    = 'sg-glow';

  const ticks = [0, 50, 100, 150, 200, 250, 300, 350].map(v => {
    const a = toRad(startAngle + sweepAngle * (v / max));
    const inner = r - 6; const outer = r + 2;
    return {
      x1: cx + inner * Math.cos(a), y1: cy + inner * Math.sin(a),
      x2: cx + outer * Math.cos(a), y2: cy + outer * Math.sin(a),
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
      {ticks.map(t => (
        <line key={t.label}
          x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
          stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeLinecap="round"
        />
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

// ── Speed trace mini-chart ────────────────────────────────────────────────────

function SpeedTrace({ history }: { history: number[] }) {
  const max = 350; const w = 600; const h = 80;
  if (history.length < 2) return null;
  const pts = history.map((v, i) => {
    const x = (i / (LIVE_LEN - 1)) * w;
    const y = h - (v / max) * h;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block' }}>
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
  const pct = Math.min(100, (value / 15500) * 100);
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
      <div className="text-mono" style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
        {display}
        <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 3 }}>{unit}</span>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function LiveTelemetryPage() {
  const t = useLiveTelemetry();
  const [mode, setMode] = useState<Mode>('live');
  const [showWifi, setShowWifi] = useState(false);

  // ── History buffers ───────────────────────────────────────────────────────
  const speedBuf    = useRef<number[]>([]);
  const rpmBuf      = useRef<number[]>([]);
  const throttleBuf = useRef<number[]>([]);
  const brakeBuf    = useRef<number[]>([]);
  const leanBuf     = useRef<number[]>([]);
  const gearBuf     = useRef<number[]>([]);

  const [speedHistory, setSpeedHistory]       = useState<number[]>([]);
  const [analysisSnapshot, setAnalysisSnapshot] = useState<number[][]>([[], [], [], [], [], []]);

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

    // Live speed trace (shorter)
    setSpeedHistory(prev => [...prev, t.speed].slice(-LIVE_LEN));

    // Only snapshot for analysis when in analysis mode (avoid re-render churn in live mode)
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
  }, [t.speed, t.rpm, t.throttle, t.brake, t.leanAngle, t.gear, mode]);

  // Snapshot on mode change
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

  // ── Analysis channels ─────────────────────────────────────────────────────
  const CHANNEL_DEFS: Omit<Channel, 'data'>[] = [
    { id: 'speed',   name: 'SPEED',    unit: 'km/h', color: '#E03737', range: [0, 350],   panelHeight: 72 },
    { id: 'rpm',     name: 'RPM',      unit: 'rpm',  color: '#38BDF8', range: [0, 15500], panelHeight: 60 },
    { id: 'thr',     name: 'THROTTLE', unit: '%',    color: '#22C55E', range: [0, 100],   panelHeight: 52 },
    { id: 'brake',   name: 'BRAKE',    unit: '%',    color: '#F59E0B', range: [0, 100],   panelHeight: 52 },
    { id: 'lean',    name: 'LEAN',     unit: '°',    color: '#A78BFA', range: [0, 63],    panelHeight: 52 },
    { id: 'gear',    name: 'GEAR',     unit: '',     color: '#FCD34D', range: [1, 6],     panelHeight: 44 },
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
              borderRadius: 6, cursor: 'pointer', color: showWifi ? '#38BDF8' : 'var(--text-muted)',
              fontSize: 12, fontFamily: 'JetBrains Mono,monospace', letterSpacing: '0.06em',
              transition: 'background 0.15s, border-color 0.15s, color 0.15s',
            }}
          >
            <Wifi size={13} />
            WI-FI
          </button>

          {/* Mode selector */}
          <div style={{
            display: 'flex', background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 3,
          }}>
            {(['live', 'analysis'] as Mode[]).map(m => (
              <button
                key={m}
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
            <AnimKpi label="Speed"      target={t.speed}    unit="km/h" color="var(--accent)"  />
            <AnimKpi label="RPM"        target={t.rpm}      unit="rpm"  color="var(--blue)"    />
            <AnimKpi label="Fuel Load"  target={t.fuelLoad} unit="kg"   color="var(--orange)" decimals={1} />
            <AnimKpi label="Lean Angle" target={t.leanAngle} unit="°"   color="var(--purple)" decimals={1} />
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

            {/* Throttle & Brake */}
            <div className="card">
              <div className="card-header"><span className="card-title">Controls</span></div>
              <div className="card-body flex-col gap-4" style={{ gap: 20 }}>
                <div>
                  <div className="flex items-center justify-between mb-3" style={{ marginBottom: 6 }}>
                    <span className="card-label">Throttle</span>
                    <span className="telem-md text-mono" style={{ color: 'var(--green)' }}>{t.throttle}%</span>
                  </div>
                  <div className="bar-track" style={{ height: 20 }}>
                    <div className="bar-fill green" style={{ width: `${t.throttle}%`, transition: 'width 0.1s' }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-3" style={{ marginBottom: 6 }}>
                    <span className="card-label">Brake Pressure</span>
                    <span className="telem-md text-mono" style={{ color: 'var(--accent)' }}>{t.brake}%</span>
                  </div>
                  <div className="bar-track" style={{ height: 20 }}>
                    <div className="bar-fill" style={{ width: `${t.brake}%`, background: 'var(--accent)', transition: 'width 0.1s' }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-3" style={{ marginBottom: 6 }}>
                    <span className="card-label">Lean Angle</span>
                    <span className="telem-md text-mono" style={{ color: 'var(--purple)' }}>{t.leanAngle}°</span>
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
                  <div style={{ fontSize: 12, color: t.lastLap > t.bestLap ? 'var(--accent)' : 'var(--green)', marginTop: 2 }}>
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

          {/* Tires + fuel */}
          <div className="grid-2">
            <div className="card">
              <div className="card-header">
                <span className="card-title">Tyre Temperatures</span>
                <span className="badge badge-orange">{t.rearCompound} / Lap {t.rearTyreAge}</span>
              </div>
              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {[
                    { label: 'Front Left',  val: t.tireFrontLeft,  pos: 'FL' },
                    { label: 'Front Right', val: t.tireFrontRight, pos: 'FR' },
                    { label: 'Rear Left',   val: t.tireRearLeft,   pos: 'RL' },
                    { label: 'Rear Right',  val: t.tireRearRight,  pos: 'RR' },
                  ].map(tire => {
                    const hot  = tire.val > 105;
                    const warm = tire.val > 90;
                    const cold = tire.val < 75;
                    const color = hot ? 'var(--accent)' : warm ? 'var(--yellow)' : cold ? 'var(--blue)' : 'var(--green)';
                    const pct = ((tire.val - 60) / 60) * 100;
                    return (
                      <div key={tire.pos}>
                        <div className="flex items-center justify-between mb-3" style={{ marginBottom: 6 }}>
                          <span className="card-label">{tire.label}</span>
                          <span className="text-mono" style={{ color, fontWeight: 700, fontSize: 18 }}>{tire.val}°C</span>
                        </div>
                        <div className="bar-track">
                          <div className="bar-fill" style={{ width: `${Math.min(100, Math.max(0, pct))}%`, background: color, transition: 'all 0.3s' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><span className="card-title">Fuel & Engine</span></div>
              <div className="card-body">
                <div style={{ marginBottom: 20 }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                    <span className="card-label">Fuel Load</span>
                    <span className="telem-md text-mono">{t.fuelLoad} <span style={{ color: 'var(--text-dim)', fontSize: 14 }}>kg</span></span>
                  </div>
                  <div className="bar-track" style={{ height: 14 }}>
                    <div className="bar-fill orange" style={{ width: `${(t.fuelLoad / 22) * 100}%`, transition: 'all 0.3s' }} />
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>0 kg</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>22 kg</span>
                  </div>
                </div>
                <div className="divider" />
                <div style={{ marginTop: 16 }}>
                  <div className="card-label" style={{ marginBottom: 12 }}>Engine Parameters</div>
                  {[
                    { name: 'Engine Map',       value: '6'   },
                    { name: 'Traction Control',  value: 'TC3' },
                    { name: 'Engine Brake',      value: 'EB4' },
                    { name: 'Wheelie Control',   value: 'WC2' },
                    { name: 'Anti-hop Clutch',   value: 'ON'  },
                  ].map(p => (
                    <div key={p.name} className="setup-row" style={{ padding: '8px 0' }}>
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
                  <div key={ch.id} className="flex items-center gap-1" style={{ fontSize: 10, fontFamily: 'JetBrains Mono,monospace' }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: ch.color, flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-muted)' }}>{ch.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: 'rgba(11,13,18,0.4)' }}>
              <MultiChannelChart channels={channels} svgWidth={1040} />
            </div>
          </div>

          {/* Analysis hint */}
          <div style={{
            padding: '10px 16px',
            background: 'rgba(56,189,248,0.06)',
            border: '1px solid rgba(56,189,248,0.15)',
            borderRadius: 8,
            fontSize: 12,
            color: 'var(--text-muted)',
            fontFamily: 'JetBrains Mono,monospace',
          }}>
            <span style={{ color: '#38BDF8', marginRight: 8 }}>ℹ</span>
            Hover over the chart to read exact values at any sample point.
            Each channel panel is scaled independently.
            Buffer: {analysisSnapshot[0]?.length ?? 0} / {ANALYSIS_LEN} samples.
          </div>
        </>
      )}
    </div>
  );
}
