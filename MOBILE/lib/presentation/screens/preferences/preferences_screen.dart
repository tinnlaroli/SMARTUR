import 'dart:async';

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:smartur/l10n/app_localizations.dart';

import '../../../core/feedback/toque_suave.dart';
import '../../../core/motion/smartur_routes.dart';
import '../../../core/theme/smartur_theme_extensions.dart';
import '../../../core/utils/notifications.dart';
import '../../../data/services/auth_service.dart';
import '../../../data/services/profile_service.dart';
import '../../widgets/formulario_premium.dart';
import '../../widgets/smartur_app_bar.dart';
import '../main/main_screen.dart';

/// Perfil del viajero: una pregunta por pantalla, mismo lenguaje visual que Welltur
/// (tarjetas grandes, barra de pasos, vibración y sonido suaves). Cada sección conserva
/// su color. Las preguntas de una sola respuesta avanzan solas al elegir.
///
/// Lo que se guarda es idéntico al formulario anterior (mismas claves y valores).
class PreferencesScreen extends StatefulWidget {
  final String? userName;

  const PreferencesScreen({super.key, this.userName});

  @override
  State<PreferencesScreen> createState() => _PreferencesScreenState();
}

enum _Paso { sobreTi, intereses, actividad, viaje, presupuesto, lugar, detalles }

class _PreferencesScreenState extends State<PreferencesScreen> {
  static const _pasos = _Paso.values;

  int _i = 0;
  bool _guardando = false;
  String? _error;
  Timer? _autoAvance;

  // Respuestas
  DateTime? _nacimiento;
  String? _genero;
  final Set<String> _intereses = {};
  String? _actividad;
  String? _viaje;
  String? _presupuesto;
  String? _lugar;
  bool _accesibilidad = false;
  bool _visitoAntes = false;
  String? _sostenible;
  final _detalleAccesibilidad = TextEditingController();
  final _restricciones = TextEditingController();

  _Paso get _paso => _pasos[_i];

  @override
  void initState() {
    super.initState();
    _cargarPerfil();
  }

  @override
  void dispose() {
    _autoAvance?.cancel();
    _detalleAccesibilidad.dispose();
    _restricciones.dispose();
    super.dispose();
  }

  /// Rellena con lo ya guardado (GET /profiles/me), si existe.
  Future<void> _cargarPerfil() async {
    final Map<String, dynamic> d;
    try {
      d = await ProfileService.fetchMyProfileForPreferences();
    } catch (_) {
      return; // sin perfil previo: el formulario empieza vacío
    }
    if (!mounted || d.isEmpty) return;
    setState(() {
      final nac = d['birth_date'];
      if (nac is String && nac.isNotEmpty) {
        final p = DateTime.tryParse(nac);
        if (p != null) _nacimiento = DateTime(p.year, p.month, p.day);
      }
      _genero = d['gender'] as String?;
      final intereses = d['interests'];
      if (intereses is String && intereses.isNotEmpty) {
        _intereses.addAll(intereses.split(', '));
      } else if (intereses is List) {
        _intereses.addAll(intereses.map((e) => e.toString()));
      }
      final act = d['activity_level'];
      if (act is int) {
        _actividad = act <= 1 ? 'Bajo' : act <= 3 ? 'Moderado' : act <= 4 ? 'Alto' : 'Extremo';
      } else if (act is String) {
        _actividad = act;
      }
      _viaje = d['travel_type'] as String?;
      _lugar = d['preferred_place'] as String?;
      final pres = d['budget'];
      _presupuesto = pres is String && pres.isNotEmpty ? pres.toLowerCase() : null;
      _accesibilidad = d['has_accessibility'] as bool? ?? false;
      _visitoAntes = d['has_visited_before'] as bool? ?? false;
      _detalleAccesibilidad.text = d['accessibility_detail'] as String? ?? '';
      _restricciones.text = d['restrictions'] as String? ?? '';
      final sost = d['sustainable_preferences'];
      _sostenible = sost is bool ? (sost ? 'Alta prioridad' : 'Sin preferencia') : sost as String?;
    });
  }

