/**
 * STRESS TEST — Rampa agresiva 0→500 usuarios, ~10 minutos
 *
 * Objetivo: encontrar el punto de quiebre del sistema.
 * En qué VU count empiezan los errores, timeouts y 429s.
 *
 * ⚠️  ATENCIÓN: Esto puede saturar el VPS. Correr con cuidado.
 *     Monitorear en paralelo: docker stats en el VPS mientras corre.
 *
 * Uso:
 *   k6 run tests/load/stress.js \
 *     -e BASE_URL=https://app.smartur.online \
 *     -e ACCESS_TOKEN=eyJ... \
 *     -e USER_ID=42
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { API, HEADERS, USER_ID, ACCESS_TOKEN } from './config.js';

const errors        = new Rate('error_rate');
const timeouts      = new Counter('timeout_count');
const hits429       = new Counter('rate_limit_hits');
const hits503       = new Counter('service_unavailable');
const recLatency    = new Trend('recommend_duration', true);

export const options = {
    stages: [
        { duration: '1m', target: 50  },   // warmup
        { duration: '2m', target: 100 },   // presión normal
        { duration: '2m', target: 200 },   // presión alta
        { duration: '2m', target: 500 },   // punto de quiebre esperado
        { duration: '1m', target: 200 },   // ¿se recupera?
        { duration: '2m', target: 0   },   // enfriamiento
    ],
    thresholds: {
        // En stress test los thresholds son más laxos — queremos ver qué pasa, no fallar
        http_req_failed: ['rate<0.30'],     // tolerar hasta 30% de errores
        http_req_duration: ['p(99)<20000'], // timeout máximo 20s
    },
};

export default function () {
    if (!ACCESS_TOKEN || !USER_ID) return;

    const headers = HEADERS();

    const t0  = Date.now();
    const rec = http.post(
        `${API}/ml/recommend/${USER_ID}`,
        JSON.stringify({ top_n: 3 }),
        {
            headers,
            tags:    { endpoint: 'recommend' },
            timeout: '20s',
        },
    );
    const elapsed = Date.now() - t0;
    recLatency.add(elapsed);

    // Clasificar tipo de error
    if (rec.status === 429)  hits429.add(1);
    if (rec.status === 503)  hits503.add(1);
    if (rec.status === 0)    timeouts.add(1);   // k6 timeout / connection refused

    const ok = check(rec, {
        'no timeout':      (r) => r.status !== 0,
        'no server error': (r) => r.status < 500 || r.status === 0,
    });
    errors.add(!ok);

    // Sin sleep en stress test — presión máxima
    sleep(0.5);
}

export function handleSummary(data) {
    const p50     = data.metrics.http_req_duration?.values?.['p(50)']  ?? 0;
    const p95     = data.metrics.http_req_duration?.values?.['p(95)']  ?? 0;
    const p99     = data.metrics.http_req_duration?.values?.['p(99)']  ?? 0;
    const errRate = (data.metrics.error_rate?.values?.rate ?? 0) * 100;
    const n429    = data.metrics.rate_limit_hits?.values?.count ?? 0;
    const n503    = data.metrics.service_unavailable?.values?.count ?? 0;
    const nTo     = data.metrics.timeout_count?.values?.count ?? 0;
    const recP95  = data.metrics.recommend_duration?.values?.['p(95)'] ?? 0;
    const total   = data.metrics.http_reqs?.values?.count ?? 0;

    const verdict = errRate < 5  ? '✅ ESTABLE'
                  : errRate < 20 ? '⚠️  DEGRADADO'
                  :                '❌ SATURADO';

    console.log('\n═══════════════════════════════════════════');
    console.log('        RESULTADO STRESS TEST');
    console.log('═══════════════════════════════════════════');
    console.log(`  Veredicto           : ${verdict}`);
    console.log(`  Total requests      : ${total}`);
    console.log(`  Tasa de errores     : ${errRate.toFixed(2)} %`);
    console.log(`  Latencia P50        : ${p50.toFixed(0)} ms`);
    console.log(`  Latencia P95        : ${p95.toFixed(0)} ms`);
    console.log(`  Latencia P99        : ${p99.toFixed(0)} ms`);
    console.log(`  ML recommend P95    : ${recP95.toFixed(0)} ms`);
    console.log(`  Errores 429 (rate)  : ${n429}`);
    console.log(`  Errores 503 (down)  : ${n503}`);
    console.log(`  Timeouts            : ${nTo}`);
    console.log('═══════════════════════════════════════════\n');

    return {};
}
