"""Orden óptimo de paradas (colonia de hormigas) con tiempos de manejo reales.

Los tiempos y distancias por carretera se piden a OSRM (motor de ruteo libre sobre
OpenStreetMap; servicio `table`). Si OSRM no responde, se estiman: distancia en línea recta
x factor de sinuosidad de carreteras de montaña, a velocidad media de sierra. Así las
Altas Montañas (curvas y desniveles) no se tratan como una ciudad plana a 30 km/h.
"""
import json
import math
import os
import random
import urllib.request
from functools import lru_cache
from typing import Any, Dict, List, Optional, Tuple

# Servidor OSRM. Vacío desactiva la consulta (pruebas, sin red). El demo público es gratuito,
# con límite de uso razonable: se cachea y se usa solo al optimizar un itinerario.
OSRM_URL = os.environ.get("OSRM_URL", "https://router.project-osrm.org")
_OSRM_TIMEOUT_S = 5.0
# Respaldo sin OSRM: las carreteras de montaña recorren ~1.45x la distancia en línea recta y
# se circula a ~38 km/h de promedio (curvas, poblados, desniveles).
_SINUOSIDAD_MONTANA = 1.45
_VELOCIDAD_SIERRA_KMH = 38.0
_CITY_SPEED_KMH = _VELOCIDAD_SIERRA_KMH  # compatibilidad con _travel_minutes
# Large penalty added to effective distance when a stop violates its time window
_TIME_VIOLATION_PENALTY = 500.0


