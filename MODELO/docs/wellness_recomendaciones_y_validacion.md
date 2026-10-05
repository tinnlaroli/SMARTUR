# Welltur: alcance, datos y evaluación

## Qué hace la versión actual

El flujo corto pide a la persona que declare de una a tres dimensiones de bienestar,
un nivel de actividad deseado y una región. No mide estrés ni produce una etiqueta
psicológica. Guardar las preferencias y la sesión en el historial es opcional: si la
persona no acepta, la API y MODELO procesan la consulta para ordenar lugares y devuelven
el resultado sin crear un registro de evaluación ni de sesión. Si acepta, se registra
la consulta para permitir ver y borrar el historial. La API obtiene únicamente servicios y puntos de interés
activos, aprobados por SMARTUR y con evidencia registrada. El ranker aplica primero
la región elegida, descarta lugares sin dimensiones coincidentes y ordena por:

1. proporción de dimensiones elegidas que el lugar cubre;
2. como desempate, ajuste ordinal entre la actividad preferida (suave, intermedia,
   activa) y la demanda física aproximada del lugar (suave, intermedia, exigente);
3. nombre del lugar como desempate estable.

La coincidencia en porcentaje es una operación sobre etiquetas explícitas; no es una
probabilidad de satisfacción ni eficacia terapéutica. La actividad solo desempata
lugares con igual coincidencia. La demanda física se captura con tres categorías
descriptivas; no debe interpretarse como una medición fisiológica ni como una escala
validada. Aún requiere una pauta operativa común y revisión de consistencia entre
quienes registran el catálogo.

El Global Wellness Institute (GWI) describe dimensiones conceptuales de bienestar,
pero no ofrece con ellas una escala psicométrica ni certifica negocios de SMARTUR.
Por ello, la interfaz y documentación las presenta como categorías orientativas, y
la aprobación corresponde a SMARTUR con evidencia del servicio concreto.

Este formulario es un **selector de preferencias**, no una escala psicométrica ni un
instrumento válido para identificar tipos o intensidad de estrés. Su validez actual es
únicamente funcional: verifica que las respuestas se envíen y que
el ranking aplique las reglas declaradas. Aún no se ha demostrado que todas las
personas interpreten igual las opciones ni que las recomendaciones sean pertinentes.
La opción de guardar historial es una función del servicio y no autoriza por sí sola
el uso de respuestas en investigación, entrenamiento de modelos o publicaciones; esos
fines requieren información, consentimiento y revisión ética propios.
Antes de llamarlo cuestionario validado se requieren entrevistas cognitivas breves
con turistas del público objetivo, una prueba de usabilidad del flujo, revisión de
contenido por personas con conocimiento de turismo/bienestar y una evaluación de
relevancia de recomendaciones separada. Un resultado favorable de usabilidad no
equivale a validación de estrés o de impacto en salud.

La aprobación del catálogo es una revisión operativa interna de SMARTUR. Para hacerla
auditable, el formulario del prestador y la revisión del dashboard piden que la
evidencia registre una fuente común y una justificación breve por cada dimensión
marcada. El API valida esa estructura y conserva el registro serializado en la columna
de texto ya existente, sin añadir otra fuente de esquema. Propuestas antiguas en texto
libre deben completarse en el dashboard antes de aprobarse. Estos campos mejoran la
trazabilidad, pero no comprueban por sí solos la calidad de la evidencia ni reemplazan
una rúbrica validada. La taxonomía de actividades es propia de SMARTUR: GWI aporta el marco de
seis dimensiones, no una lista oficial de categorías, criterios de certificación ni
una correspondencia actividad-dimensión.

Los límites de caracteres del formulario son controles de captura y almacenamiento,
no umbrales psicométricos ni una comprobación automática de veracidad. Que el panel
muestre los campos como listos significa únicamente que el registro tiene su estructura
mínima; la persona revisora todavía debe comprobar la fuente y la evidencia concreta.

## Instrumentos y límites sobre estrés

Las ocho preguntas personalizadas anteriores no tienen una validación psicométrica
documentada. No deben sustentar afirmaciones de estrés crónico, perfiles clínicos o
intensidad. El flujo preference-first no las reutiliza.

