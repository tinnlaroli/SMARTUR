import express from 'express';
import ServicesController from '../controllers/serviceController.js';
import UserController from '../controllers/userController.js';
import upload from '../middleware/multer.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', ServicesController.loginController);
router.post('/two-factor', ServicesController.verifyTwoStepVerificationCodeController);
router.post('/forgot', ServicesController.forgotPasswordController);
router.post('/reset', ServicesController.resetPasswordController);
router.post('/register', upload.single('image'), UserController.register);
router.post('/google-login', UserController.googleLogin);

// Refresh token — emite nuevo access + refresh token (rotación)
router.post('/auth/refresh', ServicesController.refreshController);
// Logout — revoca todos los refresh tokens del usuario
router.post('/auth/logout', verifyToken, ServicesController.logoutController);

export default router;
