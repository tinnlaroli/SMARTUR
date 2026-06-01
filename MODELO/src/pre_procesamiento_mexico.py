import glob
import hashlib
import json
import os

import numpy as np
import pandas as pd

_DIR = os.path.dirname(os.path.abspath(__file__))
_DATA = os.path.join(_DIR, '..', 'data')
_GMAPS_DIR = os.path.join(_DATA, 'gmaps')

RNG = np.random.default_rng(42)

GMAPS_CATEGORY_MAP = {
    'accommodation': 'Hotels, Hotels & Travel, Bed & Breakfast, Lodging, accommodation, hotel, resort, hostal',
    'restaurant':    'Restaurants, Food, Mexican, Cafes, gastronomy, restaurant, food, local food, coffee, bar',
    'poi':           'Parks, Museums, Landmarks & Historical Buildings, Tours, culture, nature, park, museum, history, monument, hiking, viewpoint, landmark',
}


def _hash_id(seed: str) -> str:
    return hashlib.md5(seed.encode('utf-8')).hexdigest()[:12]


def load_latest_gmaps() -> pd.DataFrame | None:
    """Load the most recent GMaps scraped JSON batch."""
    files = sorted(glob.glob(os.path.join(_GMAPS_DIR, 'gmaps_raw_*.json')))
    if not files:
        return None
    latest = files[-1]
    print(f'  Cargando GMaps: {latest}')
    with open(latest, encoding='utf-8') as f:
        data = json.load(f)
    return pd.DataFrame(data) if data else None


