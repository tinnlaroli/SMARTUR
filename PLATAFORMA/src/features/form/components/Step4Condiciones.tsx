import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ArrowLeft, Check, MapPin, CheckCircle2, XCircle, RotateCw } from 'lucide-react';
import { useFormRecommendations } from '../hooks/useFormRecommendations';
import SmartURLoader from '../../auth/components/SmartURLoader';
import type { FormContext, RecommendationsResponse, AIRecommendationContext } from '../types/types';
import { useTheme } from '../../../contexts/ThemeContext';
import { useLanguage, useUserPreferences } from '../../../contexts/LanguageContext';
import { getDashboardText } from '../../../shared/i18n/dashboardLocale';

interface Step4Props {
    data: Partial<FormContext>;
    onBack: () => void;
    onChange: (newData: Partial<FormContext>) => void;
    onLoadingChange?: (loading: boolean) => void;
    onShowRecommendations: (result: RecommendationsResponse) => void;
}

export const Step4Condiciones: React.FC<Step4Props> = ({ data = {}, onBack, onChange, onLoadingChange, onShowRecommendations }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { lang } = useLanguage();
    const copy = useMemo(() => getDashboardText(lang).modules.form, [lang]);
    const [accesibilidad, setAccesibilidad] = useState<string>(data.accesibilidad || 'no');
    const [detalleAcc, setDetalleAcc] = useState<string>(data.detalleAcc || '');
    const [visitado, setVisitado] = useState<string>(data.visitado || 'no');

    const { loading, error: apiError, getRecommendations, cancel } = useFormRecommendations();
    const [localError, setError] = useState<string | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [pendingResult, setPendingResult] = useState<RecommendationsResponse | null>(null);
    const isSubmittingRef = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const { user } = useUserPreferences();

    useGSAP(
        () => {
            if (loading || apiError) return;

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
        { scope: containerRef, dependencies: [loading, apiError] },
    );

    useEffect(() => {
        onLoadingChange?.(loading);
    }, [loading]);

    useEffect(() => {
        return () => {
            if (!isSubmittingRef.current) {
                cancel();
            }
        };
    }, []);

    const buildAIContext = (): AIRecommendationContext => {
        const d = data || {};
        const preferencia_lugar = d.preferencia_lugar || 'indiferente';
        const pref_outdoor = preferencia_lugar === 'aire';

        return {
            presupuesto_bucket: d.presupuesto_bucket || 'medio',
            edad_range: d.edad_range || '35-44',
            tiposTurismo: (d.tiposTurismo && d.tiposTurismo.length > 0) ? d.tiposTurismo : ['cultural'],
            group_type: d.group_type || 'familia',
            wants_tours: !!d.wants_tours,
            needs_hotel: !!d.needs_hotel,
            pref_food: !!d.pref_food,
            requiere_accesibilidad: accesibilidad === 'si',
            pref_outdoor,
            has_visited_region: visitado === 'si',
        };
    };

    const handleFinish = async () => {
        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;

        onChange({
            accesibilidad,
            detalleAcc: accesibilidad === 'si' ? detalleAcc : '',
            visitado,
        });

        if (!user || !user.id) {
            setError(copy.step4.loginRequired);
            isSubmittingRef.current = false;
            return;
        }

        const aiContext = buildAIContext();

        try {
            const result = await getRecommendations({
                userId: String(user.id),
                alpha: 0.2,
                top_n: 5,
                context: aiContext,
            });

            if (result && result.recommendations && result.recommendations.length > 0) {
                setPendingResult(result);
                setIsReady(true);
            } else if (result) {
                throw new Error(copy.step4.noRecommendations);
            }
        } catch (err: any) {
            setError(err?.message || copy.step4.errorGeneric || 'Error al obtener recomendaciones');
        } finally {
            // No reseteamos isSubmitting hasta que el loader termine si hubo éxito
            if (!isReady) isSubmittingRef.current = false;
        }
    };

    const handleLoaderFinished = () => {
        if (pendingResult) {
            onShowRecommendations(pendingResult);
        }
        setIsReady(false);
        isSubmittingRef.current = false;
    };

    if (loading || isReady) {
        return (
            <div className="flex min-h-[400px] flex-col items-center justify-center">
                <SmartURLoader isReady={isReady} onFinished={handleLoaderFinished} />
                <div className="mt-8 text-center text-white">
                    <h3 className="mb-4 text-2xl font-semibold">{copy.step4.loadingTitle}</h3>
                    <p className="text-zinc-400">{copy.step4.loadingSubtitle}</p>
                </div>
            </div>
        );
    }

    if (apiError) {
        return (
            <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-red-500/20 bg-zinc-900/50 p-8 text-center">
                <div className="mb-6 flex size-16 items-center justify-center rounded-full bg-red-500/10">
                    <XCircle className="size-8 text-red-500" />
                </div>
                <h3 className="mb-2 text-2xl font-semibold text-white">{copy.step4.errorTitle}</h3>
                <p className="mb-8 max-w-md text-zinc-400">{apiError}</p>
                <button
                    onClick={() => {
                        isSubmittingRef.current = false;
                        handleFinish();
                    }}
                    className="flex items-center gap-2 rounded-xl bg-violet-600 px-8 py-3 font-semibold text-white"
                >
                    <RotateCw className="size-5" />
                    <span>{copy.step4.retry}</span>
                </button>
            </div>
        );
    }

    const accesibilidadOptions = [
        { label: copy.step4.yes, value: 'si', icon: CheckCircle2 },
        { label: copy.step4.no, value: 'no', icon: XCircle },
    ];

    const visitadoOptions = [
        { label: copy.step4.yes, value: 'si', icon: MapPin },
        { label: copy.step4.no, value: 'no', icon: MapPin },
    ];

    const unselectedBtn = isDark
        ? 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700'
        : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300';

    return (
        <div className="step-content px-4 py-6" ref={containerRef}>
            <div className="step-header mb-8 text-center">
                <h2 className={`mb-2 text-3xl font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>{copy.step4.title}</h2>
                <p className={isDark ? 'text-zinc-400' : 'text-zinc-500'}>{copy.step4.subtitle}</p>
            </div>

            <div className="form-section mb-8">
                <label className={`mb-4 block text-sm font-medium ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>{copy.step4.accessibilityLabel}</label>
                <div className="grid grid-cols-2 gap-4">
                    {accesibilidadOptions.map((o) => (
                        <button
                            key={o.value}
                            type="button"
                            onClick={() => setAccesibilidad(o.value)}
                            className={`flex flex-col items-center rounded-2xl border p-5 text-center transition-all duration-200 ${
                                accesibilidad === o.value
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
                {accesibilidad === 'si' && (
                    <div className="animate-slideDown mt-4">
                        <textarea
                            value={detalleAcc}
                            onChange={(e) => setDetalleAcc(e.target.value)}
                            placeholder={copy.step4.accessibilityPlaceholder}
                            rows={4}
                            className={`w-full rounded-xl border p-4 transition-all outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 ${
                                isDark ? 'border-zinc-800 bg-zinc-900 text-white' : 'border-zinc-200 bg-white text-zinc-900'
                            }`}
                        />
                    </div>
                )}
            </div>

            <div className="form-section mb-10">
                <label className={`mb-4 block text-sm font-medium ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>{copy.step4.visitedLabel}</label>
                <div className="grid grid-cols-2 gap-4">
                    {visitadoOptions.map((o) => (
                        <button
                            key={o.value}
                            type="button"
                            onClick={() => setVisitado(o.value)}
                            className={`flex flex-col items-center rounded-2xl border p-5 text-center transition-all duration-200 ${
                                visitado === o.value ? 'border-violet-500 bg-violet-600 text-white shadow-lg shadow-violet-500/20' : unselectedBtn
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

            <div className="mt-auto flex justify-between">
                <button
                    onClick={onBack}
                    disabled={loading}
                    className={`flex items-center gap-2 rounded-xl border px-6 py-3 font-semibold transition-all active:scale-95 disabled:opacity-50 ${unselectedBtn}`}
                >
                    <ArrowLeft className="size-5" />
                    <span>{copy.step4.back}</span>
                </button>
                <button
                    onClick={handleFinish}
                    disabled={loading}
                    className="flex items-center gap-2 rounded-xl bg-violet-600 px-8 py-3 font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:bg-violet-500 active:scale-95 disabled:opacity-50"
                >
                    <span>{copy.step4.finish}</span>
                    <Check className="size-5" />
                </button>
            </div>
        </div>
    );
};
