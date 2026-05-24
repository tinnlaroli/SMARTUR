import express from "express";
import pool from "../config/db.js";
import UserController from "../controllers/userController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/rbacMiddleware.js";
import { verifyOwnership } from "../middleware/ownershipMiddleware.js";
import upload from "../middleware/multer.js";

const router = express.Router();

// Ping ligero para validar token desde la app móvil (no requiere ID)
router.get("/me/ping", verifyToken, (_req, res) => res.json({ ok: true }));

// ── Session management ───────────────────────────────────────────────────────

/**
 * GET /api/v2/me/sessions
 * Returns active (non-revoked, non-expired) sessions for the authenticated user.
 */
router.get("/me/sessions", verifyToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, device_hint, ip, created_at, expires_at, last_seen
       FROM user_sessions
       WHERE user_id = $1
         AND revoked = FALSE
         AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 10`,
      [req.user.id],
    );
    res.json(rows);
  } catch (err) {
    console.error("[me/sessions] error:", err.message);
    res.status(500).json({ message: "Error al obtener sesiones." });
  }
});

/**
 * DELETE /api/v2/me/sessions/:id
 * Revokes (marks as inactive) a session owned by the authenticated user.
 */
router.delete("/me/sessions/:id", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE user_sessions
       SET revoked = TRUE
       WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id],
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Sesión no encontrada." });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("[me/sessions/:id DELETE] error:", err.message);
    res.status(500).json({ message: "Error al revocar sesión." });
  }
});

// RBAC: Solo admin puede listar todos los usuarios
router.get("/users", verifyToken, requireRole([1]), UserController.getAll);

// Ownership: solo el propio usuario o admin puede ver su perfil
router.get("/users/:id", verifyToken, verifyOwnership, UserController.getById);

// RBAC: Solo admin puede buscar usuarios por email
router.get(
  "/users/email/:email",
  verifyToken,
  requireRole([1]),
  UserController.findByEmail,
);

// Rutas públicas
router.post("/users/register", upload.single("image"), UserController.register);

// RBAC: Solo admin puede crear usuarios directamente
router.post("/users/", verifyToken, requireRole([1]), upload.single("image"), UserController.create);

// RBAC: Solo admin puede eliminar usuarios
router.delete(
  "/users/:id",
  verifyToken,
  requireRole([1]),
  UserController.delete,
);

// Ownership: solo el propio usuario o admin puede actualizar su perfil
router.patch("/users/:id", verifyToken, verifyOwnership, upload.single("image"), UserController.patch);

// Subida de avatar (multipart, campo "avatar"); requiere Cloudinary configurado
router.post(
  "/users/:id/avatar",
  verifyToken,
  verifyOwnership,
  upload.single("avatar"),
  UserController.uploadAvatar,
);

export default router;
