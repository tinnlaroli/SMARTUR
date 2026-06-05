import { useEffect, useMemo, useState } from 'react';
import { useLocation } from '../hooks/useLocation';
import { UserPen, X, MapPin } from 'lucide-react';
import EditLocationModal from './EditLocationModal';
import type { UpdateLocationDTO } from '../types/types';
import MapPicker from '../../../components/ui/MapPicker';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getDashboardText } from '../../../shared/i18n/dashboardLocale';
import { useEscapeKey } from '../../../shared/hooks/useEscapeKey';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    locationId: number | null;
    updateLocation: (id: number, data: UpdateLocationDTO) => Promise<boolean | undefined>;
}

const LocationDetailModal: React.FC<Props> = ({ isOpen, onClose, locationId, updateLocation }) => {
    const { location, isLoading, error, findById } = useLocation();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const { lang } = useLanguage();
    const mod = useMemo(() => getDashboardText(lang).modules.modals, [lang]);

    useEffect(() => {
        if (locationId && isOpen) {
    useEscapeKey(onClose);
            findById(locationId);
        }
    }, [locationId, isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#121214] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                        <MapPin className="size-5 text-violet-500" />
                        {mod.locations.detailTitle}
                    </h2>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                <div className="p-6">
                    {isLoading && (
                        <div className="flex justify-center py-8">
                            <div className="size-8 animate-spin rounded-full border-4 border-zinc-200 border-t-violet-600 dark:border-zinc-700 dark:border-t-violet-500"></div>
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
                                        {mod.locations.name}
                                    </span>
                                    <p className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-100">
                                        {location.name}
                                    </p>
                                </div>

                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-500">
                                        {mod.locations.state}
                                    </span>
                                    <p className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
                                        {location.state}
                                    </p>
                                </div>

                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-500">
                                        {mod.locations.municipality}
                                    </span>
                                    <p className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
                                        {location.municipality || mod.common.notApplicable}
                                    </p>
                                </div>

                                <div className="col-span-2">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-500">
                                        {mod.locations.map}
                                    </span>
                                    <div className="mt-2 h-48 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 shadow-sm pointer-events-none">
                                        <MapPicker
                                            lat={parseFloat(location.latitude ?? '0')}
                                            lng={parseFloat(location.longitude ?? '0')}
                                            onChange={() => {}}
                                        />
                                    </div>
                                    <p className="mt-1.5 text-xs font-mono text-zinc-400 dark:text-zinc-500">
                                        {location.latitude}, {location.longitude}
                                    </p>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800">
                                <button
                                    onClick={() => setIsEditModalOpen(true)}
                                    className="w-full inline-flex items-center justify-center gap-2 
                                    rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white
                                    hover:bg-violet-700 shadow-sm transition-all duration-200 active:scale-[0.98]"
                                >
                                    <UserPen className="size-4" />
                                    <span>{mod.locations.editLocation}</span>
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
