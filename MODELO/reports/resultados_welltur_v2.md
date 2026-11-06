# WELLTUR v2: resultados para la defensa (ExpoCiencias 2026)

> Todas las cifras salen de datos reales y se reproducen con los notebooks `MODELO/notebooks/01–05`.
> Las figuras están en `MODELO/reports/figuras/`.
> El catálogo usa la edición vigente del DENUE: **05/2026**, publicada por INEGI el 20 de mayo de 2026.

## 1. Encuesta (n = 137 válidas de 139)
- Exclusiones: 1 menor de edad y 1 respuesta duplicada.
- **Índice de estrés** (P3, P4 y P5a-d; ítems propios inspirados en la PSS): α = 0.85. Media 50.8/100.
- **Índice de bienestar** (P6, inspirado en el WHO-5): α = 0.77. Media 48.4/100.
- A más estrés, menos bienestar (ρ = −0.47) y menos satisfacción (ρ = −0.55).
- Cifras corregidas del protocolo:
  - 49.6 % se sintió estresado frecuente o muy frecuentemente; el 57.4 % de esas personas tiene entre 18 y 24 años. El 54.7 % del protocolo es la proporción de jóvenes en **toda** la muestra.
  - 92.7 % reporta al menos uno: cansancio, tensión muscular o problemas de sueño.
  - 90.5 % elegiría naturaleza o relajación para descansar.
  - 92.6 % probaría la app.

## 2. Modelo: perfil → preferencia (notebook 03)
| Método (validación cruzada 5×20, por persona) | nDCG@3 | Precision@3 |
|---|---|---|
| Popularidad (baseline) | 0.645 | 0.538 |
| ML: estrés + bienestar | 0.641 | 0.547 |
| ML: perfil completo (26 variables) | 0.591 | 0.518 |

- **Hallazgo honesto:** con 137 personas el ML no supera a la popularidad. El modelo con muchas variables sobreajusta: queda peor que el baseline, con el IC 95 % de la diferencia por debajo de 0.
- **Efecto con evidencia:** cada +1 desviación estándar de estrés multiplica por **1.74** los momios de preferir relajación, meditación o respiración. IC 95 % 1.18–2.56, p = 0.005, q (FDR) = 0.041.
- Ningún otro tipo de experiencia muestra un efecto significativo.
- El modelo final (`models/welltur_preferencias_v1.json`) usa la popularidad de cada tipo más **solo** ese efecto. Con estrés alto, el peso de mente-cuerpo sube de 5 % a 12 %.

## 3. Catálogo regional (notebook 04)
- Fuente: DENUE 05/2026 (INEGI). Se filtraron los 57 municipios de las Altas Montañas: 69,995 unidades económicas. Los 57 tienen registros.
- Quedan **1,121 lugares** con valor turístico-wellness en 48 municipios.
- **100 % son MiPyMEs**, según el estrato oficial de ≤ 100 personas ocupadas. El 66 % tiene de 0 a 5 personas.
- Composición:
  - 591 de gastronomía;
  - 196 de hospedaje;
  - 143 de artesanía;
  - 60 balnearios y parques acuáticos;
  - 29 de cultura;
  - 84 de spa, temazcal, yoga o meditación;
  - 18 de naturaleza, aventura y café de altura.
- Depuración con reglas explícitas: se excluyen moteles, servicios para mascotas o autos, consultorios dentales, estacionamientos y bares o cantinas. Un bar no es una experiencia de descanso para alguien estresado.
- Cambio respecto a la edición 2017: aquella edición no traía la clave CLEE, sino un id interno. Sus 637 registros quedan **inactivos** en la base, sin borrarse, y sus 149 lugares que siguen operando reaparecen con su CLEE de 2026.
- A eso se suman 6 experiencias **verificadas en campo** por el equipo: ruta de hongos, trueque, mole de Doña Chela y otras.
- Límite: las etiquetas W1–W7 del DENUE son una propuesta por reglas (actividad SCIAN + nombre) y quedan anotadas como pendientes de verificación en campo.

## 4. Ranker v2 (notebook 05)
- Combina tres elementos:
  - los pesos W1–W7 del modelo de la encuesta,
  - las modalidades que la persona elige en la app,
  - la diversidad (≤ 2 por categoría y por municipio) y la cuota de MiPyMEs (≥ 2 en el top 5).
- **Evaluación offline con las 126 personas** que tienen índice de estrés: el ranker solo ve su estrés y se compara con lo que cada una eligió en P10.

| Método | Precision@5 |
|---|---|
| Aleatorio | 0.34 |
| Ranker v2 sin estrés (popularidad) | 0.80 |
| Ranker v2 con estrés | 0.80 |

