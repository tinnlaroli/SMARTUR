import 'dart:convert';
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';

import '../../../core/theme/style_guide.dart';
import '../../../core/constants/api_constants.dart';
import '../../../data/services/api_client.dart';
import '../../../data/services/auth_service.dart';
import '../../../data/services/profile_service.dart';
import '../../../data/services/user_content_service.dart';
import '../../../data/services/explore_service.dart';
import '../../../data/models/place_model.dart';
import '../../../core/utils/notifications.dart';
import '../../widgets/smartur_background.dart';
import 'detail_view_page.dart';

// ═══════════════════════════════════════════════════════════════════════════
// Recommendation Screen — visual-first AI experience
// ═══════════════════════════════════════════════════════════════════════════

class RecommendationScreen extends StatefulWidget {
  final String? city;
  const RecommendationScreen({super.key, this.city});

  @override
  State<RecommendationScreen> createState() => _RecommendationScreenState();
}

// ── Tourism type model ───────────────────────────────────────────────────────

class _TourType {
  final String id;
  final String label;
  final IconData icon;
  const _TourType(this.id, this.label, this.icon);
}

const _tourTypes = [
  _TourType('cultural',    'Cultural',    Icons.museum_outlined),
  _TourType('naturaleza',  'Naturaleza',  Icons.forest_outlined),
  _TourType('gastronomico','Gastronómico',Icons.restaurant_menu_outlined),
  _TourType('aventura',    'Aventura',    Icons.hiking_outlined),
  _TourType('descanso',    'Descanso',    Icons.self_improvement_outlined),
  _TourType('nocturno',    'Nocturno',    Icons.nightlife_outlined),
];

// ── Budget model ─────────────────────────────────────────────────────────────

const _budgets = [
  ('bajo',  '💚', 'Bajo',  'Máx. \$500 MXN/día'),
  ('medio', '💛', 'Medio', '\$500–\$1500/día'),
  ('alto',  '🔴', 'Alto',  '\$1500+/día'),
];

// ── Group model ──────────────────────────────────────────────────────────────

const _groups = [
  ('solo',    Icons.person_outline,              'Solo'),
  ('pareja',  Icons.favorite_border_rounded,     'Pareja'),
  ('familia', Icons.family_restroom_outlined,    'Familia'),
  ('amigos',  Icons.people_outline,              'Amigos'),
];

// ── Age ranges ───────────────────────────────────────────────────────────────

const _ageRanges = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'];

// ─────────────────────────────────────────────────────────────────────────────

class _RecommendationScreenState extends State<RecommendationScreen> {
  // ── Form state ────────────────────────────────────────────────────────────
  final Set<String> _selectedTypes = {'cultural', 'gastronomico'};
  String _budget = 'medio';
  String _groupType = 'familia';
  String _ageRange = '35-44';
  bool _wantsTours = false;
  bool _needsHotel = false;
  bool _prefFood = true;
  bool _reqAccesibilidad = false;
  bool _prefOutdoor = false;

  // ── Network state ─────────────────────────────────────────────────────────
  bool _isLoadingProfile = true;
  bool _isFetching = false;
  List<dynamic> _recommendations = [];
  int? _sessionId;

