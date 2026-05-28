import { useState, useEffect } from 'react';
import { Radio, Flag, AlertOctagon, MessageSquare, Zap } from 'lucide-react';
import { useLiveTelemetry } from '../hooks/useLiveTelemetry';

interface RaceEvent {
  id: number;
  time: string;
  lap: number;
  type: 'decision' | 'info' | 'alert' | 'radio' | 'flag';
  priority: 'high' | 'medium' | 'low';
  source: string;
  message: string;
}

const INITIAL_EVENTS: RaceEvent[] = [
  { id: 1,  time: '14:22:14', lap: 7, type: 'decision', priority: 'high',   source: 'Crew Chief',   message: 'STAY OUT — Gap to P2 holding at +0.842s. Tyre still working.' },
  { id: 2,  time: '14:21:58', lap: 7, type: 'info',     priority: 'medium', source: 'Tyre Agent',   message: 'Rear soft degradation at 1.2% / lap. Model predicts cliff at Lap 11.' },
  { id: 3,  time: '14:21:30', lap: 7, type: 'radio',    priority: 'medium', source: '#47',          message: '"Rear is sliding more on exit of T7. Give me TC2."' },
  { id: 4,  time: '14:21:30', lap: 7, type: 'decision', priority: 'high',   source: 'Crew Chief',   message: 'TC2 CONFIRMED. Setting engine map 6 → 7 on next straight.' },
  { id: 5,  time: '14:20:45', lap: 6, type: 'alert',    priority: 'high',   source: 'Race Control', message: 'Yellow flag Sector 5. Reduce speed in zone.' },
  { id: 6,  time: '14:20:45', lap: 6, type: 'info',     priority: 'medium', source: 'Gap Monitor',  message: 'Martin closing +0.3s last lap. Monitor closely.' },
  { id: 7,  time: '14:19:52', lap: 6, type: 'info',     priority: 'low',    source: 'KDD Pipeline', message: 'Lap 6 telemetry processed. 12,400 samples ingested.' },
  { id: 8,  time: '14:19:20', lap: 5, type: 'decision', priority: 'high',   source: 'Crew Chief',   message: 'PIT WINDOW OPEN from Lap 9. Optimal: Lap 11. Prepare for in-lap sequence.' },
  { id: 9,  time: '14:18:41', lap: 5, type: 'radio',    priority: 'low',    source: '#47',          message: '"Copy. Front grip feels good. Keep strategy."' },
  { id: 10, time: '14:17:15', lap: 4, type: 'info',     priority: 'low',    source: 'Digital Twin', message: 'Lap 4 simulation delta: –0.08s vs predicted. Sector 2 gain confirmed.' },
];

// Live feed message pool
const LIVE_MESSAGES = [
  { type: 'info' as const, source: 'Gap Monitor',  message: (gap: string) => `P2 gap: ${gap} — monitoring.` },
  { type: 'info' as const, source: 'KDD Agent',    message: (_gap: string) => 'Fuel consumption nominal — 2.18 kg / lap.' },
  { type: 'info' as const, source: 'Tyre Agent',   message: (_gap: string) => 'Rear temp stabilizing at 98°C. Degradation nominal.' },
  { type: 'info' as const, source: 'KDD Pipeline', message: (_gap: string, lap: number) => `Lap ${lap} telemetry ingested — 12,400 samples.` },
  { type: 'info' as const, source: 'Digital Twin', message: (_gap: string) => 'Sim delta: –0.04s vs predicted. Within model bounds.' },
];

const PIT_CREW_TIMING = [
  { role: 'Front Tyre Change', avg: '2.3s', best: '2.1s', status: 'ready' },
  { role: 'Rear Tyre Change',  avg: '2.5s', best: '2.2s', status: 'ready' },
  { role: 'Fuel (if needed)',  avg: '3.2s', best: '—',    status: 'standby' },
  { role: 'Pit Board',         avg: '—',    best: '—',    status: 'active' },
];

const FLAG_STATUS = [
  { sector: 'S1', flag: 'GREEN', lap: 7 },
  { sector: 'S2', flag: 'GREEN', lap: 7 },
  { sector: 'S3', flag: 'GREEN', lap: 7 },
  { sector: 'S4', flag: 'GREEN', lap: 7 },
  { sector: 'S5', flag: 'YELLOW', lap: 6 },
];

