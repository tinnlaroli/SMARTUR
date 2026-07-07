import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../config/db.js', () => import('./mocks/db.js'));
vi.mock('../models/userModel.js', () => ({
    default: { findById: vi.fn() },
}));
vi.mock('../utils/sessionHelper.js', () => ({
    recordSession: vi.fn().mockResolvedValue(123),
}));
vi.mock('../utils/userPublic.js', () => ({
    toPublicUser: (u) => ({ id: u.user_id, email: u.email }),
}));

const { default: pool } = await import('../config/db.js');
const { default: User } = await import('../models/userModel.js');
const {
    createChallenge,
    approveChallenge,
    exchangeChallenge,
} = await import('../controllers/qrLoginController.js');

function mockRes() {
    return {
        statusCode: 200,
        status(code) { this.statusCode = code; return this; },
        json(payload) { this.payload = payload; return this; },
    };
}

describe('qrLoginController flow', () => {
    beforeEach(() => {
        pool.query.mockReset();
        User.findById.mockReset();
        process.env.JWT_SECRET = 'test-secret';
    });

    it('createChallenge returns a token and challengeId', async () => {
        pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
        const res = mockRes();

        await createChallenge({}, res);

        expect(res.statusCode).toBe(201);
        expect(res.payload.challengeId).toBe(1);
        expect(res.payload.token).toMatch(/^[0-9a-f]{48}$/);
    });

    it('approveChallenge fails with wrong token', async () => {
        pool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });
        const req = {
            params: { challengeId: '1' },
            body: { token: 'wrong-token' },
            user: { id: 5 },
            headers: {},
            socket: {},
        };
        const res = mockRes();

        await approveChallenge(req, res);

        expect(res.statusCode).toBe(410);
    });

    it('approveChallenge succeeds with correct token on a pending challenge', async () => {
        pool.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 1 }] });
        const req = {
            params: { challengeId: '1' },
            body: { token: 'correct-token' },
            user: { id: 5 },
            headers: {},
            socket: {},
        };
        const res = mockRes();

        await approveChallenge(req, res);

        expect(res.statusCode).toBe(200);
        expect(res.payload.ok).toBe(true);
    });

    it('exchangeChallenge fails when challenge is not approved', async () => {
        pool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });
        const req = { params: { challengeId: '1' }, body: { token: 't' } };
        const res = mockRes();

        await exchangeChallenge(req, res);

        expect(res.statusCode).toBe(410);
        expect(User.findById).not.toHaveBeenCalled();
    });

    it('exchangeChallenge issues a session/tokens exactly once for an approved challenge', async () => {
        pool.query
            .mockResolvedValueOnce({ rowCount: 1, rows: [{ user_id: 42 }] }) // consume
            .mockResolvedValueOnce({ rows: [] }); // storeRefreshToken insert
        User.findById.mockResolvedValueOnce({
            user_id: 42,
            email: 'x@x.com',
            role_id: 3,
            is_active: true,
            id_company: 9,
        });
        const req = { params: { challengeId: '1' }, body: { token: 'approved-token' } };
        const res = mockRes();

        await exchangeChallenge(req, res);

        expect(res.statusCode).toBe(200);
        expect(res.payload.token).toBeTruthy();
        expect(res.payload.refreshToken).toMatch(/^[0-9a-f]{80}$/);
        expect(res.payload.user).toEqual({ id: 42, email: 'x@x.com' });
    });

    it('exchangeChallenge is not reusable: second call with the same (now consumed) row fails', async () => {
        // First exchange already flipped status to 'consumed'; the UPDATE's
        // WHERE status = 'approved' clause means the second attempt matches
        // zero rows — exactly what the mock below simulates.
        pool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });
        const req = { params: { challengeId: '1' }, body: { token: 'approved-token' } };
        const res = mockRes();

        await exchangeChallenge(req, res);

        expect(res.statusCode).toBe(410);
    });

    it('exchangeChallenge rejects an inactive user', async () => {
        pool.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ user_id: 42 }] });
        User.findById.mockResolvedValueOnce({ user_id: 42, is_active: false });
        const req = { params: { challengeId: '1' }, body: { token: 't' } };
        const res = mockRes();

        await exchangeChallenge(req, res);

        expect(res.statusCode).toBe(401);
    });
});
