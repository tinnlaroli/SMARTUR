import 'dart:io' show Platform;

import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/foundation.dart' show debugPrint, kIsWeb;
import 'package:flutter/services.dart' show HapticFeedback;
import 'package:vibration/vibration.dart';

/// Vibración corta + un sonido suave al elegir una respuesta.
///
/// La vibración usa el motor directamente (pulsos de 15-35 ms): el háptico del sistema
/// depende del ajuste "vibración al tocar" y en muchos Android no se siente. El sonido no
/// pide el foco de audio (no pausa la música de la persona) y en iOS respeta el modo
/// silencio. Si algo falla, se usa el háptico del sistema y la app sigue sin sonido.
abstract final class ToqueSuave {
  static const _asset = 'sonidos/toque_suave.wav';
  static const _volumen = 0.9;
  static AudioPlayer? _player;
  static final bool _enPruebas = !kIsWeb && Platform.environment.containsKey('FLUTTER_TEST');
  static bool _sinAudio = false;
  static bool? _tieneVibrador;

  static Future<AudioPlayer> _reproductor() async {
    final existente = _player;
    if (existente != null) return existente;
    final player = AudioPlayer();
    await player.setAudioContext(AudioContext(
      android: const AudioContextAndroid(
        contentType: AndroidContentType.sonification,
        usageType: AndroidUsageType.assistanceSonification,
        audioFocus: AndroidAudioFocus.none,
      ),
      iOS: AudioContextIOS(category: AVAudioSessionCategory.ambient),
    ));
    await player.setPlayerMode(PlayerMode.lowLatency);
    await player.setReleaseMode(ReleaseMode.stop);
    await player.setSource(AssetSource(_asset));
    await player.setVolume(_volumen);
    return _player = player;
  }

  /// Elección (respuesta, tarjeta, chip): pulso corto + toque.
  static void elegir() {
    _vibrar(duracion: 18, amplitud: 140);
    _sonar();
  }

  /// Avance de paso: pulso un poco más largo + toque.
  static void avanzar() {
    _vibrar(duracion: 30, amplitud: 180);
    _sonar();
  }

  /// Pulso leve sin sonido (p. ej. cada paso de la carga "pensando").
  static void pulso() => _vibrar(duracion: 12, amplitud: 90);

  /// Error (p. ej. un cuarto motivo): doble pulso, sin sonido.
  static void error() {
    if (_enPruebas) return;
    _vibrarPatron(const [0, 35, 60, 35]);
  }

  static Future<bool> _vibrador() async =>
      _tieneVibrador ??= kIsWeb ? false : await Vibration.hasVibrator().catchError((_) => false);

  static Future<void> _vibrar({required int duracion, required int amplitud}) async {
    if (_enPruebas) return;
    try {
      if (await _vibrador()) {
        await Vibration.vibrate(duration: duracion, amplitude: amplitud);
        return;
      }
    } catch (_) {}
    HapticFeedback.mediumImpact();
  }

  static Future<void> _vibrarPatron(List<int> patron) async {
    try {
      if (await _vibrador()) {
        await Vibration.vibrate(pattern: patron);
        return;
      }
    } catch (_) {}
    HapticFeedback.heavyImpact();
  }

  static Future<void> _sonar() async {
    if (_enPruebas || _sinAudio) return;
    try {
      final player = await _reproductor();
      await player.stop();
      await player.resume();
    } catch (e) {
      _sinAudio = true; // Sin audio disponible: queda solo la vibración.
      debugPrint('[toque_suave] sin sonido: $e');
    }
  }
}
