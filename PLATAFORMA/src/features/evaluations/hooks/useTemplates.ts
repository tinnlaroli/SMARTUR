import { useCallback, useEffect, useReducer } from 'react';
import type { Template, CreateTemplateDTO } from '../types/types';
import { useSearchParams } from 'react-router-dom';
import { templatesApi } from '../api/templatesApi';
import { useToast } from '../../../shared/context/ToastContext';

interface TemplatesState {
    templates: Template[];
    isLoading: boolean;
    totalPages: number;
}

type TemplatesAction =
    | { type: 'FETCH_START' }
    | { type: 'FETCH_SUCCESS'; templates: Template[]; totalPages: number }
    | { type: 'FETCH_ERROR' };

function templatesReducer(state: TemplatesState, action: TemplatesAction): TemplatesState {
    switch (action.type) {
        case 'FETCH_START':
            return { ...state, isLoading: true };
        case 'FETCH_SUCCESS':
            return { templates: action.templates, totalPages: action.totalPages, isLoading: false };
        case 'FETCH_ERROR':
            return { ...state, isLoading: false };
        default:
            return state;
    }
}

export function useTemplates() {
    const toast = useToast();
    const [state, dispatch] = useReducer(templatesReducer, {
        templates: [],
        isLoading: false,
        totalPages: 1,
    });
    const [searchParams] = useSearchParams();

    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 10;

    const fetchTemplates = useCallback(async () => {
        dispatch({ type: 'FETCH_START' });
        try {
            const data = await templatesApi.findAll(page, limit);
            dispatch({
                type: 'FETCH_SUCCESS',
                templates: data.templates || [],
                totalPages: data.totalPages,
            });
        } catch {
            toast.error('Error al cargar plantillas');
            dispatch({ type: 'FETCH_ERROR' });
        }
    }, [page, limit]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    const createTemplate = async (data: CreateTemplateDTO) => {
        dispatch({ type: 'FETCH_START' });
        try {
            await templatesApi.create(data);
            toast.success('Plantilla creada');
            await fetchTemplates();
            return true;
        } catch {
            toast.error('Error al crear plantilla');
            dispatch({ type: 'FETCH_ERROR' });
        }
    };

    return {
        templates: state.templates,
        isLoading: state.isLoading,
        totalPages: state.totalPages,
        createTemplate,
        fetchTemplates,
    };
}
