"""Genera el bloque SQL idempotente del catálogo DENUE y lo inserta en API/bd.sql.

El bloque queda entre marcadores para regenerarse sin duplicar: crea las localidades
municipales que falten, inserta/actualiza los POI por `denue_clee` y aprueba sus
etiquetas W como propuesta por regla (pendiente de verificación en campo).

Uso:
    python catalogo_a_sql.py [ruta_catalogo_csv] [ruta_bd_sql]
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import pandas as pd

BASE = Path(__file__).resolve().parent.parent
CATALOGO = BASE / "data" / "catalogo" / "catalogo_denue_altas_montanas.csv"
BD_SQL = BASE.parent / "API" / "bd.sql"
INICIO = "-- >>> WELLTUR CATALOGO DENUE (generado por MODELO/src/catalogo_a_sql.py; no editar a mano)"
FIN = "-- <<< WELLTUR CATALOGO DENUE"

CATEGORIAS_MAPEADAS = {
    "Gastronomia": ["gastronomy"], "Cafe_de_Altura": ["gastronomy", "culture"], "Hospedaje": ["lodging"],
    "Hospedaje_Naturaleza": ["lodging", "nature"], "Naturaleza": ["nature"], "Naturaleza_Aventura": ["nature", "adventure"],
    "Balneario": ["nature", "relax"], "Spa_Temazcal": ["relax"], "Mente_Cuerpo": ["relax"], "Cultura": ["culture"],
    "Artesania": ["culture", "shopping"],
}
AL_AIRE_LIBRE = {"Naturaleza", "Naturaleza_Aventura", "Balneario", "Hospedaje_Naturaleza"}

# Experiencias reales del recorrido de campo del equipo (ya en bd.sql): se aprueban con W revisadas.
EXPERIENCIAS_CAMPO = {
    "Ruta de Recolección de Hongos Silvestres (Nuevo Vaquería)": ("Naturaleza_Aventura", {
        "W2": "Recorrido de campo por bosque de niebla con familias de Nuevo Vaquería.",
        "W3": "Caminata guiada para identificar hongos comestibles.",
        "W5": "Cocina tradicional de hongos silvestres al final del recorrido."}, 0.6),
    "Mercadito de los Miércoles": ("Gastronomia", {
        "W5": "Tamales de chilatole, pan de manjar y café de la región.",
        "W6": "Mercado tradicional semanal de productores locales."}, 0.1),
    "Ruta Cafetalera Urbana (Parque Hidalgo)": ("Cafe_de_Altura", {
        "W5": "Degustación de café de altura con tostado artesanal.",
        "W6": "Recorrido por la historia cafetalera de Ixhuatlán del Café."}, 0.2),
    "Mujeres de la Niebla": ("Gastronomia", {
        "W5": "Taller de cocina tradicional con el colectivo de productoras.",
        "W6": "Aprendizaje de recetas serranas: tamales de hongos y tlatoniles."}, 0.1),
    "Visita a la cocinera tradicional Doña Chela": ("Gastronomia", {
        "W5": "Elaboración participativa de mole en metate.",
        "W6": "Transmisión directa de saberes de cocina tradicional."}, 0.1),
    "Mercado prehispánico rodante (Trueque)": ("Cultura", {
        "W6": "Mercado donde aún se practica el trueque prehispánico.",
        "W5": "Productos locales: quelites, hongos, quesos de cabra y chapulines."}, 0.1),
}


def _q(valor: object) -> str:
    if valor is None or (isinstance(valor, float) and pd.isna(valor)):
        return "NULL"
    return "'" + str(valor).replace("'", "''") + "'"


def _arreglo(codigos: list[str]) -> str:
    return "ARRAY[" + ",".join(_q(c) for c in codigos) + "]::TEXT[]" if codigos else "'{}'::TEXT[]"


def generar_bloque(cat: pd.DataFrame) -> str:
    partes = [INICIO,
              "-- Catálogo regional de las Altas Montañas desde el DENUE (INEGI). Idempotente: se puede re-ejecutar.",
              "-- Etiquetas W propuestas por reglas SCIAN/nombre; quedan anotadas como pendientes de verificación en campo."]

    municipios = cat.groupby("municipio")[["latitud", "longitud"]].mean().round(6)
    for municipio, fila in municipios.iterrows():
        partes.append(
            "INSERT INTO location (name, state, municipality, latitude, longitude)\n"
            f"SELECT {_q(municipio)}, 'Veracruz', {_q(municipio)}, {fila.latitud}, {fila.longitud}\n"
            f"WHERE NOT EXISTS (SELECT 1 FROM location WHERE state = 'Veracruz' AND "
            f"(municipality = {_q(municipio)} OR name = {_q(municipio)}));"
        )

    valores = []
    for r in cat.itertuples():
        modalidades = json.loads(r.wellness_modalities.replace("'", '"')) if isinstance(r.wellness_modalities, str) else list(r.wellness_modalities)
        descripcion = f"{r.actividad} en {r.localidad}, {r.municipio}. Fuente: DENUE (INEGI)."
        valores.append("  (" + ", ".join([
            _q(r.nombre), _q(r.actividad), _q(json.dumps(CATEGORIAS_MAPEADAS.get(r.categoria_wellness, []))) + "::jsonb",
            "TRUE" if r.categoria_wellness in AL_AIRE_LIBRE else "FALSE", str(r.latitud), str(r.longitud),
            f"(SELECT id_location FROM location WHERE state = 'Veracruz' AND (municipality = {_q(r.municipio)} "
            f"OR name = {_q(r.municipio)}) ORDER BY id_location LIMIT 1)",
            _q(descripcion), _q(r.categoria_wellness), str(r.demanda_fisica), _q(descripcion),
            _arreglo(modalidades), _q(r.evidencia) + "::jsonb", _q(r.denue_clee), _q(r.scian_codigo),
            _q(r.estrato_personal), "TRUE" if r.es_mipyme else "FALSE",
        ]) + ")")
    partes.append(
        "INSERT INTO point_of_interest (name, categories_raw, categories_mapped, outdoor, latitude, longitude,\n"
        "  id_location, description, categoria_wellness, demanda_fisica, descripcion_bienestar,\n"
        "  wellness_modalities, wellness_mw_evidence, denue_clee, scian_codigo, estrato_personal, es_mipyme) VALUES\n"
        + ",\n".join(valores) + "\n"
        "ON CONFLICT (denue_clee) WHERE denue_clee IS NOT NULL DO UPDATE SET\n"
        "  name = EXCLUDED.name, categories_raw = EXCLUDED.categories_raw, categories_mapped = EXCLUDED.categories_mapped,\n"
        "  latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude, categoria_wellness = EXCLUDED.categoria_wellness,\n"
        "  demanda_fisica = EXCLUDED.demanda_fisica, wellness_modalities = EXCLUDED.wellness_modalities,\n"
        "  wellness_mw_evidence = EXCLUDED.wellness_mw_evidence, estrato_personal = EXCLUDED.estrato_personal,\n"
        "  es_mipyme = EXCLUDED.es_mipyme;"
    )
    vigentes = ", ".join(_q(c) for c in cat.denue_clee)
    partes.append(
        "UPDATE point_of_interest SET rating = NULL, validation_status = 'active', is_wellness = TRUE, is_active = TRUE,\n"
        "  wellness_status = 'approved', wellness_reviewed_at = COALESCE(wellness_reviewed_at, NOW()),\n"
        "  wellness_mw_reviewed_at = COALESCE(wellness_mw_reviewed_at, NOW()),\n"
        "  wellness_admin_notes = 'Etiquetas W propuestas por regla SCIAN/nombre (DENUE INEGI); pendiente verificación en campo.'\n"
        f"WHERE denue_clee IN ({vigentes}) AND wellness_admin_notes IS DISTINCT FROM 'Verificado en campo';"
    )
    # Negocios de ediciones anteriores que ya no están en el DENUE vigente: se retiran sin borrarlos
    # (pueden tener impresiones o calificaciones asociadas).
    partes.append(
        "UPDATE point_of_interest SET is_active = FALSE,\n"
        "  wellness_admin_notes = 'Retirado: no aparece en la edición vigente del DENUE.'\n"
        f"WHERE denue_clee IS NOT NULL AND denue_clee NOT IN ({vigentes})\n"
        "  AND wellness_admin_notes IS DISTINCT FROM 'Verificado en campo';"
    )
    for nombre, (categoria, evidencia, esfuerzo) in EXPERIENCIAS_CAMPO.items():
        partes.append(
            f"UPDATE point_of_interest SET is_wellness = TRUE, wellness_status = 'approved', es_mipyme = TRUE,\n"
            f"  categoria_wellness = {_q(categoria)}, demanda_fisica = {esfuerzo},\n"
            f"  wellness_modalities = {_arreglo(sorted(evidencia))},\n"
            f"  wellness_mw_evidence = {_q(json.dumps(evidencia, ensure_ascii=False))}::jsonb,\n"
            f"  descripcion_bienestar = COALESCE(descripcion_bienestar, description),\n"
            f"  wellness_reviewed_at = COALESCE(wellness_reviewed_at, NOW()), wellness_mw_reviewed_at = COALESCE(wellness_mw_reviewed_at, NOW()),\n"
            f"  wellness_admin_notes = 'Verificado en campo'\n"
            f"WHERE name = {_q(nombre)};"
        )
    partes.append(FIN)
    return "\n".join(partes) + "\n"


def insertar_en_bd_sql(bloque: str, ruta_sql: Path = BD_SQL) -> None:
    texto = ruta_sql.read_text(encoding="utf-8")
    if INICIO in texto:
        antes, resto = texto.split(INICIO, 1)
        _, despues = resto.split(FIN + "\n", 1)
        texto = antes + bloque + despues
    else:
        cierre = "\\endif\nCOMMIT;"
        if not texto.rstrip().endswith(cierre):
            raise ValueError("No se encontró el cierre '\\endif / COMMIT;' esperado al final de bd.sql")
        texto = texto.rstrip()[: -len("COMMIT;")] + "\n" + bloque + "\nCOMMIT;\n"
    ruta_sql.write_text(texto, encoding="utf-8")


if __name__ == "__main__":
    args = sys.argv[1:]
    catalogo = pd.read_csv(args[0] if args else CATALOGO)
    bloque = generar_bloque(catalogo)
    insertar_en_bd_sql(bloque, Path(args[1]) if len(args) > 1 else BD_SQL)
    print(f"Bloque DENUE con {len(catalogo)} lugares escrito en bd.sql ({len(bloque.splitlines())} líneas)")
