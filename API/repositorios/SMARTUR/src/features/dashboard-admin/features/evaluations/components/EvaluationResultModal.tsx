import React, { useEffect, useState } from 'react';
import { X, Award, BarChart3, Clock, User, ClipboardCheck, Info } from 'lucide-react';
import { evaluationsApi } from '../api/evaluationsApi';
import SmartURLoader from '../../../../../components/ui/SmartURLoader';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    evaluationId: number;
}

const EvaluationResultModal: React.FC<Props> = ({ isOpen, onClose, evaluationId }) => {
    const [evaluation, setEvaluation] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchDetails = async () => {
            if (isOpen && evaluationId) {
                setIsLoading(true);
                try {
                    const response = await evaluationsApi.findById(evaluationId);
                    setEvaluation(response.evaluation);
                } catch (err) {
                    console.error('Error fetching evaluation details', err);
                } finally {
                    setIsLoading(false);
                }
            }
        };
        fetchDetails();
    }, [isOpen, evaluationId]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-[60] backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-[#121214] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden border border-zinc-200 dark:border-zinc-800">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-8 py-5 bg-indigo-600">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Award className="h-6 w-6 text-white" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Resultados de Evaluación</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white transition-all"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-64 relative">
                            <SmartURLoader isMini />
                            <p className="text-zinc-500 animate-pulse relative z-[100000] mt-16 font-medium">
                                Recuperando detalles de la evaluación...
                            </p>
                        </div>
                    ) : evaluation ? (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Score Card */}
                            <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl p-6 text-white shadow-xl shadow-indigo-500/20">
                                <div className="flex justify-between items-center text-indigo-100 mb-2">
                                    <span className="text-xs font-bold uppercase tracking-widest">
                                        Puntaje Total
                                    </span>
                                    <BarChart3 className="h-4 w-4" />
                                </div>
                                <div className="flex items-end gap-2">
                                    <span className="text-5xl font-black">
                                        {evaluation.totalScore
                                            ? Number(evaluation.totalScore).toFixed(1)
                                            : '0.0'}
                                    </span>
                                    <span className="text-lg font-bold text-indigo-200 mb-1">
                                        / 4.0
                                    </span>
                                </div>
                                <div className="mt-4 pt-4 border-t border-white/20 grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-3.5 w-3.5 text-indigo-200" />
                                        <span className="text-xs">
                                            {evaluation.evaluationTime} min
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <User className="h-3.5 w-3.5 text-indigo-200" />
                                        <span className="text-xs">
                                            Evaluador #{evaluation.evaluatorId}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Details Section */}
                            <div className="space-y-6">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 flex items-center gap-2">
                                    <ClipboardCheck className="h-4 w-4" />
                                    Detalle por Criterios
                                </h3>

                                {/* This would normally map over details. Since we don't have them in the summary, 
                                    I'll add a placeholder or assume evaluation.details exists if we fetch by ID */}
                                <div className="space-y-4">
                                    {evaluation.details ? (
                                        evaluation.details.map((detail: any, idx: number) => (
                                            <div
                                                key={idx}
                                                className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30"
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                                                        {detail.criterion_name}
                                                    </span>
                                                    <span className="px-2 py-0.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                                                        {detail.assigned_score} / 4
                                                    </span>
                                                </div>
                                                <p className="text-xs text-zinc-500 dark:text-zinc-400 italic">
                                                    "{detail.observations || 'Sin observaciones'}"
                                                </p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center p-6 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-xl text-zinc-400 text-sm">
                                            Los detalles específicos por criterio no están
                                            disponibles en esta vista.
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2 pt-2">
                                        <Info className="h-4 w-4" />
                                        Observaciones Generales
                                    </h3>
                                    <div className="p-4 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed border border-zinc-200 dark:border-zinc-700 italic">
                                        "
                                        {evaluation.generalObservations ||
                                            'No se registraron observaciones generales.'}
                                        "
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <p className="text-zinc-500">
                                No se encontró la información de la evaluación.
                            </p>
                        </div>
                    )}
                </div>

                <div className="border-t border-zinc-200 dark:border-zinc-800 px-8 py-4 bg-zinc-50 dark:bg-zinc-900/50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-zinc-800 dark:bg-zinc-700 text-white rounded-xl text-sm font-bold hover:bg-zinc-700 dark:hover:bg-zinc-600 transition-all"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EvaluationResultModal;
