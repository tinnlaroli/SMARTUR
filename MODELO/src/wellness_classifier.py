"""
wellness_classifier.py — Clasificador de perfil de vitalidad de viaje (WellTur).

Porta stress_classifier.py de ATARAXIA con dos cambios clave:
  1. HYBRID_CONFIDENCE_THRESHOLD es configurable vía env var WELLNESS_THRESHOLD (default 0.58)
  2. Nomenclatura pública: 'Burnout'→'modo_calma', 'Fatiga_Fisica'→'modo_restauracion',
     'Hiperactividad_Ansiosa'→'modo_equilibrio'

El nombre técnico interno ('Burnout' etc.) se mantiene para compatibilidad con el
matchmaker y los vectores ideales. Solo el mapeo de salida al usuario cambia.
"""
from __future__ import annotations

import json
import logging
import os
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.metrics import accuracy_score, classification_report, f1_score
from sklearn.model_selection import train_test_split

_logger = logging.getLogger("smartur-wellness")

_SRC = Path(__file__).resolve().parent
_ROOT = _SRC.parent
_DATA = _ROOT / "data" / "wellness"
_MODELS_DIR = _ROOT / "models" / "wellness"
_MODEL_PATH = _MODELS_DIR / "wellness_profile.joblib"
_META_PATH = _MODELS_DIR / "wellness_profile.meta.json"
_TRAIN_CSV = _DATA / "entrenamiento_usuarios.csv"

BASE_FEATURE_COLS = [
    "q1_energia_cognitiva",
    "q2_tension_fisica",
    "q3_rumiacion",
    "q4_activacion_negativa",
]
TARGET_COL = "target_perfil_estres"

# Threshold configurable — ajustar con datos reales SMARTUR
HYBRID_CONFIDENCE_THRESHOLD = float(os.getenv("WELLNESS_THRESHOLD", "0.58"))

# Mapeo interno → nombre público (UX no clínica)
MODO_VIAJE_MAP: dict[str, str] = {
    "Burnout": "modo_calma",
    "Fatiga_Fisica": "modo_restauracion",
    "Hiperactividad_Ansiosa": "modo_equilibrio",
}

MODO_VIAJE_LABELS: dict[str, str] = {
    "modo_calma": "Modo Calma",
    "modo_restauracion": "Modo Restauración",
    "modo_equilibrio": "Modo Equilibrio",
}

MODO_VIAJE_DESCRIPTION: dict[str, str] = {
    "modo_calma": "Necesitas desconectarte y recargar tu energía en un entorno tranquilo.",
    "modo_restauracion": "Tu cuerpo y mente buscan descanso activo y recuperación.",
    "modo_equilibrio": "Buscas silencio y espacio para centrarte y encontrar paz interior.",
}


def _add_engineered_features(df: pd.DataFrame) -> tuple[pd.DataFrame, list[str]]:
    """Agrega las 3 features derivadas que usa el HistGBM."""
    out = df.copy()
    q1 = out["q1_energia_cognitiva"].astype(float)
    q2 = out["q2_tension_fisica"].astype(float)
    q3 = out["q3_rumiacion"].astype(float)
    q4 = out["q4_activacion_negativa"].astype(float)

    out["carga_global"] = (q1 + q2 + q3 + q4) / 4.0
    out["tension_rumiacion"] = q2 * q3
    out["activacion_vs_energia"] = q4 - q1

    cols = BASE_FEATURE_COLS + ["carga_global", "tension_rumiacion", "activacion_vs_energia"]
    return out, cols


def _rule_based_profile(q1: int, q2: int, q3: int, q4: int) -> str:
    """Regla heurística de respaldo."""
    if q1 <= 2 and q3 >= 3:
        return "Burnout"
    if q2 >= 3 and q1 <= 2:
        return "Fatiga_Fisica"
    if q4 >= 3 and q2 >= 3:
        return "Hiperactividad_Ansiosa"
    # Desempate por mayor activación
    sums = {
        "Burnout": q1 + q3,
        "Fatiga_Fisica": q2 + (5 - q1),
        "Hiperactividad_Ansiosa": q4 + q2,
    }
    return max(sums, key=sums.get)


def _rule_confidence(q1: int, q2: int, q3: int, q4: int) -> float:
    """Confianza de la regla heurística (0-1)."""
    total = q1 + q2 + q3 + q4
    return min(1.0, max(0.0, (total - 4) / 12.0))


