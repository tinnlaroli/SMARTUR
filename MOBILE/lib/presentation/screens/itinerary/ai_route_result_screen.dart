import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

import '../../../core/motion/smartur_routes.dart';
import '../../../core/theme/smartur_theme_extensions.dart';
import '../../../core/theme/style_guide.dart';
import '../../../data/local/itinerary_db.dart';
import '../../../data/models/itinerary_model.dart';
import '../../../data/services/ai_route_service.dart';
import 'planner_screen.dart';

// ─────────────────────────────────────────────────────────────────────────────

class AiRouteResultScreen extends StatefulWidget {
  final AiRouteResult result;

  const AiRouteResultScreen({super.key, required this.result});

  @override
  State<AiRouteResultScreen> createState() => _AiRouteResultScreenState();
}

class _AiRouteResultScreenState extends State<AiRouteResultScreen> {
  late AiRouteResult _result;

  @override
  void initState() {
    super.initState();
    _result = widget.result;
    ItineraryDB.saveItinerary(_result.itinerary);
  }

  // Map ML recommendations to reason_tags by matching place_id
  List<String> _reasonTagsFor(ItineraryStop stop) {
    for (final rec in _result.recommendations) {
      final raw = rec['item_id']?.toString() ?? '';
      final parts = raw.split('_');
      if (parts.length < 2) continue;
      final id = int.tryParse(parts.last);
      final kind = parts.sublist(0, parts.length - 1).join('_');
      if (id == stop.placeId && kind == stop.placeKind) {
        final tags = rec['reason_tags'];
        if (tags is List) return tags.map((t) => t.toString()).toList();
      }
    }
    // Fallback: use notes (set during stop creation)
    if (stop.notes?.isNotEmpty == true) {
      return stop.notes!.split(' · ');
    }
    return [];
  }

  double _scoreFor(ItineraryStop stop) {
    for (final rec in _result.recommendations) {
      final raw = rec['item_id']?.toString() ?? '';
      final parts = raw.split('_');
      if (parts.length < 2) continue;
      final id = int.tryParse(parts.last);
      final kind = parts.sublist(0, parts.length - 1).join('_');
      if (id == stop.placeId && kind == stop.placeKind) {
        return (rec['score'] as num?)?.toDouble() ?? 0.0;
      }
    }
    return 0.0;
  }

  Future<void> _save() async {
    Navigator.of(context).pop();
  }

  Future<void> _edit() async {
    await Navigator.of(context).push(
      smarturFadeRoute(PlannerScreen(itinerary: _result.itinerary)),
    );
    // After editing, pop result screen (MisRutasScreen will refresh)
    if (mounted) Navigator.of(context).pop(true);
  }

  LatLng _centroid(List<LatLng> pts) {
    final lat = pts.map((p) => p.latitude).reduce((a, b) => a + b) / pts.length;
    final lng = pts.map((p) => p.longitude).reduce((a, b) => a + b) / pts.length;
    return LatLng(lat, lng);
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final sem = SmarturSemanticColors.of(context);
    final it = _result.itinerary;
    final opt = _result.optimize;

    return Scaffold(
      backgroundColor: scheme.surface,
      body: CustomScrollView(
        slivers: [
          _buildHero(scheme, sem, it),
          if (opt.savingsPct > 0) _buildMetricsBanner(scheme, opt),
          _buildMapSection(scheme, sem, it),
          _buildStopsHeader(scheme),
          _buildStopsList(scheme, sem, it),
          const SliverToBoxAdapter(child: SizedBox(height: 120)),
        ],
      ),
      bottomNavigationBar: _buildBottomBar(scheme),
    );
  }

  // ── Hero ─────────────────────────────────────────────────────────────────

