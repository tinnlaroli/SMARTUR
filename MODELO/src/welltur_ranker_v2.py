"""Ranker WELLTUR v2 (Etapa A): modelo de la encuesta + preferencias declaradas + MiPyME.

1. Pesos por modalidad W1-W7:
   - `w_modelo`: P(tipo de experiencia | estrés) del artefacto `welltur_preferencias_v1.json`
     (estimado con la encuesta real; solo usa efectos de estrés con evidencia FDR),
     convertido a W1-W7.
   - `w_usuario`: modalidades que la persona eligió en la app, por prioridad (3, 2, 1).
   - `w = ALFA_USUARIO * w_usuario + (1 - ALFA_USUARIO) * w_modelo` si hay ambos.
2. Puntaje del lugar: similitud coseno entre los pesos y sus modalidades W revisadas.
3. Filtros duros: aprobado con evidencia, región, accesibilidad y esfuerzo máximo.
4. Re-ranking: máximo `MAX_POR_CATEGORIA` por categoría y `MAX_POR_MUNICIPIO` por municipio
   (se relajan si no alcanzan los candidatos) y al menos `MIN_MIPYME`
   MiPyMEs en el top cuando existan candidatas.

No infiere tipos de estrés ni promete beneficios: el estrés es un puntaje continuo que
solo ajusta pesos, y cada resultado explica qué modalidad lo llevó a la lista.
"""
from __future__ import annotations

import json
import math
import unicodedata
from functools import lru_cache
from pathlib import Path
from typing import Any

ARTEFACTO_PATH = Path(__file__).resolve().parents[1] / "models" / "welltur_preferencias_v1.json"
MODALIDADES = [f"W{i}" for i in range(1, 8)]
NOMBRES_W = {
    "W1": "pausa y descanso", "W2": "naturaleza y aire libre", "W3": "movimiento",
    "W4": "práctica mente-cuerpo", "W5": "experiencia culinaria", "W6": "aprendizaje y cultura",
    "W7": "autocuidado",
}
# Elegido con el escenario de la app (evaluacion_v2.evaluar_escenario_app): 0.6 maximiza el
# nDCG@5 frente a todas las elecciones de la persona sin sacrificar tanto el descubrimiento.
ALFA_USUARIO = 0.6
MAX_POR_CATEGORIA = 2
MAX_POR_MUNICIPIO = 2  # reparte la exposición entre municipios de la región
MIN_MIPYME = 2
ALGORITMO = "welltur_ranker_v2"


@lru_cache(maxsize=1)
def cargar_artefacto(ruta: str = str(ARTEFACTO_PATH)) -> dict[str, Any]:
    return json.loads(Path(ruta).read_text(encoding="utf-8"))


def _normalizar(valor: Any) -> str:
    raw = unicodedata.normalize("NFKD", str(valor or ""))
    return "".join(c for c in raw if not unicodedata.combining(c)).strip().casefold()


def _nivel_esfuerzo(valor: Any) -> int | None:
    if valor is None:
        return None
    try:
        numero = float(valor)
    except (TypeError, ValueError):
        return None
    return min((1, 2, 3), key=lambda nivel: abs((nivel - 1) / 2 - numero))


def pesos_modelo(artefacto: dict[str, Any], estres_0_100: float | None) -> dict[str, float]:
    z = 0.0 if estres_0_100 is None else (estres_0_100 - artefacto["estres"]["media"]) / artefacto["estres"]["de"]
    pesos = {w: 0.0 for w in MODALIDADES}
    for tipo, t in artefacto["tipos"].items():
        prob = 1 / (1 + math.exp(-(t["intercepto"] + t["beta_estres_z"] * z)))
        for w, intensidad in artefacto["pref_a_w"][tipo].items():
            pesos[w] += prob * intensidad
    total = sum(pesos.values()) or 1.0
    return {w: v / total for w, v in pesos.items()}


def pesos_usuario(modalidades: list[str]) -> dict[str, float]:
    crudos = {code: 3 - i for i, code in enumerate(modalidades)}
    total = sum(crudos.values()) or 1
    return {w: crudos.get(w, 0) / total for w in MODALIDADES}


