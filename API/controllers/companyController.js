import Company from '../models/companyModel.js';
import pool from '../config/db.js';
import { sendEmpresaApprovedEmail, sendEmpresaSuspendedEmail } from '../utils/mailer.js';

class CompanyController {
    static async getAll(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = Math.min(parseInt(req.query.limit) || 50, 100);

            const search = req.query.search || '';
            const location = req.query.location ? parseInt(req.query.location) : null;
            const sector = req.query.sector ? parseInt(req.query.sector) : null;
            const status = req.query.status || 'active';

            const result = await Company.findAll(page, limit, search, location, sector, status);

            res.json({
                message: 'Compañías obtenidas exitosamente',
                totalRecords: result.totalRecords,
                totalPages: result.totalPages,
                currentPage: result.currentPage,
                companies: result.companies.map((company) => ({
                    id: company.id_company,
                    name: company.name,
                    address: company.address,
                    phone: company.phone,
                    id_sector: company.id_sector,
                    id_location: company.id_location,
                    registration_date: company.registration_date,
                    status: company.status ?? 'active',
                    owner_user_id: company.owner_user_id ?? null,
                })),
            });
        } catch (error) {
            console.error('Error fetching companies:', error);
            res.status(500).json({
                message: 'Error interno del servidor',
                error: error.message,
            });
        }
    }

    static async getById(req, res) {
        try {
            const company = await Company.findById(req.params.id);

            if (!company) {
                return res.status(404).json({ message: 'Compañía no encontrada' });
            }

            res.json({
                message: 'Compañía obtenida exitosamente',
                company: {
                    id: company.id_company,
                    name: company.name,
                    address: company.address,
                    phone: company.phone,
                    id_sector: company.id_sector,
                    id_location: company.id_location,
                    registration_date: company.registration_date,
                    status: company.status ?? 'active',
                    owner_user_id: company.owner_user_id ?? null,
                },
            });
        } catch (error) {
            console.error('Error fetching company:', error);
            res.status(500).json({
                message: 'Error interno del servidor',
                error: error.message,
            });
        }
    }

    static async create(req, res) {
        try {
            const { name, id_sector } = req.body;

            if (!name || !id_sector) {
                return res.status(400).json({ message: 'Nombre y sector son requeridos' });
            }

            const company = await Company.create(req.body);

            res.status(201).json({
                message: 'Compañía creada exitosamente',
                company: {
                    id: company.id_company,
                    name: company.name,
                    address: company.address,
                    phone: company.phone,
                    id_sector: company.id_sector,
                    id_location: company.id_location,
                    registration_date: company.registration_date,
                    status: company.status ?? 'pending',
                    owner_user_id: company.owner_user_id ?? null,
                },
            });
        } catch (error) {
            console.error('Error creating company:', error);
            res.status(500).json({
                message: 'Error interno del servidor',
                error: error.message,
            });
        }
    }

    static async update(req, res) {
        try {
            const company = await Company.update(req.params.id, req.body);

            if (!company) {
                return res.status(404).json({ message: 'Compañía no encontrada' });
            }

            // Notificar al owner si el admin cambió el status
            const newStatus = req.body.status;
            if ((newStatus === 'active' || newStatus === 'suspended') && company.owner_user_id) {
                pool.query(
                    `SELECT email FROM "user" WHERE user_id = $1`,
                    [company.owner_user_id],
                ).then(async ({ rows }) => {
                    if (!rows.length) return;
                    const { email } = rows[0];
                    try {
                        if (newStatus === 'active') {
                            await sendEmpresaApprovedEmail(email, { companyName: company.name });
                        } else {
                            await sendEmpresaSuspendedEmail(email, { companyName: company.name });
                        }
                    } catch (emailErr) {
                        console.warn('[company] email de estado no enviado:', emailErr.message);
                    }
                }).catch((err) => {
                    console.warn('[company] lookup owner fallido:', err.message);
                });
            }

            res.json({
                message: 'Compañía actualizada exitosamente',
                company: {
                    id: company.id_company,
                    name: company.name,
                    address: company.address,
                    phone: company.phone,
                    id_sector: company.id_sector,
                    id_location: company.id_location,
                    registration_date: company.registration_date,
                    status: company.status ?? 'active',
                    owner_user_id: company.owner_user_id ?? null,
                },
            });
        } catch (error) {
            console.error('Error updating company:', error);
            res.status(500).json({
                message: 'Error interno del servidor',
                error: error.message,
            });
        }
    }

    static async delete(req, res) {
        try {
            const company = await Company.delete(req.params.id);

            if (!company) {
                return res.status(404).json({ message: 'Compañía no encontrada' });
            }

            res.json({
                message: 'Compañía eliminada exitosamente',
                company: {
                    id: company.id_company,
                    name: company.name,
                },
            });
        } catch (error) {
            console.error('Error deleting company:', error);
            res.status(500).json({
                message: 'Error interno del servidor',
                error: error.message,
            });
        }
    }
}

export default CompanyController;
