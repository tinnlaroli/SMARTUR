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

    it('allows turismologos to use wellness moderation routes', async () => {
        pool.query
            .mockResolvedValueOnce({ rows: [{ services: 1, pois: 2 }] })
            .mockResolvedValueOnce({ rows: [] });

        const pendingRes = await request('/ml/wellness/pending-count', { roleId: 4 });
        const pendingPayload = await pendingRes.json();
        expect(pendingRes.status).toBe(200);
        expect(pendingPayload).toEqual({ total_pending: 3, services: 1, pois: 2 });

        const reviewRes = await request('/ml/wellness/review/poi/1', {
            method: 'PATCH',
            roleId: 4,
            body: { action: 'approved', categoria_wellness: 'Bosque' },
        });
        const reviewPayload = await reviewRes.json();

        expect(reviewRes.status).toBe(200);
        expect(reviewPayload).toMatchObject({ ok: true, action: 'approved', type: 'poi', id: '1' });
        expect(pool.query).toHaveBeenCalledTimes(2);
    });
});
