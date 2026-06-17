import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/rbacMiddleware.js';
import db from '../config/db.js';

const router = express.Router();

const MODELO_URL = process.env.MODELO_URL || 'http://modelo:8000';

/**
 * GET /api/v2/ml/health
 * Returns ML model health for the admin dashboard:
 *   - Latest stored algorithm metrics (RMSE, MAE)
 *   - Daily recommendation sessions over the last 30 days
 *   - Click-through rate on recommendations (30 days)
 */
router.get('/ml/health', verifyToken, async (req, res) => {
    // Each query runs independently so a missing table or empty result
    // never kills the entire endpoint — the dashboard degrades gracefully.
    const safeQuery = async (sql, fallback) => {
        try {
            const result = await db.query(sql);
            return result;
        } catch (err) {
            console.warn('[ml/health] query fallback:', err.message);
            return { rows: fallback };
        }
    };

    try {
        const [metricsRes, sessionsRes, feedbackRes] = await Promise.all([
            safeQuery(
                `SELECT metrics_json, created_at
                 FROM ml_model_metrics
                 ORDER BY created_at DESC
                 LIMIT 1`,
                [],
            ),
            safeQuery(
                `SELECT
                   COUNT(*)::int AS total,
                   AVG(execution_time_ms)::numeric(10,2) AS avg_latency_ms,
                   DATE_TRUNC('day', created_at)::date AS day
                 FROM ml_recommendation_session
                 WHERE created_at > NOW() - INTERVAL '30 days'
                 GROUP BY DATE_TRUNC('day', created_at)
                 ORDER BY day DESC`,
                [],
            ),
            safeQuery(
                `SELECT
                   COUNT(*)::int AS total,
                   SUM(CASE WHEN clicked THEN 1 ELSE 0 END)::int AS clicked
                 FROM ml_recommendation_feedback
                 WHERE created_at > NOW() - INTERVAL '30 days'`,
                [{ total: 0, clicked: 0 }],
            ),
        ]);

        res.json({
            latest_metrics: metricsRes.rows[0]?.metrics_json ?? null,
            daily_sessions: sessionsRes.rows,
            ctr_30d: feedbackRes.rows[0] ?? { total: 0, clicked: 0 },
        });
    } catch (err) {
        console.error('[ml/health] fatal error:', err.message);
        res.status(500).json({ message: 'Error al obtener estado del modelo ML.' });
    }
});

/**
 * GET /api/v2/ml/model-status
 * Returns live health of each ML sub-model (LightFM, RF, GBM, SVD, Content).
 * Proxies to MODELO /health and reshapes the response for the admin dashboard.
 */
router.get('/ml/model-status', verifyToken, async (req, res) => {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5_000);
        try {
            const r = await fetch(`${MODELO_URL}/health`, { signal: controller.signal });
            const data = await r.json().catch(() => ({}));
            res.json({
                engine_ready:  Boolean(data.engine_ready),
                rf_ready:      Boolean(data.rf_ready),
                gbm_ready:     Boolean(data.gbm_ready),
                svd_ready:     Boolean(data.svd_ready),
                lightfm_ready: Boolean(data.lightfm_ready),
                content_ready: Boolean(data.content_ready),
                users_count:   data.users_count ?? 0,
            });
        } finally {
            clearTimeout(timeout);
        }
    } catch (err) {
        // Non-fatal — dashboard degrades gracefully
        res.json({ engine_ready: false, rf_ready: false, gbm_ready: false,
                   svd_ready: false, lightfm_ready: false, content_ready: false, users_count: 0 });
    }
});

/**
 * POST /api/v2/ml/train
 * Triggers model retraining on MODELO (fire-and-forget from the dashboard).
 */
router.post('/ml/train', verifyToken, async (req, res) => {
    try {
        const modeloRes = await fetch(`${MODELO_URL}/train`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(10_000),
        });
        const data = await modeloRes.json().catch(() => ({}));
        res.json({ ok: true, message: data.message ?? 'Entrenamiento iniciado en background' });
    } catch (err) {
        console.error('[ml/train] error:', err.message);
        res.status(502).json({ message: 'No se pudo iniciar el entrenamiento.', detail: err.message });
    }
});

