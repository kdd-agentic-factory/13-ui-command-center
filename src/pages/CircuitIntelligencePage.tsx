/**
 * CircuitIntelligencePage — AiM Track Manager-style circuit intelligence.
 *
 * Expert additions:
 *   - Multi-rider track overlay: P1/P2 ahead + P4 behind, live gap-derived positions
 *   - Corner analysis panel: 15 Mugello corners with braking/apex/exit speed data
 *   - Sector time trend: 5-lap sparkline per sector (actual vs best delta)
 *   - Enhanced heatmap with 80-segment path geometry (existing)
 *   - Rival comparison table in sector analysis
 */
import { useEffect, useRef, useState, useMemo } from 'react';
import { CloudSun, Thermometer, Wind, TrendingDown } from 'lucide-react';
import { useLiveTelemetry, trackSpeed } from '../hooks/useLiveTelemetry';
import { TrackMap3D } from '../components/babylon/TrackMap3D';

// ── Circuit path (Mugello-like) ───────────────────────────────────────────────

const CIRCUIT_PATH = `
  M 250 80 C 320 80 380 100 400 140
  C 420 175 400 210 370 240
  C 340 270 300 275 280 290
  C 260 305 240 325 240 355
  C 240 385 260 410 290 425
  C 320 440 360 435 390 415
  C 430 390 450 350 460 310
  C 470 270 470 230 480 200
  C 490 170 510 150 530 135
  C 555 118 575 120 580 145
  C 585 170 565 195 545 210
  C 525 225 500 230 490 250
  C 480 270 485 295 500 315
  C 515 335 540 345 560 360
  C 580 375 590 400 580 425
  C 570 450 545 465 515 468
  C 485 471 455 458 435 442
  C 415 426 405 405 395 385
  C 385 365 375 345 355 335
  C 335 325 310 328 290 340
  C 270 352 255 372 245 395
  C 235 418 235 445 245 465
  C 255 485 275 498 300 505
  C 325 512 355 508 375 495
  C 395 482 405 462 410 440
  C 415 418 410 395 400 378
  C 390 361 374 350 355 345
  C 336 340 316 345 300 355
  C 284 365 275 382 270 400
  C 265 418 268 438 277 452
  C 286 466 300 472 315 473
  C 330 474 345 468 354 458
  C 363 448 366 435 361 422
  C 356 409 344 402 331 402
  C 318 402 308 412 305 424
  C 302 436 307 449 316 455
  L 250 80
`;

// ── Static data ───────────────────────────────────────────────────────────────

const SECTORS = [
  { id: 'S1', name: 'Sector 1', time: '29.842', best: '29.612', delta: '+0.230', color: 'var(--green)',  pos: 0.08 },
  { id: 'S2', name: 'Sector 2', time: '31.156', best: '30.984', delta: '+0.172', color: 'var(--yellow)', pos: 0.42 },
  { id: 'S3', name: 'Sector 3', time: '32.414', best: '32.251', delta: '+0.163', color: 'var(--blue)',   pos: 0.71 },
];

const SPEED_TRAPS = [
  { name: 'Speed Trap 1', pos: 'Straight 1', speed: 318, max: 321, rivalry: 316 },
  { name: 'Speed Trap 2', pos: 'Before T7',  speed: 299, max: 302, rivalry: 301 },
  { name: 'Speed Trap 3', pos: 'Straight 2', speed: 309, max: 311, rivalry: 308 },
];

const DRS_ZONES = [
  { name: 'DRS Zone 1', start: 'T9',  end: 'T10', active: true,  gap: '0.842s' },
  { name: 'DRS Zone 2', start: 'T14', end: 'T15', active: false, gap: '—' },
];

// ── Corner analysis data ──────────────────────────────────────────────────────

interface CornerData {
  num: number; name: string;
  brakePoint: number;  // m before corner
  minSpeed: number;    // km/h at apex
  exitSpeed: number;   // km/h at exit
  characteristic: string;
  critical: boolean;   // key overtaking / lap time corner
}

