import { useCallback, useEffect, useState } from 'react';
import type { Activity, CreateActivityDTO, UpdateActivityDTO } from '../types/types';
import { useSearchParams } from 'react-router-dom';
import { activityApi } from '../api/activityApi';
import { useToast } from '../../../shared/context/ToastContext';

export function useActivities() {
    const toast = useToast();
    const [activities, setActivities] = useState<Activity[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [totalPages, setTotalPages] = useState(1);
    const [searchParams] = useSearchParams();

    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 10;

    const fetchActivities = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await activityApi.findAll(page, limit);
            setActivities(data.touristActivities || []);
            setTotalPages(data.totalPages);
        } catch (error: any) {
            toast.error('Error al cargar actividades');
        } finally {
            setIsLoading(false);
        }
    }, [page, limit]);

    useEffect(() => {
        fetchActivities();
    }, [fetchActivities]);

    const createActivity = async (data: CreateActivityDTO) => {
        setIsLoading(true);
        try {
            await activityApi.create(data);
            toast.success('Actividad registrada');
            await fetchActivities();
            return true;
        } catch (error: any) {
            toast.error('Error al registrar actividad');
        } finally {
            setIsLoading(false);
        }
    };

    const updateActivity = async (id: number, data: UpdateActivityDTO) => {
        setIsLoading(true);
        try {
            await activityApi.update(id, data);
            toast.success('Actividad actualizada');
            await fetchActivities();
            return true;
        } catch (error: any) {
            toast.error('Error al actualizar actividad');
        } finally {
            setIsLoading(false);
        }
    };

    return { activities, isLoading, totalPages, createActivity, updateActivity, fetchActivities };
}
