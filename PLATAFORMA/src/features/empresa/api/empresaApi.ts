import { api } from '../../../shared/api/axiosClient';
import axios from 'axios';

export type EmpresaStatus =
    | 'pending_docs'
    | 'documents_submitted'
    | 'active'
    | 'rejected'
    | 'suspended';

export interface EmpresaProfile {
    id_company: number;
    name: string;
    address: string | null;
    phone: string | null;
    status: EmpresaStatus;
    id_sector: number;
    id_location: number | null;
    registration_date: string;
    sector_name: string;
    location_name: string | null;
}

export interface KycVerification {
    id_verification: number;
    id_company: number;
    owner_full_name: string | null;
    owner_birth_date: string | null;
    owner_curp: string | null;
    owner_rfc: string | null;
    owner_street: string | null;
    owner_colonia: string | null;
    owner_municipio: string | null;
    owner_state: string | null;
    owner_zip: string | null;
    ine_front_url: string | null;
    ine_back_url: string | null;
    address_proof_url: string | null;
    submitted_at: string | null;
    reviewed_at: string | null;
    rejection_reason: string | null;
    resubmission_count: number;
}

export interface KycStatusResponse {
    status: EmpresaStatus;
    company_name: string;
    verification: KycVerification | null;
    is_certified: boolean;
    certified_at: string | null;
}

export interface EmpresaService {
    id_service: number;
    name: string;
    description: string | null;
    service_type: string | null;
    active: boolean;
    status: 'pending_review' | 'active' | 'rejected';
    image_url: string | null;
    id_location: number | null;
    id_company?: number;
    price_from?: number | null;
    price_to?: number | null;
    currency?: string;
    duration_minutes?: number | null;
    contact_phone?: string | null;
    operating_hours?: Record<string, string> | null;
    latitude?: number | null;
    longitude?: number | null;
}

export interface ServiceCreatePayload {
    name: string;
    description?: string;
    service_type: string;
    id_location?: number;
    active?: boolean;
    price_from?: number | null;
    price_to?: number | null;
    currency?: string;
    duration_minutes?: number | null;
    contact_phone?: string;
    image?: File | null;
    latitude?: number;
    longitude?: number;
}

export interface ServiceUpdatePayload {
    name?: string;
    description?: string;
    service_type?: string;
    active?: boolean;
    id_location?: number;
    price_from?: number | null;
    price_to?: number | null;
    currency?: string;
    duration_minutes?: number | null;
    contact_phone?: string;
    image?: File | null;
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

export interface EvaluationSummaryItem {
    id_evaluation: number;
    total_score: number;
    created_at: string;
    service_name: string;
    evaluator_name: string;
}

export interface CriterionSummary {
    criterion_name: string;
    avg_score: number;
    max_score: number | null;
}

export interface EvaluationsResponse {
    recent_evaluations: EvaluationSummaryItem[];
    all_criteria: CriterionSummary[];
    weak_criteria: CriterionSummary[];
    last_evaluation_at: string | null;
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

    getServices: async (params?: { page?: number; limit?: number; search?: string }): Promise<{ services: EmpresaService[]; total: number }> => {
        const { data } = await api.get('/empresa/services', { params });
        return data;
    },

    createService: async (payload: ServiceCreatePayload): Promise<{ service: EmpresaService }> => {
        const fd = new FormData();
        const { image, ...rest } = payload;
        Object.entries(rest).forEach(([k, v]) => { if (v !== undefined && v !== null) fd.append(k, String(v)); });
        if (image) fd.append('image', image);
        const { data } = await api.post('/empresa/services', fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
    },

    updateService: async (id: number, payload: ServiceUpdatePayload): Promise<{ service: EmpresaService }> => {
        const fd = new FormData();
        const { image, ...rest } = payload;
        Object.entries(rest).forEach(([k, v]) => { if (v !== undefined) fd.append(k, v === null ? '' : String(v)); });
        if (image) fd.append('image', image);
        const { data } = await api.patch(`/empresa/services/${id}`, fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
    },

    deleteService: async (id: number): Promise<void> => {
        await api.delete(`/empresa/services/${id}`);
    },

    updateOperatingHours: async (id: number, operating_hours: Record<string, string>): Promise<{ service: EmpresaService }> => {
        const { data } = await api.patch(`/empresa/services/${id}/operating-hours`, { operating_hours });
        return data;
    },

    getAnalytics: async (): Promise<AnalyticsResponse> => {
        const { data } = await api.get('/empresa/analytics');
        return data;
    },

    getEvaluations: async (): Promise<EvaluationsResponse> => {
        const { data } = await api.get('/empresa/evaluations');
        return data;
    },

    getKycStatus: async (): Promise<KycStatusResponse> => {
        const { data } = await api.get('/empresa/verification');
        return data;
    },

    submitKyc: async (formData: FormData): Promise<{ message: string; verification: KycVerification }> => {
        const { data } = await api.post('/empresa/verification', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
    },

    getLocations: async (): Promise<{ id_location: number; name: string }[]> => {
        const { data } = await api.get('/locations');
        return data;
    },
};
