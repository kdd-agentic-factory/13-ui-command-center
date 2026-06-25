import { act, renderHook, waitFor } from '@testing-library/react';
import type { KeyboardEvent as ReactKeyboardEvent, TouchEvent as ReactTouchEvent } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  activateDiagram,
  createDiagramSelectionContract,
  createDiagramState,
  getDiagramEmphasis,
  isDiagramActive,
  usePrefersReducedMotion,
} from './landingDiagramState';

type MatchMediaMock = MediaQueryList & {
  matches: boolean;
  dispatchChange: (matches: boolean) => void;
};

function createMatchMediaMock(matches: boolean): MatchMediaMock {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();

  const mock = {
    matches,
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addEventListener: vi.fn((type: string, listener: EventListenerOrEventListenerObject) => {
      if (type !== 'change' || typeof listener === 'function') return;
      listeners.add(listener as unknown as (event: MediaQueryListEvent) => void);
    }),
    removeEventListener: vi.fn((type: string, listener: EventListenerOrEventListenerObject) => {
      if (type !== 'change' || typeof listener === 'function') return;
      listeners.delete(listener as unknown as (event: MediaQueryListEvent) => void);
    }),
    addListener: vi.fn((listener: (event: MediaQueryListEvent) => void) => {
      listeners.add(listener);
    }),
    removeListener: vi.fn((listener: (event: MediaQueryListEvent) => void) => {
      listeners.delete(listener);
    }),
    dispatchChange(nextMatches: boolean) {
      mock.matches = nextMatches;
      mock.onchange?.({ matches: nextMatches, media: mock.media } as MediaQueryListEvent);
      listeners.forEach(listener => listener({ matches: nextMatches, media: mock.media } as MediaQueryListEvent));
    },
  } as unknown as MatchMediaMock;

  return mock;
}

describe('landingDiagramState helpers', () => {
  it('creates and activates a diagram state without mutating the original', () => {
    const initial = createDiagramState('designs');
    const next = activateDiagram(initial, 'privacy', 'touch');

    expect(isDiagramActive(initial, 'designs')).toBe(true);
    expect(getDiagramEmphasis(initial, 'privacy')).toBe('recede');
    expect(next).toEqual({ activeId: 'privacy', source: 'touch', reducedMotion: false });
    expect(isDiagramActive(next, 'privacy')).toBe(true);
    expect(getDiagramEmphasis(next, 'privacy')).toBe('active');
    expect(getDiagramEmphasis(next, 'designs')).toBe('recede');
  });

  it('preserves reduced motion in the state helpers', () => {
    const initial = createDiagramState('workflow', true);
    const next = activateDiagram(initial, 'workflow', 'keyboard');

    expect(initial.reducedMotion).toBe(true);
    expect(next.reducedMotion).toBe(true);
    expect(getDiagramEmphasis(next, 'workflow')).toBe('active');
  });
});

describe('usePrefersReducedMotion', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the current preference and updates on change', async () => {
    const mediaQuery = createMatchMediaMock(false);
    vi.stubGlobal('matchMedia', vi.fn(() => mediaQuery));

    const { result } = renderHook(() => usePrefersReducedMotion());

    expect(result.current).toBe(false);

    act(() => {
      mediaQuery.dispatchChange(true);
    });

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it('falls back to false when matchMedia is unavailable', () => {
    vi.stubGlobal('matchMedia', undefined);

    const { result } = renderHook(() => usePrefersReducedMotion());

    expect(result.current).toBe(false);
  });
});

describe('createDiagramSelectionContract', () => {
  let onSelect: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onSelect = vi.fn();
  });

  it('activates on Enter and Space but ignores other keys', () => {
    const contract = createDiagramSelectionContract('designs', onSelect);

    contract.onKeyDown({ key: 'Escape', preventDefault: vi.fn() } as unknown as ReactKeyboardEvent<HTMLButtonElement>);
    expect(onSelect).not.toHaveBeenCalled();

    const preventEnter = vi.fn();
    contract.onKeyDown({ key: 'Enter', preventDefault: preventEnter } as unknown as ReactKeyboardEvent<HTMLButtonElement>);
    expect(preventEnter).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('designs', 'keyboard');

    const preventSpace = vi.fn();
    contract.onKeyDown({ key: ' ', preventDefault: preventSpace } as unknown as ReactKeyboardEvent<HTMLButtonElement>);
    expect(preventSpace).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('designs', 'keyboard');
  });

  it('activates on touch and prevents the native click chain', () => {
    const contract = createDiagramSelectionContract('privacy', onSelect);
    const preventDefault = vi.fn();

    contract.onTouchStart({ preventDefault } as unknown as ReactTouchEvent<HTMLButtonElement>);

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('privacy', 'touch');
    expect(contract.role).toBe('button');
    expect(contract.tabIndex).toBe(0);
  });
});
