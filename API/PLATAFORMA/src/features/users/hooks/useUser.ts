import { useCallback, useEffect, useState } from 'react';
import type { CreateUserDTO, User, UpdateUserDTO } from '../types/types';
import { useSearchParams } from 'react-router-dom';
import { userServices } from '../api/userApi';
import axios from 'axios';
import { useToast } from '../../../shared/context/ToastContext';
export function useUser() {
    const toast = useToast();
    const [users, setUsers] = useState<User[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [totalPages, setTotalPages] = useState(1);

    const [searchParams, setSearchParams] = useSearchParams();

    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    const roleParam = searchParams.get('role');
    const role = roleParam ? Number(roleParam) : undefined;

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const data = await userServices.findAll(page, limit, search, role);

            setUsers(data.users);
            setTotalPages(data.totalPages);
        } catch (error: any) {
            toast.error('Error al cargar usuarios');
        } finally {
            setIsLoading(false);
        }
    }, [page, limit, search, role]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const findById = async (id: number) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await userServices.findById(id);
            setUser(data.user);
        } catch (error: any) {
            setError(error.message || 'Error al cargar usuario');
        } finally {
            setIsLoading(false);
        }
    };

    const createUser = async (data: CreateUserDTO) => {
        setIsLoading(true);
        try {
            await userServices.create(data);
            await fetchUsers();
            toast.success('User created successfully', 'Changes saved');
            return true;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const message =
                    error.response?.data?.error ||
                    error.response?.data?.message ||
                    'Error inesperado';
                toast.error(message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const updateUser = async (id: number, data: UpdateUserDTO) => {
        setIsLoading(true);
        try {
            await userServices.update(id, data);
            toast.success('User updated successfully', 'Changes saved');
            await fetchUsers();
            return true;
        } catch (error: any) {
            toast.error('text-white');
        } finally {
            setIsLoading(false);
        }
    };

    const deleteUser = async (id: number) => {
        setIsLoading(true);

        try {
            await userServices.delete(id);
            toast.success('Usuario eliminado exitosamente', 'Changes saved');
            await fetchUsers();

            return true;
        } catch (error: any) {
            toast.error('text-white');
        } finally {
            setIsLoading(false);
        }
    };

    const setSearch = (term: string) => {
        setSearchParams((prev) => {
            if (term) {
                prev.set('search', term);
            } else {
                prev.delete('search');
            }
            prev.set('page', '1');
            return prev;
        });
    };

    const setRole = (roleId: number | undefined) => {
        setSearchParams((prev) => {
            if (roleId !== undefined) {
                prev.set('role', roleId.toString());
            } else {
                prev.delete('role');
            }
            prev.set('page', '1');
            return prev;
        });
    };

    return {
        users,
        isLoading,
        error,
        totalPages,
        user,
        fetchUsers,
        findById,
        createUser,
        updateUser,
        deleteUser,
        search,
        setSearch,
        role,
        setRole,
    };
}
