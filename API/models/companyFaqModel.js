import pool from '../config/db.js';

export async function searchFAQs(idCompany, query) {
    const r = await pool.query(
        `SELECT question, answer,
                ts_rank(search_vector, plainto_tsquery('spanish', $2)) AS rank
         FROM company_faq
         WHERE id_company = $1
           AND search_vector @@ plainto_tsquery('spanish', $2)
         ORDER BY rank DESC
         LIMIT 5`,
        [idCompany, query],
    );
    return r.rows;
}

export async function getAllFAQs(idCompany) {
    const r = await pool.query(
        `SELECT id_faq, id_company, question, answer, created_at, updated_at
         FROM company_faq
         WHERE id_company = $1
         ORDER BY created_at DESC`,
        [idCompany],
    );
    return r.rows;
}

export async function createFAQ(idCompany, question, answer) {
    const r = await pool.query(
        `INSERT INTO company_faq (id_company, question, answer)
         VALUES ($1, $2, $3) RETURNING id_faq, question, answer, created_at`,
        [idCompany, question, answer],
    );
    return r.rows[0];
}

export async function updateFAQ(idFaq, idCompany, question, answer) {
    const r = await pool.query(
        `UPDATE company_faq
         SET question = $1, answer = $2, updated_at = NOW()
         WHERE id_faq = $3 AND id_company = $4
         RETURNING id_faq, question, answer, updated_at`,
        [question, answer, idFaq, idCompany],
    );
    return r.rows[0] || null;
}

export async function deleteFAQ(idFaq, idCompany) {
    const r = await pool.query(
        'DELETE FROM company_faq WHERE id_faq = $1 AND id_company = $2 RETURNING id_faq',
        [idFaq, idCompany],
    );
    return r.rowCount > 0;
}
