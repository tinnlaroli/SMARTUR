import pool from '../config/db.js';

export async function getActivitiesByService(idService) {
    const r = await pool.query(
        `SELECT * FROM service_activity
         WHERE id_service = $1 AND is_active = TRUE
         ORDER BY id_activity`,
        [idService],
    );
    return r.rows;
}

export async function getActivityById(id) {
    const r = await pool.query(
        'SELECT * FROM service_activity WHERE id_activity = $1',
        [id],
    );
    return r.rows[0] || null;
}

export async function createActivity({ id_service, name, description, duration_minutes, price, max_capacity, features }) {
    const r = await pool.query(
        `INSERT INTO service_activity
         (id_service, name, description, duration_minutes, price, max_capacity, features)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
            id_service, name, description || null,
            duration_minutes || null, price || null, max_capacity || null,
            JSON.stringify(features || []),
        ],
    );
    return r.rows[0];
}

export async function updateActivity(id, updates) {
    const fields = [];
    const values = [];
    let idx = 1;
    if (updates.name !== undefined) { fields.push(`name = $${idx++}`); values.push(updates.name); }
    if (updates.description !== undefined) { fields.push(`description = $${idx++}`); values.push(updates.description || null); }
    if (updates.duration_minutes !== undefined) { fields.push(`duration_minutes = $${idx++}`); values.push(updates.duration_minutes || null); }
    if (updates.price !== undefined) { fields.push(`price = $${idx++}`); values.push(updates.price || null); }
    if (updates.max_capacity !== undefined) { fields.push(`max_capacity = $${idx++}`); values.push(updates.max_capacity || null); }
    if (updates.features !== undefined) { fields.push(`features = $${idx++}`); values.push(JSON.stringify(updates.features)); }
    if (updates.is_active !== undefined) { fields.push(`is_active = $${idx++}`); values.push(Boolean(updates.is_active)); }
    if (fields.length === 0) return null;
    values.push(id);
    const r = await pool.query(
        `UPDATE service_activity SET ${fields.join(', ')} WHERE id_activity = $${idx} RETURNING *`,
        values,
    );
    return r.rows[0] || null;
}

export async function softDeleteActivity(id) {
    await pool.query('UPDATE service_activity SET is_active = FALSE WHERE id_activity = $1', [id]);
}
