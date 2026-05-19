import 'package:flutter/material.dart';
import 'package:smartur/l10n/app_localizations.dart';

import '../../core/theme/style_guide.dart';
import 'smartur_user_avatar.dart';

class PublicProfileSheet extends StatelessWidget {
  final Map<String, dynamic> author;

  const PublicProfileSheet({super.key, required this.author});

  /// API puede enviar `created_at` como String ISO o como otro tipo vía JSON.
  DateTime? _parseCreatedAt(dynamic raw) {
    if (raw == null) return null;
    if (raw is DateTime) return raw;
    if (raw is String) return DateTime.tryParse(raw);
    return DateTime.tryParse(raw.toString());
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final scheme = Theme.of(context).colorScheme;

    final name = author['name']?.toString() ?? l10n.defaultUserName;
    final photoUrl = author['photo_url'] as String?;
    final iconKey = author['avatar_icon_key'] as String?;
    
    // Si viene la fecha en el author, la parseamos.
    final createdAt = _parseCreatedAt(author['created_at']);
    String memberSince = '';
    if (createdAt != null) {
      memberSince = '${createdAt.month}/${createdAt.year}';
    }

    // Intereses (si vinieran, los parseamos como array de strings).
    List<String> interests = [];
    if (author['interests'] is List) {
      interests = (author['interests'] as List).map((e) => e.toString()).toList();
    }

    return SingleChildScrollView(
      padding: EdgeInsets.only(
        left: 24,
        top: 16,
        right: 24,
        bottom: 32 + MediaQuery.of(context).viewInsets.bottom,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Handle / Pill
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
          const SizedBox(height: SmarturStyle.spacingLg),
          
          // Avatar Centrado
          Center(
            child: Container(
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
                photoUrl: photoUrl,
                avatarIconKey: iconKey,
                displayName: name,
                backgroundColor: SmarturStyle.purple.withValues(alpha: 0.12),
                foregroundColor: scheme.onSurface,
              ),
            ),
          ),
          const SizedBox(height: SmarturStyle.spacingMd),
          
          // Nombre
          Text(
            name,
            textAlign: TextAlign.center,
            style: SmarturStyle.calSansTitle.copyWith(
              fontSize: 22,
              color: scheme.onSurface,
            ),
          ),
          
          // Member Since Pill
          if (memberSince.isNotEmpty) ...[
            const SizedBox(height: 10),
            Center(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: SmarturStyle.purple.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: SmarturStyle.purple.withValues(alpha: 0.25)),
                ),
                child: Text(
                  l10n.memberSince(memberSince),
                  style: const TextStyle(
                    fontFamily: 'Outfit',
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: SmarturStyle.purple,
                  ),
                ),
              ),
            ),
          ],
          
          if (interests.isNotEmpty) ...[
            const SizedBox(height: SmarturStyle.spacingLg),
            Text(
              l10n.myInterests,
              style: SmarturStyle.calSansTitle.copyWith(fontSize: 18),
              textAlign: TextAlign.left,
            ),
            const SizedBox(height: SmarturStyle.spacingSm),
            _buildInterestChips(interests),
          ],
        ],
      ),
    );
  }

  Widget _buildInterestChips(List<String> interests) {
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
      children: interests.asMap().entries.map((entry) {
        final color = colors[entry.key % colors.length];
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
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
