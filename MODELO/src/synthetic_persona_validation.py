"""
Experimento AISLADO de validación de pipeline — NO es parte del entrenamiento
de producción ni se conecta al dashboard.

Pregunta que responde: si le damos a CF/RF datos donde SÍ existe estructura
usuario-ítem real (a diferencia del dataset base de producción, donde el
100% de los usuarios tiene 1 sola interacción y no hay nada que aprender),
¿el pipeline es capaz de recuperarla?

Cómo se genera la estructura sintética — a propósito MUY distinta del
generador de datos actual (seed_pois_mexico.py / pre_procesamiento_mexico.py):
  - Cada "persona" sintética tiene rasgos latentes FIJOS y se reutiliza en
    varios ítems (afinidad por tipo de turismo + presupuesto preferido).
  - El generador actual en cambio crea un usuario nuevo por cada reseña y
    la calificación solo depende del promedio del negocio, nunca de quién
    califica — por eso el CF no puede aprender nada de ese dataset (ver
    memoria de la sesión: 248,259 usuarios, 100% con 1 sola interacción).
  - Aquí la calificación SÍ depende de qué tan bien encaja el ítem con los
    rasgos de la persona + ruido — la estructura que un CF/RF debería poder
    recuperar si el pipeline funciona.

IMPORTANTE — por qué esto NUNCA debe tratarse como una mejora real:
Es una verdad sintética que nosotros inventamos. Si CF/RF le "ganan" a
item_mean aquí, solo demuestra que el pipeline puede aprender un patrón
inventado por nosotros — no dice nada sobre el comportamiento real de un
turista en Veracruz. Estos resultados NUNCA se escriben en
algorithm_metrics.json, cv_metrics.json ni ningún archivo que el dashboard
lea — solo se imprimen/guardan en synthetic_validation_report.json como
diagnóstico técnico.

Salvaguarda: SmarturContextModel.train() escribe rf_context_yelp.joblib al
directorio de modelos de producción sin importar los datos de entrada — acá
se redirige ese directorio a una carpeta temporal mientras corre el
experimento, así ni por error se pisa el modelo real.

Uso (manual, nunca automático, nunca dentro del contenedor de producción):
    python synthetic_persona_validation.py
"""
import json
import logging
import shutil
import tempfile
import time
from contextlib import contextmanager
from math import sqrt

import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error

import rf_model as _rf_model_module
from context_encoder import MAPEO_CATEGORIAS, TOURISM_TYPES
from engine import SmarturEngine
from cf import predict_cf_pearson

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

N_PERSONAS = 800
RATINGS_PER_PERSONA = (3, 12)  # rango de cuántos lugares califica cada persona
RANDOM_STATE = 42


@contextmanager
def _sandboxed_model_dir():
    """Redirige rf_model._MODELS a una carpeta temporal mientras dura el
    bloque — así SmarturContextModel.train() no puede escribir sobre
    rf_context_yelp.joblib real aunque este script se corra por accidente
    en el servidor. Se restaura y se borra el temporal al salir."""
    original = _rf_model_module._MODELS
    tmp_dir = tempfile.mkdtemp(prefix='smartur_synth_experiment_')
    _rf_model_module._MODELS = tmp_dir
    try:
        yield tmp_dir
    finally:
        _rf_model_module._MODELS = original
        shutil.rmtree(tmp_dir, ignore_errors=True)


def _tipos_de_categorias(categorias: str) -> list[str]:
    """Dado el string de categorías de un ítem, qué tipos de turismo matchea
    (mismo criterio que preference_match_score en fusion.py)."""
    cats_lower = (categorias or '').lower()
    tipos = []
    for tipo, keywords in MAPEO_CATEGORIAS.items():
        if any(k.lower() in cats_lower for k in keywords):
            tipos.append(tipo)
    return tipos


