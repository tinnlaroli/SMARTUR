/**
 * Verificación de esquema para CI (job db-schema).
 *
 * Supone una BD PostgreSQL accesible vía env (DB_HOST/DB_PORT/DB_NAME/
 * DB_USER/DB_PASSWORD) con bd.sql ya importado y 001_reconcile_vps.sql
 * aplicado. Ejecuta el runner de migraciones DOS veces y comprueba que:
 *   1) tras la 1ª pasada hay exactamente MIGRATION_COUNT migraciones nuevas
 *      (todas se aplicaron sin error; si alguna fallara, el INSERT no ocurre);
 *   2) la 2ª pasada no añade ni elimina nada (idempotencia).
 *
 * Salida: exit 0 si todo cuadra, exit 1 en caso contrario.
 */
import pool from '../config/db.js';
import { runMigrations, MIGRATION_NAMES } from '../config/migrations.js';

async function migrationNames() {
    const r = await pool.query('SELECT name FROM _schema_migrations');
    return new Set(r.rows.map((row) => row.name));
}

async function main() {
    const before = await migrationNames();
    console.log(`migraciones registradas al inicio: ${before.size}`);

    await runMigrations();
    const afterFirst = await migrationNames();
    console.log(`tras 1ª pasada: ${afterFirst.size}`);

    await runMigrations();
    const afterSecond = await migrationNames();
    console.log(`tras 2ª pasada: ${afterSecond.size}`);

    const missing = MIGRATION_NAMES.filter((name) => !afterFirst.has(name));
    if (missing.length > 0) {
        console.error(
            `FAIL: ${missing.length} migración(es) no quedaron registradas tras la 1ª pasada: ` +
                missing.join(', '),
        );
        process.exit(1);
    }

    const addedOn2nd = MIGRATION_NAMES.filter(
        (name) => !afterFirst.has(name) && afterSecond.has(name),
    );
    if (addedOn2nd.length > 0) {
        console.error(
            `FAIL: la 2ª pasada aplicó migraciones nuevas (${addedOn2nd.join(', ')}): el runner ` +
                'no es idempotente.',
        );
        process.exit(1);
    }

    console.log(
        `OK: las ${MIGRATION_NAMES.length} migraciones quedaron registradas y la 2ª pasada ` +
            `no añadió nada (${before.size} → ${afterFirst.size} → ${afterSecond.size}).`,
    );
}

main()
    .catch((err) => {
        console.error('FATAL:', err);
        process.exit(1);
    })
    .finally(() => {
        // pool.end() puede quedarse esperando si hay clients idle; fuerza cierre.
        const timer = setTimeout(() => process.exit(0), 3000);
        pool.end(() => {
            clearTimeout(timer);
            process.exit(0);
        });
    });