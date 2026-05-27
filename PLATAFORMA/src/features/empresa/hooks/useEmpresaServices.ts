import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { empresaApi, type EmpresaService } from '../api/empresaApi';

export function useEmpresaServices() {
    const [services, setServices] = useState<EmpresaService[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchParams, setSearchParams] = useSearchParams();

    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';

    const fetchServices = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { services: rows } = await empresaApi.getServices();
            setServices(rows);
        } catch {
            setError('Error al cargar servicios.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchServices();
    }, [fetchServices]);

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
        setServices,
        isLoading,
        error,
        page,
        limit,
        search,
        setSearch,
        setSearchParams,
        fetchServices,
    };
}
