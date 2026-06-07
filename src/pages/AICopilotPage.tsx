/**
 * AICopilotPage — Race Engineering AI Copilot.
 *
 * Expert improvements:
 *   • Live context sidebar — telemetry snapshot always visible alongside chat
 *   • Categorized quick prompts — Strategy / Tyres / Rivals / Setup
 *   • Rich message rendering — numbers/positions/laps highlighted
 *   • Conversation statistics — token estimate + message count
 *   • Category chips for toggling prompt categories
 */
import { useRef, useState, useEffect, useCallback } from 'react';
import { Bot, Send, Trash2, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { useAIChat } from '../hooks/useAIChat';
import { useLiveTelemetry } from '../hooks/useLiveTelemetry';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatLap(s: number) {
  return `${Math.floor(s / 60)}:${(s % 60).toFixed(3).padStart(6, '0')}`;
}

/** Highlight key racing values inline in message text */
function HighlightedMessage({ text }: { text: string }) {
  // Patterns to highlight: P1-P9, L+number, time 1:23.456, speed km/h, percentages
  const parts = text.split(/(P[1-9]|L\d+|[\d]+\.\d{3}|[\d]+\s*km\/h|[\d]+\.?\d*\s*%|[\d]+\s*kg|-[\d]+\.?\d*s|\+[\d]+\.?\d*s)/g);
  return (
    <>
      {parts.map((part, i) => {
        const isMatch = /^(P[1-9]|L\d+|\d+\.\d{3}|\d+\s*km\/h|\d+\.?\d*\s*%|\d+\s*kg|-\d+\.?\d*s|\+\d+\.?\d*s)$/.test(part);
        if (!isMatch) return <span key={i}>{part}</span>;
        const isNeg = part.startsWith('-');
        const isPos = part.startsWith('+') || part.match(/^P[1-3]$/);
        return (
          <strong key={i} style={{
            color: isNeg ? 'var(--accent)' : isPos ? 'var(--green)' : 'var(--cyan)',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.95em',
          }}>
            {part}
          </strong>
        );
      })}
    </>
  );
}

// ── Auto-briefing templates ───────────────────────────────────────────────────

interface BriefingTpl {
  label: string; icon: string; color: string;
  build: (lap: number, pos: number, grip: number, fuel: number, lastLap: string) => string;
}

const BRIEFINGS: BriefingTpl[] = [
  {
    label: 'Race Start Brief', icon: '🚦', color: 'var(--green)',
    build: (lap, pos, grip, fuel) =>
      `Provide a complete race start briefing for Lap ${lap}: Position P${pos}, rear SOFT tyre (~${grip.toFixed(0)}% grip), ${fuel.toFixed(1)} kg fuel. Cover: (1) tyre management plan for the first stint, (2) gap management vs rivals, (3) pit window recommendation, (4) key corners to protect rear grip at Mugello.`,
  },
  {
    label: 'Mid-Race Analysis', icon: '📊', color: 'var(--blue)',
    build: (lap, pos, grip, fuel, lastLap) =>
      `Mid-race analysis at Lap ${lap}: P${pos}, rear grip ~${grip.toFixed(0)}%, fuel ${fuel.toFixed(1)} kg, last lap ${lastLap}. Analyze: (1) pace vs Digital Twin model delta, (2) best remaining stint options, (3) undercut vs overcut timing, (4) championship points impact of current trajectory.`,
  },
  {
    label: 'Final Stint Plan', icon: '🏁', color: 'var(--accent)',
    build: (lap, pos, grip, fuel) =>
      `Final stint plan from Lap ${lap}: P${pos}, ~${grip.toFixed(0)}% rear grip, ${fuel.toFixed(1)} kg fuel. Give: (1) lap-by-lap fuel and tyre management, (2) attack or defend position decision, (3) exact engine map recommendation, (4) championship risk assessment and any safety margins.`,
  },
];

// ── Quick prompt categories ───────────────────────────────────────────────────

type PromptCategory = 'strategy' | 'tyres' | 'rivals' | 'setup';

const QUICK_PROMPTS: Record<PromptCategory, string[]> = {
  strategy: [
    'Should I pit now or extend the stint?',
    'Optimal pit lap for 1-stop strategy?',
    '2-stop vs 1-stop — time delta analysis',
    'Undercut window vs P2 — when to pull the trigger?',
  ],
  tyres: [
    'Rear tyre cliff prediction — laps remaining?',
    'How does current soft degradation compare to model?',
    'Front vs rear grip balance — any setup changes needed?',
    'Hard tyre stint pace estimate for final 10 laps',
  ],
  rivals: [
    'Compare my race pace to the riders ahead over last 5 laps',
    "What's the gap trend to P2 in last 3 laps?",
    "What engine map is Martin likely using on Straight 1?",
    'P4 closing pace — how many laps until DRS zone?',
  ],
  setup: [
    'TC level recommendation for current rear temp?',
    'Engine map for saving 0.2 kg/lap — pace cost?',
    'Braking adjustment for T10 to recover front grip',
    'Why is traction control firing more in T7?',
  ],
};

const CATEGORY_LABELS: Record<PromptCategory, string> = {
  strategy: '📋 Strategy',
  tyres:    '🔴 Tyres',
  rivals:   '👥 Rivals',
  setup:    '⚙️ Setup',
};

// ── Live metric bar ───────────────────────────────────────────────────────────

function LiveMetricBar({ lap, pos, gap, speed, gear, grip, fuel, lastLap }: {
  lap: number; pos: number; gap: string; speed: number;
  gear: number; grip: number; fuel: number; lastLap: string;
}) {
  const items = [
    { k: 'LAP',  v: `${lap}/23`,    c: 'var(--text-muted)' },
    { k: 'POS',  v: `P${pos}`,      c: 'var(--accent)' },
    { k: 'GAP',  v: gap,            c: 'var(--yellow)' },
    { k: 'SPD',  v: `${speed}`,     c: 'var(--blue)' },
    { k: 'GEAR', v: `G${gear}`,     c: 'var(--text)' },
    { k: 'GRIP', v: `${grip.toFixed(0)}%`, c: grip < 62 ? 'var(--accent)' : 'var(--green)' },
    { k: 'FUEL', v: `${fuel.toFixed(1)} kg`, c: fuel < 4 ? 'var(--accent)' : 'var(--text-muted)' },
    { k: 'LAST', v: lastLap,        c: 'var(--text-muted)' },
  ];
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:12, padding:'5px 14px',
      background:'rgba(255,255,255,0.025)', borderTop:'1px solid var(--border)',
      fontSize:10, fontFamily:'JetBrains Mono,monospace', flexWrap:'wrap',
    }}>
      {items.map(item => (
        <div key={item.k} style={{ display:'flex', alignItems:'center', gap:3 }}>
          <span style={{ color:'rgba(255,255,255,0.2)', fontSize:8 }}>{item.k}</span>
          <span style={{ fontWeight:700, color:item.c }}>{item.v}</span>
        </div>
      ))}
      <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:4 }}>
        <span style={{ width:5, height:5, background:'var(--green)', borderRadius:'50%', display:'inline-block', animation:'pulse 1.5s infinite' }} />
        <span style={{ color:'var(--green)', fontSize:9 }}>10 Hz context</span>
      </div>
    </div>
  );
}

