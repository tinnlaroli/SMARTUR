// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for French (`fr`).
class AppLocalizationsFr extends AppLocalizations {
  AppLocalizationsFr([String locale = 'fr']) : super(locale);

  @override
  String get appTitle => 'SMARTUR';

  @override
  String get settingsTitle => 'Paramètres';

  @override
  String get appearanceSection => 'Apparence';

  @override
  String get accountSection => 'Compte';

  @override
  String get infoSection => 'Informations';

  @override
  String get darkMode => 'Mode sombre';

  @override
  String get language => 'Langue';

  @override
  String get changePassword => 'Changer le mot de passe';

  @override
  String get editName => 'Modifier le nom';

  @override
  String get deleteAccount => 'Supprimer le compte';

  @override
  String get appVersion => 'Version de l\'application';

  @override
  String get termsAndConditions => 'Conditions d\'utilisation';

  @override
  String get privacyPolicy => 'Politique de confidentialité';

  @override
  String get registerAcceptTermsPrefix => 'J\'accepte les ';

  @override
  String get termsMustAccept =>
      'Vous devez accepter les conditions d\'utilisation pour vous inscrire.';

  @override
  String get termsCloseButton => 'Compris';

  @override
  String get termsAndConditionsBody =>
      'Dernière mise à jour : mars 2025.\n\n1. Objet\nSMARTUR est une application mobile pour explorer des destinations touristiques, des recommandations et des fonctions communautaires.\n\n2. Inscription et compte\nEn créant un compte, vous confirmez que vos informations sont exactes. Vous êtes responsable de la confidentialité de votre mot de passe et des activités sous votre compte.\n\n3. Utilisation autorisée\nVous vous engagez à utiliser le service de manière licite, sans porter atteinte aux droits de tiers ni au fonctionnement de la plateforme.\n\n4. Contenu et propriété intellectuelle\nLes contenus de l\'application (textes, design, marques) sont protégés. Toute reproduction non autorisée est interdite.\n\n5. Données personnelles\nLe traitement de vos données personnelles est conforme à la législation applicable. En utilisant SMARTUR, vous acceptez les pratiques décrites dans la politique de confidentialité du service.\n\n6. Modifications\nNous pouvons mettre à jour ces conditions. Les changements importants seront communiqués par des moyens raisonnables ; l\'utilisation continue après mise à jour vaut acceptation des nouvelles conditions.\n\n7. Contact\nPour toute question sur ces conditions, utilisez les canaux d\'assistance indiqués dans l\'application ou sur le site officiel.';

  @override
  String get privacyPolicyBody =>
      'Dernière mise à jour : mars 2025.\n\n1. Responsable du traitement\nSMARTUR est le responsable du traitement de vos données personnelles.\n\n2. Données collectées\nNous collectons les données que vous fournissez lors de l\'inscription (nom, e-mail, photo de profil optionnelle) et les données générées par l\'utilisation de l\'application (préférences de voyage, historique des recommandations, évaluations de lieux).\n\n3. Finalité du traitement\nVos données sont utilisées pour personnaliser les recommandations touristiques, améliorer l\'application et communiquer avec vous sur le service.\n\n4. Base légale\nLe traitement est basé sur votre consentement explicite lors de l\'acceptation de ces conditions et sur l\'exécution du contrat de service.\n\n5. Conservation des données\nNous conservons vos données tant que votre compte est actif. Vous pouvez demander leur suppression à tout moment via Paramètres → Supprimer le compte.\n\n6. Droits des utilisateurs\nVous avez le droit d\'accéder, de rectifier, de supprimer et de porter vos données personnelles. Pour exercer ces droits, contactez-nous via les canaux d\'assistance.\n\n7. Sécurité\nNous appliquons des mesures techniques et organisationnelles pour protéger vos données contre les accès non autorisés ou les pertes accidentelles.\n\n8. Contact\nPour toute question sur la confidentialité : smarturutcv@gmail.com';

  @override
  String get logout => 'Se déconnecter';

  @override
  String get selectLanguage => 'Choisir la langue';

  @override
  String get systemLanguage => 'Langue du système';

