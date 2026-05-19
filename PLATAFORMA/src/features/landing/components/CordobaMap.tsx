import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Clock, Star, Filter, ChevronDown } from 'lucide-react';
import bgPatron from '../../../assets/landing/bgPatron.png';

// Declare Leaflet for global usage
declare const L: any;

const REGION_CENTER = {
    lat: 18.85,
    lng: -96.95,
};

const ciudades = [
    { id: 'cordoba', nombre: 'Córdoba', lat: 18.8842, lng: -96.9256, color: 'var(--color-pink)' },
    { id: 'orizaba', nombre: 'Orizaba', lat: 18.8522, lng: -97.0994, color: 'var(--color-purple)' },
    { id: 'fortin', nombre: 'Fortín de las Flores', lat: 18.9061, lng: -96.9981, color: 'var(--color-cyan)' },
    { id: 'ixtaczoquitlan', nombre: 'Ixtaczoquitlán', lat: 18.8167, lng: -97.0667, color: 'var(--color-green)' },
    { id: 'cuitlahuac', nombre: 'Cuitláhuac', lat: 18.8131, lng: -96.7222, color: 'var(--color-orange)' },
    { id: 'amatlan', nombre: 'Amatlán de los Reyes', lat: 18.8333, lng: -96.9167, color: 'var(--color-pink)' },
    { id: 'yanga', nombre: 'Yanga', lat: 18.8333, lng: -96.8, color: 'var(--color-purple)' },
    { id: 'atoyac', nombre: 'Atoyac', lat: 18.9167, lng: -96.7667, color: 'var(--color-cyan)' },
];

const lugaresPorCiudad: Record<string, any[]> = {
    cordoba: [
        {
            id: 1,
            nombre: 'Parque 21 de Mayo',
            descripcion: 'El corazón histórico de Córdoba, rodeado de arquitectura colonial y lleno de vida cultural.',
            categoria: 'Histórico',
            ciudad: 'Córdoba',
            lat: 18.8842,
            lng: -96.9256,
            imagen: bgPatron,
            horario: 'Abierto 24 horas',
            rating: 4.5,
        },
        {
            id: 2,
            nombre: 'Museo de la Ciudad',
            descripcion: 'Exhibe la rica historia de Córdoba desde la época colonial hasta la actualidad.',
            categoria: 'Cultural',
            ciudad: 'Córdoba',
            lat: 18.886,
            lng: -96.927,
            imagen: bgPatron,
            horario: 'Martes a Domingo 10:00 - 18:00',
            rating: 4.3,
        },
        {
            id: 3,
            nombre: 'Catedral de la Inmaculada Concepción',
            descripcion: 'Impresionante templo barroco del siglo XVII, joya arquitectónica de la ciudad.',
            categoria: 'Religioso',
            ciudad: 'Córdoba',
            lat: 18.8835,
            lng: -96.9248,
            imagen: bgPatron,
            horario: 'Lunes a Domingo 7:00 - 20:00',
            rating: 4.7,
        },
    ],
    orizaba: [
        {
            id: 5,
            nombre: 'Palacio de Hierro',
            descripcion: 'Edificio histórico de arquitectura única, símbolo de Orizaba y patrimonio cultural.',
            categoria: 'Histórico',
            ciudad: 'Orizaba',
            lat: 18.8522,
            lng: -97.0994,
            imagen: bgPatron,
            horario: 'Lunes a Domingo 9:00 - 18:00',
            rating: 4.6,
        },
        {
            id: 6,
            nombre: 'Teleférico de Orizaba',
            descripcion: 'Teleférico que ofrece vistas panorámicas espectaculares de la ciudad y las montañas.',
            categoria: 'Naturaleza',
            ciudad: 'Orizaba',
            lat: 18.85,
            lng: -97.1,
            imagen: bgPatron,
            horario: 'Martes a Domingo 10:00 - 18:00',
            rating: 4.8,
        },
    ],
    fortin: [
        {
            id: 8,
            nombre: 'Jardín Botánico',
            descripcion: 'Hermoso jardín con una gran variedad de flores y plantas exóticas de la región.',
            categoria: 'Naturaleza',
            ciudad: 'Fortín de las Flores',
            lat: 18.9061,
            lng: -96.9981,
            imagen: bgPatron,
            horario: 'Lunes a Domingo 8:00 - 18:00',
            rating: 4.7,
        },
    ],
};

const todosLosLugares = Object.values(lugaresPorCiudad).flat();

const categorias = ['Todos', 'Histórico', 'Cultural', 'Religioso', 'Arqueológico', 'Gastronomía', 'Comercial', 'Naturaleza', 'Ecoturismo'];

