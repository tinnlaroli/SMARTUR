
from fastapi import FastAPI
from pydantic import BaseModel
import pickle
import pandas as pd
from config import COLUMNAS_CATEGORICAS, RUTA_MODELO, RUTA_ENCODER, RUTA_PRECISION

app = FastAPI(title="SMARTUR API")

# Cargar modelo y encoder al iniciar
with open(RUTA_MODELO, "rb") as f:
    modelo = pickle.load(f)

with open(RUTA_ENCODER, "rb") as f:
    le_servicio = pickle.load(f)

# Esquema de entrada (JSON esperado)
class PerfilTurista(BaseModel):
    ciudad_visita: int
    edad: int
    presupuesto_mxn: int
    duracion_dias: int
    tipo_turismo: int
    viaja_con: int
    nivel_actividad: int
    incluye_hospedaje: int
    incluye_transporte: int
    incluye_alimentos: int
    incluye_tours: int
    interes_eventos: int
    accesibilidad_requerida: int
    visita_previa: int

@app.post("/predecir")
def predecir(perfil: PerfilTurista):
    datos = pd.DataFrame([perfil.dict().values()], columns=COLUMNAS_CATEGORICAS)
    pred = modelo.predict(datos)
    servicio = le_servicio.inverse_transform(pred)[0]
    return {
        "servicio_recomendado": servicio
    }

@app.get("/modelo/info")
def modelo_info():
    try:
        with open(RUTA_PRECISION, "r") as f:
            precision = f.read().strip()
    except FileNotFoundError:
        precision = "No disponible"

    try:
        n_servicios = len(le_servicio.classes_)
    except Exception:
        n_servicios = "No disponible"

    return {
        "precision": precision,
        "servicios_unicos": n_servicios
    }