  @override
  String get systemTheme => 'Thème du système';

  @override
  String get cancel => 'Annuler';

  @override
  String get save => 'Enregistrer';

  @override
  String get deleteAccountTitle => 'Supprimer le compte';

  @override
  String get deleteAccountConfirm =>
      'Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible et vous perdrez votre historique de voyages.';

  @override
  String get deleteAccountYes => 'Oui, supprimer';

  @override
  String get editNameTitle => 'Modifier le nom';

  @override
  String get yourName => 'Votre nom';

  @override
  String get changePasswordTitle => 'Changer le mot de passe';

  @override
  String get changePasswordStep0Hint =>
      'Nous vous enverrons un code de vérification par e-mail.';

  @override
  String get changePasswordStep1Hint =>
      'Saisissez le code et votre nouveau mot de passe.';

  @override
  String get verificationCode => 'Code de vérification';

  @override
  String get newPassword => 'Nouveau mot de passe';

  @override
  String get confirmPassword => 'Confirmer le mot de passe';

  @override
  String get sendCode => 'Envoyer le code';

  @override
  String get updatePassword => 'Mettre à jour le mot de passe';

  @override
  String get resendCode => 'Renvoyer le code';

  @override
  String get codeSixDigits => 'Code à 6 chiffres';

  @override
  String get passwordMinChars => 'Minimum 8 caractères';

  @override
  String get passwordNeedUpper => 'Incluez au moins une majuscule';

  @override
  String get passwordNeedLower => 'Incluez au moins une minuscule';

  @override
  String get passwordNeedNumber => 'Incluez au moins un chiffre';

  @override
  String get passwordsDontMatch => 'Les mots de passe ne correspondent pas';

  @override
  String codeSentToEmail(Object email) {
    return 'Code envoyé à $email';
  }

  @override
  String get emailNotFound => 'E-mail introuvable';

  @override
  String get loading => 'Chargement...';

  @override
  String get welcomeBack => 'Bon retour';

  @override
  String get startNow => 'Commencer';

  @override
  String get loginSubtitle => 'Saisissez vos identifiants pour continuer.';

  @override
  String get registerSubtitle =>
      'Inscrivez-vous pour découvrir des itinéraires personnalisés.';

  @override
  String get continueWithEmail => 'Continuer avec e-mail';

  @override
  String get registerWithEmail => 'S\'inscrire avec e-mail';

  @override
  String get tagline => 'IA qui guide, tourisme qui unit';

  @override
  String get start => 'Commencer';

  @override
  String get loginWithBiometrics => 'Se connecter avec empreinte';

  @override
  String get navHome => 'Accueil';

  @override
  String get navDiary => 'Journal';

  @override
  String get navRecommend => 'Recommander';

  @override
  String get navCommunity => 'Communauté';

  @override
  String get navUser => 'Profil';

  @override
  String get communityTitle => 'Communauté';

  @override
  String get uploadPhotoAction => 'Ajouter une photo';

  @override
  String get communityCreatePost => 'Créer une publication';

  @override
  String get communityPostCaptionHint => 'Que voulez-vous partager ?';

  @override
  String get communitySelectPlace => 'Lieu associé';

  @override
  String get communitySelectPlaceHint => 'Choisissez le lieu concerné';

  @override
  String get communityAttachImage => 'Joindre une image';

  @override
  String get communityRemoveImage => 'Retirer l’image';

  @override
  String get communityPublish => 'Publier';

  @override
  String get communityNeedPlace => 'Sélectionnez un lieu';

  @override
  String get communityNeedTextOrImage =>
      'Écrivez un message ou joignez une image';

  @override
  String get communityLoadPlacesError => 'Impossible de charger les lieux';

  @override
  String get communityPostPublished => 'Publication créée';

  @override
  String get communityImageRejected =>
      'Cette image ne respecte pas les règles de la communauté. Choisissez une photo adaptée à tous les publics.';

  @override
  String get communityImageModerationUnavailable =>
      'Impossible de vérifier l\'image pour le moment. Réessayez plus tard.';

