import express from 'express';
import rateLimit from 'express-rate-limit';
import { verifyToken, requireRole } from '../middleware/authMiddleware.js';
import db from '../config/db.js';

const router = express.Router();

const contactLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Demasiados mensajes enviados. Intenta de nuevo en 10 minutos.' },
});

router.post('/contact', contactLimiter, async (req, res) => {
    const { email, reason, message, source = 'landing_b2b' } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
        return res.status(400).json({ message: 'Email inválido.' });
    }

    const clean = email.trim().toLowerCase();
    const cleanReason = reason?.trim() || null;
    const cleanMessage = message?.trim() || null;

    try {
        const { rows: recent } = await db.query(
            `SELECT 1 FROM contact_subscription
             WHERE email = $1 AND created_at > NOW() - INTERVAL '5 minutes'
             LIMIT 1`,
            [clean],
        );
        if (recent.length > 0) return res.json({ ok: true });

        await db.query(
            'INSERT INTO contact_subscription (email, source, reason, message) VALUES ($1, $2, $3, $4)',
            [clean, source, cleanReason, cleanMessage],
        );
        res.json({ ok: true });
    } catch (err) {
        console.error('[contact] Error:', err.message);
        res.status(500).json({ message: 'No se pudo procesar la solicitud. Intenta de nuevo.' });
    }
});

router.get('/contact-subscriptions', verifyToken, requireRole([1]), async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);
    const offset = (page - 1) * limit;

    try {
        const { rows: countRows } = await db.query('SELECT COUNT(*)::int AS total FROM contact_subscription');
        const total = countRows[0].total;
        const { rows } = await db.query(
            'SELECT id, email, source, reason, message, status, created_at FROM contact_subscription ORDER BY created_at DESC LIMIT $1 OFFSET $2',
            [limit, offset],
        );
        res.json({
            subscriptions: rows,
            totalRecords: total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            limit,
        });
    } catch (err) {
        console.error('[contact] GET subscriptions error:', err.message);
        res.status(500).json({ message: 'Error al obtener suscripciones.' });
    }
});

const ALLOWED_STATUSES = ['pending', 'in_progress', 'done', 'dismissed'];

router.patch('/contact-subscriptions/:id/status', verifyToken, requireRole([1]), async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const { status } = req.body;
    if (Number.isNaN(id)) return res.status(400).json({ message: 'ID inválido.' });
    if (!ALLOWED_STATUSES.includes(status)) return res.status(400).json({ message: 'Estado inválido.' });

    try {
        const { rowCount } = await db.query(
            'UPDATE contact_subscription SET status=$1 WHERE id=$2',
            [status, id],
        );
        if (!rowCount) return res.status(404).json({ message: 'Contacto no encontrado.' });
        res.json({ ok: true });
    } catch (err) {
        console.error('[contact] PATCH status error:', err.message);
        res.status(500).json({ message: 'Error al actualizar estado.' });
    }
});

router.delete('/contact-subscriptions/:id', verifyToken, requireRole([1]), async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ message: 'ID inválido.' });

    try {
        const { rowCount } = await db.query('DELETE FROM contact_subscription WHERE id = $1', [id]);
        if (!rowCount) return res.status(404).json({ message: 'Suscripción no encontrada.' });
        res.json({ ok: true });
    } catch (err) {
        console.error('[contact] DELETE subscription error:', err.message);
        res.status(500).json({ message: 'Error al eliminar suscripción.' });
    }
});

export default router;
