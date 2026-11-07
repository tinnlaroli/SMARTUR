import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/rbacMiddleware.js';
import db from '../config/db.js';

/**
 * WELLTUR: campaña de datos reales, etapa B (reentrenamiento) y reclamo de fichas del DENUE.
 *
 * - GET  /ml/wellness/pss10/me          ¿La persona ya contestó la PSS-10? (licencia: una aplicación por persona)
 * - GET  /ml/wellness/campaign-stats    Avance de la campaña para el dashboard (admin/turismólogo)
 * - POST /ml/wellness/etapa-b           Evalúa reentrenar con datos reales (admin); nunca promueve solo
 * - GET  /empresa/denue/buscar          Empresa busca su negocio en el DENUE
 * - POST /empresa/denue/reclamos        Empresa reclama una ficha
 * - GET  /empresa/denue/reclamos        Reclamos de la empresa
 * - GET  /admin/denue/reclamos          Reclamos por revisar (admin)
 * - PATCH /admin/denue/reclamos/:id     Aprobar o rechazar (admin)
 */
const router = express.Router();
const MODELO_URL = process.env.MODELO_URL || 'http://modelo:8000';
export const META_RESPUESTAS = 200;

// ── PSS-10 ya contestada ─────────────────────────────────────────────────────
router.get('/ml/wellness/pss10/me', verifyToken, async (req, res) => {
    try {
        const { rows } = await db.query(
            `SELECT pss10_total::float8 AS pss10_total, created_at
               FROM wellness_trip_preference_assessment
              WHERE user_id = $1 AND consent_given = TRUE AND pss10_total IS NOT NULL
              ORDER BY created_at ASC
              LIMIT 1`,
            [req.user.id],
        );
        if (!rows.length) return res.json({ respondida: false });
        return res.json({ respondida: true, pss10_total: rows[0].pss10_total, fecha: rows[0].created_at });
    } catch (err) {
        console.error('[wellness/pss10/me] error:', err.message);
        return res.status(500).json({ message: 'No se pudo consultar tu PSS-10.' });
    }
});

// ── Avance de la campaña ─────────────────────────────────────────────────────
const SESIONES_WELLTUR = `s.modo_viaje IN ('preferencias_v2', 'preferencias_v3')`;

