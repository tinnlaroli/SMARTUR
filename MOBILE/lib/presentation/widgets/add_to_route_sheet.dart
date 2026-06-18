import 'package:flutter/material.dart';
import 'package:smartur/l10n/app_localizations.dart';

import '../../core/motion/smartur_routes.dart';
import '../../core/theme/smartur_theme_extensions.dart';
import '../../core/theme/style_guide.dart';
import '../../core/utils/notifications.dart';
import '../../data/local/itinerary_db.dart';
import '../../data/models/itinerary_model.dart';
import '../../data/services/itinerary_service.dart';
import '../screens/itinerary/planner_screen.dart';
import '../screens/main/main_screen.dart' show routeStopCount;

/// Parses "svc_12" → (kind: 'svc', id: 12). Returns null on bad input.
({String kind, int id})? _parsePlaceRef(String placeId) {
  if (placeId.startsWith('svc_')) {
    final n = int.tryParse(placeId.substring(4));
    if (n != null) return (kind: 'svc', id: n);
  }
  if (placeId.startsWith('poi_')) {
    final n = int.tryParse(placeId.substring(4));
    if (n != null) return (kind: 'poi', id: n);
  }
  return null;
}

/// Shows the "Add to route" bottom sheet.
/// After dismissal, navigates to PlannerScreen if a new itinerary was created.
Future<void> showAddToRouteSheet(
  BuildContext context, {
  required String placeName,
  required String placeId,
}) async {
  final result =
      await showModalBottomSheet<({Itinerary it, bool isNew})>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (ctx) => _AddToRouteSheet(
      placeName: placeName,
      placeId: placeId,
    ),
  );

  if (result != null && result.isNew && context.mounted) {
    await Navigator.push(
      context,
      smarturFadeRoute(PlannerScreen(itinerary: result.it)),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────

class _AddToRouteSheet extends StatefulWidget {
  final String placeName;
  final String placeId;

  const _AddToRouteSheet({required this.placeName, required this.placeId});

  @override
  State<_AddToRouteSheet> createState() => _AddToRouteSheetState();
}

class _AddToRouteSheetState extends State<_AddToRouteSheet> {
  List<Itinerary> _itineraries = [];
  bool _loading = true;
  int? _addingTo; // id of itinerary being added to

  @override
  void initState() {
    super.initState();
    _loadItineraries();
  }

  Future<void> _loadItineraries() async {
    try {
      final list = await ItineraryService().fetchMyItineraries();
      if (mounted) setState(() => _itineraries = list);
    } catch (_) {
      // silently fail — user can still create a new route
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _addToExisting(Itinerary it) async {
    final ref = _parsePlaceRef(widget.placeId);
    if (ref == null) {
      if (mounted) Navigator.pop(context);
      return;
    }
    setState(() => _addingTo = it.id);
    try {
      final stop = await ItineraryService().addStop(
        it.id,
        placeKind: ref.kind,
        placeId: ref.id,
      );
      final updated = it.copyWith(stops: [...it.stops, stop]);
      await ItineraryDB.saveItinerary(updated);
      routeStopCount.value = updated.stops.length;
      if (mounted) {
        SmarturNotifications.showSuccess(context, '${it.title}: +${widget.placeName}');
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        SmarturNotifications.showError(context, e.toString());
        setState(() => _addingTo = null);
      }
    }
  }

  Future<void> _createAndAdd() async {
    final l10n = AppLocalizations.of(context)!;
    final ref = _parsePlaceRef(widget.placeId);

    // Ask for route name
    final ctrl = TextEditingController(
      text: widget.placeName.isNotEmpty
          ? 'Ruta: ${widget.placeName}'
          : '',
    );
    final name = await showDialog<String>(
      context: context,
      builder: (ctx) {
        final scheme = Theme.of(ctx).colorScheme;
        return AlertDialog(
          title: Text(l10n.plannerRouteName,
              style: SmarturStyle.calSansTitle.copyWith(fontSize: 18)),
          content: TextField(
            controller: ctrl,
            autofocus: true,
            textCapitalization: TextCapitalization.sentences,
            decoration:
                InputDecoration(hintText: l10n.plannerRouteNameHint),
            style: const TextStyle(fontFamily: 'Outfit'),
            onSubmitted: (v) {
              if (v.trim().isNotEmpty) Navigator.pop(ctx, v.trim());
            },
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: Text(l10n.cancel,
                  style: const TextStyle(fontFamily: 'Outfit')),
            ),
            FilledButton(
              onPressed: () {
                if (ctrl.text.trim().isNotEmpty) {
                  Navigator.pop(ctx, ctrl.text.trim());
                }
              },
              style:
                  FilledButton.styleFrom(backgroundColor: scheme.primary),
              child: Text(l10n.misRutasCreate,
                  style: const TextStyle(
                      fontFamily: 'Outfit', fontWeight: FontWeight.w700)),
            ),
          ],
        );
      },
    );

    if (name == null || name.isEmpty || !mounted) return;

    setState(() => _loading = true);
    try {
      final newIt = await ItineraryService().createItinerary(title: name);
      ItineraryStop? stop;
      if (ref != null) {
        stop = await ItineraryService().addStop(
          newIt.id,
          placeKind: ref.kind,
          placeId: ref.id,
        );
      }
      final itWithStop = newIt.copyWith(
        stops: stop != null ? [stop] : [],
      );
      await ItineraryDB.saveItinerary(itWithStop);
      routeStopCount.value = itWithStop.stops.length;
      if (mounted) {
        Navigator.pop(
          context,
          (it: itWithStop, isNew: true),
        );
      }
    } catch (e) {
      if (mounted) {
        SmarturNotifications.showError(context, e.toString());
        setState(() => _loading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final scheme = Theme.of(context).colorScheme;

    return Container(
      decoration: BoxDecoration(
        color: scheme.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
      ),
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 12,
        bottom: MediaQuery.viewInsetsOf(context).bottom + 24,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Handle
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: scheme.outlineVariant,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Title
          Text(l10n.addToRoute,
              style: SmarturStyle.calSansTitle.copyWith(fontSize: 20)),
          const SizedBox(height: 4),
          Text(
            widget.placeName,
            style: TextStyle(
              fontFamily: 'Outfit',
              fontSize: 14,
              color: scheme.onSurfaceVariant,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 16),

          // Existing itineraries list
          if (_loading)
            const Center(child: CircularProgressIndicator())
          else if (_itineraries.isNotEmpty) ...[
            ConstrainedBox(
              constraints: const BoxConstraints(maxHeight: 220),
              child: ListView.separated(
                shrinkWrap: true,
                itemCount: _itineraries.length,
                separatorBuilder: (_, __) => const SizedBox(height: 8),
                itemBuilder: (ctx, i) {
                  final it = _itineraries[i];
                  final isAdding = _addingTo == it.id;
                  return GestureDetector(
                    onTap: isAdding ? null : () => _addToExisting(it),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 12),
                      decoration: BoxDecoration(
                        color: scheme.surfaceContainerHighest
                            .withValues(alpha: 0.5),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                            color: scheme.outlineVariant
                                .withValues(alpha: 0.5)),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.route_rounded,
                              size: 18, color: scheme.primary),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              it.title,
                              style: TextStyle(
                                fontFamily: 'Outfit',
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: scheme.onSurface,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          if (isAdding)
                            const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(
                                  strokeWidth: 2),
                            )
                          else
                            Icon(Icons.add_circle_outline_rounded,
                                size: 20,
                                color: scheme.primary),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 12),
          ],

          // Create new route button
          FilledButton.icon(
            onPressed: _loading || _addingTo != null ? null : _createAndAdd,
            style: FilledButton.styleFrom(
              backgroundColor: scheme.primary,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14)),
            ),
            icon: const Icon(Icons.add_rounded, size: 20),
            label: Text(
              l10n.createNewRoute,
              style: const TextStyle(
                fontFamily: 'Outfit',
                fontWeight: FontWeight.w700,
                fontSize: 15,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
