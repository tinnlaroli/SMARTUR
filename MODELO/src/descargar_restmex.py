import os
import sys
import argparse

import pandas as pd

_DIR = os.path.dirname(os.path.abspath(__file__))
_DATA = os.path.join(_DIR, '..', 'data')
sys.path.insert(0, _DIR)

from data_cleaner import clean_restmex


def cargar_restmex_2022(ruta_xlsx=None):
    if ruta_xlsx is None:
        ruta_xlsx = os.path.join(_DATA, 'restmex_2022_train.xlsx')

    if not os.path.exists(ruta_xlsx):
        ruta_xlsx = os.path.join(_DATA, 'Rest_Mex_2022_Sentiment_Analysis_Track_Train.xlsx')

    if not os.path.exists(ruta_xlsx):
        print(f"No se encontró el archivo Rest-Mex 2022 en:\n  {ruta_xlsx}")
        print("\nDescárgalo desde el repo de un participante o coloca el XLSX en data/")
        print("  Ejemplo: curl -L -o MODELO/data/restmex_2022_train.xlsx <URL>")
        return None

    print(f"Cargando Rest-Mex 2022 desde: {ruta_xlsx}")
    df = pd.read_excel(ruta_xlsx)
    print(f"  Filas crudas: {len(df)}")
    print(f"  Columnas: {list(df.columns)}")

    print("\nLimpiando...")
    df = clean_restmex(df)

    return df


def exportar_csv(df):
    salida = os.path.join(_DATA, 'data_restmex_2022_clean.csv')
    df.to_csv(salida, index=False)
    print(f"\nExportado a: {salida}")
    print(f"  Filas: {len(df)}")
    print(f"  Columnas: {list(df.columns)}")
    return salida


def main():
    parser = argparse.ArgumentParser(description='Descarga y limpia Rest-Mex')
    parser.add_argument('--xlsx', help='Ruta al archivo XLSX de Rest-Mex 2022')
    parser.add_argument('--no-export', action='store_true', help='Solo limpiar sin exportar')
    args = parser.parse_args()

    df = cargar_restmex_2022(args.xlsx)
    if df is None:
        sys.exit(1)

    print(f"\nDistribución Polaridad:\n{df['Polarity'].value_counts().sort_index()}")
    print(f"\nDistribución Attraction:\n{df['Attraction'].value_counts()}")

    if not args.no_export:
        exportar_csv(df)


if __name__ == '__main__':
    main()
