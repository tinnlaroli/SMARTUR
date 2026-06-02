# Google Sign-In en APK/AAB de release (tag de GitHub)

## Por qué funciona por cable pero no al descargar el APK del tag

| Instalación | Firma del APK | SHA en Firebase |
|-------------|---------------|-----------------|
| `flutter run` / debug por USB | Keystore **debug** (`~/.android/debug.keystore`) | Suele estar registrado |
| APK del workflow `release.yml` | Keystore **release** (`smartur-release.jks`) | Debe estar registrado aparte |

Google Sign-In en Android valida que el **SHA-1 (y SHA-256)** del certificado con el que se firmó el APK coincida con un cliente OAuth Android en el proyecto Firebase/Google Cloud (`mx.smartur.app`).

Si el APK de la landing está firmado con el keystore de release y ese SHA **no** está en Firebase, verás errores como `sign_in_failed`, código **10** (`DEVELOPER_ERROR`) o `idToken` nulo.

## Checklist (orden recomendado)

### 1. Obtener huellas del keystore de release

En PowerShell, desde `MOBILE/` (ajusta alias y rutas):

```powershell
$keytool = "$env:JAVA_HOME\bin\keytool.exe"
& $keytool -list -v -keystore android/app/smartur-release.jks -alias TU_ALIAS
```

Copia **SHA-1** y **SHA-256**. También puedes usar:

```powershell
.\scripts\print_android_signing_sha.ps1 -KeystorePath android/app/smartur-release.jks -Alias TU_ALIAS
```

Para comparar el keystore **debug** (instalación por cable):

```powershell
& $keytool -list -v -keystore "$env:USERPROFILE\.android\debug.keystore" -alias androiddebugkey -storepass android
```

### 2. Registrar huellas en Firebase

1. [Firebase Console](https://console.firebase.google.com) → proyecto **smartur-5625d**
2. Configuración del proyecto → app Android **mx.smartur.app**
3. Añadir huella **SHA-1** y **SHA-256** del keystore de **release**
4. Descargar el nuevo `google-services.json` y reemplazar `android/app/google-services.json`
5. Commitear el JSON actualizado

El archivo actual ya tiene varios `certificate_hash` (debug y otros). Falta el del **release** que usa CI si no coincide con ninguno.

### 3. Verificar Google Cloud OAuth

En [Google Cloud Console](https://console.cloud.google.com) → APIs y servicios → Credenciales:

- Cliente **Android** con package `mx.smartur.app` y el mismo SHA-1 de release
- Cliente **Web** con ID `…q7mr8bdhbsm5rncmfsug58mb9t3gio2j…` → este es el que usa la app como `serverClientId` / `GOOGLE_SERVER_CLIENT_ID`

**No** uses el client ID de tipo Android en `GOOGLE_SERVER_CLIENT_ID`; debe ser el **Web client**.

### 4. Secretos de GitHub Actions (repo MOBILE)

En **Settings → Secrets and variables → Actions**:

| Secret | Obligatorio | Notas |
|--------|-------------|--------|
| `KEYSTORE_BASE64` | Sí | JKS codificado en base64; sin esto el APK puede firmarse con debug (ver workflow) |
| `KEYSTORE_PASSWORD` | Sí | |
| `KEY_ALIAS` | Sí | |
| `KEY_PASSWORD` | Sí | |
| `GOOGLE_SERVER_CLIENT_ID` | Sí | Web client ID completo; **no vacío** |
| `API_BASE_URL` | Sí | Producción, ej. `https://api.smartur.online/api/v2` |
| `AI_ENGINE_URL` | Recomendado | |
| `OPENWEATHER_API_KEY` | Opcional | |

Si `GOOGLE_SERVER_CLIENT_ID` se pasa vacío en `--dart-define`, Dart **no** usa el default del código y Google falla.

### 5. Backend

El endpoint `POST /api/v2/google-login` debe aceptar el `idToken` emitido para el mismo proyecto Google (`1076586296171`).

Comprueba en el servidor que `GOOGLE_CLIENT_ID` (o equivalente) coincida con el **Web client ID**.

### 6. Probar el mismo artefacto que publicas

1. Crea tag `vX.Y.Z` y deja correr el workflow
2. Descarga el APK del **Release** de GitHub (no un `flutter run` local)
3. Instálalo en un dispositivo físico
4. Prueba login con Google

### 7. Diagnóstico rápido en dispositivo

```bash
adb logcat | findstr /i "GoogleSignIn sign_in DEVELOPER"
```

Código **10** → casi siempre configuración SHA / package / `serverClientId`.

## Referencias en el repo

- `android/app/build.gradle.kts` → `applicationId = "mx.smartur.app"`
- `android/app/google-services.json` → huellas registradas
- `lib/core/constants/env_config.dart` → `GOOGLE_SERVER_CLIENT_ID`
- `.github/workflows/release.yml` → build release con `--dart-define`
