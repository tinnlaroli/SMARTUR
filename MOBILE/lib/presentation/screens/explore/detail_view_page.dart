import 'dart:ui';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lottie/lottie.dart';
import 'package:share_plus/share_plus.dart';
import 'package:smartur/l10n/app_localizations.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/theme/style_guide.dart';
import '../../../data/models/place_model.dart';
import '../../../data/services/user_content_service.dart';

class DetailViewPage extends StatefulWidget {
  final String title;
  final String heroTag;
  final String heroImageUrl;
  final String subtitle;
  final String locationLine;
  final double rating;
  final List<String> galleryUrls;

  /// Referencia del lugar (`svc_` / `poi_` + id) para favoritos e historial API.
  final String? placeId;

  /// Coordenadas del lugar para abrir en Google Maps.
  final double? lat;
  final double? lon;

  /// Lugares de la misma ciudad — se usa para "Crear Ruta de 1 Día".
  /// Pasar null en callers que no tienen acceso a la lista de ciudad.
  final List<Place>? cityPlaces;

  const DetailViewPage({
    super.key,
    required this.title,
    required this.heroTag,
    required this.heroImageUrl,
    required this.subtitle,
    required this.locationLine,
    required this.rating,
    required this.galleryUrls,
    this.placeId,
    this.lat,
    this.lon,
    this.cityPlaces,
  });

  @override
  State<DetailViewPage> createState() => _DetailViewPageState();
}

(String?, int?) _parsePlaceRef(String? raw) {
  if (raw == null) return (null, null);
  if (raw.startsWith('svc_')) {
    return ('svc', int.tryParse(raw.substring(4)));
  }
  if (raw.startsWith('poi_')) {
    return ('poi', int.tryParse(raw.substring(4)));
  }
  return (null, null);
}

