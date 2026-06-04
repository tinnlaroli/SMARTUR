import 'dart:async';
import 'dart:convert';
import 'dart:ui';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:geolocator/geolocator.dart';
import 'package:share_plus/share_plus.dart';

import '../../../core/motion/smartur_routes.dart';
import '../../../core/theme/smartur_theme_extensions.dart';
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
import '../../widgets/smartur_loader.dart';
import '../../widgets/smartur_loading_overlay.dart';
import '../../widgets/smartur_ui_kit.dart';
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
  final IconData icon;
  final Color color;
  const _TourType(this.id, this.icon, this.color);
}

const _tourTypes = [
  _TourType('cultural',     Icons.museum_outlined,           Color(0xFF984EFD)),
  _TourType('naturaleza',   Icons.forest_outlined,           Color(0xFF9CCC44)),
  _TourType('gastronomico', Icons.restaurant_menu_outlined,  Color(0xFFFF7D1F)),
  _TourType('aventura',     Icons.hiking_outlined,           Color(0xFF9CCC44)),
  _TourType('descanso',     Icons.self_improvement_outlined, Color(0xFF4DB9CA)),
  _TourType('nocturno',     Icons.nightlife_outlined,        Color(0xFFFC478E)),
];

// ── Budget model ─────────────────────────────────────────────────────────────
// Tuple: (id, icon, color, label, subtitle)

const _budgets = [
  ('bajo',  Icons.savings_outlined,                SmarturStyle.green),
  ('medio', Icons.account_balance_wallet_outlined, SmarturStyle.orange),
  ('alto',  Icons.diamond_outlined,                SmarturStyle.purple),
];

// ── Group model ──────────────────────────────────────────────────────────────

const _groups = [
  ('solo',    Icons.person_outline),
  ('pareja',  Icons.favorite_border_rounded),
  ('familia', Icons.family_restroom_outlined),
  ('amigos',  Icons.people_outline),
];

// ── Age ranges ───────────────────────────────────────────────────────────────

const _ageRanges = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'];

// ─────────────────────────────────────────────────────────────────────────────

class _RecommendationScreenState extends State<RecommendationScreen> {
  static const String _none = '__none__';

  String _tourTypeLabel(AppLocalizations l10n, String id) {
    switch (id) {
      case 'cultural':
        return l10n.recoTypeCultural;
      case 'naturaleza':
        return l10n.recoTypeNature;
      case 'gastronomico':
        return l10n.recoTypeGastronomy;
      case 'aventura':
        return l10n.recoTypeAdventure;
      case 'descanso':
        return l10n.recoTypeRelax;
      case 'nocturno':
        return l10n.recoTypeNight;
      default:
        return id;
    }
  }

  (String, String) _budgetTexts(AppLocalizations l10n, String id) {
    switch (id) {
      case 'bajo':
        return (l10n.recoBudgetLowLabel, l10n.recoBudgetLowSub);
      case 'medio':
        return (l10n.recoBudgetMediumLabel, l10n.recoBudgetMediumSub);
      case 'alto':
        return (l10n.recoBudgetHighLabel, l10n.recoBudgetHighSub);
      default:
        return (id, '');
    }
  }

  String _groupLabel(AppLocalizations l10n, String id) {
    switch (id) {
      case 'solo':
        return l10n.recoGroupSolo;
      case 'pareja':
        return l10n.recoGroupCouple;
      case 'familia':
        return l10n.recoGroupFamily;
      case 'amigos':
        return l10n.recoGroupFriends;
      default:
        return id;
    }
  }

  // ── Form state ────────────────────────────────────────────────────────────
  final Set<String> _selectedTypes = <String>{};
  String _budget = _none;
  String _groupType = _none;
  String _ageRange = _none;
  bool _wantsTours = false;
  bool _needsHotel = false;
  bool _prefFood = false;
  bool _reqAccesibilidad = false;
  bool _prefOutdoor = false;

