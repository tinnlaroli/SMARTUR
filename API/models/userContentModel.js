import pool from '../config/db.js';

export async function placeExists(kind, placeId) {
    if (kind === 'svc') {
        const r = await pool.query(
            `SELECT id_service, name, image_url, description, id_location FROM tourist_service WHERE id_service = $1 AND active = true`,
            [placeId],
        );
        return r.rows[0] || null;
    }
    if (kind === 'poi') {
        try {
            const r = await pool.query(
                `SELECT id AS id_point, name, image_url, description, id_location, rating
                 FROM point_of_interest WHERE id = $1 AND is_active = TRUE`,
                [placeId],
            );
            return r.rows[0] || null;
        } catch (_) {
            // Display columns (image_url, description, id_location, rating) not yet migrated —
            // fall back to minimal columns and provide safe defaults.
            const r = await pool.query(
                `SELECT id AS id_point, name FROM point_of_interest WHERE id = $1 AND is_active = TRUE`,
                [placeId],
            );
            if (!r.rows[0]) return null;
            return { ...r.rows[0], image_url: null, description: null, id_location: null, rating: 4.0 };
        }
    }
    return null;
}

export async function listFavorites(userId) {
    const r = await pool.query(
        `SELECT id, place_kind, place_id, created_at FROM user_favorite WHERE user_id = $1 AND is_active = TRUE ORDER BY created_at DESC`,
        [userId],
    );
    return r.rows;
}

export async function addFavorite(userId, placeKind, placeId) {
    await pool.query(
        `INSERT INTO user_favorite (user_id, place_kind, place_id, is_active, deleted_at) VALUES ($1, $2, $3, TRUE, NULL)
         ON CONFLICT (user_id, place_kind, place_id) DO UPDATE SET is_active = TRUE, deleted_at = NULL, created_at = CURRENT_TIMESTAMP`,
        [userId, placeKind, placeId],
    );
    const r = await pool.query(
        `SELECT * FROM user_favorite WHERE user_id = $1 AND place_kind = $2 AND place_id = $3 AND is_active = TRUE`,
        [userId, placeKind, placeId],
    );
    return r.rows[0];
}

export async function removeFavorite(userId, placeKind, placeId) {
        const r = await pool.query(
        `UPDATE user_favorite
         SET is_active = FALSE, deleted_at = CURRENT_TIMESTAMP
         WHERE user_id = $1 AND place_kind = $2 AND place_id = $3 AND is_active = TRUE
         RETURNING *`,
        [userId, placeKind, placeId],
    );
    return r.rowCount > 0;
}

export async function addVisit(userId, placeKind, placeId) {
    const r = await pool.query(
        `INSERT INTO user_visit (user_id, place_kind, place_id) VALUES ($1, $2, $3) RETURNING *`,
        [userId, placeKind, placeId],
    );
    return r.rows[0];
}

export async function listVisits(userId, limit = 50) {
    const r = await pool.query(
        `SELECT id, place_kind, place_id, visited_at FROM user_visit WHERE user_id = $1 ORDER BY visited_at DESC LIMIT $2`,
        [userId, limit],
    );
    return r.rows;
}

export async function enrichPlaceRows(rows) {
    const out = [];
    for (const row of rows) {
        const place = await placeExists(row.place_kind, row.place_id);
        if (!place) continue;
        const base = {
            place_kind: row.place_kind,
            place_id: row.place_id,
            name: place.name,
            image_url: place.image_url || null,
            description: place.description || null,
            id_location: place.id_location ?? null,
        };
        if (place.rating != null) base.rating = Number(place.rating);
        if (row.created_at !== undefined) base.favorited_at = row.created_at;
        if (row.visited_at !== undefined) base.visited_at = row.visited_at;
        out.push(base);
    }
    return out;
}

export async function listCommunityPosts(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const countR = await pool.query(`SELECT COUNT(*)::int AS c FROM community_post`);
    const total = countR.rows[0].c;
    const dataR = await pool.query(
        `SELECT p.id_post, p.user_id, p.caption, p.image_url, p.place_kind, p.place_id, p.created_at,
                u.name AS author_name, u.photo_url AS author_photo_url, u.avatar_icon_key AS author_avatar_icon_key,
                u.created_at AS author_created_at, tp.interests AS author_interests
         FROM community_post p
         JOIN "user" u ON u.user_id = p.user_id
         LEFT JOIN traveler_profile tp ON tp.user_id = u.user_id AND tp.is_active = TRUE
         WHERE u.is_active = true AND p.is_active = true
         ORDER BY p.created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset],
    );
    const posts = [];
    for (const row of dataR.rows) {
        const place = await placeExists(row.place_kind, row.place_id);
        posts.push({
            ...row,
            place_name: place?.name ?? 'Lugar',
        });
    }
    return { total, posts, page, limit };
}

export async function createCommunityPost(userId, caption, imageUrl, placeKind, placeId) {
    const r = await pool.query(
        `INSERT INTO community_post (user_id, caption, image_url, place_kind, place_id)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [userId, caption || '', imageUrl || null, placeKind, placeId],
    );
    return r.rows[0];
}

export async function deleteCommunityPost(userId, postId) {
    const r = await pool.query(
        `UPDATE community_post SET is_active = FALSE WHERE id_post = $1 AND user_id = $2 RETURNING *`,
        [postId, userId]
    );
    return r.rowCount > 0;
}

export async function adminDeleteCommunityPost(postId) {
    const r = await pool.query(
        `UPDATE community_post SET is_active = FALSE WHERE id_post = $1 RETURNING *`,
        [postId]
    );
    return r.rowCount > 0;
}

export async function createPostReport(userId, postId, reason) {
    const r = await pool.query(
        `INSERT INTO post_reports (post_id, user_id, reason)
         VALUES ($1, $2, $3)
         ON CONFLICT (post_id, user_id) DO UPDATE SET reason = EXCLUDED.reason, created_at = NOW()
         RETURNING *`,
        [postId, userId, reason],
    );
    return r.rows[0];
}

export async function listPostReports({ resolved = false, limit = 50, offset = 0 } = {}) {
    const countR = await pool.query(
        `SELECT COUNT(*)::int AS c FROM post_reports WHERE resolved = $1`,
        [resolved],
    );
    const total = countR.rows[0].c;
    const dataR = await pool.query(
        `SELECT pr.id, pr.post_id, pr.reason, pr.created_at, pr.resolved,
                u.user_id AS reporter_id, u.name AS reporter_name, u.photo_url AS reporter_photo_url,
                p.caption AS post_caption, p.image_url AS post_image_url,
                p.place_kind, p.place_id,
                po.name AS author_name
         FROM post_reports pr
         JOIN "user" u ON u.user_id = pr.user_id
         JOIN community_post p ON p.id_post = pr.post_id
         JOIN "user" po ON po.user_id = p.user_id
         WHERE pr.resolved = $1
         ORDER BY pr.created_at DESC
         LIMIT $2 OFFSET $3`,
        [resolved, limit, offset],
    );
    return { total, reports: dataR.rows };
}

export async function resolvePostReport(reportId) {
    const r = await pool.query(
        `UPDATE post_reports SET resolved = TRUE WHERE id = $1 RETURNING *`,
        [reportId],
    );
    return r.rowCount > 0;
}
