import 'package:flutter/material.dart';

/// Duraciones y curvas compartidas para que el motion sea coherente en SMARTUR.
class SmarturMotion {
  SmarturMotion._();

  static const Duration fast = Duration(milliseconds: 200);
  static const Duration normal = Duration(milliseconds: 350);
  static const Duration slow = Duration(milliseconds: 500);
  static const Duration splashFade = Duration(milliseconds: 450);
  static const Duration loaderMini = Duration(milliseconds: 400);
  static const Duration routeIn = Duration(milliseconds: 320);
  static const Duration routeOut = Duration(milliseconds: 240);
  static const Duration routeDetailIn = Duration(milliseconds: 360);
  static const Duration routeDetailOut = Duration(milliseconds: 280);

  static const Curve standard = Curves.easeOutCubic;
  static const Curve enter = Curves.easeOut;
  static const Curve exit = Curves.easeIn;

  static bool prefersReducedMotion(BuildContext context) {
    return MediaQuery.disableAnimationsOf(context);
  }

  /// Devuelve [zero] si el usuario tiene animaciones reducidas activas.
  static Duration duration(BuildContext context, Duration normal) {
    return prefersReducedMotion(context) ? Duration.zero : normal;
  }
}
