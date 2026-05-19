"use client";

import * as React from "react";
import MapLibreGL, { type PopupOptions, type MarkerOptions } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Loader2 } from "lucide-react";
import { cn } from "../../utils/cn";

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

export type MapRef = MapLibreGL.Map;

export interface MapViewport {
  latitude: number;
  longitude: number;
  zoom: number;
  bearing?: number;
  pitch?: number;
}

export interface MapProps extends Omit<React.ComponentPropsWithoutRef<"div">, "onLoad" | "onClick"> {
  onLoad?: (map: MapRef) => void;
  onMove?: (viewport: MapViewport) => void;
  onMoveEnd?: (viewport: MapViewport) => void;
  onClick?: (e: MapLibreGL.MapMouseEvent) => void;
  mapStyle?: string;
  initialViewport?: MapViewport;
  interactive?: boolean;
  maxZoom?: number;
  minZoom?: number;
  attributionControl?: boolean;
  reuseMaps?: boolean;
  transformRequest?: MapLibreGL.RequestTransformFunction;
  bounds?: MapLibreGL.LngLatBoundsLike;
  fitBoundsOptions?: MapLibreGL.FitBoundsOptions;
  scrollZoom?: boolean;
  children?: React.ReactNode;
}

/* -------------------------------------------------------------------------- */
/*                                   Context                                  */
/* -------------------------------------------------------------------------- */

const MapContext = React.createContext<{
  map: MapRef | null;
  loaded: boolean;
} | null>(null);

export function useMap() {
  const context = React.use(MapContext);
  if (!context) {
    throw new Error("useMap must be used within a <Map />");
  }
  return context;
}

/* -------------------------------------------------------------------------- */
/*                                Main Component                              */
/* -------------------------------------------------------------------------- */

export const Map = React.forwardRef<MapRef, MapProps>(
  (
    {
      className,
      mapStyle = "https://tiles.openfreemap.org/styles/liberty",
      initialViewport = {
        latitude: 0,
        longitude: 0,
        zoom: 1,
      },
      onLoad,
      onMove,
      onMoveEnd,
      onClick,
      interactive = true,
      maxZoom = 20,
      minZoom = 0,
      attributionControl = true,
      transformRequest,
      bounds,
      fitBoundsOptions,
      scrollZoom,
      children,
      ...props
    },
    ref
  ) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [map, setMap] = React.useState<MapRef | null>(null);
    const [loaded, setLoaded] = React.useState(false);
    const styleRef = React.useRef<string | undefined>(mapStyle);

    React.useImperativeHandle(ref, () => map!, [map]);

    React.useEffect(() => {
      if (!containerRef.current) return;

      const mapInstance = new MapLibreGL.Map({
        container: containerRef.current,
        style: mapStyle,
        center: [initialViewport.longitude, initialViewport.latitude],
        zoom: initialViewport.zoom,
        bearing: initialViewport.bearing ?? 0,
        pitch: initialViewport.pitch ?? 0,
        interactive,
        maxZoom,
        minZoom,
        attributionControl: false,
        transformRequest,
        bounds,
        fitBoundsOptions,
        scrollZoom: scrollZoom ?? true,
      });

      mapInstance.on("load", () => {
        setLoaded(true);
        onLoad?.(mapInstance);
      });

      mapInstance.on("move", () => {
        const center = mapInstance.getCenter();
        onMove?.({
          latitude: center.lat,
          longitude: center.lng,
          zoom: mapInstance.getZoom(),
          bearing: mapInstance.getBearing(),
          pitch: mapInstance.getPitch(),
        });
      });

      mapInstance.on("moveend", () => {
        const center = mapInstance.getCenter();
        onMoveEnd?.({
          latitude: center.lat,
          longitude: center.lng,
          zoom: mapInstance.getZoom(),
          bearing: mapInstance.getBearing(),
          pitch: mapInstance.getPitch(),
        });
      });

      mapInstance.on("click", (e) => {
        onClick?.(e);
      });

      setMap(mapInstance);

      if (attributionControl) {
        mapInstance.addControl(new MapLibreGL.AttributionControl(), "bottom-right");
      }

      return () => {
        mapInstance.remove();
      };
    }, []);

    // Actualizar estilo cuando cambia el prop `mapStyle` (sin remontear el Map)
    React.useEffect(() => {
      if (!map) return;
      if (styleRef.current === mapStyle) return;
      styleRef.current = mapStyle;
      map.setStyle(mapStyle);
    }, [map, mapStyle]);

    return (
      <div
        className={cn(
          "relative w-full h-full min-h-[400px] overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-alt)]",
          className,
        )}
        ref={containerRef}
        {...props}
      >
        {!loaded && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-[rgba(var(--rgb-bg),0.65)] backdrop-blur-sm">
            <Loader2 className="size-6 animate-spin text-[var(--color-text-alt)]" />
          </div>
        )}
        <MapContext.Provider value={{ map, loaded }}>{loaded && children}</MapContext.Provider>
      </div>
    );
  }
);
Map.displayName = "Map";

