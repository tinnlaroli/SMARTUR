"""ETL del DENUE (INEGI) -> catálogo WELLTUR de las Altas Montañas de Veracruz.

Extrae el CSV de la descarga masiva (zip por entidad), filtra los 57 municipios de la
región, selecciona actividades con valor turístico-wellness por código SCIAN y por
palabras clave del nombre, marca MiPyMEs con el estrato oficial de personal ocupado
(<= 100 personas) y propone etiquetas W1-W7 con su evidencia.

Las etiquetas son una propuesta por reglas (actividad SCIAN + nombre); quedan anotadas
como pendientes de verificación en campo. Salidas:
    data/catalogo/catalogo_denue_altas_montanas.csv
    data/catalogo/catalogo_denue_altas_montanas.log.json

Uso:
    python denue_etl.py <ruta_zip_o_csv_denue>
"""
from __future__ import annotations

import io
import json
import re
import sys
import unicodedata
import zipfile
from pathlib import Path

import pandas as pd

BASE = Path(__file__).resolve().parent.parent
SALIDA = BASE / "data" / "catalogo" / "catalogo_denue_altas_montanas.csv"

MUNICIPIOS = [
    "Acultzingo", "Alpatláhuac", "Amatlán de los Reyes", "Aquila", "Astacinga", "Atlahuilco", "Atoyac",
    "Atzacan", "Calcahualco", "Camarón de Tejeda", "Camerino Z. Mendoza", "Carrillo Puerto", "Chocamán",
    "Coetzala", "Comapa", "Córdoba", "Coscomatepec", "Cuichapa", "Cuitláhuac", "Fortín", "Huatusco",
    "Huiloapan de Cuauhtémoc", "Ixhuatlán del Café", "Ixhuatlancillo", "Ixtaczoquitlán", "La Perla",
    "Los Reyes", "Magdalena", "Maltrata", "Mariano Escobedo", "Mixtla de Altamirano", "Naranjal", "Nogales",
    "Omealca", "Orizaba", "Paso del Macho", "Rafael Delgado", "Río Blanco", "San Andrés Tenejapan",
    "Sochiapa", "Soledad Atzompa", "Tehuipango", "Tenampa", "Tepatlaxco", "Tequila", "Texhuacán", "Tezonapa",
    "Tlacotepec de Mejía", "Tlaltetela", "Tlaquilpa", "Tlilapan", "Tomatlán", "Totutla", "Xoxocotla", "Yanga",
    "Zentla", "Zongolica",
]
ESTRATOS_MIPYME = {"0 a 5 personas", "6 a 10 personas", "11 a 30 personas", "31 a 50 personas", "51 a 100 personas"}


def _norm(valor: object) -> str:
    raw = unicodedata.normalize("NFKD", str(valor or ""))
    return "".join(c for c in raw if not unicodedata.combining(c)).casefold().strip()


# Reglas por nombre: (patrón, categoría, modalidades {W: intensidad}, demanda física 0-1,
# prefijos SCIAN permitidos). El nombre describe mejor la experiencia, pero solo cuenta
# dentro de actividades de servicio afines (evita "Autolavado Spa" o "Abarrotes la Cabaña").
SCIAN_CUIDADO = ("8121", "8129", "6213", "6219", "7211", "713")
REGLAS_NOMBRE = [
    (r"temazcal", "Spa_Temazcal", {"W7": 2, "W1": 2, "W4": 1}, 0.1, SCIAN_CUIDADO),
    (r"\bspa\b|masaje|termal|hidroterapia|relajaci", "Spa_Temazcal", {"W7": 2, "W1": 2}, 0.0, SCIAN_CUIDADO),
    (r"yoga|medita|mindful|pilates|tai ?chi|reiki", "Mente_Cuerpo", {"W4": 2, "W7": 1, "W1": 1}, 0.2,
     ("7139", "6116", "8121", "8129", "6213")),
    (r"ecotur|\baventura|rappel|rafting|canopy|tirolesa|senderis|expedici|campamento|camping",
     "Naturaleza_Aventura", {"W2": 2, "W3": 2}, 0.8, ("5615", "7131", "7139", "712", "721")),
    (r"caba[nñ]as?|glamping|ecolodge|eco ?hotel|finca|hacienda|rancho|bosque|monta[nñ]a|mirador|cascada",
     "Hospedaje_Naturaleza",
     {"W1": 2, "W2": 1, "W7": 1}, 0.2, ("721",)),
    (r"cascada|mirador|parque ecol|reserva|jard[ií]n bot[aá]nico|orquid", "Naturaleza",
     {"W2": 2, "W3": 1, "W1": 1}, 0.5, ("712", "7131", "7139")),
    (r"caf[eé].*(finca|altura|org[aá]nico|tostad|de olla)|cafetal", "Cafe_de_Altura", {"W5": 2, "W6": 1, "W1": 1},
     0.1, ("7225",)),  # restaurantes y cafeterías; los bares (7224) no son experiencia de descanso
]

