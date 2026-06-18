import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:smartur/l10n/app_localizations.dart';

import '../../../core/motion/smartur_routes.dart';
import '../../../core/theme/smartur_theme_extensions.dart';
import '../../../core/theme/style_guide.dart';
import '../../../core/utils/notifications.dart';
import '../../../data/local/itinerary_db.dart';
import '../../../data/models/itinerary_model.dart';
import '../../../data/models/user_profile_model.dart';
import '../../../data/services/itinerary_service.dart';
import '../../../data/services/social_service.dart';
import '../../widgets/smartur_skeleton.dart';
import '../../widgets/smartur_user_avatar.dart';
import '../itinerary/itinerary_detail_screen.dart';
import '../itinerary/planner_screen.dart';

class PublicProfileScreen extends StatefulWidget {
  final int userId;
  final String? initialName;

  const PublicProfileScreen({
    super.key,
    required this.userId,
    this.initialName,
  });

  @override
  State<PublicProfileScreen> createState() => _PublicProfileScreenState();
}

class _PublicProfileScreenState extends State<PublicProfileScreen>
    with SingleTickerProviderStateMixin {
  final _social = SocialService();
  late final TabController _tabs;

  UserProfile? _profile;
  List<Itinerary> _routes = [];
  bool _loadingProfile = true;
  bool _loadingRoutes = true;
  bool _followLoading = false;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 1, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    await Future.wait([_loadProfile(), _loadRoutes()]);
  }

  Future<void> _loadProfile() async {
    try {
      final p = await _social.getPublicProfile(widget.userId);
      if (mounted) setState(() { _profile = p; _loadingProfile = false; });
    } catch (_) {
      if (mounted) setState(() => _loadingProfile = false);
    }
  }

  Future<void> _loadRoutes() async {
    try {
      final routes = await _social.getUserItineraries(widget.userId);
      if (mounted) setState(() { _routes = routes; _loadingRoutes = false; });
    } catch (_) {
      if (mounted) setState(() => _loadingRoutes = false);
    }
  }

  Future<void> _toggleFollow() async {
    if (_profile == null || _followLoading) return;
    setState(() => _followLoading = true);
    try {
      if (_profile!.isFollowing) {
        await _social.unfollowUser(_profile!.id);
      } else {
        await _social.followUser(_profile!.id);
      }
      final updated = await _social.getPublicProfile(_profile!.id);
      if (mounted && updated != null) setState(() => _profile = updated);
    } catch (e) {
      if (mounted) SmarturNotifications.showError(context, e.toString());
    } finally {
      if (mounted) setState(() => _followLoading = false);
    }
  }

  Future<void> _copyRoute(Itinerary it) async {
    final l10n = AppLocalizations.of(context)!;
    try {
      final copy = await ItineraryService().copyItinerary(it.id);
      await ItineraryDB.saveItinerary(copy);
      if (!mounted) return;
      SmarturNotifications.showSuccess(context, l10n.routeCopied);
      await Navigator.push(
        context,
        smarturFadeRoute(PlannerScreen(itinerary: copy)),
      );
    } catch (e) {
      if (mounted) SmarturNotifications.showError(context, e.toString());
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final scheme = Theme.of(context).colorScheme;

    return Scaffold(
      backgroundColor: scheme.surface,
      body: NestedScrollView(
        headerSliverBuilder: (ctx, innerScrolled) => [
          _buildHeader(l10n, scheme),
        ],
        body: _buildRoutesList(l10n, scheme),
      ),
    );
  }

  SliverAppBar _buildHeader(AppLocalizations l10n, ColorScheme scheme) {
    final name = _profile?.name ?? widget.initialName ?? '—';

    return SliverAppBar(
      pinned: true,
      expandedHeight: 260,
      backgroundColor: scheme.surface,
      surfaceTintColor: Colors.transparent,
      flexibleSpace: FlexibleSpaceBar(
        collapseMode: CollapseMode.pin,
        background: Container(
          color: scheme.surface,
          child: _loadingProfile
              ? _headerSkeleton(scheme)
              : _headerContent(name, l10n, scheme),
        ),
      ),
      bottom: PreferredSize(
        preferredSize: const Size.fromHeight(48),
        child: TabBar(
          controller: _tabs,
          indicatorColor: scheme.primary,
          labelColor: scheme.primary,
          unselectedLabelColor: scheme.onSurfaceVariant,
          labelStyle: const TextStyle(fontFamily: 'Outfit', fontWeight: FontWeight.w700, fontSize: 14),
          tabs: [Tab(text: l10n.publicRoutes)],
        ),
      ),
    );
  }

  Widget _headerSkeleton(ColorScheme scheme) {
    return SmarturShimmer(
      enabled: true,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: const [
          SkeletonCircle(size: 80),
          SizedBox(height: 12),
          SkeletonText(width: 160, height: 20),
          SizedBox(height: 8),
          SkeletonText(width: 120, height: 14),
        ],
      ),
    );
  }

  Widget _headerContent(String name, AppLocalizations l10n, ColorScheme scheme) {
    final p = _profile;
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 8),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: scheme.primary.withValues(alpha: 0.35), width: 3),
            ),
            child: SmarturUserAvatar(
              radius: 40,
              photoUrl: p?.photoUrl,
              avatarIconKey: p?.avatarIconKey,
              displayName: name,
              backgroundColor: scheme.primary.withValues(alpha: 0.12),
              foregroundColor: scheme.onSurface,
            ),
          ),
          const SizedBox(height: 10),
          Text(name,
              style: SmarturStyle.calSansTitle.copyWith(fontSize: 20, color: scheme.onSurface)),
          if (p != null) ...[
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _CountChip(value: p.followersCount, label: l10n.socialFollowers, scheme: scheme),
                const SizedBox(width: 24),
                _CountChip(value: p.followingCount, label: l10n.socialFollowing, scheme: scheme),
              ],
            ),
            const SizedBox(height: 12),
            _FollowButton(
              isFollowing: p.isFollowing,
              loading: _followLoading,
              onTap: _toggleFollow,
              l10n: l10n,
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildRoutesList(AppLocalizations l10n, ColorScheme scheme) {
    if (_loadingRoutes) {
      return SmarturShimmer(
        enabled: true,
        child: ListView(
          padding: const EdgeInsets.symmetric(vertical: 8),
          children: List.generate(4, (_) => const SkeletonListRow()),
        ),
      );
    }
    if (_routes.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.route_outlined, size: 56, color: scheme.onSurfaceVariant.withValues(alpha: 0.4)),
              const SizedBox(height: 12),
              Text(l10n.noPublicRoutes,
                  style: TextStyle(fontFamily: 'Outfit', fontSize: 16, color: scheme.onSurfaceVariant)),
            ],
          ),
        ),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
      itemCount: _routes.length,
      itemBuilder: (ctx, i) => _RouteCard(
        it: _routes[i],
        l10n: l10n,
        scheme: scheme,
        onCopy: () => _copyRoute(_routes[i]),
        onTap: () => Navigator.push(
          context,
          smarturFadeRoute(ItineraryDetailScreen(itinerary: _routes[i])),
        ),
      ),
    );
  }
}

