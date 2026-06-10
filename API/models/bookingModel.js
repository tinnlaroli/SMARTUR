import pool from '../config/db.js';

export async function createBooking(userId, { id_service, id_itinerary, visit_date, visit_time, guests, notes }) {
    const r = await pool.query(
        `INSERT INTO booking (user_id, id_service, id_itinerary, visit_date, visit_time, guests, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [userId, id_service, id_itinerary ?? null, visit_date, visit_time ?? null, guests ?? 1, notes ?? null]
    );
    return r.rows[0];
}

export async function getMyBookings(userId) {
    const r = await pool.query(
        `SELECT b.*,
                ts.name  AS service_name,
                c.name   AS company_name,
                c.id_company
         FROM booking b
         JOIN tourist_service ts ON ts.id_service = b.id_service
         JOIN company c          ON c.id_company  = ts.id_company
         WHERE b.user_id = $1 AND b.is_walkin = FALSE
         ORDER BY b.visit_date DESC, b.created_at DESC`,
        [userId]
    );
    return r.rows;
}

export async function getEmpresaBookings(companyId, { status } = {}) {
    const params = [companyId];
    let extraWhere = '';
    if (status) {
        params.push(status);
        extraWhere = ` AND b.status = $${params.length}`;
    }
    const r = await pool.query(
        `SELECT b.*,
                ts.name AS service_name,
                u.name  AS tourist_name
         FROM booking b
         JOIN tourist_service ts ON ts.id_service = b.id_service
         JOIN "user" u           ON u.user_id      = b.user_id
         WHERE ts.id_company = $1${extraWhere}
         ORDER BY b.visit_date ASC, COALESCE(b.visit_time::text, '23:59') ASC, b.created_at DESC`,
        params
    );
    return r.rows;
}

export async function confirmBooking(id, companyId) {
    const r = await pool.query(
        `UPDATE booking
         SET status = 'confirmed'
         WHERE id_booking = $1
           AND status = 'pending'
           AND id_service IN (
               SELECT id_service FROM tourist_service WHERE id_company = $2
           )
         RETURNING *`,
        [id, companyId]
    );
    return r.rows[0] ?? null;
}

export async function cancelBooking(id, { userId, companyId }) {
    let r;
    if (companyId) {
        r = await pool.query(
            `UPDATE booking
             SET status = 'cancelled'
             WHERE id_booking = $1
               AND status != 'cancelled'
               AND id_service IN (
                   SELECT id_service FROM tourist_service WHERE id_company = $2
               )
             RETURNING *`,
            [id, companyId]
        );
    } else {
        r = await pool.query(
            `UPDATE booking
             SET status = 'cancelled'
             WHERE id_booking = $1 AND user_id = $2 AND status != 'cancelled'
             RETURNING *`,
            [id, userId]
        );
    }
    return r.rows[0] ?? null;
}

export async function createWalkin(empresaUserId, { id_service, visit_date, visit_time, guests, notes }) {
    const r = await pool.query(
        `INSERT INTO booking (user_id, id_service, visit_date, visit_time, guests, notes, is_walkin, status)
         VALUES ($1, $2, $3, $4, $5, $6, TRUE, 'confirmed')
         RETURNING *`,
        [empresaUserId, id_service, visit_date, visit_time ?? null, guests ?? 1, notes ?? null]
    );
    return r.rows[0];
}
