import 'dart:async';
import 'dart:ui' show ImageFilter;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/theme/smartur_theme_extensions.dart';
import '../../../data/services/notification_service.dart';
import '../../../core/navigation/notification_router.dart';
import 'home_screen.dart';
import 'explore_screen.dart';
import 'mis_rutas_screen.dart';
import 'profile_screen.dart';
import '../chat/conversations_screen.dart';
import 'main_tab_scope.dart';

/// Contador global de paradas en la ruta activa.
final routeStopCount = ValueNotifier<int>(0);

const int _kTabCount = 5;

class MainScreen extends StatefulWidget {
  final String? userName;
  final bool isNewLogin;

  const MainScreen({super.key, this.userName, this.isNewLogin = false});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _currentIndex = 0;
  late final PageController _pageCtrl;

  // Encoger el nav mientras se hace scroll vertical.
  bool _isScrolling = false;
  Timer? _scrollStopTimer;

  final GlobalKey<HomeScreenState> _homeScreenKey = GlobalKey<HomeScreenState>();

  @override
  void initState() {
    super.initState();
    _pageCtrl = PageController(initialPage: 0);
    pendingNotificationScreen.addListener(_onNotificationRoute);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) NotificationService.registerWithApi(context: context);
    });
  }

  @override
  void dispose() {
    _scrollStopTimer?.cancel();
    _pageCtrl.dispose();
    pendingNotificationScreen.removeListener(_onNotificationRoute);
    super.dispose();
  }

  void _onNotificationRoute() {
    final screen = pendingNotificationScreen.value;
    if (screen == null) return;
    pendingNotificationScreen.value = null;
    if (!mounted) return;
    switch (screen) {
      case 'explore':  _goToTab(MainTabIndex.explore);  break;
      case 'routes':   _goToTab(MainTabIndex.routes);   break;
      case 'profile':  _goToTab(MainTabIndex.profile);  break;
      case 'home':     _goToTab(MainTabIndex.home);     break;
      case 'messages': _goToTab(MainTabIndex.messages); break;
      case 'bookings': _goToTab(MainTabIndex.profile);  break;
    }
  }

  /// Tap en un item del nav.
  void _onTabTapped(int index) {
    if (_currentIndex == index) {
      if (index == MainTabIndex.home) {
        HapticFeedback.lightImpact();
        _homeScreenKey.currentState?.scrollToTop();
      }
      return;
    }
    _goToTab(index);
  }

  void _goToTab(int index) {
    HapticFeedback.lightImpact();
    _pageCtrl.animateToPage(
      index,
      duration: const Duration(milliseconds: 320),
      curve: Curves.easeOutCubic,
    );
  }

  /// La página quedó asentada en [index].
  void _onPageSettled(int index) {
    if (_currentIndex == index) return;
    setState(() => _currentIndex = index);
    HapticFeedback.lightImpact();
    if (index == MainTabIndex.home) {
      _homeScreenKey.currentState?.refreshUserIdentity();
      _homeScreenKey.currentState?.reloadRecommendations();
    }
  }

  bool _handleScroll(ScrollNotification n) {
    // Solo el scroll VERTICAL de la pantalla activa encoge el nav
    // (ignora el propio scroll horizontal del PageView).
    if (n.metrics.axis != Axis.vertical) return false;
    if (n is ScrollUpdateNotification || n is UserScrollNotification) {
      if (!_isScrolling && mounted) setState(() => _isScrolling = true);
      _scrollStopTimer?.cancel();
      _scrollStopTimer = Timer(const Duration(milliseconds: 320), () {
        if (mounted) setState(() => _isScrolling = false);
      });
    }
    return false;
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return MainTabScope(
      selectTab: _onTabTapped,
      child: Scaffold(
        backgroundColor: scheme.surface,
        extendBody: true,
        body: NotificationListener<ScrollNotification>(
          onNotification: _handleScroll,
          child: PageView(
            controller: _pageCtrl,
            onPageChanged: _onPageSettled,
            // En Explorar el swipe horizontal controla sus sub-tabs internas.
            physics: _currentIndex == MainTabIndex.explore
                ? const NeverScrollableScrollPhysics()
                : const ClampingScrollPhysics(),
            children: [
              _KeepAlivePage(
                child: HomeScreen(
                  key: _homeScreenKey,
                  userName: widget.userName,
                  isNewLogin: widget.isNewLogin,
                ),
              ),
              const _KeepAlivePage(
                child: ExploreScreen(key: ValueKey<String>('main_tab_explore')),
              ),
              const _KeepAlivePage(
                child: MisRutasScreen(key: ValueKey<String>('main_tab_routes')),
              ),
              const _KeepAlivePage(
                child: ConversationsScreen(
                    key: ValueKey<String>('main_tab_messages')),
              ),
              const _KeepAlivePage(
                child: ProfileScreen(key: ValueKey<String>('main_tab_profile')),
              ),
            ],
          ),
        ),
        bottomNavigationBar: _buildGlassNav(scheme),
      ),
    );
  }

  Widget _buildGlassNav(ColorScheme scheme) {
    final isDark = scheme.brightness == Brightness.dark;
    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(28, 0, 28, 12),
        child: AnimatedScale(
          // Se encoge 25% mientras se hace scroll y vuelve al parar.
          scale: _isScrolling ? 0.75 : 1.0,
          alignment: Alignment.bottomCenter,
          duration: const Duration(milliseconds: 340),
          curve: Curves.easeOutCubic,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(32),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
              child: Container(
                decoration: BoxDecoration(
                  color: scheme.surface
                      .withValues(alpha: isDark ? 0.55 : 0.7),
                  borderRadius: BorderRadius.circular(32),
                  border: Border.all(
                    color: scheme.onSurface
                        .withValues(alpha: isDark ? 0.14 : 0.08),
                    width: 1,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: scheme.shadow.withValues(alpha: 0.12),
                      blurRadius: 24,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                child: _NavStrip(
                  pageCtrl: _pageCtrl,
                  currentIndex: _currentIndex,
                  onTapIndex: _onTabTapped,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Tira del nav: indicador deslizante compartido + iconos, arrastrable
// ─────────────────────────────────────────────────────────────────────────────

class _NavStrip extends StatelessWidget {
  final PageController pageCtrl;
  final int currentIndex;
  final ValueChanged<int> onTapIndex;

  const _NavStrip({
    required this.pageCtrl,
    required this.currentIndex,
    required this.onTapIndex,
  });

  static const _items = [
    (Icons.home_outlined, Icons.home_rounded, false),
    (Icons.search_outlined, Icons.search_rounded, false),
    (Icons.map_outlined, Icons.map_rounded, true), // badge
    (Icons.chat_bubble_outline_rounded, Icons.chat_bubble_rounded, false),
    (Icons.person_outline, Icons.person_rounded, false),
  ];

  double get _pagePos {
    if (pageCtrl.hasClients && pageCtrl.position.haveDimensions) {
      return (pageCtrl.page ?? currentIndex.toDouble()).clamp(0.0, 4.0);
    }
    return currentIndex.toDouble();
  }

  void _scrubTo(double dx, double slotW) {
    if (!pageCtrl.hasClients || !pageCtrl.position.haveDimensions) return;
    final page = (dx / slotW - 0.5).clamp(0.0, (_kTabCount - 1).toDouble());
    pageCtrl.jumpTo(page * pageCtrl.position.viewportDimension);
  }

  void _snap() {
    if (!pageCtrl.hasClients) return;
    final target = (pageCtrl.page ?? currentIndex.toDouble())
        .round()
        .clamp(0, _kTabCount - 1);
    HapticFeedback.selectionClick();
    pageCtrl.animateToPage(
      target,
      duration: const Duration(milliseconds: 260),
      curve: Curves.easeOutCubic,
    );
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    const height = 49.0;
    const dotSize = 46.0;

    return LayoutBuilder(
      builder: (context, constraints) {
        final w = constraints.maxWidth;
        final slotW = w / _kTabCount;

        return GestureDetector(
          behavior: HitTestBehavior.opaque,
          onHorizontalDragUpdate: (d) => _scrubTo(d.localPosition.dx, slotW),
          onHorizontalDragEnd: (_) => _snap(),
          child: SizedBox(
            height: height,
            width: w,
            child: Stack(
              children: [
                // Indicador deslizante que sigue el swipe/drag en vivo
                AnimatedBuilder(
                  animation: pageCtrl,
                  builder: (context, _) {
                    final left = slotW * (_pagePos + 0.5) - dotSize / 2;
                    return Positioned(
                      left: left,
                      top: (height - dotSize) / 2,
                      child: Container(
                        width: dotSize,
                        height: dotSize,
                        decoration: BoxDecoration(
                          color: scheme.primary.withValues(alpha: 0.16),
                          shape: BoxShape.circle,
                        ),
                      ),
                    );
                  },
                ),
                // Iconos (solo tap; el drag lo maneja el GestureDetector padre)
                Row(
                  children: [
                    for (var i = 0; i < _items.length; i++)
                      SizedBox(
                        width: slotW,
                        height: height,
                        child: _NavIcon(
                          outlineIcon: _items[i].$1,
                          solidIcon: _items[i].$2,
                          showBadge: _items[i].$3,
                          pageCtrl: pageCtrl,
                          index: i,
                          currentIndex: currentIndex,
                          onTap: () => onTapIndex(i),
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _NavIcon extends StatefulWidget {
  final IconData outlineIcon;
  final IconData solidIcon;
  final bool showBadge;
  final PageController pageCtrl;
  final int index;
  final int currentIndex;
  final VoidCallback onTap;

  const _NavIcon({
    required this.outlineIcon,
    required this.solidIcon,
    required this.showBadge,
    required this.pageCtrl,
    required this.index,
    required this.currentIndex,
    required this.onTap,
  });

  @override
  State<_NavIcon> createState() => _NavIconState();
}

class _NavIconState extends State<_NavIcon>
    with SingleTickerProviderStateMixin {
  late final AnimationController _bounce;
  late final Animation<double> _bounceScale;

  @override
  void initState() {
    super.initState();
    _bounce = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 480));
    _bounceScale = TweenSequence<double>([
      TweenSequenceItem(
          tween: Tween(begin: 1.0, end: 1.3)
              .chain(CurveTween(curve: Curves.easeOut)),
          weight: 40),
      TweenSequenceItem(
          tween: Tween(begin: 1.3, end: 1.0)
              .chain(CurveTween(curve: Curves.elasticOut)),
          weight: 60),
    ]).animate(_bounce);
  }

  @override
  void didUpdateWidget(_NavIcon old) {
    super.didUpdateWidget(old);
    // Rebote al convertirse en la pestaña activa.
    final becameSelected =
        widget.currentIndex == widget.index && old.currentIndex != widget.index;
    if (becameSelected) _bounce.forward(from: 0);
  }

  @override
  void dispose() {
    _bounce.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final badgeColor = SmarturSemanticColors.of(context).altAccent;
    final outlineIcon = widget.outlineIcon;
    final solidIcon = widget.solidIcon;
    final showBadge = widget.showBadge;
    final pageCtrl = widget.pageCtrl;
    final index = widget.index;
    final currentIndex = widget.currentIndex;

    return GestureDetector(
      onTap: widget.onTap,
      behavior: HitTestBehavior.opaque,
      child: AnimatedBuilder(
        animation: Listenable.merge([pageCtrl, _bounce]),
        builder: (context, _) {
          // Proximidad de la página a este slot → interpola color y peso.
          final page = (pageCtrl.hasClients && pageCtrl.position.haveDimensions)
              ? (pageCtrl.page ?? currentIndex.toDouble())
              : currentIndex.toDouble();
          final t = (1.0 - (page - index).abs()).clamp(0.0, 1.0);
          final selected = t > 0.5;
          final color = Color.lerp(
              scheme.onSurfaceVariant, scheme.primary, t)!;
          // Escala: pop por proximidad × rebote elástico al seleccionar.
          final scale =
              (1.0 + 0.18 * Curves.easeOut.transform(t)) * _bounceScale.value;

          return Stack(
            clipBehavior: Clip.none,
            alignment: Alignment.center,
            children: [
              Transform.translate(
                offset: Offset(0, -3 * t),
                child: Transform.scale(
                  scale: scale,
                  child: Icon(selected ? solidIcon : outlineIcon,
                      color: color, size: 25),
                ),
              ),
              if (showBadge)
                ValueListenableBuilder<int>(
                  valueListenable: routeStopCount,
                  builder: (_, count, __) {
                    if (count == 0) return const SizedBox.shrink();
                    return Positioned(
                      top: 2,
                      right: slotOffset(context),
                      child: Container(
                        padding: const EdgeInsets.all(3),
                        decoration: BoxDecoration(
                          color: badgeColor,
                          shape: BoxShape.circle,
                          border: Border.all(color: scheme.surface, width: 1.5),
                        ),
                        constraints:
                            const BoxConstraints(minWidth: 15, minHeight: 15),
                        child: Text(
                          '$count',
                          style: const TextStyle(
                            fontFamily: 'Outfit',
                            fontSize: 8,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    );
                  },
                ),
            ],
          );
        },
      ),
    );
  }

  double slotOffset(BuildContext context) => 12;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mantiene vivo el estado de cada pestaña dentro del PageView
// ─────────────────────────────────────────────────────────────────────────────

class _KeepAlivePage extends StatefulWidget {
  final Widget child;
  const _KeepAlivePage({required this.child});

  @override
  State<_KeepAlivePage> createState() => _KeepAlivePageState();
}

class _KeepAlivePageState extends State<_KeepAlivePage>
    with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return widget.child;
  }
}
