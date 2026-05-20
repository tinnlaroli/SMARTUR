import { useEffect, useState } from 'react';
import { useUser } from '../hooks/useUser';
import Pagination from '../components/Pagination';
import { useSearchParams } from 'react-router-dom';
import CreateUserModal from '../components/CreateUserModal';
import UserDetailModal from '../components/UserDetailModal';
import UserTable from '../components/UserTable';
import SearchInput from '../components/SearchInput';
import { Trash2 } from 'lucide-react';
export const UserPage = () => {
    const {
        users,
        isLoading,
        error,
        totalPages,
        createUser,
        updateUser,
        deleteUser,
        role,
        setRole,
        search: urlSearch,
        setSearch: setUrlSearch,
    } = useUser();

    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [searchParams, setSearchParams] = useSearchParams();
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 10;

    const [searchTerm, setSearchTerm] = useState(urlSearch);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<number | null>(null);

    useEffect(() => {
        if (urlSearch !== searchTerm) {
            setSearchTerm(urlSearch);
        }
    }, [urlSearch]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm !== urlSearch) {
                setUrlSearch(searchTerm);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm, urlSearch, setUrlSearch]);

    const toggleUser = (id: number) => {
        setSelectedUsers((prev) =>
            prev.includes(id) ? prev.filter((userId) => userId !== id) : [...prev, id]
        );
    };
    const handleDeleteSelected = async () => {
        if (
            window.confirm(`¿Estás seguro de que deseas eliminar ${selectedUsers.length} usuarios?`)
        ) {
            // Ejecutamos las eliminaciones
            for (const id of selectedUsers) {
                await deleteUser(id);
            }
            setSelectedUsers([]); // Limpiar selección tras borrar
        }
    };
    return (
        <div className="space-y-4">
            <div className="sm:flex sm:items-center sm:justify-between">
                <div className="sm:flex-auto">
                    <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                        Administrador de usuarios
                    </h1>
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                        Lista de usuarios registrados en el sistema
                    </p>
                </div>

                <div className="mt-4 sm:mt-0 sm:flex sm:items-center sm:gap-3">
                    <SearchInput value={searchTerm} onChange={setSearchTerm} />

                    {selectedUsers.length > 0 && (
                        <button
                            onClick={handleDeleteSelected}
                            disabled={selectedUsers.some(
                                (id) => !users.find((u) => u.id === id)?.is_active
                            )}
                            className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all animate-in fade-in slide-in-from-right-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-zinc-700"
                        >
                            <Trash2 className="h-4 w-4" />
                            <span>Eliminar ({selectedUsers.length})</span>
                        </button>
                    )}

                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-indigo-500 dark:hover:bg-indigo-400 whitespace-nowrap"
                    >
                        Agregar usuario
                    </button>
                </div>
            </div>
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-[#121214] shadow-sm flex flex-col min-h-0">
                {isLoading && (
                    <div className="flex justify-center items-center h-64">
                        <p className="text-zinc-600 dark:text-zinc-400">Cargando...</p>
                    </div>
                )}

                {error && (
                    <div className="flex justify-center items-center h-64">
                        <p className="text-red-600 dark:text-red-400 font-medium">Error: {error}</p>
                    </div>
                )}

                {!isLoading && !error && (
                    <div className="h-[calc(100vh-260px)] min-h-[400px]">
                        <UserTable
                            users={users}
                            selectedUsers={selectedUsers}
                            onToggle={toggleUser}
                            onViewDetail={(id) => {
                                setSelectedId(id);
                                setIsDetailModalOpen(true);
                            }}
                            role={role}
                            setRole={setRole}
                        />
                    </div>
                )}
            </div>

            {!isLoading && !error && users.length > 0 && (
                <div className="w-full">
                    <Pagination
                        page={page}
                        limit={limit}
                        totalPages={totalPages}
                        setSearchParams={setSearchParams}
                    />
                </div>
            )}

            {isCreateModalOpen && (
                <CreateUserModal
                    onClose={() => setIsCreateModalOpen(false)}
                    onSubmit={createUser}
                />
            )}

            {isDetailModalOpen && selectedId && (
                <UserDetailModal
                    isOpen={isDetailModalOpen}
                    onClose={() => {
                        setSelectedId(null);
                        setIsDetailModalOpen(false);
                    }}
                    userId={selectedId}
                    updateUser={updateUser}
                />
            )}
        </div>
    );
};
