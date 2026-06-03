/**
 * SMOKE TEST — 1 usuario virtual, 30 segundos
 *
 * Verifica que el flujo principal funciona correctamente antes de correr
 * pruebas de carga reales. Falla rápido si algo está roto.
 *
 * Uso:
 *   k6 run tests/load/smoke.js \
 *     -e BASE_URL=https://app.smartur.online \
 *     -e ACCESS_TOKEN=eyJ... \
 *     -e USER_ID=42
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';
import { API, HEADERS, USER_ID, ACCESS_TOKEN, THRESHOLDS } from './config.js';

const recommendLatency = new Trend('recommend_duration', true);
const feedbackLatency  = new Trend('feedback_duration',  true);

export const options = {
    vus: 1,
    duration: '30s',
    thresholds: THRESHOLDS,
};

export default function () {
    if (!ACCESS_TOKEN || !USER_ID) {
        console.error('ERROR: Faltan ACCESS_TOKEN y USER_ID. Ver README en tests/load/');
        return;
    }

    const headers = HEADERS();

    // ── 1. Health check del modelo ML ────────────────────────────────────────
    const health = http.get(`${API}/ml/health`, { headers });
    check(health, { 'ML health 200': (r) => r.status === 200 });

    // ── 2. Recomendaciones ML ─────────────────────────────────────────────────
    const t0  = Date.now();
    const rec = http.post(
        `${API}/ml/recommend/${USER_ID}`,
        JSON.stringify({ top_n: 5 }),
        { headers, tags: { endpoint: 'recommend' } },
    );
    recommendLatency.add(Date.now() - t0);

    // Respuesta: { session_id, recommendations: [...], alpha, latency_ms }
    const recOk = check(rec, {
        'recommend 200':         (r) => r.status === 200,
        'recommend tiene items': (r) => {
            try {
                const b = JSON.parse(r.body);
                return Array.isArray(b.recommendations) && b.recommendations.length > 0;
            } catch { return false; }
        },
    });

    console.log(`[smoke] recommend: ${rec.status} — ${Date.now() - t0}ms`);

    // ── 3. Feedback ───────────────────────────────────────────────────────────
    if (recOk) {
        try {
            const body      = JSON.parse(rec.body);
            const sessionId = body.session_id;
            const firstItem = body.recommendations?.[0];

            if (sessionId && firstItem) {
                const t1 = Date.now();
                const fb = http.post(
                    `${API}/ml/feedback`,
                    JSON.stringify({
                        session_id: sessionId,
                        item_id:    firstItem.id || firstItem.poi_id || firstItem.item_id,
                        rank_pos:   0,
                        clicked:    true,
                    }),
                    { headers, tags: { endpoint: 'feedback' } },
                );
                feedbackLatency.add(Date.now() - t1);
                check(fb, { 'feedback 200': (r) => r.status === 200 });
                console.log(`[smoke] feedback: ${fb.status} — ${Date.now() - t1}ms`);
            }
        } catch (_) {}
    }

    // ── 4. Mis sesiones ───────────────────────────────────────────────────────
    const sessions = http.get(`${API}/ml/sessions/me`, { headers });
    check(sessions, { 'sessions/me 200': (r) => r.status === 200 });

    sleep(1);
}
