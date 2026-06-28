/**
 * CrewChiefPage Expert race operations console.
 *
 * Expert-level additions:
 * - Quick-Action Command Panel pre-programmed race directives (PUSH / SAVE FUEL / BOX / STAY OUT)
 * - Priority-filtered Event Log ALL / CRITICAL / DECISIONS / RADIO tabs
 * - Live Race Standings top 5 riders with gap evolution
 * - Decision Approval Workflow CONFIRM / OVERRIDE buttons on pending decisions
 * - Animated Pit Board enhanced with tyre age + fuel
 */
import { useState, useEffect, useRef } from 'react';
import {
  Radio, Flag, AlertOctagon, MessageSquare, Zap,
  ArrowUp, ArrowDown, Minus, Check, X,
} from 'lucide-react';
import { useLiveTelemetry } from '../hooks/useLiveTelemetry';
import { renderHighlighted } from '../lib/richText';
import { MUGELLO_CIRCUIT } from '../domain/sessionTruth';

// Types

type EventType = 'decision' | 'info' | 'alert' | 'radio' | 'flag' | 'action';
type Priority  = 'high' | 'medium' | 'low';

interface RaceEvent {
  id: number;
  time: string;
  lap: number;
  type: EventType;
  priority: Priority;
  source: string;
  message: string;
}

type FilterTab = 'all' | 'critical' | 'decisions' | 'radio';

// Initial events

const INITIAL_EVENTS: RaceEvent[] = [
  { id: 1,  time: '14:22:14', lap: 7, type: 'decision', priority: 'high',   source: 'Crew Chief',   message: 'STAY OUT — Gap to P2 holding at +0.842s. Tyre still working.' },
  { id: 2,  time: '14:21:58', lap: 7, type: 'info',     priority: 'medium', source: 'Tyre Agent',   message: 'Rear soft degradation at 1.2% / lap. Model predicts cliff at Lap 11.' },
  { id: 3,  time: '14:21:30', lap: 7, type: 'radio',    priority: 'medium', source: '#47',          message: '"Rear is sliding more on exit of T7. Give me TC2."' },
  { id: 4,  time: '14:21:30', lap: 7, type: 'decision', priority: 'high',   source: 'Crew Chief',   message: 'TC2 CONFIRMED. Setting engine map 6 → 7 on next straight.' },
  { id: 5,  time: '14:20:45', lap: 6, type: 'alert',    priority: 'high',   source: 'Race Control', message: 'Yellow flag Sector 5. Reduce speed in zone.' },
  { id: 6,  time: '14:20:45', lap: 6, type: 'info',     priority: 'medium', source: 'Gap Monitor',  message: 'Martin closing +0.3s last lap. Monitor closely.' },
  { id: 7,  time: '14:19:52', lap: 6, type: 'info',     priority: 'low',    source: 'KDD Pipeline', message: 'Lap 6 telemetry processed. 12,400 samples ingested.' },
  { id: 8,  time: '14:19:20', lap: 5, type: 'decision', priority: 'high',   source: 'Crew Chief',   message: 'PIT WINDOW OPEN from Lap 9. Optimal: Lap 11. Prepare in-lap sequence.' },
  { id: 9,  time: '14:18:41', lap: 5, type: 'radio',    priority: 'low',    source: '#47',          message: '"Copy. Front grip feels good. Keep strategy."' },
  { id: 10, time: '14:17:15', lap: 4, type: 'info',     priority: 'low',    source: 'Digital Twin', message: 'Lap 4 delta: -0.08s vs predicted. Sector 2 gain confirmed.' },
];

// Live feed pool
const LIVE_MESSAGES = [
  { type: 'info' as EventType,     source: 'Gap Monitor',  priority: 'low'    as Priority, fn: (gap: string)               => `P2 gap: ${gap} — monitoring.` },
  { type: 'info' as EventType,     source: 'KDD Agent',    priority: 'low'    as Priority, fn: ()                          => 'Fuel consumption nominal — 2.18 kg / lap.' },
  { type: 'info' as EventType,     source: 'Tyre Agent',   priority: 'medium' as Priority, fn: ()                          => 'Rear temp stabilizing at 98°C. Degradation nominal.' },
  { type: 'info' as EventType,     source: 'KDD Pipeline', priority: 'low'    as Priority, fn: (_g: string, lap: number)   => `Lap ${lap} telemetry ingested — 12,400 samples.` },
  { type: 'info' as EventType,     source: 'Digital Twin', priority: 'low'    as Priority, fn: ()                          => 'Sim delta: -0.04s vs predicted. Within model bounds.' },
  { type: 'alert' as EventType,    source: 'Fuel Model',   priority: 'medium' as Priority, fn: (_g: string, _l: number, fuel: number) => `Fuel: ${fuel.toFixed(1)} kg remaining — on target.` },
];

// Pit crew timing data
const PIT_CREW_TIMING = [
  { role: 'Front Tyre Change', avg: '2.3s', best: '2.1s', status: 'ready'   },
  { role: 'Rear Tyre Change',  avg: '2.5s', best: '2.2s', status: 'ready'   },
  { role: 'Fuel (if needed)',  avg: '3.2s', best: '—',    status: 'standby' },
  { role: 'Pit Board',         avg: '—',    best: '—',    status: 'active'  },
];