  SliverAppBar _buildHero(ColorScheme scheme, SmarturSemanticColors sem, Itinerary it) {
    return SliverAppBar(
      expandedHeight: 180,
      pinned: true,
      backgroundColor: scheme.surface,
      surfaceTintColor: Colors.transparent,
      leading: IconButton(
        icon: Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.2),
            shape: BoxShape.circle,
          ),
          child: const Icon(Icons.arrow_back_ios_new_rounded,
              color: Colors.white, size: 16),
        ),
        onPressed: () => Navigator.pop(context),
      ),
      flexibleSpace: FlexibleSpaceBar(
        background: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                SmarturStyle.purple,
                sem.sea,
              ],
            ),
          ),
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 48, 20, 20),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.end,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // AI badge
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                          color: Colors.white.withValues(alpha: 0.4)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.auto_awesome_rounded,
                            color: Colors.white, size: 13),
                        const SizedBox(width: 5),
                        Text(
                          'Generado con IA · ${it.stops.length} paradas',
                          style: const TextStyle(
                            fontFamily: 'Outfit',
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    it.title,
                    style: SmarturStyle.calSansTitle.copyWith(
                      fontSize: 20,
                      color: Colors.white,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  // ── Metrics banner ───────────────────────────────────────────────────────

  SliverToBoxAdapter _buildMetricsBanner(ColorScheme scheme, OptimizeResult opt) {
    return SliverToBoxAdapter(
      child: Container(
        margin: const EdgeInsets.fromLTRB(16, 16, 16, 0),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: scheme.primary.withValues(alpha: 0.06),
          borderRadius: BorderRadius.circular(16),
          border:
              Border.all(color: scheme.primary.withValues(alpha: 0.18)),
        ),
        child: Row(
          children: [
            _MetricChip(
              icon: Icons.route_rounded,
              label: '${opt.originalDistanceKm.toStringAsFixed(1)} km',
              sub: 'original',
              color: scheme.onSurfaceVariant,
            ),
            Icon(Icons.arrow_forward_rounded,
                color: scheme.primary, size: 16),
            _MetricChip(
              icon: Icons.route_rounded,
              label: '${opt.optimizedDistanceKm.toStringAsFixed(1)} km',
              sub: 'optimizada',
              color: scheme.primary,
            ),
            const Spacer(),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: const Color(0xFF10B981).withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.savings_outlined,
                      color: Color(0xFF10B981), size: 14),
                  const SizedBox(width: 4),
                  Text(
                    '−${opt.savingsPct}%',
                    style: const TextStyle(
                      fontFamily: 'Outfit',
                      fontWeight: FontWeight.w700,
                      fontSize: 13,
                      color: Color(0xFF10B981),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Map ──────────────────────────────────────────────────────────────────

  SliverToBoxAdapter _buildMapSection(
      ColorScheme scheme, SmarturSemanticColors sem, Itinerary it) {
    final valid = it.stops
        .where((s) => s.placeLat != null && s.placeLon != null)
        .toList();

    if (valid.isEmpty) {
      return const SliverToBoxAdapter(child: SizedBox.shrink());
    }

    final points = valid.map((s) => LatLng(s.placeLat!, s.placeLon!)).toList();
    final center = _centroid(points);
    final isDark = scheme.brightness == Brightness.dark;

    return SliverToBoxAdapter(
      child: Container(
        height: 240,
        margin: const EdgeInsets.fromLTRB(16, 16, 16, 0),
        clipBehavior: Clip.antiAlias,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          border:
              Border.all(color: scheme.outlineVariant.withValues(alpha: 0.4)),
        ),
        child: FlutterMap(
          options: MapOptions(
            initialCenter: center,
            initialZoom: 12,
            interactionOptions: const InteractionOptions(
              flags: InteractiveFlag.pinchZoom | InteractiveFlag.drag,
            ),
          ),
          children: [
            TileLayer(
              urlTemplate: isDark
                  ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
                  : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
              subdomains: isDark ? const ['a', 'b', 'c'] : const [],
              userAgentPackageName: 'com.smartur.app',
            ),
            if (points.length > 1)
              PolylineLayer(
                polylines: [
                  Polyline(
                    points: points,
                    color: SmarturStyle.purple.withValues(alpha: 0.75),
                    strokeWidth: 3.5,
                  ),
                ],
              ),
            MarkerLayer(
              markers: [
                for (var i = 0; i < valid.length; i++)
                  Marker(
                    point: LatLng(valid[i].placeLat!, valid[i].placeLon!),
                    width: i == 0 || i == valid.length - 1 ? 38 : 32,
                    height: i == 0 || i == valid.length - 1 ? 38 : 32,
                    child: Container(
                      decoration: BoxDecoration(
                        color: i == 0
                            ? sem.leaf
                            : i == valid.length - 1
                                ? sem.ember
                                : SmarturStyle.purple,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.25),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                        border: Border.all(color: Colors.white, width: 2.5),
                      ),
                      alignment: Alignment.center,
                      child: i == 0 || i == valid.length - 1
                          ? const Icon(Icons.flag_rounded,
                              color: Colors.white, size: 16)
                          : Text(
                              '${i + 1}',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 12,
                                fontWeight: FontWeight.w800,
                                fontFamily: 'Outfit',
                              ),
                            ),
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // ── Stops header ─────────────────────────────────────────────────────────

  SliverToBoxAdapter _buildStopsHeader(ColorScheme scheme) {
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 24, 20, 8),
        child: Row(
          children: [
            Text('Paradas',
                style: SmarturStyle.calSansTitle.copyWith(fontSize: 18)),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: scheme.primary.withValues(alpha: 0.10),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                '${_result.itinerary.stops.length}',
                style: TextStyle(
                  fontFamily: 'Outfit',
                  fontWeight: FontWeight.w700,
                  fontSize: 12,
                  color: scheme.primary,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Stops list ───────────────────────────────────────────────────────────

  SliverList _buildStopsList(
      ColorScheme scheme, SmarturSemanticColors sem, Itinerary it) {
    return SliverList(
      delegate: SliverChildBuilderDelegate(
        (context, i) {
          final stop = it.stops[i];
          final tags = _reasonTagsFor(stop);
          final score = _scoreFor(stop);
          final isLast = i == it.stops.length - 1;
          return _StopCard(
            index: i,
            stop: stop,
            reasonTags: tags,
            score: score,
            isLast: isLast,
            scheme: scheme,
            sem: sem,
          );
        },
        childCount: it.stops.length,
      ),
    );
  }

  // ── Bottom bar ───────────────────────────────────────────────────────────

  Widget _buildBottomBar(ColorScheme scheme) {
    return Container(
      padding: EdgeInsets.fromLTRB(
          16, 12, 16, 12 + MediaQuery.of(context).padding.bottom),
      decoration: BoxDecoration(
        color: scheme.surface,
        border:
            Border(top: BorderSide(color: scheme.outlineVariant.withValues(alpha: 0.3))),
      ),
      child: Row(
        children: [
          // Edit
          OutlinedButton.icon(
            onPressed: _edit,
            icon: const Icon(Icons.edit_rounded, size: 17),
            label: const Text('Editar',
                style: TextStyle(fontFamily: 'Outfit', fontWeight: FontWeight.w600)),
            style: OutlinedButton.styleFrom(
              foregroundColor: scheme.onSurface,
              side: BorderSide(color: scheme.outlineVariant),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              shape:
                  RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
          ),
          const SizedBox(width: 10),
          // Done — route is already saved server-side and locally
          Expanded(
            child: FilledButton.icon(
              onPressed: _save,
              icon: const Icon(Icons.check_rounded, color: Colors.white, size: 18),
              label: const Text(
                'Listo',
                style: TextStyle(
                  fontFamily: 'Outfit',
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
              style: FilledButton.styleFrom(
                backgroundColor: SmarturStyle.purple,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14)),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Stop card with AI reason tags
// ─────────────────────────────────────────────────────────────────────────────

class _StopCard extends StatelessWidget {
  final int index;
  final ItineraryStop stop;
  final List<String> reasonTags;
  final double score;
  final bool isLast;
  final ColorScheme scheme;
  final SmarturSemanticColors sem;

  const _StopCard({
    required this.index,
    required this.stop,
    required this.reasonTags,
    required this.score,
    required this.isLast,
    required this.scheme,
    required this.sem,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 0),
      child: IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Timeline column
            Column(
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: index == 0
                        ? sem.leaf
                        : isLast
                            ? sem.ember
                            : SmarturStyle.purple,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: SmarturStyle.purple.withValues(alpha: 0.25),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  alignment: Alignment.center,
                  child: index == 0 || isLast
                      ? const Icon(Icons.flag_rounded,
                          color: Colors.white, size: 14)
                      : Text(
                          '${index + 1}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.w800,
                            fontFamily: 'Outfit',
                          ),
                        ),
                ),
                if (!isLast)
                  Expanded(
                    child: Container(
                      width: 2,
                      margin: const EdgeInsets.symmetric(vertical: 4),
                      color: scheme.outlineVariant.withValues(alpha: 0.4),
                    ),
                  ),
              ],
            ),

            const SizedBox(width: 14),

            // Content
            Expanded(
              child: Padding(
                padding: EdgeInsets.only(bottom: isLast ? 8 : 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Place name + score
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            stop.placeName.isNotEmpty
                                ? stop.placeName
                                : 'Parada ${index + 1}',
                            style: TextStyle(
                              fontFamily: 'Outfit',
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                              color: scheme.onSurface,
                            ),
                          ),
                        ),
                        if (score > 0)
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: SmarturStyle.purple.withValues(alpha: 0.10),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.star_rounded,
                                    size: 12, color: SmarturStyle.purple),
                                const SizedBox(width: 3),
                                Text(
                                  score.toStringAsFixed(1),
                                  style: TextStyle(
                                    fontFamily: 'Outfit',
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                    color: SmarturStyle.purple,
                                  ),
                                ),
                              ],
                            ),
                          ),
                      ],
                    ),

                    // Kind badge
                    const SizedBox(height: 4),
                    Text(
                      stop.placeKind == 'poi' ? '📍 Punto de interés' : '🏪 Servicio turístico',
                      style: TextStyle(
                        fontFamily: 'Outfit',
                        fontSize: 12,
                        color: scheme.onSurfaceVariant,
                      ),
                    ),

                    // Reason tags
                    if (reasonTags.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 6,
                        runSpacing: 6,
                        children: reasonTags
                            .take(3)
                            .map((tag) => Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 9, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: SmarturStyle.purple
                                        .withValues(alpha: 0.08),
                                    borderRadius: BorderRadius.circular(20),
                                    border: Border.all(
                                        color: SmarturStyle.purple
                                            .withValues(alpha: 0.20)),
                                  ),
                                  child: Text(
                                    tag,
                                    style: TextStyle(
                                      fontFamily: 'Outfit',
                                      fontSize: 11,
                                      fontWeight: FontWeight.w500,
                                      color: SmarturStyle.purple,
                                    ),
                                  ),
                                ))
                            .toList(),
                      ),
                    ],
                    const SizedBox(height: 8),
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
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

class _MetricChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final String sub;
  final Color color;

  const _MetricChip({
    required this.icon,
    required this.label,
    required this.sub,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label,
              style: TextStyle(
                fontFamily: 'Outfit',
                fontWeight: FontWeight.w700,
                fontSize: 14,
                color: color,
              )),
          Text(sub,
              style: TextStyle(
                fontFamily: 'Outfit',
                fontSize: 11,
                color: color.withValues(alpha: 0.7),
              )),
        ],
      ),
    );
  }
}
