BEGIN;

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
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES role(role_id)
);

INSERT INTO "user" (name, email, password, role_id) VALUES ('admin', 'admin@gmail.com', 'admin', 1);

CREATE TABLE company_options (
  id SERIAL PRIMARY KEY,
  name VARCHAR(20) UNIQUE NOT NULL
);

INSERT INTO company_options (name) VALUES ('solo'), ('couple'), ('family'), ('friends');

CREATE TABLE space_options (
  id SERIAL PRIMARY KEY,
  name VARCHAR(20) UNIQUE NOT NULL
);
INSERT INTO space_options (name) VALUES ('open'), ('closed');

CREATE TABLE activity_level_options (
  id SERIAL PRIMARY KEY,
  name VARCHAR(20) UNIQUE NOT NULL
);
INSERT INTO activity_level_options (name) VALUES ('relaxed'), ('moderate'), ('intense');

CREATE TABLE form (
  form_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  age INT,
  daily_budget DECIMAL(10,2),
  travel_days INT,
  company INT REFERENCES company_options(id),
  disability BOOLEAN,
  space INT REFERENCES space_options(id),
  activity_level INT REFERENCES activity_level_options(id),
  wants_accommodation BOOLEAN,
  wants_food BOOLEAN,
  wants_transport BOOLEAN,
  interested_events BOOLEAN,
  accessibility_level VARCHAR(50),
  visited_region BOOLEAN,
  accepts_notifications BOOLEAN,
  response_date TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES "user"(user_id)
);

CREATE TABLE tourism_type (
  type_id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL
);

CREATE TABLE form_type (
  form_id INT NOT NULL,
  type_id INT NOT NULL,
  PRIMARY KEY (form_id, type_id),
  FOREIGN KEY (form_id) REFERENCES form(form_id),
  FOREIGN KEY (type_id) REFERENCES tourism_type(type_id)
);

CREATE TABLE zone (
  zone_id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE category (
  category_id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE accessibility_options (
  id SERIAL PRIMARY KEY,
  name VARCHAR(10) UNIQUE NOT NULL
);
INSERT INTO accessibility_options (name) VALUES ('low'), ('medium'), ('high');

CREATE TABLE service (
  service_id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  address VARCHAR(255),
  lat DECIMAL(10,6),
  lng DECIMAL(10,6),
  category_id INT NOT NULL,
  zone_id INT NOT NULL,
  validated BOOLEAN,
  contact VARCHAR(100),
  image_url VARCHAR(255),
  accessibility INT REFERENCES accessibility_options(id),
  FOREIGN KEY (category_id) REFERENCES category(category_id),
  FOREIGN KEY (zone_id) REFERENCES zone(zone_id)
);

CREATE TABLE recommendation (
  recommendation_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  form_id INT NOT NULL,
  generated_at TIMESTAMP,
  total_score DECIMAL(5,2),
  FOREIGN KEY (user_id) REFERENCES "user"(user_id),
  FOREIGN KEY (form_id) REFERENCES form(form_id)
);

CREATE TABLE recommendation_service (
  recommendation_id INT NOT NULL,
  service_id INT NOT NULL,
  PRIMARY KEY (recommendation_id, service_id),
  FOREIGN KEY (recommendation_id) REFERENCES recommendation(recommendation_id),
  FOREIGN KEY (service_id) REFERENCES service(service_id)
);

CREATE TABLE service_review (
  review_id SERIAL PRIMARY KEY,
  service_id INT NOT NULL,
  attention INT,
  security INT,
  accessibility INT,
  quality INT,
  validated_by VARCHAR(100),
  review_date TIMESTAMP,
  notes TEXT,
  FOREIGN KEY (service_id) REFERENCES service(service_id)
);

CREATE TABLE history (
  history_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  recommendation_id INT NOT NULL,
  date TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES "user"(user_id),
  FOREIGN KEY (recommendation_id) REFERENCES recommendation(recommendation_id)
);

CREATE TABLE itinerary_type_options (
  id SERIAL PRIMARY KEY,
  name VARCHAR(10) UNIQUE NOT NULL
);
INSERT INTO itinerary_type_options (name) VALUES ('pdf'), ('image');

CREATE TABLE itinerary (
  itinerary_id SERIAL PRIMARY KEY,
  recommendation_id INT NOT NULL,
  type INT REFERENCES itinerary_type_options(id),
  file_url VARCHAR(255),
  date TIMESTAMP,
  FOREIGN KEY (recommendation_id) REFERENCES recommendation(recommendation_id)
);

CREATE TABLE notification (
  notification_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(100),
  body TEXT,
  read BOOLEAN,
  sent_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES "user"(user_id)
);

COMMIT;
