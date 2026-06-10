import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:smartur/l10n/app_localizations.dart';

import '../../../core/motion/smartur_routes.dart';
import '../../../core/theme/style_guide.dart';
import '../../../core/utils/notifications.dart';
import '../../../data/models/itinerary_model.dart';
import '../../../data/services/itinerary_service.dart';
import '../../../data/services/user_content_service.dart';
import '../../../data/services/auth_service.dart';
import '../../widgets/smartur_background.dart';
import '../../widgets/smartur_skeleton.dart';
import '../../widgets/public_profile_sheet.dart';
import '../../widgets/smartur_user_avatar.dart';
import '../../widgets/smartur_ui_kit.dart';
import '../../widgets/smartur_loader.dart';
import '../itinerary/itinerary_detail_screen.dart';

class ExploreScreen extends StatefulWidget {
  const ExploreScreen({super.key});

  @override
  State<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends State<ExploreScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabCtrl;

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      backgroundColor: scheme.surface,
      appBar: AppBar(
        title: Text(l10n.exploreTitle,
            style: SmarturStyle.calSansTitle.copyWith(fontSize: 20)),
        elevation: 0,
        backgroundColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
        bottom: smarturTabBar(
          context,
          tabs: [
            Tab(text: l10n.routesSectionLabel),
            Tab(text: l10n.communityTitle),
          ],
        ),
      ),
      body: SmarturBackgroundTop(
        child: TabBarView(
          controller: _tabCtrl,
          children: const [
            _RoutesTab(),
            _CommunityTab(),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 1: Rutas — rutas reales desde API
// ─────────────────────────────────────────────────────────────────────────────

class _RoutesTab extends StatefulWidget {
  const _RoutesTab();

  @override
  State<_RoutesTab> createState() => _RoutesTabState();
}

class _RoutesTabState extends State<_RoutesTab>
    with AutomaticKeepAliveClientMixin {
  List<Itinerary> _predefined = [];
  List<Itinerary> _community = [];
  List<Itinerary> _following = [];
  bool _loading = true;
  String? _error;
  final _searchCtrl = TextEditingController();
  List<Itinerary> _searchResults = [];
  bool _searching = false;

  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final svc = ItineraryService();
      final results = await Future.wait([
        svc.fetchPredefined(),
        svc.fetchCommunity(),
        svc.fetchFollowing().catchError((_) => <Itinerary>[]),
      ]);
      if (mounted) {
        setState(() {
          _predefined = results[0];
          _community = results[1];
          _following = results[2];
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _loading = false;
        });
      }
    }
  }

  Future<void> _search(String q) async {
    if (q.trim().isEmpty) {
      setState(() {
        _searching = false;
        _searchResults = [];
      });
      return;
    }
    setState(() => _searching = true);
    try {
      final results = await ItineraryService().search(q.trim());
      if (mounted) setState(() => _searchResults = results);
    } catch (_) {
      if (mounted) setState(() => _searchResults = []);
    } finally {
      if (mounted) setState(() => _searching = false);
    }
  }

  void _openDetail(Itinerary it) {
    Navigator.push(
      context,
      smarturFadeRoute(ItineraryDetailScreen(itinerary: it)),
    );
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final l10n = AppLocalizations.of(context)!;
    final scheme = Theme.of(context).colorScheme;

    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null && _predefined.isEmpty && _community.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.cloud_off_rounded,
                size: 48,
                color: scheme.onSurfaceVariant.withValues(alpha: 0.4)),
            const SizedBox(height: 12),
            Text(l10n.routesLoadError,
                style: TextStyle(
                    fontFamily: 'Outfit', color: scheme.onSurfaceVariant)),
            const SizedBox(height: 16),
            OutlinedButton.icon(
              onPressed: _load,
              icon: const Icon(Icons.refresh_rounded),
              label: Text(l10n.mapRetry,
                  style: const TextStyle(fontFamily: 'Outfit')),
            ),
          ],
        ),
      );
    }

    final isSearchActive = _searchCtrl.text.trim().isNotEmpty;

    return RefreshIndicator(
      onRefresh: _load,
      color: SmarturStyle.purple,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
        children: [
          // Search bar
          Container(
            decoration: BoxDecoration(
              color: scheme.surfaceContainerHighest.withValues(alpha: 0.5),
              borderRadius: BorderRadius.circular(16),
              border:
                  Border.all(color: scheme.outlineVariant.withValues(alpha: 0.5)),
            ),
            child: Row(
              children: [
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                  child: Icon(Icons.search_rounded,
                      color: scheme.onSurfaceVariant),
                ),
                Expanded(
                  child: TextField(
                    controller: _searchCtrl,
                    decoration: InputDecoration(
                      hintText: l10n.searchRoutesHint,
                      hintStyle: TextStyle(
                        fontFamily: 'Outfit',
                        color: scheme.onSurfaceVariant,
                      ),
                      border: InputBorder.none,
                      contentPadding:
                          const EdgeInsets.symmetric(vertical: 14),
                    ),
                    style: const TextStyle(fontFamily: 'Outfit'),
                    onChanged: (v) {
                      setState(() {});
                      _search(v);
                    },
                  ),
                ),
                if (isSearchActive)
                  IconButton(
                    icon: const Icon(Icons.close_rounded, size: 18),
                    onPressed: () {
                      _searchCtrl.clear();
                      setState(() {
                        _searchResults = [];
                        _searching = false;
                      });
                    },
                  ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          if (isSearchActive) ...[
            if (_searching)
              const Center(child: CircularProgressIndicator())
            else if (_searchResults.isEmpty)
              Center(
                child: Text(l10n.routesLoadError,
                    style: TextStyle(
                        fontFamily: 'Outfit',
                        color: scheme.onSurfaceVariant)),
              )
            else
              ..._searchResults
                  .map((it) => _RouteListCard(it: it, onTap: () => _openDetail(it))),
          ] else ...[
            // Certificadas
            _RouteSectionHeader(
              icon: Icons.verified_rounded,
              color: SmarturStyle.purple,
              title: l10n.routesSectionCertified,
            ),
            const SizedBox(height: 12),
            _predefined.isEmpty
                ? _EmptySection(scheme: scheme)
                : _ItineraryHorizontalList(
                    items: _predefined, onTap: _openDetail),
            const SizedBox(height: 24),

            // Más copiadas
            _RouteSectionHeader(
              icon: Icons.copy_rounded,
              color: SmarturStyle.blue,
              title: l10n.routesSectionMostCopied,
            ),
            const SizedBox(height: 12),
            _community.isEmpty
                ? _EmptySection(scheme: scheme)
                : _ItineraryHorizontalList(
                    items: _community, onTap: _openDetail),
            const SizedBox(height: 24),

            // Siguiendo
            _RouteSectionHeader(
              icon: Icons.people_outline_rounded,
              color: SmarturStyle.pink,
              title: l10n.routesSectionFollowing,
            ),
            const SizedBox(height: 12),
            _following.isEmpty
                ? _FollowingEmpty(scheme: scheme, l10n: l10n)
                : _ItineraryHorizontalList(
                    items: _following, onTap: _openDetail),
          ],
        ],
      ),
    );
  }
}

