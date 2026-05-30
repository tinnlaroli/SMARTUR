import os
import hashlib

import pandas as pd

_DIR = os.path.dirname(os.path.abspath(__file__))
_DATA = os.path.join(_DIR, '..', 'data')
_RESTMEX_2025 = os.path.join(_DATA, 'Rest-Mex_2025_Train_DataSet', 'Rest-Mex_2025_train.csv')

ATTRACTION_MAP_CATEGORIES = {
    'Attractive':  'Parks, Museums, Landmarks & Historical Buildings, Tours, culture, nature, park, museum, history, monument, hiking, viewpoint, landmark',
    'Hotel':       'Hotels, Hotels & Travel, Bed & Breakfast, Lodging, accommodation, hotel, resort, hostal',
    'Restaurant':  'Restaurants, Food, Mexican, Cafes, gastronomy, restaurant, food, local food, coffee, bar',
}

ATTRACTION_MAP_TYPES = {
    'Attractive':  ['naturaleza', 'aventura', 'cultural'],
    'Hotel':       ['rural'],
    'Restaurant':  ['gastronomico'],
}

TOWN_COORDS = {
    'Tulum': (20.2114, -87.4654), 'Isla_Mujeres': (21.2560, -86.7480),
    'San_Cristobal_de_las_Casas': (16.7370, -92.6376), 'Valladolid': (20.6900, -88.2010),
    'Bacalar': (18.6780, -88.3920), 'Palenque': (17.5090, -91.9820),
    'Sayulita': (20.8690, -105.4390), 'Valle_de_Bravo': (19.1930, -100.1310),
    'Teotihuacan': (19.6920, -98.8430), 'Loreto': (26.0130, -111.3490),
    'TodosSantos': (23.4470, -110.2230), 'Patzcuaro': (19.5160, -101.6090),
    'Taxco': (18.5560, -99.6050), 'Tlaquepaque': (20.6400, -103.3100),
    'Ajijic': (20.3030, -103.2580), 'Tequisquiapan': (20.5220, -99.8920),
    'Metepec': (19.2520, -99.6040), 'Tepoztlan': (18.9850, -99.1000),
    'Cholula': (19.0640, -98.3030), 'Tequila': (20.8820, -103.8360),
    'Malinalco': (18.9500, -99.5000), 'Real_de_Catorce': (23.6900, -100.8860),
    'San_Miguel_de_Allende': (20.9150, -100.7440), 'Zacatecas': (22.7710, -102.5830),
    'Morelia': (19.7060, -101.1370), 'Guanajuato': (21.0160, -101.2560),
    'Oaxaca': (17.0650, -96.7230), 'Puebla': (19.0410, -98.2060),
    'Queretaro': (20.5880, -100.3900), 'Campeche': (19.8300, -90.5300),
    'Merida': (20.9670, -89.6240), 'Bernal': (20.7390, -99.9420),
    'Mazamitla': (19.9150, -103.0200), 'Huasca_de_Ocampo': (20.2030, -98.5760),
    'Comala': (19.3270, -103.7580), 'Coatepec': (19.4550, -96.9590),
    'Tapalpa': (19.9440, -103.7590), 'Alamos': (27.0280, -108.9350),
    'Izamal': (20.9290, -89.0190), 'Cozumel': (20.5080, -86.9460),
}


def _hash_id(seed: str) -> str:
    return hashlib.md5(seed.encode('utf-8')).hexdigest()[:12]


def _town_coords(town: str):
    coords = TOWN_COORDS.get(town)
    if coords:
        return coords
    return (19.0, -99.0)  # fallback CDMX center


def fetch_restmex_data(ruta_csv=None) -> tuple:
    if ruta_csv is None:
        ruta_csv = _RESTMEX_2025

    if not os.path.exists(ruta_csv):
        print(f"[restmex_repository] No se encontró: {ruta_csv}")
        return None, None

    df = pd.read_csv(ruta_csv)
    print(f"[restmex_repository] Cargadas {len(df)} reseñas (Rest-Mex 2025)")

    reviews_rows = []
    biz_registry = {}
    total = len(df)

    for idx, row in df.iterrows():
        attraction = row['Type']
        place_name = row['Town']

        biz_id = _hash_id(f"{place_name}|{attraction}|{idx % 40}")
        user_id = _hash_id(f"restmex25_user_{idx}")

        reviews_rows.append({
            'user_id': user_id,
            'business_id': biz_id,
            'stars': int(row['Polarity']),
            'review_text': str(row['Review']),
        })

        if biz_id not in biz_registry:
            avg_polarity = df[df['Type'] == attraction]['Polarity'].mean()
            lat, lng = _town_coords(place_name)
            biz_registry[biz_id] = {
                'business_id': biz_id,
                'name': f"{place_name} ({attraction})",
                'address': '',
                'city': place_name,
                'state': row['Region'],
                'postal_code': '',
                'latitude': lat,
                'longitude': lng,
                'stars': round(avg_polarity, 1),
                'review_count': 1,
                'is_open': 1,
                'attributes': '',
                'categories': ATTRACTION_MAP_CATEGORIES.get(attraction, 'Tourism'),
                'hours': '',
                'price_level': 2,
                'is_accessible': 0,
                'outdoor': 0,
                'is_good_for_kids': 0,
                'is_romantic': 0,
            }
        else:
            biz_registry[biz_id]['review_count'] += 1

    reviews_df = pd.DataFrame(reviews_rows)
    biz_df = pd.DataFrame(list(biz_registry.values()))

    print(f"[restmex_repository] reviews_df: {len(reviews_df)} filas")
    print(f"[restmex_repository] biz_df: {len(biz_df)} negocios únicos")
    tipos_ext = biz_df['name'].str.extract(r'\((.*?)\)')[0].value_counts().to_dict()
    print(f"  Tipos: {tipos_ext}")

    return reviews_df, biz_df


def fetch_restmex_2022_data(ruta_csv=None) -> tuple:
    """Legacy — Rest-Mex 2022 (29K rows, no town)."""
    if ruta_csv is None:
        ruta_csv = os.path.join(_DATA, 'data_restmex_2022_clean.csv')
    if not os.path.exists(ruta_csv):
        print(f"[restmex_repository] Rest-Mex 2022 no encontrado: {ruta_csv}")
        return None, None
    return pd.read_csv(ruta_csv), None


if __name__ == '__main__':
    reviews_df, biz_df = fetch_restmex_data()
    if reviews_df is not None:
        print(f"\nReviews sample:\n{reviews_df.head(3)}")
        print(f"\nBiz sample:\n{biz_df[['business_id', 'name', 'categories', 'city', 'state', 'latitude', 'longitude']].head(10)}")
