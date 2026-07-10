/**
 * AICopilotPage — KDD Copilot AI Layer.
 *
 * The Copilot is not a generic chat surface. It is the explanation and mission
 * layer for the KDD decision loop: Telemetry → Event → Cause → Recommendation →
 * Mission → Validation.
 */
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Bot, ChevronDown, ChevronUp, ClipboardList, FileText, Loader2, Send, ShieldAlert, Target, Trash2, Zap } from 'lucide-react';
import { useAIChat } from '../hooks/useAIChat';
import { useLiveTelemetry } from '../hooks/useLiveTelemetry';
import { RiderCoachInsight } from '../components/RiderCoachInsight';
import { COPILOT_SEED_KEY } from '../context/NavContext';
import { MUGELLO_CIRCUIT } from '../domain/sessionTruth';
import { getActiveCircuit } from '../domain/circuits';
import { getSessionContext } from '../domain/sessionContext';
import type { RaceCopilotVehicleContext } from '../services/api';

function formatLap(s: number) {
  return `${Math.floor(s / 60)}:${(s % 60).toFixed(3).padStart(6, '0')}`;
}

function toneForDelta(delta: number) {
  if (delta > 0.35) return 'is-critical';
  if (delta > 0) return 'is-warning';
  return 'is-valid';
}

function toneForGrip(grip: number) {
  if (grip < 58) return 'is-critical';
  if (grip < 68) return 'is-warning';
  return 'is-valid';
}

function toneForFuel(fuel: number) {
  if (fuel < 4) return 'is-critical';
  if (fuel < 6) return 'is-warning';
  return 'is-muted';
}

function toneForTemp(temp: number) {
  if (temp > 108) return 'is-critical';
  if (temp > 94) return 'is-hot';
  if (temp > 72) return 'is-warning';
  if (temp < 56) return 'is-cool';
  return 'is-valid';
}

function HighlightedMessage({ text }: { text: string }) {
  const parts = text.split(/(P[1-9]|L\d+|\d+\.\d{3}|\d+\s*km\/h|\d+\.?\d*\s*%|\d+\s*kg|-\d+\.?\d*s|\+\d+\.?\d*s)/g);

  return (
    <>
      {parts.map((part, index) => {
        const isMetric = /^(P[1-9]|L\d+|\d+\.\d{3}|\d+\s*km\/h|\d+\.?\d*\s*%|\d+\s*kg|-\d+\.?\d*s|\+\d+\.?\d*s)$/.test(part);
        if (!isMetric) return <span key={index}>{part}</span>;

        const tone = part.startsWith('-') ? 'is-critical' : part.startsWith('+') || /^P[1-3]$/.test(part) ? 'is-valid' : 'is-info';
        return <strong key={index} className={`copilot-inline-metric ${tone}`}>{part}</strong>;
      })}
    </>
  );
}

type PromptCategory = 'decision' | 'mission' | 'evidence' | 'coach';

const CATEGORY_LABELS: Record<PromptCategory, string> = {
  decision: 'Decision loop',
  mission: 'Mission builder',
  evidence: 'Evidence review',
  coach: 'Coach summary',
};

const QUICK_PROMPTS: Record<PromptCategory, string[]> = {
  decision: [
    'Why am I losing time in T15?',
    'Is this rider issue, setup issue or tyre issue?',
    'What should we test first?',
    'Explain the current PitWall recommendation.',
  ],
  mission: [
    'Create a validation mission for the next stint.',
    'Turn the T15 issue into a rider drill and setup check.',
    'Define success criteria for a rear-grip intervention.',
    'Build a two-lap test plan with risk gates.',
  ],
  evidence: [
    'Show the evidence chain from telemetry to recommendation.',
    'What data is missing before we make this call?',
    'Summarize confidence and uncertainty for the decision.',
    'Compare live telemetry against the Digital Twin expectation.',
  ],
  coach: [
    'Summarize this session for the coach.',
    'Create rider feedback in plain language.',
    'What should the rider focus on next lap?',
    'Give me a post-stint debrief with one priority only.',
  ],
};

interface BriefingTemplate {
  id: string;
  label: string;
  meta: string;
  icon: typeof Target;
  build: (lap: number, pos: number, grip: number, fuel: number, lastLap: string) => string;
}

