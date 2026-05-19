// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Spanish Castilian (`es`).
class AppLocalizationsEs extends AppLocalizations {
  AppLocalizationsEs([String locale = 'es']) : super(locale);

  @override
  String get appTitle => 'SMARTUR';

  @override
  String get settingsTitle => 'Configuración';

  @override
  String get appearanceSection => 'Apariencia';

  @override
  String get accountSection => 'Cuenta';

  @override
  String get infoSection => 'Información';

  @override
  String get darkMode => 'Modo Oscuro';

  @override
  String get language => 'Idioma';

  @override
  String get changePassword => 'Cambiar Contraseña';

  @override
  String get editName => 'Editar Nombre';

  @override
  String get deleteAccount => 'Eliminar Cuenta';

  @override
  String get appVersion => 'Versión de la App';

  @override
  String get termsAndConditions => 'Términos y Condiciones';

  @override
  String get registerAcceptTermsPrefix => 'Acepto los ';

  @override
  String get termsMustAccept =>
      'Debes aceptar los términos y condiciones para registrarte.';

  @override
  String get termsCloseButton => 'Entendido';

  @override
  String get termsAndConditionsBody =>
      'Última actualización: marzo de 2025.\n\n1. Objeto\nSMARTUR es una aplicación móvil para explorar destinos turísticos, recomendaciones y funciones de comunidad.\n\n2. Registro y cuenta\nAl crear una cuenta confirmas que la información proporcionada es veraz. Eres responsable de mantener la confidencialidad de tu contraseña y de las actividades realizadas con tu cuenta.\n\n3. Uso permitido\nTe comprometes a utilizar el servicio de forma lícita, sin vulnerar derechos de terceros ni el funcionamiento de la plataforma.\n\n4. Contenido y propiedad intelectual\nLos contenidos de la app (textos, diseño, marcas) están protegidos. No está permitida su reproducción no autorizada.\n\n5. Datos personales\nEl tratamiento de tus datos personales se realiza conforme a la legislación aplicable. Al usar SMARTUR aceptas las prácticas descritas en la política de privacidad del servicio.\n\n6. Modificaciones\nPodemos actualizar estos términos. Los cambios relevantes se comunicarán por medios razonables; el uso continuado de la aplicación tras la actualización implica la aceptación de los nuevos términos.\n\n7. Contacto\nPara consultas sobre estos términos, utiliza los canales de soporte indicados en la aplicación o en el sitio web oficial.';

  @override
  String get logout => 'Cerrar sesión';

  @override
  String get selectLanguage => 'Seleccionar Idioma';

  @override
  String get systemLanguage => 'Idioma del sistema';

  @override
  String get systemTheme => 'Tema del sistema';

  @override
  String get cancel => 'Cancelar';

  @override
  String get save => 'Guardar';

  @override
  String get deleteAccountTitle => 'Eliminar cuenta';

  @override
  String get deleteAccountConfirm =>
      '¿Estás seguro de que deseas eliminar tu cuenta? Esta acción es irreversible y perderás tu historial de viajes.';

  @override
  String get deleteAccountYes => 'Sí, eliminar';

  @override
  String get editNameTitle => 'Editar nombre';

  @override
  String get yourName => 'Tu nombre';

  @override
  String get changePasswordTitle => 'Cambiar Contraseña';

  @override
  String get changePasswordStep0Hint =>
      'Te enviaremos un código de verificación a tu correo electrónico.';

  @override
  String get changePasswordStep1Hint =>
      'Ingresa el código y tu nueva contraseña.';

  @override
  String get verificationCode => 'Código de verificación';

  @override
  String get newPassword => 'Nueva contraseña';

  @override
  String get confirmPassword => 'Confirmar contraseña';

  @override
  String get sendCode => 'Enviar código';

  @override
  String get updatePassword => 'Actualizar contraseña';

  @override
  String get resendCode => 'Reenviar código';

  @override
  String get codeSixDigits => 'Código de 6 dígitos';

  @override
  String get passwordMinChars => 'Mínimo 8 caracteres';

  @override
  String get passwordNeedUpper => 'Incluye al menos una mayúscula';

