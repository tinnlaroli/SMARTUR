import type { Location } from '../types/types';
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
    TABLE_CHECKBOX_CLASS,
} from '../../../components/ui/DataTable';

interface Props {
    locations: Location[];
    selectedLocations: number[];
    onToggle: (id: number) => void;
    onViewDetail: (id: number) => void;
}

export default function LocationTable({ locations, selectedLocations, onToggle, onViewDetail }: Props) {
    const allSelected = selectedLocations.length === locations.length && locations.length > 0;

    const toggleAll = () => {
        if (allSelected) {
            locations.forEach((l) => onToggle(l.id));
        } else {
            locations.forEach((l) => {
                if (!selectedLocations.includes(l.id)) onToggle(l.id);
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
                            <DataTableHeadCell className="w-36">Estado</DataTableHeadCell>
                            <DataTableHeadCell className="w-40">Municipio</DataTableHeadCell>
                            <DataTableHeadCell className="w-32">Latitud</DataTableHeadCell>
                            <DataTableHeadCell className="w-32">Longitud</DataTableHeadCell>
                        </tr>
                    </DataTableHead>
                    <DataTableBody>
                        {locations.map((loc, index) => (
                            <DataTableRow key={loc.id} index={index}>
                                <DataTableCell className="w-14">
                                    <input
                                        type="checkbox"
                                        checked={selectedLocations.includes(loc.id)}
                                        onChange={() => onToggle(loc.id)}
                                        className={TABLE_CHECKBOX_CLASS}
                                    />
                                </DataTableCell>
                                <DataTableCell>
                                    <DataTableLinkButton onClick={() => onViewDetail(loc.id)} title={loc.name}>
                                        {loc.name}
                                    </DataTableLinkButton>
                                </DataTableCell>
                                <DataTableCell className="w-36">{loc.state}</DataTableCell>
                                <DataTableCell className="w-40">{loc.municipality}</DataTableCell>
                                <DataTableCell className="w-32">{loc.latitude}</DataTableCell>
                                <DataTableCell className="w-32">{loc.longitude}</DataTableCell>
                            </DataTableRow>
                        ))}
                    </DataTableBody>
                </DataTable>
            </DataTableScroll>
        </DataTableShell>
    );
}
