import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import en from '../../i18n/locales/en';
import es from '../../i18n/locales/es';

let currentLocale: Record<string, unknown> = en;

vi.mock('../../components/public/KddHeroVisual', () => ({
  KddHeroVisual: () => null,
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
});

describe('HomePage resume session CTA', () => {
  it('shows the resume-last-session CTA for English visitors', () => {
    currentLocale = en;

    render(<HomePage />);

    expect(screen.getByRole('link', { name: /resume last session/i })).toHaveAttribute('href', '/app');
  });

  it('shows the translated resume-last-session CTA for Spanish visitors', () => {
    currentLocale = es;

    render(<HomePage />);

    expect(screen.getByRole('link', { name: /reanudar la última sesión/i })).toHaveAttribute('href', '/app');
  });
});