export const CordobaMap: React.FC = () => {
    const [selectedPlace, setSelectedPlace] = useState<any>(null);
    const [filterCategory, setFilterCategory] = useState('Todos');
    const [filterCity, setFilterCity] = useState('Todas');
    const [mapLoaded, setMapLoaded] = useState(false);
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const mapRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]);
    const filterDropdownRef = useRef<HTMLDivElement>(null);

    const filteredPlaces = todosLosLugares.filter((place) => {
        const matchCategory = filterCategory === 'Todos' || place.categoria === filterCategory;
        const matchCity = filterCity === 'Todas' || place.ciudad === filterCity;
        return matchCategory && matchCity;
    });

    useEffect(() => {
        if (!window.hasOwnProperty('L')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);

            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.async = true;
            script.defer = true;
            script.onload = () => setMapLoaded(true);
            document.head.appendChild(script);
        } else {
            setMapLoaded(true);
        }
    }, []);

    const initializeMap = React.useCallback(() => {
        if (typeof L === 'undefined' || !document.getElementById('altas-montanas-map')) return;

        if (mapRef.current) {
            mapRef.current.remove();
        }

        const map = L.map('altas-montanas-map').setView([REGION_CENTER.lat, REGION_CENTER.lng], 11);
        mapRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
        }).addTo(map);

        markersRef.current.forEach((marker) => marker.remove());
        markersRef.current = [];

        ciudades.forEach((ciudad) => {
            const cityIcon = L.divIcon({
                className: 'city-marker',
                html: `<div style="background: ${ciudad.color}; width: 50px; height: 50px; border-radius: 50%; border: 4px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 10px rgba(0,0,0,0.4);">
          <span style="color: white; font-size: 20px;">🏙️</span>
        </div>`,
                iconSize: [50, 50],
                iconAnchor: [25, 50],
            });

            const cityMarker = L.marker([ciudad.lat, ciudad.lng], { icon: cityIcon }).addTo(map).bindPopup(`<strong>${ciudad.nombre}</strong>`);

            markersRef.current.push(cityMarker);
        });

        filteredPlaces.forEach((place) => {
            const ciudad = ciudades.find((c) => c.nombre === place.ciudad);
            const placeColor = ciudad?.color || 'var(--color-pink)';

            const customIcon = L.divIcon({
                className: 'place-marker',
                html: `<div style="background: ${placeColor}; width: 35px; height: 35px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
          <span style="font-size: 18px;">📍</span>
        </div>`,
                iconSize: [35, 35],
                iconAnchor: [17.5, 35],
            });

            const marker = L.marker([place.lat, place.lng], { icon: customIcon })
                .addTo(map)
                .bindPopup(`<strong>${place.nombre}</strong><br><small>${place.ciudad} · ${place.categoria}</small>`)
                .on('click', () => setSelectedPlace(place));

            markersRef.current.push(marker);
        });
    }, [filteredPlaces]);

    useEffect(() => {
        if (mapLoaded) {
            initializeMap();
        }
        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [mapLoaded, initializeMap]);

    return (
        <div className="min-h-screen bg-[var(--color-bg)] px-4 py-12 text-[var(--color-text)]">
            <div className="mx-auto max-w-7xl">
                <div className="mb-12 text-center">
                    <h1 className="mb-4 text-4xl font-black md:text-5xl text-[var(--color-text)]">
                        Descubre la región de <span className="text-[var(--color-purple)]">Las Montañas</span>
                    </h1>
                    <p className="mx-auto max-w-2xl text-lg text-[var(--color-text-alt)]">Explora los lugares más fascinantes de Veracruz. Historia, cultura y naturaleza en un solo lugar.</p>
                </div>

                <div className="relative z-10 mb-12 flex flex-wrap items-center justify-center gap-4">
                    <div className="relative">
                        <select
                            value={filterCity}
                            onChange={(e) => setFilterCity(e.target.value)}
                            className="cursor-pointer appearance-none rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] px-6 py-3 pr-12 font-semibold text-[var(--color-text)] shadow-sm focus:ring-2 focus:ring-[var(--color-purple)] focus:outline-none"
                        >
                            <option value="Todas">Todas las ciudades</option>
                            {ciudades.map((ciudad) => (
                                <option key={ciudad.id} value={ciudad.nombre}>
                                    {ciudad.nombre}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-[var(--color-purple)]" />
                    </div>

                    <div className="relative" ref={filterDropdownRef}>
                        <button
                            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                            className="flex items-center gap-2 rounded-2xl bg-[var(--color-purple)] px-6 py-3 font-semibold text-[var(--color-text-on-vivid)] shadow-lg transition-colors hover:opacity-95"
                        >
                            <Filter className="size-5" />
                            <span>Filtrar por tipo</span>
                            <ChevronDown className={`size-5 transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        {showFilterDropdown && (
                            <div className="absolute top-full left-0 z-[100] mt-3 max-h-[350px] min-w-[220px] overflow-x-hidden overflow-y-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] py-3 shadow-xl">
                                {categorias.map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => {
                                            setFilterCategory(cat);
                                            setShowFilterDropdown(false);
                                        }}
                                        className={`w-full px-5 py-3 text-left transition-colors hover:bg-[rgba(var(--rgb-purple-accent),0.1)] ${filterCategory === cat ? 'bg-[rgba(var(--rgb-purple-accent),0.12)] font-semibold text-[var(--color-purple)]' : 'font-medium text-[var(--color-text)]'}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid gap-10 lg:grid-cols-3">
                    <div className="relative lg:col-span-2">
                        <div className="h-[600px] overflow-hidden rounded-[40px] border border-[var(--color-border)] bg-[var(--color-bg-alt)] p-2 shadow-2xl">
                            <div id="altas-montanas-map" className="z-0 h-full w-full rounded-[32px]" />
                            {!mapLoaded && (
                                <div className="absolute inset-0 z-10 flex items-center justify-center bg-[rgba(var(--rgb-bg),0.75)] backdrop-blur-sm">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="size-12 animate-spin rounded-full border-4 border-[rgba(var(--rgb-purple-accent),0.25)] border-t-[var(--color-purple)]" />
                                        <p className="font-semibold text-[var(--color-text-alt)]">Cargando mapa interactivo…</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="scrollbar-thin max-h-[600px] [scrollbar-color:rgba(var(--rgb-purple-accent),0.35)_transparent] space-y-6 overflow-y-auto pr-4">
                        {filteredPlaces.map((place) => {
                            const ciudad = ciudades.find((c) => c.nombre === place.ciudad);
                            return (
                                <button
                                    key={place.id}
                                    type="button"
                                    onClick={() => setSelectedPlace(place)}
                                    className={`w-full text-left rounded-[32px] border-2 bg-[var(--color-bg-alt)] p-5 shadow-lg transition-all hover:scale-[1.02] ${selectedPlace?.id === place.id ? 'border-[var(--color-purple)] shadow-[0_12px_40px_-18px_rgba(var(--rgb-purple-accent),0.35)]' : 'border-transparent hover:border-[rgba(var(--rgb-purple-accent),0.25)]'}`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="flex size-16 items-center justify-center rounded-2xl text-2xl text-[var(--color-text-on-vivid)]" style={{ background: ciudad?.color || 'var(--color-purple)' }}>
                                            <MapPin />
                                        </div>
                                        <div className="flex-1">
                                            <div className="mb-2 flex items-center justify-between">
                                                <h3 className="leading-tight font-semibold text-[var(--color-text)]">{place.nombre}</h3>
                                                <div className="flex items-center gap-1 text-yellow-500">
                                                    <Star className="size-4 fill-yellow-500" />
                                                    <span className="text-sm font-semibold">{place.rating}</span>
                                                </div>
                                            </div>
                                            <div className="mb-3 flex gap-2">
                                                <span className="rounded-full bg-[rgba(var(--rgb-text),0.08)] px-3 py-1 text-[10px] font-black tracking-wider text-[var(--color-text-alt)] uppercase">{place.ciudad}</span>
                                                <span className="rounded-full px-3 py-1 text-[10px] font-black tracking-wider uppercase bg-[rgba(var(--rgb-purple-accent),0.12)] text-[var(--color-purple)]">{place.categoria}</span>
                                            </div>
                                            <p className="mb-3 line-clamp-2 text-sm text-[var(--color-text-alt)]">{place.descripcion}</p>
                                            <div className="flex items-center gap-2 text-xs font-medium text-[var(--color-text-alt)]">
                                                <Clock className="h-3.5 w-3.5" />
                                                <span>{place.horario}</span>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {selectedPlace && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md" role="dialog" aria-modal="true" onClick={() => setSelectedPlace(null)} onKeyDown={(e) => e.key === 'Escape' && setSelectedPlace(null)} tabIndex={-1}>
                    <div className="w-full max-w-2xl overflow-hidden rounded-[48px] border border-[var(--color-border)] bg-[var(--color-bg-alt)] shadow-2xl" role="document" onClick={(e) => e.stopPropagation()}>
                        <div className="relative h-64 sm:h-80">
                            <img src={selectedPlace.imagen} alt={selectedPlace.nombre} className="h-full w-full object-cover" />
                            <button
                                onClick={() => setSelectedPlace(null)}
                                className="absolute top-6 right-6 rounded-full bg-white/20 p-3 text-white backdrop-blur-md transition-colors hover:bg-white/40"
                            >
                                <ChevronDown className="size-6 rotate-180" />
                            </button>
                        </div>
                        <div className="p-8 sm:p-12">
                            <h2 className="mb-4 text-4xl font-black text-[var(--color-text)]">{selectedPlace.nombre}</h2>
                            <div className="mb-6 flex gap-3">
                                <span className="rounded-full bg-[var(--color-purple)] px-4 py-1.5 text-xs font-black tracking-[0.2em] text-[var(--color-text-on-vivid)] uppercase">{selectedPlace.ciudad}</span>
                                <span className="rounded-full bg-[rgba(var(--rgb-purple-accent),0.12)] px-4 py-1.5 text-xs font-black tracking-[0.2em] text-[var(--color-purple)] uppercase">{selectedPlace.categoria}</span>
                            </div>
                            <p className="mb-8 text-lg leading-relaxed text-[var(--color-text-alt)]">{selectedPlace.descripcion}</p>
                            <div className="flex items-center gap-6 font-semibold text-[var(--color-text-alt)]">
                                <div className="flex items-center gap-2">
                                    <Clock className="size-5 text-[var(--color-purple)]" />
                                    <span>{selectedPlace.horario}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Star className="size-5 fill-yellow-500 text-yellow-500" />
                                    <span>{selectedPlace.rating} / 5</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
