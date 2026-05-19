import 'package:flutter/material.dart';
import 'package:smartur/l10n/app_localizations.dart';

import '../../../core/settings/app_settings_scope.dart';
import '../../../core/theme/style_guide.dart';
import '../../../core/utils/notifications.dart';
import '../../../data/services/auth_service.dart';
import '../../widgets/smartur_background.dart';
import '../../widgets/terms_and_conditions_modal.dart';
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
      case 'en': return 'English';
      case 'fr': return 'Français';
      case 'pt': return 'Português';
      case 'es': default: return 'Español';
    }
  }

  String _themeLabelFromMode(ThemeMode mode) {
    switch (mode) {
      case ThemeMode.light: return 'Claro';
      case ThemeMode.dark: return 'Oscuro';
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
          _buildSectionHeader(l10n.appearanceSection),
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
          _buildSectionHeader(l10n.accountSection),
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
                MaterialPageRoute(
                  builder: (_) => const EditProfileAvatarScreen(),
                ),
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

          // ── Información ─────────────────────────────────────────────
          _buildSectionHeader(l10n.infoSection),
          ListTile(
            leading: Icon(Icons.info_outline,
                color: scheme.onSurfaceVariant),
            title: Text(l10n.appVersion,
                style: const TextStyle(fontFamily: 'Outfit')),
            trailing: Text('v1.0.0',
                style: TextStyle(
                    fontFamily: 'Outfit',
                    color: scheme.onSurfaceVariant)),
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

  // ── Helpers UI ──────────────────────────────────────────────────────────

  Widget _buildSectionHeader(String title) {
    final scheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 8),
      child: Text(
        title.toUpperCase(),
        style: TextStyle(
          fontFamily: 'Outfit',
          fontWeight: FontWeight.bold,
          fontSize: 12,
          color: scheme.onSurfaceVariant,
        ),
      ),
    );
  }

  // ── Idioma ──────────────────────────────────────────────────────────────

  void _showLanguageDialog() {
    final l10n = AppLocalizations.of(context)!;
    final scheme = Theme.of(context).colorScheme;
    final List<String> languages = [l10n.systemLanguage, 'Español', 'English', 'Français', 'Português'];
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
                      'English' => 'en',
                      'Français' => 'fr',
                      'Português' => 'pt',
                      'Español' => 'es',
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
    final List<String> themes = [l10n.systemTheme, 'Claro', 'Oscuro'];
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
                      'Claro' => ThemeMode.light,
                      'Oscuro' => ThemeMode.dark,
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
                    MaterialPageRoute(builder: (_) => WelcomeScreen()),
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

  // ── Cerrar Sesión ──────────────────────────────────────────────────────

  Future<void> _logout() async {
    await _authService.clearSession();
    if (mounted) {
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (_) => WelcomeScreen()),
        (_) => false,
      );
    }
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