La PSS-10 en español cuenta con evidencia psicométrica en muestras mexicanas; un
estudio con 1,990 personas en México estudió PSS-10/PSS-14 y reportó fiabilidad y
estructura factorial adecuadas. Otro estudio de PSS-4/PSS-10 se realizó con mujeres
mexicanas de una cohorte específica, por lo que su generalización a toda la población
de turistas necesita cautela. PSS estima estrés percibido en el último mes; no es un
diagnóstico de estrés crónico ni clasifica “tipos” de estrés. Además, la autorización
de la escala y de la traducción concreta debe verificarse con sus titulares antes de
integrarla. El laboratorio de Cohen indica que la solicitud de uso se tramita por
ePROVIDE; el trámite de permiso de la escala y los derechos de una traducción son
cuestiones relacionadas, pero distintas. Una revisión metodológica de instrumentos
señala que la PSS no tiene puntos de corte diagnósticos. Por tanto, incluso con
permiso, su puntuación se analizaría como estrés percibido continuo, sin categorías
clínicas inventadas ni “tipos” de estrés. Hasta tener permiso, revisión de especialista,
protocolo ético y consentimiento apropiado, SMARTUR no presenta el flujo actual como
escala PSS ni calcula categorías de estrés.

Para medir resultados de bienestar existe el WHO-5: son cinco reactivos sobre las
últimas dos semanas, no mide estrés ni atribuye cambios a un viaje. La OMS lo publica
bajo CC-BY-NC-SA 3.0; antes de incorporarlo a SMARTUR se debe revisar que el uso,
atribución, adaptación y distribución de la app cumplan esa licencia y comprobar una
versión en español pertinente. No conviene añadirlo al flujo de recomendación actual:
volvería más largo un selector que no necesita información de salud para ordenar
preferencias.

Para evaluar la percepción de un destino, la investigación turística ofrece medidas
de cualidades restaurativas percibidas (PDRQ). El instrumento original de Lehto
identificó seis factores en 30 reactivos. Un estudio posterior de destinos wellness
usó 13 reactivos de percepción restaurativa, 8 sobre importancia/desempeño de tipos
de destino y 4 demográficos; realizó preprueba con 30 personas y analizó 428 turistas
con experiencia en Jeju. Es evidencia metodológica útil para diseñar una evaluación
posterior a la visita, pero no valida directamente una versión corta en español de
Veracruz ni una clasificación de estrés. Para usar/adaptar reactivos hay que revisar
derechos editoriales, traducir y adaptar con método, hacer entrevistas cognitivas y
pilotear en la población objetivo.

Un artículo de 2025 desarrolló una versión abreviada del PDRQS para reducir la carga
en estudios turísticos. Su segunda muestra incluyó 2,036 turistas encuestados al
terminar su visita en tres sitios de Tenerife. Es candidato más cercano a evaluar la
percepción del destino que la PSS, pero no es una versión validada para turistas
mexicanos en español. Antes de adaptarla se deben revisar acceso, derechos y datos
psicométricos. El artículo informa que sus datos están disponibles a solicitud; por
lo tanto, no se trata como dataset abierto descargable en esta auditoría. El PDRQS
breve no mide estrés ni clasifica necesidades clínicas.

## Idoneidad de datasets

### Auditoría del clasificador de estrés anterior

El archivo local `data/wellness/entrenamiento_usuarios.csv` contiene 5,000 filas,
pero solo 108 combinaciones distintas de respuestas para sus cuatro preguntas; 106
combinaciones aparecen asociadas a más de una etiqueta objetivo. La metadata guardada
reporta accuracy 0.527 y macro-F1 0.524, pero esas cifras describen la predicción de
etiquetas internas sin instrumento validado ni procedencia documentada. Además, la
partición aleatoria por fila permite que patrones repetidos aparezcan tanto en
entrenamiento como en prueba. Por lo tanto, no son evidencia de medir estrés ni de
recomendar destinos eficazmente, y no deben citarse como resultados válidos.

El flujo anterior derivaba etiquetas como “Burnout” y “Hiperactividad ansiosa” de
respuestas propias, sin referencia documentada a una escala clínica. El enriquecedor
REST-MEX también infería una puntuación de bienestar mediante palabras clave de reseñas,
asignaba reseñas a lugares por coincidencia aproximada de localidad y completaba casos
sin datos con una mediana. Esas heurísticas no miden el efecto del destino sobre la
persona, su estrés o su preferencia. REST-MEX puede servir para análisis exploratorios
de texto turístico, pero no como etiqueta de bienestar ni como ground truth de
recomendación personalizada.

Por este motivo, las rutas antiguas `/wellness/assess` y `/wellness/destinations`
responden ahora HTTP 410. Los archivos y artefactos antiguos se conservan como legado
para auditoría, no como componentes evaluados o recomendables para producción. La
ruta vigente usa preferencias declaradas y un catálogo SMARTUR aprobado.

