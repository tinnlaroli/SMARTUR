import React from 'react';
import { Building2, Layers3, MapPin, Star } from 'lucide-react';
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
 * Shows total geographical + service coverage from dashboard stats.
 * Intended as a colSpan=2, rowSpan=1 (200px) horizontal widget.
 */
const CoverageWidget: React.FC<Props> = ({ stats, density }) => {
    const { lang } = useLanguage();
    const copy = getDashboardText(lang).widgets;
    const locale = getDashboardText(lang).locale;

    const metrics = [
        {
            label: copy.coverageLocations,
            value: stats.total_locations,
            icon: MapPin,
            color: DASHBOARD_COLORS.cyan,
        },
        {
            label: copy.coverageCompanies,
            value: stats.total_companies,
            icon: Building2,
            color: DASHBOARD_COLORS.purple,
        },
        {
            label: copy.coverageServices,
            value: stats.total_services,
            icon: Layers3,
            color: DASHBOARD_COLORS.green,
        },
        {
            label: copy.coveragePoi,
            value: stats.total_poi,
            icon: Star,
            color: DASHBOARD_COLORS.orange,
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
                    style={{ background: `${DASHBOARD_COLORS.cyan}16` }}
                >
                    <MapPin className="size-4" style={{ color: DASHBOARD_COLORS.cyan }} />
                </div>
                <div className="min-w-0">
                    <h2 className="truncate text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                        {copy.coverageTitle}
                    </h2>
                    <p className="text-xs" style={{ color: 'var(--color-text-alt)' }}>
                        {copy.coverageSubtitle}
                    </p>
                </div>
            </div>

            {/* Metrics grid */}
            <div className="grid flex-1 min-h-0 grid-cols-4 gap-2">
                {metrics.map(({ label, value, icon: Icon, color }) => (
                    <div
                        key={label}
                        className="flex flex-col items-start justify-between rounded-2xl border p-3 min-w-0"
                        style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-alt)' }}
                    >
                        <div
                            className="flex size-7 items-center justify-center rounded-xl"
                            style={{ background: `${color}18` }}
                        >
                            <Icon className="size-3.5" style={{ color }} />
                        </div>
                        <div className="mt-auto pt-2">
                            <p
                                className="text-xl font-black leading-none tabular-nums"
                                style={{ color: 'var(--color-text)' }}
                            >
                                {value.toLocaleString(locale)}
                            </p>
                            <p
                                className="mt-1 text-[10px] font-semibold leading-tight"
                                style={{ color: 'var(--color-text-alt)' }}
                            >
                                {label}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default CoverageWidget;