def generate_personas(n: int = N_PERSONAS, seed: int = RANDOM_STATE) -> pd.DataFrame:
    """Cada persona tiene una afinidad [0,1] por cada tipo de turismo
    (Dirichlet — suman 1, como un perfil de intereses real) y un presupuesto
    preferido 1-4. Rasgos FIJOS por persona, reutilizados en cada rating que
    genere — a diferencia del generador de producción, que no tiene ninguna
    identidad de usuario persistente."""
    rng = np.random.default_rng(seed)
    rows = []
    for i in range(n):
        afinidades = rng.dirichlet(np.ones(len(TOURISM_TYPES)))
        row = {'persona_id': f'synth_persona_{i}', 'budget': int(rng.integers(1, 5))}
        for j, t in enumerate(TOURISM_TYPES):
            row[f'aff_{t}'] = float(afinidades[j])
        rows.append(row)
    return pd.DataFrame(rows)


def generate_ratings(personas: pd.DataFrame, biz_df: pd.DataFrame, seed: int = RANDOM_STATE) -> pd.DataFrame:
    """Cada persona califica varios ítems reales del catálogo; el rating
    depende de qué tan bien encaja el ítem con sus rasgos latentes + ruido
    gaussiano — la estructura aprendible que le falta al dataset actual."""
    rng = np.random.default_rng(seed)
    biz = biz_df.copy()
    biz['_tipos'] = biz['categories'].apply(_tipos_de_categorias)
    biz = biz[biz['_tipos'].map(len) > 0].reset_index(drop=True)
    if biz.empty:
        raise ValueError('Ningún ítem del catálogo tiene categorías mapeables a tipos de turismo.')

    rows = []
    for _, persona in personas.iterrows():
        n_ratings = int(rng.integers(RATINGS_PER_PERSONA[0], RATINGS_PER_PERSONA[1] + 1))
        n_ratings = min(n_ratings, len(biz))
        sample_idx = rng.choice(len(biz), size=n_ratings, replace=False)
        for idx in sample_idx:
            item = biz.iloc[idx]
            afinidad = max((persona[f'aff_{t}'] for t in item['_tipos']), default=0.0)
            price = item.get('price_level', 2) or 2
            try:
                budget_fit = 1.0 - abs(float(persona['budget']) - float(price)) / 3.0
            except (TypeError, ValueError):
                budget_fit = 0.5
            true_score = 1.0 + 4.0 * (0.7 * afinidad + 0.3 * max(0.0, budget_fit))
            noisy = true_score + rng.normal(0, 0.5)
            stars = int(np.clip(round(noisy), 1, 5))
            rows.append({
                'user_id': persona['persona_id'],
                'business_id': item['business_id'],
                'stars': stars,
            })
    return pd.DataFrame(rows)


def _rmse_mae(actuals, preds) -> dict:
    return {
        'rmse': float(sqrt(mean_squared_error(actuals, preds))),
        'mae': float(mean_absolute_error(actuals, preds)),
    }


def _persona_declared_context(persona: pd.Series) -> dict:
    """
    Simula lo que la persona 'declararía' en su perfil real: su tipo de
    turismo favorito (mayor afinidad) y su bucket de presupuesto — igual
    que fetch_traveler_profile en producción. RF/predict_with_context solo
    puede usar el CONTEXTO DECLARADO al predecir (no la identidad de
    entrenamiento — ver rf_model.py:predict_with_context), así que probarlo
    con user_context=None sería injusto: nunca podría distinguir personas.
    """
    afinidades = {t: persona[f'aff_{t}'] for t in TOURISM_TYPES}
    top_tipo = max(afinidades, key=afinidades.get)
    budget_map = {1: 'bajo', 2: 'medio', 3: 'alto', 4: 'premium'}
    return {
        'tiposTurismo': [top_tipo],
        'presupuesto_bucket': budget_map.get(int(persona['budget']), 'medio'),
    }


def _make_fold_engine(train_df: pd.DataFrame, df_biz: pd.DataFrame) -> SmarturEngine:
    fold_engine = object.__new__(SmarturEngine)
    fold_engine.train_data = train_df
    fold_engine.df_biz = df_biz
    fold_engine._user_idx_map = None
    fold_engine._biz_idx_map = None
    fold_engine.prepare_pearson_matrix()
    return fold_engine


