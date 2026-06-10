/**
 * FCM Service — Firebase Cloud Messaging via Firebase Admin SDK
 *
 * Requiere la variable de entorno GOOGLE_APPLICATION_CREDENTIALS apuntando
 * al service account JSON del proyecto Firebase, o FIREBASE_SERVICE_ACCOUNT
 * con el JSON en base64.
 *
 * Documentación: https://firebase.google.com/docs/admin/setup
 */
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

let _messagingInstance = null;

/**
 * Inicializa Firebase Admin una sola vez (lazy singleton).
 * Retorna null si no está configurado — degradación sin lanzar excepción.
 */
function getFirebaseMessaging() {
    if (_messagingInstance) return _messagingInstance;

    const apps = getApps();
    let app;

    if (apps.length > 0) {
        app = apps[0];
    } else {
        // Credenciales desde env var (base64 del service account JSON)
        const serviceAccountB64 = process.env.FIREBASE_SERVICE_ACCOUNT;
        if (!serviceAccountB64) {
            console.warn('[FCM] FIREBASE_SERVICE_ACCOUNT no configurado — push notifications deshabilitadas.');
            return null;
        }
        try {
            const serviceAccount = JSON.parse(Buffer.from(serviceAccountB64, 'base64').toString('utf8'));
            app = initializeApp({ credential: cert(serviceAccount) });
        } catch (err) {
            console.error('[FCM] Error inicializando Firebase Admin:', err.message);
            return null;
        }
    }

    _messagingInstance = getMessaging(app);
    return _messagingInstance;
}

/**
 * Envía una notificación push a un usuario específico (por user_id).
 * Obtiene sus device tokens del pool y llama a sendToTokens.
 * Fire-and-forget — no lanza excepción si falla.
 *
 * @param {import('pg').Pool} pool
 * @param {number} userId
 * @param {{ title: string; body: string; data?: Record<string, string> }} notification
 */
export async function sendFcmToUser(pool, userId, { title, body, data = {} }) {
    try {
        const { rows } = await pool.query(
            `SELECT token FROM device_token WHERE user_id = $1`,
            [userId],
        );
        const tokens = rows.map(r => r.token).filter(Boolean);
        if (tokens.length > 0) {
            await sendToTokens(tokens, { title, body, data });
        }
    } catch (err) {
        console.error(`[FCM] sendFcmToUser(${userId}) falló:`, err.message);
    }
}

/**
 * Envía una notificación push a un conjunto de tokens FCM.
 *
 * @param {string[]} tokens  - Tokens FCM de destino
 * @param {{ title: string; body: string; data?: Record<string, string> }} notification
 * @returns {Promise<{ successCount: number; failureCount: number; failedTokens: string[] }>}
 */
export async function sendToTokens(tokens, { title, body, data = {} }) {
    if (!tokens || tokens.length === 0) {
        return { successCount: 0, failureCount: 0, failedTokens: [] };
    }

    const messaging = getFirebaseMessaging();
    if (!messaging) {
        return { successCount: 0, failureCount: tokens.length, failedTokens: tokens };
    }

    const message = {
        notification: { title, body },
        data,
        android: {
            notification: {
                sound: 'default',
                clickAction: 'FLUTTER_NOTIFICATION_CLICK',
            },
        },
        apns: {
            payload: { aps: { sound: 'default' } },
        },
    };

    try {
        const batchResponse = await messaging.sendEachForMulticast({
            ...message,
            tokens,
        });

        const failedTokens = batchResponse.responses
            .map((r, i) => (!r.success ? tokens[i] : null))
            .filter(Boolean);

        return {
            successCount: batchResponse.successCount,
            failureCount: batchResponse.failureCount,
            failedTokens,
        };
    } catch (error) {
        console.error('[FCM] Error enviando push:', error.message);
        return { successCount: 0, failureCount: tokens.length, failedTokens: tokens };
    }
}