router.get('/ml/wellness/campaign-stats', verifyToken, requireRole([1, 4]), async (_req, res) => {
    try {
        const [resumen, satisfaccion, eventos, pss, porDia, motivos, modalidades, reclamos] = await Promise.all([
            db.query(
                `SELECT COUNT(*)::int AS sesiones,
                        COUNT(DISTINCT s.user_id)::int AS personas,
                        COUNT(*) FILTER (WHERE a.pss10_total IS NOT NULL)::int AS sesiones_con_pss,
                        COUNT(DISTINCT s.user_id) FILTER (WHERE a.pss10_total IS NOT NULL)::int AS personas_con_pss,
                        COUNT(*) FILTER (WHERE a.pss10_total IS NOT NULL AND sat.fit_rating IS NOT NULL)::int AS completas
                   FROM wellness_recommendation_session s
                   JOIN wellness_trip_preference_assessment a ON a.trip_preference_id = s.trip_preference_id
                   LEFT JOIN wellness_satisfaction sat ON sat.session_id = s.session_id
                  WHERE ${SESIONES_WELLTUR}`,
            ),
            db.query(
                `SELECT sat.fit_rating AS calificacion, COUNT(*)::int AS n
                   FROM wellness_satisfaction sat
                   JOIN wellness_recommendation_session s ON s.session_id = sat.session_id
                  WHERE ${SESIONES_WELLTUR}
                  GROUP BY 1 ORDER BY 1`,
            ),
            db.query(
                `SELECT f.event_type AS evento, COUNT(*)::int AS n
                   FROM wellness_recommendation_item_feedback f
                   JOIN wellness_recommendation_session s ON s.session_id = f.session_id
                  WHERE ${SESIONES_WELLTUR}
                  GROUP BY 1`,
            ),
            // Sin puntos de corte (la PSS-10 no los tiene): bloques de 5 puntos.
            db.query(
                `SELECT LEAST(FLOOR(a.pss10_total / 5) * 5, 35)::int AS desde, COUNT(*)::int AS n
                   FROM wellness_trip_preference_assessment a
                  WHERE a.pss10_total IS NOT NULL AND a.consent_given = TRUE
                  GROUP BY 1 ORDER BY 1`,
            ),
            db.query(
                `SELECT to_char(date_trunc('day', s.created_at), 'YYYY-MM-DD') AS dia, COUNT(*)::int AS n
                   FROM wellness_recommendation_session s
                  WHERE ${SESIONES_WELLTUR} AND s.created_at >= NOW() - INTERVAL '30 days'
                  GROUP BY 1 ORDER BY 1`,
            ),
            db.query(
                `SELECT m AS codigo, COUNT(*)::int AS n
                   FROM wellness_trip_preference_assessment a, unnest(a.motive_priorities) m
                  WHERE a.questionnaire_version LIKE 'welltur-v3%'
                  GROUP BY 1 ORDER BY 2 DESC`,
            ),
            db.query(
                `SELECT w AS codigo, COUNT(*)::int AS n
                   FROM wellness_trip_preference_assessment a, unnest(a.modality_preferences) w
                  WHERE a.questionnaire_version LIKE 'welltur-v%'
                  GROUP BY 1 ORDER BY 2 DESC`,
            ),
            db.query(`SELECT COUNT(*)::int AS n FROM poi_claim WHERE status = 'pending'`),
        ]);
        const r = resumen.rows[0];
        const ev = Object.fromEntries(eventos.rows.map((e) => [e.evento, e.n]));
        const calificaciones = satisfaccion.rows;
        const totalCalif = calificaciones.reduce((a, c) => a + c.n, 0);
        const promedio = totalCalif ? calificaciones.reduce((a, c) => a + c.calificacion * c.n, 0) / totalCalif : null;
        const impresiones = ev.impression ?? 0;
        return res.json({
            meta: META_RESPUESTAS,
            ...r,
            avance: Math.min(1, r.completas / META_RESPUESTAS),
            etapa_b_lista: r.completas >= META_RESPUESTAS,
            satisfaccion: { promedio, n: totalCalif, distribucion: calificaciones },
            eventos: {
                impresiones,
                abiertos: ev.opened ?? 0,
                elegidos: (ev.selected ?? 0) + (ev.visited ?? 0) + (ev.saved ?? 0),
                tasa_apertura: impresiones ? (ev.opened ?? 0) / impresiones : null,
            },
            pss10_bloques: pss.rows,
            sesiones_por_dia: porDia.rows,
            motivos: motivos.rows,
            modalidades: modalidades.rows,
            reclamos_pendientes: reclamos.rows[0].n,
        });
    } catch (err) {
        console.error('[wellness/campaign-stats] error:', err.message);
        return res.status(500).json({ message: 'No se pudieron calcular las estadísticas de la campaña.' });
    }
});

// ── Etapa B: reentrenar con datos reales (evaluación, nunca promoción automática) ─
router.post('/ml/wellness/etapa-b', verifyToken, requireRole([1]), async (_req, res) => {
    try {
        const { rows } = await db.query(
            `WITH ev AS (
                SELECT f.session_id, f.item_id,
                       MAX(array_to_string(f.modality_tags_snapshot, ',')) FILTER (WHERE f.event_type = 'impression') AS modalidades,
                       MIN(f.position) FILTER (WHERE f.event_type = 'impression') AS posicion,
                       BOOL_OR(f.event_type = 'opened') AS abierto,
                       BOOL_OR(f.event_type IN ('selected', 'visited', 'saved')) AS elegido,
                       MAX(f.rating) AS calificacion
                  FROM wellness_recommendation_item_feedback f
                 GROUP BY 1, 2)
             SELECT s.session_id, s.user_id, a.pss10_total::float8 AS pss10_total,
                    a.motive_priorities AS motivos, a.modality_preferences AS modalidades_pedidas,
                    sat.fit_rating AS satisfaccion,
                    json_agg(json_build_object(
                        'modalidades', ev.modalidades, 'posicion', ev.posicion,
                        'abierto', ev.abierto, 'elegido', ev.elegido, 'calificacion', ev.calificacion)
                        ORDER BY ev.posicion) AS items
               FROM wellness_recommendation_session s
               JOIN wellness_trip_preference_assessment a ON a.trip_preference_id = s.trip_preference_id
               LEFT JOIN wellness_satisfaction sat ON sat.session_id = s.session_id
               JOIN ev ON ev.session_id = s.session_id
              WHERE ${SESIONES_WELLTUR} AND a.consent_given = TRUE AND a.pss10_total IS NOT NULL
              GROUP BY s.session_id, s.user_id, a.pss10_total, a.motive_priorities, a.modality_preferences, sat.fit_rating`,
        );
        const modeloRes = await fetch(`${MODELO_URL}/wellness/etapa-b`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sesiones: rows, meta: META_RESPUESTAS }),
            signal: AbortSignal.timeout(60_000),
        });
        const data = await modeloRes.json().catch(() => ({}));
        if (!modeloRes.ok) return res.status(502).json({ message: 'MODELO no pudo evaluar la etapa B.', detail: data });
        return res.json(data);
    } catch (err) {
        console.error('[wellness/etapa-b] error:', err.message);
        return res.status(500).json({ message: 'No se pudo evaluar la etapa B.' });
    }
});

