import 'package:flutter/material.dart';
import 'package:smartur/l10n/app_localizations.dart';
import '../../../core/theme/style_guide.dart';
import '../../../core/utils/notifications.dart';

/// Paso 2: Intereses, nivel de actividad, tipo de viaje y lugar preferido
class PreferencesStep2 extends StatefulWidget {
  final Map<String, dynamic> data;
  final VoidCallback onNext;
  final VoidCallback onBack;

  const PreferencesStep2({super.key, required this.data, required this.onNext, required this.onBack});

  @override
  State<PreferencesStep2> createState() => _PreferencesStep2State();
}

class _PreferencesStep2State extends State<PreferencesStep2> {
  List<Map<String, dynamic>> _interestOptions(AppLocalizations l10n) => [
    {'key': 'Cultura', 'label': l10n.interestCulture, 'icon': Icons.museum_outlined},
    {'key': 'Gastronomía', 'label': l10n.interestGastronomy, 'icon': Icons.restaurant_outlined},
    {'key': 'Aventura', 'label': l10n.interestAdventure, 'icon': Icons.terrain},
    {'key': 'Naturaleza', 'label': l10n.interestNature, 'icon': Icons.park_outlined},
    {'key': 'Historia', 'label': l10n.interestHistory, 'icon': Icons.account_balance_outlined},
    {'key': 'Fotografía', 'label': l10n.interestPhotography, 'icon': Icons.camera_alt_outlined},
    {'key': 'Deportes', 'label': l10n.interestSports, 'icon': Icons.sports_soccer},
    {'key': 'Bienestar', 'label': l10n.interestWellness, 'icon': Icons.spa_outlined},
    {'key': 'Arte', 'label': l10n.interestArt, 'icon': Icons.palette_outlined},
    {'key': 'Nightlife', 'label': l10n.interestNightlife, 'icon': Icons.nightlife},
  ];

  List<Map<String, String>> _activityOptions(AppLocalizations l10n) => [
    {'key': 'Bajo', 'label': l10n.activityLow},
    {'key': 'Moderado', 'label': l10n.activityModerate},
    {'key': 'Alto', 'label': l10n.activityHigh},
    {'key': 'Extremo', 'label': l10n.activityExtreme},
  ];

  List<Map<String, String>> _travelOptions(AppLocalizations l10n) => [
    {'key': 'Mochilero', 'label': l10n.travelBackpacker},
    {'key': 'Familiar', 'label': l10n.travelFamily},
    {'key': 'Lujo', 'label': l10n.travelLuxury},
    {'key': 'Aventura', 'label': l10n.travelAdventure},
    {'key': 'Romántico', 'label': l10n.travelRomantic},
    {'key': 'De negocios', 'label': l10n.travelBusiness},
  ];

  List<Map<String, String>> _placeOptions(AppLocalizations l10n) => [
    {'key': 'Playa', 'label': l10n.placeBeach},
    {'key': 'Montaña', 'label': l10n.placeMountain},
    {'key': 'Ciudad', 'label': l10n.placeCity},
    {'key': 'Campo', 'label': l10n.placeCountryside},
    {'key': 'Bosque', 'label': l10n.placeForest},
    {'key': 'Desierto', 'label': l10n.placeDesert},
  ];

  Set<String> _selectedInterests = {};
  String? _activityLevel;
  String? _travelType;
  String? _preferredPlace;

  @override
  void initState() {
    super.initState();
    final raw = widget.data['interests'];
    if (raw is String && raw.isNotEmpty) {
      _selectedInterests = raw.split(', ').toSet();
    } else if (raw is List) {
      _selectedInterests = raw.map((e) => e.toString()).toSet();
    }
    final rawActivity = widget.data['activity_level'];
    if (rawActivity is int) {
      if (rawActivity <= 1) {
        _activityLevel = 'Bajo';
      } else if (rawActivity <= 3) {
        _activityLevel = 'Moderado';
      } else if (rawActivity <= 4) {
        _activityLevel = 'Alto';
      } else {
        _activityLevel = 'Extremo';
      }
    } else {
      _activityLevel = rawActivity as String?;
    }
    _travelType = widget.data['travel_type'];
    _preferredPlace = widget.data['preferred_place'];
  }

  void _submit() {
    final l10n = AppLocalizations.of(context)!;
    if (_selectedInterests.isEmpty) {
      SmarturNotifications.showError(context, l10n.selectAtLeastOneInterest);
      return;
    }
    if (_activityLevel == null || _travelType == null || _preferredPlace == null) {
      SmarturNotifications.showError(context, l10n.completeAllFields);
      return;
    }
    int activityValue = 3;
    if (_activityLevel == 'Bajo') {
      activityValue = 1;
    } else if (_activityLevel == 'Moderado') {
      activityValue = 3;
    } else {
      activityValue = 5;
    }

    widget.data['interests'] = _selectedInterests.toList();
    widget.data['activity_level'] = activityValue;
    widget.data['travel_type'] = _travelType;
    widget.data['preferred_place'] = _preferredPlace;
    widget.onNext();
  }

