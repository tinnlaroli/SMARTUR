import pool from '../config/db.js';
import * as Itinerary from '../models/itineraryModel.js';

function safeBody(req) {
    const b = req.body;
    if (b != null && typeof b === 'object' && !Array.isArray(b)) return b;
    return {};
}

export class ItineraryController {
    static async createItinerary(req, res) {
        try {
            const userId = req.user.id;
            const { title, description, is_public } = safeBody(req);
            if (!title?.trim()) {
                return res.status(400).json({ message: 'El título es requerido' });
            }
            const it = await Itinerary.createItinerary(userId, {
                title: title.trim(),
                description,
                isPublic: Boolean(is_public),
            });
            res.status(201).json({ message: 'Itinerario creado', itinerary: it });
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Error al crear itinerario', error: e.message });
        }
    }

    static async getMyItineraries(req, res) {
        try {
            const rows = await Itinerary.getMyItineraries(req.user.id);
            res.json({ message: 'Mis itinerarios', itineraries: rows });
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Error al listar itinerarios', error: e.message });
        }
    }

    static async getPredefined(req, res) {
        try {
            const rows = await Itinerary.getPredefined();
            res.json({ message: 'Rutas certificadas', itineraries: rows });
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Error al cargar rutas certificadas', error: e.message });
        }
    }

    static async getCommunity(req, res) {
        try {
            const rows = await Itinerary.getCommunity();
            res.json({ message: 'Rutas de la comunidad', itineraries: rows });
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Error al cargar rutas comunidad', error: e.message });
        }
    }

    static async getFollowing(req, res) {
        try {
            const rows = await Itinerary.getFollowingItineraries(req.user.id);
            res.json({ message: 'Rutas de seguidos', itineraries: rows });
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Error al cargar rutas de seguidos', error: e.message });
        }
    }

    static async search(req, res) {
        try {
            const q = (req.query.q || '').trim();
            if (q.length < 2) return res.json({ itineraries: [] });
            const rows = await Itinerary.searchItineraries(q);
            res.json({ message: 'Resultados', itineraries: rows });
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Error en búsqueda', error: e.message });
        }
    }

    static async getById(req, res) {
        try {
            const id = parseInt(req.params.id, 10);
            if (Number.isNaN(id)) return res.status(400).json({ message: 'ID inválido' });
            const it = await Itinerary.getItineraryById(id);
            if (!it) return res.status(404).json({ message: 'Itinerario no encontrado' });
            if (!it.is_public && it.user_id !== req.user.id) {
                return res.status(403).json({ message: 'Acceso denegado' });
            }
            res.json({ message: 'Itinerario', itinerary: it });
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Error al cargar itinerario', error: e.message });
        }
    }

    static async updateItinerary(req, res) {
        try {
            const userId = req.user.id;
            const id = parseInt(req.params.id, 10);
            const { title, description, is_public, cover_image_url } = safeBody(req);
            const updated = await Itinerary.updateItinerary(id, userId, {
                title, description, isPublic: is_public, coverImageUrl: cover_image_url,
            });
            if (!updated) {
                return res.status(404).json({ message: 'Itinerario no encontrado o sin permiso' });
            }
            res.json({ message: 'Itinerario actualizado', itinerary: updated });
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Error al actualizar itinerario', error: e.message });
        }
    }

    static async deleteItinerary(req, res) {
        try {
            const userId = req.user.id;
            const id = parseInt(req.params.id, 10);
            const ok = await Itinerary.deleteItinerary(id, userId);
            if (!ok) {
                return res.status(404).json({ message: 'Itinerario no encontrado o sin permiso' });
            }
            res.json({ message: 'Itinerario eliminado' });
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Error al eliminar itinerario', error: e.message });
        }
    }

    static async addStop(req, res) {
        try {
            const userId = req.user.id;
            const id = parseInt(req.params.id, 10);
            const { place_kind, place_id, visit_date, visit_time_start, notes } = safeBody(req);
            if (!place_kind || !place_id) {
                return res.status(400).json({ message: 'place_kind y place_id son requeridos' });
            }
            const stop = await Itinerary.addStop(id, userId, {
                place_kind,
                place_id: parseInt(place_id, 10),
                visit_date,
                visit_time_start,
                notes,
            });
            if (!stop) {
                return res.status(404).json({ message: 'Itinerario no encontrado o sin permiso' });
            }
            res.status(201).json({ message: 'Parada agregada', stop });
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Error al agregar parada', error: e.message });
        }
    }