  @override
  String get diaryTitle => 'Mon journal';

  @override
  String get favoritesTab => 'Favoris';

  @override
  String get historyTab => 'Historique';

  @override
  String get offlineAvailable => 'Disponible hors ligne';

  @override
  String recommendationsInCity(Object city) {
    return 'Recommandations à $city';
  }

  @override
  String recommendationNumber(Object number) {
    return 'Recommandation #$number';
  }

  @override
  String recommendationSubtitle(Object city) {
    return 'Suggéré par l\'IA de SMARTUR pour votre visite à $city.';
  }

  @override
  String get mapDiscoverHint =>
      'Découvrez des points clés sans suivre votre position en temps réel.';

  @override
  String get mapTapPinHint =>
      'Touchez un repère pour voir des détails générés par l\'IA';

  @override
  String get filterAll => 'Tous';

  @override
  String get filterMuseums => 'Culture';

  @override
  String get filterCafes => 'Gastronomie';

  @override
  String get filterViewpoints => 'Aventures';

  @override
  String get filterHotels => 'Hébergement';

  @override
  String get filterMuseumsOnly => 'Musées uniquement';

  @override
  String get aiSmartur => 'IA Smartur';

  @override
  String get enableBiometricsHint =>
      'Connectez-vous et activez l\'empreinte dans votre profil';

  @override
  String get deviceNotSupported => 'Appareil non compatible';

  @override
  String get noBiometricsEnrolled => 'Aucune empreinte enregistrée';

  @override
  String get biometricReason => 'Accédez à vos itinéraires SMARTUR';

  @override
  String get sessionExpired => 'Session expirée. Veuillez vous reconnecter.';

  @override
  String get biometricReadError => 'Erreur lors de la lecture de l\'empreinte.';

  @override
  String get quickAccess => 'Accès rapide';

  @override
  String get activate => 'Activer';

  @override
  String get notNow => 'Pas maintenant';

  @override
  String get dontRemindMe => 'Ne plus me rappeler';

  @override
  String get biometricPrompt =>
      'Voulez-vous utiliser votre empreinte pour vous connecter plus vite la prochaine fois ?';

  @override
  String get biometricActivateReason =>
      'Confirmez votre empreinte pour activer l\'accès rapide';

  @override
  String get biometricActivateTitle => 'Activer l\'empreinte — SMARTUR';

  @override
  String get biometricTouchSensor => 'Touchez le capteur';

  @override
  String get biometricActivated => 'Accès par empreinte activé';

  @override
  String biometricActivateError(Object error) {
    return 'Impossible d\'activer : $error';
  }

  @override
  String get biometricDeactivated => 'L\'empreinte ne sera plus demandée';

  @override
  String get biometricConfirmActivate =>
      'Confirmez votre empreinte pour activer';

  @override
  String get biometricCouldNotActivate => 'Impossible d\'activer l\'empreinte';

  @override
  String get myProfile => 'Mon profil';

  @override
  String get manageAccount => 'Gérez votre compte rapidement';

  @override
  String get myPreferences => 'Mes préférences';

  @override
  String get yourPreferences => 'Vos préférences';

  @override
  String get noPreferencesSaved =>
      'Vous n\'avez pas encore enregistré de préférences.';

  @override
  String get confirmChangePreferences =>
      'Êtes-vous sûr de vouloir les modifier ?';

  @override
  String get change => 'Modifier';

  @override
  String get fingerprintAccess => 'Accès par empreinte';

  @override
  String get configuration => 'Paramètres';

  @override
  String exploreGreeting(Object name) {
    return 'Explorer$name';
  }

  @override
  String get highMountainsVeracruz => 'Altas Montañas, Veracruz';

  @override
  String get exploreHighMountains => 'Explorez les Hautes Montagnes';

  @override
  String recommendationsForYou(Object name) {
    return 'Recommandations pour vous, $name';
  }

  @override
  String get weatherNow => 'Météo actuelle';

  @override
  String get notAvailable => 'Non disponible';

  @override
  String get allCategories => 'Tous';

  @override
  String get noCategoryPlaces =>
      'Aucun lieu dans cette catégorie pour le moment';

