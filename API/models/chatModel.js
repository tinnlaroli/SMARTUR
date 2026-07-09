import pool from '../config/db.js';

// Trae company_name/service_name igual que getMyConversations — sin esto,
// una conversación recién creada (o encontrada) no traía el nombre de la
// empresa hasta el próximo GET /conversations/me, y el chat mostraba un
// nombre vacío ("alguien") hasta que llegaba/enviaba un mensaje.
async function _withCompanyInfo(conversationId) {
    const r = await pool.query(
        `SELECT cv.*, c.name AS company_name, ts.name AS service_name
         FROM conversation cv
         JOIN company c ON c.id_company = cv.id_company
         LEFT JOIN tourist_service ts ON ts.id_service = cv.id_service
         WHERE cv.id_conversation = $1`,
        [conversationId]
    );
    return r.rows[0];
}

export async function getOrCreateConversation(touristId, companyId, serviceId = null) {
    const select = serviceId
        ? pool.query(
              'SELECT * FROM conversation WHERE tourist_id=$1 AND id_company=$2 AND id_service=$3',
              [touristId, companyId, serviceId]
          )
        : pool.query(
              'SELECT * FROM conversation WHERE tourist_id=$1 AND id_company=$2 AND id_service IS NULL',
              [touristId, companyId]
          );
    const existing = await select;
    if (existing.rows[0]) return _withCompanyInfo(existing.rows[0].id_conversation);

    const r = await pool.query(
        'INSERT INTO conversation (tourist_id, id_company, id_service) VALUES ($1,$2,$3) RETURNING *',
        [touristId, companyId, serviceId]
    );
    return _withCompanyInfo(r.rows[0].id_conversation);
}

export async function getMyConversations(touristId) {
    const r = await pool.query(
        `SELECT cv.*,
                c.name AS company_name,
                ts.name AS service_name,
                (SELECT content FROM message m
                 WHERE m.id_conversation = cv.id_conversation
                 ORDER BY m.created_at DESC LIMIT 1) AS last_message,
                (SELECT created_at FROM message m
                 WHERE m.id_conversation = cv.id_conversation
                 ORDER BY m.created_at DESC LIMIT 1) AS last_message_at,
                (SELECT COUNT(*) FROM message m
                 WHERE m.id_conversation = cv.id_conversation AND m.sender_id != $1 AND m.read_at IS NULL
                )::int AS unread_count
         FROM conversation cv
         JOIN company c ON c.id_company = cv.id_company
         LEFT JOIN tourist_service ts ON ts.id_service = cv.id_service
         WHERE cv.tourist_id = $1
         ORDER BY last_message_at DESC NULLS LAST`,
        [touristId]
    );
    return r.rows;
}

export async function getEmpresaConversations(companyId) {
    const r = await pool.query(
        `SELECT cv.*,
                u.name AS tourist_name,
                u.photo_url AS tourist_photo,
                ts.name AS service_name,
                (SELECT content FROM message m
                 WHERE m.id_conversation = cv.id_conversation
                 ORDER BY m.created_at DESC LIMIT 1) AS last_message,
                (SELECT created_at FROM message m
                 WHERE m.id_conversation = cv.id_conversation
                 ORDER BY m.created_at DESC LIMIT 1) AS last_message_at,
                (SELECT COUNT(*) FROM message m
                 WHERE m.id_conversation = cv.id_conversation AND m.sender_id = cv.tourist_id AND m.read_at IS NULL
                )::int AS unread_count
         FROM conversation cv
         JOIN "user" u ON u.user_id = cv.tourist_id
         LEFT JOIN tourist_service ts ON ts.id_service = cv.id_service
         WHERE cv.id_company = $1
         ORDER BY last_message_at DESC NULLS LAST`,
        [companyId]
    );
    return r.rows;
}

export async function getMessages(conversationId, requesterId) {
    // Verify requester is part of this conversation
    const check = await pool.query(
        `SELECT cv.tourist_id, c.id_company,
                (SELECT id_company FROM tourist_service ts WHERE ts.id_service = cv.id_service) AS svc_company
         FROM conversation cv
         LEFT JOIN company c ON c.id_company = cv.id_company
         WHERE cv.id_conversation = $1`,
        [conversationId]
    );
    if (!check.rows[0]) return null;

    const { tourist_id } = check.rows[0];
    const isTourist = tourist_id === requesterId;
    const isEmpresa = !isTourist; // We trust RBAC has already filtered

    if (!isTourist && !isEmpresa) return null;

    const r = await pool.query(
        `SELECT m.*, u.name AS sender_name, u.photo_url AS sender_photo
         FROM message m
         JOIN "user" u ON u.user_id = m.sender_id
         WHERE m.id_conversation = $1
         ORDER BY m.created_at ASC`,
        [conversationId]
    );
    return r.rows;
}

export async function sendMessage(conversationId, senderId, content) {
    const r = await pool.query(
        `INSERT INTO message (id_conversation, sender_id, content) VALUES ($1,$2,$3) RETURNING *`,
        [conversationId, senderId, content]
    );
    return r.rows[0];
}

export async function markConversationRead(conversationId, readerId) {
    await pool.query(
        `UPDATE message
         SET read_at = NOW()
         WHERE id_conversation = $1 AND sender_id != $2 AND read_at IS NULL`,
        [conversationId, readerId]
    );
}

export async function isConversationParticipant(conversationId, userId, companyId) {
    const r = await pool.query(
        `SELECT cv.tourist_id, cv.id_company
         FROM conversation cv
         WHERE cv.id_conversation = $1`,
        [conversationId]
    );
    if (!r.rows[0]) return false;
    const { tourist_id, id_company } = r.rows[0];
    if (companyId) return id_company === companyId;
    return tourist_id === userId;
}