/**
 * POST /api/v2/ml/recommend/:userId
 * Proxies a recommendation request to the MODELO service,
 * persists the session to ml_recommendation_session, and returns the result.
 * Body: { alpha?, top_n?, context? }
 */
router.post('/ml/recommend/:userId', verifyToken, async (req, res) => {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) return res.status(400).json({ message: 'userId inválido.' });
    if (userId !== req.user.id && req.user.role_id !== 1) {
        return res.status(403).json({ message: 'Acceso no autorizado.' });
    }
    let { alpha = 0.2, top_n = 5, context = null } = req.body ?? {};
    alpha = Math.min(1, Math.max(0, parseFloat(alpha) || 0.2));
    top_n = Math.min(50, Math.max(1, parseInt(top_n, 10) || 5));
    const start = Date.now();

    try {
        const modeloRes = await fetch(`${MODELO_URL}/recommend/${userId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ alpha: +alpha, top_n: +top_n, context }),
            signal: AbortSignal.timeout(15_000),
        });

        if (!modeloRes.ok) {
            const detail = await modeloRes.text().catch(() => '');
            return res.status(502).json({ message: 'Modelo no disponible.', detail });
        }

        const data = await modeloRes.json();
        const latencyMs = Date.now() - start;

        const { rows } = await db.query(
            `INSERT INTO ml_recommendation_session
               (user_id, alpha, best_algorithm, execution_time_ms, context_json)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id`,
            [
                userId,
                alpha,
                'hybrid',
                latencyMs,
                JSON.stringify({ recommendations: data.recommendations, alpha: data.alpha }),
            ],
        );

        res.json({ ...data, session_id: rows[0].id, latency_ms: latencyMs });
    } catch (err) {
        if (err.name === 'TimeoutError' || err.name === 'AbortError') {
            return res.status(504).json({ message: 'El servicio de recomendaciones tardó demasiado.' });
        }
        console.error('[ml/recommend] proxy error:', err.message);
        res.status(502).json({ message: 'Servicio ML no disponible.', detail: err.message });
    }
});

/**
 * POST /api/v2/ml/feedback
 * Records whether a recommended item was clicked.
 * Body: { session_id, item_id, rank_pos, clicked }
 */
router.post('/ml/feedback', verifyToken, async (req, res) => {
    const { session_id, item_id, rank_pos, clicked = false } = req.body ?? {};
    if (!session_id || !item_id || rank_pos == null) {
        return res.status(400).json({ message: 'session_id, item_id y rank_pos son requeridos.' });
    }
    try {
        await db.query(
            `INSERT INTO ml_recommendation_feedback (session_id, item_id, rank_pos, clicked, clicked_at)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (session_id, item_id) DO UPDATE
               SET clicked    = GREATEST(ml_recommendation_feedback.clicked, EXCLUDED.clicked),
                   clicked_at = COALESCE(ml_recommendation_feedback.clicked_at, EXCLUDED.clicked_at)`,
            [session_id, item_id, parseInt(rank_pos, 10), Boolean(clicked), clicked ? new Date() : null],
        );
        res.json({ ok: true });
    } catch (err) {
        console.error('[ml/feedback] error:', err.message);
        res.status(500).json({ message: 'Error al registrar feedback.' });
    }
});

/**
 * GET /api/v2/ml/sessions/me
 * Returns the last 20 recommendation sessions for the authenticated user.
 * Used by the mobile app to restore history across devices / sessions.
 */
router.get('/ml/sessions/me', verifyToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const { rows } = await db.query(
            `SELECT id, created_at, best_algorithm, execution_time_ms, context_json
             FROM ml_recommendation_session
             WHERE user_id = $1
             ORDER BY created_at DESC
             LIMIT 20`,
            [userId],
        );
        res.json(rows);
    } catch (err) {
        console.error('[ml/sessions/me] error:', err.message);
        res.status(500).json({ message: 'Error al obtener sesiones.' });
    }
});

/**
 * GET /api/v2/ml/scheduler-config
 * Returns the current nightly retraining schedule from MODELO.
 * Readable by the PLATAFORMA admin dashboard without a UI restart.
 */
router.get('/ml/scheduler-config', verifyToken, requireRole([1]), async (req, res) => {
    try {
        const r = await fetch(`${MODELO_URL}/scheduler`, {
            signal: AbortSignal.timeout(5_000),
        });
        const data = await r.json().catch(() => ({}));
        res.json(data);
    } catch (_err) {
        // Non-fatal — dashboard degrades gracefully
        res.json({ enabled: false, hour: 2, minute: 0, next_run: null });
    }
});

/**
 * PUT /api/v2/ml/scheduler-config
 * Reschedules or enables/disables nightly retraining.
 * Body: { enabled: boolean, hour: number (0-23), minute?: number (0-59) }
 */
router.put('/ml/scheduler-config', verifyToken, requireRole([1]), async (req, res) => {
    try {
        const r = await fetch(`${MODELO_URL}/scheduler`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body),
            signal: AbortSignal.timeout(5_000),
        });
        const data = await r.json().catch(() => ({}));
        res.json(data);
    } catch (err) {
        console.error('[ml/scheduler-config] PUT error:', err.message);
        res.status(502).json({ message: 'No se pudo actualizar el scheduler.' });
    }
});

/**
 * GET /api/v2/ml/sessions/user/:userId
 * Returns AI quality metrics for a specific user. Admin only.
 */
router.get('/ml/sessions/user/:userId', verifyToken, requireRole([1]), async (req, res) => {
    const { userId } = req.params;
    try {
        const { rows } = await db.query(
            `SELECT
               COUNT(DISTINCT s.id)::int                                               AS total_sessions,
               COUNT(f.id)::int                                                        AS total_items_shown,
               COUNT(f.id) FILTER (WHERE f.clicked = true)::int                       AS total_clicks,
               ROUND(
                 CASE WHEN COUNT(f.id) > 0
                   THEN COUNT(f.id) FILTER (WHERE f.clicked = true)::numeric / COUNT(f.id) * 100
                   ELSE 0 END, 1
               )                                                                       AS ctr_pct,
               ROUND(AVG(s.execution_time_ms)::numeric, 0)::int                       AS avg_latency_ms,
               MAX(s.created_at)                                                       AS last_session_at,
               MODE() WITHIN GROUP (ORDER BY s.best_algorithm)                        AS top_algorithm
             FROM ml_recommendation_session s
             LEFT JOIN ml_recommendation_feedback f ON f.session_id = s.id
             WHERE s.user_id = $1`,
            [String(userId)],
        );
        res.json(rows[0] ?? { total_sessions: 0 });
    } catch (err) {
        console.error('[ml/sessions/user] error:', err.message);
        res.status(500).json({ message: 'Error al obtener métricas del usuario.' });
    }
});

/**
 * GET /api/v2/ml/extended-stats
 * Returns extended ML metrics for the redesigned observability dashboard:
 *   - user_distribution: cold-start vs warm session counts (30d)
 *   - top_places: TOP 10 recommended items with click stats (30d)
 *   - score_histogram: predicted score distribution across 0.5-unit buckets
 *   - active_users: distinct users in last 7d and 30d
 *   - category_error: placeholder for future per-category error breakdown
 */
router.get('/ml/extended-stats', verifyToken, requireRole([1]), async (req, res) => {
    const safeQuery = async (sql, fallback) => {
        try {
            const result = await db.query(sql);
            return result;
        } catch (err) {
            console.warn('[ml/extended-stats] query fallback:', err.message);
            return { rows: fallback };
        }
    };

    try {
        const [distRes, topRes, histRes, usersRes] = await Promise.all([
            safeQuery(
                `SELECT
                   COUNT(*) FILTER (WHERE best_algorithm IN ('lightfm','content','content_tfidf','cold_start'))::int AS cold_start,
                   COUNT(*) FILTER (WHERE best_algorithm NOT IN ('lightfm','content','content_tfidf','cold_start'))::int AS warm,
                   COUNT(*)::int AS total
                 FROM ml_recommendation_session
                 WHERE created_at > NOW() - INTERVAL '30 days'`,
                [{ cold_start: 0, warm: 0, total: 0 }],
            ),
            safeQuery(
                `SELECT
                   f.item_id,
                   COUNT(*)::int                                                              AS recommended_count,
                   COUNT(*) FILTER (WHERE f.clicked = true)::int                             AS clicked_count,
                   ROUND(
                     CASE WHEN COUNT(*) > 0
                     THEN COUNT(*) FILTER (WHERE f.clicked = true)::numeric / COUNT(*) * 100
                     ELSE 0 END, 1
                   )                                                                          AS ctr_pct
                 FROM ml_recommendation_feedback f
                 WHERE f.created_at > NOW() - INTERVAL '30 days'
                 GROUP BY f.item_id
                 ORDER BY recommended_count DESC
                 LIMIT 10`,
                [],
            ),
            safeQuery(
                `SELECT
                   CASE
                     WHEN score < 1.5 THEN '1.0-1.5'
                     WHEN score < 2.0 THEN '1.5-2.0'
                     WHEN score < 2.5 THEN '2.0-2.5'
                     WHEN score < 3.0 THEN '2.5-3.0'
                     WHEN score < 3.5 THEN '3.0-3.5'
                     WHEN score < 4.0 THEN '3.5-4.0'
                     WHEN score < 4.5 THEN '4.0-4.5'
                     ELSE '4.5-5.0'
                   END AS bucket,
                   COUNT(*)::int AS count
                 FROM (
                   SELECT (rec->>'score')::numeric AS score
                   FROM ml_recommendation_session s,
                        jsonb_array_elements((s.context_json::jsonb)->'recommendations') AS rec
                   WHERE s.created_at > NOW() - INTERVAL '30 days'
                     AND s.context_json IS NOT NULL
                 ) sub
                 WHERE score IS NOT NULL AND score BETWEEN 1.0 AND 5.0
                 GROUP BY 1
                 ORDER BY 1`,
                [],
            ),
            safeQuery(
                `SELECT
                   COUNT(DISTINCT user_id) FILTER (WHERE created_at > NOW() - INTERVAL '7 days')::int AS last_7d,
                   COUNT(DISTINCT user_id) FILTER (WHERE created_at > NOW() - INTERVAL '30 days')::int AS last_30d
                 FROM ml_recommendation_session`,
                [{ last_7d: 0, last_30d: 0 }],
            ),
        ]);

        res.json({
            user_distribution: distRes.rows[0] ?? { cold_start: 0, warm: 0, total: 0 },
            top_places: topRes.rows,
            score_histogram: histRes.rows,
            active_users: usersRes.rows[0] ?? { last_7d: 0, last_30d: 0 },
            category_error: [],
        });
    } catch (err) {
        console.error('[ml/extended-stats] fatal error:', err.message);
        res.status(500).json({ message: 'Error al obtener estadísticas extendidas ML.' });
    }
});

// ─── WellTur: Wellness Tourism Routes ────────────────────────────────────────

/**
 * POST /api/v2/ml/wellness/assess
 * Clasifica el perfil de vitalidad del usuario (Q1-Q4) y retorna Top-N destinos wellness.
 * Persiste el assessment y la sesión en BD.
 * Body: { q1, q2, q3, q4, top_n?, user_preferences?, region_filter? }
 */
router.post('/ml/wellness/assess', verifyToken, async (req, res) => {
    const userId = req.user.id;
    const { q1, q2, q3, q4, top_n = 3, user_preferences = null, region_filter = null, consent_given } = req.body ?? {};

    if (!consent_given) {
        return res.status(400).json({ message: 'Se requiere consentimiento explícito (consent_given: true).' });
    }
    if ([q1, q2, q3, q4].some(v => v == null || isNaN(Number(v)))) {
        return res.status(400).json({ message: 'q1, q2, q3 y q4 son requeridos (1-4).' });
    }
    for (const [name, v] of [['q1', q1], ['q2', q2], ['q3', q3], ['q4', q4]]) {
        const n = Number(v);
        if (n < 1 || n > 4) return res.status(400).json({ message: `${name} debe estar entre 1 y 4.` });
    }

    try {
        // 1. Proxy al modelo Python
        const modeloRes = await fetch(`${MODELO_URL}/wellness/assess`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ q1: +q1, q2: +q2, q3: +q3, q4: +q4, top_n: +top_n, user_preferences, region_filter }),
            signal: AbortSignal.timeout(15_000),
        });

        if (!modeloRes.ok) {
            const detail = await modeloRes.text().catch(() => '');
            return res.status(502).json({ message: 'Servicio wellness no disponible.', detail });
        }

        const data = await modeloRes.json();

        // 2. Persistir assessment con consentimiento explícito
        const { rows: assessRows } = await db.query(
            `INSERT INTO stress_assessment
               (user_id, q1_energia, q2_tension, q3_rumiacion, q4_activacion,
                modo_viaje, perfil_interno, confianza_ml, metodo_decision,
                consent_given, consent_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,TRUE,NOW())
             RETURNING assessment_id`,
            [
                userId, +q1, +q2, +q3, +q4,
                data.modo_viaje,
                data.perfil_interno,
                data.confianza,
                data.metodo,
            ],
        );
        const assessmentId = assessRows[0]?.assessment_id;

        // 3. Persistir sesión de recomendación wellness (tabla separada del motor ML existente)
        const recIds = (data.destinations ?? []).map(d => d.id_destino);
        const { rows: sessRows } = await db.query(
            `INSERT INTO wellness_recommendation_session
               (user_id, assessment_id, modo_viaje, recommended_ids, top_n)
             VALUES ($1,$2,$3,$4,$5)
             RETURNING session_id`,
            [userId, assessmentId, data.modo_viaje, JSON.stringify(recIds), +top_n],
        );

        res.json({
            ...data,
            assessment_id: assessmentId,
            session_id: sessRows[0]?.session_id,
        });
    } catch (err) {
        if (err.name === 'TimeoutError' || err.name === 'AbortError') {
            return res.status(504).json({ message: 'El servicio wellness tardó demasiado.' });
        }
        console.error('[wellness/assess] error:', err.message);
        res.status(500).json({ message: 'Error al procesar evaluación wellness.' });
    }
});

/**
 * POST /api/v2/ml/wellness/satisfaction
 * Registra satisfacción post-resultado (feedback loop 1-5).
 * Body: { session_id, fit_rating (1-5), feedback_text? }
 */
router.post('/ml/wellness/satisfaction', verifyToken, async (req, res) => {
    const userId = req.user.id;
    const { session_id, fit_rating, feedback_text = null } = req.body ?? {};

    if (!session_id || fit_rating == null) {
        return res.status(400).json({ message: 'session_id y fit_rating son requeridos.' });
    }
    const rating = parseInt(fit_rating, 10);
    if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'fit_rating debe estar entre 1 y 5.' });
    }

    try {
        await db.query(
            `INSERT INTO wellness_satisfaction (session_id, user_id, fit_rating, feedback_text)
             VALUES ($1,$2,$3,$4)
             ON CONFLICT (session_id) DO UPDATE
               SET fit_rating = EXCLUDED.fit_rating,
                   feedback_text = EXCLUDED.feedback_text`,
            [+session_id, userId, rating, feedback_text],
        );
        res.json({ ok: true });
    } catch (err) {
        console.error('[wellness/satisfaction] error:', err.message);
        res.status(500).json({ message: 'Error al guardar satisfacción.' });
    }
});

/**
 * GET /api/v2/ml/wellness/history/me
 * Retorna los últimos 10 assessments wellness del usuario autenticado.
 */
router.get('/ml/wellness/history/me', verifyToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const { rows } = await db.query(
            `SELECT a.assessment_id, a.modo_viaje, a.confianza_ml, a.created_at,
                    s.session_id, s.recommended_ids,
                    sat.fit_rating
             FROM stress_assessment a
             LEFT JOIN wellness_recommendation_session s ON s.assessment_id = a.assessment_id
             LEFT JOIN wellness_satisfaction sat ON sat.session_id = s.session_id
             WHERE a.user_id = $1
             ORDER BY a.created_at DESC
             LIMIT 10`,
            [userId],
        );
        res.json(rows);
    } catch (err) {
        console.error('[wellness/history] error:', err.message);
        res.status(500).json({ message: 'Error al obtener historial wellness.' });
    }
});

/**
 * DELETE /api/v2/ml/wellness/history/me
 * Borra el historial de assessments del usuario (LFPDPPP — derecho al olvido).
 */
router.delete('/ml/wellness/history/me', verifyToken, async (req, res) => {
    const userId = req.user.id;
    try {
        await db.query('DELETE FROM stress_assessment WHERE user_id = $1', [userId]);
        res.json({ ok: true, message: 'Historial de bienestar eliminado.' });
    } catch (err) {
        console.error('[wellness/history/delete] error:', err.message);
        res.status(500).json({ message: 'Error al eliminar historial.' });
    }
});

/**
 * GET /api/v2/ml/wellness/pending-count
 * Conteo de servicios/POIs con wellness_status='pending'. Para badge del admin.
 */
router.get('/ml/wellness/pending-count', verifyToken, requireRole([1, 2]), async (req, res) => {
    try {
        const { rows } = await db.query(
            `SELECT
               (SELECT COUNT(*)::int FROM tourist_service WHERE wellness_status='pending') AS services,
               (SELECT COUNT(*)::int FROM point_of_interest WHERE wellness_status='pending') AS pois`,
        );
        const r = rows[0] ?? { services: 0, pois: 0 };
        res.json({ total_pending: r.services + r.pois, services: r.services, pois: r.pois });
    } catch (err) {
        console.error('[wellness/pending-count] error:', err.message);
        res.json({ total_pending: 0, services: 0, pois: 0 });
    }
});

/**
 * GET /api/v2/ml/wellness/pending
 * Lista servicios y POIs con wellness_status='pending' para el admin.
 */
router.get('/ml/wellness/pending', verifyToken, requireRole([1, 2]), async (req, res) => {
    try {
        const [svcRes, poiRes] = await Promise.all([
            db.query(
                `SELECT ts.tourist_service_id AS id, ts.name, ts.is_wellness,
                        ts.wellness_status, ts.categoria_wellness,
                        ts.nivel_aislamiento, ts.restauracion_pasiva, ts.demanda_fisica,
                        ts.descripcion_bienestar,
                        c.business_name AS empresa,
                        'service' AS type
                 FROM tourist_service ts
                 LEFT JOIN company c ON c.company_id = ts.company_id
                 WHERE ts.wellness_status = 'pending'
                 ORDER BY ts.tourist_service_id DESC`,
            ),
            db.query(
                `SELECT poi_id AS id, name, is_wellness, wellness_status,
                        categoria_wellness, nivel_aislamiento, restauracion_pasiva,
                        demanda_fisica, descripcion_bienestar, 'poi' AS type
                 FROM point_of_interest
                 WHERE wellness_status = 'pending'
                 ORDER BY poi_id DESC`,
            ),
        ]);
        res.json({ items: [...svcRes.rows, ...poiRes.rows] });
    } catch (err) {
        console.error('[wellness/pending] error:', err.message);
        res.status(500).json({ message: 'Error al obtener pendientes wellness.' });
    }
});

/**
 * PATCH /api/v2/ml/wellness/review/:type/:id
 * Admin aprueba o rechaza un servicio/POI wellness.
 * :type = 'service' | 'poi'
 * Body: { action: 'approved'|'rejected', nivel_aislamiento?, restauracion_pasiva?,
 *         demanda_fisica?, categoria_wellness?, admin_notes? }
 */
router.patch('/ml/wellness/review/:type/:id', verifyToken, requireRole([1, 2]), async (req, res) => {
    const { type, id } = req.params;
    const {
        action,
        nivel_aislamiento,
        restauracion_pasiva,
        demanda_fisica,
        categoria_wellness,
        admin_notes,
    } = req.body ?? {};

    if (!['approved', 'rejected'].includes(action)) {
        return res.status(400).json({ message: 'action debe ser "approved" o "rejected".' });
    }
    if (!['service', 'poi'].includes(type)) {
        return res.status(400).json({ message: 'type debe ser "service" o "poi".' });
    }

    const table = type === 'service' ? 'tourist_service' : 'point_of_interest';
    const pk = type === 'service' ? 'tourist_service_id' : 'poi_id';

    try {
        const sets = [
            `wellness_status = '${action}'`,
            `wellness_reviewed_at = NOW()`,
            `wellness_reviewed_by = ${req.user.id}`,
        ];
        if (admin_notes != null) sets.push(`wellness_admin_notes = '${admin_notes.replace(/'/g, "''")}'`);
        if (action === 'approved') {
            if (nivel_aislamiento != null) sets.push(`nivel_aislamiento = ${parseFloat(nivel_aislamiento)}`);
            if (restauracion_pasiva != null) sets.push(`restauracion_pasiva = ${parseFloat(restauracion_pasiva)}`);
            if (demanda_fisica != null) sets.push(`demanda_fisica = ${parseFloat(demanda_fisica)}`);
            if (categoria_wellness) sets.push(`categoria_wellness = '${categoria_wellness}'`);
            sets.push(`is_wellness = TRUE`);
        }

        await db.query(
            `UPDATE ${table} SET ${sets.join(', ')} WHERE ${pk} = $1`,
            [parseInt(id, 10)],
        );
        res.json({ ok: true, action, type, id });
    } catch (err) {
        console.error('[wellness/review] error:', err.message);
        res.status(500).json({ message: 'Error al actualizar estado wellness.' });
    }
});

