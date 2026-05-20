import { useEffect, useState, useMemo } from 'react';
import { useUser } from '../hooks/useUser';
import Pagination from '../components/Pagination';
import { useSearchParams } from 'react-router-dom';
import CreateUserModal from '../components/CreateUserModal';
import UserDetailModal from '../components/UserDetailModal';
import UserTable from '../components/UserTable';
import SearchInput from '../components/SearchInput';
import { Trash2, UserPlus, Users, AlertCircle, RefreshCw } from 'lucide-react';
import { DATA_TABLE_SHELL_CLASS } from '../../../components/ui/DataTable';
import { TableSkeleton } from '../../../components/ui/TableSkeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getDashboardText } from '../../../shared/i18n/dashboardLocale';

export const UserPage = () => {
    const { lang } = useLanguage();
    const m = useMemo(() => getDashboardText(lang).modules, [lang]);
    const {
        users, isLoading, error, totalPages,
        createUser, updateUser, deleteUser,
        role, setRole,
        search: urlSearch, setSearch: setUrlSearch,
    } = useUser();

    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [searchParams, setSearchParams] = useSearchParams();
    const page  = Number(searchParams.get('page'))  || 1;
    const limit = Number(searchParams.get('limit')) || 10;
    const [searchTerm, setSearchTerm] = useState(urlSearch);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<number | null>(null);

    useEffect(() => { if (urlSearch !== searchTerm) setSearchTerm(urlSearch); }, [urlSearch]);
    useEffect(() => {
        const t = setTimeout(() => { if (searchTerm !== urlSearch) setUrlSearch(searchTerm); }, 500);
        return () => clearTimeout(t);
    }, [searchTerm, urlSearch, setUrlSearch]);

    const toggleUser = (id: number) =>
        setSelectedUsers((prev) => prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]);

    const handleDeleteSelected = async () => {
        if (!window.confirm(m.common.confirmDeleteUsers(selectedUsers.length))) return;
        await Promise.all(selectedUsers.map((id) => deleteUser(id)));
        setSelectedUsers([]);
    };

    return (
        <div className="relative flex h-[calc(100vh-9rem)] flex-col gap-4 overflow-hidden">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl"
                        style={{ background: 'var(--color-purple)' }}>
                        <Users className="size-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>
                            {m.users.title}
                        </h1>
                        <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>
                            {m.users.subtitle}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder={m.users.searchPlaceholder} />

                    <AnimatePresence>
                        {selectedUsers.length > 0 && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.9, x: 8 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.9, x: 8 }}
                                onClick={handleDeleteSelected}
                                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-500 active:scale-95"
                            >
                                <Trash2 className="size-4" />
                                {m.common.deleteCount(selectedUsers.length)}
                            </motion.button>
                        )}
                    </AnimatePresence>

                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 active:scale-95"
                        style={{ background: 'var(--color-purple)' }}
                    >
                        <UserPlus className="size-4" />
                        {m.users.add}
                    </button>
                </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col">
                {isLoading && (
                    <div className={`${DATA_TABLE_SHELL_CLASS} flex-1`}>
                        <div className="flex-1 overflow-y-auto min-h-0">
                            <TableSkeleton
                                rows={9}
                                colWidths={['w-8', 'w-12', 'flex-1', 'flex-1', 'w-28', 'w-24', 'w-28']}
                            />
                        </div>
                    </div>
                )}
                {error && (
                    <div className={`${DATA_TABLE_SHELL_CLASS} flex flex-1 flex-col items-center justify-center gap-3`}>
                        <AlertCircle className="size-8 text-rose-400" />
                        <p className="text-sm font-medium text-rose-500">{error}</p>
                        <button onClick={() => setUrlSearch(urlSearch)} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition nav-item-idle">
                            <RefreshCw className="h-3.5 w-3.5" /> {m.common.retry}
                        </button>
                    </div>
                )}
                {!isLoading && !error && (
                    <UserTable
                        users={users}
                        selectedUsers={selectedUsers}
                        onToggle={toggleUser}
                        onViewDetail={(id) => { setSelectedId(id); setIsDetailModalOpen(true); }}
                        role={role}
                        setRole={setRole}
                    />
                )}
            </div>

            {!isLoading && !error && users.length > 0 && (
                <Pagination page={page} limit={limit} totalPages={totalPages} setSearchParams={setSearchParams} />
            )}

            {isCreateModalOpen && (
                <CreateUserModal onClose={() => setIsCreateModalOpen(false)} onSubmit={createUser} />
            )}
            {isDetailModalOpen && selectedId && (
                <UserDetailModal
                    isOpen={isDetailModalOpen}
                    onClose={() => { setSelectedId(null); setIsDetailModalOpen(false); }}
                    userId={selectedId}
                    updateUser={updateUser}
                />
            )}
        </div>
    );
};
