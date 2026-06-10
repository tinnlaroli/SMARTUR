import { api } from '../../../shared/api/axiosClient';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

export interface EmpresaBooking {
    id_booking: number;
    id_service: number;
    service_name: string;
    tourist_name: string;
    visit_date: string;
    visit_time: string | null;
    guests: number;
    notes: string | null;
    status: BookingStatus;
    is_walkin: boolean;
    created_at: string;
}

export interface WalkinPayload {
    id_service: number;
    visit_date: string;
    visit_time?: string;
    guests?: number;
    notes?: string;
}

export const bookingEmpresaApi = {
    list: async (status?: BookingStatus): Promise<EmpresaBooking[]> => {
        const params: Record<string, string> = {};
        if (status) params.status = status;
        const res = await api.get('/empresa/bookings', { params });
        return res.data.bookings;
    },

    confirm: async (id: number): Promise<void> => {
        await api.patch(`/empresa/bookings/${id}/confirm`);
    },

    cancel: async (id: number): Promise<void> => {
        await api.patch(`/empresa/bookings/${id}/cancel`);
    },

    walkin: async (payload: WalkinPayload): Promise<EmpresaBooking> => {
        const res = await api.post('/empresa/bookings/walkin', payload);
        return res.data.booking;
    },
};