# Reglas por SCIAN: código o prefijo -> (categoría, modalidades, demanda física, condición opcional sobre el nombre).
REGLAS_SCIAN = [
    ("7211", "Hospedaje", {"W1": 2, "W7": 1}, 0.1, None),             # hoteles (moteles se excluyen abajo)
    ("721210", "Hospedaje_Naturaleza", {"W1": 2, "W2": 1}, 0.3, None),  # campamentos y albergues recreativos
    ("721311", "Hospedaje", {"W1": 2}, 0.1, None),                      # pensiones y casas de huéspedes
    ("712111", "Cultura", {"W6": 2, "W1": 1}, 0.2, None),               # museos privados
    ("712112", "Cultura", {"W6": 2, "W1": 1}, 0.2, None),               # museos públicos
    ("712120", "Cultura", {"W6": 2, "W3": 1}, 0.3, None),               # sitios históricos
    ("71213", "Naturaleza", {"W2": 2, "W6": 1, "W1": 1}, 0.3, None),    # jardines botánicos y zoológicos
    ("712190", "Naturaleza", {"W2": 2, "W3": 1, "W1": 1}, 0.5, None),   # grutas, parques naturales y otros sitios
    ("71311", "Balneario", {"W1": 1, "W2": 1, "W7": 1}, 0.3, None),     # parques acuáticos y balnearios
    ("722511", "Gastronomia", {"W5": 2}, 0.1, "establecido"),           # restaurantes a la carta (>= 6 personas)
    ("722515", "Gastronomia", {"W5": 2, "W1": 1}, 0.0, r"caf[eé]"),     # cafeterías que se presentan como café
    ("722512", "Gastronomia", {"W5": 2}, 0.1, "establecido"),           # pescados y mariscos (>= 6 personas)
    ("465915", "Artesania", {"W6": 2}, 0.1, None),                      # tiendas de artesanías
    ("561520", "Naturaleza_Aventura", {"W2": 2, "W3": 2}, 0.7, None),   # organización de excursiones
]
EXCLUIR_SCIAN = ("721113",)  # moteles
# Además de lo que no es turismo, se quitan cantinas registradas como restaurante: no son descanso para alguien estresado.
EXCLUIR_NOMBRE = re.compile(r"perr|canin|mascot|\bauto|\bcars?\b|lavado|dental|odonto|estacionam"
                            r"|^bar\b|cantina|\bpub\b|sports bar|\bantro|\bnight")
ESTRATOS_ESTABLECIDOS = ESTRATOS_MIPYME - {"0 a 5 personas"} | {"101 a 250 personas", "251 y más personas"}

NOMBRES_W = {
    "W1": "pausa y descanso", "W2": "naturaleza y aire libre", "W3": "movimiento", "W4": "práctica mente-cuerpo",
    "W5": "experiencia culinaria", "W6": "aprendizaje y cultura", "W7": "autocuidado",
}


def leer_denue(ruta: Path | str) -> tuple[pd.DataFrame, str]:
    ruta = Path(ruta)
    edicion_meta = None
    if ruta.suffix.lower() == ".zip":
        with zipfile.ZipFile(ruta) as z:
            nombre = next(n for n in z.namelist() if "conjunto_de_datos" in n and n.lower().endswith(".csv"))
            datos = z.read(nombre)
            meta = next((n for n in z.namelist() if n.lower().endswith("metadatos_denue.txt")), None)
            if meta:
                # La edición vigente no lleva fecha en el nombre del zip; el título de los metadatos sí ("DENUE 05_2026").
                titulo = re.search(r"\(DENUE\)\s*(\d{2})_(\d{4})", z.read(meta).decode("latin-1"))
                if titulo:
                    edicion_meta = titulo.group(1) + titulo.group(2)[2:]
        try:
            df = pd.read_csv(io.BytesIO(datos), encoding="utf-8-sig", dtype=str, low_memory=False)
        except UnicodeDecodeError:
            df = pd.read_csv(io.BytesIO(datos), encoding="latin-1", dtype=str, low_memory=False)
    else:
        df = pd.read_csv(ruta, encoding="utf-8-sig", dtype=str, low_memory=False)
    edicion = re.search(r"denue_\d+_(\d{4}|\d{8}|csv)", ruta.name)
    if edicion and edicion.group(1) != "csv":
        return df, edicion.group(1)
    return df, edicion_meta or "vigente"


def _clasificar(fila: pd.Series) -> tuple[str, dict[str, int], float, str] | None:
    nombre = _norm(fila["nom_estab"])
    codigo = str(fila["codigo_act"])
    if codigo.startswith(EXCLUIR_SCIAN) or EXCLUIR_NOMBRE.search(nombre):
        return None
    for patron, categoria, mods, esfuerzo, prefijos in REGLAS_NOMBRE:
        if codigo.startswith(prefijos) and re.search(patron, nombre):
            return categoria, mods, esfuerzo, "nombre"
    for prefijo, categoria, mods, esfuerzo, condicion in REGLAS_SCIAN:
        if not codigo.startswith(prefijo):
            continue
        if condicion == "establecido" and fila["per_ocu"] not in ESTRATOS_ESTABLECIDOS:
            return None
        if condicion not in (None, "establecido") and not re.search(condicion, nombre):
            return None
        return categoria, mods, esfuerzo, "scian"
    return None


