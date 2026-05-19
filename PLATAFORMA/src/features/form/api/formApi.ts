import axios from 'axios';
import type { GetRecommendationsParams, RecommendationsResponse } from '../types/types';

const REC_API_BASE = import.meta.env.VITE_MODELO_URL ?? 'http://localhost:8000';

export const formApi = {
    getRecommendations: async ({ 
        userId, 
        alpha = 0.2, 
        top_n = 5, 
        context, 
        token = null 
    }: GetRecommendationsParams): Promise<RecommendationsResponse> => {
        const url = `${REC_API_BASE}/recommend/${userId}`;
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await axios.post<RecommendationsResponse>(
            url, 
            { alpha, top_n, context }, 
            { headers }
        );

        return response.data;
    },
};
