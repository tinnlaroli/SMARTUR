import React, { useMemo } from 'react';
import { Globe2, Moon, Sun } from 'lucide-react';
import { useLanguage, useUserPreferences } from '../../../contexts/LanguageContext';
import { DASHBOARD_COLORS } from '../utils/dashboard';
import type { LanguageCode } from '../../../contexts/LanguageContext';
import { getDashboardText } from '../../../shared/i18n/dashboardLocale';

const cardSurface = {
    background: 'var(--color-bg)',
    borderColor: 'var(--color-border)',
} as const;

/**
 * Quick-access widget for language and theme switching.
 * Intended as a colSpan=1, rowSpan=1 (200px) compact utility card.
 */
const LangSwitchWidget: React.FC = () => {
    const { lang, changeLanguage, t } = useLanguage();
    const { theme, toggleTheme } = useUserPreferences();
    const copy = getDashboardText(lang).widgets;
    const LANGUAGES = useMemo<{ code: LanguageCode; label: string }[]>(() => [
        { code: 'es', label: t('lang.es') },
        { code: 'en', label: t('lang.en') },
        { code: 'fr', label: t('lang.fr') },
    ], [t]);

    return (
        <section
            className="rounded-[28px] border p-4 h-full flex flex-col shadow-[0_10px_35px_rgba(15,23,42,0.06)] overflow-hidden sy-fade-up"
            style={cardSurface}
        >
            {/* Header */}
            <div className="mb-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <div
                        className="flex size-7 items-center justify-center rounded-xl"
                        style={{ background: `${DASHBOARD_COLORS.purple}16` }}
                    >
                        <Globe2 className="size-3.5" style={{ color: DASHBOARD_COLORS.purple }} />
                    </div>
                    <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-alt)' }}>
                        {copy.langSwitchTitle}
                    </p>
                </div>

                {/* Theme toggle */}
                <button
                    type="button"
                    onClick={toggleTheme}
                    title={theme === 'dark' ? copy.langSwitchToLight : copy.langSwitchToDark}
                    className="flex size-8 items-center justify-center rounded-xl border transition hover:opacity-80"
                    style={{
                        borderColor: 'var(--color-border)',
                        background: 'var(--color-bg-alt)',
                        color: theme === 'dark' ? DASHBOARD_COLORS.warning : DASHBOARD_COLORS.purple,
                    }}
                >
                    {theme === 'dark' ? (
                        <Sun className="size-3.5" />
                    ) : (
                        <Moon className="size-3.5" />
                    )}
                </button>
            </div>

            {/* Language pills */}
            <div className="flex flex-col flex-1 min-h-0 justify-center gap-2">
                {LANGUAGES.map(({ code, label }) => {
                    const isActive = lang === code;
                    return (
                        <button
                            key={code}
                            type="button"
                            onClick={() => changeLanguage(code)}
                            className="flex items-center gap-2.5 rounded-2xl border px-3 py-2 text-left text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
                            style={{
                                borderColor: isActive ? DASHBOARD_COLORS.purple : 'var(--color-border)',
                                background: isActive
                                    ? `${DASHBOARD_COLORS.purple}12`
                                    : 'var(--color-bg-alt)',
                                color: isActive ? DASHBOARD_COLORS.purple : 'var(--color-text)',
                            }}
                        >
                            <span className="flex size-6 items-center justify-center rounded-lg text-[10px] font-bold uppercase leading-none shrink-0" style={{ background: 'var(--color-bg)', color: 'var(--color-text-alt)' }}>{code}</span>
                            <span className="flex-1 text-[11px] font-semibold">{label}</span>
                            {isActive && (
                                <span
                                    className="size-1.5 rounded-full shrink-0"
                                    style={{ background: DASHBOARD_COLORS.purple }}
                                />
                            )}
                        </button>
                    );
                })}
            </div>
        </section>
    );
};

export default LangSwitchWidget;
