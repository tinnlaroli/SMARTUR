import { useEffect, useReducer, useState, useMemo } from 'react';
import { useLocation } from '../hooks/useLocation';
import Pagination from '../components/Pagination';
import { useSearchParams } from 'react-router-dom';
import CreateLocationModal from '../components/CreateLocationModal';
import LocationDetailModal from '../components/LocationDetailModal';
import LocationTable from '../components/LocationTable';
import SearchInput from '../components/SearchInput';
import { MapPin, Plus, AlertCircle } from 'lucide-react';
import { DATA_TABLE_SHELL_CLASS } from '../../../components/ui/DataTable';
import { TableSkeleton } from '../../../components/ui/TableSkeleton';
import { SelectionBar } from '../../../components/ui/SelectionBar';
import { useConfirm } from '../../../components/ui/ConfirmModal';
import { MODULE_COLORS } from '../../../shared/config/moduleColors';
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
    const { confirm, modal: confirmModal } = useConfirm();

    useEffect(() => { if (urlSearch !== searchTerm) setSearchTerm(urlSearch); }, [urlSearch]);
    useEffect(() => {
        const t = setTimeout(() => { if (searchTerm !== urlSearch) setUrlSearch(searchTerm); }, 500);
        return () => clearTimeout(t);
    }, [searchTerm, urlSearch, setUrlSearch]);

    const toggleLocation = (id: number) =>
        setSelectedLocations((prev) => prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]);

    const handleDeleteSelected = async () => {
        const ok = await confirm({
            title: m.common.confirmDeleteLocations(selectedLocations.length),
            message: `Se eliminarán ${selectedLocations.length} ubicación(es) de forma permanente.`,
            confirmLabel: 'Eliminar',
            variant: 'danger',
        });
        if (!ok) return;
        for (const id of selectedLocations) await deleteLocation(id);
        setSelectedLocations([]);
    };

    return (
        <div className="relative flex h-[calc(100vh-9rem)] flex-col gap-4 overflow-hidden">
            {confirmModal}
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4 shrink-0">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>
                        {m.locations.title}
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>
                        {m.locations.subtitle}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder={m.locations.searchPlaceholder} />
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

            <SelectionBar
                count={selectedLocations.length}
                onDelete={handleDeleteSelected}
                onClear={() => setSelectedLocations([])}
            />

            {/* Info banner */}
            <div className="rounded-xl border px-5 py-4 flex items-start gap-3 shrink-0" style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}>
                <MapPin className="size-5 mt-0.5 shrink-0" style={{ color: MODULE_COLORS.locations }} />
                <div>
                    <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--color-text)' }}>Ubicaciones</p>
                    <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>Define los municipios y zonas geográficas de la región. Las ubicaciones agrupan los servicios y POIs para que el motor de recomendaciones los contextualice correctamente.</p>
                </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col">
                {isLoading && (
                    <div className={`${DATA_TABLE_SHELL_CLASS} flex-1`}>
                        <div className="flex-1 overflow-y-auto min-h-0">
                            <TableSkeleton
                                rows={9}
                                colWidths={['w-8', 'flex-1', 'w-28', 'w-32', 'w-24', 'w-24']}
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
                    <LocationTable
                        locations={locations}
                        selectedLocations={selectedLocations}
                        onToggle={toggleLocation}
                        onViewDetail={(id) => dispatchModal({ type: 'OPEN_DETAIL', id })}
                    />
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
