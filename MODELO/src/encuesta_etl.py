"""ETL de la encuesta "Estrés percibido y preferencias turísticas" (WELLTUR, oct-2026).

Extrae el CSV de Google Forms, limpia y codifica las respuestas, calcula los
índices de estrés y bienestar y deja un dataset anónimo listo para modelar.

Los índices son de ítems propios inspirados en PSS (P3-P4), en síntomas de tensión
(P5) y en WHO-5 (P6); se reportan como puntajes continuos 0-100, sin puntos de corte.

Uso:
    python encuesta_etl.py [ruta_csv_crudo] [ruta_salida]
"""
from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd

BASE = Path(__file__).resolve().parent.parent
RAW_DEFAULT = BASE / "data" / "encuesta" / "raw" / "encuesta_estres_preferencias_2026.csv"
OUT_DEFAULT = BASE / "data" / "encuesta" / "encuesta_limpia.csv"

# Nombres cortos por posición de columna del formulario.
COLUMNAS = [
    "marca_temporal", "edad", "ocupacion", "p3_estres_mes", "p4_sin_control_mes",
    "p5a_dificultad_relajarse", "p5b_nerviosismo", "p5c_irritabilidad", "p5d_concentracion",
    "p6a_buen_animo", "p6b_tranquilo", "p6c_energia", "p6d_descansado",
    "p7_manifestaciones", "p8_estresores", "p9_satisfaccion", "p10_experiencias", "p11_usaria_app",
]

ESCALA_P3_P4 = {"Nunca": 0, "Casi nunca": 1, "Algunas veces": 2, "Frecuentemente": 3, "Muy frecuentemente": 4}
ESCALA_P5 = {"Nunca": 0, "A veces": 1, "Frecuentemente": 2, "Casi siempre": 3}
ESCALA_P6 = {"Nunca": 0, "Ocasionalmente": 1, "Más de la mitad del tiempo": 2, "Casi todo el tiempo": 3}
ESCALA_P9 = {
    "Nada satisfecho(a)": 0, "Poco satisfecho(a)": 1, "Moderadamente satisfecho(a)": 2,
    "Muy satisfecho(a)": 3, "Completamente satisfecho(a)": 4,
}
EDAD_ORDINAL = {
    "Menos de 18 años": 0, "De 18 a 24 años": 1, "De 25 a 34 años": 2, "De 35 a 44 años": 3,
    "De 45 a 54 años": 4, "55 años o más": 5,
}

OCUPACION_GRUPO = {
    "Estudiante universitario / Formación profesional": "estudiante",
    "Estudiante y trabajador (combina estudios con empleo)": "estudia_y_trabaja",
    "Empleado a tiempo completo (en empresa o institución)": "empleado",
    "Empleado a tiempo parcial / Media jornada": "empleado",
    "Empresario / Emprendedor / Dueño de negocio": "independiente",
    "Trabajador independiente / Freelance / Profesional autónomo": "independiente",
    "Trabajos del hogar / Cuidado de la familia (sin remuneración económica)": "hogar",
    "Jubilado / Prejubilado / Pensionista": "jubilado",
    "Profesora 1 plaza activa y en otra jubilada": "empleado",
}

# Opciones de selección múltiple -> columna binaria. Las variantes ortográficas se unifican.
P7_OPCIONES = {
    "Cansancio o falta de energía": "sint_cansancio",
    "Tensión muscular o dolor de cabeza": "sint_tension_muscular",
    "Dificultades para dormir": "sint_sueno",
    "Sensación de estar sobrepasado(a)": "sint_sobrepasado",
    "Preocupación persistente": "sint_preocupacion",
    "Precoupación persistente": "sint_preocupacion",
    "Dificultad para tomar decisiones": "sint_decisiones",
}
P8_OPCIONES = {
    "Trabajo o estudios": "estr_trabajo_estudios",
    "Falta de tiempo o exceso de actividades": "estr_falta_tiempo",
    "Responsabilidades familiares o personales": "estr_familia",
    "Situación económica": "estr_economia",
    "Incertidumbre sobre el futuro": "estr_incertidumbre",
    "Traslados o tráfico": "estr_traslados",
    "Relaciones interpersonales": "estr_relaciones",
}
P10_OPCIONES = {
    "Visitas a cascadas, ríos o espacios naturales": "pref_cascadas_rios",
    "Caminatas en bosques y montañas": "pref_caminatas",
    "Actividades de relajación, meditación o respiración": "pref_relajacion",
    "Hospedaje en entornos tranquilos": "pref_hospedaje_tranquilo",
    "Experiencias culturales y artesanales": "pref_cultural",
    "Gastronomía local": "pref_gastronomia",
    "Actividades recreativas de baja intensidad": "pref_baja_intensidad",
    "Convivencia con comunidades rurales": "pref_comunidades",
}
PREFERENCIAS = list(dict.fromkeys(P10_OPCIONES.values()))
SINTOMAS = list(dict.fromkeys(P7_OPCIONES.values()))
ESTRESORES = list(dict.fromkeys(P8_OPCIONES.values()))

# Tipo de experiencia (P10) -> intensidad por modalidad WELLTUR W1-W7 (0-2).
# W1 descanso, W2 naturaleza, W3 movimiento, W4 mente-cuerpo, W5 culinaria,
# W6 aprendizaje/cultura, W7 autocuidado.
PREF_A_W = {
    "pref_cascadas_rios": {"W2": 2, "W3": 1},
    "pref_caminatas": {"W2": 2, "W3": 2},
    "pref_relajacion": {"W4": 2, "W1": 1, "W7": 1},
    "pref_hospedaje_tranquilo": {"W1": 2, "W7": 1},
    "pref_cultural": {"W6": 2},
    "pref_gastronomia": {"W5": 2, "W6": 1},
    "pref_baja_intensidad": {"W1": 1, "W2": 1, "W3": 1},
    "pref_comunidades": {"W6": 2, "W2": 1},
}

