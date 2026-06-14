import 'package:flutter/material.dart';
import 'package:smartur/l10n/app_localizations.dart';

import '../../../core/theme/style_guide.dart';
import '../../../data/models/itinerary_model.dart';
import '../../widgets/smartur_background.dart';

class ComparisonScreen extends StatelessWidget {
  final List<ItineraryStop> originalStops;
  final OptimizeResult result;

  const ComparisonScreen({
    super.key,
    required this.originalStops,
    required this.result,
  });

  List<ItineraryStop> get _optimizedStops {
    final idMap = {for (final s in originalStops) s.id: s};
    return result.optimizedStopIds
        .map((id) => idMap[id])
        .whereType<ItineraryStop>()
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final scheme = Theme.of(context).colorScheme;
    final optimized = _optimizedStops;
    final improved = result.savingsPct > 0;

    return Scaffold(
      backgroundColor: scheme.surface,
      appBar: AppBar(
        title: Text(
          l10n.compareTitle,
          style: SmarturStyle.calSansTitle.copyWith(fontSize: 18),
        ),
        backgroundColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
      ),
      body: SmarturBackgroundTop(
        child: Column(
          children: [
            // ── Metrics banner ────────────────────────────────────────────────
            if (improved)
              Container(
                margin: const EdgeInsets.fromLTRB(16, 4, 16, 0),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                decoration: BoxDecoration(
                  color: SmarturStyle.purple.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                      color: SmarturStyle.purple.withValues(alpha: 0.3)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    _MetricChip(
                      label: l10n.compareDistanceLabel,
                      original: '${result.originalDistanceKm.toStringAsFixed(1)} km',
                      optimized: '${result.optimizedDistanceKm.toStringAsFixed(1)} km',
                      scheme: scheme,
                    ),
                    Container(width: 1, height: 36, color: scheme.outlineVariant),
                    _SavingsBadge(pct: result.savingsPct, l10n: l10n),
                  ],
                ),
              )
            else
              Container(
                margin: const EdgeInsets.fromLTRB(16, 4, 16, 0),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: SmarturStyle.green.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                      color: SmarturStyle.green.withValues(alpha: 0.3)),
                ),
                child: Row(
                  children: [
                    Icon(Icons.verified_outlined,
                        color: SmarturStyle.green, size: 20),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '0% Improvement',
                            style: TextStyle(
                              fontFamily: 'Outfit',
                              fontWeight: FontWeight.w700,
                              fontSize: 13,
                              color: SmarturStyle.green,
                            ),
                          ),
                          Text(
                            'Your route is already perfectly planned!',
                            style: TextStyle(
                              fontFamily: 'Outfit',
                              fontSize: 11,
                              color: SmarturStyle.green.withValues(alpha: 0.8),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

            // ── Side-by-side stops ────────────────────────────────────────────
            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Original
                    Expanded(
                      child: _StopsColumn(
                        title: l10n.compareYourRoute,
                        stops: originalStops,
                        accentColor: scheme.onSurfaceVariant,
                        scheme: scheme,
                      ),
                    ),
                    const SizedBox(width: 10),
                    // Optimized
                    Expanded(
                      child: _StopsColumn(
                        title: l10n.compareOptimized,
                        stops: optimized,
                        accentColor: SmarturStyle.purple,
                        scheme: scheme,
                        highlight: improved,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // ── Action buttons ────────────────────────────────────────────────
            SafeArea(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (improved)
                      FilledButton(
                        onPressed: () => Navigator.pop(context, optimized),
                        style: FilledButton.styleFrom(
                          backgroundColor: SmarturStyle.purple,
                          minimumSize: const Size(double.infinity, 52),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16)),
                        ),
                        child: Text(
                          l10n.compareApply,
                          style: const TextStyle(
                            fontFamily: 'Outfit',
                            fontWeight: FontWeight.w700,
                            fontSize: 15,
                          ),
                        ),
                      ),
                    const SizedBox(height: 8),
                    OutlinedButton(
                      onPressed: () => Navigator.pop(context, null),
                      style: OutlinedButton.styleFrom(
                        minimumSize: const Size(double.infinity, 48),
                        side: BorderSide(color: scheme.outlineVariant),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16)),
                      ),
                      child: Text(
                        l10n.compareKeep,
                        style: TextStyle(
                          fontFamily: 'Outfit',
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                          color: scheme.onSurface,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────

class _MetricChip extends StatelessWidget {
  final String label;
  final String original;
  final String optimized;
  final ColorScheme scheme;

  const _MetricChip({
    required this.label,
    required this.original,
    required this.optimized,
    required this.scheme,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(label,
            style: TextStyle(
                fontFamily: 'Outfit',
                fontSize: 11,
                color: scheme.onSurfaceVariant)),
        const SizedBox(height: 2),
        Text(
          original,
          style: TextStyle(
            fontFamily: 'Outfit',
            fontSize: 12,
            color: scheme.onSurfaceVariant,
            decoration: TextDecoration.lineThrough,
          ),
        ),
        Text(
          optimized,
          style: TextStyle(
            fontFamily: 'Outfit',
            fontSize: 14,
            fontWeight: FontWeight.w700,
            color: SmarturStyle.purple,
          ),
        ),
      ],
    );
  }
}

class _SavingsBadge extends StatelessWidget {
  final int pct;
  final AppLocalizations l10n;

  const _SavingsBadge({required this.pct, required this.l10n});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(l10n.compareSavingsLabel,
            style: TextStyle(
                fontFamily: 'Outfit',
                fontSize: 11,
                color: Theme.of(context).colorScheme.onSurfaceVariant)),
        const SizedBox(height: 2),
        Text(
          '$pct%',
          style: TextStyle(
            fontFamily: 'Outfit',
            fontSize: 22,
            fontWeight: FontWeight.w800,
            color: SmarturStyle.purple,
          ),
        ),
        Text(
          l10n.compareMoreEfficient,
          style: TextStyle(
            fontFamily: 'Outfit',
            fontSize: 11,
            color: SmarturStyle.purple,
          ),
        ),
      ],
    );
  }
}

class _StopsColumn extends StatelessWidget {
  final String title;
  final List<ItineraryStop> stops;
  final Color accentColor;
  final ColorScheme scheme;
  final bool highlight;

  const _StopsColumn({
    required this.title,
    required this.stops,
    required this.accentColor,
    required this.scheme,
    this.highlight = false,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Column header
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 10),
          decoration: BoxDecoration(
            color: accentColor.withValues(alpha: highlight ? 0.12 : 0.06),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
                color: accentColor.withValues(alpha: highlight ? 0.4 : 0.2)),
          ),
          child: Text(
            title,
            style: TextStyle(
              fontFamily: 'Outfit',
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: accentColor,
            ),
            textAlign: TextAlign.center,
          ),
        ),
        const SizedBox(height: 8),

        // Stops list
        Expanded(
          child: ListView.builder(
            itemCount: stops.length,
            itemBuilder: (context, i) {
              final stop = stops[i];
              final isLast = i == stops.length - 1;
              return _StopRow(
                stop: stop,
                index: i,
                accentColor: accentColor,
                scheme: scheme,
                isLast: isLast,
              );
            },
          ),
        ),
      ],
    );
  }
}

class _StopRow extends StatelessWidget {
  final ItineraryStop stop;
  final int index;
  final Color accentColor;
  final ColorScheme scheme;
  final bool isLast;