function EventDot({ type }: { type: string }) {
  const color =
    type === 'alert'    ? 'var(--accent)' :
    type === 'decision' ? 'var(--green)' :
    type === 'radio'    ? 'var(--blue)' :
    type === 'flag'     ? 'var(--yellow)' :
    'var(--text-muted)';
  return <div className="event-dot" style={{ background: color }} />;
}

export function CrewChiefPage() {
  const t = useLiveTelemetry();
  const [events, setEvents] = useState<RaceEvent[]>(INITIAL_EVENTS);
  const [radioInput, setRadioInput] = useState('');
  const [msgIdx, setMsgIdx] = useState(0);

  // Simulate new events arriving every 8s, referencing live telemetry
  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIdx(prev => {
        const next = (prev + 1) % LIVE_MESSAGES.length;
        const template = LIVE_MESSAGES[next];
        setEvents(prevEvents => [{
          id: Date.now(),
          time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          lap: t.lapCount,
          type: template.type,
          priority: 'low',
          source: template.source,
          message: template.message(t.gap, t.lapCount),
        }, ...prevEvents.slice(0, 19)]);
        return next;
      });
    }, 8000);
    return () => clearInterval(interval);
  }, [t.gap, t.lapCount]);

  function sendRadio() {
    if (!radioInput.trim()) return;
    setEvents(prev => [{
      id: Date.now(),
      time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      lap: t.lapCount,
      type: 'decision',
      priority: 'high',
      source: 'Crew Chief',
      message: radioInput,
    }, ...prev]);
    setRadioInput('');
  }

  // Compute optimal pit window from live tyre data
  const rearAge = t.rearTyreAge;
  const optimalPit = Math.max(t.lapCount + 1, t.lapCount + Math.round((18 - rearAge) / 1.5));
  const pitWindowOpen = t.lapCount >= 9;

  // Parse gap for pit board display
  const gapDisplay = t.gap === 'leader' ? 'LEAD' : t.gap;
  const isNegGap = t.gap.startsWith('–');

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Crew Chief</h1>
          <p className="page-subtitle">Race command · Driver comms · Pit decisions · Flag status</p>
        </div>
        <div className="flex items-center gap-2">
          <Radio size={14} style={{ color: 'var(--green)' }} />
          <span className="badge badge-green">RADIO ACTIVE</span>
          {pitWindowOpen && (
            <span className="badge badge-yellow" style={{ animation: 'pulse 2s infinite' }}>
              PIT WINDOW OPEN
            </span>
          )}
        </div>
      </div>

      {/* ── Flag status row ───────────────────────────────────────────────── */}
      <div className="card mb-4">
        <div className="card-header">
          <span className="card-title flex items-center gap-2"><Flag size={14} />Track Flags</span>
        </div>
        <div className="card-body" style={{ display: 'flex', gap: 12 }}>
          {FLAG_STATUS.map(f => (
            <div key={f.sector} style={{
              flex: 1,
              padding: '10px 12px',
              background: f.flag === 'YELLOW' ? 'var(--yellow-dim)' : 'var(--green-dim)',
              borderRadius: 8,
              border: `1px solid ${f.flag === 'YELLOW' ? 'var(--yellow)' : 'var(--green)'}`,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{f.sector}</div>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontWeight: 700, color: f.flag === 'YELLOW' ? 'var(--yellow)' : 'var(--green)' }}>
                {f.flag}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid-2">
        {/* ── Event log ──────────────────────────────────────────────────────── */}
        <div className="card" style={{ maxHeight: 580, display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <span className="card-title">Race Event Log</span>
            <span className="badge badge-green" style={{ animation: 'pulse 2s infinite' }}>LIVE</span>
          </div>

          {/* Radio input */}
          <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8 }}>
            <input
              type="text"
              placeholder="Send crew message…"
              value={radioInput}
              onChange={e => setRadioInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendRadio()}
              style={{
                flex: 1,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-mid)',
                borderRadius: 6,
                padding: '7px 12px',
                color: 'var(--text)',
                fontSize: 13,
                outline: 'none',
              }}
            />
            <button
              onClick={sendRadio}
              className="btn btn-primary btn-sm"
              style={{ gap: 4 }}
            >
              <MessageSquare size={13} />
              Send
            </button>
          </div>

          <div className="event-feed" style={{ flex: 1, overflowY: 'auto' }}>
            {events.map(ev => (
              <div className="event-item" key={ev.id}>
                <EventDot type={ev.type} />
                <span className="event-time">{ev.time}</span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: 8 }}>
                    {ev.source}
                  </span>
                  <span
                    className="event-text"
                    dangerouslySetInnerHTML={{
                      __html: ev.message.replace(/(P\d+|STAY OUT|PIT|Yellow|GREEN|TC\d+|OPEN)/g, '<strong>$1</strong>'),
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Pit crew + decisions ─────────────────────────────────────────── */}
        <div className="flex-col gap-3">
          <div className="card">
            <div className="card-header"><span className="card-title">Pit Stop Crew Status</span></div>
            <table className="data-table">
              <thead><tr><th>Role</th><th>Avg Time</th><th>Best</th><th>Status</th></tr></thead>
              <tbody>
                {PIT_CREW_TIMING.map(p => (
                  <tr key={p.role}>
                    <td>{p.role}</td>
                    <td className="mono">{p.avg}</td>
                    <td className="mono text-green">{p.best}</td>
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

          <div className="card">
            <div className="card-header">
              <span className="card-title flex items-center gap-2">
                <AlertOctagon size={14} style={{ color: 'var(--yellow)' }} />
                Pending Decisions
              </span>
            </div>
            <div className="event-feed">
              {[
                { q: `Pit at L${optimalPit - 2} or L${optimalPit}?`, ans: `L${optimalPit} optimal — monitor rear deg`, color: 'var(--yellow)' },
                { q: 'TC level after restart?', ans: 'Hold TC3 until rear temp normalises', color: 'var(--blue)' },
                { q: 'Rain tyres on standby?', ans: 'Wets ready, 35% chance after L18', color: 'var(--text-muted)' },
              ].map((d, i) => (
                <div className="event-item" key={i}>
                  <div className="event-dot" style={{ background: d.color }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{d.q}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{d.ans}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Live Pit Board — feeds from useLiveTelemetry ─────────────── */}
          <div className="card">
            <div className="card-header">
              <span className="card-title flex items-center gap-2">
                <Zap size={14} style={{ color: 'var(--yellow)' }} />
                Pit Board
              </span>
              <span className="badge badge-green" style={{ animation: 'pulse 2s infinite' }}>LIVE</span>
            </div>
            <div className="card-body" style={{
              background: '#080A0E',
              border: '2px solid #1A1E2A',
              borderRadius: 8,
              padding: '20px',
              textAlign: 'center',
              fontFamily: 'JetBrains Mono, monospace',
            }}>
              {/* Row 1: LAP / POS */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 9, color: '#444', letterSpacing: '0.15em', marginBottom: 4 }}>LAP</div>
                  <div style={{
                    fontSize: 52,
                    fontWeight: 800,
                    color: '#FFFF00',
                    lineHeight: 1,
                    fontVariantNumeric: 'tabular-nums',
                    textShadow: '0 0 20px rgba(255,255,0,0.3)',
                  }}>
                    {t.lapCount}
                  </div>
                  <div style={{ fontSize: 9, color: '#555', marginTop: 4 }}>of 23</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: '#444', letterSpacing: '0.15em', marginBottom: 4 }}>POS</div>
                  <div style={{
                    fontSize: 52,
                    fontWeight: 800,
                    color: t.position <= 3 ? '#FFFFFF' : '#FF8844',
                    lineHeight: 1,
                    fontVariantNumeric: 'tabular-nums',
                    textShadow: t.position <= 3 ? '0 0 20px rgba(255,255,255,0.2)' : '0 0 20px rgba(255,136,68,0.3)',
                  }}>
                    P{t.position}
                  </div>
                  <div style={{ fontSize: 9, color: '#555', marginTop: 4 }}>position</div>
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: '#1A1E2A', margin: '0 0 16px' }} />

              {/* Row 2: Gap */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 9, color: '#444', letterSpacing: '0.15em', marginBottom: 4 }}>GAP TO P2</div>
                <div style={{
                  fontSize: 32,
                  fontWeight: 800,
                  color: isNegGap ? '#FF4444' : '#44FF88',
                  letterSpacing: '0.05em',
                  fontVariantNumeric: 'tabular-nums',
                  textShadow: isNegGap ? '0 0 12px rgba(255,68,68,0.4)' : '0 0 12px rgba(68,255,136,0.4)',
                }}>
                  {gapDisplay}
                </div>
              </div>

              {/* Row 3: Optimal pit */}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid #1A1E2A' }}>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 9, color: '#444', letterSpacing: '0.1em' }}>OPT PIT</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#F59E0B' }}>L{optimalPit}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 9, color: '#444', letterSpacing: '0.1em' }}>SPEED</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#3B82F6' }}>{t.speed}<span style={{ fontSize: 11, color: '#555' }}> km/h</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
