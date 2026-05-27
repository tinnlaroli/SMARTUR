import { useState, useMemo } from 'react';
import type { TouristService } from '../types/types';
import { useLanguage } from '../../../contexts/LanguageContext';
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
} from '../../../components/ui/DataTable';
import type { SortState } from '../../../components/ui/DataTable';

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
}

export default function TouristServiceTable({
    services,
    selectedServices,
    onToggle,
    onViewDetail,
}: Props) {
    const { t } = useLanguage();
    const [sort, setSort] = useState<SortState | null>(null);
    const [typeFilter, setTypeFilter] = useState('');
    const handleSort = (key: string) => setSort(prev => nextSort(prev, key));
    const displayData = useMemo(() => sortRows(services.filter(s => !typeFilter || s.service_type === typeFilter), sort), [services, sort, typeFilter]);
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
                            <SortableHeadCell sortKey="name" sort={sort} onSort={handleSort}>{t('tableHeader.name')}</SortableHeadCell>
                            <DataTableHeadCell className="min-w-[220px]">{t('tableHeader.description')}</DataTableHeadCell>
                            <DataTableHeadCell className="w-36">
                                <div className="flex items-center gap-2">
                                    <span>{t('tableHeader.type')}</span>
                                    <DataTableHeaderSelect value={typeFilter} onChange={setTypeFilter}>
                                        <option value="">{t('filter.all')}</option>
                                        {Object.entries(SERVICE_TYPE_LABELS).map(([id, label]) => (
                                            <option key={id} value={id}>{label}</option>
                                        ))}
                                    </DataTableHeaderSelect>
                                </div>
                            </DataTableHeadCell>
                            <DataTableHeadCell className="w-32">{t('tableHeader.status')}</DataTableHeadCell>
                        </tr>
                    </DataTableHead>
                    <DataTableBody>
                        {displayData.map((service, index) => (
                            <DataTableRow key={service.id} index={index} className="cursor-pointer" onClick={() => onViewDetail(service.id)}>
                                <DataTableCell className="w-14" onClick={(e) => e.stopPropagation()}>
                                    <input
                                        type="checkbox"
                                        checked={selectedServices.includes(service.id)}
                                        onChange={() => onToggle(service.id)}
                                        className={TABLE_CHECKBOX_CLASS}
                                    />
                                </DataTableCell>
                                <DataTableCell>
                                    <span className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>
                                        {service.name}
                                    </span>
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
                                        text={service.active ? t('status.active') : t('status.inactive')}
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
