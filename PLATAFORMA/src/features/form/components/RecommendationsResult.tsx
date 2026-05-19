import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapPin, Star, Share2, Download, ArrowRight, X, LocateFixed } from 'lucide-react';
import smarturLogo from '../../../assets/landing/logo_costado.png';
import { useTheme } from '../../../contexts/ThemeContext';
import { locationApi } from '../../locations/api/locationApi';
import type { Location } from '../../locations/types/types';
import { Map as InteractiveMap, MapControls, MapMarker, MapPopup, type MapRef } from '../../landing/components/ui/Map';
import '../../landing/styles/Landing.css';
import { poiApi } from '../../points-of-interest/api/poiApi';
import type { POI } from '../../points-of-interest/types/types';
import { touristServiceApi } from '../../tourist-services/api/touristServiceApi';
import type { TouristService } from '../../tourist-services/types/types';
import type { Recommendation, RecommendationsResponse } from '../types/types';
import { useToast } from '../../../shared/context/ToastContext';

interface RecommendationsResultProps {
    recommendations: RecommendationsResponse['recommendations'];
    onClose: () => void;
}

interface RecommendationCatalog {
    services: TouristService[];
    pois: POI[];
    locations: Location[];
}

type CatalogState = 'loading' | 'ready' | 'error';

type ResolvedRecommendation = Recommendation & {
    accentColor: string;
    hasLocation: boolean;
    kindLabel: string;
    locationLabel?: string;
    latitude?: number;
    longitude?: number;
    rank: number;
    scoreLabel: string;
};

const REGION_CENTER = {
    latitude: 18.86,
    longitude: -96.93,
    zoom: 9.8,
    pitch: 26,
    bearing: -10,
};

const PAGE_SIZE = 200;

const MARKER_COLORS = ['var(--color-pink)', 'var(--color-purple)', 'var(--color-cyan)', 'var(--color-green)', 'var(--color-orange)'];

const normalizeSearchKey = (value?: string | number | null) => {
    if (value === null || value === undefined) return '';
    return String(value)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
};

const parseCoordinate = (value?: string | null) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const getEntityLocationId = (entity?: TouristService | POI) => {
    if (!entity) return null;
    if ('id_location' in entity) return entity.id_location;
    if ('locationId' in entity) return entity.locationId;
    return null;
};

const loadCanvasImage = (src: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error(`No se pudo cargar la imagen: ${src}`));
        image.src = src;
    });

const drawRoundedRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
) => {
    const safeRadius = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + safeRadius, y);
    ctx.lineTo(x + width - safeRadius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
    ctx.lineTo(x + width, y + height - safeRadius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
    ctx.lineTo(x + safeRadius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
    ctx.lineTo(x, y + safeRadius);
    ctx.quadraticCurveTo(x, y, x + safeRadius, y);
    ctx.closePath();
};

const fillRoundedRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    fillStyle: string | CanvasGradient,
) => {
    ctx.save();
    drawRoundedRect(ctx, x, y, width, height, radius);
    ctx.fillStyle = fillStyle;
    ctx.fill();
    ctx.restore();
};

const strokeRoundedRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    strokeStyle: string,
    lineWidth = 1,
) => {
    ctx.save();
    drawRoundedRect(ctx, x, y, width, height, radius);
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
    ctx.restore();
};

const wrapCanvasText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
    maxLines = 2,
) => {
    const words = text.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let currentLine = '';

    words.forEach((word) => {
        const nextLine = currentLine ? `${currentLine} ${word}` : word;
        if (ctx.measureText(nextLine).width <= maxWidth) {
            currentLine = nextLine;
            return;
        }

        if (currentLine) lines.push(currentLine);
        currentLine = word;
    });

    if (currentLine) lines.push(currentLine);

    if (lines.length <= maxLines) return lines;

    const trimmed = lines.slice(0, maxLines);
    while (ctx.measureText(`${trimmed[maxLines - 1]}...`).width > maxWidth && trimmed[maxLines - 1].length > 0) {
        trimmed[maxLines - 1] = trimmed[maxLines - 1].slice(0, -1).trim();
    }
    trimmed[maxLines - 1] = `${trimmed[maxLines - 1]}...`;
    return trimmed;
};

const fetchAllTouristServices = async () => {
    const firstPage = await touristServiceApi.findAll(1, PAGE_SIZE);
    if (firstPage.totalPages <= 1) return firstPage.services;

    const restPages = await Promise.all(
        Array.from({ length: firstPage.totalPages - 1 }, (_, index) => touristServiceApi.findAll(index + 2, PAGE_SIZE)),
    );

    return firstPage.services.concat(restPages.flatMap((page) => page.services));
};

