import { randomBytes, createHash } from 'crypto';
import pool from '../config/db.js';

export function generateRefreshToken() {
    return randomBytes(40).toString('hex'); // 80-char hex string
}

function hashToken(raw) {
    return createHash('sha256').update(raw).digest('hex');
}

/**
 * Stores a refresh token in the DB.
 * @param {number} userId
 * @param {string} rawToken  — the token returned to the client
 * @param {number|null} sessionId — linked user_sessions.id (so revoking the
 *   session also kills this refresh token); null keeps it unlinked (legacy).
 * @param {number} expiryDays — default 30
 */
export async function storeRefreshToken(userId, rawToken, sessionId = null, expiryDays = 30) {
    const hash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);
    await pool.query(
        `INSERT INTO refresh_tokens (user_id, token_hash, session_id, expires_at)
         VALUES ($1, $2, $3, $4)`,
        [userId, hash, sessionId, expiresAt],
    );
}

/**
 * Validates and rotates a refresh token (marks it revoked).
 * Fails (returns null) if the token is unknown/expired/already revoked, OR
 * if its linked session has been revoked from "Active sessions" — this is
 * what makes device revocation actually cut access instead of just hiding
 * the entry in the list.
 * @param {string} rawToken
 * @returns {Promise<{userId: number, sessionId: number|null}|null>}
 */
export async function validateAndRotateRefreshToken(rawToken) {
    if (!rawToken) return null;
    const hash = hashToken(rawToken);
    const { rows } = await pool.query(
        `UPDATE refresh_tokens rt
         SET revoked = TRUE
         FROM (
             SELECT rt2.id
             FROM refresh_tokens rt2
             LEFT JOIN user_sessions us ON us.id = rt2.session_id
             WHERE rt2.token_hash = $1
               AND rt2.revoked = FALSE
               AND rt2.expires_at > NOW()
               AND (us.id IS NULL OR us.revoked = FALSE)
         ) AS valid
         WHERE rt.id = valid.id
         RETURNING rt.user_id, rt.session_id`,
        [hash],
    );
    if (rows.length === 0) return null;
    return { userId: rows[0].user_id, sessionId: rows[0].session_id };
}

/**
 * Revokes all refresh tokens for a user (use on full logout).
 * @param {number} userId
 */
export async function revokeAllUserRefreshTokens(userId) {
    await pool.query(
        `UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1`,
        [userId],
    );
}
