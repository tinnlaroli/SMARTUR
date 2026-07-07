BEGIN;

-- ============================================================
-- SMARTUR — Base de Datos v2 (2026)
-- Reconstrucción completa con soporte para:
--   • KYC empresa (4 fases de activación)
--   • Itinerarios / planificador de rutas
--   • Red social (seguir usuarios, likes)
--   • Reservas de servicios
--   • Chat turista ↔ empresa (polling)
-- Encoding recomendado: UTF8
--   CREATE DATABASE smartur WITH ENCODING 'UTF8' TEMPLATE template0;
-- ============================================================

-- ============================================================
-- 1. ROLES
-- ============================================================

CREATE TABLE role (
  role_id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL
);

INSERT INTO role (name) VALUES ('admin'), ('user'), ('empresa'), ('turismologo');

-- ============================================================
-- 2. USUARIOS
-- ============================================================

CREATE TABLE "user" (
  user_id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role_id INT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  photo_url VARCHAR(512) NULL,
  avatar_icon_key VARCHAR(64) NULL,
  birth_date DATE NULL,
  bio VARCHAR(300) NULL,
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  email_verified BOOLEAN DEFAULT FALSE,
  email_verification_token VARCHAR(255) NULL,
  email_verification_otp VARCHAR(255) NULL,
  email_verification_expires TIMESTAMP NULL,
  auth_provider VARCHAR(20) NOT NULL DEFAULT 'local',
  id_company INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES role(role_id)
);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_updated_at
    BEFORE UPDATE ON "user"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_user_role ON "user"(role_id);
CREATE INDEX idx_user_created_at ON "user"(created_at DESC);

-- ============================================================
-- 3. PERFIL VIAJERO (ML features)
-- ============================================================

