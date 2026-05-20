import { api } from '../../../shared/api/axiosClient';
import type {
    CreateLocationDTO,
    UpdateLocationDTO,
    Location,
    LocationResponse,
    LocationDetailResponse,
} from '../types/types';

export const locationApi = {
    findAll: async (
        page: number,
        limit: number,
        search?: string,
        state?: string
    ): Promise<LocationResponse> => {
        const response = await api.get('/locations', {
            params: {
                page,
                limit,
                search: search || undefined,
                state: state || undefined,
            },
        });
        return response.data;
    },

    findById: async (id: number): Promise<LocationDetailResponse> => {
        const response = await api.get<LocationDetailResponse>(`/locations/${id}`);
        return response.data;
    },

    create: async (data: CreateLocationDTO): Promise<Location> => {
        const response = await api.post<Location>('/locations', data);
        return response.data;
    },

    update: async (id: number, data: UpdateLocationDTO): Promise<Location> => {
        const response = await api.patch<Location>(`/locations/${id}`, data);
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/locations/${id}`);
    },
};