  // ── Place lookup map: item_id → Place ────────────────────────────────────
  Map<String, Place> _placesMap = {};

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    await Future.wait([_loadProfile(), _loadPlaces()]);
    if (mounted) setState(() => _isLoadingProfile = false);
  }

  Future<void> _loadProfile() async {
    try {
      final p = await ProfileService.fetchMyProfileForPreferences();
      if (!mounted || p.isEmpty) return;
      final age = p['age'] as int?;
      if (age != null) {
        if (age < 25)      _ageRange = '18-24';
        else if (age < 35) _ageRange = '25-34';
        else if (age < 45) _ageRange = '35-44';
        else if (age < 55) _ageRange = '45-54';
        else if (age < 65) _ageRange = '55-64';
        else               _ageRange = '65+';
      }
      final interests = (p['interests'] as List?)?.cast<String>() ?? [];
      final valid = interests.where((e) => _tourTypes.any((t) => t.id == e.toLowerCase())).toList();
      if (valid.isNotEmpty) {
        _selectedTypes
          ..clear()
          ..addAll(valid.map((e) => e.toLowerCase()));
      }
      if (p['has_accessibility'] == true) _reqAccesibilidad = true;
    } catch (_) {}
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
      if (mounted) setState(() => _placesMap = map);
    } catch (_) {}
  }

  Future<Position?> _getLocation() async {
    try {
      if (!await Geolocator.isLocationServiceEnabled()) return null;
      var perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        perm = await Geolocator.requestPermission();
        if (perm == LocationPermission.denied) return null;
      }
      if (perm == LocationPermission.deniedForever) return null;
      return await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.low,
          timeLimit: Duration(seconds: 5),
        ),
      );
    } catch (_) {
      return null;
    }
  }

  Future<void> _fetchRecommendations() async {
    if (_selectedTypes.isEmpty) {
      SmarturNotifications.showError(context, 'Selecciona al menos un tipo de turismo');
      return;
    }

    setState(() {
      _isFetching = true;
      _recommendations = [];
    });

    try {
      final userId = await AuthService().getUserId();
      if (userId == null) {
        if (mounted) {
          SmarturNotifications.showError(context, 'Sesión expirada. Inicia sesión de nuevo.');
        }
        return;
      }

      final position = await _getLocation();

      final url = Uri.parse('${ApiConstants.baseUrl}/ml/recommend/$userId');
      final payload = {
        'alpha': 0.2,
        'top_n': 6,
        'context': {
          'presupuesto_bucket': _budget,
          'edad_range': _ageRange,
          'tiposTurismo': _selectedTypes.toList(),
          'group_type': _groupType,
          'wants_tours': _wantsTours,
          'needs_hotel': _needsHotel,
          'pref_food': _prefFood,
          'requiere_accesibilidad': _reqAccesibilidad,
          'pref_outdoor': _prefOutdoor,
          'lat': position?.latitude,
          'lon': position?.longitude,
        },
      };

      final response = await ApiClient.post(url, body: jsonEncode(payload));

      if (response.statusCode == 200) {
        final data = jsonDecode(utf8.decode(response.bodyBytes));
        final recs = (data is List)
            ? data
            : (data['recommendations'] as List? ?? [data]);
        final sid = data is Map ? (data['session_id'] as int?) : null;
        if (mounted) {
          setState(() {
            _recommendations = recs;
            _sessionId = sid;
          });
          if (recs.isNotEmpty) _showResults();
        }
      } else if (response.statusCode == 401) {
        if (mounted) SmarturNotifications.showError(context, 'Sesión expirada. Inicia sesión de nuevo.');
      } else {
        final msg = ApiClient.extractApiMessage(response, fallback: 'El servicio de recomendaciones no está disponible ahora.');
        if (mounted) SmarturNotifications.showError(context, msg);
      }
    } catch (e) {
      if (mounted) {
        SmarturNotifications.showError(context, 'No se pudo conectar al servicio de recomendaciones.');
      }
    } finally {
      if (mounted) setState(() => _isFetching = false);
    }
  }

  void _recordFeedback(String itemId, {required int rankPos, required bool clicked}) {
    final sid = _sessionId;
    if (sid == null) return;
    UserContentService().recordRecommendationFeedback(
      sessionId: sid,
      itemId: itemId,
      rankPos: rankPos,
      clicked: clicked,
    );
  }

  void _showResults() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _ResultsSheet(
        recommendations: _recommendations,
        placesMap: _placesMap,
        onFeedback: _recordFeedback,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      backgroundColor: Colors.transparent,
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Recomendaciones IA',
          style: TextStyle(
            fontFamily: 'CalSans',
            color: Colors.white,
            fontSize: 20,
          ),
        ),
      ),
      body: SmarturBackgroundTop(
        child: _isLoadingProfile
            ? const Center(child: CircularProgressIndicator(color: Colors.white))
            : _buildBody(scheme),
      ),
    );
  }

  Widget _buildBody(ColorScheme scheme) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, kToolbarHeight + 40, 16, 32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // ── Header ────────────────────────────────────────────────────
          _GlassCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: SmarturStyle.purple.withValues(alpha: 0.25),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: const Icon(Icons.auto_awesome_rounded,
                          color: SmarturStyle.purple, size: 22),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Descubre tu próximo destino',
                            style: SmarturStyle.calSansTitle.copyWith(
                              fontSize: 18,
                              color: scheme.onSurface,
                            ),
                          ),
                          Text(
                            'IA personalizada para ti · Altas Montañas',
                            style: TextStyle(
                              fontFamily: 'Outfit',
                              fontSize: 11,
                              color: scheme.onSurface.withValues(alpha: 0.5),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // ── Tourism types ─────────────────────────────────────────────
          _SectionCard(
            title: '¿Qué tipo de turismo buscas?',
            subtitle: 'Elige uno o varios',
            required: true,
            child: Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _tourTypes.map((t) {
                final sel = _selectedTypes.contains(t.id);
                return _SelectChip(
                  label: t.label,
                  icon: t.icon,
                  selected: sel,
                  onTap: () => setState(() {
                    if (sel) _selectedTypes.remove(t.id);
                    else _selectedTypes.add(t.id);
                  }),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 12),

          // ── Budget ────────────────────────────────────────────────────
          _SectionCard(
            title: 'Presupuesto',
            child: Row(
              children: _budgets.map((b) {
                final sel = _budget == b.$1;
                return Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 3),
                    child: _BudgetButton(
                      emoji: b.$2,
                      label: b.$3,
                      sub: b.$4,
                      selected: sel,
                      onTap: () => setState(() => _budget = b.$1),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 12),

          // ── Group type ────────────────────────────────────────────────
          _SectionCard(
            title: '¿Con quién viajas?',
            child: Row(
              children: _groups.map((g) {
                final sel = _groupType == g.$1;
                return Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 3),
                    child: _GroupButton(
                      icon: g.$2,
                      label: g.$3,
                      selected: sel,
                      onTap: () => setState(() => _groupType = g.$1),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 12),

          // ── Age range ─────────────────────────────────────────────────
          _SectionCard(
            title: 'Rango de edad',
            child: Wrap(
              spacing: 6,
              runSpacing: 6,
              children: _ageRanges.map((a) {
                final sel = _ageRange == a;
                return GestureDetector(
                  onTap: () => setState(() => _ageRange = a),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 160),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: sel
                          ? SmarturStyle.purple
                          : Theme.of(context).colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: sel ? SmarturStyle.purple : Colors.transparent,
                      ),
                    ),
                    child: Text(
                      a,
                      style: TextStyle(
                        fontFamily: 'Outfit',
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: sel ? Colors.white : Theme.of(context).colorScheme.onSurface,
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 12),

          // ── Preferences ───────────────────────────────────────────────
          _SectionCard(
            title: 'Preferencias adicionales',
            subtitle: 'Opcional',
            child: Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _ToggleChip(
                  icon: Icons.map_outlined,
                  label: 'Tours guiados',
                  value: _wantsTours,
                  onChanged: (v) => setState(() => _wantsTours = v),
                ),
                _ToggleChip(
                  icon: Icons.hotel_outlined,
                  label: 'Necesito hotel',
                  value: _needsHotel,
                  onChanged: (v) => setState(() => _needsHotel = v),
                ),
                _ToggleChip(
                  icon: Icons.restaurant_menu_outlined,
                  label: 'Opciones de comida',
                  value: _prefFood,
                  onChanged: (v) => setState(() => _prefFood = v),
                ),
                _ToggleChip(
                  icon: Icons.accessible_outlined,
                  label: 'Accesible',
                  value: _reqAccesibilidad,
                  onChanged: (v) => setState(() => _reqAccesibilidad = v),
                ),
                _ToggleChip(
                  icon: Icons.nature_outlined,
                  label: 'Al aire libre',
                  value: _prefOutdoor,
                  onChanged: (v) => setState(() => _prefOutdoor = v),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // ── CTA ───────────────────────────────────────────────────────
          _CTAButton(
            loading: _isFetching,
            disabled: _selectedTypes.isEmpty,
            onTap: _fetchRecommendations,
          ),
          const SizedBox(height: 12),

          if (_selectedTypes.isEmpty)
            Center(
              child: Text(
                'Selecciona al menos un tipo de turismo para continuar',
                style: TextStyle(
                  fontFamily: 'Outfit',
                  fontSize: 11,
                  color: Theme.of(context).colorScheme.error.withValues(alpha: 0.8),
                ),
                textAlign: TextAlign.center,
              ),
            ),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Results bottom sheet
// ═══════════════════════════════════════════════════════════════════════════

class _ResultsSheet extends StatelessWidget {
  final List<dynamic> recommendations;
  final Map<String, Place> placesMap;
  final void Function(String itemId, {required int rankPos, required bool clicked}) onFeedback;

  const _ResultsSheet({
    required this.recommendations,
    required this.placesMap,
    required this.onFeedback,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
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
              border: Border(
                top: BorderSide(color: scheme.outline.withValues(alpha: 0.15)),
              ),
            ),
            child: Column(
              children: [
                const SizedBox(height: 12),
                Container(
                  width: 36,
                  height: 4,
                  decoration: BoxDecoration(
                    color: scheme.outlineVariant,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
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
                        child: const Icon(Icons.auto_awesome_rounded,
                            color: SmarturStyle.purple, size: 18),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '${recommendations.length} destinos perfectos',
                              style: SmarturStyle.calSansTitle.copyWith(fontSize: 20),
                            ),
                            Text(
                              'Personalizados con IA para tu perfil',
                              style: TextStyle(
                                fontFamily: 'Outfit',
                                fontSize: 11,
                                color: scheme.onSurface.withValues(alpha: 0.5),
                              ),
                            ),
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
                Expanded(
                  child: ListView.builder(
                    controller: controller,
                    padding: const EdgeInsets.fromLTRB(16, 4, 16, 32),
                    itemCount: recommendations.length,
                    itemBuilder: (c, i) => _RecommendationCard(
                      index: i,
                      rec: recommendations[i] as Map<String, dynamic>,
                      place: placesMap[
                          (recommendations[i] as Map)['item_id']?.toString() ?? ''],
                      onTap: (itemId) {
                        onFeedback(itemId, rankPos: i, clicked: true);
                        Navigator.pop(ctx);
                      },
                      onDismiss: (itemId) {
                        onFeedback(itemId, rankPos: i, clicked: false);
                      },
                    ),
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

// ═══════════════════════════════════════════════════════════════════════════
// Single recommendation card
// ═══════════════════════════════════════════════════════════════════════════

class _RecommendationCard extends StatelessWidget {
  final int index;
  final Map<String, dynamic> rec;
  final Place? place;
  final void Function(String) onTap;
  final void Function(String) onDismiss;

  const _RecommendationCard({
    required this.index,
    required this.rec,
    required this.place,
    required this.onTap,
    required this.onDismiss,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final name = place?.name ?? rec['title'] ?? rec['name'] ?? 'Destino ${index + 1}';
    final itemId = (rec['item_id'] ?? '').toString();
    final score = (rec['score'] as num?)?.toDouble() ?? 0.0;
    final tags = (rec['reason_tags'] as List?)?.map((t) => t.toString()).toList() ?? [];
    final city = place?.city ?? '';
    final imageUrl = place?.imageUrl ?? '';
    final description = place?.shortDescription ?? '';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        color: scheme.surfaceContainerHighest.withValues(alpha: 0.45),
        border: Border.all(color: scheme.outline.withValues(alpha: 0.12)),
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: () {
          onTap(itemId);
          if (place != null) {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => DetailViewPage(
                  title: place!.name,
                  heroTag: 'reco_$itemId',
                  heroImageUrl: place!.imageUrl,
                  subtitle: place!.description,
                  locationLine: place!.locationLine,
                  rating: place!.rating,
                  galleryUrls: place!.galleryUrls,
                  placeId: place!.id,
                ),
              ),
            );
          }
        },
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Image ─────────────────────────────────────────────────
            if (imageUrl.isNotEmpty)
              Stack(
                children: [
                  SizedBox(
                    height: 160,
                    width: double.infinity,
                    child: Image.network(
                      imageUrl,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Container(
                        color: SmarturStyle.purple.withValues(alpha: 0.12),
                        child: const Icon(Icons.landscape_outlined,
                            color: Colors.white38, size: 40),
                      ),
                    ),
                  ),
                  // Score badge
                  Positioned(
                    top: 10,
                    right: 10,
                    child: _ScoreBadge(score: score),
                  ),
                  // Rank badge
                  Positioned(
                    top: 10,
                    left: 10,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.55),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        '#${index + 1}',
                        style: const TextStyle(
                          fontFamily: 'CalSans',
                          fontSize: 13,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
                ],
              )
            else
              Container(
                height: 80,
                width: double.infinity,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      SmarturStyle.purple.withValues(alpha: 0.35),
                      SmarturStyle.orange.withValues(alpha: 0.15),
                    ],
                  ),
                ),
                child: Center(
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      _ScoreBadge(score: score),
                      const SizedBox(width: 8),
                      Text(
                        '#${index + 1}',
                        style: const TextStyle(
                          fontFamily: 'CalSans',
                          fontSize: 18,
                          color: Colors.white70,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

            // ── Content ───────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 10, 14, 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title + dismiss
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(
                          name,
                          style: SmarturStyle.calSansTitle.copyWith(fontSize: 15),
                          maxLines: 2,
                        ),
                      ),
                      GestureDetector(
                        onTap: () => onDismiss(itemId),
                        child: Padding(
                          padding: const EdgeInsets.only(left: 8, top: 2),
                          child: Icon(
                            Icons.thumb_down_outlined,
                            size: 16,
                            color: scheme.onSurface.withValues(alpha: 0.35),
                          ),
                        ),
                      ),
                    ],
                  ),

                  if (city.isNotEmpty) ...[
                    const SizedBox(height: 3),
                    Row(
                      children: [
                        Icon(Icons.place_outlined,
                            size: 12, color: scheme.onSurface.withValues(alpha: 0.4)),
                        const SizedBox(width: 3),
                        Text(
                          city,
                          style: TextStyle(
                            fontFamily: 'Outfit',
                            fontSize: 11,
                            color: scheme.onSurface.withValues(alpha: 0.5),
                          ),
                        ),
                      ],
                    ),
                  ],

                  if (description.isNotEmpty) ...[
                    const SizedBox(height: 5),
                    Text(
                      description,
                      style: TextStyle(
                        fontFamily: 'Outfit',
                        fontSize: 12,
                        height: 1.4,
                        color: scheme.onSurface.withValues(alpha: 0.65),
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],

                  // Tags
                  if (tags.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 5,
                      runSpacing: 4,
                      children: tags
                          .take(4)
                          .map((t) => _TagChip(label: t))
                          .toList(),
                    ),
                  ],

                  // See more CTA
                  const SizedBox(height: 10),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                        decoration: BoxDecoration(
                          color: SmarturStyle.purple,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              'Ver destino',
                              style: TextStyle(
                                fontFamily: 'Outfit',
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: Colors.white,
                              ),
                            ),
                            SizedBox(width: 4),
                            Icon(Icons.chevron_right_rounded,
                                color: Colors.white, size: 16),
                          ],
                        ),
                      ),
                    ],
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

// ═══════════════════════════════════════════════════════════════════════════
// Reusable UI components
// ═══════════════════════════════════════════════════════════════════════════

class _GlassCard extends StatelessWidget {
  final Widget child;
  const _GlassCard({required this.child});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: scheme.surfaceContainerHighest.withValues(alpha: 0.6),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: scheme.outline.withValues(alpha: 0.12)),
      ),
      child: child,
    );
  }
}

class _SectionCard extends StatelessWidget {
  final String title;
  final String? subtitle;
  final bool required;
  final Widget child;

  const _SectionCard({
    required this.title,
    this.subtitle,
    this.required = false,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: scheme.surfaceContainerHighest.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: scheme.outline.withValues(alpha: 0.1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                title,
                style: TextStyle(
                  fontFamily: 'Outfit',
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: scheme.onSurface,
                ),
              ),
              if (required) ...[
                const SizedBox(width: 4),
                const Text('*', style: TextStyle(color: SmarturStyle.orange, fontSize: 14)),
              ],
              if (subtitle != null) ...[
                const SizedBox(width: 6),
                Text(
                  subtitle!,
                  style: TextStyle(
                    fontFamily: 'Outfit',
                    fontSize: 11,
                    color: scheme.onSurface.withValues(alpha: 0.4),
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }
}

class _SelectChip extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  const _SelectChip({
    required this.label,
    required this.icon,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 160),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: selected
              ? SmarturStyle.purple
              : scheme.surfaceContainerHighest.withValues(alpha: 0.6),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: selected
                ? SmarturStyle.purple
                : scheme.outline.withValues(alpha: 0.2),
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon,
                size: 14,
                color: selected ? Colors.white : scheme.onSurface.withValues(alpha: 0.6)),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontFamily: 'Outfit',
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: selected ? Colors.white : scheme.onSurface,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _BudgetButton extends StatelessWidget {
  final String emoji;
  final String label;
  final String sub;
  final bool selected;
  final VoidCallback onTap;

  const _BudgetButton({
    required this.emoji,
    required this.label,
    required this.sub,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 160),
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
        decoration: BoxDecoration(
          color: selected
              ? SmarturStyle.purple
              : scheme.surfaceContainerHighest.withValues(alpha: 0.55),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: selected
                ? SmarturStyle.purple
                : scheme.outline.withValues(alpha: 0.15),
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(emoji, style: const TextStyle(fontSize: 18)),
            const SizedBox(height: 2),
            Text(
              label,
              style: TextStyle(
                fontFamily: 'Outfit',
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: selected ? Colors.white : scheme.onSurface,
              ),
            ),
            Text(
              sub,
              style: TextStyle(
                fontFamily: 'Outfit',
                fontSize: 9,
                color: selected
                    ? Colors.white.withValues(alpha: 0.7)
                    : scheme.onSurface.withValues(alpha: 0.4),
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

class _GroupButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _GroupButton({
    required this.icon,
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 160),
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
        decoration: BoxDecoration(
          color: selected
              ? SmarturStyle.purple
              : scheme.surfaceContainerHighest.withValues(alpha: 0.55),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: selected
                ? SmarturStyle.purple
                : scheme.outline.withValues(alpha: 0.15),
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon,
                size: 20,
                color: selected ? Colors.white : scheme.onSurface.withValues(alpha: 0.7)),
            const SizedBox(height: 3),
            Text(
              label,
              style: TextStyle(
                fontFamily: 'Outfit',
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: selected ? Colors.white : scheme.onSurface,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ToggleChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool value;
  final ValueChanged<bool> onChanged;

  const _ToggleChip({
    required this.icon,
    required this.label,
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return GestureDetector(
      onTap: () => onChanged(!value),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 160),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: value
              ? SmarturStyle.orange.withValues(alpha: 0.15)
              : scheme.surfaceContainerHighest.withValues(alpha: 0.5),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: value
                ? SmarturStyle.orange.withValues(alpha: 0.6)
                : scheme.outline.withValues(alpha: 0.15),
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon,
                size: 14,
                color: value ? SmarturStyle.orange : scheme.onSurface.withValues(alpha: 0.5)),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontFamily: 'Outfit',
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: value ? SmarturStyle.orange : scheme.onSurface,
              ),
            ),
            const SizedBox(width: 6),
            Icon(
              value ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded,
              size: 14,
              color: value
                  ? SmarturStyle.orange
                  : scheme.onSurface.withValues(alpha: 0.3),
            ),
          ],
        ),
      ),
    );
  }
}

class _CTAButton extends StatelessWidget {
  final bool loading;
  final bool disabled;
  final VoidCallback onTap;

  const _CTAButton({
    required this.loading,
    required this.disabled,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: (loading || disabled) ? null : onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 160),
        height: 58,
        decoration: BoxDecoration(
          gradient: (loading || disabled)
              ? null
              : const LinearGradient(
                  colors: [SmarturStyle.purple, Color(0xFF9333EA)],
                  begin: Alignment.centerLeft,
                  end: Alignment.centerRight,
                ),
          color: (loading || disabled)
              ? Theme.of(context).colorScheme.surfaceContainerHighest.withValues(alpha: 0.5)
              : null,
          borderRadius: BorderRadius.circular(18),
          boxShadow: (loading || disabled)
              ? null
              : [
                  BoxShadow(
                    color: SmarturStyle.purple.withValues(alpha: 0.35),
                    blurRadius: 16,
                    offset: const Offset(0, 6),
                  ),
                ],
        ),
        child: Center(
          child: loading
              ? const SizedBox(
                  width: 22,
                  height: 22,
                  child: CircularProgressIndicator(
                    color: Colors.white,
                    strokeWidth: 2.5,
                  ),
                )
              : Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.auto_awesome_rounded,
                      color: disabled
                          ? Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.3)
                          : Colors.white,
                      size: 20,
                    ),
                    const SizedBox(width: 10),
                    Text(
                      'Descubrir mis destinos',
                      style: TextStyle(
                        fontFamily: 'Outfit',
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: disabled
                            ? Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.3)
                            : Colors.white,
                      ),
                    ),
                  ],
                ),
        ),
      ),
    );
  }
}

class _ScoreBadge extends StatelessWidget {
  final double score;
  const _ScoreBadge({required this.score});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: SmarturStyle.orange.withValues(alpha: 0.9),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.auto_awesome_rounded, color: Colors.white, size: 11),
          const SizedBox(width: 3),
          Text(
            score.toStringAsFixed(2),
            style: const TextStyle(
              fontFamily: 'Outfit',
              fontWeight: FontWeight.w800,
              color: Colors.white,
              fontSize: 11,
            ),
          ),
        ],
      ),
    );
  }
}

class _TagChip extends StatelessWidget {
  final String label;
  const _TagChip({required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: SmarturStyle.purple.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: SmarturStyle.purple.withValues(alpha: 0.2),
        ),
      ),
      child: Text(
        label,
        style: const TextStyle(
          fontFamily: 'Outfit',
          fontSize: 10,
          fontWeight: FontWeight.w600,
          color: SmarturStyle.purple,
        ),
      ),
    );
  }
}
