-- ============================================================
-- Migración 004: WellTur — Turismo de Bienestar
-- ============================================================
-- Ejecutar con: psql -U postgres -d smartur -f 004_wellness.sql
-- Idempotente: usa IF NOT EXISTS / ADD COLUMN IF NOT EXISTS
-- ============================================================

-- ── 1. Tabla de destinos wellness (catálogo ML) ──────────────────────────────

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
    categoria_wellness   VARCHAR(50),  -- Termal, Spa, Bosque, Montaña, Lago, Retiro_Silencio, Ecoturismo_Activo, Parque
    wellness_sentiment_score NUMERIC(5, 4) DEFAULT 0.5000 CHECK (wellness_sentiment_score BETWEEN 0 AND 1),
    descripcion          TEXT,
    fuente               VARCHAR(100) DEFAULT 'manual',
    activo               BOOLEAN DEFAULT TRUE,
    created_at           TIMESTAMP DEFAULT NOW(),
    -- Referencia opcional a poi o tourist_service si es un lugar local SMARTUR
    poi_id           INT REFERENCES point_of_interest(poi_id) ON DELETE SET NULL,
    tourist_service_id INT REFERENCES tourist_service(tourist_service_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_wellness_dest_categoria ON wellness_destination (categoria_wellness);
CREATE INDEX IF NOT EXISTS idx_wellness_dest_estado ON wellness_destination (estado);
CREATE INDEX IF NOT EXISTS idx_wellness_dest_aislamiento ON wellness_destination (nivel_aislamiento);
CREATE INDEX IF NOT EXISTS idx_wellness_dest_restauracion ON wellness_destination (restauracion_pasiva);

COMMENT ON TABLE wellness_destination IS
    'Catálogo de destinos aptos para recomendación wellness. '
    'Solo entran POIs y servicios con wellness_status=approved.';


-- ── 2. Tabla de evaluaciones de bienestar (assessments Q1-Q4) ───────────────

CREATE TABLE IF NOT EXISTS stress_assessment (
    assessment_id    SERIAL PRIMARY KEY,
    user_id          INT NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
    -- Q1-Q4 (escala 1-4)
    q1_energia       SMALLINT NOT NULL CHECK (q1_energia BETWEEN 1 AND 4),
    q2_tension       SMALLINT NOT NULL CHECK (q2_tension BETWEEN 1 AND 4),
    q3_rumiacion     SMALLINT NOT NULL CHECK (q3_rumiacion BETWEEN 1 AND 4),
    q4_activacion    SMALLINT NOT NULL CHECK (q4_activacion BETWEEN 1 AND 4),
    -- Resultado del modelo
    modo_viaje       VARCHAR(30) NOT NULL,  -- 'modo_calma', 'modo_restauracion', 'modo_equilibrio'
    perfil_interno   VARCHAR(30),           -- nombre técnico interno (NO mostrar en UI)
    confianza_ml     NUMERIC(4, 3),         -- 0-1
    metodo_decision  VARCHAR(20),           -- 'ml', 'rule_hybrid', 'rule_override'
    -- Consentimiento LFPDPPP
    consent_given    BOOLEAN NOT NULL DEFAULT FALSE,
    consent_at       TIMESTAMP,
    -- Metadata
    created_at       TIMESTAMP DEFAULT NOW(),
    app_version      VARCHAR(20),
    CONSTRAINT chk_consent CHECK (consent_given = TRUE)
);

CREATE INDEX IF NOT EXISTS idx_stress_assessment_user ON stress_assessment (user_id);
CREATE INDEX IF NOT EXISTS idx_stress_assessment_modo ON stress_assessment (modo_viaje);
CREATE INDEX IF NOT EXISTS idx_stress_assessment_created ON stress_assessment (created_at DESC);

COMMENT ON TABLE stress_assessment IS
    'Evaluaciones de energía/vitalidad de viajeros (Q1-Q4). '
    'Nomenclatura pública: modo_calma/restauracion/equilibrio. '
    'perfil_interno es solo técnico, nunca visible en UI.';


-- ── 3. Sesiones de recomendación wellness ───────────────────────────────────

CREATE TABLE IF NOT EXISTS ml_recommendation_session (
    session_id       SERIAL PRIMARY KEY,
    user_id          INT NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
    assessment_id    INT REFERENCES stress_assessment(assessment_id) ON DELETE SET NULL,
    modo_viaje       VARCHAR(30) NOT NULL,
    recommended_ids  JSONB NOT NULL DEFAULT '[]',  -- array de dest_id recomendados
    top_n            SMALLINT DEFAULT 3,
    algorithm_version VARCHAR(20) DEFAULT '1.0',
    created_at       TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ml_session_user ON ml_recommendation_session (user_id);
CREATE INDEX IF NOT EXISTS idx_ml_session_assessment ON ml_recommendation_session (assessment_id);


-- ── 4. Satisfacción post-resultado (feedback loop) ──────────────────────────

CREATE TABLE IF NOT EXISTS ml_session_satisfaction (
    sat_id           SERIAL PRIMARY KEY,
    session_id       INT NOT NULL REFERENCES ml_recommendation_session(session_id) ON DELETE CASCADE,
    user_id          INT NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
    fit_rating       SMALLINT NOT NULL CHECK (fit_rating BETWEEN 1 AND 5),  -- 1=😞 5=😄
    feedback_text    TEXT,
    created_at       TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sat_session ON ml_session_satisfaction (session_id);


-- ── 5. Columnas wellness en tourist_service ─────────────────────────────────

ALTER TABLE tourist_service
    ADD COLUMN IF NOT EXISTS is_wellness          BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS wellness_status       VARCHAR(20) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS categoria_wellness    VARCHAR(50),
    ADD COLUMN IF NOT EXISTS nivel_aislamiento     NUMERIC(4, 3),
    ADD COLUMN IF NOT EXISTS restauracion_pasiva   NUMERIC(4, 3),
    ADD COLUMN IF NOT EXISTS demanda_fisica        NUMERIC(4, 3),
    ADD COLUMN IF NOT EXISTS wellness_sentiment_score NUMERIC(5, 4),
    ADD COLUMN IF NOT EXISTS descripcion_bienestar TEXT,
    ADD COLUMN IF NOT EXISTS wellness_admin_notes  TEXT,
    ADD COLUMN IF NOT EXISTS wellness_reviewed_at  TIMESTAMP,
    ADD COLUMN IF NOT EXISTS wellness_reviewed_by  INT REFERENCES "user"(user_id) ON DELETE SET NULL;

-- Constraints idempotentes para wellness_status
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'chk_ts_wellness_status'
    ) THEN
        ALTER TABLE tourist_service
            ADD CONSTRAINT chk_ts_wellness_status
            CHECK (wellness_status IN ('pending', 'approved', 'rejected') OR wellness_status IS NULL);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ts_wellness_status ON tourist_service (wellness_status)
    WHERE wellness_status IS NOT NULL;


-- ── 6. Columnas wellness en point_of_interest ────────────────────────────────

ALTER TABLE point_of_interest
    ADD COLUMN IF NOT EXISTS is_wellness          BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS wellness_status       VARCHAR(20) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS categoria_wellness    VARCHAR(50),
    ADD COLUMN IF NOT EXISTS nivel_aislamiento     NUMERIC(4, 3),
    ADD COLUMN IF NOT EXISTS restauracion_pasiva   NUMERIC(4, 3),
    ADD COLUMN IF NOT EXISTS demanda_fisica        NUMERIC(4, 3),
    ADD COLUMN IF NOT EXISTS wellness_sentiment_score NUMERIC(5, 4),
    ADD COLUMN IF NOT EXISTS descripcion_bienestar TEXT,
    ADD COLUMN IF NOT EXISTS wellness_admin_notes  TEXT,
    ADD COLUMN IF NOT EXISTS wellness_reviewed_at  TIMESTAMP,
    ADD COLUMN IF NOT EXISTS wellness_reviewed_by  INT REFERENCES "user"(user_id) ON DELETE SET NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'chk_poi_wellness_status'
    ) THEN
        ALTER TABLE point_of_interest
            ADD CONSTRAINT chk_poi_wellness_status
            CHECK (wellness_status IN ('pending', 'approved', 'rejected') OR wellness_status IS NULL);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_poi_wellness_status ON point_of_interest (wellness_status)
    WHERE wellness_status IS NOT NULL;


-- ── 7. Consent_wellness en traveler_profile ──────────────────────────────────

ALTER TABLE traveler_profile
    ADD COLUMN IF NOT EXISTS wellness_consent     BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS wellness_consent_at  TIMESTAMP,
    ADD COLUMN IF NOT EXISTS wellness_active      BOOLEAN DEFAULT FALSE;


-- ── 8. Vista de pendientes para badge del admin ──────────────────────────────

CREATE OR REPLACE VIEW wellness_pending_count AS
SELECT
    (SELECT COUNT(*) FROM tourist_service WHERE wellness_status = 'pending') +
    (SELECT COUNT(*) FROM point_of_interest WHERE wellness_status = 'pending')
    AS total_pending;

COMMENT ON VIEW wellness_pending_count IS
    'Conteo de servicios/POIs pendientes de validación wellness. '
    'Usada por AdminBadgesContext para el badge del sidebar.';
