-- Solo lectura. Genera INSERT idempotentes de los lugares de bienestar que NO vienen del DENUE
-- (inventario nacional SECTUR/GWI revisado y experiencias verificadas en campo), con su
-- ubicación. La salida se pega en API/bd.sql para que bd.sql vuelva a ser la fuente de verdad.
-- Clave natural: nombre del lugar + nombre/estado/municipio de su ubicación.
SELECT sql FROM (
  SELECT 1 AS orden, l.name AS clave, format(
    'INSERT INTO location (name, state, municipality, latitude, longitude, is_active) '
    'SELECT %L, %L, %L, %L, %L, TRUE WHERE NOT EXISTS (SELECT 1 FROM location '
    'WHERE name = %L AND state IS NOT DISTINCT FROM %L AND municipality IS NOT DISTINCT FROM %L);',
    l.name, l.state, l.municipality, l.latitude, l.longitude,
    l.name, l.state, l.municipality) AS sql
  FROM location l
  WHERE l.id_location IN (
    SELECT p.id_location FROM point_of_interest p
     WHERE p.denue_clee IS NULL AND p.is_wellness AND p.wellness_status = 'approved' AND p.is_active)
  UNION ALL
  SELECT 2, p.name, format(
    'INSERT INTO point_of_interest (name, description, image_url, rating, latitude, longitude, '
    'categories_raw, categories_mapped, price_level, is_accessible, outdoor, is_active, validation_status, '
    'is_wellness, wellness_status, categoria_wellness, nivel_aislamiento, restauracion_pasiva, demanda_fisica, '
    'descripcion_bienestar, wellness_dimensions, wellness_evidence, wellness_motives, wellness_modalities, '
    'wellness_mw_evidence, wellness_mw_reviewed_at, wellness_reviewed_at, es_mipyme, id_location) '
    'SELECT %L, %L, %L, %L, %L, %L, %L, %L::jsonb, %L, %L, %L, TRUE, %L, TRUE, ''approved'', %L, %L, %L, %L, '
    '%L, %L::text[], %L, %L::text[], %L::text[], %L::jsonb, %L::timestamp, %L::timestamp, %L, '
    '(SELECT id_location FROM location WHERE name = %L AND state IS NOT DISTINCT FROM %L '
    'AND municipality IS NOT DISTINCT FROM %L ORDER BY id_location LIMIT 1) '
    'WHERE NOT EXISTS (SELECT 1 FROM point_of_interest x JOIN location y ON y.id_location = x.id_location '
    'WHERE x.name = %L AND y.name = %L AND y.state IS NOT DISTINCT FROM %L);',
    p.name, p.description, p.image_url, p.rating, p.latitude, p.longitude,
    p.categories_raw, p.categories_mapped, p.price_level, p.is_accessible, p.outdoor, p.validation_status,
    p.categoria_wellness, p.nivel_aislamiento, p.restauracion_pasiva, p.demanda_fisica,
    p.descripcion_bienestar, p.wellness_dimensions, p.wellness_evidence, p.wellness_motives, p.wellness_modalities,
    p.wellness_mw_evidence, p.wellness_mw_reviewed_at, p.wellness_reviewed_at, p.es_mipyme,
    l.name, l.state, l.municipality,
    p.name, l.name, l.state)
  FROM point_of_interest p
  JOIN location l ON l.id_location = p.id_location
  WHERE p.denue_clee IS NULL AND p.is_wellness AND p.wellness_status = 'approved' AND p.is_active
) t
ORDER BY orden, clave;
