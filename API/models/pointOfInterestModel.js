import pool from '../config/db.js';

class PointOfInterest {
    static async findAll(
        page = 1,
        limit = 50,
        search = '',
        id_location = null,
        _id_type = null,        // kept for API compat — column removed from new schema
        _sustainability = null  // kept for API compat — column removed from new schema
    ) {
        const offset = (page - 1) * limit;

        const values = [];
        const conditions = [];
        let index = 1;

        conditions.push(`is_active = TRUE`);

        if (search) {
            conditions.push(`(name ILIKE $${index} OR description ILIKE $${index})`);
            values.push(`%${search}%`);
            index++;
        }

        if (id_location !== null) {
            conditions.push(`id_location = $${index}`);
            values.push(id_location);
            index++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // Contar total con filtros
        const countQuery = await pool.query(
            `SELECT COUNT(*) FROM point_of_interest ${whereClause}`,
            values
        );

        const totalRecords = parseInt(countQuery.rows[0].count);
        const totalPages = Math.ceil(totalRecords / limit);

        // Obtener datos paginados
        const dataQuery = await pool.query(
            `SELECT *, id AS id_point FROM point_of_interest
             ${whereClause}
             ORDER BY id
             LIMIT $${index}
             OFFSET $${index + 1}`,
            [...values, limit, offset]
        );

        return {
            totalRecords,
            totalPages,
            currentPage: page,
            points: dataQuery.rows,
        };
    }

    static async findById(id) {
        const result = await pool.query(
            'SELECT *, id AS id_point FROM point_of_interest WHERE id = $1 AND is_active = TRUE',
            [id]
        );
        return result.rows[0] || null;
    }

    static async create(data) {
        const {
            name,
            categories_raw = '',
            categories_mapped = [],
            price_level = 2,
            is_accessible = false,
            outdoor = false,
            latitude = null,
            longitude = null,
            id_location = null,
            description = null,
            image_url = null,
            rating = 4.0,
        } = data;

        const result = await pool.query(
            `INSERT INTO point_of_interest
            (name, categories_raw, categories_mapped, price_level, is_accessible, outdoor,
             latitude, longitude, id_location, description, image_url, rating)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *, id AS id_point`,
            [
                name,
                categories_raw,
                JSON.stringify(categories_mapped),
                price_level,
                is_accessible,
                outdoor,
                latitude,
                longitude,
                id_location,
                description,
                image_url,
                rating,
            ]
        );
        return result.rows[0];
    }

    static async update(id, data) {
        const {
            name,
            categories_raw,
            categories_mapped,
            price_level,
            is_accessible,
            outdoor,
            latitude,
            longitude,
            id_location,
            description,
            image_url,
            rating,
        } = data;

        const fields = [];
        const values = [];
        let index = 1;

        if (name !== undefined) { fields.push(`name = $${index++}`); values.push(name); }
        if (categories_raw !== undefined) { fields.push(`categories_raw = $${index++}`); values.push(categories_raw); }
        if (categories_mapped !== undefined) { fields.push(`categories_mapped = $${index++}`); values.push(JSON.stringify(categories_mapped)); }
        if (price_level !== undefined) { fields.push(`price_level = $${index++}`); values.push(price_level); }
        if (is_accessible !== undefined) { fields.push(`is_accessible = $${index++}`); values.push(is_accessible); }
        if (outdoor !== undefined) { fields.push(`outdoor = $${index++}`); values.push(outdoor); }
        if (latitude !== undefined) { fields.push(`latitude = $${index++}`); values.push(latitude); }
        if (longitude !== undefined) { fields.push(`longitude = $${index++}`); values.push(longitude); }
        if (id_location !== undefined) { fields.push(`id_location = $${index++}`); values.push(id_location); }
        if (description !== undefined) { fields.push(`description = $${index++}`); values.push(description); }
        if (image_url !== undefined) { fields.push(`image_url = $${index++}`); values.push(image_url); }
        if (rating !== undefined) { fields.push(`rating = $${index++}`); values.push(rating); }

        if (fields.length === 0) return null;

        const result = await pool.query(
            `UPDATE point_of_interest
            SET ${fields.join(', ')}
            WHERE id = $${index} AND is_active = TRUE
            RETURNING *, id AS id_point`,
            [...values, id]
        );
        return result.rows[0] || null;
    }

    static async delete(id) {
        const result = await pool.query(
            'UPDATE point_of_interest SET is_active = FALSE WHERE id = $1 AND is_active = TRUE RETURNING *, id AS id_point',
            [id]
        );
        return result.rows[0] || null;
    }
}

export default PointOfInterest;
