import { useState, useCallback } from 'react';
import { contactsApi } from '../api/contactsApi';
import type { ContactSubscription, ContactStatus } from '../types/types';

export const useContacts = () => {
    const [subscriptions, setSubscriptions] = useState<ContactSubscription[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    const fetchSubscriptions = useCallback(async (page = 1, limit = 20) => {
        setIsLoading(true);
        try {
            const data = await contactsApi.getSubscriptions(page, limit);
            setSubscriptions(data.subscriptions);
            setTotalRecords(data.totalRecords);
            setTotalPages(data.totalPages);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const updateStatus = useCallback(async (id: number, status: ContactStatus) => {
        await contactsApi.updateStatus(id, status);
        setSubscriptions((prev) => prev.map((s) => s.id === id ? { ...s, status } : s));
    }, []);

    const deleteSubscription = useCallback(async (id: number) => {
        await contactsApi.deleteSubscription(id);
        setSubscriptions((prev) => prev.filter((s) => s.id !== id));
        setTotalRecords((n) => n - 1);
    }, []);

    return { subscriptions, isLoading, totalPages, totalRecords, fetchSubscriptions, updateStatus, deleteSubscription };
};
