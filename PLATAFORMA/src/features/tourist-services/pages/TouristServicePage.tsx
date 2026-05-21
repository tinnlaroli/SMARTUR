import { useEffect, useReducer, useState, useMemo } from 'react';
import { useTouristService } from '../hooks/useTouristService';
import Pagination from '../components/Pagination';
import { useSearchParams } from 'react-router-dom';
import CreateTouristServiceModal from '../components/CreateTouristServiceModal';
import TouristServiceDetailModal from '../components/TouristServiceDetailModal';
import TouristServiceTable from '../components/TouristServiceTable';
import SearchInput from '../components/SearchInput';
import { Trash2, ClipboardCheck, Wrench, Plus, AlertCircle } from 'lucide-react';
import { DATA_TABLE_SHELL_CLASS } from '../../../components/ui/DataTable';
import { TableSkeleton } from '../../../components/ui/TableSkeleton';
import EvaluationWizardModal from '../../evaluations/components/EvaluationWizardModal';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getDashboardText } from '../../../shared/i18n/dashboardLocale';

type ModalState = {
    isCreateOpen: boolean; isDetailOpen: boolean;
    isEvaluationOpen: boolean; selectedId: number | null;
};
type ModalAction =
    | { type: 'OPEN_CREATE' } | { type: 'CLOSE_CREATE' }
    | { type: 'OPEN_DETAIL'; id: number } | { type: 'CLOSE_DETAIL' }
    | { type: 'OPEN_EVALUATION' } | { type: 'CLOSE_EVALUATION' };

const modalReducer = (state: ModalState, action: ModalAction): ModalState => {
    switch (action.type) {
        case 'OPEN_CREATE':     return { ...state, isCreateOpen: true };
        case 'CLOSE_CREATE':    return { ...state, isCreateOpen: false };
        case 'OPEN_DETAIL':     return { ...state, isDetailOpen: true, selectedId: action.id };
        case 'CLOSE_DETAIL':    return { ...state, isDetailOpen: false, selectedId: null };
        case 'OPEN_EVALUATION': return { ...state, isEvaluationOpen: true };
        case 'CLOSE_EVALUATION':return { ...state, isEvaluationOpen: false };
        default: return state;
    }
};

