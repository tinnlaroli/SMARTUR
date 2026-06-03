import { ui, defaultLang, languages } from './ui';

export { languages, defaultLang };

export function useTranslations(lang: keyof typeof ui = defaultLang) {
  return function t(key: keyof typeof ui[typeof defaultLang]) {
    return ui[lang][key] || ui[defaultLang][key];
  }
}
