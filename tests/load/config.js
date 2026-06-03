// Configuración compartida para todos los tests de carga
//
// Uso:
//   k6 run smoke.js \
//     -e BASE_URL=https://app.smartur.online \
//     -e ACCESS_TOKEN=eyJ... \
//     -e USER_ID=42 \
//     -e REFRESH_TOKEN=abc...

export const BASE_URL = (__ENV.BASE_URL || 'https://app.smartur.online').replace(/\/$/, '');
export const API      = `${BASE_URL}/api/v2`;

// Credenciales pre-obtenidas: haz login manual UNA vez y pasa el token como env var
export const ACCESS_TOKEN   = __ENV.ACCESS_TOKEN  || '';
export const USER_ID        = __ENV.USER_ID       || '';
export const REFRESH_TOKEN  = __ENV.REFRESH_TOKEN || '';

// Thresholds compartidos — el test FALLA si se superan
export const THRESHOLDS = {
    // 95% de requests deben completarse en menos de 3 segundos
    http_req_duration: ['p(95)<3000'],
    // Menos del 5% de requests con error
    http_req_failed: ['rate<0.05'],
    // Latencia de recomendaciones ML (puede ser lenta — threshold más holgado)
    'http_req_duration{endpoint:recommend}': ['p(95)<12000'],
};

export const HEADERS = (token) => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token || ACCESS_TOKEN}`,
});
