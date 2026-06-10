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

export default router;
