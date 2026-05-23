import React from 'react';
import { ArrowDown, Building2, ClipboardCheck, Layers3 } from 'lucide-react';
import { DASHBOARD_COLORS, type DensityMode } from '../utils/dashboard';
import type { DashboardStats } from '../api/dashboardApi';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getDashboardText } from '../../../shared/i18n/dashboardLocale';

interface Props {
    stats: DashboardStats;
    density: DensityMode;
}

const cardSurface = {
    background: 'var(--color-bg)',
    borderColor: 'var(--color-border)',
} as const;

const cardPadding = (density: DensityMode) => (density === 'compact' ? 'p-4' : 'p-5');

/**
 * B2B conversion funnel: Companies → Services → Evaluations.
 * Each step shows a horizontal progress bar relative to the top of the funnel.
 */
const B2BFunnelWidget: React.FC<Props> = ({ stats, density }) => {
    const { lang } = useLanguage();
    const copy = getDashboardText(lang).widgets;
    const locale = getDashboardText(lang).locale;

    const topValue = Math.max(stats.total_companies, 1);

    const steps = [
        {
            label:      copy.b2bCompanies,
            sublabel:   copy.b2bCompaniesLabel,
            value:      stats.total_companies,
            icon:       Building2,
            color:      DASHBOARD_COLORS.purple,
            percentage: 100,
        },
        {
            label:      copy.b2bServices,
            sublabel:   copy.b2bServicesLabel,
            value:      stats.total_services,
            icon:       Layers3,
            color:      DASHBOARD_COLORS.cyan,
            percentage: Math.min(100, Math.round((stats.total_services / topValue) * 100)),
        },
        {
            label:      copy.b2bEvals,
            sublabel:   copy.b2bEvalsLabel,
            value:      stats.total_evaluations,
            icon:       ClipboardCheck,
            color:      DASHBOARD_COLORS.green,
            percentage: Math.min(100, Math.round((stats.total_evaluations / topValue) * 100)),
        },
    ];

    return (
        <section
            className={`rounded-[28px] border ${cardPadding(density)} h-full flex flex-col shadow-[0_10px_35px_rgba(15,23,42,0.06)] overflow-hidden sy-fade-up`}
            style={cardSurface}
        >
            {/* Header */}
            <div className="mb-3 flex items-center gap-2 shrink-0">
                <div
                    className="flex size-9 shrink-0 items-center justify-center rounded-2xl"
                    style={{ background: `${DASHBOARD_COLORS.purple}16` }}
                >
                    <Building2 className="size-4" style={{ color: DASHBOARD_COLORS.purple }} />
                </div>
                <div className="min-w-0">
                    <h2 className="truncate text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                        {copy.b2bTitle}
                    </h2>
                    <p className="text-xs" style={{ color: 'var(--color-text-alt)' }}>
                        {copy.b2bSubtitle}
                    </p>
                </div>
            </div>

            {/* Funnel steps */}
            <div className="flex flex-col flex-1 min-h-0 justify-center gap-1.5">
                {steps.map((step, i) => {
                    const Icon = step.icon;
                    return (
                        <React.Fragment key={step.label}>
                            <div className="flex items-center gap-3 min-w-0">
                                {/* Icon */}
                                <div
                                    className="flex size-7 shrink-0 items-center justify-center rounded-xl"
                                    style={{ background: `${step.color}18` }}
                                >
                                    <Icon className="size-3.5" style={{ color: step.color }} />
                                </div>

                                {/* Bar + labels */}
                                <div className="flex-1 min-w-0">
                                    <div className="mb-1 flex items-baseline justify-between gap-2">
                                        <span
                                            className="text-[11px] font-semibold truncate"
                                            style={{ color: 'var(--color-text)' }}
                                        >
                                            {step.label}
                                        </span>
                                        <span
                                            className="shrink-0 text-[11px] font-black tabular-nums"
                                            style={{ color: step.color }}
                                        >
                                            {step.value.toLocaleString(locale)}
                                        </span>
                                    </div>
                                    {/* Progress track */}
                                    <div
                                        className="h-1.5 w-full overflow-hidden rounded-full"
                                        style={{ background: 'rgba(var(--rgb-text), 0.08)' }}
                                    >
                                        <div
                                            className="h-full rounded-full sy-bar-fill"
                                            style={{
                                                width: `${step.percentage}%`,
                                                background: step.color,
                                                animationDelay: `${i * 0.15}s`,
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Arrow connector between steps */}
                            {i < steps.length - 1 && (
                                <div className="flex items-center gap-3">
                                    <div className="flex size-7 items-center justify-center">
                                        <ArrowDown
                                            className="size-3"
                                            style={{ color: 'var(--color-text-alt)', opacity: 0.4 }}
                                        />
                                    </div>
                                    <div className="flex-1" />
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </section>
    );
};

export default B2BFunnelWidget;
