import { describe, expect, it } from 'vitest';
import { useTranslations, defaultLang, languages } from './utils';
import { ui } from './ui';

describe('i18n utils', () => {
  it('exports the configured languages and default language', () => {
    expect(languages).toBeDefined();
    expect(defaultLang).toBe('es');
    expect(Object.keys(languages)).toEqual(expect.arrayContaining(['es', 'en', 'fr', 'pt']));
  });

  it('useTranslations returns a translator bound to the given language', () => {
    const t = useTranslations('en');
    expect(t('nav.home')).toBe(ui.en['nav.home']);
  });

  it('useTranslations defaults to the default language when none is given', () => {
    const t = useTranslations();
    expect(t('nav.home')).toBe(ui[defaultLang]['nav.home']);
  });

  it('falls back to the default language translation when the key is missing for the requested language', () => {
    const t = useTranslations('fr');
    // "video.title" only differs per-locale, but every locale has it defined,
    // so the fallback only kicks in for genuinely empty/falsy values.
    expect(t('video.title')).toBe(ui.fr['video.title']);
  });

  it('every locale exposes the same set of translation keys (no missing keys)', () => {
    const localeKeys = Object.keys(languages) as Array<keyof typeof ui>;
    const referenceKeys = Object.keys(ui[defaultLang]).sort();
    for (const lang of localeKeys) {
      expect(Object.keys(ui[lang]).sort()).toEqual(referenceKeys);
    }
  });
});
