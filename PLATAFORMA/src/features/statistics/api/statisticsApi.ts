import { api } from '../../../shared/api/axiosClient';
import type {
    Expenditure, Employment, Input,
    CreateExpenditureDTO, CreateEmploymentDTO, CreateInputDTO,
    TouristOption, LocationOption,
} from '../types/types';

export const statisticsApi = {
    // ─── Create ──────────────────────────────────────────────────────────────
    registerExpenditure: async (data: CreateExpenditureDTO): Promise<Expenditure> => {
        const response = await api.post('/tourism-expenditures/register', data);
        return response.data;
    },

    registerEmployment: async (data: CreateEmploymentDTO): Promise<Employment> => {
        const response = await api.post('/tourism-employment/register', data);
        return response.data;
    },

    registerInput: async (data: CreateInputDTO): Promise<Input> => {
        const response = await api.post('/tourism-inputs/register', data);
        return response.data;
    },

    // ─── Fetch lists (API returns wrapped objects, not bare arrays) ───────────
    getExpenditures: async (): Promise<Expenditure[]> => {
        const response = await api.get('/tourism-expenditures');
        const d = response.data;
        return Array.isArray(d) ? d : (d?.expenditures ?? []);
    },

    getEmployments: async (): Promise<Employment[]> => {
        const response = await api.get('/tourism-employment');
        const d = response.data;
        return Array.isArray(d) ? d : (d?.employments ?? []);
    },

    getInputs: async (): Promise<Input[]> => {
        const response = await api.get('/tourism-inputs');
        const d = response.data;
        return Array.isArray(d) ? d : (d?.inputs ?? []);
    },

    // ─── Selectors ────────────────────────────────────────────────────────────
    getTourists: async (): Promise<TouristOption[]> => {
        const response = await api.get('/profiles?limit=200');
        const d = response.data;
        const profiles: any[] = Array.isArray(d) ? d : (d?.travelerProfiles ?? []);
        return profiles
            .filter((p: any) => p?.user?.name)
            .map((p: any) => ({
                userId: p.user_id,
                name: p.user?.name ?? `Usuario ${p.user_id}`,
                email: p.user?.email ?? '',
            }));
    },

    getLocations: async (): Promise<LocationOption[]> => {
        const response = await api.get('/locations?limit=200');
        const d = response.data;
        const locs: any[] = Array.isArray(d) ? d : (d?.locations ?? []);
        return locs.map((l: any) => ({
            id: l.id ?? l.id_location,
            name: l.name,
            state: l.state ?? '',
            municipality: l.municipality ?? '',
        }));
    },
};
