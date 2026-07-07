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
import pool from '../config/db.js';

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
            return res.status(result.status).json({
                message: result.message,
                error: result.error,
                ...(result.code ? { code: result.code, provider: result.provider } : {}),
            });
        } catch (error) {
            console.error('Error en loginController:', error);
            await logSecurityEvent('LOGIN_FAIL', req.body?.email ?? null, ip, 'WARN').catch(() => {});
            return res.status(500).json({ message: 'Error del servidor' });
        }
    }

    static async resendOtpController(req, res) {
        const ip = getClientIp(req);
        try {
            const { email } = req.body;
            const code = await UserService.resendLoginOtp(email);
            try {
                await sendEmailVerification(email, code);
            } catch (emailError) {
                // El código ya quedó guardado; el usuario puede reintentar el reenvío.
            }
            await logSecurityEvent('OTP_RESEND', email ?? null, ip, 'INFO');
            return res.status(200).json({ message: 'Código reenviado' });
        } catch (error) {
            await logSecurityEvent('OTP_RESEND', req.body?.email ?? null, ip, 'WARN').catch(() => {});
            return res.status(400).json({ message: error.message });
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
            // Se espera (no fire-and-forget) porque el refresh token necesita
            // el session_id para poder revocarse junto con la sesión.
            const sessionId = await recordSession(result.data.user.id, req);
            const rawRefresh = generateRefreshToken();
            await storeRefreshToken(result.data.user.id, rawRefresh, sessionId);
            res.json({
                message: 'Login exitoso',
                token: result.data.token,
                refreshToken: rawRefresh,
                user: result.data.user,
            });
        } catch (error) {
            console.error('Error en verifyTwoStepVerificationCodeController:', error);
            await logSecurityEvent('MFA_DENIED', req.body?.email ?? null, ip, 'WARN').catch(() => {});
            res.status(500).json({ message: 'Error del servidor' });
        }
    }

    static async refreshController(req, res) {
        try {
            const { refreshToken } = req.body;
            const rotated = await validateAndRotateRefreshToken(refreshToken);
            if (!rotated) {
                // Cubre token inválido/expirado/ya usado Y el caso de una sesión
                // revocada desde "Sesiones activas" — en ambos casos se corta el acceso.
                return res.status(401).json({ message: 'Refresh token inválido o expirado.' });
            }
            const { userId, sessionId } = rotated;

            const user = await User.findById(userId);
            if (!user || !user.is_active) {
                return res.status(401).json({ message: 'Usuario inactivo.' });
            }
            if (user.role_id === 3 && !user.email_verified) {
                return res.status(403).json({ message: 'Debes verificar tu correo electrónico antes de iniciar sesión.' });
            }

            const roleId = Number(user.role_id);
            const payload = { id: user.user_id, email: user.email, role_id: roleId };
            if (roleId === 3 && user.id_company != null) payload.id_company = Number(user.id_company);

            const newAccessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
            const newRefresh = generateRefreshToken();
            // Mantiene el mismo session_id al rotar, para que "Sesiones activas"
            // siga representando el mismo dispositivo y su revoke lo alcance.
            await storeRefreshToken(user.user_id, newRefresh, sessionId);
            if (sessionId) {
                pool.query('UPDATE user_sessions SET last_seen = NOW() WHERE id = $1', [sessionId])
                    .catch(() => {});
            }

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
