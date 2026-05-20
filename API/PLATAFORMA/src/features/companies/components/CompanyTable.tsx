import type { Company } from '../types/types';
import { useRef } from 'react';
import { motion } from 'framer-motion';

const SECTOR_LABELS: Record<number, string> = {
    1: 'Alojamiento',
    2: 'Alimentos y Bebidas',
    3: 'Transporte Turístico',
    4: 'Agencias de Viaje',
    5: 'Entretenimiento',
};

interface Props {
    companies: Company[];
    selectedCompanies: number[];
    onToggle: (id: number) => void;
    onViewDetail: (id: number) => void;
    sector: number | undefined;
    setSector: (sectorId: number | undefined) => void;
}

export default function CompanyTable({
    companies,
    selectedCompanies,
    onToggle,
    onViewDetail,
    sector,
    setSector,
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
                                selectedCompanies.length === companies.length &&
                                companies.length > 0
                            }
                            onChange={() => {
                                if (selectedCompanies.length === companies.length) {
                                    companies.forEach((c) => onToggle(c.id));
                                } else {
                                    companies.forEach((c) => {
                                        if (!selectedCompanies.includes(c.id)) {
                                            onToggle(c.id);
                                        }
                                    });
                                }
                            }}
                            className="size-4 rounded border-zinc-700 bg-zinc-900 text-violet-500 focus:ring-violet-500 focus:ring-offset-0 cursor-pointer"
                        />
                    </div>
                    <div className="flex-1 min-w-[200px] text-xs font-medium uppercase tracking-wider text-zinc-400">
                        Nombre
                    </div>
                    <div className="flex-[1.5] min-w-[250px] text-xs font-medium uppercase tracking-wider text-zinc-400">
                        Dirección
                    </div>
                    <div className="w-32 flex-shrink-0 text-xs font-medium uppercase tracking-wider text-zinc-400">
                        Teléfono
                    </div>
                    <div className="w-32 flex-shrink-0 text-xs font-medium uppercase tracking-wider text-zinc-400">
                        <div className="flex items-center gap-2">
                            <span>Sector</span>
                            <select
                                value={sector || ''}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setSector(value ? Number(value) : undefined);
                                }}
                                className="border-0 bg-transparent p-0 text-xs font-medium text-zinc-400 focus:ring-0 cursor-pointer hover:text-white transition-colors"
                            >
                                <option value="" className="bg-zinc-900 text-zinc-400">Todos</option>
                                {Object.entries(SECTOR_LABELS).map(([id, label]) => (
                                    <option key={id} value={id} className="bg-zinc-900 text-zinc-400">{label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="w-28 flex-shrink-0 text-xs font-medium uppercase tracking-wider text-zinc-400">
                        Registro
                    </div>
                </div>
            </div>

            <div ref={tableRef} className="flex-1 overflow-y-auto min-h-0">
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {companies.map((company, index) => (
                        <motion.div
                            key={company.id}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className="flex items-center p-4 gap-4 transition-colors hover:bg-zinc-800/50 group"
                        >
                            <div className="w-8 flex-shrink-0">
                                <input
                                    type="checkbox"
                                    checked={selectedCompanies.includes(company.id)}
                                    onChange={() => onToggle(company.id)}
                                    className="size-4 rounded border-zinc-700 bg-zinc-900 text-violet-500 focus:ring-violet-500 focus:ring-offset-0 cursor-pointer"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={() => onViewDetail(company.id)}
                                className="flex-1 min-w-[200px] text-left text-sm text-zinc-300 truncate cursor-pointer hover:text-violet-400 transition-colors"
                                title={company.name}
                            >
                                {company.name}
                            </button>

                            <div
                                className="flex-[1.5] min-w-[250px] text-sm text-zinc-300 truncate"
                                title={company.address}
                            >
                                {company.address}
                            </div>

                            <div className="w-32 flex-shrink-0 text-sm text-zinc-300">
                                {company.phone}
                            </div>

                            <div className="w-32 flex-shrink-0 text-sm text-zinc-400">
                                {SECTOR_LABELS[company.id_sector] ?? 'Sin sector'}
                            </div>

                            <div className="w-28 flex-shrink-0 text-sm text-zinc-400" suppressHydrationWarning>
                                {new Date(company.registration_date).toLocaleDateString('es', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                })}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
        
    );
}