  // ── Opciones ──────────────────────────────────────────────────────────────
  List<OpcionPremium> _generos(AppLocalizations l) => [
    (key: 'Masculino', title: l.genderMale, icon: Icons.male, subtitle: null),
    (key: 'Femenino', title: l.genderFemale, icon: Icons.female, subtitle: null),
    (key: 'No binario', title: l.genderNonBinary, icon: Icons.transgender, subtitle: null),
    (key: 'Prefiero no decir', title: l.genderPreferNotToSay, icon: Icons.remove_circle_outline, subtitle: null),
  ];

  List<OpcionPremium> _opcionesIntereses(AppLocalizations l) => [
    (key: 'Cultura', title: l.interestCulture, icon: Icons.museum_outlined, subtitle: null),
    (key: 'Gastronomía', title: l.interestGastronomy, icon: Icons.restaurant_outlined, subtitle: null),
    (key: 'Aventura', title: l.interestAdventure, icon: Icons.terrain, subtitle: null),
    (key: 'Naturaleza', title: l.interestNature, icon: Icons.park_outlined, subtitle: null),
    (key: 'Historia', title: l.interestHistory, icon: Icons.account_balance_outlined, subtitle: null),
    (key: 'Fotografía', title: l.interestPhotography, icon: Icons.camera_alt_outlined, subtitle: null),
    (key: 'Deportes', title: l.interestSports, icon: Icons.sports_soccer, subtitle: null),
    (key: 'Bienestar', title: l.interestWellness, icon: Icons.spa_outlined, subtitle: null),
    (key: 'Arte', title: l.interestArt, icon: Icons.palette_outlined, subtitle: null),
    (key: 'Nightlife', title: l.interestNightlife, icon: Icons.nightlife, subtitle: null),
  ];

  List<OpcionPremium> _actividades(AppLocalizations l) => [
    (key: 'Bajo', title: l.activityLow, icon: Icons.directions_walk, subtitle: null),
    (key: 'Moderado', title: l.activityModerate, icon: Icons.directions_run, subtitle: null),
    (key: 'Alto', title: l.activityHigh, icon: Icons.fitness_center, subtitle: null),
    (key: 'Extremo', title: l.activityExtreme, icon: Icons.electric_bolt, subtitle: null),
  ];

  List<OpcionPremium> _viajes(AppLocalizations l) => [
    (key: 'Mochilero', title: l.travelBackpacker, icon: Icons.backpack_outlined, subtitle: null),
    (key: 'Familiar', title: l.travelFamily, icon: Icons.family_restroom, subtitle: null),
    (key: 'Lujo', title: l.travelLuxury, icon: Icons.star_outline_rounded, subtitle: null),
    (key: 'Aventura', title: l.travelAdventure, icon: Icons.terrain, subtitle: null),
    (key: 'Romántico', title: l.travelRomantic, icon: Icons.favorite_outline_rounded, subtitle: null),
    (key: 'De negocios', title: l.travelBusiness, icon: Icons.business_center_outlined, subtitle: null),
  ];

  // Buckets que entiende el modelo (bajo/medio/alto/premium).
  List<OpcionPremium> _presupuestos(AppLocalizations l) => [
    (key: 'bajo', title: l.budgetLow, icon: Icons.savings_outlined, subtitle: null),
    (key: 'medio', title: l.budgetMedium, icon: Icons.account_balance_wallet_outlined, subtitle: null),
    (key: 'alto', title: l.budgetHigh, icon: Icons.paid_outlined, subtitle: null),
    (key: 'premium', title: l.budgetPremium, icon: Icons.diamond_outlined, subtitle: null),
  ];

  List<OpcionPremium> _lugares(AppLocalizations l) => [
    (key: 'Playa', title: l.placeBeach, icon: Icons.beach_access, subtitle: null),
    (key: 'Montaña', title: l.placeMountain, icon: Icons.landscape_outlined, subtitle: null),
    (key: 'Ciudad', title: l.placeCity, icon: Icons.location_city_outlined, subtitle: null),
    (key: 'Campo', title: l.placeCountryside, icon: Icons.agriculture_outlined, subtitle: null),
    (key: 'Bosque', title: l.placeForest, icon: Icons.forest_outlined, subtitle: null),
    (key: 'Desierto', title: l.placeDesert, icon: Icons.wb_sunny_outlined, subtitle: null),
  ];

