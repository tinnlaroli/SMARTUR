import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:smartur/l10n/app_localizations.dart';

import '../../../core/constants/avatar_icon_map.dart';
import '../../../core/theme/style_guide.dart';
import '../../../core/utils/notifications.dart';
import '../../../core/utils/profile_photo_validation.dart';
import '../../../data/services/auth_service.dart';
import '../../widgets/smartur_background.dart';
import '../../widgets/smartur_skeleton.dart';
import '../../widgets/smartur_user_avatar.dart';

/// Cambiar icono de perfil o subir foto (API).
class EditProfileAvatarScreen extends StatefulWidget {
  const EditProfileAvatarScreen({super.key});

  @override
  State<EditProfileAvatarScreen> createState() => _EditProfileAvatarScreenState();
}

class _EditProfileAvatarScreenState extends State<EditProfileAvatarScreen> {
  final AuthService _auth = AuthService();
  final ImagePicker _picker = ImagePicker();

  String _name = '';
  String? _photoUrl;
  String? _iconKey;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final profile = await _auth.getUserProfile();
    final name = profile?['name'] ?? await _auth.getUserName() ?? '';
    setState(() {
      _name = name;
      _photoUrl = profile?['photo_url'] as String?;
      _iconKey = profile?['avatar_icon_key'] as String?;
    });
  }

  Future<void> _pickAndUpload(ImageSource source) async {
    final l10n = AppLocalizations.of(context)!;
    final x = await _picker.pickImage(
      source: source,
      maxWidth: 1600,
      maxHeight: 1600,
      imageQuality: 88,
      requestFullMetadata: true,
    );
    if (x == null || !mounted) return;

    final bytes = await x.readAsBytes();
    final issue = ProfilePhotoValidation.validate(
      bytes: bytes,
      filename: x.name,
      platformMime: x.mimeType,
    );
    if (issue != ProfilePhotoIssue.none) {
      if (!mounted) return;
      if (issue == ProfilePhotoIssue.tooLarge) {
        SmarturNotifications.showError(context, l10n.profilePhotoTooLarge);
      } else {
        SmarturNotifications.showError(context, l10n.profilePhotoInvalidFormat);
      }
      return;
    }

    setState(() => _busy = true);
    try {
      await _auth.uploadAvatarImage(
        bytes,
        x.name,
        platformMime: x.mimeType,
      );
      if (mounted) SmarturNotifications.showSuccess(context, l10n.profileReady);
      await _load();
    } on AuthException catch (e) {
      if (mounted) SmarturNotifications.showError(context, e.message);
    } catch (e) {
      if (!mounted) return;
      SmarturNotifications.showError(context, e.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _setIcon(String key) async {
    final l10n = AppLocalizations.of(context)!;
    setState(() => _busy = true);
    try {
      await _auth.updateUser({'avatar_icon_key': key, 'photo_url': null});
      if (mounted) SmarturNotifications.showSuccess(context, l10n.profileReady);
      await _load();
    } on AuthException catch (e) {
      if (mounted) SmarturNotifications.showError(context, e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _clearPhoto() async {
    final l10n = AppLocalizations.of(context)!;
    setState(() => _busy = true);
    try {
      await _auth.updateUser({'photo_url': null});
      if (mounted) SmarturNotifications.showSuccess(context, l10n.profileReady);
      await _load();
    } on AuthException catch (e) {
      if (mounted) SmarturNotifications.showError(context, e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      backgroundColor: scheme.surface,
      appBar: AppBar(
        title: Text(l10n.editProfile, style: SmarturStyle.calSansTitle.copyWith(fontSize: 20)),
        elevation: 0,
        backgroundColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
      ),
      body: SmarturBackgroundTop(
        child: SmarturShimmer(
        enabled: _busy,
        child: _busy
            ? ListView(
                padding: const EdgeInsets.all(20),
                children: [
                  const Center(child: SkeletonCircle(size: 96)),
                  const SizedBox(height: 24),
                  const SkeletonText(width: double.infinity, height: 14),
                  const SizedBox(height: 8),
                  const SkeletonText(width: double.infinity, height: 12),
                  const SizedBox(height: 8),
                  const SkeletonText(width: 260, height: 12),
                  const SizedBox(height: 24),
                  Row(
                    children: const [
                      Expanded(
                        child: SkeletonContainer(height: 48, borderRadius: 16),
                      ),
                      SizedBox(width: 10),
                      Expanded(
                        child: SkeletonContainer(height: 48, borderRadius: 16),
                      ),
                    ],
                  ),
                  const SizedBox(height: 28),
                  const SkeletonText(width: 140, height: 18),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 12,
                    runSpacing: 12,
                    children: const [
                      SkeletonContainer(width: 64, height: 64, borderRadius: 16),
                      SkeletonContainer(width: 64, height: 64, borderRadius: 16),
                      SkeletonContainer(width: 64, height: 64, borderRadius: 16),
                      SkeletonContainer(width: 64, height: 64, borderRadius: 16),
                    ],
                  ),
                ],
              )
            : ListView(
              padding: const EdgeInsets.all(20),
              children: [
                Center(
                  child: SmarturUserAvatar(
                    photoUrl: _photoUrl,
                    avatarIconKey: _iconKey,
                    displayName: _name,
                    radius: 48,
                    backgroundColor: SmarturStyle.purple.withValues(alpha: 0.12),
                    foregroundColor: SmarturStyle.purple,
                  ),
                ),
                const SizedBox(height: 24),
                Text(
                  l10n.editProfileSubtitle,
                  style: TextStyle(fontFamily: 'Outfit', color: scheme.onSurfaceVariant),
                ),
                const SizedBox(height: 8),
                Text(
                  l10n.profilePhotoFormatsHint,
                  style: TextStyle(
                    fontFamily: 'Outfit',
                    fontSize: 12,
                    color: scheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: FilledButton.icon(
                        onPressed: () => _pickAndUpload(ImageSource.gallery),
                        icon: const Icon(Icons.photo_library_outlined),
                        label: Text(l10n.profileOpenGallery, style: const TextStyle(fontFamily: 'Outfit')),
                        style: FilledButton.styleFrom(backgroundColor: SmarturStyle.purple),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => _pickAndUpload(ImageSource.camera),
                        icon: Icon(Icons.photo_camera_outlined, color: scheme.onSurface),
                        label: Text(l10n.profileOpenCamera, style: const TextStyle(fontFamily: 'Outfit')),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: scheme.onSurface,
                          side: BorderSide(color: scheme.outlineVariant),
                        ),
                      ),
                    ),
                  ],
                ),
                if (_photoUrl != null && _photoUrl!.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  TextButton(
                    onPressed: _clearPhoto,
                    child: Text(
                      l10n.removeProfilePhoto,
                      style: TextStyle(color: scheme.error, fontFamily: 'Outfit'),
                    ),
                  ),
                ],
                const SizedBox(height: 28),
                Text(
                  l10n.accountSection,
                  style: SmarturStyle.calSansTitle.copyWith(fontSize: 18),
                ),
                const SizedBox(height: 8),
                Text(
                  l10n.avatarIconsSectionHint,
                  style: TextStyle(fontFamily: 'Outfit', fontSize: 12, color: scheme.onSurfaceVariant),
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 12,
                  runSpacing: 12,
                  children: kAllowedAvatarIconKeys.map((key) {
                    final icon = iconForAvatarKey(key);
                    final selected = _iconKey == key;
                    return InkWell(
                      onTap: () => _setIcon(key),
                      borderRadius: BorderRadius.circular(16),
                      child: Container(
                        width: 64,
                        height: 64,
                        decoration: BoxDecoration(
                          color: selected
                              ? SmarturStyle.purple.withValues(alpha: 0.2)
                              : scheme.surfaceContainerHighest,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: selected ? SmarturStyle.purple : scheme.outlineVariant,
                            width: selected ? 2 : 1,
                          ),
                        ),
                        child: icon != null
                            ? Icon(icon, color: SmarturStyle.purple, size: 32)
                            : const SizedBox.shrink(),
                      ),
                    );
                  }).toList(),
                ),
              ],
            ),
      ),
      ),
    );
  }
}
