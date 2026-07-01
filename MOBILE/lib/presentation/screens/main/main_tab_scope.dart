import 'package:flutter/material.dart';

/// Índices del [IndexedStack] en [MainScreen].
abstract final class MainTabIndex {
  static const int home     = 0;
  static const int explore  = 1;
  static const int routes   = 2;
  static const int messages = 3;
  static const int profile  = 4;
}

/// Permite a hijos de [MainScreen] cambiar la pestaña del menú inferior.
class MainTabScope extends InheritedWidget {
  final ValueChanged<int> selectTab;

  const MainTabScope({
    super.key,
    required this.selectTab,
    required super.child,
  });

  static MainTabScope? maybeOf(BuildContext context) {
    return context.dependOnInheritedWidgetOfExactType<MainTabScope>();
  }

  static void goTo(BuildContext context, int index) {
    maybeOf(context)?.selectTab(index);
  }

  @override
  bool updateShouldNotify(MainTabScope oldWidget) =>
      selectTab != oldWidget.selectTab;
}
