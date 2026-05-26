import 'dart:convert';
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:geolocator/geolocator.dart';
import 'package:share_plus/share_plus.dart';

import '../../../core/theme/style_guide.dart';
import '../../../l10n/app_localizations.dart';
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
  _TourType('cultural',     'Cultural',     Icons.museum_outlined),
  _TourType('naturaleza',   'Naturaleza',   Icons.forest_outlined),
  _TourType('gastronomico', 'Gastronómico', Icons.restaurant_menu_outlined),
  _TourType('aventura',     'Aventura',     Icons.hiking_outlined),
  _TourType('descanso',     'Descanso',     Icons.self_improvement_outlined),
  _TourType('nocturno',     'Nocturno',     Icons.nightlife_outlined),
];

// ── Budget model ─────────────────────────────────────────────────────────────
// Tuple: (id, icon, color, label, subtitle)

const _budgets = [
  ('bajo',  Icons.savings_outlined,                  Color(0xFF10B981), 'Económico', 'Máx. \$500/día'),
  ('medio', Icons.account_balance_wallet_outlined,   Color(0xFFF59E0B), 'Moderado',  '\$500–1500/día'),
  ('alto',  Icons.diamond_outlined,                  Color(0xFF8B5CF6), 'Premium',   '\$1500+/día'),
];

// ── Group model ──────────────────────────────────────────────────────────────

