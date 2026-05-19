import 'package:flutter/material.dart';
import 'package:local_auth/local_auth.dart';
import 'package:smartur/l10n/app_localizations.dart';

import '../../../core/theme/style_guide.dart';
import '../../../core/utils/notifications.dart';
import '../../../data/services/auth_service.dart';
import '../../widgets/smartur_background.dart';
import '../../widgets/terms_and_conditions_modal.dart';
import '../main/main_screen.dart';

class WelcomeScreen extends StatefulWidget {
  /// Si viene del splash inicial con loader, retrasamos el inicio
  /// de las animaciones para que no corran debajo del overlay.
  final bool fromSplash;

  const WelcomeScreen({super.key, this.fromSplash = false});

  @override
  State<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends State<WelcomeScreen>
    with SingleTickerProviderStateMixin {
  final LocalAuthentication _auth = LocalAuthentication();
  final AuthService _authService = AuthService();

  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  late Animation<double> _logoScale; // para huella/botón
  late Animation<double> _logoZoom; // continuidad del zoom del loader
  late Animation<Offset> _textSlide;
  late Animation<double> _buttonFade;
  late Animation<double> _buttonScale;
  late Animation<Offset> _buttonSlide;
  bool _isBiometricActive = false;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1600),
    );

    _fadeAnimation = CurvedAnimation(
      parent: _controller,
      curve: const Interval(0.2, 0.8, curve: Curves.easeIn),
    );

    // Escala 0.8 → 1.05 para contenido (texto/huella) con rebote suave.
    _logoScale = Tween<double>(begin: 0.8, end: 1.05).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.3, 0.9, curve: Curves.easeOutBack),
      ),
    );

    // Logo: pequeño rebote  (1.02 → 0.96 → 1.0) para dar vida al final del zoom.
    _logoZoom =
        TweenSequence<double>([
          TweenSequenceItem(
            tween: Tween<double>(
              begin: 1.12,
              end: 0.36,
            ).chain(CurveTween(curve: Curves.easeOutQuad)),
            weight: 40,
          ),
          TweenSequenceItem(
            tween: Tween<double>(
              begin: 0.36,
              end: 1.0,
            ).chain(CurveTween(curve: Curves.elasticOut)),
            weight: 60,
          ),
        ]).animate(
          CurvedAnimation(
            parent: _controller,
            curve: const Interval(0.0, 0.6, curve: Curves.easeOut),
          ),
        );

    _textSlide = Tween<Offset>(begin: const Offset(0, 0.35), end: Offset.zero)
        .animate(
          CurvedAnimation(
            parent: _controller,
            curve: const Interval(0.4, 1.0, curve: Curves.easeOutCubic),
          ),
        );

    _buttonFade = CurvedAnimation(
      parent: _controller,
      curve: const Interval(0.5, 1.0, curve: Curves.easeOut),
    );

    // Botón "Comenzar": pop claro y deslizamiento largo hacia arriba
    _buttonScale = Tween<double>(begin: 0.75, end: 1.05).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.5, 1.0, curve: Curves.elasticOut),
      ),
    );

    _buttonSlide = Tween<Offset>(begin: const Offset(0, 0.5), end: Offset.zero)
        .animate(
          CurvedAnimation(
            parent: _controller,
            curve: const Interval(0.5, 1.0, curve: Curves.easeOutCubic),
          ),
        );

    // Comprobar si la biometría está activa para mostrar el botón
    _checkInitialBiometricStatus();

    // Iniciar animaciones (con retraso si viene del splash)
    if (widget.fromSplash) {
      WidgetsBinding.instance.addPostFrameCallback((_) async {
        await Future.delayed(const Duration(milliseconds: 4600));
        if (mounted && !_controller.isAnimating && _controller.value == 0.0) {
          _controller.forward();
        }
      });
    } else {
      _controller.forward();
    }
  }

  Future<void> _checkInitialBiometricStatus() async {
    final isActive = await _authService.isBiometricEnabled();
    if (mounted) {
      setState(() => _isBiometricActive = isActive);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  // --- RESTORED AUTH MODAL LOGIC ---
  void _showAuthModal(BuildContext context, {bool isLogin = false}) {
    bool isExpanded = false;
    bool isWaitingOTP = false;
    bool isLoadingEmail = false;
    bool isLoadingGoogle = false;
    bool rememberMe = false;
    bool acceptedTerms = false;
    bool obscurePassword = true;
    bool isForgotPassword = false;
    int forgotStep = 0; // 0: Email, 1: Code & New Password
    final GlobalKey<FormState> formKey = GlobalKey<FormState>();

    final TextEditingController emailController = TextEditingController();
    final TextEditingController passwordController = TextEditingController();
    final TextEditingController nameController = TextEditingController();
    final TextEditingController otpController = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return StatefulBuilder(
          builder: (BuildContext context, StateSetter setModalState) {
            final scheme = Theme.of(context).colorScheme;
            final l10n = AppLocalizations.of(context)!;
            double? height = isExpanded
                ? MediaQuery.of(context).size.height * 0.75
                : null;

            return AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              curve: Curves.easeInOut,
              height: height,
              decoration: BoxDecoration(
                color: scheme.surface,
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(32),
                ),
              ),
              padding: EdgeInsets.only(
                left: SmarturStyle.spacingLg,
                right: SmarturStyle.spacingLg,
                top: 12,
                bottom: MediaQuery.of(context).viewInsets.bottom + 20,
              ),
              child: SingleChildScrollView(
                child: Form(
                  key: formKey,
                  autovalidateMode: AutovalidateMode.onUserInteraction,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Center(
                        child: Container(
                          width: 40,
                          height: 4,
                          decoration: BoxDecoration(
                            color: scheme.onSurfaceVariant.withValues(
                              alpha: 0.35,
                            ),
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),
                      Text(
                        isForgotPassword
                            ? l10n.changePasswordTitle
                            : (isLogin ? l10n.welcomeBack : l10n.startNow),
                        style: SmarturStyle.calSansTitle,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        isForgotPassword
                            ? (forgotStep == 0
                                ? l10n.changePasswordStep0Hint
                                : l10n.changePasswordStep1Hint)
                            : (isLogin ? l10n.loginSubtitle : l10n.registerSubtitle),
                        style: TextStyle(
                          fontFamily: 'Outfit',
                          color: scheme.onSurfaceVariant,
                        ),
                      ),
                      const SizedBox(height: 32),
                      if (!isExpanded) ...[
                        ElevatedButton(
                          onPressed: () => setModalState(() => isExpanded = true),
                          child: Text(
                            isLogin
                                ? l10n.continueWithEmail
                                : l10n.registerWithEmail,
                          ),
                        ),
                      ] else ...[
                        if (isWaitingOTP)
                          Column(
                            children: [
                              Text(
                                l10n.codeSentToLabel,
                                style: TextStyle(
                                  fontFamily: 'Outfit',
                                  color: scheme.onSurfaceVariant,
                                  fontSize: 13,
                                ),
                              ),
                              Text(
                                emailController.text,
                                style: TextStyle(
                                  fontFamily: 'Outfit',
                                  fontWeight: FontWeight.bold,
                                  color: scheme.onSurface,
                                ),
                              ),
                              const SizedBox(height: 20),
                              TextFormField(
                                controller: otpController,
                                keyboardType: TextInputType.number,
                                textAlign: TextAlign.center,
                                style: const TextStyle(
                                  fontSize: 24,
                                  letterSpacing: 8,
                                  fontWeight: FontWeight.bold,
                                ),
                                decoration: InputDecoration(
                                  hintText: "000000",
                                  helperText: l10n.enterSixDigitCode,
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                ),
                              ),
                              TextButton(
                                onPressed: () => setModalState(() {
                                  isWaitingOTP = false;
                                  otpController.clear();
                                }),
                                child: Text(
                                  l10n.changeEmail,
                                  style: const TextStyle(
                                    color: SmarturStyle.purple,
                                  ),
                                ),
                              ),
                            ],
                          )
                        else if (isForgotPassword)
                          Column(
                            children: [
                              if (forgotStep == 0)
                                TextFormField(
                                  controller: emailController,
                                  keyboardType: TextInputType.emailAddress,
                                  decoration: InputDecoration(
                                    labelText: l10n.emailAddress,
                                    hintText: l10n.enterEmail,
                                    prefixIcon: const Icon(Icons.email_outlined),
                                    border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                  ),
                                  validator: (value) {
                                    if (value == null || value.isEmpty) {
                                      return l10n.enterEmail;
                                    }
                                    if (!value.contains('@')) {
                                      return l10n.enterValidEmail;
                                    }
                                    return null;
                                  },
                                )
                              else ...[
                                TextFormField(
                                  controller: otpController,
                                  keyboardType: TextInputType.number,
                                  decoration: InputDecoration(
                                    labelText: l10n.verificationCode,
                                    hintText: "000000",
                                    prefixIcon: const Icon(Icons.pin_outlined),
                                    border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 16),
                                TextFormField(
                                  controller: passwordController,
                                  obscureText: obscurePassword,
                                  decoration: InputDecoration(
                                    labelText: l10n.newPassword,
                                    prefixIcon: const Icon(Icons.lock_outline),
                                    suffixIcon: IconButton(
                                      icon: Icon(
                                        obscurePassword
                                            ? Icons.visibility_outlined
                                            : Icons.visibility_off_outlined,
                                      ),
                                      onPressed: () => setModalState(
                                        () => obscurePassword = !obscurePassword,
                                      ),
                                    ),
                                    border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                  ),
                                ),
                              ],
                              const SizedBox(height: 8),
                              TextButton(
                                onPressed: () => setModalState(() {
                                  isForgotPassword = false;
                                  forgotStep = 0;
                                  otpController.clear();
                                  passwordController.clear();
                                }),
                                child: Text(l10n.back),
                              ),
                            ],
                          )
                        else ...[
                          _buildAuthFields(
                            isLogin,
                            nameController,
                            emailController,
                            passwordController,
                            setModalState,
                            obscurePassword: obscurePassword,
                            onTogglePassword: () => setModalState(
                              () => obscurePassword = !obscurePassword,
                            ),
                          ),
                          if (isLogin) ...[
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                Checkbox(
                                  value: rememberMe,
                                  onChanged: (val) {
                                    setModalState(() {
                                      rememberMe = val ?? false;
                                    });
                                  },
                                ),
                                const SizedBox(width: 4),
                                Expanded(
                                  child: Text(
                                    l10n.rememberMe7Days,
                                    style: const TextStyle(
                                      fontFamily: 'Outfit',
                                      fontSize: 13,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            Align(
                              alignment: Alignment.centerRight,
                              child: TextButton(
                                onPressed: () => setModalState(() {
                                  isForgotPassword = true;
                                  forgotStep = 0;
                                   otpController.clear();
                                   passwordController.clear();
                                }),
                                child: Text(
                                  l10n.forgotPassword,
                                  style: const TextStyle(
                                    color: SmarturStyle.purple,
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            ),
                          ],
                          if (!isLogin) ...[
                            const SizedBox(height: 16),
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Checkbox(
                                  materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                  visualDensity: VisualDensity.compact,
                                  value: acceptedTerms,
                                  activeColor: SmarturStyle.purple,
                                  onChanged: (v) => setModalState(
                                    () => acceptedTerms = v ?? false,
                                  ),
                                ),
                                Expanded(
                                  child: Padding(
                                    padding: const EdgeInsets.only(top: 10),
                                    child: RichText(
                                      text: TextSpan(
                                        style: TextStyle(
                                          color: scheme.onSurface,
                                          fontSize: 13,
                                          fontFamily: 'Outfit',
                                          height: 1.4,
                                        ),
                                        children: [
                                          TextSpan(
                                            text: l10n.registerAcceptTermsPrefix,
                                          ),
                                          WidgetSpan(
                                            alignment: PlaceholderAlignment.baseline,
                                            baseline: TextBaseline.alphabetic,
                                            child: GestureDetector(
                                              onTap: () => showTermsAndConditionsModal(context),
                                              child: Text(
                                                l10n.termsAndConditions,
                                                style: const TextStyle(
                                                  color: SmarturStyle.purple,
                                                  fontWeight: FontWeight.w600,
                                                  decoration: TextDecoration.underline,
                                                  decorationColor: SmarturStyle.purple,
                                                  fontFamily: 'Outfit',
                                                  fontSize: 13,
                                                  height: 1.4,
                                                ),
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ],
                        const SizedBox(height: 24),
                        ElevatedButton(
                          onPressed: (isLoadingEmail || isLoadingGoogle)
                              ? null
                              : () async {
                                  if (formKey.currentState!.validate()) {
                                    if (!isLogin && !acceptedTerms && !isForgotPassword) {
                                      if (context.mounted) {
                                        SmarturNotifications.showWarning(context, l10n.termsMustAccept);
                                      }
                                      return;
                                    }
                                    setModalState(() => isLoadingEmail = true);
                                    try {
                                      if (isForgotPassword) {
                                        if (forgotStep == 0) {
                                          await _authService.forgotPassword(emailController.text.trim());
                                          setModalState(() => forgotStep = 1);
                                          if (context.mounted) {
                                            SmarturNotifications.showSuccess(context, l10n.codeSentToEmail(emailController.text));
                                          }
                                        } else {
                                          await _authService.resetPassword(
                                            emailController.text.trim(),
                                            otpController.text.trim(),
                                            passwordController.text,
                                          );
                                          setModalState(() {
                                            isForgotPassword = false;
                                            forgotStep = 0;
                                            isLogin = true;
                                            otpController.clear();
                                            passwordController.clear();
                                          });
                                          if (context.mounted) {
                                            SmarturNotifications.showSuccess(context, l10n.accountCreated);
                                          }
                                        }
                                      } else if (isLogin) {
                                        if (!isWaitingOTP) {
                                          final response = await _authService.loginStep1(
                                            emailController.text.trim(),
                                            passwordController.text.trim(),
                                          );
                                          if (response != null && response['requiresVerification'] == true) {
                                            setModalState(() => isWaitingOTP = true);
                                          } else {
                                            if (context.mounted) {
                                              SmarturNotifications.showError(context, l10n.invalidCredentials);
                                            }
                                          }
                                        } else {
                                          final token = await _authService.verifyOTP(
                                            emailController.text.trim(),
                                            otpController.text.trim(),
                                            rememberMe: rememberMe,
                                          );
                                          if (token != null && context.mounted) {
                                            final savedName = await _authService.getUserName();
                                            if (!context.mounted) return;
                                            Navigator.pop(context);
                                            Navigator.pushReplacement(
                                              context,
                                              MaterialPageRoute(
                                                builder: (_) => MainScreen(userName: savedName, isNewLogin: true),
                                              ),
                                            );
                                          } else {
                                            if (context.mounted) {
                                              SmarturNotifications.showError(context, l10n.invalidCode);
                                            }
                                          }
                                        }
                                      } else {
                                        bool success = await _authService.register(
                                          nameController.text.trim(),
                                          emailController.text.trim(),
                                          passwordController.text.trim(),
                                        );
                                        if (success && context.mounted) {
                                          setModalState(() => isLogin = true);
                                          SmarturNotifications.showSuccess(context, l10n.accountCreated);
                                        }
                                      }
                                    } on AuthRateLimitException {
                                      if (context.mounted) {
                                        SmarturNotifications.showError(context, l10n.tooManyAttempts);
                                      }
                                    } on AuthException catch (e) {
                                      if (context.mounted) {
                                        SmarturNotifications.showError(context, e.message);
                                      }
                                    } catch (e) {
                                      if (context.mounted) {
                                        SmarturNotifications.showError(context, l10n.connectionError);
                                      }
                                    } finally {
                                      setModalState(() => isLoadingEmail = false);
                                    }
                                  }
                                },
                          child: isLoadingEmail
                              ? Text(
                                  '…',
                                  style: TextStyle(
                                    color: Colors.white.withValues(alpha: 0.95),
                                    fontSize: 18,
                                    fontWeight: FontWeight.w600,
                                    fontFamily: 'CalSans',
                                  ),
                                )
                              : Text(
                                  isForgotPassword
                                      ? (forgotStep == 0 ? l10n.sendCode : l10n.updatePassword)
                                      : (isWaitingOTP ? l10n.verify : (isLogin ? l10n.signInButton : l10n.createAccount)),
                                ),
                        ),
                      ],
                      if (!isWaitingOTP && !isForgotPassword) ...[
                        const SizedBox(height: 12),
                        OutlinedButton(
                          onPressed: (isLoadingEmail || isLoadingGoogle)
                              ? null
                              : () async {
                                  setModalState(() => isLoadingGoogle = true);
                                  try {
                                    final response = await _authService
                                        .loginWithGoogle(
                                          rememberMe: rememberMe,
                                        );
                                    if (response != null && context.mounted) {
                                      final savedName = await _authService
                                          .getUserName();
                                      if (!context.mounted) return;
                                      Navigator.pop(context);
                                      Navigator.pushReplacement(
                                        context,
                                        MaterialPageRoute(
                                          builder: (_) => MainScreen(
                                            userName: savedName,
                                            isNewLogin: true,
                                          ),
                                        ),
                                      );
                                    }
                                  } on AuthRateLimitException {
                                    if (context.mounted) {
                                      SmarturNotifications.showError(
                                        context,
                                        l10n.tooManyAttempts,
                                      );
                                    }
                                  } on AuthException catch (e) {
                                    if (context.mounted) {
                                      SmarturNotifications.showError(
                                        context,
                                        e.message,
                                      );
                                    }
                                  } catch (e) {
                                    if (context.mounted) {
                                      SmarturNotifications.showError(
                                        context,
                                        l10n.connectionError,
                                      );
                                    }
                                  } finally {
                                    setModalState(
                                      () => isLoadingGoogle = false,
                                    );
                                  }
                                },
                          style: OutlinedButton.styleFrom(
                            side: BorderSide(color: scheme.outlineVariant),
                            padding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                          child: isLoadingGoogle
                              ? Text(
                                  '…',
                                  style: TextStyle(
                                    color: SmarturStyle.purple.withValues(
                                      alpha: 0.85,
                                    ),
                                    fontSize: 18,
                                    fontWeight: FontWeight.w600,
                                    fontFamily: 'Outfit',
                                  ),
                                )
                              : Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Image.network(
                                      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/1024px-Google_%22G%22_logo.svg.png',
                                      height: 20,
                                    ),
                                    const SizedBox(width: 12),
                                    Text(
                                      l10n.continueWithGoogle,
                                      style: TextStyle(
                                        color: scheme.onSurface,
                                        fontFamily: 'Outfit',
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ],
                                ),
                        ),
                      ],
                      const SizedBox(height: 32),
                      TextButton(
                        onPressed: () => setModalState(() {
                          isLogin = !isLogin;
                          isWaitingOTP =
                              false; // Reset OTP state when switching
                          acceptedTerms = false;
                          otpController.clear();
                        }),
                        child: RichText(
                          text: TextSpan(
                            style: TextStyle(
                              fontFamily: 'Outfit',
                              color: scheme.onSurface,
                            ),
                            children: [
                              TextSpan(
                                text: isLogin
                                    ? l10n.noAccountPrompt
                                    : l10n.haveAccountPrompt,
                              ),
                              TextSpan(
                                text: isLogin ? l10n.signUp : l10n.signInAction,
                                style: const TextStyle(
                                  color: SmarturStyle.purple,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildAuthFields(
    bool isLogin,
    TextEditingController nameCtrl,
    TextEditingController emailCtrl,
    TextEditingController passCtrl,
    StateSetter setModalState, {
    bool obscurePassword = true,
    VoidCallback? onTogglePassword,
  }) {
    final scheme = Theme.of(context).colorScheme;
    final l10n = AppLocalizations.of(context)!;
    String password = passCtrl.text;
    double strength = _getPasswordStrength(password);
    Color strengthColor = _getStrengthColor(strength);

    // Regex checks for real-time feedback
    bool hasMinLength = password.length >= 8;
    bool hasUppercase = RegExp(r'[A-Z]').hasMatch(password);
    bool hasLowercase = RegExp(r'[a-z]').hasMatch(password);
    bool hasNumber = RegExp(r'[0-9]').hasMatch(password);
    bool hasSpecial = RegExp(r'[!@#$%^&*(),.?":{}|<>]').hasMatch(password);

    return Column(
      children: [
        if (!isLogin) ...[
          TextFormField(
            controller: nameCtrl,
            decoration: InputDecoration(
              labelText: l10n.fullName,
              prefixIcon: const Icon(
                Icons.person_outline,
                color: SmarturStyle.purple,
              ),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            validator: (v) {
              if (v == null || v.isEmpty) return l10n.enterFullName;
              if (v.length < 3) return l10n.minThreeChars;
              return null;
            },
          ),
          const SizedBox(height: 16),
        ],
        TextFormField(
          controller: emailCtrl,
          keyboardType: TextInputType.emailAddress,
          decoration: InputDecoration(
            labelText: l10n.emailAddress,
            prefixIcon: const Icon(
              Icons.email_outlined,
              color: SmarturStyle.purple,
            ),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
          ),
          validator: (v) {
            if (v == null || v.isEmpty) return l10n.enterEmail;
            if (isLogin) return null;
            if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(v))
              return l10n.enterValidEmail;
            return null;
          },
        ),
        const SizedBox(height: 16),
        TextFormField(
          controller: passCtrl,
          obscureText: obscurePassword,
          onChanged: (value) => setModalState(() {}),
          decoration: InputDecoration(
            labelText: l10n.password,
            prefixIcon: const Icon(
              Icons.lock_outline,
              color: SmarturStyle.purple,
            ),
            suffixIcon: onTogglePassword != null
                ? IconButton(
                    icon: Icon(
                      obscurePassword
                          ? Icons.visibility_outlined
                          : Icons.visibility_off_outlined,
                      color: scheme.onSurfaceVariant,
                    ),
                    onPressed: onTogglePassword,
                  )
                : null,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
          ),
          validator: (v) {
            if (v == null || v.isEmpty) return l10n.enterPassword;
            if (isLogin) return null;
            if (v.length < 8) return l10n.minEightChars;
            if (!RegExp(r'[A-Z]').hasMatch(v)) return l10n.atLeastOneUppercase;
            if (!RegExp(r'[a-z]').hasMatch(v)) return l10n.atLeastOneLowercase;
            if (!RegExp(r'[0-9]').hasMatch(v)) return l10n.atLeastOneNumber;
            if (!RegExp(r'[!@#$%^&*(),.?":{}|<>]').hasMatch(v))
              return l10n.atLeastOneSpecial;
            return null;
          },
        ),
        if (!isLogin) ...[
          const SizedBox(height: 12),
          // Strength Meter
          ClipRRect(
            borderRadius: BorderRadius.circular(2),
            child: LinearProgressIndicator(
              value: strength,
              backgroundColor: scheme.outlineVariant,
              color: strengthColor,
              minHeight: 6,
            ),
          ),
          const SizedBox(height: 6),
          Align(
            alignment: Alignment.centerRight,
            child: Text(
              _getStrengthText(strength),
              style: TextStyle(
                fontSize: 12,
                color: strengthColor,
                fontWeight: FontWeight.bold,
                fontFamily: 'Outfit',
              ),
            ),
          ),
          const SizedBox(height: 12),
          // Requirements Checklist
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: scheme.surfaceContainerLowest,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: scheme.outlineVariant),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  l10n.passwordRequirements,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'Outfit',
                  ),
                ),
                const SizedBox(height: 8),
                _buildRequirementRow(l10n.minEightChars, hasMinLength),
                _buildRequirementRow(l10n.atLeastOneUppercase, hasUppercase),
                _buildRequirementRow(l10n.atLeastOneLowercase, hasLowercase),
                _buildRequirementRow(l10n.atLeastOneNumber, hasNumber),
                _buildRequirementRow(l10n.specialCharHint, hasSpecial),
              ],
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildRequirementRow(String text, bool isMet) {
    final scheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        children: [
          Icon(
            isMet ? Icons.check_circle : Icons.circle_outlined,
            size: 16,
            color: isMet ? Colors.green : scheme.onSurfaceVariant,
          ),
          const SizedBox(width: 8),
          Text(
            text,
            style: TextStyle(
              fontSize: 12,
              color: isMet ? Colors.green[700] : scheme.onSurfaceVariant,
              fontFamily: 'Outfit',
              decoration: isMet ? TextDecoration.lineThrough : null,
            ),
          ),
        ],
      ),
    );
  }

  double _getPasswordStrength(String password) {
    if (password.isEmpty) return 0.1; // Show a tiny bit so bar isn't empty
    double strength = 0;
    if (password.length >= 8) strength += 0.2;
    if (RegExp(r'[A-Z]').hasMatch(password)) strength += 0.2;
    if (RegExp(r'[a-z]').hasMatch(password)) strength += 0.2;
    if (RegExp(r'[0-9]').hasMatch(password)) strength += 0.2;
    if (RegExp(r'[!@#$%^&*(),.?":{}|<>]').hasMatch(password)) strength += 0.2;
    return strength;
  }

  Color _getStrengthColor(double strength) {
    if (strength <= 0.2) return Colors.red;
    if (strength <= 0.4) return Colors.orange;
    if (strength <= 0.6) return Colors.amber;
    if (strength <= 0.8) return Colors.lightGreen;
    return Colors.green;
  }

  String _getStrengthText(double strength) {
    final l10n = AppLocalizations.of(context)!;
    if (strength <= 0.2) return l10n.strengthVeryWeak;
    if (strength <= 0.4) return l10n.strengthWeak;
    if (strength <= 0.6) return l10n.strengthFair;
    if (strength <= 0.8) return l10n.strengthStrong;
    return l10n.strengthVeryStrong;
  }

  // --- RESTORED BIOMETRICS LOGIC ---
  Future<void> _checkBiometrics(BuildContext context) async {
    final l10n = AppLocalizations.of(context)!;
    try {
      final bool biometricOn = await _authService.isBiometricEnabled();
      if (!biometricOn) {
        if (context.mounted) {
          SmarturNotifications.showWarning(context, l10n.enableBiometricsHint);
        }
        return;
      }

      final bool canAuth =
          await _auth.canCheckBiometrics || await _auth.isDeviceSupported();
      if (!canAuth) {
        if (context.mounted) {
          SmarturNotifications.showWarning(context, l10n.deviceNotSupported);
        }
        return;
      }

      final List<BiometricType> available = await _auth
          .getAvailableBiometrics();
      if (available.isEmpty) {
        if (context.mounted) {
          SmarturNotifications.showInfo(context, l10n.noBiometricsEnrolled);
        }
        return;
      }

      final bool didAuthenticate = await _auth.authenticate(
        localizedReason: l10n.biometricReason,
        options: const AuthenticationOptions(
          biometricOnly: true,
          stickyAuth: true,
        ),
      );

      if (!didAuthenticate) return;

      final String? token = await _authService.getToken();
      if (token != null && context.mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (_) => const MainScreen(userName: null, isNewLogin: false),
          ),
        );
      } else if (context.mounted) {
        // Si no hay token guardado (token == null), informamos
        await _authService.clearSession();
        if (context.mounted) {
          SmarturNotifications.showInfo(context, l10n.sessionExpired);
        }
      }
    } catch (e) {
      if (context.mounted) {
        SmarturNotifications.showError(context, l10n.biometricReadError);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      backgroundColor: scheme.surface,
      body: SmarturBackground(
        child: Stack(
          children: [
            // Logo principal EXACTAMENTE centrado (mismas dimensiones que el SVG del loader)
            // Mientras corre el loader, este logo permanece invisible; solo se muestra
            // cuando el controller del WelcomeScreen arranca, evitando "doble logo".
            Align(
              alignment: Alignment.center,
              child: Padding(
                padding: const EdgeInsets.only(top: 50),
                child: FadeTransition(
                  opacity: _fadeAnimation,
                  child: AnimatedBuilder(
                    animation: _logoZoom,
                    builder: (_, child) {
                      return Transform.scale(
                        scale: _logoZoom.value,
                        child: child,
                      );
                    },
                    child: Image.asset(
                      'assets/imgs/logo_arriba.png',
                      width: 280.42,
                      height: 330.53,
                    ),
                  ),
                ),
              ),
            ),
            // Tagline: posición FIJA alta
            Positioned(
              left: SmarturStyle.spacingLg,
              right: SmarturStyle.spacingLg,
              bottom: 280,
              child: SlideTransition(
                position: _textSlide,
                child: FadeTransition(
                  opacity: _fadeAnimation,
                  child: Text(
                    l10n.tagline,
                    style: TextStyle(
                      fontFamily: 'CalSans',
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: scheme.onSurface,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
            ),
            // Huella: solo si está activa, posicionada arriba del botón Comenzar
            if (_isBiometricActive)
              Positioned(
                left: SmarturStyle.spacingLg,
                right: SmarturStyle.spacingLg,
                bottom: 155,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    FadeTransition(
                      opacity: _fadeAnimation,
                      child: ScaleTransition(
                        scale: _logoScale,
                        child: GestureDetector(
                          onTap: () => _checkBiometrics(context),
                          child: Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: SmarturStyle.purple.withValues(alpha: 0.1),
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: SmarturStyle.purple,
                                width: 2,
                              ),
                            ),
                            child: const Icon(
                              Icons.fingerprint,
                              size: 40,
                              color: SmarturStyle.purple,
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    FadeTransition(
                      opacity: _fadeAnimation,
                      child: Text(
                        l10n.loginWithBiometrics,
                        style: TextStyle(
                          fontFamily: 'Outfit',
                          color: scheme.onSurface,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            Positioned(
              bottom: 50,
              left: SmarturStyle.spacingLg,
              right: SmarturStyle.spacingLg,
              child: FadeTransition(
                opacity: _buttonFade,
                child: SlideTransition(
                  position: _buttonSlide,
                  child: ScaleTransition(
                    scale: _buttonScale,
                    child: ElevatedButton(
                      onPressed: () => _showAuthModal(context, isLogin: true),
                      child: Text(
                        l10n.start,
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontFamily: 'CalSans',
                          fontSize: 18,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