const CORNERS: CornerData[] = [
  { num: 1,  name: 'Fonte Naiadi',     brakePoint: 210, minSpeed: 85,  exitSpeed: 175, characteristic: 'Heavy brake zone, long stop',   critical: true  },
  { num: 2,  name: 'S. Donato',        brakePoint: 60,  minSpeed: 118, exitSpeed: 155, characteristic: 'Tight right, TC sensitive',      critical: false },
  { num: 3,  name: 'Luco',             brakePoint: 80,  minSpeed: 95,  exitSpeed: 148, characteristic: 'Blind entry, commit early',      critical: false },
  { num: 4,  name: 'Poggio Secco',     brakePoint: 110, minSpeed: 108, exitSpeed: 178, characteristic: 'Chicane, momentum critical',      critical: true  },
  { num: 7,  name: 'Arrabbiata 1',     brakePoint: 55,  minSpeed: 88,  exitSpeed: 152, characteristic: 'Downhill right, tyre load peak', critical: true  },
  { num: 9,  name: 'Palagio',          brakePoint: 90,  minSpeed: 102, exitSpeed: 186, characteristic: 'DRS detection, corner exit key', critical: true  },
  { num: 10, name: 'Biondetti',        brakePoint: 30,  minSpeed: 134, exitSpeed: 195, characteristic: 'Fast sweeper, minimum apex',     critical: false },
  { num: 14, name: 'Casanova-Savelli', brakePoint: 150, minSpeed: 72,  exitSpeed: 168, characteristic: 'Complex chicane, WC active',     critical: true  },
  { num: 15, name: 'Arrabbiata 2',     brakePoint: 85,  minSpeed: 91,  exitSpeed: 159, characteristic: 'Uphill, rear slides on exit',    critical: true  },
];

// ── Heatmap ────────────────────────────────────────────────────────────────────

type HeatChannel = 'speed' | 'throttle' | 'brake';
const HEAT_N = 80;

const CHANNEL_LABELS: Record<HeatChannel, string> = {
  speed: 'Speed', throttle: 'Throttle', brake: 'Brake',
};

const CHANNEL_COLORS: Record<HeatChannel, [string, string, string]> = {
  speed:    ['#22C55E', '#FBBF24', '#E03737'],
  throttle: ['#0B0D12', '#16A34A', '#22C55E'],
  brake:    ['#0B0D12', '#B91C1C', '#E03737'],
};

function heatColor(value: number, channel: HeatChannel): string {
  const v = Math.max(0, Math.min(1, value));
  if (channel === 'speed') {
    const hue = Math.round(120 - v * 120);
    return `hsl(${hue},100%,50%)`;
  }
  if (channel === 'throttle') {
    const l = Math.round(15 + v * 40);
    return `hsl(140,80%,${l}%)`;
  }
  const l = Math.round(12 + v * 42);
  return `hsl(0,88%,${l}%)`;
}

function channelValue(pos: number, channel: HeatChannel): number {
  const spd = trackSpeed(pos);
  if (channel === 'speed')    return spd;
  if (channel === 'throttle') return spd > 0.65 ? spd : Math.max(0, spd - 0.1);
  return spd < 0.35 ? (1 - spd / 0.35) : 0;
}

interface Segment { x1: number; y1: number; x2: number; y2: number; pos: number }