P5 = ["p5a_dificultad_relajarse", "p5b_nerviosismo", "p5c_irritabilidad", "p5d_concentracion"]
P6 = ["p6a_buen_animo", "p6b_tranquilo", "p6c_energia", "p6d_descansado"]


def cargar_crudo(ruta: Path | str = RAW_DEFAULT) -> pd.DataFrame:
    df = pd.read_csv(ruta, encoding="utf-8-sig")
    if df.shape[1] != len(COLUMNAS):
        raise ValueError(f"Se esperaban {len(COLUMNAS)} columnas y llegaron {df.shape[1]}")
    df.columns = COLUMNAS
    return df


def _multi_hot(serie: pd.Series, opciones: dict[str, str]) -> tuple[pd.DataFrame, list[str]]:
    columnas = list(dict.fromkeys(opciones.values()))
    salida = pd.DataFrame(0, index=serie.index, columns=columnas, dtype=int)
    no_mapeadas: list[str] = []
    for idx, valor in serie.items():
        if pd.isna(valor):
            continue
        for opcion in (x.strip() for x in str(valor).split(";")):
            if opcion in opciones:
                salida.at[idx, opciones[opcion]] = 1
            elif opcion:
                no_mapeadas.append(opcion)
    return salida, no_mapeadas


def _promedio_prorrateado(bloque: pd.DataFrame, max_faltantes: int = 1) -> pd.Series:
    """Promedio de ítems; si faltan más de `max_faltantes` el índice queda vacío."""
    faltantes = bloque.isna().sum(axis=1)
    return bloque.mean(axis=1).where(faltantes <= max_faltantes)


def limpiar(df: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    log: dict = {"filas_crudas": int(len(df))}

    df = df.copy()
    df = df[df["edad"] != "Menos de 18 años"]
    log["excluidas_menores"] = log["filas_crudas"] - len(df)

    antes = len(df)
    df = df[~df.drop(columns="marca_temporal").duplicated()]
    log["excluidas_duplicadas"] = antes - len(df)

    antes = len(df)
    df = df[df["p10_experiencias"].fillna("").str.strip() != ""]
    log["excluidas_sin_p10"] = antes - len(df)

    out = pd.DataFrame(index=df.index)
    out["edad_rango"] = df["edad"]
    out["edad_ord"] = df["edad"].map(EDAD_ORDINAL)
    out["ocupacion"] = df["ocupacion"].map(OCUPACION_GRUPO).fillna("otro")
    out["p3"] = df["p3_estres_mes"].map(ESCALA_P3_P4)
    out["p4"] = df["p4_sin_control_mes"].map(ESCALA_P3_P4)
    for c in P5:
        out[c] = df[c].map(ESCALA_P5)
    for c in P6:
        out[c] = df[c].map(ESCALA_P6)
    out["satisfaccion"] = df["p9_satisfaccion"].map(ESCALA_P9)
    out["usaria_app"] = df["p11_usaria_app"].map({"Sí": 1, "No": 0})

    # Índices 0-100 (porcentaje del máximo posible); P5 y P6 toleran 1 ítem faltante.
    p5_media = _promedio_prorrateado(out[P5]) / 3
    out["estres_0_100"] = (pd.concat([out["p3"] / 4, out["p4"] / 4, p5_media, p5_media, p5_media, p5_media], axis=1)
                           .mean(axis=1, skipna=False) * 100).round(1)
    out["tension_0_100"] = (p5_media * 100).round(1)
    out["bienestar_0_100"] = (_promedio_prorrateado(out[P6]) / 3 * 100).round(1)
    log["indice_estres_vacio"] = int(out["estres_0_100"].isna().sum())
    log["indice_bienestar_vacio"] = int(out["bienestar_0_100"].isna().sum())

    no_mapeadas: dict[str, list[str]] = {}
    for col, opciones in [("p7_manifestaciones", P7_OPCIONES), ("p8_estresores", P8_OPCIONES),
                          ("p10_experiencias", P10_OPCIONES)]:
        binarias, extra = _multi_hot(df[col], opciones)
        out = out.join(binarias)
        no_mapeadas[col] = sorted(set(extra))
    log["respuestas_abiertas_no_mapeadas"] = no_mapeadas

    out.insert(0, "id_respuesta", [f"R{i:03d}" for i in range(1, len(out) + 1)])
    out = out.reset_index(drop=True)
    log["filas_limpias"] = int(len(out))
    return out, log


def ejecutar(ruta_crudo: Path | str = RAW_DEFAULT, ruta_salida: Path | str = OUT_DEFAULT) -> tuple[pd.DataFrame, dict]:
    ruta_crudo, ruta_salida = Path(ruta_crudo), Path(ruta_salida)
    limpio, log = limpiar(cargar_crudo(ruta_crudo))
    log["sha256_crudo"] = hashlib.sha256(ruta_crudo.read_bytes()).hexdigest()
    ruta_salida.parent.mkdir(parents=True, exist_ok=True)
    limpio.to_csv(ruta_salida, index=False, encoding="utf-8")
    ruta_salida.with_suffix(".log.json").write_text(json.dumps(log, ensure_ascii=False, indent=2), encoding="utf-8")
    return limpio, log


if __name__ == "__main__":
    args = sys.argv[1:]
    _, resumen = ejecutar(*(args[:2] or []))
    print(json.dumps(resumen, ensure_ascii=False, indent=2))
