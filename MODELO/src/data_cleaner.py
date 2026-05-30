import pandas as pd
import re


TOURISM_CATEGORY_KEYWORDS = {
    'accommodation': [
        'hotel', 'bed & breakfast', 'resort', 'hostel', 'vacation rental',
        'campground', 'lodging', 'inn', 'motel', 'guest house', 'farm stay',
    ],
    'food': [
        'restaurant', 'cafe', 'bakery', 'bar', 'nightlife', 'food',
        'coffee', 'tea', 'brewery', 'winery', 'distillery', 'pizza',
        'mexican', 'seafood', 'steakhouse', 'sushi', 'ice cream', 'juice bar',
        'food truck', 'gastronomy', 'local food',
    ],
    'culture': [
        'museum', 'art gallery', 'performing arts', 'theater', 'cinema',
        'comedy club', 'festival', 'cultural center', 'music venue',
        'arts & entertainment', 'historical tour', 'street art',
    ],
    'nature': [
        'park', 'hiking', 'beach', 'mountain', 'lake', 'botanical garden',
        'zoo', 'aquarium', 'wildlife', 'garden', 'waterfall', 'volcano',
        'canyon', 'national park', 'state park', 'nature preserve',
        'landmarks & historical buildings', 'lakes', 'parks',
    ],
    'tours': [
        'tour', 'sightseeing', 'attraction', 'amusement park', 'water park',
        'theme park', 'casino', 'bowling', 'arcade', 'escape game',
        'zipline', 'horseback', 'rafting', 'kayaking', 'surfing',
        'diving', 'snorkeling', 'sailing', 'cruise', 'ferry', 'active life',
        'mini golf', 'go kart', 'haunted house', 'rock climbing',
    ],
    'wellness': [
        'spa', 'massage', 'sauna', 'yoga', 'meditation', 'day spa',
    ],
    'shopping': [
        'shopping center', 'mall', 'market', 'flea market', 'antique',
        'gift shop', 'souvenir', 'outlet store', 'farmers market',
        'art gallery',
    ],
    'sports': [
        'golf', 'tennis', 'skiing', 'cycling', 'bike', 'fishing',
        'boating', 'swimming pool', 'sports club', 'mountain biking',
        'rafting', 'horseback riding', 'atv rental',
    ],
    'accommodation_alt': [
        'hostels', 'campgrounds', 'farm stays', 'guest houses',
        'vacation rentals', 'bed & breakfast',
    ],
    'travel_services': [
        'travel services', 'airport shuttle', 'transportation',
        'car rental', 'bus station', 'train station', 'cruise',
    ],
}

EXCLUDED_KEYWORDS = [
    'shipping', 'notary', 'mailbox', 'courier', 'freight',
    'it services', 'computer repair', 'web design',
    'real estate', 'mortgage', 'insurance', 'financial', 'accounting', 'tax',
    'lawyer', 'attorney', 'legal', 'bail bonds',
    'contractor', 'electrician', 'plumber', 'roofing', 'hvac', 'landscaping',
    'auto repair', 'auto parts', 'car wash', 'oil change', 'tire', 'body shop',
    'dentist', 'doctor', 'hospital', 'pharmacy', 'optometrist', 'chiropractor',
    'daycare', 'preschool', 'school', 'college', 'university',
    'grocery', 'supermarket', 'convenience store',
    'laundry', 'dry cleaning', 'tailor', 'alteration',
    'home cleaning', 'carpet cleaning', 'window washing',
    'storage', 'self storage', 'moving', 'movers',
    'pet groomer', 'pet store', 'veterinarian', 'animal shelter',
    'post office', 'delivery service',
    'government', 'police', 'fire station', 'library',
    'gym', 'fitness center', 'personal trainer',
    'church', 'mosque', 'temple', 'religious organization',
    'cosmetic', 'beauty salon', 'barber', 'nail salon', 'hair salon',
    'electronics', 'furniture', 'hardware', 'home improvement',
    'office supplies', 'stationery', 'bookstore',
    'pharmacy', 'drugstore', 'discount store', 'dollar store',
    'department store', 'clothing', 'shoe store', 'jewelry',
]