// Track flags
const FLAG_STATUS = [
  { sector: 'S1', flag: 'GREEN'  as 'GREEN' | 'YELLOW', lap: 7 },
  { sector: 'S2', flag: 'GREEN'  as 'GREEN' | 'YELLOW', lap: 7 },
  { sector: 'S3', flag: 'GREEN'  as 'GREEN' | 'YELLOW', lap: 7 },
  { sector: 'S4', flag: 'GREEN'  as 'GREEN' | 'YELLOW', lap: 7 },
  { sector: 'S5', flag: 'YELLOW' as 'GREEN' | 'YELLOW', lap: 6 },
];

// Quick actions
interface QuickAction {
  label: string; shortLabel: string; color: string; bgColor: string;
  message: string; priority: Priority;
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: 'PUSH HARD',    shortLabel: 'PUSH',     color: 'var(--accent)', bgColor: 'rgba(224,55,55,0.15)', message: '⚡ PUSH HARD — Attack mode. Fuel map 8, TC1. Commit to overtake.', priority: 'high' },
  { label: 'SAVE FUEL',    shortLabel: 'FUEL',     color: 'var(--yellow)', bgColor: 'rgba(245,158,11,0.15)', message: '⛽ SAVE FUEL — Engine map 4. Recover 0.15 kg/lap. No attack until L18.', priority: 'high' },
  { label: 'BOX THIS LAP', shortLabel: 'BOX',      color: 'var(--green)',  bgColor: 'rgba(34,197,94,0.15)', message: '°—BOX THIS LAP — Confirm in-lap. Crew on standby. Hard rear ready.', priority: 'high' },
  { label: 'STAY OUT',     shortLabel: 'STAY',     color: 'var(--blue)',       bgColor: 'color-mix(in srgb, var(--blue) 15%, transparent)', message: '⏱ STAY OUT — Hold position. Monitor rear for 2 more laps before decision.', priority: 'high' },
  { label: 'TC UP',        shortLabel: 'TC+',      color: 'var(--text-muted)', bgColor: 'rgba(255,255,255,0.05)', message: '▲ TC LEVEL UP — Traction control +1 step. Protect rear for final stint.', priority: 'medium' },
  { label: 'TC DOWN',      shortLabel: 'TC-',      color: 'var(--text-muted)', bgColor: 'rgba(255,255,255,0.05)', message: '▼ TC LEVEL DOWN — Traction control -1 step. More exit drive. Monitor temp.', priority: 'medium' },
];

// Rival riders
const RIVAL_NAMES = [
  { name: 'Bagnaia',    team: 'Lenovo Duc.', num: 1  },
  { name: 'Martin',     team: 'Pramac Duc.', num: 89 },
  { name: 'KDD #47',    team: 'KDD Racing',  num: 47 },
  { name: 'Marc M.',    team: 'Gresini Duc.', num: 93 },
  { name: 'Quartararo', team: 'Monster Yam.', num: 20 },
];

// Pit window timeline

