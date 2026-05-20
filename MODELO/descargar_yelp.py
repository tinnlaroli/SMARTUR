"""Descarga el dataset Yelp (Kaggle) y copia los JSON necesarios a data/."""

import os
import shutil
import sys

import kagglehub

YELP_FILES = (
    "yelp_academic_dataset_business.json",
    "yelp_academic_dataset_review.json",
)


def _data_dir() -> str:
    return os.environ.get(
        "YELP_DATA_DIR",
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "data"),
    )


def _find_file(root: str, filename: str) -> str | None:
    direct = os.path.join(root, filename)
    if os.path.isfile(direct):
        return direct
    for dirpath, _, files in os.walk(root):
        if filename in files:
            return os.path.join(dirpath, filename)
    return None


def download_yelp(target_dir: str | None = None) -> str:
    target_dir = target_dir or _data_dir()
    os.makedirs(target_dir, exist_ok=True)

    missing = [
        name
        for name in YELP_FILES
        if not os.path.isfile(os.path.join(target_dir, name))
    ]
    if not missing:
        print(f"Archivos Yelp ya presentes en {target_dir}")
        return target_dir

    print("Iniciando descarga del dataset de Yelp (Kaggle)...")
    print("Nota: puede tardar varios minutos y requiere conexión a internet.")
    try:
        cache_path = kagglehub.dataset_download("yelp-dataset/yelp-dataset")
    except Exception as exc:
        print(
            "\nError al descargar desde Kaggle. Si es la primera vez, acepta los "
            "términos en https://www.kaggle.com/datasets/yelp-dataset/yelp-dataset "
            "y configura KAGGLE_USERNAME + KAGGLE_KEY en .env",
            file=sys.stderr,
        )
        raise exc

    print(f"Dataset en caché: {cache_path}")

    for name in missing:
        src = _find_file(cache_path, name)
        if src is None:
            raise FileNotFoundError(
                f"No se encontró {name} en el dataset descargado ({cache_path})"
            )
        dst = os.path.join(target_dir, name)
        print(f"Copiando {name} -> {dst}")
        shutil.copy2(src, dst)

    print("Descarga completada.")
    return target_dir


if __name__ == "__main__":
    download_yelp()