// ─── Shared route widgets ─────────────────────────────────────────────────────

class _RouteSectionHeader extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String title;

  const _RouteSectionHeader({
    required this.icon,
    required this.color,
    required this.title,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 18, color: color),
        const SizedBox(width: 8),
        Expanded(
          child: Text(title,
              style: SmarturStyle.calSansTitle.copyWith(fontSize: 16)),
        ),
      ],
    );
  }
}

class _EmptySection extends StatelessWidget {
  final ColorScheme scheme;
  const _EmptySection({required this.scheme});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 100,
      child: Center(
        child: Icon(Icons.route_rounded,
            size: 36, color: scheme.onSurfaceVariant.withValues(alpha: 0.3)),
      ),
    );
  }
}

class _FollowingEmpty extends StatelessWidget {
  final ColorScheme scheme;
  final AppLocalizations l10n;
  const _FollowingEmpty({required this.scheme, required this.l10n});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
      decoration: BoxDecoration(
        color: scheme.surfaceContainerHighest.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(20),
        border:
            Border.all(color: scheme.outlineVariant.withValues(alpha: 0.4)),
      ),
      child: Column(
        children: [
          Icon(Icons.people_outline_rounded,
              size: 36,
              color: scheme.onSurfaceVariant.withValues(alpha: 0.5)),
          const SizedBox(height: 8),
          Text(
            l10n.routesFollowingEmpty,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontFamily: 'Outfit',
              fontSize: 13,
              color: scheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}

class _ItineraryHorizontalList extends StatelessWidget {
  final List<Itinerary> items;
  final ValueChanged<Itinerary> onTap;

  const _ItineraryHorizontalList({required this.items, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 140,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.only(right: 4),
        itemCount: items.length,
        separatorBuilder: (_, __) => const SizedBox(width: 12),
        itemBuilder: (_, i) {
          final it = items[i];
          final scheme = Theme.of(context).colorScheme;
          return GestureDetector(
            onTap: () => onTap(it),
            child: Container(
              width: 200,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color:
                    scheme.surfaceContainerHighest.withValues(alpha: 0.5),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                    color: scheme.outlineVariant.withValues(alpha: 0.5)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        it.isCertified
                            ? Icons.verified_rounded
                            : Icons.route_rounded,
                        size: 18,
                        color: it.isCertified
                            ? SmarturStyle.purple
                            : SmarturStyle.blue,
                      ),
                      const SizedBox(width: 6),
                      if (it.copyCount > 0)
                        Text(
                          '${it.copyCount}',
                          style: TextStyle(
                            fontFamily: 'Outfit',
                            fontSize: 12,
                            color: scheme.onSurfaceVariant,
                          ),
                        ),
                    ],
                  ),
                  const Spacer(),
                  Text(
                    it.title,
                    style: TextStyle(
                      fontFamily: 'Outfit',
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: scheme.onSurface,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (it.stops.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(
                      AppLocalizations.of(context)!
                          .itineraryNStops(it.stops.length),
                      style: TextStyle(
                        fontFamily: 'Outfit',
                        fontSize: 11,
                        color: scheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

class _RouteListCard extends StatelessWidget {
  final Itinerary it;
  final VoidCallback onTap;

  const _RouteListCard({required this.it, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final l10n = AppLocalizations.of(context)!;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: scheme.surfaceContainerHighest.withValues(alpha: 0.5),
          borderRadius: BorderRadius.circular(16),
          border:
              Border.all(color: scheme.outlineVariant.withValues(alpha: 0.5)),
        ),
        child: Row(
          children: [
            Icon(Icons.route_rounded,
                color: SmarturStyle.purple, size: 22),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(it.title,
                      style: TextStyle(
                        fontFamily: 'Outfit',
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: scheme.onSurface,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis),
                  if (it.stops.isNotEmpty)
                    Text(l10n.itineraryNStops(it.stops.length),
                        style: TextStyle(
                          fontFamily: 'Outfit',
                          fontSize: 12,
                          color: scheme.onSurfaceVariant,
                        )),
                ],
              ),
            ),
            Icon(Icons.chevron_right_rounded,
                color: scheme.onSurfaceVariant),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 2: Comunidad (posts — movido desde CommunityScreen)
// ─────────────────────────────────────────────────────────────────────────────

class _CommunityTab extends StatefulWidget {
  const _CommunityTab();

  @override
  State<_CommunityTab> createState() => _CommunityTabState();
}

class _CommunityTabState extends State<_CommunityTab>
    with AutomaticKeepAliveClientMixin {
  bool _loading = true;
  String? _error;
  List<Map<String, dynamic>> _posts = [];
  int? _currentUserId;

  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    _loadUser();
    _load();
  }

  Future<void> _loadUser() async {
    final id = await AuthService().getUserId();
    if (mounted) setState(() => _currentUserId = id);
  }

  Future<void> _deletePost(int postId) async {
    final l10n = AppLocalizations.of(context)!;
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) {
        final s = Theme.of(ctx).colorScheme;
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Text(l10n.communityDeletePost,
              style: const TextStyle(fontFamily: 'Outfit', fontWeight: FontWeight.bold)),
          content: Text(l10n.communityDeletePostConfirm,
              style: const TextStyle(fontFamily: 'Outfit')),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: Text(l10n.cancel, style: TextStyle(color: s.onSurfaceVariant)),
            ),
            TextButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: Text(l10n.communityDeletePost,
                  style: TextStyle(color: s.error, fontWeight: FontWeight.w700)),
            ),
          ],
        );
      },
    );
    if (confirm != true) return;
    if (!mounted) return;
    try {
      await UserContentService().deleteCommunityPost(postId);
      if (mounted) {
        SmarturNotifications.showSuccess(context, l10n.communityDeletePost);
        _load();
      }
    } catch (e) {
      if (mounted) SmarturNotifications.showError(context, e.toString());
    }
  }

  Future<void> _reportPost(int postId, String reason) async {
    final l10n = AppLocalizations.of(context)!;
    try {
      await UserContentService().reportCommunityPost(postId, reason);
      if (mounted) SmarturNotifications.showSuccess(context, l10n.communityReportSent);
    } on UserContentException catch (e) {
      if (mounted) SmarturNotifications.showError(context, e.message);
    } catch (e) {
      if (mounted) SmarturNotifications.showError(context, e.toString());
    }
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final data = await UserContentService().fetchCommunityPosts();
      final list = data['posts'] as List<dynamic>? ?? [];
      if (mounted) {
        setState(() {
          _posts = list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  Future<void> _showCreateSheet() async {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(ctx).bottom),
        child: _CreatePostSheet(onPublished: () { Navigator.pop(ctx); _load(); }),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final l10n = AppLocalizations.of(context)!;
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      backgroundColor: Colors.transparent,
      floatingActionButton: FloatingActionButton(
        onPressed: _showCreateSheet,
        backgroundColor: SmarturStyle.purple,
        child: const Icon(Icons.add_rounded, color: Colors.white),
      ),
      body: _error != null && !_loading
          ? ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              children: [
                SmarturEmptyState(
                  icon: Icons.cloud_off_outlined,
                  title: l10n.connectionError,
                  subtitle: _error,
                  action: FilledButton.icon(
                    onPressed: _load,
                    icon: const Icon(Icons.refresh_rounded, size: 18),
                    label: Text(l10n.mapRetry),
                  ),
                ),
              ],
            )
          : RefreshIndicator(
              color: SmarturStyle.purple,
              onRefresh: _load,
              child: SmarturLoadTransition(
                loading: _loading,
                loadingChild: SmarturShimmer(
                  enabled: true,
                  child: ListView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.only(bottom: 80),
                    children: const [
                      SkeletonCommunityPostCard(),
                      SkeletonCommunityPostCard(),
                      SkeletonCommunityPostCard(),
                    ],
                  ),
                ),
                child: _posts.isEmpty
                    ? ListView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        children: [
                          SmarturEmptyState(
                            icon: Icons.people_outline,
                            title: l10n.communityEmpty,
                            subtitle: l10n.communityEmptyHint,
                            action: FilledButton.icon(
                              onPressed: _showCreateSheet,
                              icon: const Icon(Icons.add_rounded, size: 18),
                              label: Text(l10n.communityFirstPost),
                            ),
                          ),
                        ],
                      )
                    : ListView.builder(
                        physics: const AlwaysScrollableScrollPhysics(),
                        padding: const EdgeInsets.only(top: 8, bottom: 80),
                        itemCount: _posts.length,
                        itemBuilder: (ctx, i) {
                          final post = _posts[i];
                          return _CommunityPostCard(
                            post: post,
                            currentUserId: _currentUserId,
                            onDelete: () => _deletePost(post['id_post'] as int),
                            onReport: (reason) =>
                                _reportPost(post['id_post'] as int, reason),
                          );
                        },
                      ),
              ),
            ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Community post card (extracted from CommunityScreen)
// ─────────────────────────────────────────────────────────────────────────────

class _CommunityPostCard extends StatefulWidget {
  final Map<String, dynamic> post;
  final int? currentUserId;
  final VoidCallback onDelete;
  final ValueChanged<String> onReport;

  const _CommunityPostCard({
    required this.post,
    required this.currentUserId,
    required this.onDelete,
    required this.onReport,
  });

  @override
  State<_CommunityPostCard> createState() => _CommunityPostCardState();
}

class _CommunityPostCardState extends State<_CommunityPostCard> {
  bool _liked = false;
  int _likeCount = 0;

  @override
  void initState() {
    super.initState();
    _liked = widget.post['user_liked'] == true;
    _likeCount = (widget.post['like_count'] as num?)?.toInt() ?? 0;
  }

  void _toggleLike() {
    // Like endpoint not yet implemented (Sprint 4) — UI-only toggle
    setState(() {
      _liked = !_liked;
      _likeCount += _liked ? 1 : -1;
    });
  }

  void _viewProfile(BuildContext context) {
    // Build author map from post data (no separate profile endpoint yet)
    final author = <String, dynamic>{
      'name': widget.post['author_name'],
      'photo_url': widget.post['author_photo_url'] ?? widget.post['author_photo'],
      'avatar_icon_key': widget.post['author_avatar_icon_key'],
      'id_user': widget.post['user_id'] ?? widget.post['id_user'],
    };
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => PublicProfileSheet(author: author),
    );
  }

  void _showOptions(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final postUserId = widget.post['user_id'] ?? widget.post['id_user'];
    final isOwn = widget.currentUserId != null &&
        widget.currentUserId == postUserId;
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 8),
            Container(
              width: 40, height: 4,
              margin: const EdgeInsets.only(bottom: 8),
              decoration: BoxDecoration(
                color: Theme.of(ctx).colorScheme.outlineVariant,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            if (isOwn)
              ListTile(
                leading: const Icon(Icons.delete_outline, color: Colors.red),
                title: Text(l10n.communityDeletePost,
                    style: const TextStyle(fontFamily: 'Outfit', color: Colors.red)),
                onTap: () { Navigator.pop(ctx); widget.onDelete(); },
              )
            else
              ListTile(
                leading: const Icon(Icons.flag_outlined),
                title: Text(l10n.communityReport,
                    style: const TextStyle(fontFamily: 'Outfit')),
                onTap: () {
                  Navigator.pop(ctx);
                  _showReportSheet(context);
                },
              ),
            ListTile(
              leading: const Icon(Icons.close_rounded),
              title: Text(l10n.cancel, style: const TextStyle(fontFamily: 'Outfit')),
              onTap: () => Navigator.pop(ctx),
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  void _showReportSheet(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final reasons = [
      l10n.communityReportSpam,
      l10n.communityReportInappropriate,
      l10n.communityReportFalse,
      l10n.communityReportOther,
    ];
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 8),
            Center(
              child: Container(
                width: 40, height: 4,
                decoration: BoxDecoration(
                  color: Theme.of(ctx).colorScheme.outlineVariant,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
              child: Text(l10n.communityReportTitle,
                  style: const TextStyle(
                      fontFamily: 'CalSans', fontSize: 18)),
            ),
            ...reasons.map((r) => ListTile(
              title: Text(r, style: const TextStyle(fontFamily: 'Outfit')),
              onTap: () { Navigator.pop(ctx); widget.onReport(r); },
            )),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final post = widget.post;
    final content = (post['caption'] ?? post['content'] ?? '') as String;
    final authorName = post['author_name'] as String? ?? '—';
    final authorPhoto =
        (post['author_photo_url'] ?? post['author_photo']) as String?;
    final authorIconKey = post['author_avatar_icon_key'] as String?;
    final imageUrl = post['image_url'] as String?;
    // Derive placeRef from place_kind + place_id (API format)
    final placeKindRaw = post['place_kind'] as String?;
    final placeIdRaw = post['place_id'];
    final placeRef = (placeKindRaw != null && placeIdRaw != null)
        ? '${placeKindRaw}_$placeIdRaw'
        : post['place_ref'] as String?;
    final placeTitle =
        (post['place_name'] ?? post['place_title']) as String?;

    final raw = post['created_at'];
    DateTime? createdAt;
    if (raw is String) createdAt = DateTime.tryParse(raw);
    final timeAgo = createdAt != null ? _timeAgo(createdAt) : '';

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: scheme.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: scheme.outlineVariant.withValues(alpha: 0.5)),
        boxShadow: [
          BoxShadow(
            color: scheme.shadow.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 14, 8, 0),
            child: Row(
              children: [
                GestureDetector(
                  onTap: () => _viewProfile(context),
                  child: SmarturUserAvatar(
                    radius: 18,
                    photoUrl: authorPhoto,
                    avatarIconKey: authorIconKey,
                    displayName: authorName,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      GestureDetector(
                        onTap: () => _viewProfile(context),
                        child: Text(
                          authorName,
                          style: const TextStyle(
                            fontFamily: 'Outfit',
                            fontWeight: FontWeight.w700,
                            fontSize: 14,
                          ),
                        ),
                      ),
                      if (timeAgo.isNotEmpty)
                        Text(
                          timeAgo,
                          style: TextStyle(
                            fontFamily: 'Outfit',
                            fontSize: 11,
                            color: scheme.onSurfaceVariant,
                          ),
                        ),
                    ],
                  ),
                ),
                IconButton(
                  icon: Icon(Icons.more_vert_rounded,
                      color: scheme.onSurfaceVariant, size: 20),
                  onPressed: () => _showOptions(context),
                ),
              ],
            ),
          ),

          // Content
          if (content.isNotEmpty)
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 10, 14, 0),
              child: Text(
                content,
                style: const TextStyle(fontFamily: 'Outfit', fontSize: 14, height: 1.4),
              ),
            ),

          // Image
          if (imageUrl != null) ...[
            const SizedBox(height: 10),
            ClipRRect(
              borderRadius: const BorderRadius.only(
                bottomLeft: Radius.circular(20),
                bottomRight: Radius.circular(20),
              ),
              child: Image.network(
                imageUrl,
                width: double.infinity,
                height: 200,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => const SizedBox.shrink(),
              ),
            ),
          ],

          // Place ref
          if (placeRef != null && placeTitle != null)
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 8, 14, 0),
              child: GestureDetector(
                onTap: null, // place navigation wired in Sprint 4
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: SmarturStyle.purple.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                        color: SmarturStyle.purple.withValues(alpha: 0.2)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.place_outlined,
                          size: 14, color: SmarturStyle.purple),
                      const SizedBox(width: 4),
                      Flexible(
                        child: Text(
                          placeTitle,
                          style: const TextStyle(
                            fontFamily: 'Outfit',
                            fontSize: 12,
                            color: SmarturStyle.purple,
                            fontWeight: FontWeight.w600,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),

          // Actions row
          Padding(
            padding: const EdgeInsets.fromLTRB(8, 4, 8, 4),
            child: Row(
              children: [
                IconButton(
                  icon: Icon(
                    _liked ? Icons.favorite_rounded : Icons.favorite_outline_rounded,
                    color: _liked ? SmarturStyle.pink : scheme.onSurfaceVariant,
                    size: 20,
                  ),
                  onPressed: _toggleLike,
                ),
                if (_likeCount > 0)
                  Text(
                    '$_likeCount',
                    style: TextStyle(
                      fontFamily: 'Outfit',
                      fontSize: 13,
                      color: scheme.onSurfaceVariant,
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _timeAgo(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 1) return 'ahora';
    if (diff.inMinutes < 60) return 'hace ${diff.inMinutes}m';
    if (diff.inHours < 24) return 'hace ${diff.inHours}h';
    if (diff.inDays < 7) return 'hace ${diff.inDays}d';
    return '${dt.day}/${dt.month}/${dt.year}';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Create post sheet
// ─────────────────────────────────────────────────────────────────────────────

class _CreatePostSheet extends StatefulWidget {
  final VoidCallback onPublished;
  const _CreatePostSheet({required this.onPublished});

  @override
  State<_CreatePostSheet> createState() => _CreatePostSheetState();
}

class _CreatePostSheetState extends State<_CreatePostSheet> {
  final _ctrl = TextEditingController();
  Uint8List? _imageBytes;
  String? _imageName;
  bool _loading = false;

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.gallery, imageQuality: 75);
    if (picked == null) return;
    final bytes = await picked.readAsBytes();
    if (mounted) setState(() { _imageBytes = bytes; _imageName = picked.name; });
  }

  Future<void> _publish() async {
    final content = _ctrl.text.trim();
    final l10n = AppLocalizations.of(context)!;
    if (content.isEmpty && _imageBytes == null) return;
    setState(() => _loading = true);
    try {
      await UserContentService().createCommunityPost(
        caption: content,
        imageBytes: _imageBytes,
        imageFilename: _imageName,
      );
      if (mounted) widget.onPublished();
    } on UserContentException catch (e) {
      if (mounted) SmarturNotifications.showError(context, e.message);
    } catch (e) {
      if (mounted) SmarturNotifications.showError(context, l10n.connectionError);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final l10n = AppLocalizations.of(context)!;
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Center(
            child: Container(
              width: 40, height: 4,
              decoration: BoxDecoration(
                color: scheme.outlineVariant,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text(l10n.communityCreatePost,
              style: SmarturStyle.calSansTitle.copyWith(fontSize: 18)),
          const SizedBox(height: 16),
          TextField(
            controller: _ctrl,
            maxLines: 4,
            maxLength: 500,
            decoration: InputDecoration(
              hintText: l10n.communityPostHint,
              hintStyle: TextStyle(fontFamily: 'Outfit', color: scheme.onSurfaceVariant),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
            ),
          ),
          if (_imageBytes != null) ...[
            const SizedBox(height: 8),
            Stack(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Image.memory(_imageBytes!, height: 140, fit: BoxFit.cover,
                      width: double.infinity),
                ),
                Positioned(
                  top: 4, right: 4,
                  child: GestureDetector(
                    onTap: () => setState(() { _imageBytes = null; _imageName = null; }),
                    child: Container(
                      decoration: const BoxDecoration(
                        color: Colors.black54, shape: BoxShape.circle),
                      padding: const EdgeInsets.all(4),
                      child: const Icon(Icons.close, color: Colors.white, size: 16),
                    ),
                  ),
                ),
              ],
            ),
          ],
          const SizedBox(height: 12),
          Row(
            children: [
              IconButton(
                icon: const Icon(Icons.image_outlined, color: SmarturStyle.purple),
                onPressed: _loading ? null : _pickImage,
              ),
              const Spacer(),
              FilledButton(
                onPressed: _loading ? null : _publish,
                style: FilledButton.styleFrom(backgroundColor: SmarturStyle.purple),
                child: _loading
                    ? const SizedBox(
                        width: 18, height: 18,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : Text(l10n.communityPublish,
                        style: const TextStyle(fontFamily: 'Outfit', fontWeight: FontWeight.w700)),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
