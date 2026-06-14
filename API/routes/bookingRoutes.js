import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/rbacMiddleware.js';
import { requireOwnsCompany } from '../middleware/requireOwnsCompany.js';
import BookingController from '../controllers/bookingController.js';

const router = express.Router();

// ── Tourist ───────────────────────────────────────────────────────────────────
router.post('/bookings',    verifyToken, requireRole([2]), BookingController.createBooking);
router.get('/bookings/me',  verifyToken, requireRole([2]), BookingController.getMyBookings);

// Tourist cancel their own booking
router.patch('/bookings/:id/cancel', verifyToken, requireRole([2]), BookingController.cancelBooking);

// ── Empresa ───────────────────────────────────────────────────────────────────
router.get(
    '/empresa/bookings',
    verifyToken, requireRole([1, 3]), requireOwnsCompany,
    BookingController.getEmpresaBookings,
);

router.patch(
    '/empresa/bookings/:id/confirm',
    verifyToken, requireRole([3]), requireOwnsCompany,
    BookingController.confirmBooking,
);

router.patch(
    '/empresa/bookings/:id/cancel',
    verifyToken, requireRole([3]), requireOwnsCompany,
    BookingController.cancelBooking,
);

router.post(
    '/empresa/bookings/walkin',
    verifyToken, requireRole([3]), requireOwnsCompany,
    BookingController.createWalkin,
);

router.get(
    '/empresa/bookings/:id/tourist-profile',
    verifyToken, requireRole([1, 3]), requireOwnsCompany,
    BookingController.getTouristProfile,
);

export default router;
