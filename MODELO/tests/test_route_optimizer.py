import route_optimizer as ro

# Orizaba, Huatusco, Córdoba y Fortín (coordenadas aproximadas).
PARADAS = [
    {"lat": 18.8501, "lng": -97.0995},   # Orizaba (salida)
    {"lat": 19.1489, "lng": -96.9661},   # Huatusco
    {"lat": 18.8842, "lng": -96.9256},   # Córdoba
    {"lat": 18.9038, "lng": -96.9989},   # Fortín
]


def test_sin_osrm_estima_tiempos_de_montana(monkeypatch):
    monkeypatch.setattr(ro, "OSRM_URL", "")
    ro._osrm_tabla.cache_clear()
    km, minutos, fuente = ro.matrices_viaje(PARADAS)
    assert fuente == "estimada"
    linea_recta = ro._haversine(18.8501, -97.0995, 18.8842, -96.9256)
    assert km[0][2] > linea_recta * 1.4  # sinuosidad de carretera
    assert minutos[0][2] > km[0][2] / 40 * 60  # más lento que 40 km/h


def test_optimiza_tiempo_y_reporta_fuente(monkeypatch):
    monkeypatch.setattr(ro, "OSRM_URL", "")
    ro._osrm_tabla.cache_clear()
    # Orden malo a propósito: Orizaba -> Huatusco -> Fortín -> Córdoba
    res = ro.optimize_route([PARADAS[0], PARADAS[1], PARADAS[3], PARADAS[2]], n_iterations=40)
    assert res["optimized_order"][0] == 0
    assert res["optimized_duration_min"] <= res["original_duration_min"]
    assert res["fuente_tiempos"] == "estimada"


def test_usa_osrm_cuando_responde(monkeypatch):
    monkeypatch.setattr(ro, "OSRM_URL", "http://osrm.prueba")
    ro._osrm_tabla.cache_clear()

    class Resp:
        def __init__(self, cuerpo): self.cuerpo = cuerpo
        def read(self): return self.cuerpo
        def __enter__(self): return self
        def __exit__(self, *a): return False

    import json
    def falso(req, timeout):
        n = len(PARADAS[:2])
        return Resp(json.dumps({"code": "Ok",
                                "durations": [[0, 3600], [3600, 0]],
                                "distances": [[0, 55000], [55000, 0]]}).encode())
    monkeypatch.setattr(ro.urllib.request, "urlopen", falso)
    km, minutos, fuente = ro.matrices_viaje(PARADAS[:2])
    assert fuente == "osrm" and round(km[0][1]) == 55 and round(minutos[0][1]) == 60
