import 'dart:ui';
import 'package:flutter/material.dart';
import '../../core/theme/style_guide.dart';

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

    _colorAnimation = TweenSequence<Color?>(
      [
        _seq(SmarturStyle.purple, SmarturStyle.green),
        _seq(SmarturStyle.green, SmarturStyle.orange),
        _seq(SmarturStyle.orange, SmarturStyle.blue),
        _seq(SmarturStyle.blue, SmarturStyle.pink),
        _seq(SmarturStyle.pink, SmarturStyle.purple),
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
            // Full surface base (claro u oscuro según tema) — evita franja negra bajo status bar
            Positioned.fill(child: ColoredBox(color: surface)),
            // Animated color band at the top
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
                      (_colorAnimation.value ?? SmarturStyle.purple)
                          .withValues(alpha: 0.38),
                      surface,
                    ],
                  ),
                ),
              ),
            ),
            // Soft blur on band — ClipRect evita artefactos negros en el borde superior
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              height: bandH,
              child: ClipRect(
                child: BackdropFilter(
                  filter: ImageFilter.blur(
                    sigmaX: widget.blurSigma,
                    sigmaY: widget.blurSigma,
                  ),
                  child: ColoredBox(
                    color: surface.withValues(alpha: widget.opacity),
                  ),
                ),
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
/// of colors (Green, Purple, Orange, Blue, Pink) with a frosted glass effect.
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

class _SmarturBackgroundState extends State<SmarturBackground> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<Color?> _colorAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 25), // Ultra-slow for a subtle effect
    )..repeat();

    // Define the color palette for cycling
    _colorAnimation = TweenSequence<Color?>(
      [
        _buildSequenceItem(SmarturStyle.green, SmarturStyle.purple), // Green to Purple
        _buildSequenceItem(SmarturStyle.purple, SmarturStyle.orange), // Purple to Orange
        _buildSequenceItem(SmarturStyle.orange, SmarturStyle.blue),   // Orange to Blue
        _buildSequenceItem(SmarturStyle.blue, SmarturStyle.pink),        // Blue to Pink
        _buildSequenceItem(SmarturStyle.pink, SmarturStyle.green),  // Pink to Green
      ],
    ).animate(_controller);
  }

  TweenSequenceItem<Color?> _buildSequenceItem(Color begin, Color end) {
    return TweenSequenceItem(
      tween: ColorTween(begin: begin, end: end),
      weight: 1.0,
    );
  }

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
        final accent = _colorAnimation.value ?? SmarturStyle.pink;
        return Stack(
          children: [
            // Base del tema (blanco / gris oscuro) — nunca negro “del sistema”
            Positioned.fill(child: ColoredBox(color: surface)),
            // Degradado desde el color de superficie hacia la paleta animada
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
              child: ClipRect(
                child: BackdropFilter(
                  filter: ImageFilter.blur(
                    sigmaX: widget.blurSigma,
                    sigmaY: widget.blurSigma,
                  ),
                  child: Container(
                    color: surface.withValues(alpha: widget.opacity),
                  ),
                ),
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
