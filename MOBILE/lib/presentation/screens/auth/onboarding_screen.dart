
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:lottie/lottie.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../data/models/onboarding_model.dart';
import '../../../core/theme/style_guide.dart';
import 'welcome_screen.dart';
import '../../widgets/smartur_background.dart';
import '../../widgets/smartur_skeleton.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  late PageController _controller;
  double _pageOffset = 0.0;

  @override
  void initState() {
    super.initState();
    _controller = PageController(initialPage: 0);
    _controller.addListener(() {
      setState(() {
        _pageOffset = _controller.page ?? 0.0;
      });
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _storeOnboardingInfo() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    await prefs.setBool('onboarding_seen', true);
  }

  Widget _buildImageAsset(String path, {double height = 300, ColorFilter? colorFilter}) {
    if (path.endsWith('.svg')) {
      return SvgPicture.asset(
        path,
        height: height,
        fit: BoxFit.contain,
        colorFilter: colorFilter,
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
        return Container(
          height: height,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.2),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(
            'Falta:\n$path',
            textAlign: TextAlign.center,
            style: const TextStyle(color: Colors.white, fontSize: 12),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
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
                double parallaxOffset = localDelta * 150; 
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
                          _buildImageAsset(contents[i].imagePath, height: 380),
                          const Spacer(),
                          Text(
                            contents[i].title,
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 32, 
                              fontWeight: FontWeight.bold,
                              color: scheme.onSurface,
                              height: 1.2,
                              fontFamily: 'CalSans',
                            ),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            contents[i].description,
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 16, 
                              color: scheme.onSurfaceVariant,
                              height: 1.5,
                              fontFamily: 'Outfit',
                            ),
                          ),
                          const SizedBox(height: 120), 
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
                      (index) => Container(
                        height: 10,
                        width: (_pageOffset.round() == index) ? 25 : 10,
                        margin: const EdgeInsets.only(right: 5),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(20),
                          color: (_pageOffset.round() == index) 
                              ? SmarturStyle.purple 
                              : scheme.onSurfaceVariant.withValues(alpha: 0.3),
                        ),
                      ),
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
                            "Continuar",
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
                              style: ElevatedButton.styleFrom(
                                backgroundColor: SmarturStyle.purple, 
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                              ),
                              child: const Text(
                                "¡Comenzar aventura!",
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  fontFamily: 'CalSans'
                                ),
                              ),
                              onPressed: () {
                                _storeOnboardingInfo();
                                Navigator.pushReplacement(
                                  context,
                                  MaterialPageRoute(builder: (_) => const WelcomeScreen()),
                                );
                              },
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
