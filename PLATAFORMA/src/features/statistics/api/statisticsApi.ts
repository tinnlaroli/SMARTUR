import { api } from '../../../shared/api/axiosClient';
import type { Expenditure, Employment, Input, CreateExpenditureDTO, CreateEmploymentDTO, CreateInputDTO } from '../types/types';

export const statisticsApi = {
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

    getExpenditures: async (): Promise<Expenditure[]> => {
        const response = await api.get('/tourism-expenditures');
        return response.data;
    },

    getEmployments: async (): Promise<Employment[]> => {
        const response = await api.get('/tourism-employment');
        return response.data;
    },

    getInputs: async (): Promise<Input[]> => {
        const response = await api.get('/tourism-inputs');
        return response.data;
    },
};