const fetchAllPois = async () => {
    const firstPage = await poiApi.findAll(1, PAGE_SIZE);
    if (firstPage.totalPages <= 1) return firstPage.points;

    const restPages = await Promise.all(
        Array.from({ length: firstPage.totalPages - 1 }, (_, index) => poiApi.findAll(index + 2, PAGE_SIZE)),
    );

    return firstPage.points.concat(restPages.flatMap((page) => page.points));
};

const fetchAllLocations = async () => {
    const firstPage = await locationApi.findAll(1, PAGE_SIZE);
    if (firstPage.totalPages <= 1) return firstPage.locations;

    const restPages = await Promise.all(
        Array.from({ length: firstPage.totalPages - 1 }, (_, index) => locationApi.findAll(index + 2, PAGE_SIZE)),
    );

    return firstPage.locations.concat(restPages.flatMap((page) => page.locations));
};

export const RecommendationsResult: React.FC<RecommendationsResultProps> = ({ recommendations, onClose }) => {
    const toast = useToast();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [catalogState, setCatalogState] = useState<CatalogState>('loading');
    const [catalog, setCatalog] = useState<RecommendationCatalog>({
        services: [],
        pois: [],
        locations: [],
    });
    const topFive = recommendations.slice(0, 5);
    const mapRef = useRef<MapRef | null>(null);
    const cardRefs = useRef<Array<HTMLButtonElement | null>>([]);

    const formattedRecommendations = useMemo(() => {
        return topFive.map((rec, index) => {
            const title = rec.title || 'Destino Turistico';
            const score = Number.isFinite(rec.score) ? rec.score.toFixed(3) : '0.000';
            const kind = rec.kind === 'svc' ? 'Servicio Turistico' : 'Punto de Interes';
            return `${index + 1}. ${title} (${kind}) - ${score}`;
        });
    }, [topFive]);

    const resolvedRecommendations = useMemo<ResolvedRecommendation[]>(() => {
        const serviceById = new Map(catalog.services.map((service) => [String(service.id), service]));
        const serviceByName = new Map(catalog.services.map((service) => [normalizeSearchKey(service.name), service]));
        const poiById = new Map(catalog.pois.map((poi) => [String(poi.id), poi]));
        const poiByName = new Map(catalog.pois.map((poi) => [normalizeSearchKey(poi.name), poi]));
        const locationById = new Map(catalog.locations.map((location) => [location.id, location]));
        const locationByName = new Map(catalog.locations.map((location) => [normalizeSearchKey(location.name), location]));

        return topFive.map((recommendation, index) => {
            const candidateIds = Array.from(
                new Set(
                    [
                        String(recommendation.item_id ?? '').trim(),
                        String(recommendation.item_id ?? '')
                            .match(/\d+/)?.[0]
                            ?.trim() ?? '',
                    ].filter(Boolean),
                ),
            );

            const normalizedTitle = normalizeSearchKey(recommendation.title);
            const serviceMatchById = candidateIds.map((id) => serviceById.get(id)).find(Boolean);
            const poiMatchById = candidateIds.map((id) => poiById.get(id)).find(Boolean);
            const serviceMatch = serviceMatchById ?? serviceByName.get(normalizedTitle);
            const poiMatch = poiMatchById ?? poiByName.get(normalizedTitle);

            const matchedEntity =
                recommendation.kind === 'svc'
                    ? serviceMatch ?? poiMatch
                    : poiMatch ?? serviceMatch;

            const matchedLocationId = getEntityLocationId(matchedEntity);
            const matchedLocation = matchedLocationId ? locationById.get(matchedLocationId) : locationByName.get(normalizedTitle);

            const latitude = parseCoordinate(matchedLocation?.latitude);
            const longitude = parseCoordinate(matchedLocation?.longitude);
            const hasLocation = latitude !== null && longitude !== null;

            return {
                ...recommendation,
                accentColor: MARKER_COLORS[index % MARKER_COLORS.length],
                hasLocation,
                kindLabel: recommendation.kind === 'svc' ? 'Servicio Turistico' : 'Punto de Interes',
                locationLabel: matchedLocation
                    ? [matchedLocation.name, matchedLocation.municipality || matchedLocation.state].filter(Boolean).join(' · ')
                    : undefined,
                latitude: hasLocation ? latitude ?? undefined : undefined,
                longitude: hasLocation ? longitude ?? undefined : undefined,
                rank: index + 1,
                scoreLabel: Number.isFinite(recommendation.score) ? recommendation.score.toFixed(3) : '0.000',
            };
        });
    }, [catalog.locations, catalog.pois, catalog.services, topFive]);

    const locatedRecommendations = useMemo(
        () => resolvedRecommendations.filter((recommendation) => recommendation.hasLocation),
        [resolvedRecommendations],
    );

    const activeIndex = hoveredIndex ?? selectedIndex;
    const activeRecommendation = resolvedRecommendations[activeIndex] ?? null;
    const selectedRecommendation = resolvedRecommendations[selectedIndex] ?? null;

    const resetMapView = useCallback(
        (targetMap?: MapRef | null) => {
            const map = targetMap ?? mapRef.current;
            if (!map) return;

            if (locatedRecommendations.length === 0) {
                map.flyTo({
                    center: [REGION_CENTER.longitude, REGION_CENTER.latitude],
                    zoom: REGION_CENTER.zoom,
                    pitch: REGION_CENTER.pitch,
                    bearing: REGION_CENTER.bearing,
                    speed: 0.8,
                    curve: 1.15,
                    essential: true,
                });
                return;
            }

            if (locatedRecommendations.length === 1) {
                const [recommendation] = locatedRecommendations;
                map.flyTo({
                    center: [recommendation.longitude!, recommendation.latitude!],
                    zoom: 13.4,
                    pitch: 34,
                    bearing: -12,
                    speed: 0.8,
                    curve: 1.15,
                    essential: true,
                });
                return;
            }

            const bounds = locatedRecommendations.reduce(
                (accumulator, recommendation) => ({
                    minLat: Math.min(accumulator.minLat, recommendation.latitude!),
                    maxLat: Math.max(accumulator.maxLat, recommendation.latitude!),
                    minLng: Math.min(accumulator.minLng, recommendation.longitude!),
                    maxLng: Math.max(accumulator.maxLng, recommendation.longitude!),
                }),
                {
                    minLat: locatedRecommendations[0].latitude!,
                    maxLat: locatedRecommendations[0].latitude!,
                    minLng: locatedRecommendations[0].longitude!,
                    maxLng: locatedRecommendations[0].longitude!,
                },
            );

            map.fitBounds(
                [
                    [bounds.minLng, bounds.minLat],
                    [bounds.maxLng, bounds.maxLat],
                ],
                {
                    padding: 72,
                    maxZoom: 12.2,
                    duration: 1200,
                    essential: true,
                },
            );
        },
        [locatedRecommendations],
    );

    const focusRecommendation = useCallback(
        (index: number, options?: { scroll?: boolean }) => {
            const recommendation = resolvedRecommendations[index];
            if (!recommendation) return;

            setSelectedIndex(index);
            setHoveredIndex(null);

            if (recommendation.hasLocation && mapRef.current) {
                mapRef.current.flyTo({
                    center: [recommendation.longitude!, recommendation.latitude!],
                    zoom: 13.6,
                    pitch: 40,
                    bearing: -14,
                    speed: 0.85,
                    curve: 1.2,
                    essential: true,
                });
            }

            if (options?.scroll !== false) {
                cardRefs.current[index]?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                });
            }
        },
        [resolvedRecommendations],
    );

    useEffect(() => {
        setSelectedIndex(0);
        setHoveredIndex(null);
    }, [recommendations]);

    useEffect(() => {
        let cancelled = false;

        const loadCatalog = async () => {
            setCatalogState('loading');
            try {
                const [services, pois, locations] = await Promise.all([fetchAllTouristServices(), fetchAllPois(), fetchAllLocations()]);
                if (cancelled) return;

                setCatalog({ services, pois, locations });
                setCatalogState('ready');
            } catch (error) {
                if (cancelled) return;
                setCatalogState('error');
                toast.warning('Mapa parcial', 'No se pudieron resolver todas las ubicaciones para las recomendaciones');
            }
        };

        loadCatalog();

        return () => {
            cancelled = true;
        };
    }, [toast]);

    useEffect(() => {
        if (!mapRef.current) return;
        resetMapView();
    }, [resetMapView]);

    const buildShareText = () => {
        return ['Recomendaciones SMARTUR', ...formattedRecommendations].join('\n');
    };

    const downloadImage = async () => {
        const title = 'Itinerario recomendado';
        const subtitle = 'Ruta sugerida por SMARTUR para tu proxima experiencia';
        const width = 1080;
        const height = 1480;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            toast.error('No se pudo generar la imagen', 'Tu navegador no soporta canvas');
            return;
        }

        try {
            const logo = await loadCanvasImage(smarturLogo);
            const itineraryItems = resolvedRecommendations.slice(0, 5);

            const background = ctx.createLinearGradient(0, 0, width, height);
            background.addColorStop(0, '#09090f');
            background.addColorStop(0.45, '#101425');
            background.addColorStop(1, '#0a0d18');
            ctx.fillStyle = background;
            ctx.fillRect(0, 0, width, height);

            const glowA = ctx.createRadialGradient(170, 140, 40, 170, 140, 320);
            glowA.addColorStop(0, 'rgba(236, 72, 153, 0.28)');
            glowA.addColorStop(1, 'rgba(236, 72, 153, 0)');
            ctx.fillStyle = glowA;
            ctx.fillRect(0, 0, width, height);

            const glowB = ctx.createRadialGradient(910, 240, 30, 910, 240, 360);
            glowB.addColorStop(0, 'rgba(59, 130, 246, 0.24)');
            glowB.addColorStop(1, 'rgba(59, 130, 246, 0)');
            ctx.fillStyle = glowB;
            ctx.fillRect(0, 0, width, height);

            fillRoundedRect(ctx, 54, 54, width - 108, height - 108, 36, 'rgba(8, 12, 24, 0.82)');
            strokeRoundedRect(ctx, 54, 54, width - 108, height - 108, 36, 'rgba(255,255,255,0.09)', 2);

            fillRoundedRect(ctx, 86, 84, width - 172, 235, 30, 'rgba(255,255,255,0.04)');
            strokeRoundedRect(ctx, 86, 84, width - 172, 235, 30, 'rgba(255,255,255,0.08)', 1.5);

            fillRoundedRect(ctx, 110, 108, 210, 68, 22, 'rgba(255,255,255,0.06)');
            ctx.drawImage(logo, 128, 122, 174, 38);

            fillRoundedRect(ctx, 736, 112, 238, 42, 21, 'rgba(139, 92, 246, 0.18)');
            ctx.fillStyle = '#ddd6fe';
            ctx.font = '600 18px Inter, ui-sans-serif, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Itinerario personalizado', 855, 139);
            ctx.textAlign = 'left';

            ctx.fillStyle = '#ffffff';
            ctx.font = '700 52px Inter, ui-sans-serif, system-ui, sans-serif';
            ctx.fillText(title, 110, 228);

            ctx.fillStyle = '#a1a1aa';
            ctx.font = '24px Inter, ui-sans-serif, system-ui, sans-serif';
            ctx.fillText(subtitle, 110, 270);

            fillRoundedRect(ctx, 110, 340, 250, 46, 23, 'rgba(236, 72, 153, 0.14)');
            ctx.fillStyle = '#fbcfe8';
            ctx.font = '600 18px Inter, ui-sans-serif, system-ui, sans-serif';
            ctx.fillText(`${itineraryItems.length} lugares sugeridos`, 138, 370);

            fillRoundedRect(ctx, 376, 340, 300, 46, 23, 'rgba(59, 130, 246, 0.14)');
            ctx.fillStyle = '#bfdbfe';
            ctx.fillText('Orden recomendado para explorar', 404, 370);

            fillRoundedRect(ctx, 692, 340, 282, 46, 23, 'rgba(34, 197, 94, 0.14)');
            ctx.fillStyle = '#bbf7d0';
            ctx.fillText('Comparte y guarda tu ruta', 720, 370);

            ctx.strokeStyle = 'rgba(255,255,255,0.14)';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(142, 446);
            ctx.lineTo(142, height - 200);
            ctx.stroke();

            itineraryItems.forEach((recommendation, index) => {
                const cardY = 430 + index * 178;
                const cardHeight = 144;
                const cardX = 188;
                const cardWidth = width - 290;
                const badgeColor = recommendation.accentColor
                    .replace('var(--color-pink)', '#ec4899')
                    .replace('var(--color-purple)', '#8b5cf6')
                    .replace('var(--color-cyan)', '#06b6d4')
                    .replace('var(--color-green)', '#22c55e')
                    .replace('var(--color-orange)', '#f97316');

                const cardGradient = ctx.createLinearGradient(cardX, cardY, cardX + cardWidth, cardY + cardHeight);
                cardGradient.addColorStop(0, 'rgba(255,255,255,0.065)');
                cardGradient.addColorStop(1, 'rgba(255,255,255,0.03)');
                fillRoundedRect(ctx, cardX, cardY, cardWidth, cardHeight, 26, cardGradient);
                strokeRoundedRect(ctx, cardX, cardY, cardWidth, cardHeight, 26, 'rgba(255,255,255,0.08)', 1.5);

                fillRoundedRect(ctx, 112, cardY + 40, 60, 60, 30, badgeColor);
                ctx.fillStyle = '#ffffff';
                ctx.font = '700 24px Inter, ui-sans-serif, system-ui, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(String(recommendation.rank), 142, cardY + 78);
                ctx.textAlign = 'left';

                ctx.fillStyle = '#ffffff';
                ctx.font = '700 31px Inter, ui-sans-serif, system-ui, sans-serif';
                const titleLines = wrapCanvasText(ctx, recommendation.title || 'Destino Turistico', 520, 2);
                titleLines.forEach((line, lineIndex) => {
                    ctx.fillText(line, cardX + 34, cardY + 46 + lineIndex * 34);
                });

                fillRoundedRect(ctx, cardX + 34, cardY + 90, 210, 32, 16, 'rgba(139, 92, 246, 0.14)');
                ctx.fillStyle = '#ddd6fe';
                ctx.font = '600 16px Inter, ui-sans-serif, system-ui, sans-serif';
                ctx.fillText(recommendation.kindLabel, cardX + 52, cardY + 112);

                fillRoundedRect(ctx, cardX + cardWidth - 126, cardY + 28, 92, 40, 20, 'rgba(245, 158, 11, 0.14)');
                ctx.fillStyle = '#fcd34d';
                ctx.font = '700 16px Inter, ui-sans-serif, system-ui, sans-serif';
                ctx.fillText(`★ ${recommendation.scoreLabel}`, cardX + cardWidth - 104, cardY + 53);

                ctx.fillStyle = '#a1a1aa';
                ctx.font = '500 18px Inter, ui-sans-serif, system-ui, sans-serif';
                const locationText = recommendation.locationLabel || 'Ubicacion por confirmar';
                const locationLines = wrapCanvasText(ctx, locationText, 300, 2);
                locationLines.forEach((line, lineIndex) => {
                    ctx.fillText(line, cardX + 34, cardY + 142 + lineIndex * 22);
                });
            });

            fillRoundedRect(ctx, 86, height - 162, width - 172, 76, 28, 'rgba(255,255,255,0.04)');
            strokeRoundedRect(ctx, 86, height - 162, width - 172, 76, 28, 'rgba(255,255,255,0.08)', 1.2);

            ctx.fillStyle = '#e4e4e7';
            ctx.font = '600 22px Inter, ui-sans-serif, system-ui, sans-serif';
            ctx.fillText('SMARTUR · Recomendaciones inteligentes para planear tu recorrido', 118, height - 118);

            ctx.fillStyle = '#71717a';
            ctx.font = '16px Inter, ui-sans-serif, system-ui, sans-serif';
            ctx.fillText('Comparte esta imagen o descarga tu lista para tenerla a la mano durante tu viaje.', 118, height - 92);

            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = 'itinerario-smartur.png';
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('Descarga iniciada', 'Se genero tu itinerario visual con SMARTUR');
        } catch (error) {
            toast.error('No se pudo generar la imagen', 'Ocurrio un problema al preparar el itinerario descargable');
        }
    };

    const handleDownload = () => {
        downloadImage();
    };

    const handleShare = async () => {
        const text = buildShareText();
        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'Recomendaciones SMARTUR',
                    text,
                });
                toast.success('Compartido', 'Se envio el resumen de recomendaciones');
                return;
            }
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(text);
                toast.success('Copiado', 'Se copio el resumen al portapapeles');
                return;
            }
            toast.warning('No disponible', 'Tu navegador no permite compartir ni copiar');
        } catch (error) {
            toast.error('No se pudo compartir', 'Intenta nuevamente o descarga el archivo');
        }
    };

    return (
        <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md duration-300">
            <div className="animate-in zoom-in-95 relative flex h-[92vh] max-h-[860px] w-full max-w-[1380px] flex-col overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-2xl duration-300 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex items-start justify-between gap-4 border-b border-zinc-200 bg-white/85 p-6 backdrop-blur-xl md:p-8 dark:border-zinc-800 dark:bg-zinc-950/80">
                    <div className="flex items-start gap-4">
                        <div className="flex size-12 items-center justify-center rounded-2xl bg-violet-600 shadow-lg shadow-violet-500/20">
                            <MapPin className="size-6 text-white" />
                        </div>
                        <div className="space-y-3">
                            <div>
                                <h2 className="text-2xl font-semibold text-zinc-950 dark:text-white">Tus recomendaciones</h2>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">Explora el mapa y selecciona cada lugar desde la lista lateral.</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1 text-[11px] font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                                    {topFive.length} lugares recomendados
                                </span>
                                <span className="rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1 text-[11px] font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                                    {locatedRecommendations.length} con ubicacion en mapa
                                </span>
                                {selectedRecommendation && (
                                    <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[11px] font-semibold text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300">
                                        Seleccion actual: {selectedRecommendation.title || 'Destino Turistico'}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-zinc-500 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    >
                        <X className="size-6" />
                    </button>
                </div>

                <div className="flex-1 min-h-0 overflow-hidden p-6 md:p-8">
                    <div className="grid h-full min-h-0 grid-rows-[minmax(0,0.95fr)_minmax(0,1.05fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:grid-rows-1 xl:grid-cols-[minmax(0,1.35fr)_380px]">
                        <div className="flex min-h-0 flex-col gap-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                    Selecciona un card para centrarlo en el mapa. Al pasar el cursor, el punto correspondiente se ilumina.
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => resetMapView()}
                                        className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                                    >
                                        <LocateFixed className="size-4" />
                                        <span>Ver todos</span>
                                    </button>
                                </div>
                            </div>

                            <div className="relative min-h-0 flex-1 overflow-hidden rounded-[28px] border border-zinc-200 bg-zinc-50 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
                                <div className="relative h-full min-h-[360px]">
                                    <InteractiveMap
                                        initialViewport={REGION_CENTER}
                                        className="h-full w-full !rounded-[26px] !border-none mapcn-surface"
                                        attributionControl={false}
                                        mapStyle={
                                            isDark
                                                ? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
                                                : 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json'
                                        }
                                        interactive={true}
                                        scrollZoom={false}
                                        onLoad={(map) => {
                                            mapRef.current = map;
                                            resetMapView(map);
                                        }}
                                    >
                                        <MapControls showCompass={false} showGeolocate={false} showFullscreen={false} />

                                        {locatedRecommendations.map((recommendation) => {
                                            const recommendationIndex = recommendation.rank - 1;
                                            const isActive = activeIndex === recommendationIndex;
                                            const isSelected = selectedIndex === recommendationIndex;

                                            return (
                                                <React.Fragment key={`${recommendation.item_id}-${recommendation.rank}`}>
                                                    <MapMarker
                                                        latitude={recommendation.latitude!}
                                                        longitude={recommendation.longitude!}
                                                        onClick={() => focusRecommendation(recommendationIndex)}
                                                        className="group"
                                                    >
                                                        <div className="relative flex items-center justify-center -translate-y-1/2 transition-all duration-300">
                                                            <div
                                                                className={`absolute rounded-full blur-md transition-all duration-300 ${
                                                                    isActive ? 'size-14 opacity-70' : isSelected ? 'size-12 opacity-55' : 'size-10 opacity-35'
                                                                }`}
                                                                style={{ background: recommendation.accentColor }}
                                                            />
                                                            <div
                                                                className={`absolute rounded-full ${isActive ? 'size-10 opacity-30' : 'size-8 opacity-15'} ${isActive || isSelected ? 'animate-ping' : ''}`}
                                                                style={{ background: recommendation.accentColor }}
                                                            />
                                                            <div
                                                                className={`relative flex items-center justify-center rounded-full border text-[11px] font-black text-white transition-all duration-300 ${
                                                                    isActive ? 'size-10 scale-110 border-white shadow-[0_0_28px_rgba(0,0,0,0.55)]' : 'size-8 border-white/85'
                                                                }`}
                                                                style={{
                                                                    background: recommendation.accentColor,
                                                                    boxShadow: `0 0 20px ${recommendation.accentColor}AA`,
                                                                }}
                                                            >
                                                                {recommendation.rank}
                                                            </div>
                                                        </div>
                                                    </MapMarker>

                                                    {activeRecommendation?.item_id === recommendation.item_id && (
                                                        <MapPopup
                                                            latitude={recommendation.latitude!}
                                                            longitude={recommendation.longitude!}
                                                            onClose={() => setHoveredIndex(null)}
                                                            className={isDark ? 'mapcn-dark-popup' : undefined}
                                                            options={{ offset: 16, closeButton: false }}
                                                        >
                                                            <div className="min-w-[190px] p-1">
                                                                <div className="mb-2 flex items-center gap-2.5">
                                                                    <div
                                                                        className="h-2.5 w-2.5 rounded-full shadow-[0_0_10px_currentColor]"
                                                                        style={{ background: recommendation.accentColor, color: recommendation.accentColor }}
                                                                    />
                                                                    <span className={`text-sm font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                                                                        {recommendation.title || 'Destino Turistico'}
                                                                    </span>
                                                                </div>
                                                                <div className={`flex items-center gap-2 text-[11px] font-medium ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                                                                    <span>{recommendation.kindLabel}</span>
                                                                    <span>•</span>
                                                                    <span>Score {recommendation.scoreLabel}</span>
                                                                </div>
                                                            </div>
                                                        </MapPopup>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                    </InteractiveMap>

                                    <div className="absolute left-6 top-6 z-10 min-w-[220px] rounded-2xl p-5 mapcn-panel">
                                        <p className={`mb-1 text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-zinc-500' : 'text-slate-600'}`}>
                                            Visualizacion
                                        </p>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span
                                                className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                                                    isDark ? 'border-white/10 bg-zinc-900/70 text-zinc-300' : 'border-black/10 bg-white/80 text-slate-700'
                                                }`}
                                            >
                                                {catalogState === 'loading' ? 'Ubicando puntos...' : `${locatedRecommendations.length}/${topFive.length} visibles`}
                                            </span>
                                            {activeRecommendation && (
                                                <span
                                                    className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                                                        isDark ? 'border-white/10 bg-zinc-900/70 text-zinc-300' : 'border-black/10 bg-white/80 text-slate-700'
                                                    }`}
                                                >
                                                    Foco: #{activeRecommendation.rank}
                                                </span>
                                            )}
                                        </div>
                                        <p className={`mt-3 text-xs leading-relaxed ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                                            {activeRecommendation?.title
                                                ? `Actualmente enfocado: ${activeRecommendation.title}.`
                                                : 'Explora los puntos y usa la lista lateral para comparar recomendaciones.'}
                                        </p>
                                    </div>

                                    <div className="absolute bottom-6 right-6 z-10 max-w-[280px] rounded-xl px-4 py-3 text-left mapcn-panel">
                                        <p className={`mb-1 text-[10px] font-black uppercase tracking-[0.18em] ${isDark ? 'text-zinc-500' : 'text-slate-600'}`}>
                                            Estado del mapa
                                        </p>
                                        <p className={`text-xs leading-relaxed ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                                            {catalogState === 'loading'
                                                ? 'Buscando las ubicaciones de los lugares recomendados...'
                                                : catalogState === 'error'
                                                  ? 'No fue posible ubicar todos los lugares, pero la lista sigue disponible.'
                                                  : 'El estilo del mapa cambia automaticamente entre modo claro y oscuro.'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[28px] border border-zinc-200 bg-zinc-50 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
                            <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
                                <h3 className="text-lg font-semibold text-zinc-950 dark:text-zinc-100">Lugares recomendados</h3>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">Esta seccion tiene su propio scroll para que el mapa permanezca siempre visible.</p>
                            </div>

                            <div className="flex-1 min-h-0 space-y-4 overflow-y-auto overscroll-contain p-4 md:p-5">
                                {resolvedRecommendations.map((recommendation, index) => {
                                    const isSelected = selectedIndex === index;
                                    const isActive = activeIndex === index;

                                    return (
                                        <button
                                            key={recommendation.item_id || index}
                                            ref={(element) => {
                                                cardRefs.current[index] = element;
                                            }}
                                            type="button"
                                            onClick={() => focusRecommendation(index)}
                                            onMouseEnter={() => setHoveredIndex(index)}
                                            onMouseLeave={() => setHoveredIndex((current) => (current === index ? null : current))}
                                            onFocus={() => setHoveredIndex(index)}
                                            onBlur={() => setHoveredIndex((current) => (current === index ? null : current))}
                                            className={`group relative w-full overflow-hidden rounded-[26px] border text-left transition-all duration-300 ${
                                                isSelected
                                                    ? 'border-violet-400/60 ring-2 ring-violet-500/25 shadow-[0_24px_60px_-28px_rgba(139,92,246,0.55)]'
                                                    : isActive
                                                      ? 'border-zinc-300 shadow-lg dark:border-zinc-700'
                                                      : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700'
                                            } bg-white dark:bg-zinc-950`}
                                        >
                                            <div className="absolute inset-y-0 left-0 w-1.5" style={{ background: recommendation.accentColor }} />

                                            <div className="flex gap-4 p-4">
                                                <div className="relative size-24 shrink-0 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900">
                                                    {recommendation.image_url ? (
                                                        <img
                                                            src={recommendation.image_url}
                                                            alt={recommendation.title || 'Imagen del lugar'}
                                                            className="absolute inset-0 h-full w-full object-cover"
                                                            loading="lazy"
                                                        />
                                                    ) : (
                                                        <div className="absolute inset-0 bg-violet-600/20 dark:bg-violet-500/25" />
                                                    )}
                                                    {!recommendation.image_url && (
                                                        <div className="absolute inset-0 bg-black/30" />
                                                    )}
                                                    <div className="absolute left-3 top-3 flex size-8 items-center justify-center rounded-2xl border border-white/20 bg-black/35 text-xs font-bold text-white">
                                                        {recommendation.rank}
                                                    </div>
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <div className="mb-2 flex items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <div className="mb-2 flex items-center gap-2">
                                                                <span
                                                                    className="h-2.5 w-2.5 rounded-full shadow-[0_0_12px_currentColor]"
                                                                    style={{ background: recommendation.accentColor, color: recommendation.accentColor }}
                                                                />
                                                                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                                                                    Recomendacion #{recommendation.rank}
                                                                </span>
                                                            </div>
                                                            <h4 className="line-clamp-2 text-lg font-semibold text-zinc-950 transition-colors group-hover:text-violet-600 dark:text-zinc-100 dark:group-hover:text-violet-300">
                                                                {recommendation.title || 'Destino Turistico'}
                                                            </h4>
                                                        </div>
                                                        <div className="flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                                                            <Star className="size-4 fill-current" />
                                                            <span className="text-xs font-semibold">{recommendation.scoreLabel}</span>
                                                        </div>
                                                    </div>

                                                    <div className="mb-3 flex flex-wrap gap-2">
                                                        <span className="rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1 text-[10px] font-black tracking-wider text-zinc-600 uppercase dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                                                            {recommendation.kindLabel}
                                                        </span>
                                                        <span
                                                            className={`rounded-full border px-3 py-1 text-[10px] font-black tracking-wider uppercase ${
                                                                recommendation.hasLocation
                                                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300'
                                                                    : 'border-zinc-200 bg-zinc-100 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400'
                                                            }`}
                                                        >
                                                            {recommendation.hasLocation ? 'Visible en mapa' : 'Sin punto disponible'}
                                                        </span>
                                                    </div>

                                                    <p className="line-clamp-3 text-sm text-zinc-600 dark:text-zinc-400">
                                                        {recommendation.description || 'Una experiencia unica te espera en este destino seleccionado por SMARTUR.'}
                                                    </p>

                                                    <div className="mt-4 flex items-center justify-between gap-3 text-xs">
                                                        <div className="flex min-w-0 items-center gap-2 text-zinc-500 dark:text-zinc-400">
                                                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                                                            <span className="truncate">
                                                                {recommendation.locationLabel || 'No se encontro una ubicacion exacta en el catalogo'}
                                                            </span>
                                                        </div>
                                                        <span className="font-semibold text-violet-600 dark:text-violet-300">
                                                            {isSelected ? 'Seleccionado' : isActive ? 'En foco' : 'Ver en mapa'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-between gap-4 border-t border-zinc-200 bg-zinc-50 p-6 md:p-8 sm:flex-row dark:border-zinc-800 dark:bg-zinc-900/60">
                    <div className="flex gap-4">
                        <button
                            onClick={handleDownload}
                            className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-6 py-3 font-semibold text-zinc-900 transition-all hover:bg-zinc-100 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
                        >
                            <Download className="size-5" />
                            <span>Descargar</span>
                        </button>
                        <button
                            onClick={handleShare}
                            className="flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-6 py-3 font-semibold text-violet-700 transition-all hover:bg-violet-100 active:scale-95 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300 dark:hover:bg-violet-500/15"
                        >
                            <Share2 className="size-5" />
                            <span>Compartir</span>
                        </button>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex items-center gap-2 rounded-xl bg-violet-600 px-10 py-3 font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:bg-violet-500 active:scale-95"
                    >
                        <span>Finalizar</span>
                        <ArrowRight className="size-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};
