import React, { useState, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ChevronRight, ChevronLeft, User, Heart, Users, Users2, Bed, Car, Utensils, Route } from 'lucide-react';
import type { FormContext } from '../types/types';
import { useTheme } from '../../../contexts/ThemeContext';

interface Step3Props {
    data: Partial<FormContext>;
    onNext: () => void;
    onBack: () => void;
    onChange: (newData: Partial<FormContext>) => void;
}

const companyOptions = [
    { label: 'Solo', value: 'solo', icon: User },
    { label: 'Pareja', value: 'pareja', icon: Heart },
    { label: 'Familia', value: 'familia', icon: Users },
    { label: 'Amigos', value: 'amigos', icon: Users2 },
];

const servicesList = [
    { label: 'Hospedaje', value: 'hospedaje', icon: Bed },
    { label: 'Transporte', value: 'transporte', icon: Car },
    { label: 'Alimentos', value: 'alimentos', icon: Utensils },
    { label: 'Tours', value: 'tours', icon: Route },
];

export const Step3Contexto: React.FC<Step3Props> = ({ data = {}, onNext, onBack, onChange }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { theme } = useTheme();
    const isDark = theme === 'dark';

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
                <h2 className={`mb-2 text-3xl font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>Contexto del Viaje</h2>
                <p className={isDark ? 'text-zinc-400' : 'text-zinc-500'}>Cuéntanos sobre tu compañía y servicios preferidos</p>
            </div>

            <div className="form-section mb-8">
                <label className={`mb-4 block text-sm font-medium ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>Viajas con</label>
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
                <label className={`mb-4 block text-sm font-medium ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>Servicios que quieres incluir</label>
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
                    <span>Atrás</span>
                </button>
                <button
                    onClick={handleNext}
                    disabled={!group_type}
                    className="flex items-center gap-2 rounded-xl bg-violet-600 px-8 py-3 font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:bg-violet-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <span>Continuar</span>
                    <ChevronRight className="size-5" />
                </button>
            </div>
        </div>
    );
};
