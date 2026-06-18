import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:smartur/l10n/app_localizations.dart';

import '../../../core/theme/smartur_theme_extensions.dart';
import '../../../core/theme/style_guide.dart';
import '../../../data/services/auth_service.dart';
import '../../../data/services/profile_service.dart';
import '../../../data/services/user_content_service.dart';
import '../../../data/services/wellness_service.dart';
import 'wellness_assessment_screen.dart';
import '../../widgets/smartur_background.dart';
import '../../widgets/smartur_skeleton.dart';
import '../../widgets/smartur_user_avatar.dart';
import '../../utils/diary_place_detail.dart';
import 'edit_profile_avatar_screen.dart';
import '../../widgets/smartur_ui_kit.dart';
import '../preferences/preferences_screen.dart';
import '../settings/settings_screen.dart';
import 'main_tab_scope.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen>
    with SingleTickerProviderStateMixin {
  final AuthService _authService = AuthService();
  late final TabController _tabCtrl;

  String _name = '';
  String _email = '';
  String _memberSince = '';
  List<String> _interests = [];
  String? _photoUrl;
  String? _avatarIconKey;
  bool _loading = true;
  bool _hasTravelPrefs = false;

  // Diary data (favorites + history)
  bool _diaryLoading = true;
  List<Map<String, dynamic>> _favorites = [];

  // WellTur wellness history
  final _wellnessSvc = WellnessService();
  List<Map<String, dynamic>> _wellnessHistory = [];
  bool _deletingWellness = false;


  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 2, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        _loadProfile();
        _loadDiary();
        _loadWellnessHistory();
      }
    });
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadWellnessHistory() async {
    try {
      final history = await _wellnessSvc.getHistory();
      if (mounted) setState(() => _wellnessHistory = history);
    } catch (_) {}
  }

  Future<void> _deleteWellnessHistory() async {
    setState(() => _deletingWellness = true);
    try {
      await _wellnessSvc.deleteHistory();
      if (mounted) setState(() => _wellnessHistory = []);
    } catch (_) {} finally {
      if (mounted) setState(() => _deletingWellness = false);
    }
  }

  Future<void> _loadDiary() async {
    setState(() => _diaryLoading = true);
    try {
      final svc = UserContentService();
      final fav = await svc.fetchFavorites();
      if (mounted) {
        setState(() {
          _favorites = fav;
          _diaryLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _diaryLoading = false);
    }
  }

  Future<void> _loadProfile() async {
    final l10n = AppLocalizations.of(context)!;
    try {
      final profile = await _authService.getUserProfile();
      final interests = await ProfileService.getSavedInterests();
      final prefs = await ProfileService.fetchMyProfileForPreferences();
      final hasPrefs = interests.isNotEmpty ||
          prefs['travel_type'] != null ||
          prefs['age'] != null ||
          prefs['activity_level'] != null;

      final name = profile?['name'] ??
          await _authService.getUserName() ??
          l10n.defaultUserName;
      final email = profile?['email'] ??
          await _authService.getUserEmail() ??
          '';
      final createdAt = _parseCreatedAt(profile?['created_at']);

      String memberSince = '';
      if (createdAt != null) {
        memberSince = '${createdAt.month}/${createdAt.year}';
      }

      if (mounted) {
        setState(() {
          _name = name;
          _email = email;
          _memberSince = memberSince;
          _interests = interests;
          _hasTravelPrefs = hasPrefs;
          _photoUrl = profile?['photo_url'] as String?;
          _avatarIconKey = profile?['avatar_icon_key'] as String?;
        });
      }
    } catch (_) {
      final name = await _authService.getUserName() ?? l10n.defaultUserName;
      final email = await _authService.getUserEmail() ?? '';
      final photo = await _authService.getUserPhotoUrl();
      final icon = await _authService.getUserAvatarIconKey();
      if (mounted) {
        setState(() {
          _name = name;
          _email = email;
          _photoUrl = photo;
          _avatarIconKey = icon;
        });
      }
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  /// API puede enviar `created_at` como String ISO o como otro tipo vía JSON.
  static DateTime? _parseCreatedAt(dynamic raw) {
    if (raw == null) return null;
    if (raw is DateTime) return raw;
    if (raw is String) return DateTime.tryParse(raw);
    return DateTime.tryParse(raw.toString());
  }

  List<Widget> _profileSkeletonSlivers() {
    return [
      SliverAppBar(
        pinned: true,
        automaticallyImplyLeading: false,
        backgroundColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        title: const SkeletonText(width: 140, height: 22),
      ),
      SliverToBoxAdapter(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            children: [
              const SizedBox(height: 16),
              const Center(child: SkeletonCircle(size: 96)),
              const SizedBox(height: 16),
              const Center(child: SkeletonText(width: 180, height: 22)),
              const SizedBox(height: 10),
              const Center(child: SkeletonText(width: 220, height: 14)),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
      SliverPadding(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        sliver: SliverList(
          delegate: SliverChildListDelegate([
            const SkeletonText(width: 140, height: 18),
            const SizedBox(height: 12),
            const SkeletonContainer(height: 100, borderRadius: 16),
            const SizedBox(height: 40),
          ]),
        ),
      ),
    ];
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      backgroundColor: scheme.surface,
      body: SmarturBackgroundTop(
        child: NestedScrollView(
          headerSliverBuilder: (context, innerBoxIsScrolled) => [
            SliverAppBar(
              pinned: true,
              automaticallyImplyLeading: false,
              backgroundColor: scheme.surface,
              surfaceTintColor: Colors.transparent,
              elevation: 0,
              expandedHeight: kToolbarHeight + 224,
              forceElevated: innerBoxIsScrolled,
              title: Text(
                l10n.myProfile,
                style: SmarturStyle.calSansTitle.copyWith(fontSize: 20),
              ),
              actions: [
                IconButton(
                  icon: Icon(Icons.settings_outlined, color: scheme.onSurface),
                  onPressed: () async {
                    await Navigator.push(context, smarturFadeRoute(const SettingsScreen()));
                    _loadProfile(); _loadWellnessHistory();
                  },
                ),
              ],
              bottom: PreferredSize(
                preferredSize: const Size.fromHeight(224),
                child: Column(
                  children: [
                    // Avatar + name block
                    if (_loading)
                      SmarturShimmer(
                        enabled: true,
                        child: Column(
                          children: const [
                            SizedBox(height: 8),
                            Center(child: SkeletonCircle(size: 80)),
                            SizedBox(height: 10),
                            Center(child: SkeletonText(width: 160, height: 18)),
                            SizedBox(height: 6),
                            Center(child: SkeletonText(width: 200, height: 12)),
                            SizedBox(height: 16),
                          ],
                        ),
                      )
                    else
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 24),
                        child: Column(
                          children: [
                            const SizedBox(height: 4),
                            _buildAvatarHeader(context, scheme),
                            const SizedBox(height: 10),
                            Text(
                              _name,
                              textAlign: TextAlign.center,
                              style: SmarturStyle.calSansTitle.copyWith(
                                  fontSize: 20, color: scheme.onSurface),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              _email,
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                fontFamily: 'Outfit',
                                fontSize: 13,
                                color: scheme.onSurfaceVariant,
                              ),
                            ),
                            const SizedBox(height: 12),
                          ],
                        ),
                      ),
                    // Tab bar
                    smarturTabBar(
                      context,
                      tabs: [
                        Tab(text: l10n.profileTabProfile),
                        Tab(text: l10n.favoritesTab),

                      ],
                      controller: _tabCtrl,
                    ),
                  ],
                ),
              ),
            ),
          ],
          body: TabBarView(
            controller: _tabCtrl,
            children: [
              // ── Tab 0: Mi Perfil ──
              RefreshIndicator(
                color: scheme.primary,
                onRefresh: _loadProfile,
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 40),
                  children: [
                    _buildWellnessSection(context, scheme),
                    const SizedBox(height: 24),
                    if (_interests.isNotEmpty) ...[
                      _buildSection(l10n.myInterests),
                      const SizedBox(height: 12),
                      _buildInterestChips(),
                    ] else ...[
                      _buildSection(l10n.myInterests),
                      const SizedBox(height: 12),
                      _buildEmptyInterestsHint(context, l10n),
                    ],
                    const SizedBox(height: 24),
                    _buildSection(l10n.manageAccount),
                    const SizedBox(height: 12),
                    _buildStatsRow(context, scheme, l10n),
                    const SizedBox(height: 16),
                    _buildQuickActions(context, scheme, l10n),
                  ],
                ),
              ),

              // ── Tab 1: Favoritos ──
              _DiaryFavoritesTab(
                loading: _diaryLoading,
                items: _favorites,
                onRefresh: _loadDiary,
              ),


            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAvatarHeader(BuildContext context, ColorScheme scheme) {
    return Tooltip(
      message: AppLocalizations.of(context)!.editProfile,
      child: Stack(
        clipBehavior: Clip.none,
        alignment: Alignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: scheme.primary.withValues(alpha: 0.35),
                width: 3,
              ),
            ),
            child: SmarturUserAvatar(
              radius: 44,
              photoUrl: _photoUrl,
              avatarIconKey: _avatarIconKey,
              displayName: _name,
              backgroundColor: scheme.primary.withValues(alpha: 0.12),
              foregroundColor: scheme.onSurface,
            ),
          ),
          Positioned(
            right: -2,
            bottom: -2,
            child: Material(
              color: Colors.transparent,
              elevation: 3,
              shadowColor: Colors.black.withValues(alpha: 0.2),
              shape: const CircleBorder(),
              clipBehavior: Clip.antiAlias,
              child: InkWell(
                onTap: () async {
                  await Navigator.push(
                    context,
                    smarturFadeRoute(const EditProfileAvatarScreen()),
                  );
                  _loadProfile();
                },
                customBorder: const CircleBorder(),
                child: Container(
                  width: 28,
                  height: 28,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: scheme.surface,
                    border: Border.all(color: scheme.outlineVariant),
                  ),
                  child: Icon(
                    Icons.camera_alt_rounded,
                    size: 14,
                    color: scheme.primary,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatsRow(
    BuildContext context,
    ColorScheme scheme,
    AppLocalizations l10n,
  ) {
    return Row(
      children: [
        Expanded(
          child: _StatTile(
            icon: Icons.favorite_outline,
            value: '${_interests.length}',
            label: l10n.myInterests,
            scheme: scheme,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _StatTile(
            icon: Icons.tune_rounded,
            value: _hasTravelPrefs ? '✓' : '—',
            label: l10n.myPreferences,
            scheme: scheme,
          ),
        ),
      ],
    );
  }

  Widget _buildQuickActions(
    BuildContext context,
    ColorScheme scheme,
    AppLocalizations l10n,
  ) {
    return SmarturPanel(
      padding: EdgeInsets.zero,
      child: Column(
        children: [
          _ProfileActionTile(
            icon: Icons.search_rounded,
            title: l10n.recoTitle,
            subtitle: l10n.recoAiPersonalizedFor,
            onTap: () => MainTabScope.goTo(context, MainTabIndex.explore),
          ),
          Divider(height: 1, color: scheme.outlineVariant.withValues(alpha: 0.5)),
          _ProfileActionTile(
            icon: Icons.tune_rounded,
            title: l10n.myPreferences,
            subtitle: _hasTravelPrefs
                ? l10n.yourPreferences
                : l10n.noPreferencesSaved,
            onTap: () async {
              await Navigator.push(
                context,
                smarturFadeRoute(PreferencesScreen(userName: _name)),
              );
              _loadProfile();
            },
          ),
          Divider(height: 1, color: scheme.outlineVariant.withValues(alpha: 0.5)),
          _ProfileActionTile(
            icon: Icons.person_outline_rounded,
            title: l10n.editProfile,
            subtitle: l10n.editProfileSubtitle,
            onTap: () async {
              await Navigator.push(
                context,
                smarturFadeRoute(const EditProfileAvatarScreen()),
              );
              _loadProfile();
            },
          ),
          Divider(height: 1, color: scheme.outlineVariant.withValues(alpha: 0.5)),
          _ProfileActionTile(
            icon: Icons.settings_outlined,
            title: l10n.configuration,
            subtitle: l10n.appPreferences,
            onTap: () async {
              await Navigator.push(
                context,
                smarturFadeRoute(const SettingsScreen()),
              );
              _loadProfile();
            },
          ),
        ],
      ),
    );
  }

  // ── WellTur wellness section ────────────────────────────────────────────

  static const _modoLabels = {
    'modo_calma':        'Modo Calma',
    'modo_restauracion': 'Modo Restauración',
    'modo_equilibrio':   'Modo Equilibrio',
  };
  static const _modoDescriptions = {
    'modo_calma':        'Necesitas desconectarte y recargar energía',
    'modo_restauracion': 'Tu cuerpo pide descanso activo y recuperación',
    'modo_equilibrio':   'Buscas silencio y espacio para centrarte',
  };
  static const _modoColors = {
    'modo_calma':        Color(0xFF10B981),
    'modo_restauracion': Color(0xFF3B82F6),
    'modo_equilibrio':   Color(0xFF8B5CF6),
  };
  static const _modoIcons = {
    'modo_calma':        Icons.spa_outlined,
    'modo_restauracion': Icons.water_outlined,
    'modo_equilibrio':   Icons.self_improvement_outlined,
  };

  String _formatDate(DateTime d) {
    const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    return '${d.day} ${months[d.month - 1]}';
  }

  Widget _buildWellnessSection(BuildContext context, ColorScheme scheme) {
    final sem = SmarturSemanticColors.of(context);
    final last   = _wellnessHistory.isNotEmpty ? _wellnessHistory.first : null;
    final modo   = last?['modo_viaje'] as String?;
    final modoLabel = modo != null ? (_modoLabels[modo] ?? modo) : null;
    final modoDesc  = modo != null ? (_modoDescriptions[modo] ?? '') : '';
    final modoColor = modo != null ? (_modoColors[modo] ?? sem.leaf) : sem.leaf;
    final modoIcon  = modo != null ? (_modoIcons[modo]  ?? Icons.eco_outlined) : Icons.eco_outlined;
    final lastDate  = last != null ? DateTime.tryParse(last['created_at']?.toString() ?? '') : null;

    // Historial compacto: entradas 1..N (la primera ya es el "actual")
    final prevHistory = _wellnessHistory.length > 1 ? _wellnessHistory.skip(1).take(4).toList() : <Map<String,dynamic>>[];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // ── Header ──
        Row(
          children: [
            const Icon(Icons.eco_outlined, size: 18, color: Color(0xFF254117)),
            const SizedBox(width: 6),
            Text('WellTur',
                style: SmarturStyle.calSansTitle.copyWith(fontSize: 18, color: const Color(0xFF254117))),
          ],
        ),
        const SizedBox(height: 10),

        // ── Card principal ──
        Container(
          width: double.infinity,
          decoration: BoxDecoration(
            color: scheme.surfaceContainerHighest.withValues(alpha: 0.4),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: scheme.outlineVariant.withValues(alpha: 0.5)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [

              // ── Estado actual ──
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                child: last != null && modoLabel != null
                    ? Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Ícono grande con fondo
                          Container(
                            width: 48,
                            height: 48,
                            decoration: BoxDecoration(
                              color: modoColor.withValues(alpha: 0.14),
                              shape: BoxShape.circle,
                            ),
                            child: Icon(modoIcon, color: modoColor, size: 24),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Text(
                                      modoLabel,
                                      style: TextStyle(
                                        fontFamily: 'CalSans',
                                        fontSize: 15,
                                        fontWeight: FontWeight.w700,
                                        color: modoColor,
                                      ),
                                    ),
                                    const Spacer(),
                                    if (lastDate != null)
                                      Text(
                                        _formatDate(lastDate),
                                        style: TextStyle(
                                          fontFamily: 'Outfit',
                                          fontSize: 11,
                                          color: scheme.onSurfaceVariant,
                                        ),
                                      ),
                                  ],
                                ),
                                const SizedBox(height: 3),
                                Text(
                                  modoDesc,
                                  style: TextStyle(
                                    fontFamily: 'Outfit',
                                    fontSize: 12,
                                    color: scheme.onSurfaceVariant,
                                    height: 1.4,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      )
                    : Text(
                        'Descubre tu modo de viaje',
                        style: TextStyle(fontFamily: 'Outfit', fontSize: 13,
                            color: scheme.onSurface.withValues(alpha: 0.7)),
                      ),
              ),

              // ── Historial previo ──
              if (prevHistory.isNotEmpty) ...[
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
                  child: Text(
                    'Historial',
                    style: TextStyle(
                      fontFamily: 'Outfit',
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: scheme.onSurfaceVariant,
                      letterSpacing: 0.8,
                    ),
                  ),
                ),
                const SizedBox(height: 6),
                ...prevHistory.map((entry) {
                  final m    = entry['modo_viaje'] as String?;
                  final lbl  = m != null ? (_modoLabels[m]  ?? m) : '—';
                  final col  = m != null ? (_modoColors[m]  ?? sem.leaf) : sem.leaf;
                  final ico  = m != null ? (_modoIcons[m]   ?? Icons.eco_outlined) : Icons.eco_outlined;
                  final date = DateTime.tryParse(entry['created_at']?.toString() ?? '');
                  return Padding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                    child: Row(
                      children: [
                        // Mini línea de tiempo
                        Column(
                          children: [
                            Container(
                              width: 2,
                              height: 8,
                              color: scheme.outlineVariant,
                            ),
                            Container(
                              width: 8,
                              height: 8,
                              decoration: BoxDecoration(
                                color: col.withValues(alpha: 0.6),
                                shape: BoxShape.circle,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(width: 10),
                        if (date != null)
                          SizedBox(
                            width: 44,
                            child: Text(
                              _formatDate(date),
                              style: TextStyle(fontFamily: 'Outfit', fontSize: 11,
                                  color: scheme.onSurfaceVariant),
                            ),
                          ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: col.withValues(alpha: 0.10),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(ico, size: 11, color: col),
                              const SizedBox(width: 4),
                              Text(lbl,
                                  style: TextStyle(fontFamily: 'Outfit', fontSize: 11,
                                      fontWeight: FontWeight.w600, color: col)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  );
                }),
              ],

              // ── Botones ──
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
                child: Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () async {
                          await Navigator.push(context,
                              smarturFadeRoute(const WellnessAssessmentScreen()));
                          _loadWellnessHistory();
                        },
                        icon: const Icon(Icons.refresh_rounded, size: 16),
                        label: Text(last != null ? 'Actualizar estado' : 'Comenzar'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: const Color(0xFF254117),
                          side: const BorderSide(color: Color(0xFF254117)),
                          textStyle: const TextStyle(fontFamily: 'Outfit', fontSize: 12,
                              fontWeight: FontWeight.w600),
                          padding: const EdgeInsets.symmetric(vertical: 10),
                        ),
                      ),
                    ),
                    if (_wellnessHistory.isNotEmpty) ...[
                      const SizedBox(width: 8),
                      OutlinedButton.icon(
                        onPressed: _deletingWellness ? null : () async {
                          final confirm = await showDialog<bool>(
                            context: context,
                            builder: (ctx) => AlertDialog(
                              title: const Text('Borrar historial',
                                  style: TextStyle(fontFamily: 'Outfit')),
                              content: const Text(
                                'Se eliminará todo tu historial de bienestar. Esta acción no se puede deshacer.',
                                style: TextStyle(fontFamily: 'Outfit'),
                              ),
                              actions: [
                                TextButton(
                                    onPressed: () => Navigator.pop(ctx, false),
                                    child: const Text('Cancelar')),
                                TextButton(
                                  onPressed: () => Navigator.pop(ctx, true),
                                  child: const Text('Eliminar',
                                      style: TextStyle(color: Colors.red)),
                                ),
                              ],
                            ),
                          );
                          if (confirm == true) _deleteWellnessHistory();
                        },
                        icon: _deletingWellness
                            ? const SizedBox(width: 14, height: 14,
                                child: CircularProgressIndicator(strokeWidth: 2))
                            : const Icon(Icons.delete_outline, size: 16),
                        label: const Text('Borrar'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.red,
                          side: const BorderSide(color: Colors.red),
                          textStyle: const TextStyle(fontFamily: 'Outfit', fontSize: 12,
                              fontWeight: FontWeight.w600),
                          padding: const EdgeInsets.symmetric(vertical: 10),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // ── Sección título ──────────────────────────────────────────────────────

  Widget _buildSection(String title) {
    return Align(
      alignment: Alignment.centerLeft,
      child: Text(
        title,
        style: SmarturStyle.calSansTitle.copyWith(fontSize: 18),
      ),
    );
  }

  // ── Intereses chips ─────────────────────────────────────────────────────

  Widget _buildEmptyInterestsHint(BuildContext context, AppLocalizations l10n) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
      decoration: BoxDecoration(
        color: scheme.surfaceContainerHighest.withValues(alpha: 0.4),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: scheme.outlineVariant),
      ),
      child: Text(
        l10n.noPreferencesSaved,
        style: TextStyle(
          fontFamily: 'Outfit',
          fontSize: 14,
          height: 1.35,
          color: scheme.onSurfaceVariant,
        ),
      ),
    );
  }

  Widget _buildInterestChips() {
    final scheme = Theme.of(context).colorScheme;
    final sem = SmarturSemanticColors.of(context);
    final colors = [
      scheme.primary,
      sem.sea,
      sem.altAccent,
      sem.leaf,
      sem.ember,
    ];
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: _interests.asMap().entries.map((entry) {
        final color = colors[entry.key % colors.length];
        return Container(
          padding:
              const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            color: color.withAlpha(25),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: color.withAlpha(80)),
          ),
          child: Text(
            entry.value,
            style: TextStyle(
              fontFamily: 'Outfit',
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
        );
      }).toList(),
    );
  }
}

class _StatTile extends StatelessWidget {
  final IconData icon;
  final String value;
  final String label;
  final ColorScheme scheme;

  const _StatTile({
    required this.icon,
    required this.value,
    required this.label,
    required this.scheme,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
      decoration: BoxDecoration(
        color: scheme.surfaceContainerHighest.withValues(alpha: 0.45),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: scheme.outlineVariant.withValues(alpha: 0.6)),
      ),
      child: Column(
        children: [
          Icon(icon, size: 20, color: scheme.primary),
          const SizedBox(height: 6),
          Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: SmarturStyle.calSansTitle.copyWith(fontSize: 16),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontFamily: 'Outfit',
              fontSize: 10,
              height: 1.2,
              color: scheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}

class _ProfileActionTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _ProfileActionTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return ListTile(
      onTap: onTap,
      leading: Container(
        width: 40,
        height: 40,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: scheme.primary.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Icon(icon, color: scheme.primary, size: 22),
      ),
      title: Text(
        title,
        style: const TextStyle(
          fontFamily: 'Outfit',
          fontWeight: FontWeight.w700,
          fontSize: 15,
        ),
      ),
      subtitle: Text(
        subtitle,
        maxLines: 2,
        overflow: TextOverflow.ellipsis,
        style: TextStyle(
          fontFamily: 'Outfit',
          fontSize: 12,
          color: scheme.onSurfaceVariant,
        ),
      ),
      trailing: Icon(
        Icons.chevron_right_rounded,
        color: scheme.onSurfaceVariant,
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Favoritos tab (moved from DiaryScreen)
// ─────────────────────────────────────────────────────────────────────────────

class _DiaryFavoritesTab extends StatelessWidget {
  final bool loading;
  final List<Map<String, dynamic>> items;
  final Future<void> Function() onRefresh;

  const _DiaryFavoritesTab({
    required this.loading,
    required this.items,
    required this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final l10n = AppLocalizations.of(context)!;
    if (loading) {
      return SmarturShimmer(
        enabled: true,
        child: GridView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: 6,
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2, crossAxisSpacing: 12, mainAxisSpacing: 12,
            childAspectRatio: 3 / 4,
          ),
          itemBuilder: (_, __) =>
              const SkeletonContainer(height: 160, borderRadius: 18),
        ),
      );
    }
    if (items.isEmpty) {
      return RefreshIndicator(
        color: scheme.primary,
        onRefresh: onRefresh,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: [
            SmarturEmptyState(
              icon: Icons.favorite_border_rounded,
              title: l10n.favoritesTab,
              subtitle: l10n.noCategoryPlaces,
              iconColor: SmarturSemanticColors.of(context).altAccent,
            ),
          ],
        ),
      );
    }
    return RefreshIndicator(
      color: scheme.primary,
      onRefresh: onRefresh,
      child: GridView.builder(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        itemCount: items.length,
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2, crossAxisSpacing: 12, mainAxisSpacing: 12,
          childAspectRatio: 3 / 4,
        ),
        itemBuilder: (context, index) {
          final it = items[index];
          final name = it['name']?.toString() ?? '';
          final url = it['image_url']?.toString() ?? '';
          return ClipRRect(
            borderRadius: BorderRadius.circular(18),
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                borderRadius: BorderRadius.circular(18),
                onTap: () => openDiaryItemDetailWithSwipe(context, items, index),
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    if (url.isNotEmpty)
                      CachedNetworkImage(
                        imageUrl: url, fit: BoxFit.cover,
                        errorWidget: (_, __, ___) => Container(
                          color: scheme.outlineVariant,
                          child: Icon(Icons.place_outlined,
                              color: scheme.onSurfaceVariant),
                        ),
                        placeholder: (_, __) =>
                            Container(color: scheme.outlineVariant),
                      )
                    else
                      Container(
                        color: scheme.outlineVariant,
                        child: Icon(Icons.photo_outlined,
                            color: scheme.onSurfaceVariant),
                      ),
                    Align(
                      alignment: Alignment.topRight,
                      child: Padding(
                        padding: const EdgeInsets.all(8),
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.35),
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: const Icon(Icons.favorite,
                              size: 14, color: Colors.white),
                        ),
                      ),
                    ),
                    Positioned(
                      left: 8, right: 8, bottom: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.55),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          name,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                              fontFamily: 'Outfit',
                              fontSize: 12,
                              color: Colors.white),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Historial tab (moved from DiaryScreen)
// ─────────────────────────────────────────────────────────────────────────────


