import { useCallback, useEffect, useState } from 'react';
import type {
    CreateTouristServiceDTO,
    TouristService,
    UpdateTouristServiceDTO,
} from '../types/types';
import { useSearchParams } from 'react-router-dom';
import { touristServiceApi } from '../api/touristServiceApi';
import axios from 'axios';
import { useToast } from '../../../shared/context/ToastContext';

export function useTouristService() {
    const toast = useToast();
    const [services, setServices] = useState<TouristService[]>([]);
    const [service, setService] = useState<TouristService | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [totalPages, setTotalPages] = useState(1);

    const [searchParams, setSearchParams] = useSearchParams();

    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    const companyParam = searchParams.get('company');
    const company = companyParam ? Number(companyParam) : undefined;
    const type = searchParams.get('type') || undefined;
    const activeParam = searchParams.get('active');
    const active = activeParam === 'true' ? true : activeParam === 'false' ? false : undefined;

    const fetchServices = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await touristServiceApi.findAll(
                page,
                limit,
                search,
                company,
                type,
                active
            );
            setServices(data.services);
            setTotalPages(data.totalPages);
        } catch (error: any) {
            toast.error('Error al cargar servicios');
        } finally {
            setIsLoading(false);
        }
    }, [page, limit, search, company, type, active]);

    useEffect(() => {
        fetchServices();
    }, [fetchServices]);

    const findById = async (id: number) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await touristServiceApi.findById(id);
            setService(data.service);
        } catch (error: any) {
            setError(error.message || 'Error al cargar servicio');
        } finally {
            setIsLoading(false);
        }
    };

    const createService = async (data: CreateTouristServiceDTO) => {
        setIsLoading(true);
        try {
            await touristServiceApi.create(data);
            await fetchServices();
            toast.success('Servicio creado exitosamente');
            return true;
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                toast.error('');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const updateService = async (id: number, data: UpdateTouristServiceDTO) => {
        setIsLoading(true);
        try {
            await touristServiceApi.update(id, data);
            toast.success('Servicio actualizado exitosamente');
            await fetchServices();
            return true;
        } catch (error: any) {
            toast.error('');
        } finally {
            setIsLoading(false);
        }
    };

    const deleteService = async (id: number) => {
        setIsLoading(true);
        try {
            await touristServiceApi.delete(id);
            toast.success('Servicio eliminado (lógicamente)');
            await fetchServices();
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
        services,
        isLoading,
        error,
        totalPages,
        service,
        fetchServices,
        findById,
        createService,
        updateService,
        deleteService,
        search,
        setSearch,
    };
}