def run_validation(n_personas: int = N_PERSONAS, test_size: float = 0.2) -> dict:
    from sklearn.model_selection import train_test_split

    logger.info('[synth] Cargando catálogo real de negocios (solo lectura)...')
    base_engine = SmarturEngine(data_source='mexico')
    biz_df = base_engine.df_biz

    logger.info(f'[synth] Generando {n_personas} personas sintéticas con rasgos latentes...')
    personas = generate_personas(n_personas)
    ratings = generate_ratings(personas, biz_df)
    logger.info(
        f'[synth] {len(ratings)} ratings generados — '
        f'{ratings["user_id"].nunique()} personas, {ratings["business_id"].nunique()} ítems únicos, '
        f'{(ratings.groupby("user_id").size() >= 2).mean() * 100:.0f}% de personas con >=2 ratings'
    )

    train_df, test_df = train_test_split(ratings, test_size=test_size, random_state=RANDOM_STATE)

    actuals = test_df['stars'].values
    global_mean = float(train_df['stars'].mean())
    baseline_preds = np.full(len(test_df), global_mean)

    item_means = train_df.groupby('business_id')['stars'].mean()
    item_mean_preds = test_df['business_id'].map(item_means).fillna(global_mean).values

    logger.info('[synth] Evaluando CF Pearson KNN...')
    t0 = time.time()
    fold_engine = _make_fold_engine(train_df, biz_df)
    cf_preds = [
        predict_cf_pearson(row.user_id, row.business_id, fold_engine)
        for row in test_df.itertuples()
    ]
    cf_time_ms = (time.time() - t0) * 1000

    logger.info('[synth] Evaluando Random Forest (modelos en carpeta temporal, no toca producción)...')
    t0 = time.time()
    persona_ctx = {
        p['persona_id']: _persona_declared_context(p)
        for _, p in personas.iterrows()
    }
    with _sandboxed_model_dir():
        rf = _rf_model_module.SmarturContextModel()
        rf.train(train_df, dynamic_override=True)
        rf_preds = [
            float(rf.predict_with_context(
                [row.business_id], user_context=persona_ctx.get(row.user_id))[0])
            for row in test_df.itertuples()
        ]
    rf_time_ms = (time.time() - t0) * 1000

    result = {
        'n_personas': n_personas,
        'n_ratings': len(ratings),
        'n_train': len(train_df),
        'n_test': len(test_df),
        'algorithms': {
            'baseline': _rmse_mae(actuals, baseline_preds),
            'item_mean': _rmse_mae(actuals, item_mean_preds),
            'cf_knn_pearson': {**_rmse_mae(actuals, cf_preds), 'time_ms': cf_time_ms},
            'random_forest': {**_rmse_mae(actuals, rf_preds), 'time_ms': rf_time_ms},
        },
        'note': (
            'DIAGNÓSTICO DE PIPELINE, NO es una métrica de producción. '
            'La "verdad" aquí es un patrón sintético inventado — que CF/RF le '
            'ganen a item_mean solo demuestra que el pipeline SÍ puede aprender '
            'estructura usuario-ítem cuando existe. No implica nada sobre el '
            'comportamiento real de turistas en Veracruz.'
        ),
    }
    return result


if __name__ == '__main__':
    report = run_validation()
    print(json.dumps(report, indent=2, ensure_ascii=False))
    best = min(report['algorithms'], key=lambda k: report['algorithms'][k]['rmse'])
    print(f"\n[synth] Mejor algoritmo sobre estructura inventada: {best} "
          f"(RMSE={report['algorithms'][best]['rmse']:.4f})")
    if best in ('cf_knn_pearson', 'random_forest'):
        print('[synth] ✓ El pipeline SÍ puede aprender estructura usuario-ítem cuando existe.')
    else:
        print('[synth] ✗ Ni con estructura inventada a propósito CF/RF superan a item_mean — revisar el pipeline.')
