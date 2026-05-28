import { useRef, useState, useEffect } from 'react';
import { Bot, Send, Trash2, Zap } from 'lucide-react';
import { useAIChat } from '../hooks/useAIChat';
import { useLiveTelemetry } from '../hooks/useLiveTelemetry';

function formatLap(s: number) {
  return `${Math.floor(s / 60)}:${(s % 60).toFixed(3).padStart(6, '0')}`;
}

const QUICK_PROMPTS = [
  'Should I pit now or extend the stint?',
  'Analyze the sector 2 time loss vs last lap',
  'What engine map gives best fuel vs pace trade-off?',
  'Tyre compound recommendation for the final 8 laps',
  'Compare my race pace to Marquez in laps 4–7',
  'Why is traction control firing more in T9?',
];

export function AICopilotPage() {
  const t = useLiveTelemetry();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState('');

  const systemPrompt = `You are the KDD Race Engineering AI Copilot, an expert race strategist and data engineer embedded in the KDD Agentic Factory platform.

## Current Race Context
- Grand Prix: Mugello, Italy · Lap ${t.lapCount} / 23
- Position: P3 · Gap to P2: ${t.gap}
- Last lap: ${formatLap(t.lastLap)} · Best: ${formatLap(t.bestLap)}
- Rear tyre: SOFT · ${t.rearTyreAge} laps · Est. wear ${Math.min(99, t.rearTyreAge * 4.8).toFixed(1)}%
- Fuel: ${t.fuelLoad} kg remaining
- Current speed: ${t.speed} km/h · Gear: ${t.gear} · RPM: ${t.rpm}
- Track: 48°C · Grip level HIGH

## Your capabilities
- Race strategy optimization (tyre, fuel, pit window)
- Telemetry analysis and anomaly detection
- KDD pipeline insights (pattern mining, feature extraction)
- Digital twin simulation interpretation
- Rival comparison and gap management
- Setup adjustment recommendations

## Response guidelines
- Be concise and actionable. Race engineers need fast answers.
- Prefer bullet points. Use lap numbers, lap times, and specific percentages.
- Never fabricate data — say "insufficient data" if needed.
- Reference the current race context when relevant.
- Today: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.`;

  const { messages, isStreaming, sendMessage, clearMessages } = useAIChat(systemPrompt);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput('');
    sendMessage(text);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="copilot-page">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3" style={{ padding: '14px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
        <div className="flex items-center gap-3">
          <Bot size={20} style={{ color: 'var(--accent)' }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Race Engineering AI Copilot</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Powered by InsForge Gateway · gpt-4o-mini</div>
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999, background: 'var(--accent-dim)', color: 'var(--accent)', fontSize: 11, fontWeight: 700 }}>
            <Zap size={10} />LIVE RACE CONTEXT
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Live race mini stats */}
          <div style={{ display: 'flex', gap: 16, padding: '6px 14px', background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Lap</div>
              <div style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: 16 }}>{t.lapCount}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pos</div>
              <div style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: 16, color: 'var(--accent)' }}>P{t.position}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Speed</div>
              <div style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: 16 }}>{t.speed}</div>
            </div>
          </div>
          {!isEmpty && (
            <button className="btn btn-ghost btn-sm flex items-center gap-2" onClick={clearMessages}>
              <Trash2 size={13} />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Messages ─────────────────────────────────────────────────────────── */}
      <div className="copilot-messages" ref={scrollRef}>
        {isEmpty ? (
          <div className="copilot-empty">
            <Bot size={48} className="copilot-empty-icon" />
            <p className="copilot-empty-title">Ask anything about your race</p>
            <p className="copilot-empty-sub">
              I have full access to your current telemetry, tyre data, race position,
              and the complete KDD knowledge base. Ask in natural language.
            </p>
            <div className="copilot-chips">
              {QUICK_PROMPTS.map(p => (
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
                <span className="copilot-msg-role">{msg.role === 'user' ? 'You' : 'Copilot'}</span>
                <p className="copilot-msg-content">
                  {msg.content}
                  {msg.streaming && <span className="copilot-cursor" />}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Input ─────────────────────────────────────────────────────────────── */}
      <form className="copilot-input-bar" onSubmit={handleSubmit}>
        <textarea
          ref={inputRef}
          className="copilot-textarea"
          placeholder="Ask about race strategy, telemetry, tyres, rivals… (Enter to send)"
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
  );
}