  // ── Network state ─────────────────────────────────────────────────────────
  bool _isLoadingProfile = true;
  bool _isFetching = false;
  List<dynamic> _recommendations = [];
  int? _sessionId;
  bool _prefsWereLoaded = false; // true when profile pre-filled the form
  bool _showSavedDiaryHint = false;

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
      if (!mounted) return;
      if (!_profileHasPreferences(p)) {
        _clearFormSelections();
        _prefsWereLoaded = false;
        return;
      }
      final age = p['age'] as int?;
      if (age != null) {
        String range;
        if (age < 25)      range = '18-24';
        else if (age < 35) range = '25-34';
        else if (age < 45) range = '35-44';
        else if (age < 55) range = '45-54';
        else if (age < 65) range = '55-64';
        else               range = '65+';
        if (range != _ageRange) _ageRange = range;
      }
      final interests = (p['interests'] as List?)?.cast<String>() ?? [];
      final mappedTypes = <String>{};
      for (final interest in interests) {
        final id = _mapInterestToTourId(interest);
        if (id != null) mappedTypes.add(id);
      }
      if (mappedTypes.isNotEmpty) {
        _selectedTypes
          ..clear()
          ..addAll(mappedTypes);
      }
      if (interests.any((e) => e.toLowerCase().contains('gastro'))) {
        _prefFood = true;
      }
      if (interests.any((e) {
        final v = e.toLowerCase();
        return v.contains('natur') || v.contains('avent');
      })) {
        _prefOutdoor = true;
      }
      final budget = _mapActivityToBudget(p['activity_level'] as int?);
      if (budget != null && budget != _budget) {
        _budget = budget;
      }
      final group = _mapTravelTypeToGroup(p['travel_type']?.toString());
      if (group != null && group != _groupType) {
        _groupType = group;
      }
      final preferredPlace = p['preferred_place']?.toString().toLowerCase();
      if (preferredPlace != null &&
          (preferredPlace.contains('mont') ||
              preferredPlace.contains('play') ||
              preferredPlace.contains('bosq') ||
              preferredPlace.contains('forest') ||
              preferredPlace.contains('natur'))) {
        _prefOutdoor = true;
      }
      if (p['has_accessibility'] == true) _reqAccesibilidad = true;
      _prefsWereLoaded = true;
    } catch (_) {
      if (mounted) {
        _clearFormSelections();
        _prefsWereLoaded = false;
      }
    }
  }

  bool _profileHasPreferences(Map<String, dynamic> p) {
    if (p.isEmpty) return false;
    final interests = (p['interests'] as List?)?.cast<String>() ?? [];
    return interests.isNotEmpty ||
        p['travel_type'] != null ||
        p['age'] != null ||
        p['activity_level'] != null ||
        p['preferred_place'] != null ||
        p['has_accessibility'] == true;
  }

  String? _mapInterestToTourId(String raw) {
    final v = raw.toLowerCase().trim();
    for (final t in _tourTypes) {
      if (v == t.id || v.contains(t.id)) return t.id;
    }
    if (v.contains('cultur') || v.contains('museum') || v.contains('histor')) {
      return 'cultural';
    }
    if (v.contains('natur') || v.contains('forest') || v.contains('eco')) {
      return 'naturaleza';
    }
    if (v.contains('gastro') || v.contains('food') || v.contains('restaur')) {
      return 'gastronomico';
    }
    if (v.contains('avent') || v.contains('hik') || v.contains('trek')) {
      return 'aventura';
    }
    if (v.contains('descans') || v.contains('relax') || v.contains('spa')) {
      return 'descanso';
    }
    if (v.contains('nocturn') || v.contains('night') || v.contains('fiesta')) {
      return 'nocturno';
    }
    return null;
  }

  bool get _isFormReady =>
      _selectedTypes.isNotEmpty &&
      _budget != _none &&
      _groupType != _none &&
      _ageRange != _none;

  String? _mapTravelTypeToGroup(String? raw) {
    if (raw == null) return null;
    final v = raw.toLowerCase();
    if (v.contains('familiar') || v.contains('family')) return 'familia';
    if (v.contains('romantic')) return 'pareja';
    if (v.contains('mochil') || v.contains('backpacker') || v.contains('business')) return 'solo';
    if (v.contains('aventura') || v.contains('adventure')) return 'amigos';
    return null;
  }

  String? _mapActivityToBudget(int? level) {
    if (level == null) return null;
    if (level <= 2) return 'bajo';
    if (level == 3) return 'medio';
    return 'alto';
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
    if (!_isFormReady) {
      SmarturNotifications.showError(
        context,
        AppLocalizations.of(context)!.recoSelectAtLeastOneToContinue,
      );
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
          'presupuesto_bucket': _budget == _none ? null : _budget,
          'edad_range': _ageRange == _none ? null : _ageRange,
          'tiposTurismo': _selectedTypes.toList(),
          'group_type': _groupType == _none ? null : _groupType,
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
            _isFetching = false;
          });
          if (recs.isNotEmpty) {
            unawaited(_showResults());
          }
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

  void _clearFormSelections() {
    _selectedTypes.clear();
    _budget = _none;
    _groupType = _none;
    _ageRange = _none;
    _wantsTours = false;
    _needsHotel = false;
    _prefFood = false;
    _reqAccesibilidad = false;
    _prefOutdoor = false;
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

  Future<void> _showResults() async {
    // Capture context before opening sheet so navigation works after the sheet is dismissed
    final navContext = context;
    await showModalBottomSheet(
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
            smarturDetailRoute(
              DetailViewPage(
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
    if (!navContext.mounted) return;
    final hadSavedSession = _sessionId != null && _recommendations.isNotEmpty;
    setState(() {
      _clearFormSelections();
      _recommendations = [];
      _sessionId = null;
    });
    if (hadSavedSession) {
      setState(() => _showSavedDiaryHint = true);
      SmarturNotifications.showSuccess(
        navContext,
        AppLocalizations.of(navContext)!.recoSavedInDiary,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      backgroundColor: scheme.surface,
      appBar: AppBar(
        automaticallyImplyLeading: false,
        backgroundColor: scheme.surface,
        foregroundColor: scheme.onSurface,
        elevation: 0,
        scrolledUnderElevation: 0,
        surfaceTintColor: scheme.surface,
        centerTitle: true,
        title: Text(
          AppLocalizations.of(context)!.recoTitle,
          style: TextStyle(
            fontFamily: 'CalSans',
            color: scheme.onSurface,
            fontSize: 20,
          ),
        ),
      ),
      body: ColoredBox(
        color: scheme.surface,
        child: Stack(
          fit: StackFit.expand,
          children: [
            SmarturLoadTransition(
              loading: _isLoadingProfile,
              loadingChild: const Center(
                child: SmartURLoader(isMini: true, continuous: true),
              ),
              child: SmarturFadeIn(child: _buildBody(scheme)),
            ),
            SmarturLoadingOverlay(visible: _isFetching),
          ],
        ),
      ),
    );
  }

  Widget _buildBody(ColorScheme scheme) {
    final l10n = AppLocalizations.of(context)!;
    return LayoutBuilder(
      builder: (context, constraints) {
        final mq = MediaQuery.of(context);
        final bottom = mq.padding.bottom + 24;
        final maxW = constraints.maxWidth;
        final hPad = maxW > 600 ? (maxW - 560) / 2 + 20 : 20.0;
        return SingleChildScrollView(
          padding: EdgeInsets.fromLTRB(hPad, 16, hPad, bottom),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [

              // ── Banners condicionales ────────────────────────────────
              if (_prefsWereLoaded) ...[
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: SmarturStyle.purple.withValues(alpha: 0.10),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: SmarturStyle.purple.withValues(alpha: 0.20)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.auto_awesome_rounded,
                          color: SmarturStyle.purple, size: 14),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(l10n.recoPreloadedBannerDesc,
                          style: TextStyle(
                            fontFamily: 'Outfit', fontSize: 11,
                            color: scheme.onSurface.withValues(alpha: 0.75),
                          )),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
              ],
              if (_showSavedDiaryHint) ...[
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  decoration: BoxDecoration(
                    color: SmarturStyle.green.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: SmarturStyle.green.withValues(alpha: 0.28)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.bookmark_rounded,
                          color: SmarturStyle.green, size: 18),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(l10n.recoSavedInDiary,
                          style: TextStyle(
                            fontFamily: 'Outfit', fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: scheme.onSurface.withValues(alpha: 0.85),
                          )),
                      ),
                      GestureDetector(
                        onTap: () => setState(() => _showSavedDiaryHint = false),
                        child: Icon(Icons.close_rounded, size: 17,
                            color: scheme.onSurface.withValues(alpha: 0.4)),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
              ],

              // ── Tipos de turismo — grid visual 3×2 ──────────────────
              _InlineSection(
                label: l10n.recoTourismType,
                required: true,
                child: GridView.count(
                  crossAxisCount: 3,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  mainAxisSpacing: 10,
                  crossAxisSpacing: 10,
                  childAspectRatio: 1.05,
                  children: _tourTypes.map((t) {
                    final sel = _selectedTypes.contains(t.id);
                    return GestureDetector(
                      onTap: () => setState(() {
                        if (sel) _selectedTypes.remove(t.id);
                        else _selectedTypes.add(t.id);
                      }),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 170),
                        curve: Curves.easeOut,
                        decoration: BoxDecoration(
                          color: sel
                              ? t.color.withValues(alpha: 0.18)
                              : scheme.surfaceContainerHighest.withValues(alpha: 0.5),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: sel ? t.color : scheme.outlineVariant.withValues(alpha: 0.5),
                            width: sel ? 1.5 : 1.0,
                          ),
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(t.icon,
                                size: 26,
                                color: sel ? t.color : scheme.onSurfaceVariant),
                            const SizedBox(height: 6),
                            Text(
                              _tourTypeLabel(l10n, t.id),
                              style: TextStyle(
                                fontFamily: 'Outfit',
                                fontSize: 11,
                                fontWeight: sel ? FontWeight.w700 : FontWeight.w500,
                                color: sel ? t.color : scheme.onSurface,
                              ),
                              textAlign: TextAlign.center,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
              const SizedBox(height: 24),

              // ── Presupuesto ─────────────────────────────────────────
              _InlineSection(
                label: l10n.recoBudget,
                required: true,
                child: Row(
                  children: _budgets.map((b) {
                    final sel = _budget == b.$1;
                    final texts = _budgetTexts(l10n, b.$1);
                    return Expanded(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 3),
                        child: _BudgetButton(
                          icon: b.$2,
                          iconColor: b.$3,
                          label: texts.$1,
                          sub: texts.$2,
                          selected: sel,
                          onTap: () => setState(() => _budget = b.$1),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
              const SizedBox(height: 24),

              // ── ¿Con quién? ─────────────────────────────────────────
              _InlineSection(
                label: l10n.recoWithWho,
                required: true,
                child: Row(
                  children: _groups.map((g) {
                    final sel = _groupType == g.$1;
                    return Expanded(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 3),
                        child: _GroupButton(
                          icon: g.$2,
                          label: _groupLabel(l10n, g.$1),
                          selected: sel,
                          onTap: () => setState(() => _groupType = g.$1),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
              const SizedBox(height: 24),

              // ── Rango de edad ───────────────────────────────────────
              _InlineSection(
                label: l10n.recoAgeRange,
                required: true,
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: _ageRanges.map((a) {
                      final sel = _ageRange == a;
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: GestureDetector(
                          onTap: () => setState(() => _ageRange = a),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 160),
                            padding: const EdgeInsets.symmetric(
                                horizontal: 18, vertical: 10),
                            decoration: BoxDecoration(
                              color: sel
                                  ? SmarturStyle.purple
                                  : scheme.surfaceContainerHighest.withValues(alpha: 0.5),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color: sel
                                    ? SmarturStyle.purple
                                    : scheme.outlineVariant.withValues(alpha: 0.5),
                              ),
                            ),
                            child: Text(a,
                              style: TextStyle(
                                fontFamily: 'Outfit',
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: sel ? Colors.white : scheme.onSurface,
                              ),
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // ── Preferencias adicionales ────────────────────────────
              _InlineSection(
                label: l10n.recoAdditionalPrefs,
                subtitle: l10n.recoOptional,
                child: Wrap(
                  spacing: 8, runSpacing: 8,
                  children: [
                    _ToggleChip(icon: Icons.map_outlined,             label: l10n.recoGuidedTours, value: _wantsTours,       onChanged: (v) => setState(() => _wantsTours = v)),
                    _ToggleChip(icon: Icons.hotel_outlined,           label: l10n.recoNeedHotel,   value: _needsHotel,       onChanged: (v) => setState(() => _needsHotel = v)),
                    _ToggleChip(icon: Icons.restaurant_menu_outlined, label: l10n.recoFoodOptions, value: _prefFood,         onChanged: (v) => setState(() => _prefFood = v)),
                    _ToggleChip(icon: Icons.accessible_outlined,      label: l10n.recoAccessible,  value: _reqAccesibilidad, onChanged: (v) => setState(() => _reqAccesibilidad = v)),
                    _ToggleChip(icon: Icons.nature_outlined,          label: l10n.recoOutdoor,     value: _prefOutdoor,      onChanged: (v) => setState(() => _prefOutdoor = v)),
                  ],
                ),
              ),
              const SizedBox(height: 28),

              // ── Progreso + CTA ──────────────────────────────────────
              _FormProgress(
                l10n: l10n,
                typeDone: _selectedTypes.isNotEmpty,
                budgetDone: _budget != _none,
                groupDone: _groupType != _none,
                ageDone: _ageRange != _none,
              ),
              const SizedBox(height: 16),
              _CTAButton(
                loading: _isFetching,
                disabled: false,
                onTap: _fetchRecommendations,
              ),
              const SizedBox(height: 8),
            ],
          ),
        );
      },
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
    final l10n = AppLocalizations.of(ctx)!;
    final text = l10n.recoShareList(names);
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
    final l10n = AppLocalizations.of(context)!;
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
          child: Container(
              decoration: BoxDecoration(
                color: scheme.surface,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
                border: Border(
                  top: BorderSide(color: scheme.outline.withValues(alpha: 0.12)),
                ),
                boxShadow: [
                  BoxShadow(
                    color: scheme.shadow.withValues(alpha: 0.15),
                    blurRadius: 18,
                    offset: const Offset(0, -4),
                  ),
                ],
              ),
              child: Column(
                children: [
                  const SizedBox(height: 10),
                  Container(
                    width: 40,
                    height: 5,
                    decoration: BoxDecoration(
                      color: scheme.outlineVariant.withValues(alpha: 0.9),
                      borderRadius: BorderRadius.circular(99),
                    ),
                  ),
                  const SizedBox(height: 14),
                  Container(
                    margin: const EdgeInsets.symmetric(horizontal: 16),
                    padding: const EdgeInsets.fromLTRB(16, 14, 12, 14),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [
                          SmarturStyle.purple.withValues(alpha: 0.14),
                          SmarturStyle.orange.withValues(alpha: 0.08),
                        ],
                      ),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: SmarturStyle.purple.withValues(alpha: 0.18),
                      ),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: scheme.surface.withValues(alpha: 0.85),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: const Icon(
                            Icons.auto_awesome_rounded,
                            color: SmarturStyle.purple,
                            size: 22,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                l10n.recoNDestinations(widget.recommendations.length),
                                style: SmarturStyle.calSansTitle.copyWith(fontSize: 22),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                l10n.recoPersonalizedByAI,
                                style: TextStyle(
                                  fontFamily: 'Outfit',
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                  color: scheme.onSurface.withValues(alpha: 0.55),
                                ),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                l10n.recoResultsRankHint,
                                style: TextStyle(
                                  fontFamily: 'Outfit',
                                  fontSize: 10,
                                  color: scheme.onSurface.withValues(alpha: 0.42),
                                ),
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          visualDensity: VisualDensity.compact,
                          icon: const Icon(Icons.share_outlined, size: 20),
                          tooltip: l10n.recoShareButton,
                          onPressed: () => _shareRecommendations(ctx),
                          color: scheme.onSurface.withValues(alpha: 0.55),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  Expanded(
                    child: ListView.separated(
                      controller: controller,
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                      itemCount: widget.recommendations.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 4),
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
                  Container(
                    padding: EdgeInsets.fromLTRB(
                      16,
                      12,
                      16,
                      12 + MediaQuery.paddingOf(ctx).bottom,
                    ),
                    decoration: BoxDecoration(
                      color: scheme.surface,
                      border: Border(
                        top: BorderSide(color: scheme.outline.withValues(alpha: 0.1)),
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: scheme.shadow.withValues(alpha: 0.06),
                          blurRadius: 12,
                          offset: const Offset(0, -4),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Row(
                          children: [
                            Icon(
                              Icons.bookmark_added_rounded,
                              size: 18,
                              color: SmarturStyle.green.withValues(alpha: 0.9),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                l10n.recoSavedInDiary,
                                style: TextStyle(
                                  fontFamily: 'Outfit',
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                  color: scheme.onSurface.withValues(alpha: 0.72),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        FilledButton.icon(
                          onPressed: () => _tryClose(ctx),
                          icon: const Icon(Icons.check_rounded, size: 18),
                          label: Text(
                            l10n.recoResultsDone,
                            style: const TextStyle(
                              fontFamily: 'Outfit',
                              fontWeight: FontWeight.w700,
                              fontSize: 14,
                            ),
                          ),
                          style: FilledButton.styleFrom(
                            backgroundColor: SmarturStyle.purple,
                            foregroundColor: scheme.onPrimary,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                            elevation: 0,
                          ),
                        ),
                      ],
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
              final name = place?.name ?? rec['title'] ?? rec['name'] ?? AppLocalizations.of(context)!.recommendationNumber(i + 1);
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
    final semantic = Theme.of(context).extension<SmarturSemanticColors>()!;
    final place = widget.place;
    final rec = widget.rec;
    final name = place?.name ?? rec['title'] ?? rec['name'] ?? AppLocalizations.of(context)!.recommendationNumber(widget.index + 1);
    final score = (rec['score'] as num?)?.toDouble() ?? 0.0;
    final tags = (rec['reason_tags'] as List?)?.map((t) => t.toString()).toList() ?? [];
    final city = place?.city ?? '';
    final imageUrl = place?.imageUrl ?? '';
    final description = place?.shortDescription ?? '';

    final canOpen = widget.place != null;

    return Material(
      color: scheme.surfaceContainerHighest.withValues(alpha: 0.35),
      elevation: 0,
      shadowColor: scheme.shadow.withValues(alpha: 0.12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(22),
        side: BorderSide(color: scheme.outline.withValues(alpha: 0.1)),
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: canOpen ? widget.onViewDestination : null,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (imageUrl.isNotEmpty)
              Stack(
                children: [
                  SizedBox(
                    height: 176,
                    width: double.infinity,
                    child: CachedNetworkImage(
                      imageUrl: imageUrl,
                      fit: BoxFit.cover,
                      placeholder: (_, __) => Container(
                        color: SmarturStyle.purple.withValues(alpha: 0.08),
                        child: Center(
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: SmarturStyle.purple.withValues(alpha: 0.5),
                          ),
                        ),
                      ),
                      errorWidget: (_, __, ___) => Container(
                        color: SmarturStyle.purple.withValues(alpha: 0.12),
                        child: Icon(
                          Icons.landscape_outlined,
                          color: semantic.onImageMuted,
                          size: 40,
                        ),
                      ),
                    ),
                  ),
                  Positioned.fill(
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            Colors.transparent,
                            semantic.imageScrimStrong.withValues(alpha: 0.55),
                          ],
                        ),
                      ),
                    ),
                  ),
                  Positioned(top: 12, left: 12, child: _RankBadge(rank: widget.index + 1)),
                  Positioned(top: 12, right: 12, child: _ScoreBadge(score: score)),
                ],
              )
            else
              Container(
                height: 88,
                width: double.infinity,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      SmarturStyle.purple.withValues(alpha: 0.32),
                      SmarturStyle.orange.withValues(alpha: 0.14),
                    ],
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    _RankBadge(rank: widget.index + 1),
                    const SizedBox(width: 10),
                    _ScoreBadge(score: score),
                  ],
                ),
              ),
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    style: SmarturStyle.calSansTitle.copyWith(fontSize: 16),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (city.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Icon(
                          Icons.place_outlined,
                          size: 13,
                          color: scheme.onSurface.withValues(alpha: 0.45),
                        ),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            city,
                            style: TextStyle(
                              fontFamily: 'Outfit',
                              fontSize: 11,
                              color: scheme.onSurface.withValues(alpha: 0.55),
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ],
                  if (description.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Text(
                      description,
                      style: TextStyle(
                        fontFamily: 'Outfit',
                        fontSize: 12,
                        height: 1.45,
                        color: scheme.onSurface.withValues(alpha: 0.68),
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                  if (tags.isNotEmpty) ...[
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 6,
                      runSpacing: 5,
                      children: tags.take(4).map((t) => _TagChip(label: t)).toList(),
                    ),
                  ],
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      _FeedbackBtn(
                        icon: Icons.thumb_up_rounded,
                        active: _liked,
                        activeColor: SmarturStyle.green,
                        onTap: _handleLike,
                      ),
                      const SizedBox(width: 8),
                      _FeedbackBtn(
                        icon: Icons.thumb_down_rounded,
                        active: _disliked,
                        activeColor: scheme.error,
                        onTap: _handleDislike,
                      ),
                      const Spacer(),
                      if (canOpen)
                        TextButton.icon(
                          onPressed: widget.onViewDestination,
                          icon: const Icon(Icons.arrow_forward_rounded, size: 16),
                          label: Text(
                            AppLocalizations.of(context)!.recoViewDestination,
                            style: const TextStyle(
                              fontFamily: 'Outfit',
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          style: TextButton.styleFrom(
                            foregroundColor: SmarturStyle.purple,
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
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

// ── Form progress indicator ────────────────────────────────────────────────

class _FormProgress extends StatelessWidget {
  final AppLocalizations l10n;
  final bool typeDone;
  final bool budgetDone;
  final bool groupDone;
  final bool ageDone;

  const _FormProgress({
    required this.l10n,
    required this.typeDone,
    required this.budgetDone,
    required this.groupDone,
    required this.ageDone,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final steps = [
      (typeDone, l10n.recoTourismType),
      (budgetDone, l10n.recoBudget),
      (groupDone, l10n.recoWithWho),
      (ageDone, l10n.recoAgeRange),
    ];
    final doneCount = steps.where((s) => s.$1).length;
    final progress = doneCount / steps.length;
    final allDone = doneCount == steps.length;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: allDone
            ? SmarturStyle.purple.withValues(alpha: 0.08)
            : scheme.surfaceContainerHighest.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: allDone
              ? SmarturStyle.purple.withValues(alpha: 0.25)
              : scheme.outlineVariant.withValues(alpha: 0.4),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                allDone ? Icons.check_circle_rounded : Icons.radio_button_unchecked,
                size: 15,
                color: allDone ? SmarturStyle.purple : scheme.onSurfaceVariant,
              ),
              const SizedBox(width: 6),
              Text(
                allDone ? '¡Todo listo! Puedes generar tu ruta' : '$doneCount / ${steps.length} campos completados',
                style: TextStyle(
                  fontFamily: 'Outfit',
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: allDone ? SmarturStyle.purple : scheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 5,
              backgroundColor: scheme.outlineVariant.withValues(alpha: 0.3),
              valueColor: AlwaysStoppedAnimation<Color>(
                allDone ? SmarturStyle.purple : SmarturStyle.orange,
              ),
            ),
          ),
          if (!allDone) ...[
            const SizedBox(height: 10),
            Wrap(
              spacing: 6,
              runSpacing: 4,
              children: steps.map((s) {
                return Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      s.$1 ? Icons.check_circle_outline : Icons.circle_outlined,
                      size: 13,
                      color: s.$1
                          ? SmarturStyle.green
                          : scheme.onSurfaceVariant.withValues(alpha: 0.5),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      s.$2,
                      style: TextStyle(
                        fontFamily: 'Outfit',
                        fontSize: 11,
                        color: s.$1
                            ? scheme.onSurface
                            : scheme.onSurfaceVariant.withValues(alpha: 0.55),
                        decoration: s.$1 ? TextDecoration.lineThrough : null,
                      ),
                    ),
                  ],
                );
              }).toList(),
            ),
          ],
        ],
      ),
    );
  }
}

class _InlineSection extends StatelessWidget {
  final String label;
  final String? subtitle;
  final bool required;
  final Widget child;

  const _InlineSection({
    required this.label,
    this.subtitle,
    this.required = false,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Container(
              width: 3,
              height: 14,
              decoration: BoxDecoration(
                color: SmarturStyle.purple,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(width: 8),
            Text(
              label.toUpperCase(),
              style: TextStyle(
                fontFamily: 'Outfit',
                fontSize: 11,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.6,
                color: scheme.onSurface,
              ),
            ),
            if (required) ...[
              const SizedBox(width: 4),
              Container(
                width: 5, height: 5,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  color: SmarturStyle.orange,
                ),
              ),
            ],
            if (subtitle != null) ...[
              const SizedBox(width: 8),
              Text(
                subtitle!,
                style: TextStyle(
                  fontFamily: 'Outfit', fontSize: 10,
                  color: scheme.onSurfaceVariant,
                ),
              ),
            ],
          ],
        ),
        const SizedBox(height: 12),
        child,
      ],
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
    final semantic = Theme.of(context).extension<SmarturSemanticColors>()!;
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
                color: selected ? semantic.onImageText : iconColor),
            const SizedBox(height: 4),
            Text(label,
              style: TextStyle(fontFamily: 'Outfit', fontSize: 12, fontWeight: FontWeight.w700,
                  color: selected ? semantic.onImageText : scheme.onSurface)),
            Text(sub,
              style: TextStyle(fontFamily: 'Outfit', fontSize: 9,
                  color: selected ? semantic.onImageText.withValues(alpha: 0.7) : scheme.onSurface.withValues(alpha: 0.4)),
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
    final semantic = Theme.of(context).extension<SmarturSemanticColors>()!;
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
                color: selected ? semantic.onImageText : scheme.onSurface.withValues(alpha: 0.7)),
            const SizedBox(height: 3),
            Text(label,
              style: TextStyle(fontFamily: 'Outfit', fontSize: 11, fontWeight: FontWeight.w600,
                  color: selected ? semantic.onImageText : scheme.onSurface)),
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
    final semantic = Theme.of(context).extension<SmarturSemanticColors>()!;
    return AnimatedBuilder(
      animation: _gradCtrl,
      builder: (context, child) {
        final loading = widget.loading;
        final disabled = widget.disabled;
        final ca = _colorA.evaluate(_gradCtrl) ?? SmarturStyle.purple;
        final cb = _colorB.evaluate(_gradCtrl) ?? SmarturStyle.purple;
        Widget content;
        if (loading) {
          content = SizedBox(
            width: 22, height: 22,
            child: CircularProgressIndicator(color: semantic.onImageText, strokeWidth: 2.5),
          );
        } else {
          content = Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.auto_awesome_rounded,
                color: disabled ? scheme.onSurface.withValues(alpha: 0.3) : semantic.onImageText,
                size: 20),
              const SizedBox(width: 10),
              Text(AppLocalizations.of(context)!.recoTitle,
                style: TextStyle(
                  fontFamily: 'Outfit', fontSize: 16, fontWeight: FontWeight.w700,
                  color: disabled ? scheme.onSurface.withValues(alpha: 0.3) : semantic.onImageText,
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

class _RankBadge extends StatelessWidget {
  final int rank;
  const _RankBadge({required this.rank});

  @override
  Widget build(BuildContext context) {
    final semantic = Theme.of(context).extension<SmarturSemanticColors>()!;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 5),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            SmarturStyle.purple.withValues(alpha: 0.92),
            SmarturStyle.pink.withValues(alpha: 0.85),
          ],
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: SmarturStyle.purple.withValues(alpha: 0.25),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Text(
        '#$rank',
        style: TextStyle(
          fontFamily: 'CalSans',
          fontSize: 14,
          color: semantic.onImageText,
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
    final semantic = Theme.of(context).extension<SmarturSemanticColors>()!;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: SmarturStyle.orange.withValues(alpha: 0.9),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.auto_awesome_rounded, color: semantic.onImageText, size: 11),
          const SizedBox(width: 3),
          Text(score.toStringAsFixed(2),
            style: TextStyle(fontFamily: 'Outfit', fontWeight: FontWeight.w800,
                color: semantic.onImageText, fontSize: 11)),
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
