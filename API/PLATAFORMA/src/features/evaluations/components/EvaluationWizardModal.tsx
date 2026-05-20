import React, { useReducer, useEffect, useRef, useState, useMemo } from 'react';
import {
    X,
    ChevronRight,
    ChevronLeft,
    Check,
    Camera,
    ClipboardList,
    ShieldCheck,
    Soup,
    Layout,
    Save,
    FileText,
    AlertCircle,
} from 'lucide-react';
import { useEvaluations } from '../hooks/useEvaluations';
import type { EvaluationCriterion, EvaluationDetailDTO } from '../types/types';
import { useToast } from '../../../shared/context/ToastContext';
import { instrumentApi } from '../../instrument-builder/api/instrumentApi';
import type { InstrumentTemplate } from '../../instrument-builder/types/types';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getDashboardText } from '../../../shared/i18n/dashboardLocale';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    serviceId: number;
    serviceName: string;
    serviceType?: string;
}

const STEP_ICONS = [Layout, ShieldCheck, Soup, Camera] as const;

interface WizardState {
    currentStep: number;
    responses: Record<number, { score: number; subcriterionId: number; observations?: string }>;
    generalObservations: string;
    evidences: Array<{ id: string; url: string }>;
}

type WizardAction =
    | { type: 'SET_STEP'; step: number }
    | { type: 'SET_SCORE'; criterionId: number; subcriterionId: number; score: number }
    | { type: 'SET_TEXT'; criterionId: number; text: string }
    | { type: 'SET_OBSERVATIONS'; value: string }
    | { type: 'ADD_EVIDENCES'; urls: Array<{ id: string; url: string }> }
    | { type: 'RESET' };

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
    switch (action.type) {
        case 'SET_STEP': return { ...state, currentStep: action.step };
        case 'SET_SCORE':
            return {
                ...state,
                responses: {
                    ...state.responses,
                    [action.criterionId]: {
                        ...state.responses[action.criterionId],
                        subcriterionId: action.subcriterionId,
                        score: action.score,
                    },
                },
            };
        case 'SET_TEXT':
            return {
                ...state,
                responses: {
                    ...state.responses,
                    [action.criterionId]: {
                        ...state.responses[action.criterionId],
                        subcriterionId: 0,
                        score: 0,
                        observations: action.text,
                    },
                },
            };
        case 'SET_OBSERVATIONS': return { ...state, generalObservations: action.value };
        case 'ADD_EVIDENCES': return { ...state, evidences: [...state.evidences, ...action.urls] };
        case 'RESET': return initialWizardState();
        default: return state;
    }
}

function initialWizardState(): WizardState {
    return { currentStep: 0, responses: {}, generalObservations: '', evidences: [] };
}

/** Map service_type values to template servicio labels for comparison */
const SERVICE_TYPE_MAP: Record<string, string> = {
    hotel: 'hotel',
    restaurant: 'restaurante',
    tour: 'tour',
    transporte: 'transporte',
    spa: 'spa',
};

function normalizeType(s: string): string {
    const lower = s.toLowerCase();
    return SERVICE_TYPE_MAP[lower] ?? lower;
}

