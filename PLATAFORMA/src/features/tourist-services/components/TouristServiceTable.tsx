import { useRef } from 'react';
import { ClipboardCheck, Eye } from 'lucide-react';
import type { TouristService } from '../types/types';
import { motion } from 'framer-motion';

const SERVICE_TYPE_LABELS: Record<string, string> = {
    restaurant: 'Restaurante',
    hotel: 'Hotel',
    tour: 'Tour',
    transporte: 'Transporte',
    spa: 'Spa',
};

interface Props {
    services: TouristService[];
    selectedServices: number[];
    onToggle: (id: number) => void;
    onViewDetail: (id: number) => void;
    onEvaluate: (service: TouristService) => void;
}

export default function TouristServiceTable({
    services,
    selectedServices,
    onToggle,
    onViewDetail,
    onEvaluate,
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
                                selectedServices.length === services.length && services.length > 0
                            }
                            onChange={() => {
                                if (selectedServices.length === services.length) {
                                    services.forEach((s) => onToggle(s.id));
                                } else {
                                    services.forEach((s) => {
                                        if (!selectedServices.includes(s.id)) onToggle(s.id);
                                    });
                                }
                            }}
                            className="size-4 rounded border-zinc-700 bg-zinc-900 text-violet-500 cursor-pointer"
                        />
                    </div>
                    <div className="flex-1 min-w-[200px] text-xs font-medium uppercase tracking-wider text-zinc-400">
                        Nombre
                    </div>
                    <div className="flex-[1.5] min-w-[250px] text-xs font-medium uppercase tracking-wider text-zinc-400">
                        Descripción
                    </div>
                    <div className="w-32 flex-shrink-0 text-xs font-medium uppercase text-zinc-400">
                        Tipo
                    </div>
                    <div className="w-24 flex-shrink-0 text-xs font-medium uppercase text-zinc-400">
                        Estado
                    </div>
                    <div className="w-24 flex-shrink-0 text-xs font-medium uppercase text-zinc-400 text-right">
                        Acciones
                    </div>
                </div>
            </div>

            <div ref={tableRef} className="flex-1 overflow-y-auto min-h-0">
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {services.map((service, index) => (
                        <motion.div
                            key={service.id}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className="flex items-center p-4 gap-4 hover:bg-zinc-800/50 group transition-colors"
                        >
                            <div className="w-8 flex-shrink-0">
                                <input
                                    type="checkbox"
                                    checked={selectedServices.includes(service.id)}
                                    onChange={() => onToggle(service.id)}
                                    className="size-4 rounded border-zinc-700 bg-zinc-900 text-violet-500 cursor-pointer"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => onViewDetail(service.id)}
                                className="flex-1 min-w-[200px] text-left text-sm text-zinc-300 truncate cursor-pointer hover:text-violet-400"
                            >
                                {service.name}
                            </button>
                            <div className="flex-[1.5] min-w-[250px] text-sm text-zinc-300 truncate">
                                {service.description}
                            </div>
                            <div className="w-32 flex-shrink-0 text-sm text-zinc-400">
                                {SERVICE_TYPE_LABELS[service.service_type] ?? service.service_type}
                            </div>
                            <div className="w-24 flex-shrink-0 text-sm">
                                <span
                                    className={`inline-flex items-center text-xs font-medium ${service.active ? 'text-emerald-400' : 'text-rose-400'}`}
                                >
                                    <span
                                        className={`mr-1.5 h-1.5 w-1.5 rounded-full ${service.active ? 'bg-emerald-400' : 'bg-rose-400'}`}
                                    />
                                    {service.active ? 'Activo' : 'Inactivo'}
                                </span>
                            </div>
                            <div className="w-24 flex-shrink-0 flex justify-end gap-2">
                                <button
                                    onClick={() => onViewDetail(service.id)}
                                    className="p-1.5 text-zinc-400 hover:text-violet-400 hover:bg-violet-500/10 rounded-lg transition-colors"
                                    title="Ver detalle"
                                >
                                    <Eye className="size-4" />
                                </button>
                                <button
                                    onClick={() => onEvaluate(service)}
                                    className="p-1.5 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                    title="Evaluar Servicio"
                                >
                                    <ClipboardCheck className="size-4" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
