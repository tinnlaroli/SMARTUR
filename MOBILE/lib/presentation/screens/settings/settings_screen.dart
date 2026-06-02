import 'package:flutter/material.dart';
import 'package:smartur/l10n/app_localizations.dart';

import '../../../core/settings/app_settings_scope.dart';
import '../../../core/theme/style_guide.dart';
import '../../../core/utils/notifications.dart';
import '../../../data/services/auth_service.dart';
import '../../../data/services/update_service.dart';
import '../../widgets/smartur_background.dart';
import '../../widgets/smartur_ui_kit.dart';
import '../../widgets/terms_and_conditions_modal.dart';
import '../../widgets/privacy_policy_modal.dart';
import '../auth/welcome_screen.dart';
import '../main/edit_profile_avatar_screen.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final AuthService _authService = AuthService();
  ThemeMode _themeMode = ThemeMode.system;
  String _language = 'Sistema';
  String _appVersion = '…';
  bool _checkingUpdate = false;

  @override
  void initState() {
    super.initState();
    UpdateService.currentVersion().then((v) {
      if (mounted) setState(() => _appVersion = v);
    });
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final settings = AppSettingsScope.of(context);
    final code = settings.value.locale?.languageCode;
    setState(() {
      _themeMode = settings.value.themeMode;
      _language = _languageLabelFromCode(code);
    });
  }

  String _languageLabelFromCode(String? code) {
    if (code == null) return AppLocalizations.of(context)!.systemLanguage;
    switch (code) {
      case 'en': return AppLocalizations.of(context)!.languageEnglish;
      case 'fr': return AppLocalizations.of(context)!.languageFrench;
      case 'pt': return AppLocalizations.of(context)!.languagePortuguese;
      case 'es':
      default:
        return AppLocalizations.of(context)!.languageSpanish;
    }
  }

  String _themeLabelFromMode(ThemeMode mode) {
    switch (mode) {
      case ThemeMode.light: return AppLocalizations.of(context)!.themeLight;
      case ThemeMode.dark: return AppLocalizations.of(context)!.themeDark;
      case ThemeMode.system: return AppLocalizations.of(context)!.systemTheme;
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      backgroundColor: scheme.surface,
      appBar: AppBar(
        title: Text(l10n.settingsTitle,
            style: SmarturStyle.calSansTitle.copyWith(fontSize: 20)),
        elevation: 0,
        backgroundColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon:
              Icon(Icons.arrow_back, color: scheme.onSurface),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SmarturBackgroundTop(
        child: ListView(
        padding: const EdgeInsets.symmetric(vertical: 8),
        children: [
          // ── Apariencia ──────────────────────────────────────────────
          SmarturSectionHeader(l10n.appearanceSection),
          ListTile(
            leading: const Icon(Icons.palette_outlined, color: SmarturStyle.purple),
            title: Text(l10n.darkMode, style: const TextStyle(fontFamily: 'Outfit')),
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(_themeLabelFromMode(_themeMode),
                    style: TextStyle(fontFamily: 'Outfit', color: scheme.onSurfaceVariant)),
                Icon(Icons.chevron_right, color: scheme.onSurfaceVariant),
              ],
            ),
            onTap: () => _showThemeDialog(),
          ),
          ListTile(
            leading: const Icon(Icons.language_outlined,
                color: SmarturStyle.purple),
            title:
                Text(l10n.language, style: const TextStyle(fontFamily: 'Outfit')),
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(_language,
                    style: TextStyle(
                        fontFamily: 'Outfit',
                        color: scheme.onSurfaceVariant)),
                Icon(Icons.chevron_right,
                    color: scheme.onSurfaceVariant),
              ],
            ),
            onTap: () => _showLanguageDialog(),
          ),

          ListTile(
            leading:
                const Icon(Icons.notifications_outlined, color: SmarturStyle.blue),
            title: Text(l10n.notifications,
                style: const TextStyle(fontFamily: 'Outfit')),
            subtitle: Text(
              l10n.notificationsSubtitle,
              style: TextStyle(
                fontFamily: 'Outfit',
                fontSize: 12,
                color: scheme.onSurfaceVariant,
              ),
            ),
            trailing: Icon(Icons.chevron_right, color: scheme.onSurfaceVariant),
            onTap: () => SmarturNotifications.showInfo(
                  context,
                  l10n.notificationsSubtitle,
                ),
          ),

          const Divider(height: 32),

          // ── Cuenta ──────────────────────────────────────────────────
          SmarturSectionHeader(l10n.accountSection),
          ListTile(
            leading: const Icon(Icons.face_outlined, color: SmarturStyle.purple),
            title: Text(l10n.editProfile,
                style: const TextStyle(fontFamily: 'Outfit')),
            subtitle: Text(
              l10n.editProfileSubtitle,
              style: TextStyle(
                fontFamily: 'Outfit',
                fontSize: 12,
                color: scheme.onSurfaceVariant,
              ),
            ),
            trailing: Icon(Icons.chevron_right, color: scheme.onSurfaceVariant),
            onTap: () async {
              await Navigator.push<void>(
                context,
                smarturFadeRoute(const EditProfileAvatarScreen()),
              );
            },
          ),
          ListTile(
            leading:
                const Icon(Icons.lock_outline, color: SmarturStyle.blue),
            title: Text(l10n.changePassword,
                style: const TextStyle(fontFamily: 'Outfit')),
            trailing: Icon(Icons.chevron_right,
                color: scheme.onSurfaceVariant),
            onTap: () => _showChangePasswordSheet(),
          ),
          ListTile(
            leading: const Icon(Icons.person_outline,
                color: SmarturStyle.blue),
            title: Text(l10n.editName,
                style: const TextStyle(fontFamily: 'Outfit')),
            trailing: Icon(Icons.chevron_right,
                color: scheme.onSurfaceVariant),
            onTap: () => _showEditNameDialog(),
          ),
          ListTile(
            leading: const Icon(Icons.delete_outline,
                color: SmarturStyle.pink),
            title: Text(l10n.deleteAccount,
                style: TextStyle(
                    fontFamily: 'Outfit', color: SmarturStyle.pink)),
            onTap: () => _confirmDeletion(context),
          ),

          const Divider(height: 32),

          // ── Seguridad — sesiones activas ────────────────────────────
          SmarturSectionHeader(l10n.securitySection),
          ListTile(
            leading: const Icon(Icons.devices_outlined, color: SmarturStyle.blue),
            title: Text(l10n.activeSessions,
                style: const TextStyle(fontFamily: 'Outfit')),
            subtitle: Text(
              l10n.activeSessionsSubtitle,
              style: TextStyle(
                fontFamily: 'Outfit',
                fontSize: 12,
                color: scheme.onSurfaceVariant,
              ),
            ),
            trailing: Icon(Icons.chevron_right, color: scheme.onSurfaceVariant),
            onTap: () => _showSessionsSheet(),
          ),

          const Divider(height: 32),

          // ── Información ─────────────────────────────────────────────
          SmarturSectionHeader(l10n.infoSection),
          ListTile(
            leading: Icon(Icons.info_outline, color: scheme.onSurfaceVariant),
            title: Text(l10n.appVersion,
                style: const TextStyle(fontFamily: 'Outfit')),
            trailing: Text('v$_appVersion',
                style: TextStyle(
                    fontFamily: 'Outfit', color: scheme.onSurfaceVariant)),
          ),
          ListTile(
            leading: _checkingUpdate
                ? const SizedBox(
                    width: 24, height: 24,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: SmarturStyle.purple))
                : const Icon(Icons.system_update_outlined,
                    color: SmarturStyle.purple),
            title: Text(
              l10n.settingsCheckUpdate,
              style: const TextStyle(fontFamily: 'Outfit'),
            ),
            trailing: Icon(Icons.chevron_right, color: scheme.onSurfaceVariant),
            onTap: _checkingUpdate ? null : _checkForUpdate,
          ),
          ListTile(
            leading: Icon(Icons.description_outlined,
                color: scheme.onSurfaceVariant),
            title: Text(l10n.termsAndConditions,
                style: const TextStyle(fontFamily: 'Outfit')),
            trailing: Icon(Icons.chevron_right,
                color: scheme.onSurfaceVariant),
            onTap: () => showTermsAndConditionsModal(context),
          ),
          ListTile(
            leading: Icon(Icons.privacy_tip_outlined,
                color: scheme.onSurfaceVariant),
            title: Text(l10n.privacyPolicy,
                style: const TextStyle(fontFamily: 'Outfit')),
            trailing: Icon(Icons.chevron_right,
                color: scheme.onSurfaceVariant),
            onTap: () => showPrivacyPolicyModal(context),
          ),

          const SizedBox(height: 24),

          // ── Cerrar Sesión ───────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: OutlinedButton.icon(
              onPressed: () => _logout(),
              icon: const Icon(Icons.logout, color: SmarturStyle.pink),
              label: Text(
                l10n.logout,
                style: const TextStyle(
                    fontFamily: 'Outfit',
                    color: SmarturStyle.pink,
                    fontWeight: FontWeight.w600),
              ),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: SmarturStyle.pink),
                minimumSize: const Size(
                    double.infinity, SmarturStyle.touchTargetComfortable),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),
          const SizedBox(height: 32),
        ],
      ),
      ),
    );
  }

  // ── Buscar Actualización ─────────────────────────────────────────────────

  Future<void> _checkForUpdate() async {
    setState(() => _checkingUpdate = true);
    final result = await UpdateService.check(forceRefresh: true);
    if (!mounted) return;
    setState(() => _checkingUpdate = false);
    if (result.hasUpdate) {
      UpdateService.showUpdateDialog(context, result.latestVersion);
    } else {
      SmarturNotifications.showSuccess(
        context,
        AppLocalizations.of(context)!.settingsAppUpToDate(result.currentVersion),
      );
    }
  }


  // ── Idioma ──────────────────────────────────────────────────────────────

  void _showLanguageDialog() {
    final l10n = AppLocalizations.of(context)!;
    final scheme = Theme.of(context).colorScheme;
    final List<String> languages = [
      l10n.systemLanguage,
      l10n.languageSpanish,
      l10n.languageEnglish,
      l10n.languageFrench,
      l10n.languagePortuguese,
    ];
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 16),
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: scheme.outlineVariant,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 16),
            Text(l10n.selectLanguage,
                style: SmarturStyle.calSansTitle.copyWith(fontSize: 18)),
            const SizedBox(height: 8),
            ...languages.map((lang) => ListTile(
                  title: Text(lang, style: const TextStyle(fontFamily: 'Outfit')),
                  trailing: _language == lang
                      ? const Icon(Icons.check_circle, color: SmarturStyle.purple)
                      : null,
                  onTap: () {
                    final code = switch (lang) {
                      _ when lang == l10n.languageEnglish => 'en',
                      _ when lang == l10n.languageFrench => 'fr',
                      _ when lang == l10n.languagePortuguese => 'pt',
                      _ when lang == l10n.languageSpanish => 'es',
                      _ => null,
                    };
                    AppSettingsScope.of(context).setLocale(code != null ? Locale(code) : null);
                    Navigator.pop(ctx);
                  },
                )),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  void _showThemeDialog() {
    final l10n = AppLocalizations.of(context)!;
    final scheme = Theme.of(context).colorScheme;
    final List<String> themes = [l10n.systemTheme, l10n.themeLight, l10n.themeDark];
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 16),
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: scheme.outlineVariant,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 16),
            Text(l10n.darkMode,
                style: SmarturStyle.calSansTitle.copyWith(fontSize: 18)),
            const SizedBox(height: 8),
            ...themes.map((t) => ListTile(
                  title: Text(t, style: const TextStyle(fontFamily: 'Outfit')),
                  trailing: _themeLabelFromMode(_themeMode) == t
                      ? const Icon(Icons.check_circle, color: SmarturStyle.purple)
                      : null,
                  onTap: () {
                    final mode = switch (t) {
                      _ when t == l10n.themeLight => ThemeMode.light,
                      _ when t == l10n.themeDark => ThemeMode.dark,
                      _ => ThemeMode.system,
                    };
                    AppSettingsScope.of(context).setThemeMode(mode);
                    Navigator.pop(ctx);
                  },
                )),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  // ── Cambiar Contraseña ─────────────────────────────────────────────────

  void _showChangePasswordSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => const _ChangePasswordSheet(),
    );
  }

  // ── Editar Nombre ──────────────────────────────────────────────────────

  void _showEditNameDialog() async {
    final l10n = AppLocalizations.of(context)!;
    final scheme = Theme.of(context).colorScheme;
    final currentName = await _authService.getUserName() ?? '';
    final controller = TextEditingController(text: currentName);

    if (!mounted) return;
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        actionsAlignment: MainAxisAlignment.center,
        actionsOverflowAlignment: OverflowBarAlignment.center,
        title:
            Text(l10n.editNameTitle, style: SmarturStyle.calSansTitle),
        content: TextField(
          controller: controller,
          decoration: InputDecoration(
            hintText: l10n.yourName,
            hintStyle: const TextStyle(fontFamily: 'Outfit'),
            border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12)),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide:
                  const BorderSide(color: SmarturStyle.purple, width: 2),
            ),
          ),
          style: const TextStyle(fontFamily: 'Outfit'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(l10n.cancel,
                style: TextStyle(color: scheme.onSurfaceVariant)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: SmarturStyle.purple,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
            ),
            onPressed: () async {
              final newName = controller.text.trim();
              if (newName.isEmpty) return;
              Navigator.pop(ctx);
              try {
                await _authService.updateUser({"name": newName});
                if (mounted) {
                  SmarturNotifications.showSuccess(
                      context, l10n.editName);
                }
              } on AuthException catch (e) {
                if (mounted) {
                  SmarturNotifications.showError(context, e.message);
                }
              }
            },
            child: Text(l10n.save,
                style: const TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  // ── Eliminar Cuenta ────────────────────────────────────────────────────

  void _confirmDeletion(BuildContext parentCtx) {
    final l10n = AppLocalizations.of(parentCtx)!;
    final scheme = Theme.of(parentCtx).colorScheme;
    showDialog(
      context: parentCtx,
      builder: (ctx) => AlertDialog(
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        actionsAlignment: MainAxisAlignment.center,
        actionsOverflowAlignment: OverflowBarAlignment.center,
        title: Text(l10n.deleteAccountTitle,
            style: SmarturStyle.calSansTitle),
        content: Text(
          l10n.deleteAccountConfirm,
          style: TextStyle(
              fontFamily: 'Outfit', color: scheme.onSurfaceVariant),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(l10n.cancel,
                style: TextStyle(color: scheme.onSurfaceVariant)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
                backgroundColor: SmarturStyle.pink),
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                await _authService.deactivateAccount();
                if (parentCtx.mounted) {
                  Navigator.pushAndRemoveUntil(
                    parentCtx,
                    smarturFadeRoute(const WelcomeScreen()),
                    (_) => false,
                  );
                }
              } on AuthException catch (e) {
                if (parentCtx.mounted) {
                  SmarturNotifications.showError(parentCtx, e.message);
                }
              }
            },
            child: Text(l10n.deleteAccountYes,
                style: const TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  // ── Sesiones activas ──────────────────────────────────────────────────────

  void _showSessionsSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => _SessionsSheet(authService: _authService),
    );
  }

  // ── Cerrar Sesión ──────────────────────────────────────────────────────

  Future<void> _logout() async {
    await _authService.clearSession();
    if (mounted) {
      Navigator.pushAndRemoveUntil(
        context,
        smarturFadeRoute(const WelcomeScreen()),
        (_) => false,
      );
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Bottom Sheet: Sesiones activas
// ═══════════════════════════════════════════════════════════════════════════

class _SessionsSheet extends StatefulWidget {
  final AuthService authService;
  const _SessionsSheet({required this.authService});

  @override
  State<_SessionsSheet> createState() => _SessionsSheetState();
}

class _SessionsSheetState extends State<_SessionsSheet> {
  bool _loading = true;
  List<Map<String, dynamic>> _sessions = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final data = await widget.authService.fetchSessions();
    if (mounted) setState(() { _sessions = data; _loading = false; });
  }

  Future<void> _revoke(int id) async {
    final ok = await widget.authService.revokeSession(id);
    if (ok && mounted) {
      setState(() => _sessions.removeWhere((s) => s['id'] == id));
      SmarturNotifications.showSuccess(context, AppLocalizations.of(context)!.sessionRevokeSuccess);
    } else if (mounted) {
      SmarturNotifications.showError(context, AppLocalizations.of(context)!.sessionRevokeError);
    }
  }

  String _formatDate(String? raw) {
    if (raw == null) return '—';
    try {
      final dt = DateTime.parse(raw).toLocal();
      return '${dt.day}/${dt.month}/${dt.year}  ${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
    } catch (_) { return raw; }
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return DraggableScrollableSheet(
      initialChildSize: 0.55,
      minChildSize: 0.4,
      maxChildSize: 0.85,
      expand: false,
      builder: (ctx, ctrl) => Column(
        children: [
          const SizedBox(height: 12),
          Container(
            width: 40, height: 4,
            decoration: BoxDecoration(
              color: scheme.outlineVariant,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 16),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: SmarturStyle.blue.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.devices_outlined, color: SmarturStyle.blue, size: 20),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(AppLocalizations.of(context)!.activeSessions,
                          style: SmarturStyle.calSansTitle.copyWith(fontSize: 17)),
                      Text(AppLocalizations.of(context)!.activeSessionsSubtitle,
                          style: TextStyle(
                              fontFamily: 'Outfit', fontSize: 11,
                              color: scheme.onSurface.withValues(alpha: 0.5))),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          const Divider(height: 1),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _sessions.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.devices_outlined,
                                size: 48, color: scheme.onSurface.withValues(alpha: 0.25)),
                            const SizedBox(height: 12),
                            Text(AppLocalizations.of(context)!.noSessionsRegistered,
                                style: TextStyle(
                                    fontFamily: 'Outfit',
                                    color: scheme.onSurface.withValues(alpha: 0.45))),
                          ],
                        ),
                      )
                    : ListView.builder(
                        controller: ctrl,
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        itemCount: _sessions.length,
                        itemBuilder: (_, i) {
                          final s = _sessions[i];
                          final device = s['device_hint'] as String? ?? AppLocalizations.of(context)!.defaultDevice;
                          final ip = s['ip'] as String? ?? '';
                          final created = _formatDate(s['created_at'] as String?);
                          final isPhone = device.toLowerCase().contains('android') ||
                              device.toLowerCase().contains('ios');

                          return ListTile(
                            leading: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: SmarturStyle.blue.withValues(alpha: 0.08),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Icon(
                                isPhone ? Icons.smartphone_outlined : Icons.computer_outlined,
                                color: SmarturStyle.blue, size: 20,
                              ),
                            ),
                            title: Text(device,
                                style: const TextStyle(
                                    fontFamily: 'Outfit', fontWeight: FontWeight.w600)),
                            subtitle: Text(
                              '${ip.isNotEmpty ? '$ip · ' : ''}${AppLocalizations.of(context)!.sessionCreatedSince} $created',
                              style: TextStyle(
                                  fontFamily: 'Outfit', fontSize: 11,
                                  color: scheme.onSurfaceVariant),
                            ),
                            trailing: IconButton(
                              icon: const Icon(Icons.close_rounded,
                                  color: SmarturStyle.pink, size: 20),
                              tooltip: AppLocalizations.of(context)!.sessionRevokeTooltip,
                              onPressed: () => _revoke(s['id'] as int),
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Bottom Sheet: Cambiar Contraseña (forgot → código → reset)
// ═══════════════════════════════════════════════════════════════════════════

class _ChangePasswordSheet extends StatefulWidget {
  const _ChangePasswordSheet();

  @override
  State<_ChangePasswordSheet> createState() => _ChangePasswordSheetState();
}

class _ChangePasswordSheetState extends State<_ChangePasswordSheet> {
  final AuthService _auth = AuthService();
  final _formKey = GlobalKey<FormState>();

  int _step = 0; // 0 = enviar código, 1 = ingresar código + nueva contraseña
  bool _loading = false;
  bool _obscureNew = true;
  bool _obscureConfirm = true;

  String _email = '';
  final _codeCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadEmail();
  }

  Future<void> _loadEmail() async {
    final email = await _auth.getUserEmail();
    if (mounted && email != null) setState(() => _email = email);
  }

  @override
  void dispose() {
    _codeCtrl.dispose();
    _passCtrl.dispose();
    _confirmCtrl.dispose();
    super.dispose();
  }

  Future<void> _sendCode() async {
    if (_email.isEmpty) {
      SmarturNotifications.showError(
          context, AppLocalizations.of(context)!.emailNotFound);
      return;
    }
    setState(() => _loading = true);
    try {
      await _auth.forgotPassword(_email);
      if (mounted) {
        setState(() {
          _step = 1;
          _loading = false;
        });
        SmarturNotifications.showSuccess(
            context, AppLocalizations.of(context)!.codeSentToEmail(_email));
      }
    } on AuthException catch (e) {
      if (mounted) {
        setState(() => _loading = false);
        SmarturNotifications.showError(context, e.message);
      }
    }
  }

  Future<void> _resetPassword() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      await _auth.resetPassword(
          _email, _codeCtrl.text.trim(), _passCtrl.text);
      if (mounted) {
        Navigator.pop(context);
        SmarturNotifications.showSuccess(
            context, AppLocalizations.of(context)!.updatePassword);
      }
    } on AuthException catch (e) {
      if (mounted) {
        setState(() => _loading = false);
        SmarturNotifications.showError(context, e.message);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final scheme = Theme.of(context).colorScheme;
    return Padding(
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 16,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: scheme.outlineVariant,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              l10n.changePasswordTitle,
              style: SmarturStyle.calSansTitle.copyWith(fontSize: 20),
            ),
            const SizedBox(height: 8),
            Text(
              _step == 0
                  ? l10n.changePasswordStep0Hint
                  : l10n.changePasswordStep1Hint,
              textAlign: TextAlign.center,
              style: TextStyle(
                  fontFamily: 'Outfit',
                  color: scheme.onSurfaceVariant,
                  fontSize: 14),
            ),
            const SizedBox(height: 24),
            if (_step == 0) _buildStep0(),
            if (_step == 1) _buildStep1(),
          ],
        ),
      ),
    );
  }

  Widget _buildStep0() {
    final l10n = AppLocalizations.of(context)!;
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            color: SmarturStyle.bgSecondary,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              const Icon(Icons.email_outlined,
                  color: SmarturStyle.purple, size: 20),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  _email.isNotEmpty ? _email : l10n.loading,
                  style: const TextStyle(
                      fontFamily: 'Outfit', fontWeight: FontWeight.w500),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        SizedBox(
          width: double.infinity,
          height: SmarturStyle.touchTargetComfortable,
          child: ElevatedButton(
            onPressed: _loading ? null : _sendCode,
            style: ElevatedButton.styleFrom(
              backgroundColor: SmarturStyle.purple,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14)),
            ),
            child: _loading
                ? Text(
                    '…',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.92),
                      fontSize: 17,
                      fontWeight: FontWeight.w600,
                      fontFamily: 'Outfit',
                    ),
                  )
                : Text(l10n.sendCode,
                    style: const TextStyle(
                        fontFamily: 'Outfit',
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w600)),
          ),
        ),
      ],
    );
  }

  Widget _buildStep1() {
    final l10n = AppLocalizations.of(context)!;
    final scheme = Theme.of(context).colorScheme;
    return Form(
      key: _formKey,
      child: Column(
        children: [
          TextFormField(
            controller: _codeCtrl,
            keyboardType: TextInputType.number,
            maxLength: 6,
            decoration: _inputDecoration(
              label: l10n.verificationCode,
              icon: Icons.pin_outlined,
            ),
            style: const TextStyle(
                fontFamily: 'Outfit',
                fontSize: 18,
                letterSpacing: 8,
                fontWeight: FontWeight.w600),
            textAlign: TextAlign.center,
            validator: (v) =>
                (v == null || v.trim().length < 6) ? l10n.codeSixDigits : null,
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _passCtrl,
            obscureText: _obscureNew,
            decoration: _inputDecoration(
              label: l10n.newPassword,
              icon: Icons.lock_outline,
              suffixIcon: IconButton(
                icon: Icon(
                    _obscureNew ? Icons.visibility_off : Icons.visibility,
                    color: scheme.onSurfaceVariant),
                onPressed: () =>
                    setState(() => _obscureNew = !_obscureNew),
              ),
            ),
            style: const TextStyle(fontFamily: 'Outfit'),
            validator: (v) {
              if (v == null || v.length < 8) {
                return l10n.passwordMinChars;
              }
              if (!RegExp(r'[A-Z]').hasMatch(v)) {
                return l10n.passwordNeedUpper;
              }
              if (!RegExp(r'[a-z]').hasMatch(v)) {
                return l10n.passwordNeedLower;
              }
              if (!RegExp(r'[0-9]').hasMatch(v)) {
                return l10n.passwordNeedNumber;
              }
              return null;
            },
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _confirmCtrl,
            obscureText: _obscureConfirm,
            decoration: _inputDecoration(
              label: l10n.confirmPassword,
              icon: Icons.lock_outline,
              suffixIcon: IconButton(
                icon: Icon(
                    _obscureConfirm
                        ? Icons.visibility_off
                        : Icons.visibility,
                    color: scheme.onSurfaceVariant),
                onPressed: () =>
                    setState(() => _obscureConfirm = !_obscureConfirm),
              ),
            ),
            style: const TextStyle(fontFamily: 'Outfit'),
            validator: (v) =>
                v != _passCtrl.text ? l10n.passwordsDontMatch : null,
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            height: SmarturStyle.touchTargetComfortable,
            child: ElevatedButton(
              onPressed: _loading ? null : _resetPassword,
              style: ElevatedButton.styleFrom(
                backgroundColor: SmarturStyle.purple,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14)),
              ),
              child: _loading
                  ? Text(
                      '…',
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.92),
                        fontSize: 17,
                        fontWeight: FontWeight.w600,
                        fontFamily: 'Outfit',
                      ),
                    )
                  : Text(l10n.updatePassword,
                      style: const TextStyle(
                          fontFamily: 'Outfit',
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.w600)),
            ),
          ),
          const SizedBox(height: 12),
          TextButton(
            onPressed: _loading ? null : _sendCode,
            child: Text(l10n.resendCode,
                style: const TextStyle(
                    fontFamily: 'Outfit', color: SmarturStyle.purple)),
          ),
        ],
      ),
    );
  }

  InputDecoration _inputDecoration({
    required String label,
    required IconData icon,
    Widget? suffixIcon,
  }) {
    return InputDecoration(
      labelText: label,
      labelStyle: const TextStyle(fontFamily: 'Outfit'),
      prefixIcon: Icon(icon, color: SmarturStyle.purple),
      suffixIcon: suffixIcon,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: SmarturStyle.purple, width: 2),
      ),
      filled: true,
      fillColor: SmarturStyle.bgSecondary,
    );
  }
}
