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
