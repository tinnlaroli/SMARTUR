import pool from '../config/db.js';

/**
 * Records a login session in user_sessions.
 * Called after every successful authentication (password-based MFA or Google OAuth).
 *
 * @param {number} userId
 * @param {import('express').Request} req
 * @returns {Promise<number|null>} the new session id, or null if recording failed
 */
export async function recordSession(userId, req) {
    try {
        const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
            || req.socket?.remoteAddress
            || null;

        const ua = req.headers['user-agent'] ?? '';
        let deviceHint = 'Dispositivo desconocido';
        if (/android/i.test(ua))      deviceHint = 'Android';
        else if (/iphone|ipad/i.test(ua)) deviceHint = 'iOS';
        else if (/windows/i.test(ua)) deviceHint = 'Windows';
        else if (/macintosh/i.test(ua)) deviceHint = 'Mac';
        else if (/linux/i.test(ua))   deviceHint = 'Linux';

        // Identify app vs browser
        if (/smartur/i.test(ua) || /Dart/i.test(ua)) {
            deviceHint += ' · App';
        } else if (/mozilla|chrome|safari|edge/i.test(ua)) {
            deviceHint += ' · Navegador';
        }

        const { rows } = await pool.query(
            `INSERT INTO user_sessions (user_id, device_hint, ip)
             VALUES ($1, $2, $3)
             RETURNING id`,
            [userId, deviceHint, ip],
        );
        return rows[0]?.id ?? null;
    } catch (err) {
        // Non-fatal — don't block the login response
        console.warn('[sessionHelper] failed to record session:', err.message);
        return null;
    }
}
