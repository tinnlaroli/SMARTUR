import express from 'express';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../config/db.js', () => import('./mocks/db.js'));
vi.mock('../middleware/authMiddleware.js', () => ({
    verifyToken: (req, res, next) => {
        const id = Number(req.headers['x-test-user-id'] ?? 10);
        const roleId = Number(req.headers['x-test-role-id'] ?? 2);
        req.user = { id, role_id: roleId, email: `role${roleId}@test.local` };
        next();
    },
}));

const { default: pool } = await import('../config/db.js');
const { default: mlRoutes } = await import('../routes/mlRoutes.js');

const app = express();
app.use(express.json());
app.use(mlRoutes);

const server = app.listen(0);
const baseUrl = `http://127.0.0.1:${server.address().port}`;
const realFetch = globalThis.fetch;

function authHeaders({ userId = 10, roleId = 2 } = {}) {
    return {
        'content-type': 'application/json',
        'x-test-user-id': String(userId),
        'x-test-role-id': String(roleId),
    };
}

async function request(path, { method = 'GET', roleId = 2, userId = 10, body } = {}) {
    return realFetch(`${baseUrl}${path}`, {
        method,
        headers: authHeaders({ roleId, userId }),
        body: body === undefined ? undefined : JSON.stringify(body),
    });
}

