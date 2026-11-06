"""Copia textual de la PSS-10 (versión con licencia) al asset de la app móvil.

Lee la tabla del instrumento `PSS-10_AU2.0_spa-MX_09OCT2024.docx` (licencia Mapi Research
Trust n.º 153824) y llena `MOBILE/assets/instrumentos/pss10_es_mx.json` sin modificar el texto:
instrucción, las 5 opciones de respuesta y los 10 ítems. No imprime el contenido; solo valida
la estructura. El uso del texto está sujeto a las condiciones de la licencia.

Uso:
    python extraer_pss10.py <ruta_docx>
"""
from __future__ import annotations

import html
import json
import re
import sys
import zipfile
from pathlib import Path

ASSET = Path(__file__).resolve().parents[2] / "MOBILE" / "assets" / "instrumentos" / "pss10_es_mx.json"


def _texto(fragmento: str) -> str:
    return html.unescape("".join(re.findall(r"<w:t[^>]*>([^<]*)</w:t>", fragmento))).strip()


def extraer(ruta_docx: Path) -> dict:
    xml = zipfile.ZipFile(ruta_docx).read("word/document.xml").decode("utf-8")
    tabla = re.search(r"<w:tbl>.*?</w:tbl>", xml, flags=re.S).group(0)
    filas = [[_texto(c) for c in re.findall(r"<w:tc>.*?</w:tc>", f, flags=re.S)]
             for f in re.findall(r"<w:tr[ >].*?</w:tr>", tabla, flags=re.S)]
    # Fila de opciones: 5 celdas de texto no numérico; filas de ítems: texto largo en la primera celda.
    opciones = next(f[1:6] for f in filas if all(c and not c.isdigit() for c in f[1:6]))
    items = [f[0] for f in filas if len(f[0]) > 40]
    antes_de_tabla = xml[: xml.index("<w:tbl>")]
    parrafos = [_texto(p) for p in re.findall(r"<w:p[ >].*?</w:p>", antes_de_tabla, flags=re.S)]
    instruccion = max(parrafos, key=len)
    if len(opciones) != 5 or len(items) != 10 or len(instruccion) < 100:
        raise ValueError(f"Estructura inesperada: {len(opciones)} opciones, {len(items)} ítems")
    # La app numera los ítems; se quita solo la numeración inicial ("1." / "1)") si el documento la trae.
    items = [re.sub(r"^\d+\s*[.)]\s*", "", i) for i in items]
    return {"instruccion": instruccion, "opciones": opciones, "items": items}


if __name__ == "__main__":
    contenido = extraer(Path(sys.argv[1]))
    asset = json.loads(ASSET.read_text(encoding="utf-8"))
    asset.update(contenido)
    ASSET.write_text(json.dumps(asset, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"PSS-10 copiada: instrucción ({len(contenido['instruccion'])} car.), "
          f"{len(contenido['opciones'])} opciones, {len(contenido['items'])} ítems -> {ASSET}")
