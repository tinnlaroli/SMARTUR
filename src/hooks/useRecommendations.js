// src/hooks/useRecommendations.js
import { useState, useCallback, useRef } from "react";
import { fetchRecommendations, fetchRecommendationsWithContext } from "../api/smartur";

export function useRecommendations() {
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
const [data, setData] = useState(null);
const abortRef = useRef(null);

const getRecommendations = useCallback(async ({ userId, alpha = 0.6, candidates = 200, k_cf = 20, token = null, context = null, signal = null }) => {
    setLoading(true); setError(null);

    // cancelar petición previa si existe
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    const finalSignal = signal || abortRef.current.signal;

    try {
        let json;
        if (context && Object.keys(context).length > 0) {
            console.log("[useRecommendations] POST with context");
            json = await fetchRecommendationsWithContext({
                userId,
                alpha,
                candidates,
                k_cf,
                context,
                signal: finalSignal,
                token,
            });
        } else {
            console.log("[useRecommendations] GET fallback (no context)");
            json = await fetchRecommendations({
                userId,
                alpha,
                candidates,
                k_cf,
                signal: finalSignal,
                token,
            });
        }

        setData(json);
        return json;
    } catch (err) {
        // Si la petición fue abortada (AbortController), no lo tratamos como error
        if (err?.name === "AbortError" || err?.message === "The operation was aborted.") {
            console.log("[useRecommendations] petición abortada (cancelada por el cliente)");
            return;
        }
        console.error("[useRecommendations] error:", err);
        setError(err?.message || String(err));
        throw err;
    } finally {
        setLoading(false);
    }
}, []);

const cancel = useCallback(() => {
    if (abortRef.current) {
        try {
            console.warn("[useRecommendations] abort called by:", new Error().stack)
            abortRef.current.abort()
            abortRef.current = null
        } catch(e) {
            console.error("[useRecommendations] Error during abort:", e)
        }
    }
}, []);

return { loading, error, data, getRecommendations, cancel };
}
