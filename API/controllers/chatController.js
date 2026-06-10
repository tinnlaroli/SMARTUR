import pool from '../config/db.js';
import { sendFcmToUser } from '../services/fcmService.js';
import * as Chat from '../models/chatModel.js';

function safeBody(req) {
    const b = req.body;
    if (b != null && typeof b === 'object' && !Array.isArray(b)) return b;
    return {};
}

export class ChatController {
    static async startConversation(req, res) {
        try {
            const touristId = req.user.id;
            const { id_company, id_service } = safeBody(req);
            if (!id_company) return res.status(400).json({ message: 'id_company es requerido' });
            const conv = await Chat.getOrCreateConversation(touristId, id_company, id_service ?? null);
            res.status(201).json({ message: 'Conversación iniciada', conversation: conv });
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Error al iniciar conversación', error: e.message });
        }
    }

    static async getMyConversations(req, res) {
        try {
            const convs = await Chat.getMyConversations(req.user.id);
            res.json({ message: 'Conversaciones', conversations: convs });
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Error al cargar conversaciones', error: e.message });
        }
    }

    static async getEmpresaConversations(req, res) {
        try {
            const convs = await Chat.getEmpresaConversations(req.user.id_company);
            res.json({ message: 'Conversaciones de la empresa', conversations: convs });
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Error al cargar conversaciones', error: e.message });
        }
    }

    static async getMessages(req, res) {
        try {
            const id = parseInt(req.params.id, 10);
            if (Number.isNaN(id)) return res.status(400).json({ message: 'ID inválido' });

            const isEmpresa = req.user.role_id === 3;
            const ok = await Chat.isConversationParticipant(
                id,
                isEmpresa ? null : req.user.id,
                isEmpresa ? req.user.id_company : null
            );
            if (!ok) return res.status(403).json({ message: 'Acceso denegado' });

            await Chat.markConversationRead(id, req.user.id);
            const messages = await Chat.getMessages(id, req.user.id);
            if (messages === null) return res.status(404).json({ message: 'Conversación no encontrada' });
            res.json({ message: 'Mensajes', messages });
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Error al cargar mensajes', error: e.message });
        }
    }

    static async sendMessage(req, res) {
        try {
            const id = parseInt(req.params.id, 10);
            if (Number.isNaN(id)) return res.status(400).json({ message: 'ID inválido' });

            const { content } = safeBody(req);
            if (!content?.trim()) return res.status(400).json({ message: 'El mensaje no puede estar vacío' });

            const isEmpresa = req.user.role_id === 3;
            const ok = await Chat.isConversationParticipant(
                id,
                isEmpresa ? null : req.user.id,
                isEmpresa ? req.user.id_company : null
            );
            if (!ok) return res.status(403).json({ message: 'Acceso denegado' });

            const msg = await Chat.sendMessage(id, req.user.id, content.trim());
            res.status(201).json({ message: 'Mensaje enviado', msg });

            // FCM al otro participante — fire-and-forget
            const { rows: convRows } = await pool.query(
                `SELECT tourist_id FROM conversation WHERE id_conversation = $1`, [id]
            );
            const touristId = convRows[0]?.tourist_id;
            const senderName = req.user.name ?? 'Alguien';
            const snippet = content.trim().length > 60
                ? content.trim().substring(0, 60) + '…'
                : content.trim();

            if (isEmpresa && touristId) {
                // Empresa escribió → notificar al turista
                sendFcmToUser(pool, touristId, {
                    title: `Mensaje de ${senderName}`,
                    body: snippet,
                    data: { screen: 'messages', conversation_id: String(id) },
                });
            } else if (!isEmpresa) {
                // Turista escribió → notificar al usuario de la empresa
                const { rows: empRows } = await pool.query(
                    `SELECT u.user_id FROM conversation c
                     JOIN company co ON co.id_company = c.id_company
                     JOIN "user" u ON u.id_company = co.id_company AND u.role_id = 3
                     WHERE c.id_conversation = $1 LIMIT 1`,
                    [id]
                );
                if (empRows[0]?.user_id) {
                    sendFcmToUser(pool, empRows[0].user_id, {
                        title: `Mensaje de ${senderName}`,
                        body: snippet,
                        data: { screen: 'messages', conversation_id: String(id) },
                    });
                }
            }
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Error al enviar mensaje', error: e.message });
        }
    }

    static async markRead(req, res) {
        try {
            const id = parseInt(req.params.id, 10);
            if (Number.isNaN(id)) return res.status(400).json({ message: 'ID inválido' });
            await Chat.markConversationRead(id, req.user.id);
            res.json({ message: 'Marcado como leído' });
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Error', error: e.message });
        }
    }
}

export default ChatController;
