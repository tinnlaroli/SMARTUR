import 'package:flutter/material.dart';
import 'package:smartur/l10n/app_localizations.dart';
import '../../../core/theme/style_guide.dart';

/// Paso 3: Accesibilidad, restricciones, preferencias sostenibles, visita previa
class PreferencesStep3 extends StatefulWidget {
  final Map<String, dynamic> data;
  final VoidCallback onBack;
  final Future<void> Function() onSubmit;
  final bool isLoading;

  const PreferencesStep3({
    super.key,
    required this.data,
    required this.onBack,
    required this.onSubmit,
    required this.isLoading,
  });

  @override
  State<PreferencesStep3> createState() => _PreferencesStep3State();
}

class _PreferencesStep3State extends State<PreferencesStep3> {
  bool _hasAccessibility = false;
  bool _hasVisitedBefore = false;
  final _accessibilityDetailController = TextEditingController();
  final _restrictionsController = TextEditingController();
  String? _sustainablePreference;

  static const List<String> _sustainableKeys = [
    'Sin preferencia',
    'Baja prioridad',
    'Prioridad media',
    'Alta prioridad',
  ];

  Map<String, String> _sustainableLabels(AppLocalizations l10n) => {
    'Sin preferencia': l10n.sustainableNoPref,
    'Baja prioridad': l10n.sustainableLow,
    'Prioridad media': l10n.sustainableMedium,
    'Alta prioridad': l10n.sustainableHigh,
  };

  @override
  void initState() {
    super.initState();
    _hasAccessibility = widget.data['has_accessibility'] as bool? ?? false;
    _hasVisitedBefore = widget.data['has_visited_before'] as bool? ?? false;
    _accessibilityDetailController.text = widget.data['accessibility_detail'] as String? ?? '';
    final rawRestrictions = widget.data['restrictions'];
    _restrictionsController.text = rawRestrictions as String? ?? '';
    final rawSustainable = widget.data['sustainable_preferences'];
    if (rawSustainable is bool) {
      _sustainablePreference = rawSustainable ? 'Alta prioridad' : 'Sin preferencia';
    } else {
      _sustainablePreference = rawSustainable as String?;
    }
    _sustainablePreference = widget.data['sustainable_preferences'] is bool
        ? (widget.data['sustainable_preferences'] ? 'Alta prioridad' : 'Sin preferencia')
        : widget.data['sustainable_preferences'];
  }

  @override
  void dispose() {
    _accessibilityDetailController.dispose();
    _restrictionsController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    widget.data['has_accessibility'] = _hasAccessibility;
    widget.data['accessibility_detail'] = _hasAccessibility ? _accessibilityDetailController.text.trim() : null;
    widget.data['has_visited_before'] = _hasVisitedBefore;
    final restrictionsText = _restrictionsController.text.trim();
    widget.data['restrictions'] = restrictionsText.isEmpty ? 'Ninguna' : restrictionsText;
    widget.data['sustainable_preferences'] = _sustainablePreference != 'Sin preferencia';
    await widget.onSubmit();
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final l10n = AppLocalizations.of(context)!;
    final sustainableLabels = _sustainableLabels(l10n);

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
        _SwitchTile(
          icon: Icons.accessible_forward,
          iconColor: SmarturStyle.blue,
          title: l10n.needAccessibility,
          subtitle: l10n.accessibilitySubtitle,
          value: _hasAccessibility,
          onChanged: (v) => setState(() => _hasAccessibility = v),
        ),
        if (_hasAccessibility) ...[
          const SizedBox(height: SmarturStyle.spacingSm),
          TextFormField(
            controller: _accessibilityDetailController,
            maxLines: 2,
            decoration: InputDecoration(
              labelText: l10n.describeNeedOptional,
              hintText: l10n.accessibilityHint,
              prefixIcon: const Icon(Icons.edit_outlined, color: SmarturStyle.blue),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
        ],
        const SizedBox(height: SmarturStyle.spacingMd),

        _SwitchTile(
          icon: Icons.history_outlined,
          iconColor: SmarturStyle.orange,
          title: l10n.visitedHighMountains,
          subtitle: l10n.visitedSubtitle,
          value: _hasVisitedBefore,
          onChanged: (v) => setState(() => _hasVisitedBefore = v),
        ),
        const SizedBox(height: SmarturStyle.spacingMd),

        TextFormField(
          controller: _restrictionsController,
          maxLines: 2,
          decoration: InputDecoration(
            labelText: l10n.dietaryRestrictions,
            hintText: l10n.dietaryHint,
            prefixIcon: const Icon(Icons.no_food_outlined, color: SmarturStyle.pink),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
        const SizedBox(height: SmarturStyle.spacingLg),

        Row(
          children: [
            const Icon(Icons.eco_outlined, size: 18, color: SmarturStyle.green),
            const SizedBox(width: 8),
            Text(l10n.sustainablePreferences, style: TextStyle(fontFamily: 'Outfit', fontWeight: FontWeight.w600, color: scheme.onSurface, fontSize: 15)),
          ],
        ),
        const SizedBox(height: SmarturStyle.spacingSm),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _sustainableKeys.map((key) {
            final selected = _sustainablePreference == key;
            final label = sustainableLabels[key] ?? key;
            return ChoiceChip(
              label: Text(label, style: TextStyle(fontFamily: 'Outfit', color: selected ? Colors.white : scheme.onSurface, fontSize: 13)),
              selected: selected,
              color: WidgetStateProperty.resolveWith((states) =>
                  states.contains(WidgetState.selected) ? SmarturStyle.green : SmarturStyle.green.withValues(alpha: 0.1)),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
                side: BorderSide(color: selected ? SmarturStyle.green : SmarturStyle.green.withValues(alpha: 0.2)),
              ),
              onSelected: (_) => setState(() => _sustainablePreference = key),
            );
          }).toList(),
        ),
        const SizedBox(height: SmarturStyle.spacingXl),

        Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: widget.isLoading ? null : widget.onBack,
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
                onPressed: widget.isLoading ? null : _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: SmarturStyle.purple,
                  disabledBackgroundColor: SmarturStyle.purple.withValues(alpha: 0.6),
                ),
                child: widget.isLoading
                    ? Text(
                        '…',
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.92),
                          fontSize: 20,
                          fontWeight: FontWeight.w600,
                          fontFamily: 'Outfit',
                        ),
                      )
                    : Text(l10n.save),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _SwitchTile extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String title;
  final String subtitle;
  final bool value;
  final ValueChanged<bool> onChanged;

  const _SwitchTile({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.subtitle,
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: value ? iconColor.withValues(alpha: 0.1) : scheme.surfaceContainerHighest.withValues(alpha: 0.4),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: value ? iconColor.withValues(alpha: 0.4) : scheme.outlineVariant),
      ),
      child: Row(
        children: [
          Icon(icon, color: iconColor, size: 22),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: TextStyle(fontFamily: 'Outfit', fontWeight: FontWeight.w600, fontSize: 13, color: scheme.onSurface)),
                Text(subtitle, style: TextStyle(fontFamily: 'Outfit', fontSize: 11, color: scheme.onSurfaceVariant)),
              ],
            ),
          ),
          Switch(
            value: value,
            onChanged: onChanged,
            activeThumbColor: iconColor,
            activeTrackColor: iconColor.withValues(alpha: 0.3),
          ),
        ],
      ),
    );
  }
}
