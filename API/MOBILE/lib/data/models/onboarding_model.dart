class OnboardingContent {
  final String title;
  final String description;
  final String imagePath;
  OnboardingContent({required this.title, required this.description, required this.imagePath});
}

List<OnboardingContent> contents = [
  OnboardingContent(
    title: "Tu aventura comienza aquí",
    imagePath: 'assets/svg/destination.svg',
    description: "Explora los rincones más mágicos de las Altas Montañas con rutas diseñadas para el explorador moderno.",
  ),
  OnboardingContent(
    title: "Inteligencia que te conoce",
    imagePath: 'assets/svg/ia.svg',
    description: "Analizamos tus preferencias para que cada recomendación se sienta escrita solo para ti.",
  ),
  OnboardingContent(
    title: "Vive lo auténtico",
    imagePath: 'assets/svg/map.svg',
    description: "Conecta con guías locales y apoya el turismo de nuestra región mientras creas recuerdos inolvidables.",
  ),
];
