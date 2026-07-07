import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../config/db.js', () => import('./mocks/db.js'));
vi.mock('../validators/userValidators.js', () => ({
    findByEmail: vi.fn(),
    normalizeEmail: (e) => (typeof e === 'string' ? e.trim().toLowerCase() : e),
}));

const { default: pool } = await import('../config/db.js');
const { findByEmail } = await import('../validators/userValidators.js');
const { UserService } = await import('../services/userService.js');

describe('UserService.login', () => {
    beforeEach(() => {
        pool.query.mockReset();
        findByEmail.mockReset();
        process.env.JWT_SECRET = 'test-secret';
    });

    it('returns 400 when the user does not exist', async () => {
        findByEmail.mockResolvedValueOnce(undefined);

        const result = await UserService.login('nope@example.com', 'whatever');

        expect(result.status).toBe(400);
    });

    it('returns SOCIAL_ACCOUNT code when auth_provider is google', async () => {
        findByEmail.mockResolvedValueOnce({
            user_id: 1,
            email: 'a@a.com',
            role_id: 3,
            email_verified: true,
            auth_provider: 'google',
        });

        const result = await UserService.login('a@a.com', 'whatever');

        expect(result.status).toBe(409);
        expect(result.code).toBe('SOCIAL_ACCOUNT');
        expect(result.provider).toBe('google');
    });

    it('returns SOCIAL_ACCOUNT code when auth_provider is facebook', async () => {
        findByEmail.mockResolvedValueOnce({
            user_id: 1,
            email: 'a@a.com',
            role_id: 3,
            email_verified: true,
            auth_provider: 'facebook',
        });

        const result = await UserService.login('a@a.com', 'whatever');

        expect(result.code).toBe('SOCIAL_ACCOUNT');
        expect(result.provider).toBe('facebook');
    });

    it('does not treat local accounts as social', async () => {
        const bcrypt = (await import('bcrypt')).default;
        const hashed = await bcrypt.hash('CorrectPass1', 4);
        findByEmail.mockResolvedValueOnce({
            user_id: 1,
            email: 'a@a.com',
            role_id: 3,
            email_verified: true,
            auth_provider: 'local',
            password: hashed,
        });
        pool.query.mockResolvedValueOnce({ rows: [] }); // INSERT login_tokens

        const result = await UserService.login('a@a.com', 'CorrectPass1');

        expect(result.status).toBe(200);
        expect(result.data.requiresVerification).toBe(true);
        expect(result.data.verificationCode).toMatch(/^\d{6}$/);
    });

    it('stores a hashed (not raw) OTP in login_tokens on successful credential check', async () => {
        const bcrypt = (await import('bcrypt')).default;
        const hashed = await bcrypt.hash('CorrectPass1', 4);
        findByEmail.mockResolvedValueOnce({
            user_id: 1,
            email: 'a@a.com',
            role_id: 3,
            email_verified: true,
            auth_provider: 'local',
            password: hashed,
        });
        pool.query.mockResolvedValueOnce({ rows: [] }); // INSERT login_tokens

        const result = await UserService.login('a@a.com', 'CorrectPass1');

        expect(pool.query).toHaveBeenCalledTimes(1);
        const [sql, params] = pool.query.mock.calls[0];
        expect(sql).toMatch(/INSERT INTO login_tokens/);
        expect(params[0]).toBe(1);
        expect(params[1]).not.toBe(result.data.verificationCode); // must be hashed, not raw
        expect(params[3]).toBe(false);
    });

    it('returns 403 when unverified role_id 3 tries to log in', async () => {
        findByEmail.mockResolvedValueOnce({
            user_id: 1,
            email: 'a@a.com',
            role_id: 3,
            email_verified: false,
            auth_provider: 'local',
        });

        const result = await UserService.login('a@a.com', 'whatever');

        expect(result.status).toBe(403);
    });

    it('returns 400 for wrong password on a local account', async () => {
        const bcrypt = (await import('bcrypt')).default;
        const hashed = await bcrypt.hash('CorrectPass1', 4);
        findByEmail.mockResolvedValueOnce({
            user_id: 1,
            email: 'a@a.com',
            role_id: 3,
            email_verified: true,
            auth_provider: 'local',
            password: hashed,
        });

        const result = await UserService.login('a@a.com', 'WrongPass1');

        expect(result.status).toBe(400);
        expect(result.message).toMatch(/Credenciales incorrectas/);
    });
});
