import { useState } from 'react';
import type { CreateExpenditureDTO, CreateEmploymentDTO, CreateInputDTO } from '../types/types';
import { statisticsApi } from '../api/statisticsApi';
import { useToast } from '../../../shared/context/ToastContext';

export function useStatistics() {
    const toast = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const recordExpenditure = async (data: CreateExpenditureDTO) => {
        setIsLoading(true);
        try {
            await statisticsApi.registerExpenditure(data);
            toast.success('Gasto registrado correctamente');
            return true;
        } catch (error: any) {
            toast.error('Error al registrar gasto');
        } finally {
            setIsLoading(false);
        }
    };

    const recordEmployment = async (data: CreateEmploymentDTO) => {
        setIsLoading(true);
        try {
            await statisticsApi.registerEmployment(data);
            toast.success('Empleo registrado correctamente');
            return true;
        } catch (error: any) {
            toast.error('Error al registrar empleo');
        } finally {
            setIsLoading(false);
        }
    };

    const recordInput = async (data: CreateInputDTO) => {
        setIsLoading(true);
        try {
            await statisticsApi.registerInput(data);
            toast.success('Insumo registrado correctamente');
            return true;
        } catch (error: any) {
            toast.error('Error al registrar insumo');
        } finally {
            setIsLoading(false);
        }
    };

    return { isLoading, recordExpenditure, recordEmployment, recordInput };
}
