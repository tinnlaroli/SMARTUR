import { api } from '../../../shared/api/axiosClient';

export interface AlgorithmMetric {
    rmse: number;
    mae: number;
    alpha?: number;
}

export interface MLHealth {
    latest_metrics: {
        best_algorithm: string;
        best_alpha: number;
        algorithms: Record<string, AlgorithmMetric>;
        sample_size?: number;
    } | null;
    daily_sessions: {
        total: number;
        avg_latency_ms: string;
        day: string;
    }[];
    ctr_30d: {
        total: number;
        clicked: number;
    };
}

export const mlApi = {
    getHealth: async (): Promise<MLHealth> => {
        const { data } = await api.get<MLHealth>('/ml/health');
        return data;
    },
};
