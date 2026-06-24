import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import en from '../../i18n/locales/en';
import es from '../../i18n/locales/es';

let currentLocale: Record<string, unknown> = en;
let currentUser: { id: string } | null = null;

vi.mock('../../components/public/KddHeroVisual', () => ({
  KddHeroVisual: () => null,
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: currentUser, authLoading: false }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: createTranslator(currentLocale) }),
}));

import { HomePage } from './HomePage';

function createTranslator(locale: Record<string, unknown>) {
  return (path: string, options?: { returnObjects?: boolean }) => {
    const value = path.split('.').reduce<unknown>((current, key) => {
      if (typeof current !== 'object' || current === null || !(key in current)) return undefined;
      return (current as Record<string, unknown>)[key];
    }, locale);

    if (options?.returnObjects) return value;
    return typeof value === 'string' ? value : path;
  };
}

beforeEach(() => {
  currentLocale = en;
  currentUser = null;
});

describe('HomePage resume session CTA', () => {
  it('keeps public ordering for visitors who are not authenticated', () => {
    currentLocale = en;
    currentUser = null;

    render(<HomePage />);

    const resumeLink = screen.getByRole('link', { name: /resume last session/i });
    const heroLinks = within(resumeLink.closest('div')!).getAllByRole('link');

    expect(heroLinks.map(link => link.getAttribute('href'))).toEqual(['/founding-nodes', '/app', '/login']);
  });

  it('shows a welcome back indicator for authenticated visitors', () => {
    currentLocale = en;
    currentUser = { id: 'user-1' };

    render(<HomePage />);

    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    expect(screen.getByText(/resume your last session/i)).toBeInTheDocument();
  });

  it('keeps the indicator hidden for guests', () => {
    currentLocale = en;
    currentUser = null;

    render(<HomePage />);

    expect(screen.queryByText(/welcome back/i)).not.toBeInTheDocument();
  });

  it('promotes resume last session to the first CTA for authenticated visitors', () => {
    currentLocale = es;
    currentUser = { id: 'user-1' };

    render(<HomePage />);

    const resumeLink = screen.getByRole('link', { name: /reanudar la última sesión/i });
    const heroLinks = within(resumeLink.closest('div')!).getAllByRole('link');

    expect(heroLinks.map(link => link.getAttribute('href'))).toEqual(['/app', '/founding-nodes', '/login']);
  });
});
