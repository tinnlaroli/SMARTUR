import React, { useState, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ChevronRight, ChevronLeft, Mountain, Footprints, Utensils, Landmark, Home, Cloud, Sun, Trees, Zap, Building } from 'lucide-react';
import type { FormContext } from '../types/types';
import { useTheme } from '../../../contexts/ThemeContext';

interface Step2Props {
    data: Partial<FormContext>;
    onNext: () => void;
    onBack: () => void;
    onChange: (newData: Partial<FormContext>) => void;
}

const tiposTurismoList = [
    { label: 'Naturaleza', value: 'naturaleza', icon: Mountain },
    { label: 'Aventura', value: 'aventura', icon: Footprints },
    { label: 'Gastronómico', value: 'gastronomico', icon: Utensils },
    { label: 'Cultural', value: 'cultural', icon: Landmark },
    { label: 'Rural', value: 'rural', icon: Home },
];

const actividadLevels = [
    { label: 'Muy relajado', value: 1, icon: Cloud },
    { label: 'Relajado', value: 2, icon: Sun },
    { label: 'Moderado', value: 3, icon: Trees },
    { label: 'Activo', value: 4, icon: Zap },
    { label: 'Muy activo', value: 5, icon: Zap },
];

const lugarOptions = [
    { label: 'Aire libre', value: 'aire', icon: Sun },
    { label: 'Cerrado', value: 'cerrado', icon: Building },
    { label: 'Indiferente', value: 'indiferente', icon: Trees },
];

export const Step2Preferencias: React.FC<Step2Props> = ({ data = {}, onNext, onBack, onChange }) => {
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

    const [tiposTurismo, setTipos] = useState<string[]>(data.tiposTurismo || []);
    const [actividad_level, setActividad] = useState<number>(data.actividad_level ?? 3);
    const [preferencia_lugar, setPreferenciaLugar] = useState<string>(data.preferencia_lugar || 'indiferente');

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
                <h2 className={`mb-2 text-3xl font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>Preferencias</h2>
                <p className={isDark ? 'text-zinc-400' : 'text-zinc-500'}>Selecciona tus intereses para personalizar las recomendaciones</p>
            </div>

            <div className="form-section mb-8">
                <label className={`mb-4 block text-sm font-medium ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>Tipos de turismo (elige al menos 1)</label>
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
                <label className={`mb-4 block text-sm font-medium ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>Nivel de actividad</label>
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
                <label className={`mb-4 block text-sm font-medium ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>Preferencia de lugar</label>
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
                    <span>Atrás</span>
                </button>
                <button
                    onClick={handleNext}
                    disabled={!tiposTurismo.length}
                    className="flex items-center gap-2 rounded-xl bg-violet-600 px-8 py-3 font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:bg-violet-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <span>Continuar</span>
                    <ChevronRight className="size-5" />
                </button>
            </div>
        </div>
    );
};
