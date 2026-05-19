import { useCallback, useEffect, useState } from 'react';
import type { Profile, CreateProfileDTO, UpdateProfileDTO } from '../types/types';
import { useSearchParams } from 'react-router-dom';
import { profileApi } from '../api/profileApi';
import { useToast } from '../../../shared/context/ToastContext';

export function useProfiles() {
    const toast = useToast();
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [totalPages, setTotalPages] = useState(1);
    const [searchParams] = useSearchParams();

    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 10;

    const fetchProfiles = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await profileApi.findAll(page, limit);
            setProfiles(Array.isArray(data.travelerProfiles) ? data.travelerProfiles : []);
            setTotalPages(data.totalPages || 1);
        } catch (error: any) {
            toast.error('Error al cargar perfiles');
        } finally {
            setIsLoading(false);
        }
    }, [page, limit]);

    useEffect(() => {
        fetchProfiles();
    }, [fetchProfiles]);

    const createProfile = async (data: CreateProfileDTO) => {
        setIsLoading(true);
        try {
            await profileApi.create(data);
            toast.success('Perfil creado');
            await fetchProfiles();
            return true;
        } catch (error: any) {
            toast.error('Error al crear perfil');
        } finally {
            setIsLoading(false);
        }
    };

    const updateProfile = async (id: number, data: UpdateProfileDTO) => {
        setIsLoading(true);
        try {
            await profileApi.update(id, data);
            toast.success('Perfil actualizado');
            await fetchProfiles();
            return true;
        } catch (error: any) {
            toast.error('Error al actualizar perfil');
        } finally {
            setIsLoading(false);
        }
    };

    return { profiles, isLoading, totalPages, createProfile, updateProfile, fetchProfiles };
}