function _PitWindowTimeline({ lapCount, tyreAge }: { lapCount: number; tyreAge: number }) {
  const optPit   = Math.max(lapCount + 1, lapCount + Math.round((18 - tyreAge) / 1.5));
  const winOpen  = Math.max(lapCount + 1, optPit - 3);
  const winClose = Math.min(23, optPit + 3);
  const TOTAL    = 23; const W = 560;
  const lapX     = (lap: number) => (Math.min(TOTAL, Math.max(0, lap)) / TOTAL) * W;
  const isInWin  = lapCount >= winOpen && lapCount <= winClose;
  const lapsToOpt = Math.max(0, optPit - lapCount);
  const urgency  = lapsToOpt <= 1 ? 'var(--accent)' : lapsToOpt <= 3 ? 'var(--yellow)' : 'var(--green)';

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <span style={{ fontSize:13, fontWeight:700 }}>Pit Window Countdown</span>
          {isInWin
            ? <span className="badge badge-green" style={{ animation:'pulse 1.5s infinite' }}>WINDOW OPEN</span>
            : <span className="badge badge-muted">Opens in {Math.max(0, winOpen - lapCount)} laps</span>}
        </div>
        <span style={{ fontFamily:'JetBrains Mono,monospace', fontWeight:800, fontSize:18, color:urgency }}>
          {lapsToOpt > 0 ? `${lapsToOpt} laps to opt.` : '⚡ BOX NOW'}
        </span>
      </div>

      <svg width="100%" height="52" viewBox={`0 0 ${W} 52`} preserveAspectRatio="none">
        {/* background track */}
        <rect x="0" y="16" width={W} height="10" rx="2" fill="rgba(255,255,255,0.05)" />
        {/* completed laps */}
        <rect x="0" y="16" width={lapX(lapCount)} height="10" rx="2" fill="rgba(255,255,255,0.13)" />
        {/* window zone */}
        <rect x={lapX(winOpen)} y="11" width={lapX(winClose) - lapX(winOpen)} height="20" rx="3"
          fill="rgba(34,197,94,0.15)" stroke="rgba(34,197,94,0.4)" strokeWidth="1" />
        {/* optimal pit marker */}
        <line x1={lapX(optPit)} y1="5" x2={lapX(optPit)} y2="42" stroke="var(--green)" strokeWidth="2" />
        <text x={lapX(optPit)} y="4" textAnchor="middle" fill="var(--green)"
          fontSize="8" fontFamily="JetBrains Mono,monospace" fontWeight="700">OPT</text>
        {/* current lap */}
        <line x1={lapX(lapCount)} y1="5" x2={lapX(lapCount)} y2="42"
          stroke="white" strokeWidth="2" strokeDasharray="2,2" />
        <text x={lapX(lapCount) + 4} y="50" fill="rgba(255,255,255,0.45)"
          fontSize="7" fontFamily="JetBrains Mono,monospace">NOW</text>
        {/* lap labels */}
        {[0, 5, 10, 15, 20, 23].map(lap => (
          <text key={lap} x={lapX(lap)} y="52" textAnchor="middle"
            fill="#535A6E" fontSize="7" fontFamily="JetBrains Mono,monospace">{lap}</text>
        ))}
      </svg>

      <div style={{ display:'flex', gap:24, marginTop:6 }}>
        {([
          { label:'Window opens',  value:`L${winOpen}`,   color:'var(--text-muted)' },
          { label:'Optimal pit',   value:`L${optPit}`,    color:'var(--green)' },
          { label:'Window closes', value:`L${winClose}`,  color:'var(--text-muted)' },
          { label:'Tyre age',      value:`${tyreAge}L`,   color:tyreAge > 14 ? 'var(--yellow)' : 'var(--text-muted)' },
        ] as { label:string; value:string; color:string }[]).map(s => (
          <div key={s.label} style={{ textAlign:'center' }}>
            <div style={{ fontSize:9, color:'var(--text-muted)', textTransform:'uppercase', marginBottom:2, letterSpacing:'0.07em' }}>{s.label}</div>
            <div style={{ fontFamily:'JetBrains Mono,monospace', fontWeight:700, fontSize:13, color:s.color }}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Active strategy board

const STRAT_DATA = {
  name: '1-Stop Baseline', projectedPos: 'P2-P3', confidence: 87,
  note: 'DT model confidence 87% — Execute clean in-lap when window opens.',
  stints: [
    { num: 1, compound:'SOFT',  lapRange:'L1-', status:'IN PROGRESS' },
    { num: 2, compound:'HARD',  lapRange:'-L23', status:'PENDING' },
  ],
};

function ActiveStrategyBoard({ lapCount, optPit }: { lapCount: number; optPit: number }) {
  const lapsToBox = Math.max(0, optPit - lapCount);
  const stintPct  = Math.min(100, (lapCount / optPit) * 100);
  const confColor = STRAT_DATA.confidence >= 80 ? 'var(--green)' : 'var(--yellow)';
  const barColor  = lapsToBox <= 3 ? 'var(--accent)' : 'var(--blue)';

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <span style={{ fontWeight:700, fontSize:13 }}>{STRAT_DATA.name}</span>
          <span className="badge badge-green">ACTIVE</span>
        </div>
        <span style={{ fontFamily:'JetBrains Mono,monospace', fontWeight:800, fontSize:16, color:'var(--green)' }}>
          {STRAT_DATA.projectedPos}
        </span>
      </div>

      {/* stint 1 progress */}
      <div>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
          <span style={{ fontSize:11, color:'var(--text-muted)' }}>Stint 1 progress</span>
          <span style={{ fontSize:11, fontFamily:'JetBrains Mono,monospace' }}>L{lapCount} → pit L{optPit}</span>
        </div>
        <div className="bar-track" style={{ height:8 }}>
          <div style={{ width:'100%', height:8, background:barColor, borderRadius:4, transform:`scaleX(${stintPct / 100})`, transformOrigin:'left center', transition:'transform 0.4s var(--ease-ui)' }} />
        </div>
      </div>

      {/* stint tiles */}
      <div style={{ display:'flex', gap:8 }}>
        {STRAT_DATA.stints.map((st, i) => (
          <div key={i} style={{ flex:1, padding:'8px 10px', borderRadius: 'var(--radius)', background:i===0 ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.04)', border:`1px solid ${i===0 ? 'rgba(59,130,246,0.4)' : 'var(--border)'}` }}>
            <div style={{ fontSize:9, color:'var(--text-muted)', marginBottom:3 }}>STINT {st.num}</div>
            <div style={{ fontSize:12, fontWeight:700, color:st.compound==='SOFT' ? 'var(--accent)' : 'var(--text-dim)' }}>{st.compound}</div>
            <div style={{ fontSize:11, color:'var(--text-dim)', marginTop:2 }}>{st.num===1 ? `L1-${optPit}` : `L${optPit}-23`}</div>
            <span style={{ fontSize:8, fontWeight:700, padding:'1px 5px', borderRadius:3, marginTop:4, display:'inline-block', background:i===0 ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.06)', color:i===0 ? 'var(--blue)' : 'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em' }}>
              {st.status}
            </span>
          </div>
        ))}
      </div>

      {/* confidence */}
      <div>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
          <span style={{ fontSize:11, color:'var(--text-muted)' }}>DT Model Confidence</span>
          <span style={{ fontSize:11, fontFamily:'JetBrains Mono,monospace', color:confColor }}>{STRAT_DATA.confidence}%</span>
        </div>
        <div className="bar-track">
          <div className="bar-fill" style={{ width:`${STRAT_DATA.confidence}%`, background:confColor }} />
        </div>
      </div>

      <div style={{ fontSize:11, color:'var(--text-muted)', fontStyle:'italic' }}>{STRAT_DATA.note}</div>
    </div>
  );
}

// Helper: event dot colour

function dotColor(type: EventType) {
  if (type === 'alert')    return 'var(--accent)';
  if (type === 'decision') return 'var(--green)';
  if (type === 'radio')    return 'var(--blue)';
  if (type === 'flag')     return 'var(--yellow)';
  if (type === 'action')   return 'var(--violet)';
  return 'var(--text-muted)';
}

function now() {
  return new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// Section divider

// Discord-style per-source colour for the event log avatars/names.
function sourceColor(source: string): string {
  const map: Record<string, string> = {
    'Crew Chief': 'var(--cyan)', 'Tyre Agent': '#f2cc1a', 'Race Control': '#f2260d',
    'Gap Monitor': '#a78bfa', 'KDD Pipeline': '#34d399', 'Digital Twin': '#60a5fa',
    'Quick Action': '#fb923c', 'KDD Agent': '#34d399', 'Fuel Model': '#fbbf24',
  };
  if (map[source]) return map[source];
  if (source.startsWith('#')) return '#ef4444';   // rider radio
  let h = 0;
  for (let i = 0; i < source.length; i++) h = (h * 31 + source.charCodeAt(i)) % 360;
  return `hsl(${h}, 60%, 62%)`;
}

function StrategyRow({ label, value, max, onPick }: { label: string; value: number; max: number; onPick: (n: number) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 11, color: 'var(--text-dim)', width: 150, fontFamily: 'JetBrains Mono, monospace' }}>{label}</span>
      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {Array.from({ length: max }, (_, i) => i + 1).map(n => (
          <button
            key={n}
            onClick={() => onPick(n)}
            style={{
              width: 26, height: 26, borderRadius: 'var(--radius)', fontSize: 11, fontWeight: 700, cursor: 'pointer',
              border: n === value ? '1px solid var(--accent)' : '1px solid var(--border)',
              background: n === value ? 'var(--accent)' : 'transparent',
              color: n === value ? 'var(--bg-base)' : 'var(--text-dim)',
            }}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

export function CrewChiefPage() {
  const t = useLiveTelemetry();

  const [events,     setEvents]     = useState<RaceEvent[]>(INITIAL_EVENTS);
  const [radioInput, setRadio]      = useState('');
  const [,           setMsgIdx]     = useState(0);
  const [filter,     setFilter]     = useState<FilterTab>('all');
  // In-race strategy (replaces the Pit Window Countdown no pit stops in this class)
  const [engineMap,   setEngineMap]   = useState(6);   // PWR map 1..8
  const [tcLevel,     setTcLevel]     = useState(5);   // traction control 1..10
  const [engineBrake, setEngineBrake] = useState(2);   // engine brake 1..3
  const [directive,   setDirective]   = useState(''); // free-text race directive
  const [popupDismissed, setPopupDismissed] = useState(false); // pending-decision popup
  const [decisions,  setDecisions]  = useState([
    { id: 1, q: 'Pit at L{optPit-2} or L{optPit}?', ans: 'L{optPit} optimal — monitor rear deg', status: 'pending' as 'pending' | 'confirmed' | 'overridden' },
    { id: 2, q: 'TC level after restart?',            ans: 'Hold TC3 until rear temp normalises',  status: 'pending' as 'pending' | 'confirmed' | 'overridden' },
    { id: 3, q: 'Rain tyres on standby?',             ans: 'Wets ready, 35% chance after L18',    status: 'pending' as 'pending' | 'confirmed' | 'overridden' },
  ]);
  const feedRef = useRef<HTMLDivElement>(null);

  // Live feed updates every 8s
  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIdx(prev => {
        const next = (prev + 1) % LIVE_MESSAGES.length;
        const tmpl = LIVE_MESSAGES[next];
        setEvents(prevEvents => [{
          id: Date.now(),
          time: now(),
          lap: t.lapCount,
          type: tmpl.type,
          priority: tmpl.priority,
          source: tmpl.source,
          message: tmpl.fn(t.gap, t.lapCount, t.fuelLoad),
        }, ...prevEvents.slice(0, 24)]);
        return next;
      });
    }, 8000);
    return () => clearInterval(interval);
  }, [t.gap, t.lapCount, t.fuelLoad]);

  // Auto-scroll feed to top
  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = 0;
  }, [events]);

  function sendRadio() {
    if (!radioInput.trim()) return;
    setEvents(prev => [{
      id: Date.now(), time: now(), lap: t.lapCount,
      type: 'decision', priority: 'high',
      source: 'Crew Chief', message: radioInput,
    }, ...prev]);
    setRadio('');
  }

  function triggerAction(action: QuickAction) {
    setEvents(prev => [{
      id: Date.now(), time: now(), lap: t.lapCount,
      type: 'action', priority: action.priority,
      source: 'Quick Action', message: action.message,
    }, ...prev.slice(0, 24)]);
  }

  function broadcast(message: string, priority: 'high' | 'medium' | 'low' = 'high') {
    setEvents(prev => [{
      id: Date.now(), time: now(), lap: t.lapCount,
      type: 'decision', priority, source: 'Crew Chief', message,
    }, ...prev.slice(0, 24)]);
  }

  function applyStrategy() {
    broadcast(`STRATEGY → Engine Map PWR${engineMap} · TC${tcLevel} · EB${engineBrake} (sent to dash)`);
  }

  function sendDirective() {
    if (!directive.trim()) return;
    broadcast(`DIRECTIVE: ${directive.trim()}`);
    setDirective('');
  }

  function resolveDecision(id: number, result: 'confirmed' | 'overridden') {
    setDecisions(prev => prev.map(d => d.id === id ? { ...d, status: result } : d));
    setEvents(prev => [{
      id: Date.now(), time: now(), lap: t.lapCount,
      type: 'decision', priority: 'high',
      source: 'Crew Chief',
      message: result === 'confirmed'
        ? `✓ CONFIRMED: ${decisions.find(d => d.id === id)?.ans ?? ''}`
        : `✕ OVERRIDDEN: Decision ${id} superseded by crew chief.`,
    }, ...prev.slice(0, 24)]);
  }

  // Derived values
  const rearAge    = t.rearTyreAge;
  // Per-lap track conditions (crew-chief: temp/humidity/wind/track-state/clean-dirty air)
  const trackTemp  = 42 + (t.lapCount % 3);
  const humidity   = 48 - (t.lapCount % 5);
  const wind       = 'NE 14 km/h';
  const trackState = 'Dry';
  const gapSec     = Math.abs(parseFloat(String(t.gap).replace(/[^0-9.-]/g, '')) || 2);
  const cleanAir   = gapSec > 1.0;  // within ~1s of the rider ahead → dirty air
  const optPit     = Math.max(t.lapCount + 1, t.lapCount + Math.round((18 - rearAge) / 1.5));
  const pitOpen    = t.lapCount >= 9;
  const gapDisplay = t.gap === 'leader' ? 'LEAD' : t.gap;
  const isNegGap   = t.gap.startsWith('-');

  // Filter events
  const filteredEvents = events.filter(ev => {
    if (filter === 'all')       return true;
    if (filter === 'critical')  return ev.priority === 'high' || ev.type === 'alert';
    if (filter === 'decisions') return ev.type === 'decision' || ev.type === 'action';
    if (filter === 'radio')     return ev.type === 'radio';
    return true;
  });

  // Live standings (dynamic around player position)
  const standings = RIVAL_NAMES.map((r, i) => {
    const baseGap = i === 0 ? 'LEAD' : `+${(i * 1.24 - (t.position <= i + 1 ? 0.6 : 0)).toFixed(3)}s`;
    const isMe = r.num === 47;
    const pos = isMe ? t.position : i < t.position - 1 ? i + 1 : i + 1;
    return {
      ...r,
      pos,
      isMe,
      gap: isMe ? (t.position === 1 ? 'LEAD' : t.gap) : baseGap,
      trend: isMe ? 0 : i % 3 === 0 ? 1 : i % 3 === 1 ? -1 : 0,
    };
  }).sort((a, b) => a.pos - b.pos);

  const filterTabs: { id: FilterTab; label: string; count?: number }[] = [
    { id: 'all',       label: 'All', count: events.length },
    { id: 'critical',  label: 'Critical', count: events.filter(e => e.priority === 'high' || e.type === 'alert').length },
    { id: 'decisions', label: 'Decisions', count: events.filter(e => e.type === 'decision' || e.type === 'action').length },
    { id: 'radio',     label: 'Radio', count: events.filter(e => e.type === 'radio').length },
  ];

  return (
    <div className="page">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="page-title">Crew Chief</h1>
          <p className="page-subtitle">Race command · Driver comms · Pit decisions · Flag status</p>
        </div>
        <div className="flex items-center gap-2">
          <Radio size={14} style={{ color: 'var(--green)' }} />
          <span className="badge badge-green">RADIO ACTIVE</span>
          {pitOpen && (
            <span className="badge badge-yellow" style={{ animation: 'pulse 2s infinite' }}>
              PIT WINDOW OPEN
            </span>
          )}
        </div>
      </div>

      {/* Track flags */}
      <div className="card mb-4">
        <div className="card-header">
          <span className="card-title flex items-center gap-2">
            <Flag size={14} />
            Track Status — Lap {t.lapCount}
          </span>
        </div>
        <div className="card-body" style={{ gap: 10 }}>
          {FLAG_STATUS.map(f => (
            <div
              key={f.sector}
              style={{
                flex: 1, padding: '10px 12px',
                background: f.flag === 'YELLOW' ? 'rgba(245,158,11,0.12)' : 'rgba(34,197,94,0.08)',
                borderRadius: 8,
                border: `1px solid ${f.flag === 'YELLOW' ? 'rgba(245,158,11,0.4)' : 'rgba(34,197,94,0.3)'}`,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{f.sector}</div>
              <div style={{
                fontFamily: 'JetBrains Mono,monospace', fontWeight: 700, fontSize: 12,
                color: f.flag === 'YELLOW' ? 'var(--yellow)' : 'var(--green)',
                letterSpacing: '0.05em',
              }}>
                {f.flag === 'YELLOW' ? '—YEL' : '✓ GRN'}
              </div>
            </div>
          ))}
        </div>
        {/* Per-lap conditions */}
        <div style={{ display: 'flex', gap: 8, padding: '0 16px 12px', flexWrap: 'wrap' }}>
          {[
            { l: 'Track Temp', v: `${trackTemp}°C` },
            { l: 'Air Humidity', v: `${humidity}%` },
            { l: 'Wind', v: wind },
            { l: 'Track', v: trackState },
            { l: 'Air', v: cleanAir ? 'CLEAN' : 'DIRTY', warn: !cleanAir },
          ].map(c => (
            <div key={c.l} style={{ flex: 1, minWidth: 92, textAlign: 'center', padding: '6px 8px',
                                    borderRadius: 'var(--radius)', background: 'var(--surface-muted)' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{c.l}</div>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontWeight: 700, fontSize: 13,
                            color: c.warn ? 'var(--accent)' : 'var(--text)' }}>{c.v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Pit window countdown */}
      {/* In-Race Strategy (replaces Pit Window no pit stops / tyre changes) */}
      <div className="card mb-4">
        <div className="card-header">
          <span className="card-title flex items-center gap-2">
            <Flag size={14} style={{ color: 'var(--green)' }} />
            In-Race Strategy
          </span>
          <span className="badge badge-orange">Rear {t.rearCompound} · L{rearAge}</span>
        </div>
        <div className="card-body" style={{ flexDirection: 'column', gap: 10, paddingTop: 10 }}>
          <StrategyRow label="Engine Map (PWR)" value={engineMap} max={8} onPick={setEngineMap} />
          <StrategyRow label="Traction Control (TC)" value={tcLevel} max={10} onPick={setTcLevel} />
          <StrategyRow label="Engine Brake (EB)" value={engineBrake} max={3} onPick={setEngineBrake} />
          <button
            onClick={applyStrategy}
            style={{ marginTop: 4, padding: '8px 14px', borderRadius: 8, border: '1px solid var(--green)',
                     background: 'rgba(34,197,94,0.15)', color: 'var(--green)', fontWeight: 800,
                     fontFamily: 'JetBrains Mono, monospace', fontSize: 12, cursor: 'pointer' }}
          >
            → Broadcast strategy to dash
          </button>
        </div>
      </div>

      {/* Quick-action command panel */}
      <div className="card mb-4">
        <div className="card-header">
          <span className="card-title flex items-center gap-2">
            <Zap size={14} style={{ color: 'var(--yellow)' }} />
            Quick Actions — Race Directives
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Click to broadcast to driver + log</span>
        </div>
        <div style={{ padding: '10px 16px', display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
          {QUICK_ACTIONS.map(action => (
            <button
              key={action.shortLabel}
              onClick={() => triggerAction(action)}
              style={{
                padding: '10px 6px',
                borderRadius: 8,
                border: `1px solid ${action.bgColor.replace('0.15', '0.4')}`,
                background: action.bgColor,
                color: action.color,
                fontFamily: 'JetBrains Mono, monospace',
                fontWeight: 800,
                fontSize: 13,
                letterSpacing: '0.04em',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'opacity 0.15s, transform 0.1s',
              }}
              onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.96)'; }}
              onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
            >
              {action.shortLabel}
            </button>
          ))}
        </div>
        {/* Free-text directive mode type any custom instruction to the rider's dash */}
        <div style={{ display: 'flex', gap: 8, padding: '0 16px 12px' }}>
          <input
            value={directive}
            onChange={e => setDirective(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') sendDirective(); }}
            placeholder="Free-text directive to dash (e.g. PUSH NOW · BOX-BOX · SAVE FUEL)…"
            style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)',
                     background: 'var(--surface-muted)', color: 'var(--text)', fontSize: 12,
                     fontFamily: 'JetBrains Mono, monospace' }}
          />
          <button
            onClick={sendDirective}
            style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--yellow)',
                     background: 'color-mix(in srgb, var(--yellow) 15%, transparent)', color: 'var(--yellow)', fontWeight: 800,
                     fontSize: 12, cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace' }}
          >
            Send →
          </button>
        </div>
      </div>

      {/* Main 2-column grid */}
      <div className="grid-2">

        {/* LEFT: Event log with filter tabs */}
        <div className="card" style={{ maxHeight: 640, display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <span className="card-title">Race Event Log</span>
            <span className="badge badge-green" style={{ animation: 'pulse 2s infinite' }}>LIVE</span>
          </div>

          {/* Filter tabs */}
          <div style={{ display: 'flex', padding: '0 16px', borderBottom: '1px solid var(--border)', gap: 4 }}>
            {filterTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                style={{
                  padding: '7px 10px',
                  fontSize: 11,
                  fontWeight: filter === tab.id ? 700 : 500,
                  color: filter === tab.id ? 'var(--accent)' : 'var(--text-muted)',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: filter === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
                  cursor: 'pointer',
                  letterSpacing: '0.03em',
                }}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span style={{
                    marginLeft: 5, fontSize: 10, padding: '1px 5px', borderRadius: 'var(--radius-lg)',
                    background: filter === tab.id ? 'rgba(224,55,55,0.2)' : 'var(--bg-card)',
                    color: filter === tab.id ? 'var(--accent)' : 'var(--text-muted)',
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Radio input */}
          <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8 }}>
            <input
              type="text"
              placeholder="Broadcast to driver…"
              value={radioInput}
              onChange={e => setRadio(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendRadio()}
              style={{
                flex: 1, background: 'var(--bg-surface)', border: '1px solid var(--border-mid)',
                borderRadius: 'var(--radius)', padding: '7px 12px', color: 'var(--text)', fontSize: 13, outline: 'none',
              }}
            />
            <button onClick={sendRadio} className="btn btn-primary btn-sm flex items-center gap-1">
              <MessageSquare size={12} />
              Send
            </button>
          </div>

          {/* Events */}
          <div ref={feedRef} className="event-feed" style={{ flex: 1, overflowY: 'auto' }}>
            {filteredEvents.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                No events matching this filter
              </div>
            ) : (
              filteredEvents.map(ev => {
                const col = sourceColor(ev.source);
                return (
                  <div
                    key={ev.id}
                    style={{
                      display: 'flex', gap: 10, padding: '8px 14px', alignItems: 'flex-start',
                    }}
                  >
                    {/* Discord-style avatar with the source initials */}
                    <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: col,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bg-base)',
                                  fontWeight: 800, fontSize: 12, fontFamily: 'JetBrains Mono,monospace' }}>
                      {ev.source.replace('#', '').slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: 13, color: col }}>{ev.source}</span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>L{ev.lap} · {ev.time}</span>
                        {ev.type === 'radio' && <span className="badge badge-muted" style={{ fontSize: 9 }}>RADIO</span>}
                        {ev.type === 'alert' && <span className="badge badge-red" style={{ fontSize: 9 }}>ALERT</span>}
                      </div>
                      <span className="event-text" style={{ fontSize: 13 }}>
                        {renderHighlighted(ev.message, /(P\d+|STAY OUT|PIT|BOX|PUSH|LEAD|Yellow|GREEN|TC\d+|OPEN|CONFIRMED|OVERRIDDEN|FUEL)/g)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Live race standings */}
          <div className="card">
            <div className="card-header">
              <span className="card-title flex items-center gap-2">
                <Flag size={13} />
                Race Standings — Lap {t.lapCount}
              </span>
              <span className="badge badge-muted">Top 5</span>
            </div>
            <table className="data-table" style={{ marginBottom: 0 }}>
              <thead>
                <tr>
                  <th style={{ width: 36 }}>Pos</th>
                  <th>Rider</th>
                  <th>Gap</th>
                  <th style={{ width: 30 }}></th>
                </tr>
              </thead>
              <tbody>
                {standings.map(r => (
                  <tr key={r.num} style={r.isMe ? { background: 'rgba(224,55,55,0.06)' } : {}}>
                    <td>
                      <span className="text-mono" style={{
                        fontWeight: 800, fontSize: 13,
                        color: r.pos === 1 ? 'var(--yellow)' : r.pos === 2 ? 'var(--text)' : r.pos === 3 ? 'var(--warning)' : 'var(--text-muted)',
                      }}>P{r.pos}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: r.isMe ? 700 : 500, color: r.isMe ? 'var(--accent)' : 'var(--text)', fontSize: 13 }}>
                        {r.name}
                        {r.isMe && <span className="badge badge-red" style={{ marginLeft: 6, fontSize: 9 }}>YOU</span>}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{r.team}</div>
                    </td>
                    <td className="mono" style={{ fontSize: 12, color: r.isMe ? 'var(--yellow)' : 'var(--text-dim)' }}>
                      {r.gap}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {r.trend > 0  && <ArrowUp   size={12} style={{ color: 'var(--green)'  }} />}
                      {r.trend < 0  && <ArrowDown  size={12} style={{ color: 'var(--accent)' }} />}
                      {r.trend === 0 && <Minus size={10} style={{ color: 'var(--text-muted)' }} />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Active strategy board */}
          <div className="card">
            <div className="card-header">
              <span className="card-title flex items-center gap-2">
                <Zap size={14} style={{ color: 'var(--blue)' }} />
                Active Strategy
              </span>
              <span className="badge badge-blue">KDD Recommended</span>
            </div>
            <div className="card-body" style={{ flexDirection:'column' }}>
              <ActiveStrategyBoard lapCount={t.lapCount} optPit={optPit} />
            </div>
          </div>

          {/* Pit crew status */}
          <div className="card">
            <div className="card-header"><span className="card-title">Pit Crew Status</span></div>
            <table className="data-table" style={{ marginBottom: 0 }}>
              <thead><tr><th>Role</th><th>Avg</th><th>Best</th><th>Status</th></tr></thead>
              <tbody>
                {PIT_CREW_TIMING.map(p => (
                  <tr key={p.role}>
                    <td style={{ fontSize: 12 }}>{p.role}</td>
                    <td className="mono" style={{ fontSize: 12 }}>{p.avg}</td>
                    <td className="mono" style={{ fontSize: 12, color: 'var(--green)' }}>{p.best}</td>
                    <td>
                      <span className={`badge ${p.status === 'ready' ? 'badge-green' : p.status === 'active' ? 'badge-blue' : 'badge-muted'}`}>
                        {p.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pending decisions with approval workflow */}
          <div className="card">
            <div className="card-header">
              <span className="card-title flex items-center gap-2">
                <AlertOctagon size={14} style={{ color: 'var(--yellow)' }} />
                Pending Decisions
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {decisions.filter(d => d.status === 'pending').length} open
              </span>
            </div>
            <div className="event-feed">
              {decisions.map((d, i) => {
                const colors = ['var(--yellow)', 'var(--blue)', 'var(--text-muted)'];
                const isPending = d.status === 'pending';
                return (
                  <div className="event-item" key={d.id} style={{ alignItems: 'flex-start', padding: '10px 16px' }}>
                    <div className="event-dot" style={{
                      background: d.status === 'confirmed' ? 'var(--green)' : d.status === 'overridden' ? 'var(--accent)' : colors[i] ?? 'var(--text-muted)',
                      marginTop: 3,
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
                        {d.q.replace('{optPit}', String(optPit)).replace('{optPit-2}', String(optPit - 2))}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: isPending ? 8 : 0 }}>
                        {d.ans.replace('{optPit}', String(optPit))}
                      </div>
                      {isPending ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => resolveDecision(d.id, 'confirmed')}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 4,
                              padding: '4px 10px', borderRadius: 5, border: '1px solid rgba(34,197,94,0.4)',
                              background: 'rgba(34,197,94,0.1)', color: 'var(--green)',
                              fontSize: 11, fontWeight: 700, cursor: 'pointer',
                            }}
                          >
                            <Check size={11} />CONFIRM
                          </button>
                          <button
                            onClick={() => resolveDecision(d.id, 'overridden')}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 4,
                              padding: '4px 10px', borderRadius: 5, border: '1px solid rgba(224,55,55,0.4)',
                              background: 'rgba(224,55,55,0.08)', color: 'var(--accent)',
                              fontSize: 11, fontWeight: 700, cursor: 'pointer',
                            }}
                          >
                            <X size={11} />OVERRIDE
                          </button>
                        </div>
                      ) : (
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
                          background: d.status === 'confirmed' ? 'rgba(34,197,94,0.12)' : 'rgba(224,55,55,0.12)',
                          color: d.status === 'confirmed' ? 'var(--green)' : 'var(--accent)',
                          textTransform: 'uppercase', letterSpacing: '0.06em',
                        }}>
                          {d.status}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pit Board */}
          <div className="card">
            <div className="card-header">
              <span className="card-title flex items-center gap-2">
                <Zap size={14} style={{ color: 'var(--yellow)' }} />
                Pit Board
              </span>
              <span className="badge badge-green" style={{ animation: 'pulse 2s infinite' }}>LIVE</span>
            </div>
            <div style={{
              background: 'var(--bg-base)', border: '2px solid #1A1E2A',
              borderRadius: 8, padding: '18px 20px',
              textAlign: 'center', fontFamily: 'JetBrains Mono, monospace',
            }}>
              {/* LAP / POS */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.15em', marginBottom: 4 }}>LAP</div>
                  <div style={{ fontSize: 52, fontWeight: 800, color: 'var(--yellow)', lineHeight: 1, fontVariantNumeric: 'tabular-nums', textShadow: '0 0 20px color-mix(in srgb, var(--yellow) 25%, transparent)' }}>
                    {t.lapCount}
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 4 }}>of {MUGELLO_CIRCUIT.raceLaps}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.15em', marginBottom: 4 }}>POS</div>
                  <div style={{
                    fontSize: 52, fontWeight: 800, lineHeight: 1,
                    fontVariantNumeric: 'tabular-nums',
                    color: t.position <= 3 ? 'var(--text)' : 'var(--warning)',
                    textShadow: t.position <= 3 ? '0 0 20px color-mix(in srgb, var(--text) 18%, transparent)' : '0 0 20px color-mix(in srgb, var(--warning) 25%, transparent)',
                  }}>
                    P{t.position}
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 4 }}>position</div>
                </div>
              </div>
              <div style={{ height: 1, background: 'var(--bg-surface)', margin: '0 0 14px' }} />
              {/* GAP */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.15em', marginBottom: 4 }}>GAP</div>
                <div style={{
                  fontSize: 30, fontWeight: 800,
                  color: isNegGap ? 'var(--accent)' : 'var(--green)',
                  fontVariantNumeric: 'tabular-nums',
                  textShadow: isNegGap ? '0 0 12px color-mix(in srgb, var(--accent) 35%, transparent)' : '0 0 12px color-mix(in srgb, var(--green) 35%, transparent)',
                }}>
                  {gapDisplay}
                </div>
              </div>
              <div style={{ height: 1, background: 'var(--bg-surface)', margin: '0 0 12px' }} />
              {/* Bottom row: OPT PIT / TYRES / SPEED */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>OPT PIT</div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--yellow)' }}>L{optPit}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>TYRES</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>{t.rearCompound}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{rearAge} laps</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>SPEED</div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--blue)' }}>
                    {t.speed}<span style={{ fontSize: 10, color: 'var(--text-muted)' }}> km/h</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Invasive pending-decision popup (crew-chief notes) */}
      {(() => {
        const open = decisions.find(d => d.status === 'pending');
        if (!open || popupDismissed) return null;
        return (
          <div
            onClick={() => setPopupDismissed(true)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex',
                     alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{ width: 460, maxWidth: '90vw', background: 'var(--surface)', borderRadius: 'var(--radius-xl)',
                       border: '1px solid var(--accent)', padding: 20, boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <AlertOctagon size={18} style={{ color: 'var(--accent)' }} />
                <span style={{ fontWeight: 800, fontSize: 15 }}>Pending Decision — Action Required</span>
              </div>
              <div style={{ fontSize: 14, marginBottom: 6 }}>{open.q}</div>
              <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 16, fontFamily: 'JetBrains Mono,monospace' }}>
                AI: {open.ans}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => resolveDecision(open.id, 'confirmed')}
                  style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid var(--green)',
                           background: 'rgba(34,197,94,0.15)', color: 'var(--green)', fontWeight: 800, cursor: 'pointer' }}>
                  ✓ Confirm
                </button>
                <button onClick={() => resolveDecision(open.id, 'overridden')}
                  style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid var(--accent)',
                            background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)', fontWeight: 800, cursor: 'pointer' }}>
                  ✕ Override
                </button>
                <button onClick={() => setPopupDismissed(true)}
                  style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)',
                           background: 'transparent', color: 'var(--text-dim)', cursor: 'pointer' }}>
                  Later
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
