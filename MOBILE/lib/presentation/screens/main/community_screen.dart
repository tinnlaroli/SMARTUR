import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:smartur/l10n/app_localizations.dart';

import '../../../core/theme/style_guide.dart';
import '../../../core/utils/notifications.dart';
import '../../../data/models/place_model.dart';
import '../../../data/services/explore_service.dart';
import '../../../data/services/user_content_service.dart';
import '../../../data/services/auth_service.dart';
import '../../widgets/smartur_background.dart';
import '../../widgets/smartur_skeleton.dart';
import '../../widgets/public_profile_sheet.dart';
import '../../widgets/smartur_user_avatar.dart';
import '../../widgets/smartur_ui_kit.dart';
import '../../widgets/smartur_loader.dart';

/// Devuelve kind API (`svc` / `poi`) e id numérico desde [Place.id] tipo `svc_12`.
({String kind, int id})? _parsePlaceRef(String placeId) {
  if (placeId.startsWith('svc_')) {
    final n = int.tryParse(placeId.substring(4));
    if (n != null) return (kind: 'svc', id: n);
  }
  if (placeId.startsWith('poi_')) {
    final n = int.tryParse(placeId.substring(4));
    if (n != null) return (kind: 'poi', id: n);
  }
  return null;
}

class CommunityScreen extends StatefulWidget {
  const CommunityScreen({super.key});

  @override
  State<CommunityScreen> createState() => _CommunityScreenState();
}

class _CommunityScreenState extends State<CommunityScreen> {
  bool _loading = true;
  String? _error;
  List<Map<String, dynamic>> _posts = [];
  int? _currentUserId;

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
    setState(() {
      _loading = true;
      _error = null;
    });
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
      if (mounted) {
        setState(() {
          _error = e.toString();
          _loading = false;
        });
      }
    }
  }

  Future<void> _showCreateSheet() async {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) => _CreatePostSheet(
        onPublished: () {
          Navigator.pop(context);
          _load();
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      appBar: AppBar(
        title: Text(l10n.communityTitle,
            style: SmarturStyle.calSansTitle.copyWith(fontSize: 20)),
        elevation: 0,
        backgroundColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
      ),
      body: SmarturBackgroundTop(
        child: _error != null && !_loading
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
              color: Theme.of(context).colorScheme.primary,
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
                child: SmarturFadeIn(
                  child: ListView.builder(
                    padding: const EdgeInsets.only(bottom: 80),
                    itemCount: _posts.length,
                    itemBuilder: (context, index) {
                      final post = _posts[index];
                      return _PostCard(
                        data: post,
                        currentUserId: _currentUserId,
                        onDelete: () => _deletePost(post['id'] as int),
                        onReport: (reason) => _reportPost(post['id'] as int, reason),
                      );
                    },
                  ),
                ),
              ),
            ),
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
        onPressed: _showCreateSheet,
        tooltip: l10n.communityCreatePost,
        child: const Icon(Icons.post_add),
      ),
    );
  }
}

class _CreatePostSheet extends StatefulWidget {
  final VoidCallback onPublished;

  const _CreatePostSheet({required this.onPublished});

  @override
  State<_CreatePostSheet> createState() => _CreatePostSheetState();
}

class _CreatePostSheetState extends State<_CreatePostSheet> {
  final _caption = TextEditingController();
  final _picker = ImagePicker();