  List<OpcionPremium> _sostenibles(AppLocalizations l) => [
    (key: 'Sin preferencia', title: l.sustainableNoPref, icon: Icons.remove_circle_outline, subtitle: null),
    (key: 'Baja prioridad', title: l.sustainableLow, icon: Icons.eco_outlined, subtitle: null),
    (key: 'Prioridad media', title: l.sustainableMedium, icon: Icons.spa_outlined, subtitle: null),
    (key: 'Alta prioridad', title: l.sustainableHigh, icon: Icons.forest_outlined, subtitle: null),
  ];

  // ── Navegación ────────────────────────────────────────────────────────────
  Color _color(BuildContext context, _Paso p) {
    final scheme = Theme.of(context).colorScheme;
    final sem = SmarturSemanticColors.of(context);
    return switch (p) {
      _Paso.sobreTi || _Paso.intereses => scheme.primary,
      _Paso.actividad => sem.altAccent,
      _Paso.viaje => sem.sea,
      _Paso.presupuesto => sem.ember,
      _Paso.lugar || _Paso.detalles => sem.leaf,
    };
  }

  /// Valida el paso actual; devuelve el mensaje de error o null.
  String? _validar(AppLocalizations l) => switch (_paso) {
    _Paso.sobreTi when _nacimiento == null => l.enterBirthYear,
    _Paso.sobreTi when !_fechaValida(_nacimiento!) => l.invalidYear,
    _Paso.sobreTi when _genero == null => l.selectGender,
    _Paso.intereses when _intereses.isEmpty => l.selectAtLeastOneInterest,
    _Paso.actividad when _actividad == null => l.completeAllFields,
    _Paso.viaje when _viaje == null => l.completeAllFields,
    _Paso.presupuesto when _presupuesto == null => l.completeAllFields,
    _Paso.lugar when _lugar == null => l.completeAllFields,
    _ => null,
  };

  void _siguiente() {
    _autoAvance?.cancel();
    final l = AppLocalizations.of(context)!;
    final error = _validar(l);
    if (error != null) {
      ToqueSuave.error();
      setState(() => _error = error);
      return;
    }
    if (_i == _pasos.length - 1) {
      _guardar();
      return;
    }
    ToqueSuave.avanzar();
    setState(() { _error = null; _i++; });
  }

  void _atras() {
    _autoAvance?.cancel();
    if (_i == 0) {
      Navigator.pop(context);
      return;
    }
    setState(() { _error = null; _i--; });
  }

  /// Respuesta única: marca, vibra y pasa a la siguiente pregunta tras un instante.
  void _elegirUnica(void Function() asignar) {
    ToqueSuave.elegir();
    setState(() { asignar(); _error = null; });
    _autoAvance?.cancel();
    final desde = _i;
    _autoAvance = Timer(const Duration(milliseconds: 420), () {
      if (mounted && _i == desde) _siguiente();
    });
  }

  // ── Fecha ─────────────────────────────────────────────────────────────────
  static bool _fechaValida(DateTime d) {
    final hoy = DateTime.now();
    return !d.isAfter(DateTime(hoy.year - 10, hoy.month, hoy.day)) && d.year >= 1900;
  }

  static int _edad(DateTime d) {
    final hoy = DateTime.now();
    var edad = hoy.year - d.year;
    if (hoy.month < d.month || (hoy.month == d.month && hoy.day < d.day)) edad--;
    return edad;
  }

