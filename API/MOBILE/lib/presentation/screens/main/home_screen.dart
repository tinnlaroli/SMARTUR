import 'dart:convert';
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:local_auth/local_auth.dart';
import 'package:local_auth_android/local_auth_android.dart';
import 'package:http/http.dart' as http;
import 'package:smartur/l10n/app_localizations.dart';

import '../../../core/theme/style_guide.dart';
import '../../../core/constants/env_config.dart';
import '../../../core/utils/notifications.dart';
import '../../../data/services/auth_service.dart';
import '../../../data/services/explore_service.dart';
import '../../../data/services/profile_service.dart';
import '../../../data/models/place_model.dart';
import '../../widgets/smartur_skeleton.dart';
import '../../widgets/smartur_background.dart';
import '../../widgets/smartur_user_avatar.dart';
import '../preferences/preferences_screen.dart';
import '../settings/settings_screen.dart';
import '../auth/welcome_screen.dart';
import '../explore/detail_view_page.dart';

class HomeScreen extends StatefulWidget {
  final String? userName;
  final bool isNewLogin;

  const HomeScreen({super.key, this.userName, this.isNewLogin = false});

  @override
  State<HomeScreen> createState() => HomeScreenState();
}

class HomeScreenState extends State<HomeScreen> {
  static const double _kHomeHeaderExpandedHeight = 140;

  final AuthService _authService = AuthService();
  final ExploreService _exploreService = ExploreService();
  final LocalAuthentication _auth = LocalAuthentication();
  final ScrollController _homeScrollController = ScrollController();

  /// 0 = header expandido (transparente), 1 = colapsado (fondo surface del tema).
  double _homeHeaderCollapseT = 0;

  bool _isLoadingContent = true;
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
  double _categoryFilterReservedWidth = 150; // Fallback mientras se mide.

  String? _weatherSummary;
  bool _weatherLoading = true;

  String? _headerPhotoUrl;
  String? _headerAvatarIconKey;

  /// Nombre para el saludo: widget o almacenamiento (al volver al tab Home se recrea el State).
  String? _greetingName;

