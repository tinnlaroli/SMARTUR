import { useEffect, useMemo, useState } from 'react';
import {
    Bell,
    Globe,
    Mail,
    Moon,
    Palette,
    Save,
    Settings,
    Shield,
    Sun,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { languages, useLanguage, useUserPreferences, type LanguageCode } from '../../../contexts/LanguageContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { useToast } from '../../../shared/context/ToastContext';
import { getDashboardText } from '../../../shared/i18n/dashboardLocale';

const STORAGE_KEY = 'smartur-dashboard-settings';

type SettingsPreferences = {
    evaluationAlerts: boolean;
    registrationAlerts: boolean;
    weeklySummary: boolean;
};

const DEFAULT_PREFERENCES: SettingsPreferences = {
    evaluationAlerts: true,
    registrationAlerts: true,
    weeklySummary: false,
};

type PreferenceToggleProps = {
    checked: boolean;
    description: string;
    label: string;
    onChange: () => void;
};

const PreferenceToggle = ({ checked, description, label, onChange }: PreferenceToggleProps) => (
    <button
        type="button"
        onClick={onChange}
        aria-pressed={checked}
        className="flex w-full items-start justify-between gap-4 rounded-2xl border p-4 text-left transition-colors hover:border-violet-400/50"
        style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
    >
        <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                {label}
            </p>
            <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--color-text-alt)' }}>
                {description}
            </p>
        </div>
        <span
            className={`mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full p-1 transition-colors ${
                checked ? 'justify-end bg-violet-600' : 'justify-start bg-zinc-300 dark:bg-zinc-700'
            }`}
        >
            <span className="size-4 rounded-full bg-white shadow-sm" />
        </span>
    </button>
);