| Fuente | Qué sí puede aportar | Qué no permite afirmar aquí |
| --- | --- | --- |
| REST-MEX 2025/2022 | Texto de reseñas, polaridad y contexto turístico mexicano; pruebas NLP exploratorias. | Preferencias personales de SMARTUR, etiquetas GWI, estrés del visitante o relevancia de destino wellness. No entrenar el ranker con esas etiquetas. |
| Rural tourism restorative qualities (2025), n=489 | Encuesta de turistas de una localidad rural china; cualidades restaurativas percibidas, experiencia hedónica/eudaimónica, imagen y lealtad. Dataset complementario CC BY 4.0. Referencia de diseño y variables post-visita. | No recoge PSS/estrés ni preferencias de destino para recomendar; un destino y muestra de conveniencia, no representa México ni permite entrenar nuestro ranker. |
| Blue-space tourist vitality (2026), n=384 | Datos de turistas adultos de China sobre restauratividad costera, desapego psicológico, restauración cognitiva y vitalidad subjetiva; datos/código CC0. Puede apoyar análisis exploratorio de resultados restaurativos. | Estudio transversal de destinos costeros; no contiene una señal de estrés percibido documentada ni preferencias de elección/rec; no generaliza a Córdoba/Veracruz. |
| Project DeStress (2019), Reino Unido | Datos de cuestionario de visitantes a tres espacios urbanos tranquilos: motivos, beneficios/afectos, restauración percibida y características acústicas; datos de encuesta CC BY-NC. | No es turismo ni destino wellness, no evalúa recomendación, y la licencia NC restringe su reutilización comercial. Solo referencia metodológica/ambiental. |
| Dr.Forest forest-bathing, Europa | Cuestionarios de estrés, salud/bienestar mental, potencial restaurativo percibido y atributos de tres bosques de Alemania, Austria y Bélgica. | Acceso limitado a miembros y sin licencia/uso claro en el catálogo consultado; no usar hasta confirmar acceso y derechos. No son turistas eligiendo destinos. |
| Leisure travel flows in EU (2022) | Potencial de ocho estilos vacacionales, incluido wellness, y flujos agregados entre regiones europeas; útil para contexto geográfico macro. | Agregado EU NUTS2, varias fuentes/años; no contiene personas, preferencias wellness, estrés ni resultados individuales. No es señal de entrenamiento del recomendador. |
| Tourism Well-Being SDG (2026), n=405 | Indicadores agregados sobre intensidad turística, ODS y bienestar subjetivo; licencia CC0. Contexto/política turística. | Unidad macro y no persona-lugar; no recoge estrés individual, visita o preferencia. No usar para clasificar perfiles ni ranking. |
| DataTur / encuestas de SECTUR | Contexto agregado de turismo y visitantes para describir el dominio. | Interacciones usuario-lugar, preferencia wellness individual o variable objetivo para CF. |
| Foursquare check-ins públicos | Baseline metodológico de recomendación colaborativa en escenarios con historial de visitas. | Generalización directa a Córdoba/Veracruz, bienestar o personas SMARTUR; distribución y época difieren. |
| Catálogo de SMARTUR revisado | Universo real de candidatos; categorías, dimensiones sustentadas y disponibilidad. | Satisfacción/preferencia si todavía no se recoge feedback real. |
| Casos sintéticos controlados | Pruebas unitarias, filtros, errores y comprobación de reglas deterministas. | Métricas de eficacia, aprendizaje de preferencias reales o evidencia clínica. |

Sí hay conjuntos cercanos sobre restauratividad turística y sobre estrés/restauración
en entornos naturales, pero no un dataset abierto que vincule de forma válida el
estrés del turista, elección/preferencia por tipo de destino y resultado post-visita
en Córdoba/Veracruz. Los conjuntos hallados tienen poblaciones, contextos, instrumentos
y licencias distintas; se prohíbe tratarlos como observaciones SMARTUR o mezclarlos
para inventar labels. Pueden fundamentar variables y un protocolo prospectivo. En el
arranque, el ranker de contenido es más apropiado que CF/KNN: el catálogo es pequeño y
no existen usuarios ni interacciones fiables.

## Protocolo de evaluación sin usuarios reales

La evaluación inicial debe ser una evaluación de ranking del catálogo, no una prueba
de impacto psicológico:

1. Construir casos de preferencias previamente descritos (dimensiones, actividad,
   región) y un catálogo congelado con evidencia y versión.
