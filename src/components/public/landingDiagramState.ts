import { useEffect, useState, type KeyboardEventHandler, type TouchEventHandler } from 'react';

export type DiagramSelectionSource = 'keyboard' | 'touch';
export type DiagramActivationSource = DiagramSelectionSource | 'hover' | 'scroll';

export type DiagramState = {
  activeId: string | null;
  source: DiagramActivationSource | null;
  reducedMotion: boolean;
};

export type DiagramSelectionContract = {
  role: 'button';
  tabIndex: 0;
  onKeyDown: KeyboardEventHandler<HTMLButtonElement>;
  onTouchStart: TouchEventHandler<HTMLButtonElement>;
};

const ACTIVATE_KEYS = new Set(['Enter', ' ', 'Spacebar', 'Space']);

function getMatchMedia(): ((query: string) => MediaQueryList) | null {
  if (typeof globalThis.matchMedia === 'function') return globalThis.matchMedia.bind(globalThis);
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') return window.matchMedia.bind(window);
  return null;
}

function readReducedMotionPreference(): boolean {
  const matchMedia = getMatchMedia();
  return Boolean(matchMedia?.('(prefers-reduced-motion: reduce)').matches);
}

export function createDiagramState(activeId: string | null = null, reducedMotion = false): DiagramState {
  return {
    activeId,
    source: null,
    reducedMotion,
  };
}

export function activateDiagram(state: DiagramState, activeId: string, source: DiagramActivationSource): DiagramState {
  return {
    ...state,
    activeId,
    source,
  };
}

export function isDiagramActive(state: DiagramState, diagramId: string): boolean {
  return state.activeId === diagramId;
}

export function getDiagramEmphasis(state: DiagramState, diagramId: string): 'active' | 'recede' {
  return isDiagramActive(state, diagramId) ? 'active' : 'recede';
}

export function createDiagramSelectionContract(
  diagramId: string,
  onSelect: (diagramId: string, source: DiagramSelectionSource) => void,
): DiagramSelectionContract {
  return {
    role: 'button',
    tabIndex: 0,
    onKeyDown: event => {
      if (!ACTIVATE_KEYS.has(event.key)) return;
      event.preventDefault();
      onSelect(diagramId, 'keyboard');
    },
    onTouchStart: event => {
      event.preventDefault();
      onSelect(diagramId, 'touch');
    },
  };
}

export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(readReducedMotionPreference);

  useEffect(() => {
    const matchMedia = getMatchMedia();
    if (!matchMedia) return;

    const mediaQueryList = matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (event: MediaQueryListEvent) => setPrefersReducedMotion(event.matches);

    setPrefersReducedMotion(mediaQueryList.matches);
    mediaQueryList.onchange = handleChange;

    if (typeof mediaQueryList.addEventListener === 'function') {
      mediaQueryList.addEventListener('change', handleChange);
      return () => {
        if (mediaQueryList.onchange === handleChange) mediaQueryList.onchange = null;
        mediaQueryList.removeEventListener?.('change', handleChange);
      };
    }

    mediaQueryList.addListener?.(handleChange);
    return () => {
      if (mediaQueryList.onchange === handleChange) mediaQueryList.onchange = null;
      mediaQueryList.removeListener?.(handleChange);
    };
  }, []);

  return prefersReducedMotion;
}
