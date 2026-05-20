import { api } from '../../../shared/api/axiosClient';
import type { CommunityPostsResponse } from '../types/types';

export const communityApi = {
    getPosts: async (page: number, limit: number): Promise<CommunityPostsResponse> => {
        const response = await api.get('/community/posts', { params: { page, limit } });
        return response.data;
    },

    deletePost: async (postId: number): Promise<void> => {
        await api.delete(`/community/posts/${postId}/admin`);
    },
};
