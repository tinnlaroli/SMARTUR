import hashlib
import os
import sys

import numpy as np
import pandas as pd

_DIR = os.path.dirname(os.path.abspath(__file__))
_DATA = os.path.join(_DIR, '..', 'data')

RNG = np.random.default_rng(42)

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

ATTRACTION_CATEGORIES = {
    'Attractive':  'Parks, Museums, Landmarks & Historical Buildings, Tours, culture, nature, park, museum, history, monument, hiking, viewpoint, landmark',
    'Hotel':       'Hotels, Hotels & Travel, Bed & Breakfast, Lodging, accommodation, hotel, resort, hostal',
    'Restaurant':  'Restaurants, Food, Mexican, Cafes, gastronomy, restaurant, food, local food, coffee, bar',
}

MEXICO_POIS = [
    {'name': 'Catedral de Puebla', 'city': 'Puebla', 'state': 'Puebla',
     'lat': 19.0427, 'lng': -98.1985, 'kind': 'poi',
     'categories': 'Museums, Landmarks & Historical Buildings, culture, history, cathedral, religion, architecture',
     'price_level': 2, 'rating': 4.7, 'reviews': 8500},
    {'name': 'Capilla del Rosario', 'city': 'Puebla', 'state': 'Puebla',
     'lat': 19.0433, 'lng': -98.1975, 'kind': 'poi',
     'categories': 'Museums, Landmarks & Historical Buildings, culture, history, religion, art, architecture',
     'price_level': 1, 'rating': 4.8, 'reviews': 3200},
    {'name': 'Zócalo de Puebla', 'city': 'Puebla', 'state': 'Puebla',
     'lat': 19.0430, 'lng': -98.1980, 'kind': 'poi',
     'categories': 'Landmarks & Historical Buildings, Parks, culture, zocalo, plaza',
     'price_level': 1, 'rating': 4.6, 'reviews': 12000},
    {'name': 'Museo Internacional del Barroco', 'city': 'Puebla', 'state': 'Puebla',
     'lat': 19.0000, 'lng': -98.2000, 'kind': 'poi',
     'categories': 'Museums, Art Galleries, Arts & Entertainment, culture, museum, art',
     'price_level': 2, 'rating': 4.5, 'reviews': 4500},
    {'name': 'Africam Safari', 'city': 'Puebla', 'state': 'Puebla',
     'lat': 18.9330, 'lng': -98.1330, 'kind': 'poi',
     'categories': 'Zoos, Parks, nature, park, wildlife, hiking',
     'price_level': 3, 'rating': 4.6, 'reviews': 15000},
    {'name': 'Valle de Piedras Encimadas', 'city': 'Zacatlán', 'state': 'Puebla',
     'lat': 19.9330, 'lng': -97.9830, 'kind': 'poi',
     'categories': 'Parks, Hiking, nature, park, hiking, mountain, viewpoint',
     'price_level': 2, 'rating': 4.5, 'reviews': 1200},
    {'name': 'Pueblo Mágico de Zacatlán', 'city': 'Zacatlán', 'state': 'Puebla',
     'lat': 19.9350, 'lng': -97.9600, 'kind': 'poi',
     'categories': 'Landmarks & Historical Buildings, culture, history, pueblo magico, architecture',
     'price_level': 2, 'rating': 4.5, 'reviews': 3000},
    {'name': 'Cholula Pirámide', 'city': 'Cholula', 'state': 'Puebla',
     'lat': 19.0630, 'lng': -98.3030, 'kind': 'poi',
     'categories': 'Landmarks & Historical Buildings, Museums, culture, history, monument, pyramid, archaeology, religion',
     'price_level': 2, 'rating': 4.7, 'reviews': 11000},
    {'name': 'Santuario de los Remedios', 'city': 'Cholula', 'state': 'Puebla',
     'lat': 19.0635, 'lng': -98.3035, 'kind': 'poi',
     'categories': 'Landmarks & Historical Buildings, religion, church, culture, history, architecture',
     'price_level': 1, 'rating': 4.6, 'reviews': 5000},
    {'name': 'Ex Hacienda de Chautla', 'city': 'San Martín Texmelucan', 'state': 'Puebla',
     'lat': 19.2700, 'lng': -98.3800, 'kind': 'poi',
     'categories': 'Landmarks & Historical Buildings, Parks, nature, park, history, hacienda, lake',
     'price_level': 2, 'rating': 4.4, 'reviews': 1500},
    {'name': 'Cantona Zona Arqueológica', 'city': 'Tepeyahualco', 'state': 'Puebla',
     'lat': 19.5700, 'lng': -97.4800, 'kind': 'poi',
     'categories': 'Landmarks & Historical Buildings, Museums, culture, history, archaeology, ruins, monument',
     'price_level': 2, 'rating': 4.5, 'reviews': 2000},
    {'name': 'Teleférico de Orizaba', 'city': 'Orizaba', 'state': 'Veracruz',
     'lat': 18.8510, 'lng': -97.0980, 'kind': 'poi',
     'categories': 'Active Life, Tours, adventure, hiking, viewpoint, mountain',
     'price_level': 2, 'rating': 4.6, 'reviews': 4800},
    {'name': 'Palacio de Hierro de Orizaba', 'city': 'Orizaba', 'state': 'Veracruz',
     'lat': 18.8520, 'lng': -97.0990, 'kind': 'poi',
     'categories': 'Museums, Landmarks & Historical Buildings, culture, history, architecture, museum, monument',
     'price_level': 2, 'rating': 4.7, 'reviews': 7800},
    {'name': 'Paseo del Río Orizaba', 'city': 'Orizaba', 'state': 'Veracruz',
     'lat': 18.8500, 'lng': -97.1000, 'kind': 'poi',
     'categories': 'Parks, Hiking, nature, park, river, walking, hiking',
     'price_level': 1, 'rating': 4.5, 'reviews': 3500},
    {'name': 'Cerro del Borrego', 'city': 'Orizaba', 'state': 'Veracruz',
     'lat': 18.8600, 'lng': -97.0900, 'kind': 'poi',
     'categories': 'Parks, Hiking, nature, park, hiking, mountain, viewpoint',
     'price_level': 1, 'rating': 4.4, 'reviews': 2500},
    {'name': 'Museo de Arte del Estado de Veracruz', 'city': 'Orizaba', 'state': 'Veracruz',
     'lat': 18.8530, 'lng': -97.1000, 'kind': 'poi',
     'categories': 'Museums, Art Galleries, culture, museum, art, history',
     'price_level': 2, 'rating': 4.5, 'reviews': 2000},
    {'name': 'Ex Convento de San Juan Bautista', 'city': 'Orizaba', 'state': 'Veracruz',
     'lat': 18.8550, 'lng': -97.0950, 'kind': 'poi',
     'categories': 'Museums, Landmarks & Historical Buildings, culture, history, convento, religion, architecture',
     'price_level': 2, 'rating': 4.4, 'reviews': 1500},
    {'name': 'Cascada de Texolo', 'city': 'Teocelo', 'state': 'Veracruz',
     'lat': 19.3830, 'lng': -96.9670, 'kind': 'poi',
     'categories': 'Parks, Hiking, nature, waterfall, cascada, hiking, park, ecoturismo',
     'price_level': 1, 'rating': 4.7, 'reviews': 3200},
    {'name': 'Cascada El Salto', 'city': 'Coatepec', 'state': 'Veracruz',
     'lat': 19.4500, 'lng': -96.9500, 'kind': 'poi',
     'categories': 'Parks, Hiking, nature, waterfall, cascada, hiking, ecoturismo, selva',
     'price_level': 1, 'rating': 4.5, 'reviews': 1800},
    {'name': 'Mirador de Coatepec', 'city': 'Coatepec', 'state': 'Veracruz',
     'lat': 19.4550, 'lng': -96.9590, 'kind': 'poi',
     'categories': 'Landmarks & Historical Buildings, viewpoint, nature, mirador, mountain, coffee',
     'price_level': 1, 'rating': 4.4, 'reviews': 1200},
    {'name': 'Cascada de Xico', 'city': 'Xico', 'state': 'Veracruz',
     'lat': 19.4300, 'lng': -97.0000, 'kind': 'poi',
     'categories': 'Parks, Hiking, nature, waterfall, cascada, hiking, ecoturismo',
     'price_level': 1, 'rating': 4.6, 'reviews': 2200},
    {'name': 'Museo de Antropología de Xalapa', 'city': 'Xalapa', 'state': 'Veracruz',
     'lat': 19.5470, 'lng': -96.9260, 'kind': 'poi',
     'categories': 'Museums, culture, museum, anthropology, archaeology, history, art',
     'price_level': 2, 'rating': 4.7, 'reviews': 5600},
    {'name': 'Pico de Orizaba (Volcán)', 'city': 'Tlachichuca', 'state': 'Puebla',
     'lat': 19.0300, 'lng': -97.2700, 'kind': 'poi',
     'categories': 'Parks, Hiking, Active Life, nature, volcano, mountain, hiking, adventure, camping',
     'price_level': 3, 'rating': 4.8, 'reviews': 3500},
    {'name': 'Pueblo Mágico de Cuetzalan', 'city': 'Cuetzalan', 'state': 'Puebla',
     'lat': 20.0170, 'lng': -97.5170, 'kind': 'poi',
     'categories': 'Landmarks & Historical Buildings, culture, history, pueblo magico, nature, cascada, ecoturismo',
     'price_level': 2, 'rating': 4.6, 'reviews': 4000},
    {'name': 'Cascada Las Brisas', 'city': 'Cuetzalan', 'state': 'Puebla',
     'lat': 20.0100, 'lng': -97.5200, 'kind': 'poi',
     'categories': 'Parks, Hiking, nature, waterfall, cascada, hiking, ecoturismo, adventure',
     'price_level': 1, 'rating': 4.5, 'reviews': 1500},
    {'name': 'Zona Arqueológica Yohualichan', 'city': 'Cuetzalan', 'state': 'Puebla',
     'lat': 20.0250, 'lng': -97.5100, 'kind': 'poi',
     'categories': 'Landmarks & Historical Buildings, Museums, culture, history, archaeology, ruins',
     'price_level': 2, 'rating': 4.4, 'reviews': 1800},
    {'name': 'Pueblo Mágico de Chignahuapan', 'city': 'Chignahuapan', 'state': 'Puebla',
     'lat': 19.8330, 'lng': -98.0330, 'kind': 'poi',
     'categories': 'Landmarks & Historical Buildings, culture, history, pueblo magico, religion, artesania',
     'price_level': 2, 'rating': 4.5, 'reviews': 2500},
    {'name': 'Laguna de Chignahuapan', 'city': 'Chignahuapan', 'state': 'Puebla',
     'lat': 19.8400, 'lng': -98.0300, 'kind': 'poi',
     'categories': 'Parks, Lakes, nature, lake, laguna, park, hiking, camping',
     'price_level': 1, 'rating': 4.4, 'reviews': 1800},
    {'name': 'Pueblo Mágico de Atlixco', 'city': 'Atlixco', 'state': 'Puebla',
     'lat': 18.9080, 'lng': -98.4350, 'kind': 'poi',
     'categories': 'Landmarks & Historical Buildings, culture, history, pueblo magico, gastronomy, market',
     'price_level': 2, 'rating': 4.5, 'reviews': 3500},
    {'name': 'Cerro de San Miguel (Atlixco)', 'city': 'Atlixco', 'state': 'Puebla',
     'lat': 18.9070, 'lng': -98.4400, 'kind': 'poi',
     'categories': 'Parks, Hiking, viewpoint, nature, hiking, mountain, mirador',
     'price_level': 1, 'rating': 4.6, 'reviews': 2800},
    {'name': 'Pueblo Mágico de Tetela de Ocampo', 'city': 'Tetela de Ocampo', 'state': 'Puebla',
     'lat': 19.8170, 'lng': -97.8000, 'kind': 'poi',
     'categories': 'Landmarks & Historical Buildings, culture, history, pueblo magico, nature, cascada',
     'price_level': 2, 'rating': 4.4, 'reviews': 1500},
    {'name': 'Pueblo Mágico de Xicotepec', 'city': 'Xicotepec', 'state': 'Puebla',
     'lat': 20.2670, 'lng': -97.9500, 'kind': 'poi',
     'categories': 'Landmarks & Historical Buildings, culture, history, pueblo magico, nature, coffee, mirador',
     'price_level': 2, 'rating': 4.4, 'reviews': 2000},
    {'name': 'Pueblo Mágico Coatepec', 'city': 'Coatepec', 'state': 'Veracruz',
     'lat': 19.4550, 'lng': -96.9590, 'kind': 'poi',
     'categories': 'Landmarks & Historical Buildings, culture, history, pueblo magico, coffee, nature, cascada',
     'price_level': 2, 'rating': 4.5, 'reviews': 3500},
    {'name': 'Pueblo Mágico Papantla', 'city': 'Papantla', 'state': 'Veracruz',
     'lat': 20.4500, 'lng': -97.3200, 'kind': 'poi',
     'categories': 'Landmarks & Historical Buildings, culture, history, pueblo magico, archaeology, artesania',
     'price_level': 2, 'rating': 4.5, 'reviews': 4000},
    {'name': 'El Tajín Zona Arqueológica', 'city': 'Papantla', 'state': 'Veracruz',
     'lat': 20.4480, 'lng': -97.3780, 'kind': 'poi',
     'categories': 'Landmarks & Historical Buildings, Museums, culture, history, archaeology, ruins, pyramid, monument',
     'price_level': 3, 'rating': 4.7, 'reviews': 12000},
    {'name': 'Pueblo Mágico de Zozocolco', 'city': 'Zozocolco', 'state': 'Veracruz',
     'lat': 20.1330, 'lng': -97.5670, 'kind': 'poi',
     'categories': 'Landmarks & Historical Buildings, culture, history, pueblo magico, nature, cascada, ecoturismo',
     'price_level': 2, 'rating': 4.3, 'reviews': 1000},
    {'name': 'El Mural de los Poblanos', 'city': 'Puebla', 'state': 'Puebla',
     'lat': 19.0420, 'lng': -98.1960, 'kind': 'restaurant',
     'categories': 'Restaurants, Food, Mexican, Traditional Mexican, gastronomy, restaurant, mole, local food',
     'price_level': 3, 'rating': 4.5, 'reviews': 3500},
    {'name': 'La Casita Poblana', 'city': 'Puebla', 'state': 'Puebla',
     'lat': 19.0430, 'lng': -98.1970, 'kind': 'restaurant',
     'categories': 'Restaurants, Food, Mexican, Traditional Mexican, gastronomy, restaurant, mole, local food',
     'price_level': 2, 'rating': 4.4, 'reviews': 2500},
    {'name': 'Cemitas La Poblanita', 'city': 'Puebla', 'state': 'Puebla',
     'lat': 19.0410, 'lng': -98.1990, 'kind': 'restaurant',
     'categories': 'Restaurants, Food, Mexican, street food, restaurant, local food, antojitos',
     'price_level': 1, 'rating': 4.3, 'reviews': 2000},
    {'name': 'Café de la Parroquia', 'city': 'Veracruz', 'state': 'Veracruz',
     'lat': 19.2000, 'lng': -96.1330, 'kind': 'restaurant',
     'categories': 'Cafes, Restaurants, Food, Mexican, coffee, cafe, gastronomy, mariscos, local food',
     'price_level': 2, 'rating': 4.4, 'reviews': 6000},
    {'name': 'La Parroquia de Veracruz', 'city': 'Veracruz', 'state': 'Veracruz',
     'lat': 19.1980, 'lng': -96.1320, 'kind': 'restaurant',
     'categories': 'Cafes, Restaurants, Food, Mexican, coffee, cafe, gastronomy, mariscos, local food',
     'price_level': 2, 'rating': 4.5, 'reviews': 8000},
    {'name': 'Hotel Cartesiano Puebla', 'city': 'Puebla', 'state': 'Puebla',
     'lat': 19.0410, 'lng': -98.2000, 'kind': 'accommodation',
     'categories': 'Hotels, Hotels & Travel, Bed & Breakfast, accommodation, hotel, boutique',
     'price_level': 3, 'rating': 4.6, 'reviews': 1500},
    {'name': 'La Purificadora', 'city': 'Puebla', 'state': 'Puebla',
     'lat': 19.0435, 'lng': -98.1975, 'kind': 'accommodation',
     'categories': 'Hotels, Hotels & Travel, accommodation, hotel, boutique',
     'price_level': 4, 'rating': 4.5, 'reviews': 1200},
    {'name': 'Hotel Mesón del Molino', 'city': 'Atlixco', 'state': 'Puebla',
     'lat': 18.9070, 'lng': -98.4330, 'kind': 'accommodation',
     'categories': 'Hotels, Bed & Breakfast, accommodation, hotel, hacienda',
     'price_level': 2, 'rating': 4.4, 'reviews': 800},
    {'name': 'Hotel Mocambo', 'city': 'Veracruz', 'state': 'Veracruz',
     'lat': 19.1800, 'lng': -96.1200, 'kind': 'accommodation',
     'categories': 'Hotels, Hotels & Travel, accommodation, hotel, resort, beach',
     'price_level': 3, 'rating': 4.3, 'reviews': 3500},
    {'name': 'Hotel Boutique Posada del Ángel', 'city': 'Xalapa', 'state': 'Veracruz',
     'lat': 19.5450, 'lng': -96.9250, 'kind': 'accommodation',
     'categories': 'Hotels, Hotels & Travel, Bed & Breakfast, accommodation, hotel, boutique',
     'price_level': 2, 'rating': 4.4, 'reviews': 600},
    {'name': 'Hotel Posada San Alejandro', 'city': 'Orizaba', 'state': 'Veracruz',
     'lat': 18.8510, 'lng': -97.1000, 'kind': 'accommodation',
     'categories': 'Hotels, accommodation, hotel',
     'price_level': 2, 'rating': 4.2, 'reviews': 500},
    {'name': 'Balneario Agua Azul', 'city': 'Chignahuapan', 'state': 'Puebla',
     'lat': 19.8300, 'lng': -98.0400, 'kind': 'poi',
     'categories': 'Active Life, Parks, nature, adventure, swimming, waterfall, camping',
     'price_level': 2, 'rating': 4.3, 'reviews': 1200},
    {'name': 'Cascada La Gloria', 'city': 'Tetela de Ocampo', 'state': 'Puebla',
     'lat': 19.8200, 'lng': -97.7900, 'kind': 'poi',
     'categories': 'Parks, Hiking, nature, waterfall, cascada, hiking, adventure, ecoturismo',
     'price_level': 1, 'rating': 4.5, 'reviews': 1000},
    {'name': 'Cascada El Encanto', 'city': 'Coatepec', 'state': 'Veracruz',
     'lat': 19.4600, 'lng': -96.9600, 'kind': 'poi',
     'categories': 'Parks, Hiking, nature, waterfall, cascada, hiking, park, ecoturismo',
     'price_level': 1, 'rating': 4.5, 'reviews': 1500},
    {'name': 'Parque Ecológico El Haya', 'city': 'Xalapa', 'state': 'Veracruz',
     'lat': 19.5400, 'lng': -96.9200, 'kind': 'poi',
     'categories': 'Parks, Hiking, nature, park, botanical garden, hiking, ecoturismo',
     'price_level': 1, 'rating': 4.4, 'reviews': 2000},
    {'name': 'Mercado de Sabores Poblanos', 'city': 'Puebla', 'state': 'Puebla',
     'lat': 19.0410, 'lng': -98.1950, 'kind': 'restaurant',
     'categories': 'Restaurants, Food, Markets, gastronomy, market, local food, restaurant, food',
     'price_level': 2, 'rating': 4.3, 'reviews': 3000},
    {'name': 'Gran Café del Portal', 'city': 'Veracruz', 'state': 'Veracruz',
     'lat': 19.1990, 'lng': -96.1340, 'kind': 'restaurant',
     'categories': 'Cafes, Restaurants, Food, coffee, cafe, gastronomy, local food',
     'price_level': 2, 'rating': 4.3, 'reviews': 3500},
    {'name': 'Museo Nacional de la Mascarada', 'city': 'San Martín Texmelucan', 'state': 'Puebla',
     'lat': 19.2850, 'lng': -98.4320, 'kind': 'poi',
     'categories': 'Museums, culture, museum, art, history',
     'price_level': 2, 'rating': 4.3, 'reviews': 800},
]


