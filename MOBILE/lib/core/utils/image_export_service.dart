import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import 'package:screenshot/screenshot.dart';
import 'package:share_plus/share_plus.dart';
import '../theme/style_guide.dart';

class ImageExportService {
  static final ScreenshotController screenshotController = ScreenshotController();

  static Future<void> shareRecommendationsImage(BuildContext context, List<dynamic> recommendations, String city) async {
    // Generar el widget que se capturará
    final widget = Container(
      width: 400,
      padding: const EdgeInsets.all(24),
      decoration: const BoxDecoration(
        color: Colors.white,
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Colors.white, Color(0xFFF5F3FF)],
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
              Text(DateTime.now().toString().split(' ')[0], style: const TextStyle(color: Colors.grey)),
            ],
          ),
          const SizedBox(height: 20),
          Text('Mis Recomendaciones en $city', style: const TextStyle(fontFamily: 'Outfit', fontSize: 22, fontWeight: FontWeight.bold, color: Colors.black)),
          const SizedBox(height: 8),
          const Text('Basado en mi perfil de viajero inteligente', style: TextStyle(fontFamily: 'Outfit', color: Colors.grey)),
          const SizedBox(height: 24),
          ...recommendations.take(5).map((item) {
            final name = item['title'] ?? item['name'] ?? 'Lugar';
            final score = item['score'] ?? 0.0;
            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, 4))],
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    backgroundColor: SmarturStyle.purple.withValues(alpha: 0.1),
                    child: Text(score.toStringAsFixed(1), style: const TextStyle(color: SmarturStyle.purple, fontWeight: FontWeight.bold)),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Text(name, style: const TextStyle(fontFamily: 'Outfit', fontWeight: FontWeight.bold, fontSize: 16, color: Colors.black)),
                  ),
                ],
              ),
            );
          }),
          const SizedBox(height: 24),
          const Divider(),
          const Center(
            child: Text('Generado por SMARTUR AI', style: TextStyle(fontFamily: 'Outfit', fontSize: 12, color: Colors.grey, letterSpacing: 1.2)),
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

        await Share.shareXFiles([XFile(imagePath.path)], text: '¡Mira lo que me recomienda SMARTUR en $city!');
      }
    } catch (e) {
      debugPrint('Error capturando imagen: $e');
      rethrow;
    }
  }
}
