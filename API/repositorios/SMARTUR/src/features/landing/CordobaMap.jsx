import React, { useState, useEffect, useRef } from "react";
import {
  FaMapMarkerAlt,
  FaClock,
  FaStar,
  FaFilter,
  FaChevronDown,
  FaBuilding,
} from "react-icons/fa";
import bgPatron from "../../assets/bgPatron.png";
import SmartURLoader from "../../components/ui/SmartURLoader";

// Coordenadas centrales de la región de Las Altas Montañas
const REGION_CENTER = {
  lat: 18.85,
  lng: -96.95,
};

// Ciudades de la región de Las Altas Montañas
const ciudades = [
  {
    id: "cordoba",
    nombre: "Córdoba",
    lat: 18.8842,
    lng: -96.9256,
    color: "#FC478E",
  },
  {
    id: "orizaba",
    nombre: "Orizaba",
    lat: 18.8522,
    lng: -97.0994,
    color: "#984EFD",
  },
  {
    id: "fortin",
    nombre: "Fortín de las Flores",
    lat: 18.9061,
    lng: -96.9981,
    color: "#4DB9CA",
  },
  {
    id: "ixtaczoquitlan",
    nombre: "Ixtaczoquitlán",
    lat: 18.8167,
    lng: -97.0667,
    color: "#22C55E",
  },
  {
    id: "cuitlahuac",
    nombre: "Cuitláhuac",
    lat: 18.8131,
    lng: -96.7222,
    color: "#F97316",
  },
  {
    id: "amatlan",
    nombre: "Amatlán de los Reyes",
    lat: 18.8333,
    lng: -96.9167,
    color: "#EC4899",
  },
  {
    id: "yanga",
    nombre: "Yanga",
    lat: 18.8333,
    lng: -96.8,
    color: "#8B5CF6",
  },
  {
    id: "atoyac",
    nombre: "Atoyac",
    lat: 18.9167,
    lng: -96.7667,
    color: "#06B6D4",
  },
];

