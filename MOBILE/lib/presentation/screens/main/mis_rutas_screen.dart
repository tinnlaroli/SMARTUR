import 'package:flutter/material.dart';
import 'package:smartur/l10n/app_localizations.dart';

import '../../../core/motion/smartur_routes.dart';
import '../../../core/theme/smartur_theme_extensions.dart';
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
      builder: (ctx) {
        final scheme = Theme.of(ctx).colorScheme;
        return AlertDialog(
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
            style: FilledButton.styleFrom(backgroundColor: scheme.primary),
            child: Text(l10n.misRutasCreate,
                style: const TextStyle(
                    fontFamily: 'Outfit', fontWeight: FontWeight.w700)),
          ),
        ],
        );
      },
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
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _createItinerary,
        backgroundColor: scheme.primary,
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
      return ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
        children: List.generate(5, (_) => const _SkeletonCard()),
      );
    }

    if (_error != null && _itineraries.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.cloud_off_rounded,
                  size: 56,
                  color: scheme.onSurfaceVariant.withValues(alpha: 0.3)),
              const SizedBox(height: 16),
              Text(
                l10n.routesLoadError,
                style: TextStyle(
                    fontFamily: 'Outfit',
                    fontSize: 15,
                    color: scheme.onSurfaceVariant),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 20),
              OutlinedButton.icon(
                onPressed: _load,
                icon: const Icon(Icons.refresh_rounded, size: 18),
                    label: const Text('Reintentar',
                    style: TextStyle(fontFamily: 'Outfit')),
              ),
            ],
          ),
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
          style: FilledButton.styleFrom(backgroundColor: scheme.primary),
          icon: const Icon(Icons.add_rounded, size: 18),
          label: Text(l10n.misRutasCreate,
              style: const TextStyle(
                  fontFamily: 'Outfit', fontWeight: FontWeight.w700)),
        ),
      );
    }

    final withDates = _itineraries.where((it) => it.startDate != null).toList();
    final withoutDates = _itineraries.where((it) => it.startDate == null).toList();

    return RefreshIndicator(
      onRefresh: _load,
      color: scheme.primary,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.only(left: 4, bottom: 12),
            child: Text(
              '${_itineraries.length} ${l10n.misRutasTitle}',
              style: TextStyle(
                fontFamily: 'Outfit',
                fontSize: 13,
                color: scheme.onSurfaceVariant,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          if (withDates.isNotEmpty) ...[
            Padding(
              padding: const EdgeInsets.only(left: 4, bottom: 6),
              child: Text(
                'Con fecha',
                style: TextStyle(
                  fontFamily: 'Outfit',
                  fontSize: 12,
                  color: scheme.onSurfaceVariant.withValues(alpha: 0.7),
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            ...withDates.map((it) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: _ItineraryCard(
                itinerary: it,
                onTap: () => Navigator.push(
                  context,
                  smarturFadeRoute(
                      ItineraryDetailScreen(itinerary: it, isOwner: true)),
                ),
              ),
            )),
          ],
          if (withoutDates.isNotEmpty) ...[
            Padding(
              padding: EdgeInsets.only(left: 4, bottom: 6, top: withDates.isNotEmpty ? 4 : 0),
              child: Text(
                'Sin fecha',
                style: TextStyle(
                  fontFamily: 'Outfit',
                  fontSize: 12,
                  color: scheme.onSurfaceVariant.withValues(alpha: 0.7),
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            ...withoutDates.map((it) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: _ItineraryCard(
                itinerary: it,
                onTap: () => Navigator.push(
                  context,
                  smarturFadeRoute(
                      ItineraryDetailScreen(itinerary: it, isOwner: true)),
                ),
              ),
            )),
          ],
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────

class _ItineraryCard extends StatelessWidget {
  final Itinerary itinerary;
  final VoidCallback onTap;

  const _ItineraryCard({
    required this.itinerary,
    required this.onTap,
  });

  static const _avatarColors = [
    Color(0xFF7C4DFF),
    Color(0xFF448AFF),
    Color(0xFF00BCD4),
    Color(0xFF4CAF50),
    Color(0xFFFF6D00),
    Color(0xFFE91E63),
    Color(0xFF9C27B0),
    Color(0xFF00E676),
    Color(0xFFFFAB00),
    Color(0xFFFF1744),
  ];

  Color _avatarColor(String title) {
    final hash = title.codeUnits.fold<int>(0, (h, c) => h * 31 + c);
    return _avatarColors[hash % _avatarColors.length];
  }

  String _daysAgo(DateTime dt) {
    final diff = DateTime.now().difference(dt).inDays;
    if (diff == 0) return 'Hoy';
    if (diff == 1) return 'Ayer';
    return 'Hace $diff días';
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final l10n = AppLocalizations.of(context)!;
    final color = _avatarColor(itinerary.title);

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: scheme.surface,
          borderRadius: BorderRadius.circular(20),
          border:
              Border.all(color: scheme.outlineVariant.withValues(alpha: 0.4)),
          boxShadow: [
            BoxShadow(
              color: scheme.shadow.withValues(alpha: 0.04),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(16),
              ),
              alignment: Alignment.center,
              child: Text(
                itinerary.title.isNotEmpty
                    ? itinerary.title[0].toUpperCase()
                    : '?',
                style: TextStyle(
                  fontFamily: 'Outfit',
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                  color: color,
                ),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(
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
                      ),
                      if (itinerary.isCertified) ...[
                        const SizedBox(width: 6),
                        Icon(Icons.verified_rounded,
                            size: 16, color: scheme.primary),
                      ],
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(Icons.flag_rounded,
                          size: 14, color: scheme.onSurfaceVariant),
                      const SizedBox(width: 4),
                      Text(
                        l10n.itineraryNStops(itinerary.stops.length),
                        style: TextStyle(
                          fontFamily: 'Outfit',
                          fontSize: 12,
                          color: scheme.onSurfaceVariant,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Icon(Icons.access_time_rounded,
                          size: 14, color: scheme.onSurfaceVariant),
                      const SizedBox(width: 4),
                      Text(
                        _daysAgo(itinerary.createdAt),
                        style: TextStyle(
                          fontFamily: 'Outfit',
                          fontSize: 12,
                          color: scheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            if (itinerary.isPublic)
              Container(
                margin: const EdgeInsets.only(right: 4),
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: SmarturSemanticColors.of(context).leaf.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.public_rounded,
                        size: 12, color: SmarturSemanticColors.of(context).leaf),
                    const SizedBox(width: 4),
                    Text(
                      'Pública',
                      style: TextStyle(
                        fontFamily: 'Outfit',
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                        color: SmarturSemanticColors.of(context).leaf,
                      ),
                    ),
                  ],
                ),
              ),
            Icon(Icons.chevron_right_rounded,
                color: scheme.onSurfaceVariant.withValues(alpha: 0.5)),
          ],
        ),
      ),
    );
  }
}

class _SkeletonCard extends StatelessWidget {
  const _SkeletonCard();

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      height: 84,
      decoration: BoxDecoration(
        color: scheme.surfaceContainerHighest.withValues(alpha: 0.4),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        children: [
          const SizedBox(width: 16),
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: scheme.onSurface.withValues(alpha: 0.06),
              borderRadius: BorderRadius.circular(16),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 140,
                  height: 12,
                  decoration: BoxDecoration(
                    color: scheme.onSurface.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  width: 90,
                  height: 10,
                  decoration: BoxDecoration(
                    color: scheme.onSurface.withValues(alpha: 0.05),
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
