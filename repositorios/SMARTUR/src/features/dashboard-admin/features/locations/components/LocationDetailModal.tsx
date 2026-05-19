import { useEffect, useState } from 'react';
import { useLocation } from '../hooks/useLocation';
import { UserPen, X, MapPin } from 'lucide-react';
import EditLocationModal from './EditLocationModal';
import type { UpdateLocationDTO } from '../types/types';
import SmartURLoader from '../../../../../components/ui/SmartURLoader';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    locationId: number | null;
    updateLocation: (id: number, data: UpdateLocationDTO) => Promise<boolean | undefined>;
}

const LocationDetailModal: React.FC<Props> = ({ isOpen, onClose, locationId, updateLocation }) => {
    const { location, isLoading, error, findById } = useLocation();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    useEffect(() => {
        if (locationId && isOpen) {
            findById(locationId);
        }
    }, [locationId, isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#121214] rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-indigo-500" />
                        Detalle de Ubicación
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

                    {location && !isLoading && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                                <div className="col-span-2">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-500">
                                        Nombre
                                    </span>
                                    <p className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-100">
                                        {location.name}
                                    </p>
                                </div>

                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-500">
                                        Estado
                                    </span>
                                    <p className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
                                        {location.state}
                                    </p>
                                </div>

                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-500">
                                        Municipio
                                    </span>
                                    <p className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
                                        {location.municipality || 'N/A'}
                                    </p>
                                </div>

                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-500">
                                        Latitud
                                    </span>
                                    <p className="mt-1 text-sm font-mono text-zinc-900 dark:text-zinc-300">
                                        {location.latitude}
                                    </p>
                                </div>

                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-500">
                                        Longitud
                                    </span>
                                    <p className="mt-1 text-sm font-mono text-zinc-900 dark:text-zinc-300">
                                        {location.longitude}
                                    </p>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800">
                                <button
                                    onClick={() => setIsEditModalOpen(true)}
                                    className="w-full inline-flex items-center justify-center gap-2 
                                    rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white
                                    hover:bg-indigo-700 shadow-sm transition-all duration-200 active:scale-[0.98]"
                                >
                                    <UserPen className="h-4 w-4" />
                                    <span>Editar ubicación</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {isEditModalOpen && location && (
                <EditLocationModal
                    onClose={() => setIsEditModalOpen(false)}
                    onSubmit={updateLocation}
                    location={location}
                />
            )}
        </div>
    );
};

export default LocationDetailModal;
