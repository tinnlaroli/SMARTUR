import 'package:flutter/material.dart';

import 'welltur_motion.dart';

enum WellturRouteKind { fade, detail }

/// Transición por defecto en [MaterialApp.pageTransitionsTheme] (Android + iOS).
class WellturPageTransitionsBuilder extends PageTransitionsBuilder {
  const WellturPageTransitionsBuilder();

  @override
  Widget buildTransitions<T>(
    PageRoute<T> route,
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child,
  ) {
    return WellturRouteTransitions.build(
      animation: animation,
      secondaryAnimation: secondaryAnimation,
      child: child,
      kind: WellturRouteKind.fade,
    );
  }
}

/// Animaciones compartidas para rutas push/pop.
class WellturRouteTransitions {
  WellturRouteTransitions._();

  static Widget build({
    required Animation<double> animation,
    required Animation<double> secondaryAnimation,
    required Widget child,
    WellturRouteKind kind = WellturRouteKind.fade,
  }) {
    final curved = CurvedAnimation(
      parent: animation,
      curve: WellturMotion.standard,
      reverseCurve: WellturMotion.standard,
    );

    final slideBegin = kind == WellturRouteKind.detail
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
        end: Offset(kind == WellturRouteKind.detail ? -0.03 : -0.015, 0),
      ).animate(
        CurvedAnimation(
          parent: secondaryAnimation,
          curve: WellturMotion.exit,
          reverseCurve: WellturMotion.standard,
        ),
      );
      page = SlideTransition(position: parallax, child: page);
    }

    return page;
  }
}

Route<T> _wellturRoute<T>(
  Widget page, {
  required WellturRouteKind kind,
  RouteSettings? settings,
}) {
  final inDuration = kind == WellturRouteKind.detail
      ? WellturMotion.routeDetailIn
      : WellturMotion.routeIn;
  final outDuration = kind == WellturRouteKind.detail
      ? WellturMotion.routeDetailOut
      : WellturMotion.routeOut;

  return PageRouteBuilder<T>(
    settings: settings,
    pageBuilder: (_, __, ___) => page,
    transitionDuration: inDuration,
    reverseTransitionDuration: outDuration,
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      if (WellturMotion.prefersReducedMotion(context)) {
        return FadeTransition(
          opacity: animation,
          child: child,
        );
      }
      return WellturRouteTransitions.build(
        animation: animation,
        secondaryAnimation: secondaryAnimation,
        child: child,
        kind: kind,
      );
    },
  );
}

/// Pantallas secundarias (ajustes, preferencias, formularios).
Route<T> wellturFadeRoute<T>(Widget page, {RouteSettings? settings}) {
  return _wellturRoute<T>(page, kind: WellturRouteKind.fade, settings: settings);
}

/// Drill-down: detalle de lugar, mapas, resultados.
Route<T> wellturDetailRoute<T>(Widget page, {RouteSettings? settings}) {
  return _wellturRoute<T>(page, kind: WellturRouteKind.detail, settings: settings);
}

extension WellturNavigator on BuildContext {
  Future<T?> pushWelltur<T>(Widget page, {bool detail = false}) {
    return Navigator.push<T>(
      this,
      detail ? wellturDetailRoute(page) : wellturFadeRoute(page),
    );
  }

  void pushWellturReplacement<T extends Object?, TO extends Object?>(
    Widget page, {
    bool detail = false,
    TO? result,
  }) {
    Navigator.pushReplacement<T, TO>(
      this,
      detail ? wellturDetailRoute(page) : wellturFadeRoute(page),
      result: result,
    );
  }

  void pushWellturAndRemoveUntil<T extends Object?>(
    Widget page,
    RoutePredicate predicate, {
    bool detail = false,
  }) {
    Navigator.pushAndRemoveUntil<T>(
      this,
      detail ? wellturDetailRoute(page) : wellturFadeRoute(page),
      predicate,
    );
  }
}
