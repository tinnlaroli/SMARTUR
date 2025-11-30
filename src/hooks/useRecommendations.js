// src/hooks/useRecommendations.js
import { useState, useRef, useCallback } from "react";
import { fetchRecommendationsWithContext } from "../api/smartur";

export function useRecommendations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const abortRef = useRef(null);

  const cancel = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  };

  const getRecommendations = useCallback(async ({ userId, alpha = 0.6, candidates = 200, k_cf = 20, context = {}, token = null } = {}) => {
    // cancel previous
    cancel();
    const controller = new AbortController();
    abortRef.current = controller;
    const signal = controller.signal;

    setLoading(true);
    setError(null);

    try {
      const json = await fetchRecommendationsWithContext({
        userId, alpha, candidates, k_cf, context, signal, token
      });
      setData(json);
      return json;           // <-- IMPORTANTE: retornamos el JSON al componente llamador
    } catch (err) {
      if (err?.name === "AbortError" || err?.message === "The operation was aborted.") {
        console.log("[useRecommendations] request aborted");
        return null;
      }
      console.error("[useRecommendations] error:", err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, data, getRecommendations, cancel };
}

export default useRecommendations;