// ── Reclamo de fichas del DENUE (B2B) ────────────────────────────────────────
router.get('/empresa/denue/buscar', verifyToken, requireRole([1, 3]), async (req, res) => {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (q.length < 3 || q.length > 80) return res.status(400).json({ message: 'Escribe de 3 a 80 caracteres.' });
    try {
        const { rows } = await db.query(
            `SELECT p.id, p.name, p.categoria_wellness, p.description, p.denue_clee,
                    COALESCE(l.municipality, '') AS municipio, COALESCE(l.state, '') AS estado,
                    (p.submitted_by_company_id IS NOT NULL) AS ya_reclamado,
                    EXISTS (SELECT 1 FROM poi_claim c WHERE c.poi_id = p.id AND c.status = 'pending') AS reclamo_pendiente
               FROM point_of_interest p
               LEFT JOIN location l ON l.id_location = p.id_location
              WHERE p.denue_clee IS NOT NULL AND p.is_active = TRUE
                AND (p.name ILIKE '%' || $1 || '%' OR l.municipality ILIKE '%' || $1 || '%')
              ORDER BY (p.name ILIKE $1 || '%') DESC, p.name
              LIMIT 25`,
            [q],
        );
        return res.json(rows);
    } catch (err) {
        console.error('[empresa/denue/buscar] error:', err.message);
        return res.status(500).json({ message: 'No se pudo buscar en el DENUE.' });
    }
});

router.post('/empresa/denue/reclamos', verifyToken, requireRole([3]), async (req, res) => {
    const companyId = Number(req.user.id_company);
    const poiId = Number(req.body?.poi_id);
    const evidencia = typeof req.body?.evidencia === 'string' ? req.body.evidencia.trim() : '';
    if (!Number.isSafeInteger(companyId) || companyId < 1) return res.status(403).json({ message: 'Sin empresa asociada.' });
    if (!Number.isSafeInteger(poiId) || poiId < 1) return res.status(400).json({ message: 'poi_id no es válido.' });
    if (evidencia.length < 10 || evidencia.length > 2000) {
        return res.status(400).json({ message: 'Describe en 10 a 2000 caracteres cómo podemos verificar que el negocio es tuyo.' });
    }
    try {
        const { rows: poi } = await db.query(
            `SELECT id, submitted_by_company_id FROM point_of_interest WHERE id = $1 AND denue_clee IS NOT NULL AND is_active`,
            [poiId],
        );
        if (!poi.length) return res.status(404).json({ message: 'Ese lugar no está en el catálogo DENUE.' });
        if (poi[0].submitted_by_company_id != null) {
            return res.status(409).json({ message: 'Esta ficha ya fue reclamada y verificada por una empresa.' });
        }
        const { rows } = await db.query(
            `INSERT INTO poi_claim (poi_id, company_id, user_id, evidencia)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT DO NOTHING
             RETURNING claim_id, status, created_at`,
            [poiId, companyId, req.user.id, evidencia],
        );
        if (!rows.length) return res.status(409).json({ message: 'Ya tienes una solicitud pendiente para este lugar.' });
        return res.status(201).json(rows[0]);
    } catch (err) {
        console.error('[empresa/denue/reclamos] error:', err.message);
        return res.status(500).json({ message: 'No se pudo registrar la solicitud.' });
    }
});

