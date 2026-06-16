import { useUserPreferences } from './UserPreferencesContext';
import type { Theme } from './UserPreferencesContext';

export type { Theme };

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

/** Theme is owned by {@link useUserPreferences}; this hook keeps existing imports working. */
export const useTheme = (): ThemeContextType => {
    const { theme, toggleTheme, setTheme } = useUserPreferences();
    return { theme, toggleTheme, setTheme };
};
