import { api } from '../../../shared/api/axiosClient';
import type {
    CreateCompanyDTO,
    UpdateCompanyDTO,
    Company,
    CompanyResponse,
    CompanyDetailResponse,
} from '../types/types';

export const companyServices = {
    findAll: async (
        page: number,
        limit: number,
        search?: string,
        location?: number,
        sector?: number
    ): Promise<CompanyResponse> => {
        const response = await api.get('/companies', {
            params: {
                page,
                limit,
                search: search || undefined,
                location: location || undefined,
                sector: sector || undefined,
            },
        });
        return response.data;
    },

    findById: async (id: number): Promise<CompanyDetailResponse> => {
        const response = await api.get<CompanyDetailResponse>(`/companies/${id}`);
        return response.data;
    },

    create: async (data: CreateCompanyDTO): Promise<Company> => {
        const response = await api.post<Company>('/companies', data);
        return response.data;
    },

    update: async (id: number, data: UpdateCompanyDTO): Promise<Company> => {
        const response = await api.patch<Company>(`/companies/${id}`, data);
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/companies/${id}`);
    },
};
