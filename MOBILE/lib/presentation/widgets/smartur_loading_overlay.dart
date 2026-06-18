import 'package:flutter/material.dart';

import '../../core/motion/smartur_motion.dart';
import 'smartur_loader.dart';

/// Overlay de carga con fade — no bloquea el layout hasta que [visible] es true.
class SmarturLoadingOverlay extends StatelessWidget {
  final bool visible;
  final Color? backgroundColor;

  const SmarturLoadingOverlay({
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
        duration: SmarturMotion.fast,
        curve: SmarturMotion.standard,
        child: ColoredBox(
          color: bg.withValues(alpha: 0.9),
          child: const Center(
            child: SmartURLoader(isMini: true, continuous: true),
          ),
        ),
      ),
    );
  }
}