  @override
  String get exploreNoCities =>
      'Aucune ville avec des lieux depuis le serveur.';

  @override
  String get exploreCouldNotLoad =>
      'Impossible de charger les lieux. Vérifiez votre connexion.';

  @override
  String get exploreAllCities => 'Toutes les villes';

  @override
  String get tabHistory => 'Histoire';

  @override
  String get tabLocation => 'Emplacement';

  @override
  String get tabGastronomy => 'Gastronomie';

  @override
  String get tabAiSummary => 'Résumé IA';

  @override
  String get fromPrice => 'Depuis';

  @override
  String get free => 'Gratuit';

  @override
  String get createOneDayRoute => 'Créer un itinéraire d\'1 jour';

  @override
  String get openInMaps => 'Ouvrir dans Google Maps';

  @override
  String locationNoCoords(String city) {
    return 'Lieu : $city';
  }

  @override
  String get searchHint => 'Rechercher des lieux...';

  @override
  String searchNoResults(String q) {
    return 'Aucun résultat pour \"$q\"';
  }

  @override
  String get tabLocationPlaceholder => 'Carte et points clés à visiter.';

  @override
  String get tabGastronomyPlaceholder =>
      'Plats typiques et cafés recommandés de la zone.';

  @override
  String get tabAiPlaceholder =>
      'Résumé généré par IA avec avis et notes d\'autres touristes.';

  @override
  String get tabRate => 'Évaluer';

  @override
  String get rateHint => 'Votre note améliore vos recommandations';

  @override
  String get rateThanks => 'Merci pour votre note !';

  @override
  String get invalidCredentials => 'Identifiants incorrects.';

  @override
  String get invalidCode => 'Code invalide ou expiré.';

  @override
  String get tooManyAttempts => 'Trop de tentatives. Réessayez dans 1 minute.';

  @override
  String get accountCreated =>
      'Compte créé avec succès. Veuillez vous connecter.';

  @override
  String get connectionError => 'Erreur de connexion.';

  @override
  String get changeEmail => 'Changer l\'e-mail';

  @override
  String get confirmLogoutTitle => 'Se déconnecter';

  @override
  String get confirmLogoutMessage =>
      'Êtes-vous sûr de vouloir vous déconnecter ?';

  @override
  String get next => 'Suivant';

  @override
  String get back => 'Retour';

  @override
  String get sustainablePreferences => 'Préférences durables';

  @override
  String get sessionExpiredPreferences =>
      'Session expirée. Veuillez vous reconnecter.';

  @override
  String get profileReady =>
      'Profil prêt ! Nous vous donnerons des recommandations sur mesure 🎉';

  @override
  String get couldNotSavePreferences =>
      'Impossible d\'enregistrer les préférences. Réessayez.';

  @override
  String get selectGender => 'Veuillez sélectionner votre genre';

  @override
  String get selectAtLeastOneInterest => 'Sélectionnez au moins un intérêt';

  @override
  String get completeAllFields => 'Complétez tous les champs';

  @override
  String get categoryHotels => 'Hôtellerie';

  @override
  String get categoryRestaurants => 'Restaurants';

  @override
  String get categoryMuseums => 'Musées';

  @override
  String get categoryAdventures => 'Aventures';

  @override
  String get tourist => 'touriste';

  @override
  String get codeSentToLabel => 'Un code a été envoyé à :';

  @override
  String get enterSixDigitCode => 'Saisissez le code à 6 chiffres';

  @override
  String get rememberMe7Days =>
      'Se souvenir de moi pendant 7 jours sur cet appareil';

  @override
  String get verify => 'VÉRIFIER';

  @override
  String get signInButton => 'SE CONNECTER';

  @override
  String get createAccount => 'CRÉER UN COMPTE';

  @override
  String get continueWithGoogle => 'Continuer avec Google';

  @override
  String get noAccountPrompt => 'Pas de compte ? ';

  @override
  String get haveAccountPrompt => 'Déjà un compte ? ';

  @override
  String get signUp => 'Inscrivez-vous';

