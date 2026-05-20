import { useState } from 'react';
import { evaluationsApi } from '../api/evaluationsApi';
import type { EvaluationRubric, FullEvaluationRegisterDTO } from '../types/types';

export const useEvaluations = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [rubric, setRubric] = useState<EvaluationRubric | null>(null);

    const getRubric = async (templateId: number) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await evaluationsApi.getRubric(templateId);
            setRubric(response.rubric);
            return response.rubric;
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error fetching rubric');
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    const registerEvaluation = async (data: FullEvaluationRegisterDTO) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await evaluationsApi.registerFull(data);
            return response;
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error registering evaluation');
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    const getEvaluationByServiceId = async (serviceId: number) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await evaluationsApi.findByServiceId(serviceId);
            return response;
        } catch (err: any) {
            // It's possible it doesn't exist, so we don't necessarily set error
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        isLoading,
        error,
        rubric,
        getRubric,
        registerEvaluation,
        getEvaluationByServiceId,
    };
};
