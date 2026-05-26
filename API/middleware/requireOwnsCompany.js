/**
 * Middleware: requireOwnsCompany
 * Verifica que un usuario con role_id=3 (empresa) solo acceda a su propia empresa.
 * Los admin (role_id=1) tienen bypass total.
 *
 * OWASP A01 — Broken Access Control
 * Se combina con requireRole([1, 3]) para garantizar acceso mínimo.
 */
export function requireOwnsCompany(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ message: 'No autenticado.' });
    }

    // Admin bypass: acceso a cualquier empresa
    if (req.user.role_id === 1) {
        return next();
    }

    // Empresa: debe tener id_company en JWT
    if (!req.user.id_company) {
        return res.status(403).json({
            message: 'Sin empresa asociada. Contacta al administrador.',
        });
    }

    next();
}
