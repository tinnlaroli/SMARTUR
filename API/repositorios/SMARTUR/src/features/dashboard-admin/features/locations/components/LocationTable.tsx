import type { Location } from '../types/types';
import { useRef } from 'react';

interface Props {
    locations: Location[];
    selectedLocations: number[];
    onToggle: (id: number) => void;
    onViewDetail: (id: number) => void;
}

export default function LocationTable({
    locations,
    selectedLocations,
    onToggle,
    onViewDetail,
}: Props) {
    const tableRef = useRef<HTMLDivElement>(null);

    return (
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121214] h-full flex flex-col overflow-hidden">
            <div className="bg-zinc-50 dark:bg-[#18181b] border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center px-4 py-3.5 gap-4">
                    <div className="w-8 flex-shrink-0">
                        <input
                            type="checkbox"
                            checked={
                                selectedLocations.length === locations.length &&
                                locations.length > 0
                            }
                            onChange={() => {
                                if (selectedLocations.length === locations.length) {
                                    locations.forEach((l) => onToggle(l.id));
                                } else {
                                    locations.forEach((l) => {
                                        if (!selectedLocations.includes(l.id)) onToggle(l.id);
                                    });
                                }
                            }}
                            className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-indigo-500 cursor-pointer"
                        />
                    </div>
                    <div className="w-16 flex-shrink-0 text-xs font-medium uppercase text-zinc-400">
                        ID
                    </div>
                    <div className="flex-1 min-w-[200px] text-xs font-medium uppercase text-zinc-400">
                        Nombre
                    </div>
                    <div className="w-32 flex-shrink-0 text-xs font-medium uppercase text-zinc-400">
                        Estado
                    </div>
                    <div className="w-32 flex-shrink-0 text-xs font-medium uppercase text-zinc-400">
                        Municipio
                    </div>
                    <div className="w-24 flex-shrink-0 text-xs font-medium uppercase text-zinc-400">
                        Latitud
                    </div>
                    <div className="w-24 flex-shrink-0 text-xs font-medium uppercase text-zinc-400">
                        Longitud
                    </div>
                </div>
            </div>

            <div ref={tableRef} className="flex-1 overflow-y-auto min-h-0">
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {locations.map((loc) => (
                        <div
                            key={loc.id}
                            className="flex items-center px-4 py-4 gap-4 hover:bg-zinc-800/50 transition-colors"
                        >
                            <div className="w-8 flex-shrink-0">
                                <input
                                    type="checkbox"
                                    checked={selectedLocations.includes(loc.id)}
                                    onChange={() => onToggle(loc.id)}
                                    className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-indigo-500 cursor-pointer"
                                />
                            </div>
                            <div className="w-16 flex-shrink-0 text-sm font-medium text-zinc-100">
                                {loc.id}
                            </div>
                            <div
                                onClick={() => onViewDetail(loc.id)}
                                className="flex-1 min-w-[200px] text-sm text-zinc-300 truncate cursor-pointer hover:text-indigo-400"
                            >
                                {loc.name}
                            </div>
                            <div className="w-32 flex-shrink-0 text-sm text-zinc-400">
                                {loc.state}
                            </div>
                            <div className="w-32 flex-shrink-0 text-sm text-zinc-400">
                                {loc.municipality}
                            </div>
                            <div className="w-24 flex-shrink-0 text-sm text-zinc-500">
                                {loc.latitude}
                            </div>
                            <div className="w-24 flex-shrink-0 text-sm text-zinc-500">
                                {loc.longitude}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
