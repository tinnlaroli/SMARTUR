import { api } from '../../../shared/api/axiosClient';
import type {
    TemplateResponse,
    RubricResponse,
    CreateTemplateDTO,
    UpdateTemplateDTO,
    InstrumentTemplate,
    Criterion,
    CreateCriterionDTO,
    UpdateCriterionDTO,
    Subcriterion,
} from '../types/types';

export const instrumentApi = {
    getTemplates: async (page = 1, limit = 50): Promise<TemplateResponse> => {
        const { data } = await api.get('/templates', { params: { page, limit } });
        return data;
    },

    getTemplateById: async (id: number): Promise<any> => {
        const { data } = await api.get(`/templates/${id}`);
        return data;
    },

    createTemplate: async (dto: CreateTemplateDTO): Promise<InstrumentTemplate> => {
        const { data } = await api.post('/templates/register', dto);
        return data.template;
    },

    updateTemplate: async (id: number, dto: UpdateTemplateDTO): Promise<InstrumentTemplate> => {
        const { data } = await api.patch(`/templates/update/${id}`, dto);
        return data.template;
    },

    deleteTemplate: async (id: number): Promise<void> => {
        await api.delete(`/templates/delete/${id}`);
    },

    getRubric: async (templateId: number): Promise<FullRubric> => {
        const { data } = await api.get<RubricResponse>(`/templates/${templateId}/rubric`);
        return data.rubric;
    },

    getCriteria: async (id_template: number): Promise<Criterion[]> => {
        const { data } = await api.get('/criterion/', { params: { id_template, limit: 100 } });
        return data.criteria;
    },

    createCriterion: async (dto: CreateCriterionDTO): Promise<Criterion> => {
        const { data } = await api.post('/criterion/register', dto);
        return data.criterion;
    },

    updateCriterion: async (id: number, dto: UpdateCriterionDTO): Promise<Criterion> => {
        const { data } = await api.patch(`/criterion/update/${id}`, dto);
        return data.criterion;
    },

    deleteCriterion: async (id: number): Promise<void> => {
        await api.delete(`/criterion/delete/${id}`);
    },

    getSubcriteria: async (id_criterion: number): Promise<Subcriterion[]> => {
        const { data } = await api.get(`/subcriteria/criterion/${id_criterion}`);
        return data.subcriteria;
    },

    createSubcriterion: async (dto: { id_criterion: number; description: string; score: number; order_index?: number }): Promise<Subcriterion> => {
        const { data } = await api.post('/subcriteria', dto);
        return data.subcriterion;
    },

    updateSubcriterion: async (id: number, dto: { description?: string; score?: number; order_index?: number }): Promise<Subcriterion> => {
        const { data } = await api.patch(`/subcriteria/${id}`, dto);
        return data.subcriterion;
    },

    deleteSubcriterion: async (id: number): Promise<void> => {
        await api.delete(`/subcriteria/${id}`);
    },

    batchUpdateSubcriteria: async (id_criterion: number, subcriteria: { description: string; score: number }[]): Promise<Subcriterion[]> => {
        const { data } = await api.put(`/subcriteria/criterion/${id_criterion}/batch`, { subcriteria });
        return data.subcriteria;
    },
};
