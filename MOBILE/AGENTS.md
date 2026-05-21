# AGENTS.md — MOBILE (Flutter App)

## Overview

Flutter mobile app (iOS/Android) for SMARTUR tourist application. Uses Riverpod for state management.

## Key commands

```bash
# Flutter commands
flutter pub get           # Install dependencies
flutter run               # Run on connected device/emulator
flutter build apk         # Build debug APK
flutter build apk --release  # Release build

# Run on specific device
flutter run -d <device_id>
```

## Environment

Configuration via `.env`:
- `API_BASE_URL` — Backend API URL (production)
- `API_BASE_URL_DEV` — Backend API URL (development)
- `AI_ENGINE_URL` — ML model service URL
- `GOOGLE_SERVER_CLIENT_ID` — Google OAuth
- `OPENWEATHER_API_KEY` — Weather data

## Project structure

```
MOBILE/
├── lib/
│   ├── main.dart              # Entry point
│   ├── app.dart               # App configuration
│   ├── core/                  # Core utilities, constants
│   ├── data/                  # Data layer (repositories, models)
│   ├── presentation/
│   │   ├── screens/           # UI screens
│   │   │   ├── main/          # Main tab screens (Home, Diary, Community, Profile)
│   │   │   ├── explore/       # Explore, Map, Detail views
│   │   │   ├── preferences/   # Onboarding preference screens
│   │   │   └── settings/      # App settings
│   │   ├── widgets/           # Reusable widgets
│   │   └── utils/             # Screen utilities
│   └── providers/             # Riverpod providers
├── android/                   # Android build config
├── ios/                      # iOS build config
├── pubspec.yaml              # Dependencies
└── .env                      # Environment config (not in git)
```

## ML data collection

The app collects implicit and explicit signals to improve recommendations:

### Implicit events — `POST /me/interactions`

Sent as a batch from `user_content_service.dart`. Buffer events locally; flush when buffer reaches 20 or app goes to background (`AppLifecycleState.paused`).

```dart
// event_type values:
// 'dwell'        — time spent on detail screen (dwell_ms required)
// 'detail_open'  — detail page opened
// 'skip'         — item skipped/dismissed
// 'filter_click' — category filter tapped (meta: { filter: 'category_name' })
```

Body: `{ "events": [{ "place_kind": "poi"|"svc", "place_id": 123, "event_type": "dwell", "dwell_ms": 5000 }] }`

### Explicit rating — `POST /me/rating`

Star rating (1–5) upsert from detail view. Body: `{ "place_kind": "poi"|"svc", "place_id": 123, "rating": 4 }`

### Dwell time

In `detail_view_page.dart`: start a `Stopwatch` in `initState`, stop in `dispose`. If `elapsedMilliseconds > 3000`, send as dwell event. Ignores bounces.

## Important gotchas

- **.env**: Contains sensitive API keys — never commit to git (already in .gitignore).
- **Android signing**: Release builds require `smartur-release.jks` keystore.
- **Platform channels**: Some features may require native code for iOS/Android.
- **State management**: Uses Riverpod providers for global state.

## Build notes

- Uses Gradle for Android, Xcode for iOS
- Minimum Android SDK: Check `android/app/build.gradle`
- Minimum iOS version: Check `ios/Podfile` or Xcode project settings