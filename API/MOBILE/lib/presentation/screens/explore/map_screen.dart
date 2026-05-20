import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:smartur/l10n/app_localizations.dart';

import '../../../core/theme/style_guide.dart';
import '../../widgets/smartur_background.dart';

class MapScreen extends StatefulWidget {
  const MapScreen({super.key});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  // Centro aproximado de la región de las Altas Montañas (Orizaba / Córdoba).
  final LatLng _initialCenter = const LatLng(18.8654, -97.0864);
  final double _initialZoom = 13.0;

  // Filtros disponibles
  final List<String> _filters = const ['Todos', 'Museos', 'Cafés', 'Miradores'];
  String _selectedFilter = 'Todos';

  // Lugares mockeados para demo
  final List<_PlaceMarker> _places = const [
    _PlaceMarker(
      name: 'Teleférico de Orizaba',
      description: 'Vista panorámica de las Altas Montañas.',
      category: 'Miradores',
      point: LatLng(18.8510, -97.0990),
      icon: Icons.landscape,
      color: SmarturStyle.purple,
    ),
    _PlaceMarker(
      name: 'Museo de Arte del Estado',
      description: 'Galería histórica de la región.',
      category: 'Museos',
      point: LatLng(18.8504, -97.1029),
      icon: Icons.museum,
      color: SmarturStyle.blue,
    ),
    _PlaceMarker(
      name: 'Café del Río',
      description: 'Café de especialidad junto al río.',
      category: 'Cafés',
      point: LatLng(18.8532, -97.1001),
      icon: Icons.local_cafe,
      color: SmarturStyle.pink,
    ),
  ];

  _PlaceMarker? _selectedPlace;

  List<_PlaceMarker> get _visiblePlaces {
    if (_selectedFilter == 'Todos') return _places;
    return _places.where((p) => p.category == _selectedFilter).toList();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      backgroundColor: scheme.surface,
      body: SmarturBackgroundTop(
        child: SafeArea(
          child: Stack(
            children: [
              _buildMap(),
              _buildTopFiltersBar(l10n),
              _buildBottomInfoCard(l10n),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMap() {
    return Padding(
      padding: const EdgeInsets.all(12),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: FlutterMap(
          options: MapOptions(
            initialCenter: _initialCenter,
            initialZoom: _initialZoom,
            minZoom: 8.0,
            maxZoom: 18.0,
          ),
          children: [
            TileLayer(
              urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
              userAgentPackageName: 'com.smartur.app',
            ),
            MarkerLayer(
              markers: _visiblePlaces
                  .map(
                    (place) => Marker(
                      point: place.point,
                      width: 52,
                      height: 52,
                      child: GestureDetector(
                        onTap: () {
                          setState(() => _selectedPlace = place);
                        },
                        child: AnimatedScale(
                          duration: const Duration(milliseconds: 200),
                          scale: _selectedPlace == place ? 1.1 : 1.0,
                          child: Container(
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: Colors.white,
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.18),
                                  blurRadius: 8,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            alignment: Alignment.center,
                            child: Icon(
                              place.icon,
                              color: place.color,
                              size: 26,
                            ),
                          ),
                        ),
                      ),
                    ),
                  )
                  .toList(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTopFiltersBar(AppLocalizations l10n) {
    final scheme = Theme.of(context).colorScheme;
    return Positioned(
      top: 8,
      left: 12,
      right: 12,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
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
              ],
            ),
          ),
          const SizedBox(height: 10),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: _filters.map((f) {
                final isSelected = f == _selectedFilter;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ActionChip(
                    label: Text(
                      f == 'Museos'
                          ? l10n.filterMuseumsOnly
                          : switch (f) {
                              'Todos' => l10n.filterAll,
                              'Museos' => l10n.filterMuseums,
                              'Cafés' => l10n.filterCafes,
                              'Miradores' => l10n.filterViewpoints,
                              _ => f,
                            },
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
                    onPressed: () {
                      setState(() {
                        _selectedFilter = f;
                        _selectedPlace = null;
                      });
                    },
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomInfoCard(AppLocalizations l10n) {
    final scheme = Theme.of(context).colorScheme;
    final place = _selectedPlace;
    if (place == null) {
      return Positioned(
        bottom: 20,
        left: 24,
        right: 24,
        child: Align(
          alignment: Alignment.bottomCenter,
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
                Icon(Icons.touch_app_outlined,
                    size: 18, color: scheme.onSurfaceVariant),
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
        ),
      );
    }

    return Positioned(
      bottom: 20,
      left: 24,
      right: 24,
      child: GestureDetector(
        onTap: () {
          // Aquí podrías navegar a detalle completo del lugar
        },
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
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: place.color.withValues(alpha: 0.15),
                ),
                child: Icon(place.icon, color: place.color),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      place.name,
                      style: const TextStyle(
                        fontFamily: 'Outfit',
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      place.description,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontFamily: 'Outfit',
                        fontSize: 12,
                        color: scheme.onSurfaceVariant,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${l10n.aiSmartur} · ${place.category}',
                      style: TextStyle(
                        fontFamily: 'Outfit',
                        fontSize: 11,
                        color: scheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(Icons.chevron_right, color: scheme.onSurfaceVariant),
            ],
          ),
        ),
      ),
    );
  }
}

class _PlaceMarker {
  final String name;
  final String description;
  final String category;
  final LatLng point;
  final IconData icon;
  final Color color;

  const _PlaceMarker({
    required this.name,
    required this.description,
    required this.category,
    required this.point,
    required this.icon,
    required this.color,
  });
}
