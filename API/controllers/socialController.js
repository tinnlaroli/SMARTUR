import pool from '../config/db.js';
import { sendFcmToUser } from '../services/fcmService.js';
import * as Social from '../models/socialModel.js';

export class SocialController {
    static async searchUsers(req, res) {
        try {
            const q = (req.query.q || '').trim();
            if (q.length < 2) return res.json({ users: [] });
            const users = await Social.searchUsers(q, req.user.id);
            res.json({ message: 'Resultados', users });
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Error en búsqueda', error: e.message });
        }
    }

    static async getPublicProfile(req, res) {
        try {
            const userId = parseInt(req.params.id, 10);
            if (Number.isNaN(userId)) return res.status(400).json({ message: 'ID inválido' });
            const profile = await Social.getPublicProfile(userId, req.user.id);
            if (!profile) return res.status(404).json({ message: 'Usuario no encontrado' });
            res.json({ message: 'Perfil público', profile });
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Error al cargar perfil', error: e.message });
        }
    }

    static async getUserItineraries(req, res) {
        try {
            const userId = parseInt(req.params.id, 10);
            if (Number.isNaN(userId)) return res.status(400).json({ message: 'ID inválido' });
            const itineraries = await Social.getUserPublicItineraries(userId);
            res.json({ message: 'Rutas públicas', itineraries });
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Error al cargar rutas', error: e.message });
        }
    }

    static async followUser(req, res) {
        try {
            const followerId = req.user.id;
            const followingId = parseInt(req.params.id, 10);
            if (Number.isNaN(followingId)) return res.status(400).json({ message: 'ID inválido' });
            if (followerId === followingId) {
                return res.status(400).json({ message: 'No puedes seguirte a ti mismo' });
            }
            await Social.followUser(followerId, followingId);
            res.json({ message: 'Ahora sigues a este usuario' });

            // FCM al usuario seguido — fire-and-forget
            const followerName = req.user.name ?? 'Alguien';
            sendFcmToUser(pool, followingId, {
                title: 'Nuevo seguidor 👤',
                body: `${followerName} ahora te sigue.`,
                data: { screen: 'profile', user_id: String(followerId) },
            });
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Error al seguir usuario', error: e.message });
        }
    }

    static async unfollowUser(req, res) {
        try {
            const followerId = req.user.id;
            const followingId = parseInt(req.params.id, 10);
            if (Number.isNaN(followingId)) return res.status(400).json({ message: 'ID inválido' });
            await Social.unfollowUser(followerId, followingId);
            res.json({ message: 'Dejaste de seguir a este usuario' });
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Error al dejar de seguir', error: e.message });
        }
    }

    static async getFollowers(req, res) {
        try {
            const userId = parseInt(req.params.id, 10);
            if (Number.isNaN(userId)) return res.status(400).json({ message: 'ID inválido' });
            const users = await Social.getFollowers(userId, req.user.id);
            res.json({ message: 'Seguidores', users });
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Error al cargar seguidores', error: e.message });
        }
    }

    static async getFollowing(req, res) {
        try {
            const userId = parseInt(req.params.id, 10);
            if (Number.isNaN(userId)) return res.status(400).json({ message: 'ID inválido' });
            const users = await Social.getFollowingList(userId, req.user.id);
            res.json({ message: 'Siguiendo', users });
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Error al cargar siguiendo', error: e.message });
        }
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    static async listAdminItineraries(req, res) {
        try {
            const limit  = Math.min(parseInt(req.query.limit,  10) || 50, 100);
            const offset = Math.max(parseInt(req.query.offset, 10) || 0,  0);
            const certified = req.query.certified === 'true'
                ? true
                : req.query.certified === 'false'
                ? false
                : null;
            const { itineraries, total } = await Social.listAllPublicItineraries({ limit, offset, certified });
            res.json({ message: 'Itinerarios públicos', itineraries, total });
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Error al listar itinerarios', error: e.message });
        }
    }

    static async certifyItinerary(req, res) {
        try {
            const id = parseInt(req.params.id, 10);
            if (Number.isNaN(id)) return res.status(400).json({ message: 'ID inválido' });
            const updated = await Social.setItineraryCertified(id, true);
            if (!updated) return res.status(404).json({ message: 'Itinerario no encontrado' });
            res.json({ message: 'Itinerario certificado', itinerary: updated });
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Error al certificar', error: e.message });
        }
    }

    static async uncertifyItinerary(req, res) {
        try {
            const id = parseInt(req.params.id, 10);
            if (Number.isNaN(id)) return res.status(400).json({ message: 'ID inválido' });
            const updated = await Social.setItineraryCertified(id, false);
            if (!updated) return res.status(404).json({ message: 'Itinerario no encontrado' });
            res.json({ message: 'Certificación eliminada', itinerary: updated });
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Error al descertificar', error: e.message });
        }
    }
}

export default SocialController;
