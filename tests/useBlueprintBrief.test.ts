import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { useBlueprintBrief } from '../src/hooks/useBlueprintBrief';

const createMock = vi.hoisted(() => vi.fn());

vi.mock('../src/lib/insforge', () => ({
  insforge: {
    ai: {
      chat: {
        completions: {
          create: createMock,
        },
      },
    },
  },
}));

function streamFrom(parts: string[]) {
  return {
    async *[Symbol.asyncIterator]() {
      for (const part of parts) {
        yield { choices: [{ delta: { content: part } }] };
      }
    },
  };
}

beforeEach(() => {
  createMock.mockReset();
});

describe('useBlueprintBrief', () => {
  it('streams a concise blueprint brief and marks success', async () => {
    createMock.mockResolvedValueOnce(streamFrom(['# Blueprint\n', '- goal\n', '- checklist\n']));

    const { result } = renderHook(() => useBlueprintBrief());
    const request = {
      prompt: 'Aero winglet bracket',
      material: 'carbon',
      dimensions: { x: 120, y: 80, z: 45, loadKg: 50 },
      result: { mass: 1.2, peakStress: 87, safetyFactor: 2.31, rounds: 1 },
    };

    let promise: Promise<string | null> | null = null;
    await act(async () => {
      promise = result.current.generateBlueprint(request);
    });

    await act(async () => {
      await promise;
    });

    expect(createMock).toHaveBeenCalledTimes(1);
    expect(createMock.mock.calls[0][0]).toMatchObject({
      model: 'openai/gpt-4o-mini',
      stream: true,
      maxTokens: 768,
    });
    expect(createMock.mock.calls[0][0].messages[1].content).toContain('Aero winglet bracket');
    expect(result.current.status).toBe('done');
    expect(result.current.brief).toContain('# Blueprint');
  });

  it('records an error brief when the stream fails', async () => {
    createMock.mockRejectedValueOnce(new Error('Gateway request failed'));

    const { result } = renderHook(() => useBlueprintBrief());

    await act(async () => {
      await result.current.generateBlueprint({
        prompt: 'Aero winglet bracket',
        material: 'carbon',
        dimensions: { x: 120, y: 80, z: 45, loadKg: 50 },
      });
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe('Gateway request failed');
    expect(result.current.brief).toContain('Gateway request failed');
  });
});
