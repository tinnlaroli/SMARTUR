import pool from '../config/db.js';
import { sendFcmToUser } from '../services/fcmService.js';

class AdminVerificationController {
    // ─── EMPRESAS ───────────────────────────────────────────────────────────────

    /**
     * GET /api/v2/admin/companies/pending
     * Lista empresas en status documents_submitted (pendientes de revisión).
     * Query params: page, limit
     */
    static async listPendingCompanies(req, res) {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const offset = (page - 1) * limit;

        try {
            const countResult = await pool.query(
                `SELECT COUNT(*) FROM company WHERE status IN ('documents_submitted', 'pending_docs', 'rejected')`
            );
            const total = parseInt(countResult.rows[0].count, 10);

            const result = await pool.query(
                `SELECT
                    c.id_company, c.name, c.address, c.phone, c.status, c.registration_date,
                    c.id_location,
                    cv.owner_full_name, cv.owner_curp, cv.owner_rfc, cv.submitted_at,
                    cv.ine_front_url, cv.ine_back_url, cv.address_proof_url,
                    cv.resubmission_count, cv.rejection_reason,
                    ts.name AS sector_name,
                    l.name AS location_name
                 FROM company c
                 LEFT JOIN company_verification cv ON cv.id_company = c.id_company
                 LEFT JOIN tourism_sector ts ON ts.id_sector = c.id_sector
                 LEFT JOIN location l ON l.id_location = c.id_location
                 WHERE c.status IN ('documents_submitted', 'pending_docs', 'rejected')
                 ORDER BY cv.submitted_at DESC NULLS LAST
                 LIMIT $1 OFFSET $2`,
                [limit, offset]
            );

            return res.json({ companies: result.rows, total, page, limit });
        } catch (error) {
            console.error('Error en listPendingCompanies:', error);
            return res.status(500).json({ message: 'Error del servidor.' });
        }
    }

    /**
     * GET /api/v2/admin/companies/:id/verification
     * Detalle de empresa + documentos KYC para revisión.
     */
    static async getCompanyVerification(req, res) {
        const { id } = req.params;
        try {
            const result = await pool.query(
                `SELECT
                    c.id_company, c.name, c.address, c.phone, c.status, c.registration_date,
                    c.is_certified, c.certified_at,
                    cv.*,
                    ts.name AS sector_name,
                    l.name AS location_name, l.state, l.municipality
                 FROM company c
                 LEFT JOIN company_verification cv ON cv.id_company = c.id_company
                 LEFT JOIN tourism_sector ts ON ts.id_sector = c.id_sector
                 LEFT JOIN location l ON l.id_location = c.id_location
                 WHERE c.id_company = $1`,
                [id]
            );

            if (!result.rows[0]) {
                return res.status(404).json({ message: 'Empresa no encontrada.' });
            }
            return res.json(result.rows[0]);
        } catch (error) {
            console.error('Error en getCompanyVerification:', error);
            return res.status(500).json({ message: 'Error del servidor.' });
        }
    }

    /**
     * PATCH /api/v2/admin/companies/:id/verify
     * Admin aprueba o rechaza una empresa.
     * Body: { action: 'approve' | 'reject', reason?: string }
     */
    static async verifyCompany(req, res) {
        const { id } = req.params;
        const { action, reason } = req.body;
        const reviewer_id = req.user.user_id;

        if (!['approve', 'reject', 'suspend', 'certify'].includes(action)) {
            return res.status(400).json({ message: 'action debe ser "approve", "reject", "suspend" o "certify".' });
        }
        if ((action === 'reject' || action === 'suspend') && !reason?.trim()) {
            return res.status(400).json({ message: 'Se requiere un motivo para el rechazo o suspensión.' });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const companyResult = await client.query(
                'SELECT id_company, status FROM company WHERE id_company = $1',
                [id]
            );
            if (!companyResult.rows[0]) {
                await client.query('ROLLBACK');
                return res.status(404).json({ message: 'Empresa no encontrada.' });
            }

            if (action === 'certify') {
                await client.query(
                    'UPDATE company SET is_certified = TRUE, certified_at = NOW() WHERE id_company = $1',
                    [id]
                );
                await client.query('COMMIT');
                return res.json({ message: 'Empresa certificada por SMARTUR.', is_certified: true });
            }

            const newStatus = action === 'approve' ? 'active' : action === 'suspend' ? 'suspended' : 'rejected';

            await client.query(
                'UPDATE company SET status = $1 WHERE id_company = $2',
                [newStatus, id]
            );

            await client.query(
                `UPDATE company_verification SET
                    reviewed_at = NOW(), reviewer_id = $1,
                    rejection_reason = $2
                 WHERE id_company = $3`,
                [reviewer_id, action === 'reject' ? reason : null, id]
            );

            await client.query('COMMIT');
            const labels = { approve: 'Empresa aprobada.', reject: 'Empresa rechazada.', suspend: 'Empresa suspendida.' };
            return res.json({ message: labels[action], status: newStatus });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error en verifyCompany:', error);
            return res.status(500).json({ message: 'Error del servidor.' });
        } finally {
            client.release();
        }
    }

