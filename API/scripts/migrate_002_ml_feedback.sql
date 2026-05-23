-- Migration 002: ml_recommendation_feedback
-- Apply this against the live DB if the table does not yet exist.
-- Run: psql -U postgres -d smartur -f migrate_002_ml_feedback.sql
-- Or from Docker: docker exec -i <postgres-container> psql -U postgres -d smartur < migrate_002_ml_feedback.sql

-- Feedback table: records whether a recommended item was clicked (CTR)
CREATE TABLE IF NOT EXISTS ml_recommendation_feedback (
  id            SERIAL PRIMARY KEY,
  session_id    INT NOT NULL REFERENCES ml_recommendation_session(id) ON DELETE CASCADE,
  item_id       VARCHAR(64) NOT NULL,
  rank_pos      INT NOT NULL,
  clicked       BOOLEAN NOT NULL DEFAULT FALSE,
  clicked_at    TIMESTAMPTZ NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ml_rec_feedback_session
  ON ml_recommendation_feedback (session_id);

-- User-interaction table (used by fetch_real_interactions in MODELO)
CREATE TABLE IF NOT EXISTS user_interaction (
  id         SERIAL PRIMARY KEY,
  user_id    INT NOT NULL,
  place_kind VARCHAR(16) NOT NULL DEFAULT 'poi',
  place_id   INT NOT NULL,
  event_type VARCHAR(32) NOT NULL,
  dwell_ms   INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_interaction_user
  ON user_interaction (user_id, created_at DESC);

-- User-rating table (used by fetch_real_interactions in MODELO)
CREATE TABLE IF NOT EXISTS user_rating (
  id         SERIAL PRIMARY KEY,
  user_id    INT NOT NULL,
  place_kind VARCHAR(16) NOT NULL DEFAULT 'poi',
  place_id   INT NOT NULL,
  rating     SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, place_kind, place_id)
);

CREATE INDEX IF NOT EXISTS idx_user_rating_place
  ON user_rating (place_kind, place_id);
