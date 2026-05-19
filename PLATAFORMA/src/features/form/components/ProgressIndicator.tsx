import React from 'react';
import { User, Trees, Users, Accessibility, Check } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';

interface ProgressIndicatorProps {
    currentStep: number;
    totalSteps: number;
    isStep4Loading?: boolean;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ currentStep, totalSteps, isStep4Loading = false }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const steps = [
        { name: 'Perfil', icon: User },
        { name: 'Preferencias', icon: Trees },
        { name: 'Contexto', icon: Users },
        { name: 'Condiciones', icon: Accessibility },
    ];

    const progressPercentage = isStep4Loading ? 100 : Math.round((currentStep / totalSteps) * 100);

    return (
        <div className="mb-10 w-full" aria-label="Progreso del formulario" role="progressbar">
            {/* Progress Bar */}
            <div className="mb-8 flex items-center gap-4">
                <div className={`h-3 flex-1 overflow-hidden rounded-full ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}>
                    <div
                        className="h-full bg-violet-600 shadow-[0_0_12px_rgba(79,70,229,0.45)] transition-all duration-700 ease-out"
                        style={{ width: `${progressPercentage}%` }}
                    />
                </div>
                <span className={`min-w-[3ch] text-sm font-bold ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>{progressPercentage}%</span>
            </div>

            {/* Step Indicators */}
            <div className="relative flex justify-between px-2">
                {steps.map((step, idx) => {
                    const stepNumber = idx + 1;
                    const isStep4AndLoading = stepNumber === totalSteps && isStep4Loading;
                    const isCompleted = stepNumber < currentStep || isStep4AndLoading;
                    const isActive = stepNumber === currentStep && !isStep4AndLoading;

                    return (
                        <div key={step.name} className="relative z-10 flex flex-col items-center">
                            <div
                                className={`flex size-12 items-center justify-center rounded-2xl border-2 transition-all duration-300 ${
                                    isCompleted
                                        ? 'border-violet-500 bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                                        : isActive
                                          ? `scale-110 border-violet-500 ${isDark ? 'bg-zinc-900' : 'bg-white'} text-violet-400 shadow-lg shadow-violet-500/10`
                                          : isDark
                                              ? 'border-zinc-800 bg-zinc-900 text-zinc-600'
                                              : 'border-zinc-300 bg-white text-zinc-400'
                                }`}
                            >
                                {isCompleted ? <Check className="size-6 stroke-[3]" /> : <step.icon className="size-6" />}
                            </div>
                            <span className={`mt-3 text-xs font-bold tracking-tight transition-colors duration-300 ${
                                isActive || isCompleted
                                    ? isDark ? 'text-zinc-200' : 'text-zinc-800'
                                    : isDark ? 'text-zinc-600' : 'text-zinc-500'
                            }`}>{step.name}</span>
                        </div>
                    );
                })}
                {/* Connector line (background) */}
                <div className={`absolute top-6 right-10 left-10 -z-0 hidden h-[2px] sm:block ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
            </div>
        </div>
    );
};