    // ─── SERVICIOS ──────────────────────────────────────────────────────────────

    /**
     * GET /api/v2/admin/services/pending
     * Lista servicios en status pending_review.
     */
    static async listPendingServices(req, res) {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const offset = (page - 1) * limit;

        try {
            const countResult = await pool.query(
                `SELECT COUNT(*) FROM tourist_service WHERE status = 'pending_review'`
            );
            const total = parseInt(countResult.rows[0].count, 10);

            const result = await pool.query(
                `SELECT
                    ts.id_service, ts.name, ts.description, ts.service_type, ts.status,
                    ts.image_url, ts.price_from, ts.price_to, ts.currency,
                    ts.duration_minutes, ts.contact_phone, ts.created_at,
                    c.name AS company_name, c.id_company,
                    l.name AS location_name
                 FROM tourist_service ts
                 JOIN company c ON c.id_company = ts.id_company
                 LEFT JOIN location l ON l.id_location = ts.id_location
                 WHERE ts.status = 'pending_review'
                 ORDER BY ts.created_at ASC
                 LIMIT $1 OFFSET $2`,
                [limit, offset]
            );

            return res.json({ services: result.rows, total, page, limit });
        } catch (error) {
            console.error('Error en listPendingServices:', error);
            return res.status(500).json({ message: 'Error del servidor.' });
        }
    }

    /**
     * PATCH /api/v2/admin/services/:id/approve
     * Admin aprueba un servicio turístico.
     */
    static async approveService(req, res) {
        const { id } = req.params;
        try {
            const result = await pool.query(
                `UPDATE tourist_service SET status = 'active'
                 WHERE id_service = $1 AND status = 'pending_review'
                 RETURNING id_service, name, status`,
                [id]
            );
            if (!result.rows[0]) {
                return res.status(404).json({ message: 'Servicio no encontrado o ya procesado.' });
            }
            const svc = result.rows[0];
            res.json({ message: 'Servicio aprobado.', service: svc });

            // FCM a la empresa dueña del servicio — fire-and-forget
            const { rows: ownerRows } = await pool.query(
                `SELECT u.user_id FROM tourist_service ts
                 JOIN "user" u ON u.id_company = ts.id_company AND u.role_id = 3
                 WHERE ts.id_service = $1 LIMIT 1`,
                [svc.id_service],
            );
            if (ownerRows[0]?.user_id) {
                sendFcmToUser(pool, ownerRows[0].user_id, {
                    title: '¡Servicio aprobado! ✅',
                    body: `Tu servicio "${svc.name}" ya está activo y visible para turistas.`,
                    data: { screen: 'servicios' },
                });
            }
        } catch (error) {
            console.error('Error en approveService:', error);
            return res.status(500).json({ message: 'Error del servidor.' });
        }
    }

