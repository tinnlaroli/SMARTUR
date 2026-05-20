import 'package:flutter/material.dart';

import 'app_settings.dart';

class AppSettingsScope extends InheritedNotifier<AppSettingsNotifier> {
  const AppSettingsScope({
    super.key,
    required AppSettingsNotifier notifier,
    required super.child,
  }) : super(notifier: notifier);

  static AppSettingsNotifier of(BuildContext context) {
    final scope =
        context.dependOnInheritedWidgetOfExactType<AppSettingsScope>();
    assert(scope != null, 'No AppSettingsScope found in context');
    return scope!.notifier!;
  }
}

