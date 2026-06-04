import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Map, MapMarker, MapPopup, MapControls } from './ui/Map';
import type { MapRef } from './ui/Map';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { prefersReducedMotion } from '../utils/motion';

gsap.registerPlugin(ScrollTrigger);

/**
 * Converts a string containing <span style="color:X">text</span> segments into
 * React elements, avoiding dangerouslySetInnerHTML.
 */
function renderTitle(raw: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const spanRe = /<span\s+style="color:([^"]+)">([^<]*)<\/span>/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let idx = 0;
  while ((match = spanRe.exec(raw)) !== null) {
    if (match.index > last) {
      parts.push(raw.slice(last, match.index));
    }
    parts.push(
      <span key={idx} style={{ color: match[1] }}>
        {match[2]}
      </span>,
    );
    idx += 1;
    last = spanRe.lastIndex;
  }
  if (last < raw.length) {
    parts.push(raw.slice(last));
  }
  return parts;
}

// Municipalities of the Altas Montañas region, Veracruz
const MUNICIPIOS = [
  { id: 'cordoba',    nombre: 'Córdoba',               lat: 18.8842, lng: -96.9256, color: 'var(--color-pink)' },
  { id: 'orizaba',   nombre: 'Orizaba',                lat: 18.8522, lng: -97.0994, color: 'var(--color-purple)' },
  { id: 'fortín',    nombre: 'Fortín de las Flores',   lat: 18.9061, lng: -96.9981, color: 'var(--color-cyan)' },
  { id: 'ixtaczq',   nombre: 'Ixtaczoquitlán',         lat: 18.8167, lng: -97.0667, color: 'var(--color-green)' },
  { id: 'cuitlahuac',nombre: 'Cuitláhuac',             lat: 18.8131, lng: -96.7222, color: 'var(--color-orange)' },
  { id: 'amatlan',   nombre: 'Amatlán de los Reyes',   lat: 18.8333, lng: -96.9167, color: 'var(--color-pink)' },
  { id: 'yanga',     nombre: 'Yanga',                  lat: 18.8333, lng: -96.8000, color: 'var(--color-purple)' },
  { id: 'cotel',     nombre: 'Cotepeque',              lat: 18.9000, lng: -97.0500, color: 'var(--color-cyan)' },
  { id: 'nogales',   nombre: 'Nogales',                lat: 18.8167, lng: -97.1667, color: 'var(--color-orange)' },
  { id: 'camerino',  nombre: 'Camerino Z. Mendoza',    lat: 18.9333, lng: -97.0667, color: 'var(--color-purple)' },
];

// Center of the Altas Montañas region
const REGION_CENTER = {
  latitude: 18.8600,
  longitude: -96.9300,
  zoom: 9.8,
  pitch: 30,
  bearing: -10
};

