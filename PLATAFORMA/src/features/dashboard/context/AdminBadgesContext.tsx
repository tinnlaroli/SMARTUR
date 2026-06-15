import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { api } from '../../../shared/api/axiosClient';

interface AdminBadgeCounts {
    'company-verification': number;
    approval: number;
    disputes: number;
}

interface AdminBadgesContextValue extends AdminBadgeCounts {
    refresh: () => void;
}

const AdminBadgesContext = createContext<AdminBadgesContextValue>({
    'company-verification': 0,
    approval: 0,
    disputes: 0,
    refresh: () => {},
});

export function AdminBadgesProvider({ children }: { children: React.ReactNode }) {
    const [counts, setCounts] = useState<AdminBadgeCounts>({
        'company-verification': 0,
        approval: 0,
        disputes: 0,
    });
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchCounts = useCallback(async () => {
        try {
            const [companiesRes, servicesRes, poisRes, disputesRes] = await Promise.allSettled([
                api.get('/admin/companies', { params: { status: 'documents_submitted', limit: 1 } }),
                api.get('/admin/services', { params: { status: 'pending_review', limit: 1 } }),
                api.get('/admin/pois/pending'),
                api.get('/admin-change-log', { params: { status: 'disputed', limit: 1 } }),
            ]);

            const get = (r: PromiseSettledResult<{ data: { total?: number; count?: number } }>) =>
                r.status === 'fulfilled' ? (r.value.data.total ?? r.value.data.count ?? 0) : 0;

            setCounts({
                'company-verification': get(companiesRes as PromiseSettledResult<{ data: { total?: number; count?: number } }>),
                approval: get(servicesRes as PromiseSettledResult<{ data: { total?: number; count?: number } }>) +
                          get(poisRes as PromiseSettledResult<{ data: { total?: number; count?: number } }>),
                disputes: get(disputesRes as PromiseSettledResult<{ data: { total?: number; count?: number } }>),
            });
        } catch {
            // silent
        }
    }, []);

    useEffect(() => {
        void fetchCounts();
        intervalRef.current = setInterval(fetchCounts, 60_000);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [fetchCounts]);

    return (
        <AdminBadgesContext.Provider value={{ ...counts, refresh: fetchCounts }}>
            {children}
        </AdminBadgesContext.Provider>
    );
}

export const useAdminBadges = () => useContext(AdminBadgesContext);
