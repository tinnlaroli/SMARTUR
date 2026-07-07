import { randomBytes, createHash } from 'crypto';
import pool from '../config/db.js';
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import { toPublicUser } from '../utils/userPublic.js';
import { recordSession } from '../utils/sessionHelper.js';
import { generateRefreshToken, storeRefreshToken } from '../utils/refreshTokenHelper.js';

const CHALLENGE_TTL_MS = 2 * 60 * 1000; // 2 minutos

function hashToken(raw) {
    return createHash('sha256').update(raw).digest('hex');
}

function getClientIp(req) {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) return forwarded.split(',')[0].trim();
    return req.socket?.remoteAddress ?? req.ip ?? null;
}

/**
 * POST /api/v2/auth/qr/challenge — la web pide un código para mostrar como QR.
 * Público: no requiere sesión (todavía no hay usuario logueado en la web).
 */
export async function createChallenge(req, res) {
    try {
        const rawToken = randomBytes(24).toString('hex');
        const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS);

        const { rows } = await pool.query(
            `INSERT INTO qr_login_sessions (challenge_token_hash, expires_at)
             VALUES ($1, $2)
             RETURNING id`,
            [hashToken(rawToken), expiresAt],
        );

        return res.status(201).json({
            challengeId: rows[0].id,
            token: rawToken,
            expiresAt,
        });
    } catch (error) {
        console.error('[qrLogin] createChallenge error:', error.message);
        return res.status(500).json({ message: 'Error al generar el código QR.' });
    }
}

/**
 * GET /api/v2/auth/qr/:challengeId/status — la web hace polling con esto.
 * Público: solo revela el estado, nunca datos del usuario ni el token real.
 */
export async function getChallengeStatus(req, res) {
    try {
        const id = parseInt(req.params.challengeId, 10);
        if (Number.isNaN(id)) return res.status(400).json({ message: 'ID inválido' });

        const { rows } = await pool.query(
            `SELECT status, expires_at FROM qr_login_sessions WHERE id = $1`,
            [id],
        );
        if (rows.length === 0) return res.status(404).json({ status: 'expired' });

        const session = rows[0];
        if (session.status === 'pending' && new Date(session.expires_at) < new Date()) {
            await pool.query(`UPDATE qr_login_sessions SET status = 'expired' WHERE id = $1`, [id]);
            return res.json({ status: 'expired' });
        }
        return res.json({ status: session.status });
    } catch (error) {
        console.error('[qrLogin] getChallengeStatus error:', error.message);
        return res.status(500).json({ message: 'Error al consultar el código QR.' });
    }
}

/**
 * POST /api/v2/auth/qr/:challengeId/approve — el móvil (ya logueado) escanea
 * el QR y aprueba. Requiere JWT válido (verifyToken).
 */
export async function approveChallenge(req, res) {
    try {
        const id = parseInt(req.params.challengeId, 10);
        const { token } = req.body;
        if (Number.isNaN(id) || !token) {
            return res.status(400).json({ message: 'Solicitud inválida.' });
        }

        const result = await pool.query(
            `UPDATE qr_login_sessions
             SET status = 'approved', user_id = $1, device_hint = $2, ip = $3
             WHERE id = $4
               AND challenge_token_hash = $5
               AND status = 'pending'
               AND expires_at > NOW()
             RETURNING id`,
            [req.user.id, 'Aprobado desde app móvil', getClientIp(req), id, hashToken(token)],
        );

        if (result.rowCount === 0) {
            return res.status(410).json({ message: 'El código ya expiró o no es válido.' });
        }
        return res.json({ ok: true });
    } catch (error) {
        console.error('[qrLogin] approveChallenge error:', error.message);
        return res.status(500).json({ message: 'Error al aprobar el inicio de sesión.' });
    }
}

/**
 * POST /api/v2/auth/qr/:challengeId/deny — el móvil rechaza explícitamente.
 */
export async function denyChallenge(req, res) {
    try {
        const id = parseInt(req.params.challengeId, 10);
        const { token } = req.body;
        if (Number.isNaN(id) || !token) {
            return res.status(400).json({ message: 'Solicitud inválida.' });
        }
        await pool.query(
            `UPDATE qr_login_sessions
             SET status = 'denied'
             WHERE id = $1 AND challenge_token_hash = $2 AND status = 'pending'`,
            [id, hashToken(token)],
        );
        return res.json({ ok: true });
    } catch (error) {
        console.error('[qrLogin] denyChallenge error:', error.message);
        return res.status(500).json({ message: 'Error al rechazar el inicio de sesión.' });
    }
}

/**
 * POST /api/v2/auth/qr/:challengeId/exchange — la web, tras ver "approved" en
 * el polling, canjea el reto (con el token que solo ella conoce, prueba de
 * posesión) por una sesión real. Un solo uso: marca 'consumed' al terminar.
 */
export async function exchangeChallenge(req, res) {
    try {
        const id = parseInt(req.params.challengeId, 10);
        const { token } = req.body;
        if (Number.isNaN(id) || !token) {
            return res.status(400).json({ message: 'Solicitud inválida.' });
        }

        const result = await pool.query(
            `UPDATE qr_login_sessions
             SET status = 'consumed'
             WHERE id = $1
               AND challenge_token_hash = $2
               AND status = 'approved'
             RETURNING user_id`,
            [id, hashToken(token)],
        );
        if (result.rowCount === 0) {
            return res.status(410).json({ message: 'El código no está listo o ya fue usado.' });
        }

        const user = await User.findById(result.rows[0].user_id);
        if (!user || !user.is_active) {
            return res.status(401).json({ message: 'Usuario inactivo.' });
        }

        const roleId = Number(user.role_id);
        const payload = { id: user.user_id, email: user.email, role_id: roleId };
        if (roleId === 3 && user.id_company != null) payload.id_company = Number(user.id_company);

        const jwtToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
        // Se registra como una sesión más (aparece en "Sesiones activas" y se
        // puede revocar igual que cualquier otro login).
        const sessionId = await recordSession(user.user_id, req);
        const rawRefresh = generateRefreshToken();
        await storeRefreshToken(user.user_id, rawRefresh, sessionId);

        return res.json({
            token: jwtToken,
            refreshToken: rawRefresh,
            user: toPublicUser(user),
        });
    } catch (error) {
        console.error('[qrLogin] exchangeChallenge error:', error.message);
        return res.status(500).json({ message: 'Error al iniciar sesión con el código QR.' });
    }
}
