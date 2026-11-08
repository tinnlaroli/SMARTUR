import crypto from 'node:crypto';
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import { recordSession } from '../utils/sessionHelper.js';
import { generateRefreshToken, storeRefreshToken } from '../utils/refreshTokenHelper.js';
import { logSecurityEvent } from '../services/monitoringService.js';

/**
 * POST /api/v2/auth/invitado
 *
 * Demo web de la app (iPhone sin App Store): crea una cuenta de turista temporal por
 * visitante y devuelve una sesión igual a la del login con 2FA. Cada invitado tiene su
 * propia cuenta (no se comparte una cuenta demo) y queda marcada por su dominio de correo
 * para poder limpiarla después. Se apaga con GUEST_LOGIN_ENABLED=false.
 */
export const DOMINIO_INVITADOS = 'invitado.smartur.online';
const router = express.Router();

router.post('/auth/invitado', async (req, res) => {
    if (process.env.GUEST_LOGIN_ENABLED === 'false') {
        return res.status(404).json({ message: 'El acceso de invitado no está disponible.' });
    }
    try {
        const sufijo = crypto.randomBytes(5).toString('hex');
        const user = await User.create({
            name: 'Invitado',
            email: `invitado-${sufijo}@${DOMINIO_INVITADOS}`,
            // Nadie conoce esta contraseña: el invitado solo entra con esta sesión.
            password: crypto.randomBytes(24).toString('base64url'),
            role_id: 2,
        });
        const token = jwt.sign(
            { id: user.user_id, email: user.email, role_id: 2 },
            process.env.JWT_SECRET,
            { expiresIn: '15m' },
        );
        const sessionId = await recordSession(user.user_id, req);
        const refreshToken = generateRefreshToken();
        await storeRefreshToken(user.user_id, refreshToken, sessionId, 7);
        await logSecurityEvent('GUEST_LOGIN', user.email, req.ip ?? null, 'INFO').catch(() => {});
        return res.status(201).json({
            message: 'Sesión de invitado creada',
            token,
            refreshToken,
            user: {
                id: user.user_id,
                name: user.name,
                email: user.email,
                role_id: 2,
                photo_url: null,
                avatar_icon_key: null,
                invitado: true,
            },
        });
    } catch (err) {
        console.error('[auth/invitado] error:', err.message);
        return res.status(500).json({ message: 'No se pudo crear la sesión de invitado.' });
    }
});

export default router;
