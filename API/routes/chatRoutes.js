import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/rbacMiddleware.js';
import { requireOwnsCompany } from '../middleware/requireOwnsCompany.js';
import ChatController from '../controllers/chatController.js';
import { botMessage, listConversationFaqs } from '../controllers/chatBotController.js';
import * as faqCtrl from '../controllers/companyFaqController.js';

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

router.get(
    '/empresa/badge-counts',
    verifyToken, requireRole([3]), requireOwnsCompany,
    ChatController.getBadgeCounts,
);

// ── FAQ knowledge base (empresa) ─────────────────────────────────────────────
router.get('/empresa/faqs',    verifyToken, requireRole([3]), faqCtrl.list);
router.post('/empresa/faqs',   verifyToken, requireRole([3]), faqCtrl.create);
router.patch('/empresa/faqs/:id', verifyToken, requireRole([3]), faqCtrl.update);
router.delete('/empresa/faqs/:id', verifyToken, requireRole([3]), faqCtrl.remove);

// ── Shared (participant guard inside controller) ──────────────────────────────
router.get('/conversations/:id/messages',  verifyToken, requireRole([2, 3]), ChatController.getMessages);
router.post('/conversations/:id/messages', verifyToken, requireRole([2, 3]), ChatController.sendMessage);
router.patch('/conversations/:id/read',    verifyToken, requireRole([2, 3]), ChatController.markRead);

// ── RAG chatbot ───────────────────────────────────────────────────────────────
router.post('/conversations/:id/bot-message', verifyToken, requireRole([2, 3]), botMessage);
// Preguntas frecuentes de la empresa de esta conversación (para el turista)
router.get('/conversations/:id/faqs', verifyToken, requireRole([2, 3]), listConversationFaqs);

export default router;
