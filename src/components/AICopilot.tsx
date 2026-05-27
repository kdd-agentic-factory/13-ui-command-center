/**
 * AICopilot — AI assistant panel powered by InsForge Model Gateway.
 *
 * Users type natural-language questions about the KDD platform, race
 * telemetry, experiments, or agent workflows. Responses stream token-by-token
 * directly from the InsForge gateway (OpenRouter / gpt-4o-mini by default).
 */
import { useEffect, useRef, useState } from 'react';
import { Bot, Send, Trash2, Zap } from 'lucide-react';
import { useAIChat } from '../hooks/useAIChat';
import type { HealthMap } from '../services/api';

// ── Props ─────────────────────────────────────────────────────────────────────

interface AICopilotProps {
  health: HealthMap;
  servicesUp: number;
  servicesTotal: number;
  experimentsCount: number;
}

// ── System prompt factory ─────────────────────────────────────────────────────

function buildSystemPrompt(
  health: HealthMap,
  servicesUp: number,
  servicesTotal: number,
  experimentsCount: number,
): string {
  const healthLines = Object.entries(health)
    .map(([svc, up]) => `  - ${svc}: ${up ? '✓ online' : '✗ offline'}`)
    .join('\n');

  return `You are the KDD Race Engineering AI Copilot, an intelligent assistant embedded in the KDD Agentic Factory Command Center.

## Your role
Help race engineers, data engineers, and analysts with:
- KDD (Knowledge Discovery in Databases) pipeline operations — selection, preprocessing, transformation, mining, interpretation, deployment
- Race telemetry analysis, pattern detection, and feature extraction
- Experiment design, hypothesis formulation, and metric evaluation
- Agent workflow orchestration and approval management
- MotoGP setup optimisation, tire strategy, and race decision support
- Platform troubleshooting and service health interpretation

## Current platform state
Services online: ${servicesUp}/${servicesTotal}
${healthLines}
Active experiments: ${experimentsCount}

## Response style
- Be concise and actionable. Prefer bullet points for lists.
- Use technical precision but explain domain terms when relevant.
- If a service is offline, suggest what that means operationally.
- You may suggest KDD pipeline steps, data transformations, or experiment configurations.
- Never fabricate telemetry numbers — acknowledge when you don't have real data.
- Today's date: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.`;
}

// ── Suggestion chips ──────────────────────────────────────────────────────────

const SUGGESTIONS = [
  'Explain the KDD pipeline stages and what each agent does',
  'How do I design an A/B experiment for tire compound selection?',
  'What metrics should I track for RAG retrieval quality?',
  'Which services should I check first if the pipeline degrades?',
];

// ── Component ─────────────────────────────────────────────────────────────────

export function AICopilot({
  health,
  servicesUp,
  servicesTotal,
  experimentsCount,
}: AICopilotProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const systemPrompt = buildSystemPrompt(
    health,
    servicesUp,
    servicesTotal,
    experimentsCount,
  );
  const { messages, isStreaming, sendMessage, clearMessages } =
    useAIChat(systemPrompt);

  // Auto-scroll to bottom when new content arrives
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput('');
    sendMessage(text);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Submit on Enter (but not Shift+Enter which inserts a newline)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  }

  function handleSuggestion(text: string) {
    setInput('');
    sendMessage(text);
    inputRef.current?.focus();
  }

  const isEmpty = messages.length === 0;

  return (
    <article className="panel ai-copilot-panel" aria-label="AI Copilot">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="panel__header">
        <div className="ai-copilot__title-group">
          <Bot size={18} className="ai-copilot__icon" aria-hidden="true" />
          <h2 className="panel__title">AI Copilot</h2>
          <span className="ai-copilot__badge">
            <Zap size={10} aria-hidden="true" />
            InsForge Gateway
          </span>
        </div>
        {!isEmpty && (
          <button
            className="text-button ai-copilot__clear-btn"
            type="button"
            onClick={clearMessages}
            aria-label="Clear conversation"
            title="Clear conversation"
          >
            <Trash2 size={14} aria-hidden="true" />
            Limpiar
          </button>
        )}
      </header>

      {/* ── Messages ───────────────────────────────────────────────────── */}
      <div className="ai-copilot__messages" ref={scrollRef} aria-live="polite">
        {isEmpty ? (
          <div className="ai-copilot__empty">
            <Bot size={32} className="ai-copilot__empty-icon" aria-hidden="true" />
            <p className="ai-copilot__empty-title">Race Engineering AI Copilot</p>
            <p className="ai-copilot__empty-sub">
              Pregunta en lenguaje natural sobre telemetría, experimentos,
              pipelines KDD o el estado del sistema.
            </p>
            <div className="ai-copilot__suggestions" role="list">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  type="button"
                  className="ai-copilot__chip"
                  onClick={() => handleSuggestion(s)}
                  role="listitem"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <ul className="ai-copilot__thread" role="list">
            {messages.map(msg => (
              <li
                key={msg.id}
                className={`ai-copilot__msg ai-copilot__msg--${msg.role}`}
                role="listitem"
              >
                <span className="ai-copilot__msg-role" aria-hidden="true">
                  {msg.role === 'user' ? 'Tú' : 'Copilot'}
                </span>
                <p className="ai-copilot__msg-content">
                  {msg.content}
                  {msg.streaming && (
                    <span className="ai-copilot__cursor" aria-hidden="true" />
                  )}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Input ──────────────────────────────────────────────────────── */}
      <form
        className="ai-copilot__input-row"
        onSubmit={handleSubmit}
        aria-label="Enviar mensaje al AI Copilot"
      >
        <textarea
          ref={inputRef}
          className="ai-copilot__textarea"
          placeholder="Escribe tu pregunta… (Enter para enviar, Shift+Enter para nueva línea)"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          disabled={isStreaming}
          aria-label="Mensaje para el AI Copilot"
        />
        <button
          className="icon-button ai-copilot__send"
          type="submit"
          disabled={!input.trim() || isStreaming}
          aria-label="Enviar mensaje"
          title="Enviar"
        >
          <Send size={16} aria-hidden="true" />
        </button>
      </form>
    </article>
  );
}
