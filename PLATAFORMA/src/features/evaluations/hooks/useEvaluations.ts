import { useReducer, useCallback } from 'react';
import { evaluationsApi } from '../api/evaluationsApi';
import type { EvaluationRubric, FullEvaluationRegisterDTO } from '../types/types';

interface EvaluationsState {
    isLoading: boolean;
    error: string | null;
    rubric: EvaluationRubric | null;
}

type EvaluationsAction =
    | { type: 'REQUEST_START' }
    | { type: 'SET_RUBRIC'; rubric: EvaluationRubric }
    | { type: 'REQUEST_SUCCESS' }
    | { type: 'REQUEST_ERROR'; error: string };

function evaluationsReducer(
    state: EvaluationsState,
    action: EvaluationsAction
): EvaluationsState {
    switch (action.type) {
        case 'REQUEST_START':
            return { ...state, isLoading: true, error: null };
        case 'SET_RUBRIC':
            return { ...state, isLoading: false, rubric: action.rubric };
        case 'REQUEST_SUCCESS':
            return { ...state, isLoading: false };
        case 'REQUEST_ERROR':
            return { ...state, isLoading: false, error: action.error };
        default:
            return state;
    }
}

export const useEvaluations = () => {
    const [state, dispatch] = useReducer(evaluationsReducer, {
        isLoading: false,
        error: null,
        rubric: null,
    });

    const getRubric = useCallback(async (templateId: number) => {
        dispatch({ type: 'REQUEST_START' });
        try {
            const response = await evaluationsApi.getRubric(templateId);
            dispatch({ type: 'SET_RUBRIC', rubric: response.rubric });
            return response.rubric;
        } catch (err: any) {
            dispatch({
                type: 'REQUEST_ERROR',
                error: err.response?.data?.message || 'Error fetching rubric',
            });
            return null;
        }
    }, []);

    const registerEvaluation = useCallback(async (data: FullEvaluationRegisterDTO) => {
        dispatch({ type: 'REQUEST_START' });
        try {
            const response = await evaluationsApi.registerFull(data);
            dispatch({ type: 'REQUEST_SUCCESS' });
            return response;
        } catch (err: any) {
            dispatch({
                type: 'REQUEST_ERROR',
                error: err.response?.data?.message || 'Error registering evaluation',
            });
            return null;
        }
    }, []);

    const getEvaluationByServiceId = useCallback(async (serviceId: number) => {
        dispatch({ type: 'REQUEST_START' });
        try {
            const response = await evaluationsApi.findByServiceId(serviceId);
            dispatch({ type: 'REQUEST_SUCCESS' });
            return response;
        } catch {
            dispatch({ type: 'REQUEST_SUCCESS' });
            return null;
        }
    }, []);

    return {
        isLoading: state.isLoading,
        error: state.error,
        rubric: state.rubric,
        getRubric,
        registerEvaluation,
        getEvaluationByServiceId,
    };
};
