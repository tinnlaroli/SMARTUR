import * as ActivityModel from '../models/serviceActivityModel.js';
import pool from '../config/db.js';

/** GET /api/v2/tourist-services/:id/activities */
export async function list(req, res) {
    try {
        const idService = parseInt(req.params.id, 10);
        if (Number.isNaN(idService)) return res.status(400).json({ message: 'ID inválido' });
        const activities = await ActivityModel.getActivitiesByService(idService);
        return res.json({ activities });
    } catch (e) {
        return res.status(500).json({ message: e.message });
    }
}

/** POST /api/v2/tourist-services/:id/activities */
export async function create(req, res) {
    try {
        const idService = parseInt(req.params.id, 10);
        if (Number.isNaN(idService)) return res.status(400).json({ message: 'ID inválido' });

        // Empresa: must own the service
        if (req.user.role_id === 3) {
            const check = await pool.query(
                `SELECT id_service FROM tourist_service
                 WHERE id_service = $1 AND id_company = (
                     SELECT id_company FROM "user" WHERE user_id = $2
                 )`,
                [idService, req.user.id],
            );
            if (!check.rows[0]) return res.status(403).json({ message: 'Sin permiso sobre este servicio.' });
        }

        const { name, description, duration_minutes, price, max_capacity, features } = req.body;
        if (!name?.trim()) return res.status(400).json({ message: 'El nombre es requerido.' });

        const activity = await ActivityModel.createActivity({
            id_service: idService, name: name.trim(), description,
            duration_minutes, price, max_capacity, features,
        });
        return res.status(201).json({ activity });
    } catch (e) {
        return res.status(500).json({ message: e.message });
    }
}

/** PATCH /api/v2/tourist-services/:serviceId/activities/:actId */
export async function update(req, res) {
    try {
        const actId = parseInt(req.params.actId, 10);
        if (Number.isNaN(actId)) return res.status(400).json({ message: 'ID inválido' });

        // Verify ownership for empresa
        if (req.user.role_id === 3) {
            const existing = await ActivityModel.getActivityById(actId);
            if (!existing) return res.status(404).json({ message: 'Actividad no encontrada.' });
            const check = await pool.query(
                `SELECT id_service FROM tourist_service
                 WHERE id_service = $1 AND id_company = (
                     SELECT id_company FROM "user" WHERE user_id = $2
                 )`,
                [existing.id_service, req.user.id],
            );
            if (!check.rows[0]) return res.status(403).json({ message: 'Sin permiso.' });
        }

        const updated = await ActivityModel.updateActivity(actId, req.body);
        if (!updated) return res.status(404).json({ message: 'Actividad no encontrada.' });
        return res.json({ activity: updated });
    } catch (e) {
        return res.status(500).json({ message: e.message });
    }
}

/** DELETE /api/v2/tourist-services/:serviceId/activities/:actId */
export async function remove(req, res) {
    try {
        const actId = parseInt(req.params.actId, 10);
        if (Number.isNaN(actId)) return res.status(400).json({ message: 'ID inválido' });
        await ActivityModel.softDeleteActivity(actId);
        return res.json({ ok: true });
    } catch (e) {
        return res.status(500).json({ message: e.message });
    }
}
