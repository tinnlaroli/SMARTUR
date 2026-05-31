import axios from 'axios';
import type { GetRecommendationsParams, RecommendationsResponse } from '../types/types';

const API_BASE = import.meta.env.VITE_API_URL ?? '/api/v2';

export const formApi = {
    getRecommendations: async ({
        userId,
        alpha = 0.2,
        top_n = 5,
        context,
        token = null,
        signal,
    }: GetRecommendationsParams): Promise<RecommendationsResponse> => {
        const url = `${API_BASE}/ml/recommend/${userId}`;
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await axios.post<RecommendationsResponse>(
            url,
            { alpha, top_n, context },
            { headers, signal }
        );

        return response.data;
    },
};