const EvaluationWizardModal: React.FC<Props> = ({
    isOpen, onClose, serviceId, serviceName, serviceType = '',
}) => {
    const { lang } = useLanguage();
    const mod = useMemo(() => getDashboardText(lang).modules.modals, [lang]);
    const ev = mod.evaluations;
    const stepsWithIcons = useMemo(
        () =>
            ev.wizard.wizardSteps.map((step, idx) => ({
                title: step.title,
                description: step.description,
                icon: STEP_ICONS[idx]!,
            })),
        [mod],
    );
    const toast = useToast();
    const { getRubric, registerEvaluation, rubric, isLoading } = useEvaluations();
    const [state, dispatch] = useReducer(wizardReducer, undefined, initialWizardState);
    const { currentStep, responses, generalObservations, evidences } = state;

    const startTimeRef = useRef<number>(Date.now());

    // Template selection state
    const [matchingTemplates, setMatchingTemplates] = useState<InstrumentTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<InstrumentTemplate | null>(null);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const [templateError, setTemplateError] = useState<string | null>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files).map((f) => ({
                id: `${f.name}-${f.lastModified}-${f.size}`,
                url: URL.createObjectURL(f),
            }));
            dispatch({ type: 'ADD_EVIDENCES', urls: newFiles });
        }
    };

    useEffect(() => {
        if (!isOpen) return;
        startTimeRef.current = Date.now();
        dispatch({ type: 'RESET' });
        setSelectedTemplate(null);
        setTemplateError(null);

        // Fetch all active templates and filter by service type
        setLoadingTemplates(true);
        instrumentApi.getTemplates(1, 200).then((res) => {
            const normTarget = normalizeType(serviceType);
            const active = res.templates.filter((t) => t.estado);
            const matches = active.filter((t) => normalizeType(t.servicio) === normTarget);
            setMatchingTemplates(matches);
            if (matches.length === 1) {
                // Auto-select the only match
                setSelectedTemplate(matches[0]);
                getRubric(matches[0].id);
            } else if (matches.length === 0) {
                const label = (serviceType && serviceType.trim()) || ev.wizard.fallbackTypeLabel;
                setTemplateError(ev.wizard.noTemplatesForType(label));
            }
        }).catch(() => {
            setTemplateError(ev.wizard.templatesFetchFailed);
        }).finally(() => setLoadingTemplates(false));
    }, [isOpen, serviceType, mod, getRubric]);

    if (!isOpen) return null;

    const STEP_KEYS = ['infraestructura', 'higiene', 'servicio'] as const;
    const EVAL_STEP_REGEX = /^\[STEP:(\w+)\]\s*/;

    const getCriteriaForStep = (stepIndex: number): EvaluationCriterion[] => {
        if (!rubric || !rubric.criteria) return [];
        if (stepIndex === 3) return [];

        const hasTags = rubric.criteria.some((c) => EVAL_STEP_REGEX.test(c.description || ''));

        if (hasTags) {
            const stepKey = STEP_KEYS[stepIndex];
            return rubric.criteria.filter((c) => {
                const match = (c.description || '').match(EVAL_STEP_REGEX);
                return match && match[1] === stepKey;
            });
        }

        // Fallback: mathematical split for instruments without step tags
        const criteria = rubric.criteria;
        const total = criteria.length;
        const perStep = Math.floor(total / 3);
        const extra = total % 3;
        let start = 0;
        let count = perStep;
        if (stepIndex === 0) { start = 0; count = perStep + (extra > 0 ? 1 : 0); }
        else if (stepIndex === 1) { start = perStep + (extra > 0 ? 1 : 0); count = perStep + (extra > 1 ? 1 : 0); }
        else { start = perStep * 2 + (extra > 0 ? 1 : 0) + (extra > 1 ? 1 : 0); count = total - start; }
        return criteria.slice(start, start + count);
    };

    const handleScoreSelect = (criterionId: number, subId: number, score: number) => {
        dispatch({ type: 'SET_SCORE', criterionId, subcriterionId: subId, score });
    };

    const handleFinish = async () => {
        const allCriteria = [0, 1, 2].flatMap((idx) => getCriteriaForStep(idx));
        const unanswered = allCriteria.filter((c) => {
            const r = responses[c.id_criterion];
            if (!r) return true;
            if (c.field_type === 'text') return !r.observations?.trim();
            return !r.subcriterionId;
        });
        if (unanswered.length > 0) {
            toast.error(ev.toastErrorTitle, ev.toastIncompleteBody);
            return;
        }
        const endTime = Date.now();
        const durationMinutes = Math.max(1, Math.round((endTime - startTimeRef.current) / 1000 / 60));
        const details: EvaluationDetailDTO[] = Object.entries(responses).map(([criterionId, data]) => ({
            id_criterion: Number(criterionId),
            assigned_score: data.score,
            id_selected_subcriterion: data.subcriterionId,
            observations: data.observations || '',
            attached_evidences: evidences.length > 0 ? 'https://via.placeholder.com/150' : '',
        }));
        const payload = {
            id_service: serviceId,
            id_template: selectedTemplate!.id,
            evaluator_id: 1,
            evaluation_date: new Date().toISOString().split('T')[0],
            evaluation_time: durationMinutes,
            general_observations: generalObservations,
            details,
        };
        const result = await registerEvaluation(payload);
        if (result) {
            toast.success(ev.toastSuccessTitle, ev.toastSuccessBody);
            onClose();
        } else {
            toast.error(ev.toastRegisterErrorTitle, ev.toastRegisterErrorBody);
        }
    };

    const stepCriteria = getCriteriaForStep(currentStep);
    const isLastStep = currentStep === stepsWithIcons.length - 1;

    // Determine what to show in the content area
    const showTemplateSelect = !loadingTemplates && !templateError && matchingTemplates.length > 1 && !selectedTemplate;
    const showTemplateError = !loadingTemplates && !!templateError;
    const showWizard = !!selectedTemplate && !loadingTemplates;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-[#121214] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden transform transition-all border border-zinc-200 dark:border-zinc-800">

                {/* Header */}
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-8 py-5 bg-zinc-50/50 dark:bg-zinc-900/50">
                    <div>
                        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white flex items-center gap-3">
                            <ClipboardList className="size-6 text-violet-500" />
                            {ev.wizard.title}
                        </h2>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                            {ev.wizard.evaluating}{' '}
                            <span className="font-semibold text-violet-500">{serviceName}</span>
                            {serviceType && (
                                <span className="ml-2 inline-flex items-center rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs font-medium capitalize text-zinc-500">
                                    {serviceType}
                                </span>
                            )}
                        </p>
                    </div>
                    <button onClick={onClose} className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-600 dark:hover:text-zinc-200 transition-all">
                        <X className="size-6" />
                    </button>
                </div>

                {/* Stepper — only show when wizard is active */}
                {showWizard && (
                    <div className="px-8 py-6 border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-[#121214]">
                        <div className="flex items-center justify-between relative">
                            {stepsWithIcons.map((step, idx) => {
                                const Icon = step.icon;
                                const isActive = currentStep === idx;
                                const isCompleted = currentStep > idx;
                                return (
                                    <div key={step.title + idx} className="flex flex-col items-center z-10 flex-1">
                                        <div className={`size-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                                            isActive
                                                ? 'bg-violet-600 text-white shadow-lg scale-110'
                                                : isCompleted
                                                  ? 'bg-emerald-500 text-white'
                                                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                                        }`}>
                                            {isCompleted ? <Check className="size-5" /> : <Icon className="size-5" />}
                                        </div>
                                        <span className={`text-[10px] font-semibold uppercase tracking-wider mt-2 ${isActive ? 'text-violet-500' : 'text-zinc-500'}`}>
                                            {step.title}
                                        </span>
                                    </div>
                                );
                            })}
                            <div className="absolute top-5 left-0 right-0 h-0.5 bg-zinc-100 dark:bg-zinc-800 -z-10 mx-10">
                                <div className="h-full bg-violet-500 transition-all duration-500"
                                    style={{ width: `${(currentStep / (stepsWithIcons.length - 1)) * 100}%` }} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">

                    {/* Loading templates */}
                    {loadingTemplates && (
                        <div className="flex flex-col items-center justify-center h-64 gap-4">
                            <div className="size-12 animate-spin rounded-full border-4 border-zinc-200 border-t-violet-600" />
                            <p className="text-zinc-500 animate-pulse">{ev.wizard.loadingTemplates}</p>
                        </div>
                    )}

                    {/* Template error */}
                    {showTemplateError && (
                        <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
                            <div className="flex size-16 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-900/20">
                                <AlertCircle className="size-8 text-amber-500" />
                            </div>
                            <p className="text-base font-semibold text-zinc-700 dark:text-zinc-200 max-w-sm">{templateError}</p>
                        </div>
                    )}

                    {/* Template selection (multiple matches) */}
                    {showTemplateSelect && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div>
                                <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-1">
                                    {ev.wizard.selectTitle}
                                </h3>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                    {ev.wizard.selectHintPart1}{' '}
                                    <span className="font-semibold capitalize">{serviceType}</span>
                                    {ev.wizard.selectHintPart2}
                                </p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {matchingTemplates.map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => {
                                            setSelectedTemplate(t);
                                            getRubric(t.id);
                                        }}
                                        className="flex items-start gap-4 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 text-left transition-all hover:border-violet-400 hover:shadow-md active:scale-[0.98]"
                                    >
                                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm">
                                            <FileText className="size-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{t.name}</p>
                                            <p className="text-xs text-zinc-400 mt-0.5">v{t.version} · {t.servicio}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Wizard content */}
                    {showWizard && (
                        <>
                            {isLoading && (
                                <div className="flex flex-col items-center justify-center h-64">
                                    <div className="size-12 animate-spin rounded-full border-4 border-zinc-200 border-t-violet-600 mb-4" />
                                    <p className="text-zinc-500 animate-pulse">{ev.wizard.loadingRubric}</p>
                                </div>
                            )}
                            {!isLoading && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    {currentStep < 3 ? (
                                        <>
                                            <div className="mb-6">
                                                <p className="text-xs font-semibold uppercase tracking-widest text-violet-500 mb-1">
                                                    {selectedTemplate?.name}
                                                </p>
                                                <h3 className="text-2xl font-semibold text-zinc-900 dark:text-white">
                                                    {stepsWithIcons[currentStep].title}
                                                </h3>
                                                <p className="text-zinc-500 dark:text-zinc-400">{stepsWithIcons[currentStep].description}</p>
                                            </div>
                                            <div className="space-y-10">
                                                {stepCriteria.map((criterion) => (
                                                    <div key={criterion.id_criterion} className="space-y-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className="size-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center font-semibold text-sm">
                                                                {criterion.order_index || 1}
                                                            </span>
                                                            <h4 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">{criterion.name}</h4>
                                                        </div>
                                                        <div className="grid grid-cols-1 gap-3">
                                                            {criterion.field_type === 'text' ? (
                                                                <textarea
                                                                    value={responses[criterion.id_criterion]?.observations || ''}
                                                                    onChange={(e) => dispatch({ type: 'SET_TEXT', criterionId: criterion.id_criterion, text: e.target.value })}
                                                                    placeholder={ev.wizard.textPlaceholder}
                                                                    rows={4}
                                                                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900/50 p-4 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none resize-none"
                                                                />
                                                            ) : (
                                                                criterion.levels.sort((a, b) => a.score - b.score).map((level) => {
                                                                    const isSelected = responses[criterion.id_criterion]?.subcriterionId === level.id_subcriterion;
                                                                    return (
                                                                        <button
                                                                            key={level.id_subcriterion}
                                                                            onClick={() => handleScoreSelect(criterion.id_criterion, level.id_subcriterion, level.score)}
                                                                            className={`flex items-start gap-4 p-4 rounded-xl border transition-all duration-200 text-left group ${
                                                                                isSelected
                                                                                    ? 'bg-violet-50 dark:bg-violet-900/20 border-violet-500 ring-1 ring-violet-500'
                                                                                    : 'bg-white dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                                                                            }`}
                                                                        >
                                                                            <div className={`mt-1 size-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'border-violet-600 bg-violet-600' : 'border-zinc-300 dark:border-zinc-600'}`}>
                                                                                {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                                                                            </div>
                                                                            <div>
                                                                                <div className="flex items-center gap-2 mb-1">
                                                                                    <span className={`text-sm font-semibold ${isSelected ? 'text-violet-600 dark:text-violet-400' : 'text-zinc-600 dark:text-zinc-400'}`}>
                                                                                        {ev.wizard.scoreLabel} {level.score}
                                                                                    </span>
                                                                                </div>
                                                                                <p className={`text-sm leading-relaxed ${isSelected ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400'}`}>
                                                                                    {level.description}
                                                                                </p>
                                                                            </div>
                                                                        </button>
                                                                    );
                                                                })
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="space-y-6">
                                            <h3 className="text-2xl font-semibold text-zinc-900 dark:text-white">{ev.wizard.summaryTitle}</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-4">
                                                    <label htmlFor="general-observations" className="block text-xs font-semibold uppercase tracking-widest text-zinc-500">
                                                        {ev.wizard.generalObservations}
                                                    </label>
                                                    <textarea
                                                        id="general-observations"
                                                        value={generalObservations}
                                                        onChange={(e) => dispatch({ type: 'SET_OBSERVATIONS', value: e.target.value })}
                                                        className="w-full h-40 rounded-xl border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900/50 p-4 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none resize-none"
                                                        placeholder={ev.wizard.generalObservationsPh}
                                                    />
                                                </div>
                                                <div className="space-y-4">
                                                    <label htmlFor="evidence-upload" className="block text-xs font-semibold uppercase tracking-widest text-zinc-500">
                                                        {ev.wizard.photoEvidence}
                                                    </label>
                                                    <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl p-8 flex flex-col items-center justify-center gap-3 bg-zinc-50/50 dark:bg-zinc-900/20 relative">
                                                        <Camera className="size-10 text-zinc-400" />
                                                        <p className="text-sm text-zinc-500 text-center">{ev.wizard.photoEvidenceHint}</p>
                                                        <input id="evidence-upload" type="file" multiple onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                                        <div className="flex flex-wrap gap-2 mt-2">
                                                            {evidences.map((item) => (
                                                                <img key={item.id} src={item.url} className="size-12 rounded-lg object-cover border border-zinc-200" alt={ev.wizard.photoEvidenceAlt} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 flex gap-3">
                                                <ShieldCheck className="size-5 text-amber-500 mt-0.5 shrink-0" />
                                                <div>
                                                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-400">{ev.wizard.verificationTitle}</p>
                                                    <p className="text-xs text-amber-700 dark:text-amber-500">{ev.wizard.verificationBody}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer — only show when wizard is active */}
                {showWizard && !isLoading && (
                    <div className="flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800 px-8 py-5 bg-zinc-50/30 dark:bg-zinc-900/30">
                        <button
                            onClick={() => dispatch({ type: 'SET_STEP', step: Math.max(0, currentStep - 1) })}
                            disabled={currentStep === 0}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                                currentStep === 0
                                    ? 'text-zinc-300 dark:text-zinc-700 cursor-not-allowed'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                            }`}
                        >
                            <ChevronLeft className="size-4" />
                            {ev.wizard.back}
                        </button>
                        <div className="flex gap-3">
                            {!isLastStep ? (
                                <button
                                    onClick={() => dispatch({ type: 'SET_STEP', step: Math.min(stepsWithIcons.length - 1, currentStep + 1) })}
                                    className="flex items-center gap-2 px-8 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 shadow-lg active:scale-[0.98] transition-all"
                                >
                                    {ev.wizard.next}
                                    <ChevronRight className="size-4" />
                                </button>
                            ) : (
                                <button
                                    onClick={handleFinish}
                                    className="flex items-center gap-2 px-10 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 shadow-lg active:scale-[0.98] transition-all"
                                >
                                    <Save className="size-4" />
                                    {ev.wizard.finish}
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Footer for error / no template state */}
                {(showTemplateError || (showTemplateSelect && matchingTemplates.length === 0)) && (
                    <div className="flex justify-end border-t border-zinc-200 dark:border-zinc-800 px-8 py-4">
                        <button onClick={onClose} className="rounded-xl px-6 py-2.5 text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                            {ev.wizard.close}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EvaluationWizardModal;
