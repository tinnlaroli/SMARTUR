import { useEffect, useReducer, useState, useMemo } from 'react';
import { useLocation } from '../hooks/useLocation';
import Pagination from '../components/Pagination';
import { useSearchParams } from 'react-router-dom';
import CreateLocationModal from '../components/CreateLocationModal';
import LocationDetailModal from '../components/LocationDetailModal';
import LocationTable from '../components/LocationTable';
import SearchInput from '../components/SearchInput';
import { Trash2, MapPin, Plus, AlertCircle } from 'lucide-react';
import { TableSkeleton } from '../../../components/ui/TableSkeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getDashboardText } from '../../../shared/i18n/dashboardLocale';

type ModalState = { isCreateOpen: boolean; isDetailOpen: boolean; selectedId: number | null };
type ModalAction =
    | { type: 'OPEN_CREATE' } | { type: 'CLOSE_CREATE' }
    | { type: 'OPEN_DETAIL'; id: number } | { type: 'CLOSE_DETAIL' };

const modalReducer = (state: ModalState, action: ModalAction): ModalState => {
    switch (action.type) {
        case 'OPEN_CREATE':  return { ...state, isCreateOpen: true };
        case 'CLOSE_CREATE': return { ...state, isCreateOpen: false };
        case 'OPEN_DETAIL':  return { ...state, isDetailOpen: true, selectedId: action.id };
        case 'CLOSE_DETAIL': return { ...state, isDetailOpen: false, selectedId: null };
        default: return state;
    }
};

export const LocationPage = () => {
    const { lang } = useLanguage();
    const m = useMemo(() => getDashboardText(lang).modules, [lang]);
    const {
        locations, isLoading, error, totalPages,
        createLocation, updateLocation, deleteLocation,
        search: urlSearch, setSearch: setUrlSearch,
    } = useLocation();

    const [selectedLocations, setSelectedLocations] = useState<number[]>([]);
    const [searchParams, setSearchParams] = useSearchParams();
    const page  = Number(searchParams.get('page'))  || 1;
    const limit = Number(searchParams.get('limit')) || 10;
    const [searchTerm, setSearchTerm] = useState(urlSearch);
    const [modalState, dispatchModal] = useReducer(modalReducer, {
        isCreateOpen: false, isDetailOpen: false, selectedId: null,
    });

    useEffect(() => { if (urlSearch !== searchTerm) setSearchTerm(urlSearch); }, [urlSearch]);
    useEffect(() => {
        const t = setTimeout(() => { if (searchTerm !== urlSearch) setUrlSearch(searchTerm); }, 500);
        return () => clearTimeout(t);
    }, [searchTerm, urlSearch, setUrlSearch]);

    const toggleLocation = (id: number) =>
        setSelectedLocations((prev) => prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]);

    const handleDeleteSelected = async () => {
        if (!window.confirm(m.common.confirmDeleteLocations(selectedLocations.length))) return;
        for (const id of selectedLocations) await deleteLocation(id);
        setSelectedLocations([]);
    };

    return (
        <div className="relative flex h-[calc(100vh-9rem)] flex-col gap-4 overflow-hidden">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl"
                        style={{ background: 'var(--color-orange)' }}>
                        <MapPin className="size-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>
                            {m.locations.title}
                        </h1>
                        <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>
                            {m.locations.subtitle}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder={m.locations.searchPlaceholder} />

                    <AnimatePresence>
                        {selectedLocations.length > 0 && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.9, x: 8 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.9, x: 8 }}
                                onClick={handleDeleteSelected}
                                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-500 active:scale-95"
                            >
                                <Trash2 className="size-4" />
                                {m.common.deleteCount(selectedLocations.length)}
                            </motion.button>
                        )}
                    </AnimatePresence>

                    <button
                        onClick={() => dispatchModal({ type: 'OPEN_CREATE' })}
                        className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 active:scale-95"
                        style={{ background: 'var(--color-orange)' }}
                    >
                        <Plus className="size-4" />
                        {m.locations.add}
                    </button>
                </div>
            </div>

            {/* Table card */}
            <div className="overflow-hidden rounded-2xl border shadow-sm" style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}>
                {isLoading && (
                        <TableSkeleton
                            rows={9}
                            colWidths={['w-5', 'flex-1', 'w-24', 'w-24', 'w-20', 'w-20']}
                        />
                )}
                {error && (
                    <div className="flex h-64 flex-col items-center justify-center gap-3">
                        <AlertCircle className="size-8 text-rose-400" />
                        <p className="text-sm font-medium text-rose-500">{error}</p>
                    </div>
                )}
                {!isLoading && !error && (
                    <div className="h-[calc(100vh-260px)] min-h-[400px]">
                        <LocationTable
                            locations={locations}
                            selectedLocations={selectedLocations}
                            onToggle={toggleLocation}
                            onViewDetail={(id) => dispatchModal({ type: 'OPEN_DETAIL', id })}
                        />
                    </div>
                )}
            </div>

            {!isLoading && !error && locations.length > 0 && (
                <Pagination page={page} limit={limit} totalPages={totalPages} setSearchParams={setSearchParams} />
            )}

            {modalState.isCreateOpen && (
                <CreateLocationModal onClose={() => dispatchModal({ type: 'CLOSE_CREATE' })} onSubmit={createLocation} />
            )}
            {modalState.isDetailOpen && modalState.selectedId && (
                <LocationDetailModal
                    isOpen={modalState.isDetailOpen}
                    onClose={() => dispatchModal({ type: 'CLOSE_DETAIL' })}
                    locationId={modalState.selectedId}
                    updateLocation={updateLocation}
                />
            )}
        </div>
    );
};