def combinar_pesos(estres_0_100: float | None, modalidades: list[str],
                   artefacto: dict[str, Any] | None = None, alfa: float = ALFA_USUARIO) -> dict[str, float]:
    modelo = pesos_modelo(artefacto or cargar_artefacto(), estres_0_100)
    if not modalidades:
        return modelo
    usuario = pesos_usuario(modalidades)
    return {w: alfa * usuario[w] + (1 - alfa) * modelo[w] for w in MODALIDADES}


def _validar(preferencias: dict[str, Any], top_n: int) -> tuple[float | None, list[str], int, bool, str]:
    if not isinstance(preferencias, dict):
        raise ValueError("preferences debe ser un objeto.")
    estres = preferencias.get("estres_0_100")
    if estres is not None:
        if isinstance(estres, bool) or not isinstance(estres, (int, float)) or not 0 <= estres <= 100:
            raise ValueError("estres_0_100 debe ser un número entre 0 y 100.")
        estres = float(estres)
    modalidades = preferencias.get("modality_preferences") or []
    if (not isinstance(modalidades, list) or len(modalidades) > 3 or len(set(modalidades)) != len(modalidades)
            or not set(modalidades).issubset(MODALIDADES)):
        raise ValueError("modality_preferences: hasta tres códigos W1-W7 sin repetir.")
    max_esfuerzo = preferencias.get("max_effort", 3)
    if max_esfuerzo not in (1, 2, 3):
        raise ValueError("max_effort debe ser 1, 2 o 3.")
    if not 1 <= int(top_n) <= 10:
        raise ValueError("top_n debe estar entre 1 y 10.")
    return (estres, modalidades, max_esfuerzo, bool(preferencias.get("needs_accessible", False)),
            _normalizar(preferencias.get("region_filter")))


def _es_mipyme(lugar: dict[str, Any]) -> bool:
    if lugar.get("es_mipyme") is not None:
        return lugar.get("es_mipyme") is True
    # Los servicios del catálogo los publican empresas locales registradas en SMARTUR.
    return str(lugar.get("id_destino", "")).startswith("service:")


def _reordenar(candidatos: list[dict[str, Any]], top_n: int) -> list[dict[str, Any]]:
    """Selección voraz por puntaje con topes de diversidad y cuota mínima de MiPyMEs.

    Si no hay candidatos que cumplan todo, primero se relaja el tope por municipio (p. ej.
    cuando la persona filtró un solo municipio) y al final el de categoría. Nunca se repite
    un mismo nombre dentro del mismo municipio (sucursales o registros dobles del DENUE).
    """
    elegidos: list[dict[str, Any]] = []
    por_categoria: dict[str, int] = {}
    por_municipio: dict[str, int] = {}
    nombres: set[tuple[str, str]] = set()
    mipymes_disponibles = sum(1 for c in candidatos if c["es_mipyme"])
    cuota = min(MIN_MIPYME, mipymes_disponibles, top_n)
    restantes = list(candidatos)
    while restantes and len(elegidos) < top_n:
        faltan_mipyme = cuota - sum(1 for e in elegidos if e["es_mipyme"])
        espacios = top_n - len(elegidos)
        solo_mipyme = faltan_mipyme >= espacios
        siguiente = None
        for tope_municipio, tope_categoria in ((True, True), (False, True), (False, False)):
            for c in restantes:
                if solo_mipyme and not c["es_mipyme"]:
                    continue
                if (_normalizar(c["nombre_lugar"]), c["municipio"]) in nombres:
                    continue
                if tope_categoria and por_categoria.get(c["categoria_wellness"], 0) >= MAX_POR_CATEGORIA:
                    continue
                if tope_municipio and por_municipio.get(c["municipio"], 0) >= MAX_POR_MUNICIPIO:
                    continue
                siguiente = c
                break
            if siguiente:
                break
        if siguiente is None:
            break
        restantes.remove(siguiente)
        elegidos.append(siguiente)
        por_categoria[siguiente["categoria_wellness"]] = por_categoria.get(siguiente["categoria_wellness"], 0) + 1
        por_municipio[siguiente["municipio"]] = por_municipio.get(siguiente["municipio"], 0) + 1
        nombres.add((_normalizar(siguiente["nombre_lugar"]), siguiente["municipio"]))
    return elegidos


