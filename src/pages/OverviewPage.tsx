/**
 * OverviewPage — Expert Race Overview with sector analysis and mini circuit map.
 *
 * Expert additions:
 *   • Sector time delta bars — S1/S2/S3 vs personal best
 *   • Gear distribution chart — heatmap of gear usage
 *   • Live performance delta overlay — actual vs Digital Twin predicted pace
 *   • Fuel consumption tracker with depletion model
 *   • Enhanced rivals table with last-lap pace comparison
 */
import { useState, useEffect, useRef, useMemo } from 'react';
import { Flag, Zap, TrendingUp, Activity } from 'lucide-react';
import { useLiveTelemetry } from '../hooks/useLiveTelemetry';
import { Tabs } from '../components/Tabs';
import { MotorbikeDiagnostics, type BikeTelemetry } from '../components/MotorbikeDiagnostics';

// ── Types ─────────────────────────────────────────────────────────────────────

interface FeedEvent { id: number; time: string; color: string; text: string }

// ── Baseline feed ─────────────────────────────────────────────────────────────

const INITIAL_EVENTS: FeedEvent[] = [
  { id: 1, time: '14:22', color: 'var(--green)',  text: 'Crew Chief — <strong>Sector 3 gain +0.15s</strong> vs Lap 5 baseline' },
  { id: 2, time: '14:19', color: 'var(--blue)',   text: 'Digital Twin — Soft rear degradation above model at <strong>1.2% / lap</strong>' },
  { id: 3, time: '14:17', color: 'var(--yellow)', text: 'Tyre Agent — <strong>Pit window opens Lap 9</strong> — optimal Lap 11' },
  { id: 4, time: '14:15', color: 'var(--accent)', text: 'Race Control — <strong>Yellow flag sector 5</strong> — Gap control active' },
  { id: 5, time: '14:12', color: 'var(--green)',  text: 'Setup Agent — Engine map 6 delivering +2.1 km/h top speed' },
  { id: 6, time: '14:09', color: 'var(--blue)',   text: 'KDD Pipeline — Lap 4 telemetry processed — <strong>12,400 samples</strong>' },
];

type FeedFn = (gap: string, speed: number, fuel: number, lap: number) => { color: string; text: string };

const FEED_TEMPLATES: FeedFn[] = [
  (gap)              => ({ color: 'var(--blue)',   text: `Gap Monitor — P2 gap now <strong>${gap}</strong>` }),
  (_g, speed)        => ({ color: 'var(--green)',  text: `Telemetry — Top speed Straight 1: <strong>${speed} km/h</strong>` }),
  ()                 => ({ color: 'var(--yellow)', text: 'Tyre Agent — Rear temp stable at 98°C · degradation nominal' }),
  (_g, _s, fuel)     => ({ color: 'var(--orange)', text: `Fuel Model — Remaining: <strong>${fuel.toFixed(1)} kg</strong>` }),
  ()                 => ({ color: 'var(--blue)',   text: 'KDD Pipeline — Telemetry batch processed · 12,400 samples' }),
  (_g, _s, _f, lap)  => ({ color: 'var(--green)',  text: `Digital Twin — Lap ${lap} delta: <strong>–0.08s</strong> vs predicted` }),
  ()                 => ({ color: 'var(--accent)', text: 'Race Control — No incidents in last 2 laps. Green flag all sectors.' }),
];

// ── Rivals ────────────────────────────────────────────────────────────────────

const BASE_RIVALS = [
  { basePos: 1, rider: 'M. Marquez',    team: 'Gresini Duc.',  num: 93, self: false },
  { basePos: 2, rider: 'P. Espargaro',  team: 'Aprilia',       num: 41, self: false },
  { basePos: 3, rider: '#47 KDD',       team: 'KDD Racing',    num: 47, self: true  },
  { basePos: 4, rider: 'J. Martin',     team: 'Pramac Duc.',   num: 89, self: false },
  { basePos: 5, rider: 'E. Bastianini', team: 'Lenovo Duc.',   num: 23, self: false },
];

