# predict.py

import pickle
from config import RUTA_MODELO, RUTA_ENCODER
from utils import preparar_encoders

def predecir_servicio(nuevo_usuario_codificado):
    with open(RUTA_MODELO, "rb") as f:
        modelo = pickle.load(f)
    with open(RUTA_ENCODER, "rb") as f:
        le_servicio = pickle.load(f)

    pred = modelo.predict(nuevo_usuario_codificado)
    return le_servicio.inverse_transform(pred)[0]
