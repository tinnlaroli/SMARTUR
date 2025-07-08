# train_model.py

import pickle
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report

from config import RUTA_CSV, RUTA_MODELO, RUTA_ENCODER
from utils import cargar_datos_codificados, preparar_encoders

def entrenar_y_guardar():
    df = cargar_datos_codificados(RUTA_CSV)
    X = df.drop(columns=["servicio_recomendado"])
    y = df["servicio_recomendado"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    modelo = RandomForestClassifier(n_estimators=100, random_state=42)
    modelo.fit(X_train, y_train)

    # Evaluación
    print(f"Precisión: {accuracy_score(y_test, modelo.predict(X_test)):.2%}")
    print(classification_report(y_test, modelo.predict(X_test)))

    # Guardar modelo y encoder
    encoders = preparar_encoders()
    with open(RUTA_MODELO, "wb") as f:
        pickle.dump(modelo, f)
    with open(RUTA_ENCODER, "wb") as f:
        pickle.dump(encoders["servicio_recomendado"], f)

if __name__ == "__main__":
    entrenar_y_guardar()
