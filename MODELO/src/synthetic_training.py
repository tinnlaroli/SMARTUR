"""
Modo de entrenamiento SINTÉTICO (opt-in, reversible) — NO se activa nunca por
defecto.

Propósito
---------
El dataset base de producción (data_reviews_mexico.csv) asigna un user_id nuevo
a cada reseña simulada: el 100% de los "usuarios" tiene 1 sola interacción, así
que NO existe estructura usuario-ítem que CF/RF puedan aprender (por eso hoy
item_mean le gana a todos). Este módulo permite, SOLO cuando se activa a mano,
reemplazar los datos de entrenamiento por un conjunto sintético a gran escala en
el que SÍ existe una estructura latente aprendible (personas con rasgos fijos
que califican coherentemente varios ítems reales del catálogo).

Con eso, el pipeline completo (train/test + validación cruzada + API + dashboard
+ persistencia) puede DEMOSTRAR que los algoritmos de ML capturan estructura y
superan al baseline cuando la estructura existe — que es lo que pide la rúbrica
académica. Cuando lleguen usuarios reales, se apaga y el sistema entrena con
datos reales sin ningún residuo.

Reutiliza los generadores ya validados de synthetic_persona_validation.py
(generate_personas / generate_ratings) para no duplicar la lógica de la
estructura latente.

Control (variables de entorno)
------------------------------
  SMARTUR_SYNTH_TRAINING = 1|true|yes|on   -> activa el modo (default: OFF)
  SMARTUR_SYNTH_PERSONAS = <int>           -> nº de personas (default: 2500)

INTEGRIDAD — importantísimo
---------------------------
Cuando este modo está activo, quien llame DEBE marcar las métricas resultantes
con `synthetic_augmented=True` para que el dashboard avise que ese desempeño es
sobre una verdad inventada, no sobre turistas reales. Este módulo por sí solo no
escribe métricas; solo prepara los datos.
"""
import logging
import os

import pandas as pd
from sklearn.model_selection import train_test_split

from synthetic_persona_validation import (
    RANDOM_STATE,
    generate_personas,
    generate_ratings,
)

logger = logging.getLogger(__name__)

_DIR = os.path.dirname(os.path.abspath(__file__))
_DATA = os.path.join(_DIR, '..', 'data')

# Escala por defecto: bastante mayor que el experimento de validación (800) para
# densificar la matriz usuario-ítem sobre el catálogo real y darle al CF vecinos
# con solapamiento suficiente. Ajustable con SMARTUR_SYNTH_PERSONAS.
_DEFAULT_N_PERSONAS = 2500

_TRUTHY = {'1', 'true', 'yes', 'on', 'y', 't'}

# Nombre del respaldo del dataset sintético generado (reproducible/inspeccionable).
SYNTH_BACKUP_CSV = os.path.join(_DATA, 'synthetic_training_backup.csv')


def synth_training_enabled() -> bool:
    """True si SMARTUR_SYNTH_TRAINING está en un valor afirmativo. Default OFF."""
    return os.environ.get('SMARTUR_SYNTH_TRAINING', '').strip().lower() in _TRUTHY


def synth_n_personas() -> int:
    """Nº de personas sintéticas a generar (SMARTUR_SYNTH_PERSONAS o default)."""
    raw = os.environ.get('SMARTUR_SYNTH_PERSONAS', '').strip()
    if raw:
        try:
            n = int(raw)
            if n > 0:
                return n
        except ValueError:
            logger.warning(f"[synth] SMARTUR_SYNTH_PERSONAS inválido ({raw!r}) — usando default {_DEFAULT_N_PERSONAS}.")
    return _DEFAULT_N_PERSONAS


def build_synthetic_ratings(biz_df: pd.DataFrame, n_personas: int | None = None,
                            seed: int = RANDOM_STATE, save_backup: bool = True) -> pd.DataFrame:
    """
    Genera el dataset sintético completo (user_id, business_id, stars) contra el
    catálogo REAL de negocios (solo lectura). Cada persona tiene rasgos latentes
    fijos y califica varios ítems coherentemente — la estructura que CF/RF deben
    poder recuperar.

    Guarda un CSV de respaldo por defecto para que la corrida sea reproducible e
    inspeccionable.
    """
    if n_personas is None:
        n_personas = synth_n_personas()

    personas = generate_personas(n_personas, seed=seed)
    ratings = generate_ratings(personas, biz_df, seed=seed)

    n_users = ratings['user_id'].nunique()
    n_items = ratings['business_id'].nunique()
    pct_repeat = (ratings.groupby('user_id').size() >= 2).mean() * 100 if len(ratings) else 0
    logger.warning(
        f"[synth] Dataset sintético: {len(ratings)} ratings, {n_users} personas, "
        f"{n_items} ítems únicos, {pct_repeat:.0f}% de personas con >=2 ratings "
        f"(estructura latente aprendible — NO son usuarios reales)."
    )

    if save_backup:
        try:
            ratings.to_csv(SYNTH_BACKUP_CSV, index=False)
            logger.info(f"[synth] Respaldo del dataset sintético guardado en {SYNTH_BACKUP_CSV}")
        except Exception as exc:
            logger.warning(f"[synth] No se pudo guardar el respaldo sintético: {exc}")

    return ratings


def build_synthetic_split(biz_df: pd.DataFrame, test_size: float = 0.2,
                          n_personas: int | None = None,
                          seed: int = RANDOM_STATE) -> tuple[pd.DataFrame, pd.DataFrame]:
    """
    Igual que build_synthetic_ratings pero devuelve (train_df, test_df) ya
    particionados 80/20 — listos para asignarse a engine.train_data /
    engine.test_data y que TODO el pipeline (métricas train/test, validación
    cruzada, RF/CF/GBM/LightFM) opere sobre estructura aprendible.
    """
    ratings = build_synthetic_ratings(biz_df, n_personas=n_personas, seed=seed)
    train_df, test_df = train_test_split(ratings, test_size=test_size, random_state=seed)
    return train_df.reset_index(drop=True), test_df.reset_index(drop=True)
