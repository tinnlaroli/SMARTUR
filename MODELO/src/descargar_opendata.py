import csv
import io
import json
import os
import sys
import urllib.request
import urllib.error

_DIR = os.path.dirname(os.path.abspath(__file__))
_DATA = os.path.join(_DIR, '..', 'data')
_OPENDATA = os.path.join(_DATA, 'opendata')

SOURCES = [
    {
        'name': 'atractivos_turisticos',
        'ckan_id': 'atractivos-turisticos',
    },
    {
        'name': 'museos_puebla',
        'ckan_id': 'museos-del-estado-de-puebla',
    },
    {
        'name': 'pueblos_magicos_puebla',
        'ckan_id': 'pueblos-magicos-del-estado-de-puebla',
    },
]

VERACRUZ_SOURCES = [
    {
        'name': 'restaurantes_veracruz',
        'url': 'https://datos.veracruzmunicipio.gob.mx/dataset/restaurantes-en-veracruz-2024/resource/c0e44c99-c4aa-42a6-afd7-91f83541f3d6/download/restaurantes.csv',
    },
]


def _ckan_download_csv(package_id: str) -> list[dict]:
    api_url = f'https://www.datamx.io/api/3/action/package_show?id={package_id}'
    try:
        req = urllib.request.Request(api_url, headers={'User-Agent': 'SMARTUR/1.0'})
        with urllib.request.urlopen(req, timeout=15) as resp:
            body = json.loads(resp.read().decode('utf-8'))
    except Exception as e:
        print(f"  [ERR] CKAN API {package_id}: {e}")
        return []

    resources = body.get('result', {}).get('resources', [])
    csv_urls = [r['url'] for r in resources if r.get('format', '').upper() in ('CSV',)]
    if not csv_urls:
        csv_urls = [r['url'] for r in resources if r.get('url', '').endswith('.csv')]

    for csv_url in csv_urls:
        try:
            print(f"  Descargando: {csv_url}")
            req2 = urllib.request.Request(csv_url, headers={'User-Agent': 'SMARTUR/1.0'})
            with urllib.request.urlopen(req2, timeout=30) as resp2:
                raw = resp2.read().decode('utf-8-sig')
            reader = csv.DictReader(io.StringIO(raw))
            rows = list(reader)
            print(f"    {len(rows)} filas obtenidas")
            return rows
        except Exception as e:
            print(f"    [ERR] falló descarga CSV: {e}")
    return []


def _download_http(url: str):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'SMARTUR/1.0'})
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read().decode('utf-8-sig')
        reader = csv.DictReader(io.StringIO(raw))
        return list(reader)
    except Exception as e:
        print(f"  [ERR] HTTP download: {e}")
        return None


def descargar_opendata():
    os.makedirs(_OPENDATA, exist_ok=True)

    for src in SOURCES:
        dst = os.path.join(_OPENDATA, f"{src['name']}.csv")
        if os.path.exists(dst) and os.path.getsize(dst) > 100:
            print(f"[skip] {src['name']} ya existe ({os.path.getsize(dst)} bytes)")
            continue

        print(f"\n[descargar] {src['name']} (CKAN)...")
        rows = _ckan_download_csv(src['ckan_id'])
        if not rows:
            print(f"  Sin datos para {src['name']}")
            continue

        with open(dst, 'w', newline='', encoding='utf-8') as f:
            w = csv.DictWriter(f, fieldnames=rows[0].keys())
            w.writeheader()
            w.writerows(rows)
        print(f"  Guardado: {dst} ({len(rows)} filas)")

    for src in VERACRUZ_SOURCES:
        dst = os.path.join(_OPENDATA, f"{src['name']}.csv")
        if os.path.exists(dst) and os.path.getsize(dst) > 100:
            print(f"[skip] {src['name']} ya existe ({os.path.getsize(dst)} bytes)")
            continue

        print(f"\n[descargar] {src['name']} (HTTP)...")
        rows = _download_http(src['url'])
        if not rows:
            print(f"  Sin datos para {src['name']}")
            continue

        with open(dst, 'w', newline='', encoding='utf-8') as f:
            w = csv.DictWriter(f, fieldnames=rows[0].keys())
            w.writeheader()
            w.writerows(rows)
        print(f"  Guardado: {dst} ({len(rows)} filas)")


if __name__ == '__main__':
    descargar_opendata()