function buildRivals(position: number, gap: string) {
  const myGap = gap === 'leader' ? 'LEADER' : gap;
  return BASE_RIVALS.map((r, i) => {
    const displayPos  = r.self ? position : i < position - 1 ? i + 1 : i + 1;
    const gapToLead   = r.self ? myGap : r.basePos === 1 ? 'LEADER' : `+${(r.basePos * 0.421).toFixed(3)}s`;
    const lastLapDiff = r.self ? '—' : r.basePos < position ? `+${(Math.random() * 0.3).toFixed(3)}s` : `–${(Math.random() * 0.2).toFixed(3)}s`;
    return { ...r, pos: displayPos, gap: gapToLead, lastLapDiff };
  }).sort((a, b) => a.pos - b.pos);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatLap(s: number) {
  const m = Math.floor(s / 60);
  const sec = (s % 60).toFixed(3).padStart(6, '0');
  return `${m}:${sec}`;
}

function now() {
  return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

// ── Sector delta bar ──────────────────────────────────────────────────────────

function SectorBar({ sector, delta, base }: { sector: string; delta: number; base: number }) {
  const pct = Math.min(100, Math.abs(delta / base) * 100 * 10);
  const isGain = delta < 0;  // negative delta = faster = gain
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{sector}</span>
        <span style={{
          fontSize: 11, fontFamily: 'JetBrains Mono,monospace', fontWeight: 700,
          color: isGain ? 'var(--green)' : Math.abs(delta) < 0.05 ? 'var(--yellow)' : 'var(--accent)',
        }}>
          {delta >= 0 ? '+' : ''}{delta.toFixed(3)}s
        </span>
      </div>
      <div className="bar-track">
        <div
          className="bar-fill"
          style={{
            width: `${pct}%`,
            background: isGain ? 'var(--green)' : Math.abs(delta) < 0.05 ? 'var(--yellow)' : 'var(--accent)',
          }}
        />
      </div>
    </div>
  );
}

// ── Mugello mini track map ────────────────────────────────────────────────────

const MUGELLO_PTS: [number, number][] = [
  [30,148],[70,152],[110,153],[150,152],[182,146],
  [205,132],[214,116],[216,98],[210,82],[198,68],
  [182,56],[164,49],[144,46],[124,48],[106,53],
  [88,62],[74,74],[66,90],[62,108],[64,126],
  [70,140],[88,148],[30,148],
];

function interpolateTrackPos(pts: [number, number][], frac: number): [number, number] {
  const norm = ((frac % 1) + 1) % 1;
  const dists: number[] = [0];
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i][0] - pts[i - 1][0];
    const dy = pts[i][1] - pts[i - 1][1];
    dists.push(dists[i - 1] + Math.sqrt(dx * dx + dy * dy));
  }
  const total = dists[dists.length - 1];
  const target = norm * total;
  let seg = 0;
  while (seg < dists.length - 2 && dists[seg + 1] < target) seg++;
  const t0 = dists[seg + 1] === dists[seg] ? 0 : (target - dists[seg]) / (dists[seg + 1] - dists[seg]);
  const [x0, y0] = pts[seg];
  const [x1, y1] = pts[seg + 1];
  return [x0 + t0 * (x1 - x0), y0 + t0 * (y1 - y0)];
}

const TRACK_RIVALS: { num: number; color: string; offset: number }[] = [
  { num: 93, color: '#E03737', offset: -0.06 },
  { num: 41, color: '#F59E0B', offset: -0.12 },
  { num: 89, color: '#3B82F6', offset: +0.05 },
  { num: 23, color: '#22C55E', offset: +0.10 },
];

