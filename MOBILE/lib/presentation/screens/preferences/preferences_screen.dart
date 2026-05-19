import 'package:flutter/material.dart';
import 'package:smartur/l10n/app_localizations.dart';
import '../../widgets/smartur_background.dart';
import '../../widgets/smartur_skeleton.dart';

import '../../../core/theme/style_guide.dart';
import '../../../core/utils/notifications.dart';
import '../../../data/services/auth_service.dart';
import '../../../data/services/profile_service.dart';
import '../main/main_screen.dart';
import 'step1_personal_screen.dart';
import 'step2_interests_screen.dart';
import 'step3_extra_screen.dart';

/// Pantalla de onboarding de preferencias del viajero (primera vez).
/// Muestra un formulario de 3 pasos con indicador de progreso superior.
class PreferencesScreen extends StatefulWidget {
  final String? userName;

  const PreferencesScreen({super.key, this.userName});

  @override
  State<PreferencesScreen> createState() => _PreferencesScreenState();
}

class _PreferencesScreenState extends State<PreferencesScreen>
    with TickerProviderStateMixin {
  int _currentStep = 0;
  bool _isLoading = false;

  // Shared mutable map passed to all steps
  final Map<String, dynamic> _data = {};

  late final AnimationController _progressController;

  static const int _totalSteps = 3;

  List<StepMeta> _getSteps(AppLocalizations l10n) => [
    StepMeta(title: l10n.stepAboutYou, subtitle: l10n.stepAboutYouSubtitle, icon: Icons.person_outline),
    StepMeta(title: l10n.stepYourTastes, subtitle: l10n.stepYourTastesSubtitle, icon: Icons.favorite_outline),
    StepMeta(title: l10n.stepDetails, subtitle: l10n.stepDetailsSubtitle, icon: Icons.tune_outlined),
  ];

  @override
  void initState() {
    super.initState();
    _progressController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    )..animateTo(1 / _totalSteps);
    _loadExistingPreferences();
  }

  /// Rellena [_data] desde GET /profiles/me (fecha en usuario, resto en traveler_profile).
  Future<void> _loadExistingPreferences() async {
    final map = await ProfileService.fetchMyProfileForPreferences();
    if (!mounted || map.isEmpty) return;
    setState(() => _data.addAll(map));
  }

  @override
  void dispose() {
    _progressController.dispose();
    super.dispose();
  }

  void _goNext() {
    setState(() => _currentStep++);
    _progressController.animateTo((_currentStep + 1) / _totalSteps);
  }

  void _goBack() {
    if (_currentStep == 0) return;
    setState(() => _currentStep--);
    _progressController.animateTo((_currentStep + 1) / _totalSteps);
  }

  Future<void> _submit() async {
    setState(() => _isLoading = true);
    try {
      final l10n = AppLocalizations.of(context)!;
      final authService = AuthService();
      final token = await authService.getToken();
      if (token == null) {
        if (mounted) SmarturNotifications.showError(context, l10n.sessionExpiredPreferences);
        return;
      }

      final success = await ProfileService.savePreferences(token, _data);
      if (!mounted) return;

      if (success) {
        SmarturNotifications.showSuccess(context, l10n.profileReady);
        await Future.delayed(const Duration(milliseconds: 600));
        if (!mounted) return;
        Navigator.pushAndRemoveUntil(
          context,
          MaterialPageRoute(builder: (_) => MainScreen(userName: widget.userName, isNewLogin: true)),
          (_) => false,
        );
      } else {
        SmarturNotifications.showError(context, l10n.couldNotSavePreferences);
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final l10n = AppLocalizations.of(context)!;
    final steps = _getSteps(l10n);
    return Scaffold(
      backgroundColor: scheme.surface,
      body: SmarturBackgroundTop(
        child: SafeArea(
          child: Column(
            children: [
              // ── Header con progreso ────────────────────────────────────
              Padding(
                padding: const EdgeInsets.fromLTRB(
                  SmarturStyle.spacingLg,
                  SmarturStyle.spacingMd,
                  SmarturStyle.spacingLg,
                  0,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(l10n.appTitle, style: TextStyle(fontFamily: 'CalSans', fontSize: 18, color: scheme.onSurface)),
                        const Spacer(),
                        Text(
                          l10n.stepXOfY(_currentStep + 1, _totalSteps),
                          style: TextStyle(fontFamily: 'Outfit', color: scheme.onSurfaceVariant, fontSize: 13),
                        ),
                        const SizedBox(width: 8),
                        IconButton(
                          onPressed: () => Navigator.pop(context),
                          icon: Icon(Icons.close, color: scheme.onSurfaceVariant, size: 20),
                          constraints: const BoxConstraints(),
                          padding: EdgeInsets.zero,
                        ),
                      ],
                    ),
                    const SizedBox(height: SmarturStyle.spacingMd),

                    AnimatedBuilder(
                      animation: _progressController,
                      builder: (context, child) => ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: LinearProgressIndicator(
                          value: _progressController.value,
                          minHeight: 6,
                          backgroundColor: scheme.outlineVariant,
                          valueColor: const AlwaysStoppedAnimation<Color>(SmarturStyle.purple),
                        ),
                      ),
                    ),
                    const SizedBox(height: SmarturStyle.spacingMd),

                    Row(
                      children: List.generate(_totalSteps, (i) {
                        final active = i == _currentStep;
                        final done = i < _currentStep;
                        final isLast = i == _totalSteps - 1;

                        Widget stepCircle = AnimatedContainer(
                          duration: const Duration(milliseconds: 300),
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: active
                                ? SmarturStyle.purple
                                : done
                                    ? SmarturStyle.green
                                    : Colors.transparent,
                            border: Border.all(
                              color: active
                                  ? SmarturStyle.purple
                                  : done
                                      ? SmarturStyle.green
                                      : scheme.outlineVariant,
                              width: 2,
                            ),
                          ),
                          child: Center(
                            child: Icon(
                              done ? Icons.check : steps[i].icon,
                              size: 20,
                              color: active || done ? Colors.white : scheme.onSurfaceVariant,
                            ),
                          ),
                        );

                        if (isLast) return stepCircle;

                        return Expanded(
                          child: Row(
                            children: [
                              stepCircle,
                              Expanded(
                                child: AnimatedContainer(
                                  duration: const Duration(milliseconds: 300),
                                  height: 2,
                                  margin: const EdgeInsets.symmetric(horizontal: 8),
                                  color: done ? SmarturStyle.green : scheme.outlineVariant,
                                ),
                              ),
                            ],
                          ),
                        );
                      }),
                    ),
                    const SizedBox(height: SmarturStyle.spacingLg),

                    Text(
                      steps[_currentStep].title,
                      style: SmarturStyle.calSansTitle.copyWith(fontSize: 26),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      steps[_currentStep].subtitle,
                      style: TextStyle(fontFamily: 'Outfit', color: scheme.onSurfaceVariant),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: SmarturStyle.spacingMd),

              // ── Contenido del paso activo ──────────────────────────────
              Expanded(
                child: SmarturShimmer(
                  enabled: _isLoading,
                  child: SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(
                    SmarturStyle.spacingLg,
                    0,
                    SmarturStyle.spacingLg,
                    SmarturStyle.spacingXl,
                  ),
                  child: AnimatedSwitcher(
                    duration: const Duration(milliseconds: 400),
                    switchInCurve: Curves.easeOutBack,
                    switchOutCurve: Curves.easeInCirc,
                    transitionBuilder: (child, animation) => FadeTransition(
                      opacity: animation,
                      child: SlideTransition(
                        position: Tween<Offset>(
                          begin: const Offset(0.1, 0),
                          end: Offset.zero,
                        ).animate(animation),
                        child: child,
                      ),
                    ),
                    child: KeyedSubtree(
                      key: ValueKey(_currentStep),
                      child: _buildCurrentStep(),
                    ),
                  ),
                ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCurrentStep() {
    switch (_currentStep) {
      case 0:
        return PreferencesStep1(data: _data, onNext: _goNext);
      case 1:
        return PreferencesStep2(data: _data, onNext: _goNext, onBack: _goBack);
      case 2:
        return PreferencesStep3(
          data: _data,
          onBack: _goBack,
          onSubmit: _submit,
          isLoading: _isLoading,
        );
      default:
        return const SizedBox.shrink();
    }
  }
}

class StepMeta {
  final String title;
  final String subtitle;
  final IconData icon;
  const StepMeta({required this.title, required this.subtitle, required this.icon});
}
