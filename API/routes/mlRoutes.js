import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/rbacMiddleware.js';
import db from '../config/db.js';
import { hasCompleteWellnessEvidence } from '../utils/wellnessEvidence.js';

const router = express.Router();
const WELLNESS_DIMENSIONS = new Set(['physical', 'mental', 'emotional', 'spiritual', 'social', 'environmental']);
const WELLNESS_CATEGORIES = new Set(['Termal', 'Spa', 'Naturaleza', 'Movimiento', 'Cultural', 'Gastronomía saludable', 'Comunidad', 'Retiro', 'Otro']);

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

        // El MODELO es la fuente de verdad de las métricas del artefacto
        // actualmente cargado. La fila de PostgreSQL puede pertenecer a una
        // generación anterior (por ejemplo, antes del bootstrap sintético),
        // así que solo se usa como respaldo si el servicio no responde.
        let latestMetrics = metricsRes.rows[0]?.metrics_json ?? null;
        try {
            const modeloMetrics = await fetch(`${MODELO_URL}/metrics`, {
                signal: AbortSignal.timeout(5_000),
            });
            if (modeloMetrics.ok) {
                latestMetrics = await modeloMetrics.json();
            }
        } catch (metricsErr) {
            console.warn('[ml/health] modelo metrics fallback:', metricsErr.message);
        }

        res.json({
            latest_metrics: latestMetrics,
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
router.post('/ml/train', verifyToken, requireRole([1]), async (req, res) => {
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
 * POST /api/v2/ml/cross-validation
 * Inicia k-fold cross-validation (CF/RF/GBM) en MODELO, en background.
 */
router.post('/ml/cross-validation', verifyToken, requireRole([1]), async (req, res) => {
    try {
        const modeloRes = await fetch(`${MODELO_URL}/cross-validation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(10_000),
        });
        const data = await modeloRes.json().catch(() => ({}));
        res.json({ ok: true, message: data.message ?? 'Cross-validation iniciada en background' });
    } catch (err) {
        console.error('[ml/cross-validation] error:', err.message);
        res.status(502).json({ message: 'No se pudo iniciar la cross-validation.', detail: err.message });
    }
});

/**
 * GET /api/v2/ml/cross-validation
 * Proxy al último resultado de k-fold cross-validation guardado en MODELO.
 */
router.get('/ml/cross-validation', verifyToken, requireRole([1, 4]), async (req, res) => {
    try {
        const modeloRes = await fetch(`${MODELO_URL}/cross-validation`, {
            signal: AbortSignal.timeout(10_000),
        });
        if (modeloRes.status === 404) {
            return res.status(404).json({ message: 'Sin resultados de cross-validation aún.' });
        }
        const data = await modeloRes.json();
        res.json(data);
    } catch (err) {
        console.error('[ml/cross-validation GET] error:', err.message);
        res.status(502).json({ message: 'No se pudo obtener la cross-validation.', detail: err.message });
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
        const { rows: sessionRows } = await db.query(
            `SELECT user_id FROM ml_recommendation_session WHERE id = $1`,
            [session_id],
        );
        if (!sessionRows.length) {
            return res.status(404).json({ message: 'Sesión de recomendación no encontrada.' });
        }
        if (sessionRows[0].user_id !== req.user.id && req.user.role_id !== 1) {
            return res.status(403).json({ message: 'No puedes registrar feedback para esta sesión.' });
        }

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
// Rol 4 = 'turismologo' (ver bd.sql) — puede VER la config del scheduler
// desde ML/Observabilidad IA, pero no cambiarla (el PUT de abajo sigue
// restringido a admin). El router de PLATAFORMA ya le da acceso a la
// página completa (allowedRoles={[1,4]} en router.tsx) — antes esta y
// otras rutas de solo lectura la dejaban fuera y le tiraban 403.
router.get('/ml/scheduler-config', verifyToken, requireRole([1, 4]), async (req, res) => {
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
router.get('/ml/extended-stats', verifyToken, requireRole([1, 4]), async (req, res) => {
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

// Retain an explicit response for clients with an older build. These custom
// questions and their synthetic target labels were never psychometrically validated.
router.post('/ml/wellness/assess', verifyToken, (_req, res) => res.status(410).json({
    message: 'La evaluación de estrés fue retirada porque no estaba validada. Usa /api/v2/ml/wellness/recommend para elegir preferencias de viaje.',
}));

/**
 * Preference-first Welltur flow. Candidate places always come from active,
 * admin-approved SMARTUR records; MODELO never reads the static wellness CSV.
 */
router.post('/ml/wellness/recommend', verifyToken, async (req, res) => {
    const userId = req.user.id;
    const { preferences = {}, top_n = 3, consent_given } = req.body ?? {};
    if (!preferences || typeof preferences !== 'object' || Array.isArray(preferences)) {
        return res.status(400).json({ message: 'preferences debe ser un objeto válido.' });
    }
    const allowedActivity = new Set(['low', 'moderate', 'high']);
    const dimensions = preferences.wellness_dimensions;
    const activity = preferences.activity_level;
    const regionFilter = typeof preferences.region_filter === 'string' ? preferences.region_filter.trim() : '';
    if (preferences.region_filter != null && typeof preferences.region_filter !== 'string') {
        return res.status(400).json({ message: 'region_filter debe ser texto.' });
    }
    if (regionFilter.length > 100) {
        return res.status(400).json({ message: 'region_filter no debe superar 100 caracteres.' });
    }

    if (typeof consent_given !== 'boolean') {
        return res.status(400).json({ message: 'Indica si deseas guardar tus preferencias en el historial.' });
    }
    if (!Array.isArray(dimensions) || dimensions.length < 1 || dimensions.length > 3 ||
        new Set(dimensions).size !== dimensions.length || dimensions.some((d) => !WELLNESS_DIMENSIONS.has(d))) {
        return res.status(400).json({ message: 'Elige entre una y tres dimensiones válidas.' });
    }
    if (!allowedActivity.has(activity)) {
        return res.status(400).json({ message: 'El nivel de actividad no es válido.' });
    }
    const topN = Number(top_n);
    if (!Number.isInteger(topN) || topN < 1 || topN > 10) {
        return res.status(400).json({ message: 'top_n debe ser un entero entre 1 y 10.' });
    }

    let client;
    try {
        const { rows: catalogRows } = await db.query(
            `SELECT 'poi:' || p.id::text AS id_destino,
                    p.name AS nombre_lugar, COALESCE(l.state, '') AS estado,
                    p.categoria_wellness, p.wellness_dimensions,
                    p.demanda_fisica,
                    p.descripcion_bienestar, p.image_url,
                    COALESCE(p.latitude, l.latitude) AS lat,
                    COALESCE(p.longitude, l.longitude) AS lon
               FROM point_of_interest p
               LEFT JOIN location l ON l.id_location = p.id_location
              WHERE p.is_wellness = TRUE AND p.wellness_status = 'approved'
                AND p.is_active = TRUE AND p.validation_status = 'active'
                AND l.is_active = TRUE
                AND NULLIF(BTRIM(p.categoria_wellness), '') IS NOT NULL
                AND cardinality(p.wellness_dimensions) > 0
                AND NULLIF(BTRIM(p.wellness_evidence), '') IS NOT NULL
             UNION ALL
             SELECT 'service:' || s.id_service::text AS id_destino,
                    s.name AS nombre_lugar, COALESCE(l.state, '') AS estado,
                    s.categoria_wellness, s.wellness_dimensions,
                    s.demanda_fisica,
                    s.descripcion_bienestar, s.image_url, l.latitude AS lat, l.longitude AS lon
               FROM tourist_service s
               LEFT JOIN location l ON l.id_location = s.id_location
              WHERE s.is_wellness = TRUE AND s.wellness_status = 'approved'
                AND s.active = TRUE AND s.status = 'active'
                AND l.is_active = TRUE
                AND NULLIF(BTRIM(s.categoria_wellness), '') IS NOT NULL
                AND cardinality(s.wellness_dimensions) > 0
                AND NULLIF(BTRIM(s.wellness_evidence), '') IS NOT NULL
              ORDER BY nombre_lugar
              LIMIT 1000`,
        );

        const preferencesForModel = {
            wellness_dimensions: dimensions,
            activity_level: activity,
            region_filter: regionFilter || null,
        };
        const modeloRes = await fetch(`${MODELO_URL}/wellness/recommend`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ preferences: preferencesForModel, destinations: catalogRows, top_n: topN }),
            signal: AbortSignal.timeout(15_000),
        });
        if (!modeloRes.ok) {
            const detail = await modeloRes.text().catch(() => '');
            return res.status(502).json({ message: 'Servicio de recomendaciones wellness no disponible.', detail });
        }
        const data = await modeloRes.json();

        // A recommendation can be requested without retaining a preference
        // assessment or recommendation session. Only explicit opt-in creates
        // persistent history; transient request data is still processed to rank.
        if (!consent_given) return res.json(data);

        client = await db.connect();
        await client.query('BEGIN');
        const { rows: assessmentRows } = await client.query(
            `INSERT INTO wellness_preference_assessment
               (user_id, wellness_dimensions, activity_level, region_filter, consent_given)
             VALUES ($1,$2,$3,$4,TRUE)
             RETURNING preference_assessment_id`,
            [userId, dimensions, activity, regionFilter || null],
        );
        const preferenceId = assessmentRows[0].preference_assessment_id;
        const recIds = (data.destinations ?? []).map((d) => d.id_destino);
        const { rows: sessionRows } = await client.query(
            `INSERT INTO wellness_recommendation_session
               (user_id, preference_assessment_id, modo_viaje, recommended_ids, top_n, algorithm_version)
             VALUES ($1,$2,$3,$4,$5,'preferences-v1')
             RETURNING session_id`,
            [userId, preferenceId, data.modo_viaje, JSON.stringify(recIds), topN],
        );
        await client.query('COMMIT');
        return res.json({
            ...data,
            assessment_id: preferenceId,
            preference_assessment_id: preferenceId,
            session_id: sessionRows[0].session_id,
        });
    } catch (err) {
        if (client) await client.query('ROLLBACK').catch(() => {});
        if (err.name === 'TimeoutError' || err.name === 'AbortError') {
            return res.status(504).json({ message: 'La recomendación wellness tardó demasiado.' });
        }
        console.error('[wellness/recommend] error:', err.message);
        return res.status(500).json({ message: 'Error al generar recomendaciones wellness.' });
    } finally {
        client?.release();
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
    const sessionId = Number(session_id);
    if (!Number.isSafeInteger(sessionId) || sessionId < 1) {
        return res.status(400).json({ message: 'session_id no es válido.' });
    }
    const rating = Number(fit_rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'fit_rating debe estar entre 1 y 5.' });
    }
    if (feedback_text != null && (typeof feedback_text !== 'string' || feedback_text.length > 1000)) {
        return res.status(400).json({ message: 'feedback_text debe ser texto de hasta 1000 caracteres.' });
    }

    try {
        const { rows } = await db.query(
            `INSERT INTO wellness_satisfaction (session_id, user_id, fit_rating, feedback_text)
             SELECT s.session_id, $1, $3, $4
               FROM wellness_recommendation_session s
              WHERE s.session_id = $2 AND s.user_id = $1
             ON CONFLICT (session_id) DO UPDATE
               SET fit_rating = EXCLUDED.fit_rating,
                   feedback_text = EXCLUDED.feedback_text
             WHERE wellness_satisfaction.user_id = EXCLUDED.user_id
             RETURNING sat_id`,
            [userId, sessionId, rating, feedback_text],
        );
        if (!rows.length) return res.status(404).json({ message: 'Sesión de recomendación no encontrada.' });
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
            `WITH history AS (
                SELECT COALESCE(a.assessment_id, p.preference_assessment_id) AS assessment_id,
                       p.preference_assessment_id, s.modo_viaje, a.confianza_ml,
                       COALESCE(p.created_at, a.created_at, s.created_at) AS created_at,
                       s.session_id, s.recommended_ids, sat.fit_rating,
                       p.wellness_dimensions, p.activity_level, p.region_filter
                  FROM wellness_recommendation_session s
                  LEFT JOIN stress_assessment a ON a.assessment_id = s.assessment_id
                  LEFT JOIN wellness_preference_assessment p ON p.preference_assessment_id = s.preference_assessment_id
                  LEFT JOIN wellness_satisfaction sat ON sat.session_id = s.session_id
                 WHERE s.user_id = $1
                UNION ALL
                SELECT a.assessment_id, NULL::INT, a.modo_viaje, a.confianza_ml, a.created_at,
                       NULL::INT, NULL::JSONB, NULL::SMALLINT,
                       NULL::TEXT[], NULL::VARCHAR, NULL::VARCHAR
                  FROM stress_assessment a
                 WHERE a.user_id = $1
                   AND NOT EXISTS (
                       SELECT 1 FROM wellness_recommendation_session s
                        WHERE s.assessment_id = a.assessment_id
                   )
             )
             SELECT * FROM history ORDER BY created_at DESC LIMIT 10`,
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
    let client;
    try {
        client = await db.connect();
        await client.query('BEGIN');
        await client.query('DELETE FROM wellness_recommendation_session WHERE user_id = $1', [userId]);
        await client.query('DELETE FROM wellness_preference_assessment WHERE user_id = $1', [userId]);
        await client.query('DELETE FROM stress_assessment WHERE user_id = $1', [userId]);
        await client.query('COMMIT');
        res.json({ ok: true, message: 'Historial de bienestar eliminado.' });
    } catch (err) {
        if (client) await client.query('ROLLBACK').catch(() => {});
        console.error('[wellness/history/delete] error:', err.message);
        res.status(500).json({ message: 'Error al eliminar historial.' });
    } finally {
        client?.release();
    }
});

/**
 * GET /api/v2/ml/wellness/pending-count
 * Conteo de servicios/POIs con wellness_status='pending'. Para badge del admin.
 */
router.get('/ml/wellness/pending-count', verifyToken, requireRole([1, 4]), async (req, res) => {
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
router.get('/ml/wellness/pending', verifyToken, requireRole([1, 4]), async (req, res) => {
    try {
        const [svcRes, poiRes] = await Promise.all([
            db.query(
                `SELECT ts.id_service AS id, ts.name, ts.is_wellness,
                        ts.wellness_status, ts.categoria_wellness,
                        ts.nivel_aislamiento, ts.restauracion_pasiva, ts.demanda_fisica,
                        ts.descripcion_bienestar, ts.wellness_dimensions, ts.wellness_evidence,
                        c.name AS empresa,
                        'service' AS type
                 FROM tourist_service ts
                 LEFT JOIN company c ON c.id_company = ts.id_company
                 WHERE ts.wellness_status = 'pending'
                 ORDER BY ts.id_service DESC`,
            ),
            db.query(
                `SELECT id AS id, name, is_wellness, wellness_status,
                         categoria_wellness, nivel_aislamiento, restauracion_pasiva,
                         demanda_fisica, descripcion_bienestar, wellness_dimensions,
                         wellness_evidence, 'poi' AS type
                 FROM point_of_interest
                 WHERE wellness_status = 'pending'
                 ORDER BY id DESC`,
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
router.patch('/ml/wellness/review/:type/:id', verifyToken, requireRole([1, 4]), async (req, res) => {
    const { type, id } = req.params;
    const {
        action,
        nivel_aislamiento,
        restauracion_pasiva,
        demanda_fisica,
        categoria_wellness,
        wellness_dimensions,
        wellness_evidence,
        admin_notes,
    } = req.body ?? {};

    if (!['approved', 'rejected'].includes(action)) {
        return res.status(400).json({ message: 'action debe ser "approved" o "rejected".' });
    }
    if (!['service', 'poi'].includes(type)) {
        return res.status(400).json({ message: 'type debe ser "service" o "poi".' });
    }

    if (action === 'approved') {
        if (!Array.isArray(wellness_dimensions) || wellness_dimensions.length === 0 ||
            new Set(wellness_dimensions).size !== wellness_dimensions.length ||
            wellness_dimensions.some((dimension) => !WELLNESS_DIMENSIONS.has(dimension))) {
            return res.status(400).json({ message: 'Selecciona al menos una dimensión GWI válida para el lugar.' });
        }
        if (!hasCompleteWellnessEvidence(wellness_evidence, wellness_dimensions)) {
            return res.status(400).json({ message: 'Registra una fuente y evidencia concreta para cada dimensión seleccionada.' });
        }
        if (typeof categoria_wellness !== 'string' || !WELLNESS_CATEGORIES.has(categoria_wellness.trim())) {
            return res.status(400).json({ message: 'Selecciona una categoría válida de experiencia wellness.' });
        }
    }

    const table = type === 'service' ? 'tourist_service' : 'point_of_interest';
    const pk = type === 'service' ? 'id_service' : 'id';

    try {
        // Todos los valores van parametrizados ($N) — antes action/categoria_wellness
        // se interpolaban directo en el string SQL (inyección real: un admin_notes
        // o categoria_wellness malicioso podía alterar la query). `table`/`pk` siguen
        // viniendo de la whitelist ya validada arriba (type), nunca de input crudo.
        const sets = ['wellness_status = $1', 'wellness_reviewed_at = NOW()', 'wellness_reviewed_by = $2'];
        const values = [action, req.user.id];
        values.push(action === 'approved');
        sets.push(`is_wellness = $${values.length}`);

        if (admin_notes != null) {
            values.push(admin_notes);
            sets.push(`wellness_admin_notes = $${values.length}`);
        }
        if (action === 'approved') {
            values.push(wellness_dimensions);
            sets.push(`wellness_dimensions = $${values.length}`);
            values.push(wellness_evidence.trim());
            sets.push(`wellness_evidence = $${values.length}`);
            for (const [col, raw] of [
                ['nivel_aislamiento', nivel_aislamiento],
                ['restauracion_pasiva', restauracion_pasiva],
                ['demanda_fisica', demanda_fisica],
            ]) {
                if (raw == null) continue;
                const num = parseFloat(raw);
                if (Number.isNaN(num) || num < 0 || num > 1) {
                    return res.status(400).json({ message: `${col} debe estar entre 0 y 1.` });
                }
                values.push(num);
                sets.push(`${col} = $${values.length}`);
            }
            if (categoria_wellness) {
                values.push(categoria_wellness);
                sets.push(`categoria_wellness = $${values.length}`);
            }
        }

        values.push(parseInt(id, 10));
        await db.query(
            `UPDATE ${table} SET ${sets.join(', ')} WHERE ${pk} = $${values.length}`,
            values,
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
router.get('/ml/wellness/stats', verifyToken, requireRole([1, 4]), async (req, res) => {
    const safeQ = async (sql, fallback) => {
        try { return (await db.query(sql)).rows; }
        catch { return fallback; }
    };
    const [counts, preferenceDimensions, satisfaction] = await Promise.all([
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
            `SELECT dimension, COUNT(*)::int AS count
             FROM wellness_preference_assessment a
             CROSS JOIN LATERAL unnest(a.wellness_dimensions) AS dims(dimension)
             WHERE a.created_at > NOW() - INTERVAL '30 days'
             GROUP BY dimension ORDER BY count DESC`,
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
        // Keep the legacy key empty so old consumers do not see synthetic stress labels.
        modo_distribution: [],
        preference_dimension_distribution: preferenceDimensions,
        satisfaction: satisfaction[0] ?? { avg_rating: null, responses: 0 },
    });
});

// Legacy synthetic-label metrics are deliberately unavailable: they do not
// measure stress or recommendation relevance.
router.get('/ml/wellness/metrics', verifyToken, requireRole([1, 4]), (_req, res) => res.status(410).json({
    message: 'No existen métricas válidas de eficacia wellness. Las métricas anteriores se basaban en etiquetas sintéticas no validadas.',
}));

export default router;
