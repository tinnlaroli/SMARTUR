import AdminChangeLog from '../models/adminChangeLogModel.js';
import pool from '../config/db.js';
import { sendFcmToUser } from '../services/fcmService.js';
import TouristServices from '../models/touristServicesModel.js';
import Company from '../models/companyModel.js';

class AdminChangeLogController {
    static async getAll(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = Math.min(parseInt(req.query.limit) || 20, 50);
            const status = req.query.status || null;
            const result = await AdminChangeLog.findAll(page, limit, status);
            res.json({ message: 'Registros obtenidos', ...result });
        } catch (error) {
            console.error('[adminChangeLog] getAll:', error);
            res.status(500).json({ message: 'Error interno', error: error.message });
        }
    }

    static async getByCompany(req, res) {
        try {
            const userRow = await pool.query(
                `SELECT id_company FROM "user" WHERE user_id = $1`,
                [req.user.id]
            );
            const id_company = userRow.rows[0]?.id_company;
            if (!id_company) {
                return res.json({ message: 'Sin cambios registrados', logs: [], total: 0, totalPages: 0, currentPage: 1 });
            }
            const page = parseInt(req.query.page) || 1;
            const limit = Math.min(parseInt(req.query.limit) || 20, 50);
            const result = await AdminChangeLog.findByCompany(id_company, page, limit);
            res.json({ message: 'Registros obtenidos', ...result });
        } catch (error) {
            console.error('[adminChangeLog] getByCompany:', error);
            res.status(500).json({ message: 'Error interno', error: error.message });
        }
    }

    static async getById(req, res) {
        try {
            const log = await AdminChangeLog.findById(req.params.id);
            if (!log) return res.status(404).json({ message: 'Registro no encontrado' });
            res.json({ log });
        } catch (error) {
            console.error('[adminChangeLog] getById:', error);
            res.status(500).json({ message: 'Error interno', error: error.message });
        }
    }

    static async empresaAccept(req, res) {
        try {
            const log = await AdminChangeLog.findById(req.params.id);
            if (!log) return res.status(404).json({ message: 'Registro no encontrado' });
            if (log.status !== 'pending_review') {
                return res.status(400).json({ message: 'Este cambio ya fue procesado' });
            }
            const updated = await AdminChangeLog.updateStatus(log.id, 'accepted');
            res.json({ message: 'Cambio aceptado', log: updated });
        } catch (error) {
            console.error('[adminChangeLog] empresaAccept:', error);
            res.status(500).json({ message: 'Error interno', error: error.message });
        }
    }

    static async empresaDispute(req, res) {
        try {
            const log = await AdminChangeLog.findById(req.params.id);
            if (!log) return res.status(404).json({ message: 'Registro no encontrado' });
            if (log.status !== 'pending_review') {
                return res.status(400).json({ message: 'Este cambio ya fue procesado' });
            }
            const { empresa_note, empresa_counter } = req.body;
            if (!empresa_note?.trim()) {
                return res.status(400).json({ message: 'Debe incluir una justificación para la disputa' });
            }
            const updated = await AdminChangeLog.updateStatus(log.id, 'disputed', {
                empresa_note: empresa_note.trim(),
                empresa_counter: empresa_counter || null,
            });
            res.json({ message: 'Disputa enviada al administrador', log: updated });
        } catch (error) {
            console.error('[adminChangeLog] empresaDispute:', error);
            res.status(500).json({ message: 'Error interno', error: error.message });
        }
    }

    static async adminResolve(req, res) {
        try {
            const log = await AdminChangeLog.findById(req.params.id);
            if (!log) return res.status(404).json({ message: 'Registro no encontrado' });
            if (log.status !== 'disputed') {
                return res.status(400).json({ message: 'Este registro no está en disputa' });
            }

            const { resolution, admin_resolution_note } = req.body;
            if (!resolution || !['keep_admin', 'accept_empresa'].includes(resolution)) {
                return res.status(400).json({ message: 'resolution debe ser keep_admin o accept_empresa' });
            }

            const newStatus = resolution === 'accept_empresa' ? 'resolved_empresa' : 'resolved_admin';

            if (resolution === 'accept_empresa' && log.empresa_counter) {
                try {
                    if (log.target_type === 'service') {
                        await TouristServices.update(log.target_id, log.empresa_counter);
                    } else if (log.target_type === 'company') {
                        await Company.update(log.target_id, log.empresa_counter);
                    }
                } catch (applyErr) {
                    console.warn('[adminChangeLog] Error applying empresa counter:', applyErr.message);
                }
            }

            const updated = await AdminChangeLog.updateStatus(log.id, newStatus, {
                admin_resolution_note: admin_resolution_note?.trim() || null,
            });

            if (log.id_company) {
                pool.query('SELECT owner_user_id FROM company WHERE id_company = $1', [log.id_company])
                    .then(({ rows }) => {
                        const ownerUserId = rows[0]?.owner_user_id;
                        if (!ownerUserId) return;
                        const title = resolution === 'accept_empresa'
                            ? 'Smartur aceptó tu contra-propuesta'
                            : 'Smartur mantuvo su edición';
                        const body = resolution === 'accept_empresa'
                            ? 'Tu versión fue aplicada. Gracias por tu respuesta.'
                            : 'El administrador mantuvo los cambios originales.';
                        sendFcmToUser(pool, ownerUserId, {
                            title,
                            body,
                            data: { type: 'dispute_resolved', change_log_id: String(log.id) },
                        });
                    })
                    .catch(() => {});
            }

            res.json({ message: 'Disputa resuelta', log: updated });
        } catch (error) {
            console.error('[adminChangeLog] adminResolve:', error);
            res.status(500).json({ message: 'Error interno', error: error.message });
        }
    }
}

export default AdminChangeLogController;