// ─── Subwidgets ───────────────────────────────────────────────────────────────

class _CountChip extends StatelessWidget {
  final int value;
  final String label;
  final ColorScheme scheme;

  const _CountChip({required this.value, required this.label, required this.scheme});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text('$value',
            style: SmarturStyle.calSansTitle.copyWith(fontSize: 18, color: scheme.onSurface)),
        Text(label,
            style: TextStyle(
              fontFamily: 'Outfit', fontSize: 12, color: scheme.onSurfaceVariant)),
      ],
    );
  }
}

class _FollowButton extends StatelessWidget {
  final bool isFollowing;
  final bool loading;
  final VoidCallback onTap;
  final AppLocalizations l10n;

  const _FollowButton({
    required this.isFollowing,
    required this.loading,
    required this.onTap,
    required this.l10n,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    if (loading) {
      return const SizedBox(
        height: 36,
        width: 120,
        child: Center(child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))),
      );
    }
    return FilledButton(
      onPressed: onTap,
      style: FilledButton.styleFrom(
        backgroundColor: isFollowing ? scheme.surfaceContainerHighest : scheme.primary,
        foregroundColor: isFollowing ? scheme.onSurface : Colors.white,
        minimumSize: const Size(120, 36),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      ),
      child: Text(
        isFollowing ? l10n.socialUnfollow : l10n.socialFollow,
        style: const TextStyle(fontFamily: 'Outfit', fontWeight: FontWeight.w700, fontSize: 14),
      ),
    );
  }
}

class _RouteCard extends StatelessWidget {
  final Itinerary it;
  final AppLocalizations l10n;
  final ColorScheme scheme;
  final VoidCallback onTap;
  final VoidCallback onCopy;

  const _RouteCard({
    required this.it,
    required this.l10n,
    required this.scheme,
    required this.onTap,
    required this.onCopy,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: scheme.outlineVariant.withValues(alpha: 0.6)),
      ),
      color: scheme.surfaceContainerLowest,
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              // Cover or default icon
              ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: SizedBox(
                  width: 60,
                  height: 60,
                  child: it.coverImageUrl != null
                      ? CachedNetworkImage(
                          imageUrl: it.coverImageUrl!,
                          fit: BoxFit.cover,
                          errorWidget: (_, __, ___) => _defaultCover(),
                        )
                      : _defaultCover(),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        if (it.isCertified)
                          Padding(
                            padding: const EdgeInsets.only(right: 4),
                            child: Icon(Icons.verified_rounded,
                                size: 14, color: scheme.primary),
                          ),
                        Expanded(
                          child: Text(it.title,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: SmarturStyle.calSansTitle.copyWith(fontSize: 15)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Icon(Icons.pin_drop_outlined, size: 13, color: scheme.onSurfaceVariant),
                        const SizedBox(width: 3),
                        Text(l10n.itineraryNStops(it.stops.length),
                            style: TextStyle(
                                fontFamily: 'Outfit', fontSize: 12, color: scheme.onSurfaceVariant)),
                        const SizedBox(width: 12),
                        Icon(Icons.copy_outlined, size: 13, color: scheme.onSurfaceVariant),
                        const SizedBox(width: 3),
                        Text('${it.copyCount}',
                            style: TextStyle(
                                fontFamily: 'Outfit', fontSize: 12, color: scheme.onSurfaceVariant)),
                      ],
                    ),
                  ],
                ),
              ),
              IconButton(
                icon: Icon(Icons.add_circle_outline_rounded, color: scheme.primary),
                tooltip: l10n.copyToMyRoutes,
                onPressed: onCopy,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _defaultCover() {
    return Container(
      color: scheme.primary.withValues(alpha: 0.12),
      child: Icon(Icons.route_rounded, color: scheme.primary, size: 28),
    );
  }
}
