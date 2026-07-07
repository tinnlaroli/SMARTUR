// Mock for config/db.js's default-exported pg Pool.
//
// Decision: tests mock `pg` entirely (via vi.mock pointing at this module)
// instead of hitting a real Postgres instance. This keeps the suite
// deterministic, fast, and runnable in CI without provisioning a database.
// Each test controls `pool.query` behavior directly with vi.fn()/mockImplementation.
import { vi } from 'vitest';

export const pool = {
    query: vi.fn(),
    connect: vi.fn(),
    on: vi.fn(),
};

export default pool;
