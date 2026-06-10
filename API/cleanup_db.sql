-- ============================================================
-- SMARTUR — Script de limpieza para pruebas
-- Deja únicamente: admin + datos de referencia estáticos
-- (roles, locations, tourism_types, tourism_sectors, POIs)
-- ============================================================

BEGIN;

-- 1. Limpiar tablas transaccionales de contenido de usuario
DELETE FROM post_reports;
DELETE FROM community_post;
DELETE FROM user_favorite;
DELETE FROM user_visit;
DELETE FROM user_rating;
DELETE FROM user_interaction;
DELETE FROM user_follow;
DELETE FROM itinerary_like;

-- 2. Limpiar itinerarios y paradas
DELETE FROM itinerary_stop;
DELETE FROM itinerary;

-- 3. Limpiar reservas y mensajes
DELETE FROM message;
DELETE FROM conversation;
DELETE FROM booking;

-- 4. Limpiar evaluaciones de servicios
DELETE FROM evaluation_detail;
DELETE FROM service_evaluation;
DELETE FROM service_certification;

-- 5. Limpiar servicios turísticos
DELETE FROM tourist_service;

-- 6. Limpiar datos estadísticos de empresas
DELETE FROM tourist_activities;
DELETE FROM tourism_employment;
DELETE FROM tourism_inputs;

-- 7. Limpiar KYC (reviewer_id apunta a user sin CASCADE → NULL primero)
UPDATE company_verification SET reviewer_id = NULL;
DELETE FROM company_verification;

-- 8. Nullear FK circular antes de borrar
--    company.owner_user_id → user (sin ON DELETE definido)
UPDATE company SET owner_user_id = NULL;
--    user.id_company → company (ON DELETE SET NULL, pero por si acaso)
UPDATE "user" SET id_company = NULL WHERE role_id != 1;

-- 9. Borrar empresas
DELETE FROM company;

-- 10. Limpiar ML
DELETE FROM ml_recommendation_feedback;
DELETE FROM ml_recommendation_item;
DELETE FROM ml_recommendation_session;
DELETE FROM ml_model_metrics;

-- 11. Limpiar tokens y sesiones
DELETE FROM user_sessions;
DELETE FROM device_token;
DELETE FROM refresh_tokens;
DELETE FROM login_tokens;
DELETE FROM password_reset_tokens;
DELETE FROM pending_registration;

-- 12. Limpiar auditoría y contacto
DELETE FROM security_events;
DELETE FROM contact_subscription;

-- 13. Borrar todos los usuarios excepto el admin
DELETE FROM "user" WHERE role_id != 1;

-- ============================================================
-- Reiniciar secuencias para que el próximo test empiece limpio
-- ============================================================

SELECT setval('company_id_company_seq',                   1, false);
SELECT setval('company_verification_id_verification_seq', 1, false);
SELECT setval('tourist_service_id_service_seq',           1, false);
SELECT setval('service_evaluation_id_evaluation_seq',     1, false);
SELECT setval('evaluation_detail_id_detail_seq',          1, false);
SELECT setval('service_certification_id_certification_seq', 1, false);
SELECT setval('tourist_activities_id_activity_seq',       1, false);
SELECT setval('tourism_employment_id_employment_seq',     1, false);
SELECT setval('tourism_inputs_id_input_seq',              1, false);
SELECT setval('itinerary_id_itinerary_seq',               1, false);
SELECT setval('itinerary_stop_id_stop_seq',               1, false);
SELECT setval('booking_id_booking_seq',                   1, false);
SELECT setval('conversation_id_conversation_seq',         1, false);
SELECT setval('message_id_message_seq',                   1, false);
SELECT setval('community_post_id_post_seq',               1, false);
SELECT setval('user_favorite_id_seq',                     1, false);
SELECT setval('user_visit_id_seq',                        1, false);
SELECT setval('user_rating_id_seq',                       1, false);
SELECT setval('user_interaction_id_seq',                  1, false);
SELECT setval('ml_recommendation_session_id_seq',         1, false);
SELECT setval('ml_recommendation_item_id_seq',            1, false);
SELECT setval('ml_recommendation_feedback_id_seq',        1, false);
SELECT setval('ml_model_metrics_id_seq',                  1, false);
SELECT setval('refresh_tokens_id_seq',                    1, false);
SELECT setval('user_sessions_id_seq',                     1, false);
SELECT setval('device_token_id_seq',                      1, false);
SELECT setval('password_reset_tokens_id_seq',             1, false);
SELECT setval('pending_registration_id_seq',              1, false);
SELECT setval('security_events_id_seq',                   1, false);
SELECT setval('contact_subscription_id_seq',              1, false);
-- El user_id del admin (user_id=1) se mantiene; la próxima inserción tomará 2
-- (no reseteamos user_id_seq para no colisionar con el admin existente)

COMMIT;

-- ============================================================
-- Verificar resultado
-- ============================================================
SELECT 'Usuarios' AS tabla, COUNT(*) AS filas FROM "user"
UNION ALL SELECT 'Empresas',      COUNT(*) FROM company
UNION ALL SELECT 'Servicios',     COUNT(*) FROM tourist_service
UNION ALL SELECT 'Itinerarios',   COUNT(*) FROM itinerary
UNION ALL SELECT 'Tokens',        COUNT(*) FROM refresh_tokens
UNION ALL SELECT 'POIs',          COUNT(*) FROM point_of_interest
ORDER BY tabla;
