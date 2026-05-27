import { useMemo, useState } from 'react';
import type { EmpresaService } from '../api/empresaApi';
import {
    DataTable,
    DataTableBody,
    DataTableCell,
    DataTableHead,
    DataTableHeadCell,
    DataTableHeaderSelect,
    DataTableRow,
    DataTableScroll,
    DataTableShell,
    SortableHeadCell,
    TABLE_BADGE_COLORS,
    TABLE_CHECKBOX_CLASS,
    TableBadge,
    nextSort,
    sortRows,
    type SortState,
} from '../../../components/ui/DataTable';

interface EmpresaServiceTableProps {
    services: EmpresaService[];
    selectedServices: number[];
    onToggle: (id: number) => void;
    onViewDetail: (id: number) => void;
    serviceTypes: string[];
}

export default function EmpresaServiceTable({
    services,
    selectedServices,
    onToggle,
    onViewDetail,
    serviceTypes,
}: EmpresaServiceTableProps) {
    const [sort, setSort] = useState<SortState | null>(null);
    const [typeFilter, setTypeFilter] = useState('');
    const handleSort = (key: string) => setSort((prev) => nextSort(prev, key));

    const displayData = useMemo(
        () =>
            sortRows(
                services.filter((s) => !typeFilter || s.service_type === typeFilter),
                sort,
            ),
        [services, sort, typeFilter],
    );

    const allSelected = selectedServices.length === services.length && services.length > 0;

    const toggleAll = () => {
        if (allSelected) {
            services.forEach((s) => onToggle(s.id_service));
        } else {
            services.forEach((s) => {
                if (!selectedServices.includes(s.id_service)) onToggle(s.id_service);
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
                            <SortableHeadCell sortKey="name" sort={sort} onSort={handleSort}>
                                Nombre
                            </SortableHeadCell>
                            <DataTableHeadCell className="min-w-[220px]">Descripción</DataTableHeadCell>
                            <DataTableHeadCell className="w-36">
                                <div className="flex items-center gap-2">
                                    <span>Tipo</span>
                                    <DataTableHeaderSelect value={typeFilter} onChange={setTypeFilter}>
                                        <option value="">Todos</option>
                                        {serviceTypes.map((type) => (
                                            <option key={type} value={type}>
                                                {type}
                                            </option>
                                        ))}
                                    </DataTableHeaderSelect>
                                </div>
                            </DataTableHeadCell>
                            <DataTableHeadCell className="w-32">Estado</DataTableHeadCell>
                        </tr>
                    </DataTableHead>
                    <DataTableBody>
                        {displayData.map((service, index) => (
                            <DataTableRow
                                key={service.id_service}
                                index={index}
                                className="cursor-pointer"
                                onClick={() => onViewDetail(service.id_service)}
                            >
                                <DataTableCell className="w-14" onClick={(e) => e.stopPropagation()}>
                                    <input
                                        type="checkbox"
                                        checked={selectedServices.includes(service.id_service)}
                                        onChange={() => onToggle(service.id_service)}
                                        className={TABLE_CHECKBOX_CLASS}
                                    />
                                </DataTableCell>
                                <DataTableCell>
                                    <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                                        {service.name}
                                    </span>
                                </DataTableCell>
                                <DataTableCell className="min-w-[220px] max-w-md">
                                    <p className="truncate" title={service.description ?? undefined}>
                                        {service.description || '—'}
                                    </p>
                                </DataTableCell>
                                <DataTableCell className="w-36">
                                    <TableBadge
                                        text={service.service_type || '—'}
                                        color={TABLE_BADGE_COLORS.sky}
                                    />
                                </DataTableCell>
                                <DataTableCell className="w-32">
                                    <TableBadge
                                        text={service.active ? 'Activo' : 'Inactivo'}
                                        color={service.active ? TABLE_BADGE_COLORS.emerald : TABLE_BADGE_COLORS.rose}
                                    />
                                </DataTableCell>
                            </DataTableRow>
                        ))}
                    </DataTableBody>
                </DataTable>
            </DataTableScroll>
        </DataTableShell>
    );
}
