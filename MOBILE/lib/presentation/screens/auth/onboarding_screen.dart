
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:lottie/lottie.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:smartur/l10n/app_localizations.dart';
import '../../../data/models/onboarding_model.dart';
import '../../../core/motion/smartur_motion.dart';
import '../../../core/theme/smartur_theme_extensions.dart';
import '../../widgets/smartur_ui_kit.dart';
import 'welcome_screen.dart';
import '../../widgets/smartur_background.dart';
import '../../widgets/smartur_skeleton.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen>
    with TickerProviderStateMixin {
  late PageController _controller;
  double _pageOffset = 0.0;

  // Color animado sincronizado con el fondo (misma secuencia que SmarturBackground)
  late AnimationController _colorController;
  Animation<Color?>? _colorAnim;

  // Bob vertical sutil de las ilustraciones
  late AnimationController _floatController;

  @override
  void initState() {
    super.initState();
    _controller = PageController(initialPage: 0);
    _controller.addListener(() {
      setState(() {
        _pageOffset = _controller.page ?? 0.0;
      });
    });
    _colorController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 25),
    )..repeat();
    _floatController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2800),
    )..repeat(reverse: true);
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final sem = SmarturSemanticColors.of(context);
    _colorAnim = TweenSequence<Color?>([
      TweenSequenceItem(tween: ColorTween(begin: sem.leaf, end: sem.accent), weight: 1),
      TweenSequenceItem(tween: ColorTween(begin: sem.accent, end: sem.ember), weight: 1),
      TweenSequenceItem(tween: ColorTween(begin: sem.ember, end: sem.sea), weight: 1),
      TweenSequenceItem(tween: ColorTween(begin: sem.sea, end: sem.altAccent), weight: 1),
      TweenSequenceItem(tween: ColorTween(begin: sem.altAccent, end: sem.leaf), weight: 1),
    ]).animate(_colorController);
  }

  @override
  void dispose() {
    _floatController.dispose();
    _colorController.dispose();
    _controller.dispose();
    super.dispose();
  }

  Future<void> _storeOnboardingInfo() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    await prefs.setBool('onboarding_seen', true);
  }

  Widget _buildImageAsset(String path,
      {double height = 300, ColorFilter? colorFilter, Color? tintColor}) {
    if (path.endsWith('.svg')) {
      return SvgPicture.asset(
        path,
        height: height,
        fit: BoxFit.contain,
        colorFilter: colorFilter,
        // Tiñe solo las zonas de marca (que ahora usan currentColor en el SVG)
        theme: tintColor != null
            ? SvgTheme(currentColor: tintColor)
            : const SvgTheme(),
        placeholderBuilder: (context) => Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: SkeletonContainer(
                height: height,
                width: double.infinity,
                borderRadius: 16,
              ),
            ),
      );
    } else {
      return colorFilter != null ? ColorFiltered(
        colorFilter: colorFilter,
        child: _rawLottie(path, height),
      ) : _rawLottie(path, height);
    }
  }

  Widget _rawLottie(String path, double height) {
    return Lottie.asset(
      path,
      height: height,
      fit: BoxFit.contain,
      errorBuilder: (context, error, stackTrace) {
        final s = Theme.of(context).colorScheme;
        return Container(
          height: height,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: s.onSurface.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(
            'Falta:\n$path',
            textAlign: TextAlign.center,
            style: TextStyle(color: s.onSurfaceVariant, fontSize: 12),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final l10n = AppLocalizations.of(context)!;
    final contents = getOnboardingContents(l10n);
    return Scaffold(
      backgroundColor: scheme.surface,
      body: SmarturBackground(
        opacity: 0.55,
        child: Stack(
          alignment: Alignment.center,
          children: [
            PageView.builder(
              controller: _controller,
              itemCount: contents.length,
              itemBuilder: (_, i) {
                double localDelta = i - _pageOffset;
                final screenW = MediaQuery.sizeOf(context).width;
                double parallaxOffset = localDelta * (screenW * 0.35);
                double itemOpacity = (1.0 - (localDelta.abs() * 1.5)).clamp(0.0, 1.0);
                
                return Opacity(
                  opacity: itemOpacity,
                  child: Transform.translate(
                    offset: Offset(parallaxOffset, 0),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 60),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          AnimatedBuilder(
                            animation: Listenable.merge(
                                [_colorController, _floatController]),
                            builder: (context, _) {
                              final bob = (_floatController.value - 0.5) * 14;
                              final pageScale =
                                  (1.0 - localDelta.abs() * 0.14)
                                      .clamp(0.82, 1.0);
                              return Transform.translate(
                                offset: Offset(0, bob),
                                child: Transform.scale(
                                  scale: pageScale,
                                  child: _buildImageAsset(
                                    contents[i].imagePath,
                                    height: (MediaQuery.sizeOf(context).height *
                                            0.32)
                                        .clamp(180.0, 340.0),
                                    tintColor:
                                        _colorAnim?.value ?? scheme.primary,
                                  ),
                                ),
                              );
                            },
                          ),
                          const Spacer(),
                          Text(
                            contents[i].title,
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: (MediaQuery.sizeOf(context).width < 360 ? 24.0 : MediaQuery.sizeOf(context).width < 400 ? 28.0 : 32.0),
                              fontWeight: FontWeight.bold,
                              color: scheme.onSurface,
                              height: 1.2,
                              fontFamily: 'CalSans',
                            ),
                            maxLines: 3,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 16),
                          Text(
                            contents[i].description,
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: MediaQuery.sizeOf(context).width < 360 ? 14.0 : 16.0,
                              color: scheme.onSurfaceVariant,
                              height: 1.5,
                              fontFamily: 'Outfit',
                            ),
                            maxLines: 4,
                            overflow: TextOverflow.ellipsis,
                          ),
                          SizedBox(height: (MediaQuery.sizeOf(context).height * 0.13).clamp(80.0, 120.0)),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),


            Positioned(
              bottom: 40,
              left: 40,
              right: 40,
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(
                      contents.length,
                      (index) {
                        final active = _pageOffset.round() == index;
                        return AnimatedContainer(
                          duration: SmarturMotion.fast,
                          curve: SmarturMotion.standard,
                          height: 8,
                          width: active ? 28 : 8,
                          margin: const EdgeInsets.only(right: 6),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(20),
                            color: active
                                ? scheme.primary
                                : scheme.onSurfaceVariant.withValues(alpha: 0.28),
                          ),
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 30),
                  
                  Stack(
                    alignment: Alignment.center,
                    children: [
                      AnimatedOpacity(
                        duration: const Duration(milliseconds: 200),
                        opacity: (_pageOffset < 1.5) ? 1.0 : 0.0,
                        child: TextButton(
                          onPressed: () {
                            _controller.nextPage(
                              duration: const Duration(milliseconds: 400),
                              curve: Curves.easeInOutCubic,
                            );
                          },
                          child: Text(
                            l10n.next,
                            style: TextStyle(
                              color: scheme.onSurface,
                              fontSize: 18, 
                              fontWeight: FontWeight.w600,
                              fontFamily: 'Outfit',
                            ),
                          ),
                        ),
                      ),

                      AnimatedScale(
                        duration: const Duration(milliseconds: 500),
                        scale: (_pageOffset > 1.5) ? 1.0 : 0.0,
                        curve: Curves.elasticOut,
                        child: AnimatedOpacity(
                          duration: const Duration(milliseconds: 300),
                          opacity: (_pageOffset > 1.5) ? 1.0 : 0.0,
                          child: SizedBox(
                            width: double.infinity,
                            height: 60,
                            child: ElevatedButton(
                              onPressed: () {
                                _storeOnboardingInfo();
                                Navigator.pushReplacement(
                                  context,
                                  smarturFadeRoute(const WelcomeScreen()),
                                );
                              },
                              child: Text(l10n.startNow),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
