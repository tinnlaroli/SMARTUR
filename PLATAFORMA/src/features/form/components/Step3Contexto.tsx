import React, { useState, useRef, useMemo } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ChevronRight, ChevronLeft, User, Heart, Users, Users2, Bed, Car, Utensils, Route } from 'lucide-react';
import type { FormContext } from '../types/types';
import { useTheme } from '../../../contexts/ThemeContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getDashboardText } from '../../../shared/i18n/dashboardLocale';

interface Step3Props {
    data: Partial<FormContext>;
    onNext: () => void;
    onBack: () => void;
    onChange: (newData: Partial<FormContext>) => void;
}

export const Step3Contexto: React.FC<Step3Props> = ({ data = {}, onNext, onBack, onChange }) => {
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

    const [group_type, setGroupType] = useState<string>(data.group_type || '');
    const [services, setServices] = useState<string[]>(data.services || []);

    const companyOptions = useMemo(() => [
        { label: copy.step3.groupOptions.solo, value: 'solo', icon: User },
        { label: copy.step3.groupOptions.couple, value: 'pareja', icon: Heart },
        { label: copy.step3.groupOptions.family, value: 'familia', icon: Users },
        { label: copy.step3.groupOptions.friends, value: 'amigos', icon: Users2 },
    ], [copy]);

    const servicesList = useMemo(() => [
        { label: copy.step3.serviceOptions.lodging, value: 'hospedaje', icon: Bed },
        { label: copy.step3.serviceOptions.transport, value: 'transporte', icon: Car },
        { label: copy.step3.serviceOptions.food, value: 'alimentos', icon: Utensils },
        { label: copy.step3.serviceOptions.tours, value: 'tours', icon: Route },
    ], [copy]);

    const toggleService = (v: string) => {
        setServices((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
    };

    const handleNext = () => {
        if (!group_type) return;

        onChange({
            group_type,
            services,
            needs_hotel: services.includes('hospedaje'),
            needs_transport: services.includes('transporte'),
            pref_food: services.includes('alimentos'),
            wants_tours: services.includes('tours'),
        });
        onNext();
    };

    const unselectedBtn = isDark
        ? 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700'
        : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300';

    const backBtn = isDark
        ? 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700'
        : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300';

    return (
        <div className="step-content px-4 py-6" ref={containerRef}>
            <div className="step-header mb-8 text-center">
                <h2 className={`mb-2 text-3xl font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>{copy.step3.title}</h2>
                <p className={isDark ? 'text-zinc-400' : 'text-zinc-500'}>{copy.step3.subtitle}</p>
            </div>

            <div className="form-section mb-8">
                <label className={`mb-4 block text-sm font-medium ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>{copy.step3.groupLabel}</label>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {companyOptions.map((c) => (
                        <button
                            key={c.value}
                            onClick={() => setGroupType(c.value)}
                            type="button"
                            className={`flex flex-col items-center rounded-2xl border p-5 text-center transition-all duration-200 ${
                                group_type === c.value ? 'border-violet-500 bg-violet-600 text-white shadow-lg shadow-violet-500/20' : unselectedBtn
                            }`}
                        >
                            <div className="mb-3">
                                <c.icon className="size-8" />
                            </div>
                            <div className="font-semibold">{c.label}</div>
                        </button>
                    ))}
                </div>
            </div>

            <div className="form-section mb-10">
                <label className={`mb-4 block text-sm font-medium ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>{copy.step3.servicesLabel}</label>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {servicesList.map((s) => (
                        <button
                            key={s.value}
                            type="button"
                            onClick={() => toggleService(s.value)}
                            className={`flex flex-col items-center rounded-2xl border p-5 text-center transition-all duration-200 ${
                                services.includes(s.value)
                                    ? 'border-violet-500 bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                                    : unselectedBtn
                            }`}
                        >
                            <div className="mb-3">
                                <s.icon className="size-8" />
                            </div>
                            <div className="font-bold">{s.label}</div>
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex justify-between">
                <button
                    onClick={onBack}
                    className={`flex items-center gap-2 rounded-xl border px-6 py-3 font-semibold transition-all active:scale-95 ${backBtn}`}
                >
                    <ChevronLeft className="size-5" />
                    <span>{copy.step3.back}</span>
                </button>
                <button
                    onClick={handleNext}
                    disabled={!group_type}
                    className="flex items-center gap-2 rounded-xl bg-violet-600 px-8 py-3 font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:bg-violet-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <span>{copy.step3.next}</span>
                    <ChevronRight className="size-5" />
                </button>
            </div>
        </div>
    );
};