// ── Tyre thermal mini sidebar ─────────────────────────────────────────────────

function TyreThermalMini({ fl, fr, rl, rr }: { fl: number; fr: number; rl: number; rr: number }) {
  const bg = (t: number) => {
    if (t < 56) return '#60A5FA';
    if (t < 72) return '#34D399';
    if (t < 93) return '#FCD34D';
    if (t < 109) return '#F97316';
    return '#EF4444';
  };
  return (
    <div style={{ padding:'8px 10px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:4 }}>
      {([['FL',fl],['FR',fr],['RL',rl],['RR',rr]] as [string, number][]).map(([label, temp]) => (
        <div key={label} style={{ background:bg(temp), borderRadius:4, padding:'5px 0', textAlign:'center' }}>
          <div style={{ fontSize:10, fontWeight:800, color:'#111', fontFamily:'JetBrains Mono,monospace' }}>{Math.round(temp)}°</div>
          <div style={{ fontSize:8, color:'rgba(0,0,0,0.55)', fontFamily:'JetBrains Mono,monospace' }}>{label}</div>
        </div>
      ))}
    </div>
  );
}

// ── Context sidebar tile ──────────────────────────────────────────────────────

function CtxTile({ label, value, color, unit }: {
  label: string; value: string | number; color?: string; unit?: string;
}) {
  return (
    <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>
      <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>
        {label}
      </div>
      <div style={{
        fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 14,
        color: color ?? 'var(--text)',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {value}{unit && <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 2 }}>{unit}</span>}
      </div>
    </div>
  );
}

// ── Page component ────────────────────────────────────────────────────────────

export function AICopilotPage() {
  const t = useLiveTelemetry();
  const scrollRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);
  const [input, setInput]            = useState('');
  const [activeCategory, setCategory] = useState<PromptCategory>('strategy');
  const [showContext, setCtx]         = useState(true);

  const rearWear = Math.min(99, t.rearTyreAge * 4.8);
  const rearGrip = Math.max(0, 96 - rearWear * 0.52);
  const lapDelta  = t.lastLap - t.bestLap;

  const systemPrompt = `You are the KDD Race Engineering AI Copilot, an expert MotoGP race strategist and data engineer embedded in the KDD Agentic Factory platform.

## Live Race Context — GP Mugello, Italy
- Lap: ${t.lapCount} / 23  |  Position: P${t.position}  |  Gap to P2: ${t.gap}
- Last lap: ${formatLap(t.lastLap)}  |  Personal best: ${formatLap(t.bestLap)}  |  Delta: ${lapDelta >= 0 ? '+' : ''}${lapDelta.toFixed(3)}s
- Rear tyre: ${t.rearCompound} · ${t.rearTyreAge} laps old · ~${rearWear.toFixed(1)}% wear · ~${rearGrip.toFixed(1)}% grip remaining
- Front tyre: ${t.frontCompound} · ${t.rearTyreAge} laps old
- Tyre temps: FL ${t.tireFrontLeft}° / FR ${t.tireFrontRight}° / RL ${t.tireRearLeft}° / RR ${t.tireRearRight}°
- Speed: ${t.speed} km/h  |  Gear: ${t.gear}  |  RPM: ${t.rpm.toLocaleString()}
- Throttle: ${t.throttle}%  |  Brake: ${t.brake}%  |  Lean: ${t.leanAngle.toFixed(1)}°
- Fuel: ${t.fuelLoad.toFixed(1)} kg remaining (~${(t.fuelLoad / 2.18).toFixed(1)} laps)
- Track: Mugello · 48°C asphalt · Grip level HIGH

## Your Capabilities
- Race strategy optimization (tyre, fuel, pit window timing)
- Telemetry analysis and anomaly detection
- KDD pipeline insights (pattern mining, feature extraction)
- Digital twin simulation interpretation
- Rival comparison and gap management
- Setup adjustment recommendations (TC, engine maps, braking points)

## Response Style
- Race engineers need fast, actionable answers. Be concise.
- Use bullet points. Reference exact numbers (laps, times, percentages).
- Never fabricate data — say "insufficient data" when needed.
- Always reference the live race context above.
- Today: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.`;

  const { messages, isStreaming, sendMessage, clearMessages } = useAIChat(systemPrompt);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput('');
    sendMessage(text);
  }, [input, isStreaming, sendMessage]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  }

  const isEmpty = messages.length === 0;
  const msgCount = messages.length;
  const estimatedTokens = messages.reduce((acc, m) => acc + Math.ceil(m.content.length / 4), 0);

  return (
    <div className="copilot-page" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        padding: '12px 20px', borderBottom: '1px solid var(--border)',
        background: 'var(--bg-surface)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Bot size={20} style={{ color: 'var(--accent)' }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Race Engineering AI Copilot</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Powered by InsForge Gateway · gpt-4o-mini
              {msgCount > 0 && (
                <span style={{ marginLeft: 8 }}>
                  · {msgCount} messages · ~{estimatedTokens.toLocaleString()} tokens
                </span>
              )}
            </div>
          </div>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '2px 8px', borderRadius: 999,
            background: 'var(--accent-dim)', color: 'var(--accent)', fontSize: 11, fontWeight: 700,
          }}>
            <Zap size={10} />LIVE
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Live mini stats strip */}
          <div style={{
            display: 'flex', gap: 16, padding: '6px 14px',
            background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)',
          }}>
            {[
              { k: 'Lap', v: t.lapCount, c: 'var(--text)' },
              { k: 'Pos', v: `P${t.position}`, c: 'var(--accent)' },
              { k: 'Gap', v: t.gap, c: 'var(--yellow)' },
              { k: 'Grip', v: `${rearGrip.toFixed(0)}%`, c: rearGrip < 62 ? 'var(--accent)' : 'var(--green)' },
            ].map(item => (
              <div key={item.k} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {item.k}
                </div>
                <div style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: 14, color: item.c }}>
                  {item.v}
                </div>
              </div>
            ))}
          </div>
          <button
            className="btn btn-ghost btn-sm flex items-center gap-1"
            onClick={() => setCtx(v => !v)}
            title={showContext ? 'Hide context' : 'Show context'}
          >
            {showContext ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            Context
          </button>
          {!isEmpty && (
            <button className="btn btn-ghost btn-sm flex items-center gap-2" onClick={clearMessages}>
              <Trash2 size={13} />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Body: chat + optional context sidebar ───────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

        {/* ── Messages ──────────────────────────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="copilot-messages" ref={scrollRef} style={{ flex: 1 }}>
            {isEmpty ? (
              <div className="copilot-empty">
                <Bot size={48} className="copilot-empty-icon" />
                <p className="copilot-empty-title">Ask anything about your race</p>
                <p className="copilot-empty-sub">
                  Full access to live telemetry, tyre data, race position, rival pace, and the KDD knowledge base.
                  Select a category and pick a question, or type your own.
                </p>

                {/* Auto-briefing quick-fire buttons */}
                <div style={{ display:'flex', gap:8, justifyContent:'center', marginBottom:20, flexWrap:'wrap' }}>
                  {BRIEFINGS.map(b => (
                    <button
                      key={b.label}
                      onClick={() => sendMessage(b.build(t.lapCount, t.position, rearGrip, t.fuelLoad, formatLap(t.lastLap)))}
                      style={{
                        padding:'8px 14px', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer',
                        border:`1px solid ${b.color}44`, background:`${b.color}12`, color:b.color,
                      }}
                    >
                      {b.icon} {b.label}
                    </button>
                  ))}
                </div>

                {/* Category selector */}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
                  {(Object.keys(QUICK_PROMPTS) as PromptCategory[]).map(cat => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      style={{
                        padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                        border: `1px solid ${activeCategory === cat ? 'var(--accent)' : 'var(--border)'}`,
                        background: activeCategory === cat ? 'var(--accent-dim)' : 'var(--bg-surface)',
                        color: activeCategory === cat ? 'var(--accent)' : 'var(--text-muted)',
                        cursor: 'pointer',
                      }}
                    >
                      {CATEGORY_LABELS[cat]}
                    </button>
                  ))}
                </div>

                {/* Prompts for active category */}
                <div className="copilot-chips">
                  {QUICK_PROMPTS[activeCategory].map(p => (
                    <button key={p} className="copilot-chip" onClick={() => sendMessage(p)}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <ul className="copilot-thread">
                {messages.map(msg => (
                  <li
                    key={msg.id}
                    className={`copilot-msg ${msg.role === 'user' ? 'copilot-msg-user' : 'copilot-msg-assistant'}`}
                  >
                    <span className="copilot-msg-role">
                      {msg.role === 'user' ? 'You' : 'Copilot'}
                    </span>
                    <p className="copilot-msg-content">
                      {msg.role === 'assistant' ? (
                        <HighlightedMessage text={msg.content} />
                      ) : (
                        msg.content
                      )}
                      {msg.streaming && <span className="copilot-cursor" />}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Persistent live telemetry strip above the composer */}
          <LiveMetricBar lap={t.lapCount} pos={t.position} gap={t.gap} speed={t.speed} gear={t.gear} grip={rearGrip} fuel={t.fuelLoad} lastLap={formatLap(t.lastLap)} />

          {/* ── Input bar ───────────────────────────────────────────────────── */}
          <form className="copilot-input-bar" onSubmit={handleSubmit} style={{ flexShrink: 0 }}>
            {/* Category quick-access when chat is active */}
            {!isEmpty && (
              <div style={{ display: 'flex', gap: 6, padding: '6px 12px 0', flexWrap: 'wrap' }}>
                {(Object.keys(QUICK_PROMPTS) as PromptCategory[]).map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => { setCategory(cat); }}
                    style={{
                      padding: '3px 10px', borderRadius: 999, fontSize: 10, fontWeight: 600,
                      border: `1px solid ${activeCategory === cat ? 'var(--accent)' : 'var(--border)'}`,
                      background: activeCategory === cat ? 'var(--accent-dim)' : 'transparent',
                      color: activeCategory === cat ? 'var(--accent)' : 'var(--text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    {CATEGORY_LABELS[cat]}
                  </button>
                ))}
                {QUICK_PROMPTS[activeCategory].slice(0, 2).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => sendMessage(p)}
                    style={{
                      padding: '3px 10px', borderRadius: 999, fontSize: 10,
                      border: '1px solid var(--border)',
                      background: 'var(--bg-surface)',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
            <textarea
              ref={inputRef}
              className="copilot-textarea"
              placeholder="Ask about race strategy, telemetry, tyres, rivals… (Enter to send, Shift+Enter for newline)"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              disabled={isStreaming}
            />
            <button
              className="copilot-send"
              type="submit"
              disabled={!input.trim() || isStreaming}
            >
              <Send size={16} />
            </button>
          </form>
        </div>

        {/* ── Live context sidebar ─────────────────────────────────────────── */}
        {showContext && (
          <div style={{
            width: 200, flexShrink: 0,
            borderLeft: '1px solid var(--border)',
            background: 'var(--bg-surface)',
            overflowY: 'auto',
            display: 'flex', flexDirection: 'column',
          }}>
            {/* Sidebar header */}
            <div style={{
              padding: '10px 10px 8px',
              fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
              textTransform: 'uppercase', color: 'var(--text-muted)',
              borderBottom: '1px solid var(--border)',
              background: 'var(--bg-card)',
            }}>
              Live Context
            </div>

            <CtxTile label="Lap" value={t.lapCount} />
            <CtxTile label="Position" value={`P${t.position}`} color="var(--accent)" />
            <CtxTile label="Gap" value={t.gap} color="var(--yellow)" />
            <CtxTile label="Speed" value={t.speed} unit="km/h" color="var(--text)" />
            <CtxTile label="Gear" value={t.gear} color="var(--accent)" />
            <CtxTile label="RPM" value={t.rpm.toLocaleString()} />

            <div style={{
              padding: '6px 10px 4px', fontSize: 9, fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'var(--text-muted)', background: 'var(--bg-card)',
              borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
            }}>
              Tyres
            </div>

            <TyreThermalMini fl={t.tireFrontLeft} fr={t.tireFrontRight} rl={t.tireRearLeft} rr={t.tireRearRight} />

            <CtxTile label="Rear" value={t.rearCompound} color="#E03737" />
            <CtxTile label="Age" value={`${t.rearTyreAge} laps`} />
            <CtxTile label="Grip Est." value={`${rearGrip.toFixed(1)}%`}
              color={rearGrip < 62 ? 'var(--accent)' : 'var(--green)'} />
            <CtxTile label="RL Temp" value={`${t.tireRearLeft}°`}
              color={t.tireRearLeft > 105 ? 'var(--accent)' : t.tireRearLeft > 90 ? 'var(--yellow)' : 'var(--text)'} />
            <CtxTile label="RR Temp" value={`${t.tireRearRight}°`}
              color={t.tireRearRight > 105 ? 'var(--accent)' : t.tireRearRight > 90 ? 'var(--yellow)' : 'var(--text)'} />

            <div style={{
              padding: '6px 10px 4px', fontSize: 9, fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'var(--text-muted)', background: 'var(--bg-card)',
              borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
            }}>
              Performance
            </div>

            <CtxTile label="Last Lap" value={formatLap(t.lastLap)} />
            <CtxTile label="Best Lap" value={formatLap(t.bestLap)} color="var(--green)" />
            <CtxTile
              label="Delta"
              value={`${lapDelta >= 0 ? '+' : ''}${lapDelta.toFixed(3)}s`}
              color={lapDelta > 0.3 ? 'var(--accent)' : lapDelta > 0 ? 'var(--yellow)' : 'var(--green)'}
            />
            <CtxTile label="Fuel" value={`${t.fuelLoad.toFixed(1)} kg`}
              color={t.fuelLoad < 4 ? 'var(--accent)' : 'var(--text)'} />
            <CtxTile label="Lean" value={`${t.leanAngle.toFixed(1)}°`}
              color={t.leanAngle > 48 ? 'var(--accent)' : 'var(--text)'} />
          </div>
        )}
      </div>
    </div>
  );
}