def convert_gmaps_to_format(gmaps: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Convert GMaps scraped data to unified reviews + biz format."""
    reviews_rows = []
    biz_rows = []
    seen_biz = set()

    for _, row in gmaps.iterrows():
        name = str(row.get('name', '')).strip()
        if not name:
            continue

        loc = str(row.get('location', ''))
        city = loc.split('+')[0].replace('%C3%A1', 'á').replace('%C3%A9', 'é') \
            .replace('%C3%AD', 'í').replace('%C3%B3', 'ó').replace('%C3%BA', 'ú') \
            if loc else 'México'

        state = 'Puebla' if any(p in loc.lower() for p in ['puebla', 'cholula', 'atlixco', 'zacatlán',
                                                              'cuetzalan', 'chignahuapan', 'tetela',
                                                              'xicotepec']) else 'Veracruz'
        tag = row.get('category_tag', 'poi')
        bid = _hash_id(f'gmaps|{name}|{city}')

        if bid not in seen_biz:
            seen_biz.add(bid)
            biz_rows.append({
                'business_id': bid,
                'name': name,
                'address': str(row.get('address', '')),
                'city': city,
                'state': state,
                'postal_code': '',
                'latitude': row.get('lat') or 0.0,
                'longitude': row.get('lng') or 0.0,
                'stars': float(row.get('rating', 0) or 0),
                'review_count': int(row.get('reviews', 0) or 0),
                'is_open': 1,
                'attributes': '',
                'categories': GMAPS_CATEGORY_MAP.get(tag, 'Tourism'),
                'hours': '',
                'price_level': int(row.get('price_level', 0) or 0),
                'is_accessible': 0,
                'outdoor': 1 if tag in ('restaurant', 'poi') else 0,
                'is_good_for_kids': 1 if tag == 'poi' else 0,
                'is_romantic': 1 if tag == 'accommodation' else 0,
            })

        n_reviews = min(int(row.get('reviews', 0) or 0), 50)
        if n_reviews > 0:
            rating = float(row.get('rating', 4.0) or 4.0)
            alpha = max(0.05, (rating - 1) / 4)
            conc = max(2, 40 * (1 - abs(rating - 3) / 2))
            a = alpha * conc
            b = (1 - alpha) * conc
            stars_arr = RNG.beta(a, b, size=n_reviews)
            stars_arr = np.clip(np.round(stars_arr * 4 + 1), 1, 5).astype(int)
            for s in stars_arr:
                uid = _hash_id(f'gmaps_{bid}_{len(reviews_rows)}')
                reviews_rows.append({
                    'review_id': _hash_id(f'gmaps_r_{uid}'),
                    'user_id': uid,
                    'business_id': bid,
                    'stars': int(s),
                    'useful': 0,
                    'funny': 0,
                    'cool': 0,
                    'text': '',
                    'date': '',
                })

    return pd.DataFrame(reviews_rows), pd.DataFrame(biz_rows)


def pre_procesar_mexico():
    """Unify all Mexican data sources into the final training CSVs."""
    print('=== Pre-procesamiento México ===\n')

    os.makedirs(_DATA, exist_ok=True)

    seed_reviews_path = os.path.join(_DATA, 'data_reviews_mexico.csv')
    seed_biz_path = os.path.join(_DATA, 'data_negocios_mexico.csv')

    # ── 1. Load seed data (from seed_pois_mexico.py) ───────────
    if not os.path.exists(seed_reviews_path) or not os.path.exists(seed_biz_path):
        print('[ERROR] Seed data no encontrado. Ejecuta primero seed_pois_mexico.py')
        return

    reviews = pd.read_csv(seed_reviews_path)
    biz = pd.read_csv(seed_biz_path)
    print(f'Seed reviews: {len(reviews)}')
    print(f'Seed biz: {len(biz)}')

    # ── 2. Merge GMaps data (if available) ─────────────────────
    gmaps = load_latest_gmaps()
    if gmaps is not None and len(gmaps) > 0:
        print(f'GMaps raw: {len(gmaps)} lugares')
        gr, gb = convert_gmaps_to_format(gmaps)
        if len(gr) > 0:
            reviews = pd.concat([reviews, gr], ignore_index=True)
            print(f'  + {len(gr)} reseñas GMaps')
        if len(gb) > 0:
            # Avoid duplicate biz_ids
            existing = set(biz['business_id'])
            new_biz = gb[~gb['business_id'].isin(existing)]
            biz = pd.concat([biz, new_biz], ignore_index=True)
            print(f'  + {len(new_biz)} negocios GMaps')

    # ── 3. Fix dtypes to match Yelp format ─────────────────────
    string_cols = ['address', 'postal_code', 'attributes', 'hours']
    for col in string_cols:
        if col in biz.columns:
            biz[col] = biz[col].apply(lambda x: '' if pd.isna(x) or str(x).lower() in ('nan', '0.0') else str(x))
    num_cols = ['price_level', 'is_accessible', 'outdoor',
                'is_good_for_kids', 'is_romantic']
    for col in num_cols:
        if col in biz.columns:
            biz[col] = pd.to_numeric(biz[col], errors='coerce').fillna(0).astype(int)

    # Ensure integer IDs are safe (reduce memory)
    # Add review_id + text columns for compatibility
    if 'review_id' not in reviews.columns:
        reviews['review_id'] = reviews.apply(
            lambda r: _hash_id(f'mex_r_{r["user_id"]}_{r["business_id"]}_{r["stars"]}'), axis=1
        )
    if 'text' not in reviews.columns:
        reviews['text'] = reviews.get('review_text', '')
    if 'review_text' in reviews.columns:
        reviews = reviews.drop(columns=['review_text'])
    for col in ['useful', 'funny', 'cool', 'date']:
        if col not in reviews.columns:
            reviews[col] = '' if col == 'date' else 0

    # ── 4. Save final unified CSVs ─────────────────────────────
    rev_out = os.path.join(_DATA, 'data_reviews_mexico.csv')
    biz_out = os.path.join(_DATA, 'data_negocios_mexico.csv')
    reviews.to_csv(rev_out, index=False)
    biz.to_csv(biz_out, index=False)

    print(f'\n=== Final ===')
    print(f'  Reviews: {len(reviews)}')
    print(f'  Negocios: {len(biz)}')
    print(f'  -> {rev_out}')
    print(f'  -> {biz_out}')


if __name__ == '__main__':
    pre_procesar_mexico()
