import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';

import '../../core/motion/smartur_routes.dart';
import '../../core/theme/style_guide.dart';
import '../../data/services/user_content_service.dart';
import '../screens/explore/detail_view_page.dart';
import '../widgets/add_to_route_sheet.dart';

/// Construye `placeId` tipo `svc_12` / `poi_34` desde un ítem de favoritos o visitas API.
String? placeIdFromDiaryItem(Map<String, dynamic> it) {
  final k = it['place_kind']?.toString();
  final raw = it['place_id'];
  final id = raw is int ? raw : int.tryParse(raw?.toString() ?? '');
  if (k == null || id == null) return null;
  if (k == 'svc') return 'svc_$id';
  if (k == 'poi') return 'poi_$id';
  return null;
}

/// Datos necesarios para abrir un DetailViewPage desde un ítem del diario.
_DetailParams _buildParams(Map<String, dynamic> it) {
  final pid = placeIdFromDiaryItem(it);
  final name = it['name']?.toString() ?? '';
  final imageUrl = it['image_url']?.toString() ?? '';
  final desc = it['description']?.toString() ??
      it['short_description']?.toString() ??
      '';
  final locParts = <String>[
    if (it['location_line'] != null) it['location_line'].toString(),
    if (it['city'] != null) it['city'].toString(),
  ].where((s) => s.trim().isNotEmpty).toList();
  final locationLine = locParts.isNotEmpty ? locParts.join(' · ') : ' ';
  final rating = (it['rating'] is num)
      ? (it['rating'] as num).toDouble()
      : double.tryParse(it['rating']?.toString() ?? '') ?? 0.0;

  List<String> gallery = [];
  final g = it['gallery_urls'];
  if (g is List) {
    gallery = g.map((e) => e.toString()).where((s) => s.isNotEmpty).toList();
  }
  if (gallery.isEmpty && imageUrl.isNotEmpty) {
    gallery = [imageUrl];
  }

  final heroKey = pid ?? 'noid_${name.hashCode}';

  return _DetailParams(
    name: name,
    heroKey: heroKey,
    imageUrl: imageUrl,
    desc: desc,
    locationLine: locationLine,
    rating: rating,
    gallery: gallery,
    pid: pid,
  );
}

class _DetailParams {
  final String name;
  final String heroKey;
  final String imageUrl;
  final String desc;
  final String locationLine;
  final double rating;
  final List<String> gallery;
  final String? pid;

  const _DetailParams({
    required this.name,
    required this.heroKey,
    required this.imageUrl,
    required this.desc,
    required this.locationLine,
    required this.rating,
    required this.gallery,
    required this.pid,
  });
}

/// Abre la vista detalle de un lugar desde favoritos o historial (sin swipe).
void openDiaryItemDetail(BuildContext context, Map<String, dynamic> it) {
  final p = _buildParams(it);
  Navigator.push<void>(
    context,
    smarturDetailRoute(
      DetailViewPage(
        title: p.name.isNotEmpty ? p.name : '—',
        heroTag: 'diary_${p.heroKey}',
        heroImageUrl: p.imageUrl,
        subtitle: p.desc,
        locationLine: p.locationLine,
        rating: p.rating,
        galleryUrls: p.gallery,
        placeId: p.pid,
      ),
    ),
  );
}

/// Abre la vista detalle con swipe izquierda/derecha entre todos los ítems.
void openDiaryItemDetailWithSwipe(
  BuildContext context,
  List<Map<String, dynamic>> allItems,
  int initialIndex,
) {
  Navigator.push<void>(
    context,
    smarturDetailRoute(
      _DiarySwipeView(items: allItems, initialIndex: initialIndex),
    ),
  );
}

class _DiarySwipeView extends StatefulWidget {
  final List<Map<String, dynamic>> items;
  final int initialIndex;

  const _DiarySwipeView({required this.items, required this.initialIndex});

  @override
  State<_DiarySwipeView> createState() => _DiarySwipeViewState();
}