  List<Place> _places = [];
  Place? _selected;
  bool _loadingPlaces = true;
  String? _placesError;
  Uint8List? _imageBytes;
  String? _imageName;
  String? _imageMime;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _loadPlaces();
  }

  @override
  void dispose() {
    _caption.dispose();
    super.dispose();
  }

  Future<void> _loadPlaces() async {
    try {
      final cities = await ExploreService().fetchCities();
      final all = <Place>[];
      for (final c in cities) {
        all.addAll(c.places);
      }
      if (!mounted) return;
      setState(() {
        _places = all;
        _loadingPlaces = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _loadingPlaces = false;
        _placesError = AppLocalizations.of(context)!.communityLoadPlacesError;
      });
    }
  }

  Future<void> _pickImage() async {
    final x = await _picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 2048,
      imageQuality: 88,
    );
    if (x == null) return;
    final bytes = await x.readAsBytes();
    if (!mounted) return;
    setState(() {
      _imageBytes = bytes;
      _imageName = x.name;
      _imageMime = x.mimeType;
    });
  }

  Future<void> _submit() async {
    final l10n = AppLocalizations.of(context)!;
    if (_selected == null) {
      SmarturNotifications.showWarning(context, l10n.communityNeedPlace);
      return;
    }
    final ref = _parsePlaceRef(_selected!.id);
    if (ref == null) {
      SmarturNotifications.showWarning(context, l10n.communityNeedPlace);
      return;
    }
    final text = _caption.text.trim();
    if (text.isEmpty && (_imageBytes == null || _imageBytes!.isEmpty)) {
      SmarturNotifications.showWarning(context, l10n.communityNeedTextOrImage);
      return;
    }

    setState(() => _submitting = true);
    try {
      await UserContentService().createCommunityPost(
        placeKind: ref.kind,
        placeId: ref.id,
        caption: text,
        imageBytes: _imageBytes,
        imageFilename: _imageName,
        imageMimeType: _imageMime,
      );
      if (!mounted) return;
      SmarturNotifications.showSuccess(context, l10n.communityPostPublished);
      widget.onPublished();
    } on UserContentException catch (e) {
      if (mounted) {
        SmarturNotifications.showError(context, e.message);
      }
    } catch (e) {
      if (mounted) {
        SmarturNotifications.showError(context, e.toString());
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final l10n = AppLocalizations.of(context)!;

    final keyboardBottom = MediaQuery.viewInsetsOf(context).bottom;
    return SingleChildScrollView(
      padding: EdgeInsets.fromLTRB(24, 16, 24, 24 + keyboardBottom),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: scheme.outlineVariant,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(l10n.communityCreatePost, style: SmarturStyle.calSansTitle.copyWith(fontSize: 22)),
            const SizedBox(height: 16),
            if (_loadingPlaces)
              const Padding(
                padding: EdgeInsets.all(24),
                child: Center(
                  child: SmartURLoader(isMini: true, continuous: true),
                ),
              )
            else if (_placesError != null)
              Text(_placesError!, style: TextStyle(color: scheme.error, fontFamily: 'Outfit'))
            else
              InputDecorator(
                decoration: InputDecoration(
                  labelText: l10n.communitySelectPlace,
                  prefixIcon: Icon(Icons.place_outlined, color: Theme.of(context).colorScheme.primary),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<Place>(
                    isExpanded: true,
                    hint: Text(
                      l10n.communitySelectPlaceHint,
                      style: TextStyle(fontFamily: 'Outfit', color: scheme.onSurfaceVariant),
                    ),
                    value: _selected,
                    items: _places
                        .map(
                          (p) => DropdownMenuItem(
                            value: p,
                            child: Text(
                              '${p.name} · ${p.city}',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontFamily: 'Outfit', fontSize: 14),
                            ),
                          ),
                        )
                        .toList(),
                    onChanged: (v) => setState(() => _selected = v),
                  ),
                ),
              ),
            const SizedBox(height: 16),
            TextField(
              controller: _caption,
              maxLines: 4,
              decoration: InputDecoration(
                labelText: l10n.communityPostCaptionHint,
                alignLabelWithHint: true,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 12),
            if (_imageBytes != null)
              Stack(
                alignment: Alignment.topRight,
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: Image.memory(
                      _imageBytes!,
                      height: 160,
                      width: double.infinity,
                      fit: BoxFit.cover,
                    ),
                  ),
                  IconButton(
                    onPressed: () => setState(() {
                      _imageBytes = null;
                      _imageName = null;
                      _imageMime = null;
                    }),
                    icon: const Icon(Icons.close, color: Colors.white),
                    style: IconButton.styleFrom(backgroundColor: Colors.black54),
                    tooltip: l10n.communityRemoveImage,
                  ),
                ],
              )
            else
              OutlinedButton.icon(
                onPressed: _pickImage,
                icon: const Icon(Icons.image_outlined),
                label: Text(l10n.communityAttachImage, style: const TextStyle(fontFamily: 'Outfit')),
              ),
            const SizedBox(height: 20),
            FilledButton(
              onPressed: _submitting ? null : _submit,
              style: FilledButton.styleFrom(
                backgroundColor: scheme.primary,
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              child: _submitting
                  ? const SizedBox(
                      height: 22,
                      width: 22,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : Text(l10n.communityPublish, style: const TextStyle(fontFamily: 'Outfit')),
            ),
          ],
        ),
    );
  }
}

class _PostCard extends StatelessWidget {
  final Map<String, dynamic> data;
  final int? currentUserId;
  final VoidCallback onDelete;
  final void Function(String reason) onReport;

  const _PostCard({
    required this.data,
    this.currentUserId,
    required this.onDelete,
    required this.onReport,
  });