  @override
  String get signInAction => 'Connectez-vous';

  @override
  String get fullName => 'Nom complet';

  @override
  String get enterFullName => 'Saisissez votre nom complet';

  @override
  String get minThreeChars => 'Minimum 3 caractères';

  @override
  String get emailAddress => 'Adresse e-mail';

  @override
  String get enterEmail => 'Saisissez votre e-mail';

  @override
  String get enterValidEmail => 'Saisissez un e-mail valide';

  @override
  String get password => 'Mot de passe';

  @override
  String get enterPassword => 'Saisissez votre mot de passe';

  @override
  String get minEightChars => 'Minimum 8 caractères';

  @override
  String get atLeastOneUppercase => 'Au moins une majuscule';

  @override
  String get atLeastOneLowercase => 'Au moins une minuscule';

  @override
  String get atLeastOneNumber => 'Au moins un chiffre';

  @override
  String get atLeastOneSpecial => 'Au moins un caractère spécial';

  @override
  String get passwordRequirements => 'Le mot de passe doit contenir :';

  @override
  String get specialCharHint => 'Un caractère spécial (!@#\$%^&*)';

  @override
  String get strengthVeryWeak => 'Très faible';

  @override
  String get strengthWeak => 'Faible';

  @override
  String get strengthFair => 'Moyen';

  @override
  String get strengthStrong => 'Fort';

  @override
  String get strengthVeryStrong => 'Très fort';

  @override
  String get defaultUserName => 'Touriste SMARTUR';

  @override
  String get myInterests => 'Mes centres d\'intérêt';

  @override
  String get quickSettings => 'Paramètres rapides';

  @override
  String memberSince(Object date) {
    return 'Membre depuis $date';
  }

  @override
  String get notifications => 'Notifications';

  @override
  String get notificationsSubtitle =>
      'Gérez les alertes météo, itinéraires et communauté';

  @override
  String get appPreferences => 'Préférences de l\'app';

  @override
  String get appPreferencesSubtitle => 'Langue, unités et thème visuel';

  @override
  String get editProfile => 'Modifier le profil';

  @override
  String get editProfileSubtitle =>
      'Changez votre photo de profil ou choisissez une icône';

  @override
  String get profilePhotoFormatsHint =>
      'Formats : JPEG, PNG, GIF, WebP ou HEIC. Maximum 5 Mo.';

  @override
  String get profilePhotoInvalidFormat =>
      'Format non autorisé. Utilisez JPEG, PNG, GIF, WebP ou HEIC.';

  @override
  String get profilePhotoTooLarge => 'L\'image dépasse 5 Mo.';

  @override
  String get profileOpenGallery => 'Galerie';

  @override
  String get profileOpenCamera => 'Appareil photo';

  @override
  String get removeProfilePhoto => 'Supprimer la photo';

  @override
  String get avatarIconsSectionHint =>
      'Ou choisissez une icône à la place d\'une photo';

  @override
  String get changePasswordSubtitle =>
      'Mettez à jour votre mot de passe d\'accès';

  @override
  String get forgotPassword => 'Mot de passe oublié ?';

  @override
  String get sessionClosed => 'Session fermée';

  @override
  String stepXOfY(Object current, Object total) {
    return 'Étape $current sur $total';
  }

  @override
  String get stepAboutYou => 'À propos de vous';

  @override
  String get stepAboutYouSubtitle => 'Parlez-nous un peu de vous';

  @override
  String get stepYourTastes => 'Vos goûts';

  @override
  String get stepYourTastesSubtitle => 'Ce qui vous passionne';

  @override
  String get stepDetails => 'Détails';

  @override
  String get stepDetailsSubtitle => 'Dernières préférences';

  @override
  String get birthYear => 'Date de naissance';

  @override
  String get enterBirthYear => 'Sélectionnez votre date de naissance';

  @override
  String get invalidYear => 'Date non valide';

  @override
  String get gender => 'Genre';

  @override
  String get genderMale => 'Masculin';

  @override
  String get genderFemale => 'Féminin';

  @override
  String get genderNonBinary => 'Non binaire';

