// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appTitle => 'SMARTUR';

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
  String get registerAcceptTermsPrefix => 'I accept the ';

  @override
  String get termsMustAccept =>
      'You must accept the terms and conditions to sign up.';

  @override
  String get termsCloseButton => 'Got it';

  @override
  String get termsAndConditionsBody =>
      'Last updated: March 2025.\n\n1. Purpose\nSMARTUR is a mobile app to explore tourist destinations, recommendations, and community features.\n\n2. Registration and account\nBy creating an account you confirm your information is accurate. You are responsible for keeping your password confidential and for activity under your account.\n\n3. Permitted use\nYou agree to use the service lawfully, without infringing third-party rights or disrupting the platform.\n\n4. Content and intellectual property\nApp content (text, design, trademarks) is protected. Unauthorized reproduction is not allowed.\n\n5. Personal data\nProcessing of your personal data complies with applicable law. By using SMARTUR you accept the practices described in the service privacy policy.\n\n6. Changes\nWe may update these terms. Material changes will be communicated by reasonable means; continued use after updates means you accept the new terms.\n\n7. Contact\nFor questions about these terms, use the support channels provided in the app or on the official website.';

  @override
  String get logout => 'Log out';

  @override
  String get selectLanguage => 'Select Language';

  @override
  String get systemLanguage => 'Idioma del sistema';

  @override
  String get systemTheme => 'Tema del sistema';

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
  String get navDiary => 'Diary';

  @override
  String get navRecommend => 'Recommend';

  @override
  String get navCommunity => 'Community';

  @override
  String get navUser => 'User';

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
    return 'Suggested by SMARTUR AI for your visit to $city.';
  }

  @override
  String get mapDiscoverHint =>
      'Discover key points without tracking your location in real time.';

  @override
  String get mapTapPinHint => 'Tap a pin to see AI-generated details';

  @override
  String get filterAll => 'All';

  @override
  String get filterMuseums => 'Museums';

  @override
  String get filterCafes => 'Cafés';

  @override
  String get filterViewpoints => 'Viewpoints';

  @override
  String get filterMuseumsOnly => 'Museums only';

  @override
  String get aiSmartur => 'SMARTUR AI';

  @override
  String get enableBiometricsHint =>
      'Sign in and enable fingerprint in your profile';

  @override
  String get deviceNotSupported => 'Device not supported';

  @override
  String get noBiometricsEnrolled => 'No fingerprints enrolled';

  @override
  String get biometricReason => 'Access your SMARTUR routes';

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
  String get biometricActivateTitle => 'Activate fingerprint — SMARTUR';

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
  String get createOneDayRoute => 'Create 1-Day Route';

  @override
  String get tabLocationPlaceholder => 'Map and key points to visit.';

  @override
  String get tabGastronomyPlaceholder =>
      'Typical dishes and recommended cafés in the area.';

  @override
  String get tabAiPlaceholder =>
      'AI-generated summary with reviews and ratings from other tourists.';

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
  String get defaultUserName => 'SMARTUR Tourist';

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
}
