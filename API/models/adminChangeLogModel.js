import pool from '../config/db.js';

class AdminChangeLog {
    static async create({ target_type, target_id, admin_id, id_company, changes }) {
        const result = await pool.query(
            `INSERT INTO admin_change_log (target_type, target_id, admin_id, id_company, changes)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [target_type, target_id, admin_id, id_company, JSON.stringify(changes)]
        );
        return result.rows[0];
    }

    static async findByCompany(id_company, page = 1, limit = 20) {
        const offset = (page - 1) * limit;
        const countResult = await pool.query(
            `SELECT COUNT(*) FROM admin_change_log WHERE id_company = $1`,
            [id_company]
        );
        const total = parseInt(countResult.rows[0].count);

        const dataResult = await pool.query(
            `SELECT acl.*, u.name AS admin_name
             FROM admin_change_log acl
             LEFT JOIN "user" u ON u.user_id = acl.admin_id
             WHERE acl.id_company = $1
             ORDER BY acl.created_at DESC
             LIMIT $2 OFFSET $3`,
            [id_company, limit, offset]
        );
        return {
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            logs: dataResult.rows,
        };
    }

    static async findAll(page = 1, limit = 20, status = null) {
        const offset = (page - 1) * limit;
        const conditions = [];
        const values = [];
        let idx = 1;
        if (status) {
            conditions.push(`acl.status = $${idx++}`);
            values.push(status);
        }
        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

        const countResult = await pool.query(
            `SELECT COUNT(*) FROM admin_change_log acl ${where}`,
            values
        );
        const total = parseInt(countResult.rows[0].count);

        const dataResult = await pool.query(
            `SELECT acl.*,
                    u.name AS admin_name,
                    c.name AS company_name
             FROM admin_change_log acl
             LEFT JOIN "user" u ON u.user_id = acl.admin_id
             LEFT JOIN company c ON c.id_company = acl.id_company
             ${where}
             ORDER BY acl.created_at DESC
             LIMIT $${idx} OFFSET $${idx + 1}`,
            [...values, limit, offset]
        );
        return {
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            logs: dataResult.rows,
        };
    }

    static async findById(id) {
        const result = await pool.query(
            `SELECT acl.*,
                    u.name AS admin_name,
                    c.name AS company_name
             FROM admin_change_log acl
             LEFT JOIN "user" u ON u.user_id = acl.admin_id
             LEFT JOIN company c ON c.id_company = acl.id_company
             WHERE acl.id = $1`,
            [id]
        );
        return result.rows[0] || null;
    }

    static async updateStatus(id, status, extra = {}) {
        const { empresa_note, empresa_counter, admin_resolution_note } = extra;
        const fields = [`status = $1`, `updated_at = NOW()`];
        const values = [status];
        let idx = 2;
        if (empresa_note !== undefined) {
            fields.push(`empresa_note = $${idx++}`);
            values.push(empresa_note);
        }
        if (empresa_counter !== undefined) {
            fields.push(`empresa_counter = $${idx++}`);
            values.push(empresa_counter ? JSON.stringify(empresa_counter) : null);
        }
        if (admin_resolution_note !== undefined) {
            fields.push(`admin_resolution_note = $${idx++}`);
            values.push(admin_resolution_note);
        }
        values.push(id);
        const result = await pool.query(
            `UPDATE admin_change_log SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
            values
        );
        return result.rows[0] || null;
    }
}

export default AdminChangeLog;
