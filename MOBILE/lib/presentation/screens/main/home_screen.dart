import 'dart:convert';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:share_plus/share_plus.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:local_auth/local_auth.dart';
import 'package:local_auth_android/local_auth_android.dart';
import 'package:http/http.dart' as http;
import 'package:smartur/l10n/app_localizations.dart';

import '../../../core/motion/smartur_motion.dart';
import '../../../core/motion/smartur_routes.dart';
import '../../../core/theme/smartur_theme_extensions.dart';
import '../../../core/theme/style_guide.dart';
import '../../../core/constants/env_config.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/utils/notifications.dart';
import '../../../data/services/auth_service.dart';
import '../../../data/services/update_service.dart';
import '../../../data/services/explore_service.dart';
import '../../../data/services/profile_service.dart';
import '../../../data/services/user_content_service.dart';
import '../../../data/models/place_model.dart';
import '../../widgets/smartur_skeleton.dart';
import '../../widgets/smartur_app_bar.dart';
import '../../widgets/smartur_background.dart';
import '../../widgets/smartur_user_avatar.dart';
import '../../widgets/offline_banner.dart';
import '../preferences/preferences_screen.dart';
import '../settings/settings_screen.dart';
import '../auth/welcome_screen.dart';
import '../../widgets/add_to_route_sheet.dart';
import '../explore/detail_view_page.dart';
import 'wellness_assessment_screen.dart';

/// Module-level like cache — liked state persists across widget rebuilds and scroll recycling.
/// Key: place.id (e.g. 'poi_3', 'svc_7').  Value: liked this session.
final _homeLikeCache = <String, bool>{};

class HomeScreen extends StatefulWidget {
  final String? userName;
  final bool isNewLogin;

  const HomeScreen({super.key, this.userName, this.isNewLogin = false});

  @override
  State<HomeScreen> createState() => HomeScreenState();
}

class HomeScreenState extends State<HomeScreen> {
  static const double _kHomeHeaderExpandedHeight = 148;

  final AuthService _authService = AuthService();
  final ExploreService _exploreService = ExploreService();
  final LocalAuthentication _auth = LocalAuthentication();
  final ScrollController _homeScrollController = ScrollController();

  /// 0 = header expandido (transparente), 1 = colapsado (fondo surface del tema).
  double _homeHeaderCollapseT = 0;

  static bool _isLoadingContent = true;
  bool _welcomeShown = false;
  static bool _welcomeShownOnce = false;
  static bool _preferencesCheckedOnce = false;

  /// Evita volver a mostrar el diálogo de huella al cambiar de pestaña y regresar
  /// a Inicio (cada vez Home se desmonta y vuelve a montar). Una vez por sesión
  /// de la app; "No volver a recordar" sigue guardado en [AuthService].
  static bool _biometricSetupOfferedThisSession = false;

  static final Map<String, String?> _weatherSummaryCache = {};

  // ── Data ──
  List<CityData> _cities = [];
  String? _exploreError;
  bool _exploreLoaded = false;

  // ── ML recommendations ──
  List<Place> _recommendedPlaces = [];
  bool _recommendationsLoaded = false;

  // ── Offline mode ──
  bool _isOffline = false;
  String? _offlineCacheAge;

  // ── Selection state ──
  /// `null` = mostrar lugares de todas las ciudades a la vez.
  CityData? _selectedCity;

  /// Clima: ciudad concreta o la primera si el modo es "todas".
  CityData? get _weatherCity =>
      _selectedCity ?? (_cities.isNotEmpty ? _cities.first : null);

  /// Lugares según chip de ciudad (todas o una).
  List<Place> get _placesInScope {
    if (_cities.isEmpty) return const [];
    if (_selectedCity == null) {
      return _cities.expand((c) => c.places).toList();
    }
    return _selectedCity!.places;
  }

  PlaceCategory? _selectedCategory;
  final GlobalKey _categoryFilterButtonKey = GlobalKey();

  // ── Search ──
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  double _categoryFilterReservedWidth = 150; // Fallback mientras se mide.

  String? _weatherSummary;
  bool _weatherLoading = true;

  String? _headerPhotoUrl;
  String? _headerAvatarIconKey;

  /// Nombre para el saludo: widget o almacenamiento (al volver al tab Home se recrea el State).
  String? _greetingName;

  List<Place> get _filteredPlaces {
    var scope = _placesInScope;
    if (_selectedCategory != null) {
      scope = scope.where((p) => p.category == _selectedCategory).toList();
    }
    if (_searchQuery.isNotEmpty) {
      final q = _searchQuery.toLowerCase();
      scope = scope.where((p) =>
        p.name.toLowerCase().contains(q) ||
        p.shortDescription.toLowerCase().contains(q) ||
        p.city.toLowerCase().contains(q),
      ).toList();
    }
    return scope;
  }

  // ───────────────────────── Lifecycle ─────────────────────────