  @override
  String get passwordNeedLower => 'Incluye al menos una minúscula';

  @override
  String get passwordNeedNumber => 'Incluye al menos un número';

  @override
  String get passwordsDontMatch => 'Las contraseñas no coinciden';

  @override
  String codeSentToEmail(Object email) {
    return 'Código enviado a $email';
  }

  @override
  String get emailNotFound => 'No se encontró tu email';

  @override
  String get loading => 'Cargando...';

  @override
  String get welcomeBack => 'Bienvenido de nuevo';

  @override
  String get startNow => 'Empezar ahora';

  @override
  String get loginSubtitle => 'Ingresa tus credenciales para continuar.';

  @override
  String get registerSubtitle =>
      'Regístrate para descubrir rutas personalizadas.';

  @override
  String get continueWithEmail => 'Continuar con Email';

  @override
  String get registerWithEmail => 'Registrarse con Email';

  @override
  String get tagline => 'IA que guía, Turismo que une';

  @override
  String get start => 'Comenzar';

  @override
  String get loginWithBiometrics => 'Ingresar con huella';

  @override
  String get navHome => 'Inicio';

  @override
  String get navDiary => 'Diario';

  @override
  String get navRecommend => 'Recomendar';

  @override
  String get navCommunity => 'Comunidad';

  @override
  String get navUser => 'Usuario';

  @override
  String get communityTitle => 'Comunidad';

  @override
  String get uploadPhotoAction => 'Añadir foto';

  @override
  String get communityCreatePost => 'Crear publicación';

  @override
  String get communityPostCaptionHint => '¿Qué quieres compartir?';

  @override
  String get communitySelectPlace => 'Lugar etiquetado';

  @override
  String get communitySelectPlaceHint => 'Elige el sitio sobre el que publicas';

  @override
  String get communityAttachImage => 'Adjuntar imagen';

  @override
  String get communityRemoveImage => 'Quitar imagen';

  @override
  String get communityPublish => 'Publicar';

  @override
  String get communityNeedPlace => 'Selecciona un lugar';

  @override
  String get communityNeedTextOrImage =>
      'Escribe un mensaje o adjunta una imagen';

  @override
  String get communityLoadPlacesError => 'No se pudieron cargar los lugares';

  @override
  String get communityPostPublished => 'Publicación creada';

  @override
  String get diaryTitle => 'Mi Diario';

  @override
  String get favoritesTab => 'Favoritos';

  @override
  String get historyTab => 'Historial';

  @override
  String get offlineAvailable => 'Disponible sin internet';

  @override
  String recommendationsInCity(Object city) {
    return 'Recomendaciones en $city';
  }

  @override
  String recommendationNumber(Object number) {
    return 'Recomendación #$number';
  }

  @override
  String recommendationSubtitle(Object city) {
    return 'Sugerido por la IA de SMARTUR para tu visita a $city.';
  }

  @override
  String get mapDiscoverHint =>
      'Descubre puntos clave sin rastrear tu ubicación en tiempo real.';

  @override
  String get mapTapPinHint => 'Toca un pin para ver detalles generados por IA';

  @override
  String get filterAll => 'Todos';

  @override
  String get filterMuseums => 'Museos';

  @override
  String get filterCafes => 'Cafés';

  @override
  String get filterViewpoints => 'Miradores';

  @override
  String get filterMuseumsOnly => 'Solo ver Museos';

  @override
  String get aiSmartur => 'IA Smartur';

  @override
  String get enableBiometricsHint =>
      'Inicia sesión y activa la huella en tu perfil';

  @override
  String get deviceNotSupported => 'Dispositivo no compatible';

  @override
  String get noBiometricsEnrolled => 'No hay huellas registradas';

  @override
  String get biometricReason => 'Accede a tus rutas de SMARTUR';

  @override
  String get sessionExpired => 'Sesión expirada. Inicia sesión de nuevo.';

  @override
  String get biometricReadError => 'Error al leer huella.';

  @override
  String get quickAccess => 'Acceso rápido';

  @override
  String get activate => 'Activar';

  @override
  String get notNow => 'Ahora no';

  @override
  String get dontRemindMe => 'No me lo recuerdes';

