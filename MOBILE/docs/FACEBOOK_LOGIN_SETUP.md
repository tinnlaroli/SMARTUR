# Activar login con Facebook

El código de login con Facebook ya está implementado (backend + móvil) pero
**inactivo** hasta completar esta configuración. Sin ella:
- El backend responde `501` en `/facebook-login` y el botón en la app muestra
  "Inicio de sesión con Facebook no disponible por ahora."
- El SDK nativo de Facebook no está registrado en `AndroidManifest.xml` /
  `Info.plist` — a propósito, para no arriesgar un crash de arranque en toda
  la app con credenciales falsas.

## 1. Crear la app en Facebook for Developers

1. Ir a https://developers.facebook.com/apps y crear una app tipo "Consumer".
2. Agregar el producto **Facebook Login**.
3. Anotar el **App ID** y el **App Secret** (Configuración básica).
4. En Facebook Login → Configuración, agregar el paquete Android
   (`applicationId` de `android/app/build.gradle`) y el hash de firma (`keytool
   -exportcert -alias upload -keystore android/app/smartur-release.jks | openssl
   sha1 -binary | openssl base64`), y el Bundle ID de iOS si aplica.

## 2. Backend (API)

En el `.env` de producción y local, agregar:

```
FACEBOOK_APP_ID=tu_app_id
FACEBOOK_APP_SECRET=tu_app_secret
```

Con eso, `POST /api/v2/facebook-login` (`controllers/userController.js`,
`facebookLogin`) queda activo automáticamente — no requiere redeploy de código,
solo reiniciar el contenedor de la API con las nuevas variables.

## 3. Móvil — Android

En `android/app/src/main/AndroidManifest.xml`, dentro de `<application>`,
agregar:

```xml
<meta-data android:name="com.facebook.sdk.ApplicationId"
           android:value="@string/facebook_app_id"/>
<meta-data android:name="com.facebook.sdk.ClientToken"
           android:value="@string/facebook_client_token"/>
<activity android:name="com.facebook.FacebookActivity"
          android:configChanges="keyboard|keyboardHidden|screenLayout|screenSize|orientation"
          android:label="@string/app_name" />
<activity android:name="com.facebook.CustomTabActivity" android:exported="true">
  <intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="@string/fb_login_protocol_scheme" />
  </intent-filter>
</activity>
```

Y crear/editar `android/app/src/main/res/values/strings.xml`:

```xml
<resources>
    <string name="app_name">Smartur</string>
    <string name="facebook_app_id">TU_APP_ID</string>
    <string name="facebook_client_token">TU_CLIENT_TOKEN</string>
    <string name="fb_login_protocol_scheme">fbTU_APP_ID</string>
</resources>
```

## 4. Móvil — iOS

En `ios/Runner/Info.plist` agregar `FacebookAppID`, `FacebookClientToken`,
`FacebookDisplayName` y el `CFBundleURLSchemes` con `fbTU_APP_ID`, siguiendo la
guía oficial de `flutter_facebook_auth`:
https://pub.dev/packages/flutter_facebook_auth#ios

## 5. Verificación

1. `flutter pub get` (ya está en `pubspec.yaml`: `flutter_facebook_auth`).
2. Build y probar el botón "Continuar con Facebook" en `welcome_screen.dart`.
3. Confirmar que un usuario nuevo se crea con `auth_provider = 'facebook'` en
   la tabla `user`, y que "Sesiones activas" en Settings lo lista igual que
   cualquier otro login.
