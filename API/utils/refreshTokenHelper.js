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
 * @param {number} expiryDays — default 30
 */
export async function storeRefreshToken(userId, rawToken, expiryDays = 30) {
    const hash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);
    await pool.query(
        `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
         VALUES ($1, $2, $3)`,
        [userId, hash, expiresAt],
    );
}

/**
 * Validates and rotates a refresh token (marks it revoked).
 * Returns the user_id if valid, null otherwise.
 * @param {string} rawToken
 * @returns {Promise<number|null>}
 */
export async function validateAndRotateRefreshToken(rawToken) {
    if (!rawToken) return null;
    const hash = hashToken(rawToken);
    const { rows } = await pool.query(
        `UPDATE refresh_tokens
         SET revoked = TRUE
         WHERE token_hash = $1
           AND revoked = FALSE
           AND expires_at > NOW()
         RETURNING user_id`,
        [hash],
    );
    return rows.length > 0 ? rows[0].user_id : null;
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
