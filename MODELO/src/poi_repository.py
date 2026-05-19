import os
import json
import logging
import pandas as pd
import psycopg2
from psycopg2.extras import Json

logger = logging.getLogger(__name__)


def _get_env(name, default=None):
    value = os.getenv(name)
    return value if value not in (None, '') else default


# Category/context mappings for tourist services and traveler profiles
_SERVICE_TYPE_CATEGORIES = {
    'hotel': {
        'categories_raw': 'hotel, accommodation, Hotels & Travel',
        'categories_mapped': ['rural'],
        'outdoor': False,
    },
    'restaurant': {
        'categories_raw': 'restaurant, food, gastronomy, local food, Restaurants',
        'categories_mapped': ['gastronomy'],
        'outdoor': False,
    },
    'tour': {
        'categories_raw': 'tour, hiking, nature, adventure, Tours',
        'categories_mapped': ['nature'],
        'outdoor': True,
    },
}

_INTEREST_MAP = {
    'naturaleza': 'naturaleza', 'nature': 'naturaleza',
    'cultura': 'cultural', 'culture': 'cultural', 'cultural': 'cultural',
    'gastronomía': 'gastronomico', 'gastronomia': 'gastronomico',
    'gastronomy': 'gastronomico', 'gastronomico': 'gastronomico',
    'aventura': 'aventura', 'adventure': 'aventura',
    'rural': 'rural',
}

_ACTIVITY_BUDGET = {1: 'bajo', 2: 'bajo', 3: 'medio', 4: 'alto', 5: 'premium'}


def get_poi_connection():
    return psycopg2.connect(
        host=_get_env('POI_DB_HOST', 'localhost'),
        port=int(_get_env('POI_DB_PORT', 5432)),
        database=_get_env('POI_DB_NAME', 'smartur'),
        user=_get_env('POI_DB_USER', 'postgres'),
        password=_get_env('POI_DB_PASSWORD', os.getenv('DB_PASSWORD', '12345678')),
        options='-c client_encoding=UTF8',
    )


def fetch_pois(active_only=True):
    where = 'WHERE is_active = TRUE' if active_only else ''
    query = f'''
        SELECT id, name, categories_raw, categories_mapped,
               price_level, is_accessible, outdoor, latitude, longitude
        FROM point_of_interest {where}
    '''
    with get_poi_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query)
            cols = [desc[0] for desc in cur.description]
            rows = cur.fetchall()
    df = pd.DataFrame(rows, columns=cols)

    if 'categories_raw' in df.columns:
        df['categories_raw'] = df['categories_raw'].apply(
            lambda v: v.encode('utf-8', errors='ignore').decode('utf-8')
            if isinstance(v, str)
            else (v if isinstance(v, str) else '')
        )

    if 'categories_mapped' in df.columns:
        def _normalize(val):
            if isinstance(val, list):
                return val
            if val is None:
                return []
            if isinstance(val, str):
                try:
                    parsed = json.loads(val)
                    return parsed if isinstance(parsed, list) else []
                except (json.JSONDecodeError, TypeError):
                    return []
            return []
        df['categories_mapped'] = df['categories_mapped'].apply(_normalize)
    else:
        df['categories_mapped'] = [[] for _ in range(len(df))]

    df['is_accessible'] = df['is_accessible'].apply(lambda v: 1 if v else 0)
    df['outdoor'] = df['outdoor'].apply(lambda v: 1 if v else 0)
    df['price_level'] = df['price_level'].fillna(2).astype(int)

    if 'image_url' not in df.columns:
        df['image_url'] = None

    return df


