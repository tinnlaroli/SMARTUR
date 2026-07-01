import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

/// Shared image widget with proper caching, quality and placeholder.
/// Use instead of [Image.network] or bare [CachedNetworkImage] throughout the app.
class SmarturImage extends StatelessWidget {
  final String? url;
  final double? width;
  final double? height;
  final BoxFit fit;
  final FilterQuality quality;
  final Widget? placeholder;
  final Widget? errorWidget;
  final BorderRadius? borderRadius;

  const SmarturImage({
    super.key,
    required this.url,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
    this.quality = FilterQuality.medium,
    this.placeholder,
    this.errorWidget,
    this.borderRadius,
  });

  /// Hero / full-width images — high quality
  const SmarturImage.hero({
    super.key,
    required this.url,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
    this.placeholder,
    this.errorWidget,
    this.borderRadius,
  }) : quality = FilterQuality.high;

  /// Thumbnail / list tiles — lower memory footprint
  const SmarturImage.thumb({
    super.key,
    required this.url,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
    this.placeholder,
    this.errorWidget,
    this.borderRadius,
  }) : quality = FilterQuality.low;

  int? get _cacheW =>
      width != null ? (width! * 2).ceil().clamp(1, 4096) : null;
  int? get _cacheH =>
      height != null ? (height! * 2).ceil().clamp(1, 4096) : null;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final empty = url == null || url!.isEmpty;

    Widget child;

    if (empty) {
      child = _error(scheme);
    } else {
      child = CachedNetworkImage(
        imageUrl: url!,
        width: width,
        height: height,
        fit: fit,
        filterQuality: quality,
        memCacheWidth: _cacheW,
        memCacheHeight: _cacheH,
        fadeInDuration: const Duration(milliseconds: 200),
        fadeOutDuration: const Duration(milliseconds: 100),
        placeholder: (_, __) => placeholder ?? _shimmer(scheme),
        errorWidget: (_, __, ___) => errorWidget ?? _error(scheme),
      );
    }

    if (borderRadius != null) {
      return ClipRRect(borderRadius: borderRadius!, child: child);
    }
    return child;
  }

  Widget _shimmer(ColorScheme scheme) {
    return Container(
      width: width,
      height: height,
      color: scheme.surfaceContainerHighest,
    );
  }

  Widget _error(ColorScheme scheme) {
    return Container(
      width: width,
      height: height,
      color: scheme.surfaceContainerHighest,
      child: Icon(
        Icons.image_not_supported_outlined,
        color: scheme.onSurfaceVariant.withValues(alpha: 0.3),
        size: 24,
      ),
    );
  }
}
