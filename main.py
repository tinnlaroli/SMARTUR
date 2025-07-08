from config import COLUMNAS_CATEGORICAS
from predict import predecir_servicio
from utils import preparar_encoders, mostrar_resultado

# Perfil del nuevo turista
nuevo = [1, 3, 1500, 5, 3, 2, 1, 0, 1, 1, 0, 1, 0, 1]

# Predecir servicio
recomendado = predecir_servicio([nuevo])

# Preparar encoders para decodificar
encoders = preparar_encoders()

# Mostrar resultados con interpretación humana
mostrar_resultado(nuevo, recomendado, encoders)
