import { Router } from 'express';
import AdminChangeLogController from '../controllers/adminChangeLogController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/rbacMiddleware.js';

const router = Router();

// Admin
router.get('/admin-change-log',               verifyToken, requireRole([1]), AdminChangeLogController.getAll);
router.get('/admin-change-log/:id',           verifyToken, requireRole([1]), AdminChangeLogController.getById);
router.patch('/admin-change-log/:id/resolve', verifyToken, requireRole([1]), AdminChangeLogController.adminResolve);

// Empresa
router.get('/empresa/change-log',                   verifyToken, requireRole([3]), AdminChangeLogController.getByCompany);
router.patch('/empresa/change-log/:id/accept',      verifyToken, requireRole([3]), AdminChangeLogController.empresaAccept);
router.patch('/empresa/change-log/:id/dispute',     verifyToken, requireRole([3]), AdminChangeLogController.empresaDispute);

export default router;
