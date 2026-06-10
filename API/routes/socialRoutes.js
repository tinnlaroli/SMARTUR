import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/rbacMiddleware.js';
import SocialController from '../controllers/socialController.js';

const router = express.Router();

// ── User social ───────────────────────────────────────────────────────────────
// NOTE: /users/search MUST be before /users/:id to avoid route conflicts
router.get('/users/search',              verifyToken, SocialController.searchUsers);
router.get('/users/:id/profile',         verifyToken, SocialController.getPublicProfile);
router.get('/users/:id/itineraries',     verifyToken, SocialController.getUserItineraries);
router.get('/users/:id/followers',       verifyToken, SocialController.getFollowers);
router.get('/users/:id/following',       verifyToken, SocialController.getFollowing);
router.post('/users/:id/follow',         verifyToken, SocialController.followUser);
router.delete('/users/:id/follow',       verifyToken, SocialController.unfollowUser);

// ── Admin: rutas certificadas ─────────────────────────────────────────────────
router.get('/admin/itineraries',                verifyToken, requireRole([1]), SocialController.listAdminItineraries);
router.patch('/admin/itineraries/:id/certify',  verifyToken, requireRole([1]), SocialController.certifyItinerary);
router.patch('/admin/itineraries/:id/uncertify',verifyToken, requireRole([1]), SocialController.uncertifyItinerary);

export default router;