function MiniTrackMap({ trackPos }: { trackPos: number }) {
  const polyStr = MUGELLO_PTS.map(p => `${p[0]},${p[1]}`).join(' ');
  const [kx, ky] = interpolateTrackPos(MUGELLO_PTS, trackPos);
  return (
    <div>
      <svg width="100%" height="170" viewBox="0 0 250 170" preserveAspectRatio="xMidYMid meet">
        {/* shadow */}
        <polyline points={polyStr} fill="none" stroke="rgba(255,255,255,0.04)"
          strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
        {/* base track */}
        <polyline points={polyStr} fill="none" stroke="rgba(255,255,255,0.10)"
          strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        {/* sector colour overlays */}
        <polyline
          points={MUGELLO_PTS.slice(0, 8).map(p => `${p[0]},${p[1]}`).join(' ')}
          fill="none" stroke="var(--blue)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity="0.55"
        />
        <polyline
          points={MUGELLO_PTS.slice(7, 15).map(p => `${p[0]},${p[1]}`).join(' ')}
          fill="none" stroke="var(--yellow)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity="0.55"
        />
        <polyline
          points={MUGELLO_PTS.slice(14).map(p => `${p[0]},${p[1]}`).join(' ')}
          fill="none" stroke="var(--green)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity="0.55"
        />
        {/* rival dots */}
        {TRACK_RIVALS.map(r => {
          const [rx, ry] = interpolateTrackPos(MUGELLO_PTS, (trackPos + r.offset + 1) % 1);
          return <circle key={r.num} cx={rx} cy={ry} r="4" fill={r.color} opacity="0.82" />;
        })}
        {/* KDD #47 */}
        <circle cx={kx} cy={ky} r="5.5" fill="var(--accent)" stroke="white" strokeWidth="1.5"
          style={{ filter: 'drop-shadow(0 0 5px var(--accent))' }} />
        <text x={kx + 8} y={ky + 4} fill="white" fontSize="8" fontWeight="700"
          fontFamily="JetBrains Mono,monospace">#47</text>
        {/* S/F marker */}
        <rect x="26" y="142" width="6" height="12" rx="1" fill="rgba(255,255,255,0.22)" />
        <text x="35" y="151" fill="#535A6E" fontSize="7" fontFamily="JetBrains Mono,monospace">S/F</text>
        <text x="125" y="11" textAnchor="middle" fill="rgba(255,255,255,0.15)"
          fontSize="8" fontFamily="JetBrains Mono,monospace" letterSpacing="0.12em">MUGELLO</text>
      </svg>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 2 }}>
        {([['S1','var(--blue)'],['S2','var(--yellow)'],['S3','var(--green)']] as [string,string][]).map(([s,c]) => (
          <span key={s} style={{ display:'flex', alignItems:'center', gap:3, fontSize:9, color:'var(--text-muted)' }}>
            <span style={{ width:12, height:3, background:c, borderRadius:1, display:'inline-block' }} />{s}
          </span>
        ))}
        <span style={{ display:'flex', alignItems:'center', gap:3, fontSize:9, color:'var(--accent)' }}>
          <span style={{ width:7, height:7, background:'var(--accent)', borderRadius:'50%', display:'inline-block' }} />KDD #47
        </span>
        {TRACK_RIVALS.map(r => (
          <span key={r.num} style={{ display:'flex', alignItems:'center', gap:3, fontSize:9, color:r.color }}>
            <span style={{ width:5, height:5, background:r.color, borderRadius:'50%', display:'inline-block' }} />#{r.num}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Championship standings ────────────────────────────────────────────────────

const CHAMPIONSHIP_DATA: { rider: string; num: number; pts: number; self: boolean }[] = [
  { rider: 'J. Martin',    num: 89, pts: 142, self: false },
  { rider: 'M. Marquez',   num: 93, pts: 138, self: false },
  { rider: '#47 KDD',      num: 47, pts: 115, self: true  },
  { rider: 'P. Espargaro', num: 41, pts: 109, self: false },
  { rider: 'F. Bagnaia',   num: 1,  pts:  96, self: false },
];

function ChampionshipBars() {
  const maxPts = CHAMPIONSHIP_DATA[0].pts;
  const selfPts = CHAMPIONSHIP_DATA.find(r => r.self)?.pts ?? 0;
  const gap = maxPts - selfPts;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      {CHAMPIONSHIP_DATA.map((r, i) => {
        const podCol = i === 0 ? '#F59E0B' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'var(--text-muted)';
        return (
          <div key={r.num} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ width:22, fontFamily:'JetBrains Mono,monospace', fontWeight:800, fontSize:11, color:podCol, textAlign:'right', flexShrink:0 }}>
              P{i + 1}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
                <span style={{ fontSize:11, fontWeight:r.self ? 700 : 400, color:r.self ? 'var(--accent)' : 'var(--text)' }}>
                  {r.rider}
                  {r.self && <span className="badge badge-red" style={{ marginLeft:4, fontSize:8 }}>YOU</span>}
                </span>
                <span style={{ fontSize:11, fontFamily:'JetBrains Mono,monospace', color:'var(--text-muted)' }}>{r.pts}</span>
              </div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width:`${(r.pts / maxPts) * 100}%`, background:r.self ? 'var(--accent)' : 'rgba(255,255,255,0.15)' }} />
              </div>
            </div>
          </div>
        );
      })}
      <div style={{ fontSize:10, color:'var(--text-muted)', textAlign:'right', marginTop:2 }}>
        {gap > 0 ? `–${gap} pts from lead · After R6` : 'CHAMPIONSHIP LEADER'}
      </div>
    </div>
  );
}

