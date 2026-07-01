import multer from 'multer';

// Usamos memoryStorage para no llenar el disco del servidor de Render
const storage = multer.memoryStorage();

// Límite: 8 MB por archivo (imágenes de perfil/servicios y PDFs de KYC).
// Sin este límite, un archivo gigante se carga completo en RAM y puede
// tumbar el contenedor (DoS por agotamiento de memoria).
const MAX_FILE_SIZE = 8 * 1024 * 1024;

const ALLOWED_MIMETYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
]);

const upload = multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIMETYPES.has(file.mimetype)) {
            return cb(null, true);
        }
        const err = new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname);
        err.message = `Tipo de archivo no permitido (${file.mimetype}). Usa JPG, PNG, WebP, GIF o PDF.`;
        cb(err);
    },
});

/**
 * Middleware de errores de multer — respuesta clara para el cliente
 * en vez de un 500 genérico. Montar DESPUÉS de las rutas en index.js.
 */
export function multerErrorHandler(err, _req, res, next) {
    if (err instanceof multer.MulterError) {
        const message =
            err.code === 'LIMIT_FILE_SIZE'
                ? `El archivo supera el tamaño máximo permitido (${MAX_FILE_SIZE / 1024 / 1024} MB).`
                : err.message || 'Archivo no válido.';
        return res.status(413).json({ error: message, code: err.code });
    }
    next(err);
}

export default upload;
