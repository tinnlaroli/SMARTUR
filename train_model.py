import pickle
import os
# from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report

from config import RUTA_CSV, RUTA_MODELO, RUTA_ENCODER, RUTA_PRECISION
from utils import cargar_datos_codificados, preparar_encoders

def entrenar_y_guardar():
    # Cargar datos codificados
    df = cargar_datos_codificados(RUTA_CSV)
    X = df.drop(columns=["servicio_recomendado"])
    y = df["servicio_recomendado"]

    # Separar en datos de entrenamiento y prueba
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # Entrenar modelo
    # modelo = RandomForestClassifier(n_estimators=100, random_state=42)
    modelo = XGBClassifier(n_estimators=100, use_label_encoder=False, eval_metric='mlogloss', random_state=42)
    modelo.fit(X_train, y_train)

    # Evaluación
    precision = accuracy_score(y_test, modelo.predict(X_test))
    print(f"Precisión: {precision:.2%}")
    print(classification_report(y_test, modelo.predict(X_test)))

    # Preparar carpeta si no existe
    os.makedirs(os.path.dirname(RUTA_MODELO), exist_ok=True)

    # Guardar modelo
    with open(RUTA_MODELO, "wb") as f:
        pickle.dump(modelo, f)

    # Guardar encoder
    encoders = preparar_encoders()
    with open(RUTA_ENCODER, "wb") as f:
        pickle.dump(encoders["servicio_recomendado"], f)

    # Guardar precisión
    with open(RUTA_PRECISION, "w") as f:
        f.write(f"{precision:.4f}")

# Ejecutar si se llama desde consola
if __name__ == "__main__":
    entrenar_y_guardar()