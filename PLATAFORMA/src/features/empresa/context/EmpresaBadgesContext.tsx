import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { api } from '../../../shared/api/axiosClient';

interface BadgeCounts {
    messages: number;
    changes: number;
}

interface EmpresaBadgesContextValue extends BadgeCounts {
    refresh: () => void;
}

const EmpresaBadgesContext = createContext<EmpresaBadgesContextValue>({
    messages: 0,
    changes: 0,
    refresh: () => {},
});

export function EmpresaBadgesProvider({ children }: { children: React.ReactNode }) {
    const [counts, setCounts] = useState<BadgeCounts>({ messages: 0, changes: 0 });
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetch = useCallback(async () => {
        try {
            const { data } = await api.get<BadgeCounts>('/empresa/badge-counts');
            setCounts(data);
        } catch {
            // silent — don't crash the sidebar on network error
        }
    }, []);

    useEffect(() => {
        void fetch();
        intervalRef.current = setInterval(fetch, 30_000);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [fetch]);

    return (
        <EmpresaBadgesContext.Provider value={{ ...counts, refresh: fetch }}>
            {children}
        </EmpresaBadgesContext.Provider>
    );
}

export const useBadges = () => useContext(EmpresaBadgesContext);
