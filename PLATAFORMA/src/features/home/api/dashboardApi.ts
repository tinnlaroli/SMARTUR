import { api } from '../../../shared/api/axiosClient';

export interface DashboardStats {
    total_locations: number;
    total_services: number;
    total_users: number;
    active_users: number;
    total_evaluations: number;
    average_score: string;
    total_companies: number;
    total_poi: number;
    evaluations_by_month: {
        month: string;
        count: number;
        avg_score: string;
    }[];
    top_services: {
        id_service: number;
        service_name: string;
        company_name: string;
        avg_score: string;
        evaluation_count: number;
    }[];
    recent_evaluations: {
        id_evaluation: number;
        total_score: string;
        created_at: string;
        service_name: string;
        evaluator_name: string;
    }[];
    users_by_role: {
        role_id: number;
        count: number;
    }[];
    pending_companies?: number;
}

interface DashboardResponse {
    message: string;
    stats: DashboardStats;
}

export const dashboardApi = {
    getStats: async (): Promise<DashboardStats> => {
        const { data } = await api.get<DashboardResponse>('/dashboard/stats');
        return data.stats;
    },
};
