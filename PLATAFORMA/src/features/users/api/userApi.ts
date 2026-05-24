import { api } from '../../../shared/api/axiosClient';
import type { CreateUserDTO, UpdateUserDTO, User, UserResponse, UserDetailResponse, UserSession, UserRecommendationSession } from '../types/types';

export const userServices = {
    findAll: async (page: number, limit: number, search?: string, role?: number): Promise<UserResponse> => {
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
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                formData.append(key, value);
            }
        });
        const response = await api.post<User>('/users', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    update: async (id: number, data: UpdateUserDTO): Promise<User> => {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                formData.append(key, value);
            }
        });
        const response = await api.patch<User>(`/users/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/users/${id}`);
    },

    getUserSessions: async (id: number): Promise<UserSession[]> => {
        const response = await api.get(`/users/${id}/sessions`);
        return response.data;
    },

    getUserRecommendations: async (id: number): Promise<UserRecommendationSession[]> => {
        const response = await api.get(`/users/${id}/recommendations`);
        return response.data;
    },
};