class _DetailViewPageState extends State<DetailViewPage>
    with SingleTickerProviderStateMixin {
  bool _favBusy = false;
  bool _isFavorite = false;
  String? _kind;
  int? _pid;

  // Dwell time tracking
  final Stopwatch _dwell = Stopwatch();

  // Star rating
  int? _userRating;
  bool _ratingBusy = false;

  // Double-tap heart burst animation
  late final AnimationController _heartCtrl;
  late final Animation<double> _heartScale;
  late final Animation<double> _heartOpacity;

  @override
  void initState() {
    super.initState();
    _dwell.start();
    _heartCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    );
    _heartScale = TweenSequence<double>([
      TweenSequenceItem(tween: Tween(begin: 0.0, end: 1.4), weight: 40),
      TweenSequenceItem(tween: Tween(begin: 1.4, end: 1.0), weight: 30),
      TweenSequenceItem(tween: Tween(begin: 1.0, end: 0.0), weight: 30),
    ]).animate(CurvedAnimation(parent: _heartCtrl, curve: Curves.easeOut));
    _heartOpacity = TweenSequence<double>([
      TweenSequenceItem(tween: Tween(begin: 0.0, end: 1.0), weight: 20),
      TweenSequenceItem(tween: Tween(begin: 1.0, end: 1.0), weight: 50),
      TweenSequenceItem(tween: Tween(begin: 1.0, end: 0.0), weight: 30),
    ]).animate(_heartCtrl);
    WidgetsBinding.instance.addPostFrameCallback((_) => _setupPlace());
  }

  void _onDoubleTap() {
    HapticFeedback.mediumImpact();
    _heartCtrl.forward(from: 0.0);
    // Like on double tap (don't unlike — Instagram behaviour)
    if (!_isFavorite) {
      _toggleFavorite();
    }
  }

  @override
  void dispose() {
    _heartCtrl.dispose();
    _dwell.stop();
    final ms = _dwell.elapsedMilliseconds;
    if (_kind != null && _pid != null && ms > 3000) {
      // Fire-and-forget: flush dwell event
      UserContentService().batchInteractions([
        {
          'place_kind': _kind,
          'place_id': _pid,
          'event_type': 'dwell',
          'dwell_ms': ms,
        }
      ]);
    }
    super.dispose();
  }

  Future<void> _setupPlace() async {
    final ref = _parsePlaceRef(widget.placeId);
    _kind = ref.$1;
    _pid = ref.$2;
    if (_kind == null || _pid == null) {
      if (mounted) setState(() {});
      return;
    }
    final svc = UserContentService();
    await svc.recordVisit(_kind!, _pid!);
    // Also fire a detail_open interaction event
    svc.batchInteractions([
      {'place_kind': _kind, 'place_id': _pid, 'event_type': 'detail_open'}
    ]);
    try {
      final results = await Future.wait([
        svc.isFavorite(_kind!, _pid!),
        svc.fetchRating(_kind!, _pid!),
      ]);
      if (mounted) {
        setState(() {
          _isFavorite = results[0] as bool;
          _userRating = results[1] as int?;
        });
      }
    } catch (_) {}
  }

  Future<void> _ratePlace(int stars) async {
    if (_kind == null || _pid == null || _ratingBusy) return;
    setState(() {
      _ratingBusy = true;
      _userRating = stars;
    });
    await UserContentService().ratePlace(
      placeKind: _kind!,
      placeId: _pid!,
      rating: stars,
    );
    if (mounted) setState(() => _ratingBusy = false);
  }

  Future<void> _toggleFavorite() async {
    if (_kind == null || _pid == null || _favBusy) return;
    final wasLiked = _isFavorite;
    // Optimistic update — show instantly, no spinner
    setState(() { _isFavorite = !_isFavorite; _favBusy = true; });
    final svc = UserContentService();
    try {
      if (wasLiked) {
        await svc.removeFavorite(_kind!, _pid!);
      } else {
        await svc.addFavorite(_kind!, _pid!);
      }
    } catch (_) {
      // Rollback on failure
      if (mounted) setState(() => _isFavorite = wasLiked);
    } finally {
      if (mounted) setState(() => _favBusy = false);
    }
  }

  void _sharePlace() {
    final title = widget.title;
    final location = widget.locationLine;
    final desc = widget.subtitle.isNotEmpty ? widget.subtitle : '';
    final shortDesc = desc.length > 120 ? '${desc.substring(0, 120)}…' : desc;
    final String mapsUrl;
    if (widget.lat != null && widget.lon != null) {
      mapsUrl = 'https://www.google.com/maps/search/?api=1&query=${widget.lat},${widget.lon}';
    } else {
      final encoded = Uri.encodeComponent('$title, Veracruz, México');
      mapsUrl = 'https://www.google.com/maps/search/?api=1&query=$encoded';
    }
    final text = '¡Descubre $title en $location! 📍'
        '${shortDesc.isNotEmpty ? '\n$shortDesc' : ''}'
        '\nVer en Maps: $mapsUrl'
        '\n\nDescubierto con SMARTUR — Altas Montañas, Veracruz';
    SharePlus.instance.share(ShareParams(text: text, subject: title));
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 4,
      child: Scaffold(
        body: Stack(
          children: [
            // Hero background image
            Hero(
              tag: widget.heroTag,
              child: SizedBox.expand(
                child: widget.heroImageUrl.isEmpty
                    ? Container(
                        color: Colors.grey.shade900,
                        child: const Icon(Icons.image_not_supported_outlined,
                            color: Colors.white38, size: 48),
                      )
                    : CachedNetworkImage(
                        imageUrl: widget.heroImageUrl,
                        fit: BoxFit.cover,
                        filterQuality: FilterQuality.high,
                        fadeInDuration: const Duration(milliseconds: 300),
                        placeholder: (_, __) => Container(color: Colors.grey.shade900),
                        errorWidget: (_, __, ___) => Container(
                          color: Colors.grey.shade900,
                          child: const Icon(Icons.image_not_supported_outlined,
                              color: Colors.white38, size: 48),
                        ),
                      ),
              ),
            ),

            // Double-tap heart burst overlay
            AnimatedBuilder(
              animation: _heartCtrl,
              builder: (context, child) {
                if (_heartCtrl.value == 0.0) return const SizedBox.shrink();
                return Positioned.fill(
                  child: IgnorePointer(
                    child: Center(
                      child: Opacity(
                        opacity: _heartOpacity.value,
                        child: Transform.scale(
                          scale: _heartScale.value,
                          child: const Icon(
                            Icons.favorite_rounded,
                            color: Colors.white,
                            size: 100,
                            shadows: [Shadow(color: Colors.black38, blurRadius: 20)],
                          ),
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),

            // Dark gradient overlay
            const Positioned.fill(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    stops: [0.0, 0.3, 0.7, 1.0],
                    colors: [
                      Color(0x30000000),
                      Color(0x10000000),
                      Color(0x90000000),
                      Color(0xDD000000),
                    ],
                  ),
                ),
              ),
            ),

            SafeArea(
              child: Stack(
                children: [
                  // z-0: Double-tap capture — translucent so buttons/BottomContent still work
                  Positioned.fill(
                    child: GestureDetector(
                      onDoubleTap: _onDoubleTap,
                      behavior: HitTestBehavior.translucent,
                    ),
                  ),

                  // Top row — atrás + favoritos (diario)
                  Positioned(
                    top: 8,
                    left: 8,
                    child: _GlassCircle(
                      onTap: () => Navigator.pop(context),
                      child: const Icon(Icons.arrow_back_rounded,
                          color: Colors.white, size: 22),
                    ),
                  ),
                  // Share button — top-right, left of favorite
                  Positioned(
                    top: 8,
                    right: 60,
                    child: _GlassCircle(
                      onTap: _sharePlace,
                      child: const Icon(
                        Icons.share_rounded,
                        color: Colors.white,
                        size: 20,
                      ),
                    ),
                  ),
                  // Favorite button — top-right
                  Positioned(
                    top: 8,
                    right: 8,
                    child: _GlassCircle(
                      onTap: _kind != null && _pid != null ? _toggleFavorite : () {},
                      child: Icon(
                        _isFavorite
                            ? Icons.favorite_rounded
                            : Icons.favorite_border_rounded,
                        color: _isFavorite ? SmarturStyle.pink : Colors.white,
                        size: 22,
                      ),
                    ),
                  ),

                  // Right mosaic thumbnails
                  if (widget.galleryUrls.length > 1)
                    Positioned(
                      top: 130,
                      right: 16,
                      child: _RightMosaic(galleryUrls: widget.galleryUrls),
                    ),

                  // Main content — bottom sheet style
                  // (Rating is now inside _BottomContent as the 4th tab)
                  Positioned(
                    left: 0,
                    right: 0,
                    bottom: 0,
                    child: _BottomContent(
                      title: widget.title,
                      locationLine: widget.locationLine,
                      rating: widget.rating,
                      subtitle: widget.subtitle,
                      userRating: _kind != null && _pid != null ? _userRating : null,
                      ratingBusy: _ratingBusy,
                      onRate: _kind != null && _pid != null ? _ratePlace : (_) {},
                      lat: widget.lat,
                      lon: widget.lon,
                      cityPlaces: widget.cityPlaces,
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
}

// ═══════════════════════════════════════════════════════════════════

class _GlassCircle extends StatelessWidget {
  final VoidCallback onTap;
  final Widget child;
  const _GlassCircle({required this.onTap, required this.child});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: ClipOval(
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
          child: Container(
            width: 44,
            height: 44,
            alignment: Alignment.center,
            color: Colors.white.withValues(alpha: 0.12),
            child: child,
          ),
        ),
      ),
    );
  }
}

// ── Bottom content with glass card ──

/// Returns curated gastronomy content for the given city/location.
String _gastronomyForCity(String locationLine) {
  final l = locationLine.toLowerCase()
    .replaceAll('á', 'a').replaceAll('é', 'e')
    .replaceAll('í', 'i').replaceAll('ó', 'o')
    .replaceAll('ú', 'u').replaceAll('ñ', 'n');
  if (l.contains('xalapa')) {
    return 'Café de altura · Enchiladas xalapeñas · Punche (tamal dulce) · Pan de nata · Caldito de habas · Garnachas con salsa verde.';
  }
  if (l.contains('coatepec')) {
    return 'Café Coatepec (Denominación de Origen) · Gorditas de maíz · Tamales xocoyoles · Pan de yema · Chiles rellenos de queso.';
  }
  if (l.contains('cordoba') || l.contains('córdoba')) {
    return 'Café de Los Portales · Tamales de elote · Chileatole verde · Tostadas de frijol · Memelas con cecina cordobesa.';
  }
  if (l.contains('orizaba')) {
    return 'Café regional · Tostadas orizabeñas con tinga · Chileatole rojo · Enchiladas mineras · Marquesote (postre tradicional).';
  }
  if (l.contains('fortin') || l.contains('fortín')) {
    return 'Café entre flores de naranja · Garnachas rellenas · Tamales de rajas · Agua de Jamaica con flores · Pan artesanal.';
  }
  if (l.contains('xico')) {
    return 'Mole xiqueño (14 ingredientes) · Chiles en nogada · Conservas de guayaba y naranja · Café de altura · Tortas de mole.';
  }
  if (l.contains('ixtaczoquitlan') || l.contains('ixtaczoquitlán')) {
    return 'Café de montaña · Tamales de mole · Quesillo (queso de hebra) · Enfrijoladas · Agua de chilacayote.';
  }
  return 'Gastronomía de Altas Montañas: café de altura, tamales veracruzanos, mole regional, gorditas y frutas tropicales de temporada.';
}

class _BottomContent extends StatelessWidget {
  final String title;
  final String locationLine;
  final double rating;
  final String subtitle;
  final int? userRating;
  final bool ratingBusy;
  final void Function(int) onRate;
  final double? lat;
  final double? lon;
  final List<Place>? cityPlaces;

  const _BottomContent({
    required this.title,
    required this.locationLine,
    required this.rating,
    required this.subtitle,
    required this.userRating,
    required this.ratingBusy,
    required this.onRate,
    this.lat,
    this.lon,
    this.cityPlaces,
  });

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return ClipRRect(
      borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 24, sigmaY: 24),
        child: Container(
          padding: const EdgeInsets.fromLTRB(22, 18, 22, 22),
          decoration: BoxDecoration(
            color: Colors.black.withValues(alpha: 0.42),
            borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
            border: Border(
              top: BorderSide(
                color: Colors.white.withValues(alpha: 0.12),
              ),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              // Rating + location + directions row
              Row(
                children: [
                  _RatingPill(rating: rating),
                  const SizedBox(width: 8),
                  _DirectionsChip(lat: lat, lon: lon, placeName: title),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Row(
                      children: [
                        const Icon(Icons.place_outlined,
                            color: Colors.white54, size: 14),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            locationLine,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontFamily: 'Outfit',
                              fontSize: 11,
                              color: Colors.white54,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),

              // Title
              Text(
                title,
                style: const TextStyle(
                  fontFamily: 'CalSans',
                  fontSize: 36,
                  fontWeight: FontWeight.bold,
                  height: 1.0,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 14),

              // Tabs
              TabBar(
                isScrollable: true,
                indicatorColor: SmarturStyle.orange,
                indicatorSize: TabBarIndicatorSize.label,
                labelColor: Colors.white,
                unselectedLabelColor: Colors.white54,
                labelStyle: const TextStyle(
                  fontFamily: 'Outfit',
                  fontWeight: FontWeight.w700,
                  fontSize: 12,
                ),
                dividerHeight: 0,
                tabAlignment: TabAlignment.start,
                tabs: [
                  Tab(text: l10n.tabHistory),
                  Tab(text: l10n.tabLocation),
                  Tab(text: l10n.tabGastronomy),
                  Tab(text: l10n.tabRate),
                ],
              ),
              const SizedBox(height: 10),

              SizedBox(
                height: 140,
                child: TabBarView(
                  children: [
                    _TabText(
                      text: subtitle.isNotEmpty
                          ? subtitle
                          : 'Próximamente — agrega una reseña sobre este lugar.',
                    ),
                    _LocationTab(
                      lat: lat,
                      lon: lon,
                      locationLine: locationLine,
                      placeName: title,
                      l10n: l10n,
                    ),
                    _TabText(text: _gastronomyForCity(locationLine)),
                    _RatingTab(
                      userRating: userRating,
                      busy: ratingBusy,
                      onRate: onRate,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // CTA row: price + button
              Row(
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        l10n.fromPrice,
                        style: TextStyle(
                          fontFamily: 'Outfit',
                          fontSize: 10,
                          color: Colors.white.withValues(alpha: 0.5),
                        ),
                      ),
                      Text(
                        l10n.free,
                        style: TextStyle(
                          fontFamily: 'CalSans',
                          fontSize: 22,
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(width: 20),
                  Expanded(
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: SmarturStyle.orange,
                        foregroundColor: Colors.white,
                        minimumSize: const Size(0, 52),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                        elevation: 0,
                      ),
                      onPressed: () {
                        if (cityPlaces != null && cityPlaces!.isNotEmpty) {
                          // Build a minimal Place-like object for the current view
                          final fakeCurrentPlace = cityPlaces!.firstWhere(
                            (p) => p.name == title,
                            orElse: () => cityPlaces!.first,
                          );
                          showModalBottomSheet<void>(
                            context: context,
                            isScrollControlled: true,
                            backgroundColor: Colors.transparent,
                            builder: (_) => DayPlanSheet(
                              currentPlace: fakeCurrentPlace,
                              cityPlaces: cityPlaces!,
                            ),
                          );
                        } else {
                          // No city list — open Maps with directions
                          final Uri uri;
                          if (lat != null && lon != null) {
                            uri = Uri.parse(
                              'https://www.google.com/maps/dir/?api=1&destination=$lat,$lon',
                            );
                          } else {
                            final encoded = Uri.encodeComponent('$title, Veracruz, México');
                            uri = Uri.parse(
                              'https://www.google.com/maps/search/?api=1&query=$encoded',
                            );
                          }
                          launchUrl(uri, mode: LaunchMode.externalApplication);
                        }
                      },
                      icon: const Icon(Icons.map_rounded, size: 18),
                      label: Text(
                        cityPlaces != null && cityPlaces!.isNotEmpty
                            ? l10n.createOneDayRoute
                            : '¿Cómo llegar?',
                        style: const TextStyle(
                          fontFamily: 'Outfit',
                          fontWeight: FontWeight.w700,
                          fontSize: 14,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Location tab — opens Google Maps if coordinates are available ──

class _LocationTab extends StatelessWidget {
  final double? lat;
  final double? lon;
  final String locationLine;
  final String placeName;
  final AppLocalizations l10n;

  const _LocationTab({
    required this.lat,
    required this.lon,
    required this.locationLine,
    required this.placeName,
    required this.l10n,
  });

  Future<void> _openMaps() async {
    final encodedName = Uri.encodeComponent(placeName);
    final Uri uri;
    if (lat != null && lon != null) {
      // Deep-link to the exact coordinates with place name as label
      uri = Uri.parse('https://www.google.com/maps/search/?api=1&query=$lat,$lon&query_place_id=$encodedName');
    } else {
      // Fallback: search by place name in the region
      uri = Uri.parse('https://www.google.com/maps/search/?api=1&query=${Uri.encodeComponent("$placeName, Veracruz, México")}');
    }
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      // url_launcher couldn't open — silently degrade (Maps not installed)
    }
  }

  @override
  Widget build(BuildContext context) {
    final hasCoords = lat != null && lon != null;

    return SingleChildScrollView(
      padding: const EdgeInsets.only(top: 4),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (hasCoords)
            Row(
              children: [
                const Icon(Icons.location_on_outlined, color: Colors.white54, size: 13),
                const SizedBox(width: 4),
                Text(
                  '${lat!.toStringAsFixed(5)}, ${lon!.toStringAsFixed(5)}',
                  style: TextStyle(
                    fontFamily: 'Outfit',
                    fontSize: 11,
                    color: Colors.white.withValues(alpha: 0.55),
                  ),
                ),
              ],
            )
          else
            Row(
              children: [
                const Icon(Icons.location_city_outlined, color: Colors.white54, size: 13),
                const SizedBox(width: 4),
                Text(
                  locationLine,
                  style: TextStyle(
                    fontFamily: 'Outfit',
                    fontSize: 11,
                    color: Colors.white.withValues(alpha: 0.55),
                  ),
                ),
              ],
            ),
          const SizedBox(height: 8),
          GestureDetector(
            onTap: _openMaps,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
              decoration: BoxDecoration(
                color: SmarturStyle.blue.withValues(alpha: 0.25),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: SmarturStyle.blue.withValues(alpha: 0.50),
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.map_outlined, size: 15, color: SmarturStyle.blue),
                  const SizedBox(width: 6),
                  Text(
                    l10n.openInMaps,
                    style: const TextStyle(
                      fontFamily: 'Outfit',
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: SmarturStyle.blue,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Reusable small widgets ──

class _RatingPill extends StatelessWidget {
  final double rating;
  const _RatingPill({required this.rating});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: SmarturStyle.orange.withValues(alpha: 0.25),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: SmarturStyle.orange.withValues(alpha: 0.45)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.star_rounded, size: 14, color: SmarturStyle.orange),
          const SizedBox(width: 4),
          Text(
            rating.toStringAsFixed(1),
            style: const TextStyle(
              fontFamily: 'Outfit',
              fontWeight: FontWeight.w800,
              color: Colors.white,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }
}

class _RightMosaic extends StatelessWidget {
  final List<String> galleryUrls;
  const _RightMosaic({required this.galleryUrls});

  @override
  Widget build(BuildContext context) {
    final items = galleryUrls.skip(1).take(3).toList();
    final remaining = (galleryUrls.length - 1 - items.length).clamp(0, 999);

    return Column(
      children: [
        for (int i = 0; i < items.length; i++) ...[
          _MiniThumb(url: items[i], size: i == 0 ? 54 : 46),
          const SizedBox(height: 10),
        ],
        if (remaining > 0)
          Container(
            width: 46,
            height: 46,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: Colors.black.withValues(alpha: 0.40),
              borderRadius: BorderRadius.circular(999),
              border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
            ),
            child: Text(
              '+$remaining',
              style: const TextStyle(
                fontFamily: 'Outfit',
                color: Colors.white,
                fontWeight: FontWeight.w700,
                fontSize: 12,
              ),
            ),
          ),
      ],
    );
  }
}

class _MiniThumb extends StatelessWidget {
  final String url;
  final double size;
  const _MiniThumb({required this.url, required this.size});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(color: Colors.white.withValues(alpha: 0.25), width: 2),
      ),
      child: ClipOval(
        child: CachedNetworkImage(
          imageUrl: url,
          fit: BoxFit.cover,
          filterQuality: FilterQuality.medium,
          placeholder: (_, __) => Container(color: Colors.grey.shade800),
          errorWidget: (_, __, ___) => Container(
            color: Colors.grey.shade800,
            child: const Icon(Icons.image_not_supported_outlined, color: Colors.white38, size: 20),
          ),
        ),
      ),
    );
  }
}

class _TabText extends StatelessWidget {
  final String text;
  const _TabText({required this.text});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Padding(
        padding: const EdgeInsets.only(top: 4),
        child: Text(
          text,
          style: TextStyle(
            fontFamily: 'Outfit',
            fontSize: 12,
            height: 1.4,
            color: Colors.white.withValues(alpha: 0.72),
          ),
        ),
      ),
    );
  }
}

// ── "¿Cómo llegar?" chip button in rating row ──

class _DirectionsChip extends StatelessWidget {
  final double? lat;
  final double? lon;
  final String placeName;

  const _DirectionsChip({this.lat, this.lon, required this.placeName});

  Future<void> _openDirections() async {
    final Uri uri;
    if (lat != null && lon != null) {
      uri = Uri.parse('https://www.google.com/maps/dir/?api=1&destination=$lat,$lon');
    } else {
      final encoded = Uri.encodeComponent('$placeName, Veracruz, México');
      uri = Uri.parse('https://www.google.com/maps/search/?api=1&query=$encoded');
    }
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: _openDirections,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
        decoration: BoxDecoration(
          color: const Color(0xFF1A73E8).withValues(alpha: 0.20),
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: const Color(0xFF1A73E8).withValues(alpha: 0.40)),
        ),
        child: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.directions_rounded, size: 12, color: Color(0xFF82B4FF)),
            SizedBox(width: 4),
            Text(
              '¿Cómo llegar?',
              style: TextStyle(
                fontFamily: 'Outfit',
                fontSize: 10,
                fontWeight: FontWeight.w700,
                color: Color(0xFF82B4FF),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Gamified rating tab — shown as 4th tab in detail view ──

class _RatingTab extends StatelessWidget {
  final int? userRating;
  final bool busy;
  final void Function(int) onRate;

  const _RatingTab({
    required this.userRating,
    required this.busy,
    required this.onRate,
  });

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final hasRated = userRating != null;

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (!hasRated) ...[
            Text(
              l10n.rateHint,
              style: TextStyle(
                fontFamily: 'Outfit',
                fontSize: 11,
                color: Colors.white.withValues(alpha: 0.7),
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 10),
          ],
          // 5 interactive stars
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(5, (i) {
              final star = i + 1;
              final filled = userRating != null && star <= userRating!;
              return GestureDetector(
                onTap: busy ? null : () => onRate(star),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: Icon(
                    filled ? Icons.star_rounded : Icons.star_border_rounded,
                    size: 32,
                    color: filled ? const Color(0xFFFBBF24) : Colors.white38,
                  ),
                ),
              );
            }),
          ),
          if (hasRated) ...[
            const SizedBox(height: 8),
            Lottie.asset(
              'assets/lottie/rating_success.json',
              width: 72,
              height: 72,
              repeat: false,
            ),
            Text(
              l10n.rateThanks,
              style: const TextStyle(
                fontFamily: 'Outfit',
                fontSize: 11,
                color: Color(0xFFFBBF24),
              ),
            ),
          ],
          if (busy)
            const Padding(
              padding: EdgeInsets.only(top: 6),
              child: SizedBox(
                width: 14,
                height: 14,
                child: CircularProgressIndicator(
                  strokeWidth: 1.5,
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white54),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════
// DayPlanSheet — "Crear Ruta de 1 Día" bottom sheet
// ═══════════════════════════════════════════════════════════════════

/// Categorías de lugares para el día plan
enum _DaySlot {
  morning('🌅 Mañana', 'Naturaleza / Aventura', Icons.terrain_rounded, Color(0xFF9CCC44)),
  midday('🍴 Mediodía', 'Gastronomía / Restaurante', Icons.restaurant_rounded, Color(0xFFFF7D1F)),
  afternoon('🏛️ Tarde', 'Cultural / Museo', Icons.museum_rounded, Color(0xFF984EFD)),
  sunset('🌆 Atardecer', 'Mirador / Parque', Icons.landscape_rounded, Color(0xFF4DB9CA));

  final String label;
  final String categoryHint;
  final IconData icon;
  final Color color;
  const _DaySlot(this.label, this.categoryHint, this.icon, this.color);
}

class DayPlanSheet extends StatelessWidget {
  final Place currentPlace;
  final List<Place> cityPlaces;

  const DayPlanSheet({
    super.key,
    required this.currentPlace,
    required this.cityPlaces,
  });

  /// Asigna un slot del día a un lugar según su categoría.
  _DaySlot _slotFor(Place p) {
    final cats = p.category;
    switch (cats) {
      case PlaceCategory.adventures:
        return _DaySlot.morning;
      case PlaceCategory.restaurants:
        return _DaySlot.midday;
      case PlaceCategory.museums:
        return _DaySlot.afternoon;
      case PlaceCategory.hotels:
        return _DaySlot.sunset;
    }
  }

  /// Construye el itinerario: uno por slot, el currentPlace tiene prioridad en su slot.
  List<({_DaySlot slot, Place place})> _buildItinerary() {
    final Map<_DaySlot, Place> slots = {};

    // Primero poner el lugar actual en su slot
    slots[_slotFor(currentPlace)] = currentPlace;

    // Rellenar otros slots con lugares de la ciudad (orden de prioridad)
    for (final place in cityPlaces) {
      if (place.id == currentPlace.id) continue;
      final slot = _slotFor(place);
      if (!slots.containsKey(slot)) {
        slots[slot] = place;
      }
    }

    // Ordenar por slot del día
    return _DaySlot.values
        .where(slots.containsKey)
        .map((s) => (slot: s, place: slots[s]!))
        .toList();
  }

  Future<void> _openMaps(Place p) async {
    final Uri uri;
    if (p.lat != null && p.lon != null) {
      uri = Uri.parse('https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lon}');
    } else {
      final encoded = Uri.encodeComponent('${p.name}, Veracruz, México');
      uri = Uri.parse('https://www.google.com/maps/search/?api=1&query=$encoded');
    }
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    final itinerary = _buildItinerary();
    final cityName = currentPlace.city;

    return ClipRRect(
      borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
      child: Container(
        color: const Color(0xFF1A1A2E),
        child: SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(22, 20, 22, 28),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Handle
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    margin: const EdgeInsets.only(bottom: 20),
                    decoration: BoxDecoration(
                      color: Colors.white24,
                      borderRadius: BorderRadius.circular(999),
                    ),
                  ),
                ),
                // Title
                const Row(
                  children: [
                    Icon(Icons.route_rounded, color: SmarturStyle.orange, size: 22),
                    SizedBox(width: 10),
                    Text(
                      'Ruta de 1 Día',
                      style: TextStyle(
                        fontFamily: 'CalSans',
                        fontSize: 22,
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  'Itinerario sugerido para explorar $cityName',
                  style: TextStyle(
                    fontFamily: 'Outfit',
                    fontSize: 12,
                    color: Colors.white.withValues(alpha: 0.55),
                  ),
                ),
                const SizedBox(height: 20),
                // Itinerary steps
                ...itinerary.map((entry) => _DayStepTile(
                  slot: entry.slot,
                  place: entry.place,
                  isCurrent: entry.place.id == currentPlace.id,
                  onOpenMaps: () => _openMaps(entry.place),
                )),
                if (itinerary.length < 3) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.05),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.explore_outlined, color: Colors.white38, size: 16),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Explora más lugares en $cityName para completar tu ruta.',
                            style: TextStyle(
                              fontFamily: 'Outfit',
                              fontSize: 11,
                              color: Colors.white.withValues(alpha: 0.50),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _DayStepTile extends StatelessWidget {
  final _DaySlot slot;
  final Place place;
  final bool isCurrent;
  final VoidCallback onOpenMaps;

  const _DayStepTile({
    required this.slot,
    required this.place,
    required this.isCurrent,
    required this.onOpenMaps,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isCurrent
              ? slot.color.withValues(alpha: 0.15)
              : Colors.white.withValues(alpha: 0.06),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isCurrent
                ? slot.color.withValues(alpha: 0.40)
                : Colors.white.withValues(alpha: 0.08),
          ),
        ),
        child: Row(
          children: [
            // Slot icon
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: slot.color.withValues(alpha: 0.20),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(slot.icon, color: slot.color, size: 20),
            ),
            const SizedBox(width: 12),
            // Info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    slot.label,
                    style: TextStyle(
                      fontFamily: 'Outfit',
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                      color: slot.color,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    place.name,
                    style: const TextStyle(
                      fontFamily: 'Outfit',
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (isCurrent)
                    Text(
                      '← Estás aquí',
                      style: TextStyle(
                        fontFamily: 'Outfit',
                        fontSize: 10,
                        color: slot.color.withValues(alpha: 0.80),
                      ),
                    ),
                ],
              ),
            ),
            // Maps chip
            GestureDetector(
              onTap: onOpenMaps,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.map_outlined, size: 12, color: Colors.white54),
                    SizedBox(width: 4),
                    Text(
                      'Maps',
                      style: TextStyle(
                        fontFamily: 'Outfit',
                        fontSize: 10,
                        color: Colors.white54,
                        fontWeight: FontWeight.w600,
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
