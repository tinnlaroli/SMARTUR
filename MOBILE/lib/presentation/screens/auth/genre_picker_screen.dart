import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:smartur/l10n/app_localizations.dart';

import '../../../core/motion/smartur_routes.dart';
import '../../../core/theme/style_guide.dart';
import '../../widgets/smartur_background.dart';
import '../main/main_screen.dart';

/// Nuevo onboarding de géneros — reemplaza el flujo de 3 pasos.
/// Se muestra la primera vez que el usuario hace login (isNewLogin = true).
/// Grid de chips visuales: elige 1-3 temas. Guarda en SharedPreferences.
class GenrePickerScreen extends StatefulWidget {
  final String? userName;

  const GenrePickerScreen({super.key, this.userName});

  @override
  State<GenrePickerScreen> createState() => _GenrePickerScreenState();
}

class _GenrePickerScreenState extends State<GenrePickerScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _fadeIn;
  late Animation<Offset> _slideIn;

  final Set<String> _selected = {};

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    )..forward();
    _fadeIn = CurvedAnimation(parent: _ctrl, curve: Curves.easeOut);
    _slideIn = Tween<Offset>(
      begin: const Offset(0, 0.15),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeOutCubic));
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  Future<void> _continue() async {
    HapticFeedback.lightImpact();
    if (_selected.isNotEmpty) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setStringList('interests', _selected.toList());
    }
    if (!mounted) return;
    Navigator.pushReplacement(
      context,
      smarturFadeRoute(MainScreen(userName: widget.userName, isNewLogin: true)),
    );
  }

  void _toggle(String key) {
    HapticFeedback.selectionClick();
    setState(() {
      if (_selected.contains(key)) {
        _selected.remove(key);
      } else if (_selected.length < 3) {
        _selected.add(key);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final scheme = Theme.of(context).colorScheme;

    final genres = _buildGenres(l10n);

    return Scaffold(
      backgroundColor: scheme.surface,
      body: SmarturBackground(
        opacity: 0.5,
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 32),
                FadeTransition(
                  opacity: _fadeIn,
                  child: SlideTransition(
                    position: _slideIn,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          l10n.genrePickerTitle,
                          style: SmarturStyle.calSansTitle.copyWith(fontSize: 28),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          l10n.genrePickerSubtitle,
                          style: TextStyle(
                            fontFamily: 'Outfit',
                            fontSize: 15,
                            color: scheme.onSurfaceVariant,
                            height: 1.4,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 32),
                Expanded(
                  child: FadeTransition(
                    opacity: _fadeIn,
                    child: GridView.builder(
                      physics: const NeverScrollableScrollPhysics(),
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        mainAxisSpacing: 14,
                        crossAxisSpacing: 14,
                        childAspectRatio: 1.5,
                      ),
                      itemCount: genres.length,
                      itemBuilder: (_, i) {
                        final g = genres[i];
                        final selected = _selected.contains(g.key);
                        return _GenreChip(
                          emoji: g.emoji,
                          label: g.label,
                          color: g.color,
                          selected: selected,
                          onTap: () => _toggle(g.key),
                        );
                      },
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                // Indicator
                FadeTransition(
                  opacity: _fadeIn,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(3, (i) {
                      final filled = i < _selected.length;
                      return AnimatedContainer(
                        duration: const Duration(milliseconds: 250),
                        curve: Curves.easeOutCubic,
                        margin: const EdgeInsets.symmetric(horizontal: 4),
                        width: filled ? 28 : 10,
                        height: 10,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(8),
                          color: filled
                              ? SmarturStyle.purple
                              : scheme.outlineVariant.withValues(alpha: 0.4),
                        ),
                      );
                    }),
                  ),
                ),
                const SizedBox(height: 20),
                FadeTransition(
                  opacity: _fadeIn,
                  child: ElevatedButton(
                    onPressed: _selected.isNotEmpty ? _continue : null,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: SmarturStyle.purple,
                      disabledBackgroundColor:
                          SmarturStyle.purple.withValues(alpha: 0.3),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16)),
                    ),
                    child: Text(
                      l10n.genrePickerContinue,
                      style: const TextStyle(
                        fontFamily: 'CalSans',
                        fontSize: 17,
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                TextButton(
                  onPressed: _continue,
                  child: Text(
                    l10n.genrePickerSkip,
                    style: TextStyle(
                      fontFamily: 'Outfit',
                      color: scheme.onSurfaceVariant,
                      fontSize: 14,
                    ),
                  ),
                ),
                const SizedBox(height: 8),
              ],
            ),
          ),
        ),
      ),
    );
  }

  List<_GenreData> _buildGenres(AppLocalizations l10n) => [
        _GenreData('nature',     '🌿', l10n.genreNature,      SmarturStyle.green),
        _GenreData('adventure',  '🏔️', l10n.genreAdventure,   SmarturStyle.blue),
        _GenreData('gastronomy', '🍽️', l10n.genreGastronomy,  SmarturStyle.orange),
        _GenreData('culture',    '🎭', l10n.genreCulture,     SmarturStyle.purple),
        _GenreData('relax',      '🌅', l10n.genreRelax,       SmarturStyle.pink),
        _GenreData('history',    '🏛️', l10n.genreHistory,     SmarturStyle.blue),
      ];
}

class _GenreData {
  final String key;
  final String emoji;
  final String label;
  final Color color;

  const _GenreData(this.key, this.emoji, this.label, this.color);
}

class _GenreChip extends StatelessWidget {
  final String emoji;
  final String label;
  final Color color;
  final bool selected;
  final VoidCallback onTap;

  const _GenreChip({
    required this.emoji,
    required this.label,
    required this.color,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeOutCubic,
        decoration: BoxDecoration(
          color: selected
              ? color.withValues(alpha: 0.15)
              : scheme.surfaceContainerHighest.withValues(alpha: 0.4),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: selected
                ? color.withValues(alpha: 0.7)
                : scheme.outlineVariant.withValues(alpha: 0.5),
            width: selected ? 2 : 1,
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            AnimatedDefaultTextStyle(
              duration: const Duration(milliseconds: 200),
              style: TextStyle(
                fontSize: selected ? 30 : 26,
              ),
              child: Text(emoji),
            ),
            const SizedBox(height: 6),
            Text(
              label,
              style: TextStyle(
                fontFamily: 'Outfit',
                fontSize: 13,
                fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                color: selected ? color : scheme.onSurface,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