// Lugares de interés por ciudad
const lugaresPorCiudad = {
  cordoba: [
    {
      id: 1,
      nombre: "Parque 21 de Mayo",
      descripcion:
        "El corazón histórico de Córdoba, rodeado de arquitectura colonial y lleno de vida cultural.",
      categoria: "Histórico",
      ciudad: "Córdoba",
      lat: 18.8842,
      lng: -96.9256,
      imagen: bgPatron,
      horario: "Abierto 24 horas",
      rating: 4.5,
    },
    {
      id: 2,
      nombre: "Museo de la Ciudad",
      descripcion:
        "Exhibe la rica historia de Córdoba desde la época colonial hasta la actualidad.",
      categoria: "Cultural",
      ciudad: "Córdoba",
      lat: 18.886,
      lng: -96.927,
      imagen: bgPatron,
      horario: "Martes a Domingo 10:00 - 18:00",
      rating: 4.3,
    },
    {
      id: 3,
      nombre: "Catedral de la Inmaculada Concepción",
      descripcion:
        "Impresionante templo barroco del siglo XVII, joya arquitectónica de la ciudad.",
      categoria: "Religioso",
      ciudad: "Córdoba",
      lat: 18.8835,
      lng: -96.9248,
      imagen: bgPatron,
      horario: "Lunes a Domingo 7:00 - 20:00",
      rating: 4.7,
    },
    {
      id: 4,
      nombre: "Finca Santa Isabel",
      descripcion:
        "Hacienda cafetalera histórica con tours y degustación de café de altura.",
      categoria: "Ecoturismo",
      ciudad: "Córdoba",
      lat: 18.86,
      lng: -96.92,
      imagen: bgPatron,
      horario: "Viernes a Domingo 9:00 - 16:00",
      rating: 4.5,
    },
  ],
  orizaba: [
    {
      id: 5,
      nombre: "Palacio de Hierro",
      descripcion:
        "Edificio histórico de arquitectura única, símbolo de Orizaba y patrimonio cultural.",
      categoria: "Histórico",
      ciudad: "Orizaba",
      lat: 18.8522,
      lng: -97.0994,
      imagen: bgPatron,
      horario: "Lunes a Domingo 9:00 - 18:00",
      rating: 4.6,
    },
    {
      id: 6,
      nombre: "Teleférico de Orizaba",
      descripcion:
        "Teleférico que ofrece vistas panorámicas espectaculares de la ciudad y las montañas.",
      categoria: "Naturaleza",
      ciudad: "Orizaba",
      lat: 18.85,
      lng: -97.1,
      imagen: bgPatron,
      horario: "Martes a Domingo 10:00 - 18:00",
      rating: 4.8,
    },
    {
      id: 7,
      nombre: "Museo de Arte del Estado",
      descripcion:
        "Museo que alberga una importante colección de arte veracruzano y exposiciones temporales.",
      categoria: "Cultural",
      ciudad: "Orizaba",
      lat: 18.853,
      lng: -97.098,
      imagen: bgPatron,
      horario: "Martes a Domingo 10:00 - 18:00",
      rating: 4.4,
    },
  ],
  fortin: [
    {
      id: 8,
      nombre: "Jardín Botánico",
      descripcion:
        "Hermoso jardín con una gran variedad de flores y plantas exóticas de la región.",
      categoria: "Naturaleza",
      ciudad: "Fortín de las Flores",
      lat: 18.9061,
      lng: -96.9981,
      imagen: bgPatron,
      horario: "Lunes a Domingo 8:00 - 18:00",
      rating: 4.7,
    },
    {
      id: 9,
      nombre: "Cascada de Texolo",
      descripcion:
        "Impresionante cascada rodeada de vegetación tropical, ideal para ecoturismo.",
      categoria: "Naturaleza",
      ciudad: "Fortín de las Flores",
      lat: 18.91,
      lng: -97.01,
      imagen: bgPatron,
      horario: "Lunes a Domingo 8:00 - 17:00",
      rating: 4.9,
    },
  ],
  ixtaczoquitlan: [
    {
      id: 10,
      nombre: "Zona Arqueológica de Quiahuiztlán",
      descripcion:
        "Sitio arqueológico totonaca con tumbas y estructuras prehispánicas únicas.",
      categoria: "Arqueológico",
      ciudad: "Ixtaczoquitlán",
      lat: 18.9,
      lng: -96.95,
      imagen: bgPatron,
      horario: "Martes a Domingo 9:00 - 17:00",
      rating: 4.6,
    },
  ],
  cuitlahuac: [
    {
      id: 11,
      nombre: "Parque Central",
      descripcion:
        "Parque principal de Cuitláhuac, espacio de convivencia y eventos culturales.",
      categoria: "Cultural",
      ciudad: "Cuitláhuac",
      lat: 18.8131,
      lng: -96.7222,
      imagen: bgPatron,
      horario: "Abierto 24 horas",
      rating: 4.3,
    },
  ],
  amatlan: [
    {
      id: 12,
      nombre: "Fincas Cafetaleras",
      descripcion:
        "Tours por fincas cafetaleras tradicionales con degustación de café de altura.",
      categoria: "Ecoturismo",
      ciudad: "Amatlán de los Reyes",
      lat: 18.8333,
      lng: -96.9167,
      imagen: bgPatron,
      horario: "Sábados y Domingos 9:00 - 15:00",
      rating: 4.5,
    },
  ],
  yanga: [
    {
      id: 13,
      nombre: "Monumento a Yanga",
      descripcion:
        "Monumento histórico que conmemora a Gaspar Yanga, líder de la primera comunidad libre de América.",
      categoria: "Histórico",
      ciudad: "Yanga",
      lat: 18.8333,
      lng: -96.8,
      imagen: bgPatron,
      horario: "Abierto 24 horas",
      rating: 4.4,
    },
  ],
  atoyac: [
    {
      id: 14,
      nombre: "Parque Ecológico",
      descripcion:
        "Área natural preservada con senderos para caminata y observación de aves.",
      categoria: "Naturaleza",
      ciudad: "Atoyac",
      lat: 18.9167,
      lng: -96.7667,
      imagen: bgPatron,
      horario: "Lunes a Domingo 7:00 - 19:00",
      rating: 4.6,
    },
  ],
};

// Obtener todos los lugares
const todosLosLugares = Object.values(lugaresPorCiudad).flat();

// Categorías disponibles
const categorias = [
  "Todos",
  "Histórico",
  "Cultural",
  "Religioso",
  "Arqueológico",
  "Gastronomía",
  "Comercial",
  "Naturaleza",
  "Ecoturismo",
];

// Detectar si está en PWA/móvil
const isPwaMode = () => {
  if (typeof window === "undefined") return false;
  const isMobileWidth = window.innerWidth <= 768;
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
  return isMobileWidth || isStandalone;
};