def _hash_id(seed: str) -> str:
    return hashlib.md5(seed.encode('utf-8')).hexdigest()[:12]


def _simulate_reviews_for_poi(poi, max_reviews=200):
    n = min(poi['reviews'], max_reviews)
    avg = poi['rating']
    alpha = np.clip((avg - 1) / 4, 0.05, 0.95)
    conc = max(2, 40 * (1 - abs(avg - 3) / 2))
    a = alpha * conc
    b = (1 - alpha) * conc
    raw = RNG.beta(a, b, size=n)
    stars = np.clip(np.round(raw * 4 + 1), 1, 5).astype(int)
    return stars


def build_seed():
    print("=== Generando seed data mexicano ===\n")
    os.makedirs(_DATA, exist_ok=True)

    rm25_path = os.path.join(_DATA, 'Rest-Mex_2025_Train_DataSet', 'Rest-Mex_2025_train.csv')
    rm22_path = os.path.join(_DATA, 'data_restmex_2022_clean.csv')

    # ── 1. REST-MEX 2025 ──────────────────────────────────────
    if os.path.exists(rm25_path):
        print(f"Cargando REST-MEX 2025: {rm25_path}")
        rm25 = pd.read_csv(rm25_path)
        print(f"  {len(rm25)} reseñas crudas")
        rm25 = rm25.dropna(subset=['Review', 'Polarity', 'Town', 'Type'])
        rm25 = rm25[(rm25['Polarity'] >= 1) & (rm25['Polarity'] <= 5)]
        rm25 = rm25[(rm25['Review'].str.len() >= 20)]
        rm25 = rm25[rm25['Type'].isin(['Attractive', 'Hotel', 'Restaurant'])]
        print(f"  {len(rm25)} después de limpieza")

        # Generar negocio único por (Town, Type)
        biz_map = {}
        for (town, atype), grp in rm25.groupby(['Town', 'Type']):
            bid = _hash_id(f"rm25|{town}|{atype}")
            lat, lng = TOWN_COORDS.get(town, (19.0, -99.0))
            biz_map[bid] = {
                'business_id': bid,
                'name': f"{town} ({atype})",
                'address': '', 'city': town, 'state': grp['Region'].iloc[0] if 'Region' in grp.columns else '',
                'postal_code': '', 'latitude': lat, 'longitude': lng,
                'stars': round(grp['Polarity'].mean(), 1),
                'review_count': len(grp), 'is_open': 1, 'attributes': '',
                'categories': ATTRACTION_CATEGORIES.get(atype, 'Tourism'),
                'hours': '', 'price_level': 2,
                'is_accessible': 0, 'outdoor': 0, 'is_good_for_kids': 0, 'is_romantic': 0,
            }

        # Generar reseñas con user_id sintético (vectorizado)
        n = len(rm25)
        rm25_reviews = pd.DataFrame({
            'user_id': [_hash_id(f"rm25_u_{i}") for i in range(n)],
            'business_id': [_hash_id(f"rm25|{row['Town']}|{row['Type']}") for _, row in rm25.iterrows()],
            'stars': rm25['Polarity'].astype(int),
            'review_text': rm25['Review'],
        })
        print(f"  {len(rm25_reviews)} reseñas generadas, {len(biz_map)} negocios únicos")
    else:
        print(f"  [WARN] REST-MEX 2025 no encontrado en {rm25_path}")
        rm25_reviews = pd.DataFrame(columns=['user_id', 'business_id', 'stars', 'review_text'])
        biz_map = {}

    # ── 2. REST-MEX 2022 ──────────────────────────────────────
    rm22_reviews = pd.DataFrame(columns=['user_id', 'business_id', 'stars', 'review_text'])
    if os.path.exists(rm22_path):
        print(f"\nCargando REST-MEX 2022: {rm22_path}")
        rm22 = pd.read_csv(rm22_path)
        print(f"  {len(rm22)} reseñas")
        rm22 = rm22.dropna(subset=['Opinion', 'Polarity', 'Attraction'])
        rm22 = rm22[(rm22['Polarity'] >= 1) & (rm22['Polarity'] <= 5)]
        rm22 = rm22[(rm22['Opinion'].str.len() >= 20)]
        rm22 = rm22[rm22['Attraction'].isin(['Attractive', 'Hotel', 'Restaurant'])]

        n22 = len(rm22)
        rm22_reviews = pd.DataFrame({
            'user_id': [_hash_id(f"rm22_u_{i}") for i in range(n22)],
            'business_id': [_hash_id(f"rm22|{row['Attraction']}") for _, row in rm22.iterrows()],
            'stars': rm22['Polarity'].astype(int),
            'review_text': rm22['Opinion'],
        })

        for atype in ['Attractive', 'Hotel', 'Restaurant']:
            bid = _hash_id(f"rm22|{atype}")
            if bid not in biz_map:
                biz_map[bid] = {
                    'business_id': bid,
                    'name': f"Rest-MEX 2022 ({atype})",
                    'address': '', 'city': 'México', 'state': '',
                    'postal_code': '', 'latitude': 19.0, 'longitude': -99.0,
                    'stars': 4.0, 'review_count': 1, 'is_open': 1, 'attributes': '',
                    'categories': ATTRACTION_CATEGORIES.get(atype, 'Tourism'),
                    'hours': '', 'price_level': 2,
                    'is_accessible': 0, 'outdoor': 0, 'is_good_for_kids': 0, 'is_romantic': 0,
                }

        print(f"  {len(rm22_reviews)} reseñas generadas")

    # ── 3. Known POIs ─────────────────────────────────────────
    print(f"\nAgregando {len(MEXICO_POIS)} POIs conocidos Puebla/Veracruz...")
    poi_review_rows = []
    for poi in MEXICO_POIS:
        bid = _hash_id(f"mex|{poi['name']}|{poi['city']}")
        if bid not in biz_map:
            biz_map[bid] = {
                'business_id': bid, 'name': poi['name'],
                'address': '', 'city': poi['city'], 'state': poi['state'],
                'postal_code': '', 'latitude': poi['lat'], 'longitude': poi['lng'],
                'stars': poi['rating'], 'review_count': max(1, poi['reviews']),
                'is_open': 1, 'attributes': '',
                'categories': poi['categories'], 'hours': '',
                'price_level': poi['price_level'],
                'is_accessible': 1 if poi['kind'] != 'restaurant' else 0,
                'outdoor': 1 if poi['kind'] in ('restaurant', 'poi') else 0,
                'is_good_for_kids': 1 if poi['kind'] == 'poi' else 0,
                'is_romantic': 1 if poi['kind'] in ('accommodation', 'restaurant') else 0,
            }

        stars_arr = _simulate_reviews_for_poi(poi)
        for s in stars_arr:
            uid = _hash_id(f"seed_{bid}_{len(poi_review_rows)}")
            poi_review_rows.append({
                'user_id': uid, 'business_id': bid,
                'stars': int(s), 'review_text': '',
            })

    poi_reviews = pd.DataFrame(poi_review_rows)
    print(f"  {len(poi_reviews)} reseñas generadas")

    # ── 4. Combine ────────────────────────────────────────────
    all_reviews = pd.concat([rm25_reviews, rm22_reviews, poi_reviews], ignore_index=True)
    biz_df = pd.DataFrame(list(biz_map.values()))

    print(f"\n=== Seed completo ===")
    print(f"  Reviews: {len(all_reviews)}")
    print(f"  Negocios: {len(biz_df)}")
    print(f"  Distribución estrellas: {all_reviews['stars'].value_counts().sort_index().to_dict()}")

    rev_out = os.path.join(_DATA, 'data_reviews_mexico.csv')
    biz_out = os.path.join(_DATA, 'data_negocios_mexico.csv')
    all_reviews.to_csv(rev_out, index=False)
    biz_df.to_csv(biz_out, index=False)
    print(f"\n  -> {rev_out}")
    print(f"  -> {biz_out}")


if __name__ == '__main__':
    build_seed()
