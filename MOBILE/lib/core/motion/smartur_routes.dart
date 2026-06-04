import 'package:flutter/material.dart';

import 'smartur_motion.dart';

enum SmarturRouteKind { fade, detail }

/// Transición por defecto en [MaterialApp.pageTransitionsTheme] (Android + iOS).
class SmarturPageTransitionsBuilder extends PageTransitionsBuilder {
  const SmarturPageTransitionsBuilder();

  @override
  Widget buildTransitions<T>(
    PageRoute<T> route,
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child,
  ) {
    return SmarturRouteTransitions.build(
      animation: animation,
      secondaryAnimation: secondaryAnimation,
      child: child,
      kind: SmarturRouteKind.fade,
    );
  }
}

/// Animaciones compartidas para rutas push/pop.
class SmarturRouteTransitions {
  SmarturRouteTransitions._();

  static Widget build({
    required Animation<double> animation,
    required Animation<double> secondaryAnimation,
    required Widget child,
    SmarturRouteKind kind = SmarturRouteKind.fade,
  }) {
    final curved = CurvedAnimation(
      parent: animation,
      curve: SmarturMotion.standard,
      reverseCurve: SmarturMotion.standard,
    );

    final slideBegin = kind == SmarturRouteKind.detail
        ? const Offset(0.06, 0)
        : const Offset(0.04, 0);

    final slide = Tween<Offset>(begin: slideBegin, end: Offset.zero).animate(curved);
    final fade = Tween<double>(begin: 0.92, end: 1.0).animate(curved);

    Widget page = SlideTransition(
      position: slide,
      child: FadeTransition(opacity: fade, child: child),
    );

    if (secondaryAnimation.status != AnimationStatus.dismissed) {
      final parallax = Tween<Offset>(
        begin: Offset.zero,
        end: Offset(kind == SmarturRouteKind.detail ? -0.03 : -0.015, 0),
      ).animate(
        CurvedAnimation(
          parent: secondaryAnimation,
          curve: SmarturMotion.exit,
          reverseCurve: SmarturMotion.standard,
        ),
      );
      page = SlideTransition(position: parallax, child: page);
    }

    return page;
  }
}

Route<T> _smarturRoute<T>(
  Widget page, {
  required SmarturRouteKind kind,
  RouteSettings? settings,
}) {
  final inDuration = kind == SmarturRouteKind.detail
      ? SmarturMotion.routeDetailIn
      : SmarturMotion.routeIn;
  final outDuration = kind == SmarturRouteKind.detail
      ? SmarturMotion.routeDetailOut
      : SmarturMotion.routeOut;

  return PageRouteBuilder<T>(
    settings: settings,
    pageBuilder: (_, __, ___) => page,
    transitionDuration: inDuration,
    reverseTransitionDuration: outDuration,
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      if (SmarturMotion.prefersReducedMotion(context)) {
        return FadeTransition(
          opacity: animation,
          child: child,
        );
      }
      return SmarturRouteTransitions.build(
        animation: animation,
        secondaryAnimation: secondaryAnimation,
        child: child,
        kind: kind,
      );
    },
  );
}

/// Pantallas secundarias (ajustes, preferencias, formularios).
Route<T> smarturFadeRoute<T>(Widget page, {RouteSettings? settings}) {
  return _smarturRoute<T>(page, kind: SmarturRouteKind.fade, settings: settings);
}

/// Drill-down: detalle de lugar, mapas, resultados.
Route<T> smarturDetailRoute<T>(Widget page, {RouteSettings? settings}) {
  return _smarturRoute<T>(page, kind: SmarturRouteKind.detail, settings: settings);
}

extension SmarturNavigator on BuildContext {
  Future<T?> pushSmartur<T>(Widget page, {bool detail = false}) {
    return Navigator.push<T>(
      this,
      detail ? smarturDetailRoute(page) : smarturFadeRoute(page),
    );
  }

  void pushSmarturReplacement<T extends Object?, TO extends Object?>(
    Widget page, {
    bool detail = false,
    TO? result,
  }) {
    Navigator.pushReplacement<T, TO>(
      this,
      detail ? smarturDetailRoute(page) : smarturFadeRoute(page),
      result: result,
    );
  }

  void pushSmarturAndRemoveUntil<T extends Object?>(
    Widget page,
    RoutePredicate predicate, {
    bool detail = false,
  }) {
    Navigator.pushAndRemoveUntil<T>(
      this,
      detail ? smarturDetailRoute(page) : smarturFadeRoute(page),
      predicate,
    );
  }
}