export const TouristServicePage = () => {
    const { lang } = useLanguage();
    const m = useMemo(() => getDashboardText(lang).modules, [lang]);
    const {
        services, isLoading, error, totalPages,
        createService, updateService, deleteService,
        search: urlSearch, setSearch: setUrlSearch, fetchServices,
    } = useTouristService();

    const [selectedServices, setSelectedServices] = useState<number[]>([]);
    const [searchParams, setSearchParams] = useSearchParams();
    const page  = Number(searchParams.get('page'))  || 1;
    const limit = Number(searchParams.get('limit')) || 10;
    const [searchTerm, setSearchTerm] = useState(urlSearch);
    const [modalState, dispatchModal] = useReducer(modalReducer, {
        isCreateOpen: false, isDetailOpen: false, isEvaluationOpen: false, selectedId: null,
    });

    useEffect(() => { if (urlSearch !== searchTerm) setSearchTerm(urlSearch); }, [urlSearch]);
    useEffect(() => {
        const t = setTimeout(() => { if (searchTerm !== urlSearch) setUrlSearch(searchTerm); }, 500);
        return () => clearTimeout(t);
    }, [searchTerm, urlSearch, setUrlSearch]);

    const toggleService = (id: number) =>
        setSelectedServices((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);

    const handleDeleteSelected = async () => {
        if (!window.confirm(m.common.confirmDeleteServices(selectedServices.length))) return;
        for (const id of selectedServices) await deleteService(id);
        setSelectedServices([]);
    };

    const isOneServiceSelected = () => selectedServices.length === 1;

    const selectedService = services.find((s) => s.id === selectedServices[0]);
    const selectedServiceName = selectedService?.name || '';
    const selectedServiceType = selectedService?.service_type || '';

    return (
        <div className="relative flex h-[calc(100vh-9rem)] flex-col gap-4 overflow-hidden">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl"
                        style={{ background: 'var(--color-green)' }}>
                        <Wrench className="size-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>
                            {m.touristServices.title}
                        </h1>
                        <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>
                            {m.touristServices.subtitle}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder={m.touristServices.searchPlaceholder} />

                    <AnimatePresence>
                        {selectedServices.length > 0 && (
                            <motion.button
                                key="delete"
                                initial={{ opacity: 0, scale: 0.9, x: 8 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.9, x: 8 }}
                                onClick={handleDeleteSelected}
                                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-500 active:scale-95"
                            >
                                <Trash2 className="size-4" />
                                {m.common.deleteCount(selectedServices.length)}
                            </motion.button>
                        )}
                        {isOneServiceSelected() && (
                            <motion.button
                                key="evaluate"
                                initial={{ opacity: 0, scale: 0.9, x: 8 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.9, x: 8 }}
                                onClick={() => dispatchModal({ type: 'OPEN_EVALUATION' })}
                                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 active:scale-95"
                            >
                                <ClipboardCheck className="size-4" />
                                {m.touristServices.evaluate}
                            </motion.button>
                        )}
                    </AnimatePresence>

                    <button
                        onClick={() => dispatchModal({ type: 'OPEN_CREATE' })}
                        className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 active:scale-95"
                        style={{ background: 'var(--color-green)' }}
                    >
                        <Plus className="size-4" />
                        {m.touristServices.add}
                    </button>
                </div>
            </div>

            {/* Info banner */}
            <div className="rounded-xl border px-5 py-4 flex items-start gap-3 shrink-0" style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}>
                <Wrench className="size-5 mt-0.5 shrink-0" style={{ color: 'var(--color-purple)' }} />
                <div>
                    <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--color-text)' }}>Servicios turísticos</p>
                    <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>Los servicios son las ofertas concretas de cada compañía: hoteles, restaurantes, tours y más. Son los elementos que el turista puede explorar y evaluar en la app.</p>
                </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col">
                {isLoading && (
                    <div className={`${DATA_TABLE_SHELL_CLASS} flex-1`}>
                        <div className="flex-1 overflow-y-auto min-h-0">
                            <TableSkeleton
                                rows={9}
                                colWidths={['w-8', 'flex-1', 'w-40', 'w-28', 'w-24', 'w-20']}
                            />
                        </div>
                    </div>
                )}
                {error && (
                    <div className={`${DATA_TABLE_SHELL_CLASS} flex flex-1 flex-col items-center justify-center gap-3`}>
                        <AlertCircle className="size-8 text-rose-400" />
                        <p className="text-sm font-medium text-rose-500">{error}</p>
                    </div>
                )}
                {!isLoading && !error && (
                    <TouristServiceTable
                        services={services}
                        selectedServices={selectedServices}
                        onToggle={toggleService}
                        onViewDetail={(id) => dispatchModal({ type: 'OPEN_DETAIL', id })}
                        onEvaluate={(service) => {
                            setSelectedServices([service.id]);
                            dispatchModal({ type: 'OPEN_EVALUATION' });
                        }}
                    />
                )}
            </div>

            {!isLoading && !error && services.length > 0 && (
                <Pagination page={page} limit={limit} totalPages={totalPages} setSearchParams={setSearchParams} />
            )}

            {modalState.isCreateOpen && (
                <CreateTouristServiceModal onClose={() => dispatchModal({ type: 'CLOSE_CREATE' })} onSubmit={createService} />
            )}
            {modalState.isDetailOpen && modalState.selectedId && (
                <TouristServiceDetailModal
                    isOpen={modalState.isDetailOpen}
                    onClose={() => dispatchModal({ type: 'CLOSE_DETAIL' })}
                    serviceId={modalState.selectedId}
                    updateService={updateService}
                />
            )}
            {modalState.isEvaluationOpen && selectedServices.length === 1 && (
                <EvaluationWizardModal
                    isOpen={modalState.isEvaluationOpen}
                    onClose={() => { dispatchModal({ type: 'CLOSE_EVALUATION' }); fetchServices(); }}
                    serviceId={selectedServices[0]}
                    serviceName={selectedServiceName}
                    serviceType={selectedServiceType}
                />
            )}
        </div>
    );
};
