import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:smartur/l10n/app_localizations.dart';

import '../../../core/theme/style_guide.dart';
import '../../../data/services/notification_service.dart';
import 'home_screen.dart';
import 'diary_screen.dart';
import 'community_screen.dart';
import 'profile_screen.dart';
import '../explore/recommendation_screen.dart';

class MainScreen extends StatefulWidget {
  final String? userName;
  final bool isNewLogin;

  const MainScreen({super.key, this.userName, this.isNewLogin = false});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> with SingleTickerProviderStateMixin {
  int _currentIndex = 0;

  final GlobalKey<HomeScreenState> _homeScreenKey = GlobalKey<HomeScreenState>();

  /// 0 = libro “cerrado” (vista lateral), 1 = abierto de frente.
  late final AnimationController _diaryBookAnim;

  @override
  void initState() {
    super.initState();
    _diaryBookAnim = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 420),
      value: 0,
    );
    // Etapa 2: registrar token en API + activar banners en primer plano.
    // Se llama después del primer frame para tener contexto disponible.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) NotificationService.registerWithApi(context: context);
    });
  }

  @override
  void dispose() {
    _diaryBookAnim.dispose();
    super.dispose();
  }

  void _onTabTapped(int index) {
    if (_currentIndex == index) return;
    HapticFeedback.lightImpact();
    setState(() => _currentIndex = index);
    
    // Inicio: nombre y avatar pueden haber cambiado en la pestaña Perfil / Ajustes.
    if (index == 0) {
      _homeScreenKey.currentState?.refreshUserIdentity();
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      backgroundColor: scheme.surface,
      body: IndexedStack(
        index: _currentIndex,
        children: [
          HomeScreen(
            key: _homeScreenKey,
            userName: widget.userName,
            isNewLogin: widget.isNewLogin,
          ),
          DiaryScreen(
            key: const ValueKey<String>('main_tab_diary'),
            diaryTabActive: _currentIndex == 1,
          ),
          const RecommendationScreen(key: ValueKey<String>('main_tab_ia')),
          const CommunityScreen(key: ValueKey<String>('main_tab_community')),
          const ProfileScreen(key: ValueKey<String>('main_tab_profile')),
        ],
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: scheme.surface,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04), // Más suave para verse premium

              blurRadius: 10,
              offset: const Offset(0, -4),
            ),
          ],
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 12.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                _NavBarItem(
                  index: 0,
                  isSelected: _currentIndex == 0,
                  label: l10n.navHome,
                  outlineIcon: Icons.explore_outlined,
                  solidIcon: Icons.explore,
                  onTap: () => _onTabTapped(0),
                ),
                _NavBarItem(
                  index: 1,
                  isSelected: _currentIndex == 1,
                  label: l10n.navDiary,
                  outlineIcon: Icons.book_outlined,
                  solidIcon: Icons.menu_book, // Cambio sugerido: Abierto
                  onTap: () => _onTabTapped(1),
                ),
                _NavBarItemIA(
                  isSelected: _currentIndex == 2,
                  onTap: () => _onTabTapped(2),
                ),
                _NavBarItem(
                  index: 3,
                  isSelected: _currentIndex == 3,
                  label: l10n.navCommunity,
                  outlineIcon: Icons.people_outline,
                  solidIcon: Icons.people,
                  onTap: () => _onTabTapped(3),
                ),
                _NavBarItem(
                  index: 4,
                  isSelected: _currentIndex == 4,
                  label: l10n.navUser,
                  outlineIcon: Icons.person_outline,
                  solidIcon: Icons.person,
                  onTap: () => _onTabTapped(4),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _NavBarItem extends StatelessWidget {
  final int index;
  final bool isSelected;
  final String label;
  final IconData outlineIcon;
  final IconData solidIcon;
  final VoidCallback onTap;

  const _NavBarItem({
    required this.index,
    required this.isSelected,
    required this.label,
    required this.outlineIcon,
    required this.solidIcon,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final color = isSelected ? SmarturStyle.purple : scheme.onSurfaceVariant;

    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOutCubic,
        padding: EdgeInsets.symmetric(
          horizontal: isSelected
              ? (MediaQuery.sizeOf(context).width < 360 ? 10.0 : 16.0)
              : (MediaQuery.sizeOf(context).width < 360 ? 8.0 : 12.0),
          vertical: 10.0,
        ),
        decoration: BoxDecoration(
          color: isSelected ? SmarturStyle.purple.withValues(alpha: 0.12) : Colors.transparent,
          borderRadius: BorderRadius.circular(24),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            _buildAnimatedIcon(scheme, color),
            AnimatedSize(
              duration: const Duration(milliseconds: 300),
              curve: Curves.easeOutCubic,
              clipBehavior: Clip.antiAlias,
              child: isSelected
                  ? Padding(
                      padding: const EdgeInsets.only(left: 8.0),
                      child: Text(
                        label,
                        style: const TextStyle(
                          fontFamily: 'Outfit',
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: SmarturStyle.purple,
                        ),
                        maxLines: 1,
                      ),
                    )
                  : const SizedBox.shrink(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAnimatedIcon(ColorScheme scheme, Color color) {
    switch (index) {
      case 0: // Inicio: Giro corto (Brújula)
        return AnimatedRotation(
          duration: const Duration(milliseconds: 400),
          curve: Curves.easeOutBack,
          turns: isSelected ? 1.0 : 0.0,
          child: Icon(isSelected ? solidIcon : outlineIcon, color: color, size: 24),
        );
      case 1: // Diario: Transición de Glifo (Abierto/Cerrado) con suavizado
        return AnimatedSwitcher(
          duration: const Duration(milliseconds: 400),
          switchInCurve: Curves.easeOutBack,
          switchOutCurve: Curves.easeInCirc,
          transitionBuilder: (child, anim) {
            return FadeTransition(
              opacity: anim,
              child: ScaleTransition(
                scale: Tween<double>(begin: 0.85, end: 1.0).animate(anim),
                child: child,
              ),
            );
          },
          child: Icon(
            isSelected ? solidIcon : outlineIcon,
            key: ValueKey(isSelected),
            color: color,
            size: 24,
          ),
        );
      case 2: // IA: Destello Elástico + Varita Mágica
        return TweenAnimationBuilder<double>(
          key: ValueKey(isSelected),
          tween: Tween(begin: 0.0, end: 1.0),
          duration: const Duration(milliseconds: 900),
          curve: Curves.elasticOut,
          builder: (context, val, child) {
            final double scale = isSelected ? 1.0 + (val * 0.45) : 1.0;
            final double opacity = (isSelected ? 0.5 + (val * 0.5) : 1.0).clamp(0.0, 1.0);
            // Pequeña rotación tipo varita (oscilación)
            final double rotation = isSelected ? math.sin(val * math.pi * 3) * 0.15 : 0.0;
            
            return Opacity(
              opacity: opacity,
              child: Transform.rotate(
                angle: rotation,
                child: Transform.scale(
                  scale: scale,
                  child: Icon(isSelected ? solidIcon : outlineIcon, color: color, size: 24),
                ),
              ),
            );
          },
        );
      case 3: // Comunidad: Acercamiento Social
        return AnimatedPadding(
          duration: const Duration(milliseconds: 400),
          curve: Curves.easeOutCubic, // Cambiamos curva para evitar rebotes negativos en padding
          padding: EdgeInsets.symmetric(horizontal: isSelected ? 0 : 4),
          child: Icon(isSelected ? solidIcon : outlineIcon, color: color, size: 24),
        );
      case 4: // Perfil: Flip 3D
        return TweenAnimationBuilder<double>(
          key: ValueKey(isSelected),
          tween: Tween(begin: 0.0, end: isSelected ? 1.0 : 0.0),
          duration: const Duration(milliseconds: 500),
          curve: Curves.easeInOut,
          builder: (context, val, child) {
            return Transform(
              alignment: Alignment.center,
              transform: Matrix4.identity()
                ..setEntry(3, 2, 0.001)
                ..rotateY(val * math.pi),
              child: Icon(isSelected ? solidIcon : outlineIcon, color: color, size: 24),
            );
          },
        );
      default:
        return Icon(isSelected ? solidIcon : outlineIcon, color: color, size: 24);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Special IA nav item with animated sparkle badge
// ═══════════════════════════════════════════════════════════════════════════

class _NavBarItemIA extends StatefulWidget {
  final bool isSelected;
  final VoidCallback onTap;

  const _NavBarItemIA({required this.isSelected, required this.onTap});

  @override
  State<_NavBarItemIA> createState() => _NavBarItemIAState();
}

/// 5-color cycle using brand palette: pink → purple → blue → green → orange → pink
final _sparkleColorTween = TweenSequence<Color?>([
  TweenSequenceItem(tween: ColorTween(begin: SmarturStyle.pink,   end: SmarturStyle.purple), weight: 1),
  TweenSequenceItem(tween: ColorTween(begin: SmarturStyle.purple, end: SmarturStyle.blue),   weight: 1),
  TweenSequenceItem(tween: ColorTween(begin: SmarturStyle.blue,   end: SmarturStyle.green),  weight: 1),
  TweenSequenceItem(tween: ColorTween(begin: SmarturStyle.green,  end: SmarturStyle.orange), weight: 1),
  TweenSequenceItem(tween: ColorTween(begin: SmarturStyle.orange, end: SmarturStyle.pink),   weight: 1),
]);

class _NavBarItemIAState extends State<_NavBarItemIA>
    with SingleTickerProviderStateMixin {
  late final AnimationController _sparkleCtrl;

  @override
  void initState() {
    super.initState();
    _sparkleCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 4000),
    )..repeat();
  }

  @override
  void dispose() {
    _sparkleCtrl.dispose();
    super.dispose();
  }



  @override
  Widget build(BuildContext context) {
    final color = widget.isSelected ? SmarturStyle.purple : Theme.of(context).colorScheme.onSurfaceVariant;
    return GestureDetector(
      onTap: widget.onTap,
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOutCubic,
        padding: EdgeInsets.symmetric(
          horizontal: widget.isSelected ? 16.0 : 12.0,
          vertical: 10.0,
        ),
        decoration: BoxDecoration(
          color: widget.isSelected
              ? SmarturStyle.purple.withValues(alpha: 0.12)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(24),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Icon with sparkle badge
            Stack(
              clipBehavior: Clip.none,
              children: [
                TweenAnimationBuilder<double>(
                  key: ValueKey(widget.isSelected),
                  tween: Tween(begin: 0.0, end: 1.0),
                  duration: const Duration(milliseconds: 900),
                  curve: Curves.elasticOut,
                  builder: (context, val, child) {
                    final double scale = widget.isSelected ? 1.0 + (val * 0.45) : 1.0;
                    final double opacity = (widget.isSelected ? 0.5 + (val * 0.5) : 1.0).clamp(0.0, 1.0);
                    final double rotation = widget.isSelected ? math.sin(val * math.pi * 3) * 0.15 : 0.0;
                    return Opacity(
                      opacity: opacity,
                      child: Transform.rotate(
                        angle: rotation,
                        child: Transform.scale(
                          scale: scale,
                          child: Icon(
                            widget.isSelected ? Icons.auto_awesome : Icons.auto_awesome_outlined,
                            color: color, size: 24,
                          ),
                        ),
                      ),
                    );
                  },
                ),
                // Sparkle dot (top-right of icon) — cycles through 5 system colors
                Positioned(
                  top: -3,
                  right: -3,
                  child: AnimatedBuilder(
                    animation: _sparkleCtrl,
                    builder: (_, __) {
                      final dotColor = _sparkleColorTween.evaluate(_sparkleCtrl) ?? SmarturStyle.purple;
                      final pulse = (math.sin(_sparkleCtrl.value * math.pi * 4) * 0.5 + 0.5);
                      return Container(
                        width: 7,
                        height: 7,
                        decoration: BoxDecoration(
                          color: dotColor,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: dotColor.withValues(alpha: 0.6 * pulse),
                              blurRadius: 6,
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
            // Label when selected
            AnimatedSize(
              duration: const Duration(milliseconds: 300),
              curve: Curves.easeOutCubic,
              clipBehavior: Clip.antiAlias,
              child: widget.isSelected
                  ? const Padding(
                      padding: EdgeInsets.only(left: 8.0),
                      child: Text('IA',
                        style: TextStyle(
                          fontFamily: 'Outfit', fontSize: 13, fontWeight: FontWeight.w700,
                          color: SmarturStyle.purple,
                        ),
                        maxLines: 1),
                    )
                  : const SizedBox.shrink(),
            ),
          ],
        ),
      ),
    );
  }
}