    /**
     * PATCH /api/v2/admin/services/:id/reject
     * Admin rechaza un servicio turístico.
     * Body: { reason?: string }
     */
    static async rejectService(req, res) {
        const { id } = req.params;
        try {
            const result = await pool.query(
                `UPDATE tourist_service SET status = 'rejected'
                 WHERE id_service = $1 AND status = 'pending_review'
                 RETURNING id_service, name, status`,
                [id]
            );
            if (!result.rows[0]) {
                return res.status(404).json({ message: 'Servicio no encontrado o ya procesado.' });
            }
            return res.json({ message: 'Servicio rechazado.', service: result.rows[0] });
        } catch (error) {
            console.error('Error en rejectService:', error);
            return res.status(500).json({ message: 'Error del servidor.' });
        }
    }

    /**
     * PATCH /api/v2/admin/companies/:id/location
     * Admin asigna o corrige el municipio de una empresa.
     * Body: { id_location: number }
     */
    static async updateCompanyLocation(req, res) {
        const { id } = req.params;
        const { id_location } = req.body;
        if (!id_location) return res.status(400).json({ message: 'id_location requerido.' });
        try {
            const result = await pool.query(
                'UPDATE company SET id_location = $1 WHERE id_company = $2 RETURNING id_company',
                [id_location, id]
            );
            if (!result.rows[0]) return res.status(404).json({ message: 'Empresa no encontrada.' });
            const loc = await pool.query('SELECT name FROM location WHERE id_location = $1', [id_location]);
            return res.json({ id_location: Number(id_location), location_name: loc.rows[0]?.name ?? null });
        } catch (error) {
            console.error('Error en updateCompanyLocation:', error);
            return res.status(500).json({ message: 'Error del servidor.' });
        }
    }

    // ─── POIS ────────────────────────────────────────────────────────────────────

    /**
     * GET /api/v2/admin/pois/pending
     * Lista POIs enviados por empresas pendientes de validación.
     */
    static async listPendingPOIs(req, res) {
        try {
            const r = await pool.query(
                `SELECT p.*, c.name AS company_name
                 FROM point_of_interest p
                 LEFT JOIN company c ON c.id_company = p.submitted_by_company_id
                 WHERE p.validation_status = 'pending_validation'
                 ORDER BY p.validation_submitted_at ASC`
            );
            return res.json({ pois: r.rows, total: r.rows.length });
        } catch (error) {
            console.error('Error en listPendingPOIs:', error);
            return res.status(500).json({ message: 'Error del servidor.' });
        }
    }

    /**
     * PATCH /api/v2/admin/pois/:id/approve
     * Admin aprueba un POI enviado por empresa.
     */
    static async approvePOI(req, res) {
        const { id } = req.params;
        try {
            const result = await pool.query(
                `UPDATE point_of_interest
                 SET validation_status = 'active', is_active = TRUE,
                     reviewed_by_admin_id = $1
                 WHERE id = $2 AND validation_status = 'pending_validation'
                 RETURNING id, name, validation_status`,
                [req.user.id, id]
            );
            if (!result.rows[0]) {
                return res.status(404).json({ message: 'POI no encontrado o ya procesado.' });
            }
            const poi = result.rows[0];
            res.json({ message: 'POI aprobado.', poi });

            // FCM a la empresa dueña — fire-and-forget
            const { rows: ownerRows } = await pool.query(
                `SELECT u.user_id FROM point_of_interest p
                 JOIN "user" u ON u.id_company = p.submitted_by_company_id AND u.role_id = 3
                 WHERE p.id = $1 LIMIT 1`,
                [poi.id],
            );
            if (ownerRows[0]?.user_id) {
                sendFcmToUser(pool, ownerRows[0].user_id, {
                    title: '¡POI aprobado! ✅',
                    body: `Tu punto de interés "${poi.name}" ya está visible para turistas.`,
                    data: { screen: 'pois' },
                });
            }
        } catch (error) {
            console.error('Error en approvePOI:', error);
            return res.status(500).json({ message: 'Error del servidor.' });
        }
    }

