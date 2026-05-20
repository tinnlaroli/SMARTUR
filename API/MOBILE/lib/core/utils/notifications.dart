import 'package:flutter/material.dart';
import 'package:toastification/toastification.dart';

class SmarturNotifications {
  static final Map<String, DateTime> _lastShown = {};

  static bool _canShow(String message) {
    final now = DateTime.now();
    final last = _lastShown[message];
    if (last == null || now.difference(last).inSeconds >= 3) {
      _lastShown[message] = now;
      return true;
    }
    return false;
  }

  static void showSuccess(BuildContext context, String message) {
    if (!_canShow(message)) return;
    toastification.show(
      context: context,
      type: ToastificationType.success,
      style: ToastificationStyle.flat, 
      title: Text(message, style: const TextStyle(fontWeight: FontWeight.bold, fontFamily: 'Outfit')),
      alignment: Alignment.topCenter,
      autoCloseDuration: const Duration(seconds: 3),
      showProgressBar: false,
      applyBlurEffect: true,
    );
  }

  static void showInfo(BuildContext context, String message) {
    if (!_canShow(message)) return;
    toastification.show(
      context: context,
      type: ToastificationType.info,
      style: ToastificationStyle.flat,
      title: Text(message, style: const TextStyle(fontWeight: FontWeight.bold, fontFamily: 'Outfit')),
      alignment: Alignment.topCenter,
      autoCloseDuration: const Duration(seconds: 3),
      showProgressBar: false,
      applyBlurEffect: true,
    );
  }

  static void showWarning(BuildContext context, String message) {
    if (!_canShow(message)) return;
    toastification.show(
      context: context,
      type: ToastificationType.warning,
      style: ToastificationStyle.flat,
      title: Text(message, style: const TextStyle(fontWeight: FontWeight.bold, fontFamily: 'Outfit')),
      alignment: Alignment.topCenter,
      autoCloseDuration: const Duration(seconds: 3),
      showProgressBar: false,
      applyBlurEffect: true,
    );
  }

  static void showError(BuildContext context, String message) {
    if (!_canShow(message)) return;
    toastification.show(
      context: context,
      type: ToastificationType.error,
      style: ToastificationStyle.flat,
      title: const Text('Error en SMARTUR', style: TextStyle(fontWeight: FontWeight.bold)),
      description: Text(message),
      alignment: Alignment.topCenter,
      autoCloseDuration: const Duration(seconds: 4),
      showProgressBar: false,
    );
  }
}