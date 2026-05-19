import 'package:flutter/material.dart';

/// A professional shimmer effect component for skeleton loading.
class SmarturShimmer extends StatefulWidget {
  final Widget child;
  final bool enabled;

  const SmarturShimmer({
    super.key,
    required this.child,
    this.enabled = true,
  });

  @override
  State<SmarturShimmer> createState() => _SmarturShimmerState();
}

class _SmarturShimmerState extends State<SmarturShimmer>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.enabled) return widget.child;

    final isDark = Theme.of(context).brightness == Brightness.dark;
    final shimmerColors = isDark
        ? const [
            Color(0xFF303030),
            Color(0xFF424242),
            Color(0xFF303030),
          ]
        : const [
            Color(0xFFEBEBF4),
            Color(0xFFF4F4F4),
            Color(0xFFEBEBF4),
          ];

    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return ShaderMask(
          blendMode: BlendMode.srcIn,
          shaderCallback: (bounds) {
            return LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: shimmerColors,
              stops: const [0.1, 0.5, 0.9],
              transform: _SlidingGradientTransform(offset: _controller.value),
            ).createShader(bounds);
          },
          child: child,
        );
      },
      child: widget.child,
    );
  }
}

class _SlidingGradientTransform extends GradientTransform {
  final double offset;

  const _SlidingGradientTransform({required this.offset});

  @override
  Matrix4? transform(Rect bounds, {TextDirection? textDirection}) {
    return Matrix4.translationValues(bounds.width * (offset - 0.5) * 3, 0.0, 0.0);
  }
}

/// Specialized skeleton variants
class SkeletonContainer extends StatelessWidget {
  final double? width;
  final double? height;
  final double borderRadius;

  const SkeletonContainer({
    super.key,
    this.width,
    this.height,
    this.borderRadius = 8,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
        borderRadius: BorderRadius.circular(borderRadius),
      ),
    );
  }
}

class SkeletonCircle extends StatelessWidget {
  final double size;

  const SkeletonCircle({super.key, this.size = 40});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
        shape: BoxShape.circle,
      ),
    );
  }
}

class SkeletonText extends StatelessWidget {
  final double width;
  final double height;

  const SkeletonText({super.key, this.width = double.infinity, this.height = 12});

  @override
  Widget build(BuildContext context) {
    return SkeletonContainer(
      width: width,
      height: height,
      borderRadius: 4,
    );
  }
}

/// Chip horizontal (home ciudades antes de cargar datos).
class SkeletonChipPill extends StatelessWidget {
  final double width;

  const SkeletonChipPill({super.key, this.width = 96});

  @override
  Widget build(BuildContext context) {
    return SkeletonContainer(
      width: width,
      height: 34,
      borderRadius: 999,
    );
  }
}

/// Botón tipo “filtro de categorías” (home, esquina derecha).
class SkeletonFilterButton extends StatelessWidget {
  const SkeletonFilterButton({super.key});

  @override
  Widget build(BuildContext context) {
    return SkeletonContainer(
      width: 118,
      height: 36,
      borderRadius: 12,
    );
  }
}

/// Tarjeta tipo lugar en grid 2 columnas (home).
class SkeletonPlaceTile extends StatelessWidget {
  const SkeletonPlaceTile({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Expanded(
          child: SkeletonContainer(
            height: double.infinity,
            borderRadius: 20,
          ),
        ),
        const SizedBox(height: 10),
        const SkeletonText(width: double.infinity, height: 14),
        const SizedBox(height: 6),
        const SkeletonText(width: 72, height: 10),
      ],
    );
  }
}

/// Celda que rellena el tile en grid tipo bento / quilted (sin filas extra).
class SkeletonBentoTile extends StatelessWidget {
  const SkeletonBentoTile({super.key});

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        return SkeletonContainer(
          width: constraints.maxWidth,
          height: constraints.maxHeight,
          borderRadius: 20,
        );
      },
    );
  }
}

/// Tarjeta tipo fila (diario / listas).
class SkeletonListRow extends StatelessWidget {
  const SkeletonListRow({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: Row(
        children: [
          const SkeletonCircle(size: 48),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SkeletonText(width: MediaQuery.sizeOf(context).width * 0.5, height: 14),
                const SizedBox(height: 8),
                const SkeletonText(width: double.infinity, height: 10),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Post comunidad (avatar + bloques).
class SkeletonCommunityPostCard extends StatelessWidget {
  const SkeletonCommunityPostCard({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Card(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const SkeletonCircle(size: 44),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        SkeletonText(width: MediaQuery.sizeOf(context).width * 0.35, height: 14),
                        const SizedBox(height: 6),
                        const SkeletonText(width: 120, height: 10),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              const SkeletonContainer(height: 160, borderRadius: 16),
              const SizedBox(height: 12),
              const SkeletonText(width: double.infinity, height: 12),
              const SizedBox(height: 6),
              SkeletonText(width: MediaQuery.sizeOf(context).width * 0.6, height: 12),
            ],
          ),
        ),
      ),
    );
  }
}
