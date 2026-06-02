import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:smartur/l10n/app_localizations.dart';

import '../../../core/motion/smartur_routes.dart';
import '../../../core/theme/style_guide.dart';
import '../../../data/models/place_model.dart';
import '../../../data/services/explore_service.dart';
import '../../widgets/smartur_background.dart';
import 'detail_view_page.dart';

/// Filtro activo en el mapa.
enum _MapFilter { all, museums, restaurants, adventures, hotels }

class MapScreen extends StatefulWidget {
  const MapScreen({super.key});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  // Centro de la región Altas Montañas (entre Orizaba y Córdoba).
  static const LatLng _regionCenter = LatLng(18.9000, -97.0500);
  static const double _initialZoom = 9.5;

  _MapFilter _filter = _MapFilter.all;
  Place? _selectedPlace;

  List<Place> _allPlaces = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadPlaces();
  }

  Future<void> _loadPlaces() async {
    try {
      final result = await ExploreService().fetchCitiesWithFallback();
      // Solo lugares con coordenadas válidas pueden mostrarse en el mapa.
      final withCoords = result.cities
          .expand((city) => city.places)
          .where((p) => p.lat != null && p.lon != null)
          .toList();
      if (mounted) setState(() { _allPlaces = withCoords; _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  List<Place> get _visiblePlaces {
    if (_filter == _MapFilter.all) return _allPlaces;
    final cat = _filterToCategory(_filter);
    return _allPlaces.where((p) => p.category == cat).toList();
  }

  PlaceCategory? _filterToCategory(_MapFilter f) => switch (f) {
        _MapFilter.museums     => PlaceCategory.museums,
        _MapFilter.restaurants => PlaceCategory.restaurants,
        _MapFilter.adventures  => PlaceCategory.adventures,
        _MapFilter.hotels      => PlaceCategory.hotels,
        _MapFilter.all         => null,
      };

  Color _colorForCategory(PlaceCategory cat) => switch (cat) {
        PlaceCategory.museums     => SmarturStyle.purple,
        PlaceCategory.restaurants => SmarturStyle.orange,
        PlaceCategory.adventures  => SmarturStyle.green,
        PlaceCategory.hotels      => SmarturStyle.blue,
      };

  IconData _iconForCategory(PlaceCategory cat) => switch (cat) {
        PlaceCategory.museums     => Icons.museum_rounded,
        PlaceCategory.restaurants => Icons.restaurant_rounded,
        PlaceCategory.adventures  => Icons.terrain_rounded,
        PlaceCategory.hotels      => Icons.hotel_rounded,
      };

  String _filterLabel(AppLocalizations l10n, _MapFilter f) => switch (f) {
        _MapFilter.all         => l10n.filterAll,
        _MapFilter.museums     => l10n.filterMuseums,
        _MapFilter.restaurants => l10n.filterCafes,
        _MapFilter.adventures  => l10n.filterViewpoints,
        _MapFilter.hotels      => l10n.filterHotels,
      };

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final scheme = Theme.of(context).colorScheme;

    return Scaffold(
      backgroundColor: scheme.surface,
      body: SmarturBackgroundTop(
        child: SafeArea(
          child: _isLoading
              ? _buildLoader(scheme)
              : _error != null
                  ? _buildError(l10n, scheme)
                  : Stack(
                      children: [
                        _buildMap(),
                        _buildTopFiltersBar(l10n, scheme),
                        _buildBottomCard(l10n, scheme),
                      ],
                    ),
        ),
      ),
    );
  }

  // ── Loading ──────────────────────────────────────────────────────────────

  Widget _buildLoader(ColorScheme scheme) => Center(
        child: CircularProgressIndicator(color: scheme.primary),
      );

  Widget _buildError(AppLocalizations l10n, ColorScheme scheme) => Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.wifi_off_rounded, size: 48, color: scheme.onSurfaceVariant),
              const SizedBox(height: 12),
              Text(
                l10n.homeOfflineBanner,
                style: TextStyle(fontFamily: 'Outfit', color: scheme.onSurfaceVariant),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              FilledButton(
                onPressed: () { setState(() { _isLoading = true; _error = null; }); _loadPlaces(); },
                child: Text(
                  l10n.mapRetry,
                  style: const TextStyle(fontFamily: 'Outfit'),
                ),
              ),
            ],
          ),
        ),
      );

  // ── Map ──────────────────────────────────────────────────────────────────

  Widget _buildMap() => Padding(
        padding: const EdgeInsets.all(12),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(24),
          child: FlutterMap(
            options: MapOptions(
              initialCenter: _regionCenter,
              initialZoom: _initialZoom,
              minZoom: 7.0,
              maxZoom: 18.0,
              onTap: (_, __) => setState(() => _selectedPlace = null),
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.example.app_smartur',
              ),
              MarkerLayer(
                markers: _visiblePlaces.map((place) {
                  final color = _colorForCategory(place.category);
                  final icon  = _iconForCategory(place.category);
                  final isSelected = _selectedPlace?.id == place.id;
                  return Marker(
                    point: LatLng(place.lat!, place.lon!),
                    width: isSelected ? 60 : 48,
                    height: isSelected ? 60 : 48,
                    child: GestureDetector(
                      onTap: () => setState(() => _selectedPlace = place),
                      child: AnimatedScale(
                        duration: const Duration(milliseconds: 200),
                        scale: isSelected ? 1.15 : 1.0,
                        child: Container(
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: Colors.white,
                            border: isSelected
                                ? Border.all(color: color, width: 2.5)
                                : null,
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: isSelected ? 0.25 : 0.14),
                                blurRadius: isSelected ? 12 : 6,
                                offset: const Offset(0, 3),
                              ),
                            ],
                          ),
                          alignment: Alignment.center,
                          child: Icon(icon, color: color, size: isSelected ? 30 : 24),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ],
          ),
        ),
      );

  // ── Filters bar ──────────────────────────────────────────────────────────

  Widget _buildTopFiltersBar(AppLocalizations l10n, ColorScheme scheme) => Positioned(
        top: 8,
        left: 12,
        right: 12,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(18),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.08),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Row(
                children: [
                  const Icon(Icons.explore_outlined, color: SmarturStyle.purple),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      l10n.mapDiscoverHint,
                      style: TextStyle(
                        fontFamily: 'Outfit',
                        fontSize: 12,
                        color: scheme.onSurfaceVariant,
                      ),
                    ),
                  ),
                  if (_allPlaces.isNotEmpty)
                    Text(
                      '${_visiblePlaces.length}',
                      style: const TextStyle(
                        fontFamily: 'Outfit',
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: SmarturStyle.purple,
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 10),
            // Category chips
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: _MapFilter.values.map((f) {
                  final isSelected = f == _filter;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ActionChip(
                      label: Text(
                        _filterLabel(l10n, f),
                        style: TextStyle(
                          fontFamily: 'Outfit',
                          fontSize: 12,
                          fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                          color: isSelected ? Colors.white : scheme.onSurfaceVariant,
                        ),
                      ),
                      backgroundColor: isSelected ? SmarturStyle.purple : Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(24),
                        side: BorderSide(
                          color: isSelected ? SmarturStyle.purple : scheme.outlineVariant,
                        ),
                      ),
                      elevation: isSelected ? 2 : 0,
                      onPressed: () => setState(() {
                        _filter = f;
                        _selectedPlace = null;
                      }),
                    ),
                  );
                }).toList(),
              ),
            ),
          ],
        ),
      );

  // ── Bottom info card ──────────────────────────────────────────────────────

  Widget _buildBottomCard(AppLocalizations l10n, ColorScheme scheme) {
    final place = _selectedPlace;

    if (place == null) {
      return Positioned(
        bottom: 20,
        left: 24,
        right: 24,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.08),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.touch_app_outlined, size: 18, color: scheme.onSurfaceVariant),
              const SizedBox(width: 8),
              Text(
                l10n.mapTapPinHint,
                style: TextStyle(
                  fontFamily: 'Outfit',
                  fontSize: 12,
                  color: scheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
      );
    }

    final color = _colorForCategory(place.category);
    final icon  = _iconForCategory(place.category);

    return Positioned(
      bottom: 20,
      left: 24,
      right: 24,
      child: GestureDetector(
        onTap: () => Navigator.push(
          context,
          smarturDetailRoute(
            DetailViewPage(
              title: place.name,
              heroTag: 'map_${place.id}',
              heroImageUrl: place.imageUrl,
              subtitle: place.shortDescription,
              locationLine: place.locationLine,
              rating: place.rating,
              galleryUrls: place.galleryUrls,
              placeId: place.id,
              lat: place.lat,
              lon: place.lon,
            ),
          ),
        ),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 250),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(18),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.15),
                blurRadius: 16,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Row(
            children: [
              // Thumbnail / category icon
              ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: place.imageUrl.isNotEmpty
                    ? Image.network(
                        place.imageUrl,
                        width: 52,
                        height: 52,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => _categoryIconBox(icon, color),
                      )
                    : _categoryIconBox(icon, color),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      place.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontFamily: 'Outfit',
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      place.locationLine,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontFamily: 'Outfit',
                        fontSize: 12,
                        color: scheme.onSurfaceVariant,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Icon(Icons.star_rounded, size: 13, color: Colors.amber[700]),
                        const SizedBox(width: 2),
                        Text(
                          place.rating.toStringAsFixed(1),
                          style: TextStyle(
                            fontFamily: 'Outfit',
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: scheme.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Icon(Icons.chevron_right_rounded, color: scheme.onSurfaceVariant),
            ],
          ),
        ),
      ),
    );
  }

  Widget _categoryIconBox(IconData icon, Color color) => Container(
        width: 52,
        height: 52,
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: color, size: 28),
      );
}
