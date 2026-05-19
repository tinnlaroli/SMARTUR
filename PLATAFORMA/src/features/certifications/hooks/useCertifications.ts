import { useCallback, useEffect, useState } from 'react';
import type { Certification, CreateCertificationDTO } from '../types/types';
import { useSearchParams } from 'react-router-dom';
import { certificationApi } from '../api/certificationApi';
import { useToast } from '../../../shared/context/ToastContext';

export function useCertifications() {
    const toast = useToast();
    const [certifications, setCertifications] = useState<Certification[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [totalPages, setTotalPages] = useState(1);
    const [searchParams] = useSearchParams();

    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 10;

    const fetchCertifications = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await certificationApi.findAll(page, limit);
            setCertifications(data.certifications || []);
            setTotalPages(data.totalPages);
        } catch (error: any) {
            toast.error('Error al cargar certificaciones');
        } finally {
            setIsLoading(false);
        }
    }, [page, limit]);

    useEffect(() => {
        fetchCertifications();
    }, [fetchCertifications]);

    const createCertification = async (data: CreateCertificationDTO) => {
        setIsLoading(true);
        try {
            await certificationApi.create(data);
            toast.success('Certificación registrada');
            await fetchCertifications();
            return true;
        } catch (error: any) {
            toast.error('Error al registrar certificación');
        } finally {
            setIsLoading(false);
        }
    };

    const updateStatus = async (id: number, status: string) => {
        setIsLoading(true);
        try {
            await certificationApi.updateStatus(id, status);
            toast.success('Estado actualizado');
            await fetchCertifications();
            return true;
        } catch (error: any) {
            toast.error('Error al actualizar estado');
        } finally {
            setIsLoading(false);
        }
    };

    return { certifications, isLoading, totalPages, createCertification, updateStatus, fetchCertifications };
}
