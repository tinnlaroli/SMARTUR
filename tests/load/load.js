/**
 * LOAD TEST — Rampa gradual 0→10→50→100→0 usuarios, ~5 minutos
 *
 * Simula crecimiento de tráfico normal. Mide latencia P95 y tasa de errores.
 * El objetivo es confirmar que el sistema se mantiene estable bajo carga esperada.
 *
 * Uso:
 *   k6 run tests/load/load.js \
 *     -e BASE_URL=https://app.smartur.online \
 *     -e ACCESS_TOKEN=eyJ... \
 *     -e USER_ID=42
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { API, HEADERS, USER_ID, ACCESS_TOKEN, THRESHOLDS } from './config.js';

const errors     = new Rate('error_rate');
const recLatency = new Trend('recommend_duration', true);
const req429     = new Counter('rate_limit_hits');

export const options = {
    stages: [
        { duration: '30s', target: 10  },  // calentamiento
        { duration: '2m',  target: 50  },  // carga normal
        { duration: '1m',  target: 100 },  // pico moderado
        { duration: '30s', target: 0   },  // enfriamiento
    ],
    thresholds: {
        ...THRESHOLDS,
        error_rate: ['rate<0.05'],
    },
};

export default function () {
    if (!ACCESS_TOKEN || !USER_ID) return;

    const headers = HEADERS();

    // Cada VU simula el flujo completo de un usuario turista
    const t0  = Date.now();
    const rec = http.post(
        `${API}/ml/recommend/${USER_ID}`,
        JSON.stringify({ top_n: 5 }),
        { headers, tags: { endpoint: 'recommend' } },
    );
    recLatency.add(Date.now() - t0);

    if (rec.status === 429) req429.add(1);

    const ok = check(rec, {
        'recommend 2xx':    (r) => r.status >= 200 && r.status < 300,
        'no server error':  (r) => r.status < 500,
    });
    errors.add(!ok);

    if (ok && rec.body) {
        try {
            const body    = JSON.parse(rec.body);
            const session = body.session_id;
            const item    = body.recommendations?.[0];

            if (session && item) {
                const fb = http.post(
                    `${API}/ml/feedback`,
                    JSON.stringify({
                        session_id: session,
                        item_id:    item.id || item.poi_id || item.item_id,
                        rank_pos:   0,
                        clicked:    Math.random() > 0.5,
                    }),
                    { headers, tags: { endpoint: 'feedback' } },
                );
                check(fb, { 'feedback 2xx': (r) => r.status >= 200 && r.status < 300 });
                if (fb.status === 429) req429.add(1);
            }
        } catch (_) {}
    }

    // Pausa realista entre acciones (~2-4s por usuario)
    sleep(Math.random() * 2 + 2);
}

export function handleSummary(data) {
    const p95      = data.metrics.http_req_duration?.values?.['p(95)'] ?? 0;
    const errRate  = (data.metrics.error_rate?.values?.rate ?? 0) * 100;
    const hits429  = data.metrics.rate_limit_hits?.values?.count ?? 0;
    const recP95   = data.metrics.recommend_duration?.values?.['p(95)'] ?? 0;

    console.log('\n═══════════════════════════════════════');
    console.log('       RESULTADO LOAD TEST');
    console.log('═══════════════════════════════════════');
    console.log(`  Latencia P95 global : ${p95.toFixed(0)} ms`);
    console.log(`  Latencia P95 ML     : ${recP95.toFixed(0)} ms`);
    console.log(`  Tasa de errores     : ${errRate.toFixed(2)} %`);
    console.log(`  Errores 429         : ${hits429}`);
    console.log('═══════════════════════════════════════\n');

    return {};
}