const _groups = [
  ('solo',    Icons.person_outline,           'Solo'),
  ('pareja',  Icons.favorite_border_rounded,  'Pareja'),
  ('familia', Icons.family_restroom_outlined, 'Familia'),
  ('amigos',  Icons.people_outline,           'Amigos'),
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
  bool _prefsWereLoaded = false; // true when profile pre-filled the form

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
      bool changed = false;
      final age = p['age'] as int?;
      if (age != null) {
        String range;
        if (age < 25)      range = '18-24';
        else if (age < 35) range = '25-34';
        else if (age < 45) range = '35-44';
        else if (age < 55) range = '45-54';
        else if (age < 65) range = '55-64';
        else               range = '65+';
        if (range != _ageRange) { _ageRange = range; changed = true; }
      }
      final interests = (p['interests'] as List?)?.cast<String>() ?? [];
      final valid = interests.where((e) => _tourTypes.any((t) => t.id == e.toLowerCase())).toList();
      if (valid.isNotEmpty) {
        _selectedTypes
          ..clear()
          ..addAll(valid.map((e) => e.toLowerCase()));
        changed = true;
      }
      if (p['has_accessibility'] == true) { _reqAccesibilidad = true; changed = true; }
      if (changed) _prefsWereLoaded = true;
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
      SmarturNotifications.showError(context, AppLocalizations.of(context)!.recoSelectAtLeastOne);
      return;
    }

    setState(() {
      _isFetching = true;
      _recommendations = [];
    });

    try {
      final userId = await AuthService().getUserId();
      if (userId == null) {
        if (mounted) SmarturNotifications.showError(context, AppLocalizations.of(context)!.sessionExpired);
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
        if (mounted) SmarturNotifications.showError(context, AppLocalizations.of(context)!.sessionExpired);
      } else {
        final msg = ApiClient.extractApiMessage(response, fallback: AppLocalizations.of(context)!.recoServiceUnavailable);
        if (mounted) SmarturNotifications.showError(context, msg);
      }
    } catch (e) {
      if (mounted) SmarturNotifications.showError(context, AppLocalizations.of(context)!.recoConnectionError);
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
    // Capture context before opening sheet so navigation works after the sheet is dismissed
    final navContext = context;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _ResultsSheet(
        recommendations: _recommendations,
        placesMap: _placesMap,
        sessionId: _sessionId,
        onFeedback: _recordFeedback,
        onNavigateToPlace: (place, itemId) {
          Navigator.push(
            navContext,
            MaterialPageRoute(
              builder: (_) => DetailViewPage(
                title: place.name,
                heroTag: 'reco_$itemId',
                heroImageUrl: place.imageUrl,
                subtitle: place.description,
                locationLine: place.locationLine,
                rating: place.rating,
                galleryUrls: place.galleryUrls,
                placeId: place.id,
                lat: place.lat,
                lon: place.lon,
              ),
            ),
          );
        },
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
        title: Text(
          AppLocalizations.of(context)!.recoTitle,
          style: const TextStyle(fontFamily: 'CalSans', color: Colors.white, fontSize: 20),
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
          // ── Header ────────────────────────────────────────────────
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
                            AppLocalizations.of(context)!.recoDiscoverNext,
                            style: SmarturStyle.calSansTitle.copyWith(
                                fontSize: 18, color: scheme.onSurface),
                          ),
                          Text(
                            AppLocalizations.of(context)!.recoAiPersonalizedFor,
                            style: TextStyle(
                              fontFamily: 'Outfit', fontSize: 11,
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

          // ── Preloaded preferences banner ──────────────────────────
          if (_prefsWereLoaded) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
              decoration: BoxDecoration(
                color: SmarturStyle.purple.withValues(alpha: 0.10),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                    color: SmarturStyle.purple.withValues(alpha: 0.20)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.auto_awesome_rounded,
                      color: SmarturStyle.purple, size: 14),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Precargamos respuestas basadas en tus preferencias guardadas',
                      style: TextStyle(
                        fontFamily: 'Outfit', fontSize: 11,
                        color: scheme.onSurface.withValues(alpha: 0.75),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 16),

          // ── Tourism types ─────────────────────────────────────────
          _SectionCard(
            title: AppLocalizations.of(context)!.recoTourismType,
            subtitle: AppLocalizations.of(context)!.recoChooseOneOrMore,
            required: true,
            child: Wrap(
              spacing: 8, runSpacing: 8,
              children: _tourTypes.map((t) {
                final sel = _selectedTypes.contains(t.id);
                return _SelectChip(
                  label: t.label, icon: t.icon, selected: sel,
                  onTap: () => setState(() {
                    if (sel) _selectedTypes.remove(t.id);
                    else _selectedTypes.add(t.id);
                  }),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 12),

          // ── Budget ────────────────────────────────────────────────
          _SectionCard(
            title: AppLocalizations.of(context)!.recoBudget,
            child: Row(
              children: _budgets.map((b) {
                final sel = _budget == b.$1;
                return Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 3),
                    child: _BudgetButton(
                      icon: b.$2,
                      iconColor: b.$3,
                      label: b.$4,
                      sub: b.$5,
                      selected: sel,
                      onTap: () => setState(() => _budget = b.$1),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 12),

          // ── Group type ────────────────────────────────────────────
          _SectionCard(
            title: AppLocalizations.of(context)!.recoWithWho,
            child: Row(
              children: _groups.map((g) {
                final sel = _groupType == g.$1;
                return Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 3),
                    child: _GroupButton(
                      icon: g.$2, label: g.$3, selected: sel,
                      onTap: () => setState(() => _groupType = g.$1),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 12),

          // ── Age range ─────────────────────────────────────────────
          _SectionCard(
            title: AppLocalizations.of(context)!.recoAgeRange,
            child: Wrap(
              spacing: 6, runSpacing: 6,
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
                          : scheme.surfaceContainerHighest.withValues(alpha: 0.5),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                          color: sel ? SmarturStyle.purple : Colors.transparent),
                    ),
                    child: Text(a,
                      style: TextStyle(
                        fontFamily: 'Outfit', fontSize: 13, fontWeight: FontWeight.w600,
                        color: sel ? Colors.white : scheme.onSurface,
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 12),

          // ── Preferences ───────────────────────────────────────────
          _SectionCard(
            title: AppLocalizations.of(context)!.recoAdditionalPrefs,
            subtitle: AppLocalizations.of(context)!.recoOptional,
            child: Wrap(
              spacing: 8, runSpacing: 8,
              children: [
                _ToggleChip(icon: Icons.map_outlined,            label: 'Tours guiados',     value: _wantsTours,        onChanged: (v) => setState(() => _wantsTours = v)),
                _ToggleChip(icon: Icons.hotel_outlined,          label: 'Necesito hotel',    value: _needsHotel,        onChanged: (v) => setState(() => _needsHotel = v)),
                _ToggleChip(icon: Icons.restaurant_menu_outlined,label: 'Opciones de comida',value: _prefFood,          onChanged: (v) => setState(() => _prefFood = v)),
                _ToggleChip(icon: Icons.accessible_outlined,     label: 'Accesible',         value: _reqAccesibilidad,  onChanged: (v) => setState(() => _reqAccesibilidad = v)),
                _ToggleChip(icon: Icons.nature_outlined,         label: 'Al aire libre',     value: _prefOutdoor,       onChanged: (v) => setState(() => _prefOutdoor = v)),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // ── CTA ───────────────────────────────────────────────────
          _CTAButton(
            loading: _isFetching,
            disabled: _selectedTypes.isEmpty,
            onTap: _fetchRecommendations,
          ),
          const SizedBox(height: 12),

          if (_selectedTypes.isEmpty)
            Center(
              child: Text(
                AppLocalizations.of(context)!.recoSelectAtLeastOneToContinue,
                style: TextStyle(
                  fontFamily: 'Outfit', fontSize: 11,
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

class _ResultsSheet extends StatefulWidget {
  final List<dynamic> recommendations;
  final Map<String, Place> placesMap;
  final int? sessionId;
  final void Function(String itemId, {required int rankPos, required bool clicked}) onFeedback;
  final void Function(Place place, String itemId) onNavigateToPlace;

  const _ResultsSheet({
    required this.recommendations,
    required this.placesMap,
    required this.sessionId,
    required this.onFeedback,
    required this.onNavigateToPlace,
  });

  @override
  State<_ResultsSheet> createState() => _ResultsSheetState();
}

class _ResultsSheetState extends State<_ResultsSheet> {
  /// item_id → true=liked, false=disliked, null=no opinion
  final Map<String, bool?> _ratings = {};
  final DraggableScrollableController _sheetCtrl = DraggableScrollableController();
  bool _closingDialogActive = false;

  @override
  void initState() {
    super.initState();
    _sheetCtrl.addListener(_onSheetSize);
  }

  @override
  void dispose() {
    _sheetCtrl.removeListener(_onSheetSize);
    _sheetCtrl.dispose();
    super.dispose();
  }

  void _onSheetSize() {
    if (!mounted || _closingDialogActive) return;
    try {
      if (_sheetCtrl.size < 0.55) {
        _closingDialogActive = true;
        // Bounce the sheet back up first, then show dialog
        WidgetsBinding.instance.addPostFrameCallback((_) async {
          if (!mounted) return;
          try {
            await _sheetCtrl.animateTo(
              0.92,
              duration: const Duration(milliseconds: 300),
              curve: Curves.easeOut,
            );
          } catch (_) {}
          if (mounted) {
            await _tryClose(context);
            if (mounted) _closingDialogActive = false;
          }
        });
      }
    } catch (_) {}
  }

  /// Lookup a place with fallback for bare numeric IDs returned by MODELO
  Place? _findPlace(String itemId) =>
      widget.placesMap[itemId] ??
      widget.placesMap['poi_$itemId'] ??
      widget.placesMap['svc_$itemId'];

  void _shareRecommendations(BuildContext ctx) {
    final names = widget.recommendations.take(6).map((r) {
      final id = (r['item_id'] ?? '').toString();
      final place = _findPlace(id);
      return place?.name ?? r['title'] ?? r['name'] ?? id;
    }).join('\n• ');
    final text = '🌿 Mis destinos recomendados en Altas Montañas de Veracruz:\n\n• $names\n\n📱 Descúbrelos con SMARTUR';
    SharePlus.instance.share(ShareParams(text: text));
  }

  /// Returns true if the sheet should be closed.
  /// Shows the "Ayúdanos a mejorar" dialog when user hasn't rated yet.
  Future<bool> _shouldClose() async {
    final anyRated = _ratings.values.any((v) => v != null);
    if (!anyRated && widget.recommendations.isNotEmpty) {
      final shouldClose = await showDialog<bool>(
        context: context,
        barrierDismissible: false,
        builder: (dCtx) => _RatingBeforeCloseDialog(
          recommendations: widget.recommendations,
          findPlace: _findPlace,
          onSubmit: (ratings) {
            for (final entry in ratings.entries) {
              final idx = widget.recommendations.indexWhere(
                  (r) => (r['item_id'] ?? '').toString() == entry.key);
              if (idx >= 0) {
                widget.onFeedback(entry.key, rankPos: idx, clicked: entry.value);
              }
            }
          },
        ),
      );
      return shouldClose == true;
    }
    return true;
  }

  Future<void> _tryClose(BuildContext ctx) async {
    if (await _shouldClose()) {
      if (ctx.mounted) Navigator.pop(ctx);
    }
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) async {
        if (!didPop) {
          if (await _shouldClose()) {
            if (mounted) Navigator.pop(context);
          }
        }
      },
      child: DraggableScrollableSheet(
      controller: _sheetCtrl,
      initialChildSize: 0.92,
      minChildSize: 0.45,
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
                Container(
                  width: 36, height: 4,
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
                              AppLocalizations.of(ctx)!.recoNDestinations(widget.recommendations.length),
                              style: SmarturStyle.calSansTitle.copyWith(fontSize: 20),
                            ),
                            Text(
                              AppLocalizations.of(ctx)!.recoPersonalizedByAI,
                              style: TextStyle(
                                fontFamily: 'Outfit', fontSize: 11,
                                color: scheme.onSurface.withValues(alpha: 0.5),
                              ),
                            ),
                          ],
                        ),
                      ),
                      // Share button
                      IconButton(
                        icon: const Icon(Icons.share_outlined),
                        tooltip: AppLocalizations.of(ctx)!.recoShareButton,
                        onPressed: () => _shareRecommendations(ctx),
                        color: scheme.onSurface.withValues(alpha: 0.6),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close_rounded),
                        onPressed: () => _tryClose(ctx),
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
                    itemCount: widget.recommendations.length,
                    itemBuilder: (c, i) {
                      final rec = widget.recommendations[i] as Map<String, dynamic>;
                      final itemId = (rec['item_id'] ?? '').toString();
                      final place = _findPlace(itemId);
                      return _RecommendationCard(
                        index: i,
                        rec: rec,
                        place: place,
                        onLike: () {
                          setState(() => _ratings[itemId] = true);
                          widget.onFeedback(itemId, rankPos: i, clicked: true);
                        },
                        onDislike: () {
                          setState(() => _ratings[itemId] = false);
                          widget.onFeedback(itemId, rankPos: i, clicked: false);
                        },
                        onViewDestination: () {
                          if (place != null) {
                            Navigator.pop(ctx);
                            widget.onNavigateToPlace(place, itemId);
                          }
                        },
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        ),
        ),   // DraggableScrollableSheet
      ),     // PopScope
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// "Ayúdanos a mejorar" dialog — shown when closing results sheet
// ═══════════════════════════════════════════════════════════════════════════

class _RatingBeforeCloseDialog extends StatefulWidget {
  final List<dynamic> recommendations;
  final Place? Function(String) findPlace;
  final void Function(Map<String, bool>) onSubmit;

  const _RatingBeforeCloseDialog({
    required this.recommendations,
    required this.findPlace,
    required this.onSubmit,
  });

  @override
  State<_RatingBeforeCloseDialog> createState() => _RatingBeforeCloseDialogState();
}

class _RatingBeforeCloseDialogState extends State<_RatingBeforeCloseDialog> {
  final Map<String, bool?> _votes = {};

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final recs = widget.recommendations.take(6).toList();

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      backgroundColor: scheme.surface,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: SmarturStyle.purple.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.rate_review_outlined,
                      color: SmarturStyle.purple, size: 20),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(AppLocalizations.of(context)!.recoHelpImprove,
                          style: SmarturStyle.calSansTitle.copyWith(fontSize: 16)),
                      Text(AppLocalizations.of(context)!.recoHowLiked,
                          style: TextStyle(
                              fontFamily: 'Outfit', fontSize: 11,
                              color: scheme.onSurface.withValues(alpha: 0.55))),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Recommendation rating list
            ...recs.asMap().entries.map((entry) {
              final i = entry.key;
              final rec = entry.value as Map<String, dynamic>;
              final itemId = (rec['item_id'] ?? '').toString();
              final place = widget.findPlace(itemId);
              final name = place?.name ?? rec['title'] ?? rec['name'] ?? 'Destino ${i + 1}';
              final vote = _votes[itemId];

              return Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Row(
                  children: [
                    // Index
                    Container(
                      width: 24, height: 24,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: SmarturStyle.purple.withValues(alpha: 0.1),
                        shape: BoxShape.circle,
                      ),
                      child: Text('${i + 1}',
                          style: const TextStyle(
                              fontFamily: 'Outfit', fontSize: 10,
                              fontWeight: FontWeight.w700,
                              color: SmarturStyle.purple)),
                    ),
                    const SizedBox(width: 10),
                    // Name
                    Expanded(
                      child: Text(name,
                          style: TextStyle(
                              fontFamily: 'Outfit', fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: scheme.onSurface),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis),
                    ),
                    // Like / dislike buttons
                    _MiniVote(
                      icon: Icons.thumb_up_rounded,
                      active: vote == true,
                      activeColor: SmarturStyle.green,
                      onTap: () => setState(() => _votes[itemId] = _votes[itemId] == true ? null : true),
                    ),
                    const SizedBox(width: 6),
                    _MiniVote(
                      icon: Icons.thumb_down_rounded,
                      active: vote == false,
                      activeColor: scheme.error,
                      onTap: () => setState(() => _votes[itemId] = _votes[itemId] == false ? null : false),
                    ),
                  ],
                ),
              );
            }),

            const SizedBox(height: 16),

            // Action buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(context, true),
                    style: OutlinedButton.styleFrom(
                      side: BorderSide(color: scheme.outlineVariant),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                    child: Text(AppLocalizations.of(context)!.recoSkip,
                        style: TextStyle(fontFamily: 'Outfit',
                            color: scheme.onSurface.withValues(alpha: 0.6))),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _votes.values.every((v) => v == null)
                        ? null
                        : () {
                            final submitted = <String, bool>{
                              for (final e in _votes.entries)
                                if (e.value != null) e.key: e.value!,
                            };
                            widget.onSubmit(submitted);
                            Navigator.pop(context, true);
                          },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: SmarturStyle.purple,
                      disabledBackgroundColor: scheme.surfaceContainerHighest,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      elevation: 0,
                    ),
                    child: Text(AppLocalizations.of(context)!.recoSend,
                        style: const TextStyle(fontFamily: 'Outfit',
                            fontWeight: FontWeight.w700,
                            color: Colors.white)),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _MiniVote extends StatelessWidget {
  final IconData icon;
  final bool active;
  final Color activeColor;
  final VoidCallback onTap;

  const _MiniVote({required this.icon, required this.active, required this.activeColor, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.all(6),
        decoration: BoxDecoration(
          color: active ? activeColor.withValues(alpha: 0.15) : scheme.surfaceContainerHighest.withValues(alpha: 0.6),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: active ? activeColor.withValues(alpha: 0.4) : Colors.transparent),
        ),
        child: Icon(icon, size: 14,
            color: active ? activeColor : scheme.onSurface.withValues(alpha: 0.35)),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Single recommendation card  (StatefulWidget for like/dislike state)
// ═══════════════════════════════════════════════════════════════════════════

class _RecommendationCard extends StatefulWidget {
  final int index;
  final Map<String, dynamic> rec;
  final Place? place;
  final VoidCallback onLike;
  final VoidCallback onDislike;
  final VoidCallback onViewDestination;

  const _RecommendationCard({
    required this.index,
    required this.rec,
    required this.place,
    required this.onLike,
    required this.onDislike,
    required this.onViewDestination,
  });

  @override
  State<_RecommendationCard> createState() => _RecommendationCardState();
}

class _RecommendationCardState extends State<_RecommendationCard> {
  bool _liked = false;
  bool _disliked = false;

  void _handleLike() {
    HapticFeedback.lightImpact();
    setState(() { _liked = !_liked; _disliked = false; });
    widget.onLike();
  }

  void _handleDislike() {
    HapticFeedback.lightImpact();
    setState(() { _disliked = !_disliked; _liked = false; });
    widget.onDislike();
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final place = widget.place;
    final rec = widget.rec;
    final name = place?.name ?? rec['title'] ?? rec['name'] ?? 'Destino ${widget.index + 1}';
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Image ──────────────────────────────────────────────────
          if (imageUrl.isNotEmpty)
            Stack(
              children: [
                SizedBox(
                  height: 160, width: double.infinity,
                  child: Image.network(
                    imageUrl, fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(
                      color: SmarturStyle.purple.withValues(alpha: 0.12),
                      child: const Icon(Icons.landscape_outlined, color: Colors.white38, size: 40),
                    ),
                  ),
                ),
                Positioned(top: 10, right: 10, child: _ScoreBadge(score: score)),
                Positioned(
                  top: 10, left: 10,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.55),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text('#${widget.index + 1}',
                      style: const TextStyle(fontFamily: 'CalSans', fontSize: 13, color: Colors.white)),
                  ),
                ),
              ],
            )
          else
            Container(
              height: 80, width: double.infinity,
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: [
                  SmarturStyle.purple.withValues(alpha: 0.35),
                  SmarturStyle.orange.withValues(alpha: 0.15),
                ]),
              ),
              child: Center(
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _ScoreBadge(score: score),
                    const SizedBox(width: 8),
                    Text('#${widget.index + 1}',
                      style: const TextStyle(fontFamily: 'CalSans', fontSize: 18, color: Colors.white70)),
                  ],
                ),
              ),
            ),

          // ── Content ────────────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 10, 14, 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name,
                  style: SmarturStyle.calSansTitle.copyWith(fontSize: 15),
                  maxLines: 2),

                if (city.isNotEmpty) ...[
                  const SizedBox(height: 3),
                  Row(children: [
                    Icon(Icons.place_outlined, size: 12, color: scheme.onSurface.withValues(alpha: 0.4)),
                    const SizedBox(width: 3),
                    Text(city,
                      style: TextStyle(fontFamily: 'Outfit', fontSize: 11,
                          color: scheme.onSurface.withValues(alpha: 0.5))),
                  ]),
                ],

                if (description.isNotEmpty) ...[
                  const SizedBox(height: 5),
                  Text(description,
                    style: TextStyle(fontFamily: 'Outfit', fontSize: 12, height: 1.4,
                        color: scheme.onSurface.withValues(alpha: 0.65)),
                    maxLines: 2, overflow: TextOverflow.ellipsis),
                ],

                if (tags.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Wrap(spacing: 5, runSpacing: 4,
                    children: tags.take(4).map((t) => _TagChip(label: t)).toList()),
                ],

                const SizedBox(height: 10),

                // ── Action row: like / dislike / ver destino ────────
                Row(
                  children: [
                    // Thumbs up
                    _FeedbackBtn(
                      icon: Icons.thumb_up_rounded,
                      active: _liked,
                      activeColor: SmarturStyle.green,
                      onTap: _handleLike,
                    ),
                    const SizedBox(width: 8),
                    // Thumbs down
                    _FeedbackBtn(
                      icon: Icons.thumb_down_rounded,
                      active: _disliked,
                      activeColor: scheme.error,
                      onTap: _handleDislike,
                    ),
                    const Spacer(),
                    // Ver destino
                    GestureDetector(
                      onTap: widget.place != null ? widget.onViewDestination : null,
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 160),
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                        decoration: BoxDecoration(
                          color: widget.place != null
                              ? SmarturStyle.purple
                              : scheme.outlineVariant,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(AppLocalizations.of(context)!.recoViewDestination,
                              style: TextStyle(
                                fontFamily: 'Outfit', fontSize: 12, fontWeight: FontWeight.w700,
                                color: widget.place != null ? Colors.white : scheme.onSurface.withValues(alpha: 0.4),
                              )),
                            const SizedBox(width: 4),
                            Icon(Icons.chevron_right_rounded,
                              color: widget.place != null ? Colors.white : scheme.onSurface.withValues(alpha: 0.3),
                              size: 16),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Feedback (like/dislike) button ───────────────────────────────────────────

class _FeedbackBtn extends StatelessWidget {
  final IconData icon;
  final bool active;
  final Color activeColor;
  final VoidCallback onTap;

  const _FeedbackBtn({
    required this.icon,
    required this.active,
    required this.activeColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 160),
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: active
              ? activeColor.withValues(alpha: 0.15)
              : scheme.surfaceContainerHighest.withValues(alpha: 0.6),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: active ? activeColor.withValues(alpha: 0.45) : Colors.transparent,
          ),
        ),
        child: Icon(
          icon, size: 18,
          color: active ? activeColor : scheme.onSurface.withValues(alpha: 0.35),
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
              Text(title,
                style: TextStyle(fontFamily: 'Outfit', fontSize: 13, fontWeight: FontWeight.w700,
                    color: scheme.onSurface)),
              if (required) ...[
                const SizedBox(width: 4),
                const Text('*', style: TextStyle(color: SmarturStyle.orange, fontSize: 14)),
              ],
              if (subtitle != null) ...[
                const SizedBox(width: 6),
                Text(subtitle!,
                  style: TextStyle(fontFamily: 'Outfit', fontSize: 11,
                      color: scheme.onSurface.withValues(alpha: 0.4))),
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

  const _SelectChip({required this.label, required this.icon, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 160),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? SmarturStyle.purple : scheme.surfaceContainerHighest.withValues(alpha: 0.6),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: selected ? SmarturStyle.purple : scheme.outline.withValues(alpha: 0.2)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 14,
                color: selected ? Colors.white : scheme.onSurface.withValues(alpha: 0.6)),
            const SizedBox(width: 6),
            Text(label,
              style: TextStyle(fontFamily: 'Outfit', fontSize: 12, fontWeight: FontWeight.w600,
                  color: selected ? Colors.white : scheme.onSurface)),
          ],
        ),
      ),
    );
  }
}

class _BudgetButton extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String label;
  final String sub;
  final bool selected;
  final VoidCallback onTap;

  const _BudgetButton({
    required this.icon,
    required this.iconColor,
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
          color: selected ? SmarturStyle.purple : scheme.surfaceContainerHighest.withValues(alpha: 0.55),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
              color: selected ? SmarturStyle.purple : scheme.outline.withValues(alpha: 0.15)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 22,
                color: selected ? Colors.white : iconColor),
            const SizedBox(height: 4),
            Text(label,
              style: TextStyle(fontFamily: 'Outfit', fontSize: 12, fontWeight: FontWeight.w700,
                  color: selected ? Colors.white : scheme.onSurface)),
            Text(sub,
              style: TextStyle(fontFamily: 'Outfit', fontSize: 9,
                  color: selected ? Colors.white.withValues(alpha: 0.7) : scheme.onSurface.withValues(alpha: 0.4)),
              textAlign: TextAlign.center),
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

  const _GroupButton({required this.icon, required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 160),
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
        decoration: BoxDecoration(
          color: selected ? SmarturStyle.purple : scheme.surfaceContainerHighest.withValues(alpha: 0.55),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
              color: selected ? SmarturStyle.purple : scheme.outline.withValues(alpha: 0.15)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 20,
                color: selected ? Colors.white : scheme.onSurface.withValues(alpha: 0.7)),
            const SizedBox(height: 3),
            Text(label,
              style: TextStyle(fontFamily: 'Outfit', fontSize: 11, fontWeight: FontWeight.w600,
                  color: selected ? Colors.white : scheme.onSurface)),
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

  const _ToggleChip({required this.icon, required this.label, required this.value, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return GestureDetector(
      onTap: () => onChanged(!value),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 160),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: value ? SmarturStyle.orange.withValues(alpha: 0.15) : scheme.surfaceContainerHighest.withValues(alpha: 0.5),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
              color: value ? SmarturStyle.orange.withValues(alpha: 0.6) : scheme.outline.withValues(alpha: 0.15)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 14, color: value ? SmarturStyle.orange : scheme.onSurface.withValues(alpha: 0.5)),
            const SizedBox(width: 6),
            Text(label,
              style: TextStyle(fontFamily: 'Outfit', fontSize: 12, fontWeight: FontWeight.w600,
                  color: value ? SmarturStyle.orange : scheme.onSurface)),
            const SizedBox(width: 6),
            Icon(value ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded,
              size: 14, color: value ? SmarturStyle.orange : scheme.onSurface.withValues(alpha: 0.3)),
          ],
        ),
      ),
    );
  }
}

class _CTAButton extends StatefulWidget {
  final bool loading;
  final bool disabled;
  final VoidCallback onTap;

  const _CTAButton({required this.loading, required this.disabled, required this.onTap});

  @override
  State<_CTAButton> createState() => _CTAButtonState();
}

class _CTAButtonState extends State<_CTAButton> with SingleTickerProviderStateMixin {
  late final AnimationController _gradCtrl;

  // Brand-palette gradient cycle: purple → pink → blue / orange → purple → green
  static final _colorA = TweenSequence<Color?>([
    TweenSequenceItem(tween: ColorTween(begin: SmarturStyle.purple, end: SmarturStyle.pink),   weight: 1),
    TweenSequenceItem(tween: ColorTween(begin: SmarturStyle.pink,   end: SmarturStyle.blue),   weight: 1),
    TweenSequenceItem(tween: ColorTween(begin: SmarturStyle.blue,   end: SmarturStyle.purple), weight: 1),
  ]);
  static final _colorB = TweenSequence<Color?>([
    TweenSequenceItem(tween: ColorTween(begin: SmarturStyle.orange, end: SmarturStyle.purple), weight: 1),
    TweenSequenceItem(tween: ColorTween(begin: SmarturStyle.purple, end: SmarturStyle.green),  weight: 1),
    TweenSequenceItem(tween: ColorTween(begin: SmarturStyle.green,  end: SmarturStyle.orange), weight: 1),
  ]);

  @override
  void initState() {
    super.initState();
    _gradCtrl = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 5),
    )..repeat();
  }

  @override
  void dispose() {
    _gradCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return AnimatedBuilder(
      animation: _gradCtrl,
      builder: (context, child) {
        final loading = widget.loading;
        final disabled = widget.disabled;
        final ca = _colorA.evaluate(_gradCtrl) ?? SmarturStyle.purple;
        final cb = _colorB.evaluate(_gradCtrl) ?? const Color(0xFF9333EA);
        Widget content;
        if (loading) {
          content = const SizedBox(
            width: 22, height: 22,
            child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
          );
        } else {
          content = Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.auto_awesome_rounded,
                color: disabled ? scheme.onSurface.withValues(alpha: 0.3) : Colors.white,
                size: 20),
              const SizedBox(width: 10),
              Text('Descubrir mis destinos',
                style: TextStyle(
                  fontFamily: 'Outfit', fontSize: 16, fontWeight: FontWeight.w700,
                  color: disabled ? scheme.onSurface.withValues(alpha: 0.3) : Colors.white,
                )),
            ],
          );
        }
        return GestureDetector(
          onTap: (loading || disabled) ? null : widget.onTap,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 160),
            height: 58,
            decoration: BoxDecoration(
              gradient: (loading || disabled) ? null : LinearGradient(
                colors: [ca, cb],
                begin: Alignment.centerLeft, end: Alignment.centerRight,
              ),
              color: (loading || disabled)
                  ? scheme.surfaceContainerHighest.withValues(alpha: 0.5)
                  : null,
              borderRadius: BorderRadius.circular(18),
              boxShadow: (loading || disabled) ? null : [
                BoxShadow(color: ca.withValues(alpha: 0.35), blurRadius: 16, offset: const Offset(0, 6)),
              ],
            ),
            child: Center(child: content),
          ),
        );
      },
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
          Text(score.toStringAsFixed(2),
            style: const TextStyle(fontFamily: 'Outfit', fontWeight: FontWeight.w800,
                color: Colors.white, fontSize: 11)),
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
        border: Border.all(color: SmarturStyle.purple.withValues(alpha: 0.2)),
      ),
      child: Text(label,
        style: const TextStyle(fontFamily: 'Outfit', fontSize: 10, fontWeight: FontWeight.w600,
            color: SmarturStyle.purple)),
    );
  }
}
