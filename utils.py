# utils.py

import pandas as pd
from sklearn.preprocessing import LabelEncoder
from config import RUTA_EXCEL, SHEET_NAME

def cargar_datos_codificados(path):
    return pd.read_csv(path)

def preparar_encoders():
    df_original = pd.read_excel(RUTA_EXCEL, sheet_name=SHEET_NAME)
    encoders = {
        "ciudad_visita": LabelEncoder().fit(df_original["ciudad_visita"]),
        "edad": LabelEncoder().fit(df_original["edad"]),
        "tipo_turismo": LabelEncoder().fit(df_original["tipo_turismo"]),
        "viaja_con": LabelEncoder().fit(df_original["viaja_con"]),
        "nivel_actividad": LabelEncoder().fit(df_original["nivel_actividad"]),
        "servicio_recomendado": LabelEncoder().fit(df_original["servicio_recomendado"])
    }
    return encoders


def mostrar_resultado(nuevo, pred, encoders):
    cod_ciudad, cod_edad, presupuesto, duracion, cod_tipo, cod_con, cod_nivel, \
    hospedaje, transporte, alimentos, tours, eventos, accesibilidad, visita_previa = nuevo

    le_ciudad = encoders["ciudad_visita"]
    le_edad = encoders["edad"]
    le_tipo = encoders["tipo_turismo"]
    le_con = encoders["viaja_con"]
    le_nivel = encoders["nivel_actividad"]
    le_servicio = encoders["servicio_recomendado"]

    print("\n================== RESULTADOS DEL MODELO SMARTUR ==================\n")

    print("PERFIL DEL TURISTA ANALIZADO:")
    print(f"   • Ciudad a visitar: {le_ciudad.inverse_transform([cod_ciudad])[0]}")
    print(f"   • Rango de edad: {le_edad.inverse_transform([cod_edad])[0]}")
    print(f"   • Presupuesto disponible: ${presupuesto:,} MXN")
    print(f"   • Duración del viaje: {duracion} días")
    print(f"   • Tipo de turismo preferido: {le_tipo.inverse_transform([cod_tipo])[0]}")
    print(f"   • Compañía de viaje: {le_con.inverse_transform([cod_con])[0]}")
    print(f"   • Nivel de actividad deseado: {le_nivel.inverse_transform([cod_nivel])[0]}")

    print("\n   SERVICIOS INCLUIDOS EN EL PAQUETE:")
    print(f"   • Hospedaje: {'Incluido' if hospedaje else 'No incluido'}")
    print(f"   • Transporte: {'Incluido' if transporte else 'No incluido'}")
    print(f"   • Alimentos: {'Incluido' if alimentos else 'No incluido'}")
    print(f"   • Tours guiados: {'Incluido' if tours else 'No incluido'}")
    print(f"   • Eventos especiales: {'Interesado' if eventos else 'No interesado'}")

    print("\n    REQUERIMIENTOS ESPECIALES:")
    print(f"   • Accesibilidad requerida: {'Sí' if accesibilidad else 'No'}")
    print(f"   • ¿Ha visitado el destino antes?: {'Sí' if visita_previa else 'No'}")

    print("\n" + "="*70)
    print("RECOMENDACIÓN DEL SISTEMA:")
    print(f"   • SERVICIO RECOMENDADO: {pred}")
    print("="*70)
