import 'dart:ui' show ImageFilter;

import 'package:flutter/material.dart';

import '../../core/theme/style_guide.dart';

/// Capa de vidrio esmerilado reutilizable para el fondo de las cabeceras:
/// difumina el contenido que pasa por detrás para que el título se lea.
Widget smarturHeaderGlass(BuildContext context) {
  final scheme = Theme.of(context).colorScheme;
  final isDark = scheme.brightness == Brightness.dark;
  return ClipRect(
    child: BackdropFilter(
      filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
      child: Container(
        color: scheme.surface.withValues(alpha: isDark ? 0.5 : 0.62),
      ),
    ),
  );
}

/// Título de pantalla con la barrita de acento de marca a la izquierda.
///
/// Estilo unificado "compacto con acento": una barra vertical redondeada en
/// [ColorScheme.primary] (se adapta al tema Welltur) seguida del título en
/// Cal Sans. Reutilizado por [SmarturSliverAppBar] y [SmarturAppBar].
class SmarturAccentTitle extends StatelessWidget {
  final String title;
  final double fontSize;

  const SmarturAccentTitle(this.title, {super.key, this.fontSize = 20});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 4,
          height: fontSize + 2,
          decoration: BoxDecoration(
            color: scheme.primary,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(width: 10),
        Flexible(
          child: Text(
            title,
            style: SmarturStyle.calSansTitle.copyWith(fontSize: fontSize),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}

/// Cabecera de pantalla reutilizable que **se oculta al hacer scroll hacia
/// abajo y reaparece al subir** (`floating` + `snap`).
///
/// Uso: primer sliver de un `CustomScrollView`.
/// ```dart
/// CustomScrollView(slivers: [
///   SmarturSliverAppBar(title: 'Mis Rutas'),
///   SliverList(...),
/// ])
/// ```
class SmarturSliverAppBar extends StatelessWidget {
  final String title;
  final List<Widget>? actions;

  /// Barra de pestañas opcional (usar `smarturTabBar(...)`).
  final PreferredSizeWidget? bottom;

  /// Muestra el botón atrás. Si es `null`, se decide automáticamente según
  /// si la ruta actual se puede cerrar (`ModalRoute.canPop`).
  final bool? showBack;
  final VoidCallback? onBack;

  const SmarturSliverAppBar({
    super.key,
    required this.title,
    this.actions,
    this.bottom,
    this.showBack,
    this.onBack,
  });

  @override
  Widget build(BuildContext context) {
    final canPop = showBack ?? (ModalRoute.of(context)?.canPop ?? false);

    return SliverAppBar(
      floating: true,
      snap: true,
      pinned: false,
      automaticallyImplyLeading: false,
      backgroundColor: Colors.transparent,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      scrolledUnderElevation: 0,
      flexibleSpace: smarturHeaderGlass(context),
      centerTitle: false,
      titleSpacing: canPop ? 0 : 16,
      leading: canPop
          ? IconButton(
              icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
              onPressed: onBack ?? () => Navigator.of(context).maybePop(),
            )
          : null,
      title: SmarturAccentTitle(title),
      actions: actions,
      bottom: bottom,
    );
  }
}

/// Variante **fija** (no se oculta al hacer scroll) para pantallas donde un
/// sliver no encaja — p. ej. una lista invertida con input fijo abajo
/// (`chat_screen`). Mismo lenguaje visual que [SmarturSliverAppBar].
class SmarturAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;

  /// Si se provee, sustituye al título de texto (p. ej. avatar + nombre).
  final Widget? titleWidget;
  final List<Widget>? actions;
  final PreferredSizeWidget? bottom;
  final bool? showBack;
  final VoidCallback? onBack;

  const SmarturAppBar({
    super.key,
    this.title = '',
    this.titleWidget,
    this.actions,
    this.bottom,
    this.showBack,
    this.onBack,
  });

  @override
  Size get preferredSize =>
      Size.fromHeight(kToolbarHeight + (bottom?.preferredSize.height ?? 0));

  @override
  Widget build(BuildContext context) {
    final canPop = showBack ?? (ModalRoute.of(context)?.canPop ?? false);

    return AppBar(
      automaticallyImplyLeading: false,
      backgroundColor: Colors.transparent,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      scrolledUnderElevation: 0,
      flexibleSpace: smarturHeaderGlass(context),
      centerTitle: false,
      titleSpacing: canPop ? 0 : 16,
      leading: canPop
          ? IconButton(
              icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
              onPressed: onBack ?? () => Navigator.of(context).maybePop(),
            )
          : null,
      title: titleWidget ?? SmarturAccentTitle(title),
      actions: actions,
      bottom: bottom,
    );
  }
}
