import React, { useState, useRef, useMemo } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ChevronRight, Wallet, DollarSign, Star, Clock, Calendar, CalendarRange, Briefcase } from 'lucide-react';
import type { FormContext } from '../types/types';
import { useTheme } from '../../../contexts/ThemeContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getDashboardText } from '../../../shared/i18n/dashboardLocale';

interface Step1Props {
    data: Partial<FormContext>;
    onNext: () => void;
    onChange: (newData: Partial<FormContext>) => void;
}

const edadRangeToApprox = (range: string) => {
    if (!range) return null;
    if (range === '55+' || range === '60+') return 60;
    const parts = range.split('-').map(Number);
    if (parts.length !== 2 || Number.isNaN(parts[0]) || Number.isNaN(parts[1])) return null;
    return Math.round((parts[0] + parts[1]) / 2);
};

const diasRangeToDays = (range: string) => {
    if (!range) return null;
    if (range === '10+') return 14;
    const parts = range.split('-').map(Number);
    if (parts.length !== 2 || Number.isNaN(parts[0]) || Number.isNaN(parts[1])) return null;
    return Math.round((parts[0] + parts[1]) / 2);
};

export const Step1PerfilBasico: React.FC<Step1Props> = ({ data = {}, onNext, onChange }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { lang } = useLanguage();
    const copy = useMemo(() => getDashboardText(lang).modules.form, [lang]);

    useGSAP(
        () => {
            if (containerRef.current) {
                gsap.from(containerRef.current.children, {
                    y: 20,
                    opacity: 0,
                    duration: 0.5,
                    stagger: 0.1,
                    ease: 'power2.out',
                });
            }
        },
        { scope: containerRef },
    );

    const [edad_range, setEdadRange] = useState(data.edad_range || '');
    const [presupuesto_bucket, setPresupuestoBucket] = useState(data.presupuesto_bucket || '');
    const [duracion_dias_range, setDuracionDiasRange] = useState(data.duracion_dias_range || '');

    const edadOptions = useMemo(() => [
        { label: copy.step1.ageRange.ages_18_24, value: '18-24' },
        { label: copy.step1.ageRange.ages_25_34, value: '25-34' },
        { label: copy.step1.ageRange.ages_35_44, value: '35-44' },
        { label: copy.step1.ageRange.ages_45_54, value: '45-54' },
        { label: copy.step1.ageRange.ages_55_plus, value: '55+' },
    ], [copy]);

    const presupuestoOptions = useMemo(() => [
        {
            label: copy.step1.budgetOptions.economic,
            value: 'bajo',
            range: copy.step1.budgetOptions.economicRange,
            icon: Wallet,
            daily: 500,
        },
        {
            label: copy.step1.budgetOptions.moderate,
            value: 'medio',
            range: copy.step1.budgetOptions.moderateRange,
            icon: DollarSign,
            daily: 1200,
        },
        {
            label: copy.step1.budgetOptions.premium,
            value: 'alto',
            range: copy.step1.budgetOptions.premiumRange,
            icon: Star,
            daily: 3000,
        },
    ], [copy]);

    const duracionOptions = useMemo(() => [
        { label: copy.step1.durationOptions.days_1_2, value: '1-2', icon: Clock },
        { label: copy.step1.durationOptions.days_3_5, value: '3-5', icon: Calendar },
        { label: copy.step1.durationOptions.days_6_10, value: '6-10', icon: CalendarRange },
        { label: copy.step1.durationOptions.days_10_plus, value: '10+', icon: Briefcase },
    ], [copy]);

    const handleNext = () => {
        if (!edad_range || !presupuesto_bucket || !duracion_dias_range) return;

        const edad = edadRangeToApprox(edad_range);
        const duracion_dias = diasRangeToDays(duracion_dias_range);
        const selectedPresupuesto = presupuestoOptions.find((p) => p.value === presupuesto_bucket);
        const presupuesto_daily = selectedPresupuesto?.daily || 1200;

        onChange({
            edad: edad || undefined,
            edad_range,
            presupuesto_daily,
            presupuesto_bucket,
            duracion_dias: duracion_dias || undefined,
            duracion_dias_range,
        });

        onNext();
    };

    const unselectedBtn = isDark
        ? 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700'
        : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300';

    return (
        <div className="step-content px-4 py-6" ref={containerRef}>
            <div className="step-header mb-8 text-center">
                <h2 className={`mb-2 text-3xl font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>{copy.step1.title}</h2>
                <p className={isDark ? 'text-zinc-400' : 'text-zinc-500'}>{copy.step1.subtitle}</p>
            </div>

            <div className="form-section mb-8">
                <label className={`mb-4 block text-sm font-medium ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>{copy.step1.ageRange.label}</label>
                <div className="grid grid-cols-5 gap-2">
                    {edadOptions.map((o) => (
                        <button
                            key={o.value}
                            type="button"
                            onClick={() => setEdadRange(o.value)}
                            className={`rounded-xl border py-3 transition-all duration-200 ${
                                edad_range === o.value ? 'border-violet-500 bg-violet-600 text-white shadow-lg shadow-violet-500/20' : unselectedBtn
                            }`}
                        >
                            <span className="text-sm font-semibold">{o.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="form-section mb-8">
                <label className={`mb-4 block text-sm font-medium ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>{copy.step1.budgetLabel}</label>
                <div className="grid grid-cols-3 gap-4">
                    {presupuestoOptions.map((o) => (
                        <button
                            key={o.value}
                            type="button"
                            onClick={() => setPresupuestoBucket(o.value)}
                            className={`flex flex-col items-center rounded-2xl border p-4 text-center transition-all duration-200 ${
                                presupuesto_bucket === o.value
                                    ? 'border-violet-500 bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                                    : unselectedBtn
                            }`}
                        >
                            <div className="mb-3">
                                <o.icon className="size-6" />
                            </div>
                            <div className="mb-1 font-semibold">{o.label}</div>
                            <div className="text-xs opacity-70">{o.range}</div>
                        </button>
                    ))}
                </div>
            </div>

            <div className="form-section mb-10">
                <label className={`mb-4 block text-sm font-medium ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>{copy.step1.durationLabel}</label>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {duracionOptions.map((o) => (
                        <button
                            key={o.value}
                            type="button"
                            onClick={() => setDuracionDiasRange(o.value)}
                            className={`flex flex-col items-center rounded-2xl border p-4 text-center transition-all duration-200 ${
                                duracion_dias_range === o.value
                                    ? 'border-violet-500 bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                                    : unselectedBtn
                            }`}
                        >
                            <div className="mb-3">
                                <o.icon className="size-6" />
                            </div>
                            <div className="font-semibold">{o.label}</div>
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={handleNext}
                    disabled={!(edad_range && presupuesto_bucket && duracion_dias_range)}
                    className="flex items-center gap-2 rounded-xl bg-violet-600 px-8 py-3 font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:bg-violet-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <span>{copy.step1.cta}</span>
                    <ChevronRight className="size-5" />
                </button>
            </div>
        </div>
    );
};