CREATE TABLE traveler_profile (
  id_profile SERIAL PRIMARY KEY,
  user_id INT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  age INT,
  age_range VARCHAR(10),
  gender VARCHAR(20),
  interests TEXT[],
  activity_level INT DEFAULT 3,
  preferred_place VARCHAR(50),
  travel_type VARCHAR(50),
  has_accessibility BOOLEAN DEFAULT FALSE,
  accessibility_detail TEXT,
  has_visited_before BOOLEAN DEFAULT FALSE,
  restrictions TEXT,
  sustainable_preferences BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (user_id) REFERENCES "user"(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_profile_user_id ON traveler_profile(user_id);

-- ============================================================
-- 4. UBICACIONES
-- ============================================================

CREATE TABLE location (
  id_location SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  state VARCHAR(100),
  municipality VARCHAR(100),
  latitude DECIMAL(10,6),
  longitude DECIMAL(10,6)
);

-- ============================================================
-- 5. TIPOS DE TURISMO
-- ============================================================

CREATE TABLE tourism_type (
  id_type SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

-- ============================================================
-- 6. PUNTOS DE INTERÉS
-- ============================================================

CREATE TABLE point_of_interest (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  categories_raw TEXT NOT NULL DEFAULT '',
  categories_mapped JSONB NOT NULL DEFAULT '[]'::jsonb,
  price_level SMALLINT NOT NULL DEFAULT 2,
  is_accessible BOOLEAN NOT NULL DEFAULT FALSE,
  outdoor BOOLEAN NOT NULL DEFAULT FALSE,
  latitude DECIMAL(10,6),
  longitude DECIMAL(10,6),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  id_location INT REFERENCES location(id_location),
  description TEXT,
  image_url TEXT,
  rating DECIMAL(2,1) DEFAULT 4.0
);

CREATE INDEX idx_poi_created_at ON point_of_interest(created_at DESC);
CREATE INDEX idx_poi_price_level ON point_of_interest(price_level);
CREATE INDEX idx_poi_categories_mapped ON point_of_interest USING GIN (categories_mapped);

-- ============================================================
-- 7. GASTO TURÍSTICO
-- ============================================================

CREATE TABLE tourism_expenditure (
  id_expenditure SERIAL PRIMARY KEY,
  id_tourist INT,
  expenditure_type VARCHAR(50),
  amount NUMERIC(10,2),
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  destination VARCHAR(150),
  FOREIGN KEY (id_tourist) REFERENCES "user"(user_id)
);

-- ============================================================
-- 8. SECTORES TURÍSTICOS
-- ============================================================

CREATE TABLE tourism_sector (
  id_sector SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT
);

-- ============================================================
-- 9. EMPRESAS
-- status: pending_docs → documents_submitted → active / rejected / suspended
-- ============================================================

CREATE TABLE company (
  id_company SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  address VARCHAR(255),
  phone VARCHAR(50),
  id_sector INT NOT NULL,
  id_location INT,
  owner_user_id INT NULL,
  status VARCHAR(25) NOT NULL DEFAULT 'pending_docs',
  registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_certified BOOLEAN NOT NULL DEFAULT FALSE,
  certified_at TIMESTAMPTZ,
  FOREIGN KEY (id_sector) REFERENCES tourism_sector(id_sector),
  FOREIGN KEY (id_location) REFERENCES location(id_location),
  CONSTRAINT company_status_check CHECK (status IN (
    'pending_docs', 'documents_submitted', 'active', 'rejected', 'suspended'
  ))
);

-- FK circular user <-> company (se agrega al final de la sección user)
ALTER TABLE "user"
  ADD CONSTRAINT fk_user_company
    FOREIGN KEY (id_company) REFERENCES company(id_company) ON DELETE SET NULL;

-- ============================================================
-- 10. VERIFICACIÓN KYC DE EMPRESA
-- ============================================================

CREATE TABLE company_verification (
  id_verification SERIAL PRIMARY KEY,
  id_company INT NOT NULL REFERENCES company(id_company) ON DELETE CASCADE UNIQUE,
  owner_full_name VARCHAR(200),
  owner_birth_date DATE,
  owner_curp VARCHAR(18),
  owner_rfc VARCHAR(13),
  owner_street VARCHAR(200),
  owner_colonia VARCHAR(100),
  owner_municipio VARCHAR(100),
  owner_state VARCHAR(100),
  owner_zip VARCHAR(10),
  ine_front_url VARCHAR(500),
  ine_back_url VARCHAR(500),
  address_proof_url VARCHAR(500),
  submitted_at TIMESTAMP,
  reviewed_at TIMESTAMP,
  reviewer_id INT REFERENCES "user"(user_id),
  rejection_reason TEXT,
  resubmission_count INT DEFAULT 0
);

-- ============================================================
-- 11. ACTIVIDADES, EMPLEO, INSUMOS (datos estadísticos empresa)
-- ============================================================

CREATE TABLE tourist_activities (
  id_activity SERIAL PRIMARY KEY,
  id_company INT,
  is_active BOOLEAN DEFAULT TRUE,
  production_value NUMERIC(12,2),
  environmental_impact TEXT,
  social_impact TEXT,
  FOREIGN KEY (id_company) REFERENCES company(id_company)
);

CREATE TABLE tourism_employment (
  id_employment SERIAL PRIMARY KEY,
  id_company INT,
  position VARCHAR(100),
  contract_type VARCHAR(50),
  gender VARCHAR(20),
  salary NUMERIC(10,2),
  start_date DATE,
  FOREIGN KEY (id_company) REFERENCES company(id_company)
);

CREATE TABLE tourism_inputs (
  id_input SERIAL PRIMARY KEY,
  id_company INT,
  input_type VARCHAR(100),
  cost NUMERIC(10,2),
  consumption NUMERIC(10,2),
  carbon_footprint NUMERIC(10,2),
  FOREIGN KEY (id_company) REFERENCES company(id_company)
);

-- ============================================================
-- 12. PLANTILLAS DE EVALUACIÓN
-- ============================================================

CREATE TABLE evaluation_template (
  id_template SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  version VARCHAR(20),
  service_type VARCHAR(50),
  active BOOLEAN DEFAULT true,
  creation_date TIMESTAMP
);

CREATE TABLE evaluation_criterion (
  id_criterion SERIAL PRIMARY KEY,
  id_template INTEGER REFERENCES evaluation_template(id_template),
  name VARCHAR(100),
  description TEXT,
  weight DECIMAL(3,2),
  order_index INTEGER,
  active BOOLEAN DEFAULT true,
  field_type VARCHAR(50) NOT NULL DEFAULT 'scale' CHECK (field_type IN ('text', 'multiple_choice', 'scale', 'checkbox', 'select')),
  is_required BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE evaluation_subcriterion (
  id_subcriterion SERIAL PRIMARY KEY,
  id_criterion INTEGER NOT NULL REFERENCES evaluation_criterion(id_criterion) ON DELETE CASCADE,
  description VARCHAR(255) NOT NULL,
  score DECIMAL(5,2) NOT NULL DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 0,
  required_evidences TEXT[],
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 13. SERVICIOS TURÍSTICOS
-- status: pending_review | active | rejected
-- ============================================================

CREATE TABLE tourist_service (
  id_service SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  id_company INT,
  id_location INT,
  service_type VARCHAR(50),
  active BOOLEAN DEFAULT true,
  image_url VARCHAR(500),
  price_from NUMERIC(10,2),
  price_to NUMERIC(10,2),
  currency VARCHAR(3) DEFAULT 'MXN',
  operating_hours JSONB,
  capacity INT,
  duration_minutes INT,
  contact_phone VARCHAR(30),
  status VARCHAR(20) NOT NULL DEFAULT 'pending_review',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_company) REFERENCES company(id_company),
  FOREIGN KEY (id_location) REFERENCES location(id_location),
  CONSTRAINT tourist_service_status_check CHECK (status IN ('pending_review', 'active', 'rejected'))
);

CREATE INDEX idx_tourist_service_status ON tourist_service(status);
CREATE INDEX idx_tourist_service_company ON tourist_service(id_company);

-- ============================================================
-- 14. EVALUACIONES DE SERVICIOS
-- ============================================================

CREATE TABLE service_evaluation (
  id_evaluation SERIAL PRIMARY KEY,
  id_service INTEGER REFERENCES tourist_service(id_service),
  id_template INTEGER REFERENCES evaluation_template(id_template),
  evaluation_date DATE,
  evaluator_id INTEGER REFERENCES "user"(user_id),
  status VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE,
  total_score DECIMAL(4,2),
  evaluation_time INTEGER,
  general_observations TEXT,
  pdf_url VARCHAR(500),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE evaluation_detail (
  id_detail SERIAL PRIMARY KEY,
  id_evaluation INTEGER REFERENCES service_evaluation(id_evaluation),
  id_criterion INTEGER REFERENCES evaluation_criterion(id_criterion),
  assigned_score INTEGER CHECK (assigned_score BETWEEN 0 AND 10),
  id_selected_subcriterion INTEGER REFERENCES evaluation_subcriterion(id_subcriterion),
  observations TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  attached_evidences JSON,
  created_at TIMESTAMP,
  UNIQUE (id_evaluation, id_criterion)
);

CREATE TABLE service_certification (
  id_certification SERIAL PRIMARY KEY,
  id_service INTEGER REFERENCES tourist_service(id_service),
  certification_type VARCHAR(100),
  obtainment_date DATE,
  expiration_date DATE,
  issuing_organization VARCHAR(100),
  evidence_url VARCHAR(255),
  status VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- 15. AUTH: TOKENS, RESET, REGISTRO PENDIENTE
-- ============================================================

CREATE TABLE IF NOT EXISTS login_tokens (
  user_id INT REFERENCES "user"(user_id) ON DELETE CASCADE,
  token VARCHAR(100) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE
);

CREATE TABLE password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id INT,
  token VARCHAR(100) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (user_id) REFERENCES "user"(user_id)
);

CREATE TABLE pending_registration (
  id SERIAL PRIMARY KEY,
  email VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(50) NOT NULL,
  password VARCHAR(255) NOT NULL,
  company_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  id_sector INT NOT NULL,
  id_location INT,
  otp_hash VARCHAR(255) NOT NULL,
  otp_expires TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE refresh_tokens (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  -- session_id se agrega como FK más abajo, después de crear user_sessions
  session_id INT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rt_user ON refresh_tokens(user_id);

-- ============================================================
-- 16. SEGURIDAD Y AUDITORÍA
-- ============================================================

CREATE TABLE security_events (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  user_email VARCHAR(100),
  ip_address VARCHAR(50),
  severity VARCHAR(20) DEFAULT 'INFO',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_security_events_created_at ON security_events(created_at DESC);
CREATE INDEX idx_security_events_type ON security_events(event_type);

-- ============================================================
-- 17. APP MÓVIL: FAVORITOS, VISITAS, POSTS COMUNIDAD
-- ============================================================

CREATE TABLE user_favorite (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
  place_kind VARCHAR(3) NOT NULL CHECK (place_kind IN ('svc', 'poi')),
  place_id INT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, place_kind, place_id)
);
CREATE INDEX idx_user_favorite_user ON user_favorite(user_id);

CREATE TABLE user_visit (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
  place_kind VARCHAR(3) NOT NULL CHECK (place_kind IN ('svc', 'poi')),
  place_id INT NOT NULL,
  visited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_user_visit_user_time ON user_visit(user_id, visited_at DESC);

CREATE TABLE community_post (
  id_post SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
  caption TEXT NOT NULL DEFAULT '',
  image_url VARCHAR(512) NULL,
  place_kind VARCHAR(3) NOT NULL CHECK (place_kind IN ('svc', 'poi')),
  place_id INT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_community_post_created ON community_post(created_at DESC);

-- ============================================================
-- 18. CONTACTO / SUSCRIPCIONES LANDING
-- ============================================================

CREATE TABLE contact_subscription (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  source VARCHAR(64) NOT NULL DEFAULT 'landing_b2b',
  reason VARCHAR(100) NULL,
  message TEXT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_contact_subscription_email ON contact_subscription(email);

-- ============================================================
-- 19. MODELO ML: SESIONES Y MÉTRICAS
-- ============================================================

CREATE TABLE ml_recommendation_session (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  alpha DOUBLE PRECISION,
  best_algorithm VARCHAR(64),
  execution_time_ms DOUBLE PRECISION,
  context_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ml_rec_session_user_created ON ml_recommendation_session (user_id, created_at DESC);

CREATE TABLE ml_recommendation_item (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES ml_recommendation_session(id) ON DELETE CASCADE,
  rank_pos INTEGER NOT NULL,
  item_id VARCHAR(64) NOT NULL,
  title VARCHAR(255),
  score DOUBLE PRECISION,
  pred_cf DOUBLE PRECISION,
  pred_rf DOUBLE PRECISION,
  pred_gbm DOUBLE PRECISION,
  kind VARCHAR(16) DEFAULT 'poi',
  image_url TEXT
);
CREATE INDEX idx_ml_rec_item_session ON ml_recommendation_item (session_id);

CREATE TABLE ml_model_metrics (
  id SERIAL PRIMARY KEY,
  metrics_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 20. INTERACCIONES Y RATINGS DE USUARIOS (data collection ML)
-- ============================================================

CREATE TABLE user_interaction (
  id BIGSERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
  place_kind VARCHAR(16) NULL,
  place_id INT NULL,
  event_type VARCHAR(32) NOT NULL,
  dwell_ms INT NULL,
  meta JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_user_interaction_user_place ON user_interaction (user_id, place_kind, place_id);
CREATE INDEX idx_user_interaction_created ON user_interaction (created_at DESC);

CREATE TABLE user_rating (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
  place_kind VARCHAR(3) NOT NULL CHECK (place_kind IN ('svc', 'poi')),
  place_id INT NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, place_kind, place_id)
);
CREATE INDEX idx_user_rating_place ON user_rating (place_kind, place_id);

CREATE TABLE ml_recommendation_feedback (
  id SERIAL PRIMARY KEY,
  session_id INT NOT NULL REFERENCES ml_recommendation_session(id) ON DELETE CASCADE,
  item_id VARCHAR(64) NOT NULL,
  rank_pos INT NOT NULL,
  clicked BOOLEAN NOT NULL DEFAULT FALSE,
  clicked_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ml_rec_feedback_session ON ml_recommendation_feedback (session_id);
ALTER TABLE ml_recommendation_feedback
  ADD CONSTRAINT uq_feedback_session_item UNIQUE (session_id, item_id);

-- ============================================================
-- 21. REPORTES DE POSTS
-- ============================================================

CREATE TABLE post_reports (
  id SERIAL PRIMARY KEY,
  post_id INT NOT NULL REFERENCES community_post(id_post) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
  reason VARCHAR(50) NOT NULL CHECK (reason IN ('spam', 'inappropriate', 'false_info', 'hateful')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (post_id, user_id)
);
CREATE INDEX idx_post_reports_post ON post_reports (post_id);
CREATE INDEX idx_post_reports_resolved ON post_reports (resolved, created_at DESC);

-- ============================================================
-- 22. SESIONES DE DISPOSITIVO Y TOKENS FCM
-- ============================================================

CREATE TABLE user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
  device_hint VARCHAR(200) NULL,
  ip VARCHAR(50) NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '24 hours',
  last_seen TIMESTAMPTZ NULL,
  revoked BOOLEAN NOT NULL DEFAULT FALSE
);

ALTER TABLE refresh_tokens
  ADD CONSTRAINT fk_refresh_tokens_session
  FOREIGN KEY (session_id) REFERENCES user_sessions(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_session ON refresh_tokens(session_id);
CREATE INDEX idx_user_sessions_user ON user_sessions (user_id);

-- Login por QR: la web genera un reto, el móvil (ya logueado) lo aprueba
-- escaneándolo, y la web canjea el reto por una sesión real.
CREATE TABLE qr_login_sessions (
  id                   SERIAL PRIMARY KEY,
  challenge_token_hash TEXT NOT NULL UNIQUE,
  status               VARCHAR(10) NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending','approved','denied','expired','consumed')),
  user_id              INT REFERENCES "user"(user_id) ON DELETE CASCADE,
  device_hint          VARCHAR(200),
  ip                   VARCHAR(50),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at           TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '2 minutes'
);
CREATE INDEX idx_qr_login_sessions_status ON qr_login_sessions(status, expires_at);

CREATE TABLE device_token (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform VARCHAR(10) NOT NULL DEFAULT 'android',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, platform)
);
CREATE INDEX idx_device_token_user ON device_token(user_id);

-- ============================================================
-- 23. ITINERARIOS / RUTAS
-- ============================================================

CREATE TABLE itinerary (
  id_itinerary SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  cover_image_url VARCHAR(500),
  is_public BOOLEAN DEFAULT FALSE,
  is_certified BOOLEAN DEFAULT FALSE,
  original_itinerary_id INT REFERENCES itinerary(id_itinerary) ON DELETE SET NULL,
  copy_count INT DEFAULT 0,
  view_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_itinerary_user ON itinerary(user_id);
CREATE INDEX idx_itinerary_public ON itinerary(is_public, copy_count DESC);
CREATE INDEX idx_itinerary_certified ON itinerary(is_certified) WHERE is_certified = TRUE;

CREATE TRIGGER update_itinerary_updated_at
    BEFORE UPDATE ON itinerary
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 24. PARADAS DE ITINERARIO
-- ============================================================

CREATE TABLE itinerary_stop (
  id_stop SERIAL PRIMARY KEY,
  id_itinerary INT NOT NULL REFERENCES itinerary(id_itinerary) ON DELETE CASCADE,
  place_kind VARCHAR(3) NOT NULL CHECK (place_kind IN ('poi', 'svc')),
  place_id INT NOT NULL,
  stop_order INT NOT NULL,
  visit_date DATE,
  visit_time_start TIME,
  notes TEXT
);

CREATE INDEX idx_itinerary_stop_itinerary ON itinerary_stop(id_itinerary, stop_order);

-- ============================================================
-- 25. LIKES EN ITINERARIOS
-- ============================================================

CREATE TABLE itinerary_like (
  user_id INT NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
  id_itinerary INT NOT NULL REFERENCES itinerary(id_itinerary) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, id_itinerary)
);

CREATE INDEX idx_itinerary_like_itinerary ON itinerary_like(id_itinerary);

-- ============================================================
-- 26. RED SOCIAL: SEGUIMIENTO ENTRE USUARIOS
-- ============================================================

CREATE TABLE user_follow (
  follower_id INT NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
  following_id INT NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id <> following_id)
);

CREATE INDEX idx_user_follow_following ON user_follow(following_id);

-- ============================================================
-- 27. RESERVAS DE SERVICIOS
-- status: pending | confirmed | cancelled
-- ============================================================

CREATE TABLE booking (
  id_booking SERIAL PRIMARY KEY,
  id_service INT NOT NULL REFERENCES tourist_service(id_service),
  user_id INT NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
  id_itinerary INT REFERENCES itinerary(id_itinerary) ON DELETE SET NULL,
  visit_date DATE NOT NULL,
  visit_time TIME,
  guests INT DEFAULT 1,
  notes TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  is_walkin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT booking_status_check CHECK (status IN ('pending', 'confirmed', 'cancelled'))
);

CREATE INDEX idx_booking_service ON booking(id_service);
CREATE INDEX idx_booking_user ON booking(user_id);
CREATE INDEX idx_booking_date ON booking(visit_date);

-- ============================================================
-- 28. CHAT: CONVERSACIONES Y MENSAJES (turista ↔ empresa)
-- ============================================================

CREATE TABLE conversation (
  id_conversation SERIAL PRIMARY KEY,
  tourist_id INT NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
  id_company INT NOT NULL REFERENCES company(id_company) ON DELETE CASCADE,
  id_service INT REFERENCES tourist_service(id_service) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (tourist_id, id_company, id_service)
);

CREATE INDEX idx_conversation_tourist ON conversation(tourist_id);
CREATE INDEX idx_conversation_company ON conversation(id_company);

CREATE TABLE message (
  id_message SERIAL PRIMARY KEY,
  id_conversation INT NOT NULL REFERENCES conversation(id_conversation) ON DELETE CASCADE,
  sender_id INT NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_message_conversation ON message(id_conversation, created_at DESC);

-- ============================================================
-- SEEDS: DATOS DE PRUEBA
-- Contraseña de todos los usuarios: Password1a
-- bcrypt hash: $2b$10$HQJ66fgUzg5nFEHnzzYrb.F/UQehNmboHq.FemnPRLUEJ0hLQjthe
-- ============================================================

INSERT INTO tourism_type (name) VALUES
  ('Naturaleza'),
  ('Cultura'),
  ('Gastronomía'),
  ('Aventura'),
  ('Relax'),
  ('Historia');

INSERT INTO location (name, state, municipality, latitude, longitude) VALUES
  ('Xalapa',               'Veracruz', 'Xalapa',              19.531240, -96.915890),  -- 1
  ('Coatepec',             'Veracruz', 'Coatepec',            19.451800, -96.959700),  -- 2
  ('Córdoba',              'Veracruz', 'Córdoba',             18.894200, -96.934700),  -- 3
  ('Orizaba',              'Veracruz', 'Orizaba',             18.849100, -97.105100),  -- 4
  ('Fortín de las Flores', 'Veracruz', 'Fortín',             18.901200, -96.998500),  -- 5
  ('Xico',                 'Veracruz', 'Xico',                19.421800, -97.010200),  -- 6
  ('Ixtaczoquitlán',       'Veracruz', 'Ixtaczoquitlán',     18.816700, -97.066700),  -- 7
  ('Cuitláhuac',           'Veracruz', 'Cuitláhuac',         18.813100, -96.722200),  -- 8
  ('Amatlán de los Reyes', 'Veracruz', 'Amatlán de los Reyes', 18.833300, -96.916700), -- 9
  ('Yanga',                'Veracruz', 'Yanga',               18.833300, -96.800000),  -- 10
  ('Atoyac',               'Veracruz', 'Atoyac',              18.916700, -96.766700);  -- 11

INSERT INTO tourism_sector (name, description) VALUES
  ('Hotelería',             'Hospedaje'),
  ('Restaurantes',          'Gastronomía'),
  ('Turismo de naturaleza', 'Actividades al aire libre');

-- Usuarios demo (role_id: 1=admin, 2=user, 3=empresa)
INSERT INTO "user" (name, email, password, role_id, avatar_icon_key) VALUES
  ('Admin SMARTUR', 'martinlaraolivares@gmail.com',
   '$2b$10$HQJ66fgUzg5nFEHnzzYrb.F/UQehNmboHq.FemnPRLUEJ0hLQjthe', 1, 'admin');

-- Empresas (las de seed inician como 'active' para que los servicios sean visibles)
INSERT INTO company (name, address, phone, id_sector, id_location, status, owner_user_id) VALUES
  ('Hotel Mirador',            'Av. Principal 100',      '2288110011', 1, 1, 'active',  NULL), -- 1
  ('Café La Orquídea',         'Centro 20',              '2288220022', 2, 2, 'active',  NULL), -- 2
  ('Eco Tours Veracruz',       'Bosque 5',               '2288330033', 3, 2, 'active',  NULL), -- 3
  ('Hotel Altas Montañas',     'Madero 123',             '2721001001', 1, 4, 'active',  NULL), -- 4
  ('Restaurante El Pico',      'Sur 45',                 '2721001002', 2, 4, 'active',  NULL), -- 5
  ('Aventura Pico Tours',      'Norte 10',               '2721001003', 3, 4, 'active',  NULL), -- 6
  ('Posada Fortín',            'Principal 200',          '2731002001', 1, 5, 'active',  NULL), -- 7
  ('Hotel Gobernador Córdoba', 'Av. 1 norte 64',         '2717123456', 1, 3, 'active',  NULL), -- 8
  ('Casa Revilla Gastronomía', 'Av. 3 norte 12',         '2717123457', 2, 3, 'active',  NULL), -- 9
  ('Experiencias Los Portales','Portal de Gloria',       '2717123458', 3, 3, 'active',  NULL), -- 10
  ('Hotel Posada Xico',        'Morelos 15',             '2281234501', 1, 6, 'active',  NULL), -- 11
  ('Fonda Tradicional Xico',   'Juárez 8',               '2281234502', 2, 6, 'active',  NULL), -- 12
  ('Xico Aventura en la Niebla','Carretera a Texolo km 1','2281234503', 3, 6, 'active', NULL); -- 13

-- Servicios turísticos (seeds inician como 'active')
INSERT INTO tourist_service (name, description, id_company, id_location, service_type, active, status, image_url) VALUES
  ('Hotel Mirador Xalapa',
   'Habitaciones con vista panorámica de Xalapa y el Cofre de Perote.',
   1, 1, 'hotel', true, 'active',
   'https://commons.wikimedia.org/wiki/Special:FilePath/Xalapa_Veracruz_Mexico.jpg?width=800'),

  ('Café Orquídea Coatepec',
   'Café de altura 100% arabica de Coatepec con postres artesanales.',
   2, 2, 'restaurant', true, 'active',
   'https://commons.wikimedia.org/wiki/Special:FilePath/Coatepec_Veracruz.jpg?width=800'),

  ('Senderismo Macuiltépetl',
   'Salida guiada al parque ecológico con guía especializado en flora local.',
   3, 1, 'tour', true, 'active',
   'https://commons.wikimedia.org/wiki/Special:FilePath/Macuiltepetl.jpg?width=800'),

  ('Hotel Altas Montañas Orizaba',
   'Hospedaje con vista directa al Pico de Orizaba — el volcán más alto de México.',
   4, 4, 'hotel', true, 'active',
   'https://commons.wikimedia.org/wiki/Special:FilePath/Orizaba_Veracruz_Mexico.jpg?width=800'),

  ('El Pico Restaurante',
   'Cocina veracruzana de altura: chileatole, tostadas orizabeñas y café regional.',
   5, 4, 'restaurant', true, 'active',
   'https://commons.wikimedia.org/wiki/Special:FilePath/Orizaba_centro.jpg?width=800'),

  ('Tour Pico de Orizaba',
   'Excursión guiada a la zona de montaña y refugio Piedra Grande.',
   6, 4, 'tour', true, 'active',
   'https://commons.wikimedia.org/wiki/Special:FilePath/Citlaltepetl.jpg?width=800'),

  ('Posada Fortín Plaza',
   'Hospedaje céntrico entre jardines de gardenias y café en Fortín.',
   7, 5, 'hotel', true, 'active',
   'https://commons.wikimedia.org/wiki/Special:FilePath/Fort%C3%ADn_de_las_flores_veracruz.jpg?width=800'),

  ('Hotel Gobernador Córdoba',
   'Hospedaje histórico a pasos del zócalo y Los Portales de Córdoba.',
   8, 3, 'hotel', true, 'active',
   'https://commons.wikimedia.org/wiki/Special:FilePath/C%C3%B3rdoba_Veracruz_Mexico.jpg?width=800'),

  ('Restaurante Casa Revilla',
   'Alta cocina veracruzana con vista a Los Portales: chileatole, tamales y café.',
   9, 3, 'restaurant', true, 'active',
   'https://commons.wikimedia.org/wiki/Special:FilePath/Los_portales_de_c%C3%B3rdoba_veracruz.jpg?width=800'),

  ('Tour Ciudad de los 30 Caballeros',
   'Recorrido guiado por el centro histórico colonial, leyendas y barrio de La Villa.',
   10, 3, 'tour', true, 'active',
   'https://commons.wikimedia.org/wiki/Special:FilePath/Catedral_de_C%C3%B3rdoba_Veracruz.jpg?width=800'),

  ('Hotel Posada Xico',
   'Posada colonial en el Pueblo Mágico de Xico, entre cafetales y niebla.',
   11, 6, 'hotel', true, 'active',
   'https://commons.wikimedia.org/wiki/Special:FilePath/Xico_Veracruz.jpg?width=800'),

  ('Fonda Tradicional Xico',
   'Mole xiqueño de 14 ingredientes, chiles en nogada y conservas artesanales.',
   12, 6, 'restaurant', true, 'active',
   'https://commons.wikimedia.org/wiki/Special:FilePath/Xico_centro.jpg?width=800'),

  ('Tour Cascada de Texolo y miradores',
   'Caminata guiada a la cascada de niebla con parada en miradores de cafetal.',
   13, 6, 'tour', true, 'active',
   'https://commons.wikimedia.org/wiki/Special:FilePath/Cascada_de_Texolo.jpg?width=800');

-- POIs de Xalapa
INSERT INTO point_of_interest (name, categories_raw, categories_mapped, price_level, is_accessible, outdoor, latitude, longitude, id_location, description, image_url, rating) VALUES
  ('Parque Macuiltépetl',
   'park, viewpoint, hiking', '["nature"]', 1, true, true, 19.539500, -96.920900, 1,
   'Cerro volcánico con miradores panorámicos y senderos naturales en el corazón de Xalapa.',
   'https://commons.wikimedia.org/wiki/Special:FilePath/Macuiltepetl.jpg?width=800', 4.7),
  ('Museo de Antropología de Xalapa',
   'museum, history, culture', '["culture"]', 2, true, false, 19.527500, -96.936900, 1,
   'Uno de los museos arqueológicos más importantes de México. Alberga cabezas colosales olmecas.',
   'https://commons.wikimedia.org/wiki/Special:FilePath/Museo_de_Antropolog%C3%ADa_de_Xalapa.jpg?width=800', 4.9),
  ('Parque Juárez Xalapa',
   'park, viewpoint, outdoor', '["nature"]', 1, true, true, 19.529300, -96.921000, 1,
   'Parque central de Xalapa con jardines, kiosco y vistas al Pico de Orizaba y Cofre de Perote.',
   'https://commons.wikimedia.org/wiki/Special:FilePath/Parque_Ju%C3%A1rez_Xalapa.jpg?width=800', 4.5),
  ('Agora de la Ciudad Xalapa',
   'culture, art, music', '["culture"]', 1, true, false, 19.529400, -96.921200, 1,
   'Espacio cultural con exposiciones de arte, teatro y conciertos. Sede de la Orquesta Sinfónica de Xalapa.',
   'https://commons.wikimedia.org/wiki/Special:FilePath/Xalapa_Veracruz_Mexico.jpg?width=800', 4.4),
  ('Jardín Botánico Clavijero',
   'botanical garden, nature, science', '["nature"]', 1, true, true, 19.506200, -96.928300, 1,
   'Jardín botánico del INIECOL con más de 1,800 especies de plantas y colección de orquídeas.',
   'https://commons.wikimedia.org/wiki/Special:FilePath/Jardin_botanico_Clavijero_Xalapa.jpg?width=800', 4.6);

-- POIs de Coatepec
INSERT INTO point_of_interest (name, categories_raw, categories_mapped, price_level, is_accessible, outdoor, latitude, longitude, id_location, description, image_url, rating) VALUES
  ('Cascada de Texolo',
   'waterfall, nature, hiking', '["nature"]', 1, false, true, 19.467600, -96.990700, 2,
   'Impresionante cascada de 40 metros rodeada de vegetación tropical a 10 min de Coatepec.',
   'https://commons.wikimedia.org/wiki/Special:FilePath/Cascada_de_Texolo.jpg?width=800', 4.8),
  ('Ex-Hacienda El Lencero',
   'hacienda, history, park', '["culture"]', 1, true, true, 19.476100, -96.847500, 2,
   'Antigua hacienda del siglo XVI con jardines coloniales. Sede del Museo del Mueble Veracruzano.',
   'https://commons.wikimedia.org/wiki/Special:FilePath/Hacienda_el_Lencero_Veracruz_Mexico.jpg?width=800', 4.3),
  ('Jardín Hidalgo Coatepec',
   'park, town square, outdoor, gastronomy', '["culture", "gastronomy"]', 1, true, true, 19.452200, -96.962600, 2,
   'Zócalo del Pueblo Mágico de Coatepec rodeado de portales con cafeterías de café de altura.',
   'https://commons.wikimedia.org/wiki/Special:FilePath/Coatepec_Veracruz.jpg?width=800', 4.6),
  ('Museo del Café Coatepec',
   'museum, coffee, gastronomy, history', '["culture", "gastronomy"]', 2, true, false, 19.452500, -96.962800, 2,
   'Museo interactivo dedicado al café de Coatepec, con Denominación de Origen.',
   'https://commons.wikimedia.org/wiki/Special:FilePath/Coatepec_centro.jpg?width=800', 4.4);

-- POIs de Córdoba
INSERT INTO point_of_interest (name, categories_raw, categories_mapped, price_level, is_accessible, outdoor, latitude, longitude, id_location, description, image_url, rating) VALUES
  ('Catedral de Córdoba',
   'cathedral, religion, history', '["culture"]', 1, true, false, 18.885900, -96.937700, 3,
   'Catedral neoclásica del siglo XVII frente al zócalo. Una de las más imponentes de Veracruz.',
   'https://commons.wikimedia.org/wiki/Special:FilePath/Catedral_de_C%C3%B3rdoba_Veracruz.jpg?width=800', 4.5),
  ('Los Portales de Córdoba',
   'zocalo, town square, gastronomy', '["culture", "gastronomy"]', 2, true, true, 18.885400, -96.937200, 3,
   'Icónico paseo porticado colonial. Aquí se firmó el Tratado de Córdoba (1821).',
   'https://commons.wikimedia.org/wiki/Special:FilePath/Los_portales_de_c%C3%B3rdoba_veracruz.jpg?width=800', 4.4),
  ('Cerro del Borrego Córdoba',
   'park, viewpoint, hiking, outdoor', '["nature"]', 1, true, true, 18.889200, -96.944600, 3,
   'Área natural con senderos, miradores y zoológico. Vistas panorámicas al Valle de Córdoba.',
   'https://commons.wikimedia.org/wiki/Special:FilePath/C%C3%B3rdoba_Veracruz_Mexico.jpg?width=800', 4.3),
  ('Barrio de La Villa',
   'neighborhood, architecture, history', '["culture"]', 1, true, true, 18.883400, -96.934600, 3,
   'Barrio histórico colonial con casas del siglo XVIII y gastronomía cordobesa típica.',
   'https://commons.wikimedia.org/wiki/Special:FilePath/C%C3%B3rdoba_Veracruz_Mexico.jpg?width=800', 4.2);

-- POIs de Orizaba
INSERT INTO point_of_interest (name, categories_raw, categories_mapped, price_level, is_accessible, outdoor, latitude, longitude, id_location, description, image_url, rating) VALUES
  ('Pico de Orizaba (Citlaltépetl)',
   'volcano, mountain, hiking', '["nature", "aventura"]', 1, false, true, 19.030800, -97.268100, 4,
   'El volcán más alto de México (5,636 m). Punto de alpinismo y trekking de alta montaña.',
   'https://commons.wikimedia.org/wiki/Special:FilePath/Citlaltepetl.jpg?width=800', 4.9),
  ('Palacio de Hierro Orizaba',
   'monument, history, architecture', '["culture"]', 1, true, false, 18.851700, -97.101400, 4,
   'Emblemático edificio art nouveau de 1894 importado de Bélgica. Joya arquitectónica de México.',
   'https://commons.wikimedia.org/wiki/Special:FilePath/Palacio_de_Hierro_Orizaba.jpg?width=800', 4.6),
  ('Parque Apolinar Castillo Orizaba',
   'park, outdoor, zocalo', '["nature"]', 1, true, true, 18.851400, -97.101600, 4,
   'Parque central de Orizaba con kiosco histórico, fuentes y jardines.',
   'https://commons.wikimedia.org/wiki/Special:FilePath/Orizaba_parque.jpg?width=800', 4.3),
  ('Catedral de San Miguel Orizaba',
   'cathedral, religion, history, architecture', '["culture"]', 1, true, false, 18.851900, -97.102000, 4,
   'Imponente catedral neoclásica del siglo XIX. Una de las más grandes de Veracruz.',
   'https://commons.wikimedia.org/wiki/Special:FilePath/Catedral_de_Orizaba.jpg?width=800', 4.6),
  ('Cerro del Borrego Orizaba',
   'park, viewpoint, hiking, outdoor', '["nature"]', 1, true, true, 18.857800, -97.097100, 4,
   'Parque natural con teleférico panorámico y vistas al Citlaltépetl.',
   'https://commons.wikimedia.org/wiki/Special:FilePath/Cerro_del_borrego_orizaba.jpg?width=800', 4.7);

-- POIs de Fortín de las Flores
INSERT INTO point_of_interest (name, categories_raw, categories_mapped, price_level, is_accessible, outdoor, latitude, longitude, id_location, description, image_url, rating) VALUES
  ('Jardín Botánico de Fortín',
   'botanical garden, park, nature', '["nature"]', 1, true, true, 18.905200, -96.998400, 5,
   'Extenso jardín con más de 3,000 especies de plantas tropicales y orquídeas.',
   'https://commons.wikimedia.org/wiki/Special:FilePath/Fort%C3%ADn_de_las_Flores.jpg?width=800', 4.5),
  ('Puente de los Suspiros Fortín',
   'viewpoint, park, outdoor', '["nature"]', 1, true, true, 18.905400, -96.997200, 5,
   'Histórico puente de hierro sobre el río entre vegetación tropical. Símbolo de Fortín.',
   'https://commons.wikimedia.org/wiki/Special:FilePath/Fort%C3%ADn_de_las_flores_veracruz.jpg?width=800', 4.5);

-- POIs de Xico
INSERT INTO point_of_interest (name, categories_raw, categories_mapped, price_level, is_accessible, outdoor, latitude, longitude, id_location, description, image_url, rating) VALUES
  ('Cascada de Texolo Xico',
   'waterfall, nature, hiking', '["nature"]', 1, false, true, 19.447900, -97.020800, 6,
   'Majestuosa cascada de 40 m en Pueblo Mágico de Xico. Escenario de "Romancing the Stone".',
   'https://commons.wikimedia.org/wiki/Special:FilePath/Cascada_de_Texolo.jpg?width=800', 4.9),
  ('Parroquia de Santiago Apóstol Xico',
   'church, religion, history, architecture', '["culture"]', 1, true, false, 19.421800, -97.010200, 6,
   'Parroquia colonial del siglo XVI. Escenario de la procesión de María Magdalena (julio).',
   'https://commons.wikimedia.org/wiki/Special:FilePath/Xico_Veracruz_iglesia.jpg?width=800', 4.6),
  ('Mercado de Artesanías Xico',
   'market, local food, gastronomy', '["gastronomy"]', 1, true, false, 19.421600, -97.009800, 6,
   'Mercado con mole xiqueño de 14 ingredientes, conservas artesanales y café de altura.',
   'https://commons.wikimedia.org/wiki/Special:FilePath/Xico_centro.jpg?width=800', 4.7),
  ('Mirador Cafetal La Niebla',
   'viewpoint, coffee, outdoor, nature', '["nature"]', 1, true, true, 19.430200, -97.015200, 6,
   'Mirador entre cafetales y helechos con vistas al barranco. El mejor punto fotográfico de Xico.',
   'https://commons.wikimedia.org/wiki/Special:FilePath/Xico_Veracruz.jpg?width=800', 4.8);

-- POIs de Ixtaczoquitlán
INSERT INTO point_of_interest (name, categories_raw, categories_mapped, price_level, is_accessible, outdoor, latitude, longitude, id_location, description, image_url, rating) VALUES
  ('Viaducto del Metlac',
   'viewpoint, monument, history, architecture', '["culture", "nature"]', 1, true, false, 18.849000, -97.138000, 7,
   'Puente de arcos del siglo XIX sobre la barranca del Metlac. Uno de los más fotografiados de México.',
   'https://commons.wikimedia.org/wiki/Special:FilePath/Viaducto_Metlac.jpg?width=800', 4.8),
  ('Cascada Río Metlac',
   'waterfall, nature, outdoor', '["nature"]', 1, false, true, 18.847500, -97.137200, 7,
   'Cascada del río Metlac bajo el famoso viaducto. Selva tropical con vegetación exuberante.',
   'https://commons.wikimedia.org/wiki/Special:FilePath/Ixtaczoquitlan_veracruz.jpg?width=800', 4.4);

-- Posts comunidad demo
INSERT INTO community_post (user_id, caption, image_url, place_kind, place_id) VALUES
  (1, 'Increíble amanecer en el Macuiltépetl — las montañas de Veracruz en todo su esplendor.',
   'https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&w=800', 'poi', 1),
  (1, 'El museo de Xalapa es impresionante, ideal en familia.', NULL, 'poi', 2),
  (1, 'El café de Coatepec no tiene comparación.',
   'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&w=800', 'svc', 2);

-- Plantillas de evaluación
INSERT INTO evaluation_template (name, version, service_type, active, creation_date) VALUES
  ('Instrumento de Evaluación Restaurante', '1.0', 'restaurante', true, NOW()),
  ('Instrumento de Evaluación Hotel',       '1.0', 'hotel',       true, NOW());

INSERT INTO evaluation_criterion (id_template, name, description, weight, order_index, active, field_type, is_required) VALUES
  (1, '¿Cuántas puertas de acceso tiene?',              '[STEP:infraestructura] Evalúa el número y calidad de accesos', 1.00, 0, true, 'scale', true),
  (1, '¿El establecimiento cuenta con señalización?',   '[STEP:infraestructura] Presencia de señalización visible',     1.00, 1, true, 'scale', true),
  (1, '¿Las áreas de cocina están limpias?',            '[STEP:higiene] Limpieza general de cocina',                    1.00, 2, true, 'scale', true),
  (1, '¿El personal usa uniforme y equipo de protección?','[STEP:higiene] Higiene del personal',                       1.00, 3, true, 'scale', true),
  (1, '¿La atención al cliente es amable?',             '[STEP:servicio] Calidad en el trato al cliente',              1.00, 4, true, 'scale', true),
  (1, '¿El menú es claro y descriptivo?',               '[STEP:servicio] Claridad y presentación del menú',            1.00, 5, true, 'scale', true);

INSERT INTO evaluation_subcriterion (id_criterion, description, score, order_index) VALUES
  (1, 'Deficiente', 2, 0), (1, 'Regular', 4, 1), (1, 'Bueno', 6, 2), (1, 'Muy bueno', 8, 3), (1, 'Excelente', 10, 4),
  (2, 'Deficiente', 2, 0), (2, 'Regular', 4, 1), (2, 'Bueno', 6, 2), (2, 'Muy bueno', 8, 3), (2, 'Excelente', 10, 4),
  (3, 'Deficiente', 2, 0), (3, 'Regular', 4, 1), (3, 'Bueno', 6, 2), (3, 'Muy bueno', 8, 3), (3, 'Excelente', 10, 4),
  (4, 'Deficiente', 2, 0), (4, 'Regular', 4, 1), (4, 'Bueno', 6, 2), (4, 'Muy bueno', 8, 3), (4, 'Excelente', 10, 4),
  (5, 'Deficiente', 2, 0), (5, 'Regular', 4, 1), (5, 'Bueno', 6, 2), (5, 'Muy bueno', 8, 3), (5, 'Excelente', 10, 4),
  (6, 'Deficiente', 2, 0), (6, 'Regular', 4, 1), (6, 'Bueno', 6, 2), (6, 'Muy bueno', 8, 3), (6, 'Excelente', 10, 4);

COMMIT;
