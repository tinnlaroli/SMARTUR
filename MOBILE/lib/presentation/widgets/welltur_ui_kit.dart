import 'package:flutter/material.dart';

import '../../core/motion/welltur_motion.dart';
import '../../core/theme/style_guide.dart';
import '../../core/theme/welltur_theme_extensions.dart';

export '../../core/motion/welltur_routes.dart'
    show
        WellturNavigator,
        wellturDetailRoute,
        wellturFadeRoute;

export 'welltur_loading_overlay.dart';
export 'welltur_tab_fade_stack.dart';

/// Entrada escalonada para listas y secciones.
class WellturFadeIn extends StatefulWidget {
  final Widget child;
  final int index;
  final Duration baseDelay;

  const WellturFadeIn({
    super.key,
    required this.child,
    this.index = 0,
    this.baseDelay = const Duration(milliseconds: 40),
  });

  @override
  State<WellturFadeIn> createState() => _WellturFadeInState();
}

class _WellturFadeInState extends State<WellturFadeIn>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: WellturMotion.fast,
    );
    _anim = CurvedAnimation(parent: _ctrl, curve: WellturMotion.standard);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      if (WellturMotion.prefersReducedMotion(context)) {
        _ctrl.value = 1;
        return;
      }
      Future.delayed(widget.baseDelay * widget.index, () {
        if (mounted) _ctrl.forward();
      });
    });
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _anim,
      child: SlideTransition(
        position: Tween<Offset>(begin: const Offset(0, 0.03), end: Offset.zero)
            .animate(_anim),
        child: widget.child,
      ),
    );
  }
}

/// Crossfade suave entre esqueleto/cargador y contenido listo.
class WellturLoadTransition extends StatelessWidget {
  final bool loading;
  final Widget loadingChild;
  final Widget child;

  const WellturLoadTransition({
    super.key,
    required this.loading,
    required this.loadingChild,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedSwitcher(
      duration: WellturMotion.normal,
      switchInCurve: WellturMotion.enter,
      switchOutCurve: WellturMotion.exit,
      layoutBuilder: (current, previous) => Stack(
        fit: StackFit.expand,
        alignment: Alignment.topCenter,
        children: [
          for (final p in previous) IgnorePointer(child: p),
          ?current,
        ],
      ),
      transitionBuilder: (child, animation) {
        final curved = CurvedAnimation(
          parent: animation,
          curve: WellturMotion.standard,
          reverseCurve: WellturMotion.exit,
        );
        return FadeTransition(
          opacity: curved,
          child: SlideTransition(
            position: Tween<Offset>(
              begin: const Offset(0, 0.02),
              end: Offset.zero,
            ).animate(curved),
            child: child,
          ),
        );
      },
      child: loading
          ? KeyedSubtree(key: const ValueKey('welltur_load'), child: loadingChild)
          : KeyedSubtree(key: const ValueKey('welltur_content'), child: child),
    );
  }
}

/// Panel con borde suave — tarjetas, formularios, bloques de ajustes.
class WellturPanel extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final EdgeInsetsGeometry margin;

  const WellturPanel({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.margin = const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      margin: margin,
      padding: padding,
      decoration: BoxDecoration(
        color: scheme.surfaceContainerHighest.withValues(alpha: 0.45),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: scheme.outline.withValues(alpha: 0.1)),
        boxShadow: [
          BoxShadow(
            color: scheme.shadow.withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: child,
    );
  }
}

/// Encabezado de sección (Ajustes, listas agrupadas).
class WellturSectionHeader extends StatelessWidget {
  final String title;

  const WellturSectionHeader(this.title, {super.key});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 14, 20, 6),
      child: Text(
        title.toUpperCase(),
        style: TextStyle(
          fontFamily: 'Outfit',
          fontWeight: FontWeight.w700,
          fontSize: 11,
          letterSpacing: 0.8,
          color: scheme.onSurfaceVariant.withValues(alpha: 0.85),
        ),
      ),
    );
  }
}

/// Estado vacío / error amigable.
class WellturEmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final Widget? action;
  final Color? iconColor;

  const WellturEmptyState({
    super.key,
    required this.icon,
    required this.title,
    this.subtitle,
    this.action,
    this.iconColor,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final tint = iconColor ?? WellturSemanticColors.of(context).accent;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 40),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: tint.withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, size: 36, color: tint),
          ),
          const SizedBox(height: 16),
          Text(
            title,
            textAlign: TextAlign.center,
            style: SmarturStyle.calSansTitle.copyWith(fontSize: 18),
          ),
          if (subtitle != null) ...[
            const SizedBox(height: 8),
            Text(
              subtitle!,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontFamily: 'Outfit',
                fontSize: 13,
                height: 1.45,
                color: scheme.onSurfaceVariant,
              ),
            ),
          ],
          if (action != null) ...[
            const SizedBox(height: 20),
            action!,
          ],
        ],
      ),
    );
  }
}

/// TabBar con indicador redondeado (Diario, etc.).
TabBar wellturTabBar(
  BuildContext context, {
  required List<Widget> tabs,
  TabController? controller,
}) {
  final scheme = Theme.of(context).colorScheme;
  return TabBar(
    controller: controller,
    indicatorSize: TabBarIndicatorSize.tab,
    dividerColor: Colors.transparent,
    indicator: BoxDecoration(
      borderRadius: const BorderRadius.only(
        topLeft: Radius.circular(12),
        topRight: Radius.circular(12),
      ),
      color: scheme.primary.withValues(alpha: 0.14),
    ),
    labelColor: scheme.primary,
    unselectedLabelColor: scheme.onSurfaceVariant,
    labelStyle: const TextStyle(
      fontFamily: 'Outfit',
      fontWeight: FontWeight.w700,
      fontSize: 13,
    ),
    unselectedLabelStyle: const TextStyle(
      fontFamily: 'Outfit',
      fontWeight: FontWeight.w500,
      fontSize: 13,
    ),
    tabs: tabs,
  );
}
