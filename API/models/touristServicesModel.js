import pool from '../config/db.js';

class TouristServices {
    // publicOnly=true filters by status='active'; set to false for admin views
    static async findAll(
        page = 1,
        limit = 50,
        search = '',
        company = null,
        type = null,
        active = null,
        id_location = null,
        publicOnly = true
    ) {
        const offset = (page - 1) * limit;

        const values = [];
        const conditions = [];
        let index = 1;

        if (publicOnly) {
            conditions.push(`ts.status = 'active'`);
        }

        if (search) {
            conditions.push(`ts.name ILIKE $${index}`);
            values.push(`%${search}%`);
            index++;
        }

        if (company) {
            conditions.push(`ts.id_company = $${index}`);
            values.push(company);
            index++;
        }

        if (type) {
            conditions.push(`ts.service_type = $${index}`);
            values.push(type);
            index++;
        }

        if (active !== null) {
            conditions.push(`ts.active = $${index}`);
            values.push(active);
            index++;
        }

        if (id_location !== null) {
            conditions.push(`ts.id_location = $${index}`);
            values.push(id_location);
            index++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // 1️⃣ Contar total con filtros
        const countQuery = await pool.query(
            `SELECT COUNT(*) FROM tourist_service ts ${whereClause}`,
            values
        );

        const totalRecords = parseInt(countQuery.rows[0].count);
        const totalPages = Math.ceil(totalRecords / limit);

        // 2️⃣ Obtener datos paginados con evaluación si existe
        const dataQuery = await pool.query(
            `
        SELECT ts.*, 
            (SELECT id_evaluation FROM service_evaluation WHERE id_service = ts.id_service ORDER BY created_at DESC LIMIT 1) as id_evaluation,
            (SELECT total_score FROM service_evaluation WHERE id_service = ts.id_service ORDER BY created_at DESC LIMIT 1) as total_score
        FROM tourist_service ts
        ${whereClause}
        ORDER BY ts.id_service
        LIMIT $${index}
        OFFSET $${index + 1}
        `,
            [...values, limit, offset]
        );

        return {
            totalRecords,
            totalPages,
            currentPage: page,
            services: dataQuery.rows,
        };
    }

    // publicOnly=true ensures only approved services are visible
    static async findById(id_service, publicOnly = true) {
        const statusClause = publicOnly ? `AND ts.status = 'active'` : '';
        const result = await pool.query(
            `SELECT ts.*,
                (SELECT id_evaluation FROM service_evaluation WHERE id_service = ts.id_service ORDER BY created_at DESC LIMIT 1) as id_evaluation,
                (SELECT total_score FROM service_evaluation WHERE id_service = ts.id_service ORDER BY created_at DESC LIMIT 1) as total_score
             FROM tourist_service ts
             WHERE ts.id_service = $1 ${statusClause}`,
            [id_service]
        );
        return result.rows[0] || null;
    }

    static async create(data) {
        const {
            name, description, id_company, id_location, service_type, active, image_url,
            price_from, price_to, currency, operating_hours, capacity, duration_minutes, contact_phone,
            is_wellness, categoria_wellness, wellness_dimensions, wellness_evidence,
            demanda_fisica, descripcion_bienestar
        } = data;

        const result = await pool.query(
            `INSERT INTO tourist_service
               (name, description, id_company, id_location, service_type, active, image_url,
                price_from, price_to, currency, operating_hours, capacity, duration_minutes, contact_phone,
                status, is_wellness, wellness_status, categoria_wellness, wellness_dimensions,
                wellness_evidence, demanda_fisica, descripcion_bienestar)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'pending_review', $15, $16, $17, $18, $19, $20, $21)
             RETURNING *`,
            [
                name, description, id_company, id_location, service_type, active ?? true, image_url || null,
                price_from || null, price_to || null, currency || 'MXN',
                operating_hours ? JSON.stringify(operating_hours) : null,
                capacity || null, duration_minutes || null, contact_phone || null,
                is_wellness ?? false, is_wellness ? 'pending' : null,
                is_wellness ? categoria_wellness : null,
                is_wellness ? (wellness_dimensions || []) : [],
                is_wellness ? wellness_evidence : null,
                is_wellness ? (demanda_fisica ?? 0.5) : null,
                is_wellness ? (descripcion_bienestar || null) : null
            ]
        );

        return result.rows[0];
    }

    static async update(id_service, data) {
        const {
            name, description, id_company, id_location, service_type, active, image_url,
            price_from, price_to, currency, operating_hours, capacity, duration_minutes, contact_phone,
            is_wellness, categoria_wellness, wellness_dimensions, wellness_evidence,
            demanda_fisica, descripcion_bienestar
        } = data;

        const fields = [];
        const values = [];
        let index = 1;

        if (name !== undefined) {
            fields.push(`name = $${index++}`);
            values.push(name);
        }

        if (description !== undefined) {
            fields.push(`description = $${index++}`);
            values.push(description);
        }

        if (id_company !== undefined) {
            fields.push(`id_company = $${index++}`);
            values.push(id_company);
        }

        if (id_location !== undefined) {
            fields.push(`id_location = $${index++}`);
            values.push(id_location);
        }

        if (service_type !== undefined) {
            fields.push(`service_type = $${index++}`);
            values.push(service_type);
        }

        if (active !== undefined) {
            fields.push(`active = $${index++}`);
            values.push(active);
        }

        if (image_url !== undefined) {
            fields.push(`image_url = $${index++}`);
            values.push(image_url);
        }

        if (price_from !== undefined) { fields.push(`price_from = $${index++}`); values.push(price_from); }
        if (price_to !== undefined)   { fields.push(`price_to = $${index++}`);   values.push(price_to); }
        if (currency !== undefined)   { fields.push(`currency = $${index++}`);   values.push(currency); }
        if (operating_hours !== undefined) {
            fields.push(`operating_hours = $${index++}`);
            values.push(JSON.stringify(operating_hours));
        }
        if (capacity !== undefined)         { fields.push(`capacity = $${index++}`);         values.push(capacity); }
        if (duration_minutes !== undefined)  { fields.push(`duration_minutes = $${index++}`); values.push(duration_minutes); }
        if (contact_phone !== undefined)     { fields.push(`contact_phone = $${index++}`);    values.push(contact_phone); }
        if (is_wellness !== undefined) {
            fields.push(`is_wellness = $${index++}`); values.push(is_wellness);
            fields.push(`wellness_status = $${index++}`); values.push(is_wellness ? 'pending' : null);
            if (!is_wellness) {
                fields.push(`wellness_dimensions = $${index++}`); values.push([]);
                fields.push(`wellness_evidence = $${index++}`); values.push(null);
                fields.push(`categoria_wellness = $${index++}`); values.push(null);
                fields.push(`demanda_fisica = $${index++}`); values.push(null);
                fields.push(`descripcion_bienestar = $${index++}`); values.push(null);
            }
        }
        if (categoria_wellness !== undefined) { fields.push(`categoria_wellness = $${index++}`); values.push(categoria_wellness); }
        if (wellness_dimensions !== undefined) { fields.push(`wellness_dimensions = $${index++}`); values.push(wellness_dimensions); }
        if (wellness_evidence !== undefined) { fields.push(`wellness_evidence = $${index++}`); values.push(wellness_evidence); }
        if (demanda_fisica !== undefined) { fields.push(`demanda_fisica = $${index++}`); values.push(demanda_fisica); }
        if (descripcion_bienestar !== undefined) { fields.push(`descripcion_bienestar = $${index++}`); values.push(descripcion_bienestar); }

        if (fields.length === 0) {
            return null;
        }

        const result = await pool.query(
            `UPDATE tourist_service
         SET ${fields.join(', ')}
         WHERE id_service = $${index}
         RETURNING *`,
            [...values, id_service]
        );

        return result.rows[0] || null;
    }

    static async delete(id_service) {
        const result = await pool.query(
            `UPDATE tourist_service 
         SET active = FALSE
         WHERE id_service = $1 AND active = TRUE
         RETURNING *`,
            [id_service]
        );
        return result.rows[0] || null;
    }
}

export default TouristServices;