  @override
  String get biometricPrompt =>
      '¿Quieres usar tu huella para iniciar sesión más rápido la próxima vez?';

  @override
  String get biometricActivateReason =>
      'Confirma tu huella para activar el acceso rápido';

  @override
  String get biometricActivateTitle => 'Activar huella — SMARTUR';

  @override
  String get biometricTouchSensor => 'Toca el sensor';

  @override
  String get biometricActivated => 'Acceso con huella activado';

  @override
  String biometricActivateError(Object error) {
    return 'No se pudo activar: $error';
  }

  @override
  String get biometricDeactivated => 'Ya no se solicitará tu huella';

  @override
  String get biometricConfirmActivate => 'Confirma tu huella para activar';

  @override
  String get biometricCouldNotActivate => 'No se pudo activar la huella';

  @override
  String get myProfile => 'Mi perfil';

  @override
  String get manageAccount => 'Administra tu cuenta rápida';

  @override
  String get myPreferences => 'Mis preferencias';

  @override
  String get yourPreferences => 'Tus preferencias';

  @override
  String get noPreferencesSaved => 'No has guardado preferencias aún.';

  @override
  String get confirmChangePreferences => '¿Estás seguro que deseas cambiarlas?';

  @override
  String get change => 'Cambiar';

  @override
  String get fingerprintAccess => 'Acceso con huella';

  @override
  String get configuration => 'Configuración';

  @override
  String exploreGreeting(Object name) {
    return 'Explorar$name';
  }

  @override
  String get highMountainsVeracruz => 'Altas Montañas, Veracruz';

  @override
  String get exploreHighMountains => 'Explora las Altas Montañas';

  @override
  String recommendationsForYou(Object name) {
    return 'Recomendaciones para ti, $name';
  }

  @override
  String get weatherNow => 'Clima ahora';

  @override
  String get notAvailable => 'No disponible';

  @override
  String get allCategories => 'Todos';

  @override
  String get noCategoryPlaces => 'No hay lugares en esta categoría aún';

  @override
  String get exploreNoCities =>
      'No hay ciudades con lugares desde el servidor.';

  @override
  String get exploreCouldNotLoad =>
      'No se pudieron cargar los lugares. Revisa tu conexión e inténtalo de nuevo.';

  @override
  String get exploreAllCities => 'Todas las ciudades';

  @override
  String get tabHistory => 'Historia';

  @override
  String get tabLocation => 'Ubicación';

  @override
  String get tabGastronomy => 'Gastronomía';

  @override
  String get tabAiSummary => 'Resumen IA';

  @override
  String get fromPrice => 'Desde';

  @override
  String get free => 'Gratis';

  @override
  String get createOneDayRoute => 'Crear Ruta de 1 Día';

  @override
  String get tabLocationPlaceholder => 'Mapa y puntos clave para visitar.';

  @override
  String get tabGastronomyPlaceholder =>
      'Platillos típicos y cafés recomendados de la zona.';

  @override
  String get tabAiPlaceholder =>
      'Resumen generado por IA con reseñas y puntuaciones de otros turistas.';

  @override
  String get invalidCredentials => 'Credenciales incorrectas.';

  @override
  String get invalidCode => 'Código inválido o expirado.';

  @override
  String get tooManyAttempts =>
      'Demasiados intentos. Intenta de nuevo en 1 minuto.';

  @override
  String get accountCreated =>
      'Cuenta creada exitosamente. Por favor, inicia sesión.';

  @override
  String get connectionError => 'Error de conexión.';

  @override
  String get changeEmail => 'Cambiar correo';

  @override
  String get confirmLogoutTitle => 'Cerrar sesión';

  @override
  String get confirmLogoutMessage => '¿Estás seguro que deseas cerrar sesión?';

  @override
  String get next => 'Siguiente';

  @override
  String get back => 'Atrás';

  @override
  String get sustainablePreferences => 'Preferencias sustentables';

  @override
  String get sessionExpiredPreferences =>
      'Sesión expirada. Vuelve a iniciar sesión.';

  @override
  String get profileReady =>
      '¡Perfil listo! Ahora te daremos recomendaciones a tu medida 🎉';

