import { api } from '../../../shared/api/axiosClient';
import type { POI, POIResponse, CreatePOIDTO, UpdatePOIDTO } from '../types/types';

export const poiApi = {
    findAll: async (page: number = 1, limit: number = 50): Promise<POIResponse> => {
        const response = await api.get('/points-of-interest', {
            params: { page, limit },
        });
        return response.data;
    },

    create: async (data: CreatePOIDTO): Promise<POI> => {
        const response = await api.post('/points-of-interest/register', data);
        return response.data;
    },

    update: async (id: number, data: UpdatePOIDTO): Promise<POI> => {
        const response = await api.patch(`/points-of-interest/update/${id}`, data);
        return response.data;
    },
};