export default function CordobaMap() {
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [filterCategory, setFilterCategory] = useState("Todos");
  const [filterCity, setFilterCity] = useState("Todas");
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [isPwa, setIsPwa] = useState(false);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const filterDropdownRef = useRef(null);

  // Detectar PWA al montar y en resize
  useEffect(() => {
    const checkPwa = () => setIsPwa(isPwaMode());
    checkPwa();
    window.addEventListener("resize", checkPwa);
    return () => window.removeEventListener("resize", checkPwa);
  }, []);

  // Filtrar lugares
  const filteredPlaces = todosLosLugares.filter((place) => {
    const matchCategory =
      filterCategory === "Todos" || place.categoria === filterCategory;
    const matchCity = filterCity === "Todas" || place.ciudad === filterCity;
    return matchCategory && matchCity;
  });

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(event.target)
      ) {
        setShowFilterDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cargar Leaflet
  useEffect(() => {
    if (!window.L) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);

      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      script.defer = true;
      script.onload = () => setMapLoaded(true);
      document.head.appendChild(script);
    } else {
      setMapLoaded(true);
    }
  }, []);

  // Inicializar mapa
  const initializeMap = React.useCallback(() => {
    if (!window.L || !document.getElementById("altas-montanas-map")) return;

    if (mapRef.current) {
      mapRef.current.remove();
    }

    const map = window.L.map("altas-montanas-map").setView(
      [REGION_CENTER.lat, REGION_CENTER.lng],
      11,
    );
    mapRef.current = map;

    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    // Limpiar marcadores anteriores
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Crear marcadores para ciudades
    ciudades.forEach((ciudad) => {
      const cityIcon = window.L.divIcon({
        className: "city-marker",
        html: `<div style="background: ${ciudad.color}; width: 50px; height: 50px; border-radius: 50%; border: 4px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 10px rgba(0,0,0,0.4);">
          <span style="color: white; font-size: 20px;">🏙️</span>
        </div>`,
        iconSize: [50, 50],
        iconAnchor: [25, 50],
      });

      const cityMarker = window.L.marker([ciudad.lat, ciudad.lng], {
        icon: cityIcon,
      })
        .addTo(map)
        .bindPopup(`<strong>${ciudad.nombre}</strong>`);

      markersRef.current.push(cityMarker);
    });

    // Crear marcadores para lugares
    filteredPlaces.forEach((place) => {
      const ciudad = ciudades.find((c) => c.nombre === place.ciudad);
      const placeColor = ciudad?.color || "#FC478E";

      const customIcon = window.L.divIcon({
        className: "place-marker",
        html: `<div style="background: ${placeColor}; width: 35px; height: 35px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
          <span style="font-size: 18px;">📍</span>
        </div>`,
        iconSize: [35, 35],
        iconAnchor: [17.5, 35],
      });

      const marker = window.L.marker([place.lat, place.lng], {
        icon: customIcon,
      })
        .addTo(map)
        .bindPopup(
          `<strong>${place.nombre}</strong><br><small>${place.ciudad} · ${place.categoria}</small>`,
        )
        .on("click", () => {
          setSelectedPlace(place);
        });

      markersRef.current.push(marker);
    });
  }, [filteredPlaces]);

  useEffect(() => {
    if (mapLoaded && window.L) {
      initializeMap();
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [mapLoaded, initializeMap]);

  // Agrupar lugares por ciudad para scroll horizontal
  const lugaresPorCiudadAgrupados = ciudades
    .map((ciudad) => ({
      ciudad: ciudad.nombre,
      color: ciudad.color,
      lugares: filteredPlaces.filter((place) => place.ciudad === ciudad.nombre),
    }))
    .filter((grupo) => grupo.lugares.length > 0);

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 ${isPwa ? "py-4 px-2" : "py-12 px-4"}`}
    >
      <div className={`${isPwa ? "max-w-full" : "max-w-7xl"} mx-auto`}>
        {/* Header */}
        <div className={`text-center ${isPwa ? "mb-4" : "mb-8"}`}>
          <h1
            className={`${isPwa ? "text-2xl" : "text-4xl md:text-5xl"} font-black text-gray-900 ${isPwa ? "mb-2" : "mb-4"}`}
          >
            Descubre la región de{" "}
            <span className="text-purple-600">Las Montañas</span>
          </h1>
          {!isPwa && (
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Explora los lugares más fascinantes de la región de Las Montañas,
              Veracruz. Una región llena de historia, cultura, naturaleza y
              tradición.
            </p>
          )}
        </div>

        {/* Filtros con dropdown */}
        <div
          className={`flex flex-wrap gap-4 ${isPwa ? "justify-start mb-4 px-2" : "justify-center mb-6"} items-center relative z-10`}
        >
          {/* Selector de ciudad */}
          <div className="relative">
            <select
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              className="px-4 py-2 rounded-lg border-2 border-purple-300 bg-white text-gray-700 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none pr-10 cursor-pointer"
            >
              <option value="Todas">Todas las ciudades</option>
              {ciudades.map((ciudad) => (
                <option key={ciudad.id} value={ciudad.nombre}>
                  {ciudad.nombre}
                </option>
              ))}
            </select>
            <FaChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-600 pointer-events-none" />
          </div>

          {/* Botón de filtro por categoría */}
          <div className="relative z-[100]" ref={filterDropdownRef}>
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="px-4 py-2 rounded-lg bg-purple-600 text-white font-semibold flex items-center gap-2 hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              <FaFilter />
              <span>Filtrar por tipo</span>
              <FaChevronDown
                className={`transition-transform ${showFilterDropdown ? "rotate-180" : ""}`}
              />
            </button>

            {/* Dropdown de categorías */}
            {showFilterDropdown && (
              <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-2xl border border-gray-200 py-2 z-[100] min-w-[200px] max-h-[300px] overflow-y-auto">
                {categorias.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setFilterCategory(cat);
                      setShowFilterDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-purple-50 transition-colors ${
                      filterCategory === cat
                        ? "bg-purple-100 text-purple-700 font-semibold"
                        : "text-gray-700"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Badge de filtro activo */}
          {filterCategory !== "Todos" && (
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold flex items-center gap-2">
              {filterCategory}
              <button
                onClick={() => setFilterCategory("Todos")}
                className="hover:text-purple-900"
                aria-label="Quitar filtro"
              >
                ×
              </button>
            </span>
          )}
        </div>

        {isPwa ? (
          /* Vista móvil/PWA: Mapa arriba, cards horizontales abajo */
          <div className="space-y-4">
            {/* Mapa más pequeño */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden h-[350px] relative z-0">
              <div
                id="altas-montanas-map"
                className="w-full h-full"
                style={{ zIndex: 0 }}
              />
              {!mapLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80 backdrop-blur-sm z-10">
                  <SmartURLoader isMini />
                  <p className="text-gray-600 font-medium relative z-[100000] mt-16">
                    Cargando mapa...
                  </p>
                </div>
              )}
            </div>

            {/* Cards horizontales por región */}
            {lugaresPorCiudadAgrupados.length > 0 ? (
              <div className="space-y-4">
                {lugaresPorCiudadAgrupados.map((grupo) => (
                  <div key={grupo.ciudad} className="space-y-2">
                    <div className="flex items-center gap-2 px-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: grupo.color }}
                      />
                      <h2 className="font-bold text-lg text-gray-900">
                        {grupo.ciudad}
                      </h2>
                      <span className="text-sm text-gray-500">
                        ({grupo.lugares.length})
                      </span>
                    </div>
                    <div
                      className="overflow-x-auto pb-2 scrollbar-hide"
                      style={{
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                      }}
                    >
                      <div
                        className="flex gap-3 px-2"
                        style={{ width: "max-content" }}
                      >
                        {grupo.lugares.map((place) => (
                          <div
                            key={place.id}
                            onClick={() => setSelectedPlace(place)}
                            className={`bg-white rounded-xl shadow-md p-3 cursor-pointer transition-all hover:shadow-xl active:scale-95 flex-shrink-0 w-[280px] ${
                              selectedPlace?.id === place.id
                                ? "ring-2 ring-purple-500"
                                : ""
                            }`}
                          >
                            <div className="flex flex-col gap-2">
                              <div className="flex items-start justify-between">
                                <div
                                  className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                                  style={{
                                    background: `linear-gradient(135deg, ${grupo.color}, ${grupo.color}dd)`,
                                  }}
                                >
                                  <FaMapMarkerAlt className="text-white text-lg" />
                                </div>
                                <div className="flex items-center gap-1 text-yellow-500">
                                  <FaStar className="text-xs" />
                                  <span className="text-xs font-semibold">
                                    {place.rating}
                                  </span>
                                </div>
                              </div>
                              <h3 className="font-bold text-gray-900 text-sm leading-tight">
                                {place.nombre}
                              </h3>
                              <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full w-fit">
                                {place.categoria}
                              </span>
                              <p className="text-xs text-gray-600 line-clamp-2">
                                {place.descripcion}
                              </p>
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <FaClock className="text-xs" />
                                <span className="truncate">
                                  {place.horario}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md p-8 text-center">
                <p className="text-gray-500">
                  No se encontraron lugares con los filtros seleccionados
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Vista desktop: Grid con mapa y cards verticales */
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Mapa */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden h-[600px] relative z-0">
                <div
                  id="altas-montanas-map"
                  className="w-full h-full"
                  style={{ zIndex: 0 }}
                />
                {!mapLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80 backdrop-blur-sm z-10">
                    <SmartURLoader isMini />
                    <p className="text-gray-600 font-medium relative z-[100000] mt-16">
                      Cargando mapa...
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Cards de lugares */}
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {filteredPlaces.length > 0 ? (
                filteredPlaces.map((place) => {
                  const ciudad = ciudades.find(
                    (c) => c.nombre === place.ciudad,
                  );
                  return (
                    <div
                      key={place.id}
                      onClick={() => setSelectedPlace(place)}
                      className={`bg-white rounded-xl shadow-md p-4 cursor-pointer transition-all hover:shadow-xl hover:scale-105 ${
                        selectedPlace?.id === place.id
                          ? "ring-2 ring-purple-500"
                          : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <div
                            className="w-16 h-16 rounded-lg flex items-center justify-center"
                            style={{
                              background: `linear-gradient(135deg, ${ciudad?.color || "#FC478E"}, ${ciudad?.color || "#FC478E"}dd)`,
                            }}
                          >
                            <FaMapMarkerAlt className="text-white text-xl" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-bold text-gray-900 truncate">
                              {place.nombre}
                            </h3>
                            <div className="flex items-center gap-1 text-yellow-500">
                              <FaStar className="text-sm" />
                              <span className="text-sm font-semibold">
                                {place.rating}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className="inline-block px-2 py-1 text-white text-xs font-semibold rounded-full"
                              style={{
                                backgroundColor: ciudad?.color || "#FC478E",
                              }}
                            >
                              {place.ciudad}
                            </span>
                            <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                              {place.categoria}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                            {place.descripcion}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <FaClock />
                            <span>{place.horario}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="bg-white rounded-xl shadow-md p-8 text-center">
                  <p className="text-gray-500">
                    No se encontraron lugares con los filtros seleccionados
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal de detalle */}
        {selectedPlace && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedPlace(null)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative">
                <img
                  src={selectedPlace.imagen}
                  alt={selectedPlace.nombre}
                  className="w-full h-64 object-cover rounded-t-2xl"
                  onError={(e) => {
                    e.target.src =
                      "https://via.placeholder.com/800x400?text=" +
                      encodeURIComponent(selectedPlace.nombre);
                  }}
                />
                <button
                  onClick={() => setSelectedPlace(null)}
                  className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
                  aria-label="Cerrar"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-3xl font-bold text-gray-900">
                    {selectedPlace.nombre}
                  </h2>
                  <div className="flex items-center gap-1 text-yellow-500">
                    <FaStar />
                    <span className="font-semibold">
                      {selectedPlace.rating}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 mb-4">
                  <span
                    className="inline-block px-3 py-1 text-white text-sm font-semibold rounded-full"
                    style={{
                      backgroundColor:
                        ciudades.find((c) => c.nombre === selectedPlace.ciudad)
                          ?.color || "#FC478E",
                    }}
                  >
                    {selectedPlace.ciudad}
                  </span>
                  <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 text-sm font-semibold rounded-full">
                    {selectedPlace.categoria}
                  </span>
                </div>
                <p className="text-gray-700 mb-4 leading-relaxed">
                  {selectedPlace.descripcion}
                </p>
                <div className="flex items-center gap-2 text-gray-600 mb-4">
                  <FaClock className="text-purple-600" />
                  <span className="font-medium">{selectedPlace.horario}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <FaMapMarkerAlt className="text-purple-600" />
                  <span>{selectedPlace.ciudad}, Veracruz</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
