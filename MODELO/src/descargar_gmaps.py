import json
import os
import re
import time
import urllib.parse

import httpx

_DIR = os.path.dirname(os.path.abspath(__file__))
_DATA = os.path.join(_DIR, '..', 'data')
_GMAPS_DIR = os.path.join(_DATA, 'gmaps')

HEADERS = {
    'User-Agent': (
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
        'AppleWebKit/537.36 (KHTML, like Gecko) '
        'Chrome/125.0.0.0 Safari/537.36'
    ),
    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
}

SEARCHES = [
    # (location, query, category_tag)
    ('Puebla+M%C3%A9xico', 'hoteles',       'accommodation'),
    ('Puebla+M%C3%A9xico', 'restaurantes',  'restaurant'),
    ('Puebla+M%C3%A9xico', 'atracciones+tur%C3%ADsticas', 'poi'),
    ('Puebla+M%C3%A9xico', 'museos',        'poi'),
    ('Puebla+M%C3%A9xico', 'parques+y+naturales', 'poi'),
    ('Cholula+Puebla',     'hoteles',       'accommodation'),
    ('Cholula+Puebla',     'restaurantes',  'restaurant'),
    ('Cholula+Puebla',     'lugares+para+visitar', 'poi'),
    ('Atlixco+Puebla',     'hoteles',       'accommodation'),
    ('Atlixco+Puebla',     'restaurantes',  'restaurant'),
    ('Atlixco+Puebla',     'atracciones',   'poi'),
    ('Zacatl%C3%A1n+Puebla', 'hoteles',     'accommodation'),
    ('Zacatl%C3%A1n+Puebla', 'restaurantes','restaurant'),
    ('Zacatl%C3%A1n+Puebla', 'atracciones', 'poi'),
    ('Cuetzalan+Puebla',   'hoteles',       'accommodation'),
    ('Cuetzalan+Puebla',   'restaurantes',  'restaurant'),
    ('Cuetzalan+Puebla',   'atracciones',   'poi'),
    ('Chignahuapan+Puebla', 'hoteles',      'accommodation'),
    ('Chignahuapan+Puebla', 'restaurantes', 'restaurant'),
    ('Chignahuapan+Puebla', 'atracciones',  'poi'),
    ('Tetela+de+Ocampo+Puebla', 'hoteles',  'accommodation'),
    ('Tetela+de+Ocampo+Puebla', 'restaurantes', 'restaurant'),
    ('Tetela+de+Ocampo+Puebla', 'atracciones',  'poi'),
    ('Xicotepec+Puebla',   'hoteles',       'accommodation'),
    ('Xicotepec+Puebla',   'restaurantes',  'restaurant'),
    ('Xicotepec+Puebla',   'atracciones',   'poi'),
    ('Orizaba+Veracruz',   'hoteles',       'accommodation'),
    ('Orizaba+Veracruz',   'restaurantes',  'restaurant'),
    ('Orizaba+Veracruz',   'atracciones',   'poi'),
    ('Xalapa+Veracruz',    'hoteles',       'accommodation'),
    ('Xalapa+Veracruz',    'restaurantes',  'restaurant'),
    ('Xalapa+Veracruz',    'atracciones',   'poi'),
    ('Coatepec+Veracruz',  'hoteles',       'accommodation'),
    ('Coatepec+Veracruz',  'restaurantes',  'restaurant'),
    ('Coatepec+Veracruz',  'atracciones',   'poi'),
    ('Papantla+Veracruz',  'hoteles',       'accommodation'),
    ('Papantla+Veracruz',  'restaurantes',  'restaurant'),
    ('Papantla+Veracruz',  'atracciones+tur%C3%ADsticas', 'poi'),
    ('Xico+Veracruz',      'atracciones',   'poi'),
    ('Teocelo+Veracruz',   'atracciones',   'poi'),
]


def _extract_place_ids(html: str) -> list[str]:
    """Extrae IDs de lugar de la respuesta HTML de búsqueda de Google Maps."""
    ids = set()
    for m in re.finditer(r'https://www\.google\.com/maps/place/(?:[^/]+/)?@?data=[^"\']*', html):
        ids.add(m.group(0))
    for m in re.finditer(r'https://www\.google\.com/maps/place/([^/@?]+)', html):
        ids.add(m.group(0))
    for m in re.finditer(r'"place_id":"([^"]+)"', html):
        ids.add(m.group(1))
    return list(ids)


