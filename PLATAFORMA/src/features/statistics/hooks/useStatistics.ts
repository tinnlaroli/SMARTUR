import { useState, useCallback } from 'react';
import type { Expenditure, Employment, Input, CreateExpenditureDTO, CreateEmploymentDTO, CreateInputDTO } from '../types/types';
import { statisticsApi } from '../api/statisticsApi';
import { useToast } from '../../../shared/context/ToastContext';

export function useStatistics() {
    const toast = useToast();
    const [isLoading, setIsLoading] = useState(false);

    // Records state
    const [expenditures, setExpenditures] = useState<Expenditure[]>([]);
    const [employments, setEmployments] = useState<Employment[]>([]);
    const [inputs, setInputs] = useState<Input[]>([]);
    const [loadingExpenditures, setLoadingExpenditures] = useState(false);
    const [loadingEmployments, setLoadingEmployments] = useState(false);
    const [loadingInputs, setLoadingInputs] = useState(false);

    // Fetch functions
    const fetchExpenditures = useCallback(async () => {
        setLoadingExpenditures(true);
        try {
            const data = await statisticsApi.getExpenditures();
            setExpenditures(Array.isArray(data) ? data : []);
        } catch {
            // silently fail — list stays empty
        } finally {
            setLoadingExpenditures(false);
        }
    }, []);

    const fetchEmployments = useCallback(async () => {
        setLoadingEmployments(true);
        try {
            const data = await statisticsApi.getEmployments();
            setEmployments(Array.isArray(data) ? data : []);
        } catch {
            // silently fail
        } finally {
            setLoadingEmployments(false);
        }
    }, []);

    const fetchInputs = useCallback(async () => {
        setLoadingInputs(true);
        try {
            const data = await statisticsApi.getInputs();
            setInputs(Array.isArray(data) ? data : []);
        } catch {
            // silently fail
        } finally {
            setLoadingInputs(false);
        }
    }, []);

    // Record (create) functions — refresh list after success
    const recordExpenditure = async (data: CreateExpenditureDTO) => {
        setIsLoading(true);
        try {
            await statisticsApi.registerExpenditure(data);
            toast.success('Gasto registrado correctamente');
            await fetchExpenditures();
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
            await fetchEmployments();
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
            await fetchInputs();
            return true;
        } catch (error: any) {
            toast.error('Error al registrar insumo');
        } finally {
            setIsLoading(false);
        }
    };

    return {
        isLoading,
        // records
        expenditures,
        employments,
        inputs,
        loadingExpenditures,
        loadingEmployments,
        loadingInputs,
        // fetchers
        fetchExpenditures,
        fetchEmployments,
        fetchInputs,
        // creators
        recordExpenditure,
        recordEmployment,
        recordInput,
    };
}
