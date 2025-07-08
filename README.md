# SMARTUR
Repositorio Oficial para el desarrollo de la plataforma SMARTUR

python -m venv venv   
source venv/bin/activate
dentro del entorno virtual, instala las dependencias necesarias
SMARTUR ❯ pip install fastapi uvicorn pandas openpyxl scikit-learn
(para salirse del entorno virtual, usa el comando `deactivate`)


pasos para construir el modelo:
1. Importar las librerías necesarias.
2. Cargar los datos desde un archivo Excel.
3. Preprocesar los datos:
    - Convertir las columnas categóricas a numéricas.
    - Normalizar los datos.
    ejecutra: python encode.py
4. entrenamiento del modelo:
    - Dividir los datos en conjuntos de entrenamiento y prueba.
    - Entrenar un modelo de regresión logística.
    ejecuta: python train_model.py
5. Guardar el modelo entrenado y los codificadores.
6. Cargar el modelo y los codificadores.
7. Realizar una predicción con un nuevo conjunto de datos.
8. Mostrar los resultados de la predicción.
9. Guardar los resultados en un archivo Excel.
    ejecuta: python main.py