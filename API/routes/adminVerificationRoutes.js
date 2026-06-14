import { Router } from 'express';
import AdminVerificationController from '../controllers/adminVerificationController.js';
import ItineraryController from '../controllers/itineraryController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/rbacMiddleware.js';

const router = Router();

// Todas las rutas de este archivo requieren admin (role_id = 1)
router.use('/admin', verifyToken, requireRole([1]));

/**
 * GET /api/v2/admin/companies
 * Lista todas las empresas con filtro por status.
 */
router.get('/admin/companies', AdminVerificationController.listAllCompanies);

/**
 * GET /api/v2/admin/companies/pending
 * Lista empresas con documentos enviados, pendientes de revisión.
 */
router.get('/admin/companies/pending', AdminVerificationController.listPendingCompanies);

/**
 * GET /api/v2/admin/companies/:id/verification
 * Detalle de empresa + documentos KYC para revisión.
 */
router.get('/admin/companies/:id/verification', AdminVerificationController.getCompanyVerification);

/**
 * PATCH /api/v2/admin/companies/:id/verify
 * Aprueba o rechaza una empresa.
 * Body: { action: 'approve'|'reject', reason?: string }
 */
router.patch('/admin/companies/:id/verify', AdminVerificationController.verifyCompany);

/**
 * PATCH /api/v2/admin/companies/:id/location
 * Asigna o corrige el municipio de una empresa.
 * Body: { id_location: number }
 */
router.patch('/admin/companies/:id/location', AdminVerificationController.updateCompanyLocation);

/**
 * GET /api/v2/admin/services
 * Lista todos los servicios turísticos con filtro opcional por status.
 */
router.get('/admin/services', AdminVerificationController.listAllServices);

/**
 * GET /api/v2/admin/services/pending
 * Lista servicios turísticos pendientes de aprobación.
 */
router.get('/admin/services/pending', AdminVerificationController.listPendingServices);

/**
 * PATCH /api/v2/admin/services/:id/approve
 * Aprueba un servicio turístico.
 */
router.patch('/admin/services/:id/approve', AdminVerificationController.approveService);

/**
 * PATCH /api/v2/admin/services/:id/reject
 * Rechaza un servicio turístico.
 * Body: { reason?: string }
 */
router.patch('/admin/services/:id/reject', AdminVerificationController.rejectService);

// ── POIs empresa (validación) ─────────────────────────────────────────────────
router.get('/admin/pois/pending',          AdminVerificationController.listPendingPOIs);
router.patch('/admin/pois/:id/approve',    AdminVerificationController.approvePOI);
router.patch('/admin/pois/:id/reject',     AdminVerificationController.rejectPOI);

// ── Itinerarios admin ─────────────────────────────────────────────────────────
router.get('/admin/itineraries',              ItineraryController.adminList);
router.post('/admin/itineraries',             ItineraryController.adminCreate);
router.patch('/admin/itineraries/:id/certify',   ItineraryController.adminCertify);
router.patch('/admin/itineraries/:id/uncertify', ItineraryController.adminUncertify);

export default router;
