import { api } from '../../../shared/api/axiosClient';

export interface AlgorithmMetric {
    rmse: number;
    mae: number;
    alpha?: number;
}

export interface MLMetrics {
    best_algorithm: string;
    best_alpha: number;
    production_alpha?: number;
    local_blend?: { rf: number; gbm: number };
    algorithms: Record<string, AlgorithmMetric>;
    sample_size?: number;
    ranking?: {
        ndcg_at_5: number | null;
        precision_at_5: number | null;
        hit_rate_at_10: number | null;
        users_evaluated?: number;
        error?: string;
    };
    data_quality?: {
        total_interactions: number;
        total_test: number;
        users_count: number;
        businesses_count: number;
        top_categories: string[];
        features_count: number;
        real_welltur_interactions: number;
        uses_real_data: boolean;
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

export interface SchedulerConfig {
    enabled: boolean;
    hour: number;    // 0–23 UTC
    minute: number;  // 0–59
    next_run: string | null;  // ISO datetime string UTC, or null if disabled
}

export interface ExtendedStats {
    user_distribution: {
        cold_start: number;
        warm: number;
        total: number;
    };
    top_places: {
        item_id: number;
        recommended_count: number;
        clicked_count: number;
        ctr_pct: number;
    }[];
    score_histogram: {
        bucket: string;
        count: number;
    }[];
    active_users: {
        last_7d: number;
        last_30d: number;
    };
    category_error: unknown[];
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

    getSchedulerConfig: async (): Promise<SchedulerConfig> => {
        const { data } = await api.get<SchedulerConfig>('/ml/scheduler-config');
        return data;
    },

    updateSchedulerConfig: async (
        config: Omit<SchedulerConfig, 'next_run'>
    ): Promise<{ ok: boolean; next_run?: string | null }> => {
        const { data } = await api.put('/ml/scheduler-config', config);
        return data;
    },

    getExtendedStats: async (): Promise<ExtendedStats> => {
        const { data } = await api.get<ExtendedStats>('/ml/extended-stats');
        return data;
    },
};