def fetch_tourist_services(active_only=True):
    """Tourist services as a POI-compatible DataFrame with prefixed IDs (svc_N)."""
    where = 'WHERE ts.active = TRUE' if active_only else ''
    query = f'''
        SELECT ts.id_service AS id, ts.name, ts.service_type,
               l.latitude, l.longitude, ts.image_url
        FROM tourist_service ts
        LEFT JOIN location l ON ts.id_location = l.id_location
        {where}
    '''
    with get_poi_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query)
            cols = [desc[0] for desc in cur.description]
            rows = cur.fetchall()
    df = pd.DataFrame(rows, columns=cols)
    if df.empty:
        return df

    df['id'] = 'svc_' + df['id'].astype(str)
    df['categories_raw'] = df['service_type'].map(
        {k: v['categories_raw'] for k, v in _SERVICE_TYPE_CATEGORIES.items()}
    ).fillna('service')
    df['categories_mapped'] = df['service_type'].map(
        {k: v['categories_mapped'] for k, v in _SERVICE_TYPE_CATEGORIES.items()}
    ).apply(lambda x: x if isinstance(x, list) else [])
    df['outdoor'] = df['service_type'].map(
        {k: 1 if v['outdoor'] else 0 for k, v in _SERVICE_TYPE_CATEGORIES.items()}
    ).fillna(0).astype(int)
    df['price_level'] = 2
    df['is_accessible'] = 0
    df['latitude'] = df['latitude'].fillna(0).astype(float)
    df['longitude'] = df['longitude'].fillna(0).astype(float)
    df['kind'] = 'svc'
    if 'image_url' not in df.columns:
        df['image_url'] = None
    return df


def fetch_all_items(active_only=True):
    """Unified candidate pool: POIs + tourist services."""
    pois = fetch_pois(active_only)
    pois['kind'] = 'poi'
    try:
        services = fetch_tourist_services(active_only)
    except Exception:
        services = pd.DataFrame()
    if services.empty:
        return pois
    return pd.concat([pois, services], ignore_index=True)


_ML_DDL = '''
CREATE TABLE IF NOT EXISTS ml_recommendation_session (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    alpha DOUBLE PRECISION,
    best_algorithm VARCHAR(64),
    execution_time_ms DOUBLE PRECISION,
    context_json JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ml_rec_session_user_created
    ON ml_recommendation_session (user_id, created_at DESC);
CREATE TABLE IF NOT EXISTS ml_recommendation_item (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES ml_recommendation_session(id) ON DELETE CASCADE,
    rank_pos INTEGER NOT NULL,
    item_id VARCHAR(64) NOT NULL,
    title VARCHAR(255),
    score DOUBLE PRECISION,
    pred_cf DOUBLE PRECISION,
    pred_rf DOUBLE PRECISION,
    pred_gbm DOUBLE PRECISION,
    kind VARCHAR(16) DEFAULT 'poi',
    image_url TEXT
);
CREATE INDEX IF NOT EXISTS idx_ml_rec_item_session ON ml_recommendation_item (session_id);
CREATE TABLE IF NOT EXISTS ml_model_metrics (
    id SERIAL PRIMARY KEY,
    metrics_json JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
'''


def ensure_ml_tables():
    """Crea tablas de persistencia ML si no existen."""
    statements = [s.strip() for s in _ML_DDL.split(';') if s.strip()]
    with get_poi_connection() as conn:
        with conn.cursor() as cur:
            for stmt in statements:
                cur.execute(stmt)
        conn.commit()


def save_recommendation_session(
    user_id,
    recommendations,
    alpha,
    best_algorithm,
    execution_time_ms,
    context=None,
):
    """
    Persiste una ejecución de recomendación y sus ítems.
    Retorna session_id o None si la BD no está disponible.
    """
    ensure_ml_tables()
    ctx_json = Json(context) if context else None
    with get_poi_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                '''
                INSERT INTO ml_recommendation_session
                    (user_id, alpha, best_algorithm, execution_time_ms, context_json)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id
                ''',
                (str(user_id), alpha, best_algorithm, execution_time_ms, ctx_json),
            )
            session_id = cur.fetchone()[0]
            for rank, rec in enumerate(recommendations, start=1):
                cur.execute(
                    '''
                    INSERT INTO ml_recommendation_item
                        (session_id, rank_pos, item_id, title, score,
                         pred_cf, pred_rf, pred_gbm, kind, image_url)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ''',
                    (
                        session_id,
                        rank,
                        rec['item_id'],
                        rec.get('title'),
                        rec.get('score'),
                        rec.get('pred_cf'),
                        rec.get('pred_rf'),
                        rec.get('pred_gbm'),
                        rec.get('kind', 'poi'),
                        rec.get('image_url'),
                    ),
                )
        conn.commit()
    return session_id


