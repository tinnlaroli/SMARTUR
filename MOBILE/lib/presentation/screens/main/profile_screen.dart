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
import '../../widgets/smartur_app_bar.dart';
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
      if (mounted) {
        setState(() {
          _name = name;
          _email = email;
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

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      backgroundColor: scheme.surface,
      body: SmarturBackground(
        child: SafeArea(
          bottom: false,
          child: Column(
            children: [
              // Cabecera fija: título + ajustes
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 8, 4),
                child: Row(
                  children: [
                    SmarturAccentTitle(l10n.myProfile),
                    const Spacer(),
                    IconButton(
                      icon:
                          Icon(Icons.settings_outlined, color: scheme.onSurface),
                      onPressed: () async {
                        await Navigator.push(
                            context, smarturFadeRoute(const SettingsScreen()));
                        _loadProfile();
                        _loadWellnessHistory();
                      },
                    ),
                  ],
                ),
              ),
              // Avatar + nombre (fijo)
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
                        style: SmarturStyle.calSansTitle
                            .copyWith(fontSize: 20, color: scheme.onSurface),
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
              // Cuerpos: cada tab con su propio scroll independiente
              Expanded(
                child: TabBarView(
                  controller: _tabCtrl,
                  children: [
                    // ── Tab 0: Mi Perfil ──
                    RefreshIndicator(
                      color: scheme.primary,
                      onRefresh: _loadProfile,
                      child: ListView(
                        padding: const EdgeInsets.fromLTRB(20, 16, 20, 100),
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

  Widget _buildWellnessSection(BuildContext context, ColorScheme scheme) {
    final sem = SmarturSemanticColors.of(context);
    final last = _wellnessHistory.isNotEmpty ? _wellnessHistory.first : null;
    final modo = last?['modo_viaje'] as String?;
    final modoLabel = modo != null ? (_modoLabels[modo] ?? modo) : null;
    final modoDesc = modo != null
        ? (_modoDescriptions[modo] ?? '')
        : 'Descubre tu modo de viaje';
    final modoColor = modo != null ? (_modoColors[modo] ?? sem.leaf) : const Color(0xFF10B981);
    final modoIcon = modo != null ? (_modoIcons[modo] ?? Icons.eco_outlined) : Icons.eco_outlined;

    return Container(
      decoration: BoxDecoration(
        color: scheme.surfaceContainerLow,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: scheme.outlineVariant.withValues(alpha: 0.5)),
      ),
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          // ── Header: título + chip de modo actual ──
          Row(
            children: [
              const Icon(Icons.eco_outlined, size: 14, color: Color(0xFF254117)),
              const SizedBox(width: 5),
              Text(
                'SMARTUR Wellness',
                style: SmarturStyle.calSansTitle.copyWith(
                    fontSize: 14, color: const Color(0xFF254117)),
              ),
              const Spacer(),
              if (modoLabel != null)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: modoColor.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(modoIcon, size: 11, color: modoColor),
                      const SizedBox(width: 4),
                      Text(
                        modoLabel,
                        style: TextStyle(
                          fontFamily: 'Outfit',
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: modoColor,
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
          const SizedBox(height: 7),
          // ── Descripción: 1 línea fija ──
          Text(
            modoDesc,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontFamily: 'Outfit',
              fontSize: 12,
              color: scheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 10),
          // ── Botones ──
          Row(
            children: [
              Expanded(
                child: SizedBox(
                  height: 34,
                  child: OutlinedButton.icon(
                    onPressed: () async {
                      await Navigator.push(context,
                          smarturFadeRoute(const WellnessAssessmentScreen()));
                      _loadWellnessHistory();
                    },
                    icon: const Icon(Icons.refresh_rounded, size: 14),
                    label: Text(last != null ? 'Actualizar' : 'Comenzar'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFF254117),
                      side: const BorderSide(color: Color(0xFF254117)),
                      textStyle: const TextStyle(
                          fontFamily: 'Outfit',
                          fontSize: 12,
                          fontWeight: FontWeight.w600),
                      padding: const EdgeInsets.symmetric(horizontal: 8),
                    ),
                  ),
                ),
              ),
              if (_wellnessHistory.isNotEmpty) ...[
                const SizedBox(width: 8),
                SizedBox(
                  height: 34,
                  child: OutlinedButton.icon(
                    onPressed: _deletingWellness
                        ? null
                        : () async {
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
                        ? const SizedBox(
                            width: 12,
                            height: 12,
                            child: CircularProgressIndicator(strokeWidth: 2))
                        : const Icon(Icons.delete_outline, size: 14),
                    label: const Text('Borrar'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.red,
                      side: const BorderSide(color: Colors.red),
                      textStyle: const TextStyle(
                          fontFamily: 'Outfit',
                          fontSize: 12,
                          fontWeight: FontWeight.w600),
                      padding: const EdgeInsets.symmetric(horizontal: 8),
                    ),
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
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
        color: scheme.surfaceContainerLow,
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
        color: scheme.surfaceContainerLow,
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


