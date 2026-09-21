-- ============================================================================
-- 001_reconcile_vps.sql
-- ----------------------------------------------------------------------------
-- Sincroniza la BD local con el VPS. Idempotente y 100% aditivo: no borra
-- objetos, no toca catálogos existentes (tourism_type, tourism_sector,
-- location, role, evaluation_*, etc.), por lo que el API sigue funcionando sin
-- cambios.
--
-- Qué cubre:
--   * Tablas/columnas que crea config/migrations.js (v01..v43) al arrancar la
--     API: service_activity, company_faq, admin_change_log, app_config,
--     validación de POI, fechas de itinerary, is_bot, certificado de company,
--     traveler_profile extra, lat/lon de servicios, wellness.
--   * Extras que el VPS tiene y que ese runner NO crea: CHECKS de
--     wellness_status (chk_poi_wellness_status / chk_ts_wellness_status),
--     índices idx_poi_wellness_status / idx_ts_wellness_status /
--     idx_ml_session_user / idx_refresh_tokens_user, la vista
--     wellness_pending_count y la función+trigger reinsert_demo_token.
--
-- También está replicado como migraciones v44/v45 (extras) en
-- config/migrations.js, así que basta con arrancar la API para aplicarlo en
-- cualquier entorno. Este archivo permite aplicarlo manualmente sin bootear.
--
-- Uso (local):
--   Get-Content "API\migrations\001_reconcile_vps.sql" |
--     docker exec -i smartur-postgres psql -U postgres -d smartur
-- Uso (VPS):
--   ssh root@2.24.112.25 "docker exec -i smartur-postgres psql -U postgres -d smartur" < API/migrations/001_reconcile_vps.sql
-- ============================================================================

BEGIN;

-- Tabla de seguimiento (la crea el runner de la API en boot; aquí por si se
-- ejecuta este archivo en una BD que nunca arrancó el API).
CREATE TABLE IF NOT EXISTS _schema_migrations (
    name VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 0. Precondiciones (equivalentes a v43) — columnas wellness
-- ----------------------------------------------------------------------------
ALTER TABLE tourist_service
    ADD COLUMN IF NOT EXISTS is_wellness             BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS wellness_status          VARCHAR(20) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS categoria_wellness       VARCHAR(50),
    ADD COLUMN IF NOT EXISTS nivel_aislamiento        NUMERIC(4, 3),
    ADD COLUMN IF NOT EXISTS restauracion_pasiva      NUMERIC(4, 3),
    ADD COLUMN IF NOT EXISTS demanda_fisica           NUMERIC(4, 3),
    ADD COLUMN IF NOT EXISTS wellness_sentiment_score NUMERIC(5, 4),
    ADD COLUMN IF NOT EXISTS descripcion_bienestar    TEXT,
    ADD COLUMN IF NOT EXISTS wellness_admin_notes     TEXT,
    ADD COLUMN IF NOT EXISTS wellness_reviewed_at     TIMESTAMP,
    ADD COLUMN IF NOT EXISTS wellness_reviewed_by     INT REFERENCES "user"(user_id) ON DELETE SET NULL;

ALTER TABLE point_of_interest
    ADD COLUMN IF NOT EXISTS is_wellness             BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS wellness_status          VARCHAR(20) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS categoria_wellness       VARCHAR(50),
    ADD COLUMN IF NOT EXISTS nivel_aislamiento        NUMERIC(4, 3),
    ADD COLUMN IF NOT EXISTS restauracion_pasiva      NUMERIC(4, 3),
    ADD COLUMN IF NOT EXISTS demanda_fisica           NUMERIC(4, 3),
    ADD COLUMN IF NOT EXISTS wellness_sentiment_score NUMERIC(5, 4),
    ADD COLUMN IF NOT EXISTS descripcion_bienestar    TEXT,
    ADD COLUMN IF NOT EXISTS wellness_admin_notes     TEXT,
    ADD COLUMN IF NOT EXISTS wellness_reviewed_at     TIMESTAMP,
    ADD COLUMN IF NOT EXISTS wellness_reviewed_by     INT REFERENCES "user"(user_id) ON DELETE SET NULL;

ALTER TABLE traveler_profile
    ADD COLUMN IF NOT EXISTS wellness_consent    BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS wellness_consent_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS wellness_active     BOOLEAN DEFAULT FALSE;

-- ----------------------------------------------------------------------------
-- 1. Constraints de wellness_status (mismo nombre y reglas que en el VPS)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_poi_wellness_status') THEN
    ALTER TABLE point_of_interest ADD CONSTRAINT chk_poi_wellness_status
      CHECK (wellness_status IN ('pending','approved','rejected') OR wellness_status IS NULL);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_ts_wellness_status') THEN
    ALTER TABLE tourist_service ADD CONSTRAINT chk_ts_wellness_status
      CHECK (wellness_status IN ('pending','approved','rejected') OR wellness_status IS NULL);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'company_owner_user_id_fkey') THEN
    ALTER TABLE company ADD CONSTRAINT company_owner_user_id_fkey
      FOREIGN KEY (owner_user_id) REFERENCES "user"(user_id) ON DELETE SET NULL;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 2. Índices de soporte (sidebar wellness / validación / sesiones ML)
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_poi_wellness_status
  ON point_of_interest(wellness_status) WHERE wellness_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ts_wellness_status
  ON tourist_service(wellness_status) WHERE wellness_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ml_session_user ON ml_recommendation_session(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);

-- ----------------------------------------------------------------------------
-- 3. Vista: pendientes de revisión wellness (AdminBadgesContext)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW wellness_pending_count AS
SELECT (
  (SELECT COUNT(*) FROM tourist_service  WHERE wellness_status = 'pending') +
  (SELECT COUNT(*) FROM point_of_interest WHERE wellness_status = 'pending')
) AS total_pending;

-- ----------------------------------------------------------------------------
-- 4. Función + trigger: mantiene vivo el token del demo móvil
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION reinsert_demo_token() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_demo_user_id int;
BEGIN
  SELECT user_id INTO v_demo_user_id
  FROM "user" WHERE email = 'cafecencalli@cencalli.mx';

  IF NEW.user_id = v_demo_user_id AND NEW.used = TRUE THEN
    DELETE FROM login_tokens WHERE user_id = v_demo_user_id;
    INSERT INTO login_tokens (user_id, token, expires_at, used)
    VALUES (
      v_demo_user_id,
      '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
      NOW() + INTERVAL '30 days',
      false
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_demo_token_refresh ON login_tokens;
CREATE TRIGGER trg_demo_token_refresh
  AFTER UPDATE OF used ON login_tokens
  FOR EACH ROW EXECUTE FUNCTION reinsert_demo_token();

-- ----------------------------------------------------------------------------
-- 5. Registro de haber sido aplicado
-- ----------------------------------------------------------------------------
INSERT INTO _schema_migrations (name) VALUES ('001_reconcile_vps')
  ON CONFLICT (name) DO NOTHING;

COMMIT;