  @override
  void initState() {
    super.initState();
    _homeScrollController.addListener(_onHomeScroll);
    final w = widget.userName?.trim();
    if (w != null && w.isNotEmpty) {
      _greetingName = w;
    }
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      // Greeting: local storage, no network — fire immediately.
      _applyGreetingName();

      // Start city load in parallel so network round-trip overlaps setup checks.
      final cityFuture = _loadCitiesFromApi();

      // Setup checks must finish before home content appears (original UX).
      await _showWelcome();
      await _checkPreferences();
      await _offerBiometricSetup();

      // Wait for cities if they haven't loaded yet (often already done).
      await cityFuture;
      if (!mounted) return;
      setState(() => _isLoadingContent = false);

      _loadWeatherForSelectedCity();
      _loadHeaderAvatar();
      _loadRecommendations();
      if (mounted) UpdateService.checkAndPromptIfNeeded(context);
    });
  }

  @override
  void dispose() {
    _homeScrollController.removeListener(_onHomeScroll);
    _homeScrollController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  void _onHomeScroll() {
    if (!_homeScrollController.hasClients || !mounted) return;
    final top = MediaQuery.paddingOf(context).top;
    final collapsed = top + kToolbarHeight;
    final range = _kHomeHeaderExpandedHeight - collapsed;
    final offset = _homeScrollController.offset.clamp(0.0, double.infinity);
    final t = range > 0 ? (offset / range).clamp(0.0, 1.0) : 1.0;
    if ((t - _homeHeaderCollapseT).abs() < 0.008) return;
    setState(() => _homeHeaderCollapseT = t);
  }

  @override
  void didUpdateWidget(HomeScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    final w = widget.userName?.trim();
    if (w != null && w.isNotEmpty && w != _greetingName) {
      setState(() => _greetingName = w);
    }
  }

  /// Nombre en almacenamiento gana sobre [userName] del widget (evita saludo obsoleto tras editar perfil).
  Future<void> _applyGreetingName() async {
    final stored = await _authService.getUserName();
    final w = widget.userName?.trim();
    if (!mounted) return;
    setState(() {
      if (stored != null && stored.isNotEmpty) {
        _greetingName = stored;
      } else if (w != null && w.isNotEmpty) {
        _greetingName = w;
      }
    });
  }

  /// Tras cambiar nombre/foto/icono en perfil o ajustes: sincroniza cabecera desde almacenamiento (+ API opcional en avatar).
  Future<void> refreshUserIdentity() async {
    await _applyGreetingName();
    await _refreshHeaderAvatarFromStorage();
  }

  Future<void> _onRefresh() async {
    await _loadCitiesFromApi();
    if (!mounted) return;
    _loadWeatherForSelectedCity();
    _loadHeaderAvatar();
    _loadRecommendations();
  }

  /// Segundo toque en la pestaña Inicio: vuelve al inicio del scroll.
  void reloadRecommendations() => _loadRecommendations();

  void scrollToTop() {
    if (!_homeScrollController.hasClients) return;
    _homeScrollController.animateTo(
      0,
      duration: SmarturMotion.normal,
      curve: SmarturMotion.standard,
    );
  }

  Future<void> _refreshHeaderAvatarFromStorage() async {
    final photo = await _authService.getUserPhotoUrl();
    final icon = await _authService.getUserAvatarIconKey();
    if (!mounted) return;
    setState(() {
      _headerPhotoUrl = photo;
      _headerAvatarIconKey = icon;
    });
  }

  // ───────────────────────── Business logic (unchanged) ─────────────────────────

  Future<void> _checkPreferences() async {
    if (_preferencesCheckedOnce) return;
    _preferencesCheckedOnce = true;

    if (!widget.isNewLogin) return;
    final saved = await ProfileService.hasPreferencesSaved();
    if (!saved && mounted) {
      Navigator.push(
        context,
        smarturFadeRoute(PreferencesScreen(userName: widget.userName)),
      );
    }
  }

  Future<void> _showWelcome() async {
    if (!mounted) return;
    if (_welcomeShown || _welcomeShownOnce) return;
    if (!widget.isNewLogin) return;

    _welcomeShown = true;
    _welcomeShownOnce = true;

    final name = widget.userName;
    final greeting = AppLocalizations.of(context)!.welcomeGreeting;
    final message = (name != null && name.isNotEmpty)
        ? '$greeting, $name 👋'
        : '$greeting 👋';
    SmarturNotifications.showSuccess(context, message);
  }

  Future<void> _offerBiometricSetup() async {
    if (_biometricSetupOfferedThisSession) return;

    final alreadyEnabled = await _authService.isBiometricEnabled();
    if (alreadyEnabled) {
      _biometricSetupOfferedThisSession = true;
      return;
    }

    final dismissed = await _authService.isBiometricDismissed();
    if (dismissed) {
      _biometricSetupOfferedThisSession = true;
      return;
    }

    final canAuth = await _auth.canCheckBiometrics || await _auth.isDeviceSupported();
    if (!canAuth) {
      _biometricSetupOfferedThisSession = true;
      return;
    }

    final available = await _auth.getAvailableBiometrics();
    if (available.isEmpty) {
      _biometricSetupOfferedThisSession = true;
      return;
    }

    if (!mounted) return;

    // Una sola vez por apertura de la app (no en cada vuelta al tab Inicio).
    _biometricSetupOfferedThisSession = true;

    final l10n = AppLocalizations.of(context)!;
    final scheme = Theme.of(context).colorScheme;

    final result = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        icon: Icon(Icons.fingerprint, size: 48, color: scheme.primary),
        title: Text(l10n.quickAccess, style: const TextStyle(fontFamily: 'CalSans')),
        content: Text(
          l10n.biometricPrompt,
          style: TextStyle(fontFamily: 'Outfit', color: scheme.onSurfaceVariant),
          textAlign: TextAlign.center,
        ),
        actionsAlignment: MainAxisAlignment.center,
        actionsOverflowAlignment: OverflowBarAlignment.center,
        actionsPadding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
        actions: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              ElevatedButton(
                onPressed: () => Navigator.pop(ctx, 'activate'),
                style: ElevatedButton.styleFrom(backgroundColor: scheme.primary),
                child: Text(l10n.activate),
              ),
              const SizedBox(height: 4),
              TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: Text(l10n.notNow, style: TextStyle(color: scheme.onSurfaceVariant)),
              ),
              TextButton(
                onPressed: () => Navigator.pop(ctx, 'dismiss'),
                child: Text(
                  l10n.dontRemindMe,
                  style: TextStyle(color: scheme.onSurfaceVariant, fontSize: 13),
                ),
              ),
            ],
          ),
        ],
      ),
    );

    if (!mounted) return;

    if (result == 'dismiss') {
      await _authService.setBiometricDismissed(true);
      return;
    }

    if (result != 'activate') return;

    try {
      final didAuth = await _auth.authenticate(
        localizedReason: l10n.biometricActivateReason,
        authMessages: <AuthMessages>[
          AndroidAuthMessages(
            signInTitle: l10n.biometricActivateTitle,
            biometricHint: l10n.biometricTouchSensor,
            cancelButton: l10n.cancel,
          ),
        ],
        options: const AuthenticationOptions(biometricOnly: true, stickyAuth: true),
      );

      if (didAuth) {
        await _authService.setBiometricEnabled(true);
        if (mounted) {
          SmarturNotifications.showSuccess(context, l10n.biometricActivated);
        }
      }
    } catch (e) {
      if (mounted) {
        SmarturNotifications.showError(context, l10n.biometricActivateError(e));
      }
    }
  }

  Future<void> _loadWeatherForSelectedCity() async {
    final city = _weatherCity;
    if (city == null) {
      if (mounted) {
        setState(() {
          _weatherSummary = null;
          _weatherLoading = false;
        });
      }
      return;
    }
    final cityName = city.name;
    final cached = _weatherSummaryCache[cityName];
    if (cached != null) {
      setState(() {
        _weatherSummary = cached;
        _weatherLoading = false;
      });
      return;
    }

    setState(() => _weatherLoading = true);

    final apiKey = EnvConfig.openWeatherApiKey;
    if (apiKey.isEmpty) {
      setState(() {
        _weatherSummary = null;
        _weatherLoading = false;
      });
      return;
    }

    final uri = Uri.parse(
      'https://api.openweathermap.org/data/2.5/weather'
      '?lat=${city.lat.toStringAsFixed(4)}'
      '&lon=${city.lon.toStringAsFixed(4)}'
      '&appid=$apiKey'
      '&units=metric'
      '&lang=es',
    );

    try {
      final resp = await http.get(uri);
      if (resp.statusCode == 200) {
        final data = jsonDecode(resp.body) as Map<String, dynamic>;
        final main = data['main'] as Map<String, dynamic>?;
        final weatherList = data['weather'] as List<dynamic>?;

        if (main != null && weatherList != null && weatherList.isNotEmpty) {
          final temp = (main['temp'] as num?)?.toDouble();
          final descRaw =
              (weatherList.first as Map<String, dynamic>)['description'] as String? ?? '';
          final desc = descRaw.isNotEmpty
              ? '${descRaw[0].toUpperCase()}${descRaw.substring(1)}'
              : '';

          final summary = temp != null ? '${temp.toStringAsFixed(1)}°C · $desc' : desc;
          _weatherSummaryCache[cityName] = summary;
          setState(() {
            _weatherSummary = summary;
            _weatherLoading = false;
          });
        } else {
          setState(() {
            _weatherSummary = null;
            _weatherLoading = false;
          });
        }
      } else {
        setState(() {
          _weatherSummary = null;
          _weatherLoading = false;
        });
      }
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _weatherSummary = null;
        _weatherLoading = false;
      });
    }
  }

  Future<void> _loadHeaderAvatar() async {
    try {
      final profile = await _authService.getUserProfile();
      final photo = profile?['photo_url'] as String? ?? await _authService.getUserPhotoUrl();
      final icon = profile?['avatar_icon_key'] as String? ?? await _authService.getUserAvatarIconKey();
      if (mounted) {
        setState(() {
          _headerPhotoUrl = photo;
          _headerAvatarIconKey = icon;
        });
      }
    } catch (_) {
      final photo = await _authService.getUserPhotoUrl();
      final icon = await _authService.getUserAvatarIconKey();
      if (mounted) {
        setState(() {
          _headerPhotoUrl = photo;
          _headerAvatarIconKey = icon;
        });
      }
    }
  }

  Future<void> _loadCitiesFromApi() async {
    try {
      final result = await _exploreService.fetchCitiesWithFallback();
      if (!mounted) return;
      setState(() {
        _exploreLoaded = true;
        _exploreError = null;
        _cities = result.cities;
        _selectedCity = null;
        _selectedCategory = null;
        _isOffline = result.fromCache;
        _offlineCacheAge = result.cacheAge;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _exploreLoaded = true;
        _cities = [];
        _selectedCity = null;
        _exploreError = e.toString();
        _isOffline = false;
        _offlineCacheAge = null;
      });
    }
  }

  Future<void> _loadRecommendations() async {
    try {
      final userId = await _authService.getUserId();
      final token = await _authService.getToken();
      if (userId == null || token == null) return;

      final profile = await ProfileService.fetchMyProfileForPreferences();
      final context = <String, dynamic>{};
      final interests = profile['interests'];
      if (interests is List && interests.isNotEmpty) {
        context['interests'] = interests;
      }
      if (profile['activity_level'] != null) {
        context['activity_level'] = profile['activity_level'];
      }
      if (profile['travel_type'] != null) {
        context['travel_type'] = profile['travel_type'];
      }
      if (profile['preferred_place'] != null) {
        context['preferred_place'] = profile['preferred_place'];
      }
      if (profile['age'] != null) {
        context['age'] = profile['age'];
      }

      final url = Uri.parse(
          '${ApiConstants.baseUrl}${ApiConstants.mlRecommend}/$userId');
      final res = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'top_n': 8,
          if (context.isNotEmpty) 'context': context,
        }),
      ).timeout(const Duration(seconds: 12));

      if (!mounted) return;
      if (res.statusCode != 200) return;

      final data = jsonDecode(res.body) as Map<String, dynamic>;
      final recs = (data['recommendations'] as List?)?.cast<Map<String, dynamic>>() ?? [];
      if (recs.isEmpty) return;

      final allPlaces = _cities.expand((c) => c.places).toList();
      final placeById = {for (final p in allPlaces) p.id: p};

      final matched = recs
          .map((r) => placeById[r['item_id'] as String?])
          .whereType<Place>()
          .toList();

      if (!mounted || matched.isEmpty) return;
      setState(() {
        _recommendedPlaces = matched;
        _recommendationsLoaded = true;
      });
    } catch (_) {
      // Non-fatal — section simply won't appear
    }
  }

  void _showProfile() {
    final l10n = AppLocalizations.of(context)!;
    final scheme = Theme.of(context).colorScheme;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return SingleChildScrollView(
          padding: EdgeInsets.only(
            left: 24,
            top: 16,
            right: 24,
            bottom: 32 + MediaQuery.of(ctx).viewInsets.bottom,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                    color: scheme.outlineVariant, borderRadius: BorderRadius.circular(2)),
              ),
              const SizedBox(height: 24),
              Text(l10n.myProfile, style: SmarturStyle.calSansTitle.copyWith(fontSize: 22)),
              const SizedBox(height: 4),
              Text(
                l10n.manageAccount,
                style: TextStyle(fontFamily: 'Outfit', color: scheme.onSurfaceVariant),
              ),
              const SizedBox(height: 16),
              const Divider(),
              ListTile(
                leading: Icon(Icons.tune_outlined, color: SmarturSemanticColors.of(context).sea),
                title: Text(l10n.myPreferences, style: const TextStyle(fontFamily: 'Outfit')),
                trailing:
                    Icon(Icons.chevron_right, color: scheme.onSurfaceVariant),
                onTap: () async {
                  final interests = await ProfileService.getSavedInterests();
                  if (!ctx.mounted) return;

                  if (interests.isEmpty) {
                    Navigator.pop(ctx);
                    Navigator.push(
                      ctx,
                      smarturFadeRoute(
                        PreferencesScreen(userName: widget.userName),
                      ),
                    );
                    return;
                  }

                  showDialog(
                    context: ctx,
                    builder: (dCtx) => AlertDialog(
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(24)),
                      actionsAlignment: MainAxisAlignment.center,
                      actionsOverflowAlignment: OverflowBarAlignment.center,
                      title: Text(l10n.yourPreferences,
                          style: TextStyle(
                              fontFamily: 'CalSans', color: scheme.primary)),
                      content: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (interests.isNotEmpty)
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: interests
                                  .map((i) => Chip(
                                        label: Text(i,
                                            style: TextStyle(
                                                fontSize: 12,
                                                fontFamily: 'Outfit',
                                                color: scheme.primary)),
                                        backgroundColor: scheme.primary
                                            .withValues(alpha: 0.1),
                                        side: BorderSide.none,
                                        shape: RoundedRectangleBorder(
                                            borderRadius: BorderRadius.circular(20)),
                                      ))
                                  .toList(),
                            )
                          else
                            Text(l10n.noPreferencesSaved,
                                style: const TextStyle(fontFamily: 'Outfit')),
                          const SizedBox(height: 24),
                          Text(l10n.confirmChangePreferences,
                              style: const TextStyle(
                                  fontFamily: 'Outfit', fontWeight: FontWeight.bold)),
                        ],
                      ),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.pop(dCtx),
                          child: Text(l10n.cancel,
                              style:
                                  TextStyle(color: scheme.onSurfaceVariant)),
                        ),
                        ElevatedButton(
                          onPressed: () {
                            Navigator.pop(dCtx);
                            Navigator.pop(ctx);
                            Navigator.push(
                              context,
                              smarturFadeRoute(
                                PreferencesScreen(userName: widget.userName),
                              ),
                            );
                          },
                          style: ElevatedButton.styleFrom(
                              backgroundColor: scheme.primary),
                          child: Text(l10n.change),
                        ),
                      ],
                    ),
                  );
                },
              ),
              const Divider(),
              FutureBuilder<bool>(
                future: _authService.isBiometricEnabled(),
                builder: (_, snap) {
                  final enabled = snap.data ?? false;
                  // Evita que dos toques rápidos disparen dos llamadas
                  // concurrentes a _auth.authenticate() — local_auth lanza un
                  // error ("auth_in_progress") si se le pide autenticar dos
                  // veces a la vez, lo que se veía como "detecta las 2 acciones".
                  bool busy = false;
                  return StatefulBuilder(
                      builder: (BuildContext context, StateSetter setState) {
                    return SwitchListTile(
                      activeThumbColor: scheme.primary,
                      secondary:
                          Icon(Icons.fingerprint, color: scheme.primary),
                      title: Text(l10n.fingerprintAccess,
                          style: const TextStyle(fontFamily: 'Outfit')),
                      value: enabled,
                      onChanged: busy ? null : (bool newValue) async {
                        setState(() => busy = true);
                        try {
                        if (newValue) {
                          try {
                            final didAuth = await _auth.authenticate(
                              localizedReason: l10n.biometricConfirmActivate,
                              options:
                                  const AuthenticationOptions(biometricOnly: true),
                            );
                            if (didAuth) {
                              await _authService.setBiometricEnabled(true);
                              if (ctx.mounted) {
                                SmarturNotifications.showSuccess(
                                    ctx, l10n.biometricActivated);
                                Navigator.pop(ctx);
                                _showProfile();
                              }
                            }
                          } catch (_) {
                            if (ctx.mounted) {
                              SmarturNotifications.showError(
                                  ctx, l10n.biometricCouldNotActivate);
                            }
                          }
                        } else {
                          await _authService.setBiometricEnabled(false);
                          if (ctx.mounted) {
                            SmarturNotifications.showSuccess(
                                ctx, l10n.biometricDeactivated);
                            Navigator.pop(ctx);
                            _showProfile();
                          }
                        }
                        } finally {
                          if (context.mounted) setState(() => busy = false);
                        }
                      },
                    );
                  });
                },
              ),
              const Divider(),
              ListTile(
                leading: Icon(Icons.settings_outlined,
                    color: scheme.onSurface),
                title: Text(l10n.configuration,
                    style: const TextStyle(fontFamily: 'Outfit')),
                trailing:
                    Icon(Icons.chevron_right, color: scheme.onSurfaceVariant),
                onTap: () async {
                  Navigator.pop(ctx);
                  await Navigator.push<void>(
                    context,
                    smarturFadeRoute(const SettingsScreen()),
                  );
                  if (mounted) await refreshUserIdentity();
                },
              ),
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () async {
                    await _authService.clearSession();
                    if (ctx.mounted) Navigator.pop(ctx);
                    if (mounted) {
                      Navigator.pushAndRemoveUntil(
                        context,
                        smarturFadeRoute(const WelcomeScreen()),
                        (_) => false,
                      );
                    }
                  },
                  icon: Icon(Icons.logout, color: SmarturSemanticColors.of(context).altAccent),
                  label: Text(
                    l10n.logout,
                    style: TextStyle(
                        fontFamily: 'Outfit',
                        color: SmarturSemanticColors.of(context).altAccent,
                        fontWeight: FontWeight.w600),
                  ),
                  style: OutlinedButton.styleFrom(
                    side: BorderSide(color: SmarturSemanticColors.of(context).altAccent),
                    minimumSize:
                        const Size(double.infinity, SmarturStyle.touchTargetComfortable),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  // ───────────────────────── Build ─────────────────────────

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      body: Column(
        children: [
          if (_isOffline)
            OfflineBanner(
              cacheAge: _offlineCacheAge,
              onRetry: _loadCitiesFromApi,
            ),
          Expanded(
            child: SmarturBackground(
              child: SmarturShimmer(
                enabled: _isLoadingContent,
                child: RefreshIndicator(
                  onRefresh: _onRefresh,
                  color: Theme.of(context).colorScheme.primary,
                  child: CustomScrollView(
                    controller: _homeScrollController,
                    physics: const BouncingScrollPhysics(
                      parent: AlwaysScrollableScrollPhysics(),
                    ),
                    slivers: [
                      _buildHeaderAppBar(),
                      SliverToBoxAdapter(child: _buildExploreIntro()),
                      SliverToBoxAdapter(child: _buildSearchBar()),
                      SliverToBoxAdapter(child: _buildCityFilter()),
                      ..._buildPlaceShowcaseSlivers(),
                      const SliverToBoxAdapter(child: SizedBox(height: 32)),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── Header ──

  SliverAppBar _buildHeaderAppBar() {
    final l10n = AppLocalizations.of(context)!;
    final scheme = Theme.of(context).colorScheme;
    final name = _greetingName ?? widget.userName;
    final greetingName = (name != null && name.isNotEmpty) ? ', $name' : '';

    // Altura del header adaptada al status bar: barra mini + saludo, sin hueco.
    final topInset = MediaQuery.paddingOf(context).top;
    final expandedH = topInset + kToolbarHeight + 42;

    // Barra mini (siempre visible al colapsar): clima
    final weatherMini = _isLoadingContent
        ? const SkeletonContainer(height: 34, width: 140, borderRadius: 12)
        : Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.wb_sunny_outlined, color: scheme.primary, size: 22),
              const SizedBox(width: 8),
              Flexible(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (_weatherCity != null)
                      Text(
                        _weatherCity!.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontFamily: 'Outfit',
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: scheme.onSurface,
                        ),
                      ),
                    Text(
                      _weatherLoading
                          ? l10n.loading
                          : (_weatherSummary ?? l10n.notAvailable),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontFamily: 'Outfit',
                        fontSize: 11,
                        color: scheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          );

    // Avatar cuyo tamaño crece al expandir (grande, del alto del bloque) y se
    // encoge al colapsar para caber en la barra mini. [radius] lo pasa el header.
    Widget avatarBtnOf(double radius) => GestureDetector(
          onTap: _showProfile,
          behavior: HitTestBehavior.opaque,
          child: SmarturUserAvatar(
            radius: radius,
            photoUrl: _headerPhotoUrl,
            avatarIconKey: _headerAvatarIconKey,
            displayName: name ?? '',
            backgroundColor: scheme.primary.withValues(alpha: 0.12),
            foregroundColor: scheme.onSurface,
          ),
        );

    return SliverAppBar(
      pinned: true,
      expandedHeight: expandedH,
      backgroundColor: Colors.transparent,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      scrolledUnderElevation: 0,
      shadowColor: Colors.transparent,
      flexibleSpace: LayoutBuilder(
        builder: (context, constraints) {
          final top = MediaQuery.paddingOf(context).top;
          final denom = expandedH - top - kToolbarHeight;
          // t = 1 arriba del todo (expandido) · 0 al colapsar
          final t = denom > 0
              ? ((constraints.maxHeight - top - kToolbarHeight) / denom)
                  .clamp(0.0, 1.0)
              : 0.0;
          final et = Curves.easeOut.transform(t);
          return Stack(
            fit: StackFit.expand,
            children: [
              smarturHeaderGlass(context),
              // Avatar: grande (del alto del bloque) al expandir, pequeño al
              // colapsar. Centrado verticalmente sobre el bloque.
              Positioned(
                top: top,
                bottom: 0,
                right: 12,
                child: Center(child: avatarBtnOf(19 + 10 * et)),
              ),
              // Bloque: clima arriba · saludo + subtítulo debajo (fade al colapsar)
              Positioned(
                top: top + 8,
                left: 20,
                right: 84,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    weatherMini,
                    const SizedBox(height: 5),
                    IgnorePointer(
                      ignoring: t < 0.15,
                      child: Opacity(
                        opacity: et,
                        child: _isLoadingContent
                            ? const SkeletonText(width: 180, height: 24)
                            : Column(
                                mainAxisSize: MainAxisSize.min,
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Container(
                                        width: 5,
                                        height: 28,
                                        decoration: BoxDecoration(
                                          color: scheme.primary,
                                          borderRadius: BorderRadius.circular(2),
                                        ),
                                      ),
                                      const SizedBox(width: 10),
                                      Expanded(
                                        child: Text(
                                          l10n.exploreGreeting(greetingName),
                                          style: SmarturStyle.calSansTitle
                                              .copyWith(fontSize: 26),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  Padding(
                                    padding: const EdgeInsets.only(left: 15),
                                    child: Text(
                                      l10n.highMountainsVeracruz,
                                      style: TextStyle(
                                        fontFamily: 'Outfit',
                                        fontSize: 14,
                                        color: scheme.onSurfaceVariant,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  // ── Explore intro ──

  Widget _buildExploreIntro() {
    return const SizedBox.shrink();
  }

  // ── Search bar ──

  Widget _buildSearchBar() {
    if (!_exploreLoaded || _cities.isEmpty) return const SizedBox.shrink();
    final l10n = AppLocalizations.of(context)!;
    final scheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 8),
      child: TextField(
        controller: _searchController,
        onChanged: (v) => setState(() => _searchQuery = v.trim()),
        style: TextStyle(fontFamily: 'Outfit', fontSize: 13, color: scheme.onSurface),
        decoration: InputDecoration(
          hintText: l10n.searchHint,
          hintStyle: TextStyle(fontFamily: 'Outfit', fontSize: 13, color: scheme.onSurfaceVariant),
          prefixIcon: Icon(Icons.search_rounded, size: 18, color: scheme.onSurfaceVariant),
          suffixIcon: _searchQuery.isNotEmpty
              ? IconButton(
                  icon: Icon(Icons.close_rounded, size: 17, color: scheme.onSurfaceVariant),
                  onPressed: () {
                    _searchController.clear();
                    setState(() => _searchQuery = '');
                  },
                )
              : null,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          filled: true,
          fillColor: scheme.surfaceContainerHighest.withValues(alpha: 0.55),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: BorderSide.none,
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: BorderSide(color: scheme.outlineVariant.withValues(alpha: 0.5)),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: BorderSide(color: SmarturSemanticColors.of(context).leaf.withValues(alpha: 0.7), width: 1.5),
          ),
        ),
      ),
    );
  }

  // ── City selector ──

  /// Misma composición que la fila cargada: chips + botón filtro (shimmer global).
  Widget _buildCityFilterSkeleton(BoxConstraints constraints) {
    final listWidth =
        constraints.maxWidth - 20 - _categoryFilterReservedWidth - 1;
    return Stack(
      children: [
        Positioned(
          left: 0,
          top: 0,
          bottom: 0,
          width: listWidth > 0 ? listWidth : 0,
          child: ListView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.only(left: 20),
            children: const [
              SkeletonChipPill(width: 112),
              SizedBox(width: 10),
              SkeletonChipPill(width: 88),
              SizedBox(width: 10),
              SkeletonChipPill(width: 92),
              SizedBox(width: 10),
              SkeletonChipPill(width: 76),
            ],
          ),
        ),
        const Positioned(
          right: 20,
          top: 0,
          bottom: 0,
          child: Center(child: SkeletonFilterButton()),
        ),
      ],
    );
  }

  Widget _buildCityFilter() {
    return SizedBox(
      height: 52,
      child: LayoutBuilder(
        builder: (context, constraints) {
          final scheme = Theme.of(context).colorScheme;
          final l10n = AppLocalizations.of(context)!;

          if (_cities.isEmpty) {
            if (!_exploreLoaded) {
              return _buildCityFilterSkeleton(constraints);
            }
            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  _exploreError != null
                      ? l10n.exploreCouldNotLoad
                      : l10n.exploreNoCities,
                  style: TextStyle(
                    fontFamily: 'Outfit',
                    fontSize: 12,
                    color: scheme.onSurfaceVariant,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            );
          }

          // Limit the ListView viewport so chips cannot be painted under
          // the filter button area.
          final listWidth =
              constraints.maxWidth - 20 - _categoryFilterReservedWidth - 1;

          return Stack(
            children: [
              Positioned(
                left: 0,
                top: 0,
                bottom: 0,
                width: listWidth > 0 ? listWidth : 0,
                child: ClipRect(
                  child: ShaderMask(
                    blendMode: BlendMode.dstIn,
                    shaderCallback: (rect) {
                      const double fadeWidth = 26; // ajusta si quieres mas suave
                      final w = rect.width;
                      final t = (w <= fadeWidth) ? 0.0 : (w - fadeWidth) / w;
                      return LinearGradient(
                        begin: Alignment.centerLeft,
                        end: Alignment.centerRight,
                        colors: const [
                          Colors.white,
                          Colors.white,
                          Colors.transparent,
                        ],
                        stops: [0.0, t, 1.0],
                      ).createShader(rect);
                    },
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.only(left: 20),
                      itemCount: 1 + _cities.length,
                      itemBuilder: (context, idx) {
                        final accentColor = SmarturSemanticColors.of(context).leaf;
                        final isLast = idx == _cities.length;

                        if (idx == 0) {
                          final allSelected = _selectedCity == null;
                          return Padding(
                            padding: EdgeInsets.only(right: isLast ? 0 : 10),
                            child: ChoiceChip(
                              selected: allSelected,
                              showCheckmark: false,
                              side: BorderSide(
                                color: allSelected
                                    ? accentColor.withValues(alpha: 0.5)
                                    : scheme.outlineVariant,
                              ),
                              backgroundColor: scheme.surfaceContainerHighest,
                              selectedColor:
                                  accentColor.withValues(alpha: 0.20),
                              labelPadding: const EdgeInsets.symmetric(
                                  horizontal: 10, vertical: 4),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(999),
                              ),
                              label: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    Icons.public_rounded,
                                    size: 16,
                                    color: allSelected
                                        ? accentColor
                                        : scheme.onSurfaceVariant,
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    l10n.exploreAllCities,
                                    style: TextStyle(
                                      fontFamily: 'Outfit',
                                      fontWeight: FontWeight.w700,
                                      color: allSelected
                                          ? accentColor
                                          : scheme.onSurface,
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ),
                              onSelected: (v) {
                                if (!v) return;
                                setState(() {
                                  _selectedCity = null;
                                  _selectedCategory = null;
                                });
                                _loadWeatherForSelectedCity();
                              },
                            ),
                          );
                        }

                        final city = _cities[idx - 1];
                        final isSelected =
                            _selectedCity?.name == city.name;
                        return Padding(
                          padding: EdgeInsets.only(
                              right: isLast ? 0 : 10),
                          child: ChoiceChip(
                            selected: isSelected,
                            showCheckmark: false,
                            side: BorderSide(
                              color: isSelected
                                  ? accentColor.withValues(alpha: 0.5)
                                  : scheme.outlineVariant,
                            ),
                            backgroundColor:
                                scheme.surfaceContainerHighest,
                            selectedColor: accentColor.withValues(alpha: 0.20),
                            labelPadding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 4),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(999),
                            ),
                            label: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  city.chipIcon,
                                  size: 16,
                                  color: isSelected
                                      ? accentColor
                                      : scheme.onSurfaceVariant,
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  city.name,
                                  style: TextStyle(
                                    fontFamily: 'Outfit',
                                    fontWeight: FontWeight.w700,
                                    color: isSelected
                                        ? accentColor
                                        : scheme.onSurface,
                                    fontSize: 12,
                                  ),
                                ),
                              ],
                            ),
                            onSelected: (v) {
                              if (!v) return;
                              setState(() {
                                _selectedCity = city;
                                _selectedCategory = null;
                              });
                              _loadWeatherForSelectedCity();
                              UserContentService().batchInteractions([{
                                'place_kind': null,
                                'place_id': null,
                                'event_type': 'filter_click',
                                'meta': {'filter': 'city', 'value': city.name},
                              }]);
                            },
                          ),
                        );
                      },
                    ),
                  ),
                ),
              ),
              Positioned(
                right: 20,
                top: 0,
                bottom: 0,
                child: Center(child: _buildCategoryFilter()),
              ),
            ],
          );
        },
      ),
    );
  }

  // ── Category selector (filter icon + popup menu) ──

  Widget _buildCategoryFilter() {
    final l10n = AppLocalizations.of(context)!;
    final scheme = Theme.of(context).colorScheme;
    if (_cities.isEmpty) {
      return const SizedBox(width: 48, height: 48);
    }
    final scope = _placesInScope;
    if (scope.isEmpty) {
      return const SizedBox(width: 48, height: 48);
    }
    int countFor(PlaceCategory cat) =>
        scope.where((p) => p.category == cat).length;

    final categories = PlaceCategory.values;
    final hasFilter = _selectedCategory != null;
    final activeColor = hasFilter ? _selectedCategory!.color : scheme.primary;
    final activeLabel = hasFilter ? _selectedCategory!.label : l10n.allCategories;
    final activeIcon = hasFilter ? _selectedCategory!.icon : Icons.filter_list_rounded;

    // Use an int sentinel instead of `null` so "All categories" can be selected
    // (Flutter treats `null` as "menu dismissed").
    // Defer a que el layout termine para medir el ancho real del botón.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final ctx = _categoryFilterButtonKey.currentContext;
      final ro = ctx?.findRenderObject();
      if (ro is RenderBox) {
        final w = ro.size.width;
        if (w > 0 && (w - _categoryFilterReservedWidth).abs() > 0.5) {
          if (mounted) {
            setState(() => _categoryFilterReservedWidth = w);
          }
        }
      }
    });

    return PopupMenuButton<int>(
      onSelected: (id) {
        final cat = id == 0 ? null : categories[id - 1];
        setState(() {
          _selectedCategory = cat;
        });
        UserContentService().batchInteractions([{
          'place_kind': null,
          'place_id': null,
          'event_type': 'filter_click',
          'meta': {'filter': 'category', 'value': cat?.name ?? 'all'},
        }]);
      },
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      color: scheme.surface,
      elevation: 8,
      offset: const Offset(0, 44),
      itemBuilder: (_) => [
        _buildCategoryMenuItem(
          value: 0,
          icon: Icons.apps_rounded,
          label: l10n.allCategories,
          color: scheme.primary,
          count: scope.length,
          isSelected: _selectedCategory == null,
          scheme: scheme,
        ),
        ...categories.asMap().entries.map((e) {
          final idx = e.key;
          final cat = e.value;
          return _buildCategoryMenuItem(
            value: idx + 1,
            icon: cat.icon,
            label: cat.label,
            color: cat.color,
            count: countFor(cat),
            isSelected: _selectedCategory == cat,
            scheme: scheme,
          );
        }),
      ],
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 9),
        // Transparent button style; the clipping in `_buildCityFilter`
        // prevents city chips from being visible under it.
        decoration: BoxDecoration(
          color: Colors.transparent,
          borderRadius: BorderRadius.circular(12),
        ),
        key: _categoryFilterButtonKey,
        child: Row(
          mainAxisSize: MainAxisSize.max,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(activeIcon,
                size: 16, color: hasFilter ? activeColor : scheme.onSurface),
            const SizedBox(width: 6),
            Text(
              activeLabel,
              style: TextStyle(
                fontFamily: 'Outfit',
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: hasFilter ? activeColor : scheme.onSurface,
              ),
            ),
            const SizedBox(width: 2),
            Icon(Icons.keyboard_arrow_down_rounded,
                size: 18,
                color: hasFilter ? activeColor : scheme.onSurfaceVariant),
          ],
        ),
      ),
    );
  }

  PopupMenuEntry<int> _buildCategoryMenuItem({
    required int value,
    required IconData icon,
    required String label,
    required Color color,
    required int count,
    required bool isSelected,
    required ColorScheme scheme,
  }) {
    return PopupMenuItem<int>(
      value: value,
      child: Row(
        children: [
          Icon(icon, size: 18, color: isSelected ? color : scheme.onSurfaceVariant),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              label,
              style: TextStyle(
                fontFamily: 'Outfit',
                fontSize: 13,
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                color: isSelected ? color : scheme.onSurface,
              ),
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
            decoration: BoxDecoration(
              color: isSelected
                  ? color.withValues(alpha: 0.15)
                  : scheme.outlineVariant.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(999),
            ),
            child: Text(
              '$count',
              style: TextStyle(
                fontFamily: 'Outfit',
                fontSize: 11,
                fontWeight: FontWeight.w800,
                color: isSelected ? color : scheme.onSurfaceVariant,
              ),
            ),
          ),
          if (isSelected) ...[
            const SizedBox(width: 8),
            Icon(Icons.check_rounded, size: 18, color: color),
          ],
        ],
      ),
    );
  }

  // ── Place grid (showcase: hero + 2-col) ──

  List<Widget> _buildPlaceShowcaseSlivers() {
    final l10n = AppLocalizations.of(context)!;

    if (!_exploreLoaded) {
      return [
        // Hero skeleton
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
          sliver: SliverToBoxAdapter(
            child: SkeletonContainer(height: 220, borderRadius: 18),
          ),
        ),
        // Grid skeleton
        SliverPadding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          sliver: SliverGrid(
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 14,
              crossAxisSpacing: 14,
              childAspectRatio: 0.82,
            ),
            delegate: SliverChildBuilderDelegate(
              (context, index) => const SkeletonContainer(height: 200, borderRadius: 18),
              childCount: 4,
            ),
          ),
        ),
      ];
    }

    final places = _filteredPlaces;

    if (places.isEmpty) {
      final emptyMsg = _searchQuery.isNotEmpty
          ? l10n.searchNoResults(_searchQuery)
          : l10n.noCategoryPlaces;
      return [
        SliverPadding(
          padding: const EdgeInsets.all(40),
          sliver: SliverToBoxAdapter(
            child: Center(
              child: Text(
                emptyMsg,
                style: TextStyle(
                  fontFamily: 'Outfit',
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ),
        ),
      ];
    }

    final List<Widget> slivers = [];

    // "Para ti" — ML recommendations carousel (shown only when available)
    if (_recommendationsLoaded && _recommendedPlaces.isNotEmpty) {
      final name = _greetingName?.split(' ').first;
      final label = name != null && name.isNotEmpty
          ? l10n.recommendationsForYou(name)
          : l10n.forYouLabel;
      slivers.add(
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(20, 16, 0, 4),
          sliver: SliverToBoxAdapter(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.auto_awesome_rounded,
                        size: 16, color: Theme.of(context).colorScheme.primary),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        label,
                        style: SmarturStyle.calSansTitle.copyWith(fontSize: 15),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                SizedBox(
                  height: 160,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.only(right: 20),
                    itemCount: _recommendedPlaces.length,
                    separatorBuilder: (_, __) => const SizedBox(width: 12),
                    itemBuilder: (ctx, i) => SizedBox(
                      width: 140,
                      child: _PlaceCard(
                        place: _recommendedPlaces[i],
                        isHero: false,
                        onTap: () => _openPlaceDetail(_recommendedPlaces, i),
                        onLongPress: () => _openPlaceDetailModal(_recommendedPlaces, i),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 8),
              ],
            ),
          ),
        ),
      );
    }

    // Wellness banner — entrada al assessment de bienestar
    slivers.add(
      SliverPadding(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 4),
        sliver: SliverToBoxAdapter(
          child: _WellnessBanner(
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => const WellnessAssessmentScreen(),
              ),
            ),
          ),
        ),
      ),
    );

    // Hero card (first place)
    slivers.add(
      SliverPadding(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
        sliver: SliverToBoxAdapter(
          child: SizedBox(
            height: 220,
            child: _PlaceCard(
              place: places.first,
              isHero: true,
              onTap: () => _openPlaceDetail(places, 0),
              onLongPress: () => _openPlaceDetailModal(places, 0),
            ),
          ),
        ),
      ),
    );

    // Remaining cards in bento grid
    if (places.length > 1) {
      // Pattern: (leftFlex, rightFlex, rowHeight)
      const bentoPat = [
        (3, 2, 210.0),
        (1, 1, 160.0),
        (2, 3, 215.0),
        (1, 2, 185.0),
      ];
      final rowCount = ((places.length - 1) / 2).ceil();
      slivers.add(
        SliverPadding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          sliver: SliverList(
            delegate: SliverChildBuilderDelegate(
              (context, rowIndex) {
                final leftIdx = rowIndex * 2 + 1;
                final rightIdx = leftIdx + 1;
                final pat = bentoPat[rowIndex % bentoPat.length];
                final rowHeight = pat.$3;

                Widget rowContent;
                if (rightIdx >= places.length) {
                  rowContent = SizedBox(
                    height: rowHeight,
                    child: _PlaceCard(
                      place: places[leftIdx],
                      isHero: false,
                      onTap: () => _openPlaceDetail(places, leftIdx),
                      onLongPress: () => _openPlaceDetailModal(places, leftIdx),
                    ),
                  );
                } else {
                  rowContent = SizedBox(
                    height: rowHeight,
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Flexible(
                          flex: pat.$1,
                          child: _PlaceCard(
                            place: places[leftIdx],
                            isHero: false,
                            onTap: () => _openPlaceDetail(places, leftIdx),
                      onLongPress: () => _openPlaceDetailModal(places, leftIdx),
                          ),
                        ),
                        const SizedBox(width: 14),
                        Flexible(
                          flex: pat.$2,
                          child: _PlaceCard(
                            place: places[rightIdx],
                            isHero: false,
                            onTap: () => _openPlaceDetail(places, rightIdx),
                            onLongPress: () => _openPlaceDetailModal(places, rightIdx),
                          ),
                        ),
                      ],
                    ),
                  );
                }

                return Padding(
                  padding: const EdgeInsets.only(bottom: 14),
                  child: rowContent,
                );
              },
              childCount: rowCount,
            ),
          ),
        ),
      );
    }

    return slivers;
  }

  void _openPlaceDetail(List<Place> allPlaces, int initialIndex) {
    final place = allPlaces[initialIndex];
    if (place.imageUrl.isNotEmpty) {
      precacheImage(NetworkImage(place.imageUrl), context);
    }
    Navigator.push(
      context,
      smarturDetailRoute(
        _HomePlaceSwipeView(places: allPlaces, initialIndex: initialIndex),
      ),
    );
  }

  /// Mantener sostenida una tarjeta abre la misma vista extendida pero como
  /// modal (respuesta háptica ya disparada por _PlaceCard.onLongPress) —
  /// un atajo rápido para asomarse sin dejar del todo la pantalla de Home.
  void _openPlaceDetailModal(List<Place> allPlaces, int initialIndex) {
    final place = allPlaces[initialIndex];
    if (place.imageUrl.isNotEmpty) {
      precacheImage(NetworkImage(place.imageUrl), context);
    }
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => FractionallySizedBox(
        heightFactor: 0.94,
        child: ClipRRect(
          borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
          child: _HomePlaceSwipeView(places: allPlaces, initialIndex: initialIndex),
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════
// Private widgets
// ═══════════════════════════════════════════════════════════════════


class _PlaceCard extends StatefulWidget {
  final Place place;
  final bool isHero;
  final VoidCallback onTap;
  final VoidCallback? onLongPress;

  const _PlaceCard({
    required this.place,
    required this.isHero,
    required this.onTap,
    this.onLongPress,
  });

  @override
  State<_PlaceCard> createState() => _PlaceCardState();
}

class _PlaceCardState extends State<_PlaceCard>
    with SingleTickerProviderStateMixin {
  // ── Optimistic like state ────────────────────────────────────────────────
  // Initialised from the module-level cache so state survives parent rebuilds.
  late bool _liked;
  bool _isLiking = false; // true while API call is in-flight

  // ── Heart burst animation (double-tap) ───────────────────────────────────
  late final AnimationController _heartCtrl;
  late final Animation<double> _heartScale;
  late final Animation<double> _heartOpacity;

  @override
  void initState() {
    super.initState();
    // Restore liked state from session cache (survives parent setState / scroll recycling)
    _liked = _homeLikeCache[widget.place.id] ?? false;
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
  }

  @override
  void dispose() {
    _heartCtrl.dispose();
    super.dispose();
  }

  Future<void> _toggleLike() async {
    if (_isLiking) return;
    HapticFeedback.lightImpact();

    final wasLiked = _liked;
    // Optimistic update — show result immediately
    setState(() { _liked = !_liked; });

    final rawId = widget.place.id; // e.g. 'poi_3' or 'svc_7'
    final parts = rawId.split('_');
    if (parts.length < 2) return; // Can't parse — skip API call
    // parts[0] is already the correct kind ('poi' or 'svc') — do NOT remap to 'service'
    final kind = parts[0];
    final placeId = int.tryParse(parts[1]);
    if (placeId == null) return;

    // Persist to session cache immediately (survives parent rebuilds)
    _homeLikeCache[rawId] = !wasLiked;

    setState(() => _isLiking = true);
    try {
      if (!wasLiked) {
        await UserContentService().addFavorite(kind, placeId);
      } else {
        await UserContentService().removeFavorite(kind, placeId);
      }
    } catch (_) {
      // Rollback on failure — revert both local state and cache
      _homeLikeCache[rawId] = wasLiked;
      if (mounted) setState(() => _liked = wasLiked);
    } finally {
      if (mounted) setState(() => _isLiking = false);
    }
  }

  void _onDoubleTap() {
    if (!_liked) {
      // Only trigger if not already liked
      _toggleLike();
    }
    _heartCtrl.forward(from: 0.0);
    HapticFeedback.mediumImpact();
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final semantic = Theme.of(context).extension<SmarturSemanticColors>()!;
    final place = widget.place;
    final isHero = widget.isHero;
    // Resolución de decodificado según el tamaño real en pantalla × densidad,
    // para que la vista previa no se pixele en pantallas de alta densidad.
    final dpr = MediaQuery.of(context).devicePixelRatio;
    final screenW = MediaQuery.sizeOf(context).width;
    final cacheW =
        ((isHero ? screenW : screenW * 0.6) * dpr).round().clamp(400, 1600);

    return RepaintBoundary(
      child: GestureDetector(
      onTap: widget.onTap,
      onDoubleTap: _onDoubleTap,
      onLongPress: widget.onLongPress == null
          ? null
          : () {
              HapticFeedback.mediumImpact();
              widget.onLongPress!();
            },
      child: Hero(
        tag: 'place_${place.id}',
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            boxShadow: [
              BoxShadow(
                color: semantic.imageScrimStrong.withValues(alpha: 0.20),
                blurRadius: isHero ? 14 : 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Material(
            color: Colors.transparent,
            borderRadius: BorderRadius.circular(18),
            clipBehavior: Clip.antiAlias,
            child: Stack(
              fit: StackFit.expand,
              children: [
                // ── Image ──
                place.imageUrl.isEmpty
                    ? Container(
                        color: scheme.outlineVariant,
                        child: Icon(Icons.image_not_supported_outlined,
                            color: semantic.onImageMuted, size: 36),
                      )
                    : CachedNetworkImage(
                        imageUrl: place.imageUrl,
                        fit: BoxFit.cover,
                        filterQuality: FilterQuality.high,
                        memCacheWidth: cacheW,
                        fadeInDuration: const Duration(milliseconds: 200),
                        placeholder: (_, __) => Container(
                          color: scheme.outlineVariant.withValues(alpha: 0.3),
                        ),
                        errorWidget: (_, __, ___) => Container(
                          color: scheme.outlineVariant,
                          child: Icon(Icons.image_not_supported_outlined,
                              color: semantic.onImageMuted, size: 36),
                        ),
                      ),

                // ── Gradient overlay — tinted with category color ──
                DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      stops: isHero
                          ? const [0.0, 0.3, 0.7, 1.0]
                          : const [0.0, 0.30, 1.0],
                      colors: isHero
                          ? [
                              Colors.transparent,
                              semantic.imageScrimSoft.withValues(alpha: 0.12),
                              semantic.imageScrimStrong.withValues(alpha: 0.55),
                              semantic.imageScrimStrong.withValues(alpha: 0.92),
                            ]
                          : [
                              place.category.color.withValues(alpha: 0.04),
                              semantic.imageScrimSoft.withValues(alpha: 0.22),
                              Color.lerp(semantic.imageScrimStrong,
                                      place.category.color, 0.12)!
                                  .withValues(alpha: 0.90),
                            ],
                    ),
                  ),
                ),

                // ── Category accent bar (top) ──
                if (!isHero)
                  Positioned(
                    top: 0,
                    left: 0,
                    right: 0,
                    child: Container(
                      height: 3,
                      decoration: BoxDecoration(
                        color: place.category.color,
                        borderRadius: const BorderRadius.vertical(
                          top: Radius.circular(18),
                        ),
                      ),
                    ),
                  ),

                // ── Category pill ──
                Positioned(
                  top: isHero ? 12 : 10,
                  left: isHero ? 12 : 10,
                  child: Container(
                    padding: EdgeInsets.symmetric(
                      horizontal: isHero ? 10 : 8,
                      vertical: isHero ? 5 : 4,
                    ),
                    decoration: BoxDecoration(
                      color: place.category.color.withValues(alpha: 0.88),
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(place.category.icon,
                            size: isHero ? 13 : 11, color: Colors.white),
                        const SizedBox(width: 4),
                        Text(
                          place.category.label,
                          maxLines: 1, overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontFamily: 'Outfit',
                            fontSize: isHero ? 10 : 9,
                            fontWeight: FontWeight.w700,
                            color: Colors.white, letterSpacing: 0.3,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                // ── Add to route button (top-right, below like) ──
                Positioned(
                  top: isHero ? 46 : 40,
                  right: isHero ? 10 : 8,
                  child: GestureDetector(
                    onTap: () => showAddToRouteSheet(
                      context,
                      placeName: place.name,
                      placeId: place.id,
                    ),
                    child: Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: scheme.primary.withValues(alpha: 0.80),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        Icons.add_rounded,
                        size: isHero ? 18 : 15,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),

                // ── Like button (top-right) ──
                Positioned(
                  top: isHero ? 10 : 8,
                  right: isHero ? 10 : 8,
                  child: GestureDetector(
                    onTap: _toggleLike,
                    child: Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: _liked
                            ? semantic.altAccent.withValues(alpha: 0.92)
                            : Colors.black.withValues(alpha: 0.40),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        _liked ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                        size: isHero ? 18 : 15,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),

                // ── Double-tap heart burst animation ──
                AnimatedBuilder(
                  animation: _heartCtrl,
                  builder: (_, __) {
                    if (_heartCtrl.value == 0.0) return const SizedBox.shrink();
                    return Center(
                      child: Opacity(
                        opacity: _heartOpacity.value,
                        child: Transform.scale(
                          scale: _heartScale.value,
                          child: Icon(
                            Icons.favorite_rounded,
                            color: semantic.onImageText,
                            size: 80,
                            shadows: [
                              Shadow(
                                color: semantic.imageScrimStrong.withValues(alpha: 0.70),
                                blurRadius: 12,
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                ),

                // ── Bottom content ──
                Positioned(
                  left: isHero ? 14 : 12,
                  right: isHero ? 14 : 12,
                  bottom: isHero ? 14 : 12,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        place.name,
                        maxLines: 2, overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontFamily: 'CalSans',
                          fontSize: isHero ? 20.0 : 15.0,
                          color: semantic.onImageText,
                          fontWeight: FontWeight.bold,
                          height: 1.15,
                        ),
                      ),
                      SizedBox(height: isHero ? 6 : 4),
                      if (isHero)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Text(
                            place.shortDescription,
                            maxLines: 2, overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              fontFamily: 'Outfit', fontSize: 12,
                              color: semantic.onImageText.withValues(alpha: 0.8),
                              height: 1.3,
                            ),
                          ),
                        ),
                      Row(
                        children: [
                          Icon(Icons.star_rounded, size: isHero ? 15 : 13, color: semantic.ember),
                          const SizedBox(width: 3),
                          Text(
                            place.rating.toStringAsFixed(1),
                            style: TextStyle(
                              fontFamily: 'Outfit', fontWeight: FontWeight.w800,
                              fontSize: isHero ? 12 : 11, color: semantic.onImageText,
                            ),
                          ),
                          if (place.rating >= 4.7) ...[
                            const SizedBox(width: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                              decoration: BoxDecoration(
                                color: semantic.ember,
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: const Text(
                                'TOP',
                                style: TextStyle(
                                  fontFamily: 'Outfit',
                                  fontSize: 8,
                                  fontWeight: FontWeight.w800,
                                  color: Colors.white,
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ),
                          ],
                          const SizedBox(width: 6),
                          Icon(Icons.location_on_outlined,
                              size: isHero ? 13 : 11, color: semantic.onImageText.withValues(alpha: 0.7)),
                          const SizedBox(width: 2),
                          Expanded(
                            child: Text(
                              place.city,
                              maxLines: 1, overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                fontFamily: 'Outfit',
                                fontSize: isHero ? 11 : 10,
                                color: semantic.onImageText.withValues(alpha: 0.7),
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
          ),
        ),
      ),
      ),
    );
  }
}

// ── Swipe view — fixed chrome + animated page transition ──────────────────

class _HomePlaceSwipeView extends StatefulWidget {
  final List<Place> places;
  final int initialIndex;

  const _HomePlaceSwipeView({required this.places, required this.initialIndex});

  @override
  State<_HomePlaceSwipeView> createState() => _HomePlaceSwipeViewState();
}

class _HomePlaceSwipeViewState extends State<_HomePlaceSwipeView> {
  late final PageController _ctrl;
  int _idx = 0;

  // Favorite state per place — populated lazily as pages are viewed
  final Map<String, bool> _favs = {};
  final Map<String, bool> _favBusy = {};

  @override
  void initState() {
    super.initState();
    _idx = widget.initialIndex;
    _ctrl = PageController(initialPage: _idx);
    _ctrl.addListener(_onScroll);
    _loadFav(widget.places[_idx]);
  }

  @override
  void dispose() {
    _ctrl.removeListener(_onScroll);
    _ctrl.dispose();
    super.dispose();
  }

  void _onScroll() {
    final p = (_ctrl.page ?? _idx).round().clamp(0, widget.places.length - 1);
    if (p != _idx) {
      setState(() => _idx = p);
      _loadFav(widget.places[p]);
    }
  }

  Future<void> _loadFav(Place place) async {
    if (_favs.containsKey(place.id)) return;
    final ref = _parsePlaceRef(place.id);
    if (ref == null) return;
    try {
      final v = await UserContentService().isFavorite(ref.$1, ref.$2);
      if (mounted) setState(() => _favs[place.id] = v);
    } catch (_) {}
  }

  Future<void> _toggleFav() async {
    final place = widget.places[_idx];
    if (_favBusy[place.id] == true) return;
    final ref = _parsePlaceRef(place.id);
    if (ref == null) return;
    final was = _favs[place.id] ?? false;
    HapticFeedback.lightImpact();
    setState(() { _favs[place.id] = !was; _favBusy[place.id] = true; });
    try {
      if (was) await UserContentService().removeFavorite(ref.$1, ref.$2);
      else     await UserContentService().addFavorite(ref.$1, ref.$2);
    } catch (_) {
      if (mounted) setState(() => _favs[place.id] = was);
    } finally {
      if (mounted) setState(() => _favBusy[place.id] = false);
    }
  }

  void _share() {
    final p = widget.places[_idx];
    final String url;
    if (p.lat != null && p.lon != null) {
      url = 'https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lon}';
    } else {
      url = 'https://www.google.com/maps/search/?api=1&query=${Uri.encodeComponent('${p.name}, Veracruz, México')}';
    }
    SharePlus.instance.share(ShareParams(
      text: '${p.name}\n${p.city}\n$url',
      subject: p.name,
    ));
  }

  // Parse 'svc_12' or 'poi_5' → ('svc', 12) / ('poi', 5)
  (String, int)? _parsePlaceRef(String id) {
    if (id.startsWith('svc_')) {
      final n = int.tryParse(id.substring(4));
      if (n != null) return ('svc', n);
    }
    if (id.startsWith('poi_')) {
      final n = int.tryParse(id.substring(4));
      if (n != null) return ('poi', n);
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final isFav = _favs[widget.places[_idx].id] ?? false;

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // ── Animated page view ────────────────────────────────────
          PageView.builder(
            controller: _ctrl,
            physics: const BouncingScrollPhysics(
              parent: AlwaysScrollableScrollPhysics(),
            ),
            itemCount: widget.places.length,
            itemBuilder: (ctx, i) {
              final place = widget.places[i];
              return AnimatedBuilder(
                animation: _ctrl,
                builder: (ctx, child) {
                  double offset = 0;
                  if (_ctrl.hasClients && _ctrl.position.haveDimensions) {
                    final page = _ctrl.page ?? i.toDouble();
                    offset = (page - i).abs().clamp(0.0, 1.0);
                  }
                  return Transform.scale(
                    scale: 1.0 - offset * 0.05,
                    child: child,
                  );
                },
                child: DetailViewPage(
                  key: ValueKey('swipe_${place.id}_$i'),
                  showTopButtons: false,
                  title: place.name,
                  heroTag: 'home_swipe_${place.id}_$i',
                  heroImageUrl: place.imageUrl,
                  subtitle: place.description,
                  locationLine: '${place.locationLine} · ${place.city}',
                  rating: place.rating,
                  galleryUrls: place.galleryUrls,
                  placeId: place.id,
                  lat: place.lat,
                  lon: place.lon,
                ),
              );
            },
          ),

          // ── Fixed chrome overlay ──────────────────────────────────
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(8, 8, 8, 0),
              child: Row(
                children: [
                  _SwipeOverlayButton(
                    icon: Icons.arrow_back_rounded,
                    onTap: () => Navigator.pop(context),
                  ),
                  const Spacer(),
                  _SwipeOverlayButton(
                    icon: Icons.share_rounded,
                    onTap: _share,
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  _SwipeOverlayButton(
                    icon: isFav
                        ? Icons.favorite_rounded
                        : Icons.favorite_border_rounded,
                    iconColor: isFav ? SmarturSemanticColors.of(context).altAccent : Colors.white,
                    onTap: _toggleFav,
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

// Simple circular button for the fixed overlay
class _SwipeOverlayButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  final Color iconColor;
  final double size;

  const _SwipeOverlayButton({
    required this.icon,
    required this.onTap,
    this.iconColor = Colors.white,
    this.size = 22,
  });

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
        child: Icon(icon, color: iconColor, size: size),
      ),
    );
  }
}

// ── Wellness Banner — entrada al assessment de bienestar ──────────────────────

class _WellnessBanner extends StatelessWidget {
  final VoidCallback onTap;

  const _WellnessBanner({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF254117), Color(0xFF1a3010)],
          ),
          borderRadius: BorderRadius.circular(18),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF254117).withValues(alpha: 0.30),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.2),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.spa_outlined, size: 22, color: Colors.white),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Welltur · Descubre tu modo de viaje',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '8 preguntas rápidas · recomendaciones de bienestar',
                    style: TextStyle(
                      fontSize: 11,
                      color: Colors.white.withValues(alpha: 0.8),
                    ),
                  ),
                ],
              ),
            ),
            // Icono de info: abre el modal explicativo sin disparar el onTap
            GestureDetector(
              onTap: () => showWellnessInfoSheet(context),
              behavior: HitTestBehavior.opaque,
              child: Padding(
                padding: const EdgeInsets.all(4),
                child: Icon(
                  Icons.info_outline_rounded,
                  size: 20,
                  color: Colors.white.withValues(alpha: 0.85),
                ),
              ),
            ),
            const SizedBox(width: 4),
            Icon(
              Icons.arrow_forward_ios,
              size: 16,
              color: Colors.white.withValues(alpha: 0.7),
            ),
          ],
        ),
      ),
    );
  }
}