  @override
  String get couldNotSavePreferences =>
      'No se pudieron guardar las preferencias. Intenta de nuevo.';

  @override
  String get selectGender => 'Por favor selecciona tu género';

  @override
  String get selectAtLeastOneInterest => 'Selecciona al menos un interés';

  @override
  String get completeAllFields => 'Completa todos los campos';

  @override
  String get categoryHotels => 'Hotelería';

  @override
  String get categoryRestaurants => 'Restaurantes';

  @override
  String get categoryMuseums => 'Museos';

  @override
  String get categoryAdventures => 'Aventuras';

  @override
  String get tourist => 'turista';

  @override
  String get codeSentToLabel => 'Se envió un código a:';

  @override
  String get enterSixDigitCode => 'Ingresa el código de 6 dígitos';

  @override
  String get rememberMe7Days => 'Recuérdame durante 7 días en este dispositivo';

  @override
  String get verify => 'VERIFICAR';

  @override
  String get signInButton => 'ENTRAR';

  @override
  String get createAccount => 'CREAR CUENTA';

  @override
  String get continueWithGoogle => 'Continuar con Google';

  @override
  String get noAccountPrompt => '¿No tienes cuenta? ';

  @override
  String get haveAccountPrompt => '¿Ya tienes una cuenta? ';

  @override
  String get signUp => 'Regístrate';

  @override
  String get signInAction => 'Inicia sesión';

  @override
  String get fullName => 'Nombre completo';

  @override
  String get enterFullName => 'Ingresa tu nombre completo';

  @override
  String get minThreeChars => 'Mínimo 3 letras';

  @override
  String get emailAddress => 'Correo electrónico';

  @override
  String get enterEmail => 'Ingresa tu correo';

  @override
  String get enterValidEmail => 'Ingresa un correo válido';

  @override
  String get password => 'Contraseña';

  @override
  String get enterPassword => 'Ingresa tu contraseña';

  @override
  String get minEightChars => 'Mínimo 8 caracteres';

  @override
  String get atLeastOneUppercase => 'Al menos una mayúscula';

  @override
  String get atLeastOneLowercase => 'Al menos una minúscula';

  @override
  String get atLeastOneNumber => 'Al menos un número';

  @override
  String get atLeastOneSpecial => 'Al menos un carácter especial';

  @override
  String get passwordRequirements => 'La contraseña debe tener:';

  @override
  String get specialCharHint => 'Un carácter especial (!@#\$%^&*)';

  @override
  String get strengthVeryWeak => 'Muy débil';

  @override
  String get strengthWeak => 'Débil';

  @override
  String get strengthFair => 'Regular';

  @override
  String get strengthStrong => 'Fuerte';

  @override
  String get strengthVeryStrong => 'Muy fuerte';

  @override
  String get defaultUserName => 'Turista SMARTUR';

  @override
  String get myInterests => 'Mis Intereses';

  @override
  String get quickSettings => 'Configuración rápida';

  @override
  String memberSince(Object date) {
    return 'Miembro desde $date';
  }

  @override
  String get notifications => 'Notificaciones';

  @override
  String get notificationsSubtitle =>
      'Gestiona alertas de clima, rutas y comunidad';

  @override
  String get appPreferences => 'Preferencias de app';

  @override
  String get appPreferencesSubtitle => 'Idioma, unidades y tema visual';

  @override
  String get editProfile => 'Editar perfil';

  @override
  String get editProfileSubtitle => 'Cambia tu foto de perfil o elige un icono';

  @override
  String get profilePhotoFormatsHint =>
      'Formatos: JPEG, PNG, GIF, WebP o HEIC. Máximo 5 MB.';

  @override
  String get profilePhotoInvalidFormat =>
      'Formato no permitido. Usa JPEG, PNG, GIF, WebP o HEIC.';

  @override
  String get profilePhotoTooLarge => 'La imagen supera 5 MB.';

  @override
  String get profileOpenGallery => 'Galería';

  @override
  String get profileOpenCamera => 'Cámara';

  @override
  String get removeProfilePhoto => 'Quitar foto';

  @override
  String get avatarIconsSectionHint => 'O elige un icono en lugar de foto';