    static async deleteStop(req, res) {
        try {
            const userId = req.user.id;
            const itineraryId = parseInt(req.params.id, 10);
            const stopId = parseInt(req.params.stopId, 10);
            const ok = await Itinerary.deleteStop(itineraryId, stopId, userId);
            if (!ok) {
                return res.status(404).json({ message: 'Parada no encontrada o sin permiso' });
            }
            res.json({ message: 'Parada eliminada' });
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Error al eliminar parada', error: e.message });
        }
    }

    static async reorderStops(req, res) {
        try {
            const userId = req.user.id;
            const id = parseInt(req.params.id, 10);
            const { ordered_ids } = safeBody(req);
            if (!Array.isArray(ordered_ids) || ordered_ids.length === 0) {
                return res.status(400).json({ message: 'ordered_ids debe ser un array no vacío' });
            }
            const ok = await Itinerary.reorderStops(id, userId, ordered_ids);
            if (!ok) {
                return res.status(404).json({ message: 'Itinerario no encontrado o sin permiso' });
            }
            res.json({ message: 'Paradas reordenadas' });
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Error al reordenar paradas', error: e.message });
        }
    }

    static async copyItinerary(req, res) {
        try {
            const userId = req.user.id;
            const id = parseInt(req.params.id, 10);
            const copy = await Itinerary.copyItinerary(id, userId);
            if (!copy) {
                return res.status(404).json({ message: 'Itinerario no encontrado o sin acceso' });
            }
            res.status(201).json({ message: 'Itinerario copiado', itinerary: copy });
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Error al copiar itinerario', error: e.message });
        }
    }

    static async likeItinerary(req, res) {
        try {
            await Itinerary.likeItinerary(parseInt(req.params.id, 10), req.user.id);
            res.json({ message: 'Me gusta registrado' });
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Error al registrar like', error: e.message });
        }
    }

    static async unlikeItinerary(req, res) {
        try {
            await Itinerary.unlikeItinerary(parseInt(req.params.id, 10), req.user.id);
            res.json({ message: 'Like eliminado' });
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Error al eliminar like', error: e.message });
        }
    }

