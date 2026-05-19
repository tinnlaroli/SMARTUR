import { api } from '../../../shared/api/axiosClient';
import type { Activity, ActivityResponse, CreateActivityDTO, UpdateActivityDTO } from '../types/types';

export const activityApi = {
    findAll: async (page: number = 1, limit: number = 50): Promise<ActivityResponse> => {
        const response = await api.get('/tourist_activities', {
            params: { page, limit },
        });
        return response.data;
    },

    create: async (data: CreateActivityDTO): Promise<Activity> => {
        const response = await api.post('/tourist_activities/register', data);
        return response.data;
    },

    update: async (id: number, data: UpdateActivityDTO): Promise<Activity> => {
        const response = await api.patch(`/tourist_activities/update/${id}`, data);
        return response.data;
    },
};