class _DiarySwipeViewState extends State<_DiarySwipeView> {
  late final PageController _controller;
  late int _currentIndex;
  final Map<int, bool> _favoriteCache = {};

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
    _controller = PageController(initialPage: widget.initialIndex);
    _loadFav(widget.initialIndex);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _loadFav(int index) async {
    final p = _buildParams(widget.items[index]);
    if (p.pid == null) return;
    final pid = p.pid!;
    final kind = pid.startsWith('svc_') ? 'svc' : 'poi';
    final id = int.tryParse(pid.substring(4));
    if (id == null) return;
    final fav = await UserContentService().isFavorite(kind, id);
    if (mounted) setState(() => _favoriteCache[index] = fav);
  }

  Future<void> _toggleFav() async {
    final p = _buildParams(widget.items[_currentIndex]);
    if (p.pid == null) return;
    final pid = p.pid!;
    final kind = pid.startsWith('svc_') ? 'svc' : 'poi';
    final id = int.tryParse(pid.substring(4));
    if (id == null) return;
    final current = _favoriteCache[_currentIndex] ?? false;
    setState(() => _favoriteCache[_currentIndex] = !current);
    try {
      if (current) {
        await UserContentService().removeFavorite(kind, id);
      } else {
        await UserContentService().addFavorite(kind, id);
      }
    } catch (_) {
      if (mounted) setState(() => _favoriteCache[_currentIndex] = current);
    }
  }

  void _shareCurrent() {
    final p = _buildParams(widget.items[_currentIndex]);
    final encoded = Uri.encodeComponent('${p.name}, Veracruz, México');
    final mapsUrl = 'https://www.google.com/maps/search/?api=1&query=$encoded';
    final desc = p.desc.length > 120 ? '${p.desc.substring(0, 120)}…' : p.desc;
    final descLine = desc.isNotEmpty ? '\n$desc' : '';
    SharePlus.instance.share(ShareParams(
      text: '${p.name}\n${p.locationLine}$descLine\n\n$mapsUrl',
      subject: p.name,
    ));
  }

  @override
  Widget build(BuildContext context) {
    final isFav = _favoriteCache[_currentIndex] ?? false;
    final currentP = _buildParams(widget.items[_currentIndex]);

    return Stack(
      children: [
        PageView.builder(
          controller: _controller,
          itemCount: widget.items.length,
          onPageChanged: (i) {
            setState(() => _currentIndex = i);
            _loadFav(i);
          },
          itemBuilder: (context, index) {
            final p = _buildParams(widget.items[index]);
            return DetailViewPage(
              key: ValueKey('diary_page_$index'),
              title: p.name.isNotEmpty ? p.name : '—',
              heroTag: 'diary_swipe_${p.heroKey}_$index',
              heroImageUrl: p.imageUrl,
              subtitle: p.desc,
              locationLine: p.locationLine,
              rating: p.rating,
              galleryUrls: p.gallery,
              placeId: p.pid,
              showTopButtons: false,
            );
          },
        ),

        // Fixed button overlay
        Positioned(
          top: 0,
          left: 0,
          right: 0,
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
              child: Row(
                children: [
                  _OverlayButton(
                    icon: Icons.arrow_back_rounded,
                    onTap: () => Navigator.pop(context),
                  ),
                  const Spacer(),
                  if (currentP.pid != null) ...[
                    _OverlayButton(
                      icon: Icons.add_rounded,
                      onTap: () => showAddToRouteSheet(
                        context,
                        placeName: currentP.name,
                        placeId: currentP.pid!,
                      ),
                    ),
                    const SizedBox(width: 8),
                  ],
                  _OverlayButton(
                    icon: Icons.share_rounded,
                    onTap: _shareCurrent,
                  ),
                  const SizedBox(width: 8),
                  _OverlayButton(
                    icon: isFav ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                    iconColor: isFav ? SmarturStyle.pink : Colors.white,
                    onTap: _toggleFav,
                  ),
                ],
              ),
            ),
          ),
        ),

        // Indicador de posición
        if (widget.items.length > 1)
          Positioned(
            bottom: 8,
            left: 0,
            right: 0,
            child: SafeArea(
              child: Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.5),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    '${_currentIndex + 1} / ${widget.items.length}',
                    style: const TextStyle(
                      fontFamily: 'Outfit',
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _OverlayButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  final Color? iconColor;

  const _OverlayButton({required this.icon, required this.onTap, this.iconColor});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: Colors.black.withValues(alpha: 0.45),
          shape: BoxShape.circle,
        ),
        alignment: Alignment.center,
        child: Icon(icon, color: iconColor ?? Colors.white, size: 20),
      ),
    );
  }
}