  Widget _sectionLabel(String text, IconData icon) {
    final scheme = Theme.of(context).colorScheme;
    return Row(
      children: [
        Icon(icon, size: 18, color: SmarturStyle.purple),
        const SizedBox(width: 8),
        Text(text, style: TextStyle(fontFamily: 'Outfit', fontWeight: FontWeight.w600, color: scheme.onSurface, fontSize: 15)),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final l10n = AppLocalizations.of(context)!;
    final interests = _interestOptions(l10n);
    final activities = _activityOptions(l10n);
    final travels = _travelOptions(l10n);
    final places = _placeOptions(l10n);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          l10n.choosePreference,
          style: TextStyle(
            fontFamily: 'Outfit',
            fontSize: 13,
            color: scheme.onSurfaceVariant.withValues(alpha: 0.8),
            fontStyle: FontStyle.italic,
          ),
        ),
        const SizedBox(height: SmarturStyle.spacingSm),
        _sectionLabel(l10n.yourInterests, Icons.favorite_outline),
        const SizedBox(height: SmarturStyle.spacingSm),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: interests.map((item) {
            final selected = _selectedInterests.contains(item['key']);
            return FilterChip(
              avatar: Icon(item['icon'] as IconData, size: 16, color: selected ? Colors.white : SmarturStyle.purple),
              label: Text(item['label'] as String, style: TextStyle(fontFamily: 'Outfit', fontSize: 13, color: selected ? Colors.white : scheme.onSurface)),
              selected: selected,
              showCheckmark: false,
              selectedColor: SmarturStyle.purple,
              backgroundColor: SmarturStyle.purple.withValues(alpha: 0.1),
              checkmarkColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
                side: BorderSide(color: selected ? SmarturStyle.purple : SmarturStyle.purple.withValues(alpha: 0.2)),
              ),
              onSelected: (val) {
                setState(() {
                  if (val) {
                    _selectedInterests.add(item['key'] as String);
                  } else {
                    _selectedInterests.remove(item['key'] as String);
                  }
                });
              },
            );
          }).toList(),
        ),
        const SizedBox(height: SmarturStyle.spacingLg),

        _sectionLabel(l10n.activityLevel, Icons.bolt_outlined),
        const SizedBox(height: SmarturStyle.spacingSm),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: activities.map((item) {
            final selected = _activityLevel == item['key'];
            return ChoiceChip(
              label: Text(item['label']!, style: TextStyle(fontFamily: 'Outfit', color: selected ? Colors.white : scheme.onSurface)),
              selected: selected,
              showCheckmark: false,
              selectedColor: SmarturStyle.pink,
              backgroundColor: SmarturStyle.pink.withValues(alpha: 0.1),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
                side: BorderSide(color: selected ? SmarturStyle.pink : SmarturStyle.pink.withValues(alpha: 0.2)),
              ),
              onSelected: (_) => setState(() => _activityLevel = item['key']),
            );
          }).toList(),
        ),
        const SizedBox(height: SmarturStyle.spacingLg),

        _sectionLabel(l10n.travelType, Icons.luggage_outlined),
        const SizedBox(height: SmarturStyle.spacingSm),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: travels.map((item) {
            final selected = _travelType == item['key'];
            return ChoiceChip(
              label: Text(item['label']!, style: TextStyle(fontFamily: 'Outfit', color: selected ? Colors.white : scheme.onSurface)),
              selected: selected,
              showCheckmark: false,
              selectedColor: SmarturStyle.blue,
              backgroundColor: SmarturStyle.blue.withValues(alpha: 0.1),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
                side: BorderSide(color: selected ? SmarturStyle.blue : SmarturStyle.blue.withValues(alpha: 0.2)),
              ),
              onSelected: (_) => setState(() => _travelType = item['key']),
            );
          }).toList(),
        ),
        const SizedBox(height: SmarturStyle.spacingLg),

        _sectionLabel(l10n.preferredPlace, Icons.place_outlined),
        const SizedBox(height: SmarturStyle.spacingSm),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: places.map((item) {
            final selected = _preferredPlace == item['key'];
            return ChoiceChip(
              label: Text(item['label']!, style: TextStyle(fontFamily: 'Outfit', color: selected ? Colors.white : scheme.onSurface)),
              selected: selected,
              showCheckmark: false,
              selectedColor: SmarturStyle.green,
              backgroundColor: SmarturStyle.green.withValues(alpha: 0.1),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
                side: BorderSide(color: selected ? SmarturStyle.green : SmarturStyle.green.withValues(alpha: 0.2)),
              ),
              onSelected: (_) => setState(() => _preferredPlace = item['key']),
            );
          }).toList(),
        ),
        const SizedBox(height: SmarturStyle.spacingXl),

        Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: widget.onBack,
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: SmarturStyle.purple),
                  minimumSize: const Size(double.infinity, SmarturStyle.touchTargetComfortable),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: Text(l10n.back, style: const TextStyle(color: SmarturStyle.purple, fontFamily: 'Outfit')),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: ElevatedButton(
                onPressed: _submit,
                child: Text(l10n.next),
              ),
            ),
          ],
        ),
      ],
    );
  }
}