/**
 * GET /api/v2/ml/wellness/stats
 * Métricas wellness para el admin dashboard.
 */
router.get('/ml/wellness/stats', verifyToken, requireRole([1, 2]), async (req, res) => {
    const safeQ = async (sql, fallback) => {
        try { return (await db.query(sql)).rows; }
        catch { return fallback; }
    };
    const [counts, modeDist, satisfaction] = await Promise.all([
        safeQ(
            `SELECT
               COUNT(*) FILTER (WHERE wellness_status='pending')::int  AS pending,
               COUNT(*) FILTER (WHERE wellness_status='approved')::int AS approved,
               COUNT(*) FILTER (WHERE wellness_status='rejected')::int AS rejected
             FROM (
               SELECT wellness_status FROM tourist_service WHERE is_wellness=TRUE
               UNION ALL
               SELECT wellness_status FROM point_of_interest WHERE is_wellness=TRUE
             ) t`,
            [{ pending: 0, approved: 0, rejected: 0 }],
        ),
        safeQ(
            `SELECT modo_viaje, COUNT(*)::int AS count
             FROM stress_assessment
             WHERE created_at > NOW() - INTERVAL '30 days'
             GROUP BY modo_viaje ORDER BY count DESC`,
            [],
        ),
        safeQ(
            `SELECT ROUND(AVG(fit_rating),2)::float AS avg_rating, COUNT(*)::int AS responses
             FROM wellness_satisfaction
             WHERE created_at > NOW() - INTERVAL '30 days'`,
            [{ avg_rating: null, responses: 0 }],
        ),
    ]);
    res.json({
        service_counts: counts[0] ?? { pending: 0, approved: 0, rejected: 0 },
        modo_distribution: modeDist,
        satisfaction: satisfaction[0] ?? { avg_rating: null, responses: 0 },
    });
});

// ── GET /api/v2/ml/wellness/metrics ──────────────────────────────────────────
/**
 * Proxy a MODELO /wellness/metrics — clasificador accuracy/F1.
 * Solo admin y turismólogos.
 */
router.get('/ml/wellness/metrics', verifyToken, requireRole([1, 2]), async (req, res) => {
    try {
        const resp = await fetch(`${MODELO_URL}/wellness/metrics`);
        if (resp.status === 404) {
            return res.status(404).json({ error: 'Modelo no entrenado aún. Ejecuta /ml/wellness/train primero.' });
        }
        if (!resp.ok) throw new Error(`MODELO responded ${resp.status}`);
        const data = await resp.json();
        res.json(data);
    } catch (err) {
        console.error('[wellness-metrics]', err.message);
        res.status(503).json({ error: 'No se pudo obtener métricas del modelo', detail: err.message });
    }
});

export default router;