2. Cuando haya evaluadores capacitados disponibles, obtener juicios de relevancia
   independientes para cada par caso-lugar; registrar desacuerdos y adjudicación.
   Hasta entonces, reportar solo pruebas funcionales y análisis de cobertura, sin
   declarar relevancia validada.
3. Comparar el ranker con baselines transparentes: orden alfabético, popularidad si
   existe una señal real, y coincidencia de dimensiones sin desempate de actividad.
4. Reportar Precision@K, Recall@K o nDCG@K solo cuando exista ground truth de
   relevancia; reportar cobertura de catálogo, tasa de listas vacías y diversidad
   como propiedades operativas, no como satisfacción.
5. No presentar matriz de confusión para un ranking sin clases verdaderas. Tampoco
   reportar accuracy, AUC o “eficacia” clínica sin etiquetas y diseño adecuados.
6. Al obtener interacciones reales con consentimiento, comparar retrospectivamente
   y luego temporalmente contenido, popularidad y CF/KNN. Separar vistas, clics,
   guardados, visitas y valoraciones; no asumir que una vista equivale a gusto.
7. Mantener aparte la evaluación post-visita: pertinencia/restauratividad percibida
   del lugar (PDRQS breve si se autoriza y adapta) y, en un protocolo separado, estrés
   percibido antes/después (PSS apropiada, con permisos). La PSS no tiene cortes
   diagnósticos; analizar puntaje continuo y no inventar clases de estrés crónico.

### Dataset prospectivo mínimo para SMARTUR

Ninguna fuente abierta revisada sustituye la señal local que falta. La app ya guarda
preferencias consentidas y los IDs recomendados; abrir la ficha del lugar registra
eventos de detalle/visita mediante el tracking existente, y al final se puede dar una
valoración global de ajuste de la lista. La valoración global no identifica qué lugar
fue pertinente y una apertura o visita tampoco equivale a satisfacción. Los IDs por sí
solos no congelan qué atributos tenía el catálogo cuando se generó la recomendación.
Por ello estas señales sirven como telemetría inicial, pero aún no son un dataset
etiquetado suficiente para entrenar o comparar modelos por artículo.

Antes de reportar métricas de ranking, una siguiente versión del esquema debería
registrar por sesión el conjunto de candidatos elegibles, la versión/hashes del
catálogo y del ranker, la posición de cada recomendación y sus dimensiones/atributos
usados en el cálculo. La señal de evaluación debe ser por lugar: visto en pantalla,
detalle abierto, guardado, agregado a itinerario, visita declarada/verificada y una
valoración individual posterior. Estos eventos no son equivalentes: impresión y clic
solo miden exposición/interés; visita y evaluación posterior se acercan a preferencia
percibida, pero tampoco prueban un efecto de salud.

El conjunto de investigación sobre estrés debe estar separado y optativo, con una
clave seudónima de participante, instrumento y versión exacta autorizados, puntaje
continuo, momento de medición y contexto mínimo predefinido. Para estudiar cambios se
requieren medición pre y post, registro de viaje/experiencia, pérdidas de seguimiento y
factores de confusión; no se deben unir datos de salud identificables al perfil normal
de recomendación. Una prueba de pertinencia de recomendaciones puede comenzar antes,
sin recoger ningún dato de salud.

## Qué evidencia haría defendible la siguiente versión

La validez tiene que formularse por afirmación. En la primera etapa, SMARTUR puede
defender que captura preferencias explícitas y que ordena correctamente el catálogo
según reglas transparentes, si documenta la pauta de etiquetado, la revisión humana,
la cobertura y pruebas reproducibles. Eso no permite afirmar que detecta estrés,
mejora salud o que sus recomendaciones son eficaces para el bienestar.

Para defender la relevancia de las recomendaciones se necesita un catálogo real con
criterios publicados, evidencia verificable por lugar, fecha y responsable de revisión;
casos de consulta definidos antes de evaluar; varios jueces independientes con
experiencia pertinente; y relevancia juzgada por pares consulta-lugar, incluyendo
desacuerdos. Se compara el ranker contra baselines y se informa nDCG@K/Precision@K,
cobertura, listas vacías y diversidad con intervalos de incertidumbre. Se congela la
versión del catálogo y del algoritmo antes de la evaluación, y se evita usar los mismos
juicios para diseñar y reportar el resultado final.

