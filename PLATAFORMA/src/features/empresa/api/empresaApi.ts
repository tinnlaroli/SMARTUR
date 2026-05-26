import { api } from '../../../shared/api/axiosClient';
import axios from 'axios';

export interface EmpresaProfile {
    id_company: number;
    name: string;
    address: string | null;
    phone: string | null;
    status: 'pending' | 'active' | 'suspended';
    id_sector: number;
    id_location: number | null;
    registration_date: string;
    sector_name: string;
    location_name: string | null;
}

export interface EmpresaService {
    id_service: number;
    name: string;
    description: string | null;
    service_type: string | null;
    active: boolean;
    image_url: string | null;
    id_location: number | null;
}

export interface AnalyticsSummary {
    total_recomendaciones: number;
    total_favoritos: number;
    total_visitas: number;
    avg_rating: number | null;
    total_servicios_activos: number;
    evaluacion_score: number | null;
}

export interface TopServicio {
    id_service: number;
    name: string;
    favorites: number;
    visits: number;
    rating: number | null;
    recomendaciones: number;
}

export interface TimelineDay {
    date: string;
    interacciones: number;
}

export interface AnalyticsResponse {
    summary: AnalyticsSummary;
    top_servicios: TopServicio[];
    timeline_30d: TimelineDay[];
}

export interface RegisterEmpresaPayload {
    name: string;
    email: string;
    password: string;
    companyName: string;
    phone?: string;
    id_sector: number;
    id_location?: number;
}

export const empresaApi = {
    register: async (payload: RegisterEmpresaPayload) => {
        const { data } = await axios.post('/api/v2/auth/register-empresa', payload);
        return data;
    },

    getProfile: async (): Promise<{ company: EmpresaProfile }> => {
        const { data } = await api.get('/empresa/profile');
        return data;
    },

    updateProfile: async (updates: { name?: string; address?: string; phone?: string }) => {
        const { data } = await api.patch('/empresa/profile', updates);
        return data;
    },

    getServices: async (): Promise<{ services: EmpresaService[] }> => {
        const { data } = await api.get('/empresa/services');
        return data;
    },

    getAnalytics: async (): Promise<AnalyticsResponse> => {
        const { data } = await api.get('/empresa/analytics');
        return data;
    },
};
