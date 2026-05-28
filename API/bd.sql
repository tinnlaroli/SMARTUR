BEGIN;

-- Base de datos recomendada: ENCODING UTF8 (evita "?" en lugar de acentos)
-- Ejemplo: CREATE DATABASE smartur WITH ENCODING 'UTF8' TEMPLATE template0;

CREATE TABLE role (
  role_id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL
);

INSERT INTO role (name) VALUES ('admin'), ('user');

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
  email_verified BOOLEAN DEFAULT FALSE,
  email_verification_token VARCHAR(255) NULL,
  email_verification_otp VARCHAR(255) NULL,
  email_verification_expires TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES role(role_id)
);

-- ============================================
-- FUNCIÓN PARA ACTUALIZAR updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER PARA LA TABLA user
-- ============================================

CREATE TRIGGER update_user_updated_at
    BEFORE UPDATE ON "user"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ÍNDICES PARA MEJORAR RENDIMIENTO
-- ============================================

-- Índice para búsquedas por role_id
CREATE INDEX idx_user_role ON "user"(role_id);

-- Índice para ordenar por fecha de creación
CREATE INDEX idx_user_created_at ON "user"(created_at DESC);


-- Tabla de Perfil del Viajero Optimizada para SMARTUR
CREATE TABLE traveler_profile (
  id_profile SERIAL PRIMARY KEY,
  user_id INT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Datos de Perfil (Step 1)
  age INT,                                    -- Edad exacta
  age_range VARCHAR(10),                      -- Rango (ej. '18-25')
  gender VARCHAR(20),                         -- Género
  
  -- Preferencias y Estilo (Step 2)
  interests TEXT[],                           -- Tipos de turismo {naturaleza, aventura, etc.}
  activity_level INT DEFAULT 3,               -- Nivel 1-5
  preferred_place VARCHAR(50),                -- 'aire', 'cerrado', 'indiferente'
  
  -- Contexto Fijo (Step 3 / Step 4)
  travel_type VARCHAR(50),                    -- 'solo', 'pareja', 'familia', 'amigos'
  has_accessibility BOOLEAN DEFAULT FALSE,    -- Necesita accesibilidad
  accessibility_detail TEXT,                  -- Detalles de la necesidad
  has_visited_before BOOLEAN DEFAULT FALSE,   -- ¿Ha visitado la región?
  
  -- Campos Originales / Auditoría
  restrictions TEXT,                          -- Alergias o restricciones médicas
  sustainable_preferences BOOLEAN DEFAULT FALSE,
  
  FOREIGN KEY (user_id) REFERENCES "user"(user_id) ON DELETE CASCADE
);

-- Índice para búsquedas rápidas por usuario
CREATE INDEX idx_profile_user_id ON traveler_profile(user_id);

CREATE TABLE location (
  id_location SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  state VARCHAR(100),
  municipality VARCHAR(100),
  latitude DECIMAL(10,6),
  longitude DECIMAL(10,6)
);

CREATE TABLE tourism_type (
  id_type SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

-- point_of_interest: ML inference columns + display columns for mobile app
DROP TABLE IF EXISTS point_of_interest CASCADE;

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
  -- Display columns (mobile app + community)
  id_location  INT REFERENCES location(id_location),
  description  TEXT,
  image_url    TEXT,
  rating       DECIMAL(2,1) DEFAULT 4.0
);

CREATE INDEX idx_poi_created_at ON point_of_interest(created_at DESC);
CREATE INDEX idx_poi_price_level ON point_of_interest(price_level);
CREATE INDEX idx_poi_categories_mapped ON point_of_interest USING GIN (categories_mapped);

CREATE TABLE tourism_expenditure (
  id_expenditure SERIAL PRIMARY KEY,
  id_tourist INT,
  expenditure_type VARCHAR(50),
  amount NUMERIC(10,2),
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  destination VARCHAR(150),
  FOREIGN KEY (id_tourist) REFERENCES "user"(user_id)
);

CREATE TABLE tourism_sector (
  id_sector SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT
);

CREATE TABLE company (
  id_company SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  address VARCHAR(255),
  phone VARCHAR(50),
  id_sector INT NOT NULL,
  id_location INT,
  registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_sector) REFERENCES tourism_sector(id_sector),
  FOREIGN KEY (id_location) REFERENCES location(id_location)
);

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

-- EVALUATION TEMPLATES
CREATE TABLE evaluation_template (
    id_template SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    version VARCHAR(20),
    service_type VARCHAR(50), -- 'restaurant', 'hotel', 'tour'
    active BOOLEAN DEFAULT true,
    creation_date TIMESTAMP
);

