import math
import random
from typing import Any, Dict, List, Optional

# Average city travel speed used to convert km → travel minutes
_CITY_SPEED_KMH = 30.0
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


def _path_distance(order: List[int], dist_matrix: List[List[float]]) -> float:
    return sum(dist_matrix[order[i]][order[i + 1]] for i in range(len(order) - 1))


def _travel_minutes(dist_km: float) -> float:
    """Convert distance in km to travel time in minutes at city speed."""
    return (dist_km / _CITY_SPEED_KMH) * 60.0


def _effective_distance(
    order: List[int],
    dist_matrix: List[List[float]],
    durations: List[int],
    open_min: List[Optional[int]],
    close_min: List[Optional[int]],
    start_minutes: int,
) -> float:
    """
    Compute effective path cost adding time-window violation penalties.
    Simulates accumulated clock time (travel + dwell) along the path.
    """
    total = 0.0
    clock = float(start_minutes)

    for step in range(len(order)):
        idx = order[step]
        if step > 0:
            seg_km = dist_matrix[order[step - 1]][idx]
            total += seg_km
            clock += _travel_minutes(seg_km)

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
        "savings_pct": 0,
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

    # ── Distance matrix ───────────────────────────────────────────────────────
    dist: List[List[float]] = [[0.0] * n for _ in range(n)]
    for i in range(n):
        li, oi = stops[i].get("lat", 0.0), stops[i].get("lng", 0.0)
        for j in range(i + 1, n):
            lj, oj = stops[j].get("lat", 0.0), stops[j].get("lng", 0.0)
            d = _haversine(li, oi, lj, oj)
            dist[i][j] = d
            dist[j][i] = d

    original_order = list(range(n))
    original_dist = _path_distance(original_order, dist)

    # Cost function: pure distance or time-window-penalised distance
    def path_cost(order: List[int]) -> float:
        if has_time_windows:
            return _effective_distance(order, dist, durations, open_min, close_min, start_minutes)
        return _path_distance(order, dist)

    original_cost = path_cost(original_order)

    if n == 2:
        return {
            "optimized_order": original_order,
            "original_distance_km": round(original_dist, 2),
            "optimized_distance_km": round(original_dist, 2),
            "savings_pct": 0,
        }

    # ── ACO setup ─────────────────────────────────────────────────────────────
    tau_init = 1.0 / (n * max(original_cost, 0.01))
    tau: List[List[float]] = [[tau_init] * n for _ in range(n)]

    # Heuristic visibility: 1/dist (avoid division by zero)
    eta: List[List[float]] = [[0.0] * n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            eta[i][j] = 1.0 / max(dist[i][j], 0.01)

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

    if best_cost >= original_cost:
        best_order = original_order
        best_dist = original_dist
        savings_pct = 0
    else:
        savings_pct = max(0, round((1.0 - best_dist / original_dist) * 100))

    return {
        "optimized_order": best_order,
        "original_distance_km": round(original_dist, 2),
        "optimized_distance_km": round(best_dist, 2),
        "savings_pct": savings_pct,
    }
