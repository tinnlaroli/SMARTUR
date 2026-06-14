import pool from '../config/db.js';
import { sendFcmToUser } from '../services/fcmService.js';
import * as Booking from '../models/bookingModel.js';

function safeBody(req) {
    const b = req.body;
    if (b != null && typeof b === 'object' && !Array.isArray(b)) return b;
    return {};
}

export class BookingController {
    static async createBooking(req, res) {
        try {
            const userId = req.user.id;
            const { id_service, id_itinerary, visit_date, visit_time, guests, notes } = safeBody(req);
            if (!id_service || !visit_date) {
                return res.status(400).json({ message: 'id_service y visit_date son requeridos' });
            }
            const booking = await Booking.createBooking(userId, {
                id_service, id_itinerary, visit_date, visit_time, guests, notes,
            });
            res.status(201).json({ message: 'Reserva creada', booking });
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Error al crear reserva', error: e.message });
        }
    }

    static async getMyBookings(req, res) {
        try {
            const bookings = await Booking.getMyBookings(req.user.id);
            res.json({ message: 'Mis reservas', bookings });
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Error al cargar reservas', error: e.message });
        }
    }

    static async getEmpresaBookings(req, res) {
        try {
            const companyId = req.user.id_company;
            const status = req.query.status || null;
            const bookings = await Booking.getEmpresaBookings(companyId, { status });
            res.json({ message: 'Reservas de la empresa', bookings });
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Error al cargar reservas', error: e.message });
        }
    }

    static async confirmBooking(req, res) {
        try {
            const id = parseInt(req.params.id, 10);
            if (Number.isNaN(id)) return res.status(400).json({ message: 'ID inválido' });
            const updated = await Booking.confirmBooking(id, req.user.id_company);
            if (!updated) return res.status(404).json({ message: 'Reserva no encontrada o ya procesada' });
            res.json({ message: 'Reserva confirmada', booking: updated });

            // FCM al turista — fire-and-forget
            if (updated.user_id && !updated.is_walkin) {
                sendFcmToUser(pool, updated.user_id, {
                    title: '¡Reserva confirmada! 🎉',
                    body: `Tu reserva de "${updated.service_name ?? 'servicio'}" fue confirmada.`,
                    data: { screen: 'bookings' },
                });
            }
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Error al confirmar reserva', error: e.message });
        }
    }

    static async cancelBooking(req, res) {
        try {
            const id = parseInt(req.params.id, 10);
            if (Number.isNaN(id)) return res.status(400).json({ message: 'ID inválido' });
            const isEmpresa = req.user.role_id === 3;
            const updated = await Booking.cancelBooking(id, {
                userId: isEmpresa ? null : req.user.id,
                companyId: isEmpresa ? req.user.id_company : null,
            });
            if (!updated) return res.status(404).json({ message: 'Reserva no encontrada o ya cancelada' });
            res.json({ message: 'Reserva cancelada', booking: updated });
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Error al cancelar reserva', error: e.message });
        }
    }

    static async createWalkin(req, res) {
        try {
            const { id_service, visit_date, visit_time, guests, notes } = safeBody(req);
            if (!id_service || !visit_date) {
                return res.status(400).json({ message: 'id_service y visit_date son requeridos' });
            }
            const booking = await Booking.createWalkin(req.user.id, {
                id_service, visit_date, visit_time, guests, notes,
            });
            res.status(201).json({ message: 'Walk-in registrado', booking });
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Error al registrar walk-in', error: e.message });
        }
    }
    static async getTouristProfile(req, res) {
        try {
            const { id } = req.params;
            const { id_company } = req.user;
            // Verify booking belongs to a service owned by this company
            const r = await pool.query(
                `SELECT u.name, u.email, u.photo_url, u.registration_date,
                        tp.interests, tp.dietary_restrictions, tp.has_accessibility,
                        b.visit_date, b.visit_time, b.guests, b.notes, b.is_walkin
                 FROM booking b
                 JOIN "user" u ON u.user_id = b.user_id
                 LEFT JOIN traveler_profile tp ON tp.user_id = b.user_id
                 JOIN tourist_service ts ON ts.id_service = b.id_service
                 WHERE b.id_booking = $1 AND ts.id_company = $2`,
                [id, id_company],
            );
            if (!r.rows[0]) {
                return res.status(404).json({ message: 'Reserva no encontrada' });
            }
            const row = r.rows[0];
            res.json({
                tourist: {
                    name: row.name,
                    email: row.email,
                    photo_url: row.photo_url,
                    registration_date: row.registration_date,
                    interests: row.interests ?? [],
                    dietary_restrictions: row.dietary_restrictions ?? null,
                    has_accessibility: row.has_accessibility ?? false,
                },
                booking: {
                    visit_date: row.visit_date,
                    visit_time: row.visit_time,
                    guests: row.guests,
                    notes: row.notes,
                    is_walkin: row.is_walkin,
                },
            });
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Error al obtener perfil del turista', error: e.message });
        }
    }
}

export default BookingController;
