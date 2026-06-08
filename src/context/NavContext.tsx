import { createContext, useContext } from 'react';
import { TabId } from './AuthContext';

/**
 * Lightweight cross-page navigation. AppShell provides `navigate(tab, seed?)`;
 * pages call it to jump to another tab and optionally seed a question for the
 * AI Copilot (Rider Coach), e.g. from the AI Crew "Ask" buttons.
 */
export type NavigateFn = (tab: TabId, seed?: string) => void;

export const NavContext = createContext<NavigateFn>(() => {});

export function useNavigate(): NavigateFn {
  return useContext(NavContext);
}

export const COPILOT_SEED_KEY = 'kdd-copilot-seed';
