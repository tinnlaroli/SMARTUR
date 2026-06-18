import 'package:flutter/material.dart';

@immutable
class SmarturSemanticColors extends ThemeExtension<SmarturSemanticColors> {
  // ── Image overlays ─────────────────────────────────────────────────────────
  final Color onImageText;
  final Color onImageMuted;
  final Color imageScrimSoft;
  final Color imageScrimStrong;
  final Color overlayBorder;

  // ── Semantic states ─────────────────────────────────────────────────────────
  final Color success;
  final Color warning;
  final Color danger;
  final Color info;
  final Color panelBackground;

  // ── Brand palette (theme-aware; replaces SmarturStyle.* hardcodes) ─────────
  /// Replaces SmarturStyle.purple — primary brand accent
  final Color accent;
  /// Replaces SmarturStyle.pink — secondary brand accent
  final Color altAccent;
  /// Replaces SmarturStyle.blue — info/ocean color
  final Color sea;
  /// Replaces SmarturStyle.green — nature/success color
  final Color leaf;
  /// Replaces SmarturStyle.orange — warm/energy color
  final Color ember;

  const SmarturSemanticColors({
    required this.onImageText,
    required this.onImageMuted,
    required this.imageScrimSoft,
    required this.imageScrimStrong,
    required this.overlayBorder,
    required this.success,
    required this.warning,
    required this.danger,
    required this.info,
    required this.panelBackground,
    required this.accent,
    required this.altAccent,
    required this.sea,
    required this.leaf,
    required this.ember,
  });

  static SmarturSemanticColors of(BuildContext context) =>
      Theme.of(context).extension<SmarturSemanticColors>()!;

  @override
  SmarturSemanticColors copyWith({
    Color? onImageText,
    Color? onImageMuted,
    Color? imageScrimSoft,
    Color? imageScrimStrong,
    Color? overlayBorder,
    Color? success,
    Color? warning,
    Color? danger,
    Color? info,
    Color? panelBackground,
    Color? accent,
    Color? altAccent,
    Color? sea,
    Color? leaf,
    Color? ember,
  }) {
    return SmarturSemanticColors(
      onImageText: onImageText ?? this.onImageText,
      onImageMuted: onImageMuted ?? this.onImageMuted,
      imageScrimSoft: imageScrimSoft ?? this.imageScrimSoft,
      imageScrimStrong: imageScrimStrong ?? this.imageScrimStrong,
      overlayBorder: overlayBorder ?? this.overlayBorder,
      success: success ?? this.success,
      warning: warning ?? this.warning,
      danger: danger ?? this.danger,
      info: info ?? this.info,
      panelBackground: panelBackground ?? this.panelBackground,
      accent: accent ?? this.accent,
      altAccent: altAccent ?? this.altAccent,
      sea: sea ?? this.sea,
      leaf: leaf ?? this.leaf,
      ember: ember ?? this.ember,
    );
  }

  @override
  SmarturSemanticColors lerp(ThemeExtension<SmarturSemanticColors>? other, double t) {
    if (other is! SmarturSemanticColors) return this;
    return SmarturSemanticColors(
      onImageText: Color.lerp(onImageText, other.onImageText, t) ?? onImageText,
      onImageMuted: Color.lerp(onImageMuted, other.onImageMuted, t) ?? onImageMuted,
      imageScrimSoft: Color.lerp(imageScrimSoft, other.imageScrimSoft, t) ?? imageScrimSoft,
      imageScrimStrong: Color.lerp(imageScrimStrong, other.imageScrimStrong, t) ?? imageScrimStrong,
      overlayBorder: Color.lerp(overlayBorder, other.overlayBorder, t) ?? overlayBorder,
      success: Color.lerp(success, other.success, t) ?? success,
      warning: Color.lerp(warning, other.warning, t) ?? warning,
      danger: Color.lerp(danger, other.danger, t) ?? danger,
      info: Color.lerp(info, other.info, t) ?? info,
      panelBackground: Color.lerp(panelBackground, other.panelBackground, t) ?? panelBackground,
      accent: Color.lerp(accent, other.accent, t) ?? accent,
      altAccent: Color.lerp(altAccent, other.altAccent, t) ?? altAccent,
      sea: Color.lerp(sea, other.sea, t) ?? sea,
      leaf: Color.lerp(leaf, other.leaf, t) ?? leaf,
      ember: Color.lerp(ember, other.ember, t) ?? ember,
    );
  }
}
