import { useCallback, useRef, useState } from 'react';
import { insforge } from '../lib/insforge';
import {
  buildBlueprintMessages,
  type BlueprintRequest,
} from '../services/blueprintBrief';

type BlueprintStatus = 'idle' | 'generating' | 'done' | 'error';

interface BlueprintStreamChunk {
  choices?: Array<{
    delta?: {
      content?: string;
    };
  }>;
}

const MODEL = 'openai/gpt-4o-mini';

export function useBlueprintBrief() {
  const [brief, setBrief] = useState('');
  const [status, setStatus] = useState<BlueprintStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const activeRequestRef = useRef(0);

  const clearBrief = useCallback(() => {
    activeRequestRef.current += 1;
    setBrief('');
    setStatus('idle');
    setError(null);
  }, []);

  const generateBlueprint = useCallback(async (request: BlueprintRequest) => {
    const requestId = ++activeRequestRef.current;
    const messages = buildBlueprintMessages(request);

    setBrief('');
    setError(null);
    setStatus('generating');

    try {
      const stream = await insforge.ai.chat.completions.create({
        model: MODEL,
        messages,
        stream: true,
        maxTokens: 768,
      });

      let accumulated = '';
      for await (const chunk of stream as AsyncIterable<BlueprintStreamChunk>) {
        if (activeRequestRef.current !== requestId) return null;
        const delta = chunk.choices?.[0]?.delta?.content ?? '';
        if (!delta) continue;

        accumulated += delta;
        setBrief(accumulated);
      }

      if (activeRequestRef.current === requestId) {
        setStatus('done');
      }

      return accumulated;
    } catch (cause) {
      if (activeRequestRef.current !== requestId) return null;

      const message = cause instanceof Error ? cause.message : 'Blueprint request failed';
      setError(message);
      setBrief(`⚠ ${message}`);
      setStatus('error');
      return null;
    }
  }, []);

  return {
    brief,
    error,
    status,
    isGenerating: status === 'generating',
    clearBrief,
    generateBlueprint,
  };
}
