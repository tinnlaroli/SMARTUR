import 'package:flutter/material.dart';

@immutable
class SmarturSemanticColors extends ThemeExtension<SmarturSemanticColors> {
  final Color onImageText;
  final Color onImageMuted;
  final Color imageScrimSoft;
  final Color imageScrimStrong;
  final Color overlayBorder;
  final Color success;
  final Color warning;
  final Color danger;
  final Color info;
  final Color panelBackground;

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
  });

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
    );
  }
}