  @override
  String get genderPreferNotToSay => 'Je préfère ne pas dire';

  @override
  String get yourInterests => 'Vos intérêts';

  @override
  String get activityLevel => 'Niveau d\'activité';

  @override
  String get travelType => 'Type de voyage';

  @override
  String get preferredPlace => 'Lieu préféré';

  @override
  String get interestCulture => 'Culture';

  @override
  String get interestGastronomy => 'Gastronomie';

  @override
  String get interestAdventure => 'Aventure';

  @override
  String get interestNature => 'Nature';

  @override
  String get interestHistory => 'Histoire';

  @override
  String get interestPhotography => 'Photographie';

  @override
  String get interestSports => 'Sports';

  @override
  String get interestWellness => 'Bien-être';

  @override
  String get interestArt => 'Art';

  @override
  String get interestNightlife => 'Vie nocturne';

  @override
  String get activityLow => 'Bas';

  @override
  String get activityModerate => 'Modéré';

  @override
  String get activityHigh => 'Élevé';

  @override
  String get activityExtreme => 'Extrême';

  @override
  String get travelBackpacker => 'Routard';

  @override
  String get travelFamily => 'Famille';

  @override
  String get travelLuxury => 'Luxe';

  @override
  String get travelAdventure => 'Aventure';

  @override
  String get travelRomantic => 'Romantique';

  @override
  String get travelBusiness => 'Affaires';

  @override
  String get placeBeach => 'Plage';

  @override
  String get placeMountain => 'Montagne';

  @override
  String get placeCity => 'Ville';

  @override
  String get placeCountryside => 'Campagne';

  @override
  String get placeForest => 'Forêt';

  @override
  String get placeDesert => 'Désert';

  @override
  String get needAccessibility =>
      'Avez-vous besoin d\'accessibilité spéciale ?';

  @override
  String get accessibilitySubtitle =>
      'Itinéraires adaptés à la mobilité réduite ou autres besoins';

  @override
  String get describeNeedOptional => 'Décrivez votre besoin (optionnel)';

  @override
  String get accessibilityHint => 'Ex : fauteuil roulant, canne...';

  @override
  String get visitedHighMountains => 'Avez-vous visité les Hautes Montagnes ?';

  @override
  String get visitedSubtitle =>
      'Cela nous aide à mieux personnaliser vos recommandations';

  @override
  String get dietaryRestrictions => 'Restrictions alimentaires ou médicales';

  @override
  String get dietaryHint =>
      'Ex : végétarien, allergie aux fruits de mer... (laisser vide si aucune)';

  @override
  String get sustainableNoPref => 'Sans préférence';

  @override
  String get sustainableLow => 'Priorité basse';

  @override
  String get sustainableMedium => 'Priorité moyenne';

  @override
  String get sustainableHigh => 'Priorité élevée';

  @override
  String get choosePreference => 'Choisissez ce que vous préférez le plus';

  @override
  String get dateFormatPlaceholder => 'Jour / Mois / Année';

  @override
  String get recoTitle => 'Découvrir mes destinations';

  @override
  String get recoDiscoverNext => 'Découvrez votre prochaine aventure';

  @override
  String get recoAiPersonalizedFor => 'IA personnalisée pour vous';

  @override
  String get recoTourismType => 'Type de tourisme';

  @override
  String get recoChooseOneOrMore => 'Choisissez un ou plusieurs';

  @override
  String get recoBudget => 'Budget';

  @override
  String get recoWithWho => 'Avec qui voyagez-vous ?';

  @override
  String get recoAgeRange => 'Tranche d\'âge';

  @override
  String get recoAdditionalPrefs => 'Préférences supplémentaires';

  @override
  String get recoOptional => '(optionnel)';

  @override
  String get recoPreloadedBanner => 'Basé sur votre profil';

  @override
  String get recoSelectAtLeastOne => 'Sélectionnez au moins une option';

  @override
  String get recoSelectAtLeastOneToContinue =>
      'Sélectionnez au moins une option pour continuer';

  @override
  String get recoDiscoverDestinations => 'Découvrir des destinations';

