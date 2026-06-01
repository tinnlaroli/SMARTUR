import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:open_file_plus/open_file_plus.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:path_provider/path_provider.dart';

class UpdateService {
  static const _apiUrl =
      'https://api.github.com/repos/tinnlaroli/smartur-movil/releases/latest';
  static const _downloadUrl =
      'https://github.com/tinnlaroli/smartur-movil/releases/latest/download/app-release.apk';

  static DateTime? _lastCheck;
  static ({bool hasUpdate, String latestVersion, String currentVersion})? _cached;
  static bool _shownThisSession = false;

  static Future<String> currentVersion() async {
    final info = await PackageInfo.fromPlatform();
    return info.version;
  }

  /// Checks GitHub for a newer release. Caches result for 1 hour.
  static Future<({bool hasUpdate, String latestVersion, String currentVersion})> check({
    bool forceRefresh = false,
  }) async {
    final now = DateTime.now();
    if (!forceRefresh &&
        _cached != null &&
        _lastCheck != null &&
        now.difference(_lastCheck!) < const Duration(hours: 1)) {
      return _cached!;
    }

    try {
      final info = await PackageInfo.fromPlatform();
      final current = info.version;

      final resp = await http
          .get(Uri.parse(_apiUrl),
              headers: {'Accept': 'application/vnd.github+json'})
          .timeout(const Duration(seconds: 8));

      if (resp.statusCode != 200) {
        return _cache((hasUpdate: false, latestVersion: current, currentVersion: current));
      }

      final body = jsonDecode(resp.body) as Map<String, dynamic>;
      final tag = (body['tag_name'] as String? ?? '').replaceFirst('v', '');
      if (tag.isEmpty || (body['prerelease'] as bool? ?? false)) {
        return _cache((hasUpdate: false, latestVersion: current, currentVersion: current));
      }

      return _cache((
        hasUpdate: _isNewer(tag, current),
        latestVersion: tag,
        currentVersion: current,
      ));
    } catch (_) {
      final fallback = await PackageInfo.fromPlatform().catchError((_) =>
          PackageInfo(appName: '', packageName: '', version: '?', buildNumber: ''));
      return (hasUpdate: false, latestVersion: '?', currentVersion: fallback.version);
    }
  }

  static ({bool hasUpdate, String latestVersion, String currentVersion}) _cache(
      ({bool hasUpdate, String latestVersion, String currentVersion}) result) {
    _cached = result;
    _lastCheck = DateTime.now();
    return result;
  }

  /// Call once after login. Shows dialog only if update available and not yet
  /// shown this session.
  static Future<void> checkAndPromptIfNeeded(BuildContext context) async {
    if (_shownThisSession) return;
    final result = await check();
    if (!result.hasUpdate) return;
    if (!context.mounted) return;
    _shownThisSession = true;
    showUpdateDialog(context, result.latestVersion);
  }

  static bool _isNewer(String latest, String current) {
    final clean = (String v) => v.split('-').first;
    final parse = (String v) =>
        clean(v).split('.').map((p) => int.tryParse(p) ?? 0).toList();
    final l = parse(latest);
    final c = parse(current);
    for (var i = 0; i < 3; i++) {
      final lv = i < l.length ? l[i] : 0;
      final cv = i < c.length ? c[i] : 0;
      if (lv > cv) return true;
      if (lv < cv) return false;
    }
    return false;
  }

  /// Downloads the APK to the app cache directory and opens the system
  /// package installer. [onProgress] receives 0.0–1.0 as bytes arrive.
  static Future<void> downloadAndInstall({
    void Function(double progress)? onProgress,
  }) async {
    final dir = await getTemporaryDirectory();
    final filePath = '${dir.path}/smartur-update.apk';
    final file = File(filePath);

    final client = http.Client();
    try {
      final request = http.Request('GET', Uri.parse(_downloadUrl));
      final response = await client.send(request);
      final total = response.contentLength ?? 0;
      var received = 0;

      final sink = file.openWrite();
      await response.stream.map((chunk) {
        received += chunk.length;
        if (total > 0) onProgress?.call(received / total);
        return chunk;
      }).pipe(sink);
    } finally {
      client.close();
    }

    await OpenFile.open(filePath);
  }

  static void showUpdateDialog(BuildContext context, String latestVersion) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => _UpdateDialog(latestVersion: latestVersion),
    );
  }
}

class _UpdateDialog extends StatefulWidget {
  final String latestVersion;
  const _UpdateDialog({required this.latestVersion});

  @override
  State<_UpdateDialog> createState() => _UpdateDialogState();
}

class _UpdateDialogState extends State<_UpdateDialog> {
  double? _progress; // null = idle, 0.0–1.0 = downloading
  bool _error = false;

  Future<void> _startUpdate() async {
    setState(() {
      _progress = 0;
      _error = false;
    });
    try {
      await UpdateService.downloadAndInstall(
        onProgress: (p) {
          if (mounted) setState(() => _progress = p);
        },
      );
      if (mounted) Navigator.of(context).pop();
    } catch (_) {
      if (mounted) setState(() { _error = true; _progress = null; });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDownloading = _progress != null;

    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: const Row(
        children: [
          Icon(Icons.system_update_rounded, color: Color(0xFF7C3AED)),
          SizedBox(width: 8),
          Text('Nueva versión disponible',
              style: TextStyle(fontFamily: 'CalSans', fontSize: 18)),
        ],
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'La versión ${widget.latestVersion} de SMARTUR está disponible.\n'
            'Se descargará e instalará directamente en el app.',
            style: const TextStyle(fontFamily: 'Outfit', fontSize: 14, height: 1.5),
          ),
          if (isDownloading) ...[
            const SizedBox(height: 16),
            LinearProgressIndicator(
              value: _progress,
              backgroundColor: const Color(0xFFEDE9FE),
              color: const Color(0xFF7C3AED),
              borderRadius: BorderRadius.circular(4),
            ),
            const SizedBox(height: 8),
            Text(
              _progress! < 1.0
                  ? 'Descargando... ${(_progress! * 100).toStringAsFixed(0)}%'
                  : 'Abriendo instalador...',
              style: const TextStyle(
                  fontFamily: 'Outfit', fontSize: 12, color: Colors.grey),
            ),
          ],
          if (_error) ...[
            const SizedBox(height: 12),
            const Text(
              'Error al descargar. Verifica tu conexión e intenta de nuevo.',
              style: TextStyle(fontFamily: 'Outfit', fontSize: 12, color: Colors.red),
            ),
          ],
        ],
      ),
      actions: isDownloading && !_error
          ? null
          : [
              if (!isDownloading)
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('Después',
                      style: TextStyle(color: Colors.grey)),
                ),
              FilledButton.icon(
                onPressed: _startUpdate,
                icon: Icon(
                    _error ? Icons.refresh_rounded : Icons.download_rounded),
                label: Text(_error ? 'Reintentar' : 'Actualizar ahora'),
                style: FilledButton.styleFrom(
                  backgroundColor: const Color(0xFF7C3AED),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ],
    );
  }
}