function ColorLegend({ channel }: { channel: HeatChannel }) {
  const [lo, mid, hi] = CHANNEL_COLORS[channel];
  const labels: Record<HeatChannel, [string, string, string]> = {
    speed:    ['LOW', 'MED', 'HIGH'],
    throttle: ['0%', '50%', '100%'],
    brake:    ['0%', '50%', '100%'],
  };
  const [lLo, , lHi] = labels[channel];
  const gradId = `heat-lg-${channel}`;
  return (
    <div className="flex items-center gap-3" style={{ fontSize: 10, fontFamily: 'JetBrains Mono,monospace' }}>
      <svg width="120" height="12">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor={lo} />
            <stop offset="50%"  stopColor={mid} />
            <stop offset="100%" stopColor={hi} />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="120" height="12" rx="3" fill={`url(#${gradId})`} />
      </svg>
      <span style={{ color: 'var(--text-muted)' }}>{lLo}</span>
      <span style={{ color: 'var(--text-muted)' }}>→</span>
      <span style={{ color: 'var(--text-muted)' }}>{lHi}</span>
    </div>
  );
}

// ── Rival riders ──────────────────────────────────────────────────────────────

const RIVALS = [
  { name: 'Marquez',    num: 93, color: '#FF3B3B', trackOffset: +0.020 },   // 1.8s ahead
  { name: 'Martin',     num: 89, color: '#FCD34D', trackOffset: +0.009 },   // 0.842s ahead
  { name: 'Bastianini', num: 23, color: '#60A5FA', trackOffset: -0.005 },   // 0.5s behind
];

// ── Sector sparkline ──────────────────────────────────────────────────────────

