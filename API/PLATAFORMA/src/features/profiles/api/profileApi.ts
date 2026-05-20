import { api } from '../../../shared/api/axiosClient';
import type { Profile, ProfileResponse, CreateProfileDTO, UpdateProfileDTO } from '../types/types';

const unwrapProfile = (payload: any): Profile => payload?.travelerProfile ?? payload;

export const profileApi = {
    findAll: async (page: number = 1, limit: number = 50): Promise<ProfileResponse> => {
        const response = await api.get('/profiles', {
            params: { page, limit },
        });
        return response.data;
    },

    findById: async (id: number): Promise<Profile> => {
        const response = await api.get(`/profiles/${id}`);
        return unwrapProfile(response.data);
    },

    create: async (data: CreateProfileDTO): Promise<Profile> => {
        const response = await api.post('/profiles/register', data);
        return unwrapProfile(response.data);
    },

    update: async (id: number, data: UpdateProfileDTO): Promise<Profile> => {
        const response = await api.patch(`/profiles/update/${id}`, data);
        return unwrapProfile(response.data);
    },
};