    static async optimizeItinerary(req, res) {
        const MODELO_URL = process.env.MODELO_URL || 'http://modelo:8000';
        try {
            const userId = req.user.id;
            const id = parseInt(req.params.id, 10);
            if (Number.isNaN(id)) return res.status(400).json({ message: 'ID inválido' });

            const it = await Itinerary.getItineraryById(id);
            if (!it) return res.status(404).json({ message: 'Itinerario no encontrado' });
            if (it.user_id !== userId) return res.status(403).json({ message: 'Acceso denegado' });

            const stopsWithCoords = it.stops.filter(s => s.place_lat != null && s.place_lon != null);
            if (stopsWithCoords.length < 2) {
                return res.status(422).json({ message: 'Se necesitan al menos 2 paradas con coordenadas para optimizar' });
            }

            // Enrich service stops with operating_hours and duration_minutes from DB
            const svcIds = it.stops
                .filter(s => s.place_kind === 'svc')
                .map(s => s.place_id);

            let svcMeta = {};
            if (svcIds.length > 0) {
                const { rows } = await pool.query(
                    `SELECT id_service, operating_hours, duration_minutes
                     FROM tourist_service WHERE id_service = ANY($1)`,
                    [svcIds],
                );
                for (const row of rows) {
                    svcMeta[row.id_service] = {
                        operating_hours: row.operating_hours,
                        duration_minutes: row.duration_minutes,
                    };
                }
            }

            // Parse "HH:MM-HH:MM" string → {open_minutes, close_minutes} for today's day
            const DAY_KEYS = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'];
            const todayKey = DAY_KEYS[new Date().getDay()];
            function parseHours(hours, dayKey) {
                if (!hours || typeof hours !== 'object') return { open: null, close: null };
                const range = hours[dayKey];
                if (!range || typeof range !== 'string') return { open: null, close: null };
                const [openStr, closeStr] = range.split('-');
                function toMin(t) {
                    if (!t) return null;
                    const [h, m] = t.trim().split(':').map(Number);
                    return isNaN(h) ? null : h * 60 + (m || 0);
                }
                return { open: toMin(openStr), close: toMin(closeStr) };
            }

            const stops = it.stops.map(s => {
                const meta = s.place_kind === 'svc' ? (svcMeta[s.place_id] ?? {}) : {};
                const { open, close } = parseHours(meta.operating_hours, todayKey);
                return {
                    lat: s.place_lat ?? 0,
                    lng: s.place_lon ?? 0,
                    name: s.place_name ?? '',
                    duration_minutes: meta.duration_minutes ?? null,
                    open_minutes: open,
                    close_minutes: close,
                };
            });

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 15_000);
            let modeloData;
            try {
                const modeloRes = await fetch(`${MODELO_URL}/optimize-route`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ stops, start_minutes: 540 }),
                    signal: controller.signal,
                });
                if (!modeloRes.ok) {
                    const err = await modeloRes.json().catch(() => ({}));
                    return res.status(502).json({ message: err.detail ?? 'Error en el optimizador de rutas' });
                }
                modeloData = await modeloRes.json();
            } finally {
                clearTimeout(timeout);
            }

            const orderedStops = modeloData.optimized_order.map(idx => it.stops[idx]);

            res.json({
                message: 'Ruta optimizada',
                optimized_stop_ids: orderedStops.map(s => s.id_stop),
                original_distance_km: modeloData.original_distance_km,
                optimized_distance_km: modeloData.optimized_distance_km,
                savings_pct: modeloData.savings_pct,
            });
        } catch (e) {
            if (e.name === 'AbortError') {
                return res.status(504).json({ message: 'El optimizador tardó demasiado' });
            }
            console.error(e);
            res.status(500).json({ message: 'Error al optimizar ruta', error: e.message });
        }
    }

    static async suggestNearby(req, res) {
        try {
            const stopId = parseInt(req.query.last_stop_id, 10);
            if (Number.isNaN(stopId)) {
                return res.status(400).json({ message: 'last_stop_id requerido' });
            }
            const suggestions = await Itinerary.suggestNearby(stopId);
            res.json({ message: 'Sugerencias cercanas', places: suggestions });
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Error al sugerir lugares', error: e.message });
        }
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    static async adminList(req, res) {
        try {
            const limit  = Math.min(200, parseInt(req.query.limit, 10)  || 50);
            const offset = Math.max(0,   parseInt(req.query.offset, 10) || 0);
            let certified;
            if (req.query.certified === 'true')  certified = true;
            if (req.query.certified === 'false') certified = false;
            const result = await Itinerary.adminListPublic({ limit, offset, certified });
            res.json({ message: 'Itinerarios admin', ...result });
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Error al listar itinerarios', error: e.message });
        }
    }

    static async adminCreate(req, res) {
        try {
            const { title, description } = safeBody(req);
            if (!title?.trim()) return res.status(400).json({ message: 'El título es requerido' });
            const it = await Itinerary.adminCreateItinerary(req.user.id, { title, description });
            res.status(201).json({ message: 'Ruta certificada creada', itinerary: it });
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Error al crear ruta', error: e.message });
        }
    }

    static async adminCertify(req, res) {
        try {
            const id = parseInt(req.params.id, 10);
            if (Number.isNaN(id)) return res.status(400).json({ message: 'ID inválido' });
            await Itinerary.certifyItinerary(id);
            res.json({ message: 'Ruta certificada' });
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Error al certificar', error: e.message });
        }
    }

    static async adminUncertify(req, res) {
        try {
            const id = parseInt(req.params.id, 10);
            if (Number.isNaN(id)) return res.status(400).json({ message: 'ID inválido' });
            await Itinerary.uncertifyItinerary(id);
            res.json({ message: 'Certificación eliminada' });
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Error al descertificar', error: e.message });
        }
    }
}

export default ItineraryController;
