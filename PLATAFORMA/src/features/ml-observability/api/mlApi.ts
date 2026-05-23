import { api } from '../../../shared/api/axiosClient';

export interface AlgorithmMetric {
    rmse: number;
    mae: number;
    alpha?: number;
}

export interface MLMetrics {
    best_algorithm: string;
    best_alpha: number;
    local_blend?: { rf: number; gbm: number };
    algorithms: Record<string, AlgorithmMetric>;
    sample_size?: number;
    ranking?: {
        ndcg: number;
        precision: number;
        hit_rate: number;
    };
}

export interface MLHealth {
    latest_metrics: MLMetrics | null;
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

export interface ModelStatus {
    engine_ready: boolean;
    rf_ready: boolean;
    gbm_ready: boolean;
    svd_ready: boolean;
    lightfm_ready: boolean;
    content_ready: boolean;
    users_count: number;
}

export const mlApi = {
    getHealth: async (): Promise<MLHealth> => {
        const { data } = await api.get<MLHealth>('/ml/health');
        return data;
    },

    getModelStatus: async (): Promise<ModelStatus> => {
        const { data } = await api.get<ModelStatus>('/ml/model-status');
        return data;
    },

    trainModel: async (): Promise<{ ok: boolean; message: string }> => {
        const { data } = await api.post('/ml/train');
        return data;
    },
};
