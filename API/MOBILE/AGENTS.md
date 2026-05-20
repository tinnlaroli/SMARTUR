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

## Important gotchas

- **.env**: Contains sensitive API keys — never commit to git (already in .gitignore).
- **Android signing**: Release builds require `smartur-release.jks` keystore.
- **Platform channels**: Some features may require native code for iOS/Android.
- **State management**: Uses Riverpod providers for global state.

## Build notes

- Uses Gradle for Android, Xcode for iOS
- Minimum Android SDK: Check `android/app/build.gradle`
- Minimum iOS version: Check `ios/Podfile` or Xcode project settings