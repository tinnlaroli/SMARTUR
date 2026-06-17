import { api } from '../../../shared/api/axiosClient';
import type { POI, POIResponse, CreatePOIDTO, UpdatePOIDTO } from '../types/types';

const buildFormData = (data: CreatePOIDTO | UpdatePOIDTO): FormData => {
    const fd = new FormData();
    Object.entries(data).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (key === 'image') {
            if (value instanceof File) fd.append('image', value);
            return;
        }
        fd.append(key, String(value));
    });
    return fd;
};

export const poiApi = {
    findAll: async (page: number = 1, limit: number = 50, search?: string): Promise<POIResponse> => {
        const response = await api.get('/points-of-interest', {
            params: { page, limit, search: search || undefined },
        });
        return response.data;
    },

    create: async (data: CreatePOIDTO): Promise<POI> => {
        const response = await api.post('/points-of-interest/register', buildFormData(data), {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data.point ?? response.data;
    },

    update: async (id: number, data: UpdatePOIDTO): Promise<POI> => {
        const response = await api.patch(`/points-of-interest/update/${id}`, buildFormData(data), {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data.point ?? response.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/points-of-interest/delete/${id}`);
    },
};
