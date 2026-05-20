import { ClipboardCheck, Eye } from 'lucide-react';
import type { TouristService } from '../types/types';
import {
    DataTable,
    DataTableBody,
    DataTableCell,
    DataTableHead,
    DataTableHeadCell,
    DataTableLinkButton,
    DataTableRow,
    DataTableScroll,
    DataTableShell,
    TABLE_BADGE_COLORS,
    TABLE_CHECKBOX_CLASS,
    TableBadge,
} from '../../../components/ui/DataTable';

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
    const allSelected = selectedServices.length === services.length && services.length > 0;

    const toggleAll = () => {
        if (allSelected) {
            services.forEach((s) => onToggle(s.id));
        } else {
            services.forEach((s) => {
                if (!selectedServices.includes(s.id)) onToggle(s.id);
            });
        }
    };

    return (
        <DataTableShell>
            <DataTableScroll>
                <DataTable>
                    <DataTableHead>
                        <tr>
                            <DataTableHeadCell className="w-14">
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    onChange={toggleAll}
                                    className={TABLE_CHECKBOX_CLASS}
                                />
                            </DataTableHeadCell>
                            <DataTableHeadCell>Nombre</DataTableHeadCell>
                            <DataTableHeadCell className="min-w-[220px]">Descripción</DataTableHeadCell>
                            <DataTableHeadCell className="w-36">Tipo</DataTableHeadCell>
                            <DataTableHeadCell className="w-32">Estado</DataTableHeadCell>
                            <DataTableHeadCell className="w-28 text-right">Acciones</DataTableHeadCell>
                        </tr>
                    </DataTableHead>
                    <DataTableBody>
                        {services.map((service, index) => (
                            <DataTableRow key={service.id} index={index}>
                                <DataTableCell className="w-14">
                                    <input
                                        type="checkbox"
                                        checked={selectedServices.includes(service.id)}
                                        onChange={() => onToggle(service.id)}
                                        className={TABLE_CHECKBOX_CLASS}
                                    />
                                </DataTableCell>
                                <DataTableCell>
                                    <DataTableLinkButton onClick={() => onViewDetail(service.id)} title={service.name}>
                                        {service.name}
                                    </DataTableLinkButton>
                                </DataTableCell>
                                <DataTableCell className="min-w-[220px] max-w-md">
                                    <p className="truncate" title={service.description}>
                                        {service.description}
                                    </p>
                                </DataTableCell>
                                <DataTableCell className="w-36">
                                    <TableBadge
                                        text={SERVICE_TYPE_LABELS[service.service_type] ?? service.service_type}
                                        color={TABLE_BADGE_COLORS.sky}
                                    />
                                </DataTableCell>
                                <DataTableCell className="w-32">
                                    <TableBadge
                                        text={service.active ? 'Activo' : 'Inactivo'}
                                        color={service.active ? TABLE_BADGE_COLORS.emerald : TABLE_BADGE_COLORS.rose}
                                    />
                                </DataTableCell>
                                <DataTableCell className="w-28">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => onViewDetail(service.id)}
                                            className="rounded-lg p-1.5 transition-colors hover:bg-violet-500/10"
                                            style={{ color: 'var(--color-text-alt)' }}
                                            title="Ver detalle"
                                        >
                                            <Eye className="size-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onEvaluate(service)}
                                            className="rounded-lg p-1.5 text-emerald-600 transition-colors hover:bg-emerald-500/10 dark:text-emerald-400"
                                            title="Evaluar Servicio"
                                        >
                                            <ClipboardCheck className="size-4" />
                                        </button>
                                    </div>
                                </DataTableCell>
                            </DataTableRow>
                        ))}
                    </DataTableBody>
                </DataTable>
            </DataTableScroll>
        </DataTableShell>
    );
}