export const VideoSection: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapRef | null>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { t } = useLanguage();
  const [activePopup, setActivePopup] = useState<string | null>(null);

  const handleMarkerClick = React.useCallback((id: string) => {
    setActivePopup(id);
  }, []);

  const focusMunicipio = React.useCallback((id: string) => {
    const municipio = MUNICIPIOS.find((m) => m.id === id);
    if (!municipio || !mapRef.current) return;

    mapRef.current.flyTo({
      center: [municipio.lng, municipio.lat],
      zoom: 11.8,
      pitch: 42,
      bearing: -14,
      speed: 0.9,
      curve: 1.25,
      essential: true,
    });
    setActivePopup(id);
  }, []);

  const resetView = React.useCallback(() => {
    if (!mapRef.current) return;
    mapRef.current.flyTo({
      center: [REGION_CENTER.longitude, REGION_CENTER.latitude],
      zoom: REGION_CENTER.zoom,
      pitch: REGION_CENTER.pitch,
      bearing: REGION_CENTER.bearing,
      speed: 0.8,
      curve: 1.1,
      essential: true,
    });
    setActivePopup(null);
  }, []);

  const selectedMunicipio = React.useMemo(
    () => MUNICIPIOS.find((m) => m.id === activePopup) ?? null,
    [activePopup]
  );

  useEffect(() => {
    const section = sectionRef.current;
    const container = containerRef.current;
    if (!section || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      if (container && !window.matchMedia('(max-width: 767px)').matches) {
        gsap.fromTo(
          container,
          { scale: 0.9, borderRadius: '2rem' },
          {
            scale: 1,
            borderRadius: '0.75rem',
            ease: 'none',
            scrollTrigger: {
              trigger: section,
              start: 'top bottom',
              end: 'center center',
              scrub: 1,
            },
          },
        );
      }

      const titleEl = section.querySelector('.title');
      const descEl = section.querySelector('.description');
      [titleEl, descEl].forEach((el, i) => {
        if (!el) return;
        gsap.fromTo(
          el,
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1,
            delay: i * 0.15,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none', once: true },
          },
        );
      });
    }, section);

    return () => ctx.revert();
  }, []);

    return (
    <section
      ref={sectionRef}
      className="video-section relative overflow-x-clip py-12 sm:py-16 md:py-24"
      style={{ background: 'var(--color-bg)', color: 'var(--color-text)' }}
    >
      <div className="landing-container container mx-auto w-full max-w-[1240px] px-4 text-center sm:px-6">
        <div className="header mb-8 sm:mb-12">
          <h2
            className="title landing-heading mb-4 text-[clamp(1.75rem,5vw,3.75rem)] font-black leading-tight sm:mb-6"
            style={{ color: 'var(--color-text)' }}
          >
            {renderTitle(t('map.header.titleHtml'))}
          </h2>
          <p className="description mx-auto max-w-3xl text-base leading-relaxed sm:text-lg md:text-xl" style={{ color: 'var(--color-text-alt)' }}>
            {t('map.header.description')}
          </p>
        </div>

        <div
          ref={containerRef}
          className="map-container relative mx-auto max-w-[1000px] overflow-hidden rounded-2xl border border-[var(--color-border)] shadow-[0_0_50px_rgba(var(--rgb-text),0.12)] transition-all duration-500 sm:rounded-3xl"
          style={{ height: 'clamp(240px, 58vw, 560px)' }}
        >
          <Map
            initialViewport={REGION_CENTER}
            className="w-full h-full mapcn-surface"
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
            }}
          >
            <MapControls showCompass={false} showGeolocate={false} />
            
            {MUNICIPIOS.map((mun) => (
              <React.Fragment key={mun.id}>
                <MapMarker
                  latitude={mun.lat}
                  longitude={mun.lng}
                  onClick={() => handleMarkerClick(mun.id)}
                  className="group"
                >
                  <div className="relative flex items-center justify-center -translate-y-1/2 transition-all duration-300">
                    <div 
                      className="absolute inset-0 size-8 rounded-full opacity-30 blur-md transition-opacity group-hover:opacity-60"
                      style={{ background: mun.color }}
                    />
                    
                    <div 
                      className="absolute size-6 rounded-full opacity-20 animate-ping"
                      style={{ background: mun.color }}
                    />
                    
                    <div 
                      className="marker-pro relative size-4 rounded-full border-2 border-white/90 shadow-[0_0_15px_rgba(0,0,0,1)] transition-all duration-300"
                      style={{ 
                        background: mun.color,
                        boxShadow: `0 0 20px ${mun.color}CC` 
                      }}
                    />
                  </div>
                </MapMarker>

                {activePopup === mun.id && (
                  <MapPopup
                    latitude={mun.lat}
                    longitude={mun.lng}
                    onClose={() => setActivePopup(null)}
                    className={isDark ? 'mapcn-dark-popup' : undefined}
                    options={{ offset: 16, closeButton: false }}
                  >
                    <div className="p-1 min-w-[140px]">
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <div className="size-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ background: mun.color, color: mun.color }} />
                        <span className="font-bold text-sm text-[var(--color-text)]">{mun.nombre}</span>
                      </div>
                      <p className="text-[11px] font-medium text-[var(--color-text-alt)]">
                        {t('map.popup.subtitle')}
                      </p>
                    </div>
                  </MapPopup>
                )}
              </React.Fragment>
            ))}
          </Map>

          <div className="absolute top-3 right-3 z-10 flex max-w-[calc(100%-1.5rem)] flex-wrap items-center justify-end gap-1.5 rounded-xl p-1.5 mapcn-panel sm:top-4 sm:right-4 md:top-6 md:right-6 md:gap-2 md:p-2">
            <button
              type="button"
              className="rounded-lg border border-[var(--color-border)] bg-[rgba(var(--rgb-bg-alt),0.95)] px-3 py-2 text-[11px] font-semibold text-[var(--color-text)] transition-colors hover:bg-[var(--color-bg)]"
              onClick={resetView}
            >
              {t('map.actions.centerRegion')}
            </button>
            <button
              type="button"
              className="rounded-lg border border-[var(--color-border)] bg-[rgba(var(--rgb-bg-alt),0.95)] px-3 py-2 text-[11px] font-semibold text-[var(--color-text-alt)] transition-colors hover:bg-[var(--color-bg)] disabled:cursor-not-allowed disabled:opacity-40"
              onClick={() => setActivePopup(null)}
              disabled={!activePopup}
            >
              {t('map.actions.clearSelection')}
            </button>
          </div>

          <div
            className="map-municipios-panel absolute top-4 left-4 z-10 hidden min-w-0 w-[min(200px,38vw)] flex-col gap-3 rounded-2xl p-4 mapcn-panel lg:left-6 lg:top-6 lg:flex lg:w-auto lg:min-w-[200px] lg:gap-3.5 lg:p-5"
          >
            <p className="mb-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-alt)]">
              {t('map.panel.title')}
            </p>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-[var(--color-border)] bg-[rgba(var(--rgb-bg-alt),0.92)] px-2 py-1 text-[10px] font-semibold text-[var(--color-text-alt)]">
                {MUNICIPIOS.length} {t('map.municipios')}
              </span>
              <span className="rounded-full border border-[var(--color-border)] bg-[rgba(var(--rgb-bg-alt),0.92)] px-2 py-1 text-[10px] font-semibold text-[var(--color-text-alt)]">
                {selectedMunicipio ? `${t('map.selection.prefix')}${selectedMunicipio.nombre}` : t('map.selection.none')}
              </span>
            </div>
            <div className="flex flex-col gap-2.5">
              {MUNICIPIOS.map(m => (
                <button
                  type="button"
                  key={m.id} 
                  className={`flex w-full items-center gap-3 group/item cursor-pointer rounded-lg px-2 py-1.5 transition-colors ${
                    activePopup === m.id
                      ? 'bg-[rgba(var(--rgb-purple-accent),0.14)] ring-1 ring-[var(--color-border)]'
                      : 'hover:bg-[rgba(var(--rgb-text),0.06)]'
                  }`}
                  onClick={() => focusMunicipio(m.id)}
                >
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-shadow group-hover/item:shadow-[0_0_12px_currentColor]" style={{ background: m.color, color: m.color }} />
                  <span
                    className={`text-[11px] font-bold leading-none transition-colors ${
                      activePopup === m.id
                        ? 'text-[var(--color-text)]'
                        : 'text-[var(--color-text-alt)] group-hover/item:text-[var(--color-text)]'
                    }`}
                  >
                    {m.nombre}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="absolute bottom-4 right-4 z-10 hidden max-w-[200px] rounded-xl px-3 py-2.5 text-left mapcn-panel md:block md:bottom-6 md:right-6 md:max-w-[260px] md:px-4 md:py-3">
            <p className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-text-alt)]">
              {t('map.visualization.title')}
            </p>
            <p className="text-xs leading-relaxed text-[var(--color-text-alt)]">
              {t('map.visualization.hint')}
            </p>
          </div>
        </div>

        {/* Mobile: horizontal municipality picker (panel hidden on map overlay) */}
        <div className="map-municipios-mobile mt-4 lg:hidden">
          <p className="mb-2 text-left text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--color-text-alt)' }}>
            {t('map.panel.title')}
          </p>
          <div className="-mx-1 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {MUNICIPIOS.map((m) => (
              <button
                type="button"
                key={m.id}
                onClick={() => focusMunicipio(m.id)}
                className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-[11px] font-bold transition-colors ${
                  activePopup === m.id
                    ? 'border-[var(--color-purple)] bg-[rgba(var(--rgb-purple-accent),0.14)] text-[var(--color-text)]'
                    : 'border-[var(--color-border)] bg-[var(--color-bg-alt)] text-[var(--color-text-alt)]'
                }`}
              >
                <span className="size-2 shrink-0 rounded-full" style={{ background: m.color }} />
                {m.nombre}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
