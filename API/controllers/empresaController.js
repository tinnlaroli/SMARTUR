import pool from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { validatePassword } from '../validators/userValidators.js';
import { sendRegistrationConfirmation, sendExistingAccountNotification } from '../utils/mailer.js';

const SALT_ROUNDS = 10;

async function assertNotSuspended(id_company, res) {
    const r = await pool.query('SELECT status FROM company WHERE id_company = $1', [id_company]);
    if (r.rows[0]?.status === 'suspended') {
        res.status(403).json({
            message: 'Tu empresa ha sido suspendida. Contacta al equipo SMARTUR para más información.',
        });
        return false;
    }
    return true;
}

/**
 * EmpresaController
 * Gestiona el portal B2B de empresas turísticas:
 * - Autoregistro público
 * - Perfil de empresa (ver y editar)
 * - Servicios propios
 * - Analytics de engagement
 *
 * OWASP A01 — IAM mínimo: cada acción verifica id_company del JWT
 */
class EmpresaController {

    /**
     * POST /api/v2/auth/register-empresa — Registro público
     * Crea empresa (status=pending) + usuario (role_id=3) en una transacción.
     * Devuelve JWT igual al /login para autenticación inmediata.
     */
    static async registerEmpresa(req, res) {
        const { name, email, password, companyName, phone, id_sector, id_location } = req.body;

        if (!name || !email || !password || !companyName || !id_sector) {
            return res.status(400).json({
                message: 'Campos requeridos: name, email, password, companyName, id_sector.',
            });
        }

        try {
            validatePassword(password);
        } catch (err) {
            return res.status(400).json({ message: err.message });
        }

        const trimmedEmail = email.trim().toLowerCase();

        try {
            // Verificar email único (en ambas tablas)
            const existingUser = await pool.query(
                'SELECT user_id FROM "user" WHERE LOWER(email) = LOWER($1)',
                [trimmedEmail],
            );
            if (existingUser.rowCount > 0) {
                // Anti-enumeración: misma respuesta + notificación al address real para evitar timing/email attack
                sendExistingAccountNotification(trimmedEmail)
                    .catch(err => console.error('[registerEmpresa] fallo al notificar cuenta existente:', err.message));
                return res.status(201).json({
                    message: 'OTP enviado al correo. Verifica tu email para completar el registro.',
                });
            }

            const existingPending = await pool.query(
                'SELECT id FROM pending_registration WHERE LOWER(email) = LOWER($1)',
                [trimmedEmail],
            );
            if (existingPending.rowCount > 0) {
                await pool.query('DELETE FROM pending_registration WHERE LOWER(email) = LOWER($1)', [trimmedEmail]);
            }

            const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
            const otpCode = crypto.randomInt(100000, 1000000).toString();
            const otpHash = crypto.createHash('sha256').update(otpCode).digest('hex');
            const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min

            await pool.query(
                `INSERT INTO pending_registration (email, name, password, company_name, phone, id_sector, id_location, otp_hash, otp_expires)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [trimmedEmail, name.trim(), hashedPassword, companyName.trim(), phone ?? null, id_sector, id_location ?? null, otpHash, otpExpires],
            );

            sendRegistrationConfirmation(trimmedEmail, { name: name.trim(), otp: otpCode })
                .catch(err => console.error('[registerEmpresa] fallo al enviar email:', err.message));

            return res.status(201).json({
                message: 'OTP enviado al correo. Verifica tu email para completar el registro.',
            });
        } catch (error) {
            console.error('Error en registerEmpresa:', error);
            return res.status(500).json({ message: 'Error del servidor. Intenta de nuevo más tarde.' });
        }
    }

    /**
     * GET /api/v2/empresa/profile
     * Admin: puede ver cualquier empresa (req.params no usado — se necesita endpoint separado).
     * Empresa: solo ve la suya (id_company del JWT).
     */
    static async getProfile(req, res) {
        const id_company = req.user.id_company;
        if (!id_company) {
            return res.status(400).json({ message: 'Sin empresa asociada.' });
        }

        try {
            const result = await pool.query(
                `SELECT c.id_company, c.name, c.address, c.phone, c.status,
                        c.id_sector, c.id_location, c.registration_date,
                        ts.name AS sector_name,
                        l.name AS location_name
                   FROM company c
                   LEFT JOIN tourism_sector ts ON ts.id_sector = c.id_sector
                   LEFT JOIN location l ON l.id_location = c.id_location
                  WHERE c.id_company = $1`,
                [id_company],
            );

            if (result.rowCount === 0) {
                return res.status(404).json({ message: 'Empresa no encontrada.' });
            }

            return res.json({ company: result.rows[0] });
        } catch (error) {
            console.error('Error en getProfile:', error);
            return res.status(500).json({ message: 'Error del servidor.' });
        }
    }

    /**
     * PATCH /api/v2/empresa/profile
     * Solo empresa propietaria puede editar sus datos (name, address, phone).
     */
    static async updateProfile(req, res) {
        const id_company = req.user.id_company;
        if (!id_company) {
            return res.status(400).json({ message: 'Sin empresa asociada.' });
        }

        const { name, address, phone } = req.body;
        if (!name && !address && !phone) {
            return res.status(400).json({ message: 'Nada que actualizar.' });
        }

        try {
            if (!await assertNotSuspended(id_company, res)) return;
            const setClauses = [];
            const values = [];
            let idx = 1;
            if (name) { setClauses.push(`name = $${idx++}`); values.push(name.trim()); }
            if (address !== undefined) { setClauses.push(`address = $${idx++}`); values.push(address); }
            if (phone !== undefined) { setClauses.push(`phone = $${idx++}`); values.push(phone); }
            values.push(id_company);

            await pool.query(
                `UPDATE company SET ${setClauses.join(', ')} WHERE id_company = $${idx}`,
                values,
            );
            return res.json({ message: 'Perfil actualizado.' });
        } catch (error) {
            console.error('Error en updateProfile:', error);
            return res.status(500).json({ message: 'Error del servidor.' });
        }
    }

    /**
     * GET /api/v2/auth/verify-email/:token
     * Verifica la dirección de correo electrónico mediante token.
     */
    static async verifyEmail(req, res) {
        const { token } = req.params;
        if (!token) {
            return res.status(400).json({ message: 'Token requerido.' });
        }

        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        try {
            const result = await pool.query(
                `SELECT user_id, email, email_verified, email_verification_expires
                   FROM "user"
                  WHERE email_verification_token = $1`,
                [tokenHash],
            );

            if (result.rowCount === 0) {
                return res.status(404).json({ message: 'Token inválido o ya utilizado.' });
            }

            const user = result.rows[0];

            if (user.email_verified) {
                return res.json({ message: 'El email ya está verificado.' });
            }

            if (new Date() > new Date(user.email_verification_expires)) {
                return res.status(410).json({ message: 'El token ha expirado. Solicita un nuevo enlace de verificación.' });
            }

            await pool.query(
                `UPDATE "user"
                    SET email_verified = TRUE,
                        email_verification_token = NULL,
                        email_verification_otp = NULL,
                        email_verification_expires = NULL
                  WHERE user_id = $1`,
                [user.user_id],
            );

            return res.json({ message: 'Email verificado correctamente.' });
        } catch (error) {
            console.error('Error en verifyEmail:', error);
            return res.status(500).json({ message: 'Error del servidor.' });
        }
    }

    /**
     * POST /api/v2/auth/verify-email-otp
     * Verifica el OTP y, si es válido, crea la empresa y el usuario.
     */
    static async verifyEmailOTP(req, res) {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ message: 'Email y OTP requeridos.' });
        }

        const trimmedEmail = email.trim().toLowerCase();
        const otpHash = crypto.createHash('sha256').update(otp.toString()).digest('hex');

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const pendingResult = await client.query(
                `SELECT * FROM pending_registration
                  WHERE LOWER(email) = LOWER($1) AND otp_hash = $2`,
                [trimmedEmail, otpHash],
            );

            if (pendingResult.rowCount === 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({ message: 'OTP inválido.' });
            }

            const pending = pendingResult.rows[0];

            if (new Date() > new Date(pending.otp_expires)) {
                await client.query('ROLLBACK');
                return res.status(410).json({ message: 'El código OTP ha expirado. Solicita uno nuevo.' });
            }

            // Crear empresa con status=pending
            const companyResult = await client.query(
                `INSERT INTO company (name, phone, id_sector, id_location, status)
                 VALUES ($1, $2, $3, $4, 'pending')
                 RETURNING id_company`,
                [pending.company_name, pending.phone, pending.id_sector, pending.id_location],
            );
            const id_company = companyResult.rows[0].id_company;

            // Crear usuario role_id=3 vinculado a la empresa
            const userResult = await client.query(
                `INSERT INTO "user" (name, email, password, role_id, id_company, is_active, email_verified)
                 VALUES ($1, $2, $3, 3, $4, TRUE, TRUE)
                 RETURNING user_id, name, email, role_id, id_company`,
                [pending.name, pending.email, pending.password, id_company],
            );
            const user = userResult.rows[0];

            // Actualizar owner_user_id en la empresa
            await client.query(
                'UPDATE company SET owner_user_id = $1 WHERE id_company = $2',
                [user.user_id, id_company],
            );

            // Eliminar registro pendiente
            await client.query(
                'DELETE FROM pending_registration WHERE id = $1',
                [pending.id],
            );

            await client.query('COMMIT');

            const token = jwt.sign(
                { id: user.user_id, email: user.email, role_id: user.role_id, id_company },
                process.env.JWT_SECRET,
                { expiresIn: '15m' },
            );

            return res.status(201).json({
                message: 'Email verificado. Empresa registrada correctamente.',
                token,
                user: {
                    id: user.user_id,
                    name: user.name,
                    email: user.email,
                    role_id: user.role_id,
                    id_company,
                },
            });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error en verifyEmailOTP:', error);
            return res.status(500).json({ message: 'Error del servidor.' });
        } finally {
            client.release();
        }
    }

    /**
     * GET /api/v2/empresa/services
     * Lista paginada de servicios turísticos de la empresa.
     * Query params: page, limit, search (filtro por nombre/tipo/descripción).
     */
    static async getServices(req, res) {
        const id_company = req.user.id_company;
        if (!id_company) {
            return res.status(400).json({ message: 'Sin empresa asociada.' });
        }

        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
        const offset = (page - 1) * limit;
        const search = (req.query.search || '').trim();

        try {
            let whereClause = 'WHERE ts.id_company = $1';
            const params = [id_company];
            let idx = 2;

            if (search) {
                const likeVal = `%${search}%`;
                whereClause += ` AND (LOWER(ts.name) LIKE LOWER($${idx})
                                   OR LOWER(ts.service_type) LIKE LOWER($${idx})
                                   OR LOWER(ts.description) LIKE LOWER($${idx}))`;
                params.push(likeVal);
                idx++;
            }

            const countResult = await pool.query(
                `SELECT COUNT(*) FROM tourist_service ts ${whereClause}`,
                params,
            );
            const total = parseInt(countResult.rows[0].count, 10);

            params.push(limit, offset);
            const result = await pool.query(
                `SELECT ts.id_service, ts.name, ts.description, ts.service_type,
                        ts.active, ts.image_url, ts.id_location, ts.id_company
                   FROM tourist_service ts
                   ${whereClause}
                   ORDER BY ts.name
                   LIMIT $${idx} OFFSET $${idx + 1}`,
                params,
            );
            return res.json({ services: result.rows, total });
        } catch (error) {
            console.error('Error en getServices:', error);
            return res.status(500).json({ message: 'Error del servidor.' });
        }
    }

    /**
     * GET /api/v2/empresa/analytics
     * Dashboard de métricas para la empresa autenticada.
     * Agrega: recomendaciones ML, favoritos, visitas, rating, interacciones.
     */
    static async getAnalytics(req, res) {
        const id_company = req.user.id_company;
        if (!id_company) {
            return res.status(400).json({ message: 'Sin empresa asociada.' });
        }

        try {
            // IDs de servicios de la empresa
            const svcResult = await pool.query(
                `SELECT id_service FROM tourist_service WHERE id_company = $1`,
                [id_company],
            );
            const serviceIds = svcResult.rows.map((r) => r.id_service);

            if (serviceIds.length === 0) {
                return res.json({
                    summary: {
                        total_recomendaciones: 0,
                        total_favoritos: 0,
                        total_visitas: 0,
                        avg_rating: null,
                        total_servicios_activos: 0,
                        evaluacion_score: null,
                    },
                    top_servicios: [],
                    timeline_30d: [],
                });
            }

            const idsParam = serviceIds;
            // item_id en ml_recommendation_item es VARCHAR — cast a texto
            const idsText = serviceIds.map(String);

            // Summary
            const summaryResult = await pool.query(
                `SELECT
                    (SELECT COUNT(*) FROM ml_recommendation_item mri
                       WHERE mri.item_id = ANY($1::text[]) AND mri.kind = 'svc')
                        AS total_recomendaciones,
                    (SELECT COUNT(*) FROM user_favorite uf
                       WHERE uf.place_id = ANY($2::int[]) AND uf.place_kind = 'svc'
                         AND uf.is_active = TRUE)
                        AS total_favoritos,
                    (SELECT COUNT(*) FROM user_visit uv
                       WHERE uv.place_id = ANY($2::int[]) AND uv.place_kind = 'svc')
                        AS total_visitas,
                    (SELECT ROUND(AVG(ur.rating)::numeric, 2)
                       FROM user_rating ur
                       WHERE ur.place_id = ANY($2::int[]) AND ur.place_kind = 'svc')
                        AS avg_rating,
                    (SELECT COUNT(*) FROM tourist_service ts2
                       WHERE ts2.id_company = $3 AND ts2.active = TRUE)
                        AS total_servicios_activos,
                    (SELECT ROUND(AVG(se.total_score)::numeric, 1)
                       FROM service_evaluation se
                       WHERE se.id_service = ANY($2::int[]))
                        AS evaluacion_score`,
                [idsText, idsParam, id_company],
            );

            // Top 5 servicios por engagement
            const topResult = await pool.query(
                `SELECT ts.id_service, ts.name,
                    COUNT(DISTINCT uf.id) AS favorites,
                    COUNT(DISTINCT uv.id) AS visits,
                    ROUND(AVG(ur.rating)::numeric, 2) AS rating,
                    COUNT(DISTINCT mri.id) AS recomendaciones
                   FROM tourist_service ts
                   LEFT JOIN user_favorite uf ON uf.place_id = ts.id_service
                        AND uf.place_kind = 'svc' AND uf.is_active = TRUE
                   LEFT JOIN user_visit uv ON uv.place_id = ts.id_service AND uv.place_kind = 'svc'
                   LEFT JOIN user_rating ur ON ur.place_id = ts.id_service AND ur.place_kind = 'svc'
                   LEFT JOIN ml_recommendation_item mri
                        ON mri.item_id = ts.id_service::text AND mri.kind = 'svc'
                  WHERE ts.id_company = $1
                  GROUP BY ts.id_service, ts.name
                  ORDER BY (COUNT(DISTINCT uf.id) + COUNT(DISTINCT uv.id)) DESC
                  LIMIT 5`,
                [id_company],
            );

            // Timeline últimos 30 días (user_interaction)
            const timelineResult = await pool.query(
                `SELECT DATE(created_at) AS date, COUNT(*) AS interacciones
                   FROM user_interaction
                  WHERE place_id = ANY($1::int[]) AND place_kind = 'svc'
                    AND created_at >= NOW() - INTERVAL '30 days'
                  GROUP BY DATE(created_at)
                  ORDER BY date`,
                [idsParam],
            );

            return res.json({
                summary: summaryResult.rows[0],
                top_servicios: topResult.rows,
                timeline_30d: timelineResult.rows,
            });
        } catch (error) {
            console.error('Error en getAnalytics:', error);
            return res.status(500).json({ message: 'Error del servidor.' });
        }
    }

    /**
     * POST /api/v2/empresa/services
     * Crea un nuevo servicio turístico para la empresa autenticada.
     * Solo campos permitidos: name, description, service_type, id_location, active.
     */
    static async createService(req, res) {
        const { id_company } = req.user;
        const { name, description, service_type, id_location, active } = req.body;

        if (!name || !service_type) {
            return res.status(400).json({ message: 'name y service_type son requeridos.' });
        }

        try {
            if (!await assertNotSuspended(id_company, res)) return;
            let locationId = id_location ?? null;
            if (!locationId) {
                const companyResult = await pool.query(
                    'SELECT id_location FROM company WHERE id_company = $1',
                    [id_company],
                );
                locationId = companyResult.rows[0]?.id_location ?? null;
            }

            if (!locationId) {
                return res.status(400).json({
                    message: 'La empresa debe tener un municipio asignado antes de crear servicios.',
                });
            }

            const result = await pool.query(
                `INSERT INTO tourist_service
                   (name, description, service_type, id_location, id_company, active)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING id_service, name, description, service_type, id_location, active, image_url, id_company`,
                [name.trim(), description ?? null, service_type, locationId, id_company, active ?? true],
            );
            return res.status(201).json({ service: result.rows[0] });
        } catch (err) {
            console.error('[empresa] createService error:', err.message);
            return res.status(500).json({ message: 'Error al crear el servicio.' });
        }
    }

    /**
     * PATCH /api/v2/empresa/services/:id
     * Actualiza un servicio propio. Verifica que pertenezca a la empresa del JWT.
     */
    static async updateService(req, res) {
        const { id_company } = req.user;
        const { id } = req.params;
        const { name, description, service_type, active, id_location } = req.body;

        try {
            if (!await assertNotSuspended(id_company, res)) return;
            const check = await pool.query(
                'SELECT id_service FROM tourist_service WHERE id_service=$1 AND id_company=$2',
                [id, id_company],
            );
            if (check.rowCount === 0) {
                return res.status(404).json({ message: 'Servicio no encontrado o no pertenece a tu empresa.' });
            }

            const fields = [];
            const values = [];
            let idx = 1;

            if (name !== undefined) { fields.push(`name=$${idx++}`); values.push(name.trim()); }
            if (description !== undefined) { fields.push(`description=$${idx++}`); values.push(description); }
            if (service_type !== undefined) { fields.push(`service_type=$${idx++}`); values.push(service_type); }
            if (active !== undefined) { fields.push(`active=$${idx++}`); values.push(active); }
            if (id_location !== undefined) { fields.push(`id_location=$${idx++}`); values.push(id_location); }

            if (fields.length === 0) {
                return res.status(400).json({ message: 'No hay campos para actualizar.' });
            }

            values.push(id);
            const result = await pool.query(
                `UPDATE tourist_service SET ${fields.join(', ')}
                 WHERE id_service=$${idx}
                 RETURNING id_service, name, description, service_type, active, id_location, image_url, id_company`,
                values,
            );
            return res.json({ service: result.rows[0] });
        } catch (err) {
            console.error('[empresa] updateService error:', err.message);
            return res.status(500).json({ message: 'Error al actualizar el servicio.' });
        }
    }

    /**
     * GET /api/v2/empresa/evaluations
     * Evaluaciones recibidas por los servicios de la empresa, con desglose por criterio.
     */
    static async getEvaluations(req, res) {
        const { id_company } = req.user;
        try {
            const [evalsResult, criteriaResult] = await Promise.all([
                pool.query(
                    `SELECT se.id_evaluation, se.total_score, se.created_at,
                            ts.name AS service_name, u.name AS evaluator_name
                     FROM service_evaluation se
                     INNER JOIN tourist_service ts ON se.id_service = ts.id_service
                     INNER JOIN "user" u ON se.evaluator_id = u.user_id
                     WHERE ts.id_company = $1 AND se.is_active = TRUE
                     ORDER BY se.created_at DESC
                     LIMIT 10`,
                    [id_company],
                ),
                pool.query(
                    `SELECT ec.name AS criterion_name,
                            ROUND(AVG(ed.assigned_score)::numeric, 2) AS avg_score,
                            MAX(es.score) AS max_score
                     FROM evaluation_detail ed
                     INNER JOIN evaluation_criterion ec ON ed.id_criterion = ec.id_criterion
                     INNER JOIN service_evaluation se ON ed.id_evaluation = se.id_evaluation
                     INNER JOIN tourist_service ts ON se.id_service = ts.id_service
                     LEFT JOIN (
                         SELECT id_criterion, MAX(score::numeric) AS score
                         FROM evaluation_subcriterion
                         GROUP BY id_criterion
                     ) es ON es.id_criterion = ec.id_criterion
                     WHERE ts.id_company = $1 AND se.is_active = TRUE
                     GROUP BY ec.name
                     ORDER BY avg_score ASC`,
                    [id_company],
                ),
            ]);

            const recent_evaluations = evalsResult.rows;
            const all_criteria = criteriaResult.rows;
            const weak_criteria = all_criteria.slice(0, 3);
            const last_evaluation_at = recent_evaluations[0]?.created_at ?? null;

            return res.json({ recent_evaluations, all_criteria, weak_criteria, last_evaluation_at });
        } catch (err) {
            console.error('[empresa] getEvaluations error:', err.message);
            return res.status(500).json({ message: 'Error al obtener evaluaciones.' });
        }
    }

    /**
     * DELETE /api/v2/empresa/services/:id
     * Soft-delete: pone active=false en vez de borrar la fila.
     */
    static async deleteService(req, res) {
        const { id_company } = req.user;
        const { id } = req.params;

        try {
            if (!await assertNotSuspended(id_company, res)) return;
            const result = await pool.query(
                `UPDATE tourist_service SET active=false
                 WHERE id_service=$1 AND id_company=$2 RETURNING id_service`,
                [id, id_company]
            );
            if (result.rowCount === 0) {
                return res.status(404).json({ message: 'Servicio no encontrado.' });
            }
            return res.json({ message: 'Servicio desactivado correctamente.' });
        } catch (err) {
            console.error('[empresa] deleteService error:', err.message);
            return res.status(500).json({ message: 'Error al desactivar el servicio.' });
        }
    }
}

export default EmpresaController;
