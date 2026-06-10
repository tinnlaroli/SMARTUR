import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import ItineraryController from '../controllers/itineraryController.js';

const router = express.Router();

// ── Public (no auth required) ─────────────────────────────────────────────────
router.get('/itineraries/predefined', ItineraryController.getPredefined);
router.get('/itineraries/community', ItineraryController.getCommunity);
router.get('/itineraries/search', ItineraryController.search);

// ── Authenticated — specific paths BEFORE /:id ────────────────────────────────
router.get('/itineraries/me',        verifyToken, ItineraryController.getMyItineraries);
router.get('/itineraries/following', verifyToken, ItineraryController.getFollowing);

// ── /:id routes ───────────────────────────────────────────────────────────────
router.post('/itineraries', verifyToken, ItineraryController.createItinerary);
router.get('/itineraries/:id', verifyToken, ItineraryController.getById);
router.patch('/itineraries/:id', verifyToken, ItineraryController.updateItinerary);
router.delete('/itineraries/:id', verifyToken, ItineraryController.deleteItinerary);

// ── Stops ─────────────────────────────────────────────────────────────────────
router.post('/itineraries/:id/stops', verifyToken, ItineraryController.addStop);
router.delete('/itineraries/:id/stops/:stopId', verifyToken, ItineraryController.deleteStop);
router.patch('/itineraries/:id/stops/reorder', verifyToken, ItineraryController.reorderStops);

// ── Social ────────────────────────────────────────────────────────────────────
router.post('/itineraries/:id/copy', verifyToken, ItineraryController.copyItinerary);
router.post('/itineraries/:id/like', verifyToken, ItineraryController.likeItinerary);
router.delete('/itineraries/:id/like', verifyToken, ItineraryController.unlikeItinerary);

// ── Optimization ──────────────────────────────────────────────────────────────
router.post('/itineraries/:id/optimize', verifyToken, ItineraryController.optimizeItinerary);

// ── Suggestions ───────────────────────────────────────────────────────────────
router.get('/itineraries/:id/suggest-nearby', verifyToken, ItineraryController.suggestNearby);

export default router;
