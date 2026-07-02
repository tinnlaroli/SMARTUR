import 'package:flutter/material.dart';

import '../../core/motion/smartur_motion.dart';

/// [IndexedStack] que conserva el estado de cada pestaña y hace crossfade al cambiar.
class SmarturTabFadeStack extends StatefulWidget {
  final int index;
  final List<Widget> children;
  final Duration duration;

  const SmarturTabFadeStack({
    super.key,
    required this.index,
    required this.children,
    this.duration = SmarturMotion.tabFade,
  });

  @override
  State<SmarturTabFadeStack> createState() => _SmarturTabFadeStackState();
}

class _SmarturTabFadeStackState extends State<SmarturTabFadeStack>
    with TickerProviderStateMixin {
  late List<AnimationController> _controllers;

  @override
  void initState() {
    super.initState();
    _initControllers(widget.index);
  }

  void _initControllers(int activeIndex) {
    _controllers = List.generate(widget.children.length, (i) {
      return AnimationController(
        vsync: this,
        duration: widget.duration,
        value: i == activeIndex ? 1.0 : 0.0,
      );
    });
  }

  @override
  void didUpdateWidget(SmarturTabFadeStack oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.children.length != widget.children.length) {
      for (final c in _controllers) {
        c.dispose();
      }
      _initControllers(widget.index);
      return;
    }
    if (oldWidget.index == widget.index) return;
    if (SmarturMotion.prefersReducedMotion(context)) {
      for (var i = 0; i < _controllers.length; i++) {
        _controllers[i].value = i == widget.index ? 1.0 : 0.0;
      }
      return;
    }
    for (var i = 0; i < _controllers.length; i++) {
      if (i == widget.index) {
        _controllers[i].forward();
      } else if (i == oldWidget.index) {
        _controllers[i].reverse();
      }
    }
  }

  @override
  void dispose() {
    for (final c in _controllers) {
      c.dispose();
    }
    super.dispose();
  }

  Widget _tabLayer(int i) {
    final anim = CurvedAnimation(
      parent: _controllers[i],
      curve: SmarturMotion.standard,
      reverseCurve: SmarturMotion.exit,
    );
    final content = IgnorePointer(
      // Solo la pestaña activa recibe toques (el fade es solo visual).
      ignoring: i != widget.index,
      child: RepaintBoundary(child: widget.children[i]),
    );
    // Micro-animación de entrada: fade + sube ligeramente + escala sutil.
    return AnimatedBuilder(
      animation: anim,
      builder: (context, child) {
        final t = anim.value;
        return Opacity(
          opacity: t.clamp(0.0, 1.0),
          child: Transform.translate(
            offset: Offset(0, (1 - t) * 14),
            child: Transform.scale(
              scale: 0.985 + 0.015 * t,
              alignment: Alignment.topCenter,
              child: child,
            ),
          ),
        );
      },
      child: content,
    );
  }

  @override
  Widget build(BuildContext context) {
    final active = widget.index;
    // La pestaña activa va al final del Stack para quedar encima al hacer fade.
    return Stack(
      fit: StackFit.expand,
      children: [
        for (var i = 0; i < widget.children.length; i++)
          if (i != active) _tabLayer(i),
        _tabLayer(active),
      ],
    );
  }
}
