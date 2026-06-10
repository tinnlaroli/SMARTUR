import TouristServices from '../models/touristServicesModel.js';
import cloudinary from '../config/cloudinary.js';
import pool from '../config/db.js';
import AdminChangeLog from '../models/adminChangeLogModel.js';
import { sendFcmToUser } from '../services/fcmService.js';

const SERVICE_FIELD_LABELS = {
    name:         'Nombre',
    description:  'Descripción',
    service_type: 'Tipo de servicio',
    active:       'Estado',
    id_location:  'Ubicación',
    price_from:   'Precio desde',
    price_to:     'Precio hasta',
};

function uploadImageToCloudinary(buffer) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: 'smartur/tourist-services',
                resource_type: 'image',
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );

        stream.end(buffer);
    });
}

class TouristServicesController {
    static async getAll(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = Math.min(parseInt(req.query.limit) || 50, 100);

            const search = req.query.search || '';
            const company = req.query.company ? parseInt(req.query.company) : null;
            const type = req.query.type || null;
            const active = req.query.active !== undefined ? req.query.active === 'true' : null;
            const id_location = req.query.id_location ? parseInt(req.query.id_location) : null;

            // Admins (1) and turismólogos (4) see all statuses; everyone else only sees active
            const publicOnly = ![1, 4].includes(req.user?.role_id);

            const result = await TouristServices.findAll(
                page,
                limit,
                search,
                company,
                type,
                active,
                id_location,
                publicOnly
            );

            res.json({
                message: 'Servicios obtenidos exitosamente',
                totalRecords: result.totalRecords,
                totalPages: result.totalPages,
                currentPage: result.currentPage,
                services: result.services.map((service) => ({
                    id: service.id_service,
                    id_service: service.id_service,
                    name: service.name,
                    description: service.description,
                    id_company: service.id_company,
                    id_location: service.id_location,
                    service_type: service.service_type,
                    active: service.active,
                    id_evaluation: service.id_evaluation,
                    total_score: service.total_score,
                    image_url: service.image_url || null,
                    created_at: service.created_at,
                })),
            });
        } catch (error) {
            console.error('Error fetching services:', error);
            res.status(500).json({
                message: 'Error interno del servidor',
                error: error.message,
            });
        }
    }

    static async getById(req, res) {
        try {
            const service = await TouristServices.findById(req.params.id);

            if (!service) {
                return res.status(404).json({ message: 'Servicio no encontrado' });
            }

            res.json({
                message: 'Servicio obtenido exitosamente',
                service: {
                    id: service.id_service,
                    id_service: service.id_service,
                    name: service.name,
                    description: service.description,
                    id_company: service.id_company,
                    id_location: service.id_location,
                    service_type: service.service_type,
                    active: service.active,
                    id_evaluation: service.id_evaluation,
                    total_score: service.total_score,
                    image_url: service.image_url || null,
                    created_at: service.created_at,
                },
            });
        } catch (error) {
            console.error('Error fetching service:', error);
            res.status(500).json({
                message: 'Error interno del servidor',
                error: error.message,
            });
        }
    }

    static async create(req, res) {
        try {
            const { name, id_company, id_location, service_type } = req.body;

            if (!name || !id_company || !id_location || !service_type) {
                return res.status(400).json({
                    message: 'Nombre, empresa, ubicación y tipo de servicio son requeridos',
                });
            }

            const payload = { ...req.body };

            if (req.file?.buffer) {
                const uploaded = await uploadImageToCloudinary(req.file.buffer);
                payload.image_url = uploaded.secure_url;
            }

            const service = await TouristServices.create(payload);

            res.status(201).json({
                message: 'Servicio creado exitosamente',
                service: {
                    id: service.id_service,
                    id_service: service.id_service,
                    name: service.name,
                    description: service.description,
                    id_company: service.id_company,
                    id_location: service.id_location,
                    service_type: service.service_type,
                    active: service.active,
                    image_url: service.image_url || null,
                    created_at: service.created_at,
                },
            });
        } catch (error) {
            console.error('Error creating service:', error);
            res.status(500).json({
                message: 'Error interno del servidor',
                error: error.message,
            });
        }
    }

    static async update(req, res) {
        try {
            const isAdmin = req.user?.role_id === 1;
            const payload = { ...req.body };

            if (req.file?.buffer) {
                const uploaded = await uploadImageToCloudinary(req.file.buffer);
                payload.image_url = uploaded.secure_url;
            }

            // Load old state before update (admin diff tracking)
            let oldService = null;
            if (isAdmin) {
                oldService = await TouristServices.findById(req.params.id, false);
            }

            const service = await TouristServices.update(req.params.id, payload);

            if (!service) {
                return res.status(404).json({ message: 'Servicio no encontrado' });
            }

            // Build change log when an admin edits a service
            if (isAdmin && oldService) {
                const changes = {};
                const TRACKED = ['name', 'description', 'service_type', 'active', 'id_location', 'price_from', 'price_to'];
                for (const field of TRACKED) {
                    const newVal = payload[field];
                    if (newVal === undefined) continue;
                    const oldVal = oldService[field];
                    if (String(newVal) !== String(oldVal ?? '')) {
                        changes[field] = { old: oldVal, new: newVal, label: SERVICE_FIELD_LABELS[field] };
                    }
                }

                if (Object.keys(changes).length > 0) {
                    pool.query('SELECT owner_user_id FROM company WHERE id_company = $1', [oldService.id_company])
                        .then(async ({ rows }) => {
                            const ownerUserId = rows[0]?.owner_user_id;
                            try {
                                const log = await AdminChangeLog.create({
                                    target_type: 'service',
                                    target_id: oldService.id_service,
                                    admin_id: req.user.id,
                                    id_company: oldService.id_company,
                                    changes,
                                });
                                if (ownerUserId) {
                                    await sendFcmToUser(pool, ownerUserId, {
                                        title: 'Smartur modificó tu servicio',
                                        body: `Se editó "${oldService.name}". Revisa los cambios y responde si no estás de acuerdo.`,
                                        data: { type: 'admin_change', change_log_id: String(log.id) },
                                    });
                                }
                            } catch (logErr) {
                                console.warn('[service update] change log/FCM error:', logErr.message);
                            }
                        })
                        .catch(() => {});
                }
            }

            res.json({
                message: 'Servicio actualizado exitosamente',
                service: {
                    id: service.id_service,
                    id_service: service.id_service,
                    name: service.name,
                    description: service.description,
                    id_company: service.id_company,
                    id_location: service.id_location,
                    service_type: service.service_type,
                    active: service.active,
                    image_url: service.image_url || null,
                    price_from: service.price_from ?? null,
                    price_to: service.price_to ?? null,
                    currency: service.currency ?? 'MXN',
                    created_at: service.created_at,
                },
            });
        } catch (error) {
            console.error('Error updating service:', error);
            res.status(500).json({
                message: 'Error interno del servidor',
                error: error.message,
            });
        }
    }

    static async delete(req, res) {
        try {
            const service = await TouristServices.delete(req.params.id);

            if (!service) {
                return res.status(404).json({ message: 'Servicio no encontrado' });
            }

            res.json({
                message: 'Servicio eliminado exitosamente',
                service: {
                    id: service.id_service,
                    name: service.name,
                },
            });
        } catch (error) {
            console.error('Error deleting service:', error);
            res.status(500).json({
                message: 'Error interno del servidor',
                error: error.message,
            });
        }
    }
}

export default TouristServicesController;
