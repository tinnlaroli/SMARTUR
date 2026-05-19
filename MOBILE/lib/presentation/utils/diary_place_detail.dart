import 'package:flutter/material.dart';

import '../screens/explore/detail_view_page.dart';

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
    PageRouteBuilder<void>(
      transitionDuration: const Duration(milliseconds: 400),
      reverseTransitionDuration: const Duration(milliseconds: 350),
      pageBuilder: (context, animation, secondaryAnimation) => DetailViewPage(
        title: p.name.isNotEmpty ? p.name : '—',
        heroTag: 'diary_${p.heroKey}',
        heroImageUrl: p.imageUrl,
        subtitle: p.desc,
        locationLine: p.locationLine,
        rating: p.rating,
        galleryUrls: p.gallery,
        placeId: p.pid,
      ),
      transitionsBuilder: (context, anim, secondaryAnim, child) {
        return FadeTransition(opacity: anim, child: child);
      },
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
    PageRouteBuilder<void>(
      transitionDuration: const Duration(milliseconds: 400),
      reverseTransitionDuration: const Duration(milliseconds: 350),
      pageBuilder: (context, animation, secondaryAnimation) =>
          _DiarySwipeView(items: allItems, initialIndex: initialIndex),
      transitionsBuilder: (context, anim, secondaryAnim, child) {
        return FadeTransition(opacity: anim, child: child);
      },
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

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
    _controller = PageController(initialPage: widget.initialIndex);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        PageView.builder(
          controller: _controller,
          itemCount: widget.items.length,
          onPageChanged: (i) => setState(() => _currentIndex = i),
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
            );
          },
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