  @override
  String get changePasswordSubtitle => 'Actualiza tu contraseña de acceso';

  @override
  String get forgotPassword => '¿Olvidaste tu contraseña?';

  @override
  String get sessionClosed => 'Sesión cerrada';

  @override
  String stepXOfY(Object current, Object total) {
    return 'Paso $current de $total';
  }

  @override
  String get stepAboutYou => 'Sobre ti';

  @override
  String get stepAboutYouSubtitle => 'Cuéntanos un poco de ti';

  @override
  String get stepYourTastes => 'Tus gustos';

  @override
  String get stepYourTastesSubtitle => 'Qué te apasiona hacer';

  @override
  String get stepDetails => 'Detalles';

  @override
  String get stepDetailsSubtitle => 'Últimas preferencias';

  @override
  String get birthYear => 'Fecha de nacimiento';

  @override
  String get enterBirthYear => 'Selecciona tu fecha de nacimiento';

  @override
  String get invalidYear => 'Fecha no válida';

  @override
  String get gender => 'Género';

  @override
  String get genderMale => 'Masculino';

  @override
  String get genderFemale => 'Femenino';

  @override
  String get genderNonBinary => 'No binario';

  @override
  String get genderPreferNotToSay => 'Prefiero no decir';

  @override
  String get yourInterests => 'Tus intereses';

  @override
  String get activityLevel => 'Nivel de actividad';

  @override
  String get travelType => 'Tipo de viaje';

  @override
  String get preferredPlace => 'Lugar preferido';

  @override
  String get interestCulture => 'Cultura';

  @override
  String get interestGastronomy => 'Gastronomía';

  @override
  String get interestAdventure => 'Aventura';

  @override
  String get interestNature => 'Naturaleza';

  @override
  String get interestHistory => 'Historia';

  @override
  String get interestPhotography => 'Fotografía';

  @override
  String get interestSports => 'Deportes';

  @override
  String get interestWellness => 'Bienestar';

  @override
  String get interestArt => 'Arte';

  @override
  String get interestNightlife => 'Nightlife';

  @override
  String get activityLow => 'Bajo';

  @override
  String get activityModerate => 'Moderado';

  @override
  String get activityHigh => 'Alto';

  @override
  String get activityExtreme => 'Extremo';

  @override
  String get travelBackpacker => 'Mochilero';

  @override
  String get travelFamily => 'Familiar';

  @override
  String get travelLuxury => 'Lujo';

  @override
  String get travelAdventure => 'Aventura';

  @override
  String get travelRomantic => 'Romántico';

  @override
  String get travelBusiness => 'De negocios';

  @override
  String get placeBeach => 'Playa';

  @override
  String get placeMountain => 'Montaña';

  @override
  String get placeCity => 'Ciudad';

  @override
  String get placeCountryside => 'Campo';

  @override
  String get placeForest => 'Bosque';

  @override
  String get placeDesert => 'Desierto';

  @override
  String get needAccessibility => '¿Necesitas accesibilidad especial?';

  @override
  String get accessibilitySubtitle =>
      'Rutas adaptadas para movilidad reducida u otras necesidades';

  @override
  String get describeNeedOptional => 'Describe tu necesidad (opcional)';

  @override
  String get accessibilityHint => 'Ej: silla de ruedas, bastón...';

  @override
  String get visitedHighMountains => '¿Has visitado las Altas Montañas?';

  @override
  String get visitedSubtitle =>
      'Esto nos ayuda a personalizar mejor tus recomendaciones';

  @override
  String get dietaryRestrictions => 'Restricciones alimentarias o médicas';

  @override
  String get dietaryHint =>
      'Ej: vegetariano, alergia a mariscos... (dejar vacío si ninguna)';

  @override
  String get sustainableNoPref => 'Sin preferencia';

  @override
  String get sustainableLow => 'Baja prioridad';

  @override
  String get sustainableMedium => 'Prioridad media';

  @override
  String get sustainableHigh => 'Alta prioridad';

  @override
  String get choosePreference => 'Elige lo que más prefieras';

  @override
  String get dateFormatPlaceholder => 'Día / Mes / Año';
}