class WellnessProfileClassifier:
    """Clasifica el perfil de vitalidad de viaje del usuario."""

    def __init__(self) -> None:
        self.model: CalibratedClassifierCV | None = None
        self.classes_: list[str] = []
        self.feature_cols: list[str] = BASE_FEATURE_COLS.copy()
        self.metrics: dict[str, Any] = {}

    def _prepare_df(self, df: pd.DataFrame) -> pd.DataFrame:
        out = df.copy()
        for col in BASE_FEATURE_COLS:
            out[col] = pd.to_numeric(out[col], errors="coerce")
        out = out.dropna(subset=BASE_FEATURE_COLS + [TARGET_COL])
        out, self.feature_cols = _add_engineered_features(out)
        return out

    def train(
        self,
        csv_path: Path | None = None,
        test_size: float = 0.2,
    ) -> dict[str, Any]:
        path = csv_path or _TRAIN_CSV
        if not path.exists():
            raise FileNotFoundError(f"CSV de entrenamiento no encontrado: {path}")

        df = pd.read_csv(path)
        if "sample_weight" not in df.columns:
            df["sample_weight"] = 1.0
        df = self._prepare_df(df)

        X = df[self.feature_cols].astype(float).values
        y = df[TARGET_COL].astype(str).values
        sw = df["sample_weight"].astype(float).values

        X_train, X_test, y_train, y_test, sw_train, _ = train_test_split(
            X, y, sw, test_size=test_size, random_state=42, stratify=y
        )

        base = HistGradientBoostingClassifier(
            max_depth=10,
            learning_rate=0.08,
            max_iter=250,
            min_samples_leaf=8,
            l2_regularization=0.5,
            random_state=42,
        )
        clf = CalibratedClassifierCV(base, method="sigmoid", cv=3, ensemble=True)
        clf.fit(X_train, y_train, sample_weight=sw_train)
        y_pred = clf.predict(X_test)

        acc = float(accuracy_score(y_test, y_pred))
        f1 = float(f1_score(y_test, y_pred, average="macro"))

        self.model = clf
        self.classes_ = list(clf.classes_)
        self.metrics = {
            "accuracy": acc,
            "macro_f1": f1,
            "classification_report": classification_report(y_test, y_pred, output_dict=True),
            "n_train": int(len(X_train)),
            "n_test": int(len(X_test)),
            "n_features": len(self.feature_cols),
            "feature_cols": self.feature_cols,
            "model_type": "HistGradientBoosting+CalibratedClassifierCV",
            "hybrid_threshold": HYBRID_CONFIDENCE_THRESHOLD,
        }

        _MODELS_DIR.mkdir(parents=True, exist_ok=True)
        joblib.dump({"model": clf, "feature_cols": self.feature_cols}, _MODEL_PATH)
        _META_PATH.write_text(json.dumps(self.metrics, indent=2), encoding="utf-8")
        _logger.info(
            "Wellness classifier guardado: accuracy=%.3f macro_f1=%.3f", acc, f1
        )
        return self.metrics

    def load(self) -> bool:
        if not _MODEL_PATH.exists():
            return False
        payload = joblib.load(_MODEL_PATH)
        self.model = payload["model"]
        self.feature_cols = payload.get("feature_cols", BASE_FEATURE_COLS)
        self.classes_ = list(self.model.classes_)
        if _META_PATH.exists():
            self.metrics = json.loads(_META_PATH.read_text(encoding="utf-8"))
        return True

    def _feature_row(self, q1: int, q2: int, q3: int, q4: int) -> np.ndarray:
        row = {
            "q1_energia_cognitiva": q1,
            "q2_tension_fisica": q2,
            "q3_rumiacion": q3,
            "q4_activacion_negativa": q4,
        }
        df = pd.DataFrame([row])
        df, cols = _add_engineered_features(df)
        return df[cols].astype(float).values

    def _hybrid_predict(
        self,
        q1: int, q2: int, q3: int, q4: int,
        ml_pred: str,
        proba_map: dict[str, float],
        ml_conf: float,
    ) -> tuple[str, dict[str, float], float, str]:
        rule = _rule_based_profile(q1, q2, q3, q4)
        rule_conf = _rule_confidence(q1, q2, q3, q4)
        method = "ml"

        if ml_conf < HYBRID_CONFIDENCE_THRESHOLD:
            method = "rule_hybrid"
            pred = rule
            proba_map = {c: 0.08 for c in self.classes_}
            proba_map[rule] = max(0.55, rule_conf)
            remaining = 1.0 - proba_map[rule]
            others = [c for c in self.classes_ if c != rule]
            if others:
                for c in others:
                    proba_map[c] = remaining / len(others)
            confidence = float(proba_map[rule])
        else:
            pred = ml_pred
            confidence = ml_conf

        return pred, proba_map, confidence, method

    def predict(
        self, q1: int, q2: int, q3: int, q4: int
    ) -> tuple[str, str, dict[str, float], float, str]:
        """
        Retorna (perfil_interno, modo_viaje_publico, proba_map, confianza, metodo).
        perfil_interno: 'Burnout' | 'Fatiga_Fisica' | 'Hiperactividad_Ansiosa'
        modo_viaje_publico: 'modo_calma' | 'modo_restauracion' | 'modo_equilibrio'
        """
        if self.model is None and not self.load():
            rule = _rule_based_profile(q1, q2, q3, q4)
            conf = _rule_confidence(q1, q2, q3, q4)
            return rule, MODO_VIAJE_MAP[rule], {rule: conf}, conf, "rule_only"

        X = self._feature_row(q1, q2, q3, q4)
        ml_pred = str(self.model.predict(X)[0])
        probs = self.model.predict_proba(X)[0]
        proba_map = {str(c): float(p) for c, p in zip(self.model.classes_, probs)}
        ml_conf = float(max(proba_map.values()))

        pred, proba_map, confidence, method = self._hybrid_predict(
            q1, q2, q3, q4, ml_pred, proba_map, ml_conf
        )
        return pred, MODO_VIAJE_MAP.get(pred, "modo_calma"), proba_map, confidence, method


# Singleton para reusar en endpoints FastAPI
_classifier_instance: WellnessProfileClassifier | None = None


def get_classifier() -> WellnessProfileClassifier:
    global _classifier_instance
    if _classifier_instance is None:
        _classifier_instance = WellnessProfileClassifier()
        if not _classifier_instance.load():
            _logger.warning(
                "Modelo wellness no encontrado en disco — usando reglas heurísticas. "
                "Ejecutar: python wellness_classifier.py --train"
            )
    return _classifier_instance
