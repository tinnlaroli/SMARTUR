
# antes de empezar
# sudo pacman -S python-pandas python-openpyxl python-scikit-learn

from sklearn.preprocessing import LabelEncoder
import pandas as pd

# Cargar el archivo Excel
df_formulario = pd.read_excel("smartur_formulario.xlsx", sheet_name="Formulario")

# Limpiar nombres de columnas eliminando espacios
df_formulario.columns = df_formulario.columns.str.strip()

# Columnas categóricas que deben codificarse
columnas_para_label_encoder = [
    "ciudad_visita",
    "edad",
    "tipo_turismo",
    "viaja_con",
    "nivel_actividad",
    "servicio_recomendado"
]

# Diccionario para guardar los codificadores
label_encoders = {}

for col in columnas_para_label_encoder:
    le = LabelEncoder()
    df_formulario[col] = le.fit_transform(df_formulario[col])
    label_encoders[col] = le

# Guardar el resultado a CSV
df_formulario.to_csv("smartur_codificado.csv", index=False)
print("Archivo exportado como smartur_codificado.csv")
