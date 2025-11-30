// src/api/smartur.js
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function handleResponse(res) {
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch(e) { json = text; }
  if (!res.ok) {
    const err = new Error(json?.detail || json?.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return json;
}

export async function fetchRecommendationsWithContext({ userId, alpha = 0.6, candidates = 200, k_cf = 20, context = {}, signal = null, token = null } = {}) {
  const url = `${API_BASE}/recommend/${userId}`;
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  console.log("[api] POST", url, { alpha, candidates, k_cf, context });
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ alpha, candidates, k_cf, context }),
    signal
  });

  return handleResponse(res);
}
