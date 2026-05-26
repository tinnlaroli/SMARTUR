import { Router } from 'express';
import EmpresaController from '../controllers/empresaController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/rbacMiddleware.js';
import { requireOwnsCompany } from '../middleware/requireOwnsCompany.js';

const router = Router();

// ── Público — sin autenticación ───────────────────────────────────────────────

/**
 * POST /api/v2/auth/register-empresa
 * Autoregistro de empresas turísticas.
 * Crea empresa (status=pending) + usuario (role_id=3) y devuelve JWT.
 */
router.post('/auth/register-empresa', EmpresaController.registerEmpresa);

// ── Empresa / Admin ────────────────────────────────────────────────────────────

/**
 * GET /api/v2/empresa/profile
 * Admin ve cualquier empresa; empresa ve solo la suya (por id_company en JWT).
 */
router.get(
    '/empresa/profile',
    verifyToken,
    requireRole([1, 3]),
    requireOwnsCompany,
    EmpresaController.getProfile,
);

/**
 * PATCH /api/v2/empresa/profile
 * Solo la empresa propietaria puede editar sus datos (name, address, phone).
 */
router.patch(
    '/empresa/profile',
    verifyToken,
    requireRole([3]),
    requireOwnsCompany,
    EmpresaController.updateProfile,
);

/**
 * GET /api/v2/empresa/services
 * Lista servicios turísticos de la empresa autenticada.
 */
router.get(
    '/empresa/services',
    verifyToken,
    requireRole([1, 3]),
    requireOwnsCompany,
    EmpresaController.getServices,
);

/**
 * GET /api/v2/empresa/analytics
 * Dashboard de métricas para la empresa: recomendaciones, favoritos, visitas, rating.
 */
router.get(
    '/empresa/analytics',
    verifyToken,
    requireRole([1, 3]),
    requireOwnsCompany,
    EmpresaController.getAnalytics,
);

/**
 * POST /api/v2/empresa/services
 * Crea un servicio turístico para la empresa autenticada.
 */
router.post(
    '/empresa/services',
    verifyToken,
    requireRole([3]),
    requireOwnsCompany,
    EmpresaController.createService,
);

/**
 * PATCH /api/v2/empresa/services/:id
 * Edita un servicio propio (verifica ownership).
 */
router.patch(
    '/empresa/services/:id',
    verifyToken,
    requireRole([3]),
    requireOwnsCompany,
    EmpresaController.updateService,
);

/**
 * DELETE /api/v2/empresa/services/:id
 * Soft-delete de un servicio propio.
 */
router.delete(
    '/empresa/services/:id',
    verifyToken,
    requireRole([3]),
    requireOwnsCompany,
    EmpresaController.deleteService,
);

export default router;
