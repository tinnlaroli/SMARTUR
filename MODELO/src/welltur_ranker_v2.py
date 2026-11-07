"""Ranker WELLTUR (Etapa A): un solo formulario = PSS-10 + motivos M + modalidades W.

1. Pesos por modalidad W1-W7:
   - `w_modelo` (perfil por estrés):
       a) P(tipo de experiencia | estrés) del artefacto `welltur_preferencias_v1.json`
          (encuesta real; solo efectos de estrés con evidencia FDR), convertido a W1-W7;
       b) ajustado con el modelo `welltur_afrontamiento_v1.json` (PSS-10 ítem por ítem ->
          qué actividad le ayuda más a la persona; COVIDiSTRESS México, n = 6,224). Su efecto
          es pequeño a propósito: en validación cruzada apenas supera al promedio.
   - `w_usuario`: lo que la persona declara. Modalidades W por prioridad (3, 2, 1) y motivos
     M1-M9 por prioridad, llevados a W con `MOTIVO_A_W` (mitad y mitad si hay ambos).
   - `w = ALFA_USUARIO * w_usuario + (1 - ALFA_USUARIO) * w_modelo` si hay declaración.
2. Puntaje del lugar: similitud coseno entre los pesos y sus modalidades W revisadas.
3. Filtros: aprobado con evidencia (siempre), región, accesibilidad y esfuerzo máximo.
   Nunca se devuelve una lista vacía: si los lugares que cumplen todo no alcanzan, se
   relajan por etapas (esfuerzo, luego región, luego accesibilidad) y cada lugar indica su
   nivel de coincidencia ("alta", "media" o "baja") y el motivo.
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
ALGORITMO = "welltur_ranker_v3"
AFRONTAMIENTO_PATH = Path(__file__).resolve().parents[1] / "models" / "welltur_afrontamiento_v1.json"
MOTIVOS = [f"M{i}" for i in range(1, 10)]
# Motivo del viaje -> modalidades que lo satisfacen. Criterio experto del protocolo M/W: la
# primera de cada lista (intensidad 1.0) es la modalidad principal del motivo.
MOTIVO_A_W = {
    "M1": {"W1": 1.0, "W7": 0.5},             # descansar o hacer una pausa
    "M2": {"W3": 1.0, "W2": 0.5},             # mantenerse activo
    "M3": {"W2": 1.0, "W3": 0.3},             # conectar con la naturaleza
    "M4": {"W6": 1.0, "W5": 0.3},             # aprender
    "M5": {"W5": 1.0, "W6": 0.6},             # compartir o conectar
    "M6": {"W6": 1.0, "W5": 0.5, "W3": 0.5},  # probar algo nuevo
    "M7": {"W7": 1.0, "W4": 0.5},             # autocuidado
    "M8": {"W5": 1.0},                        # explorar alimentos o bebidas
    "M9": {"W4": 1.0, "W2": 0.4},             # reflexionar o practicar atención plena
}
# Máximo cambio relativo que el modelo de afrontamiento puede aplicar a un peso W.
TOPE_AFRONTAMIENTO = 0.5
PSS10_INVERTIDOS = {4, 5, 7, 8}


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


def estres_desde_pss10(pss10_total: float, artefacto: dict[str, Any] | None = None) -> float:
    """PSS-10 (0-40) -> índice de estrés de la encuesta (0-100) por equiparación de normas.

    z se calcula con las normas mexicanas de la PSS-10 (COVIDiSTRESS, ponderadas por la edad
    de la encuesta; ver normas_pss10.py) y se lleva a la media y DE del índice con el que se
    entrenó el modelo. Sin normas en el artefacto, usa la conversión proporcional.
    """
    artefacto = artefacto or cargar_artefacto()
    normas = artefacto.get("equivalencia_pss10")
    if not normas:
        return round(pss10_total / 40 * 100, 1)
    z = (pss10_total - normas["media"]) / normas["de"]
    valor = artefacto["estres"]["media"] + z * artefacto["estres"]["de"]
    return round(min(100.0, max(0.0, valor)), 1)


@lru_cache(maxsize=1)
def cargar_afrontamiento(ruta: str = str(AFRONTAMIENTO_PATH)) -> dict[str, Any] | None:
    ruta_p = Path(ruta)
    return json.loads(ruta_p.read_text(encoding="utf-8")) if ruta_p.exists() else None


def _pss10_puntuados(items: list[int | None]) -> list[float]:
    """Ítems 0-4 con los positivos invertidos; los faltantes (máx. 2) toman el promedio."""
    puntuados = [None if v is None else float(4 - v if i in PSS10_INVERTIDOS else v)
                 for i, v in enumerate(items, start=1)]
    respondidos = [v for v in puntuados if v is not None]
    media = sum(respondidos) / len(respondidos)
    return [media if v is None else v for v in puntuados]


def afinidad_afrontamiento(items: list[int | None], modelo: dict[str, Any] | None = None) -> dict[str, float]:
    """Por actividad (descanso, convivencia, ...): cuánto más que el promedio poblacional le
    ayudaría a esta persona, en desviaciones estándar. Valores cercanos a 0 son lo esperado."""
    modelo = modelo or cargar_afrontamiento()
    if not modelo:
        return {}
    x = _pss10_puntuados(items)
    if modelo["entrada"] == "total_pss10":
        x = [sum(x)]
    salida = {}
    for objetivo, c in modelo["coeficientes"].items():
        pred = c["intercepto"] + sum(p * v for p, v in zip(c["pesos"], x))
        salida[objetivo] = (pred - modelo["promedio_poblacional"][objetivo]) / modelo["de_poblacional"][objetivo]
    return salida


def ajustar_por_afrontamiento(pesos: dict[str, float], afinidad: dict[str, float],
                              modelo: dict[str, Any] | None = None) -> dict[str, float]:
    if not afinidad:
        return pesos
    modelo = modelo or cargar_afrontamiento()
    factor = {w: 0.0 for w in MODALIDADES}
    for objetivo, z in afinidad.items():
        for motivo, peso_m in modelo["objetivos"][objetivo]["motivos"].items():
            for w, intensidad in MOTIVO_A_W[motivo].items():
                factor[w] += z * peso_m * intensidad
    ajustados = {w: pesos[w] * (1 + max(-TOPE_AFRONTAMIENTO, min(TOPE_AFRONTAMIENTO, factor[w])))
                 for w in MODALIDADES}
    total = sum(ajustados.values()) or 1.0
    return {w: v / total for w, v in ajustados.items()}


def _por_prioridad(codigos: list[str]) -> dict[str, float]:
    return {code: float(3 - i) for i, code in enumerate(codigos)}


def pesos_usuario(modalidades: list[str], motivos: list[str] | None = None) -> dict[str, float]:
    partes = []
    if modalidades:
        crudos = _por_prioridad(modalidades)
        partes.append({w: crudos.get(w, 0.0) for w in MODALIDADES})
    if motivos:
        desde_m = {w: 0.0 for w in MODALIDADES}
        for m, prioridad in _por_prioridad(motivos).items():
            for w, intensidad in MOTIVO_A_W[m].items():
                desde_m[w] += prioridad * intensidad
        partes.append(desde_m)
    if not partes:
        return {w: 0.0 for w in MODALIDADES}
    normalizadas = [{w: v / (sum(p.values()) or 1.0) for w, v in p.items()} for p in partes]
    return {w: sum(p[w] for p in normalizadas) / len(normalizadas) for w in MODALIDADES}


def combinar_pesos(estres_0_100: float | None, modalidades: list[str],
                   artefacto: dict[str, Any] | None = None, alfa: float = ALFA_USUARIO,
                   motivos: list[str] | None = None, afinidad: dict[str, float] | None = None) -> dict[str, float]:
    modelo = ajustar_por_afrontamiento(pesos_modelo(artefacto or cargar_artefacto(), estres_0_100), afinidad or {})
    if not modalidades and not motivos:
        return modelo
    usuario = pesos_usuario(modalidades, motivos)
    return {w: alfa * usuario[w] + (1 - alfa) * modelo[w] for w in MODALIDADES}


def _validar(preferencias: dict[str, Any], top_n: int) -> tuple[float | None, list[str], int, bool, str]:
    if not isinstance(preferencias, dict):
        raise ValueError("preferences debe ser un objeto.")
    estres = preferencias.get("estres_0_100")
    if estres is not None:
        if isinstance(estres, bool) or not isinstance(estres, (int, float)) or not 0 <= estres <= 100:
            raise ValueError("estres_0_100 debe ser un número entre 0 y 100.")
        estres = float(estres)
    pss = preferencias.get("pss10_total")
    if pss is not None:
        if isinstance(pss, bool) or not isinstance(pss, (int, float)) or not 0 <= pss <= 40:
            raise ValueError("pss10_total debe ser un número entre 0 y 40.")
        estres = estres_desde_pss10(float(pss))
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


def _validar_extra(preferencias: dict[str, Any]) -> tuple[list[str], list[int | None] | None]:
    """Motivos M1-M9 y las 10 respuestas crudas de la PSS-10 (0-4, máx. 2 sin responder)."""
    motivos = preferencias.get("motive_priorities") or []
    if (not isinstance(motivos, list) or len(motivos) > 3 or len(set(motivos)) != len(motivos)
            or not set(motivos).issubset(MOTIVOS)):
        raise ValueError("motive_priorities: hasta tres códigos M1-M9 sin repetir.")
    items = preferencias.get("pss10_items")
    if items is not None:
        if (not isinstance(items, list) or len(items) != 10
                or any(v is not None and (isinstance(v, bool) or not isinstance(v, int) or not 0 <= v <= 4)
                       for v in items)
                or sum(v is None for v in items) > 2):
            raise ValueError("pss10_items: 10 respuestas 0-4, con máximo 2 sin responder.")
    return motivos, items


def _pedidas(modalidades: list[str], motivos: list[str]) -> set[str]:
    """Modalidades que la persona pidió: las W elegidas y la principal de cada motivo M."""
    return set(modalidades) | {next(iter(MOTIVO_A_W[m])) for m in motivos}


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


# Etapas de búsqueda: qué filtros se respetan y qué se le dice a la persona al relajarlos.
ETAPAS = (
    ("todo", None),
    ("esfuerzo", "Pide algo más de esfuerzo físico del que indicaste."),
    ("region", "Está fuera de la zona que elegiste."),
    ("accesibilidad", "No tenemos confirmada su accesibilidad."),
)


def _candidato(lugar: dict[str, Any], pesos: dict[str, float], modalidades: list[str],
               motivos: list[str] | None = None) -> dict[str, Any] | None:
    """Puntaje y explicación de un lugar aprobado con evidencia; None si no es recomendable."""
    if lugar.get("is_wellness") is not True or lugar.get("wellness_status") != "approved":
        return None
    evidencia = lugar.get("wellness_mw_evidence") or {}
    lugar_w = [w for w in MODALIDADES if w in set(lugar.get("wellness_modalities") or [])]
    if not lugar_w or not isinstance(evidencia, dict):
        return None
    if any(not isinstance(evidencia.get(w), str) or len(evidencia[w].strip()) < 10 for w in lugar_w):
        return None
    aportes = {w: pesos[w] for w in lugar_w}
    # Similitud coseno con un vector binario de etiquetas: un lugar con muchas
    # etiquetas no gana solo por acumularlas.
    puntaje = sum(aportes.values()) / math.sqrt(len(lugar_w))
    if puntaje <= 0:
        return None
    motivos = motivos or []
    # Los lugares del inventario nacional traen motivos M revisados: si coinciden con los
    # pedidos suben un 15 %.
    motivos_lugar = set(lugar.get("wellness_motives") or [])
    if motivos_lugar & set(motivos):
        puntaje *= 1.15
    principal = max(aportes, key=aportes.get)
    # Coincide con lo que la persona pidió (o no pidió nada): alta. Solo por el modelo: media.
    pedidas = _pedidas(modalidades, motivos)
    comparte = not pedidas or bool(pedidas & set(lugar_w)) or bool(motivos_lugar & set(motivos))
    return {
        "id_destino": str(lugar["id_destino"]),
        "nombre_lugar": str(lugar.get("nombre_lugar") or ""),
        "estado": str(lugar.get("estado") or ""),
        "municipio": str(lugar.get("municipio") or ""),
        "categoria_wellness": str(lugar.get("categoria_wellness") or "sin_categoria"),
        "es_mipyme": _es_mipyme(lugar),
        # Verificado por una persona (no una propuesta por regla del DENUE).
        "verificado": lugar.get("verificado") is True,
        "score": round(puntaje, 6),
        "place_modalities": lugar_w,
        "aporte_por_modalidad": {w: round(v, 4) for w, v in sorted(aportes.items(), key=lambda kv: -kv[1])},
        "explicacion": f"Porque buscas {NOMBRES_W[principal]}: {evidencia[principal].strip()}",
        "coincidencia": "alta" if comparte else "media",
        "motivo_coincidencia": None if comparte else "No es de lo que elegiste; te la sugerimos por tu perfil.",
        "demanda_fisica": _nivel_esfuerzo(lugar.get("demanda_fisica")),
        "image_url": lugar.get("image_url"),
        "lat": lugar.get("lat"),
        "lon": lugar.get("lon"),
        "descripcion_bienestar": str(lugar.get("descripcion_bienestar") or ""),
        "_accesible": lugar.get("is_accessible") is True,
    }


def _cumple(c: dict[str, Any], etapa: int, max_esfuerzo: int, accesible: bool, region: str) -> bool:
    """¿El candidato pasa los filtros que siguen activos en esta etapa?"""
    if etapa < 3 and accesible and not c["_accesible"]:
        return False
    # "Coscomatepec" también debe encontrar la localidad "Coscomatepec de Bravo".
    if (etapa < 2 and region and region != _normalizar(c["estado"])
            and not _normalizar(c["municipio"]).startswith(region)):
        return False
    if etapa < 1 and c["demanda_fisica"] is not None and c["demanda_fisica"] > max_esfuerzo:
        return False
    return True


def _motivos(c: dict[str, Any], max_esfuerzo: int, accesible: bool, region: str) -> list[str]:
    """Cada filtro pedido que el lugar no cumple, en el orden en que se relajan."""
    fallas = []
    if c["demanda_fisica"] is not None and c["demanda_fisica"] > max_esfuerzo:
        fallas.append(ETAPAS[1][1])
    if region and region != _normalizar(c["estado"]) and not _normalizar(c["municipio"]).startswith(region):
        fallas.append(ETAPAS[2][1])
    if accesible and not c["_accesible"]:
        fallas.append(ETAPAS[3][1])
    return fallas


def recomendar(destinos: list[dict[str, Any]], preferencias: dict[str, Any], top_n: int = 5,
               artefacto: dict[str, Any] | None = None, alfa: float = ALFA_USUARIO) -> dict[str, Any]:
    estres, modalidades, max_esfuerzo, accesible, region = _validar(preferencias, top_n)
    motivos, items_pss = _validar_extra(preferencias)
    top_n = int(top_n)
    artefacto = artefacto or cargar_artefacto()
    afinidad = afinidad_afrontamiento(items_pss) if items_pss is not None else {}
    pesos = combinar_pesos(estres, modalidades, artefacto, alfa, motivos=motivos, afinidad=afinidad)

    todos = [c for c in (_candidato(lugar, pesos, modalidades, motivos) for lugar in destinos) if c]
    # Primero lo que coincide con lo pedido; dentro de cada nivel, por puntaje.
    todos.sort(key=lambda c: (c["coincidencia"] != "alta", -c["score"],
                              _normalizar(c["nombre_lugar"]), c["id_destino"]))

    elegidos: list[dict[str, Any]] = []
    usados: set[str] = set()
    estrictos = 0
    for etapa, (_, motivo) in enumerate(ETAPAS):
        if len(elegidos) >= top_n:
            break
        nuevos = [c for c in todos
                  if c["id_destino"] not in usados and _cumple(c, etapa, max_esfuerzo, accesible, region)]
        if etapa == 0:
            estrictos = len(nuevos)
        tanda = _reordenar(nuevos, top_n - len(elegidos))
        for c in tanda:
            if etapa > 0:
                # Todos los filtros que este lugar no cumple, no solo el de la etapa.
                c["coincidencia"] = "baja"
                c["motivo_coincidencia"] = " ".join(_motivos(c, max_esfuerzo, accesible, region)) or motivo
            usados.add(c["id_destino"])
        elegidos.extend(tanda)

    for i, c in enumerate(elegidos, start=1):
        c["rank"] = i
    for c in todos:
        c.pop("_accesible", None)
    aviso = None
    # Solo se avisa cuando hubo que relajar un filtro; las sugerencias "media" (por perfil o
    # por diversidad) ya cumplen todo lo pedido y cada tarjeta lo explica.
    if any(c["coincidencia"] == "baja" for c in elegidos):
        aviso = ("No encontramos suficientes lugares que cumplan todo lo que pediste. Te mostramos "
                 "también opciones con menor relación con tus respuestas; cada una indica por qué.")
    return {
        "algorithm": ALGORITMO,
        "model_version": artefacto["modelo"],
        "model_trained_on": artefacto["fuente"],
        "uses_stress": estres is not None,
        "estres_0_100_usado": estres,
        "weights": {w: round(v, 4) for w, v in pesos.items()},
        "alpha_user": alfa if (modalidades or motivos) else 0.0,
        "motivos_usados": motivos,
        "afinidad_afrontamiento": {k: round(v, 3) for k, v in afinidad.items()} or None,
        "modelo_afrontamiento": (cargar_afrontamiento() or {}).get("modelo") if afinidad else None,
        "candidates": estrictos,
        "mipyme_in_top": sum(1 for c in elegidos if c["es_mipyme"]),
        "destinations": elegidos,
        "aviso_coincidencia": aviso,
        "notice": ("El estrés solo ajusta qué tipo de experiencia se prioriza; no es un diagnóstico "
                   "ni una promesa de beneficio para la salud."),
    }
