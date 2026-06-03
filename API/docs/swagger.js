import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'
import dotenv from 'dotenv'

dotenv.config()

const PORT = process.env.PORT || 3000

const secured = [{ bearerAuth: [] }]

function op({ tag, summary, permission, auth = false, body = null, params = [] }) {
    const operation = {
        tags: [tag],
        summary,
        description: `Permisos: ${permission}`,
        responses: {
            200: { description: 'OK' },
            400: { description: 'Solicitud inválida' },
            401: { description: 'No autenticado' },
            403: { description: 'Sin permisos' },
            500: { description: 'Error interno del servidor' },
        },
    }

    if (auth) operation.security = secured
    if (params.length) operation.parameters = params
    if (body) operation.requestBody = body
    return operation
}

const jsonBody = {
    required: true,
    content: {
        'application/json': {
            schema: { type: 'object' },
        },
    },
}

const preferencesBody = {
    required: true,
    content: {
        'application/json': {
            schema: { $ref: '#/components/schemas/TravelerPreferencesRequest' },
        },
    },
}

const multipartAvatarBody = {
    required: true,
    content: {
        'multipart/form-data': {
            schema: {
                type: 'object',
                properties: {
                    avatar: { type: 'string', format: 'binary' },
                },
                required: ['avatar'],
            },
        },
    },
}

const communityPostMultipartBody = {
    required: true,
    content: {
        'multipart/form-data': {
            schema: {
                type: 'object',
                required: ['place_kind', 'place_id'],
                properties: {
                    caption: { type: 'string', description: 'Texto (obligatorio si no hay foto)' },
                    place_kind: { type: 'string', enum: ['svc', 'poi'] },
                    place_id: { type: 'string', description: 'ID numérico del lugar' },
                    photo: { type: 'string', format: 'binary', description: 'Imagen opcional' },
                },
            },
        },
    },
}

const multipartImageBody = {
    required: true,
    content: {
        'multipart/form-data': {
            schema: {
                type: 'object',
                properties: {
                    image: { type: 'string', format: 'binary' },
                },
            },
        },
    },
}

const idParam = (name, description = 'ID del recurso') => ({
    in: 'path',
    name,
    required: true,
    schema: { type: 'string' },
    description,
})

const emailParam = {
    in: 'path',
    name: 'email',
    required: true,
    schema: { type: 'string', format: 'email' },
    description: 'Correo del usuario',
}