def recomendar(destinos: list[dict[str, Any]], preferencias: dict[str, Any], top_n: int = 5,
               artefacto: dict[str, Any] | None = None, alfa: float = ALFA_USUARIO) -> dict[str, Any]:
    estres, modalidades, max_esfuerzo, accesible, region = _validar(preferencias, top_n)
    top_n = int(top_n)
    artefacto = artefacto or cargar_artefacto()
    pesos = combinar_pesos(estres, modalidades, artefacto, alfa)

    candidatos = []
    for lugar in destinos:
        if lugar.get("is_wellness") is not True or lugar.get("wellness_status") != "approved":
            continue
        evidencia = lugar.get("wellness_mw_evidence") or {}
        lugar_w = [w for w in MODALIDADES if w in set(lugar.get("wellness_modalities") or [])]
        if not lugar_w or not isinstance(evidencia, dict):
            continue
        if any(not isinstance(evidencia.get(w), str) or len(evidencia[w].strip()) < 10 for w in lugar_w):
            continue
        # "Coscomatepec" también debe encontrar la localidad "Coscomatepec de Bravo".
        municipio = _normalizar(lugar.get("municipio"))
        if region and region != _normalizar(lugar.get("estado")) and not municipio.startswith(region):
            continue
        if accesible and lugar.get("is_accessible") is not True:
            continue
        esfuerzo = _nivel_esfuerzo(lugar.get("demanda_fisica"))
        if esfuerzo is not None and esfuerzo > max_esfuerzo:
            continue
        aportes = {w: pesos[w] for w in lugar_w}
        # Similitud coseno con un vector binario de etiquetas: un lugar con muchas
        # etiquetas no gana solo por acumularlas.
        puntaje = sum(aportes.values()) / math.sqrt(len(lugar_w))
        if puntaje <= 0:
            continue
        principal = max(aportes, key=aportes.get)
        candidatos.append({
            "id_destino": str(lugar["id_destino"]),
            "nombre_lugar": str(lugar.get("nombre_lugar") or ""),
            "estado": str(lugar.get("estado") or ""),
            "municipio": str(lugar.get("municipio") or ""),
            "categoria_wellness": str(lugar.get("categoria_wellness") or "sin_categoria"),
            "es_mipyme": _es_mipyme(lugar),
            "score": round(puntaje, 6),
            "place_modalities": lugar_w,
            "aporte_por_modalidad": {w: round(v, 4) for w, v in sorted(aportes.items(), key=lambda kv: -kv[1])},
            "explicacion": f"Porque buscas {NOMBRES_W[principal]}: {evidencia[principal].strip()}",
            "demanda_fisica": esfuerzo,
            "image_url": lugar.get("image_url"),
            "lat": lugar.get("lat"),
            "lon": lugar.get("lon"),
            "descripcion_bienestar": str(lugar.get("descripcion_bienestar") or ""),
        })

    candidatos.sort(key=lambda c: (-c["score"], _normalizar(c["nombre_lugar"]), c["id_destino"]))
    elegidos = _reordenar(candidatos, top_n)
    for i, c in enumerate(elegidos, start=1):
        c["rank"] = i
    return {
        "algorithm": ALGORITMO,
        "model_version": artefacto["modelo"],
        "model_trained_on": artefacto["fuente"],
        "uses_stress": estres is not None,
        "weights": {w: round(v, 4) for w, v in pesos.items()},
        "alpha_user": alfa if modalidades else 0.0,
        "candidates": len(candidatos),
        "mipyme_in_top": sum(1 for c in elegidos if c["es_mipyme"]),
        "destinations": elegidos,
        "notice": ("El estrés solo ajusta qué tipo de experiencia se prioriza; no es un diagnóstico "
                   "ni una promesa de beneficio para la salud."),
    }
