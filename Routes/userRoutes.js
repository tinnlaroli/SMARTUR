import express from 'express';
import UserController from '../Controllers/userController.js';

const router = express.Router();

// Rutas de usuarios
router.get('/users', UserController.findAllUsers);
router.get('/users/:id', UserController.getUserById);
router.post('/users', UserController.createUser);
router.put('/users/:id', UserController.updateUser);
router.delete('/users/:id', UserController.deleteUser);

// Rutas de autenticación
router.post('/register', UserController.registerUser);
router.post('/login', UserController.loginUser);
router.post('/logout', UserController.logoutUser);
router.get('/verify-token', UserController.verifyToken);

router.get('/users/:id/forms', UserController.getUserForms);
router.get('/users/:id/recommendations', UserController.getUserRecommendations);
router.get('/users/:id/history', UserController.getUserHistory);
router.get('/users/:id/notifications', UserController.getUserNotifications);
router.put('/users/:id/notifications/:notification_id/read', UserController.markNotificationAsRead);

export default router;