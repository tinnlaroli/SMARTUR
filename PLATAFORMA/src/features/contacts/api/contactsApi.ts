import { api } from '../../../shared/api/axiosClient';
import type { ContactSubscriptionsResponse, ContactStatus } from '../types/types';

export const contactsApi = {
    getSubscriptions: async (page: number, limit: number): Promise<ContactSubscriptionsResponse> => {
        const response = await api.get('/contact-subscriptions', { params: { page, limit } });
        return response.data;
    },

    updateStatus: async (id: number, status: ContactStatus): Promise<void> => {
        await api.patch(`/contact-subscriptions/${id}/status`, { status });
    },

    deleteSubscription: async (id: number): Promise<void> => {
        await api.delete(`/contact-subscriptions/${id}`);
    },
};