  const _StopRow({
    required this.stop,
    required this.index,
    required this.accentColor,
    required this.scheme,
    required this.isLast,
  });

  @override
  Widget build(BuildContext context) {
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Timeline column
          SizedBox(
            width: 24,
            child: Column(
              children: [
                Container(
                  width: 22,
                  height: 22,
                  decoration: BoxDecoration(
                    color: accentColor,
                    shape: BoxShape.circle,
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    '${index + 1}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      fontFamily: 'Outfit',
                    ),
                  ),
                ),
                if (!isLast)
                  Expanded(
                    child: Center(
                      child: Container(
                        width: 1.5,
                        color: accentColor.withValues(alpha: 0.25),
                      ),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 6),

          // Stop name
          Expanded(
            child: Padding(
              padding: EdgeInsets.only(bottom: isLast ? 0 : 8),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                decoration: BoxDecoration(
                  color: scheme.surfaceContainerHighest.withValues(alpha: 0.4),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                      color: scheme.outlineVariant.withValues(alpha: 0.3)),
                ),
                child: Text(
                  stop.placeName.isNotEmpty
                      ? stop.placeName
                      : '${stop.placeKind.toUpperCase()} #${stop.placeId}',
                  style: TextStyle(
                    fontFamily: 'Outfit',
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                    color: scheme.onSurface,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
