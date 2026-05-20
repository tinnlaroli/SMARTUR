import { api } from '../../../shared/api/axiosClient';
import type { Certification, CertificationResponse, CreateCertificationDTO, UpdateCertificationDTO } from '../types/types';

export const certificationApi = {
    findAll: async (page: number = 1, limit: number = 50): Promise<CertificationResponse> => {
        const response = await api.get('/service-certifications', {
            params: { page, limit },
        });
        return response.data;
    },

    create: async (data: CreateCertificationDTO): Promise<Certification> => {
        const response = await api.post('/service-certifications/register', data);
        return response.data;
    },

    update: async (id: number, data: UpdateCertificationDTO): Promise<Certification> => {
        const response = await api.patch(`/service-certifications/update/${id}`, data);
        return response.data;
    },

    updateStatus: async (id: number, status: string): Promise<Certification> => {
        const response = await api.patch(`/service-certifications/status/${id}`, { status });
        return response.data;
    },
};