  @override
  String recoNDestinations(Object n) {
    return '$n destinations pour vous';
  }

  @override
  String get recoPersonalizedByAI => 'Personnalisés par IA';

  @override
  String get recoHelpImprove => 'Aidez-nous à nous améliorer';

  @override
  String get recoHowLiked => 'Comment avez-vous trouvé ces recommandations ?';

  @override
  String get recoSkip => 'Ignorer';

  @override
  String get recoSend => 'Envoyer';

  @override
  String get recoViewDestination => 'Voir la destination';

  @override
  String get recoServiceUnavailable =>
      'Le service de recommandations est actuellement indisponible';

  @override
  String get recoConnectionError =>
      'Erreur de connexion. Vérifiez votre connexion et réessayez';

  @override
  String get recoShareButton => 'Partager les recommandations';

  @override
  String get communityDeletePost => 'Supprimer la publication';

  @override
  String get communityDeletePostConfirm =>
      'Êtes-vous sûr de vouloir supprimer cette publication ? Cette action est irréversible.';

  @override
  String get communityReportPost => 'Signaler la publication';

  @override
  String get communityReportReason => 'Motif du signalement';

  @override
  String get communityReportSpam => 'Spam';

  @override
  String get communityReportInappropriate => 'Contenu inapproprié';

  @override
  String get communityReportFalse => 'Fausse information';

  @override
  String get communityReportHateful => 'Discours haineux';

  @override
  String get communityReportSent =>
      'Signalement envoyé. Nous l\'examinerons bientôt.';

  @override
  String get securitySection => 'Sécurité';

  @override
  String get activeSessions => 'Sessions actives';

  @override
  String get activeSessionsSubtitle => 'Gérez vos appareils connectés';

  @override
  String get sessionRevokeSuccess => 'Session fermée avec succès';

  @override
  String get sessionRevokeError =>
      'Impossible de fermer la session. Veuillez réessayer.';

  @override
  String get noSessionsRegistered => 'Aucune session enregistrée';

  @override
  String get defaultDevice => 'Appareil';

  @override
  String get sessionRevokeTooltip => 'Fermer la session';

  @override
  String get sessionCreatedSince => 'Depuis';

  @override
  String get recoGuidedTours => 'Visites guidées';

  @override
  String get recoNeedHotel => 'Besoin d\'hôtel';

  @override
  String get recoFoodOptions => 'Options alimentaires';

  @override
  String get recoAccessible => 'Accessible';

  @override
  String get recoOutdoor => 'Plein air';

  @override
  String latencyMs(Object ms) {
    return '$ms ms';
  }

  @override
  String get homeOfflineBanner =>
      'Pas de connexion. Activez Internet pour voir la carte.';

  @override
  String get welcomeGreeting => 'Bienvenue';

  @override
  String get recoPreloadedBannerDesc =>
      'Pré-rempli selon vos préférences enregistrées';

  @override
  String get onboardingTitle1 => 'Votre aventure commence ici';

  @override
  String get onboardingDesc1 =>
      'Explorez les coins les plus magiques des Hautes Montagnes avec des itinéraires conçus pour l\'explorateur moderne.';

  @override
  String get onboardingTitle2 => 'L\'intelligence qui vous connaît';

  @override
  String get onboardingDesc2 =>
      'Nous analysons vos préférences pour que chaque recommandation vous soit personnellement destinée.';

  @override
  String get onboardingTitle3 => 'Vivez l\'authentique';

  @override
  String get onboardingDesc3 =>
      'Connectez-vous avec des guides locaux et soutenez le tourisme régional tout en créant des souvenirs inoubliables.';

  @override
  String get errorTitle => 'Erreur';

  @override
  String get settingsCheckUpdate => 'Rechercher une mise à jour';

  @override
  String settingsAppUpToDate(Object version) {
    return 'SMARTUR v$version est à jour.';
  }

  @override
  String get languageSpanish => 'Espagnol';

  @override
  String get languageEnglish => 'Anglais';

  @override
  String get languageFrench => 'Français';

  @override
  String get languagePortuguese => 'Portugais';