// ── Stint progress ────────────────────────────────────────────────────────────

function StintProgress({ tyreAge, lapCount }: { tyreAge: number; lapCount: number }) {
  const optPit   = Math.max(lapCount + 1, lapCount + Math.round((18 - tyreAge) / 1.5));
  const lapsLeft = Math.max(0, optPit - lapCount);
  const stintPct = Math.min(100, (tyreAge / 18) * 100);
  const urgency  = lapsLeft <= 2 ? 'var(--accent)' : lapsLeft <= 5 ? 'var(--yellow)' : 'var(--green)';
  const barCol   = stintPct > 85 ? 'var(--accent)' : stintPct > 65 ? 'var(--yellow)' : 'var(--blue)';
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      <div>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
          <span style={{ fontSize:11, color:'var(--text-muted)' }}>Stint age</span>
          <span style={{ fontSize:11, fontFamily:'JetBrains Mono,monospace' }}>{tyreAge} / 18 laps</span>
        </div>
        <div className="bar-track" style={{ height:8, borderRadius:3 }}>
          <div style={{ width:`${stintPct}%`, height:8, background:barCol, borderRadius:3, transition:'width 0.4s' }} />
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
        {([
          { label:'Stint Laps',     value:`${tyreAge}L`,       color:'var(--text)' },
          { label:'Laps to Pit',    value:`${lapsLeft}`,        color:urgency },
          { label:'Pit Window',     value:`L${optPit}`,         color:'var(--green)' },
          { label:'Race Laps Left', value:`${23 - lapCount}`,   color:'var(--text-muted)' },
        ] as { label:string; value:string; color:string }[]).map(item => (
          <div key={item.label} style={{ background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:6, padding:'7px 9px' }}>
            <div style={{ fontSize:8, color:'var(--text-muted)', textTransform:'uppercase', marginBottom:3, letterSpacing:'0.07em' }}>
              {item.label}
            </div>
            <div style={{ fontFamily:'JetBrains Mono,monospace', fontWeight:800, fontSize:15, color:item.color }}>
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function OverviewPage() {
  const t = useLiveTelemetry();
  const [feedEvents, setFeedEvents] = useState<FeedEvent[]>(INITIAL_EVENTS);
  const [activeTab, setActiveTab] = useState<'live' | 'telemetry'>('live');
  const templateIdx  = useRef(0);
  const lastLapRef   = useRef(t.lapCount);

  // Generate feed events every 9s
  useEffect(() => {
    const interval = setInterval(() => {
      const idx = templateIdx.current % FEED_TEMPLATES.length;
      templateIdx.current += 1;
      const { color, text } = FEED_TEMPLATES[idx](t.gap, t.speed, t.fuelLoad, t.lapCount);
      setFeedEvents(prev => [
        { id: Date.now(), time: now(), color, text },
        ...prev.slice(0, 11),
      ]);
    }, 9000);
    return () => clearInterval(interval);
  }, [t.gap, t.speed, t.fuelLoad, t.lapCount]);

  // Lap-complete events
  useEffect(() => {
    if (t.lapCount > lastLapRef.current) {
      lastLapRef.current = t.lapCount;
      setFeedEvents(prev => [{
        id: Date.now(), time: now(), color: 'var(--accent)',
        text: `<strong>LAP ${t.lapCount} COMPLETE</strong> — ${formatLap(t.lastLap)} · Best ${formatLap(t.bestLap)}`,
      }, ...prev.slice(0, 11)]);
    }
  }, [t.lapCount, t.lastLap, t.bestLap]);

  const rivals = buildRivals(t.position, t.gap);

  // Lap delta analysis
  const lapDelta = t.lastLap - t.bestLap;
  const lapDeltaStr   = lapDelta >= 0 ? `+${lapDelta.toFixed(3)}` : lapDelta.toFixed(3);
  const lapDeltaColor = lapDelta > 0.5 ? 'var(--accent)' : lapDelta > 0.1 ? 'var(--yellow)' : 'var(--green)';

  // Sector deltas (simulated from position on track)
  const sectorDeltas = useMemo(() => {
    const base = 0.12;
    const pos = t.trackPos;
    return [
      { sector: 'S1', delta: (pos > 0.33 ? -0.05 : +0.08) + (Math.random() * 0.04 - 0.02) },
      { sector: 'S2', delta: +0.03 + (Math.random() * 0.04 - 0.02) },
      { sector: 'S3', delta: -0.07 + (Math.random() * 0.04 - 0.02) },
    ];
  }, [t.lapCount, t.trackPos]);

  // Gear distribution (simulated from current telemetry)
  const gearDist = useMemo(() => {
    const gear = t.gear;
    const base = [2, 5, 18, 28, 24, 14, 9]; // typical MotoGP Mugello dist
    return base.map((v, i) => ({
      gear: i + 1,
      pct: Math.max(0, v + (i + 1 === gear ? 8 : Math.random() * 4 - 2)),
      active: i + 1 === gear,
    }));
  }, [t.gear]);

  // Fuel model
  const fuelUsedPerLap = 2.18;
  const fuelRemaining = t.fuelLoad;
  const lapsOnFuel = fuelRemaining / fuelUsedPerLap;

  const posColor = (pos: number) =>
    pos === 1 ? '#F59E0B' : pos === 2 ? '#C0C0C0' : pos === 3 ? '#CD7F32' : 'var(--text-muted)';

  return (
    <div className="page">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
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

      <Tabs
        tabs={[
          { id: 'live', label: 'Live Track & AI Predictions' },
          { id: 'telemetry', label: 'Motorbike Telemetry & Diagnostics' },
        ]}
        active={activeTab}
        onChange={(id) => setActiveTab(id as 'live' | 'telemetry')}
      />

      {activeTab === 'telemetry' && <MotorbikeDiagnostics t={t as unknown as BikeTelemetry} />}

      {activeTab === 'live' && (<>
      {/* ── KPI row ─────────────────────────────────────────────────────────── */}
      <div className="grid-4 mb-4">
        <div className="stat-tile accent-border">
          <div className="stat-tile__label">Position</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            <span className="stat-tile__value">P{t.position}</span>
            <span className="badge badge-yellow" style={{ marginBottom: 4 }}>GAP {t.gap}</span>
          </div>
          <div className="stat-tile__delta" style={{ color: t.position <= 3 ? 'var(--green)' : 'var(--yellow)' }}>
            {t.position <= 3 ? `Top ${t.position} · points zone` : 'Outside top 3'}
          </div>
        </div>
        <div className="stat-tile green-border">
          <div className="stat-tile__label">Last Lap</div>
          <span className="stat-tile__value text-mono" style={{ fontSize: 20 }}>{formatLap(t.lastLap)}</span>
          <div className="stat-tile__delta" style={{ color: lapDeltaColor }}>
            {lapDeltaStr}s vs personal best
          </div>
        </div>
        <div className="stat-tile blue-border">
          <div className="stat-tile__label">Best Lap</div>
          <span className="stat-tile__value text-mono" style={{ fontSize: 20 }}>{formatLap(t.bestLap)}</span>
          <div className="stat-tile__delta delta-pos">⚡ Personal best</div>
        </div>
        <div className="stat-tile yellow-border">
          <div className="stat-tile__label">Fuel Remaining</div>
          <span className="stat-tile__value" style={{ color: fuelRemaining < 5 ? 'var(--accent)' : undefined }}>
            {fuelRemaining.toFixed(1)}<span className="stat-tile__unit">kg</span>
          </span>
          <div className="stat-tile__delta delta-neu">
            ~{lapsOnFuel.toFixed(1)} laps @ {fuelUsedPerLap} kg/lap
          </div>
        </div>
      </div>

      {/* ── Middle grid ─────────────────────────────────────────────────────── */}
      <div className="grid-3-2 mb-4">

        {/* Left: Agent event feed */}
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
                <span className="event-text" dangerouslySetInnerHTML={{ __html: ev.text }} />
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Live snapshot */}
          <div className="card">
            <div className="card-header">
              <span className="card-title flex items-center gap-2">
                <Activity size={14} style={{ color: 'var(--blue)' }} />
                Live Snapshot
              </span>
              <span className="badge badge-muted" style={{ fontFamily: 'JetBrains Mono,monospace' }}>10 Hz</span>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <div className="card-label">Speed</div>
                  <span className="telem-lg text-mono">
                    {t.speed}<span className="telem-unit" style={{ fontSize: 14 }}> km/h</span>
                  </span>
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

              {/* Throttle */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span className="card-label">Throttle</span>
                  <span className="text-mono" style={{ fontSize: 12 }}>{t.throttle}%</span>
                </div>
                <div className="bar-track"><div className="bar-fill green" style={{ width: `${t.throttle}%` }} /></div>
              </div>

              {/* Brake */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span className="card-label">Brake</span>
                  <span className="text-mono" style={{ fontSize: 12 }}>{t.brake}%</span>
                </div>
                <div className="bar-track"><div className="bar-fill" style={{ width: `${t.brake}%`, background: 'var(--accent)' }} /></div>
              </div>

              {/* Lean angle */}
              <div style={{ paddingTop: 10, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                <span className="card-label">Lean Angle</span>
                <span className="text-mono" style={{ fontSize: 13, color: t.leanAngle > 45 ? 'var(--accent)' : 'var(--text)' }}>
                  {t.leanAngle.toFixed(1)}°
                </span>
              </div>
            </div>
          </div>

          {/* Tyres */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Tyres</span>
              <span className="badge badge-orange">Lap {t.rearTyreAge}</span>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div className="card-label" style={{ marginBottom: 6 }}>Front — {t.frontCompound}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[{ temp: t.tireFrontLeft, label: 'FL' }, { temp: t.tireFrontRight, label: 'FR' }].map(tire => (
                      <div key={tire.label} className={`tire ${tire.temp > 100 ? 'hot' : tire.temp > 90 ? 'warm' : 'nominal'}`}>
                        <span className="t-temp">{tire.temp}°</span>
                        <span className="t-label">{tire.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="card-label" style={{ marginBottom: 6 }}>Rear — {t.rearCompound}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[{ temp: t.tireRearLeft, label: 'RL' }, { temp: t.tireRearRight, label: 'RR' }].map(tire => (
                      <div key={tire.label} className={`tire ${tire.temp > 105 ? 'hot' : tire.temp > 95 ? 'warm' : 'nominal'}`}>
                        <span className="t-temp">{tire.temp}°</span>
                        <span className="t-label">{tire.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Analysis row ─────────────────────────────────────────────────────── */}
      <div className="grid-3 mb-4">

        {/* Sector delta analysis */}
        <div className="card">
          <div className="card-header">
            <span className="card-title flex items-center gap-2">
              <TrendingUp size={14} style={{ color: 'var(--blue)' }} />
              Sector Delta — vs Best
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Last lap</span>
          </div>
          <div className="card-body" style={{ flexDirection: 'column', gap: 14 }}>
            {sectorDeltas.map(s => (
              <SectorBar key={s.sector} sector={s.sector} delta={s.delta} base={0.5} />
            ))}
            <div style={{ paddingTop: 10, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total</span>
              <span style={{
                fontFamily: 'JetBrains Mono,monospace', fontSize: 14, fontWeight: 700,
                color: lapDeltaColor,
              }}>
                {lapDeltaStr}s
              </span>
            </div>
          </div>
        </div>

        {/* Gear distribution */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Gear Distribution</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>% lap time per gear</span>
          </div>
          <div className="card-body" style={{ flexDirection: 'column', gap: 6 }}>
            {gearDist.map(g => (
              <div key={g.gear} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontFamily: 'JetBrains Mono,monospace', fontWeight: 800, fontSize: 13,
                  width: 20, textAlign: 'right',
                  color: g.active ? 'var(--accent)' : 'var(--text-muted)',
                }}>
                  {g.gear}
                </span>
                <div style={{ flex: 1 }}>
                  <div className="bar-track">
                    <div className="bar-fill" style={{
                      width: `${g.pct}%`,
                      background: g.active ? 'var(--accent)' : 'rgba(255,255,255,0.12)',
                    }} />
                  </div>
                </div>
                <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono,monospace', color: 'var(--text-muted)', width: 32 }}>
                  {g.pct.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Pace model: last 8 laps actual vs DT predicted */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Pace vs Model</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Digital Twin Δ</span>
          </div>
          <div className="card-body" style={{ flexDirection: 'column' }}>
            <svg width="100%" height="90" viewBox="0 0 220 90" preserveAspectRatio="xMidYMid meet">
              {/* Zero line */}
              <line x1="0" y1="45" x2="220" y2="45" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
              {/* +0.1s / -0.1s labels */}
              <text x="2" y="30" fill="#535A6E" fontSize="8" fontFamily="JetBrains Mono,monospace">+0.10</text>
              <text x="2" y="62" fill="#535A6E" fontSize="8" fontFamily="JetBrains Mono,monospace">–0.10</text>
              <text x="2" y="47" fill="#535A6E" fontSize="8" fontFamily="JetBrains Mono,monospace">0.00</text>
              {/* Delta bars for last 8 laps */}
              {Array.from({ length: 8 }, (_, i) => {
                const lap = Math.max(1, t.lapCount - 7 + i);
                // Simulate pace delta with some realism
                const delta = Math.sin(lap * 0.9 + 1.2) * 0.08 + (i === 7 ? lapDelta * 0.3 : 0);
                const barH = Math.abs(delta) * 400;
                const isGain = delta < 0;
                const barY = isGain ? 45 - barH : 45;
                const barX = 30 + i * 25;
                return (
                  <g key={lap}>
                    <rect x={barX} y={barY} width="18" height={barH}
                      fill={isGain ? 'var(--green)' : 'var(--accent)'} opacity="0.75" rx="2" />
                    <text x={barX + 9} y="85" textAnchor="middle" fill="#535A6E" fontSize="7"
                      fontFamily="JetBrains Mono,monospace">L{lap}</text>
                  </g>
                );
              })}
            </svg>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 4 }}>
              Green = faster than model · Red = slower
            </div>
          </div>
        </div>
      </div>

      {/* ── Track map + Championship + Stint ──────────────────────────────────── */}
      <div className="grid-2 mb-4">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Live Track Position — Mugello</span>
            <span className="badge badge-muted" style={{ fontFamily:'JetBrains Mono,monospace' }}>
              {Math.round(t.trackPos * 100)}% lap
            </span>
          </div>
          <div className="card-body" style={{ flexDirection:'column' }}>
            <MiniTrackMap trackPos={t.trackPos} />
          </div>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div className="card" style={{ flex:1 }}>
            <div className="card-header">
              <span className="card-title">Championship Standings</span>
              <span className="badge badge-yellow">After R6</span>
            </div>
            <div className="card-body" style={{ flexDirection:'column' }}>
              <ChampionshipBars />
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Stint Progress</span>
              <span className="badge badge-blue">Pit Window</span>
            </div>
            <div className="card-body" style={{ flexDirection:'column' }}>
              <StintProgress tyreAge={t.rearTyreAge} lapCount={t.lapCount} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Race standings ────────────────────────────────────────────────────── */}
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
              <th>Last Lap Δ</th>
              <th style={{ width: 60 }}>Trend</th>
            </tr>
          </thead>
          <tbody>
            {rivals.map(r => (
              <tr key={r.num} style={r.self ? { background: 'var(--accent-dim)' } : {}}>
                <td>
                  <span className="text-mono" style={{ fontWeight: 800, fontSize: 13, color: posColor(r.pos) }}>
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
                <td className="mono" style={{
                  fontSize: 12,
                  color: r.lastLapDiff === '—' ? 'var(--text-muted)' :
                    r.lastLapDiff.startsWith('+') ? 'var(--accent)' : 'var(--green)',
                }}>
                  {r.lastLapDiff}
                </td>
                <td style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: 15, lineHeight: 1 }}>
                    {r.self ? '—' : r.pos <= 2 ? '↑' : r.pos >= 4 ? '↓' : '—'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </>)}

    </div>
  );
}
