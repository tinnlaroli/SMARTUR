import 'package:flutter/material.dart';

import '../../core/motion/welltur_motion.dart';
import 'welltur_loader.dart';

/// Overlay de carga con fade — no bloquea el layout hasta que [visible] es true.
class WellturLoadingOverlay extends StatelessWidget {
  final bool visible;
  final Color? backgroundColor;

  const WellturLoadingOverlay({
    super.key,
    required this.visible,
    this.backgroundColor,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final bg = backgroundColor ?? scheme.surface;

    if (!visible) return const SizedBox.shrink();

    return IgnorePointer(
      child: AnimatedOpacity(
        opacity: 1.0,
        duration: WellturMotion.fast,
        curve: WellturMotion.standard,
        child: ColoredBox(
          color: bg.withValues(alpha: 0.9),
          child: const Center(
            child: WellTURLoader(isMini: true, continuous: true),
          ),
        ),
      ),
    );
  }
}
