import { useState, useCallback } from 'react';
import { mlApi, type MLHealth } from '../api/mlApi';

export const useMLHealth = () => {
    const [data, setData] = useState<MLHealth | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchHealth = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await mlApi.getHealth();
            setData(result);
        } catch {
            setError('No se pudo cargar el estado del modelo ML.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { data, isLoading, error, fetchHealth };
};
