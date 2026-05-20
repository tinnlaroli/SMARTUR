import { api } from '../../../shared/api/axiosClient';
import type { Template, TemplateResponse, CreateTemplateDTO, UpdateTemplateDTO } from '../types/types';

export const templatesApi = {
    findAll: async (page: number = 1, limit: number = 50): Promise<TemplateResponse> => {
        const response = await api.get('/templates', {
            params: { page, limit },
        });
        return response.data;
    },

    create: async (data: CreateTemplateDTO): Promise<Template> => {
        const response = await api.post('/templates/register', data);
        return response.data;
    },

    update: async (id: number, data: UpdateTemplateDTO): Promise<Template> => {
        const response = await api.patch(`/templates/update/${id}`, data);
        return response.data;
    },
};