/* -------------------------------------------------------------------------- */
/*                                   Marker                                   */
/* -------------------------------------------------------------------------- */

export interface MapMarkerProps {
  latitude: number;
  longitude: number;
  options?: Omit<MarkerOptions, "element">;
  children?: React.ReactNode;
  className?: string;
  onClick?: (e: MouseEvent) => void;
}

export const MapMarker = React.memo(({ latitude, longitude, options, children, className, onClick }: MapMarkerProps) => {
  const { map } = useMap();
  const markerRef = React.useRef<MapLibreGL.Marker | null>(null);
  const elementRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!map) return;

    const el = document.createElement("div");
    el.className = cn("cursor-pointer", className);
    
    const marker = new MapLibreGL.Marker({
      ...options,
      element: el,
    })
      .setLngLat([longitude, latitude])
      .addTo(map);

    if (onClick) {
      el.addEventListener("click", (e: MouseEvent) => {
        e.stopPropagation();
        onClick(e);
      });
    }

    markerRef.current = marker;

    if (elementRef.current) {
      marker.getElement().appendChild(elementRef.current);
    }

    return () => {
      marker.remove();
    };
  }, [map, latitude, longitude, className, onClick, options]);

  return (
    <div className="hidden">
      <div ref={elementRef}>{children}</div>
    </div>
  );
});

/* -------------------------------------------------------------------------- */
/*                                   Popup                                    */
/* -------------------------------------------------------------------------- */

export interface MapPopupProps {
  latitude: number;
  longitude: number;
  children: React.ReactNode;
  options?: PopupOptions;
  onClose?: () => void;
  className?: string;
}

export const MapPopup = ({ latitude, longitude, children, options, onClose, className }: MapPopupProps) => {
  const { map } = useMap();
  const popupRef = React.useRef<MapLibreGL.Popup | null>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!map) return;

    const popup = new MapLibreGL.Popup({
      ...options,
      className: cn("mapcn-popup", className),
    })
      .setLngLat([longitude, latitude])
      .setHTML('<div id="popup-content"></div>')
      .addTo(map);

    popup.on("close", () => {
      onClose?.();
    });

    popupRef.current = popup;

    return () => {
      popup.remove();
    };
  }, [map, latitude, longitude]);

  React.useEffect(() => {
    if (popupRef.current && contentRef.current) {
      const container = popupRef.current.getElement().querySelector("#popup-content");
      if (container) {
        container.appendChild(contentRef.current);
      }
    }
  }, [children]);

  return (
    <div className="hidden">
      <div ref={contentRef} className="p-2 min-w-[150px]">
        {children}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                                  Controls                                  */
/* -------------------------------------------------------------------------- */

export const MapControls = ({
  position = "top-right",
  showZoom = true,
  showCompass = true,
  showFullscreen = true,
  showGeolocate = true,
}: {
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  showZoom?: boolean;
  showCompass?: boolean;
  showFullscreen?: boolean;
  showGeolocate?: boolean;
}) => {
  const { map } = useMap();

  React.useEffect(() => {
    if (!map) return;

    const controls: MapLibreGL.IControl[] = [];

    if (showZoom || showCompass) {
      const nav = new MapLibreGL.NavigationControl({
        showZoom,
        showCompass,
      });
      map.addControl(nav, position);
      controls.push(nav);
    }

    if (showFullscreen) {
      const fs = new MapLibreGL.FullscreenControl();
      map.addControl(fs, position);
      controls.push(fs);
    }

    if (showGeolocate) {
      const geo = new MapLibreGL.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
      });
      map.addControl(geo, position);
      controls.push(geo);
    }

    return () => {
      if (map && map.getContainer()) {
        controls.forEach((control) => {
          try {
            map.removeControl(control);
          } catch (e) {
            // Silently handle cases where control might have already been removed or map is destroying
          }
        });
      }
    };
  }, [map, position, showZoom, showCompass, showFullscreen, showGeolocate]);

  return null;
};