def _search_places(location: str, query: str) -> list[dict]:
    """Search Google Maps for places matching query in location."""
    url = (
        f'https://www.google.com/maps/search/{query}/@{location}/data=!3m1!4b1'
    )
    try:
        resp = httpx.get(url, headers=HEADERS, follow_redirects=True, timeout=15)
        resp.raise_for_status()
        html = resp.text
        place_ids = _extract_place_ids(html)
        return [{'source_url': pid, 'query': query, 'location': location} for pid in place_ids]
    except Exception as e:
        print(f'  [ERR] search {location}/{query}: {e}')
        return []


def _scrape_place(place_ref: dict) -> dict | None:
    """Scrape place details from its Google Maps page."""
    url = place_ref['source_url']
    if not url.startswith('http'):
        url = f'https://www.google.com/maps/place/?q=place_id:{url}'

    try:
        resp = httpx.get(url, headers=HEADERS, follow_redirects=True, timeout=15)
        resp.raise_for_status()
        html = resp.text

        # Extract JSON-LD
        place = {'source_url': url, 'name': '', 'address': '', 'rating': 0.0,
                 'reviews': 0, 'price_level': 0, 'lat': None, 'lng': None,
                 'categories': '', 'phone': '', 'website': '', 'query': place_ref.get('query', ''),
                 'location': place_ref.get('location', '')}

        for m in re.finditer(r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>',
                              html, re.DOTALL):
            try:
                data = json.loads(m.group(1))
                if not isinstance(data, dict):
                    continue
                if data.get('@type') in ('LocalBusiness', 'TouristAttraction',
                                          'Place', 'Restaurant', 'Hotel', 'Museum', 'Park'):
                    place['name'] = data.get('name', place['name'])
                    place['address'] = data.get('address', {}).get('streetAddress', '')
                    geo = data.get('geo', {})
                    place['lat'] = geo.get('latitude')
                    place['lng'] = geo.get('longitude')
                    if 'aggregateRating' in data:
                        place['rating'] = data['aggregateRating'].get('ratingValue', 0)
                        place['reviews'] = data['aggregateRating'].get('reviewCount', 0)
                    place['price_level'] = len(data.get('priceRange', '')) if data.get('priceRange') else 0
                    place['telephone'] = data.get('telephone', '')
                    place['website'] = data.get('url', '')
                    cats = data.get('@type')
                    if isinstance(cats, list):
                        cats = ', '.join(cats)
                    place['categories'] = cats
                    break
            except (json.JSONDecodeError, KeyError, TypeError):
                continue

        return place
    except Exception as e:
        return None


def descargar_gmaps():
    """Main: search GMaps for Puebla + Veracruz places, scrape details."""
    os.makedirs(_GMAPS_DIR, exist_ok=True)
    print('=== Descargar Google Maps ===\n')

    all_places = []
    seen = set()

    for loc, query, tag in SEARCHES:
        print(f'Buscando: {loc} / {query} (tag={tag})')
        results = _search_places(loc, query)
        print(f'  -> {len(results)} referencias')
        for ref in results:
            ref['category_tag'] = tag
            key = ref['source_url']
            if key in seen:
                continue
            seen.add(key)
            place = _scrape_place(ref)
            if place and place.get('name'):
                all_places.append(place)
                print(f'  ✓ {place["name"]} | rating={place["rating"]} rev={place["reviews"]}')
            time.sleep(0.5)

    # Deduplicate by name
    seen_names = set()
    deduped = []
    for p in all_places:
        name = p.get('name', '').strip().lower()
        if name and name not in seen_names:
            seen_names.add(name)
            deduped.append(p)

    ts = int(time.time())
    out = os.path.join(_GMAPS_DIR, f'gmaps_raw_{ts}.json')
    with open(out, 'w', encoding='utf-8') as f:
        json.dump(deduped, f, ensure_ascii=False, indent=2)

    print(f'\n=== GMaps descarga completa: {len(deduped)} lugares -> {out}')


if __name__ == '__main__':
    descargar_gmaps()
