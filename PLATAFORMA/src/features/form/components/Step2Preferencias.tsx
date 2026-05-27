import React, { useState, useRef, useMemo } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ChevronRight, ChevronLeft, Mountain, Footprints, Utensils, Landmark, Home, Cloud, Sun, Trees, Zap, Building } from 'lucide-react';
import type { FormContext } from '../types/types';
import { useTheme } from '../../../contexts/ThemeContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getDashboardText } from '../../../shared/i18n/dashboardLocale';

interface Step2Props {
    data: Partial<FormContext>;
    onNext: () => void;
    onBack: () => void;
    onChange: (newData: Partial<FormContext>) => void;
}

export const Step2Preferencias: React.FC<Step2Props> = ({ data = {}, onNext, onBack, onChange }) => {
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

    const [tiposTurismo, setTipos] = useState<string[]>(data.tiposTurismo || []);
    const [actividad_level, setActividad] = useState<number>(data.actividad_level ?? 0);
    const [preferencia_lugar, setPreferenciaLugar] = useState<string>(data.preferencia_lugar || '');

    const tiposTurismoList = useMemo(() => [
        { label: copy.step2.tourismTypes.nature, value: 'naturaleza', icon: Mountain },
        { label: copy.step2.tourismTypes.adventure, value: 'aventura', icon: Footprints },
        { label: copy.step2.tourismTypes.gastronomy, value: 'gastronomico', icon: Utensils },
        { label: copy.step2.tourismTypes.cultural, value: 'cultural', icon: Landmark },
        { label: copy.step2.tourismTypes.rural, value: 'rural', icon: Home },
    ], [copy]);

    const actividadLevels = useMemo(() => [
        { label: copy.step2.activityLevels.veryRelaxed, value: 1, icon: Cloud },
        { label: copy.step2.activityLevels.relaxed, value: 2, icon: Sun },
        { label: copy.step2.activityLevels.moderate, value: 3, icon: Trees },
        { label: copy.step2.activityLevels.active, value: 4, icon: Zap },
        { label: copy.step2.activityLevels.veryActive, value: 5, icon: Zap },
    ], [copy]);

    const lugarOptions = useMemo(() => [
        { label: copy.step2.placePreferences.outdoor, value: 'aire', icon: Sun },
        { label: copy.step2.placePreferences.indoor, value: 'cerrado', icon: Building },
        { label: copy.step2.placePreferences.indifferent, value: 'indiferente', icon: Trees },
    ], [copy]);

    const toggleTipo = (v: string) => {
        setTipos((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
    };

    const handleNext = () => {
        if (!tiposTurismo.length) return;

        onChange({
            tiposTurismo,
            actividad_level,
            preferencia_lugar,
            pref_outdoor: preferencia_lugar === 'aire',
        });
        onNext();
    };

    return (
        <div className="step-content px-4 py-6" ref={containerRef}>
            <div className="step-header mb-8 text-center">
                <h2 className={`mb-2 text-3xl font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>{copy.step2.title}</h2>
                <p className={isDark ? 'text-zinc-400' : 'text-zinc-500'}>{copy.step2.subtitle}</p>
            </div>

            <div className="form-section mb-8">
                <label className={`mb-4 flex items-center gap-1 text-sm font-medium ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>
                    {copy.step2.tourismTypesLabel}
                    <span className="text-pink-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                    {tiposTurismoList.map((t) => (
                        <button
                            key={t.value}
                            type="button"
                            onClick={() => toggleTipo(t.value)}
                            className={`flex flex-col items-center rounded-2xl border p-4 text-center transition-all duration-200 ${
                                tiposTurismo.includes(t.value)
                                    ? 'border-violet-500 bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                                    : isDark
                                        ? 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700'
                                        : 'border-zinc-300 bg-white text-zinc-600 hover:border-zinc-400'
                            }`}
                        >
                            <div className="mb-3">
                                <t.icon className="size-6" />
                            </div>
                            <div className="text-sm font-semibold tracking-tight">{t.label}</div>
                        </button>
                    ))}
                </div>
            </div>

            <div className="form-section mb-8">
                <label className={`mb-4 flex items-center gap-1.5 text-sm font-medium ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>
                    {copy.step2.activityLevelLabel}
                    <span className="text-xs font-normal text-zinc-400">{copy.step2.optional}</span>
                </label>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                    {actividadLevels.map((level) => (
                        <button
                            key={level.value}
                            type="button"
                            onClick={() => setActividad(level.value)}
                            className={`flex flex-col items-center rounded-2xl border p-4 text-center transition-all duration-200 ${
                                actividad_level === level.value
                                    ? 'border-violet-500 bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                                    : isDark
                                        ? 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700'
                                        : 'border-zinc-300 bg-white text-zinc-600 hover:border-zinc-400'
                            }`}
                        >
                            <div className="mb-3">
                                <level.icon className="size-6" />
                            </div>
                            <div className="text-sm font-bold tracking-tight">{level.label}</div>
                        </button>
                    ))}
                </div>
            </div>

            <div className="form-section mb-10">
                <label className={`mb-4 flex items-center gap-1.5 text-sm font-medium ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>
                    {copy.step2.placePreferenceLabel}
                    <span className="text-xs font-normal text-zinc-400">{copy.step2.optional}</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                    {lugarOptions.map((lugar) => (
                        <button
                            key={lugar.value}
                            type="button"
                            onClick={() => setPreferenciaLugar(lugar.value)}
                            className={`flex flex-col items-center rounded-2xl border p-4 text-center transition-all duration-200 ${
                                preferencia_lugar === lugar.value
                                    ? 'border-violet-500 bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                                    : isDark
                                        ? 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700'
                                        : 'border-zinc-300 bg-white text-zinc-600 hover:border-zinc-400'
                            }`}
                        >
                            <div className="mb-3">
                                <lugar.icon className="size-6" />
                            </div>
                            <div className="text-sm font-bold tracking-tight">{lugar.label}</div>
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex justify-between">
                <button
                    onClick={onBack}
                    className={`flex items-center gap-2 rounded-xl border px-6 py-3 font-semibold transition-all active:scale-95 ${
                        isDark
                            ? 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700'
                            : 'border-zinc-300 bg-white text-zinc-600 hover:border-zinc-400'
                    }`}
                >
                    <ChevronLeft className="size-5" />
                    <span>{copy.step2.back}</span>
                </button>
                <button
                    onClick={handleNext}
                    disabled={!tiposTurismo.length}
                    className="flex items-center gap-2 rounded-xl bg-violet-600 px-8 py-3 font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:bg-violet-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <span>{copy.step2.next}</span>
                    <ChevronRight className="size-5" />
                </button>
            </div>
        </div>
    );
};
