/**
 * i18n catalog and language hook. Runtime state (language, theme, session user)
 * lives in {@link UserPreferencesProvider}.
 */
export { languages, ui, defaultLang, type LanguageCode } from './languageCatalog';
export {
    UserPreferencesProvider,
    useLanguage,
    useUserPreferences,
    type SessionUser,
} from './UserPreferencesContext';

/** @deprecated Use `UserPreferencesProvider` */
export { UserPreferencesProvider as LanguageProvider } from './UserPreferencesContext';
