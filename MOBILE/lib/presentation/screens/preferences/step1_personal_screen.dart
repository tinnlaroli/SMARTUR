import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:smartur/l10n/app_localizations.dart';

import '../../../core/theme/style_guide.dart';
import '../../../core/utils/notifications.dart';

/// Paso 1: Datos personales (fecha de nacimiento, rango de edad, género)
class PreferencesStep1 extends StatefulWidget {
  final Map<String, dynamic> data;
  final VoidCallback onNext;

  const PreferencesStep1({super.key, required this.data, required this.onNext});

  @override
  State<PreferencesStep1> createState() => _PreferencesStep1State();
}

class _PreferencesStep1State extends State<PreferencesStep1> {
  final _formKey = GlobalKey<FormState>();

  DateTime? _selectedBirthDate;
  String? _selectedGender;

  List<Map<String, dynamic>> _genderOptions(AppLocalizations l10n) => [
        {'key': 'Masculino', 'label': l10n.genderMale, 'icon': Icons.male},
        {'key': 'Femenino', 'label': l10n.genderFemale, 'icon': Icons.female},
        {'key': 'No binario', 'label': l10n.genderNonBinary, 'icon': Icons.transgender},
        {'key': 'Prefiero no decir', 'label': l10n.genderPreferNotToSay, 'icon': Icons.remove_circle_outline},
      ];

  static int _ageFromBirthday(DateTime birth) {
    final now = DateTime.now();
    var age = now.year - birth.year;
    if (now.month < birth.month || (now.month == birth.month && now.day < birth.day)) {
      age--;
    }
    return age;
  }

  static String _toIsoDate(DateTime d) {
    return '${d.year.toString().padLeft(4, '0')}-'
        '${d.month.toString().padLeft(2, '0')}-'
        '${d.day.toString().padLeft(2, '0')}';
  }

  void _syncFromParentData() {
    final raw = widget.data['birth_date'];
    if (raw is String && raw.isNotEmpty) {
      final parsed = DateTime.tryParse(raw);
      if (parsed != null) {
        _selectedBirthDate = DateTime(parsed.year, parsed.month, parsed.day);
      } else {
        _selectedBirthDate = null;
      }
    } else {
      _selectedBirthDate = null;
    }
    _selectedGender = widget.data['gender'] as String?;
  }

  @override
  void initState() {
    super.initState();
    _syncFromParentData();
  }

  @override
  void didUpdateWidget(covariant PreferencesStep1 oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.data['birth_date'] != oldWidget.data['birth_date'] ||
        widget.data['gender'] != oldWidget.data['gender']) {
      setState(_syncFromParentData);
    }
  }

  Future<void> _pickBirthDate() async {
    final l10n = AppLocalizations.of(context)!;
    final locale = Localizations.localeOf(context);
    final now = DateTime.now();
    final lastDate = DateTime(now.year - 10, now.month, now.day);
    final firstDate = DateTime(1900);
    final initial = _selectedBirthDate ?? DateTime(now.year - 18, now.month, now.day);

    final picked = await showDatePicker(
      context: context,
      initialDate: initial.isBefore(firstDate)
          ? firstDate
          : (initial.isAfter(lastDate) ? lastDate : initial),
      firstDate: firstDate,
      lastDate: lastDate,
      helpText: l10n.birthYear,
      locale: locale,
    );
    if (picked != null) {
      setState(() => _selectedBirthDate = DateTime(picked.year, picked.month, picked.day));
    }
  }

  void _submit() {
    final l10n = AppLocalizations.of(context)!;
    if (_selectedBirthDate == null) {
      SmarturNotifications.showError(context, l10n.enterBirthYear);
      return;
    }
    if (!_formKey.currentState!.validate()) return;
    if (_selectedGender == null) {
      SmarturNotifications.showError(context, l10n.selectGender);
      return;
    }

    final birth = _selectedBirthDate!;
    if (!_isValidBirthDate(birth)) {
      SmarturNotifications.showError(context, l10n.invalidYear);
      return;
    }

    final age = _ageFromBirthday(birth);

    String ageRange = '18-30';
    if (age < 18) {
      ageRange = 'Menor de 18';
    } else if (age <= 30) {
      ageRange = '18-30';
    } else if (age <= 45) {
      ageRange = '31-45';
    } else if (age <= 60) {
      ageRange = '46-60';
    } else {
      ageRange = 'Mayor de 60';
    }

    widget.data['birth_date'] = _toIsoDate(birth);
    widget.data['age'] = age;
    widget.data['age_range'] = ageRange;
    widget.data['gender'] = _selectedGender;
    widget.onNext();
  }

  bool _isValidBirthDate(DateTime birth) {
    final now = DateTime.now();
    final lastAllowed = DateTime(now.year - 10, now.month, now.day);
    if (birth.isAfter(lastAllowed)) return false;
    if (birth.year < 1900) return false;
    if (birth.isAfter(now)) return false;
    return true;
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final l10n = AppLocalizations.of(context)!;
    final genders = _genderOptions(l10n);
    final locale = Localizations.localeOf(context);

    return Form(
      key: _formKey,
      child: Column(
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
          Semantics(
            button: true,
            label: l10n.birthYear,
            child: InkWell(
              onTap: _pickBirthDate,
              borderRadius: BorderRadius.circular(12),
              child: InputDecorator(
                decoration: InputDecoration(
                  labelText: l10n.birthYear,
                  prefixIcon: const Icon(Icons.calendar_today_outlined, color: SmarturStyle.purple),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  errorText: _selectedBirthDate != null && !_isValidBirthDate(_selectedBirthDate!)
                      ? l10n.invalidYear
                      : null,
                ),
                child: Text(
                  _selectedBirthDate != null
                      ? DateFormat('dd / MM / yyyy', locale.toString()).format(_selectedBirthDate!)
                      : l10n.dateFormatPlaceholder,
                  style: TextStyle(
                    fontFamily: 'Outfit',
                    color: _selectedBirthDate != null ? scheme.onSurface : scheme.onSurfaceVariant,
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: SmarturStyle.spacingLg),

          Text(
            l10n.gender,
            style: TextStyle(fontFamily: 'Outfit', fontWeight: FontWeight.w600, color: scheme.onSurface),
          ),
          const SizedBox(height: SmarturStyle.spacingSm),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: genders.map((g) {
              final selected = _selectedGender == g['key'];
              return ChoiceChip(
                avatar: Icon(g['icon'] as IconData, size: 18, color: selected ? Colors.white : SmarturStyle.purple),
                label: Text(g['label'] as String, style: TextStyle(fontFamily: 'Outfit', color: selected ? Colors.white : scheme.onSurface)),
                selected: selected,
                showCheckmark: false,
                selectedColor: SmarturStyle.purple,
                backgroundColor: SmarturStyle.purple.withValues(alpha: 0.1),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),
                  side: BorderSide(color: selected ? SmarturStyle.purple : SmarturStyle.purple.withValues(alpha: 0.2)),
                ),
                onSelected: (_) => setState(() => _selectedGender = g['key'] as String),
              );
            }).toList(),
          ),
          const SizedBox(height: SmarturStyle.spacingXl),

          ElevatedButton(
            onPressed: _submit,
            child: Text(l10n.next),
          ),
        ],
      ),
    );
  }
}
