import 'package:smartur/l10n/app_localizations.dart';

class OnboardingContent {
  final String title;
  final String description;
  final String imagePath;
  OnboardingContent({required this.title, required this.description, required this.imagePath});
}

List<OnboardingContent> getOnboardingContents(AppLocalizations l10n) => [
  OnboardingContent(
    title: l10n.onboardingTitle1,
    description: l10n.onboardingDesc1,
    imagePath: 'assets/svg/destination.svg',
  ),
  OnboardingContent(
    title: l10n.onboardingTitle2,
    description: l10n.onboardingDesc2,
    imagePath: 'assets/svg/ia.svg',
  ),
  OnboardingContent(
    title: l10n.onboardingTitle3,
    description: l10n.onboardingDesc3,
    imagePath: 'assets/svg/map.svg',
  ),
];
