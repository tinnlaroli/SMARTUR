import { api } from '../../../shared/api/axiosClient';
import type { GetRecommendationsParams, RecommendationsResponse } from '../types/types';

export const formApi = {
    getRecommendations: async ({
        userId,
        alpha = 0.2,
        top_n = 5,
        context,
        signal,
    }: Omit<GetRecommendationsParams, 'token'>): Promise<RecommendationsResponse> => {
        const response = await api.post<RecommendationsResponse>(
            `/ml/recommend/${userId}`,
            { alpha, top_n, context },
            { signal }
        );
        return response.data;
    },
};
