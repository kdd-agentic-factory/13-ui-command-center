/**
 * CircuitIntelligencePage — AiM Track Manager-style circuit intelligence.
 *
 * Features:
 *  - 3D Babylon track map (existing)
 *  - 2D SVG circuit with real-time Speed / Throttle / Brake heatmap overlay
 *    using getPointAtLength + getTotalLength browser APIs to color-code 80
 *    path segments according to the simulated track profile.
 *  - Channel selector with color legend
 *  - Rider position dot tracking live trackPos
 *  - Sector analysis, speed traps, DRS zones, track conditions
 */
import { useEffect, useRef, useState } from 'react';
import { CloudSun, Thermometer, Wind } from 'lucide-react';
import { useLiveTelemetry, trackSpeed } from '../hooks/useLiveTelemetry';
import { TrackMap3D } from '../components/babylon/TrackMap3D';

// ── Circuit path (Mugello-like simplified) ─────────────────────────────────

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
  { id: 'S1', name: 'Sector 1', time: '29.842', best: '29.612', delta: '+0.230', color: 'var(--green)' },
  { id: 'S2', name: 'Sector 2', time: '31.156', best: '30.984', delta: '+0.172', color: 'var(--yellow)' },
  { id: 'S3', name: 'Sector 3', time: '32.414', best: '32.251', delta: '+0.163', color: 'var(--blue)' },
];

const SPEED_TRAPS = [
  { name: 'Speed Trap 1', pos: 'Straight 1', speed: 318, max: 321 },
  { name: 'Speed Trap 2', pos: 'Before T7',  speed: 299, max: 302 },
  { name: 'Speed Trap 3', pos: 'Straight 2', speed: 309, max: 311 },
];

const DRS_ZONES = [
  { name: 'DRS Zone 1', start: 'T9',  end: 'T10', active: true },
  { name: 'DRS Zone 2', start: 'T14', end: 'T15', active: false },
];

// ── Heatmap types ─────────────────────────────────────────────────────────────

type HeatChannel = 'speed' | 'throttle' | 'brake';
const HEAT_N = 80; // number of path segments

const CHANNEL_LABELS: Record<HeatChannel, string> = {
  speed:    'Speed',
  throttle: 'Throttle',
  brake:    'Brake',
};

const CHANNEL_COLORS: Record<HeatChannel, [string, string, string]> = {
  speed:    ['#22C55E', '#FBBF24', '#E03737'],
  throttle: ['#0B0D12',  '#16A34A', '#22C55E'],
  brake:    ['#0B0D12',  '#B91C1C', '#E03737'],
};

// Maps a 0-1 normalized value to an RGB string for the given channel
function heatColor(value: number, channel: HeatChannel): string {
  const v = Math.max(0, Math.min(1, value));
  if (channel === 'speed') {
    // green → yellow → red (AiM RaceStudio3 convention)
    const hue = Math.round(120 - v * 120);
    return `hsl(${hue},100%,50%)`;
  }
  if (channel === 'throttle') {
    const l = Math.round(15 + v * 40);
    return `hsl(140,80%,${l}%)`;
  }
  // brake
  const l = Math.round(12 + v * 42);
  return `hsl(0,88%,${l}%)`;
}

// Returns the channel value 0-1 at track position pos ∈ [0,1]
function channelValue(pos: number, channel: HeatChannel): number {
  const spd = trackSpeed(pos);
  if (channel === 'speed')    return spd;
  if (channel === 'throttle') return spd > 0.65 ? spd : Math.max(0, spd - 0.1);
  // brake: high when speed drops fast (i.e., low speed at corner entry)
  return spd < 0.35 ? (1 - spd / 0.35) : 0;
}

// ── Heatmap segment type ──────────────────────────────────────────────────────

interface Segment {
  x1: number; y1: number;
  x2: number; y2: number;
  pos: number; // track position 0-1
}

// ── Color scale legend ────────────────────────────────────────────────────────

