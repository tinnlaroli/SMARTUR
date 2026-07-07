import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:smartur/l10n/app_localizations.dart';

import '../../../core/utils/notifications.dart';
import '../../../data/services/auth_service.dart';
import '../../widgets/smartur_app_bar.dart';

/// Escanea el QR de la pantalla de login web y aprueba/rechaza la sesión.
/// El QR codifica "challengeId:rawToken" (ver qrLoginController.js).
class QrLoginScanScreen extends StatefulWidget {
  const QrLoginScanScreen({super.key});

  @override
  State<QrLoginScanScreen> createState() => _QrLoginScanScreenState();
}

class _QrLoginScanScreenState extends State<QrLoginScanScreen> {
  final AuthService _authService = AuthService();
  final MobileScannerController _controller = MobileScannerController();
  bool _handling = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  ({int challengeId, String token})? _parse(String raw) {
    final parts = raw.split(':');
    if (parts.length != 2) return null;
    final id = int.tryParse(parts[0]);
    if (id == null || parts[1].isEmpty) return null;
    return (challengeId: id, token: parts[1]);
  }

  Future<void> _onDetect(BarcodeCapture capture) async {
    if (_handling) return;
    if (capture.barcodes.isEmpty) return;
    final raw = capture.barcodes.first.rawValue;
    if (raw == null) return;

    final parsed = _parse(raw);
    final l10n = AppLocalizations.of(context)!;
    if (parsed == null) {
      SmarturNotifications.showError(context, l10n.qrScanInvalid);
      return;
    }

    setState(() => _handling = true);
    await _controller.stop();

    if (!mounted) return;
    final approved = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(l10n.qrScanConfirmTitle),
        content: Text(l10n.qrScanConfirmBody),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(l10n.qrScanDeny),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(l10n.qrScanApprove),
          ),
        ],
      ),
    );

    try {
      if (approved == true) {
        await _authService.approveQrLogin(parsed.challengeId, parsed.token);
        if (mounted) {
          SmarturNotifications.showSuccess(context, l10n.qrScanApproved);
          Navigator.pop(context);
        }
      } else {
        await _authService.denyQrLogin(parsed.challengeId, parsed.token);
        if (mounted) {
          SmarturNotifications.showInfo(context, l10n.qrScanDenied);
          Navigator.pop(context);
        }
      }
    } on AuthException catch (e) {
      if (mounted) {
        SmarturNotifications.showError(context, e.message);
        setState(() => _handling = false);
        await _controller.start();
      }
    } catch (_) {
      if (mounted) {
        SmarturNotifications.showError(context, l10n.qrScanExpired);
        setState(() => _handling = false);
        await _controller.start();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      appBar: SmarturAppBar(title: l10n.qrScanTitle),
      body: Stack(
        fit: StackFit.expand,
        children: [
          MobileScanner(controller: _controller, onDetect: _onDetect),
          Align(
            alignment: Alignment.bottomCenter,
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              color: Colors.black54,
              child: Text(
                l10n.qrScanInstructions,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.white, fontFamily: 'Outfit'),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
