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
- **Un solo cuestionario en la app: la PSS-10.** Las 6 preguntas breves solo quedan como respaldo si una compilación no trae el texto licenciado; la persona ya no elige entre dos.
  - El texto vive en `MOBILE/assets/instrumentos/pss10_es_mx.json`, copiado **textualmente** del instrumento con licencia por `MODELO/src/extraer_pss10.py`. Los repos son públicos: en git va la plantilla vacía y el APK lo recibe desde un secreto de GitHub.
- Antes del uso electrónico definitivo, la licencia pide enviar capturas de pantalla a Mapi.

## 4h. Datasets de estrés: qué existe y cómo se usó
**Búsqueda:** OSF, Zenodo, Kaggle, Mendeley Data y literatura de turismo de bienestar.

**Hallazgo honesto:** no existe un dataset público que tenga la PSS-10 **y** preferencias de viaje o de turismo de bienestar. Los que hay miden estrés sin el objetivo que necesita el modelo:

| Dataset | Qué tiene | Sirve para |
|---|---|---|
| **COVIDiSTRESS Global Survey** (Yamada et al., 2021, *Scientific Data* 8:3; OSF doi:10.17605/OSF.IO/Z39US) | PSS-10 ítem por ítem, 125,306 personas; **México: 9,169** | Normas mexicanas de la PSS-10 ✅ |
| Student Stress Monitoring (Kaggle, Bangladesh, 2023) | PSS-10 en 1,100 universitarios | Solo estudiantes de otro país; sin preferencias |
| Zenodo 5565155 | Estrés y ocio en 205 académicos | Ocio social, no turismo |
| Estudios de motivación wellness (IJERPH 2023; *Behav. Sci.* 2024) | Encuestas con SEM | Sin datos abiertos; confirman que la **relajación** es la motivación dominante (β = 0.90), igual que nuestro hallazgo |

**Normas mexicanas de la PSS-10** (COVIDiSTRESS, `MODELO/src/normas_pss10.py`, `reports/normas_pss10_mexico.json`):
- n = 8,556 válidas; α = 0.885; media 17.2 (DE 7.4). El cálculo reproduce exactamente el puntaje publicado por los autores (r = 1.00).
- Baja con la edad: 20.9 (18–24) → 18.9 (25–34) → 16.5 (35–44) → 14.7 (45–54) → 12.7 (55+).
- Ponderada con la mezcla de edades de nuestra encuesta: **media 18.6, DE 7.5**.

**Cómo entra la PSS-10 al modelo:** el efecto del estrés se aprendió con el índice de la encuesta (n = 137) y se usa estandarizado. La PSS-10 se lleva a esa misma escala con **equiparación lineal por normas**: z = (PSS-10 − 18.6) / 7.5. Supuesto explícito: misma posición relativa de estrés en ambos instrumentos.
- Límites: datos de abril–mayo de 2020 (pandemia), muestra en línea y 72 % mujeres; la referencia puede estar algo elevada.
- **Para entrenar con la PSS-10 de forma directa** hace falta que las mismas personas respondan PSS-10 y preferencias. La app ya lo registra con consentimiento (`pss10_total` + modalidades + calificación de la recomendación): con ≥ 200 respuestas se reentrena y se reemplaza la equiparación.

## 4i. Recomendación siempre disponible
- Antes, si los filtros (municipio, esfuerzo, accesibilidad) dejaban 0 lugares, la app decía que no había experiencias.
- Ahora nunca devuelve vacío: primero lo que cumple todo; si no alcanza, relaja por etapas (esfuerzo → municipio → accesibilidad).
- Cada lugar indica su **coincidencia**: alta (cumple lo pedido), media (no es de tus modalidades; viene por tu perfil) o baja (se relajó un filtro), con el motivo. Arriba se avisa que hay opciones con menor relación.
- Se corrigió además un límite que dejaba fuera del recomendador y del home a los lugares por encima de los primeros 1,000 (orden alfabético) y 500 (home).

## 4j. Un solo formulario y modelo PSS-10 → afrontamiento (ranker v3)
**Formulario único en la app:** PSS-10 → motivos del viaje (M1–M9) → modalidades (W1–W7) → esfuerzo → zona. La zona es las Altas Montañas (toda la región o un municipio) o todo México (todo el país o un estado). Antes eran dos formularios separados: uno con estrés y modalidades, y otro con motivos y modalidades, sin estrés. Ahora una sola solicitud pondera todo.

**Dataset con objetivo:** COVIDiSTRESS sí trae una medida de qué le sirve a cada persona: 16 reactivos *Expl_Coping*, "I have found the following helpful for reducing feelings of discomfort", en escala de 1 a 6. La redacción se verificó en el archivo oficial de Qualtrics del proyecto (OSF 2ftma).
- Se usa la submuestra de México con PSS-10 y afrontamiento completos (n = 6,224).
- Objetivos, como puntaje **relativo a la persona**:
  - descanso pasivo: ver series o películas → M1;
  - convivencia: con amistades y familia → M5;
  - actividad o pasatiempo → M2 y M4;
  - espiritualidad → M9.
- La asociación de cada actividad con un motivo es de criterio experto y está documentada en `modelo_afrontamiento.py`.

**Validación** (5 pliegues × 5 repeticiones, nDCG por persona del orden de las 4 actividades):

| Modelo | nDCG | Diferencia vs. promedio (IC 95 %) | R² máximo |
|---|---|---|---|
| Promedio (línea base) | 0.9103 | — | 0 |
| Ridge, total PSS-10 | 0.9106 | +0.0003 (−0.0014 a 0.0021) | 0.006 |
| **Ridge, 10 ítems (elegido)** | **0.9113** | **+0.0010 (−0.0007 a 0.0030)**; mejor en 20 de 25 pliegues | 0.008 |
| Gradient Boosting, 10 ítems | 0.9100 | −0.0003 | <0 |
| Ridge, 10 ítems + edad + sexo | — | +0.0009 (−0.0009 a 0.0028) | 0.033 |

**Hallazgo honesto:** el estrés, y también la edad y el sexo, casi no predicen **qué** actividad le ayuda más a cada persona. La mejora sobre el promedio es mínima y su IC incluye 0. Lo que sí es consistente es la **dirección**: a más estrés se valora relativamente más descansar (ρ = +0.08) y convivir (ρ = +0.05), y menos los pasatiempos, ayudar a otros o la espiritualidad. Esto coincide con nuestra encuesta (OR 1.74 hacia relajación).
- **Implicación para el diseño:** preguntar a la persona qué busca (M/W) es indispensable; el estrés solo puede ajustar el orden.
- En el ranker v3, lo declarado pesa 60 % (α = 0.6; motivos y modalidades mitad y mitad). El perfil por estrés pesa 40 %: modelo de la encuesta, ajustado por el modelo de afrontamiento con un tope de ±50 % por modalidad. En la práctica, con estos coeficientes el ajuste ronda ±10 %.
- Artefactos: `models/welltur_afrontamiento_v1.json` (coeficientes) y `reports/modelo_afrontamiento_v1.json` (comparación). Pruebas: `tests/test_welltur_ranker_v2.py::FormularioUnicoTests`.
- Límites: datos de 2020 (pandemia) sobre afrontamiento cotidiano, no sobre viajes; la transferencia a turismo es un supuesto. Para validarla hacen falta respuestas de la app (PSS-10 + motivos + calificación).

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