function ColorLegend({ channel }: { channel: HeatChannel }) {
  const [lo, mid, hi] = CHANNEL_COLORS[channel];
  const labels: Record<HeatChannel, [string, string, string]> = {
    speed:    ['LOW', 'MED', 'HIGH'],
    throttle: ['0%', '50%', '100%'],
    brake:    ['0%', '50%', '100%'],
  };
  const [lLo, lMid, lHi] = labels[channel];
  const gradId = `heat-legend-${channel}`;
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

// ── Component ─────────────────────────────────────────────────────────────────

export function CircuitIntelligencePage() {
  const t = useLiveTelemetry();
  const [heatChannel, setHeatChannel] = useState<HeatChannel>('speed');
  const [segments, setSegments] = useState<Segment[]>([]);
  const pathRef = useRef<SVGPathElement>(null);

  // Compute heatmap segments once the SVG path is in the DOM
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

  // Rider position dot — approximate using path geometry when segments available
  const trackPctX = 200 + Math.cos(t.trackPos * 2 * Math.PI) * 140;
  const trackPctY = 280 + Math.sin(t.trackPos * 2 * Math.PI) * 140;

  // Interpolate rider dot along actual path when segments are available
  const riderSegIdx = segments.length > 0
    ? Math.min(segments.length - 1, Math.round(t.trackPos * (segments.length - 1)))
    : -1;
  const riderX = riderSegIdx >= 0 ? segments[riderSegIdx].x1 : trackPctX;
  const riderY = riderSegIdx >= 0 ? segments[riderSegIdx].y1 : trackPctY;

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

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Circuit Intelligence</h1>
          <p className="page-subtitle">Autodromo del Mugello · 5.245 km · 23 laps</p>
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
        </div>
      </div>

      <div className="grid-2-1 mb-4">

        {/* ── Circuit map with heatmap ────────────────────────────────────── */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Track Map · Heatmap</span>
            <div className="flex items-center gap-3">
              {/* Channel selector */}
              <div style={{
                display: 'flex',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 6,
                padding: 2,
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
                      transition: 'background 0.12s, color 0.12s',
                    }}
                  >
                    {CHANNEL_LABELS[ch]}
                  </button>
                ))}
              </div>
              <span className="badge badge-red">P3 · Lap {t.lapCount}</span>
            </div>
          </div>

          {/* Color legend */}
          <div style={{ padding: '8px 16px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <ColorLegend channel={heatChannel} />
          </div>

          <div className="card-body" style={{ display: 'flex', justifyContent: 'center', padding: '16px' }}>
            <svg width="100%" viewBox="0 0 800 560" style={{ maxHeight: 380 }}>

              {/* ── Background circuit (thick, dim) ──────────────────────── */}
              <path
                d={CIRCUIT_PATH}
                fill="none"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="20"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* ── Heatmap segments ──────────────────────────────────────── */}
              {/* Hidden path used only to compute segment coords */}
              <path
                ref={pathRef}
                d={CIRCUIT_PATH}
                fill="none"
                stroke="none"
                strokeWidth="0"
              />

              {/* Heatmap color lines */}
              {segments.map((seg, i) => (
                <line
                  key={i}
                  x1={seg.x1} y1={seg.y1}
                  x2={seg.x2} y2={seg.y2}
                  stroke={heatColor(channelValue(seg.pos, heatChannel), heatChannel)}
                  strokeWidth="18"
                  strokeLinecap="round"
                  opacity="0.88"
                />
              ))}

              {/* ── Center line (thin, white) ─────────────────────────────── */}
              <path
                d={CIRCUIT_PATH}
                fill="none"
                stroke="rgba(255,255,255,0.35)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* ── DRS Zone highlight ────────────────────────────────────── */}
              <line x1="250" y1="80" x2="400" y2="140"
                    stroke="var(--green)" strokeWidth="6" strokeOpacity="0.55" />

              {/* ── Sector markers ────────────────────────────────────────── */}
              <circle cx="250" cy="80" r="7" fill="var(--green)" opacity="0.9" />
              <text x="262" y="76" fill="var(--text)" fontSize="11"
                    fontFamily="JetBrains Mono,monospace" fontWeight="700">S1</text>
              <circle cx="480" cy="200" r="7" fill="var(--yellow)" opacity="0.9" />
              <text x="492" y="196" fill="var(--text)" fontSize="11"
                    fontFamily="JetBrains Mono,monospace" fontWeight="700">S2</text>
              <circle cx="400" cy="378" r="7" fill="var(--blue)" opacity="0.9" />
              <text x="412" y="374" fill="var(--text)" fontSize="11"
                    fontFamily="JetBrains Mono,monospace" fontWeight="700">S3</text>

              {/* ── Rider position ────────────────────────────────────────── */}
              <circle
                cx={riderX}
                cy={riderY}
                r="10"
                fill="var(--accent)"
                style={{ filter: 'drop-shadow(0 0 8px var(--accent))' }}
              />
              <text x={riderX - 4} y={riderY + 4} fill="white"
                    fontSize="9" fontFamily="JetBrains Mono,monospace" fontWeight="700">
                47
              </text>
            </svg>
          </div>
        </div>

        {/* ── Right column ────────────────────────────────────────────────── */}
        <div className="flex-col gap-3">

          {/* Sector times */}
          <div className="card">
            <div className="card-header"><span className="card-title">Sector Analysis</span></div>
            {SECTORS.map(s => (
              <div className="sector-row" key={s.id}>
                <span className="sector-num" style={{ color: s.color }}>{s.id}</span>
                <div>
                  <div className="sector-time">{s.time}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Best: {s.best}</div>
                </div>
                <div className="sector-delta" style={{ color: 'var(--accent)' }}>{s.delta}</div>
                <div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${Math.abs(parseFloat(s.delta)) * 100}%`, background: s.color }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Speed traps */}
          <div className="card">
            <div className="card-header"><span className="card-title">Speed Traps</span></div>
            <div className="card-body flex-col gap-3" style={{ gap: 12 }}>
              {SPEED_TRAPS.map(st => (
                <div key={st.name}>
                  <div className="flex items-center justify-between mb-3" style={{ marginBottom: 4 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{st.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{st.pos}</div>
                    </div>
                    <span className="text-mono" style={{ fontWeight: 700, fontSize: 18 }}>
                      {st.speed} <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>km/h</span>
                    </span>
                  </div>
                  <div className="bar-track">
                    <div className="bar-fill cyan" style={{ width: `${(st.speed / 350) * 100}%` }} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Session max: {st.max} km/h</div>
                </div>
              ))}
            </div>
          </div>

          {/* DRS */}
          <div className="card">
            <div className="card-header"><span className="card-title">DRS Zones</span></div>
            <div className="card-body flex-col gap-3" style={{ gap: 10 }}>
              {DRS_ZONES.map(drs => (
                <div key={drs.name} className="flex items-center justify-between">
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{drs.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{drs.start} → {drs.end}</div>
                  </div>
                  <span className={`badge ${drs.active ? 'badge-green' : 'badge-muted'}`}>
                    {drs.active ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Track evolution */}
      <div className="card">
        <div className="card-header"><span className="card-title">Track Evolution & Conditions</span></div>
        <div className="card-body">
          <div className="grid-4">
            {[
              { label: 'Track Rubber', value: '74%',  color: 'var(--green)',  note: 'High grip zone' },
              { label: 'Track Temp',   value: '48°C', color: 'var(--orange)', note: '+3°C vs FP3' },
              { label: 'Wind Effect',  value: '0.4s', color: 'var(--blue)',   note: 'Sector 2 headwind' },
              { label: 'Grip Level',   value: 'HIGH', color: 'var(--green)',  note: 'Tyre limit: rear' },
            ].map(c => (
              <div key={c.label} className="stat-tile">
                <div className="stat-tile__label">{c.label}</div>
                <div className="text-mono" style={{ fontSize: 22, fontWeight: 700, color: c.color }}>{c.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{c.note}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
