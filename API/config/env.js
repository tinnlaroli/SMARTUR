/**
 * env.js — Validación de variables de entorno al arranque.
 *
 * Importar DESPUÉS de dotenv.config() y ANTES de cualquier
 * conexión a base de datos o servicio externo.
 *
 * • REQUIRED  → crash con process.exit(1) si falta alguna
 * • RECOMMENDED → warn pero el servidor arranca igual
 */

const RED   = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GREEN  = '\x1b[32m';
const RESET  = '\x1b[0m';
const BOLD   = '\x1b[1m';

// ─── Variables críticas ────────────────────────────────────────────────────
const REQUIRED = [
    { key: 'JWT_SECRET',   hint: 'Clave secreta para firmar tokens JWT (mín. 32 caracteres)' },
];

// La BD puede usarse via DATABASE_URL o via las 4 vars individuales.
// Se valida como grupo mutuamente excluyente.
const DB_INDIVIDUAL = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];

// ─── Variables recomendadas ─────────────────────────────────────────────────
const RECOMMENDED = [
    { key: 'GOOGLE_CLIENT_ID',       hint: 'Necesario para Google Sign-In' },
    { key: 'CLOUDINARY_CLOUD_NAME',  hint: 'Subida de imágenes (Cloudinary)' },
    { key: 'CLOUDINARY_API_KEY',     hint: 'Subida de imágenes (Cloudinary)' },
    { key: 'CLOUDINARY_API_SECRET',  hint: 'Subida de imágenes (Cloudinary)' },
    { key: 'EMAIL_USER',             hint: 'Envío de emails (nodemailer)' },
    { key: 'EMAIL_PASS',             hint: 'Contraseña del correo de envío' },
    { key: 'MODELO_URL',             hint: 'URL del microservicio de ML (recomendaciones)' },
    { key: 'FRONTEND_URL',           hint: 'Orígenes permitidos por CORS (coma-separados)' },
    { key: 'SENTRY_DSN',             hint: 'Error tracking — obtener en sentry.io → Settings → DSN' },
];

// ───────────────────────────────────────────────────────────────────────────

function validateEnv() {
    const errors   = [];
    const warnings = [];

    // 1. Required vars
    for (const { key, hint } of REQUIRED) {
        if (!process.env[key]) {
            errors.push(`  ${BOLD}${key}${RESET}${RED}  →  ${hint}${RESET}`);
        }
    }

    // 2. DB: DATABASE_URL ó las 4 individuales
    const hasConnectionString = Boolean(process.env.DATABASE_URL);
    const missingIndividual   = DB_INDIVIDUAL.filter((k) => !process.env[k]);

    if (!hasConnectionString && missingIndividual.length > 0) {
        // Si faltan TODAS las individuales y no hay URL, crash
        if (missingIndividual.length === DB_INDIVIDUAL.length) {
            errors.push(
                `  ${BOLD}DB_HOST / DB_USER / DB_PASSWORD / DB_NAME${RESET}${RED}  →  ` +
                `Requiere DATABASE_URL o las 4 variables individuales de conexión a PostgreSQL${RESET}`
            );
        } else {
            // Si hay algunas pero faltan otras, también crash
            for (const key of missingIndividual) {
                errors.push(`  ${BOLD}${key}${RESET}${RED}  →  Variable de conexión a PostgreSQL incompleta${RESET}`);
            }
        }
    }

    // 3. Recommended vars
    for (const { key, hint } of RECOMMENDED) {
        if (!process.env[key]) {
            warnings.push(`  ${BOLD}${key}${RESET}  →  ${hint}`);
        }
    }

    // 4. Advertencia extra: JWT_SECRET demasiado corto
    const jwt = process.env.JWT_SECRET || '';
    if (jwt && jwt.length < 32) {
        warnings.push(`  ${BOLD}JWT_SECRET${RESET}  →  Tiene solo ${jwt.length} caracteres. Se recomienda mínimo 32.`);
    }

    // ── Mostrar resultado ─────────────────────────────────────────────────

    if (warnings.length > 0) {
        console.warn(
            `\n${YELLOW}${BOLD}[env] ⚠  Variables recomendadas sin definir:${RESET}\n` +
            warnings.join('\n') +
            `\n${YELLOW}  El servidor arranca, pero estas funciones pueden estar deshabilitadas.\n${RESET}`
        );
    }

    if (errors.length > 0) {
        console.error(
            `\n${RED}${BOLD}[env] ✖  Variables de entorno REQUERIDAS faltantes:${RESET}\n` +
            errors.join('\n') +
            `\n\n${RED}${BOLD}  El servidor NO puede arrancar. ` +
            `Configura las variables en el archivo .env y vuelve a iniciar.\n${RESET}`
        );
        process.exit(1);
    }

    console.log(`${GREEN}[env] ✓  Variables de entorno validadas correctamente${RESET}`);
}

export { validateEnv };
