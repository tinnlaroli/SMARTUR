import { useState, useCallback, useRef } from "react";
import { fetchRecommendations } from "../api/smartur";

export function useRecommendations() {
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
const [data, setData] = useState(null);
const abortRef = useRef(null);

const getRecommendations = useCallback(async ({ userId, alpha = 0.6, candidates = 200, k_cf = 20, token = null }) => {
    setLoading(true); setError(null);
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    try {
    const json = await fetchRecommendations({
        userId,
        alpha,
        candidates,
        k_cf,
        signal: abortRef.current.signal,
        token
    });
    setData(json);
    return json;
    } catch (err) {
    if (err.name === "AbortError") return;
    setError(err.message || String(err));
    throw err;
    } finally {
    setLoading(false);
    }
}, []);

const cancel = () => abortRef.current?.abort();

return { loading, error, data, getRecommendations, cancel };
}