Para afirmar que una intervención turística reduce estrés se requiere otra investigación:
instrumento con permisos y población adecuados, revisión de profesionales, protocolo
ético, consentimiento, medición pre y post con tiempos definidos, análisis de factores
de confusión y una comparación apropiada. La PSS mide estrés percibido y no diagnostica
estrés crónico ni establece por sí sola que un destino lo trate. No hay base para
convertirla en tres “tipos” de estrés ni asignar tratamientos turísticos por puntaje.
El DASS-21 tampoco debe añadirse a una app pública de autoevaluación: su propio FAQ
advierte que no se use en sitios web abiertos al público y que su interpretación
requiere formación psicológica. Su evidencia en estudiantes mexicanos no equivale a
validación para turistas ni para selección de destinos.

Antes de incorporar ML colaborativo hacen falta usuarios y eventos reales suficientes,
con consentimiento y separación temporal de entrenamiento/prueba. Hasta ese momento,
un ranker de contenido explicado y probado funcionalmente es más honesto y apropiado
que entrenar sobre interacciones inventadas. Los datos sintéticos solo sirven para
pruebas de código, nunca para respaldar métricas de eficacia.

## Fuentes

- GWI, dimensiones conceptuales: <https://globalwellnessinstitute.org/what-is-wellness/>.
- GWI, definición de turismo wellness: <https://globalwellnessinstitute.org/what-is-wellness/what-is-wellness-tourism/>.
- González-Ramírez, Rodríguez-Ayán y Landero-Hernández (2013), PSS en muestra mexicana: <https://doi.org/10.1017/sjp.2013.35>.
- Cohen Lab, instrucciones oficiales para solicitar permiso de uso de PSS y notas sobre traducciones: <https://www.cmu.edu/dietrich/psychology/stress-immunity-disease-lab/scales/index.html>.
- Patterson, Sagui-Henson y Prather (2020), revisión de medidas de estrés psicosocial; PSS sin cortes diagnósticos: <https://doi.org/10.1002/acr.24228>.
- PSS en mujeres mexicanas (2022): <https://doi.org/10.21149/12499>.
- CMU, escalas y permisos de traducciones PSS: <https://www.cmu.edu/dietrich/psychology/stress-immunity-disease-lab/scales/index.html>.
- OMS, WHO-5 (cinco reactivos, dos semanas, licencia CC-BY-NC-SA 3.0): <https://www.who.int/publications/m/item/WHO-UCN-MSD-MHE-2024.01>.
- Lehto (2013), escala de cualidades restaurativas percibidas de destinos vacacionales: <https://doi.org/10.1177/0047287512461567>.
- Jeong (2024), percepción restaurativa y destinos de turismo wellness (estudio en Jeju): <https://doi.org/10.1002/jtr.2765>.
- Versión abreviada de PDRQS (2025), relación con satisfacción turística: <https://doi.org/10.1080/02508281.2025.2493163>.
- CMU, periodo de recuerdo y ausencia de cortes diagnósticos de la PSS: <https://www.cmu.edu/dietrich/psychology/stress-immunity-disease-lab/scales/html/pss.html>.
- UNSW, DASS FAQ (uso e interpretación): <https://dass.psy.unsw.edu.au/DASSFAQ.htm>.
- REST-MEX 2025, documentación del dataset: <https://portal.odesia.uned.es/dataset/rest-mex-2025>.
- DataTur / SECTUR: <https://datatur.sectur.gob.mx/SitePages/cuentaviajeros.aspx>.
- Foursquare check-in data: <https://sites.google.com/site/yangdingqi/home/foursquare-dataset>.
- Zhu et al. (2025), datos suplementarios de cualidades restaurativas de turismo rural (489 respuestas; CC BY 4.0): <https://doi.org/10.3389/fpsyg.2025.1529686.s001>.
- Luo y Xu (2026), Blue Space Restorativeness and Tourists' Subjective Vitality (384 turistas; CC0; ficha del catálogo NLM): <https://dataverse.harvard.edu/dataset.xhtml?persistentId=doi:10.7910/DVN/N4PBDC>.
- Project DeStress (Heriot-Watt, encuesta y acústica de espacios urbanos tranquilos; CC BY-NC para encuesta): <https://doi.org/10.17861/3ca48e2d-7a6e-4553-ac3c-3b08a6612d19>.
- Dr.Forest forest-bathing questionnaire dataset (tres bosques europeos; acceso restringido): <https://data.botanik.uni-halle.de/fundiveurope/datasets/574>.
- Laroche et al. (2022), flujos de estilos vacacionales EU, incluido wellness (agregados regionales): <https://doi.org/10.34894/XLM0PC>.
- Tourism_Well-Being_SDG_Dataset (2026, 405 observaciones agregadas, CC0): <https://doi.org/10.57979/SMD0N3>.
