-- ============================================================
-- Migración 004-fix: Correcciones WellTur
-- Ejecutar DESPUÉS de 004_wellness.sql
-- ============================================================
-- Corrige:
--   1. wellness_destination con FK correcta (point_of_interest.id no poi_id)
--   2. wellness_recommendation_session separada del flujo ML existente
--   3. wellness_satisfaction en lugar de ml_session_satisfaction
-- ============================================================

-- ── 1. wellness_destination (con FK correcta) ────────────────────────────────

CREATE TABLE IF NOT EXISTS wellness_destination (
    dest_id          SERIAL PRIMARY KEY,
    nombre_lugar     VARCHAR(200) NOT NULL,
    estado           VARCHAR(100),
    municipio        VARCHAR(100),
    lat              NUMERIC(9, 6),
    lon              NUMERIC(9, 6),
    nivel_aislamiento    NUMERIC(4, 3) CHECK (nivel_aislamiento BETWEEN 0 AND 1),
    restauracion_pasiva  NUMERIC(4, 3) CHECK (restauracion_pasiva BETWEEN 0 AND 1),
    demanda_fisica       NUMERIC(4, 3) CHECK (demanda_fisica BETWEEN 0 AND 1),
    categoria_wellness   VARCHAR(50),
    wellness_sentiment_score NUMERIC(5, 4) DEFAULT 0.5000 CHECK (wellness_sentiment_score BETWEEN 0 AND 1),
    descripcion          TEXT,
    fuente               VARCHAR(100) DEFAULT 'manual',
    activo               BOOLEAN DEFAULT TRUE,
    created_at           TIMESTAMP DEFAULT NOW(),
    -- FK correctas: point_of_interest usa "id", tourist_service usa "tourist_service_id"
    poi_fk_id            INT REFERENCES point_of_interest(id) ON DELETE SET NULL,
    tourist_service_id   INT REFERENCES tourist_service(tourist_service_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_wellness_dest_categoria    ON wellness_destination (categoria_wellness);
CREATE INDEX IF NOT EXISTS idx_wellness_dest_estado       ON wellness_destination (estado);
CREATE INDEX IF NOT EXISTS idx_wellness_dest_aislamiento  ON wellness_destination (nivel_aislamiento);
CREATE INDEX IF NOT EXISTS idx_wellness_dest_restauracion ON wellness_destination (restauracion_pasiva);


-- ── 2. Sesiones de recomendación wellness (separadas de ml_recommendation_session) ──

CREATE TABLE IF NOT EXISTS wellness_recommendation_session (
    session_id       SERIAL PRIMARY KEY,
    user_id          INT NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
    assessment_id    INT REFERENCES stress_assessment(assessment_id) ON DELETE SET NULL,
    modo_viaje       VARCHAR(30) NOT NULL,
    recommended_ids  JSONB NOT NULL DEFAULT '[]',
    top_n            SMALLINT DEFAULT 3,
    algorithm_version VARCHAR(20) DEFAULT '1.0',
    created_at       TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wellness_session_user       ON wellness_recommendation_session (user_id);
CREATE INDEX IF NOT EXISTS idx_wellness_session_assessment ON wellness_recommendation_session (assessment_id);
CREATE INDEX IF NOT EXISTS idx_wellness_session_modo       ON wellness_recommendation_session (modo_viaje);


-- ── 3. Satisfacción post-recomendación wellness ──────────────────────────────

CREATE TABLE IF NOT EXISTS wellness_satisfaction (
    sat_id       SERIAL PRIMARY KEY,
    session_id   INT NOT NULL REFERENCES wellness_recommendation_session(session_id) ON DELETE CASCADE,
    user_id      INT NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
    fit_rating   SMALLINT NOT NULL CHECK (fit_rating BETWEEN 1 AND 5),
    feedback_text TEXT,
    created_at   TIMESTAMP DEFAULT NOW(),
    CONSTRAINT uq_wellness_sat_session UNIQUE (session_id)
);

CREATE INDEX IF NOT EXISTS idx_wellness_sat_user    ON wellness_satisfaction (user_id);
CREATE INDEX IF NOT EXISTS idx_wellness_sat_session ON wellness_satisfaction (session_id);


-- ── 4. Vista unificada de pendientes (actualizada) ──────────────────────────

CREATE OR REPLACE VIEW wellness_pending_count AS
SELECT
    (SELECT COUNT(*) FROM tourist_service    WHERE wellness_status = 'pending') +
    (SELECT COUNT(*) FROM point_of_interest  WHERE wellness_status = 'pending')
    AS total_pending;