  Future<void> _elegirFecha() async {
    final l = AppLocalizations.of(context)!;
    final hoy = DateTime.now();
    final ultima = DateTime(hoy.year - 10, hoy.month, hoy.day);
    final primera = DateTime(1900);
    final inicial = _nacimiento ?? DateTime(hoy.year - 25, hoy.month, hoy.day);
    final elegida = await showDatePicker(
      context: context,
      initialDate: inicial.isBefore(primera) ? primera : (inicial.isAfter(ultima) ? ultima : inicial),
      firstDate: primera,
      lastDate: ultima,
      helpText: l.birthYear,
      initialEntryMode: DatePickerEntryMode.calendarOnly,
      initialDatePickerMode: DatePickerMode.year,
      locale: Localizations.localeOf(context),
    );
    if (elegida != null && mounted) {
      ToqueSuave.elegir();
      setState(() { _nacimiento = DateTime(elegida.year, elegida.month, elegida.day); _error = null; });
    }
  }

  // ── Guardar ───────────────────────────────────────────────────────────────
  Future<void> _guardar() async {
    final l = AppLocalizations.of(context)!;
    setState(() => _guardando = true);
    try {
      final token = await AuthService().getToken();
      if (token == null) {
        if (mounted) SmarturNotifications.showError(context, l.sessionExpiredPreferences);
        return;
      }
      final n = _nacimiento!;
      final data = <String, dynamic>{
        'birth_date': '${n.year.toString().padLeft(4, '0')}-${n.month.toString().padLeft(2, '0')}-${n.day.toString().padLeft(2, '0')}',
        'age': _edad(n),
        'gender': _genero,
        'interests': _intereses.toList(),
        'activity_level': switch (_actividad) { 'Bajo' => 1, 'Moderado' => 3, 'Alto' => 4, _ => 5 },
        'travel_type': _viaje,
        'preferred_place': _lugar,
        'budget': _presupuesto,
        'has_accessibility': _accesibilidad,
        if (_accesibilidad) 'accessibility_detail': _detalleAccesibilidad.text.trim(),
        'has_visited_before': _visitoAntes,
        'restrictions': _restricciones.text.trim(),
        // La BD espera boolean: cualquier opción distinta de "Sin preferencia" = true.
        'sustainable_preferences': _sostenible != null && _sostenible != 'Sin preferencia',
      };
      final ok = await ProfileService.savePreferences(data);
      if (!mounted) return;
      if (!ok) {
        SmarturNotifications.showError(context, l.couldNotSavePreferences);
        return;
      }
      ToqueSuave.avanzar();
      SmarturNotifications.showSuccess(context, l.profileReady);
      await Future.delayed(const Duration(milliseconds: 600));
      if (!mounted) return;
      Navigator.pushAndRemoveUntil(
        context,
        smarturFadeRoute(MainScreen(userName: widget.userName, isNewLogin: true)),
        (_) => false,
      );
    } finally {
      if (mounted) setState(() => _guardando = false);
    }
  }

  // ── UI ────────────────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final l = AppLocalizations.of(context)!;
    final acento = _color(context, _paso);
    final sobreAcento = ThemeData.estimateBrightnessForColor(acento) == Brightness.dark ? Colors.white : Colors.black;
    final ultimo = _i == _pasos.length - 1;

    final (titulo, pista) = switch (_paso) {
      _Paso.sobreTi => (l.stepAboutYou, l.stepAboutYouSubtitle),
      _Paso.intereses => (l.yourInterests, l.stepYourTastesSubtitle),
      _Paso.actividad => (l.activityLevel, l.choosePreference),
      _Paso.viaje => (l.travelType, l.choosePreference),
      _Paso.presupuesto => (l.budgetLevel, l.choosePreference),
      _Paso.lugar => (l.preferredPlace, l.choosePreference),
      _Paso.detalles => (l.stepDetails, l.stepDetailsSubtitle),
    };

