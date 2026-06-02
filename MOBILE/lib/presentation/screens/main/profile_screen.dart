import 'package:flutter/material.dart';
import 'package:smartur/l10n/app_localizations.dart';

import '../../../core/theme/style_guide.dart';
import '../../../data/services/auth_service.dart';
import '../../../data/services/profile_service.dart';
import '../../widgets/smartur_background.dart';
import '../../widgets/smartur_skeleton.dart';
import '../../widgets/smartur_user_avatar.dart';
import 'edit_profile_avatar_screen.dart';
import '../../widgets/smartur_ui_kit.dart';
import '../preferences/preferences_screen.dart';
import '../explore/recommendation_screen.dart';
import '../settings/settings_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final AuthService _authService = AuthService();

  String _name = '';
  String _email = '';
  String _memberSince = '';
  List<String> _interests = [];
  String? _photoUrl;
  String? _avatarIconKey;
  bool _loading = true;
  bool _hasTravelPrefs = false;

  @override
  void initState() {
    super.initState();
    // No usar AppLocalizations.of(context) ni otros InheritedWidget hasta
    // después de que initState termine (primer frame).
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _loadProfile();
    });
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
        child: SmarturShimmer(
          enabled: _loading,
          child: _loading
              ? CustomScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  slivers: _profileSkeletonSlivers(),
                )
              : RefreshIndicator(
                  color: SmarturStyle.purple,
                  onRefresh: _loadProfile,
                  child: CustomScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    slivers: [
                      SliverAppBar(
                        pinned: true,
                        automaticallyImplyLeading: false,
                        backgroundColor: Colors.transparent,
                        surfaceTintColor: Colors.transparent,
                        elevation: 0,
                        title: Text(
                          l10n.myProfile,
                          style: SmarturStyle.calSansTitle.copyWith(fontSize: 20),
                        ),
                        actions: [
                          IconButton(
                            icon: Icon(Icons.settings_outlined, color: scheme.onSurface),
                            onPressed: () async {
                              await Navigator.push(
                                context,
                                smarturFadeRoute(const SettingsScreen()),
                              );
                              _loadProfile();
                            },
                          ),
                        ],
                      ),
                      SliverToBoxAdapter(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 24),
                          child: Column(
                            children: [
                              const SizedBox(height: 8),
                              _buildAvatarHeader(context, scheme),
                              const SizedBox(height: 16),
                              Text(
                                _name,
                                textAlign: TextAlign.center,
                                style: SmarturStyle.calSansTitle.copyWith(
                                  fontSize: 22,
                                  color: scheme.onSurface,
                                ),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                _email,
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontFamily: 'Outfit',
                                  fontSize: 14,
                                  color: scheme.onSurfaceVariant,
                                ),
                              ),
                              if (_memberSince.isNotEmpty) ...[
                                const SizedBox(height: 10),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 12,
                                    vertical: 6,
                                  ),
                                  decoration: BoxDecoration(
                                    color: SmarturStyle.purple.withValues(alpha: 0.1),
                                    borderRadius: BorderRadius.circular(20),
                                    border: Border.all(
                                      color: SmarturStyle.purple.withValues(alpha: 0.25),
                                    ),
                                  ),
                                  child: Text(
                                    l10n.memberSince(_memberSince),
                                    style: TextStyle(
                                      fontFamily: 'Outfit',
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                      color: SmarturStyle.purple,
                                    ),
                                  ),
                                ),
                              ],
                              const SizedBox(height: 28),
                            ],
                          ),
                        ),
                      ),
                      SliverPadding(
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        sliver: SliverList(
                          delegate: SliverChildListDelegate([
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
                            const SizedBox(height: 40),
                          ]),
                        ),
                      ),
                    ],
                  ),
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
                color: SmarturStyle.purple.withValues(alpha: 0.35),
                width: 3,
              ),
            ),
            child: SmarturUserAvatar(
              radius: 44,
              photoUrl: _photoUrl,
              avatarIconKey: _avatarIconKey,
              displayName: _name,
              backgroundColor: SmarturStyle.purple.withValues(alpha: 0.12),
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
                  child: const Icon(
                    Icons.camera_alt_rounded,
                    size: 14,
                    color: SmarturStyle.purple,
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
            icon: Icons.auto_awesome_rounded,
            title: l10n.recoTitle,
            subtitle: l10n.recoAiPersonalizedFor,
            onTap: () {
              Navigator.push(
                context,
                smarturFadeRoute(const RecommendationScreen()),
              );
            },
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
    final colors = [
      SmarturStyle.purple,
      SmarturStyle.blue,
      SmarturStyle.pink,
      SmarturStyle.green,
      SmarturStyle.orange,
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
          Icon(icon, size: 20, color: SmarturStyle.purple),
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
          color: SmarturStyle.purple.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Icon(icon, color: SmarturStyle.purple, size: 22),
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
