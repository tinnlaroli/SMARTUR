import pool from '../config/db.js';

// ─── Itinerary CRUD ──────────────────────────────────────────────────────────

export async function createItinerary(userId, { title, description, isPublic, startDate, endDate }) {
    const r = await pool.query(
        `INSERT INTO itinerary (user_id, title, description, is_public, start_date, end_date)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [userId, title, description || null, Boolean(isPublic), startDate || null, endDate || null],
    );
    return r.rows[0];
}

export async function getMyItineraries(userId) {
    const r = await pool.query(
        `SELECT i.*,
                COALESCE(json_agg(
                  json_build_object(
                    'id_stop', s.id_stop,
                    'place_kind', s.place_kind,
                    'place_id', s.place_id,
                    'stop_order', s.stop_order,
                    'visit_date', s.visit_date,
                    'visit_time_start', s.visit_time_start,
                    'notes', s.notes
                  ) ORDER BY s.stop_order
                ) FILTER (WHERE s.id_stop IS NOT NULL), '[]'::json) AS stops
         FROM itinerary i
         LEFT JOIN itinerary_stop s ON s.id_itinerary = i.id_itinerary
         WHERE i.user_id = $1
         GROUP BY i.id_itinerary
         ORDER BY i.updated_at DESC`,
        [userId],
    );
    return r.rows;
}

export async function getPredefined() {
    const r = await pool.query(
        `SELECT i.*,
                u.name AS owner_name,
                u.photo_url AS owner_avatar_url,
                COALESCE(json_agg(
                  json_build_object(
                    'id_stop', s.id_stop,
                    'place_kind', s.place_kind,
                    'place_id', s.place_id,
                    'stop_order', s.stop_order
                  ) ORDER BY s.stop_order
                ) FILTER (WHERE s.id_stop IS NOT NULL), '[]'::json) AS stops
         FROM itinerary i
         JOIN "user" u ON u.user_id = i.user_id
         LEFT JOIN itinerary_stop s ON s.id_itinerary = i.id_itinerary
         WHERE i.is_certified = TRUE AND i.is_public = TRUE
         GROUP BY i.id_itinerary, u.name, u.photo_url
         ORDER BY i.copy_count DESC
         LIMIT 20`,
    );
    return r.rows;
}

export async function getCommunity() {
    const r = await pool.query(
        `SELECT i.*,
                u.name AS owner_name,
                u.photo_url AS owner_avatar_url,
                COALESCE(json_agg(
                  json_build_object(
                    'id_stop', s.id_stop,
                    'place_kind', s.place_kind,
                    'place_id', s.place_id,
                    'stop_order', s.stop_order
                  ) ORDER BY s.stop_order
                ) FILTER (WHERE s.id_stop IS NOT NULL), '[]'::json) AS stops
         FROM itinerary i
         JOIN "user" u ON u.user_id = i.user_id
         LEFT JOIN itinerary_stop s ON s.id_itinerary = i.id_itinerary
         WHERE i.is_public = TRUE AND i.is_certified = FALSE
         GROUP BY i.id_itinerary, u.name, u.photo_url
         ORDER BY i.copy_count DESC
         LIMIT 30`,
    );
    return r.rows;
}

export async function searchItineraries(query) {
    const r = await pool.query(
        `SELECT i.*, u.name AS owner_name, u.photo_url AS owner_avatar_url
         FROM itinerary i
         JOIN "user" u ON u.user_id = i.user_id
         WHERE i.is_public = TRUE
           AND (i.title ILIKE $1 OR i.description ILIKE $1)
         ORDER BY i.copy_count DESC
         LIMIT 30`,
        [`%${query}%`],
    );
    return r.rows;
}

export async function getItineraryById(id) {
    const r = await pool.query(
        `SELECT i.*, u.name AS owner_name, u.photo_url AS owner_avatar_url
         FROM itinerary i
         JOIN "user" u ON u.user_id = i.user_id
         WHERE i.id_itinerary = $1`,
        [id],
    );
    if (!r.rows[0]) return null;
    const stops = await getStopsEnriched(id);
    return { ...r.rows[0], stops };
}

export async function updateItinerary(id, userId, updates) {
    const fields = [];
    const values = [];
    let idx = 1;
    if (updates.title !== undefined) { fields.push(`title = $${idx++}`); values.push(updates.title); }
    if (updates.description !== undefined) { fields.push(`description = $${idx++}`); values.push(updates.description || null); }
    if (updates.isPublic !== undefined) { fields.push(`is_public = $${idx++}`); values.push(Boolean(updates.isPublic)); }
    if (updates.coverImageUrl !== undefined) { fields.push(`cover_image_url = $${idx++}`); values.push(updates.coverImageUrl || null); }
    if (updates.startDate !== undefined) { fields.push(`start_date = $${idx++}`); values.push(updates.startDate || null); }
    if (updates.endDate !== undefined) { fields.push(`end_date = $${idx++}`); values.push(updates.endDate || null); }
    if (fields.length === 0) return null;
    fields.push(`updated_at = NOW()`);
    values.push(id, userId);
    const r = await pool.query(
        `UPDATE itinerary SET ${fields.join(', ')}
         WHERE id_itinerary = $${idx++} AND user_id = $${idx++}
         RETURNING *`,
        values,
    );
    return r.rows[0] || null;
}

export async function deleteItinerary(id, userId) {
    const r = await pool.query(
        `DELETE FROM itinerary WHERE id_itinerary = $1 AND user_id = $2 RETURNING id_itinerary`,
        [id, userId],
    );
    return r.rowCount > 0;
}

// ─── Stops ───────────────────────────────────────────────────────────────────

export async function addStop(itineraryId, userId, stop) {
    const own = await pool.query(
        `SELECT id_itinerary FROM itinerary WHERE id_itinerary = $1 AND user_id = $2`,
        [itineraryId, userId],
    );
    if (!own.rows[0]) return null;

    const ord = await pool.query(
        `SELECT COALESCE(MAX(stop_order), 0) + 1 AS next_order FROM itinerary_stop WHERE id_itinerary = $1`,
        [itineraryId],
    );
    const nextOrder = ord.rows[0].next_order;

    const r = await pool.query(
        `INSERT INTO itinerary_stop (id_itinerary, place_kind, place_id, stop_order, visit_date, visit_time_start, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [itineraryId, stop.place_kind, stop.place_id, nextOrder,
         stop.visit_date || null, stop.visit_time_start || null, stop.notes || null],
    );
    await pool.query(`UPDATE itinerary SET updated_at = NOW() WHERE id_itinerary = $1`, [itineraryId]);
    return r.rows[0];
}

export async function deleteStop(itineraryId, stopId, userId) {
    const own = await pool.query(
        `SELECT id_itinerary FROM itinerary WHERE id_itinerary = $1 AND user_id = $2`,
        [itineraryId, userId],
    );
    if (!own.rows[0]) return false;

    const r = await pool.query(
        `DELETE FROM itinerary_stop WHERE id_stop = $1 AND id_itinerary = $2 RETURNING id_stop`,
        [stopId, itineraryId],
    );
    if (r.rowCount > 0) {
        const remaining = await pool.query(
            `SELECT id_stop FROM itinerary_stop WHERE id_itinerary = $1 ORDER BY stop_order`,
            [itineraryId],
        );
        for (let i = 0; i < remaining.rows.length; i++) {
            await pool.query(
                `UPDATE itinerary_stop SET stop_order = $1 WHERE id_stop = $2`,
                [i + 1, remaining.rows[i].id_stop],
            );
        }
        await pool.query(`UPDATE itinerary SET updated_at = NOW() WHERE id_itinerary = $1`, [itineraryId]);
    }
    return r.rowCount > 0;
}

export async function updateStop(itineraryId, stopId, userId, { visit_date, visit_time_start, notes }) {
    const own = await pool.query(
        `SELECT id_itinerary FROM itinerary WHERE id_itinerary = $1 AND user_id = $2`,
        [itineraryId, userId],
    );
    if (!own.rows[0]) return null;

    const fields = [];
    const values = [];
    let idx = 1;
    if (visit_date !== undefined) { fields.push(`visit_date = $${idx++}`); values.push(visit_date || null); }
    if (visit_time_start !== undefined) { fields.push(`visit_time_start = $${idx++}`); values.push(visit_time_start || null); }
    if (notes !== undefined) { fields.push(`notes = $${idx++}`); values.push(notes || null); }
    if (fields.length === 0) return null;

    values.push(stopId, itineraryId);
    const r = await pool.query(
        `UPDATE itinerary_stop SET ${fields.join(', ')}
         WHERE id_stop = $${idx++} AND id_itinerary = $${idx++}
         RETURNING *`,
        values,
    );
    if (r.rows[0]) {
        await pool.query(`UPDATE itinerary SET updated_at = NOW() WHERE id_itinerary = $1`, [itineraryId]);
    }
    return r.rows[0] || null;
}

export async function reorderStops(itineraryId, userId, orderedIds) {
    const own = await pool.query(
        `SELECT id_itinerary FROM itinerary WHERE id_itinerary = $1 AND user_id = $2`,
        [itineraryId, userId],
    );
    if (!own.rows[0]) return false;
    for (let i = 0; i < orderedIds.length; i++) {
        await pool.query(
            `UPDATE itinerary_stop SET stop_order = $1 WHERE id_stop = $2 AND id_itinerary = $3`,
            [i + 1, orderedIds[i], itineraryId],
        );
    }
    await pool.query(`UPDATE itinerary SET updated_at = NOW() WHERE id_itinerary = $1`, [itineraryId]);
    return true;
}

// ─── Stop enrichment ─────────────────────────────────────────────────────────

async function getStopsEnriched(itineraryId) {
    const r = await pool.query(
        `SELECT * FROM itinerary_stop WHERE id_itinerary = $1 ORDER BY stop_order`,
        [itineraryId],
    );
    const stops = r.rows.map(s => ({
        ...s,
        place_name: null,
        place_image_url: null,
        place_lat: null,
        place_lon: null,
        contact_phone: null,
        id_company: null,
    }));

    for (const stop of stops) {
        if (stop.place_kind === 'poi') {
            try {
                const p = await pool.query(
                    `SELECT name, image_url, latitude, longitude FROM point_of_interest WHERE id = $1`,
                    [stop.place_id],
                );
                if (p.rows[0]) {
                    stop.place_name = p.rows[0].name;
                    stop.place_image_url = p.rows[0].image_url;
                    stop.place_lat = p.rows[0].latitude ? Number(p.rows[0].latitude) : null;
                    stop.place_lon = p.rows[0].longitude ? Number(p.rows[0].longitude) : null;
                }
            } catch (_) { /* column may not be present in older schema */ }
        } else if (stop.place_kind === 'svc') {
            const s = await pool.query(
                `SELECT ts.name, ts.image_url, ts.contact_phone, ts.id_company, l.latitude, l.longitude
                 FROM tourist_service ts
                 LEFT JOIN location l ON l.id_location = ts.id_location
                 WHERE ts.id_service = $1`,
                [stop.place_id],
            );
            if (s.rows[0]) {
                stop.place_name = s.rows[0].name;
                stop.place_image_url = s.rows[0].image_url;
                stop.place_lat = s.rows[0].latitude ? Number(s.rows[0].latitude) : null;
                stop.place_lon = s.rows[0].longitude ? Number(s.rows[0].longitude) : null;
                stop.contact_phone = s.rows[0].contact_phone ?? null;
                stop.id_company = s.rows[0].id_company ?? null;
            }
        }
    }
    return stops;
}

// ─── Social ──────────────────────────────────────────────────────────────────

export async function copyItinerary(originalId, userId) {
    const orig = await pool.query(
        `SELECT * FROM itinerary WHERE id_itinerary = $1 AND (is_public = TRUE OR user_id = $2)`,
        [originalId, userId],
    );
    if (!orig.rows[0]) return null;
    const o = orig.rows[0];

    const newIt = await pool.query(
        `INSERT INTO itinerary (user_id, title, description, cover_image_url, is_public, original_itinerary_id)
         VALUES ($1, $2, $3, $4, FALSE, $5) RETURNING *`,
        [userId, `${o.title} (copia)`, o.description, o.cover_image_url, originalId],
    );
    const newId = newIt.rows[0].id_itinerary;

    const stops = await pool.query(
        `SELECT place_kind, place_id, stop_order, notes FROM itinerary_stop WHERE id_itinerary = $1 ORDER BY stop_order`,
        [originalId],
    );
    for (const s of stops.rows) {
        await pool.query(
            `INSERT INTO itinerary_stop (id_itinerary, place_kind, place_id, stop_order, notes)
             VALUES ($1, $2, $3, $4, $5)`,
            [newId, s.place_kind, s.place_id, s.stop_order, s.notes],
        );
    }
    await pool.query(
        `UPDATE itinerary SET copy_count = copy_count + 1 WHERE id_itinerary = $1`,
        [originalId],
    );
    return newIt.rows[0];
}

export async function getFollowingItineraries(userId) {
    const r = await pool.query(
        `SELECT i.*, u.name AS owner_name, u.photo_url AS owner_avatar_url,
                COALESCE(json_agg(
                  json_build_object(
                    'id_stop', s.id_stop,
                    'place_kind', s.place_kind,
                    'place_id', s.place_id,
                    'stop_order', s.stop_order
                  ) ORDER BY s.stop_order
                ) FILTER (WHERE s.id_stop IS NOT NULL), '[]'::json) AS stops
         FROM itinerary i
         JOIN "user" u ON u.user_id = i.user_id
         LEFT JOIN itinerary_stop s ON s.id_itinerary = i.id_itinerary
         WHERE i.is_public = TRUE
           AND i.user_id IN (SELECT following_id FROM user_follow WHERE follower_id = $1)
         GROUP BY i.id_itinerary, u.name, u.photo_url
         ORDER BY i.updated_at DESC
         LIMIT 20`,
        [userId],
    );
    return r.rows;
}

export async function likeItinerary(itineraryId, userId) {
    await pool.query(
        `INSERT INTO itinerary_like (user_id, id_itinerary) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [userId, itineraryId],
    );
}

export async function unlikeItinerary(itineraryId, userId) {
    await pool.query(
        `DELETE FROM itinerary_like WHERE user_id = $1 AND id_itinerary = $2`,
        [userId, itineraryId],
    );
}

// ─── Suggest nearby ──────────────────────────────────────────────────────────

export async function suggestNearby(lastStopId, radiusKm = 15) {
    const stop = await pool.query(
        `SELECT place_kind, place_id FROM itinerary_stop WHERE id_stop = $1`,
        [lastStopId],
    );
    if (!stop.rows[0]) return [];
    const s = stop.rows[0];
    let lat = null, lon = null;

    if (s.place_kind === 'poi') {
        const p = await pool.query(
            `SELECT latitude, longitude FROM point_of_interest WHERE id = $1`,
            [s.place_id],
        );
        if (p.rows[0]) { lat = p.rows[0].latitude; lon = p.rows[0].longitude; }
    } else {
        const sv = await pool.query(
            `SELECT l.latitude, l.longitude
             FROM tourist_service ts JOIN location l ON l.id_location = ts.id_location
             WHERE ts.id_service = $1`,
            [s.place_id],
        );
        if (sv.rows[0]) { lat = sv.rows[0].latitude; lon = sv.rows[0].longitude; }
    }
    if (lat == null || lon == null) return [];

    const pois = await pool.query(
        `SELECT 'poi'::text AS kind, id AS place_id, name, image_url, rating, distance_km FROM (
           SELECT id, name, image_url, rating,
                  (6371 * acos(GREATEST(-1, LEAST(1,
                    cos(radians($1)) * cos(radians(latitude)) * cos(radians(longitude) - radians($2))
                    + sin(radians($1)) * sin(radians(latitude))
                  )))) AS distance_km
           FROM point_of_interest
           WHERE is_active = TRUE AND latitude IS NOT NULL AND longitude IS NOT NULL
             AND latitude != 0 AND longitude != 0
         ) sub WHERE distance_km < $3
         ORDER BY distance_km LIMIT 5`,
        [lat, lon, radiusKm],
    );

    const svcs = await pool.query(
        `SELECT 'svc'::text AS kind, ts.id_service AS place_id, ts.name, ts.image_url,
                ts.total_score AS rating, distance_km FROM (
           SELECT ts.id_service, ts.name, ts.image_url, ts.total_score,
                  (6371 * acos(GREATEST(-1, LEAST(1,
                    cos(radians($1)) * cos(radians(l.latitude)) * cos(radians(l.longitude) - radians($2))
                    + sin(radians($1)) * sin(radians(l.latitude))
                  )))) AS distance_km
           FROM tourist_service ts
           JOIN location l ON l.id_location = ts.id_location
           WHERE ts.status = 'active' AND l.latitude IS NOT NULL AND l.longitude IS NOT NULL
             AND l.latitude != 0 AND l.longitude != 0
         ) sub WHERE distance_km < $3
         ORDER BY distance_km LIMIT 5`,
        [lat, lon, radiusKm],
    );

    return [...pois.rows, ...svcs.rows]
        .sort((a, b) => a.distance_km - b.distance_km)
        .slice(0, 8);
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export async function adminListPublic({ limit = 50, offset = 0, certified }) {
    const conditions = ['i.is_public = TRUE'];
    const values = [];
    if (certified === true)  conditions.push('i.is_certified = TRUE');
    if (certified === false) conditions.push('i.is_certified = FALSE');

    const where = conditions.join(' AND ');
    const countResult = await pool.query(
        `SELECT COUNT(*)::int AS total FROM itinerary i WHERE ${where}`,
        values,
    );

    const rows = await pool.query(
        `SELECT i.id_itinerary, i.title, i.is_certified, i.copy_count, i.created_at,
                u.name AS owner_name
         FROM itinerary i
         JOIN "user" u ON u.user_id = i.user_id
         WHERE ${where}
         ORDER BY i.created_at DESC
         LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
        [...values, limit, offset],
    );

    return { itineraries: rows.rows, total: countResult.rows[0].total };
}

export async function adminCreateItinerary(userId, { title, description }) {
    const r = await pool.query(
        `INSERT INTO itinerary (user_id, title, description, is_public, is_certified)
         VALUES ($1, $2, $3, TRUE, TRUE) RETURNING *`,
        [userId, title.trim(), description?.trim() || null],
    );
    return r.rows[0];
}

export async function certifyItinerary(id) {
    await pool.query(
        `UPDATE itinerary SET is_certified = TRUE, is_public = TRUE WHERE id_itinerary = $1`,
        [id],
    );
}

export async function uncertifyItinerary(id) {
    await pool.query(
        `UPDATE itinerary SET is_certified = FALSE WHERE id_itinerary = $1`,
        [id],
    );
}