    return Scaffold(
      backgroundColor: scheme.surface,
      appBar: SmarturAppBar(
        showBack: true,
        onBack: _atras,
        titleWidget: SmarturAccentTitle(l.appTitle, fontSize: 16),
      ),
      body: SafeArea(child: Column(children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(24, 14, 24, 10),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            BarraPasosPremium(pasos: _pasos.length, actual: _i + 1, acento: acento),
            const SizedBox(height: 16),
            Text(l.stepXOfY(_i + 1, _pasos.length).toUpperCase(),
              style: TextStyle(fontFamily: 'Outfit', color: acento, fontSize: 10.5, fontWeight: FontWeight.w800, letterSpacing: 1.2)),
            const SizedBox(height: 6),
            AnimatedSwitcher(
              duration: const Duration(milliseconds: 260),
              layoutBuilder: (actual, previos) => Stack(
                alignment: Alignment.topLeft,
                children: [...previos, ?actual],
              ),
              child: Column(
                key: ValueKey('titulo_$_i'),
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(titulo, style: TextStyle(fontFamily: 'CalSans', fontSize: 26, height: 1.12, color: scheme.onSurface)),
                  const SizedBox(height: 5),
                  Text(pista, style: TextStyle(fontFamily: 'Outfit', fontSize: 13, height: 1.4, color: scheme.onSurfaceVariant)),
                ],
              ),
            ),
          ]),
        ),
        Expanded(child: AnimatedSwitcher(
          duration: const Duration(milliseconds: 320),
          switchInCurve: Curves.easeOutCubic,
          switchOutCurve: Curves.easeInCubic,
          // Arriba y a todo el alto: el Stack por defecto centra el paso y deja un hueco.
          layoutBuilder: (actual, previos) => Stack(
            alignment: Alignment.topCenter,
            fit: StackFit.expand,
            children: [...previos, ?actual],
          ),
          transitionBuilder: (child, anim) => FadeTransition(
            opacity: anim,
            child: SlideTransition(position: Tween(begin: const Offset(0.04, 0), end: Offset.zero).animate(anim), child: child),
          ),
          child: SingleChildScrollView(
            key: ValueKey('paso_$_i'),
            padding: const EdgeInsets.fromLTRB(20, 4, 20, 16),
            child: _cuerpo(context, l, acento),
          ),
        )),
        if (_error != null)
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 0, 24, 4),
            child: Text(_error!, style: TextStyle(fontFamily: 'Outfit', color: scheme.error, fontSize: 12.5)),
          ),
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 6, 20, 16),
          child: Row(children: [
            if (_i > 0) ...[
              Expanded(child: OutlinedButton(
                onPressed: _guardando ? null : _atras,
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size.fromHeight(50),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16))),
                child: Text(l.back, style: const TextStyle(fontFamily: 'Outfit')),
              )),
              const SizedBox(width: 12),
            ],
            Expanded(child: FilledButton(
              onPressed: _guardando ? null : _siguiente,
              style: FilledButton.styleFrom(
                backgroundColor: acento,
                foregroundColor: sobreAcento,
                minimumSize: const Size.fromHeight(50),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16))),
              child: _guardando
                  ? SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2.2, color: sobreAcento))
                  : Text(ultimo ? l.save : l.next, style: const TextStyle(fontFamily: 'Outfit', fontWeight: FontWeight.w700)),
            )),
          ]),
        ),
      ])),
    );
  }

  Widget _cuerpo(BuildContext context, AppLocalizations l, Color acento) {
    switch (_paso) {
      case _Paso.sobreTi:
        final fecha = _nacimiento == null
            ? l.dateFormatPlaceholder
            : DateFormat('d MMMM yyyy', Localizations.localeOf(context).toString()).format(_nacimiento!);
        return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          TarjetaPremium(
            opcion: (key: 'fecha', title: l.birthYear, icon: Icons.cake_outlined, subtitle: fecha),
            seleccionada: _nacimiento != null,
            acento: acento,
            horizontal: true,
            onTap: _elegirFecha,
          ),
          _subtitulo(context, l.gender),
          RejillaPremium(
            opciones: _generos(l),
            elegida: (k) => _genero == k,
            acento: acento,
            onTap: (k) { ToqueSuave.elegir(); setState(() { _genero = k; _error = null; }); },
          ),
        ]);
      case _Paso.intereses:
        return RejillaPremium(
          opciones: _opcionesIntereses(l),
          elegida: _intereses.contains,
          acento: acento,
          onTap: (k) {
            ToqueSuave.elegir();
            setState(() { _intereses.contains(k) ? _intereses.remove(k) : _intereses.add(k); _error = null; });
          },
        );
      case _Paso.actividad:
        return RejillaPremium(
          opciones: _actividades(l), columnas: 1, acento: acento,
          elegida: (k) => _actividad == k,
          onTap: (k) => _elegirUnica(() => _actividad = k),
        );
      case _Paso.viaje:
        return RejillaPremium(
          opciones: _viajes(l), acento: acento,
          elegida: (k) => _viaje == k,
          onTap: (k) => _elegirUnica(() => _viaje = k),
        );
      case _Paso.presupuesto:
        return RejillaPremium(
          opciones: _presupuestos(l), columnas: 1, acento: acento,
          elegida: (k) => _presupuesto == k,
          onTap: (k) => _elegirUnica(() => _presupuesto = k),
        );
      case _Paso.lugar:
        return RejillaPremium(
          opciones: _lugares(l), acento: acento,
          elegida: (k) => _lugar == k,
          onTap: (k) => _elegirUnica(() => _lugar = k),
        );
      case _Paso.detalles:
        final sem = SmarturSemanticColors.of(context);
        return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          TarjetaPremium(
            opcion: (key: 'acc', title: l.needAccessibility, icon: Icons.accessible_forward, subtitle: l.accessibilitySubtitle),
            seleccionada: _accesibilidad,
            acento: sem.sea,
            horizontal: true,
            onTap: () { ToqueSuave.elegir(); setState(() => _accesibilidad = !_accesibilidad); },
          ),
          AnimatedSize(
            duration: const Duration(milliseconds: 240),
            curve: Curves.easeOutCubic,
            child: _accesibilidad
                ? Padding(
                    padding: const EdgeInsets.only(top: 10),
                    child: _campo(context, _detalleAccesibilidad, l.describeNeedOptional, l.accessibilityHint, Icons.edit_outlined, sem.sea),
                  )
                : const SizedBox(width: double.infinity),
          ),
          const SizedBox(height: 10),
          TarjetaPremium(
            opcion: (key: 'vis', title: l.visitedHighMountains, icon: Icons.history_outlined, subtitle: l.visitedSubtitle),
            seleccionada: _visitoAntes,
            acento: sem.ember,
            horizontal: true,
            onTap: () { ToqueSuave.elegir(); setState(() => _visitoAntes = !_visitoAntes); },
          ),
          const SizedBox(height: 10),
          _campo(context, _restricciones, l.dietaryRestrictions, l.dietaryHint, Icons.no_food_outlined, sem.altAccent),
          _subtitulo(context, l.sustainablePreferences),
          RejillaPremium(
            opciones: _sostenibles(l), acento: acento,
            elegida: (k) => _sostenible == k,
            onTap: (k) { ToqueSuave.elegir(); setState(() => _sostenible = k); },
          ),
        ]);
    }
  }

  Widget _subtitulo(BuildContext context, String texto) => Padding(
    padding: const EdgeInsets.only(top: 22, bottom: 10, left: 2),
    child: Text(texto, style: TextStyle(
      fontFamily: 'Outfit', fontSize: 13.5, fontWeight: FontWeight.w800, letterSpacing: .2,
      color: Theme.of(context).colorScheme.onSurface)),
  );

  Widget _campo(BuildContext context, TextEditingController c, String etiqueta, String pista, IconData icono, Color color) {
    final scheme = Theme.of(context).colorScheme;
    final borde = OutlineInputBorder(
      borderRadius: BorderRadius.circular(20),
      borderSide: BorderSide(color: scheme.outlineVariant.withValues(alpha: .7)));
    return TextField(
      controller: c,
      maxLines: 2,
      minLines: 1,
      style: const TextStyle(fontFamily: 'Outfit', fontSize: 14.5),
      decoration: InputDecoration(
        labelText: etiqueta,
        hintText: pista,
        filled: true,
        fillColor: scheme.surfaceContainerLow,
        prefixIcon: Icon(icono, color: color),
        border: borde,
        enabledBorder: borde,
        focusedBorder: borde.copyWith(borderSide: BorderSide(color: color, width: 1.8)),
      ),
    );
  }
}
