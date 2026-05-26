import 'package:flutter/material.dart';

/// Slim banner shown at the top of screens when the app is displaying
/// locally-cached data because no network connection is available.
///
/// Dismisses automatically when the screen refreshes with live data.
class OfflineBanner extends StatelessWidget {
  /// Human-readable age of the cached data, e.g. "hace 3 h".
  final String? cacheAge;

  /// Called when the user taps the retry button.
  final VoidCallback? onRetry;

  const OfflineBanner({
    super.key,
    this.cacheAge,
    this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Material(
      color: Colors.transparent,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isDark
              ? const Color(0xFF2D2000)
              : const Color(0xFFFFF8E1),
          border: Border(
            bottom: BorderSide(
              color: isDark
                  ? const Color(0xFF5C4000)
                  : const Color(0xFFFFCC02),
              width: 1,
            ),
          ),
        ),
        child: Row(
          children: [
            Icon(
              Icons.wifi_off_rounded,
              size: 16,
              color: isDark
                  ? const Color(0xFFFFCC02)
                  : const Color(0xFF7A5800),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                cacheAge != null
                    ? 'Sin conexión — mostrando datos guardados ($cacheAge)'
                    : 'Sin conexión — mostrando datos guardados',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: isDark
                      ? const Color(0xFFFFCC02)
                      : const Color(0xFF7A5800),
                ),
              ),
            ),
            if (onRetry != null) ...[
              const SizedBox(width: 8),
              GestureDetector(
                onTap: onRetry,
                child: Text(
                  'Reintentar',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: isDark
                        ? const Color(0xFFFFCC02)
                        : const Color(0xFF5C4000),
                    decoration: TextDecoration.underline,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
