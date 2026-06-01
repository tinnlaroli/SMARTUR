import hashlib

import numpy as np
import pandas as pd

RNG = np.random.default_rng(42)

MEXICO_USER_NAMES = [
    'viajero', 'turista', 'explorador', 'aventurero', 'caminante',
    'paseante', 'descubridor', 'viajera', 'turista_mx', 'exploradora',
    'mochilero', 'vacacionista', 'peregrino', 'andante', 'navegante',
    'rutero', 'caminante_mx', 'viajero_frecuente', 'turisteando', 'descubriendo_mx',
]


def simulate_ratings(biz_id: str, avg_rating: float, n_reviews: int) -> pd.DataFrame:
    if n_reviews <= 0:
        return pd.DataFrame(columns=['user_id', 'business_id', 'stars', 'review_text'])

    actual_n = min(n_reviews, 200)
    alpha = (avg_rating - 1) / 4
    alpha = np.clip(alpha, 0.05, 0.95)
    concentration = max(2, 40 * (1 - abs(avg_rating - 3) / 2))
    a = alpha * concentration
    b = (1 - alpha) * concentration
    raw = RNG.beta(a, b, size=actual_n)
    stars = np.clip(np.round(raw * 4 + 1), 1, 5).astype(int)

    user_ids = []
    for i in range(actual_n):
        uname = RNG.choice(MEXICO_USER_NAMES)
        uid = hashlib.md5(f"{uname}_{biz_id}_{i}".encode()).hexdigest()[:12]
        user_ids.append(uid)

    return pd.DataFrame({
        'user_id': user_ids,
        'business_id': [biz_id] * actual_n,
        'stars': stars,
        'review_text': [''] * actual_n,
    })
