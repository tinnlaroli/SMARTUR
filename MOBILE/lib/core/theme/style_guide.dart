import 'package:flutter/material.dart';

class SmarturStyle {
  // --- COLORES ---
  static const Color pink = Color(0xFFFC478E);
  static const Color purple = Color(0xFF984EFD);
  static const Color blue = Color(0xFF4DB9CA);
  static const Color green = Color(0xFF9CCC44);
  static const Color orange = Color(0xFFFF7D1F);
  
  static const Color textPrimary = Color(0xFF1F2937);
  static const Color textSecondary = Color(0xFF6B7280);
  static const Color bgSecondary = Color(0xFFF9FAFB);

  // TAMAÑO TÁCTIL 
  static const double touchTargetComfortable = 56.0;
  
  // MEDIDAS 
  static const double spacingSm = 12.0;  // 0.75rem
  static const double spacingMd = 16.0;  // 1rem
  static const double spacingLg = 24.0;  // 1.5rem
  static const double spacingXl = 32.0;  // 2rem

  /// Títulos con Cal Sans. Sin [TextStyle.color] fijo: el texto usa el color del
  /// tema ([ColorScheme.onSurface]) y se lee bien en claro y oscuro. No usar
  /// [textPrimary] aquí; ese valor es solo para superficies claras puntuales.
  static const TextStyle calSansTitle = TextStyle(
    fontFamily: 'CalSans',
    fontSize: 28,
    fontWeight: FontWeight.bold,
  );
}