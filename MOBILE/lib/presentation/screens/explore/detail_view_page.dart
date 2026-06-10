import 'dart:ui';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lottie/lottie.dart';
import 'package:share_plus/share_plus.dart';
import 'package:smartur/l10n/app_localizations.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/theme/smartur_theme_extensions.dart';
import '../../../core/theme/style_guide.dart';
import '../../../data/models/place_model.dart';
import '../../../data/services/user_content_service.dart';
import '../../widgets/add_to_route_sheet.dart';

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

  /// When false, the top buttons (back/share/like) are not rendered.
  /// Used when the caller provides its own fixed overlay (e.g. swipe view).
  final bool showTopButtons;

  // ── Campos de servicio (opcionales — solo para svc_* placeIds) ──
  final double? priceFrom;
  final double? priceTo;
  final String? currency;
  final int? durationMinutes;
  final String? contactPhone;
  final Map<String, String>? operatingHours;

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
    this.showTopButtons = true,
    this.priceFrom,
    this.priceTo,
    this.currency,
    this.durationMinutes,
    this.contactPhone,
    this.operatingHours,
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
    final l10n = AppLocalizations.of(context)!;
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
    final descLine = shortDesc.isNotEmpty ? '\n$shortDesc' : '';
    final text = l10n.detailShareMessage(title, location, descLine, mapsUrl);
    SharePlus.instance.share(ShareParams(text: text, subject: title));
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final semantic = Theme.of(context).extension<SmarturSemanticColors>()!;
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
                        color: scheme.surfaceContainerHighest,
                        child: Icon(Icons.image_not_supported_outlined,
                            color: semantic.onImageMuted, size: 48),
                      )
                    : CachedNetworkImage(
                        imageUrl: widget.heroImageUrl,
                        fit: BoxFit.cover,
                        filterQuality: FilterQuality.high,
                        fadeInDuration: const Duration(milliseconds: 300),
                        placeholder: (_, __) => Container(color: scheme.surfaceContainerHighest),
                        errorWidget: (_, __, ___) => Container(
                          color: scheme.surfaceContainerHighest,
                          child: Icon(Icons.image_not_supported_outlined,
                              color: semantic.onImageMuted, size: 48),
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
                          child: Icon(
                            Icons.favorite_rounded,
                            color: semantic.onImageText,
                            size: 100,
                            shadows: [
                              Shadow(color: semantic.imageScrimStrong, blurRadius: 20),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),

            // Dark gradient overlay
            Positioned.fill(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    stops: [0.0, 0.3, 0.7, 1.0],
                    colors: [
                      semantic.imageScrimSoft.withValues(alpha: 0.40),
                      semantic.imageScrimSoft.withValues(alpha: 0.20),
                      semantic.imageScrimStrong.withValues(alpha: 0.70),
                      semantic.imageScrimStrong.withValues(alpha: 0.95),
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

                  // Top buttons — hidden when caller provides its own overlay
                  if (widget.showTopButtons) ...[
                    Positioned(
                      top: 8,
                      left: 8,
                      child: _GlassCircle(
                        onTap: () => Navigator.pop(context),
                        child: Icon(Icons.arrow_back_rounded,
                            color: semantic.onImageText, size: 22),
                      ),
                    ),
                    if (widget.placeId != null)
                      Positioned(
                        top: 8,
                        right: 112,
                        child: _GlassCircle(
                          onTap: () => showAddToRouteSheet(
                            context,
                            placeName: widget.title,
                            placeId: widget.placeId!,
                          ),
                          child: Icon(Icons.add_rounded,
                              color: semantic.onImageText, size: 22),
                        ),
                      ),
                    Positioned(
                      top: 8,
                      right: 60,
                      child: _GlassCircle(
                        onTap: _sharePlace,
                        child: Icon(Icons.share_rounded,
                            color: semantic.onImageText, size: 20),
                      ),
                    ),
                    Positioned(
                      top: 8,
                      right: 8,
                      child: _GlassCircle(
                        onTap: _kind != null && _pid != null ? _toggleFavorite : () {},
                        child: Icon(
                          _isFavorite
                              ? Icons.favorite_rounded
                              : Icons.favorite_border_rounded,
                          color: _isFavorite ? SmarturStyle.pink : semantic.onImageText,
                          size: 22,
                        ),
                      ),
                    ),
                  ],

                  // Right mosaic thumbnails
                  if (widget.galleryUrls.length > 1)
                    Positioned(
                      top: (MediaQuery.sizeOf(context).height * 0.14).clamp(100.0, 150.0),
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
                      priceFrom: widget.priceFrom,
                      priceTo: widget.priceTo,
                      currency: widget.currency,
                      durationMinutes: widget.durationMinutes,
                      contactPhone: widget.contactPhone,
                      operatingHours: widget.operatingHours,
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
      child: Container(
        width: 44,
        height: 44,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: Colors.black.withValues(alpha: 0.38),
          shape: BoxShape.circle,
        ),
        child: child,
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
  final double? priceFrom;
  final double? priceTo;
  final String? currency;
  final int? durationMinutes;
  final String? contactPhone;
  final Map<String, String>? operatingHours;

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
    this.priceFrom,
    this.priceTo,
    this.currency,
    this.durationMinutes,
    this.contactPhone,
    this.operatingHours,
  });

  bool get _hasServiceInfo =>
      priceFrom != null ||
      durationMinutes != null ||
      contactPhone != null ||
      (operatingHours?.isNotEmpty ?? false);

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final scheme = Theme.of(context).colorScheme;
    final semantic = Theme.of(context).extension<SmarturSemanticColors>()!;
    return ClipRRect(
      borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
      child: Container(
        padding: const EdgeInsets.fromLTRB(22, 18, 22, 22),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
          border: Border(
            top: BorderSide(
              color: semantic.overlayBorder,
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
                        Icon(Icons.place_outlined,
                            color: scheme.onSurfaceVariant, size: 14),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            locationLine,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              fontFamily: 'Outfit',
                              fontSize: 11,
                              color: scheme.onSurfaceVariant,
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
                style: TextStyle(
                  fontFamily: 'CalSans',
                  fontSize: 36,
                  fontWeight: FontWeight.bold,
                  height: 1.0,
                  color: scheme.onSurface,
                ),
              ),
              const SizedBox(height: 14),

              // Contenido unificado — todas las secciones en vista continua
              Container(
                constraints: BoxConstraints(
                  maxHeight: (MediaQuery.sizeOf(context).height * 0.35).clamp(240.0, 320.0),
                ),
                child: SingleChildScrollView(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (_hasServiceInfo) ...[
                        _SectionLabel(label: 'Información del servicio'),
                        _ServiceInfoBand(
                          priceFrom: priceFrom,
                          priceTo: priceTo,
                          currency: currency ?? 'MXN',
                          durationMinutes: durationMinutes,
                          contactPhone: contactPhone,
                          operatingHours: operatingHours,
                        ),
                      ],
                      _SectionLabel(label: l10n.tabHistory),
                      _TabText(
                        text: subtitle.isNotEmpty
                            ? subtitle
                            : 'Próximamente — agrega una reseña sobre este lugar.',
                      ),
                      _SectionLabel(label: l10n.tabGastronomy),
                      _TabText(text: _gastronomyForCity(locationLine)),
                      _RatingTab(
                        userRating: userRating,
                        busy: ratingBusy,
                        onRate: onRate,
                      ),
                      const SizedBox(height: 8),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // CTA button — full width
              ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: SmarturStyle.orange,
                        foregroundColor: Colors.white,
                        minimumSize: const Size(double.infinity, 52),
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
            ],
          ),
        ),
    );
  }
}

// ── Reusable small widgets ──

class _ServiceInfoBand extends StatelessWidget {
  final double? priceFrom;
  final double? priceTo;
  final String currency;
  final int? durationMinutes;
  final String? contactPhone;
  final Map<String, String>? operatingHours;

  const _ServiceInfoBand({
    this.priceFrom,
    this.priceTo,
    required this.currency,
    this.durationMinutes,
    this.contactPhone,
    this.operatingHours,
  });

  String _formatPrice() {
    if (priceFrom == null && priceTo == null) return '';
    final sym = currency == 'MXN' ? '\$' : currency;
    if (priceFrom != null && priceTo != null && priceTo != priceFrom) {
      return '$sym${priceFrom!.toStringAsFixed(0)}–${priceTo!.toStringAsFixed(0)}';
    }
    final val = priceFrom ?? priceTo!;
    return '$sym${val.toStringAsFixed(0)}';
  }

  String _formatDuration() {
    if (durationMinutes == null) return '';
    final h = durationMinutes! ~/ 60;
    final m = durationMinutes! % 60;
    if (h > 0 && m > 0) return '${h}h ${m}min';
    if (h > 0) return '${h}h';
    return '${m}min';
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final chips = <_InfoChip>[];

    final price = _formatPrice();
    if (price.isNotEmpty) {
      chips.add(_InfoChip(icon: Icons.attach_money_rounded, label: price, color: SmarturStyle.green));
    }

    final dur = _formatDuration();
    if (dur.isNotEmpty) {
      chips.add(_InfoChip(icon: Icons.schedule_rounded, label: dur, color: SmarturStyle.blue));
    }

    if (contactPhone != null) {
      chips.add(_InfoChip(icon: Icons.phone_rounded, label: contactPhone!, color: SmarturStyle.purple));
    }

    if (operatingHours != null && operatingHours!.isNotEmpty) {
      final dayOrder = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'];
      final today = dayOrder[DateTime.now().weekday - 1 < 7 ? DateTime.now().weekday - 1 : 6];
      final todayHours = operatingHours![today];
      if (todayHours != null) {
        chips.add(_InfoChip(icon: Icons.door_front_door_rounded, label: 'Hoy: $todayHours', color: SmarturStyle.orange));
      }
    }

    if (chips.isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Wrap(
        spacing: 8,
        runSpacing: 6,
        children: chips,
      ),
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
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.30)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: color),
          const SizedBox(width: 5),
          Text(
            label,
            style: TextStyle(
              fontFamily: 'Outfit',
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  final String label;
  const _SectionLabel({required this.label});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.only(top: 14, bottom: 6),
      child: Row(
        children: [
          Container(
            width: 3,
            height: 13,
            decoration: BoxDecoration(
              color: SmarturStyle.orange,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(width: 7),
          Text(
            label.toUpperCase(),
            style: TextStyle(
              fontFamily: 'Outfit',
              fontWeight: FontWeight.w700,
              fontSize: 10,
              letterSpacing: 0.8,
              color: scheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}

class _RatingPill extends StatelessWidget {
  final double rating;
  const _RatingPill({required this.rating});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: SmarturStyle.orange.withValues(alpha: 0.15),
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
            style: TextStyle(
              fontFamily: 'Outfit',
              fontWeight: FontWeight.w800,
              color: scheme.onSurface,
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
    final semantic = Theme.of(context).extension<SmarturSemanticColors>()!;
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
              color: semantic.imageScrimStrong.withValues(alpha: 0.55),
              borderRadius: BorderRadius.circular(999),
              border: Border.all(color: semantic.overlayBorder),
            ),
            child: Text(
              '+$remaining',
              style: TextStyle(
                fontFamily: 'Outfit',
                color: semantic.onImageText,
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
    final scheme = Theme.of(context).colorScheme;
    final semantic = Theme.of(context).extension<SmarturSemanticColors>()!;
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(color: semantic.overlayBorder.withValues(alpha: 0.9), width: 2),
      ),
      child: ClipOval(
        child: CachedNetworkImage(
          imageUrl: url,
          fit: BoxFit.cover,
          filterQuality: FilterQuality.medium,
          placeholder: (_, __) => Container(color: scheme.surfaceContainerHighest),
          errorWidget: (_, __, ___) => Container(
            color: scheme.surfaceContainerHighest,
            child: Icon(Icons.image_not_supported_outlined, color: semantic.onImageMuted, size: 20),
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
    final scheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.only(top: 4, bottom: 4),
      child: Text(
        text,
        style: TextStyle(
          fontFamily: 'Outfit',
          fontSize: 12,
          height: 1.4,
          color: scheme.onSurface.withValues(alpha: 0.8),
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
    final l10n = AppLocalizations.of(context)!;
    final semantic = Theme.of(context).extension<SmarturSemanticColors>()!;
    return GestureDetector(
      onTap: _openDirections,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
        decoration: BoxDecoration(
          color: semantic.info.withValues(alpha: 0.20),
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: semantic.info.withValues(alpha: 0.40)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.directions_rounded, size: 12, color: semantic.info),
            const SizedBox(width: 4),
            Text(
              l10n.openInMaps,
              style: TextStyle(
                fontFamily: 'Outfit',
                fontSize: 10,
                fontWeight: FontWeight.w700,
                color: semantic.info,
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
    final scheme = Theme.of(context).colorScheme;
    final semantic = Theme.of(context).extension<SmarturSemanticColors>()!;
    final hasRated = userRating != null;

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        const SizedBox(height: 4),
        if (!hasRated) ...[
            Text(
              l10n.rateHint,
              style: TextStyle(
                fontFamily: 'Outfit',
                fontSize: 11,
                color: scheme.onSurface.withValues(alpha: 0.65),
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
                    color: filled ? semantic.warning : scheme.onSurfaceVariant,
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
              style: TextStyle(
                fontFamily: 'Outfit',
                fontSize: 11,
                color: semantic.warning,
              ),
            ),
          ],
          if (busy)
            Padding(
              padding: EdgeInsets.only(top: 6),
              child: SizedBox(
                width: 14,
                height: 14,
                child: CircularProgressIndicator(
                  strokeWidth: 1.5,
                  valueColor: AlwaysStoppedAnimation<Color>(scheme.onSurfaceVariant),
                ),
              ),
            ),
        ],
      );
  }
}

// ═══════════════════════════════════════════════════════════════════
// DayPlanSheet — "Crear Ruta de 1 Día" bottom sheet
// ═══════════════════════════════════════════════════════════════════

/// Categorías de lugares para el día plan
enum _DaySlot {
  morning('Mañana', 'Naturaleza / Aventura', Icons.terrain_rounded, Color(0xFF9CCC44)),
  midday('Mediodía', 'Gastronomía / Restaurante', Icons.restaurant_rounded, Color(0xFFFF7D1F)),
  afternoon('Tarde', 'Cultural / Museo', Icons.museum_rounded, Color(0xFF984EFD)),
  sunset('Atardecer', 'Mirador / Parque', Icons.landscape_rounded, Color(0xFF4DB9CA));

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
    final scheme = Theme.of(context).colorScheme;

    return ClipRRect(
      borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
      child: Container(
        color: scheme.surface,
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
                      color: scheme.onSurfaceVariant.withValues(alpha: 0.35),
                      borderRadius: BorderRadius.circular(999),
                    ),
                  ),
                ),
                // Title
                Row(
                  children: [
                    Icon(Icons.route_rounded, color: SmarturStyle.orange, size: 22),
                    const SizedBox(width: 10),
                    Text(
                      'Ruta de 1 Día',
                      style: TextStyle(
                        fontFamily: 'CalSans',
                        fontSize: 22,
                        color: scheme.onSurface,
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
                    color: scheme.onSurfaceVariant,
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
                      color: scheme.surfaceContainerHighest.withValues(alpha: 0.6),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.explore_outlined, color: scheme.onSurfaceVariant, size: 16),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Explora más lugares en $cityName para completar tu ruta.',
                            style: TextStyle(
                              fontFamily: 'Outfit',
                              fontSize: 11,
                              color: scheme.onSurfaceVariant,
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
    final scheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isCurrent
              ? slot.color.withValues(alpha: 0.12)
              : scheme.surfaceContainerHighest.withValues(alpha: 0.5),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isCurrent
                ? slot.color.withValues(alpha: 0.40)
                : scheme.outlineVariant.withValues(alpha: 0.5),
          ),
        ),
        child: Row(
          children: [
            // Slot icon
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: slot.color.withValues(alpha: 0.15),
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
                    style: TextStyle(
                      fontFamily: 'Outfit',
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: scheme.onSurface,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (isCurrent)
                    Text(
                      AppLocalizations.of(context)!.youAreHere,
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
                  color: scheme.surfaceContainerHighest,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.map_outlined, size: 12, color: scheme.onSurfaceVariant),
                    const SizedBox(width: 4),
                    Text(
                      AppLocalizations.of(context)!.mapsLabel,
                      style: TextStyle(
                        fontFamily: 'Outfit',
                        fontSize: 10,
                        color: scheme.onSurfaceVariant,
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
