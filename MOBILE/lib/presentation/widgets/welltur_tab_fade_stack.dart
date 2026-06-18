import 'package:flutter/material.dart';

import '../../core/motion/welltur_motion.dart';

/// [IndexedStack] que conserva el estado de cada pestaña y hace crossfade al cambiar.
class WellturTabFadeStack extends StatefulWidget {
  final int index;
  final List<Widget> children;
  final Duration duration;

  const WellturTabFadeStack({
    super.key,
    required this.index,
    required this.children,
    this.duration = WellturMotion.tabFade,
  });

  @override
  State<WellturTabFadeStack> createState() => _WellturTabFadeStackState();
}

class _WellturTabFadeStackState extends State<WellturTabFadeStack>
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
  void didUpdateWidget(WellturTabFadeStack oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.children.length != widget.children.length) {
      for (final c in _controllers) {
        c.dispose();
      }
      _initControllers(widget.index);
      return;
    }
    if (oldWidget.index == widget.index) return;
    if (WellturMotion.prefersReducedMotion(context)) {
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
    return FadeTransition(
      opacity: CurvedAnimation(
        parent: _controllers[i],
        curve: WellturMotion.standard,
        reverseCurve: WellturMotion.exit,
      ),
      child: IgnorePointer(
        // Solo la pestaña activa recibe toques (el fade es solo visual).
        ignoring: i != widget.index,
        child: RepaintBoundary(child: widget.children[i]),
      ),
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