router.get('/empresa/denue/reclamos', verifyToken, requireRole([3]), async (req, res) => {
    try {
        const { rows } = await db.query(
            `SELECT c.claim_id, c.status, c.evidencia, c.admin_notes, c.created_at, c.reviewed_at,
                    p.id AS poi_id, p.name, COALESCE(l.municipality, '') AS municipio
               FROM poi_claim c
               JOIN point_of_interest p ON p.id = c.poi_id
               LEFT JOIN location l ON l.id_location = p.id_location
              WHERE c.company_id = $1
              ORDER BY c.created_at DESC`,
            [Number(req.user.id_company)],
        );
        return res.json(rows);
    } catch (err) {
        console.error('[empresa/denue/reclamos GET] error:', err.message);
        return res.status(500).json({ message: 'No se pudieron cargar tus solicitudes.' });
    }
});

router.get('/admin/denue/reclamos', verifyToken, requireRole([1]), async (req, res) => {
    const status = ['pending', 'approved', 'rejected'].includes(req.query.status) ? req.query.status : 'pending';
    try {
        const { rows } = await db.query(
            `SELECT c.claim_id, c.status, c.evidencia, c.admin_notes, c.created_at, c.reviewed_at,
                    p.id AS poi_id, p.name AS poi_nombre, p.denue_clee, p.description AS poi_descripcion,
                    COALESCE(l.municipality, '') AS municipio, COALESCE(l.state, '') AS estado,
                    co.id_company AS company_id, co.name AS empresa, co.status AS empresa_status,
                    co.is_certified AS empresa_certificada, u.email AS solicitante
               FROM poi_claim c
               JOIN point_of_interest p ON p.id = c.poi_id
               LEFT JOIN location l ON l.id_location = p.id_location
               JOIN company co ON co.id_company = c.company_id
               JOIN "user" u ON u.user_id = c.user_id
              WHERE c.status = $1
              ORDER BY c.created_at ASC
              LIMIT 200`,
            [status],
        );
        return res.json(rows);
    } catch (err) {
        console.error('[admin/denue/reclamos] error:', err.message);
        return res.status(500).json({ message: 'No se pudieron cargar los reclamos.' });
    }
});

router.patch('/admin/denue/reclamos/:id', verifyToken, requireRole([1]), async (req, res) => {
    const claimId = Number(req.params.id);
    const decision = req.body?.decision;
    const notas = typeof req.body?.notas === 'string' ? req.body.notas.trim().slice(0, 1000) : null;
    if (!Number.isSafeInteger(claimId) || claimId < 1) return res.status(400).json({ message: 'id no válido.' });
    if (!['approved', 'rejected'].includes(decision)) return res.status(400).json({ message: 'decision debe ser approved o rejected.' });
    if (decision === 'rejected' && !notas) return res.status(400).json({ message: 'Indica el motivo del rechazo.' });
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        const { rows } = await client.query(
            `UPDATE poi_claim SET status = $2, admin_notes = $3, reviewed_by = $4, reviewed_at = NOW()
              WHERE claim_id = $1 AND status = 'pending'
              RETURNING poi_id, company_id`,
            [claimId, decision, notas, req.user.id],
        );
        if (!rows.length) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'La solicitud no existe o ya fue revisada.' });
        }
        if (decision === 'approved') {
            const { poi_id: poiId, company_id: companyId } = rows[0];
            const ligado = await client.query(
                `UPDATE point_of_interest
                    SET submitted_by_company_id = $2::int, wellness_reviewed_by = $3, wellness_reviewed_at = NOW(),
                        wellness_admin_notes = concat_ws(' | ', wellness_admin_notes,
                            'Ficha DENUE reclamada por la empresa ' || $2::text || ' y verificada por admin el ' || to_char(NOW(), 'YYYY-MM-DD'))
                  WHERE id = $1 AND submitted_by_company_id IS NULL`,
                [poiId, companyId, req.user.id],
            );
            if (ligado.rowCount === 0) {
                await client.query('ROLLBACK');
                return res.status(409).json({ message: 'Esta ficha ya está ligada a otra empresa.' });
            }
            await client.query(
                `UPDATE poi_claim SET status = 'rejected', admin_notes = 'Otra empresa acreditó la ficha.',
                        reviewed_by = $2, reviewed_at = NOW()
                  WHERE poi_id = $1 AND status = 'pending'`,
                [poiId, req.user.id],
            );
        }
        await client.query('COMMIT');
        return res.json({ ok: true, decision });
    } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        console.error('[admin/denue/reclamos PATCH] error:', err.message);
        return res.status(500).json({ message: 'No se pudo guardar la revisión.' });
    } finally {
        client.release();
    }
});

export default router;
