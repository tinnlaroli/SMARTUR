import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:smartur/l10n/app_localizations.dart';

import '../../../core/theme/style_guide.dart';
import '../../../data/services/notification_service.dart';
import '../../../core/navigation/notification_router.dart';
import '../chat/conversations_screen.dart';
import '../../../core/motion/smartur_routes.dart';
import 'home_screen.dart';
import 'explore_screen.dart';
import 'mis_rutas_screen.dart';
import 'profile_screen.dart';
import 'main_tab_scope.dart';
import '../../widgets/smartur_tab_fade_stack.dart';

/// Contador global de paradas en la ruta activa.
/// Sprint 3 lo actualizará con datos reales; por ahora siempre 0.
final routeStopCount = ValueNotifier<int>(0);

class MainScreen extends StatefulWidget {
  final String? userName;
  final bool isNewLogin;

  const MainScreen({super.key, this.userName, this.isNewLogin = false});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _currentIndex = 0;

  final GlobalKey<HomeScreenState> _homeScreenKey = GlobalKey<HomeScreenState>();

  @override
  void initState() {
    super.initState();
    pendingNotificationScreen.addListener(_onNotificationRoute);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) NotificationService.registerWithApi(context: context);
    });
  }

  @override
  void dispose() {
    pendingNotificationScreen.removeListener(_onNotificationRoute);
    super.dispose();
  }

  void _onNotificationRoute() {
    final screen = pendingNotificationScreen.value;
    if (screen == null) return;
    pendingNotificationScreen.value = null;
    if (!mounted) return;
    switch (screen) {
      case 'explore':  _onTabTapped(MainTabIndex.explore);  break;
      case 'routes':   _onTabTapped(MainTabIndex.routes);   break;
      case 'profile':  _onTabTapped(MainTabIndex.profile);  break;
      case 'home':     _onTabTapped(MainTabIndex.home);     break;
      case 'messages':
        context.pushSmartur(const ConversationsScreen());
        break;
      case 'bookings':
        _onTabTapped(MainTabIndex.profile);
        break;
      // 'servicios' is empresa-only; mobile users don't need routing for it
    }
  }

  void _onTabTapped(int index) {
    if (_currentIndex == index) {
      if (index == MainTabIndex.home) {
        HapticFeedback.lightImpact();
        _homeScreenKey.currentState?.scrollToTop();
      }
      return;
    }
    HapticFeedback.lightImpact();
    setState(() => _currentIndex = index);
    if (index == MainTabIndex.home) {
      _homeScreenKey.currentState?.refreshUserIdentity();
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final scheme = Theme.of(context).colorScheme;
    return MainTabScope(
      selectTab: _onTabTapped,
      child: Scaffold(
        backgroundColor: scheme.surface,
        body: SmarturTabFadeStack(
          index: _currentIndex,
          children: [
            HomeScreen(
              key: _homeScreenKey,
              userName: widget.userName,
              isNewLogin: widget.isNewLogin,
            ),
            const ExploreScreen(key: ValueKey<String>('main_tab_explore')),
            const MisRutasScreen(key: ValueKey<String>('main_tab_routes')),
            const ProfileScreen(key: ValueKey<String>('main_tab_profile')),
          ],
        ),
        bottomNavigationBar: Container(
          decoration: BoxDecoration(
            color: scheme.surface,
            boxShadow: [
              BoxShadow(
                color: scheme.shadow.withValues(alpha: 0.08),
                blurRadius: 12,
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
                    label: l10n.navExplore,
                    outlineIcon: Icons.search_outlined,
                    solidIcon: Icons.search_rounded,
                    onTap: () => _onTabTapped(1),
                  ),
                  _NavBarItemRoutes(
                    isSelected: _currentIndex == 2,
                    label: l10n.navRoutes,
                    onTap: () => _onTabTapped(2),
                  ),
                  _NavBarItem(
                    index: 3,
                    isSelected: _currentIndex == 3,
                    label: l10n.navUser,
                    outlineIcon: Icons.person_outline,
                    solidIcon: Icons.person,
                    onTap: () => _onTabTapped(3),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Generic nav bar item
// ─────────────────────────────────────────────────────────────────────────────

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
            _buildIcon(color),
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

  Widget _buildIcon(Color color) {
    switch (index) {
      case 0: // Home: giro breve
        return AnimatedRotation(
          duration: const Duration(milliseconds: 400),
          curve: Curves.easeOutBack,
          turns: isSelected ? 1.0 : 0.0,
          child: Icon(isSelected ? solidIcon : outlineIcon, color: color, size: 24),
        );
      case 1: // Explorar: escala elástica
        return TweenAnimationBuilder<double>(
          key: ValueKey(isSelected),
          tween: Tween(begin: 0.85, end: 1.0),
          duration: const Duration(milliseconds: 350),
          curve: Curves.elasticOut,
          builder: (_, val, __) => Transform.scale(
            scale: isSelected ? val : 1.0,
            child: Icon(isSelected ? solidIcon : outlineIcon, color: color, size: 24),
          ),
        );
      case 3: // Perfil: flip 3D
        return TweenAnimationBuilder<double>(
          key: ValueKey(isSelected),
          tween: Tween(begin: 0.0, end: isSelected ? 1.0 : 0.0),
          duration: const Duration(milliseconds: 500),
          curve: Curves.easeInOut,
          builder: (_, val, __) => Transform(
            alignment: Alignment.center,
            transform: Matrix4.identity()
              ..setEntry(3, 2, 0.001)
              ..rotateY(val * math.pi),
            child: Icon(isSelected ? solidIcon : outlineIcon, color: color, size: 24),
          ),
        );
      default:
        return Icon(isSelected ? solidIcon : outlineIcon, color: color, size: 24);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Mis Rutas nav item — con badge animado de paradas
// ─────────────────────────────────────────────────────────────────────────────

class _NavBarItemRoutes extends StatelessWidget {
  final bool isSelected;
  final String label;
  final VoidCallback onTap;

  const _NavBarItemRoutes({
    required this.isSelected,
    required this.label,
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
          color: isSelected
              ? SmarturStyle.purple.withValues(alpha: 0.12)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(24),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Stack(
              clipBehavior: Clip.none,
              children: [
                // Animated icon: map with slight bounce
                TweenAnimationBuilder<double>(
                  key: ValueKey(isSelected),
                  tween: Tween(begin: 0.8, end: 1.0),
                  duration: const Duration(milliseconds: 400),
                  curve: Curves.elasticOut,
                  builder: (_, val, __) => Transform.scale(
                    scale: isSelected ? val : 1.0,
                    child: Icon(
                      isSelected ? Icons.map_rounded : Icons.map_outlined,
                      color: color,
                      size: 24,
                    ),
                  ),
                ),
                // Badge with stop count
                ValueListenableBuilder<int>(
                  valueListenable: routeStopCount,
                  builder: (_, count, __) {
                    if (count == 0) return const SizedBox.shrink();
                    return Positioned(
                      top: -4,
                      right: -4,
                      child: AnimatedScale(
                        scale: count > 0 ? 1.0 : 0.0,
                        duration: const Duration(milliseconds: 300),
                        curve: Curves.elasticOut,
                        child: Container(
                          padding: const EdgeInsets.all(3),
                          decoration: BoxDecoration(
                            color: SmarturStyle.pink,
                            shape: BoxShape.circle,
                            border: Border.all(color: scheme.surface, width: 1.5),
                          ),
                          constraints:
                              const BoxConstraints(minWidth: 16, minHeight: 16),
                          child: Text(
                            '$count',
                            style: const TextStyle(
                              fontFamily: 'Outfit',
                              fontSize: 9,
                              fontWeight: FontWeight.w700,
                              color: Colors.white,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ],
            ),
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
}