const paths = {
    '/health': {
        get: op({ tag: 'Infraestructura', summary: 'Health check', permission: 'Público' }),
    },
    '/api/v2/login': {
        post: op({
            tag: 'Auth',
            summary: 'Login paso 1 (genera OTP)',
            permission: 'Público',
            body: {
                ...jsonBody,
                content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
            },
        }),
    },
    '/api/v2/two-factor': {
        post: op({ tag: 'Auth', summary: 'Login paso 2 (valida OTP)', permission: 'Público', body: jsonBody }),
    },
    '/api/v2/forgot': {
        post: op({ tag: 'Auth', summary: 'Solicita token de recuperación', permission: 'Público', body: jsonBody }),
    },
    '/api/v2/reset': {
        post: op({ tag: 'Auth', summary: 'Restablece contraseña', permission: 'Público', body: jsonBody }),
    },
    '/api/v2/register': {
        post: op({
            tag: 'Auth',
            summary: 'Registro público de usuario',
            permission: 'Público',
            body: {
                ...jsonBody,
                content: {
                    'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } },
                },
            },
        }),
    },
    '/api/v2/google-login': {
        post: op({ tag: 'Auth', summary: 'Login con Google', permission: 'Público', body: jsonBody }),
    },
    '/api/v2/users/register': {
        post: op({ tag: 'Users', summary: 'Registro público alterno', permission: 'Público', body: jsonBody }),
    },
    '/api/v2/users': {
        get: op({ tag: 'Users', summary: 'Listar usuarios', permission: 'Admin', auth: true }),
    },
    '/api/v2/users/': {
        post: op({ tag: 'Users', summary: 'Crear usuario', permission: 'Admin', auth: true, body: jsonBody }),
    },
    '/api/v2/users/{id}': {
        get: op({
            tag: 'Users',
            summary: 'Obtener usuario por ID',
            permission: 'Owner o Admin',
            auth: true,
            params: [idParam('id', 'ID del usuario')],
        }),
        patch: op({
            tag: 'Users',
            summary: 'Actualizar usuario',
            permission: 'Owner o Admin',
            auth: true,
            params: [idParam('id', 'ID del usuario')],
            body: jsonBody,
        }),
        delete: op({
            tag: 'Users',
            summary: 'Desactivar usuario (borrado lógico)',
            permission: 'Admin',
            auth: true,
            params: [idParam('id', 'ID del usuario')],
        }),
    },
    '/api/v2/users/email/{email}': {
        get: op({
            tag: 'Users',
            summary: 'Buscar usuario por email',
            permission: 'Admin',
            auth: true,
            params: [emailParam],
        }),
    },
    '/api/v2/users/{id}/avatar': {
        post: op({
            tag: 'Users',
            summary: 'Subir avatar de usuario',
            permission: 'Owner o Admin',
            auth: true,
            params: [idParam('id', 'ID del usuario')],
            body: multipartAvatarBody,
        }),
    },
    '/api/v2/companies': {
        get: op({ tag: 'Companies', summary: 'Listar empresas', permission: 'Autenticado', auth: true }),
        post: op({ tag: 'Companies', summary: 'Crear empresa', permission: 'Admin', auth: true, body: jsonBody }),
    },
    '/api/v2/companies/{id}': {
        get: op({ tag: 'Companies', summary: 'Obtener empresa por ID', permission: 'Autenticado', auth: true, params: [idParam('id')] }),
        patch: op({ tag: 'Companies', summary: 'Actualizar empresa', permission: 'Admin', auth: true, params: [idParam('id')], body: jsonBody }),
        delete: op({ tag: 'Companies', summary: 'Desactivar empresa (borrado lógico)', permission: 'Admin', auth: true, params: [idParam('id')] }),
    },
    '/api/v2/locations': {
        get: op({ tag: 'Locations', summary: 'Listar ubicaciones', permission: 'Autenticado', auth: true }),
        post: op({ tag: 'Locations', summary: 'Crear ubicación', permission: 'Admin', auth: true, body: jsonBody }),
    },
    '/api/v2/locations/{id}': {
        get: op({ tag: 'Locations', summary: 'Obtener ubicación por ID', permission: 'Autenticado', auth: true, params: [idParam('id')] }),
        patch: op({ tag: 'Locations', summary: 'Actualizar ubicación', permission: 'Admin', auth: true, params: [idParam('id')], body: jsonBody }),
        delete: op({ tag: 'Locations', summary: 'Desactivar ubicación (borrado lógico)', permission: 'Admin', auth: true, params: [idParam('id')] }),
    },
    '/api/v2/tourist-services': {
        get: op({ tag: 'Tourist Services', summary: 'Listar servicios turísticos', permission: 'Autenticado', auth: true }),
        post: op({ tag: 'Tourist Services', summary: 'Crear servicio turístico', permission: 'Admin', auth: true, body: multipartImageBody }),
    },
    '/api/v2/tourist-services/{id}': {
        get: op({ tag: 'Tourist Services', summary: 'Obtener servicio turístico por ID', permission: 'Autenticado', auth: true, params: [idParam('id')] }),
        patch: op({ tag: 'Tourist Services', summary: 'Actualizar servicio turístico', permission: 'Admin', auth: true, params: [idParam('id')], body: multipartImageBody }),
        delete: op({ tag: 'Tourist Services', summary: 'Desactivar servicio turístico (borrado lógico)', permission: 'Admin', auth: true, params: [idParam('id')] }),
    },
    '/api/v2/tourist_activities': {
        get: op({ tag: 'Tourist Activities', summary: 'Listar actividades turísticas', permission: 'Autenticado', auth: true }),
    },
    '/api/v2/tourist_activities/{id_activity}': {
        get: op({ tag: 'Tourist Activities', summary: 'Obtener actividad por ID', permission: 'Autenticado', auth: true, params: [idParam('id_activity')] }),
    },
    '/api/v2/tourist_activities/register': {
        post: op({ tag: 'Tourist Activities', summary: 'Crear actividad', permission: 'Admin', auth: true, body: jsonBody }),
    },
    '/api/v2/tourist_activities/update/{id_activity}': {
        patch: op({ tag: 'Tourist Activities', summary: 'Actualizar actividad', permission: 'Admin', auth: true, params: [idParam('id_activity')], body: jsonBody }),
    },
    '/api/v2/tourist_activities/delete/{id_activity}': {
        delete: op({ tag: 'Tourist Activities', summary: 'Desactivar actividad (borrado lógico)', permission: 'Admin', auth: true, params: [idParam('id_activity')] }),
    },
    '/api/v2/templates': {
        get: op({ tag: 'Evaluation Templates', summary: 'Listar plantillas', permission: 'Autenticado', auth: true }),
    },
    '/api/v2/templates/{id_template}': {
        get: op({ tag: 'Evaluation Templates', summary: 'Obtener plantilla por ID', permission: 'Autenticado', auth: true, params: [idParam('id_template')] }),
    },
    '/api/v2/templates/register': {
        post: op({ tag: 'Evaluation Templates', summary: 'Crear plantilla', permission: 'Admin', auth: true, body: jsonBody }),
    },
    '/api/v2/templates/update/{id_template}': {
        patch: op({ tag: 'Evaluation Templates', summary: 'Actualizar plantilla', permission: 'Admin', auth: true, params: [idParam('id_template')], body: jsonBody }),
    },
    '/api/v2/templates/delete/{id_template}': {
        delete: op({ tag: 'Evaluation Templates', summary: 'Desactivar plantilla (borrado lógico)', permission: 'Admin', auth: true, params: [idParam('id_template')] }),
    },
    '/api/v2/criterion/': {
        get: op({ tag: 'Criterion', summary: 'Listar criterios', permission: 'Autenticado', auth: true }),
    },
    '/api/v2/criterion/{id_criterion}': {
        get: op({ tag: 'Criterion', summary: 'Obtener criterio por ID', permission: 'Autenticado', auth: true, params: [idParam('id_criterion')] }),
    },
    '/api/v2/criterion/register': {
        post: op({ tag: 'Criterion', summary: 'Crear criterio', permission: 'Admin', auth: true, body: jsonBody }),
    },
    '/api/v2/criterion/update/{id_criterion}': {
        patch: op({ tag: 'Criterion', summary: 'Actualizar criterio', permission: 'Admin', auth: true, params: [idParam('id_criterion')], body: jsonBody }),
    },
    '/api/v2/criterion/delete/{id_criterion}': {
        delete: op({ tag: 'Criterion', summary: 'Desactivar criterio (borrado lógico)', permission: 'Admin', auth: true, params: [idParam('id_criterion')] }),
    },
    '/api/v2/service-evaluation': {
        get: op({ tag: 'Service Evaluation', summary: 'Listar evaluaciones de servicio', permission: 'Autenticado', auth: true }),
    },
    '/api/v2/service-evaluation/{id_evaluation}': {
        get: op({ tag: 'Service Evaluation', summary: 'Obtener evaluación por ID', permission: 'Autenticado', auth: true, params: [idParam('id_evaluation')] }),
    },
    '/api/v2/service-evaluation/register': {
        post: op({ tag: 'Service Evaluation', summary: 'Crear evaluación', permission: 'Admin', auth: true, body: jsonBody }),
    },
    '/api/v2/service-evaluation/update/{id_evaluation}': {
        patch: op({ tag: 'Service Evaluation', summary: 'Actualizar evaluación', permission: 'Admin', auth: true, params: [idParam('id_evaluation')], body: jsonBody }),
    },
    '/api/v2/service-evaluation/status/{id_evaluation}': {
        patch: op({ tag: 'Service Evaluation', summary: 'Actualizar status de evaluación', permission: 'Admin', auth: true, params: [idParam('id_evaluation')], body: jsonBody }),
    },
    '/api/v2/service-evaluation/delete/{id_evaluation}': {
        delete: op({ tag: 'Service Evaluation', summary: 'Desactivar evaluación (borrado lógico)', permission: 'Admin', auth: true, params: [idParam('id_evaluation')] }),
    },
    '/api/v2/evaluation-detail': {
        get: op({ tag: 'Evaluation Detail', summary: 'Listar detalles de evaluación', permission: 'Autenticado', auth: true }),
    },
    '/api/v2/evaluation-detail/{id_detail}': {
        get: op({ tag: 'Evaluation Detail', summary: 'Obtener detalle por ID', permission: 'Autenticado', auth: true, params: [idParam('id_detail')] }),
    },
    '/api/v2/evaluation-detail/evaluation/{id_evaluation}': {
        get: op({ tag: 'Evaluation Detail', summary: 'Listar detalles por evaluación', permission: 'Autenticado', auth: true, params: [idParam('id_evaluation')] }),
    },
    '/api/v2/evaluation-detail/register': {
        post: op({ tag: 'Evaluation Detail', summary: 'Crear detalle de evaluación', permission: 'Admin', auth: true, body: jsonBody }),
    },
    '/api/v2/evaluation-detail/update/{id_detail}': {
        patch: op({ tag: 'Evaluation Detail', summary: 'Actualizar detalle de evaluación', permission: 'Admin', auth: true, params: [idParam('id_detail')], body: jsonBody }),
    },
    '/api/v2/evaluation-detail/delete/{id_detail}': {
        delete: op({ tag: 'Evaluation Detail', summary: 'Desactivar detalle de evaluación (borrado lógico)', permission: 'Admin', auth: true, params: [idParam('id_detail')] }),
    },
    '/api/v2/service-certifications': {
        get: op({ tag: 'Service Certification', summary: 'Listar certificaciones', permission: 'Autenticado', auth: true }),
    },
    '/api/v2/service-certifications/{id_certification}': {
        get: op({ tag: 'Service Certification', summary: 'Obtener certificación por ID', permission: 'Autenticado', auth: true, params: [idParam('id_certification')] }),
    },
    '/api/v2/service-certifications/service/{id_service}': {
        get: op({ tag: 'Service Certification', summary: 'Listar certificaciones por servicio', permission: 'Autenticado', auth: true, params: [idParam('id_service')] }),
    },
    '/api/v2/service-certifications/type/{certification_type}': {
        get: op({ tag: 'Service Certification', summary: 'Listar certificaciones por tipo', permission: 'Autenticado', auth: true, params: [idParam('certification_type', 'Tipo de certificación')] }),
    },
    '/api/v2/service-certifications/status/{status}': {
        get: op({ tag: 'Service Certification', summary: 'Listar certificaciones por estado', permission: 'Autenticado', auth: true, params: [idParam('status', 'Estado de certificación')] }),
    },
    '/api/v2/service-certifications/register': {
        post: op({ tag: 'Service Certification', summary: 'Crear certificación', permission: 'Admin', auth: true, body: jsonBody }),
    },
    '/api/v2/service-certifications/update/{id_certification}': {
        patch: op({ tag: 'Service Certification', summary: 'Actualizar certificación', permission: 'Admin', auth: true, params: [idParam('id_certification')], body: jsonBody }),
    },
    '/api/v2/service-certifications/status/{id_certification}': {
        patch: op({ tag: 'Service Certification', summary: 'Actualizar estado de certificación', permission: 'Admin', auth: true, params: [idParam('id_certification')], body: jsonBody }),
    },
    '/api/v2/service-certifications/delete/{id_certification}': {
        delete: op({ tag: 'Service Certification', summary: 'Desactivar certificación (borrado lógico)', permission: 'Admin', auth: true, params: [idParam('id_certification')] }),
    },
    '/api/v2/points-of-interest': {
        get: op({ tag: 'Points of Interest', summary: 'Listar puntos de interés', permission: 'Autenticado', auth: true }),
    },
    '/api/v2/points-of-interest/{id_point}': {
        get: op({ tag: 'Points of Interest', summary: 'Obtener punto de interés por ID', permission: 'Autenticado', auth: true, params: [idParam('id_point')] }),
    },
    '/api/v2/points-of-interest/register': {
        post: op({ tag: 'Points of Interest', summary: 'Crear punto de interés', permission: 'Admin', auth: true, body: multipartImageBody }),
    },
    '/api/v2/points-of-interest/update/{id_point}': {
        patch: op({ tag: 'Points of Interest', summary: 'Actualizar punto de interés', permission: 'Admin', auth: true, params: [idParam('id_point')], body: multipartImageBody }),
    },
    '/api/v2/points-of-interest/delete/{id_point}': {
        delete: op({ tag: 'Points of Interest', summary: 'Desactivar punto de interés (borrado lógico)', permission: 'Admin', auth: true, params: [idParam('id_point')] }),
    },
    '/api/v2/profiles/me': {
        get: op({ tag: 'Traveler Profiles', summary: 'Obtener perfil del usuario autenticado', permission: 'Autenticado', auth: true }),
    },
    '/api/v2/profiles': {
        get: op({ tag: 'Traveler Profiles', summary: 'Listar perfiles de viajero', permission: 'Admin', auth: true }),
    },
    '/api/v2/profiles/{id_profile}': {
        get: op({ tag: 'Traveler Profiles', summary: 'Obtener perfil por ID', permission: 'Autenticado', auth: true, params: [idParam('id_profile')] }),
    },
    '/api/v2/profiles/register': {
        post: op({ tag: 'Traveler Profiles', summary: 'Crear perfil de viajero', permission: 'Autenticado', auth: true, body: jsonBody }),
    },
    '/api/v2/profiles/update/{id_profile}': {
        patch: op({ tag: 'Traveler Profiles', summary: 'Actualizar perfil de viajero', permission: 'Autenticado', auth: true, params: [idParam('id_profile')], body: jsonBody }),
    },
    '/api/v2/profiles/delete/{id_profile}': {
        delete: op({ tag: 'Traveler Profiles', summary: 'Desactivar perfil de viajero (borrado lógico)', permission: 'Admin', auth: true, params: [idParam('id_profile')] }),
    },
    '/api/v2/profiles/preferences': {
        post: op({
            tag: 'Traveler Profiles',
            summary: 'Guardar preferencias de viajero',
            permission: 'Autenticado',
            auth: true,
            body: preferencesBody,
        }),
    },
    '/api/v2/tourism-expenditures': {
        get: op({ tag: 'Tourism Expenditure', summary: 'Listar gastos turísticos', permission: 'Autenticado', auth: true }),
    },
    '/api/v2/tourism-expenditures/{id_expenditure}': {
        get: op({ tag: 'Tourism Expenditure', summary: 'Obtener gasto turístico por ID', permission: 'Autenticado', auth: true, params: [idParam('id_expenditure')] }),
    },
    '/api/v2/tourism-expenditures/register': {
        post: op({ tag: 'Tourism Expenditure', summary: 'Crear gasto turístico', permission: 'Admin', auth: true, body: jsonBody }),
    },
    '/api/v2/tourism-employment': {
        get: op({ tag: 'Tourism Employment', summary: 'Listar empleos turísticos', permission: 'Autenticado', auth: true }),
    },
    '/api/v2/tourism-employment/{id_employment}': {
        get: op({ tag: 'Tourism Employment', summary: 'Obtener empleo turístico por ID', permission: 'Autenticado', auth: true, params: [idParam('id_employment')] }),
    },
    '/api/v2/tourism-employment/register': {
        post: op({ tag: 'Tourism Employment', summary: 'Crear empleo turístico', permission: 'Admin', auth: true, body: jsonBody }),
    },
    '/api/v2/tourism-inputs': {
        get: op({ tag: 'Tourism Inputs', summary: 'Listar insumos turísticos', permission: 'Autenticado', auth: true }),
    },
    '/api/v2/tourism-inputs/{id_input}': {
        get: op({ tag: 'Tourism Inputs', summary: 'Obtener insumo turístico por ID', permission: 'Autenticado', auth: true, params: [idParam('id_input')] }),
    },
    '/api/v2/tourism-inputs/register': {
        post: op({ tag: 'Tourism Inputs', summary: 'Crear insumo turístico', permission: 'Admin', auth: true, body: jsonBody }),
    },
    '/api/v2/security/events': {
        get: op({ tag: 'Security', summary: 'Consultar eventos de seguridad', permission: 'Admin', auth: true }),
    },
    '/api/v2/me/favorites': {
        get: op({ tag: 'User Content', summary: 'Listar favoritos del usuario', permission: 'Autenticado', auth: true }),
        post: op({ tag: 'User Content', summary: 'Agregar favorito', permission: 'Autenticado', auth: true, body: jsonBody }),
    },
    '/api/v2/me/favorites/{kind}/{placeId}': {
        delete: op({ tag: 'User Content', summary: 'Desactivar favorito (borrado lógico)', permission: 'Autenticado', auth: true, params: [idParam('kind', "Tipo de lugar: 'svc' o 'poi'"), idParam('placeId', 'ID del lugar')] }),
    },
    '/api/v2/me/visits': {
        get: op({ tag: 'User Content', summary: 'Listar historial de visitas', permission: 'Autenticado', auth: true }),
        post: op({ tag: 'User Content', summary: 'Registrar visita', permission: 'Autenticado', auth: true, body: jsonBody }),
    },
    '/api/v2/community/posts': {
        get: op({ tag: 'User Content', summary: 'Listar publicaciones de comunidad', permission: 'Público' }),
        post: op({
            tag: 'User Content',
            summary: 'Crear publicación (multipart: lugar obligatorio, texto y/o foto)',
            permission: 'Autenticado',
            auth: true,
            body: communityPostMultipartBody,
        }),
    },
    '/api/v2/community/posts/{postId}': {
        delete: op({ tag: 'User Content', summary: 'Eliminar publicación propia', permission: 'Autenticado', auth: true, params: [idParam('postId', 'ID de la publicación')] }),
    },
    '/api/v2/community/posts/{postId}/admin': {
        delete: op({ tag: 'User Content', summary: 'Eliminar publicación (admin)', permission: 'Admin', auth: true, params: [idParam('postId', 'ID de la publicación')] }),
    },
    '/api/v2/community/posts/{postId}/report': {
        post: op({ tag: 'User Content', summary: 'Reportar publicación', permission: 'Autenticado', auth: true, params: [idParam('postId', 'ID de la publicación')], body: jsonBody }),
    },
    '/api/v2/community/reports': {
        get: op({ tag: 'User Content', summary: 'Listar reportes de comunidad', permission: 'Admin', auth: true }),
    },
    '/api/v2/community/reports/{reportId}/resolve': {
        patch: op({ tag: 'User Content', summary: 'Resolver reporte de comunidad', permission: 'Admin', auth: true, params: [idParam('reportId', 'ID del reporte')], body: jsonBody }),
    },

    // ── Dashboard ──
    '/api/v2/dashboard/stats': {
        get: op({ tag: 'Dashboard', summary: 'Estadísticas del dashboard', permission: 'Autenticado', auth: true }),
    },

    // ── Explore ──
    '/api/v2/explore/home': {
        get: op({ tag: 'Explore', summary: 'Feed de inicio (POIs + servicios cercanos)', permission: 'Autenticado', auth: true }),
    },

    // ── Sesiones ──
    '/api/v2/me/ping': {
        get: op({ tag: 'Sessions', summary: 'Verificar token activo', permission: 'Autenticado', auth: true }),
    },
    '/api/v2/me/sessions': {
        get: op({ tag: 'Sessions', summary: 'Listar sesiones del usuario autenticado', permission: 'Autenticado', auth: true }),
    },
    '/api/v2/me/sessions/{id}': {
        delete: op({ tag: 'Sessions', summary: 'Revocar sesión por ID', permission: 'Autenticado', auth: true, params: [idParam('id', 'ID de la sesión')] }),
    },
    '/api/v2/users/{id}/sessions': {
        get: op({ tag: 'Sessions', summary: 'Listar sesiones de un usuario (admin)', permission: 'Admin', auth: true, params: [idParam('id', 'ID del usuario')] }),
    },
    '/api/v2/users/{id}/recommendations': {
        get: op({ tag: 'Sessions', summary: 'Historial de recomendaciones de un usuario (admin)', permission: 'Admin', auth: true, params: [idParam('id', 'ID del usuario')] }),
    },

    // ── Interactions & Ratings ──
    '/api/v2/me/interactions': {
        post: op({ tag: 'Interactions & Ratings', summary: 'Registrar interacciones implícitas (batch)', permission: 'Autenticado', auth: true, body: jsonBody }),
    },
    '/api/v2/me/rating': {
        post: op({ tag: 'Interactions & Ratings', summary: 'Registrar rating explícito (1-5 estrellas)', permission: 'Autenticado', auth: true, body: jsonBody }),
    },
    '/api/v2/me/rating/{kind}/{placeId}': {
        get: op({ tag: 'Interactions & Ratings', summary: 'Obtener rating del usuario para un lugar', permission: 'Autenticado', auth: true, params: [idParam('kind', "Tipo de lugar: 'poi' o 'svc'"), idParam('placeId', 'ID del lugar')] }),
    },

    // ── ML / Recomendaciones ──
    '/api/v2/ml/health': {
        get: op({ tag: 'ML / Recommendations', summary: 'Estado y métricas del motor ML', permission: 'Autenticado', auth: true }),
    },
    '/api/v2/ml/model-status': {
        get: op({ tag: 'ML / Recommendations', summary: 'Estado detallado del modelo entrenado', permission: 'Autenticado', auth: true }),
    },
    '/api/v2/ml/train': {
        post: op({ tag: 'ML / Recommendations', summary: 'Forzar reentrenamiento del modelo', permission: 'Admin', auth: true }),
    },
    '/api/v2/ml/recommend/{userId}': {
        post: op({ tag: 'ML / Recommendations', summary: 'Obtener recomendaciones personalizadas', permission: 'Autenticado', auth: true, params: [idParam('userId', 'ID del usuario')], body: jsonBody }),
    },
    '/api/v2/ml/feedback': {
        post: op({ tag: 'ML / Recommendations', summary: 'Registrar feedback de recomendación (clic/skip)', permission: 'Autenticado', auth: true, body: jsonBody }),
    },
    '/api/v2/ml/sessions/me': {
        get: op({ tag: 'ML / Recommendations', summary: 'Historial de sesiones ML del usuario autenticado', permission: 'Autenticado', auth: true }),
    },
    '/api/v2/ml/scheduler-config': {
        get: op({ tag: 'ML / Recommendations', summary: 'Obtener configuración del scheduler de reentrenamiento', permission: 'Admin', auth: true }),
        put: op({ tag: 'ML / Recommendations', summary: 'Actualizar configuración del scheduler', permission: 'Admin', auth: true, body: jsonBody }),
    },

    // ── Subcriteria ──
    '/api/v2/subcriteria/criterion/{id_criterion}': {
        get: op({ tag: 'Subcriteria', summary: 'Listar subcriterios de un criterio', permission: 'Autenticado', auth: true, params: [idParam('id_criterion')] }),
    },
    '/api/v2/subcriteria': {
        post: op({ tag: 'Subcriteria', summary: 'Crear subcriterio', permission: 'Admin', auth: true, body: jsonBody }),
    },
    '/api/v2/subcriteria/{id_subcriterion}': {
        patch: op({ tag: 'Subcriteria', summary: 'Actualizar subcriterio', permission: 'Admin', auth: true, params: [idParam('id_subcriterion')], body: jsonBody }),
        delete: op({ tag: 'Subcriteria', summary: 'Eliminar subcriterio', permission: 'Admin', auth: true, params: [idParam('id_subcriterion')] }),
    },
    '/api/v2/subcriteria/criterion/{id_criterion}/batch': {
        put: op({ tag: 'Subcriteria', summary: 'Reemplazar subcriterios de un criterio (batch)', permission: 'Admin', auth: true, params: [idParam('id_criterion')], body: jsonBody }),
    },

    // ── Evaluation Templates (rubric) ──
    '/api/v2/templates/{id_template}/rubric': {
        get: op({ tag: 'Evaluation Templates', summary: 'Obtener rúbrica completa de plantilla', permission: 'Autenticado', auth: true, params: [idParam('id_template')] }),
    },

    // ── Service Evaluation (batch) ──
    '/api/v2/service-evaluation/batch-register': {
        post: op({ tag: 'Service Evaluation', summary: 'Registro en lote de evaluaciones', permission: 'Admin', auth: true, body: jsonBody }),
    },

    // ── Empresa B2B ──
    '/api/v2/auth/register-empresa': {
        post: op({ tag: 'Empresa B2B', summary: 'Registro público de empresa turística', permission: 'Público', body: jsonBody }),
    },
    '/api/v2/empresa/profile': {
        get:   op({ tag: 'Empresa B2B', summary: 'Obtener perfil de la empresa autenticada', permission: 'Empresa', auth: true }),
        patch: op({ tag: 'Empresa B2B', summary: 'Actualizar perfil de la empresa', permission: 'Empresa', auth: true, body: jsonBody }),
    },
    '/api/v2/empresa/services': {
        get: op({ tag: 'Empresa B2B', summary: 'Listar servicios de la empresa', permission: 'Empresa', auth: true }),
    },
    '/api/v2/empresa/analytics': {
        get: op({ tag: 'Empresa B2B', summary: 'Métricas y KPIs del dashboard empresa', permission: 'Empresa', auth: true }),
    },

    // ── Push Notifications (FCM) ──
    '/api/v2/me/device-token': {
        post: op({ tag: 'Push Notifications', summary: 'Registrar o actualizar token FCM del dispositivo', permission: 'Autenticado', auth: true, body: jsonBody }),
    },
    '/api/v2/admin/notifications/send': {
        post: op({ tag: 'Push Notifications', summary: 'Enviar notificación push (a todos, a usuario o a empresa)', permission: 'Admin', auth: true, body: jsonBody }),
    },

    // ── ML: sesiones por usuario (admin) ──
    '/api/v2/ml/sessions/user/{userId}': {
        get: op({ tag: 'ML / Recommendations', summary: 'Métricas IA de un usuario específico (CTR, latencia, sesiones)', permission: 'Admin', auth: true, params: [idParam('userId', 'ID del usuario')] }),
    },
    '/api/v2/ml/model-status': {
        get: op({ tag: 'ML / Recommendations', summary: 'Estado en tiempo real de cada sub-modelo ML', permission: 'Autenticado', auth: true }),
    },
}

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API SMARTUR',
            version: '1.0.0',
            description: 'Documentación de la API REST para SMARTUR - Sistema de Gestión Turística',
            contact: {
                name: 'SMARTUR API Support',
            },
        },
        servers: [
            {
                url: '/',
                description: 'Mismo host (desarrollo y producción)',
            },
            {
                url: 'https://smartur.online',
                description: 'Producción — dominio HTTPS',
            },
            {
                url: 'http://2.24.112.25:4000',
                description: 'Producción — VPS directo',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'integer',
                            description: 'ID del usuario',
                        },
                        name: {
                            type: 'string',
                            description: 'Nombre del usuario',
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'Correo electrónico del usuario',
                        },
                        role_id: {
                            type: 'integer',
                            description: 'ID del rol (1: Admin, 2: Usuario)',
                        },
                        registered_at: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Fecha de registro',
                        },
                    },
                },
                Admin: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'integer',
                            description: 'ID del administrador',
                        },
                        name: {
                            type: 'string',
                            description: 'Nombre del administrador',
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'Correo electrónico del administrador',
                        },
                        role_id: {
                            type: 'integer',
                            description: 'ID del rol (1: Admin)',
                        },
                        registered_at: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Fecha de registro',
                        },
                    },
                },
                LoginRequest: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'Correo electrónico',
                        },
                        password: {
                            type: 'string',
                            format: 'password',
                            description: 'Contraseña',
                        },
                    },
                },
                TravelerPreferencesRequest: {
                    type: 'object',
                    description:
                        'Campos del perfil viajero. Opcional: birth_date (YYYY-MM-DD) se guarda en user; age/age_range siguen en traveler_profile.',
                    properties: {
                        birth_date: {
                            type: 'string',
                            format: 'date',
                            nullable: true,
                            description: 'Fecha de nacimiento (ISO). null borra el valor en usuario.',
                        },
                        age: { type: 'integer' },
                        age_range: { type: 'string' },
                        gender: { type: 'string' },
                        interests: { type: 'array', items: { type: 'string' } },
                        activity_level: { type: 'integer' },
                        preferred_place: { type: 'string' },
                        travel_type: { type: 'string' },
                        has_accessibility: { type: 'boolean' },
                        accessibility_detail: { type: 'string', nullable: true },
                        has_visited_before: { type: 'boolean' },
                        restrictions: { type: 'string', nullable: true },
                        sustainable_preferences: { type: 'boolean' },
                    },
                },
                RegisterRequest: {
                    type: 'object',
                    required: ['name', 'email', 'password'],
                    properties: {
                        name: {
                            type: 'string',
                            description: 'Nombre completo',
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'Correo electrónico',
                        },
                        password: {
                            type: 'string',
                            format: 'password',
                            description: 'Contraseña',
                        },
                        role_id: {
                            type: 'integer',
                            description: 'ID del rol (opcional)',
                        },
                    },
                },
                Error: {
                    type: 'object',
                    properties: {
                        message: {
                            type: 'string',
                            description: 'Mensaje de error',
                        },
                        error: {
                            type: 'string',
                            description: 'Detalle del error',
                        },
                    },
                },
                Success: {
                    type: 'object',
                    properties: {
                        message: {
                            type: 'string',
                            description: 'Mensaje de éxito',
                        },
                    },
                },
            },
        },
        paths,
        tags: [
            { name: 'Infraestructura', description: 'Estado del servicio y utilidades internas' },
            { name: 'Auth', description: 'Autenticación, login 2FA y recuperación de contraseña' },
            { name: 'Users', description: 'Gestión de usuarios (owner/admin) y avatar' },
            { name: 'Companies', description: 'Empresas turísticas' },
            { name: 'Locations', description: 'Ubicaciones y georreferencia' },
            { name: 'Tourist Services', description: 'Servicios turísticos (incluye image_url)' },
            { name: 'Tourist Activities', description: 'Actividades turísticas' },
            { name: 'Evaluation Templates', description: 'Plantillas de evaluación' },
            { name: 'Criterion', description: 'Criterios de evaluación' },
            { name: 'Service Evaluation', description: 'Evaluaciones de servicio' },
            { name: 'Evaluation Detail', description: 'Detalle de evaluaciones' },
            { name: 'Service Certification', description: 'Certificaciones de servicio' },
            { name: 'Points of Interest', description: 'Puntos de interés (incluye image_url)' },
            { name: 'Traveler Profiles', description: 'Perfiles y preferencias de viajero' },
            { name: 'Tourism Expenditure', description: 'Gasto turístico' },
            { name: 'Tourism Employment', description: 'Empleo turístico' },
            { name: 'Tourism Inputs', description: 'Insumos turísticos' },
            { name: 'Security', description: 'Eventos de seguridad y auditoría' },
            { name: 'User Content', description: 'Favoritos, visitas, comunidad y reportes' },
            { name: 'Dashboard', description: 'Estadísticas y métricas del dashboard admin' },
            { name: 'Explore', description: 'Feed de inicio y descubrimiento de lugares' },
            { name: 'Sessions', description: 'Gestión de sesiones activas y tokens JWT' },
            { name: 'Interactions & Ratings', description: 'Interacciones implícitas y calificaciones de lugares' },
            { name: 'ML / Recommendations', description: 'Motor de IA: recomendaciones, feedback, estado y scheduler' },
            { name: 'Empresa B2B', description: 'Portal de empresas turísticas — registro, perfil, servicios y analytics' },
            { name: 'Push Notifications', description: 'Notificaciones push FCM — registro de tokens y envío desde admin' },
            { name: 'Subcriteria', description: 'Subcriterios de evaluación' },
        ],
    },
    apis: ['./routes/*.js', './controllers/*.js'],
}

const swaggerSpec = swaggerJsdoc(options)

export { swaggerSpec, swaggerUi }

