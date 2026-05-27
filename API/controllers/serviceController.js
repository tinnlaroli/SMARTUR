import { UserService } from '../services/userService.js';
import { sendEmail, sendEmailVerification } from '../utils/mailer.js';
import { validatePassword, validateRequiredFields } from '../validators/userValidators.js';
import { logSecurityEvent } from '../services/monitoringService.js';
import { recordSession } from '../utils/sessionHelper.js';
import {
    generateRefreshToken,
    storeRefreshToken,
    validateAndRotateRefreshToken,
    revokeAllUserRefreshTokens,
} from '../utils/refreshTokenHelper.js';
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

function getClientIp(req) {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) return forwarded.split(',')[0].trim();
    return req.socket?.remoteAddress ?? req.ip ?? null;
}


class ServicesController {
    static async forgotPasswordController(req, res) {
        const ip = getClientIp(req);
        try {
            const { email } = req.body;

            const token = await UserService.generateResetToken(email);
            await sendEmail(email, token);
            await logSecurityEvent('PASSWORD_RESET_REQUEST', email, ip, 'INFO');
            res.json({ message: 'Código enviado correctamente' });
        } catch (error) {
            await logSecurityEvent('UNAUTHORIZED', req.body?.email ?? null, ip, 'WARN');
            res.status(400).json({ message: error.message });
        }
    }

    static async resetPasswordController(req, res) {
        const ip = getClientIp(req);
        try {
            const { email, token, newPassword } = req.body;

            validatePassword(newPassword);

            await UserService.resetPassword(email, token, newPassword);
            await logSecurityEvent('PASSWORD_RESET_SUCCESS', email, ip, 'INFO');
            res.json({ message: 'Contraseña actualizada correctamente' });
        } catch (error) {
            await logSecurityEvent('UNAUTHORIZED', req.body?.email ?? null, ip, 'WARN');
            res.status(400).json({ message: error.message });
        }
    }

    static async loginController(req, res) {
        const ip = getClientIp(req);
        try {
            const { email, password } = req.body;

            validateRequiredFields({ email, password });

            const result = await UserService.login(email, password);

            if (result.status === 200) {
                await logSecurityEvent('LOGIN_STEP1', email, ip, 'INFO');

                // Intentar enviar el correo — si falla (ej. SMTP bloqueado en producción)
                // se registra el error pero NO se aborta el login
                try {
                    await sendEmailVerification(email, result.data.verificationCode);
                } catch (emailError) {
                    // El token ya está guardado en DB; el usuario puede reintentarlo aunque el envío falle por SMTP
                }

                return res.status(200).json({
                    message: 'Código de verificación enviado',
                    requiresVerification: true,
                    userId: result.data.userId,
                    email: result.data.email,
                });
            }

            await logSecurityEvent('LOGIN_FAIL', email ?? null, ip, 'WARN');
            return res.status(result.status).json({ message: result.message, error: result.error });
        } catch (error) {
            await logSecurityEvent('LOGIN_FAIL', req.body?.email ?? null, ip, 'WARN').catch(() => {});
            return res.status(500).json({ message: 'Error del servidor', error: error.message });
        }
    }

    static async verifyTwoStepVerificationCodeController(req, res) {
        const ip = getClientIp(req);
        try {
            const { email, token } = req.body;

            const result = await UserService.verifyTwoStepVerificationCode(email, token);

            if (result.status !== 200) {
                await logSecurityEvent('MFA_DENIED', email ?? null, ip, 'WARN');
                return res.status(result.status).json({ message: result.message });
            }

            await logSecurityEvent('LOGIN_SUCCESS', email ?? null, ip, 'INFO');
            // Fire-and-forget: record device session
            recordSession(result.data.user.id, req);
            const rawRefresh = generateRefreshToken();
            await storeRefreshToken(result.data.user.id, rawRefresh);
            res.json({
                message: 'Login exitoso',
                token: result.data.token,
                refreshToken: rawRefresh,
                user: result.data.user,
            });
        } catch (error) {
            await logSecurityEvent('MFA_DENIED', req.body?.email ?? null, ip, 'WARN').catch(() => {});
            res.status(500).json({ error: error.message });
        }
    }

    static async refreshController(req, res) {
        try {
            const { refreshToken } = req.body;
            const userId = await validateAndRotateRefreshToken(refreshToken);
            if (!userId) {
                return res.status(401).json({ message: 'Refresh token inválido o expirado.' });
            }

            const user = await User.findById(userId);
            if (!user || !user.is_active) {
                return res.status(401).json({ message: 'Usuario inactivo.' });
            }

            const payload = { id: user.user_id, email: user.email, role_id: user.role_id };
            if (user.role_id === 3 && user.id_company != null) payload.id_company = user.id_company;

            const newAccessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
            const newRefresh = generateRefreshToken();
            await storeRefreshToken(user.user_id, newRefresh);

            return res.json({ token: newAccessToken, refreshToken: newRefresh });
        } catch (error) {
            return res.status(500).json({ message: 'Error al renovar sesión.' });
        }
    }

    static async logoutController(req, res) {
        try {
            await revokeAllUserRefreshTokens(req.user.id);
            res.json({ ok: true });
        } catch {
            res.status(500).json({ message: 'Error al cerrar sesión.' });
        }
    }
}

export default ServicesController;
