import { Router } from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/rbacMiddleware.js';
import * as ctrl from '../controllers/serviceActivityController.js';

const router = Router();

// Public: anyone can list activities of a service
router.get('/tourist-services/:id/activities', ctrl.list);

// Admin + empresa: manage activities
router.post('/tourist-services/:id/activities',
    verifyToken, requireRole([1, 3]), ctrl.create);

router.patch('/tourist-services/:serviceId/activities/:actId',
    verifyToken, requireRole([1, 3]), ctrl.update);

router.delete('/tourist-services/:serviceId/activities/:actId',
    verifyToken, requireRole([1, 3]), ctrl.remove);

export default router;
