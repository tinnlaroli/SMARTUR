import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import 'package:screenshot/screenshot.dart';
import 'package:share_plus/share_plus.dart';
import 'package:smartur/l10n/app_localizations.dart';
import '../theme/style_guide.dart';

class ImageExportService {
  static final ScreenshotController screenshotController = ScreenshotController();

  static Future<void> shareRecommendationsImage(BuildContext context, List<dynamic> recommendations, String city) async {
    final l10n = AppLocalizations.of(context)!;
    final scheme = Theme.of(context).colorScheme;
    // Generar el widget que se capturará
    final widget = Container(
      width: 400,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: scheme.surface,
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [scheme.surface, scheme.surfaceContainerHighest],
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Image.asset('assets/imgs/logo_costado.png', height: 40),
              Text(
                DateTime.now().toString().split(' ')[0],
                style: TextStyle(color: scheme.onSurfaceVariant),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Text(
            l10n.imageShareTitle(city),
            style: TextStyle(
              fontFamily: 'Outfit',
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: scheme.onSurface,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            l10n.imageShareSubtitle,
            style: TextStyle(fontFamily: 'Outfit', color: scheme.onSurfaceVariant),
          ),
          const SizedBox(height: 24),
          ...recommendations.take(5).map((item) {
            final name = item['title'] ?? item['name'] ?? l10n.commonPlaceFallback;
            final score = item['score'] ?? 0.0;
            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: scheme.surface,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: scheme.shadow.withValues(alpha: 0.1),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    backgroundColor: SmarturStyle.purple.withValues(alpha: 0.1),
                    child: Text(score.toStringAsFixed(1), style: const TextStyle(color: SmarturStyle.purple, fontWeight: FontWeight.bold)),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Text(
                      name,
                      style: TextStyle(
                        fontFamily: 'Outfit',
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                        color: scheme.onSurface,
                      ),
                    ),
                  ),
                ],
              ),
            );
          }),
          const SizedBox(height: 24),
          const Divider(),
          Center(
            child: Text(
              l10n.imageShareGeneratedBy,
              style: TextStyle(
                fontFamily: 'Outfit',
                fontSize: 12,
                color: scheme.onSurfaceVariant,
                letterSpacing: 1.2,
              ),
            ),
          ),
        ],
      ),
    );

    try {
      final Uint8List? image = await screenshotController.captureFromWidget(
        widget,
        delay: const Duration(milliseconds: 100),
        context: context,
      );

      if (image != null) {
        final directory = await getTemporaryDirectory();
        final imagePath = await File('${directory.path}/smartur_recomienda.png').create();
        await imagePath.writeAsBytes(image);

        await SharePlus.instance.share(ShareParams(files: [XFile(imagePath.path)], text: l10n.imageShareMessage(city)));
      }
    } catch (e) {
      debugPrint('Error capturando imagen: $e');
      rethrow;
    }
  }
}
