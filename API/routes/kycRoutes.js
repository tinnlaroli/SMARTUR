import { Router } from 'express';
import KycController from '../controllers/kycController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/rbacMiddleware.js';
import upload from '../middleware/multer.js';

const router = Router();

const kycUpload = upload.fields([
    { name: 'ine_front', maxCount: 1 },
    { name: 'ine_back', maxCount: 1 },
    { name: 'address_proof', maxCount: 1 },
]);

/**
 * POST /api/v2/empresa/verification
 * Envía o actualiza documentos KYC de la empresa autenticada.
 * Multipart: ine_front, ine_back, address_proof + campos de texto del propietario.
 */
router.post(
    '/empresa/verification',
    verifyToken,
    requireRole([3]),
    kycUpload,
    KycController.submitVerification,
);

/**
 * GET /api/v2/empresa/verification
 * Devuelve status de activación y datos KYC de la empresa autenticada.
 */
router.get(
    '/empresa/verification',
    verifyToken,
    requireRole([1, 3]),
    KycController.getVerification,
);

export default router;
