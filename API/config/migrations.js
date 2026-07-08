/**
 * Startup schema migrations — applied once on API boot.
 * Uses ADD COLUMN IF NOT EXISTS so they are always safe to re-run.
 * New migrations go at the END of the MIGRATIONS array.
 */
import pool from './db.js';

const MIGRATIONS = [
    {
        name: 'v01_community_post_image_url',
        sql: `ALTER TABLE community_post
              ADD COLUMN IF NOT EXISTS image_url VARCHAR(512) NULL;`,
    },
    {
        name: 'v02_user_photo_avatar',
        sql: `ALTER TABLE "user"
              ADD COLUMN IF NOT EXISTS photo_url VARCHAR(512) NULL,
              ADD COLUMN IF NOT EXISTS avatar_icon_key VARCHAR(64) NULL;`,
    },
    {
        name: 'v03_poi_display_columns',
        sql: `ALTER TABLE point_of_interest
              ADD COLUMN IF NOT EXISTS id_location INT REFERENCES location(id_location),
              ADD COLUMN IF NOT EXISTS description TEXT,
              ADD COLUMN IF NOT EXISTS image_url TEXT,
              ADD COLUMN IF NOT EXISTS rating DECIMAL(2,1) DEFAULT 4.0;`,
    },
    {
        name: 'v04_poi_seed_display_data',
        sql: `
-- Parque Macuiltépetl → Xalapa (id_location inferred from lat)
UPDATE point_of_interest SET
  id_location = (SELECT id_location FROM location WHERE name='Xalapa' LIMIT 1),
  description = 'Cerro volcánico con miradores panorámicos y senderos naturales en Xalapa.',
  image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Macuiltepetl.jpg?width=800',
  rating = 4.7
WHERE name = 'Parque Macuiltépetl' AND id_location IS NULL;

UPDATE point_of_interest SET
  id_location = (SELECT id_location FROM location WHERE name='Xalapa' LIMIT 1),
  description = 'Museo con exposiciones interactivas de ciencia y tecnología, ideal para familias.',
  image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Xalapa_Veracruz_Mexico.jpg?width=800',
  rating = 4.5
WHERE name IN ('Museo Interactivo', 'Museo Interactivo de Xalapa') AND id_location IS NULL;

UPDATE point_of_interest SET
  id_location = (SELECT id_location FROM location WHERE name='Coatepec' LIMIT 1),
  description = 'Impresionante cascada de 40 metros en el bosque tropical de Coatepec.',
  image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Cascada_de_Texolo.jpg?width=800',
  rating = 4.8
WHERE name = 'Cascada de Texolo' AND latitude BETWEEN 19.44 AND 19.47;

UPDATE point_of_interest SET
  id_location = (SELECT id_location FROM location WHERE name='Coatepec' LIMIT 1),
  description = 'Hacienda colonial del siglo XIX con jardines y rica historia cafetalera.',
  image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Hacienda_el_Lencero_Veracruz_Mexico.jpg?width=800',
  rating = 4.3
WHERE name = 'Ex-Hacienda de Toxpan' AND id_location IS NULL;

UPDATE point_of_interest SET
  id_location = (SELECT id_location FROM location WHERE name='Orizaba' LIMIT 1),
  description = 'El volcán más alto de México. Destino para alpinismo y naturaleza extrema.',
  image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Pico_de_Orizaba_from_Tlachichuca.jpg?width=800',
  rating = 4.9
WHERE name = 'Pico de Orizaba' AND id_location IS NULL;

UPDATE point_of_interest SET
  id_location = (SELECT id_location FROM location WHERE name='Orizaba' LIMIT 1),
  description = 'Emblemático edificio art nouveau importado de Bélgica, símbolo de Orizaba.',
  image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Palacio_de_Hierro_Orizaba.jpg?width=800',
  rating = 4.6
WHERE name = 'Palacio de Hierro Orizaba' AND id_location IS NULL;

UPDATE point_of_interest SET
  id_location = (SELECT id_location FROM location WHERE name='Fortín de las Flores' LIMIT 1),
  description = 'Jardín con más de 3,000 especies de plantas tropicales y orquídeas.',
  image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Fortin_de_las_Flores_Veracruz.jpg?width=800',
  rating = 4.5
WHERE name = 'Jardín Botánico Fortín' AND id_location IS NULL;

UPDATE point_of_interest SET
  id_location = (SELECT id_location FROM location WHERE name='Córdoba' LIMIT 1),
  description = 'Catedral barroca del siglo XVII en el centro histórico de Córdoba.',
  image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Catedral_de_Cordoba_Veracruz.jpg?width=800',
  rating = 4.5
WHERE name = 'Catedral de Córdoba' AND id_location IS NULL;

UPDATE point_of_interest SET
  id_location = (SELECT id_location FROM location WHERE name='Córdoba' LIMIT 1),
  description = 'Paseo colonial con cafés, tiendas y vida nocturna junto al zócalo.',
  image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/C%C3%B3rdoba_Veracruz_Mexico.jpg?width=800',
  rating = 4.4
WHERE name = 'Los Portales de Córdoba' AND id_location IS NULL;

UPDATE point_of_interest SET
  id_location = (SELECT id_location FROM location WHERE name='Córdoba' LIMIT 1),
  description = 'Área natural protegida con senderos y vistas al valle de Córdoba.',
  image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/C%C3%B3rdoba_Veracruz_Mexico.jpg?width=800',
  rating = 4.3
WHERE name = 'Parque Ecológico Cerro del Metate' AND id_location IS NULL;

UPDATE point_of_interest SET
  id_location = (SELECT id_location FROM location WHERE name='Córdoba' LIMIT 1),
  description = 'Barrio histórico con arquitectura colonial y gastronomía típica cordobesa.',
  image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/C%C3%B3rdoba_Veracruz_Mexico.jpg?width=800',
  rating = 4.2
WHERE name = 'Municipio de La Villa' AND id_location IS NULL;

UPDATE point_of_interest SET
  id_location = (SELECT id_location FROM location WHERE name='Xico' LIMIT 1),
  description = 'Majestuosa cascada de niebla en el corazón del Pueblo Mágico de Xico.',
  image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Cascada_de_Texolo.jpg?width=800',
  rating = 4.9
WHERE name IN ('Cascada de Texolo', 'Cascada de Texolo (Xico)') AND latitude BETWEEN 19.41 AND 19.44 AND id_location IS NULL;

UPDATE point_of_interest SET
  id_location = (SELECT id_location FROM location WHERE name='Xico' LIMIT 1),
  description = 'Santuario histórico dedicado a la patrona de Xico, con procesiones famosas.',
  image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Xico_Veracruz.jpg?width=800',
  rating = 4.6
WHERE name = 'Santuario de María Magdalena' AND id_location IS NULL;

UPDATE point_of_interest SET
  id_location = (SELECT id_location FROM location WHERE name='Xico' LIMIT 1),
  description = 'Mercado artesanal con mole xiqueño, conservas y productos locales únicos.',
  image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Xico_Veracruz.jpg?width=800',
  rating = 4.7
WHERE name = 'Mercado de Xico' AND id_location IS NULL;

UPDATE point_of_interest SET
  id_location = (SELECT id_location FROM location WHERE name='Xico' LIMIT 1),
  description = 'Mirador entre niebla y cafetales con vistas al barranco y la cascada de Texolo.',
  image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Xico_Veracruz.jpg?width=800',
  rating = 4.8
WHERE name = 'Mirador de la Niebla' AND id_location IS NULL;
`,
    },
    {
        name: 'v05_traveler_profile_extra_cols',
        sql: `ALTER TABLE traveler_profile
              ADD COLUMN IF NOT EXISTS dietary_restrictions TEXT,
              ADD COLUMN IF NOT EXISTS has_visited BOOLEAN DEFAULT FALSE,
              ADD COLUMN IF NOT EXISTS has_accessibility BOOLEAN DEFAULT FALSE,
              ADD COLUMN IF NOT EXISTS accessibility_description TEXT;`,
    },
    {
        name: 'v06_user_sessions',
        sql: `CREATE TABLE IF NOT EXISTS user_sessions (
              id          SERIAL PRIMARY KEY,
              user_id     INT NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
              device_hint VARCHAR(200) NULL,
              ip          VARCHAR(50)  NULL,
              created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
              expires_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW() + INTERVAL '24 hours',
              last_seen   TIMESTAMPTZ  NULL,
              revoked     BOOLEAN      NOT NULL DEFAULT FALSE
            );
            CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions (user_id);`,
    },
    {
        name: 'v07_post_reports',
        sql: `CREATE TABLE IF NOT EXISTS post_reports (
              id         SERIAL PRIMARY KEY,
              post_id    INT NOT NULL REFERENCES community_post(id_post) ON DELETE CASCADE,
              user_id    INT NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
              reason     VARCHAR(50) NOT NULL CHECK (reason IN ('spam','inappropriate','false_info','hateful')),
              created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
              resolved   BOOLEAN NOT NULL DEFAULT FALSE,
              UNIQUE (post_id, user_id)
            );
            CREATE INDEX IF NOT EXISTS idx_post_reports_post ON post_reports (post_id);
            CREATE INDEX IF NOT EXISTS idx_post_reports_resolved ON post_reports (resolved, created_at DESC);`,
    },
    {
        name: 'v08_email_verification_otp',
        sql: `ALTER TABLE "user"
              ADD COLUMN IF NOT EXISTS email_verification_otp VARCHAR(255) NULL;`,
    },
    {
        name: 'v09_pending_registration',
        sql: `CREATE TABLE IF NOT EXISTS pending_registration (
              id         SERIAL PRIMARY KEY,
              email      VARCHAR(100) UNIQUE NOT NULL,
              name       VARCHAR(50) NOT NULL,
              password   VARCHAR(255) NOT NULL,
              company_name VARCHAR(100) NOT NULL,
              phone      VARCHAR(20),
              id_sector  INT NOT NULL,
              id_location INT,
              otp_hash   VARCHAR(255) NOT NULL,
              otp_expires TIMESTAMP NOT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );`,
    },
    {
        name: 'v10_login_tokens',
        sql: `CREATE TABLE IF NOT EXISTS login_tokens (
              user_id    INT REFERENCES "user"(user_id) ON DELETE CASCADE,
              token      VARCHAR(100) NOT NULL,
              expires_at TIMESTAMP NOT NULL,
              used       BOOLEAN DEFAULT FALSE
            );`,
    },
    {
        name: 'v11_security_events',
        sql: `CREATE TABLE IF NOT EXISTS security_events (
              id          SERIAL PRIMARY KEY,
              event_type  VARCHAR(100) NOT NULL,
              user_email  VARCHAR(100),
              ip_address  VARCHAR(50),
              severity    VARCHAR(20) DEFAULT 'INFO',
              created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);`,
    },
    {
        name: 'v12_company_status_and_owner',
        sql: `ALTER TABLE company
              ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','active','suspended')),
              ADD COLUMN IF NOT EXISTS owner_user_id INT REFERENCES "user"(user_id) ON DELETE SET NULL;`,
    },
    {
        name: 'v13_user_id_company',
        sql: `ALTER TABLE "user"
              ADD COLUMN IF NOT EXISTS id_company INT REFERENCES company(id_company) ON DELETE SET NULL;`,
    },
    {
        name: 'v14_device_token',
        sql: `CREATE TABLE IF NOT EXISTS device_token (
              id          SERIAL PRIMARY KEY,
              user_id     INT NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
              token       TEXT NOT NULL,
              platform    VARCHAR(10) NOT NULL DEFAULT 'android',
              updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
              UNIQUE (user_id, platform)
            );
            CREATE INDEX IF NOT EXISTS idx_device_token_user ON device_token(user_id);`,
    },
    {
        name: 'v15_refresh_tokens',
        sql: `CREATE TABLE IF NOT EXISTS refresh_tokens (
              id          SERIAL PRIMARY KEY,
              user_id     INT NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
              token_hash  TEXT NOT NULL,
              expires_at  TIMESTAMPTZ NOT NULL,
              revoked     BOOLEAN NOT NULL DEFAULT FALSE
            );
            CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);`,
    },
    {
        name: 'v16_user_interaction_fk',
        sql: `ALTER TABLE user_interaction
              ADD COLUMN IF NOT EXISTS place_kind VARCHAR(10) NOT NULL DEFAULT 'poi'
                CHECK (place_kind IN ('poi','svc'));`,
    },
    {
        name: 'v18_poi_images_verified',
        sql: `
-- URLs verificadas directamente en upload.wikimedia.org (sin doble redirect)
-- Xalapa
UPDATE point_of_interest SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Museo_de_Antropolog%C3%ADa_de_Xalapa.jpg/800px-Museo_de_Antropolog%C3%ADa_de_Xalapa.jpg'
  WHERE name IN ('Agora de la Ciudad Xalapa', 'Museo Interactivo', 'Museo Interactivo de Xalapa',
                 'Parque Macuiltépetl', 'Ex-Hacienda de Toxpan');
UPDATE point_of_interest SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Museo_de_Antropolog%C3%ADa_de_Xalapa.jpg/800px-Museo_de_Antropolog%C3%ADa_de_Xalapa.jpg'
  WHERE name = 'Museo de Antropología de Xalapa';
UPDATE point_of_interest SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/JardinBotanicoFJC.JPG/800px-JardinBotanicoFJC.JPG'
  WHERE name IN ('Jardín Botánico Clavijero', 'Parque Macuiltépetl');
UPDATE point_of_interest SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Ex-Hacienda_%22El_Lencero%22_-_panoramio.jpg/800px-Ex-Hacienda_%22El_Lencero%22_-_panoramio.jpg'
  WHERE name IN ('Ex-Hacienda El Lencero', 'Ex-Hacienda de Toxpan');

-- Coatepec
UPDATE point_of_interest SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Cascada_de_Texolo.jpg/800px-Cascada_de_Texolo.jpg'
  WHERE name = 'Cascada de Texolo' AND latitude BETWEEN 19.44 AND 19.47;
UPDATE point_of_interest SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Iglesia_San_Jer%C3%B3nimo.JPG/800px-Iglesia_San_Jer%C3%B3nimo.JPG'
  WHERE name IN ('Jardín Hidalgo Coatepec', 'Museo del Café Coatepec');

-- Orizaba
UPDATE point_of_interest SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Pico_de_Orizaba%2C_Veracruz..JPG/800px-Pico_de_Orizaba%2C_Veracruz..JPG'
  WHERE name = 'Pico de Orizaba';
UPDATE point_of_interest SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Palacio_de_hierro_de_Orizaba%2C_Veracruz.jpg/800px-Palacio_de_hierro_de_Orizaba%2C_Veracruz.jpg'
  WHERE name IN ('Palacio de Hierro Orizaba', 'Cerro del Borrego Orizaba');
UPDATE point_of_interest SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Catedral_de_Orizaba%2C_Veracruz%2C_Mexico.jpg/800px-Catedral_de_Orizaba%2C_Veracruz%2C_Mexico.jpg'
  WHERE name = 'Catedral de San Miguel Orizaba';
UPDATE point_of_interest SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Vaca_en_Parque_Castillo_en_Orizaba%2C_Veracruz.jpg/800px-Vaca_en_Parque_Castillo_en_Orizaba%2C_Veracruz.jpg'
  WHERE name = 'Parque Apolinar Castillo';
UPDATE point_of_interest SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Puente_de_Metlac_%2829835614172%29.jpg/800px-Puente_de_Metlac_%2829835614172%29.jpg'
  WHERE name = 'Cascada Río Metlac';

-- Fortín de las Flores
UPDATE point_of_interest SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Fort%C3%ADn_de_las_flores%2C_Veracruz.jpg/800px-Fort%C3%ADn_de_las_flores%2C_Veracruz.jpg'
  WHERE name = 'Jardín Botánico Fortín';

-- Córdoba
UPDATE point_of_interest SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Riverwalk_with_Public_Art_-_Cordoba_-_Veracruz_-_Mexico_-_02.jpg/800px-Riverwalk_with_Public_Art_-_Cordoba_-_Veracruz_-_Mexico_-_02.jpg'
  WHERE name IN ('Catedral de Córdoba', 'Los Portales de Córdoba', 'Parque Ecológico Cerro del Metate');
UPDATE point_of_interest SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Street_Scene_-_Cordoba_-_Veracruz_-_Mexico.jpg/800px-Street_Scene_-_Cordoba_-_Veracruz_-_Mexico.jpg'
  WHERE name IN ('Barrio de La Villa', 'Municipio de La Villa', 'Cerro del Borrego Córdoba');

-- Xico
UPDATE point_of_interest SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Cascada_de_Texolo.jpg/800px-Cascada_de_Texolo.jpg'
  WHERE name IN ('Cascada de Texolo', 'Cascada de Texolo (Xico)') AND latitude BETWEEN 19.41 AND 19.44;
UPDATE point_of_interest SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Parroquia_de_Santa_Mar%C3%ADa_Magdalena_Xico_%28Veracruz%29.jpg/800px-Parroquia_de_Santa_Mar%C3%ADa_Magdalena_Xico_%28Veracruz%29.jpg'
  WHERE name IN ('Santuario de María Magdalena', 'Mercado de Artesanías Xico',
                 'Mirador Cafetal La Niebla', 'Mercado de Xico', 'Mirador de la Niebla');
`,
    },
    {
        name: 'v19_poi_images_fullsize',
        sql: `
-- Reemplaza todas las URLs /thumb/ (que dan 400) por URLs full-size verificadas
UPDATE point_of_interest SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/9/97/Museo_de_Antropolog%C3%ADa_de_Xalapa.jpg'
  WHERE name IN ('Agora de la Ciudad Xalapa','Museo Interactivo','Museo Interactivo de Xalapa','Parque Macuiltépetl','Museo de Antropología de Xalapa');

UPDATE point_of_interest SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/8/85/JardinBotanicoFJC.JPG'
  WHERE name = 'Jardín Botánico Clavijero';

UPDATE point_of_interest SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/7/74/Ex-Hacienda_%22El_Lencero%22_-_panoramio.jpg'
  WHERE name IN ('Ex-Hacienda El Lencero','Ex-Hacienda de Toxpan');

UPDATE point_of_interest SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Cascada_de_Texolo.jpg'
  WHERE name = 'Cascada de Texolo' AND latitude BETWEEN 19.44 AND 19.47;

UPDATE point_of_interest SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Iglesia_San_Jer%C3%B3nimo.JPG'
  WHERE name IN ('Jardín Hidalgo Coatepec','Museo del Café Coatepec');

UPDATE point_of_interest SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Pico_de_Orizaba%2C_Veracruz..JPG'
  WHERE name = 'Pico de Orizaba';

UPDATE point_of_interest SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/0/08/Palacio_de_hierro_de_Orizaba%2C_Veracruz.jpg'
  WHERE name IN ('Palacio de Hierro Orizaba','Cerro del Borrego Orizaba');

UPDATE point_of_interest SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/1/1e/Catedral_de_Orizaba%2C_Veracruz%2C_Mexico.jpg'
  WHERE name = 'Catedral de San Miguel Orizaba';

UPDATE point_of_interest SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/6/6a/Vaca_en_Parque_Castillo_en_Orizaba%2C_Veracruz.jpg'
  WHERE name = 'Parque Apolinar Castillo';

UPDATE point_of_interest SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/9/9a/Puente_de_Metlac_%2829835614172%29.jpg'
  WHERE name = 'Cascada Río Metlac';

UPDATE point_of_interest SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/5/51/Fort%C3%ADn_de_las_flores%2C_Veracruz.jpg'
  WHERE name = 'Jardín Botánico Fortín';

UPDATE point_of_interest SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/0/02/Riverwalk_with_Public_Art_-_Cordoba_-_Veracruz_-_Mexico_-_02.jpg'
  WHERE name IN ('Catedral de Córdoba','Los Portales de Córdoba','Parque Ecológico Cerro del Metate','Cerro del Borrego Córdoba');

UPDATE point_of_interest SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Street_Scene_-_Cordoba_-_Veracruz_-_Mexico.jpg'
  WHERE name IN ('Barrio de La Villa','Municipio de La Villa');

UPDATE point_of_interest SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Cascada_de_Texolo.jpg'
  WHERE name IN ('Cascada de Texolo','Cascada de Texolo (Xico)') AND latitude BETWEEN 19.41 AND 19.44;

UPDATE point_of_interest SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/b/b2/Parroquia_de_Santa_Mar%C3%ADa_Magdalena_Xico_%28Veracruz%29.jpg'
  WHERE name IN ('Santuario de María Magdalena','Mercado de Artesanías Xico','Mirador Cafetal La Niebla','Mercado de Xico','Mirador de la Niebla');
`,
    },
    {
        name: 'v17_poi_images_fix',
        sql: `
-- Re-aplica imágenes sin restricción id_location IS NULL (v04 se saltó POIs ya asignados)
UPDATE point_of_interest SET image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Macuiltepetl.jpg?width=800'
  WHERE name = 'Parque Macuiltépetl' AND (image_url IS NULL OR image_url = '');

UPDATE point_of_interest SET image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Museo_de_Antropologia_de_Xalapa.jpg?width=800'
  WHERE name IN ('Museo Interactivo', 'Museo Interactivo de Xalapa') AND (image_url IS NULL OR image_url = '');

UPDATE point_of_interest SET image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Xalapa_Veracruz_Mexico.jpg?width=800'
  WHERE id_location = (SELECT id_location FROM location WHERE name = 'Xalapa' LIMIT 1)
    AND (image_url IS NULL OR image_url = '');

UPDATE point_of_interest SET image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Cascada_de_Texolo.jpg?width=800'
  WHERE name = 'Cascada de Texolo' AND latitude BETWEEN 19.44 AND 19.47 AND (image_url IS NULL OR image_url = '');

UPDATE point_of_interest SET image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Hacienda_el_Lencero_Veracruz_Mexico.jpg?width=800'
  WHERE name = 'Ex-Hacienda de Toxpan' AND (image_url IS NULL OR image_url = '');

UPDATE point_of_interest SET image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Coatepec_Veracruz_Mexico.jpg?width=800'
  WHERE id_location = (SELECT id_location FROM location WHERE name = 'Coatepec' LIMIT 1)
    AND (image_url IS NULL OR image_url = '');

UPDATE point_of_interest SET image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Pico_de_Orizaba_from_Tlachichuca.jpg?width=800'
  WHERE name = 'Pico de Orizaba' AND (image_url IS NULL OR image_url = '');

UPDATE point_of_interest SET image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Palacio_de_Hierro_Orizaba.jpg?width=800'
  WHERE name = 'Palacio de Hierro Orizaba' AND (image_url IS NULL OR image_url = '');

UPDATE point_of_interest SET image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Orizaba_Veracruz_Mexico.jpg?width=800'
  WHERE id_location = (SELECT id_location FROM location WHERE name = 'Orizaba' LIMIT 1)
    AND (image_url IS NULL OR image_url = '');

UPDATE point_of_interest SET image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Fortin_de_las_Flores_Veracruz.jpg?width=800'
  WHERE name = 'Jardín Botánico Fortín' AND (image_url IS NULL OR image_url = '');

UPDATE point_of_interest SET image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Fortin_de_las_Flores_Veracruz.jpg?width=800'
  WHERE id_location = (SELECT id_location FROM location WHERE name = 'Fortín de las Flores' LIMIT 1)
    AND (image_url IS NULL OR image_url = '');

UPDATE point_of_interest SET image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Catedral_de_Cordoba_Veracruz.jpg?width=800'
  WHERE name = 'Catedral de Córdoba' AND (image_url IS NULL OR image_url = '');

UPDATE point_of_interest SET image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/C%C3%B3rdoba_Veracruz_Mexico.jpg?width=800'
  WHERE name IN ('Los Portales de Córdoba', 'Parque Ecológico Cerro del Metate', 'Municipio de La Villa')
    AND (image_url IS NULL OR image_url = '');

UPDATE point_of_interest SET image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/C%C3%B3rdoba_Veracruz_Mexico.jpg?width=800'
  WHERE id_location = (SELECT id_location FROM location WHERE name = 'Córdoba' LIMIT 1)
    AND (image_url IS NULL OR image_url = '');

UPDATE point_of_interest SET image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Cascada_de_Texolo.jpg?width=800'
  WHERE name IN ('Cascada de Texolo', 'Cascada de Texolo (Xico)')
    AND latitude BETWEEN 19.41 AND 19.44 AND (image_url IS NULL OR image_url = '');

UPDATE point_of_interest SET image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Xico_Veracruz.jpg?width=800'
  WHERE name IN ('Santuario de María Magdalena', 'Mercado de Xico', 'Mirador de la Niebla')
    AND (image_url IS NULL OR image_url = '');

UPDATE point_of_interest SET image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Xico_Veracruz.jpg?width=800'
  WHERE id_location = (SELECT id_location FROM location WHERE name = 'Xico' LIMIT 1)
    AND (image_url IS NULL OR image_url = '');
`,
    },
    {
        name: 'v20_evaluation_pdf_url',
        sql: `ALTER TABLE service_evaluation
              ADD COLUMN IF NOT EXISTS pdf_url VARCHAR(1024) NULL;`,
    },
    // ── Sprint 1-6 new tables & columns ────────────────────────────────────────
    {
        name: 'v21_tourist_service_sprint_cols',
        sql: `
ALTER TABLE tourist_service
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active',
    ADD COLUMN IF NOT EXISTS price_from NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS price_to NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'MXN',
    ADD COLUMN IF NOT EXISTS operating_hours JSONB,
    ADD COLUMN IF NOT EXISTS capacity INT,
    ADD COLUMN IF NOT EXISTS duration_minutes INT,
    ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(30);
-- existing services default to active so they remain visible
`,
    },
    {
        name: 'v22_company_status_extended',
        sql: `
-- Drop the old check constraint (if it exists under either name) and re-add extended values
ALTER TABLE company DROP CONSTRAINT IF EXISTS company_status_check;
ALTER TABLE company DROP CONSTRAINT IF EXISTS company_status_check1;
-- Now extend the column and add updated constraint
ALTER TABLE company ALTER COLUMN status TYPE VARCHAR(25);
ALTER TABLE company ALTER COLUMN status SET DEFAULT 'pending_docs';
ALTER TABLE company ADD CONSTRAINT company_status_check
    CHECK (status IN ('pending_docs','documents_submitted','active','rejected','suspended','pending'));
`,
    },
    {
        name: 'v23_user_social_cols',
        sql: `ALTER TABLE "user"
              ADD COLUMN IF NOT EXISTS bio VARCHAR(300),
              ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;`,
    },
    {
        name: 'v24_company_verification',
        sql: `CREATE TABLE IF NOT EXISTS company_verification (
              id_verification SERIAL PRIMARY KEY,
              id_company INT REFERENCES company(id_company) ON DELETE CASCADE,
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
              resubmission_count INT DEFAULT 0,
              UNIQUE(id_company)
            );`,
    },
    {
        name: 'v25_itinerary_tables',
        sql: `
CREATE TABLE IF NOT EXISTS itinerary (
    id_itinerary SERIAL PRIMARY KEY,
    user_id INT REFERENCES "user"(user_id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    cover_image_url VARCHAR(500),
    is_public BOOLEAN DEFAULT false,
    is_certified BOOLEAN DEFAULT false,
    original_itinerary_id INT REFERENCES itinerary(id_itinerary),
    copy_count INT DEFAULT 0,
    view_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS itinerary_stop (
    id_stop SERIAL PRIMARY KEY,
    id_itinerary INT REFERENCES itinerary(id_itinerary) ON DELETE CASCADE,
    place_kind VARCHAR(5) NOT NULL,
    place_id INT NOT NULL,
    stop_order INT NOT NULL,
    visit_date DATE,
    visit_time_start TIME,
    notes TEXT
);
CREATE TABLE IF NOT EXISTS itinerary_like (
    user_id INT REFERENCES "user"(user_id) ON DELETE CASCADE,
    id_itinerary INT REFERENCES itinerary(id_itinerary) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, id_itinerary)
);
`,
    },
    {
        name: 'v26_user_follow',
        sql: `CREATE TABLE IF NOT EXISTS user_follow (
              follower_id INT REFERENCES "user"(user_id) ON DELETE CASCADE,
              following_id INT REFERENCES "user"(user_id) ON DELETE CASCADE,
              created_at TIMESTAMP DEFAULT NOW(),
              UNIQUE(follower_id, following_id)
            );`,
    },
    {
        name: 'v27_booking',
        sql: `CREATE TABLE IF NOT EXISTS booking (
              id_booking SERIAL PRIMARY KEY,
              id_service INT REFERENCES tourist_service(id_service),
              user_id INT REFERENCES "user"(user_id),
              id_itinerary INT REFERENCES itinerary(id_itinerary),
              visit_date DATE NOT NULL,
              visit_time TIME,
              guests INT DEFAULT 1,
              notes TEXT,
              status VARCHAR(20) DEFAULT 'pending',
              is_walkin BOOLEAN DEFAULT false,
              created_at TIMESTAMP DEFAULT NOW(),
              CONSTRAINT booking_status_check CHECK (status IN ('pending','confirmed','cancelled'))
            );
            CREATE INDEX IF NOT EXISTS idx_booking_service ON booking(id_service);
            CREATE INDEX IF NOT EXISTS idx_booking_user ON booking(user_id);`,
    },
    {
        name: 'v28_chat',
        sql: `
CREATE TABLE IF NOT EXISTS conversation (
    id_conversation SERIAL PRIMARY KEY,
    tourist_id INT REFERENCES "user"(user_id) ON DELETE CASCADE,
    id_company INT REFERENCES company(id_company) ON DELETE CASCADE,
    id_service INT REFERENCES tourist_service(id_service) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tourist_id, id_company)
);
CREATE TABLE IF NOT EXISTS message (
    id_message SERIAL PRIMARY KEY,
    id_conversation INT REFERENCES conversation(id_conversation) ON DELETE CASCADE,
    sender_id INT REFERENCES "user"(user_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_message_conversation ON message(id_conversation, created_at);
`,
    },
    {
        name: 'v29_admin_change_log',
        sql: `
CREATE TABLE IF NOT EXISTS admin_change_log (
    id                   SERIAL PRIMARY KEY,
    target_type          VARCHAR(20)  NOT NULL CHECK (target_type IN ('service', 'company', 'user')),
    target_id            INTEGER      NOT NULL,
    admin_id             INTEGER      REFERENCES "user"(user_id) ON DELETE SET NULL,
    id_company           INTEGER      REFERENCES company(id_company) ON DELETE SET NULL,
    changes              JSONB        NOT NULL,
    status               VARCHAR(30)  NOT NULL DEFAULT 'pending_review'
                             CHECK (status IN ('pending_review', 'accepted', 'disputed', 'resolved_admin', 'resolved_empresa')),
    empresa_note         TEXT,
    empresa_counter      JSONB,
    admin_resolution_note TEXT,
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_acl_company   ON admin_change_log(id_company, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_acl_status    ON admin_change_log(status);
`,
    },
    {
        name: 'v30_poi_validation_workflow',
        sql: `
ALTER TABLE point_of_interest
    ADD COLUMN IF NOT EXISTS validation_status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (validation_status IN ('pending_validation', 'active', 'rejected')),
    ADD COLUMN IF NOT EXISTS submitted_by_company_id INT REFERENCES company(id_company) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS reviewed_by_admin_id INT REFERENCES "user"(user_id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS validation_rejection_reason TEXT,
    ADD COLUMN IF NOT EXISTS validation_submitted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_poi_validation_status ON point_of_interest(validation_status);
`,
    },
    {
        name: 'v31_company_verification_certificate',
        sql: `
ALTER TABLE company_verification
    ADD COLUMN IF NOT EXISTS smartur_validation_certificate_url TEXT,
    ADD COLUMN IF NOT EXISTS certificate_issued_at TIMESTAMPTZ;
`,
    },
    {
        name: 'v32_service_activity',
        sql: `
CREATE TABLE IF NOT EXISTS service_activity (
    id_activity     SERIAL PRIMARY KEY,
    id_service      INT NOT NULL REFERENCES tourist_service(id_service) ON DELETE CASCADE,
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    duration_minutes INT,
    price           NUMERIC(10,2),
    max_capacity    INT,
    features        JSONB NOT NULL DEFAULT '[]',
    is_active       BOOL NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_service_activity_service ON service_activity(id_service);

ALTER TABLE itinerary_stop
    ADD COLUMN IF NOT EXISTS id_activity INT REFERENCES service_activity(id_activity) ON DELETE SET NULL;
`,
    },
    {
        name: 'v33_company_faq_bot',
        sql: `
CREATE TABLE IF NOT EXISTS company_faq (
    id_faq         SERIAL PRIMARY KEY,
    id_company     INT NOT NULL REFERENCES company(id_company) ON DELETE CASCADE,
    question       TEXT NOT NULL,
    answer         TEXT NOT NULL,
    search_vector  TSVECTOR GENERATED ALWAYS AS (
        to_tsvector('spanish', coalesce(question, '') || ' ' || coalesce(answer, ''))
    ) STORED,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_company_faq_search  ON company_faq USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_company_faq_company ON company_faq(id_company);

ALTER TABLE message
    ADD COLUMN IF NOT EXISTS is_bot BOOL NOT NULL DEFAULT FALSE;
`,
    },
    {
        name: 'v34_itinerary_global_dates',
        sql: `
ALTER TABLE itinerary
    ADD COLUMN IF NOT EXISTS start_date DATE,
    ADD COLUMN IF NOT EXISTS end_date   DATE;
`,
    },
    {
        name: 'v35_company_certification',
        sql: `ALTER TABLE company
              ADD COLUMN IF NOT EXISTS is_certified BOOLEAN NOT NULL DEFAULT FALSE,
              ADD COLUMN IF NOT EXISTS certified_at TIMESTAMPTZ;`,
    },
    {
        name: 'v36_tourist_service_lat_lon_pending_default',
        sql: `
ALTER TABLE tourist_service
    ADD COLUMN IF NOT EXISTS latitude  DECIMAL(10,6),
    ADD COLUMN IF NOT EXISTS longitude DECIMAL(10,6);
-- Ensure newly created services default to pending_review (not active)
ALTER TABLE tourist_service ALTER COLUMN status SET DEFAULT 'pending_review';
`,
    },
    {
        name: 'v37_app_config',
        sql: `CREATE TABLE IF NOT EXISTS app_config (
              key        VARCHAR(100) PRIMARY KEY,
              value      TEXT NOT NULL,
              updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );
          INSERT INTO app_config (key, value)
          VALUES ('evaluation_min_score', '7')
          ON CONFLICT (key) DO NOTHING;`,
    },
    {
        // Enlaza refresh_tokens con user_sessions para que revocar una sesión
        // desde "Sesiones activas" corte el acceso real (antes solo marcaba
        // una bandera cosmética en user_sessions sin afectar refresh_tokens).
        name: 'v38_refresh_token_session_link',
        sql: `
ALTER TABLE refresh_tokens
    ADD COLUMN IF NOT EXISTS session_id INT REFERENCES user_sessions(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_session ON refresh_tokens(session_id);
`,
    },
    {
        // Distingue cuentas creadas vía Google/Facebook de las locales, para
        // poder mostrar un mensaje claro si intentan entrar con contraseña.
        name: 'v39_user_auth_provider',
        sql: `
ALTER TABLE "user"
    ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) NOT NULL DEFAULT 'local';
`,
    },
    {
        // Login por QR: la web genera un reto, el móvil (ya logueado) lo
        // aprueba escaneándolo, y la web canjea el reto por una sesión real.
        name: 'v40_qr_login_sessions',
        sql: `
CREATE TABLE IF NOT EXISTS qr_login_sessions (
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
CREATE INDEX IF NOT EXISTS idx_qr_login_sessions_status ON qr_login_sessions(status, expires_at);
`,
    },
    {
        // K-fold cross-validation de CF/RF/GBM, complementa el train/test
        // split que ya guarda ml_model_metrics.
        name: 'v41_ml_cross_validation_metrics',
        sql: `
CREATE TABLE IF NOT EXISTS ml_cross_validation_metrics (
    id         SERIAL PRIMARY KEY,
    cv_json    JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`,
    },
];

export async function runMigrations() {
    try {
        // Create migrations tracking table (idempotent)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS _schema_migrations (
                name VARCHAR(255) PRIMARY KEY,
                applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `);

        for (const migration of MIGRATIONS) {
            const check = await pool.query(
                `SELECT 1 FROM _schema_migrations WHERE name = $1`,
                [migration.name],
            );
            if (check.rowCount > 0) continue; // already applied

            console.log(`[migration] applying ${migration.name}…`);
            await pool.query(migration.sql);
            await pool.query(
                `INSERT INTO _schema_migrations (name) VALUES ($1) ON CONFLICT DO NOTHING`,
                [migration.name],
            );
            console.log(`[migration] ${migration.name} ✓`);
        }
    } catch (err) {
        console.error('[migration] ERROR — some migrations failed:', err.message);
        // Do not crash the server; partial migration is better than no startup.
    }
}
