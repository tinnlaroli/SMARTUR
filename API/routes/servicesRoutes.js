import express from 'express';
import ServicesController from '../controllers/serviceController.js';
import UserController from '../controllers/userController.js';
import EmpresaController from '../controllers/empresaController.js';
import * as QrLoginController from '../controllers/qrLoginController.js';
import upload from '../middleware/multer.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', ServicesController.loginController);
router.post('/two-factor', ServicesController.verifyTwoStepVerificationCodeController);
router.post('/resend-otp', ServicesController.resendOtpController);
router.post('/forgot', ServicesController.forgotPasswordController);
router.post('/reset', ServicesController.resetPasswordController);
router.post('/register', upload.single('image'), UserController.register);
router.post('/google-login', UserController.googleLogin);
router.post('/facebook-login', UserController.facebookLogin);

// Refresh token — emite nuevo access + refresh token (rotación)
router.post('/auth/refresh', ServicesController.refreshController);
// Logout — revoca todos los refresh tokens del usuario
router.post('/auth/logout', verifyToken, ServicesController.logoutController);
// Verificación de email
router.get('/auth/verify-email/:token', EmpresaController.verifyEmail);

// Login por QR (web genera reto, móvil aprueba, web canjea por sesión real)
router.post('/auth/qr/challenge', QrLoginController.createChallenge);
router.get('/auth/qr/:challengeId/status', QrLoginController.getChallengeStatus);
router.post('/auth/qr/:challengeId/approve', verifyToken, QrLoginController.approveChallenge);
router.post('/auth/qr/:challengeId/deny', verifyToken, QrLoginController.denyChallenge);
router.post('/auth/qr/:challengeId/exchange', QrLoginController.exchangeChallenge);

export default router;
