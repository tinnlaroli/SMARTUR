import pool from '../config/db.js';

export async function botMessage(req, res) {
    const conversationId = parseInt(req.params.id, 10);
    if (Number.isNaN(conversationId)) return res.status(400).json({ error: 'ID inválido' });

    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'content es requerido' });

    const convR = await pool.query(
        'SELECT id_company, tourist_id FROM conversation WHERE id_conversation = $1',
        [conversationId],
    );
    if (!convR.rows[0]) return res.status(404).json({ error: 'Conversación no encontrada' });
    const { id_company, tourist_id } = convR.rows[0];

    const callerId = req.user.id;
    if (callerId !== tourist_id && req.user.id_company !== id_company) {
        return res.status(403).json({ error: 'Sin acceso a esta conversación' });
    }

    const faqR = await pool.query(
        `SELECT answer
         FROM company_faq
         WHERE id_company = $1
           AND search_vector @@ plainto_tsquery('spanish', $2)
         ORDER BY ts_rank(search_vector, plainto_tsquery('spanish', $2)) DESC
         LIMIT 1`,
        [id_company, content.trim()],
    );

    // No match → stay silent so the provider can respond manually
    if (!faqR.rows.length) {
        return res.status(200).json({ bot_message: null, matched: false });
    }

    const msgR = await pool.query(
        `INSERT INTO message (id_conversation, sender_id, content, is_bot)
         VALUES ($1, NULL, $2, TRUE) RETURNING *`,
        [conversationId, faqR.rows[0].answer],
    );

    return res.status(201).json({ bot_message: msgR.rows[0], matched: true });
}
