import { useState, useCallback } from 'react';
import { communityApi } from '../api/communityApi';
import type { CommunityPost, PostReport } from '../types/types';

export const useCommunity = () => {
    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    const [reports, setReports] = useState<PostReport[]>([]);
    const [reportsLoading, setReportsLoading] = useState(false);
    const [totalReports, setTotalReports] = useState(0);

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

    const fetchReports = useCallback(async (resolved = false) => {
        setReportsLoading(true);
        try {
            const data = await communityApi.getReports(resolved);
            setReports(data.reports);
            setTotalReports(data.total);
        } finally {
            setReportsLoading(false);
        }
    }, []);

    const resolveReport = useCallback(async (reportId: number) => {
        await communityApi.resolveReport(reportId);
        setReports((prev) => prev.filter((r) => r.id !== reportId));
        setTotalReports((n) => n - 1);
    }, []);

    return {
        posts, isLoading, totalPages, totalRecords, fetchPosts, createPost, deletePost,
        reports, reportsLoading, totalReports, fetchReports, resolveReport,
    };
};
