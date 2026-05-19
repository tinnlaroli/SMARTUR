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
        console.log(
            'DEBUG API: Enviando POST a /service-evaluation/batch-register con data:',
            data
        );
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

    // Add more if needed, e.g., get evaluation by service ID
    findByServiceId: async (serviceId: number): Promise<any> => {
        // This endpoint is not explicitly in the docs but implied by Task 3
        // "verificar si existe id_evaluation vinculado"
        // Let's assume there is a way to get it, or it will be part of service detail.
        // For now I'll just keep the ones from docs.
        const response = await api.get(`/service-evaluation/service/${serviceId}`);
        return response.data;
    },
};
