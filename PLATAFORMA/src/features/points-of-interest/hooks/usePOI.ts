import { useCallback, useEffect, useState } from 'react';
import type { POI, CreatePOIDTO } from '../types/types';
import { useSearchParams } from 'react-router-dom';
import { poiApi } from '../api/poiApi';
import { useToast } from '../../../shared/context/ToastContext';

export function usePOI() {
    const toast = useToast();
    const [points, setPoints] = useState<POI[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [totalPages, setTotalPages] = useState(1);
    const [searchParams] = useSearchParams();

    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 10;

    const fetchPoints = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await poiApi.findAll(page, limit);
            setPoints(data.points || []);
            setTotalPages(data.totalPages);
        } catch (error: any) {
            toast.error('Error al cargar puntos de interés');
        } finally {
            setIsLoading(false);
        }
    }, [page, limit]);

    useEffect(() => {
        fetchPoints();
    }, [fetchPoints]);

    const createPoint = async (data: CreatePOIDTO) => {
        setIsLoading(true);
        try {
            await poiApi.create(data);
            toast.success('Punto de interés creado');
            await fetchPoints();
            return true;
        } catch (error: any) {
            toast.error('Error al crear punto de interés');
        } finally {
            setIsLoading(false);
        }
    };

    const updatePoint = async (id: number, data: import('../types/types').UpdatePOIDTO) => {
        try {
            await poiApi.update(id, data);
            toast.success('Punto de interés actualizado');
            await fetchPoints();
            return true;
        } catch {
            toast.error('Error al actualizar punto de interés');
        }
    };

    const deletePoint = async (id: number) => {
        try {
            await poiApi.delete(id);
            toast.success('Punto de interés eliminado');
            await fetchPoints();
            return true;
        } catch {
            toast.error('Error al eliminar punto de interés');
        }
    };

    return { points, isLoading, totalPages, createPoint, updatePoint, deletePoint, fetchPoints };
}
