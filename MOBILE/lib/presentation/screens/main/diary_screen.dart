import 'dart:convert';
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:smartur/l10n/app_localizations.dart';

import '../../../core/theme/style_guide.dart';
import '../../../data/services/user_content_service.dart';
import '../../../data/services/explore_service.dart';
import '../../../data/models/place_model.dart';
import '../../utils/diary_place_detail.dart';
import '../../widgets/smartur_background.dart';
import '../../widgets/smartur_skeleton.dart';
import '../explore/detail_view_page.dart';

class DiaryScreen extends StatefulWidget {
  /// En [MainScreen] va a `false` cuando otra pestaña está activa; al volver a
  /// Diario se dispara otra carga (IndexedStack mantiene el estado y a veces la
  /// primera petición corre sin token o queda desactualizada).
  final bool diaryTabActive;

  const DiaryScreen({super.key, this.diaryTabActive = true});

  @override
  State<DiaryScreen> createState() => _DiaryScreenState();
}

class _DiaryScreenState extends State<DiaryScreen> {
  bool _loading = true;
  String? _error;
  List<Map<String, dynamic>> _favorites = [];
  List<Map<String, dynamic>> _visits = [];
  List<Map<String, dynamic>> _sessions = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void didUpdateWidget(DiaryScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (!oldWidget.diaryTabActive && widget.diaryTabActive) {
      _load();
    }
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final svc = UserContentService();
      final fav  = await svc.fetchFavorites();
      final vis  = await svc.fetchVisits(limit: 40);
      final sess = await svc.fetchRecommendationSessions();
      if (mounted) {
        setState(() {
          _favorites = fav;
          _visits    = vis;
          _sessions  = sess;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() { _error = e.toString(); _loading = false; });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final scheme = Theme.of(context).colorScheme;
    return DefaultTabController(
      length: 3,
      child: Scaffold(
        backgroundColor: scheme.surface,
        appBar: AppBar(
          title: Text(l10n.diaryTitle,
              style: SmarturStyle.calSansTitle.copyWith(fontSize: 20)),
          elevation: 0,
          backgroundColor: Colors.transparent,
          surfaceTintColor: Colors.transparent,
          bottom: TabBar(
            indicatorColor: SmarturStyle.purple,
            labelColor: SmarturStyle.purple,
            unselectedLabelColor: scheme.onSurfaceVariant,
            labelStyle: const TextStyle(fontFamily: 'Outfit', fontWeight: FontWeight.w600),
            tabs: [
              Tab(text: l10n.favoritesTab),
              Tab(text: l10n.historyTab),
              const Tab(
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.auto_awesome_rounded, size: 13),
                    SizedBox(width: 4),
                    Text('IA', style: TextStyle(fontFamily: 'Outfit', fontWeight: FontWeight.w600)),
                  ],
                ),
              ),
            ],
          ),
        ),
        body: SmarturBackgroundTop(
          child: _error != null && !_loading
              ? RefreshIndicator(
                  color: SmarturStyle.purple,
                  onRefresh: _load,
                  child: ListView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    children: [
                      Padding(
                        padding: const EdgeInsets.all(24),
                        child: Text(_error!,
                          style: TextStyle(fontFamily: 'Outfit', color: scheme.error)),
                      ),
                    ],
                  ),
                )
              : _loading
                  ? SmarturShimmer(
                      enabled: true,
                      child: ListView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        children: List.generate(8, (_) => const SkeletonListRow()),
                      ),
                    )
                  : TabBarView(
                      children: [
                        _FavoritesTab(items: _favorites, onRefresh: _load),
                        _HistoryTab(items: _visits, onRefresh: _load),
                        _SessionsTab(sessions: _sessions, onRefresh: _load),
                      ],
                    ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Favorites tab
// ─────────────────────────────────────────────────────────────────────────────

class _FavoritesTab extends StatelessWidget {
  final List<Map<String, dynamic>> items;
  final Future<void> Function() onRefresh;

  const _FavoritesTab({required this.items, required this.onRefresh});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    if (items.isEmpty) {
      return RefreshIndicator(
        color: SmarturStyle.purple,
        onRefresh: onRefresh,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: [
            const SizedBox(height: 48),
            Icon(Icons.favorite_border, size: 48, color: scheme.onSurface),
            const SizedBox(height: 16),
            Center(
              child: Text(
                AppLocalizations.of(context)!.noCategoryPlaces,
                textAlign: TextAlign.center,
                style: TextStyle(fontFamily: 'Outfit', color: scheme.onSurface),
              ),
            ),
          ],
        ),
      );
    }
    return RefreshIndicator(
      color: SmarturStyle.purple,
      onRefresh: onRefresh,
      child: GridView.builder(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        itemCount: items.length,
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          childAspectRatio: 3 / 4,
        ),
        itemBuilder: (context, index) {
          final it = items[index];
          final name = it['name']?.toString() ?? '';
          final url = it['image_url']?.toString() ?? '';
          return ClipRRect(
            borderRadius: BorderRadius.circular(18),
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                borderRadius: BorderRadius.circular(18),
                onTap: () => openDiaryItemDetailWithSwipe(context, items, index),
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    if (url.isNotEmpty)
                      Image.network(url, fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) => Container(
                          color: scheme.outlineVariant,
                          child: Icon(Icons.place_outlined, color: scheme.onSurfaceVariant),
                        ),
                      )
                    else
                      Container(color: scheme.outlineVariant,
                        child: Icon(Icons.photo_outlined, color: scheme.onSurfaceVariant)),
                    Align(
                      alignment: Alignment.topRight,
                      child: Padding(
                        padding: const EdgeInsets.all(8),
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.35),
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: const Icon(Icons.favorite, size: 14, color: Colors.white),
                        ),
                      ),
                    ),
                    Positioned(
                      left: 8, right: 8, bottom: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.55),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(name,
                          maxLines: 2, overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontFamily: 'Outfit', fontSize: 12, color: Colors.white)),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// History tab
// ─────────────────────────────────────────────────────────────────────────────

class _HistoryTab extends StatelessWidget {
  final List<Map<String, dynamic>> items;
  final Future<void> Function() onRefresh;

  const _HistoryTab({required this.items, required this.onRefresh});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final l10n = AppLocalizations.of(context)!;
    if (items.isEmpty) {
      return RefreshIndicator(
        color: SmarturStyle.purple,
        onRefresh: onRefresh,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: [
            const SizedBox(height: 48),
            Icon(Icons.history, size: 48, color: scheme.onSurface),
            const SizedBox(height: 16),
            Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 32),
                child: Text(l10n.noCategoryPlaces,
                  textAlign: TextAlign.center,
                  style: TextStyle(fontFamily: 'Outfit', color: scheme.onSurfaceVariant)),
              ),
            ),
          ],
        ),
      );
    }
    return RefreshIndicator(
      color: SmarturStyle.purple,
      onRefresh: onRefresh,
      child: ListView.builder(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(24, 24, 24, 16),
        itemCount: items.length,
        itemBuilder: (context, index) {
          final it = items[index];
          final name = it['name']?.toString() ?? '';
          final visited = it['visited_at'];
          String dateStr = '';
          if (visited is String) {
            final dt = DateTime.tryParse(visited);
            if (dt != null) dateStr = '${dt.day}/${dt.month}/${dt.year}';
          }
          final isLast = index == items.length - 1;
          return Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Column(
                children: [
                  Container(
                    width: 18, height: 18,
                    decoration: BoxDecoration(
                      color: SmarturStyle.purple, shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 2),
                    ),
                    child: const Icon(Icons.check, size: 12, color: Colors.white),
                  ),
                  if (!isLast)
                    Container(width: 2, height: 70, color: scheme.outlineVariant),
                ],
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.only(bottom: 20),
                  child: Material(
                    color: scheme.surfaceContainerLowest,
                    borderRadius: BorderRadius.circular(16),
                    clipBehavior: Clip.antiAlias,
                    child: InkWell(
                      borderRadius: BorderRadius.circular(16),
                      onTap: () => openDiaryItemDetailWithSwipe(context, items, index),
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: scheme.outlineVariant),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(name,
                              style: SmarturStyle.calSansTitle.copyWith(fontSize: 16)),
                            if (dateStr.isNotEmpty) ...[
                              const SizedBox(height: 4),
                              Text(dateStr,
                                style: TextStyle(fontFamily: 'Outfit', fontSize: 12,
                                    color: scheme.onSurfaceVariant)),
                            ],
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// IA Sessions tab — shows recommendation history (from app and from platform)
// ─────────────────────────────────────────────────────────────────────────────

class _SessionsTab extends StatelessWidget {
  final List<Map<String, dynamic>> sessions;
  final Future<void> Function() onRefresh;

  const _SessionsTab({required this.sessions, required this.onRefresh});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    if (sessions.isEmpty) {
      return RefreshIndicator(
        color: SmarturStyle.purple,
        onRefresh: onRefresh,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: [
            const SizedBox(height: 48),
            const Icon(Icons.auto_awesome_outlined, size: 48, color: SmarturStyle.purple),
            const SizedBox(height: 16),
            Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 32),
                child: Column(
                  children: [
                    Text('Sin sesiones de recomendaciones',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontFamily: 'CalSans', fontSize: 16,
                        color: scheme.onSurface,
                      )),
                    const SizedBox(height: 8),
                    Text('Las sesiones generadas desde la app o desde la plataforma web aparecerán aquí.',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontFamily: 'Outfit', fontSize: 12,
                          color: scheme.onSurfaceVariant)),
                  ],
                ),
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      color: SmarturStyle.purple,
      onRefresh: onRefresh,
      child: ListView.builder(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        itemCount: sessions.length,
        itemBuilder: (context, index) {
          final session = sessions[index];
          return _SessionCard(session: session);
        },
      ),
    );
  }
}

class _SessionCard extends StatelessWidget {
  final Map<String, dynamic> session;
  const _SessionCard({required this.session});

  List<Map<String, dynamic>> _parseRecs() {
    final raw = session['context_json'];
    if (raw == null) return [];
    try {
      final Map<String, dynamic> ctx = raw is String ? jsonDecode(raw) : (raw as Map<String, dynamic>);
      final recs = ctx['recommendations'];
      if (recs is List) {
        return recs.map((r) => r is Map ? Map<String, dynamic>.from(r) : <String, dynamic>{}).toList();
      }
    } catch (_) {}
    return [];
  }

  String _formatDate(dynamic raw) {
    if (raw == null) return '';
    final dt = raw is String ? DateTime.tryParse(raw) : null;
    if (dt == null) return '';
    return '${dt.day}/${dt.month}/${dt.year}  ${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final recs = _parseRecs();
    final algorithm = session['best_algorithm']?.toString() ?? 'hybrid';
    final dateStr = _formatDate(session['created_at']);
    final latencyMs = session['execution_time_ms'];
    final recCount = recs.length;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: scheme.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: scheme.outlineVariant),
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: recs.isEmpty
            ? null
            : () => _showSessionDetail(context, recs),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: SmarturStyle.purple.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.auto_awesome_rounded,
                        color: SmarturStyle.purple, size: 16),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '$recCount destinos recomendados',
                          style: SmarturStyle.calSansTitle.copyWith(fontSize: 14),
                        ),
                        if (dateStr.isNotEmpty)
                          Text(dateStr,
                            style: TextStyle(fontFamily: 'Outfit', fontSize: 11,
                                color: scheme.onSurfaceVariant)),
                      ],
                    ),
                  ),
                  if (recs.isNotEmpty)
                    Icon(Icons.chevron_right_rounded,
                        color: scheme.onSurfaceVariant, size: 20),
                ],
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 6, runSpacing: 4,
                children: [
                  _InfoChip(
                    icon: Icons.psychology_outlined,
                    label: algorithm,
                    color: SmarturStyle.purple,
                  ),
                  if (latencyMs != null)
                    _InfoChip(
                      icon: Icons.speed_outlined,
                      label: '${latencyMs}ms',
                      color: scheme.onSurfaceVariant,
                    ),
                ],
              ),
              // Preview of first 3 recommendation names
              if (recs.isNotEmpty) ...[
                const SizedBox(height: 8),
                ...recs.take(3).map((r) {
                  final name = r['title'] ?? r['name'] ?? r['item_id'] ?? '';
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 2),
                    child: Row(
                      children: [
                        Container(width: 4, height: 4,
                          decoration: BoxDecoration(
                            color: SmarturStyle.purple.withValues(alpha: 0.5),
                            shape: BoxShape.circle,
                          )),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(name.toString(),
                            style: TextStyle(fontFamily: 'Outfit', fontSize: 11,
                                color: scheme.onSurface.withValues(alpha: 0.7)),
                            maxLines: 1, overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  );
                }),
                if (recs.length > 3)
                  Padding(
                    padding: const EdgeInsets.only(top: 2),
                    child: Text('+${recs.length - 3} más',
                      style: TextStyle(fontFamily: 'Outfit', fontSize: 10,
                          color: SmarturStyle.purple.withValues(alpha: 0.7))),
                  ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  void _showSessionDetail(BuildContext context, List<Map<String, dynamic>> recs) {
    // Re-open the recommendation results sheet with the session's recs
    // Uses the same _ResultsSheet from recommendation_screen but without places lookup
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _SessionReplaySheet(recs: recs),
    );
  }
}

class _InfoChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  const _InfoChip({required this.icon, required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 11, color: color.withValues(alpha: 0.8)),
          const SizedBox(width: 4),
          Text(label,
            style: TextStyle(fontFamily: 'Outfit', fontSize: 10,
                fontWeight: FontWeight.w600, color: color.withValues(alpha: 0.8))),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Session replay bottom sheet — shows recommendations from a saved session
// ─────────────────────────────────────────────────────────────────────────────

class _SessionReplaySheet extends StatefulWidget {
  final List<Map<String, dynamic>> recs;
  const _SessionReplaySheet({required this.recs});

  @override
  State<_SessionReplaySheet> createState() => _SessionReplaySheetState();
}

class _SessionReplaySheetState extends State<_SessionReplaySheet> {
  Map<String, Place> _placesMap = {};
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadPlaces();
  }

  Future<void> _loadPlaces() async {
    try {
      final cities = await ExploreService().fetchCities();
      final map = <String, Place>{};
      for (final city in cities) {
        for (final place in city.places) {
          map[place.id] = place;
        }
      }
      if (mounted) setState(() { _placesMap = map; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final navContext = context;
    return DraggableScrollableSheet(
      initialChildSize: 0.92,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (ctx, controller) => ClipRRect(
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
          child: Container(
            decoration: BoxDecoration(
              color: scheme.surface.withValues(alpha: 0.96),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
              border: Border(top: BorderSide(color: scheme.outline.withValues(alpha: 0.15))),
            ),
            child: Column(
              children: [
                const SizedBox(height: 12),
                Container(width: 36, height: 4,
                  decoration: BoxDecoration(
                    color: scheme.outlineVariant, borderRadius: BorderRadius.circular(2))),
                const SizedBox(height: 16),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: SmarturStyle.purple.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.history_rounded, color: SmarturStyle.purple, size: 18),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('${widget.recs.length} destinos de esta sesión',
                              style: SmarturStyle.calSansTitle.copyWith(fontSize: 18)),
                            Text('Toca un destino para ver más',
                              style: TextStyle(fontFamily: 'Outfit', fontSize: 11,
                                  color: scheme.onSurface.withValues(alpha: 0.5))),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close_rounded),
                        onPressed: () => Navigator.pop(ctx),
                        color: scheme.onSurface.withValues(alpha: 0.6),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                if (_loading)
                  const Expanded(
                    child: Center(child: CircularProgressIndicator(color: SmarturStyle.purple)),
                  )
                else
                  Expanded(
                    child: ListView.builder(
                      controller: controller,
                      padding: const EdgeInsets.fromLTRB(16, 4, 16, 32),
                      itemCount: widget.recs.length,
                      itemBuilder: (c, i) {
                        final rec = widget.recs[i];
                        final itemId = (rec['item_id'] ?? '').toString();
                        final place = _placesMap[itemId];
                        final name = place?.name ?? rec['title'] ?? rec['name'] ?? 'Destino ${i + 1}';
                        final imageUrl = place?.imageUrl ?? '';
                        final city = place?.city ?? '';
                        final tags = (rec['reason_tags'] as List?)?.map((t) => t.toString()).toList() ?? [];
                        final score = (rec['score'] as num?)?.toDouble() ?? 0.0;
                        return Container(
                          margin: const EdgeInsets.only(bottom: 10),
                          decoration: BoxDecoration(
                            color: scheme.surfaceContainerHighest.withValues(alpha: 0.45),
                            borderRadius: BorderRadius.circular(18),
                            border: Border.all(color: scheme.outline.withValues(alpha: 0.1)),
                          ),
                          clipBehavior: Clip.antiAlias,
                          child: InkWell(
                            borderRadius: BorderRadius.circular(18),
                            onTap: place == null ? null : () {
                              Navigator.pop(ctx);
                              Navigator.push(
                                navContext,
                                MaterialPageRoute(
                                  builder: (_) => DetailViewPage(
                                    title: place.name,
                                    heroTag: 'session_replay_$itemId',
                                    heroImageUrl: place.imageUrl,
                                    subtitle: place.description,
                                    locationLine: place.locationLine,
                                    rating: place.rating,
                                    galleryUrls: place.galleryUrls,
                                    placeId: place.id,
                                  ),
                                ),
                              );
                            },
                            child: Row(
                              children: [
                                // Thumbnail
                                if (imageUrl.isNotEmpty)
                                  ClipRRect(
                                    borderRadius: const BorderRadius.only(
                                      topLeft: Radius.circular(18),
                                      bottomLeft: Radius.circular(18),
                                    ),
                                    child: Image.network(imageUrl,
                                      width: 80, height: 80, fit: BoxFit.cover,
                                      errorBuilder: (_, __, ___) => Container(
                                        width: 80, height: 80,
                                        color: SmarturStyle.purple.withValues(alpha: 0.1),
                                        child: const Icon(Icons.landscape_outlined, color: Colors.white38),
                                      ),
                                    ),
                                  )
                                else
                                  Container(
                                    width: 80, height: 80,
                                    decoration: BoxDecoration(
                                      color: SmarturStyle.purple.withValues(alpha: 0.1),
                                      borderRadius: const BorderRadius.only(
                                        topLeft: Radius.circular(18),
                                        bottomLeft: Radius.circular(18),
                                      ),
                                    ),
                                    child: Center(
                                      child: Text('#${i + 1}',
                                        style: SmarturStyle.calSansTitle.copyWith(
                                            fontSize: 18, color: SmarturStyle.purple.withValues(alpha: 0.5))),
                                    ),
                                  ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Padding(
                                    padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          children: [
                                            Expanded(
                                              child: Text(name,
                                                style: SmarturStyle.calSansTitle.copyWith(fontSize: 13),
                                                maxLines: 1, overflow: TextOverflow.ellipsis),
                                            ),
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                              decoration: BoxDecoration(
                                                color: SmarturStyle.orange.withValues(alpha: 0.15),
                                                borderRadius: BorderRadius.circular(8),
                                              ),
                                              child: Text(score.toStringAsFixed(2),
                                                style: const TextStyle(fontFamily: 'Outfit', fontSize: 10,
                                                    fontWeight: FontWeight.w700, color: SmarturStyle.orange)),
                                            ),
                                          ],
                                        ),
                                        if (city.isNotEmpty) ...[
                                          const SizedBox(height: 2),
                                          Text(city,
                                            style: TextStyle(fontFamily: 'Outfit', fontSize: 10,
                                                color: scheme.onSurfaceVariant)),
                                        ],
                                        if (tags.isNotEmpty) ...[
                                          const SizedBox(height: 4),
                                          Wrap(
                                            spacing: 4, runSpacing: 2,
                                            children: tags.take(3).map((t) => Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                              decoration: BoxDecoration(
                                                color: SmarturStyle.purple.withValues(alpha: 0.08),
                                                borderRadius: BorderRadius.circular(8),
                                              ),
                                              child: Text(t,
                                                style: const TextStyle(fontFamily: 'Outfit', fontSize: 9,
                                                    color: SmarturStyle.purple)),
                                            )).toList(),
                                          ),
                                        ],
                                      ],
                                    ),
                                  ),
                                ),
                                if (place != null)
                                  const Padding(
                                    padding: EdgeInsets.only(right: 8),
                                    child: Icon(Icons.chevron_right_rounded,
                                        color: SmarturStyle.purple, size: 20),
                                  ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