CREATE TABLE evaluation_criterion (
    id_criterion SERIAL PRIMARY KEY,
    id_template INTEGER REFERENCES evaluation_template(id_template),
    name VARCHAR(100), -- 'Infrastructure', 'Accessibility', etc.
    description TEXT,
    weight DECIMAL(3,2), -- 0.00 - 1.00
    order_index INTEGER,
    active BOOLEAN DEFAULT true,
    field_type VARCHAR(50) NOT NULL DEFAULT 'scale' CHECK (field_type IN ('text', 'multiple_choice', 'scale', 'checkbox', 'select')),
    is_required BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE evaluation_subcriterion (
    id_subcriterion SERIAL PRIMARY KEY,
    id_criterion INTEGER NOT NULL REFERENCES evaluation_criterion(id_criterion) ON DELETE CASCADE,
    description VARCHAR(255) NOT NULL, -- Description of the score level
    score DECIMAL(5,2) NOT NULL DEFAULT 0, -- e.g., 0, 1, 2, 3, 4
    order_index INTEGER NOT NULL DEFAULT 0,
    required_evidences TEXT[], -- Types of required evidence
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tourist_service (
    id_service SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    id_company INT,
    id_location INT,
    service_type VARCHAR(50),
    active BOOLEAN DEFAULT true,
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_company) REFERENCES company(id_company),
    FOREIGN KEY (id_location) REFERENCES location(id_location)
);


CREATE TABLE service_evaluation (
    id_evaluation SERIAL PRIMARY KEY,
    id_service INTEGER REFERENCES tourist_service(id_service),
    id_template INTEGER REFERENCES evaluation_template(id_template),
    evaluation_date DATE,
    evaluator_id INTEGER REFERENCES "user"(user_id),
    status VARCHAR(20), -- 'in_progress', 'completed', 'reviewed'
    is_active BOOLEAN DEFAULT TRUE,
    total_score DECIMAL(4,2),
    evaluation_time INTEGER, -- minutes
    general_observations TEXT,
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
    attached_evidences JSON, -- URLs of photos, documents, etc.
    created_at TIMESTAMP,
    UNIQUE (id_evaluation, id_criterion)
);

CREATE TABLE service_certification (
    id_certification SERIAL PRIMARY KEY,
    id_service INTEGER REFERENCES tourist_service(id_service),
    certification_type VARCHAR(100), -- 'H_Distinction', 'Michelin', 'Sustainable'
    obtainment_date DATE,
    expiration_date DATE,
    issuing_organization VARCHAR(100),
    evidence_url VARCHAR(255),
    status VARCHAR(20), -- 'active', 'expired', 'under_review'
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE login_tokens (
  user_id INT,
  token VARCHAR(100) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (user_id) REFERENCES "user"(user_id)
);

CREATE TABLE password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id INT,
  token VARCHAR(100) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (user_id) REFERENCES "user"(user_id)
);

-- ============================================
-- A5: REGISTRO DE SEGURIDAD Y AUDITORÍA
-- Tabla para observabilidad de eventos de auth
-- Usada por: services/monitoringService.js
-- ============================================
CREATE TABLE security_events (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,  -- LOGIN_ATTEMPT, LOGIN_FAILED, MFA_FAILED, etc.
  user_email VARCHAR(100),
  ip_address VARCHAR(50),
  severity VARCHAR(20) DEFAULT 'INFO', -- INFO, WARNING, ERROR
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice para consultas de Grafana ordenadas por tiempo
CREATE INDEX idx_security_events_created_at ON security_events(created_at DESC);
-- Índice para filtrar por tipo de evento
CREATE INDEX idx_security_events_type ON security_events(event_type);

-- ============================================
-- App móvil: favoritos, historial de visitas, comunidad
-- ============================================
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

-- ============================================
-- MODELO ML: persistencia de recomendaciones y métricas
-- (generadas por servicio MODELO :8000; consulta vía GET /recommendations/{user_id})
-- ============================================
CREATE TABLE ml_recommendation_session (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  alpha DOUBLE PRECISION,
  best_algorithm VARCHAR(64),
  execution_time_ms DOUBLE PRECISION,
  context_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ml_rec_session_user_created
  ON ml_recommendation_session (user_id, created_at DESC);

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

-- ============================================
-- SEEDS DEMO (explore + usuarios de prueba + posts)
-- Contraseña ambos usuarios: Password1a
-- ============================================
INSERT INTO tourism_type (name) VALUES
  ('Naturaleza'),
  ('Cultura'),
  ('Gastronomía');

INSERT INTO location (name, state, municipality, latitude, longitude) VALUES
  ('Xalapa', 'Veracruz', 'Xalapa', 19.531240, -96.915890),
  ('Coatepec', 'Veracruz', 'Coatepec', 19.451800, -96.959700),
  ('Córdoba', 'Veracruz', 'Córdoba', 18.894200, -96.934700);

INSERT INTO tourism_sector (name, description) VALUES
  ('Hotelería', 'Hospedaje'),
  ('Restaurantes', 'Gastronomía'),
  ('Turismo de naturaleza', 'Actividades al aire libre');

INSERT INTO company (name, address, phone, id_sector, id_location) VALUES
  ('Hotel Mirador', 'Av. Principal 100', '2288110011', 1, 1),
  ('Café La Orquídea', 'Centro 20', '2288220022', 2, 2),
  ('Eco Tours Veracruz', 'Bosque 5', '2288330033', 3, 2);

INSERT INTO tourist_service (name, description, id_company, id_location, service_type, active, image_url) VALUES
  ('Hotel Mirador Xalapa', 'Habitaciones con vista panorámica de Xalapa y el Cofre de Perote.', 1, 1, 'hotel', true,
   'https://commons.wikimedia.org/wiki/Special:FilePath/Xalapa_Veracruz_Mexico.jpg?width=800'),
  ('Café Orquídea Coatepec', 'Café de altura 100% arabica de Coatepec con postres artesanales.', 2, 2, 'restaurant', true,
   'https://commons.wikimedia.org/wiki/Special:FilePath/Coatepec_Veracruz.jpg?width=800'),
  ('Senderismo Macuiltépetl', 'Salida guiada al parque ecológico con guía especializado en flora local.', 3, 1, 'tour', true,
   'https://commons.wikimedia.org/wiki/Special:FilePath/Macuiltepetl.jpg?width=800');

INSERT INTO point_of_interest (name, categories_raw, categories_mapped, price_level, is_accessible, outdoor, latitude, longitude, id_location, description, image_url, rating) VALUES
  ('Parque Macuiltépetl', 'park, viewpoint, hiking', '["nature"]', 1, true, true, 19.539500, -96.920900, 1,
   'Cerro volcánico con miradores panorámicos y senderos naturales en el corazón de Xalapa. Ideal para caminatas cortas y observación de aves.',
   'https://commons.wikimedia.org/wiki/Special:FilePath/Macuiltepetl.jpg?width=800', 4.7),
  ('Museo de Antropología de Xalapa', 'museum, history, culture', '["culture"]', 2, true, false, 19.527500, -96.936900, 1,
   'Uno de los museos arqueológicos más importantes de México. Alberga cabezas colosales olmecas, esculturas totonacas y piezas del Clásico mesoamericano.',
   'https://commons.wikimedia.org/wiki/Special:FilePath/Museo_de_Antropolog%C3%ADa_de_Xalapa.jpg?width=800', 4.9),
  ('Cascada de Texolo', 'waterfall, nature, hiking', '["nature"]', 1, false, true, 19.467600, -96.990700, 2,
   'Impresionante cascada de 40 metros rodeada de exuberante vegetación tropical a 10 minutos del centro de Xico/Coatepec.',
   'https://commons.wikimedia.org/wiki/Special:FilePath/Cascada_de_Texolo.jpg?width=800', 4.8),
  ('Ex-Hacienda El Lencero', 'hacienda, history, park', '["culture"]', 1, true, true, 19.476100, -96.847500, 2,
   'Antigua hacienda del siglo XVI con jardines coloniales y lago. Sede del Museo del Mueble Veracruzano.',
   'https://commons.wikimedia.org/wiki/Special:FilePath/Hacienda_el_Lencero_Veracruz_Mexico.jpg?width=800', 4.3);

-- bcrypt hash for password: Password1a
INSERT INTO "user" (name, email, password, role_id, photo_url, avatar_icon_key) VALUES
  ('Turista Demo', 'turista@smartur.demo',
   '$2b$10$HQJ66fgUzg5nFEHnzzYrb.F/UQehNmboHq.FemnPRLUEJ0hLQjthe', 2, NULL, 'hiking'),
  ('Admin Demo', 'martinlaraolivares@gmail.com',
   '$2b$10$HQJ66fgUzg5nFEHnzzYrb.F/UQehNmboHq.FemnPRLUEJ0hLQjthe', 1, NULL, 'admin');

INSERT INTO community_post (user_id, caption, image_url, place_kind, place_id) VALUES
  (2, 'Increíble amanecer en la montaña — altas montañas de Veracruz.',
   'https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&w=800', 'poi', 1),
  (1, 'Recomiendo el museo interactivo en Xalapa, ideal en familia.', NULL, 'poi', 2),
  (2, 'El café de Coatepec no tiene comparación.', 
   'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&w=800', 'svc', 2);

-- Altas Montañas: Orizaba y Fortín (app Home ya no usa mocks)
INSERT INTO location (name, state, municipality, latitude, longitude) VALUES
  ('Orizaba', 'Veracruz', 'Orizaba', 18.849100, -97.105100),
  ('Fortín de las Flores', 'Veracruz', 'Fortín', 18.901200, -96.998500);

INSERT INTO company (name, address, phone, id_sector, id_location) VALUES
  ('Hotel Altas Montañas Orizaba', 'Madero 123', '2721001001', 1, 4),
  ('Restaurante El Pico', 'Sur 45', '2721001002', 2, 4),
  ('Aventura Pico Tours', 'Norte 10', '2721001003', 3, 4),
  ('Posada Fortín', 'Principal 200', '2731002001', 1, 5);

INSERT INTO tourist_service (name, description, id_company, id_location, service_type, active, image_url) VALUES
  ('Hotel Altas Montañas', 'Hospedaje con vista directa al Pico de Orizaba — el volcán más alto de México.', 4, 4, 'hotel', true,
   'https://commons.wikimedia.org/wiki/Special:FilePath/Orizaba_Veracruz_Mexico.jpg?width=800'),
  ('El Pico Restaurante', 'Cocina veracruzana de altura: chileatole, tostadas orizabeñas y café regional.', 5, 4, 'restaurant', true,
   'https://commons.wikimedia.org/wiki/Special:FilePath/Orizaba_centro.jpg?width=800'),
  ('Tour Pico de Orizaba', 'Excursión guiada a la zona de montaña y refugio Piedra Grande.', 6, 4, 'tour', true,
   'https://commons.wikimedia.org/wiki/Special:FilePath/Citlaltepetl.jpg?width=800'),
  ('Posada Fortín Plaza', 'Hospedaje céntrico entre jardines de gardenias y café en Fortín.', 7, 5, 'hotel', true,
   'https://commons.wikimedia.org/wiki/Special:FilePath/Fort%C3%ADn_de_las_flores_veracruz.jpg?width=800');

INSERT INTO point_of_interest (name, categories_raw, categories_mapped, price_level, is_accessible, outdoor, latitude, longitude, id_location, description, image_url, rating) VALUES
  ('Pico de Orizaba (Citlaltépetl)', 'volcano, mountain, hiking', '["nature", "aventura"]', 1, false, true, 19.030800, -97.268100, 4,
   'El volcán más alto de México (5,636 m). Imponente cono nevado visible desde toda la región de Altas Montañas. Punto de alpinismo y trekking de alta montaña.',
   'https://commons.wikimedia.org/wiki/Special:FilePath/Citlaltepetl.jpg?width=800', 4.9),
  ('Palacio de Hierro Orizaba', 'monument, history, architecture', '["culture"]', 1, true, false, 18.851700, -97.101400, 4,
   'Emblemático edificio art nouveau de 1894 importado de Bélgica, símbolo de la ciudad industrial de Orizaba. Una joya arquitectónica única en México.',
   'https://commons.wikimedia.org/wiki/Special:FilePath/Palacio_de_Hierro_Orizaba.jpg?width=800', 4.6),
  ('Jardín Botánico de Fortín', 'botanical garden, park, nature', '["nature"]', 1, true, true, 18.905200, -96.998400, 5,
   'Extenso jardín con más de 3,000 especies de plantas tropicales, orquídeas y flores. La ciudad de Fortín es mundialmente conocida por sus gardenias y café.',
   'https://commons.wikimedia.org/wiki/Special:FilePath/Fort%C3%ADn_de_las_Flores.jpg?width=800', 4.5);

-- Córdoba: más servicios y puntos (filtros hotel / restaurante / tour / museo / naturaleza)
INSERT INTO company (name, address, phone, id_sector, id_location) VALUES
  ('Hotel Gobernador Córdoba', 'Av. 1 norte 64', '2717123456', 1, 3),
  ('Casa Revilla Gastronomía', 'Av. 3 norte 12', '2717123457', 2, 3),
  ('Experiencias Los Portales', 'Portal de Gloria', '2717123458', 3, 3);

INSERT INTO tourist_service (name, description, id_company, id_location, service_type, active, image_url) VALUES
  ('Hotel Gobernador Córdoba', 'Hospedaje histórico a pasos del zócalo y Los Portales de Córdoba.', 8, 3, 'hotel', true,
   'https://commons.wikimedia.org/wiki/Special:FilePath/C%C3%B3rdoba_Veracruz_Mexico.jpg?width=800'),
  ('Restaurante Casa Revilla', 'Alta cocina veracruzana con vista a Los Portales: chileatole, tamales y café.', 9, 3, 'restaurant', true,
   'https://commons.wikimedia.org/wiki/Special:FilePath/Los_portales_de_c%C3%B3rdoba_veracruz.jpg?width=800'),
  ('Tour Ciudad de los 30 Caballeros', 'Recorrido guiado por el centro histórico colonial, leyendas y barrio de La Villa.', 10, 3, 'tour', true,
   'https://commons.wikimedia.org/wiki/Special:FilePath/Catedral_de_C%C3%B3rdoba_Veracruz.jpg?width=800');

INSERT INTO point_of_interest (name, categories_raw, categories_mapped, price_level, is_accessible, outdoor, latitude, longitude, id_location, description, image_url, rating) VALUES
  ('Catedral de Córdoba', 'cathedral, religion, history', '["culture"]', 1, true, false, 18.885900, -96.937700, 3,
   'Catedral neoclásica del siglo XVII frente al zócalo de Córdoba. Una de las más imponentes de Veracruz con retablos dorados y arte colonial.',
   'https://commons.wikimedia.org/wiki/Special:FilePath/Catedral_de_C%C3%B3rdoba_Veracruz.jpg?width=800', 4.5),
  ('Los Portales de Córdoba', 'zocalo, town square, gastronomy', '["culture", "gastronomy"]', 2, true, true, 18.885400, -96.937200, 3,
   'Icónico paseo porticado colonial con cafeterías, tiendas de artesanías y vida nocturna. Fue aquí donde se firmó el Tratado de Córdoba (1821) que dio la Independencia a México.',
   'https://commons.wikimedia.org/wiki/Special:FilePath/Los_portales_de_c%C3%B3rdoba_veracruz.jpg?width=800', 4.4),
  ('Cerro del Borrego Córdoba', 'park, viewpoint, hiking, outdoor', '["nature"]', 1, true, true, 18.889200, -96.944600, 3,
   'Área natural en las faldas del cerro con senderos, miradores y zoológico. Ofrece vistas panorámicas al Valle de Córdoba y las cumbres de Altas Montañas.',
   'https://commons.wikimedia.org/wiki/Special:FilePath/C%C3%B3rdoba_Veracruz_Mexico.jpg?width=800', 4.3),
  ('Barrio de La Villa', 'neighborhood, architecture, history', '["culture"]', 1, true, true, 18.883400, -96.934600, 3,
   'Barrio histórico colonial con casas del siglo XVIII, gastronomía cordobesa típica e iglesia de La Villa.',
   'https://commons.wikimedia.org/wiki/Special:FilePath/C%C3%B3rdoba_Veracruz_Mexico.jpg?width=800', 4.2);

-- Xico (nueva ciudad): Pueblo Mágico, variedad de tipos para filtros
INSERT INTO location (name, state, municipality, latitude, longitude) VALUES
  ('Xico', 'Veracruz', 'Xico', 19.421800, -97.010200);

INSERT INTO company (name, address, phone, id_sector, id_location) VALUES
  ('Hotel Posada Xico', 'Morelos 15', '2281234501', 1, 6),
  ('Fonda Tradicional Xico', 'Juárez 8', '2281234502', 2, 6),
  ('Xico Aventura en la Niebla', 'Carretera a Texolo km 1', '2281234503', 3, 6);

INSERT INTO tourist_service (name, description, id_company, id_location, service_type, active, image_url) VALUES
  ('Hotel Posada Xico', 'Posada colonial en el Pueblo Mágico de Xico, entre cafetales y niebla.', 11, 6, 'hotel', true,
   'https://commons.wikimedia.org/wiki/Special:FilePath/Xico_Veracruz.jpg?width=800'),
  ('Fonda Tradicional Xico', 'Mole xiqueño de 14 ingredientes, chiles en nogada y conservas artesanales.', 12, 6, 'restaurant', true,
   'https://commons.wikimedia.org/wiki/Special:FilePath/Xico_centro.jpg?width=800'),
  ('Tour Cascada de Texolo y miradores', 'Caminata guiada a la cascada de niebla con parada en miradores de cafetal.', 13, 6, 'tour', true,
   'https://commons.wikimedia.org/wiki/Special:FilePath/Cascada_de_Texolo.jpg?width=800');

INSERT INTO point_of_interest (name, categories_raw, categories_mapped, price_level, is_accessible, outdoor, latitude, longitude, id_location, description, image_url, rating) VALUES
  ('Cascada de Texolo', 'waterfall, nature, hiking', '["nature"]', 1, false, true, 19.447900, -97.020800, 6,
   'Majestuosa cascada doble de niebla de 40 m en pleno Pueblo Mágico de Xico. Rodeada de selva tropical y cafetales. Escenario de la película "Romancing the Stone".',
   'https://commons.wikimedia.org/wiki/Special:FilePath/Cascada_de_Texolo.jpg?width=800', 4.9),
  ('Parroquia de Santiago Apóstol Xico', 'church, religion, history, architecture', '["culture"]', 1, true, false, 19.421800, -97.010200, 6,
   'Parroquia colonial del siglo XVI en el centro de Xico. Escenario de la famosa procesión de María Magdalena (julio), una de las fiestas más coloridas de Veracruz.',
   'https://commons.wikimedia.org/wiki/Special:FilePath/Xico_Veracruz_iglesia.jpg?width=800', 4.6),
  ('Mercado de Artesanías Xico', 'market, local food, gastronomy', '["gastronomy"]', 1, true, false, 19.421600, -97.009800, 6,
   'Mercado artesanal con mole xiqueño de 14 ingredientes, conservas de guayaba y naranja, café de altura y dulces regionales únicos.',
   'https://commons.wikimedia.org/wiki/Special:FilePath/Xico_centro.jpg?width=800', 4.7),
  ('Mirador Cafetal La Niebla', 'viewpoint, coffee, outdoor, nature', '["nature"]', 1, true, true, 19.430200, -97.015200, 6,
   'Mirador entre niebla, cafetales y helechos con vistas al barranco y la cascada de Texolo. El mejor punto para fotografiar el paisaje de niebla característico de Xico.',
   'https://commons.wikimedia.org/wiki/Special:FilePath/Xico_Veracruz.jpg?width=800', 4.8);

-- ============================================
-- NUEVOS LUGARES: Altas Montañas — expansión de contenido
-- ============================================

-- Xalapa: más POIs (3 nuevos)
INSERT INTO point_of_interest (name, categories_raw, categories_mapped, price_level, is_accessible, outdoor, latitude, longitude, id_location, description, image_url, rating) VALUES
  ('Parque Juárez Xalapa', 'park, viewpoint, outdoor', '["nature"]', 1, true, true, 19.529300, -96.921000, 1,
   'Parque central de Xalapa con jardines, kiosco y vistas al Pico de Orizaba y Cofre de Perote en días despejados. Corazón de la capital cultural de Veracruz.',
   'https://commons.wikimedia.org/wiki/Special:FilePath/Parque_Ju%C3%A1rez_Xalapa.jpg?width=800', 4.5),
  ('Agora de la Ciudad Xalapa', 'culture, art, music', '["culture"]', 1, true, false, 19.529400, -96.921200, 1,
   'Espacio cultural multidisciplinario con exposiciones de arte contemporáneo, teatro, conciertos y proyecciones. Sede de la Orquesta Sinfónica de Xalapa.',
   'https://commons.wikimedia.org/wiki/Special:FilePath/Xalapa_Veracruz_Mexico.jpg?width=800', 4.4),
  ('Jardín Botánico Francisco Javier Clavijero', 'botanical garden, nature, science', '["nature"]', 1, true, true, 19.506200, -96.928300, 1,
   'Jardín botánico del INIECOL con más de 1,800 especies de plantas, senderos en selva nubosa y colección de bromelias y orquídeas veracruzanas.',
   'https://commons.wikimedia.org/wiki/Special:FilePath/Jardin_botanico_Clavijero_Xalapa.jpg?width=800', 4.6);

-- Coatepec: más POIs (2 nuevos)
INSERT INTO point_of_interest (name, categories_raw, categories_mapped, price_level, is_accessible, outdoor, latitude, longitude, id_location, description, image_url, rating) VALUES
  ('Jardín Hidalgo Coatepec', 'park, town square, outdoor, gastronomy', '["culture", "gastronomy"]', 1, true, true, 19.452200, -96.962600, 2,
   'Zócalo del Pueblo Mágico de Coatepec. Rodeado de portales con cafeterías de café de altura. Hermoso kiosco del siglo XIX entre árboles de café en flor.',
   'https://commons.wikimedia.org/wiki/Special:FilePath/Coatepec_Veracruz.jpg?width=800', 4.6),
  ('Museo del Café Coatepec', 'museum, coffee, gastronomy, history', '["culture", "gastronomy"]', 2, true, false, 19.452500, -96.962800, 2,
   'Museo interactivo dedicado a la historia del café en Coatepec, región productora de uno de los mejores cafés de México con Denominación de Origen.',
   'https://commons.wikimedia.org/wiki/Special:FilePath/Coatepec_centro.jpg?width=800', 4.4);

-- Orizaba: más POIs (3 nuevos)
INSERT INTO point_of_interest (name, categories_raw, categories_mapped, price_level, is_accessible, outdoor, latitude, longitude, id_location, description, image_url, rating) VALUES
  ('Parque Apolinar Castillo Orizaba', 'park, outdoor, zocalo', '["nature"]', 1, true, true, 18.851400, -97.101600, 4,
   'Parque central de Orizaba con kiosco histórico, fuentes, jardines y esculturas. Punto de reunión de la ciudad industrial entre el Pico de Orizaba y el Pico de San Martín.',
   'https://commons.wikimedia.org/wiki/Special:FilePath/Orizaba_parque.jpg?width=800', 4.3),
  ('Catedral de San Miguel Orizaba', 'cathedral, religion, history, architecture', '["culture"]', 1, true, false, 18.851900, -97.102000, 4,
   'Imponente catedral neoclásica del siglo XIX con fachada tallada en cantera y retablos dorados interiores. Una de las más grandes del Estado de Veracruz.',
   'https://commons.wikimedia.org/wiki/Special:FilePath/Catedral_de_Orizaba.jpg?width=800', 4.6),
  ('Cerro del Borrego Orizaba', 'park, viewpoint, hiking, outdoor', '["nature"]', 1, true, true, 18.857800, -97.097100, 4,
   'Parque natural con teleférico panorámico, zoológico y miradores sobre Orizaba y el Pico. El teleférico ofrece vistas al Citlaltépetl en días despejados.',
   'https://commons.wikimedia.org/wiki/Special:FilePath/Cerro_del_borrego_orizaba.jpg?width=800', 4.7);

-- Fortín de las Flores: más POIs (1 nuevo)
INSERT INTO point_of_interest (name, categories_raw, categories_mapped, price_level, is_accessible, outdoor, latitude, longitude, id_location, description, image_url, rating) VALUES
  ('Puente de los Suspiros Fortín', 'viewpoint, park, outdoor', '["nature"]', 1, true, true, 18.905400, -96.997200, 5,
   'Histórico puente de hierro sobre el río Metlac rodeado de vegetación tropical y flores de naranja. Símbolo romántico de Fortín de las Flores.',
   'https://commons.wikimedia.org/wiki/Special:FilePath/Fort%C3%ADn_de_las_flores_veracruz.jpg?width=800', 4.5);

-- Ixtaczoquitlán: POIs (nueva ciudad con contenido, id_location=7)
INSERT INTO point_of_interest (name, categories_raw, categories_mapped, price_level, is_accessible, outdoor, latitude, longitude, id_location, description, image_url, rating) VALUES
  ('Viaducto del Metlac', 'viewpoint, monument, history, architecture', '["culture", "nature"]', 1, true, false, 18.849000, -97.138000, 7,
   'Majestuoso puente de arcos del siglo XIX sobre la barranca del río Metlac, construido durante el Segundo Imperio Mexicano. Uno de los más fotografiados de México y visible desde el tren Tequila Express.',
   'https://commons.wikimedia.org/wiki/Special:FilePath/Viaducto_Metlac.jpg?width=800', 4.8),
  ('Cascada Río Metlac', 'waterfall, nature, outdoor', '["nature"]', 1, false, true, 18.847500, -97.137200, 7,
   'Cascada del río Metlac en el cañón debajo del famoso viaducto. Paisaje de selva tropical con vegetación exuberante y fauna local.',
   'https://commons.wikimedia.org/wiki/Special:FilePath/Ixtaczoquitlan_veracruz.jpg?width=800', 4.4);

-- Evaluation instrument seed data
INSERT INTO evaluation_template (name, version, service_type, active, creation_date) VALUES
  ('Instrumento de Evaluación Restaurante', '1.0', 'restaurante', true, NOW()),
  ('Instrumento de Evaluación Hotel', '1.0', 'hotel', true, NOW());

INSERT INTO evaluation_criterion (id_template, name, description, weight, order_index, active, field_type, is_required) VALUES
  (1, '¿Cuántas puertas de acceso tiene?', '[STEP:infraestructura] Evalúa el número y calidad de accesos', 1.00, 0, true, 'scale', true),
  (1, '¿El establecimiento cuenta con señalización?', '[STEP:infraestructura] Presencia de señalización visible', 1.00, 1, true, 'scale', true),
  (1, '¿Las áreas de cocina están limpias?', '[STEP:higiene] Limpieza general de cocina y área de preparación', 1.00, 2, true, 'scale', true),
  (1, '¿El personal usa uniforme y equipo de protección?', '[STEP:higiene] Higiene del personal de servicio', 1.00, 3, true, 'scale', true),
  (1, '¿La atención al cliente es amable?', '[STEP:servicio] Calidad en el trato al cliente', 1.00, 4, true, 'scale', true),
  (1, '¿El menú es claro y descriptivo?', '[STEP:servicio] Claridad y presentación del menú', 1.00, 5, true, 'scale', true);

INSERT INTO evaluation_subcriterion (id_criterion, description, score, order_index) VALUES
  (1, 'Deficiente', 2, 0), (1, 'Regular', 4, 1), (1, 'Bueno', 6, 2), (1, 'Muy bueno', 8, 3), (1, 'Excelente', 10, 4),
  (2, 'Deficiente', 2, 0), (2, 'Regular', 4, 1), (2, 'Bueno', 6, 2), (2, 'Muy bueno', 8, 3), (2, 'Excelente', 10, 4),
  (3, 'Deficiente', 2, 0), (3, 'Regular', 4, 1), (3, 'Bueno', 6, 2), (3, 'Muy bueno', 8, 3), (3, 'Excelente', 10, 4),
  (4, 'Deficiente', 2, 0), (4, 'Regular', 4, 1), (4, 'Bueno', 6, 2), (4, 'Muy bueno', 8, 3), (4, 'Excelente', 10, 4),
  (5, 'Deficiente', 2, 0), (5, 'Regular', 4, 1), (5, 'Bueno', 6, 2), (5, 'Muy bueno', 8, 3), (5, 'Excelente', 10, 4),
  (6, 'Deficiente', 2, 0), (6, 'Regular', 4, 1), (6, 'Bueno', 6, 2), (6, 'Muy bueno', 8, 3), (6, 'Excelente', 10, 4);

-- ============================================
-- ML DATA COLLECTION TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS user_interaction (
  id            BIGSERIAL PRIMARY KEY,
  user_id       INT NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
  place_kind    VARCHAR(16) NULL,
  place_id      INT NULL,
  event_type    VARCHAR(32) NOT NULL,
  dwell_ms      INT NULL,
  meta          JSONB NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_user_interaction_user_place ON user_interaction (user_id, place_kind, place_id);
CREATE INDEX idx_user_interaction_created ON user_interaction (created_at DESC);

CREATE TABLE IF NOT EXISTS user_rating (
  id         SERIAL PRIMARY KEY,
  user_id    INT NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
  place_kind VARCHAR(3) NOT NULL CHECK (place_kind IN ('svc', 'poi')),
  place_id   INT NOT NULL,
  rating     SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, place_kind, place_id)
);
CREATE INDEX idx_user_rating_place ON user_rating (place_kind, place_id);

CREATE TABLE IF NOT EXISTS ml_recommendation_feedback (
  id            SERIAL PRIMARY KEY,
  session_id    INT NOT NULL REFERENCES ml_recommendation_session(id) ON DELETE CASCADE,
  item_id       VARCHAR(64) NOT NULL,
  rank_pos      INT NOT NULL,
  clicked       BOOLEAN NOT NULL DEFAULT FALSE,
  clicked_at    TIMESTAMPTZ NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ml_rec_feedback_session ON ml_recommendation_feedback (session_id);

-- ── Post reports ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS post_reports (
  id         SERIAL PRIMARY KEY,
  post_id    INT NOT NULL REFERENCES community_post(id_post) ON DELETE CASCADE,
  user_id    INT NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
  reason     VARCHAR(50) NOT NULL CHECK (reason IN ('spam','inappropriate','false_info','hateful')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved   BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (post_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_post_reports_post ON post_reports (post_id);
CREATE INDEX IF NOT EXISTS idx_post_reports_resolved ON post_reports (resolved, created_at DESC);

-- ── User sessions (device login tracking) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS user_sessions (
  id          SERIAL PRIMARY KEY,
  user_id     INT NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
  device_hint VARCHAR(200) NULL,
  ip          VARCHAR(50)  NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW() + INTERVAL '24 hours',
  last_seen   TIMESTAMPTZ  NULL,
  revoked     BOOLEAN      NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions (user_id);

INSERT INTO location (name, state, municipality, latitude, longitude)
VALUES
  ('Ixtaczoquitlán',          'Veracruz', 'Ixtaczoquitlán',        18.816700, -97.066700),
  ('Cuitláhuac',              'Veracruz', 'Cuitláhuac',            18.813100, -96.722200),
  ('Amatlán de los Reyes',    'Veracruz', 'Amatlán de los Reyes',  18.833300, -96.916700),
  ('Yanga',                   'Veracruz', 'Yanga',                 18.833300, -96.800000),
  ('Atoyac',                  'Veracruz', 'Atoyac',                18.916700, -96.766700),
  ('Xico',                    'Veracruz', 'Xico',                  19.421800, -97.010200)
ON CONFLICT DO NOTHING;

-- ============================================
-- MIGRATION: Fix existing POI data (coords + real Wikimedia photos)
-- Para BD ya inicializada: ejecutar estos UPDATE/INSERT en producción.
-- ============================================

-- Fix Xalapa POIs
UPDATE point_of_interest SET
  latitude = 19.539500, longitude = -96.920900,
  image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Macuiltepetl.jpg?width=800',
  name = 'Parque Macuiltépetl',
  description = 'Cerro volcánico con miradores panorámicos y senderos naturales en el corazón de Xalapa. Ideal para caminatas cortas y observación de aves.',
  categories_raw = 'park, viewpoint, hiking'
WHERE name LIKE '%Macuiltépetl%' OR name LIKE '%Macuiltepetl%';

UPDATE point_of_interest SET
  latitude = 19.527500, longitude = -96.936900,
  image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Museo_de_Antropolog%C3%ADa_de_Xalapa.jpg?width=800',
  name = 'Museo de Antropología de Xalapa',
  description = 'Uno de los museos arqueológicos más importantes de México. Alberga cabezas colosales olmecas, esculturas totonacas y piezas del Clásico mesoamericano.',
  categories_raw = 'museum, history, culture'
WHERE name LIKE '%Museo Interactivo%' OR name LIKE '%Museo%Xalapa%';

-- Fix Coatepec POIs
UPDATE point_of_interest SET
  latitude = 19.467600, longitude = -96.990700,
  image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Cascada_de_Texolo.jpg?width=800',
  description = 'Impresionante cascada de 40 metros rodeada de exuberante vegetación tropical a 10 minutos del centro de Xico/Coatepec.',
  categories_raw = 'waterfall, nature, hiking'
WHERE name = 'Cascada de Texolo' AND id_location = 2;

UPDATE point_of_interest SET
  latitude = 19.476100, longitude = -96.847500,
  image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Hacienda_el_Lencero_Veracruz_Mexico.jpg?width=800',
  name = 'Ex-Hacienda El Lencero',
  description = 'Antigua hacienda del siglo XVI con jardines coloniales y lago. Sede del Museo del Mueble Veracruzano.',
  categories_raw = 'hacienda, history, park'
WHERE name LIKE '%Toxpan%' OR name LIKE '%Lencero%';

-- Fix Orizaba POIs
UPDATE point_of_interest SET
  latitude = 19.030800, longitude = -97.268100,
  image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Citlaltepetl.jpg?width=800',
  name = 'Pico de Orizaba (Citlaltépetl)',
  description = 'El volcán más alto de México (5,636 m). Imponente cono nevado visible desde toda la región de Altas Montañas. Punto de alpinismo y trekking de alta montaña.',
  categories_raw = 'volcano, mountain, hiking'
WHERE name LIKE '%Pico de Orizaba%';

UPDATE point_of_interest SET
  latitude = 18.851700, longitude = -97.101400,
  image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Palacio_de_Hierro_Orizaba.jpg?width=800',
  description = 'Emblemático edificio art nouveau de 1894 importado de Bélgica, símbolo de la ciudad industrial de Orizaba. Una joya arquitectónica única en México.',
  categories_raw = 'monument, history, architecture'
WHERE name LIKE '%Palacio de Hierro%';

-- Fix Fortín POIs
UPDATE point_of_interest SET
  latitude = 18.905200, longitude = -96.998400,
  image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Fort%C3%ADn_de_las_Flores.jpg?width=800',
  description = 'Extenso jardín con más de 3,000 especies de plantas tropicales, orquídeas y flores. La ciudad de Fortín es mundialmente conocida por sus gardenias y café.',
  categories_raw = 'botanical garden, park, nature'
WHERE name LIKE '%Botánico%Fortín%' OR name LIKE '%Botánico Fort%';

-- Fix Córdoba POIs
UPDATE point_of_interest SET
  latitude = 18.885900, longitude = -96.937700,
  image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Catedral_de_C%C3%B3rdoba_Veracruz.jpg?width=800',
  description = 'Catedral neoclásica del siglo XVII frente al zócalo de Córdoba. Una de las más imponentes de Veracruz con retablos dorados y arte colonial.',
  categories_raw = 'cathedral, religion, history'
WHERE name LIKE '%Catedral%Córdoba%' OR name LIKE '%Catedral%Cordoba%';

UPDATE point_of_interest SET
  latitude = 18.885400, longitude = -96.937200,
  image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Los_portales_de_c%C3%B3rdoba_veracruz.jpg?width=800',
  description = 'Icónico paseo porticado colonial con cafeterías, tiendas y vida nocturna. Aquí se firmó el Tratado de Córdoba (1821) que dio la Independencia a México.'
WHERE name LIKE '%Portales%Córdoba%' OR name LIKE '%Portales%Cordoba%';

UPDATE point_of_interest SET
  latitude = 18.889200, longitude = -96.944600,
  image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/C%C3%B3rdoba_Veracruz_Mexico.jpg?width=800',
  name = 'Cerro del Borrego Córdoba',
  description = 'Área natural en las faldas del cerro con senderos, miradores y zoológico. Ofrece vistas panorámicas al Valle de Córdoba.',
  categories_raw = 'park, viewpoint, hiking, outdoor'
WHERE name LIKE '%Metate%';

UPDATE point_of_interest SET
  latitude = 18.883400, longitude = -96.934600,
  image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/C%C3%B3rdoba_Veracruz_Mexico.jpg?width=800',
  name = 'Barrio de La Villa',
  categories_raw = 'neighborhood, architecture, history'
WHERE name LIKE '%Villa%' AND id_location = 3;

-- Fix Xico POIs
UPDATE point_of_interest SET
  latitude = 19.447900, longitude = -97.020800,
  image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Cascada_de_Texolo.jpg?width=800',
  name = 'Cascada de Texolo',
  description = 'Majestuosa cascada doble de niebla de 40 m en pleno Pueblo Mágico de Xico. Rodeada de selva tropical y cafetales. Escenario de la película "Romancing the Stone".',
  categories_raw = 'waterfall, nature, hiking'
WHERE name LIKE '%Texolo%' AND id_location = 6;

UPDATE point_of_interest SET
  image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Xico_Veracruz_iglesia.jpg?width=800',
  name = 'Parroquia de Santiago Apóstol Xico',
  description = 'Parroquia colonial del siglo XVI en el centro de Xico. Escenario de la famosa procesión de María Magdalena (julio), una de las fiestas más coloridas de Veracruz.',
  categories_raw = 'church, religion, history, architecture'
WHERE name LIKE '%María Magdalena%' OR name LIKE '%Santuario%' AND id_location = 6;

UPDATE point_of_interest SET
  latitude = 19.421600, longitude = -97.009800,
  image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Xico_centro.jpg?width=800',
  name = 'Mercado de Artesanías Xico',
  description = 'Mercado artesanal con mole xiqueño de 14 ingredientes, conservas de guayaba y naranja, café de altura y dulces regionales únicos.',
  categories_raw = 'market, local food, gastronomy'
WHERE name LIKE '%Mercado%Xico%' OR name LIKE '%Mercado%' AND id_location = 6;

UPDATE point_of_interest SET
  latitude = 19.430200, longitude = -97.015200,
  image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Xico_Veracruz.jpg?width=800',
  name = 'Mirador Cafetal La Niebla',
  description = 'Mirador entre niebla, cafetales y helechos con vistas al barranco y la cascada de Texolo. El mejor punto para fotografiar el paisaje de niebla característico de Xico.',
  categories_raw = 'viewpoint, coffee, outdoor, nature'
WHERE name LIKE '%Niebla%' AND id_location = 6;

-- Fix tourist_service images (remove Pexels stock)
UPDATE tourist_service SET image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Xalapa_Veracruz_Mexico.jpg?width=800'
WHERE name LIKE '%Mirador Xalapa%';
UPDATE tourist_service SET image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Coatepec_Veracruz.jpg?width=800'
WHERE name LIKE '%Orquídea%';
UPDATE tourist_service SET image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Macuiltepetl.jpg?width=800'
WHERE name LIKE '%Senderismo Macuiltépetl%';
UPDATE tourist_service SET image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Orizaba_Veracruz_Mexico.jpg?width=800'
WHERE name LIKE '%Hotel Altas Montañas%';
UPDATE tourist_service SET image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Orizaba_centro.jpg?width=800'
WHERE name LIKE '%Pico Restaurante%';
UPDATE tourist_service SET image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Citlaltepetl.jpg?width=800'
WHERE name LIKE '%Tour Pico%';
UPDATE tourist_service SET image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Fort%C3%ADn_de_las_flores_veracruz.jpg?width=800'
WHERE name LIKE '%Posada Fortín%';
UPDATE tourist_service SET image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/C%C3%B3rdoba_Veracruz_Mexico.jpg?width=800'
WHERE name LIKE '%Gobernador%';
UPDATE tourist_service SET image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Los_portales_de_c%C3%B3rdoba_veracruz.jpg?width=800'
WHERE name LIKE '%Casa Revilla%';
UPDATE tourist_service SET image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Catedral_de_C%C3%B3rdoba_Veracruz.jpg?width=800'
WHERE name LIKE '%30 Caballeros%';
UPDATE tourist_service SET image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Xico_Veracruz.jpg?width=800'
WHERE name LIKE '%Posada Xico%';
UPDATE tourist_service SET image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Xico_centro.jpg?width=800'
WHERE name LIKE '%Fonda Tradicional%';
UPDATE tourist_service SET image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Cascada_de_Texolo.jpg?width=800'
WHERE name LIKE '%Tour Cascada%';

-- Insert NEW POIs (run on production to add new content)
INSERT INTO point_of_interest (name, categories_raw, categories_mapped, price_level, is_accessible, outdoor, latitude, longitude, id_location, description, image_url, rating)
SELECT * FROM (VALUES
  ('Parque Juárez Xalapa', 'park, viewpoint, outdoor', '["nature"]'::jsonb, 1::smallint, true, true, 19.529300, -96.921000, 1, 'Parque central de Xalapa con jardines, kiosco y vistas al Pico de Orizaba y Cofre de Perote en días despejados. Corazón de la capital cultural de Veracruz.', 'https://commons.wikimedia.org/wiki/Special:FilePath/Parque_Ju%C3%A1rez_Xalapa.jpg?width=800', 4.5),
  ('Agora de la Ciudad Xalapa', 'culture, art, music', '["culture"]'::jsonb, 1::smallint, true, false, 19.529400, -96.921200, 1, 'Espacio cultural multidisciplinario con exposiciones de arte contemporáneo, teatro, conciertos y proyecciones. Sede de la Orquesta Sinfónica de Xalapa.', 'https://commons.wikimedia.org/wiki/Special:FilePath/Xalapa_Veracruz_Mexico.jpg?width=800', 4.4),
  ('Jardín Botánico Clavijero', 'botanical garden, nature, science', '["nature"]'::jsonb, 1::smallint, true, true, 19.506200, -96.928300, 1, 'Jardín botánico del INIECOL con más de 1,800 especies de plantas, senderos en selva nubosa y colección de bromelias y orquídeas veracruzanas.', 'https://commons.wikimedia.org/wiki/Special:FilePath/Jardin_botanico_Clavijero_Xalapa.jpg?width=800', 4.6),
  ('Jardín Hidalgo Coatepec', 'park, town square, outdoor, gastronomy', '["culture", "gastronomy"]'::jsonb, 1::smallint, true, true, 19.452200, -96.962600, 2, 'Zócalo del Pueblo Mágico de Coatepec. Rodeado de portales con cafeterías de café de altura. Hermoso kiosco del siglo XIX entre árboles de café en flor.', 'https://commons.wikimedia.org/wiki/Special:FilePath/Coatepec_Veracruz.jpg?width=800', 4.6),
  ('Museo del Café Coatepec', 'museum, coffee, gastronomy, history', '["culture", "gastronomy"]'::jsonb, 2::smallint, true, false, 19.452500, -96.962800, 2, 'Museo interactivo dedicado a la historia del café en Coatepec, región productora de uno de los mejores cafés de México con Denominación de Origen.', 'https://commons.wikimedia.org/wiki/Special:FilePath/Coatepec_centro.jpg?width=800', 4.4),
  ('Parque Apolinar Castillo', 'park, outdoor, zocalo', '["nature"]'::jsonb, 1::smallint, true, true, 18.851400, -97.101600, 4, 'Parque central de Orizaba con kiosco histórico, fuentes y jardines. Punto de encuentro entre el Pico de Orizaba y el centro de la ciudad industrial.', 'https://commons.wikimedia.org/wiki/Special:FilePath/Orizaba_parque.jpg?width=800', 4.3),
  ('Catedral de San Miguel Orizaba', 'cathedral, religion, history, architecture', '["culture"]'::jsonb, 1::smallint, true, false, 18.851900, -97.102000, 4, 'Imponente catedral neoclásica del siglo XIX con fachada en cantera y retablos dorados interiores. Una de las más grandes del Estado de Veracruz.', 'https://commons.wikimedia.org/wiki/Special:FilePath/Catedral_de_Orizaba.jpg?width=800', 4.6),
  ('Cerro del Borrego Orizaba', 'park, viewpoint, hiking, outdoor', '["nature"]'::jsonb, 1::smallint, true, true, 18.857800, -97.097100, 4, 'Parque natural con teleférico panorámico y miradores sobre Orizaba y el Pico de Orizaba. El teleférico ofrece vistas al Citlaltépetl en días despejados.', 'https://commons.wikimedia.org/wiki/Special:FilePath/Cerro_del_borrego_orizaba.jpg?width=800', 4.7),
  ('Puente de los Suspiros Fortín', 'viewpoint, park, outdoor', '["nature"]'::jsonb, 1::smallint, true, true, 18.905400, -96.997200, 5, 'Histórico puente de hierro sobre el río entre vegetación tropical y flores de naranja. Símbolo romántico de Fortín de las Flores.', 'https://commons.wikimedia.org/wiki/Special:FilePath/Fort%C3%ADn_de_las_flores_veracruz.jpg?width=800', 4.5),
  ('Viaducto del Metlac', 'viewpoint, monument, history, architecture', '["culture", "nature"]'::jsonb, 1::smallint, true, false, 18.849000, -97.138000, 7, 'Majestuoso puente de arcos del siglo XIX sobre la barranca del Metlac. Uno de los más fotografiados de México, visible desde el tren Tequila Express.', 'https://commons.wikimedia.org/wiki/Special:FilePath/Viaducto_Metlac.jpg?width=800', 4.8),
  ('Cascada Río Metlac', 'waterfall, nature, outdoor', '["nature"]'::jsonb, 1::smallint, false, true, 18.847500, -97.137200, 7, 'Cascada del río Metlac en el cañón bajo el famoso viaducto. Selva tropical con vegetación exuberante y fauna de la zona montañosa.', 'https://commons.wikimedia.org/wiki/Special:FilePath/Ixtaczoquitlan_veracruz.jpg?width=800', 4.4)
) AS v(name, categories_raw, categories_mapped, price_level, is_accessible, outdoor, latitude, longitude, id_location, description, image_url, rating)
WHERE NOT EXISTS (
  SELECT 1 FROM point_of_interest poi WHERE poi.name = v.name
);

-- ============================================
-- MIGRATION: Rol empresa + Portal B2B + FCM (ítems 6, 8, 9)
-- Idempotente: seguro de re-ejecutar en BD existente.
-- ============================================

-- Nuevo rol 'empresa' (role_id = 3)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM role WHERE name = 'empresa') THEN
    INSERT INTO role (name) VALUES ('empresa');
  END IF;
END
$$;

-- Vincular usuario a su empresa (para role_id = 3)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user' AND column_name = 'id_company'
  ) THEN
    ALTER TABLE "user"
      ADD COLUMN id_company INT NULL,
      ADD CONSTRAINT fk_user_company
        FOREIGN KEY (id_company) REFERENCES company(id_company) ON DELETE SET NULL;
  END IF;
  -- Asegurar que la FK tiene nombre explícito si la columna ya existe sin constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'user' AND constraint_name = 'fk_user_company'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user' AND column_name = 'id_company'
  ) THEN
    BEGIN
      ALTER TABLE "user"
        ADD CONSTRAINT fk_user_company
          FOREIGN KEY (id_company) REFERENCES company(id_company) ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END
$$;

-- Estado de verificación y propietario en empresa
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company' AND column_name = 'status'
  ) THEN
    ALTER TABLE company
      ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'pending',
      ADD CONSTRAINT company_status_check CHECK (status IN ('pending', 'active', 'suspended'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company' AND column_name = 'owner_user_id'
  ) THEN
    ALTER TABLE company ADD COLUMN owner_user_id INT NULL REFERENCES "user"(user_id);
  END IF;
END
$$;

-- Tabla de tokens FCM para Push Notifications
CREATE TABLE IF NOT EXISTS device_token (
  id           SERIAL PRIMARY KEY,
  user_id      INT NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
  token        TEXT NOT NULL,
  platform     VARCHAR(10) NOT NULL DEFAULT 'android',
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, platform)
);
CREATE INDEX IF NOT EXISTS idx_device_token_user ON device_token(user_id);

-- ============================================
-- MIGRATION: Refresh tokens para renovación silenciosa de sesión
-- ============================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          SERIAL PRIMARY KEY,
  user_id     INT NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rt_user ON refresh_tokens(user_id);

COMMIT;