    /**
     * PATCH /api/v2/admin/pois/:id/reject
     * Admin rechaza un POI enviado por empresa.
     * Body: { reason?: string }
     */
    static async rejectPOI(req, res) {
        const { id } = req.params;
        const { reason } = req.body;
        try {
            const result = await pool.query(
                `UPDATE point_of_interest
                 SET validation_status = 'rejected',
                     validation_rejection_reason = $1,
                     reviewed_by_admin_id = $2
                 WHERE id = $3 AND validation_status = 'pending_validation'
                 RETURNING id, name, validation_status`,
                [reason || null, req.user.id, id]
            );
            if (!result.rows[0]) {
                return res.status(404).json({ message: 'POI no encontrado o ya procesado.' });
            }
            return res.json({ message: 'POI rechazado.', poi: result.rows[0] });
        } catch (error) {
            console.error('Error en rejectPOI:', error);
            return res.status(500).json({ message: 'Error del servidor.' });
        }
    }

    /**
     * GET /api/v2/admin/services
     * Lista todos los servicios turísticos con filtro opcional por status.
     * Query params: page, limit, status
     */
    static async listAllServices(req, res) {
        const page   = Math.max(1, parseInt(req.query.page) || 1);
        const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const offset = (page - 1) * limit;
        const status = req.query.status || null;

        try {
            const params = status ? [status] : [];
            const where  = status ? 'WHERE ts.status = $1' : '';
            const idx    = params.length;

            const countResult = await pool.query(
                `SELECT COUNT(*) FROM tourist_service ts ${where}`,
                params
            );
            const total = parseInt(countResult.rows[0].count, 10);

            const dataParams = [...params, limit, offset];
            const result = await pool.query(
                `SELECT ts.id_service, ts.name, ts.description, ts.service_type, ts.status,
                        ts.image_url, ts.price_from, ts.price_to, ts.currency,
                        ts.duration_minutes, ts.contact_phone, ts.created_at,
                        c.name AS company_name, c.id_company,
                        l.name AS location_name
                 FROM tourist_service ts
                 JOIN company c ON c.id_company = ts.id_company
                 LEFT JOIN location l ON l.id_location = ts.id_location
                 ${where}
                 ORDER BY ts.created_at DESC
                 LIMIT $${idx + 1} OFFSET $${idx + 2}`,
                dataParams
            );

            return res.json({ services: result.rows, total, page, limit });
        } catch (error) {
            console.error('Error en listAllServices:', error);
            return res.status(500).json({ message: 'Error del servidor.' });
        }
    }

    /**
     * GET /api/v2/admin/companies
     * Lista todas las empresas con filtro por status.
     * Query params: page, limit, status
     */
    static async listAllCompanies(req, res) {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const offset = (page - 1) * limit;
        const status = req.query.status || null;

        try {
            const conditions = status ? [`c.status = $1`] : [];
            const params = status ? [status] : [];

            const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

            const countResult = await pool.query(
                `SELECT COUNT(*) FROM company c ${where}`,
                params
            );
            const total = parseInt(countResult.rows[0].count, 10);

            const dataParams = [...params, limit, offset];
            const idx = params.length;

            const result = await pool.query(
                `SELECT
                    c.id_company, c.name, c.address, c.phone, c.status, c.registration_date,
                    c.is_certified, c.certified_at,
                    c.id_location, ts.name AS sector_name, l.name AS location_name,
                    cv.owner_full_name, cv.owner_curp, cv.owner_rfc,
                    cv.ine_front_url, cv.ine_back_url, cv.address_proof_url,
                    cv.smartur_validation_certificate_url, cv.certificate_issued_at,
                    cv.resubmission_count, cv.rejection_reason,
                    cv.submitted_at, cv.reviewed_at
                 FROM company c
                 LEFT JOIN tourism_sector ts ON ts.id_sector = c.id_sector
                 LEFT JOIN location l ON l.id_location = c.id_location
                 LEFT JOIN company_verification cv ON cv.id_company = c.id_company
                 ${where}
                 ORDER BY c.registration_date DESC
                 LIMIT $${idx + 1} OFFSET $${idx + 2}`,
                dataParams
            );

            return res.json({ companies: result.rows, total, page, limit });
        } catch (error) {
            console.error('Error en listAllCompanies:', error);
            return res.status(500).json({ message: 'Error del servidor.' });
        }
    }
}

export default AdminVerificationController;
