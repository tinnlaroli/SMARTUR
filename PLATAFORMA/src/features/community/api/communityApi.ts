import { api } from '../../../shared/api/axiosClient';
import type { CommunityPost, CommunityPostsResponse, PostReportsResponse } from '../types/types';

export const communityApi = {
    getPosts: async (page: number, limit: number): Promise<CommunityPostsResponse> => {
        const response = await api.get('/community/posts', { params: { page, limit } });
        return response.data;
    },

    createPost: async (formData: FormData): Promise<CommunityPost> => {
        const response = await api.post('/community/posts', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    deletePost: async (postId: number): Promise<void> => {
        await api.delete(`/community/posts/${postId}/admin`);
    },

    getReports: async (resolved = false, limit = 50, offset = 0): Promise<PostReportsResponse> => {
        const response = await api.get('/community/reports', { params: { resolved, limit, offset } });
        return response.data;
    },

    resolveReport: async (reportId: number): Promise<void> => {
        await api.patch(`/community/reports/${reportId}/resolve`);
    },
};
