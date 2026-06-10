import 'package:flutter/material.dart';
import 'package:smartur/l10n/app_localizations.dart';

import '../../../core/motion/smartur_routes.dart';
import '../../../core/theme/style_guide.dart';
import '../../../core/utils/notifications.dart';
import '../../../data/local/itinerary_db.dart';
import '../../../data/models/itinerary_model.dart';
import '../../../data/services/auth_service.dart';
import '../../../data/services/itinerary_service.dart';
import '../../widgets/smartur_background.dart';
import '../../widgets/smartur_ui_kit.dart';
import '../itinerary/itinerary_detail_screen.dart';
import '../itinerary/planner_screen.dart';
import 'main_screen.dart' show routeStopCount;

class MisRutasScreen extends StatefulWidget {
  const MisRutasScreen({super.key});

  @override
  State<MisRutasScreen> createState() => _MisRutasScreenState();
}

class _MisRutasScreenState extends State<MisRutasScreen> {
  List<Itinerary> _itineraries = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final list = await ItineraryService().fetchMyItineraries();
      if (mounted) {
        setState(() {
          _itineraries = list;
          _loading = false;
        });
        if (list.isNotEmpty) {
          routeStopCount.value = list.first.stops.length;
        }
        await ItineraryDB.saveItineraries(list);
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _loading = false;
        });
        // Offline fallback
        try {
          final userId = await AuthService().getUserId();
          if (userId != null) {
            final cached = await ItineraryDB.getMyItineraries(userId);
            if (cached.isNotEmpty && mounted) {
              setState(() {
                _itineraries = cached;
                _error = null;
              });
            }
          }
        } catch (_) {}
      }
    }
  }

  Future<void> _createItinerary() async {
    final l10n = AppLocalizations.of(context)!;
    final ctrl = TextEditingController();
    final name = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(l10n.plannerRouteName,
            style: SmarturStyle.calSansTitle.copyWith(fontSize: 18)),
        content: TextField(
          controller: ctrl,
          autofocus: true,
          textCapitalization: TextCapitalization.sentences,
          decoration: InputDecoration(hintText: l10n.plannerRouteNameHint),
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
            style: FilledButton.styleFrom(backgroundColor: SmarturStyle.purple),
            child: Text(l10n.misRutasCreate,
                style: const TextStyle(
                    fontFamily: 'Outfit', fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
    if (name == null || name.isEmpty || !mounted) return;
    try {
      final it = await ItineraryService().createItinerary(title: name);
      await ItineraryDB.saveItinerary(it);
      if (mounted) {
        await Navigator.push(
          context,
          smarturFadeRoute(PlannerScreen(itinerary: it)),
        );
        _load();
      }
    } catch (e) {
      if (mounted) {
        SmarturNotifications.showError(context, e.toString());
      }
    }
  }

  Future<void> _openItinerary(Itinerary it) async {
    await Navigator.push(
      context,
      smarturFadeRoute(PlannerScreen(itinerary: it)),
    );
    _load();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final scheme = Theme.of(context).colorScheme;

    return Scaffold(
      backgroundColor: scheme.surface,
      appBar: AppBar(
        title: Text(l10n.misRutasTitle,
            style: SmarturStyle.calSansTitle.copyWith(fontSize: 20)),
        elevation: 0,
        backgroundColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _load,
            tooltip: 'Actualizar',
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _createItinerary,
        backgroundColor: SmarturStyle.purple,
        icon: const Icon(Icons.add_rounded, color: Colors.white),
        label: Text(
          l10n.misRutasCreate,
          style: const TextStyle(
              fontFamily: 'Outfit',
              fontWeight: FontWeight.w700,
              color: Colors.white),
        ),
      ),
      body: SmarturBackgroundTop(
        child: _buildBody(l10n, scheme),
      ),
    );
  }

  Widget _buildBody(AppLocalizations l10n, ColorScheme scheme) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null && _itineraries.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.cloud_off_rounded,
                size: 48,
                color: scheme.onSurfaceVariant.withValues(alpha: 0.4)),
            const SizedBox(height: 12),
            Text(
              l10n.routesLoadError,
              style: TextStyle(
                  fontFamily: 'Outfit',
                  fontSize: 14,
                  color: scheme.onSurfaceVariant),
            ),
            const SizedBox(height: 16),
            OutlinedButton.icon(
              onPressed: _load,
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('Reintentar',
                  style: TextStyle(fontFamily: 'Outfit')),
            ),
          ],
        ),
      );
    }

    if (_itineraries.isEmpty) {
      return SmarturEmptyState(
        icon: Icons.route_rounded,
        title: l10n.misRutasEmptyTitle,
        subtitle: l10n.misRutasEmptySubtitle,
        action: FilledButton.icon(
          onPressed: _createItinerary,
          style: FilledButton.styleFrom(backgroundColor: SmarturStyle.purple),
          icon: const Icon(Icons.add_rounded, size: 18),
          label: Text(l10n.misRutasCreate,
              style: const TextStyle(
                  fontFamily: 'Outfit', fontWeight: FontWeight.w700)),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _load,
      color: SmarturStyle.purple,
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
        itemCount: _itineraries.length,
        separatorBuilder: (_, __) => const SizedBox(height: 10),
        itemBuilder: (context, i) {
          final it = _itineraries[i];
          return _ItineraryCard(
            itinerary: it,
            onTap: () => _openItinerary(it),
            onDetail: () => Navigator.push(
              context,
              smarturFadeRoute(
                  ItineraryDetailScreen(itinerary: it, isOwner: true)),
            ),
          );
        },
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────

class _ItineraryCard extends StatelessWidget {
  final Itinerary itinerary;
  final VoidCallback onTap;
  final VoidCallback onDetail;

  const _ItineraryCard({
    required this.itinerary,
    required this.onTap,
    required this.onDetail,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final l10n = AppLocalizations.of(context)!;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: scheme.surfaceContainerHighest.withValues(alpha: 0.5),
          borderRadius: BorderRadius.circular(20),
          border:
              Border.all(color: scheme.outlineVariant.withValues(alpha: 0.5)),
        ),
        child: Row(
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: SmarturStyle.purple.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(14),
              ),
              alignment: Alignment.center,
              child: Icon(
                itinerary.isPublic
                    ? Icons.public_rounded
                    : Icons.route_rounded,
                color: SmarturStyle.purple,
                size: 28,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    itinerary.title,
                    style: TextStyle(
                      fontFamily: 'Outfit',
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: scheme.onSurface,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    l10n.itineraryNStops(itinerary.stops.length),
                    style: TextStyle(
                      fontFamily: 'Outfit',
                      fontSize: 13,
                      color: scheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
            IconButton(
              icon: Icon(Icons.open_in_new_rounded,
                  size: 18, color: scheme.onSurfaceVariant),
              onPressed: onDetail,
              tooltip: l10n.itineraryDetail,
            ),
            Icon(Icons.chevron_right_rounded,
                color: scheme.onSurfaceVariant),
          ],
        ),
      ),
    );
  }
}
