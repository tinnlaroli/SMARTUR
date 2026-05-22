import { useState, useCallback } from 'react';
import { communityApi } from '../api/communityApi';
import type { CommunityPost } from '../types/types';

export const useCommunity = () => {
    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    const fetchPosts = useCallback(async (page = 1, limit = 20) => {
        setIsLoading(true);
        try {
            const data = await communityApi.getPosts(page, limit);
            setPosts(data.posts);
            setTotalRecords(data.totalRecords);
            setTotalPages(Math.ceil(data.totalRecords / limit));
        } finally {
            setIsLoading(false);
        }
    }, []);

    const createPost = useCallback(async (formData: FormData): Promise<boolean> => {
        try {
            await communityApi.createPost(formData);
            return true;
        } catch {
            return false;
        }
    }, []);

    const deletePost = useCallback(async (postId: number) => {
        await communityApi.deletePost(postId);
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        setTotalRecords((n) => n - 1);
    }, []);

    return { posts, isLoading, totalPages, totalRecords, fetchPosts, createPost, deletePost };
};
