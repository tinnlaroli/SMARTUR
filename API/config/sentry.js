/**
 * sentry.js — Inicialización de Sentry para error tracking y performance.
 *
 * Importar y llamar initSentry() DESPUÉS de dotenv.config() y validateEnv(),
 * antes de registrar rutas en Express.
 *
 * En producción, agregar SENTRY_DSN al .env del VPS.
 * Si no está presente, el servidor arranca igualmente (tracking deshabilitado).
 *
 * Para instrumentación completa de módulos Node.js (http, pg, etc.) se puede
 * usar el flag --import en el script de arranque:
 *   node --import ./instrument.js index.js
 * Sin él, captura errores de Express y excepciones no manejadas de todas formas.
 */

import * as Sentry from '@sentry/node';

let initialized = false;

/**
 * Inicializa Sentry. No-op si SENTRY_DSN no está configurado.
 * @returns {boolean} true si Sentry fue inicializado
 */
export function initSentry() {
    const dsn = process.env.SENTRY_DSN;

    if (!dsn) {
        console.warn('[sentry] ⚠  SENTRY_DSN no configurado — error tracking deshabilitado');
        return false;
    }

    const env         = process.env.NODE_ENV || 'production';
    const sampleRate  = parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.05');

    Sentry.init({
        dsn,
        environment: env,

        // Tracing: captura el 5 % de peticiones por defecto (ajustable con SENTRY_TRACES_SAMPLE_RATE)
        tracesSampleRate: sampleRate,

        // Integración con Express: request context, transacciones por ruta
        integrations: [Sentry.expressIntegration()],

        // Ignora errores operacionales esperados para no saturar el dashboard
        ignoreErrors: [
            'ECONNREFUSED',
            'ECONNRESET',
            'ETIMEDOUT',
            'Not Found',
        ],

        // Filtra datos sensibles del body antes de enviarlos a Sentry
        beforeSend(event) {
            if (event.request?.data) {
                const sensitive = ['password', 'token', 'secret', 'authorization'];
                const body = event.request.data;
                if (typeof body === 'object' && body !== null) {
                    for (const key of sensitive) {
                        if (key in body) body[key] = '[Filtered]';
                    }
                }
            }
            return event;
        },
    });

    initialized = true;
    console.log(`[sentry] ✓ Error tracking activo (env: ${env}, traces: ${sampleRate * 100}%)`);
    return true;
}

/**
 * Registra el error handler de Sentry en la app Express.
 * Debe llamarse DESPUÉS de registrar todas las rutas.
 * @param {import('express').Application} app
 */
export function setupSentryErrorHandler(app) {
    if (!initialized) return;
    Sentry.setupExpressErrorHandler(app);
}

export { Sentry };
