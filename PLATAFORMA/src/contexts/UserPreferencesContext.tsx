import React, { createContext, use, useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { defaultLang, languages, ui, type LanguageCode } from './languageCatalog';
import { USER_STORAGE_SYNC_EVENT, emitUserStorageSync } from '../shared/userStorageSync';

export type Theme = 'light' | 'dark';

export type SessionUser = {
    id: number;
    name: string;
    email: string;
    role_id: number;
};

const USER_KEY = 'user';
const PREFS_KEY = 'smartur-preferences';

type StoredPrefs = {
    theme: Theme;
    lang: LanguageCode;
};

function readUserFromStorage(): SessionUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
        const u = JSON.parse(raw) as SessionUser;
        if (u && typeof u.id === 'number' && typeof u.email === 'string') return u;
    } catch {
        /* ignore */
    }
    return null;
}

function legacyTheme(): Theme {
    const stored = localStorage.getItem('theme') as Theme | null;
    if (stored === 'dark' || stored === 'light') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function legacyLang(): LanguageCode {
    const stored = localStorage.getItem('smartur-lang') as LanguageCode | null;
    if (stored && stored in languages) return stored;
    return defaultLang;
}

function readPrefsFromStorage(): StoredPrefs {
    try {
        const raw = localStorage.getItem(PREFS_KEY);
        if (raw) {
            const p = JSON.parse(raw) as Partial<StoredPrefs>;
            const theme = p.theme === 'dark' || p.theme === 'light' ? p.theme : legacyTheme();
            const lang = p.lang && p.lang in languages ? p.lang : legacyLang();
            return { theme, lang };
        }
    } catch {
        /* ignore */
    }
    return { theme: legacyTheme(), lang: legacyLang() };
}

function writePrefs(theme: Theme, lang: LanguageCode) {
    const payload: StoredPrefs = { theme, lang };
    localStorage.setItem(PREFS_KEY, JSON.stringify(payload));
    localStorage.setItem('theme', theme);
    localStorage.setItem('smartur-lang', lang);
}

type UserPreferencesContextValue = {
    user: SessionUser | null;
    setUser: (user: SessionUser | null) => void;
    clearUser: () => void;
    theme: Theme;
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
    lang: LanguageCode;
    changeLanguage: (code: string) => void;
    t: (key: string, params?: Record<string, string | number | null | undefined>) => string;
    isReady: boolean;
};

const UserPreferencesContext = createContext<UserPreferencesContextValue | undefined>(undefined);

export const UserPreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUserState] = useState<SessionUser | null>(() => readUserFromStorage());
    const [theme, setThemeState] = useState<Theme>(() => readPrefsFromStorage().theme);
    const [lang, setLangState] = useState<LanguageCode>(() => readPrefsFromStorage().lang);
    const [isReady, setIsReady] = useState(false);

    const hydrateFromStorage = useCallback(() => {
        const prefs = readPrefsFromStorage();
        setThemeState(prefs.theme);
        setLangState(prefs.lang);
        setUserState(readUserFromStorage());
        document.documentElement.setAttribute('data-theme', prefs.theme);
        document.documentElement.lang = prefs.lang;
    }, []);

    useEffect(() => {
        setIsReady(true);
    }, []);

    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key === USER_KEY || e.key === PREFS_KEY || e.key === 'theme' || e.key === 'smartur-lang') {
                hydrateFromStorage();
            }
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, [hydrateFromStorage]);

    useEffect(() => {
        const onCustom = () => hydrateFromStorage();
        window.addEventListener(USER_STORAGE_SYNC_EVENT, onCustom);
        return () => window.removeEventListener(USER_STORAGE_SYNC_EVENT, onCustom);
    }, [hydrateFromStorage]);

    useLayoutEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        document.documentElement.lang = lang;
        writePrefs(theme, lang);
    }, [theme, lang]);

    const setUser = useCallback((next: SessionUser | null) => {
        setUserState(next);
        if (next) localStorage.setItem(USER_KEY, JSON.stringify(next));
        else localStorage.removeItem(USER_KEY);
        emitUserStorageSync();
    }, []);

    const clearUser = useCallback(() => setUser(null), [setUser]);

    const setTheme = useCallback((next: Theme) => {
        setThemeState(next);
    }, []);

    const toggleTheme = useCallback(() => {
        setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
    }, []);

    const changeLanguage = useCallback((code: string) => {
        if (code in languages) setLangState(code as LanguageCode);
    }, []);

    const t = useCallback((key: string, params?: Record<string, string | number | null | undefined>) => {
        let value = ui[lang]?.[key] ?? key;
        if (params) {
            for (const [k, v] of Object.entries(params)) {
                value = value.replace(`{${k}}`, String(v ?? ''));
            }
        }
        return value;
    }, [lang]);

    const value = useMemo<UserPreferencesContextValue>(
        () => ({
            user,
            setUser,
            clearUser,
            theme,
            setTheme,
            toggleTheme,
            lang,
            changeLanguage,
            t,
            isReady,
        }),
        [user, setUser, clearUser, theme, setTheme, toggleTheme, lang, changeLanguage, t, isReady],
    );

    return <UserPreferencesContext.Provider value={value}>{children}</UserPreferencesContext.Provider>;
};

export const useUserPreferences = () => {
    const ctx = use(UserPreferencesContext);
    if (ctx === undefined) {
        throw new Error('useUserPreferences must be used within UserPreferencesProvider');
    }
    return ctx;
};

export const useLanguage = () => {
    const { lang, changeLanguage, t, isReady } = useUserPreferences();
    return { lang, changeLanguage, t, isReady };
};
