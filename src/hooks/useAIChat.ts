/**
 * useAIChat — Race AI Copilot chat hook with InsForge Gateway fallback.
 *
 * Routes live Command Center context to 16-race-ai-copilot when available.
 * If that backend/BFF is unreachable, streams completions token-by-token using
 * the OpenAI-compatible SSE API exposed by InsForge.
 */
import { useState, useCallback, useRef } from 'react';
import { insforge } from '../lib/insforge';
import { askRaceCopilot, type RaceCopilotVehicleContext } from '../services/api';

// ──── Types ────

export type MessageRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  /** True while this assistant message is still streaming */
  streaming?: boolean;
}

export interface AIChatOptions {
  vehicleContext?: RaceCopilotVehicleContext;
  commandCenterId?: string;
}

// ──── Constants ────

/** Default model exposed via InsForge → OpenRouter gateway */
const MODEL = 'openai/gpt-4o-mini';

// ──── Hook ────

function formatCopilotResponse(answer: string, nextStep?: string | null, approvalRequired?: boolean): string {
  const sections = [answer];
  if (nextStep) sections.push(`Next step: ${nextStep}`);
  if (approvalRequired) sections.push('Approval gate: crew-chief review required before operational execution.');
  return sections.join('\n\n');
}

export function useAIChat(systemPrompt: string, options: AIChatOptions = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  // Keep a stable ref to the latest messages for the sendMessage closure
  const messagesRef = useRef<ChatMessage[]>([]);
  messagesRef.current = messages;

  const sendMessage = useCallback(
    async (userText: string) => {
      const trimmed = userText.trim();
      if (!trimmed || isStreaming) return;

      // 1 — Add user message
      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: 'user',
        content: trimmed,
      };
      setMessages(prev => [...prev, userMsg]);
      setIsStreaming(true);

      // 2 — Add empty assistant placeholder (will be filled by stream)
      const assistantId = `a-${Date.now() + 1}`;
      setMessages(prev => [
        ...prev,
        { id: assistantId, role: 'assistant', content: '', streaming: true },
      ]);

      try {
        // Build conversation history (exclude streaming placeholder)
        const history = [...messagesRef.current, userMsg]
          .filter(m => !m.streaming)
          .map(m => ({ role: m.role, content: m.content }));

        if (options.vehicleContext) {
          const copilot = await askRaceCopilot({
            query: trimmed,
            history,
            vehicleContext: options.vehicleContext,
            systemPrompt,
            commandCenterId: options.commandCenterId,
          });

          if (copilot) {
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantId
                  ? {
                      ...m,
                      content: formatCopilotResponse(
                        copilot.answer,
                        copilot.next_step,
                        copilot.approval.required,
                      ),
                      streaming: false,
                    }
                  : m,
              ),
            );
            return;
          }
        }

        const stream = await insforge.ai.chat.completions.create({
          model: MODEL,
          messages: [{ role: 'system', content: systemPrompt }, ...history],
          stream: true,
          maxTokens: 1024,
        });

        // 3 — Stream tokens into the assistant message
        let accumulated = '';
        for await (const chunk of stream as AsyncIterable<{
          choices?: { delta?: { content?: string } }[];
        }>) {
          const delta = chunk.choices?.[0]?.delta?.content ?? '';
          if (delta) {
            accumulated += delta;
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantId
                  ? { ...m, content: accumulated }
                  : m,
              ),
            );
          }
        }

        // 4 — Mark streaming done
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId ? { ...m, streaming: false } : m,
          ),
        );
      } catch (err) {
        const errText =
          err instanceof Error ? err.message : 'Gateway request failed';
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId
              ? { ...m, content: `⚠ ${errText}`, streaming: false }
              : m,
          ),
        );
      } finally {
        setIsStreaming(false);
      }
    },
    [isStreaming, options.commandCenterId, options.vehicleContext, systemPrompt],
  );

  const clearMessages = useCallback(() => setMessages([]), []);

  return { messages, isStreaming, sendMessage, clearMessages };
}