const BRIEFINGS: BriefingTemplate[] = [
  {
    id: 'explain',
    label: 'Explain PitWall decision',
    meta: 'Telemetry → cause → recommendation',
    icon: Zap,
    build: (lap, pos, grip, fuel, lastLap) =>
      `Explain the current PitWall decision using the KDD loop: Telemetry → Event → Cause → Recommendation → Mission → Validation. Context: Lap ${lap}, P${pos}, rear grip ${grip.toFixed(0)}%, fuel ${fuel.toFixed(1)} kg, last lap ${lastLap}. Keep it concise and include uncertainty.`,
  },
  {
    id: 'mission',
    label: 'Generate validation mission',
    meta: 'Next stint plan with success criteria',
    icon: Target,
    build: (lap, pos, grip, fuel, lastLap) =>
      `Create a validation mission for the next stint. Context: Lap ${lap}, P${pos}, rear grip ${grip.toFixed(0)}%, fuel ${fuel.toFixed(1)} kg, last lap ${lastLap}. Include objective, intervention, measurement, risk gate, and validation criteria.`,
  },
  {
    id: 'coach',
    label: 'Coach-ready summary',
    meta: 'One priority, plain language',
    icon: ClipboardList,
    build: (lap, pos, grip, fuel, lastLap) =>
      `Summarize this session for the coach. Context: Lap ${lap}, P${pos}, rear grip ${grip.toFixed(0)}%, fuel ${fuel.toFixed(1)} kg, last lap ${lastLap}. Give one rider priority, one setup watchpoint, and one validation question.`,
  },
];

function LiveMetricBar({ lap, pos, gap, speed, gear, grip, fuel, lastLap }: {
  lap: number;
  pos: number;
  gap: string;
  speed: number;
  gear: number;
  grip: number;
  fuel: number;
  lastLap: string;
}) {
  const items = [
    { k: 'Lap', v: `${lap}/${MUGELLO_CIRCUIT.raceLaps}`, tone: 'is-muted' },
    { k: 'Pos', v: `P${pos}`, tone: 'is-critical' },
    { k: 'Gap', v: gap, tone: 'is-warning' },
    { k: 'Speed', v: `${speed} km/h`, tone: 'is-info' },
    { k: 'Gear', v: `G${gear}`, tone: 'is-text' },
    { k: 'Grip', v: `${grip.toFixed(0)}%`, tone: toneForGrip(grip) },
    { k: 'Fuel', v: `${fuel.toFixed(1)} kg`, tone: toneForFuel(fuel) },
    { k: 'Last', v: lastLap, tone: 'is-muted' },
  ];

  return (
    <div className="copilot-live-strip" aria-label="Live telemetry context">
      {items.map(item => (
        <span key={item.k} className="copilot-live-strip__item">
          <span className="copilot-live-strip__key">{item.k}</span>
          <strong className={`copilot-live-strip__value ${item.tone}`}>{item.v}</strong>
        </span>
      ))}
      <span className="copilot-live-strip__status"><span aria-hidden="true" />10 Hz context</span>
    </div>
  );
}

