import { useEffect, useState } from 'react';
import {
    DASHBOARD_STORAGE_KEY,
    DEFAULT_DASHBOARD_PREFERENCES,
    type DashboardPreferences,
    type WidgetPreferenceKey,
} from '../utils/dashboard';

const readPreferences = (): DashboardPreferences => {
    try {
        const raw = localStorage.getItem(DASHBOARD_STORAGE_KEY);
        if (!raw) return DEFAULT_DASHBOARD_PREFERENCES;

        const parsed = JSON.parse(raw);
        return {
            ...DEFAULT_DASHBOARD_PREFERENCES,
            ...parsed,
        };
    } catch {
        return DEFAULT_DASHBOARD_PREFERENCES;
    }
};

export const useDashboardPreferences = () => {
    const [preferences, setPreferences] = useState<DashboardPreferences>(readPreferences);

    useEffect(() => {
        localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(preferences));
    }, [preferences]);

    const setChartMode = (chartMode: DashboardPreferences['chartMode']) => {
        setPreferences((current) => ({ ...current, chartMode }));
    };

    const setDensity = (density: DashboardPreferences['density']) => {
        setPreferences((current) => ({ ...current, density }));
    };

    const toggleWidget = (widget: WidgetPreferenceKey) => {
        setPreferences((current) => ({ ...current, [widget]: !current[widget] }));
    };

    const resetPreferences = () => {
        setPreferences(DEFAULT_DASHBOARD_PREFERENCES);
    };

    return {
        preferences,
        setChartMode,
        setDensity,
        toggleWidget,
        resetPreferences,
    };
};