  @override
  String get themeLight => 'Clair';

  @override
  String get themeDark => 'Sombre';

  @override
  String get navAiShort => 'IA';

  @override
  String get diaryAiSessionsEmptyTitle => 'Aucune session de recommandations';

  @override
  String get diaryAiSessionsEmptySubtitle =>
      'Les sessions générées depuis l\'application ou la plateforme web apparaîtront ici.';

  @override
  String diaryMoreCount(Object count) {
    return '+$count de plus';
  }

  @override
  String diarySessionDestinationsCount(Object count) {
    return '$count destinations dans cette session';
  }

  @override
  String get diaryTapDestinationHint =>
      'Touchez une destination pour en voir plus';

  @override
  String get mapRetry => 'Réessayer';

  @override
  String get updateTitle => 'Nouvelle version disponible';

  @override
  String updateBody(Object version) {
    return 'La version $version de SMARTUR est disponible.\nElle sera téléchargée et installée depuis l\'application.';
  }

  @override
  String updateDownloading(Object progress) {
    return 'Téléchargement... $progress%';
  }

  @override
  String get updatePreparingInstaller => 'Préparation de l\'installateur...';

  @override
  String get updateDownloadError =>
      'Erreur de téléchargement. Vérifiez votre connexion et réessayez.';

  @override
  String get updateLater => 'Plus tard';

  @override
  String get updateRetry => 'Réessayer';

  @override
  String get updateNow => 'Mettre à jour';

  @override
  String imageShareTitle(Object city) {
    return 'Mes recommandations à $city';
  }

  @override
  String get imageShareSubtitle =>
      'Basé sur mon profil de voyageur intelligent';

  @override
  String get imageShareGeneratedBy => 'Généré par SMARTUR AI';

  @override
  String imageShareMessage(Object city) {
    return 'Regardez ce que SMARTUR me recommande à $city !';
  }

  @override
  String get commonPlaceFallback => 'Lieu';

  @override
  String get recoTypeCultural => 'Culturel';

  @override
  String get recoTypeNature => 'Nature';

  @override
  String get recoTypeGastronomy => 'Gastronomique';

  @override
  String get recoTypeAdventure => 'Aventure';

  @override
  String get recoTypeRelax => 'Détente';

  @override
  String get recoTypeNight => 'Nocturne';

  @override
  String get recoBudgetLowLabel => 'Économique';

  @override
  String get recoBudgetLowSub => 'Max. \$500/jour';

  @override
  String get recoBudgetMediumLabel => 'Modéré';

  @override
  String get recoBudgetMediumSub => '\$500–1500/jour';

  @override
  String get recoBudgetHighLabel => 'Premium';

  @override
  String get recoBudgetHighSub => '\$1500+/jour';

  @override
  String get recoGroupSolo => 'Solo';

  @override
  String get recoGroupCouple => 'Couple';

  @override
  String get recoGroupFamily => 'Famille';

  @override
  String get recoGroupFriends => 'Amis';

  @override
  String recoShareList(Object items) {
    return '🌿 Mes destinations recommandées à Altas Montañas, Veracruz :\n\n• $items\n\n📱 Découvrez-les avec SMARTUR';
  }

  @override
  String detailShareMessage(
    Object title,
    Object location,
    Object description,
    Object mapsUrl,
  ) {
    return 'Découvrez $title à $location ! 📍$description\nVoir sur Maps : $mapsUrl\n\nDécouvert avec SMARTUR — Altas Montañas, Veracruz';
  }

  @override
  String get mapsLabel => 'Maps';

  @override
  String get youAreHere => '← Vous êtes ici';

  @override
  String get recoSavedInDiary =>
      'Recommandations enregistrées. Vous pouvez les consulter dans Journal.';

  @override
  String get recoResultsDone => 'Terminé';

  @override
  String get recoResultsRankHint =>
      'Classés selon la compatibilité avec votre profil';

  @override
  String get googleSignInReleaseConfig =>
      'Google Sign-In n\'est pas configuré pour cette version. Enregistrez l\'empreinte SHA du keystore release dans Firebase.';
}
