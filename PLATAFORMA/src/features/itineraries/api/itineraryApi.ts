import { api } from '../../../shared/api/axiosClient';

export interface AdminItinerary {
    id_itinerary: number;
    title: string;
    is_certified: boolean;
    copy_count: number;
    created_at: string;
    owner_name: string;
}

export interface AdminItinerariesResponse {
    itineraries: AdminItinerary[];
    total: number;
}

export const itineraryAdminApi = {
    listPublic: async (params: {
        limit?: number;
        offset?: number;
        certified?: boolean | null;
    }): Promise<AdminItinerariesResponse> => {
        const query: Record<string, string> = {};
        if (params.limit !== undefined) query.limit = String(params.limit);
        if (params.offset !== undefined) query.offset = String(params.offset);
        if (params.certified !== null && params.certified !== undefined) {
            query.certified = String(params.certified);
        }
        const res = await api.get('/admin/itineraries', { params: query });
        return res.data;
    },

    certify: async (id: number): Promise<void> => {
        await api.patch(`/admin/itineraries/${id}/certify`);
    },

    uncertify: async (id: number): Promise<void> => {
        await api.patch(`/admin/itineraries/${id}/uncertify`);
    },

    create: async (data: { title: string; description?: string }): Promise<AdminItinerary> => {
        const res = await api.post('/admin/itineraries', data);
        return res.data.itinerary;
    },
};
