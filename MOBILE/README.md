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
   .\build_release.ps1              # APK por defecto (sin firma release)
   .\build_release.ps1 -Target aab  # App Bundle (sin firma release)
   ```

   Para generar un release **firmado con el keystore de producción**:

   ```powershell
   .\builrelease.ps1 -KeyAlias upload -KeyPassword Smartur -StorePassword Smartur
   ```

   El APK firmado queda en `build\app\outputs\flutter-apk\app-release.apk`  
   El AAB firmado queda en `build\app\outputs\bundle\release\app-release.aab`

6. Análisis estático recomendado antes de commits:

   ```bash
   flutter analyze
   ```

---

## Scripts de ayuda

| Script | Descripción |
|--------|-------------|
| `run_dev.ps1` | Lee `.env`, traduce cada `KEY=VALUE` a `--dart-define` y ejecuta `flutter run`. Acepta `-Device` para elegir dispositivo. |
| `build_release.ps1` | Igual que `run_dev.ps1` pero ejecuta `flutter build <target> --release`. Acepta `-Target` (`apk`, `appbundle` o `aab`). Sin firma release. |
| `builrelease.ps1` | Build de producción firmado. Exporta las variables del keystore, corre `flutter clean → pub get → build apk → build appbundle`. Acepta `-KeyAlias`, `-KeyPassword`, `-StorePassword`, `-KeystorePath`. Si no se pasan, los solicita interactivamente. |

`run_dev.ps1` y `build_release.ps1` **requieren** un archivo `.env` en la raíz del proyecto con pares `KEY=VALUE` válidos.

`builrelease.ps1` usa el keystore en `android/app/smartur-release.jks` con alias `upload`.

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

> Nota (2026-07): se depuraron pantallas/widgets huérfanos de iteraciones previas (`community_screen.dart`, `diary_screen.dart`, `map_screen.dart`, `recommendation_screen.dart`, `genre_picker_screen.dart`, `image_export_service.dart`, kit de widgets `Welltur*` duplicado, `smartur_tab_fade_stack.dart`) — su funcionalidad ya vive en las pantallas listadas abajo. Ver [design.md § 13](../design.md#13-app-móvil-flutter--design-system) para el sistema de diseño Welltur vigente.

```text
lib/
├── main.dart                         # Punto de entrada: splash, sesión, tema, localización
├── core/
│   ├── constants/
│   │   ├── api_constants.dart        # Rutas del API (auth, profiles, explore, chat, etc.)
│   │   ├── env_config.dart           # Variables de entorno vía --dart-define
│   │   └── avatar_icon_map.dart      # Mapa de iconos de avatar predefinidos
│   ├── theme/
│   │   ├── style_guide.dart          # Colores (purple, pink, blue, green, orange), tipografía, spacing
│   │   ├── smartur_theme_extensions.dart
│   │   ├── welltur_theme.dart        # Tema alterno "Welltur" (bienestar) — tiñe los widgets Smartur
│   │   └── welltur_theme_extensions.dart
│   ├── motion/                       # smartur_motion.dart, smartur_routes.dart, welltur_motion/routes
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
│   │   ├── chat_model.dart           # Conversation / ChatMessage
│   │   └── traveler_profile_model.dart  # Perfil de viajero
│   └── services/
│       ├── auth_service.dart         # Login, registro, Google Sign-In, JWT, 2FA
│       ├── profile_service.dart      # Perfil de usuario, avatar, preferencias
│       ├── explore_service.dart      # Ciudades, lugares, servicios turísticos, puntos de interés
│       ├── chat_service.dart         # Conversaciones, mensajes, bot de FAQs
│       ├── wellness_service.dart     # Test de bienestar (modo de viaje Welltur)
│       ├── ai_route_service.dart     # Generación de rutas con IA
│       └── user_content_service.dart # Favoritos, visitas, publicaciones de comunidad
├── presentation/
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── onboarding_screen.dart   # Pantallas de bienvenida inicial
│   │   │   └── welcome_screen.dart      # Login, registro, OTP, Google, reset de contraseña
│   │   ├── main/
│   │   │   ├── main_screen.dart         # Shell: nav inferior glassmorphism + PageView
│   │   │   ├── home_screen.dart         # Inicio: clima, ciudades, exploración, recomendaciones IA
│   │   │   ├── explore_screen.dart      # Explorar: rutas, comunidad (posts estilo feed), certificadas
│   │   │   ├── profile_screen.dart      # Perfil (tabs: Mi Perfil / Favoritos) + wellness
│   │   │   ├── wellness_assessment_screen.dart  # Test de bienestar Welltur (8 preguntas)
│   │   │   ├── mis_rutas_screen.dart    # Rutas guardadas (multi-selección, compartir, borrar)
│   │   │   ├── settings_screen.dart     # Ajustes de cuenta, tema, idioma, biometría
│   │   │   └── edit_profile_avatar_screen.dart  # Edición de foto/icono de avatar
│   │   ├── chat/
│   │   │   ├── conversations_screen.dart  # Listado de conversaciones
│   │   │   └── chat_screen.dart           # Chat turista↔empresa + hoja de FAQs del asistente
│   │   ├── itinerary/
│   │   │   ├── planner_screen.dart      # Planeador de itinerario
│   │   │   ├── itinerary_detail_screen.dart
│   │   │   └── comparison_screen.dart
│   │   ├── explore/
│   │   │   └── detail_view_page.dart    # Vista detalle de un lugar
│   │   ├── social/
│   │   │   └── public_profile_screen.dart
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
│       ├── smartur_background.dart      # Fondo con gradiente unificado
│       ├── smartur_app_bar.dart         # SmarturAppBar / SmarturSliverAppBar + smarturHeaderGlass
│       ├── smartur_loader.dart          # Loader animado de la app (SVG + Lottie)
│       ├── smartur_loading_overlay.dart
│       ├── smartur_skeleton.dart        # Skeleton/placeholder durante cargas
│       ├── smartur_ui_kit.dart          # SmarturFadeIn + exports de rutas animadas
│       ├── smartur_image.dart           # Imagen con calidad adaptada a densidad de pantalla
│       ├── smartur_user_avatar.dart     # Avatar circular del usuario
│       ├── wellness_poi_card.dart
│       └── terms_and_conditions_modal.dart  # Modal de términos y condiciones
└── l10n/                               # ARB (es, en, fr, pt) + generados AppLocalizations
```

### Carpetas raíz adicionales

| Carpeta / Archivo | Rol |
|-------------------|-----|
| `android/`, `ios/` | Proyectos nativos; permisos de cámara/galería y configuración de firma. |
| `assets/` | Recursos estáticos referenciados en `pubspec.yaml`. |
| `run_dev.ps1` | Script PowerShell para ejecutar en desarrollo con variables de `.env`. |
| `build_release.ps1` | Script PowerShell para generar APK o App Bundle de release (sin firma). |
| `builrelease.ps1` | Script PowerShell para build firmado de producción (APK + AAB). |
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
| **ML / Interacciones** | `/me/interactions` | Lote de eventos implícitos (dwell, detail_open, skip, filter_click). Body: `{ events: [{ place_kind, place_id, event_type, dwell_ms?, meta? }] }` |
| | `/me/rating` | Calificación explícita 1–5 estrellas (upsert). Body: `{ place_kind, place_id, rating }` |
| | `/recommendations/:userId` | Proxy al motor ML con logging de sesión. Responde con recomendaciones + `session_id`. |

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

- Nav inferior en **pill flotante con glassmorphism** (`BackdropFilter`): un `PageView` controla el cuerpo y un indicador arrastrable (`_NavStrip`) se mueve junto con `PageController`.
- Iconos (`_NavIcon`) cambian de outline a solid al seleccionarse y hacen un **rebote elástico** (`AnimationController` + `TweenSequence`) al convertirse en la pestaña activa.
- La barra se **encoge al hacer scroll** dentro de la pestaña activa (shrink animation) y vuelve a su tamaño tras un breve reposo.
- Pestañas: **Inicio**, **Explorar** (rutas + comunidad + certificadas), **Chat**, **Perfil** (con sub-tabs Mi Perfil / Favoritos).

### 4. Explorar, IA y comunidad (`explore_screen.dart`, `ai_route_service.dart`)

- **Rutas con IA**: generadas por `ai_route_service.dart`; las paradas se muestran con la misma estructura visual que una ruta manual (sin fecha ni "coincide con…" para no delatar el origen IA).
- **Comunidad**: feed estilo Instagram (imagen full-width, chip de lugar overlay, like + caption) dentro de `explore_screen.dart`.
- **Borrado lógico** de posts propios (`DELETE` sobre `communityPosts`) con ocultación inmediata en la UI y persistencia vía `is_active`.

### 5. Diario y favoritos (`user_content_service.dart`, `profile_screen.dart`)

- **Favoritos y visitas**: bajo rutas `meFavorites` / `meVisits`; se muestran en la pestaña "Favoritos" dentro de Perfil (cada tab tiene su propio scroll independiente — se evitó anidar `NestedScrollView` para prevenir crashes de layout).

### 6. Chat y FAQs (`chat_service.dart`, `chat_screen.dart`)

- Conversación turista↔empresa vía `conversations` / `messages`.
- Botón asistente (🤖): si el campo de texto está vacío, abre una **hoja de preguntas frecuentes** (`GET /conversations/:id/faqs`) para que el turista elija una pregunta; si hay texto, consulta el bot vía búsqueda de texto completo (`bot-message`) y siempre responde con una burbuja (incluye respuesta de fallback si no hay match).
- Las empresas gestionan sus propias FAQs desde el dashboard PLATAFORMA (`/api/v2/empresa/faqs`).

### 7. Wellness / Welltur (`wellness_service.dart`, `wellness_assessment_screen.dart`)

- Test de 8 preguntas basado en instrumentos validados (SF-36 Vitalidad, SMBM, PSS-4, PANAS-NA) que determina un "modo de viaje" (calma, restauración, equilibrio).
- Resultado usado para personalizar recomendaciones; accesible desde un banner en Home y desde la sección de bienestar en Perfil.

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
