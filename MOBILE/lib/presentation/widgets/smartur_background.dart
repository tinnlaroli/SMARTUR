import 'dart:ui';
import 'package:flutter/material.dart';
import '../../core/theme/smartur_theme_extensions.dart';

/// Inverted variant: animated color band at the TOP (~15 % of screen height),
/// fading into [scheme.surface]. Ideal for Home / inner screens.
class SmarturBackgroundTop extends StatefulWidget {
  final Widget child;
  final double blurSigma;
  final double opacity;
  /// Fraction of screen height covered by the color band (0-1). Default 0.15.
  final double bandFraction;

  const SmarturBackgroundTop({
    super.key,
    required this.child,
    this.blurSigma = 14.0,
    this.opacity = 0.25,
    this.bandFraction = 0.35,
  });

  @override
  State<SmarturBackgroundTop> createState() => _SmarturBackgroundTopState();
}

class _SmarturBackgroundTopState extends State<SmarturBackgroundTop>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<Color?> _colorAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 25),
    )..repeat();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final sem = SmarturSemanticColors.of(context);
    _colorAnimation = TweenSequence<Color?>(
      [
        _seq(sem.accent, sem.leaf),
        _seq(sem.leaf, sem.ember),
        _seq(sem.ember, sem.sea),
        _seq(sem.sea, sem.altAccent),
        _seq(sem.altAccent, sem.accent),
      ],
    ).animate(_controller);
  }

  TweenSequenceItem<Color?> _seq(Color a, Color b) =>
      TweenSequenceItem(tween: ColorTween(begin: a, end: b), weight: 1);

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final surface = Theme.of(context).colorScheme.surface;

    return AnimatedBuilder(
      animation: _colorAnimation,
      builder: (context, _) {
        final bandH =
            MediaQuery.of(context).size.height * widget.bandFraction;

        return Stack(
          children: [
            Positioned.fill(child: ColoredBox(color: surface)),
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              height: bandH,
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      (_colorAnimation.value ?? surface)
                          .withValues(alpha: 0.38),
                      surface,
                    ],
                  ),
                ),
              ),
            ),
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              height: bandH,
              child: ColoredBox(
                color: surface.withValues(alpha: widget.opacity * 0.5),
              ),
            ),
            Positioned.fill(child: widget.child),
          ],
        );
      },
    );
  }
}

/// A professional background component that subtly cycles through a palette
/// of brand colors with a frosted glass effect. Colors come from the active theme.
class SmarturBackground extends StatefulWidget {
  final Widget child;
  final double blurSigma;
  final double opacity;

  const SmarturBackground({
    super.key,
    required this.child,
    this.blurSigma = 12.0,
    this.opacity = 0.55,
  });

  @override
  State<SmarturBackground> createState() => _SmarturBackgroundState();
}

class _SmarturBackgroundState extends State<SmarturBackground>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<Color?> _colorAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 25),
    )..repeat();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final sem = SmarturSemanticColors.of(context);
    _colorAnimation = TweenSequence<Color?>(
      [
        _seq(sem.leaf, sem.accent),
        _seq(sem.accent, sem.ember),
        _seq(sem.ember, sem.sea),
        _seq(sem.sea, sem.altAccent),
        _seq(sem.altAccent, sem.leaf),
      ],
    ).animate(_controller);
  }

  TweenSequenceItem<Color?> _seq(Color a, Color b) =>
      TweenSequenceItem(tween: ColorTween(begin: a, end: b), weight: 1.0);

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final surface = Theme.of(context).colorScheme.surface;
    return AnimatedBuilder(
      animation: _colorAnimation,
      builder: (context, child) {
        final accent = _colorAnimation.value ?? surface;
        return Stack(
          children: [
            Positioned.fill(child: ColoredBox(color: surface)),
            Positioned.fill(
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      surface,
                      Color.lerp(surface, accent, 0.72) ?? accent,
                    ],
                    stops: const [0.12, 1.0],
                  ),
                ),
              ),
            ),
            Positioned.fill(
              child: ColoredBox(
                color: surface.withValues(alpha: widget.opacity * 0.45),
              ),
            ),
            Positioned.fill(child: widget.child),
          ],
        );
      },
      child: widget.child,
    );
  }
}
