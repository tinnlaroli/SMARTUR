import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/rbacMiddleware.js';
import upload from '../middleware/multer.js';
import EvaluationPdfController from '../controllers/evaluationPdfController.js';

const router = express.Router();

/**
 * POST /service-evaluation/parse-pdf
 * Parse a scanned PDF evaluation form and extract scores using OCR.
 *
 * Request:
 *   - Content-Type: multipart/form-data
 *   - pdf: File (PDF buffer)
 *   - rubric: JSON string with evaluation rubric
 *
 * Response:
 *   {
 *     parsed: [
 *       { id_criterion: 1, name: "Limpieza", detected_score: 4, confidence: "high" }
 *     ],
 *     raw_text: "full OCR text extracted"
 *   }
 */
router.post(
    '/service-evaluation/parse-pdf',
    verifyToken,
    requireRole([1]), // Admin only
    upload.single('pdf'),
    EvaluationPdfController.parsePdf
);

export default router;
