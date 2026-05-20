import { useCallback, useEffect, useState } from 'react';
import type { CreateCompanyDTO, Company, UpdateCompanyDTO } from '../types/types';
import { useSearchParams } from 'react-router-dom';
import { companyServices } from '../api/companyApi';
import axios from 'axios';
import { useToast } from '../../../shared/context/ToastContext';

export function useCompany() {
    const toast = useToast();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [company, setCompany] = useState<Company | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [totalPages, setTotalPages] = useState(1);

    const [searchParams, setSearchParams] = useSearchParams();

    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    const locationParam = searchParams.get('location');
    const location = locationParam ? Number(locationParam) : undefined;
    const sectorParam = searchParams.get('sector');
    const sector = sectorParam ? Number(sectorParam) : undefined;

    const fetchCompanies = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const data = await companyServices.findAll(page, limit, search, location, sector);
            setCompanies(data.companies);
            setTotalPages(data.totalPages);
        } catch (error: any) {
            toast.error('Error al cargar empresas');
        } finally {
            setIsLoading(false);
        }
    }, [page, limit, search, location, sector]);

    useEffect(() => {
        fetchCompanies();
    }, [fetchCompanies]);

    const findById = async (id: number) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await companyServices.findById(id);
            setCompany(data.company);
        } catch (error: any) {
            setError(error.message || 'Error al cargar empresa');
        } finally {
            setIsLoading(false);
        }
    };

    const createCompany = async (data: CreateCompanyDTO) => {
        setIsLoading(true);
        try {
            await companyServices.create(data);
            await fetchCompanies();
            toast.success('Empresa creada exitosamente', 'Cambios guardados');
            return true;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const message =
                    error.response?.data?.error ||
                    error.response?.data?.message ||
                    'Error inesperado';
                toast.error(message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const updateCompany = async (id: number, data: UpdateCompanyDTO) => {
        setIsLoading(true);
        try {
            await companyServices.update(id, data);
            toast.success('Empresa actualizada exitosamente', 'Cambios guardados');
            await fetchCompanies();
            return true;
        } catch (error: any) {
            toast.error('text-white');
        } finally {
            setIsLoading(false);
        }
    };

    const deleteCompany = async (id: number) => {
        setIsLoading(true);
        try {
            await companyServices.delete(id);
            toast.success('Empresa eliminada exitosamente', 'Cambios guardados');
            await fetchCompanies();
            return true;
        } catch (error: any) {
            toast.error('text-white');
        } finally {
            setIsLoading(false);
        }
    };

    const setSearch = (term: string) => {
        setSearchParams((prev) => {
            if (term) {
                prev.set('search', term);
            } else {
                prev.delete('search');
            }
            prev.set('page', '1');
            return prev;
        });
    };

    const setLocation = (locationId: number | undefined) => {
        setSearchParams((prev) => {
            if (locationId !== undefined) {
                prev.set('location', locationId.toString());
            } else {
                prev.delete('location');
            }
            prev.set('page', '1');
            return prev;
        });
    };

    const setSector = (sectorId: number | undefined) => {
        setSearchParams((prev) => {
            if (sectorId !== undefined) {
                prev.set('sector', sectorId.toString());
            } else {
                prev.delete('sector');
            }
            prev.set('page', '1');
            return prev;
        });
    };

    return {
        companies,
        isLoading,
        error,
        totalPages,
        company,
        fetchCompanies,
        findById,
        createCompany,
        updateCompany,
        deleteCompany,
        search,
        setSearch,
        location,
        setLocation,
        sector,
        setSector,
    };
}