  List<Place> get _filteredPlaces {
    final scope = _placesInScope;
    if (_selectedCategory == null) return scope;
    return scope.where((p) => p.category == _selectedCategory).toList();
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
      await _applyGreetingName();
      await _showWelcome();
      await _checkPreferences();
      await _offerBiometricSetup();
      await _loadCitiesFromApi();
      if (mounted) setState(() => _isLoadingContent = false);
      await _loadWeatherForSelectedCity();
      await _loadHeaderAvatar();
    });
  }

  @override
  void dispose() {
    _homeScrollController.removeListener(_onHomeScroll);
    _homeScrollController.dispose();
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

    final saved = await ProfileService.hasPreferencesSaved();
    if (!saved && mounted) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => PreferencesScreen(userName: widget.userName),
        ),
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
    const greeting = 'Bienvenido';
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
        icon: const Icon(Icons.fingerprint, size: 48, color: SmarturStyle.purple),
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
                style: ElevatedButton.styleFrom(backgroundColor: SmarturStyle.purple),
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
      final apiCities = await _exploreService.fetchCities();
      if (!mounted) return;
      setState(() {
        _exploreLoaded = true;
        _exploreError = null;
        _cities = apiCities;
        _selectedCity = null;
        _selectedCategory = null;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _exploreLoaded = true;
        _cities = [];
        _selectedCity = null;
        _exploreError = e.toString();
      });
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
                leading: const Icon(Icons.tune_outlined, color: SmarturStyle.blue),
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
                      MaterialPageRoute(
                          builder: (_) =>
                              PreferencesScreen(userName: widget.userName)),
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
                          style: const TextStyle(
                              fontFamily: 'CalSans', color: SmarturStyle.purple)),
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
                                            style: const TextStyle(
                                                fontSize: 12,
                                                fontFamily: 'Outfit',
                                                color: SmarturStyle.purple)),
                                        backgroundColor: SmarturStyle.purple
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
                              MaterialPageRoute(
                                  builder: (_) => PreferencesScreen(
                                      userName: widget.userName)),
                            );
                          },
                          style: ElevatedButton.styleFrom(
                              backgroundColor: SmarturStyle.purple),
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
                  return StatefulBuilder(
                      builder: (BuildContext context, StateSetter setState) {
                    return SwitchListTile(
                      activeThumbColor: SmarturStyle.purple,
                      secondary:
                          const Icon(Icons.fingerprint, color: SmarturStyle.purple),
                      title: Text(l10n.fingerprintAccess,
                          style: const TextStyle(fontFamily: 'Outfit')),
                      value: enabled,
                      onChanged: (bool newValue) async {
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
                    MaterialPageRoute(builder: (_) => const SettingsScreen()),
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
                        MaterialPageRoute(builder: (_) => WelcomeScreen()),
                        (_) => false,
                      );
                    }
                  },
                  icon: const Icon(Icons.logout, color: SmarturStyle.pink),
                  label: Text(
                    l10n.logout,
                    style: const TextStyle(
                        fontFamily: 'Outfit',
                        color: SmarturStyle.pink,
                        fontWeight: FontWeight.w600),
                  ),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: SmarturStyle.pink),
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
      body: SmarturBackgroundTop(
        child: SmarturShimmer(
          enabled: _isLoadingContent,
          child: CustomScrollView(
            controller: _homeScrollController,
            physics: const BouncingScrollPhysics(
              parent: AlwaysScrollableScrollPhysics(),
            ),
            slivers: [
              _buildHeaderAppBar(),
              SliverToBoxAdapter(child: _buildExploreIntro()),
              SliverToBoxAdapter(child: _buildCityFilter()),
              ..._buildPlaceShowcaseSlivers(),
              const SliverToBoxAdapter(child: SizedBox(height: 32)),
            ],
          ),
        ),
      ),
    );
  }

  // ── Header ──

  SliverAppBar _buildHeaderAppBar() {
    final l10n = AppLocalizations.of(context)!;
    final scheme = Theme.of(context).colorScheme;
    final name = _greetingName ?? widget.userName;
    final greetingName = (name != null && name.isNotEmpty) ? ', $name' : '';

    // El Material del SliverAppBar pinta detrás del título colapsado; el fondo del
    // FlexibleSpaceBar no cubre esa franja — por eso el color debe ir aquí.
    final headerBgOpacity =
        Curves.easeOut.transform(_homeHeaderCollapseT).clamp(0.0, 1.0);
    final headerBackground = headerBgOpacity <= 0.001
        ? Colors.transparent
        : (headerBgOpacity >= 0.999
            ? scheme.surface
            : scheme.surface.withValues(alpha: headerBgOpacity));

    return SliverAppBar(
      pinned: true,
      expandedHeight: _kHomeHeaderExpandedHeight,
      backgroundColor: headerBackground,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      scrolledUnderElevation: 0,
      shadowColor: Colors.transparent,
      flexibleSpace: FlexibleSpaceBar(
        titlePadding:
            const EdgeInsetsDirectional.only(start: 20, end: 12, bottom: 14),
        centerTitle: false,
        title: _isLoadingContent
            ? const SkeletonText(width: 180, height: 20)
            : Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          l10n.exploreGreeting(greetingName),
                          style: SmarturStyle.calSansTitle.copyWith(fontSize: 20),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          l10n.highMountainsVeracruz,
                          style: TextStyle(
                            fontFamily: 'Outfit',
                            fontSize: 11,
                            color: scheme.onSurfaceVariant,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    padding: EdgeInsets.zero,
                    onPressed: _showProfile,
                    icon: SmarturUserAvatar(
                      radius: 18,
                      photoUrl: _headerPhotoUrl,
                      avatarIconKey: _headerAvatarIconKey,
                      displayName: name ?? '',
                      backgroundColor: SmarturStyle.purple.withValues(alpha: 0.12),
                      foregroundColor: scheme.onSurface,
                    ),
                  ),
                ],
              ),
        background: LayoutBuilder(
          builder: (context, constraints) {
            return Stack(
              fit: StackFit.expand,
              children: [
                Align(
                  alignment: Alignment.topLeft,
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 60, 20, 0),
                    child: _isLoadingContent
                        ? const SkeletonContainer(height: 40, borderRadius: 16)
                        : Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.wb_sunny_outlined,
                                  color: SmarturStyle.purple),
                              const SizedBox(width: 8),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    l10n.weatherNow,
                                    style: TextStyle(
                                      fontFamily: 'Outfit',
                                      fontSize: 11,
                                      color: scheme.onSurfaceVariant,
                                    ),
                                  ),
                                  Text(
                                    _weatherLoading
                                        ? l10n.loading
                                        : (_weatherSummary ?? l10n.notAvailable),
                                    style: TextStyle(
                                      fontFamily: 'Outfit',
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                      color: scheme.onSurface,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  // ── Explore intro ──

  Widget _buildExploreIntro() {
    return const SizedBox.shrink();
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
                        final accentColor = SmarturStyle.green;
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
    final activeColor = hasFilter ? _selectedCategory!.color : SmarturStyle.purple;
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
        setState(() {
          _selectedCategory =
              id == 0 ? null : categories[id - 1]; // 0 means "all"
        });
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
          color: SmarturStyle.purple,
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
      return [
        SliverPadding(
          padding: const EdgeInsets.all(40),
          sliver: SliverToBoxAdapter(
            child: Center(
              child: Text(
                l10n.noCategoryPlaces,
                style: TextStyle(
                  fontFamily: 'Outfit',
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
            ),
          ),
        ),
      ];
    }

    final List<Widget> slivers = [];

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
            ),
          ),
        ),
      ),
    );

    // Remaining cards in 2-column grid
    if (places.length > 1) {
      slivers.add(
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
              (context, index) {
                final place = places[index + 1];
                return _PlaceCard(
                  place: place,
                  isHero: false,
                  onTap: () => _openPlaceDetail(places, index + 1),
                );
              },
              childCount: places.length - 1,
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
      PageRouteBuilder(
        transitionDuration: const Duration(milliseconds: 400),
        reverseTransitionDuration: const Duration(milliseconds: 350),
        pageBuilder: (context, animation, secondaryAnimation) =>
            _HomePlaceSwipeView(places: allPlaces, initialIndex: initialIndex),
        transitionsBuilder: (context, anim, secondaryAnim, child) {
          return FadeTransition(opacity: anim, child: child);
        },
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════
// Private widgets
// ═══════════════════════════════════════════════════════════════════

int _cacheWidthForCard(BuildContext context, bool isHero) {
  final screenW = MediaQuery.sizeOf(context).width - 40;
  final dpr = MediaQuery.devicePixelRatioOf(context);
  final logical = isHero ? screenW : (screenW - 14) / 2;
  return (logical * dpr).round().clamp(360, 1280);
}

class _PlaceCard extends StatelessWidget {
  final Place place;
  final bool isHero;
  final VoidCallback onTap;

  const _PlaceCard({
    required this.place,
    required this.isHero,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    return GestureDetector(
      onTap: onTap,
      child: Hero(
        tag: 'place_${place.id}',
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.12),
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
                        child: const Icon(Icons.image_not_supported_outlined,
                            color: Colors.white54, size: 36),
                      )
                    : Image.network(
                        place.imageUrl,
                        fit: BoxFit.cover,
                        filterQuality: FilterQuality.medium,
                        cacheWidth: _cacheWidthForCard(context, isHero),
                        frameBuilder: (_, child, frame, loaded) {
                          if (loaded) return child;
                          return AnimatedOpacity(
                            opacity: frame != null ? 1.0 : 0.0,
                            duration: const Duration(milliseconds: 400),
                            curve: Curves.easeOut,
                            child: child,
                          );
                        },
                        errorBuilder: (context, error, stack) => Container(
                          color: scheme.outlineVariant,
                          child: const Icon(Icons.image_not_supported_outlined,
                              color: Colors.white54, size: 36),
                        ),
                      ),

                // ── Gradient overlay ──
                DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      stops: isHero
                          ? const [0.0, 0.3, 0.7, 1.0]
                          : const [0.0, 0.35, 1.0],
                      colors: isHero
                          ? const [
                              Color(0x00000000),
                              Color(0x10000000),
                              Color(0x80000000),
                              Color(0xDD000000),
                            ]
                          : const [
                              Color(0x05000000),
                              Color(0x20000000),
                              Color(0xCC000000),
                            ],
                    ),
                  ),
                ),

                // ── Category pill (glassmorphism) ──
                Positioned(
                  top: isHero ? 12 : 10,
                  left: isHero ? 12 : 10,
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(999),
                    child: BackdropFilter(
                      filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
                      child: Container(
                        padding: EdgeInsets.symmetric(
                          horizontal: isHero ? 10 : 8,
                          vertical: isHero ? 5 : 4,
                        ),
                        decoration: BoxDecoration(
                          color: place.category.color.withValues(alpha: 0.7),
                          borderRadius: BorderRadius.circular(999),
                          border: Border.all(
                            color: Colors.white.withValues(alpha: 0.2),
                            width: 0.5,
                          ),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(place.category.icon,
                                size: isHero ? 13 : 11, color: Colors.white),
                            const SizedBox(width: 4),
                            Text(
                              place.category.label,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                fontFamily: 'Outfit',
                                fontSize: isHero ? 10 : 9,
                                fontWeight: FontWeight.w700,
                                color: Colors.white,
                                letterSpacing: 0.3,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
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
                      // Title
                      Text(
                        place.name,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontFamily: 'CalSans',
                          fontSize: isHero ? 20.0 : 15.0,
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          height: 1.15,
                        ),
                      ),
                      SizedBox(height: isHero ? 6 : 4),
                      // Description (hero only shows 2 lines)
                      if (isHero)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Text(
                            place.shortDescription,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              fontFamily: 'Outfit',
                              fontSize: 12,
                              color: Colors.white.withValues(alpha: 0.8),
                              height: 1.3,
                            ),
                          ),
                        ),
                      // Rating + Location row
                      Row(
                        children: [
                          Icon(
                            Icons.star_rounded,
                            size: isHero ? 15 : 13,
                            color: SmarturStyle.orange,
                          ),
                          const SizedBox(width: 3),
                          Text(
                            place.rating.toStringAsFixed(1),
                            style: TextStyle(
                              fontFamily: 'Outfit',
                              fontWeight: FontWeight.w800,
                              fontSize: isHero ? 12 : 11,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Icon(
                            Icons.location_on_outlined,
                            size: isHero ? 13 : 11,
                            color: Colors.white.withValues(alpha: 0.7),
                          ),
                          const SizedBox(width: 2),
                          Expanded(
                            child: Text(
                              place.city,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                fontFamily: 'Outfit',
                                fontSize: isHero ? 11 : 10,
                                color: Colors.white.withValues(alpha: 0.7),
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
    );
  }
}

class _HomePlaceSwipeView extends StatefulWidget {
  final List<Place> places;
  final int initialIndex;

  const _HomePlaceSwipeView({required this.places, required this.initialIndex});

  @override
  State<_HomePlaceSwipeView> createState() => _HomePlaceSwipeViewState();
}

class _HomePlaceSwipeViewState extends State<_HomePlaceSwipeView> {
  late final PageController _controller;

  @override
  void initState() {
    super.initState();
    _controller = PageController(initialPage: widget.initialIndex);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return PageView.builder(
      controller: _controller,
      itemCount: widget.places.length,
      itemBuilder: (context, index) {
        final place = widget.places[index];
        return DetailViewPage(
          key: ValueKey('home_place_swipe_${place.id}'),
          title: place.name,
          heroTag: 'home_swipe_${place.id}_$index',
          heroImageUrl: place.imageUrl,
          subtitle: place.description,
          locationLine: '${place.locationLine} · ${place.city}',
          rating: place.rating,
          galleryUrls: place.galleryUrls,
          placeId: place.id,
        );
      },
    );
  }
}
