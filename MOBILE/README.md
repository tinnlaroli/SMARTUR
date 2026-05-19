# Smartur Mobile

Cliente Flutter para **Smartur**: exploración de destinos turísticos, perfil de viajero, diario (favoritos y visitas), comunidad y autenticación frente al API REST del backend.

Este documento describe la estructura del repositorio, el flujo de la aplicación, la configuración del entorno y las dependencias principales.

---

## Requisitos

- Flutter SDK compatible con `environment.sdk: ^3.11.1` (ver `pubspec.yaml`).
- Dispositivo o emulador Android o iOS.
- Backend Smartur accesible desde la red del dispositivo (misma LAN o URL pública).
- **PowerShell** en Windows para los scripts de ayuda (`run_dev.ps1`, `build_release.ps1`).

---

## Inicio rápido

1. Clonar el repositorio e instalar dependencias:

   ```bash
   flutter pub get
   ```

2. Crear el archivo `.env` a partir de `.env.example` (o configurar manualmente) y rellenar los valores (ver sección [Configuración](#configuración)).

3. Generar localizaciones si se modifican los `.arb`:

   ```bash
   flutter gen-l10n
   ```

4. Ejecutar la aplicación con el script de desarrollo (lee automáticamente `.env`):

   ```powershell
   .\run_dev.ps1                    # dispositivo por defecto
   .\run_dev.ps1 -Device "emulator" # dispositivo específico
   ```

   O de forma manual:

   ```bash
   flutter run --dart-define=API_BASE_URL_DEV=http://192.168.1.94:4000/api/v2
   ```

5. Generar un release (APK o App Bundle):

   ```powershell
   .\build_release.ps1              # APK por defecto
   .\build_release.ps1 -Target aab  # App Bundle
   ```

6. Análisis estático recomendado antes de commits:

   ```bash
   flutter analyze
   ```

---

## Scripts de ayuda

| Script | Descripción |
|--------|-------------|
| `run_dev.ps1` | Lee `.env`, traduce cada `KEY=VALUE` a `--dart-define` y ejecuta `flutter run`. Acepta `-Device` para elegir dispositivo. |
| `build_release.ps1` | Igual que `run_dev.ps1` pero ejecuta `flutter build <target> --release`. Acepta `-Target` (`apk`, `appbundle` o `aab`). |

Ambos scripts **requieren** un archivo `.env` en la raíz del proyecto con pares `KEY=VALUE` válidos.

---

## Configuración

### Variables de entorno y dart-define

La base del API y otras claves se inyectan mediante **`--dart-define`** (o a través de los scripts `.ps1` que leen el `.env`). Los valores por defecto están en `lib/core/constants/env_config.dart`:

| Variable | Archivo | Uso |
|----------|---------|-----|
| `API_BASE_URL_DEV` | `env_config.dart` | URL base del API. Valor por defecto: `https://api-smartur.fly.dev/api/v2`. |
| `GOOGLE_SERVER_CLIENT_ID` | `env_config.dart` | Server Client ID de Google Sign-In (OAuth). Sin valor por defecto. |
| `OPENWEATHER_API_KEY` | `env_config.dart` | Clave para datos meteorológicos. Sin valor por defecto. |

`lib/core/constants/api_constants.dart` expone `baseUrl` leyendo `EnvConfig.apiBaseUrl` y concatena rutas relativas para cada recurso.

### Archivo `.env`

```dotenv
API_BASE_URL=https://api-smartur.fly.dev/api/v2
API_BASE_URL_DEV=http://192.168.1.94:4000/api/v2
GOOGLE_SERVER_CLIENT_ID=tu-client-id.apps.googleusercontent.com
# OPENWEATHER_API_KEY=tu-api-key
```

### Internacionalización (i18n)

- **Idiomas soportados**: Español (es, plantilla), Inglés (en), Francés (fr), Portugués (pt).
- Archivos fuente: `lib/l10n/app_*.arb` (configuración en `l10n.yaml`).
- Código generado: `lib/l10n/app_localizations*.dart` (no editar a mano; regenerar con `flutter gen-l10n`).

### Activos

Rutas declaradas en `pubspec.yaml` bajo `flutter.assets`:

| Carpeta | Contenido |
|---------|-----------|
| `assets/imgs/` | Imágenes (logo, fondos, etc.). |
| `assets/lottie/` | Animaciones Lottie (IA, mapa, montaña, avión de papel). |
| `assets/svg/` | Gráficos vectoriales (fondo, destino, IA, mapa). |
| `assets/fonts/` | Fuentes personalizadas: **CalSans** (títulos) y **Outfit** (cuerpo). |

---

## Arquitectura y organización del código

El proyecto combina una **separación por capas** (`core`, `data`, `presentation`) con **agrupación por funcionalidad** dentro de `presentation/screens`. No usa un contenedor de inyección de dependencias global: los servicios se instancian donde se necesitan (por ejemplo `AuthService()`).

### Principios

- **core**: utilidades transversales sin acoplar la UI a un feature concreto (tema, constantes, ajustes globales, validadores).
- **data**: modelos serializables y servicios HTTP que hablan con el backend.
- **presentation**: widgets de pantalla y componentes reutilizables; el estado suele ser local (`StatefulWidget`) o persistido vía `SharedPreferences` / `FlutterSecureStorage` según el caso.

### Árbol de carpetas (`lib/`)

```text
lib/
├── main.dart                         # Punto de entrada: splash, sesión, tema, localización
├── core/
│   ├── constants/
│   │   ├── api_constants.dart        # Rutas del API (auth, profiles, explore, etc.)
│   │   ├── env_config.dart           # Variables de entorno vía --dart-define
│   │   └── avatar_icon_map.dart      # Mapa de iconos de avatar predefinidos
│   ├── theme/
│   │   └── style_guide.dart          # Colores (purple, pink, blue, green, orange), tipografía, spacing
│   ├── utils/
│   │   ├── notifications.dart        # Helpers para toasts (Toastification)
│   │   └── profile_photo_validation.dart  # Validación de fotos de perfil
│   └── settings/
│       ├── app_settings.dart         # AppSettingsNotifier: tema e idioma
│       └── app_settings_scope.dart   # InheritedWidget para propagar settings
├── data/
│   ├── models/
│   │   ├── onboarding_model.dart     # Modelo de páginas del onboarding
│   │   ├── place_model.dart          # Modelo de lugar/destino turístico
│   │   └── traveler_profile_model.dart  # Perfil de viajero
│   └── services/
│       ├── auth_service.dart         # Login, registro, Google Sign-In, JWT, 2FA
│       ├── profile_service.dart      # Perfil de usuario, avatar, preferencias
│       ├── explore_service.dart      # Ciudades, lugares, servicios turísticos, puntos de interés
│       └── user_content_service.dart # Favoritos, visitas, publicaciones de comunidad
├── presentation/
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── onboarding_screen.dart   # Pantallas de bienvenida inicial
│   │   │   └── welcome_screen.dart      # Login, registro, OTP, Google, reset de contraseña
│   │   ├── main/
│   │   │   ├── main_screen.dart         # Shell con BottomNavigationBar (4 tabs)
│   │   │   ├── home_screen.dart         # Inicio: ciudades, exploración, recomendaciones IA
│   │   │   ├── diary_screen.dart        # Diario: favoritos y visitas del usuario
│   │   │   ├── community_screen.dart    # Comunidad: publicaciones de usuarios
│   │   │   ├── profile_screen.dart      # Perfil del usuario
│   │   │   └── edit_profile_avatar_screen.dart  # Edición de foto/icono de avatar
│   │   ├── explore/
│   │   │   ├── map_screen.dart          # Mapa interactivo (flutter_map)
│   │   │   ├── detail_view_page.dart    # Vista detalle de un lugar
│   │   │   └── recommendation_screen.dart  # Recomendaciones de IA
│   │   ├── preferences/
│   │   │   ├── preferences_screen.dart  # Pantalla contenedora del wizard
│   │   │   ├── step1_personal_screen.dart   # Paso 1: datos personales (año de nacimiento, género, país)
│   │   │   ├── step2_interests_screen.dart  # Paso 2: intereses del viajero
│   │   │   └── step3_extra_screen.dart      # Paso 3: preferencias adicionales
│   │   └── settings/
│   │       └── settings_screen.dart     # Ajustes de cuenta, tema, idioma, biometría
│   ├── utils/
│   │   └── diary_place_detail.dart      # Utilidades para detalle de lugar en diario
│   └── widgets/
│       ├── smartur_background.dart      # Widget de fondo animado/degradado
│       ├── smartur_loader.dart          # Loader animado de la app (SVG + Lottie)
│       ├── smartur_skeleton.dart        # Skeleton/placeholder durante cargas
│       ├── smartur_user_avatar.dart     # Avatar circular del usuario
│       └── terms_and_conditions_modal.dart  # Modal de términos y condiciones
└── l10n/                               # ARB (es, en, fr, pt) + generados AppLocalizations
```

### Carpetas raíz adicionales

| Carpeta / Archivo | Rol |
|-------------------|-----|
| `android/`, `ios/` | Proyectos nativos; permisos de cámara/galería y configuración de firma. |
| `assets/` | Recursos estáticos referenciados en `pubspec.yaml`. |
| `run_dev.ps1` | Script PowerShell para ejecutar en desarrollo con variables de `.env`. |
| `build_release.ps1` | Script PowerShell para generar APK o App Bundle de release. |
| `l10n.yaml` | Configuración de generación de localizaciones. |
| `analysis_options.yaml` | Reglas de linting de Flutter. |

### Convención aplicada

Las pantallas del área **Perfil** (pestaña principal y edición de foto/icono) residen en `presentation/screens/main/` para mantener cohesión con `profile_screen.dart` y evitar una carpeta `profile/` con un solo archivo.

---

## Endpoints del API

Definidos en `lib/core/constants/api_constants.dart`:

| Grupo | Ruta | Uso |
|-------|------|-----|
| **Auth** | `/users/register` | Registro de usuario |
| | `/login` | Inicio de sesión |
| | `/two-factor` | Verificación en dos pasos |
| | `/forgot` | Solicitar recuperación de contraseña |
| | `/reset` | Restablecer contraseña |
| **Users** | `/users` | Gestión de usuarios |
| **Profiles** | `/profiles/preferences` | Preferencias del viajero |
| | `/profiles/me` | Perfil del usuario autenticado |
| **Diario** | `/me/favorites` | Favoritos del usuario |
| | `/me/visits` | Visitas del usuario |
| **Comunidad** | `/community/posts` | Publicaciones de la comunidad |
| **Exploración** | `/explore/home` | Página de inicio de exploración |
| | `/locations` | Ubicaciones/ciudades |
| | `/tourist-services` | Servicios turísticos |
| | `/points-of-interest` | Puntos de interés |

---

## Flujos principales

### 1. Arranque y sesión (`main.dart`)

1. `WidgetsFlutterBinding.ensureInitialized()`.
2. Lectura de `onboarding_seen` en `SharedPreferences`.
3. Carga de `AppSettingsNotifier` (tema y locale persistidos).
4. `_SplashGate`: comprueba token y expiración vía `AuthService.hasSession()`.
5. Destino:
   - Sin onboarding visto → `OnboardingScreen`.
   - Onboarding visto y sin sesión → `WelcomeScreen`.
   - Sesión válida → `MainScreen` con nombre de usuario opcional.
6. Si el usuario ya había visto el onboarding, se muestra `SmartURLoader` como overlay hasta finalizar la animación.

### 2. Autenticación (`auth_service.dart`, pantallas en `auth/`)

- Registro, login, recuperación de contraseña, verificación en dos pasos (2FA).
- Token JWT almacenado con `flutter_secure_storage`.
- Google Sign-In inicializado con `EnvConfig.googleServerClientId`.
- Perfil y avatar: lectura/actualización de usuario, subida multipart de imagen con tipo MIME (`http_parser`).

### 3. Contenedor principal (`main_screen.dart`)

- Cinco pestañas unificadas: **Inicio**, **Diario**, **IA (Recomendaciones)**, **Comunidad** y **Perfil**.
- **Animaciones Premium**:
  - **IA**: Destello elástico con efecto de rotación tipo "varita mágica".
  - **Diario**: Transición de glifo suave (libro cerrado a abierto).
  - **Comunidad**: Acercamiento social (reducción de padding).
  - **Perfil**: Flip 3D (giro sobre eje vertical).
  - **Inicio**: Giro de brújula 360°.
- **Haptic Feedback**: Soporte táctil (`lightImpact`) en cada interacción de la barra.

### 4. IA y Recomendaciones (`explore/`)

- **Recomendaciones IA** (`recommendation_screen.dart`): Ahora integrada como pestaña central del menú principal para acceso rápido a sugerencias inteligentes.
- Datos servidos por `explore_service.dart`.

### 5. Diario y comunidad (`user_content_service.dart`)

- **Favoritos y visitas**: Bajo rutas `meFavorites` / `meVisits`.
- **Comunidad**: 
  - Gestión de publicaciones bajo `communityPosts`.
  - **Borrado Lógico**: Soporte para eliminar posts propios (`DELETE` endpoint) con ocultación inmediata en la UI y persistencia en base de datos vía `is_active`.

### 6. Preferencias del viajero (`preferences/`)

Flujo wizard de 3 pasos posterior al registro o accesible desde perfil/ajustes:

1. **Paso 1 — Datos personales**: año de nacimiento, género, país de origen.
2. **Paso 2 — Intereses**: categorías de turismo preferidas.
3. **Paso 3 — Extras**: preferencias adicionales de accesibilidad y estilo de viaje.

Persiste vía `profile_service.dart` / API de perfiles.

### 7. Ajustes globales (`settings/`, `AppSettings`)

- Tema claro/oscuro e idioma propagados con `AppSettingsScope` (InheritedWidget) y `ValueListenableBuilder` en `main.dart`.
- Autenticación biométrica opcional (`local_auth`).

---

## Paleta de colores y tipografía

Definidos en `lib/core/theme/style_guide.dart`:

| Token | Color | Uso |
|-------|-------|-----|
| `purple` | `#984EFD` | Color primario / seed del tema |
| `pink` | `#FC478E` | Color secundario / acentos |
| `blue` | `#4DB9CA` | Complementario |
| `green` | `#9CCC44` | Complementario |
| `orange` | `#FF7D1F` | Complementario |

**Fuentes**: *CalSans* (títulos y encabezados) · *Outfit* (cuerpo de texto y formularios).

El tema se genera con `ColorScheme.fromSeed()` (Material 3) soportando claro y oscuro.

---

## Dependencias principales (`pubspec.yaml`)

| Paquete | Función |
|---------|---------|
| `http`, `http_parser` | Cliente HTTP y tipos MIME para multipart. |
| `flutter_secure_storage` | Almacenamiento seguro del JWT. |
| `shared_preferences` | Flags y preferencias no sensibles (p. ej. onboarding, tema). |
| `google_sign_in` | Inicio de sesión con Google. |
| `local_auth` (+ `local_auth_android`) | Autenticación biométrica opcional. |
| `flutter_map`, `latlong2` | Mapas interactivos y coordenadas. |
| `image_picker` | Selección de imagen para avatar. |
| `lottie`, `flutter_svg` | Animaciones y gráficos vectoriales. |
| `toastification` | Notificaciones tipo toast. |
| `intl`, `flutter_localizations` | Fechas, formatos e i18n oficial de Flutter. |
| `flutter_staggered_grid_view` | Grids con celdas de tamaño variable. |

**Desarrollo**: `flutter_lints`, `flutter_launcher_icons`, `flutter_test`.

---

## Extensión y buenas prácticas

- **Nuevos endpoints**: añadir constantes en `api_constants.dart` y métodos en el servicio correspondiente bajo `lib/data/services/`.
- **Textos visibles**: claves en `lib/l10n/app_*.arb` y regenerar con `flutter gen-l10n`.
- **Estilo visual**: tokens en `lib/core/theme/style_guide.dart`.
- **Tras cambios estructurales**: ejecutar `flutter analyze` y probar los flujos de login, home y perfil.

---

## Licencia y proyecto

Proyecto **SMARTUR** (2026). Consulte los términos del repositorio o del equipo de producto para uso y distribución.
