import { api } from '../../../shared/api/axiosClient';
import type {
    RubricResponse,
    FullEvaluationRegisterDTO,
    EvaluationListResponse,
} from '../types/types';

export const evaluationsApi = {
    getRubric: async (templateId: number): Promise<RubricResponse> => {
        const response = await api.get<RubricResponse>(`/templates/${templateId}/rubric`);
        return response.data;
    },

    registerFull: async (data: FullEvaluationRegisterDTO): Promise<any> => {
        const response = await api.post('/service-evaluation/batch-register', data);
        return response.data;
    },

    findAll: async (): Promise<EvaluationListResponse> => {
        const response = await api.get<EvaluationListResponse>('/service-evaluation');
        return response.data;
    },

    findById: async (id: number): Promise<any> => {
        const response = await api.get(`/service-evaluation/${id}`);
        return response.data;
    },

    findByServiceId: async (serviceId: number): Promise<any> => {
        const response = await api.get(`/service-evaluation/service/${serviceId}`);
        return response.data;
    },
};