- El ranker acierta mucho más que el azar (Wilcoxon p < 0.001).
- El estrés no cambia la precisión de forma medible a nivel de lugar. La personalización fuerte viene de lo que la persona elige.
- Ejemplo: con estrés alto que además elige mente-cuerpo y autocuidado, el top 5 pasa a dos clases de yoga (Fortín y Huatusco), dos hospedajes de montaña y un spa.
- El 100 % de los lugares mostrados en el top 5 fueron MiPyMEs.

## 4b. Banco de pruebas de modelos (notebook 06)
Se probaron 11 modelos de arranque en frío y 5 de filtrado colaborativo con el mismo protocolo: validación cruzada 5×10 por persona e IC 95 % contra la popularidad.
- **Arranque en frío:** los modelos flexibles sobreajustan y quedan **por debajo** de la popularidad, con el IC 95 % de la diferencia completamente negativo. Así pasa con la red neuronal MLP (nDCG@3 0.516), Naive Bayes (0.521), Gradient Boosting (0.598), la logística con 26 variables (0.593), la logística lasso (0.607) y kNN por perfil (0.625).
- kNN por estrés (0.650), la logística L2 con estrés (0.639) y Random Forest (0.629) **empatan** con la popularidad (0.648).
- **Completar preferencias:** el CF ítem-ítem, el CF usuario-usuario y la logística con los tipos declarados **empatan** con la popularidad; su IC 95 % incluye 0.
- **Conclusión:** con n = 137 la evidencia sostiene *popularidad + efecto del estrés (OR 1.74)*, que es el modelo en uso. Para la etapa B (ranker pareado) se necesitan al menos 200 usuarios con retroalimentación, que la app ya registra.
- **Calibración de α**, el peso de lo que la persona elige en la app, con el escenario "declara la mitad de sus elecciones":
  - nDCG@5 contra todo lo que eligió: 0.92 con α = 0, **0.976 con α = 0.6** y 0.971 con α = 1.
  - Se eligió **α = 0.6**: es el máximo de ajuste y conserva más descubrimiento que α = 1.

## 4c. Viabilidad del modelo (notebook 08, figuras `08_*`)
Todo se mide **fuera de muestra**, con validación cruzada.

**Matriz de confusión: "¿elegirá relajación?" con su estrés** (n = 126)

| | Predice no | Predice sí |
|---|---|---|
| Real no | 45 | 27 |
| Real sí | 22 | 32 |

- Exactitud 61 %, sensibilidad 59 %, especificidad 62 %. Adivinar siempre "no" da 57 %.
- **AUC = 0.64 (IC 95 % 0.54–0.73)**: mejor que el azar, aunque la señal es modesta.

**Calibración:** el % predicho sigue al observado en los cinco quintiles de estrés, de 26 % a 64 % (predicho) y de 30 % a 63 % (observado).

**Matriz de confusión del recomendador** (top 3 de 8 tipos, pares persona × tipo):

| Método | Precisión | Recall | nDCG@3 |
|---|---|---|---|
| Azar | 38 % | 37 % | 0.42 |
| Popularidad | 54 % | 53 % | 0.65 |
| **Modelo final** | **56 %** | **55 %** | **0.66** |

**Curva de aprendizaje:** entre 40 y 126 personas, el ML con todo el perfil se mantiene unos 0.05 por debajo de la popularidad. Por eso se eligió el modelo simple.

**Análisis de potencia** (Hsieh 1989, α = 0.05, potencia del 80 %, calculado con los OR observados):
- Relajación necesitaba unas 105 personas y ya se detecta con 126.
- Cultura y hospedaje tranquilo necesitarían unas 1,000.
- Los demás tipos, de 1,900 a más de 3,000.
- Esto convierte la siguiente fase en una meta medible.

**Diagrama del flujo completo:** encuesta → ETL → modelo; DENUE → catálogo → BD; ambos llegan al ranker v2 → app → retroalimentación → etapa B.

## 4d. Percepción de usuarios después de usar el prototipo (notebook 09, n = 50)
- Encuesta del 9-oct-2026, aplicada tras probar el **prototipo anterior**. La escala es consistente: α = 0.90.
- % que calificó con 4–5:

| Aspecto | Todas las respuestas | Sin respuestas en línea recta (n = 30) |
|---|---|---|
| Ajuste a sus necesidades de descanso | 88 % | 80 % |
| Satisfacción | 96 % | 93 % |
| Volvería a usarla | 94 % | 90 % |
| Conoció lugares locales que no conocía | 92 % | 87 % |
| Disposición a visitar destinos menos masificados | 96 % | 93 % |

- **Sesgo detectado:** 20 de 50 respondieron todo con 5. Las 5 personas que marcaron "disminuyó considerablemente" en P6 están entre ellas, lo que apunta a respuestas automáticas.
- **Límites:** muestra de conveniencia, sin grupo de comparación. Mide percepción, no eficacia.
- **No entrena el modelo:** no se puede unir con la encuesta de estrés y no registra qué lugar vio cada persona.