def _flatten_tourism_keywords():
    seen = set()
    result = []
    for terms in TOURISM_CATEGORY_KEYWORDS.values():
        for t in terms:
            t_lower = t.lower()
            if t_lower not in seen:
                seen.add(t_lower)
                result.append(t_lower)
    return result


_TOURISM_KEYWORDS_FLAT = _flatten_tourism_keywords()


def is_tourism_business(categories_str):
    if not categories_str or not isinstance(categories_str, str):
        return False
    cat_lower = categories_str.lower()

    for ex in EXCLUDED_KEYWORDS:
        if ex in cat_lower:
            return False

    for kw in _TOURISM_KEYWORDS_FLAT:
        if kw in cat_lower:
            return True

    return False


def clean_businesses(df_biz):
    initial = len(df_biz)

    df_biz = df_biz.drop_duplicates(subset=['business_id'])

    if 'categories' in df_biz.columns:
        before_cat = len(df_biz)
        tourism_mask = df_biz['categories'].apply(is_tourism_business)
        df_biz = df_biz[tourism_mask].copy()
        print(f"  Filtro turístico: {before_cat} → {len(df_biz)} negocios")
    else:
        print(f"  [WARN] No hay columna 'categories', saltando filtro turístico")

    if 'review_count' in df_biz.columns:
        before_rc = len(df_biz)
        df_biz = df_biz[df_biz['review_count'] > 0]
        print(f"  review_count > 0: {before_rc} → {len(df_biz)}")

    if 'is_open' in df_biz.columns:
        before_open = len(df_biz)
        df_biz = df_biz[df_biz['is_open'] == 1]
        print(f"  is_open == 1: {before_open} → {len(df_biz)}")

    if 'categories' in df_biz.columns:
        before_nan = len(df_biz)
        df_biz = df_biz[df_biz['categories'].notna() & (df_biz['categories'] != '')]
        print(f"  categories no nulas: {before_nan} → {len(df_biz)}")

    print(f"  Total limpieza negocios: {initial} → {len(df_biz)}")
    return df_biz.reset_index(drop=True)


def clean_reviews(df_rev, valid_biz_ids=None):
    initial = len(df_rev)

    df_rev = df_rev.drop_duplicates(subset=['review_id'])

    if 'stars' in df_rev.columns:
        before_stars = len(df_rev)
        df_rev = df_rev[(df_rev['stars'] >= 1) & (df_rev['stars'] <= 5)]
        print(f"  stars ∈ [1,5]: {before_stars} → {len(df_rev)}")

    if 'text' in df_rev.columns:
        before_text = len(df_rev)
        df_rev = df_rev[df_rev['text'].notna() & (df_rev['text'].str.strip() != '')]
        df_rev = df_rev[df_rev['text'].str.len() >= 20]
        print(f"  text >= 20 chars: {before_text} → {len(df_rev)}")

    if valid_biz_ids is not None:
        before_biz = len(df_rev)
        df_rev = df_rev[df_rev['business_id'].isin(valid_biz_ids)]
        print(f"  business_id válido: {before_biz} → {len(df_rev)}")

    print(f"  Total limpieza reviews: {initial} → {len(df_rev)}")
    return df_rev.reset_index(drop=True)


def clean_restmex(df):
    initial = len(df)

    df = df.dropna(subset=['Title', 'Opinion', 'Polarity', 'Attraction'])
    print(f"  Drop nulos: {initial} → {len(df)}")

    before_dup = len(df)
    df = df.drop_duplicates(subset=['Title', 'Opinion'])
    print(f"  Drop duplicados: {before_dup} → {len(df)}")

    df = df[(df['Opinion'].str.len() >= 20)]
    print(f"  Opinion >= 20 chars: → {len(df)}")

    df = df[(df['Polarity'] >= 1) & (df['Polarity'] <= 5)]
    print(f"  Polarity ∈ [1,5]: → {len(df)}")

    df = df[df['Attraction'].isin(['Hotel', 'Restaurant', 'Attractive'])]
    print(f"  Attraction válido: → {len(df)}")
    print(f"  Total limpieza Rest-Mex: {initial} → {len(df)}")

    return df.reset_index(drop=True)
