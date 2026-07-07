import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../config/db.js', () => import('./mocks/db.js'));

const { default: pool } = await import('../config/db.js');
const {
    validateAndRotateRefreshToken,
    storeRefreshToken,
    generateRefreshToken,
    revokeAllUserRefreshTokens,
} = await import('../utils/refreshTokenHelper.js');

describe('refreshTokenHelper', () => {
    beforeEach(() => {
        pool.query.mockReset();
    });

    it('generateRefreshToken returns an 80-char hex string', () => {
        const token = generateRefreshToken();
        expect(token).toMatch(/^[0-9a-f]{80}$/);
    });

    it('validateAndRotateRefreshToken returns null for empty token without querying DB', async () => {
        const result = await validateAndRotateRefreshToken('');
        expect(result).toBeNull();
        expect(pool.query).not.toHaveBeenCalled();
    });

    it('validateAndRotateRefreshToken returns userId/sessionId for a valid, non-revoked token', async () => {
        pool.query.mockResolvedValueOnce({
            rows: [{ user_id: 42, session_id: 7 }],
        });

        const result = await validateAndRotateRefreshToken('some-raw-token');

        expect(result).toEqual({ userId: 42, sessionId: 7 });
        expect(pool.query).toHaveBeenCalledTimes(1);
        const [sql] = pool.query.mock.calls[0];
        expect(sql).toMatch(/SET revoked = TRUE/);
        expect(sql).toMatch(/us\.revoked = FALSE/);
    });

    it('validateAndRotateRefreshToken returns null when the linked session is revoked', async () => {
        // The SQL join excludes rows whose session is revoked, so the mocked
        // DB layer returning zero rows is exactly what happens in that case.
        pool.query.mockResolvedValueOnce({ rows: [] });

        const result = await validateAndRotateRefreshToken('token-with-revoked-session');

        expect(result).toBeNull();
    });

    it('validateAndRotateRefreshToken returns null for expired or already-revoked token', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const result = await validateAndRotateRefreshToken('expired-token');

        expect(result).toBeNull();
    });

    it('storeRefreshToken inserts a hashed token with the session id and expiry', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        await storeRefreshToken(1, 'raw-token', 5, 30);

        expect(pool.query).toHaveBeenCalledTimes(1);
        const [sql, params] = pool.query.mock.calls[0];
        expect(sql).toMatch(/INSERT INTO refresh_tokens/);
        expect(params[0]).toBe(1);
        expect(params[1]).not.toBe('raw-token'); // must be hashed, not raw
        expect(params[2]).toBe(5);
        expect(params[3]).toBeInstanceOf(Date);
    });

    it('revokeAllUserRefreshTokens revokes all tokens for the user', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        await revokeAllUserRefreshTokens(9);

        const [sql, params] = pool.query.mock.calls[0];
        expect(sql).toMatch(/UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = \$1/);
        expect(params).toEqual([9]);
    });
});