## 4e. Modelo bayesiano jerárquico y hallazgo de amplitud (notebook 10)
- **Modelo bayesiano jerárquico** (*partial pooling*; Metropolis adaptativo, R-hat ≤ 1.02):
  - En validación cruzada **empata** con la popularidad y con el modelo FDR: nDCG@3 0.648 contra 0.651; log-loss 0.614 en los tres.
  - Sirve como prueba de robustez: confirma con otro método que relajación es el efecto más fuerte, OR 1.31 con IC 94 % 1.06–1.81 y P(efecto > 0) = 0.99.
  - En producción se mantiene el modelo FDR, que es más simple y rinde igual.
  - **Validación del muestreador:** el mismo modelo, ajustado con PyMC (NUTS, el estándar de la literatura), da los mismos resultados.
    - Posteriores: μ_b 0.171 contra 0.168; τ_b 0.12 contra 0.116.
    - Los 8 OR difieren en ≤ 0.009; relajación 1.318 contra 1.313.
    - R-hat: 1.013 contra 1.000.
    - Tiempo: el muestreador propio tarda 14 s; PyMC tardó 2 h 45 min en Windows sin compilador C.
- **Hallazgo nuevo: más estrés, más amplitud de interés.** Con estrés bajo, medio y alto se eligen 2.6, 3.2 y 3.3 tipos de experiencia en promedio (ρ = 0.21, p = 0.018). El estrés no solo empuja hacia la relajación: aumenta el interés por el turismo de bienestar en general.

## 4f. PSS-10 integrada (licencia Mapi n.º 153824)
- El API acepta `pss_items` y puntúa según la guía oficial:
  - se invierten los ítems 4, 5, 7 y 8;
  - el total va de 0 a 40;
  - se aceptan hasta 2 ítems faltantes, con el promedio de los respondidos × 10;
  - no hay puntos de corte.
- El total se guarda en `pss10_total` solo con consentimiento.
- Equivalencia **provisional** a la escala del modelo (porcentaje del máximo) hasta calibrar la PSS-10 contra el índice de la encuesta en el siguiente estudio.
- En la app, la persona elige entre la versión breve (6 preguntas) y la PSS-10.
  - Los textos están en `MOBILE/assets/instrumentos/pss10_es_mx.json`. Los copió **textualmente** del instrumento con licencia el script `MODELO/src/extraer_pss10.py`: instrucción, 5 opciones, 10 ítems y aviso de copyright.
  - Lo cubren las pruebas de widget de Flutter (5/5).
- Antes del uso electrónico definitivo, la licencia pide enviar capturas de pantalla a Mapi.

## 4g. Contexto GWI
| Dato | Valor | Fuente |
|---|---|---|
| Turismo de bienestar global 2024 | US$893.9 mil millones; 6.4 % anual 2019-2024; proyección de 9.1 % anual a 2029 | *Global Wellness Economy Monitor 2025* |
| **México, turismo de bienestar 2024** | **US$16.7 mil millones, 19.0 millones de viajes, n.º 12 del mundo** | Monitor 2025, Fig. 9.4 |
| México, economía del bienestar 2024 | US$98.1 mil millones, n.º 15 del mundo; 9.8 % anual 2019-2024 | *Country Rankings* (ene-2026), Fig. 3.1 |

El GWI no publica microdatos: sus cifras sirven para justificar el proyecto, no para entrenar el modelo. Como la mayoría de los viajeros de bienestar son "secundarios" (el bienestar no es el motivo principal del viaje), WELLTUR mezcla experiencias wellness con hospedaje, gastronomía y cultura de MiPyMEs locales.

## 5. Qué cambió frente al protocolo y por qué
| Protocolo | Implementado | Justificación |
|---|---|---|
| Clasificar "perfiles de estrés" | Estrés como puntaje continuo que ajusta pesos | La PSS no tiene puntos de corte. El clasificador anterior tenía 52.7 % de exactitud con etiquetas sintéticas |
| nDCG@5 = 0.999 | nDCG y Precision@5 con personas reales | El 0.999 venía de una simulación sintética |
| Modelo híbrido con filtrado colaborativo | Modelo calibrado + reglas explicables + aprendizaje posterior con feedback | Sin historial de usuarios no hay señal colaborativa (*cold start*). Se probó el ML y no superó al baseline |
| WTMS | Sus 7 dimensiones como marco (W1–W7) | Adaptación al español de México sin reproducir el instrumento |
| Lugares en general | DENUE con estrato MiPyME oficial | Mide directamente el impulso a MiPyMEs locales |

## 6. Siguiente fase
- PSS-10 completa: ya se tiene la licencia de Mapi n.º 153824.
- Estudio con al menos 200 personas.
- Verificación en campo del catálogo.
- Prueba A/B con usuarios.
- Entrenamiento de la etapa B cuando haya 200 usuarios y 1000 pares de feedback. La app ya registra impresiones, aperturas y valoraciones.
