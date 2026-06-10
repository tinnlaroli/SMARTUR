import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_es.dart';
import 'app_localizations_fr.dart';
import 'app_localizations_pt.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('es'),
    Locale('fr'),
    Locale('pt'),
  ];

  /// No description provided for @appTitle.
  ///
  /// In es, this message translates to:
  /// **'SMARTUR'**
  String get appTitle;

  /// No description provided for @settingsTitle.
  ///
  /// In es, this message translates to:
  /// **'Configuración'**
  String get settingsTitle;

  /// No description provided for @appearanceSection.
  ///
  /// In es, this message translates to:
  /// **'Apariencia'**
  String get appearanceSection;

  /// No description provided for @accountSection.
  ///
  /// In es, this message translates to:
  /// **'Cuenta'**
  String get accountSection;

  /// No description provided for @infoSection.
  ///
  /// In es, this message translates to:
  /// **'Información'**
  String get infoSection;

  /// No description provided for @darkMode.
  ///
  /// In es, this message translates to:
  /// **'Modo Oscuro'**
  String get darkMode;

  /// No description provided for @language.
  ///
  /// In es, this message translates to:
  /// **'Idioma'**
  String get language;

  /// No description provided for @changePassword.
  ///
  /// In es, this message translates to:
  /// **'Cambiar Contraseña'**
  String get changePassword;

  /// No description provided for @editName.
  ///
  /// In es, this message translates to:
  /// **'Editar Nombre'**
  String get editName;

  /// No description provided for @deleteAccount.
  ///
  /// In es, this message translates to:
  /// **'Eliminar Cuenta'**
  String get deleteAccount;

  /// No description provided for @appVersion.
  ///
  /// In es, this message translates to:
  /// **'Versión de la App'**
  String get appVersion;

  /// No description provided for @termsAndConditions.
  ///
  /// In es, this message translates to:
  /// **'Términos y Condiciones'**
  String get termsAndConditions;

  /// No description provided for @privacyPolicy.
  ///
  /// In es, this message translates to:
  /// **'Política de Privacidad'**
  String get privacyPolicy;

  /// No description provided for @registerAcceptTermsPrefix.
  ///
  /// In es, this message translates to:
  /// **'Acepto los '**
  String get registerAcceptTermsPrefix;

  /// No description provided for @termsMustAccept.
  ///
  /// In es, this message translates to:
  /// **'Debes aceptar los términos y condiciones para registrarte.'**
  String get termsMustAccept;

  /// No description provided for @termsCloseButton.
  ///
  /// In es, this message translates to:
  /// **'Entendido'**
  String get termsCloseButton;

  /// No description provided for @termsAndConditionsBody.
  ///
  /// In es, this message translates to:
  /// **'Última actualización: marzo de 2025.\n\n1. Objeto\nSMARTUR es una aplicación móvil para explorar destinos turísticos, recomendaciones y funciones de comunidad.\n\n2. Registro y cuenta\nAl crear una cuenta confirmas que la información proporcionada es veraz. Eres responsable de mantener la confidencialidad de tu contraseña y de las actividades realizadas con tu cuenta.\n\n3. Uso permitido\nTe comprometes a utilizar el servicio de forma lícita, sin vulnerar derechos de terceros ni el funcionamiento de la plataforma.\n\n4. Contenido y propiedad intelectual\nLos contenidos de la app (textos, diseño, marcas) están protegidos. No está permitida su reproducción no autorizada.\n\n5. Datos personales\nEl tratamiento de tus datos personales se realiza conforme a la legislación aplicable. Al usar SMARTUR aceptas las prácticas descritas en la política de privacidad del servicio.\n\n6. Modificaciones\nPodemos actualizar estos términos. Los cambios relevantes se comunicarán por medios razonables; el uso continuado de la aplicación tras la actualización implica la aceptación de los nuevos términos.\n\n7. Contacto\nPara consultas sobre estos términos, utiliza los canales de soporte indicados en la aplicación o en el sitio web oficial.'**
  String get termsAndConditionsBody;

  /// No description provided for @privacyPolicyBody.
  ///
  /// In es, this message translates to:
  /// **'Última actualización: marzo de 2025.\n\n1. Responsable del tratamiento\nSMARTUR es el responsable del tratamiento de tus datos personales.\n\n2. Datos que recopilamos\nRecopilamos los datos que proporcionas al registrarte (nombre, correo electrónico, foto de perfil opcional) y los datos generados al usar la app (preferencias de viaje, historial de recomendaciones, calificaciones de lugares).\n\n3. Finalidad del tratamiento\nTus datos se utilizan para personalizar recomendaciones turísticas, mejorar la aplicación y comunicarnos contigo sobre el servicio.\n\n4. Base legal\nEl tratamiento se basa en tu consentimiento explícito al aceptar estos términos y en la ejecución del contrato de servicio.\n\n5. Conservación de datos\nConservamos tus datos mientras mantengas tu cuenta activa. Puedes solicitar su eliminación en cualquier momento desde Configuración → Eliminar cuenta.\n\n6. Derechos del usuario\nTienes derecho a acceder, rectificar, suprimir y portar tus datos personales. Para ejercerlos, contáctanos a través de los canales de soporte.\n\n7. Seguridad\nAplicamos medidas técnicas y organizativas para proteger tus datos contra accesos no autorizados o pérdidas accidentales.\n\n8. Contacto\nPara consultas sobre privacidad: smarturutcv@gmail.com'**
  String get privacyPolicyBody;

  /// No description provided for @logout.
  ///
  /// In es, this message translates to:
  /// **'Cerrar sesión'**
  String get logout;

  /// No description provided for @selectLanguage.
  ///
  /// In es, this message translates to:
  /// **'Seleccionar Idioma'**
  String get selectLanguage;

  /// No description provided for @systemLanguage.
  ///
  /// In es, this message translates to:
  /// **'Idioma del sistema'**
  String get systemLanguage;

  /// No description provided for @systemTheme.
  ///
  /// In es, this message translates to:
  /// **'Tema del sistema'**
  String get systemTheme;

  /// No description provided for @cancel.
  ///
  /// In es, this message translates to:
  /// **'Cancelar'**
  String get cancel;

  /// No description provided for @save.
  ///
  /// In es, this message translates to:
  /// **'Guardar'**
  String get save;

  /// No description provided for @deleteAccountTitle.
  ///
  /// In es, this message translates to:
  /// **'Eliminar cuenta'**
  String get deleteAccountTitle;

  /// No description provided for @deleteAccountConfirm.
  ///
  /// In es, this message translates to:
  /// **'¿Estás seguro de que deseas eliminar tu cuenta? Esta acción es irreversible y perderás tu historial de viajes.'**
  String get deleteAccountConfirm;

  /// No description provided for @deleteAccountYes.
  ///
  /// In es, this message translates to:
  /// **'Sí, eliminar'**
  String get deleteAccountYes;

  /// No description provided for @editNameTitle.
  ///
  /// In es, this message translates to:
  /// **'Editar nombre'**
  String get editNameTitle;

  /// No description provided for @yourName.
  ///
  /// In es, this message translates to:
  /// **'Tu nombre'**
  String get yourName;

  /// No description provided for @changePasswordTitle.
  ///
  /// In es, this message translates to:
  /// **'Cambiar Contraseña'**
  String get changePasswordTitle;

  /// No description provided for @changePasswordStep0Hint.
  ///
  /// In es, this message translates to:
  /// **'Te enviaremos un código de verificación a tu correo electrónico.'**
  String get changePasswordStep0Hint;

  /// No description provided for @changePasswordStep1Hint.
  ///
  /// In es, this message translates to:
  /// **'Ingresa el código y tu nueva contraseña.'**
  String get changePasswordStep1Hint;

  /// No description provided for @verificationCode.
  ///
  /// In es, this message translates to:
  /// **'Código de verificación'**
  String get verificationCode;

  /// No description provided for @newPassword.
  ///
  /// In es, this message translates to:
  /// **'Nueva contraseña'**
  String get newPassword;

  /// No description provided for @confirmPassword.
  ///
  /// In es, this message translates to:
  /// **'Confirmar contraseña'**
  String get confirmPassword;

  /// No description provided for @sendCode.
  ///
  /// In es, this message translates to:
  /// **'Enviar código'**
  String get sendCode;

  /// No description provided for @updatePassword.
  ///
  /// In es, this message translates to:
  /// **'Actualizar contraseña'**
  String get updatePassword;

  /// No description provided for @resendCode.
  ///
  /// In es, this message translates to:
  /// **'Reenviar código'**
  String get resendCode;

  /// No description provided for @codeSixDigits.
  ///
  /// In es, this message translates to:
  /// **'Código de 6 dígitos'**
  String get codeSixDigits;

  /// No description provided for @passwordMinChars.
  ///
  /// In es, this message translates to:
  /// **'Mínimo 8 caracteres'**
  String get passwordMinChars;

  /// No description provided for @passwordNeedUpper.
  ///
  /// In es, this message translates to:
  /// **'Incluye al menos una mayúscula'**
  String get passwordNeedUpper;

  /// No description provided for @passwordNeedLower.
  ///
  /// In es, this message translates to:
  /// **'Incluye al menos una minúscula'**
  String get passwordNeedLower;

  /// No description provided for @passwordNeedNumber.
  ///
  /// In es, this message translates to:
  /// **'Incluye al menos un número'**
  String get passwordNeedNumber;

  /// No description provided for @passwordsDontMatch.
  ///
  /// In es, this message translates to:
  /// **'Las contraseñas no coinciden'**
  String get passwordsDontMatch;

  /// No description provided for @codeSentToEmail.
  ///
  /// In es, this message translates to:
  /// **'Código enviado a {email}'**
  String codeSentToEmail(Object email);

  /// No description provided for @emailNotFound.
  ///
  /// In es, this message translates to:
  /// **'No se encontró tu email'**
  String get emailNotFound;

  /// No description provided for @loading.
  ///
  /// In es, this message translates to:
  /// **'Cargando...'**
  String get loading;

  /// No description provided for @welcomeBack.
  ///
  /// In es, this message translates to:
  /// **'Bienvenido de nuevo'**
  String get welcomeBack;

  /// No description provided for @startNow.
  ///
  /// In es, this message translates to:
  /// **'Empezar ahora'**
  String get startNow;

  /// No description provided for @loginSubtitle.
  ///
  /// In es, this message translates to:
  /// **'Ingresa tus credenciales para continuar.'**
  String get loginSubtitle;

  /// No description provided for @registerSubtitle.
  ///
  /// In es, this message translates to:
  /// **'Regístrate para descubrir rutas personalizadas.'**
  String get registerSubtitle;

  /// No description provided for @continueWithEmail.
  ///
  /// In es, this message translates to:
  /// **'Continuar con Email'**
  String get continueWithEmail;

  /// No description provided for @registerWithEmail.
  ///
  /// In es, this message translates to:
  /// **'Registrarse con Email'**
  String get registerWithEmail;

  /// No description provided for @tagline.
  ///
  /// In es, this message translates to:
  /// **'IA que guía, Turismo que une'**
  String get tagline;

  /// No description provided for @start.
  ///
  /// In es, this message translates to:
  /// **'Comenzar'**
  String get start;

  /// No description provided for @loginWithBiometrics.
  ///
  /// In es, this message translates to:
  /// **'Ingresar con huella'**
  String get loginWithBiometrics;

  /// No description provided for @navHome.
  ///
  /// In es, this message translates to:
  /// **'Inicio'**
  String get navHome;

  /// No description provided for @navExplore.
  ///
  /// In es, this message translates to:
  /// **'Explorar'**
  String get navExplore;

  /// No description provided for @navRoutes.
  ///
  /// In es, this message translates to:
  /// **'Mis Rutas'**
  String get navRoutes;

  /// No description provided for @navDiary.
  ///
  /// In es, this message translates to:
  /// **'Diario'**
  String get navDiary;

  /// No description provided for @navRecommend.
  ///
  /// In es, this message translates to:
  /// **'Recomendar'**
  String get navRecommend;

  /// No description provided for @navCommunity.
  ///
  /// In es, this message translates to:
  /// **'Comunidad'**
  String get navCommunity;

  /// No description provided for @navUser.
  ///
  /// In es, this message translates to:
  /// **'Usuario'**
  String get navUser;

  /// No description provided for @exploreTitle.
  ///
  /// In es, this message translates to:
  /// **'Explorar'**
  String get exploreTitle;

  /// No description provided for @routesSectionLabel.
  ///
  /// In es, this message translates to:
  /// **'Rutas'**
  String get routesSectionLabel;

  /// No description provided for @routesSectionCertified.
  ///
  /// In es, this message translates to:
  /// **'Rutas certificadas SMARTUR'**
  String get routesSectionCertified;

  /// No description provided for @routesSectionMostCopied.
  ///
  /// In es, this message translates to:
  /// **'Más copiadas'**
  String get routesSectionMostCopied;

  /// No description provided for @routesSectionFollowing.
  ///
  /// In es, this message translates to:
  /// **'De personas que sigues'**
  String get routesSectionFollowing;

  /// No description provided for @routesFollowingEmpty.
  ///
  /// In es, this message translates to:
  /// **'Sigue a viajeros para ver sus rutas aquí'**
  String get routesFollowingEmpty;

  /// No description provided for @searchRoutesHint.
  ///
  /// In es, this message translates to:
  /// **'Buscar rutas o usuarios...'**
  String get searchRoutesHint;

  /// No description provided for @seeAll.
  ///
  /// In es, this message translates to:
  /// **'Ver todo'**
  String get seeAll;

  /// No description provided for @misRutasTitle.
  ///
  /// In es, this message translates to:
  /// **'Mis Rutas'**
  String get misRutasTitle;

  /// No description provided for @misRutasEmptyTitle.
  ///
  /// In es, this message translates to:
  /// **'Aún no tienes rutas'**
  String get misRutasEmptyTitle;

  /// No description provided for @misRutasEmptySubtitle.
  ///
  /// In es, this message translates to:
  /// **'Crea tu primera ruta y comienza a planificar tu próxima aventura'**
  String get misRutasEmptySubtitle;

  /// No description provided for @misRutasCreate.
  ///
  /// In es, this message translates to:
  /// **'Nueva ruta'**
  String get misRutasCreate;

  /// No description provided for @profileTabProfile.
  ///
  /// In es, this message translates to:
  /// **'Perfil'**
  String get profileTabProfile;

  /// No description provided for @addToRoute.
  ///
  /// In es, this message translates to:
  /// **'Agregar a ruta'**
  String get addToRoute;

  /// No description provided for @createNewRoute.
  ///
  /// In es, this message translates to:
  /// **'Nueva ruta'**
  String get createNewRoute;

  /// No description provided for @genrePickerTitle.
  ///
  /// In es, this message translates to:
  /// **'¿Qué te gusta explorar?'**
  String get genrePickerTitle;

  /// No description provided for @genrePickerSubtitle.
  ///
  /// In es, this message translates to:
  /// **'Elige hasta 3 temas que más te interesan'**
  String get genrePickerSubtitle;

  /// No description provided for @genrePickerContinue.
  ///
  /// In es, this message translates to:
  /// **'Continuar'**
  String get genrePickerContinue;

  /// No description provided for @genrePickerSkip.
  ///
  /// In es, this message translates to:
  /// **'Saltar por ahora'**
  String get genrePickerSkip;

  /// No description provided for @genreNature.
  ///
  /// In es, this message translates to:
  /// **'Naturaleza'**
  String get genreNature;

  /// No description provided for @genreAdventure.
  ///
  /// In es, this message translates to:
  /// **'Aventura'**
  String get genreAdventure;

  /// No description provided for @genreGastronomy.
  ///
  /// In es, this message translates to:
  /// **'Gastronomía'**
  String get genreGastronomy;

  /// No description provided for @genreCulture.
  ///
  /// In es, this message translates to:
  /// **'Cultura'**
  String get genreCulture;

  /// No description provided for @genreRelax.
  ///
  /// In es, this message translates to:
  /// **'Relax'**
  String get genreRelax;

  /// No description provided for @genreHistory.
  ///
  /// In es, this message translates to:
  /// **'Historia'**
  String get genreHistory;

  /// No description provided for @communityTitle.
  ///
  /// In es, this message translates to:
  /// **'Comunidad'**
  String get communityTitle;

  /// No description provided for @uploadPhotoAction.
  ///
  /// In es, this message translates to:
  /// **'Añadir foto'**
  String get uploadPhotoAction;

  /// No description provided for @communityCreatePost.
  ///
  /// In es, this message translates to:
  /// **'Crear publicación'**
  String get communityCreatePost;

  /// No description provided for @communityPostCaptionHint.
  ///
  /// In es, this message translates to:
  /// **'¿Qué quieres compartir?'**
  String get communityPostCaptionHint;

  /// No description provided for @communitySelectPlace.
  ///
  /// In es, this message translates to:
  /// **'Lugar etiquetado'**
  String get communitySelectPlace;

  /// No description provided for @communitySelectPlaceHint.
  ///
  /// In es, this message translates to:
  /// **'Elige el sitio sobre el que publicas'**
  String get communitySelectPlaceHint;

  /// No description provided for @communityAttachImage.
  ///
  /// In es, this message translates to:
  /// **'Adjuntar imagen'**
  String get communityAttachImage;

  /// No description provided for @communityRemoveImage.
  ///
  /// In es, this message translates to:
  /// **'Quitar imagen'**
  String get communityRemoveImage;

  /// No description provided for @communityPublish.
  ///
  /// In es, this message translates to:
  /// **'Publicar'**
  String get communityPublish;

  /// No description provided for @communityNeedPlace.
  ///
  /// In es, this message translates to:
  /// **'Selecciona un lugar'**
  String get communityNeedPlace;

  /// No description provided for @communityNeedTextOrImage.
  ///
  /// In es, this message translates to:
  /// **'Escribe un mensaje o adjunta una imagen'**
  String get communityNeedTextOrImage;

  /// No description provided for @communityLoadPlacesError.
  ///
  /// In es, this message translates to:
  /// **'No se pudieron cargar los lugares'**
  String get communityLoadPlacesError;

  /// No description provided for @communityPostPublished.
  ///
  /// In es, this message translates to:
  /// **'Publicación creada'**
  String get communityPostPublished;

  /// No description provided for @communityImageRejected.
  ///
  /// In es, this message translates to:
  /// **'La imagen no cumple las normas de la comunidad. Elige otra foto apta para todos los públicos.'**
  String get communityImageRejected;

  /// No description provided for @communityImageModerationUnavailable.
  ///
  /// In es, this message translates to:
  /// **'No se pudo verificar la imagen. Inténtalo más tarde.'**
  String get communityImageModerationUnavailable;

  /// No description provided for @diaryTitle.
  ///
  /// In es, this message translates to:
  /// **'Mi Diario'**
  String get diaryTitle;

  /// No description provided for @favoritesTab.
  ///
  /// In es, this message translates to:
  /// **'Favoritos'**
  String get favoritesTab;

  /// No description provided for @historyTab.
  ///
  /// In es, this message translates to:
  /// **'Historial'**
  String get historyTab;

  /// No description provided for @offlineAvailable.
  ///
  /// In es, this message translates to:
  /// **'Disponible sin internet'**
  String get offlineAvailable;

  /// No description provided for @recommendationsInCity.
  ///
  /// In es, this message translates to:
  /// **'Recomendaciones en {city}'**
  String recommendationsInCity(Object city);

  /// No description provided for @recommendationNumber.
  ///
  /// In es, this message translates to:
  /// **'Recomendación #{number}'**
  String recommendationNumber(Object number);

  /// No description provided for @recommendationSubtitle.
  ///
  /// In es, this message translates to:
  /// **'Sugerido por la IA de SMARTUR para tu visita a {city}.'**
  String recommendationSubtitle(Object city);

  /// No description provided for @mapDiscoverHint.
  ///
  /// In es, this message translates to:
  /// **'Descubre puntos clave sin rastrear tu ubicación en tiempo real.'**
  String get mapDiscoverHint;

  /// No description provided for @mapTapPinHint.
  ///
  /// In es, this message translates to:
  /// **'Toca un pin para ver detalles generados por IA'**
  String get mapTapPinHint;

  /// No description provided for @filterAll.
  ///
  /// In es, this message translates to:
  /// **'Todos'**
  String get filterAll;

  /// No description provided for @filterMuseums.
  ///
  /// In es, this message translates to:
  /// **'Cultura'**
  String get filterMuseums;

  /// No description provided for @filterCafes.
  ///
  /// In es, this message translates to:
  /// **'Gastronomía'**
  String get filterCafes;

  /// No description provided for @filterViewpoints.
  ///
  /// In es, this message translates to:
  /// **'Aventuras'**
  String get filterViewpoints;

  /// No description provided for @filterHotels.
  ///
  /// In es, this message translates to:
  /// **'Hotelería'**
  String get filterHotels;

  /// No description provided for @filterMuseumsOnly.
  ///
  /// In es, this message translates to:
  /// **'Solo ver Museos'**
  String get filterMuseumsOnly;

  /// No description provided for @aiSmartur.
  ///
  /// In es, this message translates to:
  /// **'IA Smartur'**
  String get aiSmartur;

  /// No description provided for @enableBiometricsHint.
  ///
  /// In es, this message translates to:
  /// **'Inicia sesión y activa la huella en tu perfil'**
  String get enableBiometricsHint;

  /// No description provided for @deviceNotSupported.
  ///
  /// In es, this message translates to:
  /// **'Dispositivo no compatible'**
  String get deviceNotSupported;

  /// No description provided for @noBiometricsEnrolled.
  ///
  /// In es, this message translates to:
  /// **'No hay huellas registradas'**
  String get noBiometricsEnrolled;

  /// No description provided for @biometricReason.
  ///
  /// In es, this message translates to:
  /// **'Accede a tus rutas de SMARTUR'**
  String get biometricReason;

  /// No description provided for @sessionExpired.
  ///
  /// In es, this message translates to:
  /// **'Sesión expirada. Inicia sesión de nuevo.'**
  String get sessionExpired;

  /// No description provided for @biometricReadError.
  ///
  /// In es, this message translates to:
  /// **'Error al leer huella.'**
  String get biometricReadError;

  /// No description provided for @quickAccess.
  ///
  /// In es, this message translates to:
  /// **'Acceso rápido'**
  String get quickAccess;

  /// No description provided for @activate.
  ///
  /// In es, this message translates to:
  /// **'Activar'**
  String get activate;

  /// No description provided for @notNow.
  ///
  /// In es, this message translates to:
  /// **'Ahora no'**
  String get notNow;

  /// No description provided for @dontRemindMe.
  ///
  /// In es, this message translates to:
  /// **'No me lo recuerdes'**
  String get dontRemindMe;

  /// No description provided for @biometricPrompt.
  ///
  /// In es, this message translates to:
  /// **'¿Quieres usar tu huella para iniciar sesión más rápido la próxima vez?'**
  String get biometricPrompt;

  /// No description provided for @biometricActivateReason.
  ///
  /// In es, this message translates to:
  /// **'Confirma tu huella para activar el acceso rápido'**
  String get biometricActivateReason;

  /// No description provided for @biometricActivateTitle.
  ///
  /// In es, this message translates to:
  /// **'Activar huella — SMARTUR'**
  String get biometricActivateTitle;

  /// No description provided for @biometricTouchSensor.
  ///
  /// In es, this message translates to:
  /// **'Toca el sensor'**
  String get biometricTouchSensor;

  /// No description provided for @biometricActivated.
  ///
  /// In es, this message translates to:
  /// **'Acceso con huella activado'**
  String get biometricActivated;

  /// No description provided for @biometricActivateError.
  ///
  /// In es, this message translates to:
  /// **'No se pudo activar: {error}'**
  String biometricActivateError(Object error);

  /// No description provided for @biometricDeactivated.
  ///
  /// In es, this message translates to:
  /// **'Ya no se solicitará tu huella'**
  String get biometricDeactivated;

  /// No description provided for @biometricConfirmActivate.
  ///
  /// In es, this message translates to:
  /// **'Confirma tu huella para activar'**
  String get biometricConfirmActivate;

  /// No description provided for @biometricCouldNotActivate.
  ///
  /// In es, this message translates to:
  /// **'No se pudo activar la huella'**
  String get biometricCouldNotActivate;

  /// No description provided for @myProfile.
  ///
  /// In es, this message translates to:
  /// **'Mi perfil'**
  String get myProfile;

  /// No description provided for @manageAccount.
  ///
  /// In es, this message translates to:
  /// **'Administra tu cuenta rápida'**
  String get manageAccount;

  /// No description provided for @myPreferences.
  ///
  /// In es, this message translates to:
  /// **'Mis preferencias'**
  String get myPreferences;

  /// No description provided for @yourPreferences.
  ///
  /// In es, this message translates to:
  /// **'Tus preferencias'**
  String get yourPreferences;

  /// No description provided for @noPreferencesSaved.
  ///
  /// In es, this message translates to:
  /// **'No has guardado preferencias aún.'**
  String get noPreferencesSaved;

  /// No description provided for @confirmChangePreferences.
  ///
  /// In es, this message translates to:
  /// **'¿Estás seguro que deseas cambiarlas?'**
  String get confirmChangePreferences;

  /// No description provided for @change.
  ///
  /// In es, this message translates to:
  /// **'Cambiar'**
  String get change;

  /// No description provided for @fingerprintAccess.
  ///
  /// In es, this message translates to:
  /// **'Acceso con huella'**
  String get fingerprintAccess;

  /// No description provided for @configuration.
  ///
  /// In es, this message translates to:
  /// **'Configuración'**
  String get configuration;

  /// No description provided for @exploreGreeting.
  ///
  /// In es, this message translates to:
  /// **'Explorar{name}'**
  String exploreGreeting(Object name);

  /// No description provided for @highMountainsVeracruz.
  ///
  /// In es, this message translates to:
  /// **'Altas Montañas, Veracruz'**
  String get highMountainsVeracruz;

  /// No description provided for @exploreHighMountains.
  ///
  /// In es, this message translates to:
  /// **'Explora las Altas Montañas'**
  String get exploreHighMountains;

  /// No description provided for @recommendationsForYou.
  ///
  /// In es, this message translates to:
  /// **'Recomendaciones para ti, {name}'**
  String recommendationsForYou(Object name);

  /// No description provided for @weatherNow.
  ///
  /// In es, this message translates to:
  /// **'Clima ahora'**
  String get weatherNow;

  /// No description provided for @notAvailable.
  ///
  /// In es, this message translates to:
  /// **'No disponible'**
  String get notAvailable;

  /// No description provided for @allCategories.
  ///
  /// In es, this message translates to:
  /// **'Todos'**
  String get allCategories;

  /// No description provided for @noCategoryPlaces.
  ///
  /// In es, this message translates to:
  /// **'No hay lugares en esta categoría aún'**
  String get noCategoryPlaces;

  /// No description provided for @exploreNoCities.
  ///
  /// In es, this message translates to:
  /// **'No hay ciudades con lugares desde el servidor.'**
  String get exploreNoCities;

  /// No description provided for @exploreCouldNotLoad.
  ///
  /// In es, this message translates to:
  /// **'No se pudieron cargar los lugares. Revisa tu conexión e inténtalo de nuevo.'**
  String get exploreCouldNotLoad;

  /// No description provided for @exploreAllCities.
  ///
  /// In es, this message translates to:
  /// **'Todas las ciudades'**
  String get exploreAllCities;

  /// No description provided for @tabHistory.
  ///
  /// In es, this message translates to:
  /// **'Historia'**
  String get tabHistory;

  /// No description provided for @tabLocation.
  ///
  /// In es, this message translates to:
  /// **'Ubicación'**
  String get tabLocation;

  /// No description provided for @tabGastronomy.
  ///
  /// In es, this message translates to:
  /// **'Gastronomía'**
  String get tabGastronomy;

  /// No description provided for @tabAiSummary.
  ///
  /// In es, this message translates to:
  /// **'Resumen IA'**
  String get tabAiSummary;

  /// No description provided for @fromPrice.
  ///
  /// In es, this message translates to:
  /// **'Desde'**
  String get fromPrice;

  /// No description provided for @free.
  ///
  /// In es, this message translates to:
  /// **'Gratis'**
  String get free;

  /// No description provided for @createOneDayRoute.
  ///
  /// In es, this message translates to:
  /// **'Crear Ruta de 1 Día'**
  String get createOneDayRoute;

  /// No description provided for @openInMaps.
  ///
  /// In es, this message translates to:
  /// **'Abrir en Google Maps'**
  String get openInMaps;

  /// No description provided for @locationNoCoords.
  ///
  /// In es, this message translates to:
  /// **'Ubicación: {city}'**
  String locationNoCoords(String city);

  /// No description provided for @searchHint.
  ///
  /// In es, this message translates to:
  /// **'Buscar lugares...'**
  String get searchHint;

  /// No description provided for @searchNoResults.
  ///
  /// In es, this message translates to:
  /// **'Sin resultados para \"{q}\"'**
  String searchNoResults(String q);

  /// No description provided for @tabLocationPlaceholder.
  ///
  /// In es, this message translates to:
  /// **'Mapa y puntos clave para visitar.'**
  String get tabLocationPlaceholder;

  /// No description provided for @tabGastronomyPlaceholder.
  ///
  /// In es, this message translates to:
  /// **'Platillos típicos y cafés recomendados de la zona.'**
  String get tabGastronomyPlaceholder;

  /// No description provided for @tabAiPlaceholder.
  ///
  /// In es, this message translates to:
  /// **'Resumen generado por IA con reseñas y puntuaciones de otros turistas.'**
  String get tabAiPlaceholder;

  /// No description provided for @tabRate.
  ///
  /// In es, this message translates to:
  /// **'Calificar'**
  String get tabRate;

  /// No description provided for @rateHint.
  ///
  /// In es, this message translates to:
  /// **'Tu calificación mejora tus recomendaciones'**
  String get rateHint;

  /// No description provided for @rateThanks.
  ///
  /// In es, this message translates to:
  /// **'¡Gracias por calificar!'**
  String get rateThanks;

  /// No description provided for @invalidCredentials.
  ///
  /// In es, this message translates to:
  /// **'Credenciales incorrectas.'**
  String get invalidCredentials;

  /// No description provided for @invalidCode.
  ///
  /// In es, this message translates to:
  /// **'Código inválido o expirado.'**
  String get invalidCode;

  /// No description provided for @tooManyAttempts.
  ///
  /// In es, this message translates to:
  /// **'Demasiados intentos. Intenta de nuevo en 1 minuto.'**
  String get tooManyAttempts;

  /// No description provided for @accountCreated.
  ///
  /// In es, this message translates to:
  /// **'Cuenta creada exitosamente. Por favor, inicia sesión.'**
  String get accountCreated;

  /// No description provided for @connectionError.
  ///
  /// In es, this message translates to:
  /// **'Error de conexión.'**
  String get connectionError;

  /// No description provided for @changeEmail.
  ///
  /// In es, this message translates to:
  /// **'Cambiar correo'**
  String get changeEmail;

  /// No description provided for @confirmLogoutTitle.
  ///
  /// In es, this message translates to:
  /// **'Cerrar sesión'**
  String get confirmLogoutTitle;

  /// No description provided for @confirmLogoutMessage.
  ///
  /// In es, this message translates to:
  /// **'¿Estás seguro que deseas cerrar sesión?'**
  String get confirmLogoutMessage;

  /// No description provided for @next.
  ///
  /// In es, this message translates to:
  /// **'Siguiente'**
  String get next;

  /// No description provided for @back.
  ///
  /// In es, this message translates to:
  /// **'Atrás'**
  String get back;

  /// No description provided for @sustainablePreferences.
  ///
  /// In es, this message translates to:
  /// **'Preferencias sustentables'**
  String get sustainablePreferences;

  /// No description provided for @sessionExpiredPreferences.
  ///
  /// In es, this message translates to:
  /// **'Sesión expirada. Vuelve a iniciar sesión.'**
  String get sessionExpiredPreferences;

  /// No description provided for @profileReady.
  ///
  /// In es, this message translates to:
  /// **'¡Perfil listo! Ahora te daremos recomendaciones a tu medida 🎉'**
  String get profileReady;

  /// No description provided for @couldNotSavePreferences.
  ///
  /// In es, this message translates to:
  /// **'No se pudieron guardar las preferencias. Intenta de nuevo.'**
  String get couldNotSavePreferences;

  /// No description provided for @selectGender.
  ///
  /// In es, this message translates to:
  /// **'Por favor selecciona tu género'**
  String get selectGender;

  /// No description provided for @selectAtLeastOneInterest.
  ///
  /// In es, this message translates to:
  /// **'Selecciona al menos un interés'**
  String get selectAtLeastOneInterest;

  /// No description provided for @completeAllFields.
  ///
  /// In es, this message translates to:
  /// **'Completa todos los campos'**
  String get completeAllFields;

  /// No description provided for @categoryHotels.
  ///
  /// In es, this message translates to:
  /// **'Hotelería'**
  String get categoryHotels;

  /// No description provided for @categoryRestaurants.
  ///
  /// In es, this message translates to:
  /// **'Restaurantes'**
  String get categoryRestaurants;

  /// No description provided for @categoryMuseums.
  ///
  /// In es, this message translates to:
  /// **'Museos'**
  String get categoryMuseums;

  /// No description provided for @categoryAdventures.
  ///
  /// In es, this message translates to:
  /// **'Aventuras'**
  String get categoryAdventures;

  /// No description provided for @tourist.
  ///
  /// In es, this message translates to:
  /// **'turista'**
  String get tourist;

  /// No description provided for @codeSentToLabel.
  ///
  /// In es, this message translates to:
  /// **'Se envió un código a:'**
  String get codeSentToLabel;

  /// No description provided for @enterSixDigitCode.
  ///
  /// In es, this message translates to:
  /// **'Ingresa el código de 6 dígitos'**
  String get enterSixDigitCode;

  /// No description provided for @rememberMe7Days.
  ///
  /// In es, this message translates to:
  /// **'Recuérdame durante 7 días en este dispositivo'**
  String get rememberMe7Days;

  /// No description provided for @verify.
  ///
  /// In es, this message translates to:
  /// **'VERIFICAR'**
  String get verify;

  /// No description provided for @signInButton.
  ///
  /// In es, this message translates to:
  /// **'ENTRAR'**
  String get signInButton;

  /// No description provided for @createAccount.
  ///
  /// In es, this message translates to:
  /// **'CREAR CUENTA'**
  String get createAccount;

  /// No description provided for @continueWithGoogle.
  ///
  /// In es, this message translates to:
  /// **'Continuar con Google'**
  String get continueWithGoogle;

  /// No description provided for @noAccountPrompt.
  ///
  /// In es, this message translates to:
  /// **'¿No tienes cuenta? '**
  String get noAccountPrompt;

  /// No description provided for @haveAccountPrompt.
  ///
  /// In es, this message translates to:
  /// **'¿Ya tienes una cuenta? '**
  String get haveAccountPrompt;

  /// No description provided for @signUp.
  ///
  /// In es, this message translates to:
  /// **'Regístrate'**
  String get signUp;

  /// No description provided for @signInAction.
  ///
  /// In es, this message translates to:
  /// **'Inicia sesión'**
  String get signInAction;

  /// No description provided for @fullName.
  ///
  /// In es, this message translates to:
  /// **'Nombre completo'**
  String get fullName;

  /// No description provided for @enterFullName.
  ///
  /// In es, this message translates to:
  /// **'Ingresa tu nombre completo'**
  String get enterFullName;

  /// No description provided for @minThreeChars.
  ///
  /// In es, this message translates to:
  /// **'Mínimo 3 letras'**
  String get minThreeChars;

  /// No description provided for @emailAddress.
  ///
  /// In es, this message translates to:
  /// **'Correo electrónico'**
  String get emailAddress;

  /// No description provided for @enterEmail.
  ///
  /// In es, this message translates to:
  /// **'Ingresa tu correo'**
  String get enterEmail;

  /// No description provided for @enterValidEmail.
  ///
  /// In es, this message translates to:
  /// **'Ingresa un correo válido'**
  String get enterValidEmail;

  /// No description provided for @password.
  ///
  /// In es, this message translates to:
  /// **'Contraseña'**
  String get password;

  /// No description provided for @enterPassword.
  ///
  /// In es, this message translates to:
  /// **'Ingresa tu contraseña'**
  String get enterPassword;

  /// No description provided for @minEightChars.
  ///
  /// In es, this message translates to:
  /// **'Mínimo 8 caracteres'**
  String get minEightChars;

  /// No description provided for @atLeastOneUppercase.
  ///
  /// In es, this message translates to:
  /// **'Al menos una mayúscula'**
  String get atLeastOneUppercase;

  /// No description provided for @atLeastOneLowercase.
  ///
  /// In es, this message translates to:
  /// **'Al menos una minúscula'**
  String get atLeastOneLowercase;

  /// No description provided for @atLeastOneNumber.
  ///
  /// In es, this message translates to:
  /// **'Al menos un número'**
  String get atLeastOneNumber;

  /// No description provided for @atLeastOneSpecial.
  ///
  /// In es, this message translates to:
  /// **'Al menos un carácter especial'**
  String get atLeastOneSpecial;

  /// No description provided for @passwordRequirements.
  ///
  /// In es, this message translates to:
  /// **'La contraseña debe tener:'**
  String get passwordRequirements;

  /// No description provided for @specialCharHint.
  ///
  /// In es, this message translates to:
  /// **'Un carácter especial (!@#\$%^&*)'**
  String get specialCharHint;

  /// No description provided for @strengthVeryWeak.
  ///
  /// In es, this message translates to:
  /// **'Muy débil'**
  String get strengthVeryWeak;

  /// No description provided for @strengthWeak.
  ///
  /// In es, this message translates to:
  /// **'Débil'**
  String get strengthWeak;

  /// No description provided for @strengthFair.
  ///
  /// In es, this message translates to:
  /// **'Regular'**
  String get strengthFair;

  /// No description provided for @strengthStrong.
  ///
  /// In es, this message translates to:
  /// **'Fuerte'**
  String get strengthStrong;

  /// No description provided for @strengthVeryStrong.
  ///
  /// In es, this message translates to:
  /// **'Muy fuerte'**
  String get strengthVeryStrong;

  /// No description provided for @defaultUserName.
  ///
  /// In es, this message translates to:
  /// **'Turista SMARTUR'**
  String get defaultUserName;

  /// No description provided for @myInterests.
  ///
  /// In es, this message translates to:
  /// **'Mis Intereses'**
  String get myInterests;

  /// No description provided for @quickSettings.
  ///
  /// In es, this message translates to:
  /// **'Configuración rápida'**
  String get quickSettings;

  /// No description provided for @memberSince.
  ///
  /// In es, this message translates to:
  /// **'Miembro desde {date}'**
  String memberSince(Object date);

  /// No description provided for @notifications.
  ///
  /// In es, this message translates to:
  /// **'Notificaciones'**
  String get notifications;

  /// No description provided for @notificationsSubtitle.
  ///
  /// In es, this message translates to:
  /// **'Gestiona alertas de clima, rutas y comunidad'**
  String get notificationsSubtitle;

  /// No description provided for @appPreferences.
  ///
  /// In es, this message translates to:
  /// **'Preferencias de app'**
  String get appPreferences;

  /// No description provided for @appPreferencesSubtitle.
  ///
  /// In es, this message translates to:
  /// **'Idioma, unidades y tema visual'**
  String get appPreferencesSubtitle;

  /// No description provided for @editProfile.
  ///
  /// In es, this message translates to:
  /// **'Editar perfil'**
  String get editProfile;

  /// No description provided for @editProfileSubtitle.
  ///
  /// In es, this message translates to:
  /// **'Cambia tu foto de perfil o elige un icono'**
  String get editProfileSubtitle;

  /// No description provided for @profilePhotoFormatsHint.
  ///
  /// In es, this message translates to:
  /// **'Formatos: JPEG, PNG, GIF, WebP o HEIC. Máximo 5 MB.'**
  String get profilePhotoFormatsHint;

  /// No description provided for @profilePhotoInvalidFormat.
  ///
  /// In es, this message translates to:
  /// **'Formato no permitido. Usa JPEG, PNG, GIF, WebP o HEIC.'**
  String get profilePhotoInvalidFormat;

  /// No description provided for @profilePhotoTooLarge.
  ///
  /// In es, this message translates to:
  /// **'La imagen supera 5 MB.'**
  String get profilePhotoTooLarge;

  /// No description provided for @profileOpenGallery.
  ///
  /// In es, this message translates to:
  /// **'Galería'**
  String get profileOpenGallery;

  /// No description provided for @profileOpenCamera.
  ///
  /// In es, this message translates to:
  /// **'Cámara'**
  String get profileOpenCamera;

  /// No description provided for @removeProfilePhoto.
  ///
  /// In es, this message translates to:
  /// **'Quitar foto'**
  String get removeProfilePhoto;

  /// No description provided for @avatarIconsSectionHint.
  ///
  /// In es, this message translates to:
  /// **'O elige un icono en lugar de foto'**
  String get avatarIconsSectionHint;

  /// No description provided for @changePasswordSubtitle.
  ///
  /// In es, this message translates to:
  /// **'Actualiza tu contraseña de acceso'**
  String get changePasswordSubtitle;

  /// No description provided for @forgotPassword.
  ///
  /// In es, this message translates to:
  /// **'¿Olvidaste tu contraseña?'**
  String get forgotPassword;

  /// No description provided for @sessionClosed.
  ///
  /// In es, this message translates to:
  /// **'Sesión cerrada'**
  String get sessionClosed;

  /// No description provided for @stepXOfY.
  ///
  /// In es, this message translates to:
  /// **'Paso {current} de {total}'**
  String stepXOfY(Object current, Object total);

  /// No description provided for @stepAboutYou.
  ///
  /// In es, this message translates to:
  /// **'Sobre ti'**
  String get stepAboutYou;

  /// No description provided for @stepAboutYouSubtitle.
  ///
  /// In es, this message translates to:
  /// **'Cuéntanos un poco de ti'**
  String get stepAboutYouSubtitle;

  /// No description provided for @stepYourTastes.
  ///
  /// In es, this message translates to:
  /// **'Tus gustos'**
  String get stepYourTastes;

  /// No description provided for @stepYourTastesSubtitle.
  ///
  /// In es, this message translates to:
  /// **'Qué te apasiona hacer'**
  String get stepYourTastesSubtitle;

  /// No description provided for @stepDetails.
  ///
  /// In es, this message translates to:
  /// **'Detalles'**
  String get stepDetails;

  /// No description provided for @stepDetailsSubtitle.
  ///
  /// In es, this message translates to:
  /// **'Últimas preferencias'**
  String get stepDetailsSubtitle;

  /// No description provided for @birthYear.
  ///
  /// In es, this message translates to:
  /// **'Fecha de nacimiento'**
  String get birthYear;

  /// No description provided for @enterBirthYear.
  ///
  /// In es, this message translates to:
  /// **'Selecciona tu fecha de nacimiento'**
  String get enterBirthYear;

  /// No description provided for @invalidYear.
  ///
  /// In es, this message translates to:
  /// **'Fecha no válida'**
  String get invalidYear;

  /// No description provided for @gender.
  ///
  /// In es, this message translates to:
  /// **'Género'**
  String get gender;

  /// No description provided for @genderMale.
  ///
  /// In es, this message translates to:
  /// **'Masculino'**
  String get genderMale;

  /// No description provided for @genderFemale.
  ///
  /// In es, this message translates to:
  /// **'Femenino'**
  String get genderFemale;

  /// No description provided for @genderNonBinary.
  ///
  /// In es, this message translates to:
  /// **'No binario'**
  String get genderNonBinary;

  /// No description provided for @genderPreferNotToSay.
  ///
  /// In es, this message translates to:
  /// **'Prefiero no decir'**
  String get genderPreferNotToSay;

  /// No description provided for @yourInterests.
  ///
  /// In es, this message translates to:
  /// **'Tus intereses'**
  String get yourInterests;

  /// No description provided for @activityLevel.
  ///
  /// In es, this message translates to:
  /// **'Nivel de actividad'**
  String get activityLevel;

  /// No description provided for @travelType.
  ///
  /// In es, this message translates to:
  /// **'Tipo de viaje'**
  String get travelType;

  /// No description provided for @preferredPlace.
  ///
  /// In es, this message translates to:
  /// **'Lugar preferido'**
  String get preferredPlace;

  /// No description provided for @interestCulture.
  ///
  /// In es, this message translates to:
  /// **'Cultura'**
  String get interestCulture;

  /// No description provided for @interestGastronomy.
  ///
  /// In es, this message translates to:
  /// **'Gastronomía'**
  String get interestGastronomy;

  /// No description provided for @interestAdventure.
  ///
  /// In es, this message translates to:
  /// **'Aventura'**
  String get interestAdventure;

  /// No description provided for @interestNature.
  ///
  /// In es, this message translates to:
  /// **'Naturaleza'**
  String get interestNature;

  /// No description provided for @interestHistory.
  ///
  /// In es, this message translates to:
  /// **'Historia'**
  String get interestHistory;

  /// No description provided for @interestPhotography.
  ///
  /// In es, this message translates to:
  /// **'Fotografía'**
  String get interestPhotography;

  /// No description provided for @interestSports.
  ///
  /// In es, this message translates to:
  /// **'Deportes'**
  String get interestSports;

  /// No description provided for @interestWellness.
  ///
  /// In es, this message translates to:
  /// **'Bienestar'**
  String get interestWellness;

  /// No description provided for @interestArt.
  ///
  /// In es, this message translates to:
  /// **'Arte'**
  String get interestArt;

  /// No description provided for @interestNightlife.
  ///
  /// In es, this message translates to:
  /// **'Nightlife'**
  String get interestNightlife;

  /// No description provided for @activityLow.
  ///
  /// In es, this message translates to:
  /// **'Bajo'**
  String get activityLow;

  /// No description provided for @activityModerate.
  ///
  /// In es, this message translates to:
  /// **'Moderado'**
  String get activityModerate;

  /// No description provided for @activityHigh.
  ///
  /// In es, this message translates to:
  /// **'Alto'**
  String get activityHigh;

  /// No description provided for @activityExtreme.
  ///
  /// In es, this message translates to:
  /// **'Extremo'**
  String get activityExtreme;

  /// No description provided for @travelBackpacker.
  ///
  /// In es, this message translates to:
  /// **'Mochilero'**
  String get travelBackpacker;

  /// No description provided for @travelFamily.
  ///
  /// In es, this message translates to:
  /// **'Familiar'**
  String get travelFamily;

  /// No description provided for @travelLuxury.
  ///
  /// In es, this message translates to:
  /// **'Lujo'**
  String get travelLuxury;

  /// No description provided for @travelAdventure.
  ///
  /// In es, this message translates to:
  /// **'Aventura'**
  String get travelAdventure;

  /// No description provided for @travelRomantic.
  ///
  /// In es, this message translates to:
  /// **'Romántico'**
  String get travelRomantic;

  /// No description provided for @travelBusiness.
  ///
  /// In es, this message translates to:
  /// **'De negocios'**
  String get travelBusiness;

  /// No description provided for @placeBeach.
  ///
  /// In es, this message translates to:
  /// **'Playa'**
  String get placeBeach;

  /// No description provided for @placeMountain.
  ///
  /// In es, this message translates to:
  /// **'Montaña'**
  String get placeMountain;

  /// No description provided for @placeCity.
  ///
  /// In es, this message translates to:
  /// **'Ciudad'**
  String get placeCity;

  /// No description provided for @placeCountryside.
  ///
  /// In es, this message translates to:
  /// **'Campo'**
  String get placeCountryside;

  /// No description provided for @placeForest.
  ///
  /// In es, this message translates to:
  /// **'Bosque'**
  String get placeForest;

  /// No description provided for @placeDesert.
  ///
  /// In es, this message translates to:
  /// **'Desierto'**
  String get placeDesert;

  /// No description provided for @needAccessibility.
  ///
  /// In es, this message translates to:
  /// **'¿Necesitas accesibilidad especial?'**
  String get needAccessibility;

  /// No description provided for @accessibilitySubtitle.
  ///
  /// In es, this message translates to:
  /// **'Rutas adaptadas para movilidad reducida u otras necesidades'**
  String get accessibilitySubtitle;

  /// No description provided for @describeNeedOptional.
  ///
  /// In es, this message translates to:
  /// **'Describe tu necesidad (opcional)'**
  String get describeNeedOptional;

  /// No description provided for @accessibilityHint.
  ///
  /// In es, this message translates to:
  /// **'Ej: silla de ruedas, bastón...'**
  String get accessibilityHint;

  /// No description provided for @visitedHighMountains.
  ///
  /// In es, this message translates to:
  /// **'¿Has visitado las Altas Montañas?'**
  String get visitedHighMountains;

  /// No description provided for @visitedSubtitle.
  ///
  /// In es, this message translates to:
  /// **'Esto nos ayuda a personalizar mejor tus recomendaciones'**
  String get visitedSubtitle;

  /// No description provided for @dietaryRestrictions.
  ///
  /// In es, this message translates to:
  /// **'Restricciones alimentarias o médicas'**
  String get dietaryRestrictions;

  /// No description provided for @dietaryHint.
  ///
  /// In es, this message translates to:
  /// **'Ej: vegetariano, alergia a mariscos... (dejar vacío si ninguna)'**
  String get dietaryHint;

  /// No description provided for @sustainableNoPref.
  ///
  /// In es, this message translates to:
  /// **'Sin preferencia'**
  String get sustainableNoPref;

  /// No description provided for @sustainableLow.
  ///
  /// In es, this message translates to:
  /// **'Baja prioridad'**
  String get sustainableLow;

  /// No description provided for @sustainableMedium.
  ///
  /// In es, this message translates to:
  /// **'Prioridad media'**
  String get sustainableMedium;

  /// No description provided for @sustainableHigh.
  ///
  /// In es, this message translates to:
  /// **'Alta prioridad'**
  String get sustainableHigh;

  /// No description provided for @choosePreference.
  ///
  /// In es, this message translates to:
  /// **'Elige lo que más prefieras'**
  String get choosePreference;

  /// No description provided for @dateFormatPlaceholder.
  ///
  /// In es, this message translates to:
  /// **'Día / Mes / Año'**
  String get dateFormatPlaceholder;

  /// No description provided for @recoTitle.
  ///
  /// In es, this message translates to:
  /// **'Descubrir mis destinos'**
  String get recoTitle;

  /// No description provided for @recoDiscoverNext.
  ///
  /// In es, this message translates to:
  /// **'Descubre tu próxima aventura'**
  String get recoDiscoverNext;

  /// No description provided for @recoAiPersonalizedFor.
  ///
  /// In es, this message translates to:
  /// **'IA personalizada para ti'**
  String get recoAiPersonalizedFor;

  /// No description provided for @recoTourismType.
  ///
  /// In es, this message translates to:
  /// **'Tipo de turismo'**
  String get recoTourismType;

  /// No description provided for @recoChooseOneOrMore.
  ///
  /// In es, this message translates to:
  /// **'Elige uno o más'**
  String get recoChooseOneOrMore;

  /// No description provided for @recoBudget.
  ///
  /// In es, this message translates to:
  /// **'Presupuesto'**
  String get recoBudget;

  /// No description provided for @recoWithWho.
  ///
  /// In es, this message translates to:
  /// **'¿Con quién viajas?'**
  String get recoWithWho;

  /// No description provided for @recoAgeRange.
  ///
  /// In es, this message translates to:
  /// **'Rango de edad'**
  String get recoAgeRange;

  /// No description provided for @recoAdditionalPrefs.
  ///
  /// In es, this message translates to:
  /// **'Preferencias adicionales'**
  String get recoAdditionalPrefs;

  /// No description provided for @recoOptional.
  ///
  /// In es, this message translates to:
  /// **'(opcional)'**
  String get recoOptional;

  /// No description provided for @recoPreloadedBanner.
  ///
  /// In es, this message translates to:
  /// **'Basado en tu perfil'**
  String get recoPreloadedBanner;

  /// No description provided for @recoSelectAtLeastOne.
  ///
  /// In es, this message translates to:
  /// **'Selecciona al menos una opción'**
  String get recoSelectAtLeastOne;

  /// No description provided for @recoSelectAtLeastOneToContinue.
  ///
  /// In es, this message translates to:
  /// **'Selecciona al menos una opción para continuar'**
  String get recoSelectAtLeastOneToContinue;

  /// No description provided for @recoDiscoverDestinations.
  ///
  /// In es, this message translates to:
  /// **'Descubrir destinos'**
  String get recoDiscoverDestinations;

  /// No description provided for @recoNDestinations.
  ///
  /// In es, this message translates to:
  /// **'{n} destinos para ti'**
  String recoNDestinations(Object n);

  /// No description provided for @recoPersonalizedByAI.
  ///
  /// In es, this message translates to:
  /// **'Personalizados por IA'**
  String get recoPersonalizedByAI;

  /// No description provided for @recoHelpImprove.
  ///
  /// In es, this message translates to:
  /// **'Ayúdanos a mejorar'**
  String get recoHelpImprove;

  /// No description provided for @recoHowLiked.
  ///
  /// In es, this message translates to:
  /// **'¿Qué te parecieron estas recomendaciones?'**
  String get recoHowLiked;

  /// No description provided for @recoSkip.
  ///
  /// In es, this message translates to:
  /// **'Saltar'**
  String get recoSkip;

  /// No description provided for @recoSend.
  ///
  /// In es, this message translates to:
  /// **'Enviar'**
  String get recoSend;

  /// No description provided for @recoViewDestination.
  ///
  /// In es, this message translates to:
  /// **'Ver destino'**
  String get recoViewDestination;

  /// No description provided for @recoServiceUnavailable.
  ///
  /// In es, this message translates to:
  /// **'El servicio de recomendaciones no está disponible en este momento'**
  String get recoServiceUnavailable;

  /// No description provided for @recoConnectionError.
  ///
  /// In es, this message translates to:
  /// **'Error de conexión. Revisa tu internet e intenta de nuevo'**
  String get recoConnectionError;

  /// No description provided for @recoShareButton.
  ///
  /// In es, this message translates to:
  /// **'Compartir recomendaciones'**
  String get recoShareButton;

  /// No description provided for @communityDeletePost.
  ///
  /// In es, this message translates to:
  /// **'Eliminar publicación'**
  String get communityDeletePost;

  /// No description provided for @communityDeletePostConfirm.
  ///
  /// In es, this message translates to:
  /// **'¿Estás seguro de que deseas eliminar esta publicación? Esta acción no se puede deshacer.'**
  String get communityDeletePostConfirm;

  /// No description provided for @communityReportPost.
  ///
  /// In es, this message translates to:
  /// **'Reportar publicación'**
  String get communityReportPost;

  /// No description provided for @communityReportReason.
  ///
  /// In es, this message translates to:
  /// **'Motivo del reporte'**
  String get communityReportReason;

  /// No description provided for @communityReportSpam.
  ///
  /// In es, this message translates to:
  /// **'Spam'**
  String get communityReportSpam;

  /// No description provided for @communityReportInappropriate.
  ///
  /// In es, this message translates to:
  /// **'Contenido inapropiado'**
  String get communityReportInappropriate;

  /// No description provided for @communityReportFalse.
  ///
  /// In es, this message translates to:
  /// **'Información falsa'**
  String get communityReportFalse;

  /// No description provided for @communityReportHateful.
  ///
  /// In es, this message translates to:
  /// **'Discurso de odio'**
  String get communityReportHateful;

  /// No description provided for @communityReportSent.
  ///
  /// In es, this message translates to:
  /// **'Reporte enviado. Lo revisaremos pronto.'**
  String get communityReportSent;

  /// No description provided for @securitySection.
  ///
  /// In es, this message translates to:
  /// **'Seguridad'**
  String get securitySection;

  /// No description provided for @activeSessions.
  ///
  /// In es, this message translates to:
  /// **'Sesiones activas'**
  String get activeSessions;

  /// No description provided for @activeSessionsSubtitle.
  ///
  /// In es, this message translates to:
  /// **'Administra tus dispositivos conectados'**
  String get activeSessionsSubtitle;

  /// No description provided for @sessionRevokeSuccess.
  ///
  /// In es, this message translates to:
  /// **'Sesión cerrada correctamente'**
  String get sessionRevokeSuccess;

  /// No description provided for @sessionRevokeError.
  ///
  /// In es, this message translates to:
  /// **'No se pudo cerrar la sesión. Inténtalo de nuevo.'**
  String get sessionRevokeError;

  /// No description provided for @noSessionsRegistered.
  ///
  /// In es, this message translates to:
  /// **'Sin sesiones registradas'**
  String get noSessionsRegistered;

  /// No description provided for @defaultDevice.
  ///
  /// In es, this message translates to:
  /// **'Dispositivo'**
  String get defaultDevice;

  /// No description provided for @sessionRevokeTooltip.
  ///
  /// In es, this message translates to:
  /// **'Cerrar sesión'**
  String get sessionRevokeTooltip;

  /// No description provided for @sessionCreatedSince.
  ///
  /// In es, this message translates to:
  /// **'Desde'**
  String get sessionCreatedSince;

  /// No description provided for @recoGuidedTours.
  ///
  /// In es, this message translates to:
  /// **'Tours guiados'**
  String get recoGuidedTours;

  /// No description provided for @recoNeedHotel.
  ///
  /// In es, this message translates to:
  /// **'Necesito hotel'**
  String get recoNeedHotel;

  /// No description provided for @recoFoodOptions.
  ///
  /// In es, this message translates to:
  /// **'Opciones de comida'**
  String get recoFoodOptions;

  /// No description provided for @recoAccessible.
  ///
  /// In es, this message translates to:
  /// **'Accesible'**
  String get recoAccessible;

  /// No description provided for @recoOutdoor.
  ///
  /// In es, this message translates to:
  /// **'Al aire libre'**
  String get recoOutdoor;

  /// No description provided for @latencyMs.
  ///
  /// In es, this message translates to:
  /// **'{ms} ms'**
  String latencyMs(Object ms);

  /// No description provided for @homeOfflineBanner.
  ///
  /// In es, this message translates to:
  /// **'Sin conexión. Activa el internet para ver el mapa.'**
  String get homeOfflineBanner;

  /// No description provided for @welcomeGreeting.
  ///
  /// In es, this message translates to:
  /// **'Bienvenido'**
  String get welcomeGreeting;

  /// No description provided for @recoPreloadedBannerDesc.
  ///
  /// In es, this message translates to:
  /// **'Precargamos respuestas basadas en tus preferencias guardadas'**
  String get recoPreloadedBannerDesc;

  /// No description provided for @onboardingTitle1.
  ///
  /// In es, this message translates to:
  /// **'Tu aventura comienza aquí'**
  String get onboardingTitle1;

  /// No description provided for @onboardingDesc1.
  ///
  /// In es, this message translates to:
  /// **'Explora los rincones más mágicos de las Altas Montañas con rutas diseñadas para el explorador moderno.'**
  String get onboardingDesc1;

  /// No description provided for @onboardingTitle2.
  ///
  /// In es, this message translates to:
  /// **'Inteligencia que te conoce'**
  String get onboardingTitle2;

  /// No description provided for @onboardingDesc2.
  ///
  /// In es, this message translates to:
  /// **'Analizamos tus preferencias para que cada recomendación se sienta escrita solo para ti.'**
  String get onboardingDesc2;

  /// No description provided for @onboardingTitle3.
  ///
  /// In es, this message translates to:
  /// **'Vive lo auténtico'**
  String get onboardingTitle3;

  /// No description provided for @onboardingDesc3.
  ///
  /// In es, this message translates to:
  /// **'Conecta con guías locales y apoya el turismo de nuestra región mientras creas recuerdos inolvidables.'**
  String get onboardingDesc3;

  /// No description provided for @errorTitle.
  ///
  /// In es, this message translates to:
  /// **'Error'**
  String get errorTitle;

  /// No description provided for @settingsCheckUpdate.
  ///
  /// In es, this message translates to:
  /// **'Buscar actualización'**
  String get settingsCheckUpdate;

  /// No description provided for @settingsAppUpToDate.
  ///
  /// In es, this message translates to:
  /// **'SMARTUR v{version} está al día.'**
  String settingsAppUpToDate(Object version);

  /// No description provided for @languageSpanish.
  ///
  /// In es, this message translates to:
  /// **'Español'**
  String get languageSpanish;

  /// No description provided for @languageEnglish.
  ///
  /// In es, this message translates to:
  /// **'English'**
  String get languageEnglish;

  /// No description provided for @languageFrench.
  ///
  /// In es, this message translates to:
  /// **'Français'**
  String get languageFrench;

  /// No description provided for @languagePortuguese.
  ///
  /// In es, this message translates to:
  /// **'Português'**
  String get languagePortuguese;

  /// No description provided for @themeLight.
  ///
  /// In es, this message translates to:
  /// **'Claro'**
  String get themeLight;

  /// No description provided for @themeDark.
  ///
  /// In es, this message translates to:
  /// **'Oscuro'**
  String get themeDark;

  /// No description provided for @navAiShort.
  ///
  /// In es, this message translates to:
  /// **'IA'**
  String get navAiShort;

  /// No description provided for @diaryAiSessionsEmptyTitle.
  ///
  /// In es, this message translates to:
  /// **'Sin sesiones de recomendaciones'**
  String get diaryAiSessionsEmptyTitle;

  /// No description provided for @diaryAiSessionsEmptySubtitle.
  ///
  /// In es, this message translates to:
  /// **'Las sesiones generadas desde la app o desde la plataforma web aparecerán aquí.'**
  String get diaryAiSessionsEmptySubtitle;

  /// No description provided for @diaryMoreCount.
  ///
  /// In es, this message translates to:
  /// **'+{count} más'**
  String diaryMoreCount(Object count);

  /// No description provided for @diarySessionDestinationsCount.
  ///
  /// In es, this message translates to:
  /// **'{count} destinos de esta sesión'**
  String diarySessionDestinationsCount(Object count);

  /// No description provided for @diaryTapDestinationHint.
  ///
  /// In es, this message translates to:
  /// **'Toca un destino para ver más'**
  String get diaryTapDestinationHint;

  /// No description provided for @mapRetry.
  ///
  /// In es, this message translates to:
  /// **'Reintentar'**
  String get mapRetry;

  /// No description provided for @updateTitle.
  ///
  /// In es, this message translates to:
  /// **'Nueva versión disponible'**
  String get updateTitle;

  /// No description provided for @updateBody.
  ///
  /// In es, this message translates to:
  /// **'La versión {version} de SMARTUR está disponible.\nSe descargará e instalará desde la app.'**
  String updateBody(Object version);

  /// No description provided for @updateDownloading.
  ///
  /// In es, this message translates to:
  /// **'Descargando... {progress}%'**
  String updateDownloading(Object progress);

  /// No description provided for @updatePreparingInstaller.
  ///
  /// In es, this message translates to:
  /// **'Preparando instalador...'**
  String get updatePreparingInstaller;

  /// No description provided for @updateDownloadError.
  ///
  /// In es, this message translates to:
  /// **'Error al descargar. Verifica tu conexión e intenta de nuevo.'**
  String get updateDownloadError;

  /// No description provided for @updateLater.
  ///
  /// In es, this message translates to:
  /// **'Después'**
  String get updateLater;

  /// No description provided for @updateRetry.
  ///
  /// In es, this message translates to:
  /// **'Reintentar'**
  String get updateRetry;

  /// No description provided for @updateNow.
  ///
  /// In es, this message translates to:
  /// **'Actualizar ahora'**
  String get updateNow;

  /// No description provided for @updateConfirmInstall.
  ///
  /// In es, this message translates to:
  /// **'En la pantalla del sistema, pulsa «Instalar» para completar la actualización. Si cancelas, seguirás en la versión anterior.'**
  String get updateConfirmInstall;

  /// No description provided for @updateInstallPermission.
  ///
  /// In es, this message translates to:
  /// **'Permite instalar apps de esta fuente (Ajustes) y pulsa «Actualizar ahora» otra vez.'**
  String get updateInstallPermission;

  /// No description provided for @updateInstallDone.
  ///
  /// In es, this message translates to:
  /// **'Entendido'**
  String get updateInstallDone;

  /// No description provided for @imageShareTitle.
  ///
  /// In es, this message translates to:
  /// **'Mis Recomendaciones en {city}'**
  String imageShareTitle(Object city);

  /// No description provided for @imageShareSubtitle.
  ///
  /// In es, this message translates to:
  /// **'Basado en mi perfil de viajero inteligente'**
  String get imageShareSubtitle;

  /// No description provided for @imageShareGeneratedBy.
  ///
  /// In es, this message translates to:
  /// **'Generado por SMARTUR AI'**
  String get imageShareGeneratedBy;

  /// No description provided for @imageShareMessage.
  ///
  /// In es, this message translates to:
  /// **'¡Mira lo que me recomienda SMARTUR en {city}!'**
  String imageShareMessage(Object city);

  /// No description provided for @commonPlaceFallback.
  ///
  /// In es, this message translates to:
  /// **'Lugar'**
  String get commonPlaceFallback;

  /// No description provided for @recoTypeCultural.
  ///
  /// In es, this message translates to:
  /// **'Cultural'**
  String get recoTypeCultural;

  /// No description provided for @recoTypeNature.
  ///
  /// In es, this message translates to:
  /// **'Naturaleza'**
  String get recoTypeNature;

  /// No description provided for @recoTypeGastronomy.
  ///
  /// In es, this message translates to:
  /// **'Gastronómico'**
  String get recoTypeGastronomy;

  /// No description provided for @recoTypeAdventure.
  ///
  /// In es, this message translates to:
  /// **'Aventura'**
  String get recoTypeAdventure;

  /// No description provided for @recoTypeRelax.
  ///
  /// In es, this message translates to:
  /// **'Descanso'**
  String get recoTypeRelax;

  /// No description provided for @recoTypeNight.
  ///
  /// In es, this message translates to:
  /// **'Nocturno'**
  String get recoTypeNight;

  /// No description provided for @recoBudgetLowLabel.
  ///
  /// In es, this message translates to:
  /// **'Económico'**
  String get recoBudgetLowLabel;

  /// No description provided for @recoBudgetLowSub.
  ///
  /// In es, this message translates to:
  /// **'Máx. \$500/día'**
  String get recoBudgetLowSub;

  /// No description provided for @recoBudgetMediumLabel.
  ///
  /// In es, this message translates to:
  /// **'Moderado'**
  String get recoBudgetMediumLabel;

  /// No description provided for @recoBudgetMediumSub.
  ///
  /// In es, this message translates to:
  /// **'\$500–1500/día'**
  String get recoBudgetMediumSub;

  /// No description provided for @recoBudgetHighLabel.
  ///
  /// In es, this message translates to:
  /// **'Premium'**
  String get recoBudgetHighLabel;

  /// No description provided for @recoBudgetHighSub.
  ///
  /// In es, this message translates to:
  /// **'\$1500+/día'**
  String get recoBudgetHighSub;

  /// No description provided for @recoGroupSolo.
  ///
  /// In es, this message translates to:
  /// **'Solo'**
  String get recoGroupSolo;

  /// No description provided for @recoGroupCouple.
  ///
  /// In es, this message translates to:
  /// **'Pareja'**
  String get recoGroupCouple;

  /// No description provided for @recoGroupFamily.
  ///
  /// In es, this message translates to:
  /// **'Familia'**
  String get recoGroupFamily;

  /// No description provided for @recoGroupFriends.
  ///
  /// In es, this message translates to:
  /// **'Amigos'**
  String get recoGroupFriends;

  /// No description provided for @recoShareList.
  ///
  /// In es, this message translates to:
  /// **'🌿 Mis destinos recomendados en Altas Montañas de Veracruz:\n\n• {items}\n\n📱 Descúbrelos con SMARTUR'**
  String recoShareList(Object items);

  /// No description provided for @detailShareMessage.
  ///
  /// In es, this message translates to:
  /// **'¡Descubre {title} en {location}! 📍{description}\nVer en Maps: {mapsUrl}\n\nDescubierto con SMARTUR — Altas Montañas, Veracruz'**
  String detailShareMessage(
    Object title,
    Object location,
    Object description,
    Object mapsUrl,
  );

  /// No description provided for @mapsLabel.
  ///
  /// In es, this message translates to:
  /// **'Maps'**
  String get mapsLabel;

  /// No description provided for @youAreHere.
  ///
  /// In es, this message translates to:
  /// **'← Estás aquí'**
  String get youAreHere;

  /// No description provided for @recoSavedInDiary.
  ///
  /// In es, this message translates to:
  /// **'Recomendaciones guardadas. Puedes revisarlas en Diario.'**
  String get recoSavedInDiary;

  /// No description provided for @recoResultsDone.
  ///
  /// In es, this message translates to:
  /// **'Listo'**
  String get recoResultsDone;

  /// No description provided for @recoResultsRankHint.
  ///
  /// In es, this message translates to:
  /// **'Ordenados por compatibilidad con tu perfil'**
  String get recoResultsRankHint;

  /// No description provided for @googleSignInReleaseConfig.
  ///
  /// In es, this message translates to:
  /// **'Esta versión de la app no tiene Google Sign-In configurado. El administrador debe registrar el SHA del keystore de release en Firebase.'**
  String get googleSignInReleaseConfig;

  /// No description provided for @communityEmpty.
  ///
  /// In es, this message translates to:
  /// **'No hay publicaciones todavía'**
  String get communityEmpty;

  /// No description provided for @communityEmptyHint.
  ///
  /// In es, this message translates to:
  /// **'Sé el primero en compartir tu experiencia'**
  String get communityEmptyHint;

  /// No description provided for @communityFirstPost.
  ///
  /// In es, this message translates to:
  /// **'Crear publicación'**
  String get communityFirstPost;

  /// No description provided for @communityPostHint.
  ///
  /// In es, this message translates to:
  /// **'¿Qué quieres compartir?'**
  String get communityPostHint;

  /// No description provided for @communityReport.
  ///
  /// In es, this message translates to:
  /// **'Reportar'**
  String get communityReport;

  /// No description provided for @communityReportTitle.
  ///
  /// In es, this message translates to:
  /// **'¿Por qué reportas esta publicación?'**
  String get communityReportTitle;

  /// No description provided for @communityReportOther.
  ///
  /// In es, this message translates to:
  /// **'Otro motivo'**
  String get communityReportOther;

  /// No description provided for @plannerTitle.
  ///
  /// In es, this message translates to:
  /// **'Planificador'**
  String get plannerTitle;

  /// No description provided for @plannerDelete.
  ///
  /// In es, this message translates to:
  /// **'Eliminar ruta'**
  String get plannerDelete;

  /// No description provided for @plannerDeleteConfirm.
  ///
  /// In es, this message translates to:
  /// **'¿Eliminar esta ruta permanentemente?'**
  String get plannerDeleteConfirm;

  /// No description provided for @plannerAddStop.
  ///
  /// In es, this message translates to:
  /// **'Agregar parada'**
  String get plannerAddStop;

  /// No description provided for @plannerNoStops.
  ///
  /// In es, this message translates to:
  /// **'Sin paradas'**
  String get plannerNoStops;

  /// No description provided for @plannerNoStopsSubtitle.
  ///
  /// In es, this message translates to:
  /// **'Toca + en cualquier lugar para agregar paradas'**
  String get plannerNoStopsSubtitle;

  /// No description provided for @plannerOptimize.
  ///
  /// In es, this message translates to:
  /// **'Optimizar con IA'**
  String get plannerOptimize;

  /// No description provided for @plannerOptimizeComingSoon.
  ///
  /// In es, this message translates to:
  /// **'Próximamente en SMARTUR'**
  String get plannerOptimizeComingSoon;

  /// No description provided for @plannerRouteName.
  ///
  /// In es, this message translates to:
  /// **'Nombre de la ruta'**
  String get plannerRouteName;

  /// No description provided for @plannerRouteNameHint.
  ///
  /// In es, this message translates to:
  /// **'Ej: Mi ruta en Xalapa'**
  String get plannerRouteNameHint;

  /// No description provided for @plannerMakePublic.
  ///
  /// In es, this message translates to:
  /// **'Hacer ruta pública'**
  String get plannerMakePublic;

  /// No description provided for @plannerStopDate.
  ///
  /// In es, this message translates to:
  /// **'Fecha de visita'**
  String get plannerStopDate;

  /// No description provided for @plannerStopNotes.
  ///
  /// In es, this message translates to:
  /// **'Notas'**
  String get plannerStopNotes;

  /// No description provided for @plannerStopDelete.
  ///
  /// In es, this message translates to:
  /// **'Quitar parada'**
  String get plannerStopDelete;

  /// No description provided for @itineraryNStops.
  ///
  /// In es, this message translates to:
  /// **'{n} paradas'**
  String itineraryNStops(int n);

  /// No description provided for @itineraryCertified.
  ///
  /// In es, this message translates to:
  /// **'Certificada SMARTUR'**
  String get itineraryCertified;

  /// No description provided for @itineraryCopy.
  ///
  /// In es, this message translates to:
  /// **'Copiar ruta'**
  String get itineraryCopy;

  /// No description provided for @itineraryCopied.
  ///
  /// In es, this message translates to:
  /// **'Ruta copiada'**
  String get itineraryCopied;

  /// No description provided for @itineraryDetail.
  ///
  /// In es, this message translates to:
  /// **'Detalle de ruta'**
  String get itineraryDetail;

  /// No description provided for @itineraryPublic.
  ///
  /// In es, this message translates to:
  /// **'Pública'**
  String get itineraryPublic;

  /// No description provided for @itineraryPrivate.
  ///
  /// In es, this message translates to:
  /// **'Privada'**
  String get itineraryPrivate;

  /// No description provided for @itineraryStops.
  ///
  /// In es, this message translates to:
  /// **'Paradas'**
  String get itineraryStops;

  /// No description provided for @routesLoadError.
  ///
  /// In es, this message translates to:
  /// **'Error al cargar rutas'**
  String get routesLoadError;

  /// No description provided for @socialFollow.
  ///
  /// In es, this message translates to:
  /// **'Seguir'**
  String get socialFollow;

  /// No description provided for @socialFollowing.
  ///
  /// In es, this message translates to:
  /// **'Siguiendo'**
  String get socialFollowing;

  /// No description provided for @socialUnfollow.
  ///
  /// In es, this message translates to:
  /// **'Dejar de seguir'**
  String get socialUnfollow;

  /// No description provided for @socialFollowers.
  ///
  /// In es, this message translates to:
  /// **'Seguidores'**
  String get socialFollowers;

  /// No description provided for @socialFollowersCount.
  ///
  /// In es, this message translates to:
  /// **'{n} seguidores'**
  String socialFollowersCount(int n);

  /// No description provided for @socialFollowingCount.
  ///
  /// In es, this message translates to:
  /// **'{n} siguiendo'**
  String socialFollowingCount(int n);

  /// No description provided for @socialSearchUsers.
  ///
  /// In es, this message translates to:
  /// **'Buscar usuarios...'**
  String get socialSearchUsers;

  /// No description provided for @socialNoResults.
  ///
  /// In es, this message translates to:
  /// **'No se encontraron usuarios'**
  String get socialNoResults;

  /// No description provided for @publicRoutes.
  ///
  /// In es, this message translates to:
  /// **'Rutas públicas'**
  String get publicRoutes;

  /// No description provided for @noPublicRoutes.
  ///
  /// In es, this message translates to:
  /// **'Sin rutas públicas aún'**
  String get noPublicRoutes;

  /// No description provided for @copyToMyRoutes.
  ///
  /// In es, this message translates to:
  /// **'Copiar a mis rutas'**
  String get copyToMyRoutes;

  /// No description provided for @routeCopied.
  ///
  /// In es, this message translates to:
  /// **'Ruta copiada a Mis Rutas'**
  String get routeCopied;

  /// No description provided for @viewProfile.
  ///
  /// In es, this message translates to:
  /// **'Ver perfil'**
  String get viewProfile;

  /// No description provided for @compareTitle.
  ///
  /// In es, this message translates to:
  /// **'Comparar Rutas'**
  String get compareTitle;

  /// No description provided for @compareYourRoute.
  ///
  /// In es, this message translates to:
  /// **'Tu ruta'**
  String get compareYourRoute;

  /// No description provided for @compareOptimized.
  ///
  /// In es, this message translates to:
  /// **'Ruta optimizada'**
  String get compareOptimized;

  /// No description provided for @compareDistanceLabel.
  ///
  /// In es, this message translates to:
  /// **'Distancia'**
  String get compareDistanceLabel;

  /// No description provided for @compareSavingsLabel.
  ///
  /// In es, this message translates to:
  /// **'Ahorro'**
  String get compareSavingsLabel;

  /// No description provided for @compareMoreEfficient.
  ///
  /// In es, this message translates to:
  /// **'más eficiente'**
  String get compareMoreEfficient;

  /// No description provided for @compareKeep.
  ///
  /// In es, this message translates to:
  /// **'Mantener mi ruta'**
  String get compareKeep;

  /// No description provided for @compareApply.
  ///
  /// In es, this message translates to:
  /// **'Usar ruta optimizada'**
  String get compareApply;

  /// No description provided for @compareLoading.
  ///
  /// In es, this message translates to:
  /// **'Optimizando con IA...'**
  String get compareLoading;

  /// No description provided for @compareApplied.
  ///
  /// In es, this message translates to:
  /// **'Ruta optimizada aplicada'**
  String get compareApplied;

  /// No description provided for @compareMinStops.
  ///
  /// In es, this message translates to:
  /// **'Necesitas al menos 2 paradas con ubicación'**
  String get compareMinStops;

  /// No description provided for @bookingTitle.
  ///
  /// In es, this message translates to:
  /// **'Reservar servicio'**
  String get bookingTitle;

  /// No description provided for @bookingDate.
  ///
  /// In es, this message translates to:
  /// **'Fecha de visita'**
  String get bookingDate;

  /// No description provided for @bookingTime.
  ///
  /// In es, this message translates to:
  /// **'Hora (opcional)'**
  String get bookingTime;

  /// No description provided for @bookingGuests.
  ///
  /// In es, this message translates to:
  /// **'Personas'**
  String get bookingGuests;

  /// No description provided for @bookingNotes.
  ///
  /// In es, this message translates to:
  /// **'Notas (opcional)'**
  String get bookingNotes;

  /// No description provided for @bookingConfirm.
  ///
  /// In es, this message translates to:
  /// **'Confirmar reserva'**
  String get bookingConfirm;

  /// No description provided for @bookingSuccess.
  ///
  /// In es, this message translates to:
  /// **'Reserva enviada con éxito'**
  String get bookingSuccess;

  /// No description provided for @bookingStatusPending.
  ///
  /// In es, this message translates to:
  /// **'Pendiente'**
  String get bookingStatusPending;

  /// No description provided for @bookingStatusConfirmed.
  ///
  /// In es, this message translates to:
  /// **'Confirmada'**
  String get bookingStatusConfirmed;

  /// No description provided for @bookingStatusCancelled.
  ///
  /// In es, this message translates to:
  /// **'Cancelada'**
  String get bookingStatusCancelled;

  /// No description provided for @bookingMyBookings.
  ///
  /// In es, this message translates to:
  /// **'Mis reservas'**
  String get bookingMyBookings;

  /// No description provided for @bookingNoBookings.
  ///
  /// In es, this message translates to:
  /// **'Sin reservas aún'**
  String get bookingNoBookings;

  /// No description provided for @bookingCancel.
  ///
  /// In es, this message translates to:
  /// **'Cancelar reserva'**
  String get bookingCancel;

  /// No description provided for @chatTitle.
  ///
  /// In es, this message translates to:
  /// **'Mensajes'**
  String get chatTitle;

  /// No description provided for @chatSend.
  ///
  /// In es, this message translates to:
  /// **'Enviar'**
  String get chatSend;

  /// No description provided for @chatNoConversations.
  ///
  /// In es, this message translates to:
  /// **'Sin conversaciones aún'**
  String get chatNoConversations;

  /// No description provided for @chatTypeHere.
  ///
  /// In es, this message translates to:
  /// **'Escribe un mensaje...'**
  String get chatTypeHere;

  /// No description provided for @chatContact.
  ///
  /// In es, this message translates to:
  /// **'Contactar empresa'**
  String get chatContact;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en', 'es', 'fr', 'pt'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
    case 'es':
      return AppLocalizationsEs();
    case 'fr':
      return AppLocalizationsFr();
    case 'pt':
      return AppLocalizationsPt();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
