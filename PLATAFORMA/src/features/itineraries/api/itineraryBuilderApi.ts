import { api } from '../../../shared/api/axiosClient';
import type { POI } from '../../points-of-interest/types/types';
import type { TouristService } from '../../tourist-services/types/types';

export interface StopPayload {
    place_kind: 'poi' | 'svc';
    place_id: number;
    stop_order: number;
    visit_date?: string;
    visit_time_start?: string;
    notes?: string;
}

export interface CreateItineraryBody {
    title: string;
    description?: string;
    is_public?: boolean;
    is_certified?: boolean;
}

export const itineraryBuilderApi = {
    createItinerary: async (body: CreateItineraryBody): Promise<number> => {
        const { data } = await api.post('/itineraries', body);
        return data.itinerary?.id_itinerary ?? data.id_itinerary ?? data.id;
    },

    addStop: async (itineraryId: number, stop: StopPayload): Promise<void> => {
        await api.post(`/itineraries/${itineraryId}/stops`, stop);
    },

    removeStop: async (itineraryId: number, stopId: number): Promise<void> => {
        await api.delete(`/itineraries/${itineraryId}/stops/${stopId}`);
    },

    reorderStops: async (itineraryId: number, orderedIds: number[]): Promise<void> => {
        await api.patch(`/itineraries/${itineraryId}/stops/reorder`, { ordered_ids: orderedIds });
    },

    updateItinerary: async (id: number, patch: Partial<CreateItineraryBody>): Promise<void> => {
        await api.patch(`/itineraries/${id}`, patch);
    },

    searchPOIs: async (query: string): Promise<POI[]> => {
        const { data } = await api.get('/points-of-interest', {
            params: { search: query, limit: 10, page: 1 },
        });
        return data.points ?? [];
    },

    searchServices: async (query: string): Promise<TouristService[]> => {
        const { data } = await api.get('/tourist-services', {
            params: { search: query, limit: 10, page: 1 },
        });
        return data.services ?? data.touristServices ?? [];
    },
};
