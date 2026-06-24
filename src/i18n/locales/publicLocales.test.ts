import { describe, expect, it } from 'vitest';

import fr from './fr';
import itLocale from './it';
import ja from './ja';

const locales = [
  ['fr', fr],
  ['it', itLocale],
  ['ja', ja],
] as const;

function readPath(source: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((value, key) => {
    if (typeof value !== 'object' || value === null || !(key in value)) return undefined;
    return (value as Record<string, unknown>)[key];
  }, source);
}

describe('public locale namespace parity', () => {
  it.each(locales)('%s exposes the landing and funnel copy', (_localeName, locale) => {
    expect(readPath(locale, 'public.heroVisual.subtitle')).toEqual(expect.any(String));
    expect(readPath(locale, 'public.home.nav.login')).toEqual(expect.any(String));
    expect(readPath(locale, 'public.home.hero.loginCta')).toEqual(expect.any(String));
    expect(readPath(locale, 'public.login.modal.actions.verifyAndEnter')).toEqual(expect.any(String));
    expect(readPath(locale, 'public.trial.sidebar.links.app')).toEqual(expect.any(String));
    expect(readPath(locale, 'public.foundingNodes.segments.universities.body')).toEqual(expect.any(String));
    expect(readPath(locale, 'public.thanks.app')).toEqual(expect.any(String));
  });
});
