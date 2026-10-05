# Flujo reproducible del modelo

Los notebooks de esta carpeta son de auditoría y experimentación. El servicio
no ejecuta notebooks en producción: los resultados aprobados se convierten en
scripts dentro de `src/` y los artefactos se guardan con un `training_manifest`.

Orden recomendado:

1. `01_auditoria_datasets.ipynb`: cardinalidad, duplicados, usuarios repetidos,
   cobertura del catálogo y distribución de ratings.
2. `02_catalogo_smartur.ipynb`: calidad y normalización de POIs/servicios.
3. `03_sintetico_controlado.ipynb`: personas persistentes y verdad oculta para
   validar que el pipeline puede aprender una señal conocida.
4. `04_benchmark_colaborativo.ipynb`: comparación reproducible contra Yelp o
   Google Local, sin copiar esos usuarios a SMARTUR.
5. `05_modelos_y_ranking.ipynb`: popularidad, contenido, KNN, SVD, LightFM y
   mezcla híbrida.
6. `06_evaluacion_temporal.ipynb`: split temporal, Recall/NDCG/HitRate,
   cobertura, diversidad y análisis de errores.
7. `07_auditoria_catalogo_wellness.ipynb`: calidad del catálogo wellness local,
   cobertura de atributos y límites de uso; no entrena ni simula usuarios.

El comando ejecutable para bootstrap es:

```bash
cd MODELO/src
python train_pipeline.py --personas 2500 --promote
```

Ese flujo deja claro que el resultado es `synthetic_bootstrap`. No se debe
presentar como eficacia de usuarios reales. Cuando existan interacciones reales,
se debe desactivar el modo sintético y generar un nuevo `training_manifest`.
