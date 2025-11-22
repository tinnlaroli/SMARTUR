const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function requestJSON(url, options = {}) {
const res = await fetch(url, options);
const text = await res.text();
let data;
try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
if (!res.ok) {
    const err = (data && data.detail) ? data.detail : (data && data.message) ? data.message : `${res.status} ${res.statusText}`;
    const error = new Error(err);
    error.status = res.status;
    throw error;
}
return data;
}

export async function fetchRecommendations({ userId, alpha = 0.6, candidates = 200, k_cf = 20, signal = null, token = null }) {
if (!userId) throw new Error("userId requerido");
const url = `${API_URL}/recommend/${encodeURIComponent(userId)}?alpha=${alpha}&candidates=${candidates}&k_cf=${k_cf}`;
const headers = token ? { "Authorization": `Bearer ${token}` } : {};
return requestJSON(url, { method: "GET", headers, signal });
}

// Optional: endpoint to fetch manual path (if you want to show it in UI)
export async function fetchManualPath({ token = null } = {}) {
const url = `${API_URL}/manual`;
const headers = token ? { "Authorization": `Bearer ${token}` } : {};
return requestJSON(url, { method: "GET", headers });
}
