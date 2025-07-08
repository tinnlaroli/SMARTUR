
#es la 1er version monolitica de nuestro modelo
# modelo.py

import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
from sklearn.preprocessing import LabelEncoder

# 1. Cargar el archivo CSV codificado
df_codificado = pd.read_csv("smartur_codificado.csv")

# 2. Separar las características (X) y la variable objetivo (y)
X = df_codificado.drop(columns=["servicio_recomendado"])
y = df_codificado["servicio_recomendado"]

# 3. Dividir el conjunto de datos en entrenamiento y prueba
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# 4. Crear y entrenar el modelo
modelo = RandomForestClassifier(n_estimators=100, random_state=42)
modelo.fit(X_train, y_train)

# 5. Evaluar el modelo
y_pred = modelo.predict(X_test)
precision = accuracy_score(y_test, y_pred)
print(f"Precisión del modelo: {precision:.2f}")
print("Informe de clasificación:\n", classification_report(y_test, y_pred))

# 6. Predicción para nuevo turista
nuevo_turista = [[1, 1, 3000, 4, 1, 3, 2, 1, 1, 1, 1, 1, 1, 0]]
pred = modelo.predict(nuevo_turista)
print(f"Predicción para el nuevo turista (codificada): {pred[0]}")

# 7. Cargar el Excel original y regenerar el encoder de servicios
df_original = pd.read_excel("smartur_formulario.xlsx", sheet_name="Formulario")
le_servicio = LabelEncoder()
le_servicio.fit(df_original["servicio_recomendado"])

# 8. Decodificar la predicción
nombre = le_servicio.inverse_transform([pred[0]])
print(f"Recomendación real: {nombre[0]}")
