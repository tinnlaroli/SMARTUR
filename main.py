import pandas as pd
from config import COLUMNAS_CATEGORICAS
from predict import predecir_servicio
from utils import preparar_encoders, mostrar_resultado

# Perfil del nuevo turista
nuevo = [1, 3, 1500, 5, 3, 2, 1, 0, 1, 1, 0, 1, 0, 1]

# Convertir a DataFrame con nombres de columnas
nuevo_df = pd.DataFrame([nuevo], columns=COLUMNAS_CATEGORICAS)

# Predecir servicio
recomendado = predecir_servicio(nuevo_df)

# Preparar encoders para decodificar
encoders = preparar_encoders()

# Mostrar resultados con interpretación humana
mostrar_resultado(nuevo, recomendado, encoders)
