import { useEffect, useState } from 'react';
import {
    DEFAULT_EMPRESA_DASHBOARD_PREFERENCES,
    EMPRESA_DASHBOARD_STORAGE_KEY,
    type EmpresaDashboardPreferences,
} from '../utils/empresaDashboard';

const readPreferences = (): EmpresaDashboardPreferences => {
    try {
        const raw = localStorage.getItem(EMPRESA_DASHBOARD_STORAGE_KEY);
        if (!raw) return DEFAULT_EMPRESA_DASHBOARD_PREFERENCES;
        const parsed = JSON.parse(raw);
        return { ...DEFAULT_EMPRESA_DASHBOARD_PREFERENCES, ...parsed };
    } catch {
        return DEFAULT_EMPRESA_DASHBOARD_PREFERENCES;
    }
};

export const useEmpresaDashboardPreferences = () => {
    const [preferences, setPreferences] = useState<EmpresaDashboardPreferences>(readPreferences);

    useEffect(() => {
        localStorage.setItem(EMPRESA_DASHBOARD_STORAGE_KEY, JSON.stringify(preferences));
    }, [preferences]);

    const setDensity = (density: EmpresaDashboardPreferences['density']) => {
        setPreferences((current) => ({ ...current, density }));
    };

    const resetPreferences = () => {
        setPreferences(DEFAULT_EMPRESA_DASHBOARD_PREFERENCES);
    };

    return { preferences, setDensity, resetPreferences };
};
