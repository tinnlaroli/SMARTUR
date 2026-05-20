import { api } from '../../../shared/api/axiosClient';
import type {
    CreateTouristServiceDTO,
    UpdateTouristServiceDTO,
    TouristService,
    TouristServiceResponse,
    TouristServiceDetailResponse,
} from '../types/types';

export const touristServiceApi = {
    findAll: async (
        page: number,
        limit: number,
        search?: string,
        company?: number,
        type?: string,
        active?: boolean
    ): Promise<TouristServiceResponse> => {
        const response = await api.get('/tourist-services', {
            params: {
                page,
                limit,
                search: search || undefined,
                company: company || undefined,
                type: type || undefined,
                active: active !== undefined ? String(active) : undefined,
            },
        });
        return response.data;
    },

    findById: async (id: number): Promise<TouristServiceDetailResponse> => {
        const response = await api.get<TouristServiceDetailResponse>(`/tourist-services/${id}`);
        return response.data;
    },

    create: async (data: CreateTouristServiceDTO): Promise<TouristService> => {
        const response = await api.post<TouristService>('/tourist-services', data);
        return response.data;
    },

    update: async (id: number, data: UpdateTouristServiceDTO): Promise<TouristService> => {
        const response = await api.patch<TouristService>(`/tourist-services/${id}`, data);
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/tourist-services/${id}`);
    },
};
