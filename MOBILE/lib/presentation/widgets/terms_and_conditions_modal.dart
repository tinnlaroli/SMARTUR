import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:smartur/l10n/app_localizations.dart';

import '../../core/theme/style_guide.dart';

/// Muestra los términos y condiciones en un diálogo con scroll (mismo contenido
/// que en registro y en Configuración).
Future<void> showTermsAndConditionsModal(BuildContext context) async {
  final l10n = AppLocalizations.of(context)!;
  final scheme = Theme.of(context).colorScheme;
  final size = MediaQuery.sizeOf(context);

  await showDialog<void>(
    context: context,
    barrierDismissible: true,
    builder: (ctx) {
      final maxW = math.min(420.0, size.width - 40);
      final maxH = size.height * 0.78;
      return Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        clipBehavior: Clip.antiAlias,
        insetPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
        child: SizedBox(
          width: maxW,
          height: maxH,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 20, 12, 8),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        l10n.termsAndConditions,
                        style: SmarturStyle.calSansTitle.copyWith(fontSize: 20),
                      ),
                    ),
                    IconButton(
                      onPressed: () => Navigator.pop(ctx),
                      icon: Icon(Icons.close_rounded, color: scheme.onSurfaceVariant),
                      tooltip: MaterialLocalizations.of(ctx).closeButtonTooltip,
                    ),
                  ],
                ),
              ),
              Divider(height: 1, color: scheme.outlineVariant),
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
                  child: Text(
                    l10n.termsAndConditionsBody,
                    style: TextStyle(
                      fontFamily: 'Outfit',
                      fontSize: 14,
                      height: 1.45,
                      color: scheme.onSurface,
                    ),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                child: FilledButton(
                  onPressed: () => Navigator.pop(ctx),
                  style: FilledButton.styleFrom(
                    backgroundColor: SmarturStyle.purple,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  child: Text(
                    l10n.termsCloseButton,
                    style: const TextStyle(
                      fontFamily: 'Outfit',
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    },
  );
}
