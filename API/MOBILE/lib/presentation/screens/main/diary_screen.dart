import 'package:flutter/material.dart';
import 'package:smartur/l10n/app_localizations.dart';

import '../../../core/theme/style_guide.dart';
import '../../../data/services/user_content_service.dart';
import '../../utils/diary_place_detail.dart';
import '../../widgets/smartur_background.dart';
import '../../widgets/smartur_skeleton.dart';

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
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final svc = UserContentService();
      final fav = await svc.fetchFavorites();
      final vis = await svc.fetchVisits(limit: 40);
      if (mounted) {
        setState(() {
          _favorites = fav;
          _visits = vis;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _loading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final scheme = Theme.of(context).colorScheme;
    return DefaultTabController(
      length: 2,
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
                        child: Text(
                          _error!,
                          style: TextStyle(
                            fontFamily: 'Outfit',
                            color: scheme.error,
                          ),
                        ),
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
                        children: List.generate(
                          8,
                          (_) => const SkeletonListRow(),
                        ),
                      ),
                    )
                  : TabBarView(
                      children: [
                        _FavoritesTab(items: _favorites, onRefresh: _load),
                        _HistoryTab(items: _visits, onRefresh: _load),
                      ],
                    ),
        ),
      ),
    );
  }
}

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
                Image.network(
                  url,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) => Container(
                    color: scheme.outlineVariant,
                    child: Icon(Icons.place_outlined, color: scheme.onSurfaceVariant),
                  ),
                )
              else
                Container(
                  color: scheme.outlineVariant,
                  child: Icon(Icons.photo_outlined, color: scheme.onSurfaceVariant),
                ),
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
                left: 8,
                right: 8,
                bottom: 8,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.55),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    name,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontFamily: 'Outfit',
                      fontSize: 12,
                      color: Colors.white,
                    ),
                  ),
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
                child: Text(
                  l10n.noCategoryPlaces,
                  textAlign: TextAlign.center,
                  style: TextStyle(fontFamily: 'Outfit', color: scheme.onSurfaceVariant),
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
        padding: const EdgeInsets.fromLTRB(24, 24, 24, 16),
        itemCount: items.length,
        itemBuilder: (context, index) {
          final it = items[index];
          final name = it['name']?.toString() ?? '';
          final visited = it['visited_at'];
          String dateStr = '';
          if (visited is String) {
            final dt = DateTime.tryParse(visited);
            if (dt != null) {
              dateStr = '${dt.day}/${dt.month}/${dt.year}';
            }
          }
          final isLast = index == items.length - 1;
          return Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Column(
                children: [
                  Container(
                    width: 18,
                    height: 18,
                    decoration: BoxDecoration(
                      color: SmarturStyle.purple,
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 2),
                    ),
                    child: const Icon(Icons.check, size: 12, color: Colors.white),
                  ),
                  if (!isLast)
                    Container(
                      width: 2,
                      height: 70,
                      color: scheme.outlineVariant,
                    ),
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
                            Text(
                              name,
                              style: SmarturStyle.calSansTitle.copyWith(fontSize: 16),
                            ),
                            if (dateStr.isNotEmpty) ...[
                              const SizedBox(height: 4),
                              Text(
                                dateStr,
                                style: TextStyle(
                                  fontFamily: 'Outfit',
                                  fontSize: 12,
                                  color: scheme.onSurfaceVariant,
                                ),
                              ),
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
