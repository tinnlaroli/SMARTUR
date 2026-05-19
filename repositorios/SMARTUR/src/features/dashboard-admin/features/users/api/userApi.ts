import { api } from '../../../shared/api/axiosClient';
import type {
    CreateUserDTO,
    UpdateUserDTO,
    User,
    UserResponse,
    UserDetailResponse,
} from '../types/types';

export const userServices = {
    findAll: async (
        page: number,
        limit: number,
        search?: string,
        role?: number
    ): Promise<UserResponse> => {
        const response = await api.get('/users', {
            params: { page, limit, search: search || undefined, role: role || undefined },
        });
        return response.data;
    },

    findById: async (id: number): Promise<UserDetailResponse> => {
        const response = await api.get<UserDetailResponse>(`/users/${id}`);
        return response.data;
    },

    findByEmail: async (email: string): Promise<UserDetailResponse> => {
        const response = await api.get<UserDetailResponse>(`/users/email/${email}`);
        return response.data;
    },

    create: async (data: CreateUserDTO): Promise<User> => {
        const response = await api.post<User>('/users', data);
        return response.data;
    },

    update: async (id: number, data: UpdateUserDTO): Promise<User> => {
        const response = await api.patch<User>(`/users/${id}`, data);
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/users/${id}`);
    },
};