describe('mlRoutes security rules', () => {
    beforeEach(() => {
        pool.query.mockReset();
        pool.connect.mockReset();
        vi.stubGlobal('fetch', vi.fn());
    });

    afterAll(() => {
        server.close();
        vi.unstubAllGlobals();
    });

    it('blocks tourists from triggering model training', async () => {
        const res = await request('/ml/train', { method: 'POST', roleId: 2 });

        expect(res.status).toBe(403);
        expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it('allows only admin to trigger model training', async () => {
        globalThis.fetch.mockResolvedValueOnce({
            json: async () => ({ message: 'training queued' }),
        });

        const res = await request('/ml/train', { method: 'POST', roleId: 1 });
        const payload = await res.json();

        expect(res.status).toBe(200);
        expect(payload.ok).toBe(true);
        expect(globalThis.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/train'),
            expect.objectContaining({ method: 'POST' }),
        );
    });

    it('blocks turismologos from starting cross-validation but lets them read results', async () => {
        const startRes = await request('/ml/cross-validation', { method: 'POST', roleId: 4 });
        expect(startRes.status).toBe(403);
        expect(globalThis.fetch).not.toHaveBeenCalled();

        globalThis.fetch.mockResolvedValueOnce({
            status: 200,
            json: async () => ({ folds: 5, rmse: 0.9 }),
        });
        const readRes = await request('/ml/cross-validation', { method: 'GET', roleId: 4 });
        const payload = await readRes.json();

        expect(readRes.status).toBe(200);
        expect(payload).toEqual({ folds: 5, rmse: 0.9 });
        expect(globalThis.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/cross-validation'),
            expect.objectContaining({ signal: expect.any(AbortSignal) }),
        );
    });

    it('rejects feedback for another user recommendation session', async () => {
        pool.query.mockResolvedValueOnce({ rows: [{ user_id: 99 }] });

        const res = await request('/ml/feedback', {
            method: 'POST',
            roleId: 2,
            userId: 10,
            body: { session_id: 1, item_id: 50, rank_pos: 1, clicked: true },
        });
        const payload = await res.json();

        expect(res.status).toBe(403);
        expect(payload.message).toMatch(/feedback/);
        expect(pool.query).toHaveBeenCalledTimes(1);
    });

    it('lets admin register feedback for another user session', async () => {
        pool.query
            .mockResolvedValueOnce({ rows: [{ user_id: 99 }] })
            .mockResolvedValueOnce({ rows: [] });

        const res = await request('/ml/feedback', {
            method: 'POST',
            roleId: 1,
            userId: 10,
            body: { session_id: 1, item_id: 50, rank_pos: 1, clicked: true },
        });
        const payload = await res.json();

        expect(res.status).toBe(200);
        expect(payload).toEqual({ ok: true });
        expect(pool.query).toHaveBeenCalledTimes(2);
    });

    it('blocks tourists from wellness moderation routes', async () => {
        const pendingRes = await request('/ml/wellness/pending-count', { roleId: 2 });
        expect(pendingRes.status).toBe(403);

        const reviewRes = await request('/ml/wellness/review/poi/1', {
            method: 'PATCH',
            roleId: 2,
            body: { action: 'approved' },
        });
        expect(reviewRes.status).toBe(403);
        expect(pool.query).not.toHaveBeenCalled();
    });

    it('retires public legacy wellness stress classification and synthetic metrics', async () => {
        const assessRes = await request('/ml/wellness/assess', {
            method: 'POST',
            body: { q1: 2, q2: 3, q3: 1, q4: 4, consent_given: true },
        });
        const metricsRes = await request('/ml/wellness/metrics', { roleId: 1 });

        expect(assessRes.status).toBe(410);
        expect(metricsRes.status).toBe(410);
        expect(globalThis.fetch).not.toHaveBeenCalled();
        expect(pool.query).not.toHaveBeenCalled();
    });

    it('sends only the approved catalog to MODELO and stores the preference session', async () => {
        const catalog = [{
            id_destino: 'poi:18',
            nombre_lugar: 'Sendero del bosque',
            estado: 'Veracruz',
            categoria_wellness: 'Naturaleza',
            wellness_dimensions: ['environmental'],
            demanda_fisica: 0.5,
            descripcion_bienestar: 'Recorrido guiado por el entorno natural.',
            image_url: 'https://cdn.example.test/forest.jpg',
        }];
        pool.query.mockResolvedValueOnce({ rows: catalog });

        const client = {
            query: vi.fn(async (sql) => {
                if (sql.includes('INSERT INTO wellness_preference_assessment')) {
                    return { rows: [{ preference_assessment_id: 31 }] };
                }
                if (sql.includes('INSERT INTO wellness_recommendation_session')) {
                    return { rows: [{ session_id: 41 }] };
                }
                return { rows: [] };
            }),
            release: vi.fn(),
        };
        pool.connect.mockResolvedValueOnce(client);
        globalThis.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                modo_viaje: 'preferencias_wellness',
                modo_viaje_label: 'Lugares según tus preferencias',
                modo_viaje_description: 'Coincidencias con las dimensiones elegidas.',
                destinations: [{ ...catalog[0], match_pct: 100, rank: 1 }],
            }),
        });

        const res = await request('/ml/wellness/recommend', {
            method: 'POST',
            userId: 12,
            body: {
                preferences: {
                    wellness_dimensions: ['environmental'],
                    activity_level: 'moderate',
                    region_filter: 'Veracruz',
                },
                top_n: 3,
                consent_given: true,
            },
        });
        const payload = await res.json();
        const modelRequest = JSON.parse(globalThis.fetch.mock.calls[0][1].body);

        expect(res.status).toBe(200);
        expect(payload).toMatchObject({
            preference_assessment_id: 31,
            session_id: 41,
            destinations: [{ id_destino: 'poi:18', match_pct: 100, rank: 1 }],
        });
        expect(payload.destinations[0]).not.toHaveProperty('beneficio_optimo_pct');
        expect(pool.query.mock.calls[0][0]).toContain("p.wellness_status = 'approved'");
        expect(pool.query.mock.calls[0][0]).toContain("s.wellness_status = 'approved'");
        expect(pool.query.mock.calls[0][0]).toContain('p.is_active = TRUE');
        expect(pool.query.mock.calls[0][0]).toContain('s.active = TRUE');
        expect(modelRequest.preferences).toEqual({
            wellness_dimensions: ['environmental'],
            activity_level: 'moderate',
            region_filter: 'Veracruz',
        });
        expect(modelRequest.destinations).toEqual(catalog);
        expect(client.query).toHaveBeenCalledWith(
            expect.stringContaining('INSERT INTO wellness_recommendation_session'),
            expect.arrayContaining([12, 31, 'preferencias_wellness', JSON.stringify(['poi:18']), 3]),
        );
        expect(client.release).toHaveBeenCalledOnce();
    });

    it('returns recommendations without persisting history when consent is declined', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });
        globalThis.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                modo_viaje: 'preferencias_wellness',
                destinations: [],
            }),
        });

        const res = await request('/ml/wellness/recommend', {
            method: 'POST',
            userId: 12,
            body: {
                preferences: {
                    wellness_dimensions: ['environmental'],
                    activity_level: 'moderate',
                },
                top_n: 3,
                consent_given: false,
            },
        });
        const payload = await res.json();

        expect(res.status).toBe(200);
        expect(payload.destinations).toEqual([]);
        expect(payload).not.toHaveProperty('session_id');
        expect(pool.connect).not.toHaveBeenCalled();
        expect(pool.query).toHaveBeenCalledOnce();
    });

    it('requires an explicit history choice before processing preferences', async () => {
        const res = await request('/ml/wellness/recommend', {
            method: 'POST',
            userId: 12,
            body: {
                preferences: {
                    wellness_dimensions: ['environmental'],
                    activity_level: 'moderate',
                },
                top_n: 3,
            },
        });

        expect(res.status).toBe(400);
        expect(globalThis.fetch).not.toHaveBeenCalled();
        expect(pool.query).not.toHaveBeenCalled();
    });

    it('reports wellness preference counts without exposing old stress labels', async () => {
        pool.query
            .mockResolvedValueOnce({ rows: [{ pending: 0, approved: 2, rejected: 0 }] })
            .mockResolvedValueOnce({ rows: [{ dimension: 'physical', count: 3 }] })
            .mockResolvedValueOnce({ rows: [{ avg_rating: 4, responses: 2 }] });

        const res = await request('/ml/wellness/stats', { roleId: 1 });
        const payload = await res.json();

        expect(res.status).toBe(200);
        expect(payload.modo_distribution).toEqual([]);
        expect(payload.preference_dimension_distribution).toEqual([
            { dimension: 'physical', count: 3 },
        ]);
        expect(pool.query.mock.calls[1][0]).toContain('wellness_preference_assessment');
        expect(pool.query.mock.calls[1][0]).not.toContain('stress_assessment');
    });

    it('allows turismologos to use wellness moderation routes', async () => {
        pool.query
            .mockResolvedValueOnce({ rows: [{ services: 1, pois: 2 }] })
            .mockResolvedValueOnce({ rows: [] });

        const pendingRes = await request('/ml/wellness/pending-count', { roleId: 4 });
        const pendingPayload = await pendingRes.json();
        expect(pendingRes.status).toBe(200);
        expect(pendingPayload).toEqual({ total_pending: 3, services: 1, pois: 2 });

        const invalidReviewRes = await request('/ml/wellness/review/poi/1', {
            method: 'PATCH',
            roleId: 4,
            body: {
                action: 'approved',
                categoria_wellness: 'Naturaleza',
                wellness_dimensions: ['environmental'],
                wellness_evidence: `SMARTUR_WELLNESS_EVIDENCE_V1:${JSON.stringify({ source: 'programa del prestador, consulta 05/10/2026', dimensions: { environmental: 'corto' } })}`,
                demanda_fisica: 0.4,
            },
        });
        expect(invalidReviewRes.status).toBe(400);

        const reviewRes = await request('/ml/wellness/review/poi/1', {
            method: 'PATCH',
            roleId: 4,
            body: {
                action: 'approved',
                categoria_wellness: 'Naturaleza',
                wellness_dimensions: ['environmental'],
                wellness_evidence: `SMARTUR_WELLNESS_EVIDENCE_V1:${JSON.stringify({ source: 'programa del prestador, consulta 05/10/2026', dimensions: { environmental: 'El recorrido guiado permite observar el entorno natural.' } })}`,
                demanda_fisica: 0.4,
            },
        });
        const reviewPayload = await reviewRes.json();

        expect(reviewRes.status).toBe(200);
        expect(reviewPayload).toMatchObject({ ok: true, action: 'approved', type: 'poi', id: '1' });
        expect(pool.query).toHaveBeenCalledTimes(2);
        const [reviewSql, reviewValues] = pool.query.mock.calls[1];
        expect(reviewSql).toContain('wellness_status = $1');
        expect(reviewSql).toContain('wellness_reviewed_by = $2');
        expect(reviewSql).toContain('wellness_dimensions = $4');
        expect(reviewValues).toEqual([
            'approved',
            10,
            true,
            ['environmental'],
            expect.stringContaining('SMARTUR_WELLNESS_EVIDENCE_V1:'),
            0.4,
            'Naturaleza',
            1,
        ]);
    });
});
