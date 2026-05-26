import pool from '../config/db.js';
import { sendToTokens } from '../services/fcmService.js';

/**
 * NotificationController
 * Gestiona tokens FCM y envío de push notifications.
 *
 * OWASP A01 — solo admin puede enviar a todos; usuarios solo registran su propio token.
 */
class NotificationController {

    /**
     * POST /api/v2/me/device-token
     * Registra o actualiza el token FCM del usuario autenticado.
     * body: { token: string, platform?: 'android' | 'ios' }
     */
    static async registerToken(req, res) {
        const { token, platform = 'android' } = req.body;
        const userId = req.user.id;

        if (!token || typeof token !== 'string') {
            return res.status(400).json({ message: 'token requerido.' });
        }
        if (!['android', 'ios'].includes(platform)) {
            return res.status(400).json({ message: "platform debe ser 'android' o 'ios'." });
        }

        try {
            await pool.query(
                `INSERT INTO device_token (user_id, token, platform, updated_at)
                 VALUES ($1, $2, $3, NOW())
                 ON CONFLICT (user_id, platform)
                 DO UPDATE SET token = EXCLUDED.token, updated_at = NOW()`,
                [userId, token, platform],
            );
            return res.json({ message: 'Token registrado.' });
        } catch (error) {
            console.error('Error registrando token FCM:', error);
            return res.status(500).json({ message: 'Error del servidor.', error: error.message });
        }
    }

    /**
     * POST /api/v2/admin/notifications/send
     * Envía push notification a todos los usuarios o filtrado por rol.
     * body: { title: string, body: string, target: 'all' | 'user' | 'empresa' }
     * Solo role_id = 1 (admin).
     */
    static async sendNotification(req, res) {
        const { title, body, target = 'all' } = req.body;

        if (!title || !body) {
            return res.status(400).json({ message: 'title y body requeridos.' });
        }

        try {
            let query = `
                SELECT dt.token FROM device_token dt
                JOIN "user" u ON u.user_id = dt.user_id
                WHERE u.is_active = TRUE
            `;
            const params = [];

            if (target === 'user') {
                query += ' AND u.role_id = 2';
            } else if (target === 'empresa') {
                query += ' AND u.role_id = 3';
            }
            // 'all' — no filter additional

            const result = await pool.query(query, params);
            const tokens = result.rows.map((r) => r.token);

            if (tokens.length === 0) {
                return res.json({
                    message: 'Sin dispositivos registrados para el destino seleccionado.',
                    successCount: 0,
                    failureCount: 0,
                });
            }

            const fcmResult = await sendToTokens(tokens, { title, body });

            return res.json({
                message: `Notificación enviada. ${fcmResult.successCount} exitosas, ${fcmResult.failureCount} fallidas.`,
                ...fcmResult,
            });
        } catch (error) {
            console.error('Error enviando notificación:', error);
            return res.status(500).json({ message: 'Error del servidor.', error: error.message });
        }
    }
}

export default NotificationController;