def fetch_latest_recommendations(user_id):
    """
    Obtiene la última sesión persistida para un usuario.
    Solo lectura — la app debe haber generado recomendaciones antes vía POST.
    """
    ensure_ml_tables()
    query_session = '''
        SELECT id, user_id, alpha, best_algorithm, execution_time_ms, created_at
        FROM ml_recommendation_session
        WHERE user_id = %s
        ORDER BY created_at DESC
        LIMIT 1
    '''
    query_items = '''
        SELECT rank_pos, item_id, title, score, pred_cf, pred_rf, pred_gbm, kind, image_url
        FROM ml_recommendation_item
        WHERE session_id = %s
        ORDER BY rank_pos ASC
    '''
    with get_poi_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query_session, (str(user_id),))
            session = cur.fetchone()
            if not session:
                return None
            sid, uid, alpha, algo, exec_ms, created_at = session
            cur.execute(query_items, (sid,))
            rows = cur.fetchall()
    recommendations = [
        {
            'item_id': r[1],
            'title': r[2],
            'score': float(r[3]) if r[3] is not None else 0.0,
            'pred_cf': float(r[4]) if r[4] is not None else None,
            'pred_rf': float(r[5]) if r[5] is not None else None,
            'pred_gbm': float(r[6]) if r[6] is not None else None,
            'kind': r[7] or 'poi',
            'image_url': r[8],
        }
        for r in rows
    ]
    return {
        'session_id': sid,
        'user_id': uid,
        'alpha': alpha,
        'best_algorithm': algo,
        'execution_time_ms': exec_ms,
        'created_at': created_at.isoformat() if created_at else None,
        'recommendations': recommendations,
    }


def save_model_metrics(metrics: dict):
    """Persiste el JSON de métricas de comparativa de algoritmos."""
    ensure_ml_tables()
    with get_poi_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                'INSERT INTO ml_model_metrics (metrics_json) VALUES (%s)',
                (Json(metrics),),
            )
        conn.commit()


def fetch_latest_model_metrics():
    """Última comparativa de algoritmos almacenada en BD."""
    ensure_ml_tables()
    with get_poi_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                '''
                SELECT metrics_json, created_at
                FROM ml_model_metrics
                ORDER BY created_at DESC
                LIMIT 1
                '''
            )
            row = cur.fetchone()
    if not row:
        return None
    return {
        'metrics': row[0],
        'created_at': row[1].isoformat() if row[1] else None,
    }


def fetch_traveler_profile(user_id):
    """
    Reads traveler_profile for a numeric user_id and returns a context dict
    compatible with ContextEncoder. Returns None if not found or user_id is non-numeric.
    """
    try:
        uid = int(user_id)
    except (ValueError, TypeError):
        return None

    query = '''
        SELECT age_range, interests, activity_level, travel_type, has_accessibility
        FROM traveler_profile
        WHERE user_id = %s AND is_active = TRUE
        LIMIT 1
    '''
    with get_poi_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (uid,))
            row = cur.fetchone()
    if not row:
        return None

    age_range, interests, activity_level, travel_type, has_accessibility = row

    tipos = []
    if interests:
        for interest in interests:
            mapped = _INTEREST_MAP.get(interest.lower().strip())
            if mapped and mapped not in tipos:
                tipos.append(mapped)

    return {
        'edad_range': age_range or '25-34',
        'tiposTurismo': tipos,
        'presupuesto_bucket': _ACTIVITY_BUDGET.get(activity_level, 'medio'),
        'group_type': (travel_type or 'solo').lower(),
        'requiere_accesibilidad': bool(has_accessibility),
    }
