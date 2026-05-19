import 'package:flutter/material.dart';

import '../../core/constants/avatar_icon_map.dart';
import '../../core/theme/style_guide.dart';

/// Avatar: foto de red, icono permitido o iniciales.
class SmarturUserAvatar extends StatelessWidget {
  final String? photoUrl;
  final String? avatarIconKey;
  final String displayName;
  final double radius;
  final Color? backgroundColor;
  final Color? foregroundColor;

  const SmarturUserAvatar({
    super.key,
    required this.photoUrl,
    required this.avatarIconKey,
    required this.displayName,
    this.radius = 22,
    this.backgroundColor,
    this.foregroundColor,
  });

  String get _initials {
    final parts = displayName.trim().split(RegExp(r'\s+'));
    if (parts.length >= 2 && parts[0].isNotEmpty && parts[1].isNotEmpty) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    if (displayName.isNotEmpty) return displayName[0].toUpperCase();
    return 'S';
  }

  Widget _fallback(BuildContext context) {
    final bg = backgroundColor ?? SmarturStyle.purple.withValues(alpha: 0.15);
    final fg = foregroundColor ?? SmarturStyle.purple;
    final icon = iconForAvatarKey(avatarIconKey);
    if (icon != null) {
      return CircleAvatar(
        radius: radius,
        backgroundColor: bg,
        child: Icon(icon, color: fg, size: radius * 0.95),
      );
    }
    return CircleAvatar(
      radius: radius,
      backgroundColor: bg,
      child: Text(
        _initials,
        style: TextStyle(
          fontFamily: 'CalSans',
          fontSize: radius * 0.85,
          color: fg,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final url = photoUrl?.trim() ?? '';
    if (url.isNotEmpty && url.startsWith('https://')) {
      final size = radius * 2;
      return ClipOval(
        child: Image.network(
          url,
          width: size,
          height: size,
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) => _fallback(context),
        ),
      );
    }
    return _fallback(context);
  }
}
