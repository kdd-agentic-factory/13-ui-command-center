import { useEffect, useRef, useState } from 'react';
import { Activity } from 'lucide-react';
import { useLiveTelemetry } from '../hooks/useLiveTelemetry';

const HISTORY_LEN = 80;

function SpeedGaugeSVG({ value, max = 350 }: { value: number; max?: number }) {
  const pct  = Math.min(1, value / max);
  const r    = 68;
  const cx   = 90; const cy = 95;
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

  const isRedline  = value > 300;
  const isWarning  = value > 220;
  const arcColor   = isRedline ? '#E03737' : isWarning ? '#F59E0B' : '#22C55E';
  const glowId     = `glow-${value}`;

  /* Tick marks at every 50 km/h */
  const ticks = [0, 50, 100, 150, 200, 250, 300, 350].map(v => {
    const a = toRad(startAngle + sweepAngle * (v / max));
    const inner = r - 6; const outer = r + 2;
    return {
      x1: cx + inner * Math.cos(a), y1: cy + inner * Math.sin(a),
      x2: cx + outer * Math.cos(a), y2: cy + outer * Math.sin(a),
      label: v, labelX: cx + (r + 16) * Math.cos(a), labelY: cy + (r + 16) * Math.sin(a),
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

      {/* Outer track */}
      <path d={arcPath(startAngle, startAngle + sweepAngle, r)} fill="none"
            stroke="rgba(255,255,255,0.05)" strokeWidth="10" strokeLinecap="round" />

      {/* Active arc — glows on redline */}
      <path d={arcPath(startAngle, angle, r)} fill="none"
            stroke={arcColor} strokeWidth="10" strokeLinecap="round"
            filter={isRedline || isWarning ? `url(#${glowId})` : undefined}
            style={{ transition: 'stroke 0.15s cubic-bezier(0.16,1,0.3,1)' }} />

      {/* Tick marks */}
      {ticks.map(t => (
        <g key={t.label}>
          <line x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
                stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      ))}

      {/* Needle */}
      <line x1={cx} y1={cy} x2={needleX} y2={needleY}
            stroke="white" strokeWidth="2" strokeLinecap="round"
            filter="url(#needle-glow)"
            style={{ transition: 'x2 0.1s cubic-bezier(0.16,1,0.3,1), y2 0.1s cubic-bezier(0.16,1,0.3,1)' }} />
      <circle cx={cx} cy={cy} r="5" fill={arcColor}
              style={{ transition: 'fill 0.15s' }} />
      <circle cx={cx} cy={cy} r="2.5" fill="white" />

      {/* Value — large, centred below pivot */}
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

function SpeedTrace({ history }: { history: number[] }) {
  const max = 350;
  const w = 600;
  const h = 80;
  if (history.length < 2) return null;
  const pts = history.map((v, i) => {
    const x = (i / (HISTORY_LEN - 1)) * w;
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

function RPMBar({ value }: { value: number }) {
  const pct = Math.min(100, (value / 15500) * 100);
  const redline = value > 14000;
  return (
    <div className="bar-track" style={{ height: 16 }}>
      <div
        className="bar-fill"
        style={{
          width: `${pct}%`,
          background: redline ? 'var(--accent)' : 'linear-gradient(90deg, var(--blue), var(--cyan))',
          transition: 'width 0.1s',
        }}
      />
    </div>
  );
}

export function LiveTelemetryPage() {
  const t = useLiveTelemetry();
  const [speedHistory, setSpeedHistory] = useState<number[]>([]);
  const [throttleHistory, setThrottleHistory] = useState<number[]>([]);
  const [brakeHistory, setBrakeHistory] = useState<number[]>([]);

  useEffect(() => {
    setSpeedHistory(prev => {
      const next = [...prev, t.speed];
      return next.slice(-HISTORY_LEN);
    });
    setThrottleHistory(prev => {
      const next = [...prev, t.throttle];
      return next.slice(-HISTORY_LEN);
    });
    setBrakeHistory(prev => {
      const next = [...prev, t.brake];
      return next.slice(-HISTORY_LEN);
    });
  }, [t.speed, t.throttle, t.brake]);

  function formatTime(s: number): string {
    const m = Math.floor(s / 60);
    const sec = (s % 60).toFixed(3).padStart(6, '0');
    return `${m}:${sec}`;
  }

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Live Telemetry</h1>
          <p className="page-subtitle">Real-time data stream · 10 Hz · Lap {t.lapCount}</p>
        </div>
        <div className="flex items-center gap-2">
          <Activity size={14} style={{ color: 'var(--green)' }} />
          <span className="badge badge-green">LIVE</span>
        </div>
      </div>

      {/* ── Primary gauges ─────────────────────────────────────────────── */}
      <div className="grid-4 mb-4">
        {/* Speed gauge */}
        <div className="card" style={{ gridColumn: 'span 1' }}>
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
              <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 2 }}>+0.254 vs best</div>
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

      {/* ── Speed trace ─────────────────────────────────────────────────── */}
      <div className="card mb-4">
        <div className="card-header">
          <span className="card-title">Speed Trace — Last {HISTORY_LEN} samples</span>
          <span className="text-mono text-muted" style={{ fontSize: 12 }}>{t.speed} km/h</span>
        </div>
        <div style={{ padding: '0 0 0 0', background: 'var(--bg-surface)' }}>
          <SpeedTrace history={speedHistory} />
        </div>
      </div>

      {/* ── Tires + fuel ────────────────────────────────────────────────── */}
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
                { name: 'Engine Map', value: '6', unit: '' },
                { name: 'Traction Control', value: 'TC3', unit: '' },
                { name: 'Engine Brake', value: 'EB4', unit: '' },
                { name: 'Wheelie Control', value: 'WC2', unit: '' },
                { name: 'Anti-hop Clutch', value: 'ON', unit: '' },
              ].map(p => (
                <div key={p.name} className="setup-row" style={{ padding: '8px 0' }}>
                  <span className="setup-name">{p.name}</span>
                  <span className="setup-val text-mono" style={{ color: 'var(--cyan)' }}>{p.value}{p.unit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