function SectorSparkline({ deltas }: { deltas: number[] }) {
  const W = 80; const H = 24;
  const maxAbs = Math.max(...deltas.map(d => Math.abs(d)), 0.05);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <line x1="0" y1={H / 2} x2={W} y2={H / 2} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      {deltas.map((d, i) => {
        const x = (i / (deltas.length - 1)) * (W - 6) + 3;
        const yCenter = H / 2;
        const barH = (Math.abs(d) / maxAbs) * (H / 2 - 2);
        const isGain = d < 0;
        return (
          <rect
            key={i}
            x={x - 4} y={isGain ? yCenter - barH : yCenter}
            width="8" height={barH}
            fill={isGain ? 'var(--green)' : 'var(--accent)'}
            opacity="0.8" rx="1"
          />
        );
      })}
    </svg>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function CircuitIntelligencePage() {
  const t = useLiveTelemetry();
  const [heatChannel, setHeatChannel] = useState<HeatChannel>('speed');
  const [segments, setSegments]       = useState<Segment[]>([]);
  const [showCorners, setShowCorners] = useState(false);
  const pathRef = useRef<SVGPathElement>(null);

  // Compute heatmap segments
  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const totalLen = path.getTotalLength();
    const segs: Segment[] = [];
    for (let i = 0; i < HEAT_N; i++) {
      const p0 = path.getPointAtLength((i / HEAT_N) * totalLen);
      const p1 = path.getPointAtLength(((i + 1) / HEAT_N) * totalLen);
      segs.push({ x1: p0.x, y1: p0.y, x2: p1.x, y2: p1.y, pos: i / HEAT_N });
    }
    setSegments(segs);
  }, []);

  // Helper: segment index → x,y from segments array
  function posToXY(pos: number): { x: number; y: number } {
    if (segments.length === 0) {
      return {
        x: 200 + Math.cos(pos * 2 * Math.PI) * 140,
        y: 280 + Math.sin(pos * 2 * Math.PI) * 140,
      };
    }
    const idx = Math.min(segments.length - 1, Math.round(pos * (segments.length - 1)));
    return { x: segments[idx].x1, y: segments[idx].y1 };
  }

  // Player position
  const { x: riderX, y: riderY } = posToXY(t.trackPos);

  // Rival positions: offset by track fraction derived from gap
  const TOTAL_LAP_S = 93.4; // Mugello typical lap time in seconds
  const rivalDots = useMemo(() => RIVALS.map(r => {
    const trackPos = ((t.trackPos + r.trackOffset) + 1) % 1;
    const { x, y } = segments.length > 0
      ? (() => {
          const idx = Math.min(segments.length - 1, Math.round(trackPos * (segments.length - 1)));
          return { x: segments[idx].x1, y: segments[idx].y1 };
        })()
      : { x: 200 + Math.cos(trackPos * 2 * Math.PI) * 140, y: 280 + Math.sin(trackPos * 2 * Math.PI) * 140 };
    return { ...r, x, y, trackPos };
  }), [t.trackPos, segments, TOTAL_LAP_S]);

  // Sector marker positions
  const sectorDots = SECTORS.map(s => posToXY(s.pos));

  // Simulate sector time deltas for last 5 laps (for sparklines)
  const sectorTrends = useMemo(() => ({
    S1: [-0.12, +0.05, -0.08, +0.14, +0.23],
    S2: [+0.18, +0.12, +0.08, +0.15, +0.17],
    S3: [+0.21, +0.14, +0.19, +0.22, +0.16],
  }), []);

  return (
    <div className="page">

      {/* 3D Track Map */}
      <div className="card mb-4">
        <div className="card-header">
          <span className="card-title">3D Track Map — Mugello</span>
          <span className="badge badge-red">LIVE</span>
        </div>
        <TrackMap3D trackPos={t.trackPos} height={340} />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Circuit Intelligence</h1>
          <p className="page-subtitle">Autodromo del Mugello · 5.245 km · 23 laps · Lap {t.lapCount}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Thermometer size={14} style={{ color: 'var(--orange)' }} />
            <span style={{ fontSize: 13 }}>Track <strong>48°C</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <CloudSun size={14} style={{ color: 'var(--yellow)' }} />
            <span style={{ fontSize: 13 }}>Air <strong>28°C</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Wind size={14} style={{ color: 'var(--blue)' }} />
            <span style={{ fontSize: 13 }}>Wind <strong>12 km/h SW</strong></span>
          </div>
          <button
            className="btn btn-ghost btn-sm flex items-center gap-1"
            onClick={() => setShowCorners(v => !v)}
          >
            <TrendingDown size={12} />
            Corners
          </button>
        </div>
      </div>

      {/* Main 2-column layout */}
      <div className="grid-2-1 mb-4">

        {/* ── Circuit map + heatmap ─────────────────────────────────────────── */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Track Map · Multi-Rider Overlay</span>
            <div className="flex items-center gap-3">
              {/* Channel selector */}
              <div style={{
                display: 'flex', background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: 2,
              }}>
                {(['speed', 'throttle', 'brake'] as HeatChannel[]).map(ch => (
                  <button
                    key={ch}
                    onClick={() => setHeatChannel(ch)}
                    style={{
                      padding: '4px 10px',
                      background: heatChannel === ch ? 'rgba(255,255,255,0.09)' : 'transparent',
                      border: 'none', borderRadius: 4, cursor: 'pointer',
                      color: heatChannel === ch ? 'var(--text)' : 'var(--text-muted)',
                      fontSize: 10, fontFamily: 'JetBrains Mono,monospace',
                      letterSpacing: '0.07em', textTransform: 'uppercase',
                    }}
                  >
                    {CHANNEL_LABELS[ch]}
                  </button>
                ))}
              </div>
              <span className="badge badge-red">P{t.position} · L{t.lapCount}</span>
            </div>
          </div>

          <div style={{ padding: '8px 16px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <ColorLegend channel={heatChannel} />
              {/* Rider legend */}
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 10 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
                  #47 (You)
                </span>
                {RIVALS.map(r => (
                  <span key={r.num} style={{ display: 'flex', alignItems: 'center', gap: 4, color: r.color }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: r.color, display: 'inline-block' }} />
                    #{r.num}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="card-body" style={{ justifyContent: 'center', padding: 16 }}>
            <svg width="100%" viewBox="0 0 800 560" style={{ maxHeight: 380 }}>
              {/* Background circuit */}
              <path d={CIRCUIT_PATH} fill="none" stroke="rgba(255,255,255,0.05)"
                strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" />

              {/* Hidden path for geometry computation */}
              <path ref={pathRef} d={CIRCUIT_PATH} fill="none" stroke="none" strokeWidth="0" />

              {/* Heatmap lines */}
              {segments.map((seg, i) => (
                <line key={i}
                  x1={seg.x1} y1={seg.y1} x2={seg.x2} y2={seg.y2}
                  stroke={heatColor(channelValue(seg.pos, heatChannel), heatChannel)}
                  strokeWidth="18" strokeLinecap="round" opacity="0.88" />
              ))}

              {/* Center line */}
              <path d={CIRCUIT_PATH} fill="none" stroke="rgba(255,255,255,0.3)"
                strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

              {/* DRS zone highlight */}
              <line x1="250" y1="80" x2="400" y2="140"
                stroke="var(--green)" strokeWidth="6" strokeOpacity="0.55" />
              <text x="270" y="72" fill="var(--green)" fontSize="9"
                fontFamily="JetBrains Mono,monospace" opacity="0.8">DRS</text>

              {/* Sector markers */}
              {SECTORS.map((s, i) => {
                const { x, y } = sectorDots[i];
                return (
                  <g key={s.id}>
                    <circle cx={x} cy={y} r="7" fill={s.color} opacity="0.9" />
                    <text x={x + 10} y={y + 4} fill="var(--text)" fontSize="10"
                      fontFamily="JetBrains Mono,monospace" fontWeight="700">{s.id}</text>
                  </g>
                );
              })}

              {/* Rival rider dots */}
              {rivalDots.map(r => (
                <g key={r.num}>
                  <circle cx={r.x} cy={r.y} r="7" fill={r.color}
                    style={{ filter: `drop-shadow(0 0 5px ${r.color})` }} />
                  <text x={r.x - 5} y={r.y + 4} fill="white" fontSize="7"
                    fontFamily="JetBrains Mono,monospace" fontWeight="700">{r.num}</text>
                </g>
              ))}

              {/* Player dot — larger + glow */}
              <circle cx={riderX} cy={riderY} r="11" fill="var(--accent)"
                style={{ filter: 'drop-shadow(0 0 10px var(--accent))' }} />
              <text x={riderX - 4} y={riderY + 4} fill="white" fontSize="8"
                fontFamily="JetBrains Mono,monospace" fontWeight="800">47</text>
            </svg>
          </div>
        </div>

        {/* ── Right column ──────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Sector analysis with sparklines */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Sector Analysis</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>5-lap trend →</span>
            </div>
            {SECTORS.map(s => (
              <div key={s.id} style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    fontFamily: 'JetBrains Mono,monospace', fontWeight: 800, fontSize: 14,
                    color: s.color, width: 24, flexShrink: 0,
                  }}>
                    {s.id}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span className="text-mono" style={{ fontSize: 13, fontWeight: 700 }}>{s.time}</span>
                      <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: 'var(--accent)' }}>
                        {s.delta}
                      </span>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Best: {s.best}</div>
                  </div>
                  <SectorSparkline deltas={sectorTrends[s.id as 'S1' | 'S2' | 'S3']} />
                </div>
              </div>
            ))}

            {/* Rival sector comparison */}
            <div style={{ padding: '8px 16px', background: 'var(--bg-surface)', borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                vs Martin (P2)
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {['+0.08s', '–0.04s', '+0.16s'].map((delta, i) => (
                  <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 2 }}>S{i + 1}</div>
                    <div style={{
                      fontFamily: 'JetBrains Mono,monospace', fontSize: 11, fontWeight: 700,
                      color: delta.startsWith('–') ? 'var(--green)' : 'var(--accent)',
                    }}>
                      {delta}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Speed traps with rival comparison */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Speed Traps</span>
            </div>
            <div className="card-body" style={{ flexDirection: 'column', gap: 12 }}>
              {SPEED_TRAPS.map(st => (
                <div key={st.name}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{st.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{st.pos}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="text-mono" style={{ fontWeight: 700, fontSize: 17 }}>
                        {st.speed}
                        <span style={{ color: 'var(--text-muted)', fontSize: 10 }}> km/h</span>
                      </span>
                      <div style={{ fontSize: 10, color: st.speed >= st.rivalry ? 'var(--green)' : 'var(--accent)', fontFamily: 'JetBrains Mono,monospace' }}>
                        vs rival: {st.rivalry} ({st.speed >= st.rivalry ? '+' : ''}{st.speed - st.rivalry} km/h)
                      </div>
                    </div>
                  </div>
                  <div className="bar-track">
                    <div className="bar-fill cyan" style={{ width: `${(st.speed / 350) * 100}%` }} />
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                    Session max: {st.max} km/h
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* DRS zones */}
          <div className="card">
            <div className="card-header"><span className="card-title">DRS Zones</span></div>
            <div className="card-body" style={{ flexDirection: 'column', gap: 10 }}>
              {DRS_ZONES.map(drs => (
                <div key={drs.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{drs.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{drs.start} → {drs.end}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={`badge ${drs.active ? 'badge-green' : 'badge-muted'}`}>
                      {drs.active ? 'ENABLED' : 'DISABLED'}
                    </span>
                    {drs.gap !== '—' && (
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>
                        Gap required: {drs.gap}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Corner Analysis (collapsible) ──────────────────────────────────── */}
      {showCorners && (
        <div className="card mb-4">
          <div className="card-header">
            <span className="card-title">Corner Analysis — Mugello 15 Turns</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Braking · Apex · Exit · Key notes</span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 36 }}>T#</th>
                <th>Name</th>
                <th>Brake</th>
                <th>Min Speed</th>
                <th>Exit</th>
                <th>Characteristic</th>
              </tr>
            </thead>
            <tbody>
              {CORNERS.map(c => (
                <tr key={c.num} style={c.critical ? { background: 'rgba(224,55,55,0.04)' } : {}}>
                  <td>
                    <span className="text-mono" style={{ fontWeight: 700, color: c.critical ? 'var(--accent)' : 'var(--text-muted)' }}>
                      T{c.num}
                    </span>
                  </td>
                  <td style={{ fontWeight: c.critical ? 600 : 400 }}>{c.name}</td>
                  <td className="mono" style={{ fontSize: 12, color: 'var(--accent)' }}>
                    {c.brakePoint}m
                  </td>
                  <td className="mono" style={{ fontSize: 12 }}>
                    {c.minSpeed} km/h
                  </td>
                  <td className="mono" style={{ fontSize: 12, color: 'var(--green)' }}>
                    {c.exitSpeed} km/h
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-dim)' }}>{c.characteristic}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Track evolution ───────────────────────────────────────────────────── */}
      <div className="card">
        <div className="card-header"><span className="card-title">Track Evolution & Conditions</span></div>
        <div className="card-body">
          <div className="grid-4">
            {[
              { label: 'Track Rubber',  value: '74%',  color: 'var(--green)',  note: 'High grip zone', bar: 74 },
              { label: 'Track Temp',    value: '48°C', color: 'var(--orange)', note: '+3°C vs FP3', bar: 48 },
              { label: 'S2 Wind',       value: '0.4s', color: 'var(--blue)',   note: 'Headwind effect', bar: 40 },
              { label: 'Grip Level',    value: 'HIGH', color: 'var(--green)',  note: 'Tyre limit: rear', bar: 85 },
            ].map(c => (
              <div key={c.label} className="stat-tile">
                <div className="stat-tile__label">{c.label}</div>
                <div className="text-mono" style={{ fontSize: 22, fontWeight: 700, color: c.color, marginBottom: 6 }}>
                  {c.value}
                </div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${c.bar}%`, background: c.color }} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{c.note}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