function TyreThermalMini({ fl, fr, rl, rr }: { fl: number; fr: number; rl: number; rr: number }) {
  const tyres: [string, number][] = [['FL', fl], ['FR', fr], ['RL', rl], ['RR', rr]];

  return (
    <div className="copilot-tyres" aria-label="Tyre temperatures">
      {tyres.map(([label, temp]) => (
        <div key={label} className={`copilot-tyre ${toneForTemp(temp)}`}>
          <strong>{Math.round(temp)}°</strong>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

function CtxTile({ label, value, tone = 'is-text', unit }: {
  label: string;
  value: string | number;
  tone?: string;
  unit?: string;
}) {
  return (
    <div className="copilot-ctx-tile">
      <span className="copilot-ctx-tile__label">{label}</span>
      <strong className={`copilot-ctx-tile__value ${tone}`}>{value}{unit && <small>{unit}</small>}</strong>
    </div>
  );
}

function EvidenceCard({ icon: Icon, label, value, body, tone = 'is-text' }: {
  icon: typeof Target;
  label: string;
  value: string;
  body: string;
  tone?: string;
}) {
  return (
    <article className="copilot-evidence-card">
      <div className="copilot-evidence-card__header">
        <Icon size={15} aria-hidden="true" />
        <span>{label}</span>
      </div>
      <strong className={`copilot-evidence-card__value ${tone}`}>{value}</strong>
      <p>{body}</p>
    </article>
  );
}

export function AICopilotPage() {
  const { t } = useTranslation();
  const telemetry = useLiveTelemetry();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState('');
  const [activeCategory, setCategory] = useState<PromptCategory>('decision');
  const [showContext, setCtx] = useState(true);

  const session = getSessionContext();
  const activeCircuit = getActiveCircuit();
  const rearWear = Math.min(99, telemetry.rearTyreAge * 4.8);
  const rearGrip = Math.max(0, 96 - rearWear * 0.52);
  const lapDelta = telemetry.lastLap - telemetry.bestLap;
  const lapDeltaLabel = `${lapDelta >= 0 ? '+' : ''}${lapDelta.toFixed(3)}s`;

  const systemPrompt = `You are KDD Copilot, the AI Layer of KDD Hub by Keedio. You are not a generic chatbot: you explain and operationalize the KDD decision loop.

## Required decision loop
Telemetry → Event → Cause → Recommendation → Mission → Validation.

## Live session context
- Circuit: ${session.circuitName}, ${activeCircuit.country}
- Lap: ${telemetry.lapCount} / ${MUGELLO_CIRCUIT.raceLaps} | Position: P${telemetry.position} | Gap: ${telemetry.gap}
- Last lap: ${formatLap(telemetry.lastLap)} | Best lap: ${formatLap(telemetry.bestLap)} | Delta: ${lapDeltaLabel}
- Rear tyre: ${telemetry.rearCompound}, ${telemetry.rearTyreAge} laps old, ${rearWear.toFixed(1)}% wear, ${rearGrip.toFixed(1)}% grip estimate
- Tyre temps: FL ${telemetry.tireFrontLeft}°C / FR ${telemetry.tireFrontRight}°C / RL ${telemetry.tireRearLeft}°C / RR ${telemetry.tireRearRight}°C
- Speed: ${telemetry.speed} km/h | Gear: ${telemetry.gear} | RPM: ${telemetry.rpm.toLocaleString()}
- Throttle: ${telemetry.throttle}% | Brake: ${telemetry.brake}% | Lean: ${telemetry.leanAngle.toFixed(1)}°
- Fuel: ${telemetry.fuelLoad.toFixed(1)} kg remaining

## Response rules
- Start with the decision, then explain evidence.
- Be concise and operational.
- State uncertainty when evidence is incomplete.
- When asked for missions, include objective, intervention, measurement, risk gate, and validation criteria.
- Never invent unavailable data; say "insufficient evidence".
- Today: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.`;

  const vehicleContext: RaceCopilotVehicleContext = {
    circuit_name: session.circuitName,
    country: activeCircuit.country,
    lap: telemetry.lapCount,
    total_laps: MUGELLO_CIRCUIT.raceLaps,
    position: telemetry.position,
    gap: telemetry.gap,
    speed_kmh: telemetry.speed,
    gear: telemetry.gear,
    rpm: telemetry.rpm,
    throttle_pct: telemetry.throttle,
    brake_pct: telemetry.brake,
    lean_angle_deg: telemetry.leanAngle,
    last_lap_s: telemetry.lastLap,
    best_lap_s: telemetry.bestLap,
    lap_delta_s: lapDelta,
    rear_compound: telemetry.rearCompound,
    rear_tyre_age_laps: telemetry.rearTyreAge,
    rear_grip_pct: rearGrip,
    fuel_kg: telemetry.fuelLoad,
    tyre_temps_c: {
      front_left: telemetry.tireFrontLeft,
      front_right: telemetry.tireFrontRight,
      rear_left: telemetry.tireRearLeft,
      rear_right: telemetry.tireRearRight,
    },
  };

  const { messages, isStreaming, sendMessage, clearMessages } = useAIChat(systemPrompt, {
    commandCenterId: 'kdd-pit-wall-command-center',
    vehicleContext,
  });

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    const seed = sessionStorage.getItem(COPILOT_SEED_KEY);
    if (seed) {
      sessionStorage.removeItem(COPILOT_SEED_KEY);
      sendMessage(seed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function submitInput() {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput('');
    sendMessage(text);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    submitInput();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitInput();
    }
  }

  const isEmpty = messages.length === 0;
  const msgCount = messages.length;
  const estimatedTokens = messages.reduce((acc, message) => acc + Math.ceil(message.content.length / 4), 0);

  const sendPrompt = (prompt: string) => {
    if (!isStreaming) sendMessage(prompt);
  };

  return (
    <div className="copilot-page">
      <header className="copilot-header">
        <div className="copilot-header__identity">
          <span className="copilot-header__icon" aria-hidden="true"><Bot size={20} /></span>
          <div>
            <h1>{t('aiCopilot.title', 'KDD Copilot')}</h1>
            <p>
              AI Layer · Explains PitWall decisions · {session.circuitName}
              {msgCount > 0 && <span> · {msgCount} messages · ~{estimatedTokens.toLocaleString()} tokens</span>}
            </p>
          </div>
          <span className="badge badge-red copilot-live-badge"><Zap size={10} aria-hidden="true" />LIVE</span>
        </div>

        <div className="copilot-header__actions">
          <div className="copilot-header-stats" aria-label="Current decision context">
            <span><small>Lap</small><strong>{telemetry.lapCount}</strong></span>
            <span><small>Pos</small><strong className="is-critical">P{telemetry.position}</strong></span>
            <span><small>Grip</small><strong className={toneForGrip(rearGrip)}>{rearGrip.toFixed(0)}%</strong></span>
            <span><small>Delta</small><strong className={toneForDelta(lapDelta)}>{lapDeltaLabel}</strong></span>
          </div>
          <button className="btn btn-ghost btn-sm flex items-center gap-1" type="button" onClick={() => setCtx(value => !value)} aria-expanded={showContext}>
            {showContext ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {t('aiCopilot.context', 'Context')}
          </button>
          {!isEmpty && (
            <button className="btn btn-ghost btn-sm flex items-center gap-2" type="button" onClick={clearMessages}>
              <Trash2 size={13} />
              {t('aiCopilot.clear', 'Clear')}
            </button>
          )}
        </div>
      </header>

      <div className="copilot-workspace">
        <main className="copilot-main" aria-label="KDD Copilot conversation">
          <div className="copilot-messages" ref={scrollRef}>
            {isEmpty ? (
              <section className="copilot-empty" aria-labelledby="copilot-empty-title">
                <span className="copilot-empty-icon" aria-hidden="true"><Bot size={42} /></span>
                <h2 id="copilot-empty-title" className="copilot-empty-title">KDD Copilot is standing by.</h2>
                <p className="copilot-empty-sub">
                  Ask for a decision explanation, the evidence chain, a validation mission, or coach-ready feedback. Every answer should connect telemetry to an action.
                </p>

                <div className="copilot-decision-loop" aria-label="KDD decision loop">
                  {['Telemetry', 'Event', 'Cause', 'Recommendation', 'Mission', 'Validation'].map(step => <span key={step}>{step}</span>)}
                </div>

                <div className="copilot-evidence-grid" aria-label="Current evidence snapshot">
                  <EvidenceCard icon={ShieldAlert} label="Current event" value="T15 exit instability" body="Rear grip and lap delta are the first evidence to inspect before changing setup." tone="is-warning" />
                  <EvidenceCard icon={FileText} label="Evidence" value={lapDeltaLabel} body="Live lap delta anchors the explanation; missing channels must be called out explicitly." tone={toneForDelta(lapDelta)} />
                  <EvidenceCard icon={Target} label="Next action" value="Validation mission" body="Copilot should turn a recommendation into a measurable stint plan." tone="is-valid" />
                </div>

                <div className="copilot-briefings" aria-label="High-value Copilot actions">
                  {BRIEFINGS.map(briefing => {
                    const Icon = briefing.icon;
                    return (
                      <button key={briefing.id} className="copilot-briefing" type="button" onClick={() => sendPrompt(briefing.build(telemetry.lapCount, telemetry.position, rearGrip, telemetry.fuelLoad, formatLap(telemetry.lastLap)))} disabled={isStreaming}>
                        <Icon size={16} aria-hidden="true" />
                        <span><strong>{briefing.label}</strong><small>{briefing.meta}</small></span>
                      </button>
                    );
                  })}
                </div>

                <RiderCoachInsight />

                <div className="copilot-category-tabs" role="tablist" aria-label="Prompt categories">
                  {(Object.keys(QUICK_PROMPTS) as PromptCategory[]).map(category => (
                    <button key={category} type="button" role="tab" aria-selected={activeCategory === category} className={activeCategory === category ? 'is-active' : undefined} onClick={() => setCategory(category)}>
                      {CATEGORY_LABELS[category]}
                    </button>
                  ))}
                </div>

                <div className="copilot-chips" aria-label="Prompt suggestions">
                  {QUICK_PROMPTS[activeCategory].map(prompt => (
                    <button key={prompt} className="copilot-chip" type="button" onClick={() => sendPrompt(prompt)} disabled={isStreaming}>
                      {prompt}
                    </button>
                  ))}
                </div>
              </section>
            ) : (
              <ul className="copilot-thread">
                {messages.map(message => (
                  <li key={message.id} className={`copilot-msg ${message.role === 'user' ? 'copilot-msg-user' : 'copilot-msg-assistant'}`}>
                    <span className="copilot-msg-role">{message.role === 'user' ? 'You' : 'Copilot'}</span>
                    <p className="copilot-msg-content">
                      {message.role === 'assistant' ? <HighlightedMessage text={message.content} /> : message.content}
                      {message.streaming && <span className="copilot-cursor" aria-label="Copilot is responding" />}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <LiveMetricBar lap={telemetry.lapCount} pos={telemetry.position} gap={telemetry.gap} speed={telemetry.speed} gear={telemetry.gear} grip={rearGrip} fuel={telemetry.fuelLoad} lastLap={formatLap(telemetry.lastLap)} />

          <form className="copilot-input-bar" onSubmit={handleSubmit}>
            {!isEmpty && (
              <div className="copilot-active-prompts" aria-label="Quick prompts">
                {(Object.keys(QUICK_PROMPTS) as PromptCategory[]).map(category => (
                  <button key={category} type="button" className={activeCategory === category ? 'is-active' : undefined} onClick={() => setCategory(category)}>
                    {CATEGORY_LABELS[category]}
                  </button>
                ))}
                {QUICK_PROMPTS[activeCategory].slice(0, 2).map(prompt => (
                  <button key={prompt} type="button" onClick={() => sendPrompt(prompt)} disabled={isStreaming}>{prompt}</button>
                ))}
              </div>
            )}

            <div className="copilot-composer">
              <label className="sr-only" htmlFor="copilot-input">Ask KDD Copilot</label>
              <textarea
                id="copilot-input"
                ref={inputRef}
                className="copilot-textarea"
                placeholder="Ask about T15, tyre/setup cause, mission generation, or coach summary…"
                value={input}
                onChange={event => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                rows={2}
                disabled={isStreaming}
              />
              <button className="copilot-send" type="submit" disabled={!input.trim() || isStreaming} aria-label={isStreaming ? 'Copilot is generating' : 'Send message'}>
                {isStreaming ? <Loader2 size={16} className="spin" aria-hidden="true" /> : <Send size={16} aria-hidden="true" />}
              </button>
            </div>
          </form>
        </main>

        {showContext && (
          <aside className="copilot-context" aria-label="Live node and session context">
            <div className="copilot-context__header">
              <strong>Live node context</strong>
              <span>Private learning · raw telemetry protected</span>
            </div>
            <CtxTile label="Circuit" value={session.circuitName} />
            <CtxTile label="Lap" value={telemetry.lapCount} />
            <CtxTile label="Position" value={`P${telemetry.position}`} tone="is-critical" />
            <CtxTile label="Gap" value={telemetry.gap} tone="is-warning" />
            <CtxTile label="Speed" value={telemetry.speed} unit="km/h" />
            <CtxTile label="Gear" value={telemetry.gear} tone="is-critical" />
            <CtxTile label="RPM" value={telemetry.rpm.toLocaleString()} />

            <div className="copilot-context__section">Tyres</div>
            <TyreThermalMini fl={telemetry.tireFrontLeft} fr={telemetry.tireFrontRight} rl={telemetry.tireRearLeft} rr={telemetry.tireRearRight} />
            <CtxTile label="Rear" value={telemetry.rearCompound} tone="is-critical" />
            <CtxTile label="Age" value={`${telemetry.rearTyreAge} laps`} />
            <CtxTile label="Grip est." value={`${rearGrip.toFixed(1)}%`} tone={toneForGrip(rearGrip)} />
            <CtxTile label="RL temp" value={`${telemetry.tireRearLeft}°C`} tone={toneForTemp(telemetry.tireRearLeft)} />
            <CtxTile label="RR temp" value={`${telemetry.tireRearRight}°C`} tone={toneForTemp(telemetry.tireRearRight)} />

            <div className="copilot-context__section">Performance</div>
            <CtxTile label="Last lap" value={formatLap(telemetry.lastLap)} />
            <CtxTile label="Best lap" value={formatLap(telemetry.bestLap)} tone="is-valid" />
            <CtxTile label="Delta" value={lapDeltaLabel} tone={toneForDelta(lapDelta)} />
            <CtxTile label="Fuel" value={`${telemetry.fuelLoad.toFixed(1)} kg`} tone={toneForFuel(telemetry.fuelLoad)} />
            <CtxTile label="Lean" value={`${telemetry.leanAngle.toFixed(1)}°`} tone={telemetry.leanAngle > 48 ? 'is-critical' : 'is-text'} />
          </aside>
        )}
      </div>
    </div>
  );
}

export default AICopilotPage;
