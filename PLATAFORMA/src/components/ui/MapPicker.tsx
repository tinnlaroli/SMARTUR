import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface Props {
    lat: number;
    lng: number;
    onChange: (lat: number, lng: number) => void;
}

const OSM_LIGHT_STYLE: maplibregl.StyleSpecification = {
    version: 8,
    sources: {
        osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        },
    },
    layers: [{ id: 'osm', type: 'raster', source: 'osm', minzoom: 0, maxzoom: 19 }],
};

const DARK_STYLE_URL = 'https://tiles.openfreemap.org/styles/dark';

const getStyle = (): maplibregl.StyleSpecification | string =>
    document.documentElement.getAttribute('data-theme') === 'dark' ? DARK_STYLE_URL : OSM_LIGHT_STYLE;

// Default center: Chiapas, México
const DEFAULT_CENTER: [number, number] = [-93.1155, 16.7516];
const DEFAULT_ZOOM = 6;
const SELECTED_ZOOM = 14;

export default function MapPicker({ lat, lng, onChange }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const markerRef = useRef<maplibregl.Marker | null>(null);

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        const hasCoords = lat !== 0 || lng !== 0;
        const center: [number, number] = hasCoords ? [lng, lat] : DEFAULT_CENTER;

        const map = new maplibregl.Map({
            container: containerRef.current,
            style: getStyle(),
            center,
            zoom: hasCoords ? SELECTED_ZOOM : DEFAULT_ZOOM,
            attributionControl: false,
        });

        map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

        const marker = new maplibregl.Marker({ color: '#7c3aed', draggable: true })
            .setLngLat(center)
            .addTo(map);

        if (hasCoords) onChange(lat, lng);

        marker.on('dragend', () => {
            const pos = marker.getLngLat();
            onChange(pos.lat, pos.lng);
        });

        map.on('click', (e) => {
            marker.setLngLat(e.lngLat);
            map.flyTo({ center: e.lngLat, zoom: Math.max(map.getZoom(), SELECTED_ZOOM) });
            onChange(e.lngLat.lat, e.lngLat.lng);
        });

        // Switch tile style when the user toggles the app theme
        const observer = new MutationObserver(() => {
            map.setStyle(getStyle());
        });
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme'],
        });

        mapRef.current = map;
        markerRef.current = marker;

        return () => {
            observer.disconnect();
            map.remove();
            mapRef.current = null;
            markerRef.current = null;
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return <div ref={containerRef} style={{ width: '100%', height: '280px', borderRadius: '12px', overflow: 'hidden' }} />;
}