def _titulo(texto: str) -> str:
    menores = {"de", "del", "la", "las", "el", "los", "y", "en", "a"}
    palabras = str(texto).strip().lower().split()
    return " ".join(p if i and p in menores else p.capitalize() for i, p in enumerate(palabras))[:150]


def transformar(df: pd.DataFrame, edicion: str) -> tuple[pd.DataFrame, dict]:
    log: dict = {"edicion_denue": edicion, "registros_entidad": int(len(df))}
    municipios = {_norm(m): m for m in MUNICIPIOS}
    region = df[df["municipio"].map(_norm).isin(municipios)].copy()
    log["registros_region"] = int(len(region))
    log["municipios_sin_registros"] = sorted(set(municipios) - set(region["municipio"].map(_norm)))

    clasif = region.apply(_clasificar, axis=1)
    region = region[clasif.notna()].copy()
    clasif = clasif[clasif.notna()]
    region["categoria_wellness"] = [c[0] for c in clasif]
    region["modalidades"] = [c[1] for c in clasif]
    region["demanda_fisica"] = [c[2] for c in clasif]
    region["regla"] = [c[3] for c in clasif]
    log["seleccionados_por_regla"] = region["regla"].value_counts().to_dict()

    region["latitud"] = pd.to_numeric(region["latitud"], errors="coerce")
    region["longitud"] = pd.to_numeric(region["longitud"], errors="coerce")
    antes = len(region)
    region = region.dropna(subset=["latitud", "longitud"])
    region = region[region["latitud"].between(18.2, 19.6) & region["longitud"].between(-97.6, -96.2)]
    log["excluidos_sin_coordenadas_validas"] = antes - len(region)

    # Duplicados: mismo nombre normalizado a menos de ~100 m (redondeo de coordenadas a 3 decimales).
    region["_clave"] = region["nom_estab"].map(_norm) + "|" + region["latitud"].round(3).astype(str) + "|" + region["longitud"].round(3).astype(str)
    antes = len(region)
    region = region.drop_duplicates("_clave")
    log["excluidos_duplicados"] = antes - len(region)

    clee = region["clee"] if "clee" in region.columns else "id-" + region["id"]
    salida = pd.DataFrame({
        "denue_clee": clee.values,
        "nombre": region["nom_estab"].map(_titulo).values,
        "municipio": region["municipio"].values,
        "localidad": region["localidad"].values,
        "scian_codigo": region["codigo_act"].values,
        "actividad": region["nombre_act"].values,
        "estrato_personal": region["per_ocu"].values,
        "es_mipyme": region["per_ocu"].isin(ESTRATOS_MIPYME).values,
        "categoria_wellness": region["categoria_wellness"].values,
        "wellness_modalities": [sorted(m) for m in region["modalidades"]],
        "intensidad_w": [json.dumps(m, sort_keys=True) for m in region["modalidades"]],
        "demanda_fisica": region["demanda_fisica"].values,
        "latitud": region["latitud"].round(6).values,
        "longitud": region["longitud"].round(6).values,
        "regla": region["regla"].values,
    })
    salida["evidencia"] = [
        json.dumps({w: f"{act} (SCIAN {cod}, DENUE {edicion}): {NOMBRES_W[w]}. Propuesta por regla; verificar en campo."
                    for w in mods}, ensure_ascii=False)
        for act, cod, mods in zip(salida["actividad"], salida["scian_codigo"], salida["wellness_modalities"])
    ]
    salida = salida.sort_values(["municipio", "categoria_wellness", "nombre"]).reset_index(drop=True)
    log["catalogo_final"] = int(len(salida))
    log["por_categoria"] = salida["categoria_wellness"].value_counts().to_dict()
    log["mipyme_pct"] = round(float(salida["es_mipyme"].mean() * 100), 1)
    log["municipios_con_oferta"] = int(salida["municipio"].nunique())
    return salida, log


def ejecutar(ruta: Path | str, salida: Path | str = SALIDA) -> tuple[pd.DataFrame, dict]:
    df, edicion = leer_denue(ruta)
    catalogo, log = transformar(df, edicion)
    salida = Path(salida)
    salida.parent.mkdir(parents=True, exist_ok=True)
    catalogo.to_csv(salida, index=False, encoding="utf-8")
    log["fuente"] = Path(ruta).name
    salida.with_suffix(".log.json").write_text(json.dumps(log, ensure_ascii=False, indent=2), encoding="utf-8")
    return catalogo, log


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit("Uso: python denue_etl.py <ruta_zip_o_csv_denue>")
    _, resumen = ejecutar(sys.argv[1])
    print(json.dumps(resumen, ensure_ascii=False, indent=2))
