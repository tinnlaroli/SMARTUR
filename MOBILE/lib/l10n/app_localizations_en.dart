// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appTitle => 'Smartur';

  @override
  String get settingsTitle => 'Settings';

  @override
  String get appearanceSection => 'Appearance';

  @override
  String get accountSection => 'Account';

  @override
  String get infoSection => 'Info';

  @override
  String get darkMode => 'Dark Mode';

  @override
  String get language => 'Language';

  @override
  String get changePassword => 'Change Password';

  @override
  String get editName => 'Edit Name';

  @override
  String get deleteAccount => 'Delete Account';

  @override
  String get appVersion => 'App Version';

  @override
  String get termsAndConditions => 'Terms and Conditions';

  @override
  String get privacyPolicy => 'Privacy Policy';

  @override
  String get registerAcceptTermsPrefix => 'I accept the ';

  @override
  String get termsMustAccept =>
      'You must accept the terms and conditions to sign up.';

  @override
  String get termsCloseButton => 'Got it';

  @override
  String get termsAndConditionsBody =>
      'Last updated: March 2025.\n\n1. Purpose\nSmartur is a mobile app to explore tourist destinations, recommendations, and community features.\n\n2. Registration and account\nBy creating an account you confirm your information is accurate. You are responsible for keeping your password confidential and for activity under your account.\n\n3. Permitted use\nYou agree to use the service lawfully, without infringing third-party rights or disrupting the platform.\n\n4. Content and intellectual property\nApp content (text, design, trademarks) is protected. Unauthorized reproduction is not allowed.\n\n5. Personal data\nProcessing of your personal data complies with applicable law. By using Smartur you accept the practices described in the service privacy policy.\n\n6. Changes\nWe may update these terms. Material changes will be communicated by reasonable means; continued use after updates means you accept the new terms.\n\n7. Contact\nFor questions about these terms, use the support channels provided in the app or on the official website.';

  @override
  String get privacyPolicyBody =>
      'Last updated: March 2025.\n\n1. Data controller\nSmartur is the controller of your personal data.\n\n2. Data we collect\nWe collect the data you provide when registering (name, email, optional profile photo) and data generated through app use (travel preferences, recommendation history, place ratings).\n\n3. Purpose of processing\nYour data is used to personalize travel recommendations, improve the app, and communicate with you about the service.\n\n4. Legal basis\nProcessing is based on your explicit consent when accepting these terms and on the performance of the service contract.\n\n5. Data retention\nWe retain your data while your account is active. You may request deletion at any time via Settings → Delete account.\n\n6. User rights\nYou have the right to access, rectify, delete, and port your personal data. To exercise these rights, contact us through the support channels.\n\n7. Security\nWe apply technical and organizational measures to protect your data against unauthorized access or accidental loss.\n\n8. Contact\nFor privacy inquiries: smarturutcv@gmail.com';

  @override
  String get logout => 'Log out';

  @override
  String get selectLanguage => 'Select Language';

  @override
  String get systemLanguage => 'System language';

  @override
  String get systemTheme => 'System theme';

  @override
  String get cancel => 'Cancel';

  @override
  String get save => 'Save';

  @override
  String get deleteAccountTitle => 'Delete account';

  @override
  String get deleteAccountConfirm =>
      'Are you sure you want to delete your account? This action is irreversible and you will lose your trip history.';

  @override
  String get deleteAccountYes => 'Yes, delete';

  @override
  String get editNameTitle => 'Edit name';

  @override
  String get yourName => 'Your name';

  @override
  String get changePasswordTitle => 'Change Password';

  @override
  String get changePasswordStep0Hint =>
      'We will send you a verification code to your email.';

  @override
  String get changePasswordStep1Hint => 'Enter the code and your new password.';

  @override
  String get verificationCode => 'Verification code';

  @override
  String get newPassword => 'New password';

  @override
  String get confirmPassword => 'Confirm password';

  @override
  String get sendCode => 'Send code';

  @override
  String get updatePassword => 'Update password';

  @override
  String get resendCode => 'Resend code';

  @override
  String get codeSixDigits => '6-digit code';

  @override
  String get passwordMinChars => 'Minimum 8 characters';

  @override
  String get passwordNeedUpper => 'Include at least one uppercase letter';

  @override
  String get passwordNeedLower => 'Include at least one lowercase letter';

  @override
  String get passwordNeedNumber => 'Include at least one number';

  @override
  String get passwordsDontMatch => 'Passwords do not match';

  @override
  String codeSentToEmail(Object email) {
    return 'Code sent to $email';
  }

  @override
  String get emailNotFound => 'Email not found';

  @override
  String get loading => 'Loading...';

  @override
  String get welcomeBack => 'Welcome back';

  @override
  String get startNow => 'Get started';

  @override
  String get loginSubtitle => 'Enter your credentials to continue.';

  @override
  String get registerSubtitle => 'Sign up to discover personalized routes.';

  @override
  String get continueWithEmail => 'Continue with Email';

  @override
  String get registerWithEmail => 'Sign up with Email';

  @override
  String get tagline => 'AI that guides, Tourism that unites';

  @override
  String get start => 'Start';

  @override
  String get loginWithBiometrics => 'Sign in with fingerprint';

  @override
  String get navHome => 'Home';

  @override
  String get navExplore => 'Explore';

  @override
  String get navRoutes => 'My Routes';

  @override
  String get navDiary => 'Diary';

  @override
  String get navRecommend => 'Recommend';

  @override
  String get navCommunity => 'Community';

  @override
  String get navUser => 'User';

  @override
  String get exploreTitle => 'Explore';

  @override
  String get routesSectionLabel => 'Routes';

  @override
  String get routesSectionCertified => 'Smartur Certified Routes';

  @override
  String get routesSectionMostCopied => 'Most Copied';

  @override
  String get routesSectionFollowing => 'From people you follow';

  @override
  String get routesSectionNoItems => 'Nothing here yet — check back soon';

  @override
  String get routesFollowingEmpty =>
      'Follow travelers to see their routes here';

  @override
  String get searchRoutesHint => 'Search routes or users...';

  @override
  String get seeAll => 'See all';

  @override
  String get misRutasTitle => 'My Routes';

  @override
  String get misRutasEmptyTitle => 'No routes yet';

  @override
  String get misRutasEmptySubtitle =>
      'Create your first route and start planning your next adventure';

  @override
  String get misRutasCreate => 'New route';

  @override
  String get profileTabProfile => 'Profile';

  @override
  String get addToRoute => 'Add to route';

  @override
  String get createNewRoute => 'New route';

  @override
  String get genrePickerTitle => 'What do you like to explore?';

  @override
  String get genrePickerSubtitle =>
      'Choose up to 3 topics that interest you most';

  @override
  String get genrePickerContinue => 'Continue';

  @override
  String get genrePickerSkip => 'Skip for now';

  @override
  String get genreNature => 'Nature';

  @override
  String get genreAdventure => 'Adventure';

  @override
  String get genreGastronomy => 'Gastronomy';

  @override
  String get genreCulture => 'Culture';

  @override
  String get genreRelax => 'Relax';

  @override
  String get genreHistory => 'History';

  @override
  String get communityTitle => 'Community';

  @override
  String get uploadPhotoAction => 'Add a photo';

  @override
  String get communityCreatePost => 'Create post';

  @override
  String get communityPostCaptionHint => 'What would you like to share?';

  @override
  String get communitySelectPlace => 'Tagged place';

  @override
  String get communitySelectPlaceHint =>
      'Choose the place you are posting about';

  @override
  String get communityAttachImage => 'Attach image';

  @override
  String get communityRemoveImage => 'Remove image';

  @override
  String get communityPublish => 'Publish';

  @override
  String get communityNeedPlace => 'Select a place';

  @override
  String get communityNeedTextOrImage => 'Write a message or attach an image';

  @override
  String get communityLoadPlacesError => 'Could not load places';

  @override
  String get communityPostPublished => 'Post published';

  @override
  String get communityImageRejected =>
      'This image does not meet community guidelines. Choose a photo suitable for all audiences.';

  @override
  String get communityImageModerationUnavailable =>
      'We could not verify the image. Please try again later.';

  @override
  String get diaryTitle => 'My Diary';

  @override
  String get favoritesTab => 'Favorites';

  @override
  String get historyTab => 'History';

  @override
  String get offlineAvailable => 'Available offline';

  @override
  String recommendationsInCity(Object city) {
    return 'Recommendations in $city';
  }

  @override
  String recommendationNumber(Object number) {
    return 'Recommendation #$number';
  }

  @override
  String recommendationSubtitle(Object city) {
    return 'Suggested by Smartur AI for your visit to $city.';
  }

  @override
  String get mapDiscoverHint =>
      'Discover key points without tracking your location in real time.';

  @override
  String get mapTapPinHint => 'Tap a pin to see AI-generated details';

  @override
  String get filterAll => 'All';

  @override
  String get filterMuseums => 'Culture';

  @override
  String get filterCafes => 'Gastronomy';

  @override
  String get filterViewpoints => 'Adventures';

  @override
  String get filterHotels => 'Hotels';

  @override
  String get filterMuseumsOnly => 'Museums only';

  @override
  String get aiSmartur => 'Smartur AI';

  @override
  String get enableBiometricsHint =>
      'Sign in and enable fingerprint in your profile';

  @override
  String get deviceNotSupported => 'Device not supported';

  @override
  String get noBiometricsEnrolled => 'No fingerprints enrolled';

  @override
  String get biometricReason => 'Access your Smartur routes';

  @override
  String get sessionExpired => 'Session expired. Please sign in again.';

  @override
  String get biometricReadError => 'Error reading fingerprint.';

  @override
  String get quickAccess => 'Quick access';

  @override
  String get activate => 'Activate';

  @override
  String get notNow => 'Not now';

  @override
  String get dontRemindMe => 'Don\'t remind me';

  @override
  String get biometricPrompt =>
      'Do you want to use your fingerprint to sign in faster next time?';

  @override
  String get biometricActivateReason =>
      'Confirm your fingerprint to enable quick access';

  @override
  String get biometricActivateTitle => 'Activate fingerprint — Smartur';

  @override
  String get biometricTouchSensor => 'Touch the sensor';

  @override
  String get biometricActivated => 'Fingerprint access activated';

  @override
  String biometricActivateError(Object error) {
    return 'Could not activate: $error';
  }

  @override
  String get biometricDeactivated => 'Fingerprint will no longer be requested';

  @override
  String get biometricConfirmActivate => 'Confirm your fingerprint to activate';

  @override
  String get biometricCouldNotActivate => 'Could not activate fingerprint';

  @override
  String get myProfile => 'My profile';

  @override
  String get manageAccount => 'Manage your account quickly';

  @override
  String get myPreferences => 'My preferences';

  @override
  String get yourPreferences => 'Your preferences';

  @override
  String get noPreferencesSaved => 'You haven\'t saved preferences yet.';

  @override
  String get confirmChangePreferences =>
      'Are you sure you want to change them?';

  @override
  String get change => 'Change';

  @override
  String get fingerprintAccess => 'Fingerprint access';

  @override
  String get configuration => 'Settings';

  @override
  String exploreGreeting(Object name) {
    return 'Explore$name';
  }

  @override
  String get highMountainsVeracruz => 'Altas Montañas, Veracruz';

  @override
  String get exploreHighMountains => 'Explore the High Mountains';

  @override
  String recommendationsForYou(Object name) {
    return 'Recommendations for you, $name';
  }

  @override
  String get forYouLabel => 'For you';

  @override
  String get weatherNow => 'Weather now';

  @override
  String get notAvailable => 'Not available';

  @override
  String get allCategories => 'All';

  @override
  String get noCategoryPlaces => 'No places in this category yet';

  @override
  String get exploreNoCities => 'No cities with places from the server.';

  @override
  String get exploreCouldNotLoad =>
      'Could not load places. Check your connection and try again.';

  @override
  String get exploreAllCities => 'All cities';

  @override
  String get tabHistory => 'History';

  @override
  String get tabLocation => 'Location';

  @override
  String get tabGastronomy => 'Gastronomy';

  @override
  String get tabAiSummary => 'AI Summary';

  @override
  String get fromPrice => 'From';

  @override
  String get free => 'Free';

  @override
  String get openInMaps => 'Open in Google Maps';

  @override
  String locationNoCoords(String city) {
    return 'Location: $city';
  }

  @override
  String get searchHint => 'Search places...';

  @override
  String searchNoResults(String q) {
    return 'No results for \"$q\"';
  }

  @override
  String get tabLocationPlaceholder => 'Map and key points to visit.';

  @override
  String get tabGastronomyPlaceholder =>
      'Typical dishes and recommended cafés in the area.';

  @override
  String get tabAiPlaceholder =>
      'AI-generated summary with reviews and ratings from other tourists.';

  @override
  String get tabRate => 'Rate';

  @override
  String get rateHint => 'Your rating improves your recommendations';

  @override
  String get rateThanks => 'Thanks for rating!';

  @override
  String get invalidCredentials => 'Invalid credentials.';

  @override
  String get invalidCode => 'Invalid or expired code.';

  @override
  String get tooManyAttempts => 'Too many attempts. Try again in 1 minute.';

  @override
  String get accountCreated => 'Account created successfully. Please sign in.';

  @override
  String get connectionError => 'Connection error.';

  @override
  String get changeEmail => 'Change email';

  @override
  String get confirmLogoutTitle => 'Log out';

  @override
  String get confirmLogoutMessage => 'Are you sure you want to log out?';

  @override
  String get next => 'Next';

  @override
  String get back => 'Back';

  @override
  String get sustainablePreferences => 'Sustainable preferences';

  @override
  String get sessionExpiredPreferences =>
      'Session expired. Please sign in again.';

  @override
  String get profileReady =>
      'Profile ready! Now we\'ll give you tailored recommendations 🎉';

  @override
  String get couldNotSavePreferences =>
      'Could not save preferences. Please try again.';

  @override
  String get selectGender => 'Please select your gender';

  @override
  String get selectAtLeastOneInterest => 'Select at least one interest';

  @override
  String get completeAllFields => 'Complete all fields';

  @override
  String get categoryHotels => 'Hotels';

  @override
  String get categoryRestaurants => 'Restaurants';

  @override
  String get categoryMuseums => 'Museums';

  @override
  String get categoryAdventures => 'Adventures';

  @override
  String get tourist => 'tourist';

  @override
  String get codeSentToLabel => 'A code was sent to:';

  @override
  String get enterSixDigitCode => 'Enter the 6-digit code';

  @override
  String get rememberMe7Days => 'Remember me for 7 days on this device';

  @override
  String get verify => 'VERIFY';

  @override
  String get signInButton => 'SIGN IN';

  @override
  String get createAccount => 'CREATE ACCOUNT';

  @override
  String get continueWithGoogle => 'Continue with Google';

  @override
  String get noAccountPrompt => 'Don\'t have an account? ';

  @override
  String get haveAccountPrompt => 'Already have an account? ';

  @override
  String get signUp => 'Sign up';

  @override
  String get signInAction => 'Sign in';

  @override
  String get fullName => 'Full name';

  @override
  String get enterFullName => 'Enter your full name';

  @override
  String get minThreeChars => 'Minimum 3 characters';

  @override
  String get emailAddress => 'Email address';

  @override
  String get enterEmail => 'Enter your email';

  @override
  String get enterValidEmail => 'Enter a valid email';

  @override
  String get password => 'Password';

  @override
  String get enterPassword => 'Enter your password';

  @override
  String get minEightChars => 'Minimum 8 characters';

  @override
  String get atLeastOneUppercase => 'At least one uppercase letter';

  @override
  String get atLeastOneLowercase => 'At least one lowercase letter';

  @override
  String get atLeastOneNumber => 'At least one number';

  @override
  String get atLeastOneSpecial => 'At least one special character';

  @override
  String get passwordRequirements => 'Password must have:';

  @override
  String get specialCharHint => 'A special character (!@#\$%^&*)';

  @override
  String get strengthVeryWeak => 'Very weak';

  @override
  String get strengthWeak => 'Weak';

  @override
  String get strengthFair => 'Fair';

  @override
  String get strengthStrong => 'Strong';

  @override
  String get strengthVeryStrong => 'Very strong';

  @override
  String get defaultUserName => 'Smartur Tourist';

  @override
  String get myInterests => 'My Interests';

  @override
  String get quickSettings => 'Quick Settings';

  @override
  String memberSince(Object date) {
    return 'Member since $date';
  }

  @override
  String get notifications => 'Notifications';

  @override
  String get notificationsSubtitle =>
      'Manage weather, route and community alerts';

  @override
  String get appPreferences => 'App Preferences';

  @override
  String get appPreferencesSubtitle => 'Language, units and visual theme';

  @override
  String get editProfile => 'Edit Profile';

  @override
  String get editProfileSubtitle => 'Change your profile photo or pick an icon';

  @override
  String get profilePhotoFormatsHint =>
      'Allowed: JPEG, PNG, GIF, WebP or HEIC. Maximum 5 MB.';

  @override
  String get profilePhotoInvalidFormat =>
      'This format is not allowed. Use JPEG, PNG, GIF, WebP or HEIC.';

  @override
  String get profilePhotoTooLarge => 'Image is too large (max. 5 MB).';

  @override
  String get profileOpenGallery => 'Gallery';

  @override
  String get profileOpenCamera => 'Camera';

  @override
  String get removeProfilePhoto => 'Remove photo';

  @override
  String get avatarIconsSectionHint => 'Or choose an icon instead of a photo';

  @override
  String get changePasswordSubtitle => 'Update your access password';

  @override
  String get forgotPassword => 'Forgot password?';

  @override
  String get sessionClosed => 'Session closed';

  @override
  String stepXOfY(Object current, Object total) {
    return 'Step $current of $total';
  }

  @override
  String get stepAboutYou => 'About you';

  @override
  String get stepAboutYouSubtitle => 'Tell us a bit about yourself';

  @override
  String get stepYourTastes => 'Your tastes';

  @override
  String get stepYourTastesSubtitle => 'What you love to do';

  @override
  String get stepDetails => 'Details';

  @override
  String get stepDetailsSubtitle => 'Final preferences';

  @override
  String get birthYear => 'Date of birth';

  @override
  String get enterBirthYear => 'Select your date of birth';

  @override
  String get invalidYear => 'Invalid date';

  @override
  String get gender => 'Gender';

  @override
  String get genderMale => 'Male';

  @override
  String get genderFemale => 'Female';

  @override
  String get genderNonBinary => 'Non-binary';

  @override
  String get genderPreferNotToSay => 'Prefer not to say';

  @override
  String get yourInterests => 'Your interests';

  @override
  String get activityLevel => 'Activity level';

  @override
  String get travelType => 'Travel type';

  @override
  String get preferredPlace => 'Preferred place';

  @override
  String get interestCulture => 'Culture';

  @override
  String get interestGastronomy => 'Gastronomy';

  @override
  String get interestAdventure => 'Adventure';

  @override
  String get interestNature => 'Nature';

  @override
  String get interestHistory => 'History';

  @override
  String get interestPhotography => 'Photography';

  @override
  String get interestSports => 'Sports';

  @override
  String get interestWellness => 'Wellness';

  @override
  String get interestArt => 'Art';

  @override
  String get interestNightlife => 'Nightlife';

  @override
  String get activityLow => 'Low';

  @override
  String get activityModerate => 'Moderate';

  @override
  String get activityHigh => 'High';

  @override
  String get activityExtreme => 'Extreme';

  @override
  String get travelBackpacker => 'Backpacker';

  @override
  String get travelFamily => 'Family';

  @override
  String get travelLuxury => 'Luxury';

  @override
  String get travelAdventure => 'Adventure';

  @override
  String get travelRomantic => 'Romantic';

  @override
  String get travelBusiness => 'Business';

  @override
  String get placeBeach => 'Beach';

  @override
  String get placeMountain => 'Mountain';

  @override
  String get placeCity => 'City';

  @override
  String get placeCountryside => 'Countryside';

  @override
  String get placeForest => 'Forest';

  @override
  String get placeDesert => 'Desert';

  @override
  String get needAccessibility => 'Do you need special accessibility?';

  @override
  String get accessibilitySubtitle =>
      'Routes adapted for reduced mobility or other needs';

  @override
  String get describeNeedOptional => 'Describe your need (optional)';

  @override
  String get accessibilityHint => 'E.g.: wheelchair, cane...';

  @override
  String get visitedHighMountains => 'Have you visited the High Mountains?';

  @override
  String get visitedSubtitle =>
      'This helps us better personalize your recommendations';

  @override
  String get dietaryRestrictions => 'Dietary or medical restrictions';

  @override
  String get dietaryHint =>
      'E.g.: vegetarian, seafood allergy... (leave empty if none)';

  @override
  String get sustainableNoPref => 'No preference';

  @override
  String get sustainableLow => 'Low priority';

  @override
  String get sustainableMedium => 'Medium priority';

  @override
  String get sustainableHigh => 'High priority';

  @override
  String get choosePreference => 'Choose what you prefer most';

  @override
  String get dateFormatPlaceholder => 'Day / Month / Year';

  @override
  String get recoTitle => 'Discover my destinations';

  @override
  String get recoDiscoverNext => 'Discover your next adventure';

  @override
  String get recoAiPersonalizedFor => 'AI personalized for you';

  @override
  String get recoTourismType => 'Tourism type';

  @override
  String get recoChooseOneOrMore => 'Choose one or more';

  @override
  String get recoBudget => 'Budget';

  @override
  String get recoWithWho => 'Who are you traveling with?';

  @override
  String get recoAgeRange => 'Age range';

  @override
  String get recoAdditionalPrefs => 'Additional preferences';

  @override
  String get recoOptional => '(optional)';

  @override
  String get recoPreloadedBanner => 'Based on your profile';

  @override
  String get recoSelectAtLeastOne => 'Select at least one option';

  @override
  String get recoSelectAtLeastOneToContinue =>
      'Select at least one option to continue';

  @override
  String get recoDiscoverDestinations => 'Discover destinations';

  @override
  String recoNDestinations(Object n) {
    return '$n destinations for you';
  }

  @override
  String get recoPersonalizedByAI => 'AI-personalized';

  @override
  String get recoHelpImprove => 'Help us improve';

  @override
  String get recoHowLiked => 'How did you like these recommendations?';

  @override
  String get recoSkip => 'Skip';

  @override
  String get recoSend => 'Send';

  @override
  String get recoViewDestination => 'View destination';

  @override
  String get recoServiceUnavailable =>
      'Recommendations service is currently unavailable';

  @override
  String get recoConnectionError =>
      'Connection error. Check your internet and try again';

  @override
  String get recoShareButton => 'Share recommendations';

  @override
  String get communityDeletePost => 'Delete post';

  @override
  String get communityDeletePostConfirm =>
      'Are you sure you want to delete this post? This action cannot be undone.';

  @override
  String get communityReportPost => 'Report post';

  @override
  String get communityReportReason => 'Reason for report';

  @override
  String get communityReportSpam => 'Spam';

  @override
  String get communityReportInappropriate => 'Inappropriate content';

  @override
  String get communityReportFalse => 'False information';

  @override
  String get communityReportHateful => 'Hateful speech';

  @override
  String get communityReportSent => 'Report sent. We\'ll review it soon.';

  @override
  String get securitySection => 'Security';

  @override
  String get activeSessions => 'Active sessions';

  @override
  String get activeSessionsSubtitle => 'Manage your connected devices';

  @override
  String get sessionRevokeSuccess => 'Session closed successfully';

  @override
  String get sessionRevokeError =>
      'Could not close the session. Please try again.';

  @override
  String get noSessionsRegistered => 'No sessions registered';

  @override
  String get defaultDevice => 'Device';

  @override
  String get sessionRevokeTooltip => 'Close session';

  @override
  String get sessionCreatedSince => 'Since';

  @override
  String get recoGuidedTours => 'Guided tours';

  @override
  String get recoNeedHotel => 'Need hotel';

  @override
  String get recoFoodOptions => 'Food options';

  @override
  String get recoAccessible => 'Accessible';

  @override
  String get recoOutdoor => 'Outdoor';

  @override
  String latencyMs(Object ms) {
    return '$ms ms';
  }

  @override
  String get homeOfflineBanner =>
      'No connection. Enable internet to view the map.';

  @override
  String get welcomeGreeting => 'Welcome';

  @override
  String get recoPreloadedBannerDesc =>
      'Pre-filled based on your saved preferences';

  @override
  String get onboardingTitle1 => 'Your adventure starts here';

  @override
  String get onboardingDesc1 =>
      'Explore the most magical corners of the High Mountains with routes designed for the modern explorer.';

  @override
  String get onboardingTitle2 => 'Intelligence that knows you';

  @override
  String get onboardingDesc2 =>
      'We analyze your preferences so every recommendation feels written just for you.';

  @override
  String get onboardingTitle3 => 'Live the authentic';

  @override
  String get onboardingDesc3 =>
      'Connect with local guides and support regional tourism while creating unforgettable memories.';

  @override
  String get errorTitle => 'Error';

  @override
  String get settingsCheckUpdate => 'Check for updates';

  @override
  String settingsAppUpToDate(Object version) {
    return 'Smartur v$version is up to date.';
  }

  @override
  String get languageSpanish => 'Spanish';

  @override
  String get languageEnglish => 'English';

  @override
  String get languageFrench => 'French';

  @override
  String get languagePortuguese => 'Portuguese';

  @override
  String get themeLight => 'Light';

  @override
  String get themeDark => 'Dark';

  @override
  String get navAiShort => 'AI';

  @override
  String get diaryAiSessionsEmptyTitle => 'No recommendation sessions';

  @override
  String get diaryAiSessionsEmptySubtitle =>
      'Sessions generated from the app or web platform will appear here.';

  @override
  String diaryMoreCount(Object count) {
    return '+$count more';
  }

  @override
  String diarySessionDestinationsCount(Object count) {
    return '$count destinations in this session';
  }

  @override
  String get diaryTapDestinationHint => 'Tap a destination to view more';

  @override
  String get mapRetry => 'Retry';

  @override
  String get updateTitle => 'New version available';

  @override
  String updateBody(Object version) {
    return 'Smartur version $version is available.\nIt will be downloaded and installed from the app.';
  }

  @override
  String updateDownloading(Object progress) {
    return 'Downloading... $progress%';
  }

  @override
  String get updatePreparingInstaller => 'Preparing installer...';

  @override
  String get updateDownloadError =>
      'Download failed. Check your connection and try again.';

  @override
  String get updateLater => 'Later';

  @override
  String get updateRetry => 'Retry';

  @override
  String get updateNow => 'Update now';

  @override
  String get updateConfirmInstall =>
      'On the system screen, tap Install to finish the update. If you cancel, you will stay on the previous version.';

  @override
  String get updateInstallPermission =>
      'Allow installing apps from this source in Settings, then tap Update again.';

  @override
  String get updateInstallDone => 'Got it';

  @override
  String imageShareTitle(Object city) {
    return 'My Recommendations in $city';
  }

  @override
  String get imageShareSubtitle => 'Based on my smart traveler profile';

  @override
  String get imageShareGeneratedBy => 'Generated by Smartur AI';

  @override
  String imageShareMessage(Object city) {
    return 'Look what Smartur recommends for me in $city!';
  }

  @override
  String get commonPlaceFallback => 'Place';

  @override
  String get recoTypeCultural => 'Cultural';

  @override
  String get recoTypeNature => 'Nature';

  @override
  String get recoTypeGastronomy => 'Gastronomic';

  @override
  String get recoTypeAdventure => 'Adventure';

  @override
  String get recoTypeRelax => 'Relax';

  @override
  String get recoTypeNight => 'Nightlife';

  @override
  String get recoBudgetLowLabel => 'Budget';

  @override
  String get recoBudgetLowSub => 'Up to \$500/day';

  @override
  String get recoBudgetMediumLabel => 'Moderate';

  @override
  String get recoBudgetMediumSub => '\$500–1500/day';

  @override
  String get recoBudgetHighLabel => 'Premium';

  @override
  String get recoBudgetHighSub => '\$1500+/day';

  @override
  String get recoGroupSolo => 'Solo';

  @override
  String get recoGroupCouple => 'Couple';

  @override
  String get recoGroupFamily => 'Family';

  @override
  String get recoGroupFriends => 'Friends';

  @override
  String recoShareList(Object items) {
    return '🌿 My recommended destinations in Altas Montañas, Veracruz:\n\n• $items\n\n📱 Discover them with Smartur';
  }

  @override
  String detailShareMessage(
    Object title,
    Object location,
    Object description,
    Object mapsUrl,
  ) {
    return 'Discover $title in $location! 📍$description\nView on Maps: $mapsUrl\n\nDiscovered with Smartur — Altas Montañas, Veracruz';
  }

  @override
  String get mapsLabel => 'Maps';

  @override
  String get youAreHere => '← You are here';

  @override
  String get recoSavedInDiary =>
      'Recommendations saved. You can review them in Diary.';

  @override
  String get recoResultsDone => 'Done';

  @override
  String get recoResultsRankHint => 'Ranked by match with your profile';

  @override
  String get googleSignInReleaseConfig =>
      'Google Sign-In is not configured for this app build. Register the release keystore SHA in Firebase.';

  @override
  String get communityEmpty => 'No posts yet';

  @override
  String get communityEmptyHint => 'Be the first to share your experience';

  @override
  String get communityFirstPost => 'Create post';

  @override
  String get communityPostHint => 'What do you want to share?';

  @override
  String get communityReport => 'Report';

  @override
  String get communityReportTitle => 'Why are you reporting this post?';

  @override
  String get communityReportOther => 'Other reason';

  @override
  String get plannerTitle => 'Planner';

  @override
  String get plannerDelete => 'Delete route';

  @override
  String get plannerDeleteConfirm => 'Delete this route permanently?';

  @override
  String get plannerAddStop => 'Add stop';

  @override
  String get plannerNoStops => 'No stops';

  @override
  String get plannerNoStopsSubtitle => 'Tap + anywhere to add stops';

  @override
  String get plannerOptimize => 'Improve My Route';

  @override
  String get plannerOptimizeComingSoon => 'Coming soon in Smartur';

  @override
  String get plannerRouteName => 'Route name';

  @override
  String get plannerRouteNameHint => 'E.g.: My Xalapa route';

  @override
  String get plannerMakePublic => 'Make route public';

  @override
  String get plannerStopDate => 'Visit date';

  @override
  String get plannerStopNotes => 'Notes';

  @override
  String get plannerStopDelete => 'Remove stop';

  @override
  String itineraryNStops(int n) {
    return '$n stops';
  }

  @override
  String get itineraryCertified => 'Smartur Certified';

  @override
  String get itineraryCopy => 'Copy route';

  @override
  String get itineraryCopied => 'Route copied';

  @override
  String get itineraryDetail => 'Route detail';

  @override
  String get itineraryPublic => 'Public';

  @override
  String get itineraryPrivate => 'Private';

  @override
  String get itineraryStops => 'Stops';

  @override
  String get routesLoadError => 'Error loading routes';

  @override
  String get socialFollow => 'Follow';

  @override
  String get socialFollowing => 'Following';

  @override
  String get socialUnfollow => 'Unfollow';

  @override
  String get socialFollowers => 'Followers';

  @override
  String socialFollowersCount(int n) {
    return '$n followers';
  }

  @override
  String socialFollowingCount(int n) {
    return '$n following';
  }

  @override
  String get socialSearchUsers => 'Search users...';

  @override
  String get socialNoResults => 'No users found';

  @override
  String get publicRoutes => 'Public routes';

  @override
  String get noPublicRoutes => 'No public routes yet';

  @override
  String get copyToMyRoutes => 'Copy to my routes';

  @override
  String get routeCopied => 'Route copied to My Routes';

  @override
  String get viewProfile => 'View profile';

  @override
  String get compareTitle => 'Compare Routes';

  @override
  String get compareYourRoute => 'Your route';

  @override
  String get compareOptimized => 'Optimized route';

  @override
  String get compareDistanceLabel => 'Distance';

  @override
  String get compareSavingsLabel => 'Savings';

  @override
  String get compareMoreEfficient => 'more efficient';

  @override
  String get compareKeep => 'Keep my route';

  @override
  String get compareApply => 'Use optimized route';

  @override
  String get compareLoading => 'Optimizing with AI...';

  @override
  String get compareApplied => 'Optimized route applied';

  @override
  String get compareMinStops => 'You need at least 2 stops with a location';

  @override
  String get bookingTitle => 'Book service';

  @override
  String get bookingDate => 'Visit date';

  @override
  String get bookingTime => 'Time (optional)';

  @override
  String get bookingGuests => 'Guests';

  @override
  String get bookingNotes => 'Notes (optional)';

  @override
  String get bookingConfirm => 'Confirm booking';

  @override
  String get bookingSuccess => 'Booking sent successfully';

  @override
  String get bookingStatusPending => 'Pending';

  @override
  String get bookingStatusConfirmed => 'Confirmed';

  @override
  String get bookingStatusCancelled => 'Cancelled';

  @override
  String get bookingMyBookings => 'My bookings';

  @override
  String get bookingNoBookings => 'No bookings yet';

  @override
  String get bookingCancel => 'Cancel booking';

  @override
  String get chatTitle => 'Messages';

  @override
  String get chatSend => 'Send';

  @override
  String get chatNoConversations => 'No conversations yet';

  @override
  String get chatTypeHere => 'Type a message...';

  @override
  String get chatContact => 'Contact company';
}
