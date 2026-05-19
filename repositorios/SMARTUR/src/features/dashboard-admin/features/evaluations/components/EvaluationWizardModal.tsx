import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { useEvaluations } from '../hooks/useEvaluations';
import type { EvaluationCriterion, EvaluationDetailDTO } from '../types/types';
import { useToast } from '../../../shared/context/ToastContext';
import SmartURLoader from '../../../../../components/ui/SmartURLoader';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    serviceId: number;
    serviceName: string;
}

const STEPS = [
    { title: 'Infraestructura', icon: Layout, description: 'Espacio y accesibilidad' },
    { title: 'Higiene y Limpieza', icon: ShieldCheck, description: 'NOM-251 / Distintivo H' },
    { title: 'Servicio y Calidad', icon: Soup, description: 'Atención y Experiencia' },
    { title: 'Resumen', icon: Camera, description: 'Evidencia final' },
];

// Criterios específicos eliminados para usar rúbrica dinámica de 13 registros

const EvaluationWizardModal: React.FC<Props> = ({ isOpen, onClose, serviceId, serviceName }) => {
    const { getRubric, registerEvaluation, rubric, isLoading, error: apiError } = useEvaluations();
    const { success: toastSuccess, error: toastError } = useToast();
    const [currentStep, setCurrentStep] = useState(0);
    const [responses, setResponses] = useState<
        Record<number, { score: number; subcriterionId: number; observations?: string }>
    >({});
    const [generalObservations, setGeneralObservations] = useState('');
    const [evidences, setEvidences] = useState<string[]>([]);

    const [startTime] = useState<number>(Date.now());

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            // We keep local URLs for preview, but we will send fake ones in JSON as requested
            const newFiles = Array.from(e.target.files).map((f) => URL.createObjectURL(f));
            setEvidences((prev) => [...prev, ...newFiles]);
        }
    };

    useEffect(() => {
        if (isOpen) {
            getRubric(1); // Assuming template 1 as requested
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // Helper to group criteria by step dynamically
    const getCriteriaForStep = (stepIndex: number): EvaluationCriterion[] => {
        if (!rubric || !rubric.criteria) return [];
        if (stepIndex === 3) return []; // Summary step

        const criteria = rubric.criteria;
        const total = criteria.length;

        // Split criteria into 3 steps
        const perStep = Math.floor(total / 3);
        const extra = total % 3;

        let start = 0;
        let count = perStep;

        if (stepIndex === 0) {
            start = 0;
            count = perStep + (extra > 0 ? 1 : 0);
        } else if (stepIndex === 1) {
            start = perStep + (extra > 0 ? 1 : 0);
            count = perStep + (extra > 1 ? 1 : 0);
        } else if (stepIndex === 2) {
            start = perStep * 2 + (extra > 0 ? 1 : 0) + (extra > 1 ? 1 : 0);
            count = total - start;
        }

        return criteria.slice(start, start + count);
    };

    const handleScoreSelect = (criterionId: number, subId: number, score: number) => {
        setResponses((prev) => ({
            ...prev,
            [criterionId]: { ...prev[criterionId], subcriterionId: subId, score },
        }));
    };

    const handleFinish = async () => {
        // Validar que se hayan respondido todos los criterios obligatorios
        const criteriaCount = [0, 1, 2].reduce(
            (acc, idx) => acc + getCriteriaForStep(idx).length,
            0
        );

        if (Object.keys(responses).length < criteriaCount) {
            toastError('Por favor califica todos los criterios antes de finalizar.');
            return;
        }

        const endTime = Date.now();
        const durationMinutes = Math.max(1, Math.round((endTime - startTime) / 1000 / 60));

        const details: EvaluationDetailDTO[] = Object.entries(responses).map(
            ([criterionId, data]) => ({
                id_criterion: Number(criterionId),
                assigned_score: data.score,
                id_selected_subcriterion: data.subcriterionId,
                observations: data.observations || '',
                // As requested: send a single fake URL string instead of an array
                attached_evidences: evidences.length > 0 ? 'https://via.placeholder.com/150' : '',
            })
        );

        const payload = {
            id_service: serviceId,
            id_template: 1,
            evaluator_id: 1,
            evaluation_date: new Date().toISOString().split('T')[0],
            evaluation_time: durationMinutes,
            general_observations: generalObservations,
            details,
        };

        console.log(
            'DEBUG: Payload de Evaluación que se enviará:',
            JSON.stringify(payload, null, 2)
        );

        const result = await registerEvaluation(payload);
        if (result) {
            toastSuccess('Evaluación registrada exitosamente');
            onClose();
        } else {
            toastError(apiError || 'Ocurrió un error al registrar la evaluación');
        }
    };

    const stepCriteria = getCriteriaForStep(currentStep);
    const isLastStep = currentStep === STEPS.length - 1;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-[#121214] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden transform transition-all border border-zinc-200 dark:border-zinc-800">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-8 py-5 bg-zinc-50/50 dark:bg-zinc-900/50">
                    <div>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
                            <ClipboardList className="h-6 w-6 text-indigo-500" />
                            Evaluación de Servicio
                        </h2>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                            Evaluando:{' '}
                            <span className="font-semibold text-indigo-500">{serviceName}</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-600 dark:hover:text-zinc-200 transition-all"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Stepper Progress */}
                <div className="px-8 py-6 border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-[#121214]">
                    <div className="flex items-center justify-between relative">
                        {STEPS.map((step, idx) => {
                            const Icon = step.icon;
                            const isActive = currentStep === idx;
                            const isCompleted = currentStep > idx;

                            return (
                                <div key={idx} className="flex flex-col items-center z-10 flex-1">
                                    <div
                                        className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                                            isActive
                                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-110'
                                                : isCompleted
                                                  ? 'bg-emerald-500 text-white'
                                                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                                        }`}
                                    >
                                        {isCompleted ? (
                                            <Check className="h-5 w-5" />
                                        ) : (
                                            <Icon className="h-5 w-5" />
                                        )}
                                    </div>
                                    <span
                                        className={`text-[10px] font-bold uppercase tracking-wider mt-2 ${
                                            isActive ? 'text-indigo-500' : 'text-zinc-500'
                                        }`}
                                    >
                                        {step.title}
                                    </span>
                                </div>
                            );
                        })}
                        {/* Progress Line */}
                        <div className="absolute top-5 left-0 right-0 h-0.5 bg-zinc-100 dark:bg-zinc-800 -z-10 mx-10">
                            <div
                                className="h-full bg-indigo-500 transition-all duration-500"
                                style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center h-64 relative">
                            <SmartURLoader isMini />
                            <p className="text-zinc-500 animate-pulse relative z-[100000] mt-24">
                                Cargando rúbrica de evaluación...
                            </p>
                        </div>
                    )}

                    {!isLoading && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {currentStep < 3 ? (
                                <>
                                    <div className="mb-6">
                                        <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">
                                            {STEPS[currentStep].title}
                                        </h3>
                                        <p className="text-zinc-500 dark:text-zinc-400">
                                            {STEPS[currentStep].description}
                                        </p>
                                    </div>

                                    <div className="space-y-10">
                                        {stepCriteria.map((criterion) => (
                                            <div key={criterion.id_criterion} className="space-y-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="h-8 w-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
                                                        {criterion.order_index || 1}
                                                    </span>
                                                    <h4 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
                                                        {criterion.name}
                                                    </h4>
                                                </div>

                                                <div className="grid grid-cols-1 gap-3">
                                                    {criterion.levels
                                                        .sort((a, b) => a.score - b.score)
                                                        .map((level) => {
                                                            const isSelected =
                                                                responses[criterion.id_criterion]
                                                                    ?.subcriterionId ===
                                                                level.id_subcriterion;
                                                            return (
                                                                <button
                                                                    key={level.id_subcriterion}
                                                                    onClick={() =>
                                                                        handleScoreSelect(
                                                                            criterion.id_criterion,
                                                                            level.id_subcriterion,
                                                                            level.score
                                                                        )
                                                                    }
                                                                    className={`flex items-start gap-4 p-4 rounded-xl border transition-all duration-200 text-left group ${
                                                                        isSelected
                                                                            ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 ring-1 ring-indigo-500'
                                                                            : 'bg-white dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                                                                    }`}
                                                                >
                                                                    <div
                                                                        className={`mt-1 h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                                                            isSelected
                                                                                ? 'border-indigo-600 bg-indigo-600'
                                                                                : 'border-zinc-300 dark:border-zinc-600'
                                                                        }`}
                                                                    >
                                                                        {isSelected && (
                                                                            <div className="h-1.5 w-1.5 rounded-full bg-white" />
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <span
                                                                                className={`text-sm font-bold ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-600 dark:text-zinc-400'}`}
                                                                            >
                                                                                Puntaje:{' '}
                                                                                {level.score}
                                                                            </span>
                                                                        </div>
                                                                        <p
                                                                            className={`text-sm leading-relaxed ${isSelected ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400'}`}
                                                                        >
                                                                            {level.description}
                                                                        </p>
                                                                    </div>
                                                                </button>
                                                            );
                                                        })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-6">
                                    <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">
                                        Resumen y Evidencias
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500">
                                                Observaciones Generales
                                            </label>
                                            <textarea
                                                value={generalObservations}
                                                onChange={(e) =>
                                                    setGeneralObservations(e.target.value)
                                                }
                                                className="w-full h-40 rounded-xl border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900/50 p-4 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                                placeholder="Escribe aquí las observaciones generales de la evaluación..."
                                            />
                                        </div>

                                        <div className="space-y-4">
                                            <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500">
                                                Evidencias Fotográficas
                                            </label>
                                            <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl p-8 flex flex-col items-center justify-center gap-3 bg-zinc-50/50 dark:bg-zinc-900/20 relative">
                                                <Camera className="h-10 w-10 text-zinc-400" />
                                                <p className="text-sm text-zinc-500 text-center">
                                                    Haz clic para subir fotos o arrastra los
                                                    archivos aquí
                                                </p>
                                                <input
                                                    type="file"
                                                    multiple
                                                    onChange={handleFileUpload}
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                />
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {evidences.map((src, i) => (
                                                        <img
                                                            key={i}
                                                            src={src}
                                                            className="h-12 w-12 rounded-lg object-cover border border-zinc-200"
                                                            alt="evidencia"
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 flex gap-3">
                                        <div className="h-5 w-5 text-amber-500 mt-0.5">
                                            <ShieldCheck />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-amber-900 dark:text-amber-400">
                                                Verificación de datos
                                            </p>
                                            <p className="text-xs text-amber-700 dark:text-amber-500">
                                                Al finalizar la evaluación, el puntaje será
                                                calculado automáticamente y los resultados serán
                                                vinculados permanentemente a este servicio.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800 px-8 py-5 bg-zinc-50/30 dark:bg-zinc-900/30">
                    <button
                        onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                        disabled={currentStep === 0}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                            currentStep === 0
                                ? 'text-zinc-300 dark:text-zinc-700 cursor-not-allowed'
                                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        }`}
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Atrás
                    </button>

                    <div className="flex gap-3">
                        {!isLastStep ? (
                            <button
                                onClick={() =>
                                    setCurrentStep((prev) => Math.min(STEPS.length - 1, prev + 1))
                                }
                                className="flex items-center gap-2 px-8 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all"
                            >
                                Siguiente
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        ) : (
                            <button
                                onClick={handleFinish}
                                className="flex items-center gap-2 px-10 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition-all"
                            >
                                <Save className="h-4 w-4" />
                                Finalizar Evaluación
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EvaluationWizardModal;
