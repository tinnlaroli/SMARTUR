import { useState, useMemo } from 'react';
import type { User } from '../types/types';
import {
    DataTable,
    DataTableBody,
    DataTableCell,
    DataTableHead,
    DataTableHeadCell,
    DataTableHeaderSelect,
    DataTableLinkButton,
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
import { useLanguage } from '../../../contexts/LanguageContext';
import { getDashboardText } from '../../../shared/i18n/dashboardLocale';

interface Props {
    users: User[];
    selectedUsers: number[];
    onToggle: (id: number) => void;
    onViewDetail: (id: number) => void;
    role: number | undefined;
    setRole: (roleId: number | undefined) => void;
    isActive: string;
    setIsActive: (value: string) => void;
}

const getInitials = (name?: string | null) =>
    (name || '?')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('');

export default function UserTable({ users, selectedUsers, onToggle, onViewDetail, role, setRole, isActive, setIsActive }: Props) {
    const { lang } = useLanguage();
    const mod = useMemo(() => getDashboardText(lang).modules.modals.users, [lang]);

    const [sort, setSort] = useState<SortState | null>(null);
    const handleSort = (key: string) => setSort(prev => nextSort(prev, key));
    const displayData = useMemo(() => sortRows(users, sort), [users, sort]);
    const allSelected = selectedUsers.length === users.length && users.length > 0;

    const toggleAll = () => {
        if (allSelected) {
            selectedUsers.forEach((id) => onToggle(id));
        } else {
            users.forEach((user) => {
                if (!selectedUsers.includes(user.id)) onToggle(user.id);
            });
        }
    };

    const getRoleBadge = (role_id: number) => {
        if (role_id === 1) return { text: mod.admin,   color: TABLE_BADGE_COLORS.violet  };
        if (role_id === 3) return { text: mod.empresa,  color: TABLE_BADGE_COLORS.amber  };
        return                     { text: mod.user,    color: TABLE_BADGE_COLORS.neutral };
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
                            <DataTableHeadCell className="w-24">{mod.colPhoto}</DataTableHeadCell>
                            <SortableHeadCell sortKey="name"       sort={sort} onSort={handleSort}>{mod.colName}</SortableHeadCell>
                            <SortableHeadCell sortKey="email"      sort={sort} onSort={handleSort}>{mod.colEmail}</SortableHeadCell>
                            <DataTableHeadCell className="w-40">
                                <div className="flex items-center gap-2">
                                    <span>{mod.colRole}</span>
                                    <DataTableHeaderSelect
                                        value={role || ''}
                                        onChange={(value) => setRole(value ? Number(value) : undefined)}
                                    >
                                        <option value="">{mod.filterAll}</option>
                                        <option value="1">{mod.admin}</option>
                                        <option value="2">{mod.user}</option>
                                        <option value="3">{mod.empresa}</option>
                                    </DataTableHeaderSelect>
                                </div>
                            </DataTableHeadCell>
                            <DataTableHeadCell className="w-32">
                                <div className="flex items-center gap-2">
                                    <span>{mod.colStatus}</span>
                                    <DataTableHeaderSelect
                                        value={isActive}
                                        onChange={(value) => setIsActive(value)}
                                    >
                                        <option value="true">{mod.active}</option>
                                        <option value="false">{mod.inactive}</option>
                                        <option value="all">{mod.filterAll}</option>
                                    </DataTableHeaderSelect>
                                </div>
                            </DataTableHeadCell>
                            <SortableHeadCell sortKey="created_at" sort={sort} onSort={handleSort} className="w-36">{mod.colRegistered}</SortableHeadCell>
                        </tr>
                    </DataTableHead>
                    <DataTableBody>
                        {displayData.map((user, index) => {
                            const roleBadge = getRoleBadge(user.role_id);
                            return (
                                <DataTableRow key={user.id} index={index}>
                                    <DataTableCell className="w-14">
                                        <input
                                            type="checkbox"
                                            checked={selectedUsers.includes(user.id)}
                                            onChange={() => onToggle(user.id)}
                                            className={TABLE_CHECKBOX_CLASS}
                                        />
                                    </DataTableCell>
                                    <DataTableCell className="w-24">
                                        {user.photo_url ? (
                                            <img
                                                src={user.photo_url}
                                                alt={user.name}
                                                className="size-10 rounded-full border object-cover"
                                                style={{ borderColor: 'var(--color-border)' }}
                                            />
                                        ) : (
                                            <div
                                                className="flex size-10 items-center justify-center rounded-full text-xs font-bold text-white"
                                                style={{ background: 'var(--color-purple)' }}
                                            >
                                                {getInitials(user.name)}
                                            </div>
                                        )}
                                    </DataTableCell>
                                    <DataTableCell>
                                        <DataTableLinkButton onClick={() => onViewDetail(user.id)} title={user.name}>
                                            {user.name}
                                        </DataTableLinkButton>
                                    </DataTableCell>
                                    <DataTableCell>
                                        <DataTableLinkButton onClick={() => onViewDetail(user.id)} title={user.email}>
                                            {user.email}
                                        </DataTableLinkButton>
                                    </DataTableCell>
                                    <DataTableCell className="w-40">
                                        <TableBadge text={roleBadge.text} color={roleBadge.color} />
                                    </DataTableCell>
                                    <DataTableCell className="w-32">
                                        <TableBadge
                                            text={user.is_active ? mod.active : mod.inactive}
                                            color={user.is_active ? TABLE_BADGE_COLORS.emerald : TABLE_BADGE_COLORS.rose}
                                        />
                                    </DataTableCell>
                                    <DataTableCell className="w-36" suppressHydrationWarning>
                                        {new Date(user.created_at).toLocaleDateString(
                                            lang === 'en' ? 'en-US' : lang === 'fr' ? 'fr-FR' : 'es-MX',
                                            { year: 'numeric', month: '2-digit', day: '2-digit' }
                                        )}
                                    </DataTableCell>
                                </DataTableRow>
                            );
                        })}
                    </DataTableBody>
                </DataTable>
            </DataTableScroll>
        </DataTableShell>
    );
}