def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Distance in km between two lat/lng points (Haversine formula)."""
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


@lru_cache(maxsize=256)
def _osrm_tabla(coords: Tuple[Tuple[float, float], ...]):
    """Matrices (km, minutos) por carretera desde OSRM, o None si no está disponible."""
    if not OSRM_URL or len(coords) < 2:
        return None
    puntos = ";".join(f"{lon:.6f},{lat:.6f}" for lat, lon in coords)
    url = f"{OSRM_URL.rstrip('/')}/table/v1/driving/{puntos}?annotations=duration,distance"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "smartur-route-optimizer"})
        with urllib.request.urlopen(req, timeout=_OSRM_TIMEOUT_S) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except Exception:
        return None
    if data.get("code") != "Ok" or not data.get("durations") or not data.get("distances"):
        return None
    if any(v is None for fila in data["durations"] + data["distances"] for v in fila):
        return None  # algún punto sin ruta por carretera: mejor usar la estimación completa
    km = tuple(tuple(v / 1000.0 for v in fila) for fila in data["distances"])
    minutos = tuple(tuple(v / 60.0 for v in fila) for fila in data["durations"])
    return km, minutos


def matrices_viaje(stops: List[Dict[str, Any]]) -> Tuple[List[List[float]], List[List[float]], str]:
    """(km, minutos, fuente) entre todas las paradas. fuente = 'osrm' o 'estimada'."""
    coords = tuple((round(float(s.get("lat", 0.0)), 6), round(float(s.get("lng", 0.0)), 6)) for s in stops)
    osrm = _osrm_tabla(coords)
    if osrm is not None:
        km, minutos = osrm
        return [list(f) for f in km], [list(f) for f in minutos], "osrm"
    n = len(stops)
    km = [[0.0] * n for _ in range(n)]
    minutos = [[0.0] * n for _ in range(n)]
    for i in range(n):
        for j in range(i + 1, n):
            d = _haversine(coords[i][0], coords[i][1], coords[j][0], coords[j][1]) * _SINUOSIDAD_MONTANA
            km[i][j] = km[j][i] = d
            minutos[i][j] = minutos[j][i] = d / _VELOCIDAD_SIERRA_KMH * 60.0
    return km, minutos, "estimada"


def _path_distance(order: List[int], dist_matrix: List[List[float]]) -> float:
    return sum(dist_matrix[order[i]][order[i + 1]] for i in range(len(order) - 1))


def _travel_minutes(dist_km: float) -> float:
    """Convert distance in km to travel time in minutes at city speed."""
    return (dist_km / _CITY_SPEED_KMH) * 60.0


def _effective_distance(
    order: List[int],
    time_matrix: List[List[float]],
    durations: List[int],
    open_min: List[Optional[int]],
    close_min: List[Optional[int]],
    start_minutes: int,
) -> float:
    """
    Costo del recorrido en minutos de manejo, más penalizaciones por horarios.
    Simula el reloj acumulado (manejo + estancia) a lo largo del recorrido.
    """
    total = 0.0
    clock = float(start_minutes)

    for step in range(len(order)):
        idx = order[step]
        if step > 0:
            seg_min = time_matrix[order[step - 1]][idx]
            total += seg_min
            clock += seg_min

        # Check operating hours
        if open_min[idx] is not None and clock < open_min[idx]:
            # Must wait for opening — waiting is a soft penalty, not a hard skip
            total += _TIME_VIOLATION_PENALTY * ((open_min[idx] - clock) / 60.0)
            clock = float(open_min[idx])
        if close_min[idx] is not None and clock > close_min[idx]:
            # Already closed — severe penalty
            total += _TIME_VIOLATION_PENALTY

        clock += durations[idx]

    return total


def optimize_route(
    stops: List[Dict[str, Any]],
    *,
    n_ants: int = 30,
    n_iterations: int = 80,
    alpha: float = 1.2,
    beta: float = 2.5,
    rho: float = 0.5,
    q: float = 100.0,
    seed: int = 42,
    start_minutes: int = 540,  # 09:00 default
) -> Dict[str, Any]:
    """
    Ant Colony Optimization for open-path route ordering with optional
    time-window constraints and stop durations.

    The first stop is treated as the fixed departure point (the ant always
    starts there); the algorithm optimises the remaining visit order.

    Args:
        stops: list of dicts with:
            - ``lat``, ``lng``  (floats, required)
            - ``duration_minutes`` (int, optional — default 60)
            - ``open_minutes``   (int, optional — minutes from midnight)
            - ``close_minutes``  (int, optional — minutes from midnight)
        start_minutes: departure time in minutes from midnight (default 540 = 09:00).

    Returns:
        {
          "optimized_order": list[int],
          "original_distance_km": float,
          "optimized_distance_km": float,
          "savings_pct": int,
        }
    """
    n = len(stops)

    trivial = {
        "optimized_order": list(range(n)),
        "original_distance_km": 0.0,
        "optimized_distance_km": 0.0,
        "original_duration_min": 0.0,
        "optimized_duration_min": 0.0,
        "savings_pct": 0,
        "fuente_tiempos": "ninguna",
    }
    if n <= 1:
        return trivial

    # ── Per-stop time data ────────────────────────────────────────────────────
    durations: List[int] = [int(s.get("duration_minutes") or 60) for s in stops]
    open_min: List[Optional[int]] = [
        int(s["open_minutes"]) if s.get("open_minutes") is not None else None
        for s in stops
    ]
    close_min: List[Optional[int]] = [
        int(s["close_minutes"]) if s.get("close_minutes") is not None else None
        for s in stops
    ]
    has_time_windows = any(o is not None or c is not None for o, c in zip(open_min, close_min))

    # ── Matrices por carretera (OSRM) o estimadas para montaña ────────────────
    dist, tiempo, fuente = matrices_viaje(stops)
    # OSRM puede dar tiempos distintos de ida y vuelta; el ACO usa el promedio simétrico.
    for i in range(n):
        for j in range(i + 1, n):
            tiempo[i][j] = tiempo[j][i] = (tiempo[i][j] + tiempo[j][i]) / 2.0
            dist[i][j] = dist[j][i] = (dist[i][j] + dist[j][i]) / 2.0

    original_order = list(range(n))
    original_dist = _path_distance(original_order, dist)
    original_min = _path_distance(original_order, tiempo)

    # Se optimiza el tiempo de manejo (no los km): en sierra no son proporcionales.
    def path_cost(order: List[int]) -> float:
        if has_time_windows:
            return _effective_distance(order, tiempo, durations, open_min, close_min, start_minutes)
        return _path_distance(order, tiempo)

    original_cost = path_cost(original_order)

    if n == 2:
        return {
            "optimized_order": original_order,
            "original_distance_km": round(original_dist, 2),
            "optimized_distance_km": round(original_dist, 2),
            "original_duration_min": round(original_min, 1),
            "optimized_duration_min": round(original_min, 1),
            "savings_pct": 0,
            "fuente_tiempos": fuente,
        }

    # ── ACO setup ─────────────────────────────────────────────────────────────
    tau_init = 1.0 / (n * max(original_cost, 0.01))
    tau: List[List[float]] = [[tau_init] * n for _ in range(n)]

    # Heuristic visibility: 1/dist (avoid division by zero)
    eta: List[List[float]] = [[0.0] * n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            eta[i][j] = 1.0 / max(tiempo[i][j], 0.01)  # visibilidad: 1/minutos de manejo

    best_order = original_order[:]
    best_cost = original_cost
    rng = random.Random(seed)

    for _ in range(n_iterations):
        iteration_paths: List[tuple] = []

        for _ant in range(n_ants):
            visited = [False] * n
            path = [0]  # fixed departure = first stop
            visited[0] = True

            for _step in range(n - 1):
                cur = path[-1]
                candidates = [j for j in range(n) if not visited[j]]

                # Probability proportional to tau^alpha * eta^beta
                weights = [
                    (tau[cur][j] ** alpha) * (eta[cur][j] ** beta)
                    for j in candidates
                ]
                total = sum(weights)

                if total <= 0:
                    nxt = candidates[0]
                else:
                    r = rng.random() * total
                    cumulative = 0.0
                    nxt = candidates[-1]
                    for idx, w in enumerate(weights):
                        cumulative += w
                        if r <= cumulative:
                            nxt = candidates[idx]
                            break

                path.append(nxt)
                visited[nxt] = True

            pc = path_cost(path)
            pd = _path_distance(path, dist)
            iteration_paths.append((path, pc, pd))
            if pc < best_cost:
                best_cost = pc
                best_order = path[:]

        # ── Pheromone update ─────────────────────────────────────────────────
        for i in range(n):
            for j in range(n):
                tau[i][j] *= (1.0 - rho)
                if tau[i][j] < 1e-10:
                    tau[i][j] = 1e-10

        for path, pc, _ in iteration_paths:
            deposit = q / max(pc, 0.01)
            for k in range(len(path) - 1):
                tau[path[k]][path[k + 1]] += deposit
                tau[path[k + 1]][path[k]] += deposit

    # ── Result ────────────────────────────────────────────────────────────────
    best_dist = _path_distance(best_order, dist)
    best_min = _path_distance(best_order, tiempo)

    if best_cost >= original_cost:
        best_order = original_order
        best_dist = original_dist
        best_min = original_min
        savings_pct = 0
    else:
        # Ahorro en tiempo de manejo, que es lo que se optimiza.
        savings_pct = max(0, round((1.0 - best_min / original_min) * 100)) if original_min > 0 else 0

    return {
        "optimized_order": best_order,
        "original_distance_km": round(original_dist, 2),
        "optimized_distance_km": round(best_dist, 2),
        "original_duration_min": round(original_min, 1),
        "optimized_duration_min": round(best_min, 1),
        "savings_pct": savings_pct,
        "fuente_tiempos": fuente,
    }
