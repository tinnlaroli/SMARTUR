import { useEffect, useState } from 'react';
import { useTouristService } from '../hooks/useTouristService';
import { UserPen, X, Wrench, Building2, MapPin, Tag, Activity, Award } from 'lucide-react';
import EditTouristServiceModal from './EditTouristServiceModal';
import type { UpdateTouristServiceDTO } from '../types/types';
import EvaluationResultModal from '../../evaluations/components/EvaluationResultModal';
import SmartURLoader from '../../../../../components/ui/SmartURLoader';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    serviceId: number | null;
    updateService: (id: number, data: UpdateTouristServiceDTO) => Promise<boolean | undefined>;
}

const TouristServiceDetailModal: React.FC<Props> = ({
    isOpen,
    onClose,
    serviceId,
    updateService,
}) => {
    const { service, isLoading, error, findById } = useTouristService();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isResultModalOpen, setIsResultModalOpen] = useState(false);
    const [evaluationId, setEvaluationId] = useState<number | null>(null);

    useEffect(() => {
        if (serviceId && isOpen) {
            findById(serviceId);
        }
    }, [serviceId, isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#121214] rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                        <Wrench className="h-5 w-5 text-indigo-500" />
                        Detalle del Servicio
                    </h2>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6">
                    {isLoading && (
                        <div className="flex justify-center py-8 relative min-h-[160px]">
                            <SmartURLoader isMini />
                        </div>
                    )}

                    {error && (
                        <div className="rounded-lg bg-rose-50 p-4 dark:bg-rose-900/20">
                            <p className="text-sm text-rose-800 dark:text-rose-300 font-medium">
                                {error}
                            </p>
                        </div>
                    )}

                    {service && !isLoading && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                                <div className="h-12 w-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                    <Tag className="h-6 w-6" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3
                                        className="text-base font-bold text-zinc-900 dark:text-zinc-100 truncate"
                                        title={service.name}
                                    >
                                        {service.name}
                                    </h3>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-500 flex items-center gap-2">
                                        Servicio ID: {service.id}
                                        {service.total_score !== undefined &&
                                            service.total_score !== null && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold text-indigo-500 border border-indigo-500/20">
                                                    <Award className="h-3 w-3" />
                                                    Puntaje:{' '}
                                                    {Number(service.total_score).toFixed(1)}
                                                </span>
                                            )}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-y-5 gap-x-4">
                                <div className="col-span-2">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 flex items-center gap-1.5 mb-1.5">
                                        Descripción
                                    </span>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400 bg-zinc-50/50 dark:bg-zinc-800/30 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800/50 leading-relaxed italic">
                                        "{service.description || 'Sin descripción disponible'}"
                                    </p>
                                </div>

                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 flex items-center gap-1.5 mb-1.5">
                                        Tipo
                                    </span>
                                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-200 capitalize">
                                        {service.service_type}
                                    </p>
                                </div>

                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 flex items-center gap-1.5 mb-1.5">
                                        <Activity className="h-3 w-3" />
                                        Estado
                                    </span>
                                    <div>
                                        <span
                                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                                service.active
                                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                    : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400'
                                            }`}
                                        >
                                            {service.active ? 'ACTIVO' : 'INACTIVO'}
                                        </span>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 flex items-center gap-1.5 mb-1.5">
                                        <Building2 className="h-3 w-3" />
                                        Compañía
                                    </span>
                                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                                        ID {service.id_company}
                                    </p>
                                </div>

                                <div className="pt-2">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 flex items-center gap-1.5 mb-1.5">
                                        <MapPin className="h-3 w-3" />
                                        Ubicación
                                    </span>
                                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                                        ID {service.id_location}
                                    </p>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
                                {service.id_evaluation && (
                                    <button
                                        onClick={() => {
                                            setEvaluationId(service.id_evaluation!);
                                            setIsResultModalOpen(true);
                                        }}
                                        className="w-full inline-flex items-center justify-center gap-2 
                                        rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white
                                        hover:bg-emerald-700 shadow-sm transition-all duration-200 active:scale-[0.98] font-bold"
                                    >
                                        <Activity className="h-4 w-4" />
                                        <span>Ver Resultados de Evaluación</span>
                                    </button>
                                )}

                                <button
                                    onClick={() => setIsEditModalOpen(true)}
                                    className="w-full inline-flex items-center justify-center gap-2 
                                    rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white
                                    hover:bg-indigo-700 shadow-sm transition-all duration-200 active:scale-[0.98]"
                                >
                                    <UserPen className="h-4 w-4" />
                                    <span>Editar servicio</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {isEditModalOpen && service && (
                <EditTouristServiceModal
                    onClose={() => setIsEditModalOpen(false)}
                    onSubmit={updateService}
                    service={service}
                />
            )}
            {isResultModalOpen && evaluationId && (
                <EvaluationResultModal
                    isOpen={isResultModalOpen}
                    onClose={() => setIsResultModalOpen(false)}
                    evaluationId={evaluationId}
                />
            )}
        </div>
    );
};

export default TouristServiceDetailModal;