  Future<void> _showReportDialog(BuildContext context) async {
    final l10n = AppLocalizations.of(context)!;
    final scheme = Theme.of(context).colorScheme;
    final reasons = <String, String>{
      'spam': l10n.communityReportSpam,
      'inappropriate': l10n.communityReportInappropriate,
      'false_info': l10n.communityReportFalse,
      'hateful': l10n.communityReportHateful,
    };
    String? selected;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setS) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Row(
            children: [
              Icon(Icons.flag_outlined, color: scheme.error, size: 20),
              const SizedBox(width: 8),
              Text(l10n.communityReportPost,
                  style: const TextStyle(fontFamily: 'Outfit', fontWeight: FontWeight.bold)),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(l10n.communityReportReason,
                  style: TextStyle(fontFamily: 'Outfit', fontSize: 13, color: scheme.onSurfaceVariant)),
              const SizedBox(height: 12),
              ...reasons.entries.map((e) => RadioListTile<String>(
                    value: e.key,
                    groupValue: selected,
                    activeColor: scheme.error,
                    contentPadding: EdgeInsets.zero,
                    dense: true,
                    title: Text(e.value, style: const TextStyle(fontFamily: 'Outfit', fontSize: 14)),
                    onChanged: (v) => setS(() => selected = v),
                  )),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: Text(l10n.cancel,
                  style: TextStyle(fontFamily: 'Outfit', color: scheme.onSurfaceVariant)),
            ),
            FilledButton(
              onPressed: selected == null ? null : () => Navigator.pop(ctx, true),
              style: FilledButton.styleFrom(
                backgroundColor: scheme.error,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: Text(l10n.communityReportPost,
                  style: const TextStyle(fontFamily: 'Outfit', fontWeight: FontWeight.w700, color: Colors.white)),
            ),
          ],
        ),
      ),
    );
    if (confirmed == true && selected != null) {
      onReport(selected!);
    }
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final caption = data['caption']?.toString() ?? '';
    final imageUrl = data['image_url']?.toString() ?? '';
    final placeName = data['place_name']?.toString() ?? '';
    final author = data['author'] as Map<String, dynamic>? ?? {};
    final name = author['name']?.toString() ?? 'Usuario';
    final photoUrl = author['photo_url'] as String?;
    final iconKey = author['avatar_icon_key'] as String?;
    final postUserId = data['user_id'] is int ? data['user_id'] as int : int.tryParse(data['user_id']?.toString() ?? '');
    final isOwner = currentUserId != null && currentUserId == postUserId;

    void openProfile() => showModalBottomSheet(
          context: context,
          isScrollControlled: true,
          shape: const RoundedRectangleBorder(
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          builder: (ctx) => PublicProfileSheet(author: author),
        );

    Widget menuButton() => PopupMenuButton<String>(
          icon: Icon(Icons.more_vert, color: scheme.onSurfaceVariant, size: 20),
          onSelected: (val) async {
            if (val == 'delete') {
              onDelete();
            } else if (val == 'report') {
              await _showReportDialog(context);
            }
          },
          itemBuilder: (context) {
            final l10n = AppLocalizations.of(context)!;
            return [
              if (isOwner)
                PopupMenuItem(
                  value: 'delete',
                  child: Row(children: [
                    const Icon(Icons.delete_outline, color: Colors.red, size: 20),
                    const SizedBox(width: 8),
                    Text(l10n.communityDeletePost,
                        style: const TextStyle(color: Colors.red, fontFamily: 'Outfit')),
                  ]),
                ),
              if (!isOwner)
                PopupMenuItem(
                  value: 'report',
                  child: Row(children: [
                    Icon(Icons.flag_outlined, color: scheme.error, size: 20),
                    const SizedBox(width: 8),
                    Text(l10n.communityReportPost,
                        style: TextStyle(color: scheme.error, fontFamily: 'Outfit')),
                  ]),
                ),
            ];
          },
        );

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: Card(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        elevation: 0,
        color: scheme.surfaceContainerHighest.withValues(alpha: 0.55),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Imagen arriba (si existe) ──
            if (imageUrl.isNotEmpty)
              ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                child: AspectRatio(
                  aspectRatio: 16 / 9,
                  child: Image.network(
                    imageUrl,
                    fit: BoxFit.cover,
                    loadingBuilder: (_, child, progress) => progress == null
                        ? child
                        : Container(
                            color: scheme.outlineVariant.withValues(alpha: 0.3),
                            child: const Center(
                              child: SizedBox(
                                width: 24,
                                height: 24,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              ),
                            ),
                          ),
                    errorBuilder: (_, __, ___) => Container(
                      color: scheme.outlineVariant.withValues(alpha: 0.3),
                      child: Icon(Icons.broken_image_outlined,
                          size: 40, color: scheme.onSurfaceVariant),
                    ),
                  ),
                ),
              ),

            // ── Autor + lugar + caption ──
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 12, 10, 14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Fila autor
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      GestureDetector(
                        onTap: openProfile,
                        child: SmarturUserAvatar(
                          radius: 18,
                          photoUrl: photoUrl,
                          avatarIconKey: iconKey,
                          displayName: name,
                          backgroundColor: scheme.primary.withValues(alpha: 0.12),
                          foregroundColor: scheme.primary,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: GestureDetector(
                          onTap: openProfile,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(name,
                                  style: const TextStyle(
                                      fontFamily: 'Outfit', fontWeight: FontWeight.w600, fontSize: 14)),
                              if (placeName.isNotEmpty)
                                Row(children: [
                                  Icon(Icons.place_outlined,
                                      size: 12, color: scheme.primary),
                                  const SizedBox(width: 3),
                                  Flexible(
                                    child: Text(
                                      placeName,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: TextStyle(
                                          fontFamily: 'Outfit',
                                          fontSize: 11,
                                          color: scheme.primary),
                                    ),
                                  ),
                                ]),
                            ],
                          ),
                        ),
                      ),
                      menuButton(),
                    ],
                  ),

                  // Caption
                  if (caption.isNotEmpty) ...[
                    const SizedBox(height: 10),
                    Text(caption,
                        style: TextStyle(
                            fontFamily: 'Outfit',
                            fontSize: 14,
                            height: 1.4,
                            color: scheme.onSurface)),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