export const SettingsPage = () => {
    const toast = useToast();
    const { theme, toggleTheme } = useTheme();
    const { lang, changeLanguage } = useLanguage();
    const { user } = useUserPreferences();
    const copy = getDashboardText(lang);
    const [preferences, setPreferences] = useState<SettingsPreferences>(DEFAULT_PREFERENCES);
    const [savedPreferences, setSavedPreferences] = useState<SettingsPreferences>(DEFAULT_PREFERENCES);

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return;

        try {
            const parsed = JSON.parse(stored) as Partial<SettingsPreferences>;
            const merged = { ...DEFAULT_PREFERENCES, ...parsed };
            setPreferences(merged);
            setSavedPreferences(merged);
        } catch {
            localStorage.removeItem(STORAGE_KEY);
        }
    }, []);

    const hasUnsavedChanges = useMemo(
        () => JSON.stringify(preferences) !== JSON.stringify(savedPreferences),
        [preferences, savedPreferences],
    );

    const handleThemeSelect = (nextTheme: 'light' | 'dark') => {
        if (theme !== nextTheme) {
            toggleTheme();
        }
    };

    const updatePreference = (key: keyof SettingsPreferences) => {
        setPreferences((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    const handleSavePreferences = () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
        setSavedPreferences(preferences);
        toast.success(copy.settings.preferencesSavedTitle, copy.settings.preferencesSavedDescription);
    };

    return (
        <div className="relative flex h-[calc(100vh-9rem)] flex-col gap-6 overflow-hidden">
            <div className="flex items-center gap-3 shrink-0">
                <div
                    className="flex size-10 items-center justify-center rounded-xl"
                    style={{ background: 'var(--color-purple)' }}
                >
                    <Settings className="size-5 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>
                        {copy.settings.title}
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>
                        {copy.settings.subtitle}
                    </p>
                </div>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 xl:grid-cols-[1.65fr_1fr]">
                <div className="space-y-6 overflow-y-auto min-h-0">
                    <motion.section
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl border p-6 shadow-sm"
                        style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
                    >
                        <div className="mb-4 flex items-start gap-3">
                            <div
                                className="flex size-10 items-center justify-center rounded-xl"
                                style={{ background: 'rgba(var(--rgb-cyan-accent), 0.18)' }}
                            >
                                <Globe className="size-4" style={{ color: 'var(--color-cyan)' }} />
                            </div>
                            <div>
                                <p className="font-semibold" style={{ color: 'var(--color-text)' }}>
                                    {copy.settings.languageTitle}
                                </p>
                                <p className="text-xs" style={{ color: 'var(--color-text-alt)' }}>
                                    {copy.settings.languageDescription}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            {Object.entries(languages).map(([code, label]) => {
                                const isActive = lang === code;
                                return (
                                    <button
                                        key={code}
                                        type="button"
                                        onClick={() => changeLanguage(code as LanguageCode)}
                                        className={`rounded-2xl border px-4 py-3 text-left transition-colors ${
                                            isActive ? 'shadow-sm' : ''
                                        }`}
                                        style={{
                                            background: isActive ? 'rgba(var(--rgb-purple-accent), 0.12)' : 'var(--color-bg-alt)',
                                            borderColor: isActive ? 'var(--color-purple)' : 'var(--color-border)',
                                        }}
                                    >
                                        <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                                            {label}
                                        </p>
                                        <p className="mt-1 text-xs uppercase tracking-widest" style={{ color: 'var(--color-text-alt)' }}>
                                            {copy.settings.languageCodeLabel}: {code}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    </motion.section>

                    <motion.section
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="rounded-2xl border p-6 shadow-sm"
                        style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
                    >
                        <div className="mb-4 flex items-start gap-3">
                            <div
                                className="flex size-10 items-center justify-center rounded-xl"
                                style={{ background: 'rgba(var(--rgb-purple-accent), 0.16)' }}
                            >
                                <Palette className="size-4" style={{ color: 'var(--color-purple)' }} />
                            </div>
                            <div>
                                <p className="font-semibold" style={{ color: 'var(--color-text)' }}>
                                    {copy.settings.appearanceTitle}
                                </p>
                                <p className="text-xs" style={{ color: 'var(--color-text-alt)' }}>
                                    {copy.settings.appearanceDescription}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <button
                                type="button"
                                onClick={() => handleThemeSelect('light')}
                                className="rounded-2xl border p-4 text-left transition-colors"
                                style={{
                                    background: theme === 'light' ? 'rgba(var(--rgb-cyan-accent), 0.10)' : 'var(--color-bg-alt)',
                                    borderColor: theme === 'light' ? 'var(--color-cyan)' : 'var(--color-border)',
                                }}
                            >
                                <div className="flex items-center gap-2">
                                    <Sun className="size-4 text-amber-500" />
                                    <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                                        {copy.settings.lightLabel}
                                    </p>
                                </div>
                                <p className="mt-2 text-xs" style={{ color: 'var(--color-text-alt)' }}>
                                    {copy.settings.lightDescription}
                                </p>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleThemeSelect('dark')}
                                className="rounded-2xl border p-4 text-left transition-colors"
                                style={{
                                    background: theme === 'dark' ? 'rgba(var(--rgb-purple-accent), 0.12)' : 'var(--color-bg-alt)',
                                    borderColor: theme === 'dark' ? 'var(--color-purple)' : 'var(--color-border)',
                                }}
                            >
                                <div className="flex items-center gap-2">
                                    <Moon className="size-4 text-violet-400" />
                                    <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                                        {copy.settings.darkLabel}
                                    </p>
                                </div>
                                <p className="mt-2 text-xs" style={{ color: 'var(--color-text-alt)' }}>
                                    {copy.settings.darkDescription}
                                </p>
                            </button>
                        </div>
                    </motion.section>

                    <motion.section
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="rounded-2xl border p-6 shadow-sm"
                        style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
                    >
                        <div className="mb-4 flex items-start gap-3">
                            <div
                                className="flex size-10 items-center justify-center rounded-xl"
                                style={{ background: 'rgba(var(--rgb-orange-cta), 0.16)' }}
                            >
                                <Bell className="size-4" style={{ color: 'var(--color-orange)' }} />
                            </div>
                            <div>
                                <p className="font-semibold" style={{ color: 'var(--color-text)' }}>
                                    {copy.settings.alertsTitle}
                                </p>
                                <p className="text-xs" style={{ color: 'var(--color-text-alt)' }}>
                                    {copy.settings.alertsDescription}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <PreferenceToggle
                                checked={preferences.evaluationAlerts}
                                label={copy.settings.evaluationAlertsLabel}
                                description={copy.settings.evaluationAlertsDescription}
                                onChange={() => updatePreference('evaluationAlerts')}
                            />
                            <PreferenceToggle
                                checked={preferences.registrationAlerts}
                                label={copy.settings.registrationAlertsLabel}
                                description={copy.settings.registrationAlertsDescription}
                                onChange={() => updatePreference('registrationAlerts')}
                            />
                            <PreferenceToggle
                                checked={preferences.weeklySummary}
                                label={copy.settings.weeklySummaryLabel}
                                description={copy.settings.weeklySummaryDescription}
                                onChange={() => updatePreference('weeklySummary')}
                            />
                        </div>

                        <div className="mt-5 flex justify-end">
                            <button
                                type="button"
                                onClick={handleSavePreferences}
                                disabled={!hasUnsavedChanges}
                                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
                                style={{ background: 'var(--color-purple)' }}
                            >
                                <Save className="size-4" />
                                {copy.settings.savePreferences}
                            </button>
                        </div>
                    </motion.section>
                </div>

                <div className="space-y-6">
                    <motion.section
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.08 }}
                        className="rounded-2xl border p-6 shadow-sm"
                        style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
                    >
                        <div className="mb-4 flex items-start gap-3">
                            <div
                                className="flex size-10 items-center justify-center rounded-xl"
                                style={{ background: 'rgba(var(--rgb-green-accent), 0.14)' }}
                            >
                                <Shield className="size-4" style={{ color: 'var(--color-green)' }} />
                            </div>
                            <div>
                                <p className="font-semibold" style={{ color: 'var(--color-text)' }}>
                                    {copy.settings.accountTitle}
                                </p>
                                <p className="text-xs" style={{ color: 'var(--color-text-alt)' }}>
                                    {copy.settings.accountDescription}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-alt)' }}>
                                    {copy.settings.userLabel}
                                </p>
                                <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                                    {user?.name || copy.settings.noActiveUser}
                                </p>
                            </div>
                            <div className="flex items-start gap-2">
                                <Mail className="mt-0.5 size-4 shrink-0" style={{ color: 'var(--color-text-alt)' }} />
                                <p className="text-sm" style={{ color: 'var(--color-text)' }}>
                                    {user?.email || copy.settings.unavailable}
                                </p>
                            </div>
                            <div className="rounded-2xl border px-4 py-3" style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}>
                                <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-alt)' }}>
                                    {copy.settings.roleLabel}
                                </p>
                                <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                                    {user?.role_id === 1 ? copy.settings.adminRole : copy.settings.userRole}
                                </p>
                            </div>
                        </div>
                    </motion.section>

                    <motion.section
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.12 }}
                        className="rounded-2xl border p-6 shadow-sm"
                        style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
                    >
                        <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                            {copy.settings.summaryTitle}
                        </p>
                        <div className="mt-4 space-y-3">
                            <div className="rounded-2xl border px-4 py-3" style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}>
                                <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-alt)' }}>
                                    {copy.settings.activeLanguageLabel}
                                </p>
                                <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                                    {languages[lang]}
                                </p>
                            </div>
                            <div className="rounded-2xl border px-4 py-3" style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}>
                                <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-alt)' }}>
                                    {copy.settings.activeThemeLabel}
                                </p>
                                <p className="mt-1 text-sm font-semibold capitalize" style={{ color: 'var(--color-text)' }}>
                                    {theme === 'dark' ? copy.settings.darkLabel : copy.settings.lightLabel}
                                </p>
                            </div>
                            <div className="rounded-2xl border px-4 py-3" style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}>
                                <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-alt)' }}>
                                    {copy.settings.savedAlertsLabel}
                                </p>
                                <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                                    {copy.settings.activeAlertsCount(Object.values(savedPreferences).filter(Boolean).length)}
                                </p>
                            </div>
                        </div>
                    </motion.section>
                </div>
            </div>
        </div>
    );
};
