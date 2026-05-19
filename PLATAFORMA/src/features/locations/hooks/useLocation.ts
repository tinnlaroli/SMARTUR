import { useCallback, useEffect, useState } from 'react';
import type { CreateLocationDTO, Location, UpdateLocationDTO } from '../types/types';
import { useSearchParams } from 'react-router-dom';
import { locationApi } from '../api/locationApi';
import axios from 'axios';
import { useToast } from '../../../shared/context/ToastContext';

export function useLocation() {
    const toast = useToast();
    const [locations, setLocations] = useState<Location[]>([]);
    const [location, setLocation] = useState<Location | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [totalPages, setTotalPages] = useState(1);

    const [searchParams, setSearchParams] = useSearchParams();

    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    const stateFilter = searchParams.get('state') || undefined;

    const fetchLocations = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await locationApi.findAll(page, limit, search, stateFilter);
            setLocations(data.locations);
            setTotalPages(data.totalPages);
        } catch (error: any) {
            toast.error('Error al cargar ubicaciones');
        } finally {
            setIsLoading(false);
        }
    }, [page, limit, search, stateFilter]);

    useEffect(() => {
        fetchLocations();
    }, [fetchLocations]);

    const findById = async (id: number) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await locationApi.findById(id);
            setLocation(data.location);
        } catch (error: any) {
            setError(error.message || 'Error al cargar ubicación');
        } finally {
            setIsLoading(false);
        }
    };

    const createLocation = async (data: CreateLocationDTO) => {
        setIsLoading(true);
        try {
            await locationApi.create(data);
            await fetchLocations();
            toast.success('Ubicación creada exitosamente');
            return true;
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                toast.error('');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const updateLocation = async (id: number, data: UpdateLocationDTO) => {
        setIsLoading(true);
        try {
            await locationApi.update(id, data);
            toast.success('Ubicación actualizada exitosamente');
            await fetchLocations();
            return true;
        } catch (error: any) {
            toast.error('');
        } finally {
            setIsLoading(false);
        }
    };

    const deleteLocation = async (id: number) => {
        setIsLoading(true);
        try {
            await locationApi.delete(id);
            toast.success('Ubicación eliminada exitosamente');
            await fetchLocations();
            return true;
        } catch (error: any) {
            toast.error('');
        } finally {
            setIsLoading(false);
        }
    };

    const setSearch = (term: string) => {
        setSearchParams((prev) => {
            if (term) prev.set('search', term);
            else prev.delete('search');
            prev.set('page', '1');
            return prev;
        });
    };

    return {
        locations,
        isLoading,
        error,
        totalPages,
        location,
        fetchLocations,
        findById,
        createLocation,
        updateLocation,
        deleteLocation,
        search,
        setSearch,
    };
}
