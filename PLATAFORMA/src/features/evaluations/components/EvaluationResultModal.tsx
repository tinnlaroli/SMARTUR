import React, { useReducer, useEffect, useMemo } from 'react';
import { X, Award, BarChart3, Clock, User, ClipboardCheck, Info } from 'lucide-react';
import { evaluationsApi } from '../api/evaluationsApi';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getDashboardText } from '../../../shared/i18n/dashboardLocale';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    evaluationId: number;
}

interface ModalState {
    evaluation: any;
    isLoading: boolean;
}

type ModalAction =
    | { type: 'FETCH_START' }
    | { type: 'FETCH_SUCCESS'; evaluation: any }
    | { type: 'FETCH_ERROR' };

function modalReducer(state: ModalState, action: ModalAction): ModalState {
    switch (action.type) {
        case 'FETCH_START':
            return { evaluation: null, isLoading: true };
        case 'FETCH_SUCCESS':
            return { evaluation: action.evaluation, isLoading: false };
        case 'FETCH_ERROR':
            return { ...state, isLoading: false };
        default:
            return state;
    }
}

const EvaluationResultModal: React.FC<Props> = ({ isOpen, onClose, evaluationId }) => {
    const { lang } = useLanguage();
    const res = useMemo(() => getDashboardText(lang).modules.modals.evaluations.result, [lang]);
    const [{ evaluation, isLoading }, dispatch] = useReducer(modalReducer, {
        evaluation: null,
        isLoading: false,
    });

    useEffect(() => {
        if (!isOpen || !evaluationId) return;

        const controller = new AbortController();

        const fetchDetails = async () => {
            dispatch({ type: 'FETCH_START' });
            try {
                const response = await evaluationsApi.findById(evaluationId);
                if (!controller.signal.aborted) {
                    dispatch({ type: 'FETCH_SUCCESS', evaluation: response.evaluation });
                }
            } catch (err) {
                if (!controller.signal.aborted) {
                    console.error('Error fetching evaluation details', err);
                    dispatch({ type: 'FETCH_ERROR' });
                }
            }
        };

        fetchDetails();
        return () => controller.abort();
    }, [isOpen, evaluationId]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-[60] backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-[#121214] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden border border-zinc-200 dark:border-zinc-800">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-8 py-5 bg-violet-600">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Award className="size-6 text-white" />
                        </div>
                        <h2 className="text-xl font-semibold text-white">{res.title}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white transition-all"
                    >
                        <X className="size-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="size-10 animate-spin rounded-full border-4 border-zinc-200 border-t-violet-600 mb-4"></div>
                            <p className="text-zinc-500">
                                {res.loading}
                            </p>
                        </div>
                    ) : evaluation ? (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Score Card */}
                            <div className="rounded-2xl bg-violet-600 p-6 text-white shadow-xl">
                                <div className="flex justify-between items-center text-violet-100 mb-2">
                                    <span className="text-xs font-semibold uppercase tracking-widest">
                                        {res.totalScore}
                                    </span>
                                    <BarChart3 className="size-4" />
                                </div>
                                <div className="flex items-end gap-2">
                                    <span className="text-5xl font-black">
                                        {evaluation.totalScore
                                            ? Number(evaluation.totalScore).toFixed(1)
                                            : '0.0'}
                                    </span>
                                    <span className="text-lg font-semibold text-violet-200 mb-1">
                                        {res.ofMax}
                                    </span>
                                </div>
                                <div className="mt-4 pt-4 border-t border-white/20 grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-2">
                                        <Clock className="size-3.5 text-violet-200" />
                                        <span className="text-xs">
                                            {evaluation.evaluationTime} {res.minSuffix}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <User className="size-3.5 text-violet-200" />
                                        <span className="text-xs">
                                            {res.evaluator(evaluation.evaluatorId)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Details Section */}
                            <div className="space-y-6">
                                <h3 className="text-sm font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 flex items-center gap-2">
                                    <ClipboardCheck className="size-4" />
                                    {res.criteriaHeading}
                                </h3>

                                {/* This would normally map over details. Since we don't have them in the summary,
                                    I'll add a placeholder or assume evaluation.details exists if we fetch by ID */}
                                <div className="space-y-4">
                                    {evaluation.details ? (
                                        evaluation.details.map((detail: any) => (
                                            <div
                                                key={
                                                    detail.id_criterion ??
                                                    `${detail.criterion_name}-${detail.assigned_score}`
                                                }
                                                className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30"
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                                                        {detail.criterion_name}
                                                    </span>
                                                    <span className="px-2 py-0.5 rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-xs font-semibold">
                                                        {detail.assigned_score} / 4
                                                    </span>
                                                </div>
                                                <p className="text-xs text-zinc-500 dark:text-zinc-400 italic">
                                                    "{detail.observations || res.noObservations}"
                                                </p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center p-6 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-xl text-zinc-400 text-sm">
                                            {res.detailsUnavailable}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <h3 className="text-sm font-semibold uppercase tracking-widest text-zinc-500 flex items-center gap-2 pt-2">
                                        <Info className="size-4" />
                                        {res.generalHeading}
                                    </h3>
                                    <div className="p-4 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed border border-zinc-200 dark:border-zinc-700 italic">
                                        "
                                        {evaluation.generalObservations ||
                                            res.noGeneralObservations}
                                        "
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <p className="text-zinc-500">
                                {res.notFound}
                            </p>
                        </div>
                    )}
                </div>

                <div className="border-t border-zinc-200 dark:border-zinc-800 px-8 py-4 bg-zinc-50 dark:bg-zinc-900/50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-zinc-800 dark:bg-zinc-700 text-white rounded-xl text-sm font-semibold hover:bg-zinc-700 dark:hover:bg-zinc-600 transition-all"
                    >
                        {res.close}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EvaluationResultModal;
