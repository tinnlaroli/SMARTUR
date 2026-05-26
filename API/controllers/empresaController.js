import pool from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { validatePassword } from '../validators/userValidators.js';

const SALT_ROUNDS = 10;

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

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Verificar email único
            const existing = await client.query(
                'SELECT user_id FROM "user" WHERE LOWER(email) = LOWER($1)',
                [email.trim()],
            );
            if (existing.rowCount > 0) {
                await client.query('ROLLBACK');
                return res.status(409).json({ message: 'El email ya está registrado.' });
            }

            // Crear empresa con status=pending
            const companyResult = await client.query(
                `INSERT INTO company (name, phone, id_sector, id_location, status)
                 VALUES ($1, $2, $3, $4, 'pending')
                 RETURNING id_company`,
                [companyName.trim(), phone ?? null, id_sector, id_location ?? null],
            );
            const id_company = companyResult.rows[0].id_company;

            // Crear usuario role_id=3 vinculado a la empresa
            const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
            const userResult = await client.query(
                `INSERT INTO "user" (name, email, password, role_id, id_company, is_active)
                 VALUES ($1, $2, $3, 3, $4, TRUE)
                 RETURNING user_id, name, email, role_id`,
                [name.trim(), email.trim().toLowerCase(), hashedPassword, id_company],
            );
            const user = userResult.rows[0];

            // Actualizar owner_user_id en la empresa
            await client.query(
                'UPDATE company SET owner_user_id = $1 WHERE id_company = $2',
                [user.user_id, id_company],
            );

            await client.query('COMMIT');

            const token = jwt.sign(
                { id: user.user_id, email: user.email, role_id: user.role_id, id_company },
                process.env.JWT_SECRET,
                { expiresIn: '24h' },
            );

            return res.status(201).json({
                message: 'Empresa registrada exitosamente. Pendiente de verificación.',
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
            console.error('Error en registerEmpresa:', error);
            return res.status(500).json({ message: 'Error del servidor.', error: error.message });
        } finally {
            client.release();
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
            return res.status(500).json({ message: 'Error del servidor.', error: error.message });
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
            return res.status(500).json({ message: 'Error del servidor.', error: error.message });
        }
    }

    /**
     * GET /api/v2/empresa/services
     * Lista de servicios turísticos de la empresa.
     */
    static async getServices(req, res) {
        const id_company = req.user.id_company;
        if (!id_company) {
            return res.status(400).json({ message: 'Sin empresa asociada.' });
        }

        try {
            const result = await pool.query(
                `SELECT ts.id_service, ts.name, ts.description, ts.service_type,
                        ts.active, ts.image_url, ts.id_location
                   FROM tourist_service ts
                  WHERE ts.id_company = $1
                  ORDER BY ts.name`,
                [id_company],
            );
            return res.json({ services: result.rows });
        } catch (error) {
            return res.status(500).json({ message: 'Error del servidor.', error: error.message });
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
            return res.status(500).json({ message: 'Error del servidor.', error: error.message });
        }
    }
}

export default EmpresaController;
