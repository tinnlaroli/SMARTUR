import pool from '../config/db.js';

// ─── Follow ───────────────────────────────────────────────────────────────────

export async function followUser(followerId, followingId) {
    await pool.query(
        `INSERT INTO user_follow (follower_id, following_id)
         VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [followerId, followingId],
    );
}

export async function unfollowUser(followerId, followingId) {
    await pool.query(
        `DELETE FROM user_follow WHERE follower_id = $1 AND following_id = $2`,
        [followerId, followingId],
    );
}

export async function isFollowing(followerId, followingId) {
    const r = await pool.query(
        `SELECT 1 FROM user_follow WHERE follower_id = $1 AND following_id = $2`,
        [followerId, followingId],
    );
    return r.rowCount > 0;
}

// ─── Counts ───────────────────────────────────────────────────────────────────

export async function getFollowCounts(userId) {
    const r = await pool.query(
        `SELECT
           (SELECT COUNT(*) FROM user_follow WHERE following_id = $1)::int AS followers,
           (SELECT COUNT(*) FROM user_follow WHERE follower_id  = $1)::int AS following`,
        [userId],
    );
    return { followers: r.rows[0].followers, following: r.rows[0].following };
}

// ─── Lists ────────────────────────────────────────────────────────────────────

export async function getFollowers(userId, requesterId) {
    const r = await pool.query(
        `SELECT u.user_id AS id, u.name, u.photo_url, u.avatar_icon_key,
                EXISTS(
                  SELECT 1 FROM user_follow WHERE follower_id = $2 AND following_id = u.user_id
                ) AS is_following
         FROM user_follow f
         JOIN "user" u ON u.user_id = f.follower_id
         WHERE f.following_id = $1 AND u.is_active = TRUE
         ORDER BY f.created_at DESC LIMIT 50`,
        [userId, requesterId],
    );
    return r.rows;
}

export async function getFollowingList(userId, requesterId) {
    const r = await pool.query(
        `SELECT u.user_id AS id, u.name, u.photo_url, u.avatar_icon_key,
                EXISTS(
                  SELECT 1 FROM user_follow WHERE follower_id = $2 AND following_id = u.user_id
                ) AS is_following
         FROM user_follow f
         JOIN "user" u ON u.user_id = f.following_id
         WHERE f.follower_id = $1 AND u.is_active = TRUE
         ORDER BY f.created_at DESC LIMIT 50`,
        [userId, requesterId],
    );
    return r.rows;
}

// ─── Search ───────────────────────────────────────────────────────────────────

export async function searchUsers(query, requesterId, limit = 20) {
    const r = await pool.query(
        `SELECT u.user_id AS id, u.name, u.photo_url, u.avatar_icon_key,
                EXISTS(
                  SELECT 1 FROM user_follow WHERE follower_id = $2 AND following_id = u.user_id
                ) AS is_following
         FROM "user" u
         WHERE u.is_active = TRUE
           AND u.user_id != $2
           AND u.name ILIKE $1
         ORDER BY u.name
         LIMIT $3`,
        [`%${query}%`, requesterId, limit],
    );
    return r.rows;
}

// ─── Public profile ───────────────────────────────────────────────────────────

export async function getPublicProfile(userId, requesterId) {
    const r = await pool.query(
        `SELECT u.user_id AS id, u.name, u.photo_url, u.avatar_icon_key, u.created_at,
                (SELECT COUNT(*)::int FROM user_follow WHERE following_id = u.user_id) AS followers_count,
                (SELECT COUNT(*)::int FROM user_follow WHERE follower_id  = u.user_id) AS following_count,
                EXISTS(
                  SELECT 1 FROM user_follow WHERE follower_id = $2 AND following_id = u.user_id
                ) AS is_following
         FROM "user" u
         WHERE u.user_id = $1 AND u.is_active = TRUE`,
        [userId, requesterId],
    );
    return r.rows[0] ?? null;
}

// ─── Public itineraries of a user ────────────────────────────────────────────

export async function getUserPublicItineraries(userId) {
    const r = await pool.query(
        `SELECT i.id_itinerary, i.title, i.description, i.cover_image_url,
                i.copy_count, i.is_certified, i.created_at,
                COALESCE(json_agg(
                  json_build_object(
                    'id_stop', s.id_stop, 'place_kind', s.place_kind,
                    'place_id', s.place_id, 'stop_order', s.stop_order
                  ) ORDER BY s.stop_order
                ) FILTER (WHERE s.id_stop IS NOT NULL), '[]'::json) AS stops
         FROM itinerary i
         LEFT JOIN itinerary_stop s ON s.id_itinerary = i.id_itinerary
         WHERE i.user_id = $1 AND i.is_public = TRUE
         GROUP BY i.id_itinerary
         ORDER BY i.copy_count DESC
         LIMIT 30`,
        [userId],
    );
    return r.rows;
}

// ─── Admin: certify / uncertify ───────────────────────────────────────────────

export async function setItineraryCertified(itineraryId, isCertified) {
    const r = await pool.query(
        `UPDATE itinerary SET is_certified = $2, is_public = TRUE, updated_at = NOW()
         WHERE id_itinerary = $1 RETURNING id_itinerary, title, is_certified`,
        [itineraryId, Boolean(isCertified)],
    );
    return r.rows[0] ?? null;
}

export async function listAllPublicItineraries({ limit = 50, offset = 0, certified = null } = {}) {
    const conditions = ['i.is_public = TRUE'];
    const values = [];
    let idx = 1;
    if (certified !== null) {
        conditions.push(`i.is_certified = $${idx++}`);
        values.push(Boolean(certified));
    }
    values.push(limit, offset);
    const r = await pool.query(
        `SELECT i.id_itinerary, i.title, i.is_certified, i.copy_count,
                i.created_at, u.name AS owner_name
         FROM itinerary i
         JOIN "user" u ON u.user_id = i.user_id
         WHERE ${conditions.join(' AND ')}
         ORDER BY i.is_certified DESC, i.copy_count DESC
         LIMIT $${idx++} OFFSET $${idx++}`,
        values,
    );
    const count = await pool.query(
        `SELECT COUNT(*)::int AS total FROM itinerary i WHERE ${conditions.join(' AND ')}`,
        values.slice(0, values.length - 2),
    );
    return { itineraries: r.rows, total: count.rows[0].total };
}
