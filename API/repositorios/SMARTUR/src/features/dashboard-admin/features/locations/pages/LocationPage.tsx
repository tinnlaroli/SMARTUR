import { useEffect, useState } from 'react';
import { useLocation } from '../hooks/useLocation';
import Pagination from '../components/Pagination';
import { useSearchParams } from 'react-router-dom';
import CreateLocationModal from '../components/CreateLocationModal';
import LocationDetailModal from '../components/LocationDetailModal';
import LocationTable from '../components/LocationTable';
import SearchInput from '../components/SearchInput';
import { Trash2 } from 'lucide-react';

export const LocationPage = () => {
    const {
        locations,
        isLoading,
        error,
        totalPages,
        createLocation,
        updateLocation,
        deleteLocation,
        search: urlSearch,
        setSearch: setUrlSearch,
    } = useLocation();

    const [selectedLocations, setSelectedLocations] = useState<number[]>([]);
    const [searchParams, setSearchParams] = useSearchParams();
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 10;

    const [searchTerm, setSearchTerm] = useState(urlSearch);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<number | null>(null);

    useEffect(() => {
        if (urlSearch !== searchTerm) setSearchTerm(urlSearch);
    }, [urlSearch]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm !== urlSearch) setUrlSearch(searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, urlSearch, setUrlSearch]);

    const toggleLocation = (id: number) => {
        setSelectedLocations((prev) =>
            prev.includes(id) ? prev.filter((locId) => locId !== id) : [...prev, id]
        );
    };

    const handleDeleteSelected = async () => {
        if (
            window.confirm(
                `¿Estás seguro de que deseas eliminar ${selectedLocations.length} ubicaciones?`
            )
        ) {
            for (const id of selectedLocations) await deleteLocation(id);
            setSelectedLocations([]);
        }
    };

    return (
        <div className="space-y-4">
            <div className="sm:flex sm:items-center sm:justify-between">
                <div className="sm:flex-auto">
                    <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                        Ubicaciones
                    </h1>
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                        Lista de ubicaciones registradas
                    </p>
                </div>
                <div className="mt-4 sm:mt-0 sm:flex sm:items-center sm:gap-3">
                    <SearchInput value={searchTerm} onChange={setSearchTerm} />
                    {selectedLocations.length > 0 && (
                        <button
                            onClick={handleDeleteSelected}
                            className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition-all"
                        >
                            <Trash2 className="h-4 w-4" />
                            <span>Eliminar ({selectedLocations.length})</span>
                        </button>
                    )}
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 whitespace-nowrap"
                    >
                        Agregar ubicación
                    </button>
                </div>
            </div>

            <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-[#121214] shadow-sm flex flex-col min-h-0">
                {isLoading && (
                    <div className="flex justify-center items-center h-96">
                        <p className="text-zinc-600 dark:text-zinc-400 font-medium">Cargando...</p>
                    </div>
                )}
                {error && (
                    <div className="flex justify-center items-center h-96 font-medium">
                        <p className="text-red-600 dark:text-red-400">Error: {error}</p>
                    </div>
                )}
                {!isLoading && !error && (
                    <div className="h-[calc(100vh-260px)] min-h-[400px]">
                        <LocationTable
                            locations={locations}
                            selectedLocations={selectedLocations}
                            onToggle={toggleLocation}
                            onViewDetail={(id) => {
                                setSelectedId(id);
                                setIsDetailModalOpen(true);
                            }}
                        />
                    </div>
                )}
            </div>

            {!isLoading && !error && locations.length > 0 && (
                <div className="w-full">
                    <Pagination
                        page={page}
                        limit={limit}
                        totalPages={totalPages}
                        setSearchParams={setSearchParams}
                    />
                </div>
            )}

            {isCreateModalOpen && (
                <CreateLocationModal
                    onClose={() => setIsCreateModalOpen(false)}
                    onSubmit={createLocation}
                />
            )}
            {isDetailModalOpen && selectedId && (
                <LocationDetailModal
                    isOpen={isDetailModalOpen}
                    onClose={() => {
                        setSelectedId(null);
                        setIsDetailModalOpen(false);
                    }}
                    locationId={selectedId}
                    updateLocation={updateLocation}
                />
            )}
        </div>
    );
};
