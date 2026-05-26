import { Router } from 'express';
import NotificationController from '../controllers/notificationController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/rbacMiddleware.js';

const router = Router();

/**
 * POST /api/v2/me/device-token
 * Cualquier usuario autenticado puede registrar su token FCM.
 * body: { token: string, platform?: 'android' | 'ios' }
 */
router.post(
    '/me/device-token',
    verifyToken,
    NotificationController.registerToken,
);

/**
 * POST /api/v2/admin/notifications/send
 * Solo admin (role_id=1) puede enviar push a todos o por segmento.
 * body: { title: string, body: string, target: 'all' | 'user' | 'empresa' }
 */
router.post(
    '/admin/notifications/send',
    verifyToken,
    requireRole([1]),
    NotificationController.sendNotification,
);

export default router;
