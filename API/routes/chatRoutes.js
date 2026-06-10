import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/rbacMiddleware.js';
import { requireOwnsCompany } from '../middleware/requireOwnsCompany.js';
import ChatController from '../controllers/chatController.js';

const router = express.Router();

// ── Tourist ───────────────────────────────────────────────────────────────────
router.post('/conversations',    verifyToken, requireRole([2]), ChatController.startConversation);
router.get('/conversations/me',  verifyToken, requireRole([2]), ChatController.getMyConversations);

// ── Empresa ───────────────────────────────────────────────────────────────────
router.get(
    '/empresa/conversations',
    verifyToken, requireRole([1, 3]), requireOwnsCompany,
    ChatController.getEmpresaConversations,
);

// ── Shared (participant guard inside controller) ──────────────────────────────
router.get('/conversations/:id/messages',  verifyToken, requireRole([2, 3]), ChatController.getMessages);
router.post('/conversations/:id/messages', verifyToken, requireRole([2, 3]), ChatController.sendMessage);
router.patch('/conversations/:id/read',    verifyToken, requireRole([2, 3]), ChatController.markRead);

export default router;
