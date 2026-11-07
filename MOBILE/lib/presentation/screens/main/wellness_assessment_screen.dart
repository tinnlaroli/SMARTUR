import 'dart:async';
import 'dart:convert';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show rootBundle;

import '../../../data/services/wellness_service.dart';
import '../explore/detail_view_page.dart';
import '../../widgets/smartur_app_bar.dart';
import '../../widgets/wellness_poi_card.dart';
import '../../../core/feedback/toque_suave.dart';
import '../../../core/theme/welltur_theme.dart';

/// Preguntas propias de la encuesta WELLTUR (oct-2026): respaldo solo si la compilación no
/// trae el texto licenciado de la PSS-10.
const _escalaMes = ['Nunca', 'Casi nunca', 'Algunas veces', 'Frecuentemente', 'Muy frecuentemente'];
const _escalaSemana = ['Nunca', 'A veces', 'Frecuentemente', 'Casi siempre'];
const _preguntasEstres = <({String key, String texto, List<String> opciones})>[
  (key: 'p3', texto: 'Durante el último mes, ¿con qué frecuencia te has sentido estresado(a), sobrecargado(a) o con dificultades para manejar tus responsabilidades?', opciones: _escalaMes),
  (key: 'p4', texto: 'Durante el último mes, ¿con qué frecuencia has sentido que no tienes suficiente control sobre situaciones importantes de tu vida?', opciones: _escalaMes),
  (key: 'p5a', texto: 'En la última semana: dificultad para relajarte', opciones: _escalaSemana),
  (key: 'p5b', texto: 'En la última semana: nerviosismo o inquietud', opciones: _escalaSemana),
  (key: 'p5c', texto: 'En la última semana: irritabilidad o tensión', opciones: _escalaSemana),
  (key: 'p5d', texto: 'En la última semana: dificultad para concentrarte', opciones: _escalaSemana),
];

typedef _Opcion = ({String key, String title, String subtitle, IconData icon});

/// Motivos del viaje (protocolo M/W). Se piden junto con la PSS-10 y las modalidades W:
/// el recomendador pondera las tres cosas en una sola búsqueda.
const _motivos = <_Opcion>[
  (key: 'M1', title: 'Descansar o hacer una pausa', subtitle: 'Bajar el ritmo o salir de la rutina.', icon: Icons.weekend_outlined),
  (key: 'M2', title: 'Mantenerme activo/a', subtitle: 'Dedicar tiempo a mi vitalidad física.', icon: Icons.directions_run_outlined),
  (key: 'M3', title: 'Conectar con la naturaleza', subtitle: 'Un entorno natural o al aire libre.', icon: Icons.park_outlined),
  (key: 'M4', title: 'Aprender', subtitle: 'Conocer una práctica, oficio o tradición.', icon: Icons.menu_book_outlined),
  (key: 'M5', title: 'Compartir o conectar', subtitle: 'Convivir con personas o comunidad.', icon: Icons.groups_outlined),
  (key: 'M6', title: 'Probar algo nuevo', subtitle: 'Una experiencia distinta para mí.', icon: Icons.explore_outlined),
  (key: 'M7', title: 'Dedicar tiempo al autocuidado', subtitle: 'Una actividad de cuidado personal.', icon: Icons.spa_outlined),
  (key: 'M8', title: 'Explorar alimentos o bebidas', subtitle: 'Cocina local, café, mercados.', icon: Icons.local_cafe_outlined),
  (key: 'M9', title: 'Reflexionar o practicar atención plena', subtitle: 'Un momento o práctica personal.', icon: Icons.self_improvement_outlined),
];

const _modalidades = <_Opcion>[
  (key: 'W1', title: 'Pausa y descanso', subtitle: 'Hospedaje tranquilo, bajar el ritmo.', icon: Icons.bedtime_outlined),
  (key: 'W2', title: 'Naturaleza y aire libre', subtitle: 'Cascadas, bosques, miradores.', icon: Icons.forest_outlined),
  (key: 'W3', title: 'Movimiento', subtitle: 'Caminatas, senderismo, aventura.', icon: Icons.hiking_outlined),
  (key: 'W4', title: 'Mente-cuerpo', subtitle: 'Yoga, meditación, temazcal.', icon: Icons.self_improvement_outlined),
  (key: 'W5', title: 'Experiencia culinaria', subtitle: 'Cocina local, café de altura.', icon: Icons.restaurant_outlined),
  (key: 'W6', title: 'Aprendizaje y cultura', subtitle: 'Museos, artesanía, comunidades.', icon: Icons.museum_outlined),
  (key: 'W7', title: 'Autocuidado', subtitle: 'Spa, masajes, balnearios.', icon: Icons.spa_outlined),
];

const _estadosMexico = <String>[
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas', 'Chihuahua',
  'Ciudad de México', 'Coahuila', 'Colima', 'Durango', 'Estado de México', 'Guanajuato', 'Guerrero',
  'Hidalgo', 'Jalisco', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro',
  'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz',
  'Yucatán', 'Zacatecas',
];

const _regiones = ['', 'Orizaba', 'Córdoba', 'Fortín', 'Huatusco', 'Coscomatepec', 'Ixhuatlán del Café', 'Ixtaczoquitlán'];

const _esfuerzos = <({int nivel, String titulo, String detalle, IconData icon})>[
  (nivel: 1, titulo: 'Suave', detalle: 'Poco esfuerzo físico', icon: Icons.self_improvement_outlined),
  (nivel: 2, titulo: 'Intermedio', detalle: 'Caminar un rato está bien', icon: Icons.directions_walk_outlined),
  (nivel: 3, titulo: 'Activo', detalle: 'Me gustan los retos físicos', icon: Icons.hiking_outlined),
];

/// PSS-10 con licencia (Mapi Research Trust n.º 153824). Los textos se leen del asset que el equipo
/// llena textualmente desde el instrumento; si falta alguno, la PSS-10 no se muestra. Se presenta
/// un ítem por pantalla, sin modificar redacción ni opciones.
class _Pss10 {
  final String instruccion;
  final List<String> opciones;
  final List<String> items;
  final String copyright;
  const _Pss10(this.instruccion, this.opciones, this.items, this.copyright);

  static Future<_Pss10?> cargar() async {
    try {
      final j = jsonDecode(await rootBundle.loadString('assets/instrumentos/pss10_es_mx.json')) as Map<String, dynamic>;
      final opciones = (j['opciones'] as List).cast<String>();
      final items = (j['items'] as List).cast<String>();
      final instruccion = j['instruccion'] as String? ?? '';
      if (opciones.length != 5 || items.length != 10 || [...opciones, ...items, instruccion].any((t) => t.trim().isEmpty)) {
        return null;
      }
      return _Pss10(instruccion, opciones, items, j['copyright'] as String? ?? '');
    } catch (_) {
      return null;
    }
  }
}

class WellnessAssessmentScreen extends StatefulWidget {
  const WellnessAssessmentScreen({super.key});

  @override
  State<WellnessAssessmentScreen> createState() => _WellnessAssessmentScreenState();
}

class _WellnessAssessmentScreenState extends State<WellnessAssessmentScreen> {
  // Acento de la paleta WELLTUR, legible en modo claro y oscuro.
  Color get _green => WellturPalette.acento(context);
  Color get _onGreen => WellturPalette.sobreAcento(context);
  static const _pasos = 5; // estrés, motivos, modalidades, esfuerzo, zona
  static const _titulos = {
    1: '¿Cómo te has sentido?',
    2: '¿Qué buscas en este viaje?',
    3: '¿Cómo te gustaría vivirlo?',
    4: '¿Cuánto esfuerzo físico?',
    5: '¿Dónde buscas?',
  };
  int _step = 0; // 0 intro, 1-5 preguntas, 6 resultados
  bool _consentGiven = false;
  bool _omitirEstres = false;
  int _pregunta = 0; // ítem visible del cuestionario de estrés
  bool _verInstruccion = false; // instrucción oficial de la PSS-10, plegable
  final Map<String, int> _respuestas = {};
  final List<String> _motivosElegidos = [];
  final List<String> _seleccion = [];
  int _maxEffort = 2;
  // Zona: las Altas Montañas (municipio o toda la región) o todo México (estado o todo el país).
  bool _todoMexico = false;
  String _region = '';
  bool _loading = false;
  String? _loadError;
  String? _formError;
  WellnessRecommendationResult? _result;
  int? _fitRating;
  bool _feedbackSent = false;
  final WellnessService _service = WellnessService();
  _Pss10? _pss;
  // Un solo cuestionario: la PSS-10 (instrumento validado). Las seis preguntas breves solo
  // quedan como respaldo si una compilación no trae el texto licenciado de la PSS-10.
  bool get _usarPss => _pss != null;
  final Map<int, int> _respuestasPss = {};
  Timer? _avance;

  @override
  void initState() {
    super.initState();
    _Pss10.cargar().then((pss) {
      if (mounted && pss != null) setState(() => _pss = pss);
    });
  }

  @override
  void dispose() {
    _avance?.cancel();
    _relojPensando?.cancel();
    super.dispose();
  }

  int get _totalPreguntas => _usarPss ? 10 : _preguntasEstres.length;
  int get _respondidas => _usarPss ? _respuestasPss.length : _respuestas.length;
  String _textoPregunta(int i) => _usarPss ? _pss!.items[i] : _preguntasEstres[i].texto;
  List<String> _opcionesPregunta(int i) => _usarPss ? _pss!.opciones : _preguntasEstres[i].opciones;
  int? _respuesta(int i) => _usarPss ? _respuestasPss[i] : _respuestas[_preguntasEstres[i].key];

  bool get _estresCompleto => _usarPss
      ? _respuestasPss.length >= 8 // la puntuación oficial acepta hasta 2 ítems sin responder
      : _preguntasEstres.every((p) => _respuestas.containsKey(p.key));

  void _responder(int i, int valor) {
    ToqueSuave.elegir();
    setState(() {
      _formError = null;
      if (_usarPss) {
        _respuestasPss[i] = valor;
      } else {
        _respuestas[_preguntasEstres[i].key] = valor;
      }
    });
    // Avanza solo, con una pausa breve para que se vea la selección.
    _avance?.cancel();
    if (i < _totalPreguntas - 1) {
      _avance = Timer(const Duration(milliseconds: 280), () {
        if (mounted && _step == 1 && _pregunta == i) setState(() => _pregunta = i + 1);
      });
    }
  }

  void _next() {
    if (_step == 1 && !_omitirEstres && !_estresCompleto) {
      ToqueSuave.error();
      setState(() => _formError = _usarPss
          ? 'Responde al menos 8 de las 10 preguntas o elige "Prefiero no responder".'
          : 'Responde las seis preguntas o elige "Prefiero no responder".');
      return;
    }
    ToqueSuave.avanzar();
    setState(() { _formError = null; _loadError = null; _step = (_step + 1).clamp(0, _pasos + 1); });
    if (_step == _pasos + 1) _submit();
  }

  void _back() {
    if (_step == 0 || _step == _pasos + 1) {
      Navigator.of(context).pop();
      return;
    }
    if (_step == 1 && !_omitirEstres && _pregunta > 0) {
      setState(() { _pregunta--; _formError = null; });
      return;
    }
    setState(() { _loadError = null; _formError = null; _step--; });
  }

  // ── Recomendación con "pensamiento" visible ─────────────────────────────
  // Los pasos describen lo que de verdad hace el recomendador; la animación dura lo que
  // tarde la respuesta, con un mínimo para que cada paso alcance a leerse.
  List<String> get _pasosPensando => [
    _omitirEstres ? 'Usando el perfil general (sin preguntas de estrés)' : 'Leyendo tu nivel de estrés (PSS-10)',
    'Comparando con 6,224 perfiles de estrés en México',
    'Ponderando tus motivos y formas de vivir el viaje',
    _todoMexico ? 'Buscando en el inventario de bienestar de México' : 'Buscando entre negocios locales de las Altas Montañas',
    'Equilibrando variedad y negocios locales (MiPyME)',
  ];
  int _pasoPensando = 0;
  Timer? _relojPensando;

  Future<void> _submit() async {
    setState(() { _loading = true; _loadError = null; _pasoPensando = 0; });
    final animacion = Completer<void>();
    _relojPensando?.cancel();
    _relojPensando = Timer.periodic(const Duration(milliseconds: 650), (t) {
      if (!mounted) return t.cancel();
      if (_pasoPensando < _pasosPensando.length - 1) {
        ToqueSuave.pulso();
        setState(() => _pasoPensando++);
      } else {
        t.cancel();
        if (!animacion.isCompleted) animacion.complete();
      }
    });
    try {
      final result = await _service.recommendV2(
        stressItems: _omitirEstres || _usarPss ? null : Map.of(_respuestas),
        pssItems: _omitirEstres || !_usarPss ? null : List.generate(10, (i) => _respuestasPss[i]),
        motives: List.of(_motivosElegidos),
        modalities: List.of(_seleccion),
        maxEffort: _maxEffort,
        saveHistory: _consentGiven,
        scope: _todoMexico ? 'mexico' : 'altas_montanas',
        regionFilter: _region.isEmpty ? null : _region,
      );
      await animacion.future;
      if (!mounted) return;
      ToqueSuave.avanzar();
      setState(() { _pasoPensando = _pasosPensando.length; _result = result; _loading = false; });
    } catch (e, st) {
      // Se registra el motivo real para poder diagnosticarlo (adb logcat / consola).
      debugPrint('[welltur] recomendación falló: $e\n$st');
      _relojPensando?.cancel();
      if (!mounted) return;
      ToqueSuave.error();
      setState(() {
        _loadError = 'No pudimos conectar con el recomendador. Revisa tu conexión e inténtalo de nuevo.';
        _loading = false;
      });
    }
  }

  Future<void> _sendFeedback(int rating) async {
    final session = _result?.sessionId;
    if (_feedbackSent || session == null) return;
    ToqueSuave.elegir();
    setState(() => _fitRating = rating);
    try {
      await _service.submitSatisfaction(sessionId: session, fitRating: rating);
      if (mounted) setState(() => _feedbackSent = true);
    } catch (_) {
      if (mounted) setState(() => _fitRating = null);
    }
  }

  void _openDestination(WellnessDestination destination) {
    Navigator.of(context).push(MaterialPageRoute<void>(
      builder: (_) => DetailViewPage(
        title: destination.nombreLugar,
        heroTag: 'welltur_${destination.idDestino}',
        heroImageUrl: destination.imageUrl ?? '',
        subtitle: destination.descripcionBienestar,
        locationLine: destination.municipio.isNotEmpty ? '${destination.municipio}, ${destination.estado}' : destination.estado,
        rating: 0,
        galleryUrls: const [],
        placeId: destination.detailPagePlaceId,
        lat: destination.lat,
        lon: destination.lon,
        showRatingPill: false,
      ),
    ));
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final enResultados = _step == _pasos + 1;
    return Scaffold(
      backgroundColor: scheme.surface,
      appBar: SmarturAppBar(
        showBack: true,
        onBack: _back,
        titleWidget: SmarturAccentTitle(enResultados ? 'Welltur · resultados' : 'Welltur · tu viaje', fontSize: 16),
      ),
      body: AnimatedSwitcher(
        duration: const Duration(milliseconds: 320),
        switchInCurve: Curves.easeOutCubic,
        switchOutCurve: Curves.easeInCubic,
        transitionBuilder: (child, anim) => FadeTransition(
          opacity: anim,
          child: SlideTransition(position: Tween(begin: const Offset(0.04, 0), end: Offset.zero).animate(anim), child: child),
        ),
        child: KeyedSubtree(
          key: ValueKey(_loading ? 'cargando' : 'paso_$_step${_loadError != null ? '_error' : ''}'),
          child: _loading
              ? _pensandoView(scheme)
              : _step == 0
                  ? _intro(scheme)
                  : enResultados && _result != null
                      ? _results(scheme)
                      : _loadError != null
                          ? _errorView(scheme)
                          : _question(scheme),
        ),
      ),
    );
  }

  // ── Intro ────────────────────────────────────────────────────────────────
  Widget _intro(ColorScheme scheme) => SafeArea(
    child: SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(24, 20, 24, 28),
      child: Column(crossAxisAlignment: CrossAxisAlignment.center, children: [
        _OrbeWelltur(color: _green, tamano: 96),
        const SizedBox(height: 22),
        Text('Tu viaje de bienestar', textAlign: TextAlign.center,
          style: TextStyle(fontFamily: 'CalSans', fontSize: 30, height: 1.1, color: scheme.onSurface)),
        const SizedBox(height: 10),
        Text('Un solo cuestionario: cómo te has sentido, qué buscas en el viaje y dónde. Te sugerimos experiencias de negocios locales de las Altas Montañas o de todo México.',
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 15, height: 1.5, color: scheme.onSurfaceVariant)),
        const SizedBox(height: 18),
        Wrap(alignment: WrapAlignment.center, spacing: 8, runSpacing: 8, children: [
          _pastilla(scheme, Icons.timer_outlined, '≈ 2 minutos'),
          _pastilla(scheme, Icons.psychology_alt_outlined, 'PSS-10 opcional'),
          _pastilla(scheme, Icons.storefront_outlined, 'Negocios locales'),
        ]),
        const SizedBox(height: 18),
        _infoBox(scheme,
          'Las preguntas de estrés (PSS-10) son opcionales y no son un diagnóstico. Lo que eliges en el viaje pesa más; el estrés ajusta el orden: en nuestra encuesta (137 personas) y en 6,224 mexicanos del estudio COVIDiSTRESS, a más estrés se prefiere más descansar y convivir.',
          Icons.info_outline_rounded),
        const SizedBox(height: 10),
        InkWell(
          onTap: () => setState(() => _consentGiven = !_consentGiven),
          borderRadius: BorderRadius.circular(12),
          child: Padding(padding: const EdgeInsets.symmetric(vertical: 6), child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Checkbox(value: _consentGiven, activeColor: _green, checkColor: _onGreen, onChanged: (v) => setState(() => _consentGiven = v ?? false)),
            Expanded(child: Padding(padding: const EdgeInsets.only(top: 12), child: Text(
              'Opcional: guardar esta búsqueda (incluido tu puntaje de estrés) para mejorar las recomendaciones y poder valorarlas. Si no lo activas, tus respuestas se usan solo para esta búsqueda. Puedes borrar el historial desde tu perfil.',
              style: TextStyle(fontSize: 12, height: 1.45, color: scheme.onSurfaceVariant)))),
          ])),
        ),
        const SizedBox(height: 18),
        _primaryButton('Empezar · $_pasos pasos', _next),
      ]),
    ),
  );

  Widget _pastilla(ColorScheme scheme, IconData icon, String texto) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
    decoration: BoxDecoration(color: _green.withValues(alpha: .09), borderRadius: BorderRadius.circular(30)),
    child: Row(mainAxisSize: MainAxisSize.min, children: [
      Icon(icon, size: 15, color: _green),
      const SizedBox(width: 6),
      Text(texto, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: scheme.onSurface)),
    ]),
  );

  // ── Pasos ────────────────────────────────────────────────────────────────
  Widget _question(ColorScheme scheme) {
    final hints = {
      1: _usarPss ? 'Escala de estrés percibido (PSS-10). Toca una respuesta y avanzamos solos.' : 'Seis preguntas breves. Toca una respuesta y avanzamos solos.',
      2: 'Elige hasta tres, en orden de importancia.',
      3: 'Opcional: hasta tres formas de experiencia, en orden.',
      4: 'Primero te mostramos lo que no pida más que esto.',
      5: 'Las Altas Montañas o cualquier parte de México.',
    };
    final body = switch (_step) {
      1 => _stressQuestions(scheme),
      2 => _grid(scheme, _motivos, _motivosElegidos),
      3 => _grid(scheme, _modalidades, _seleccion),
      4 => _effortChoices(scheme),
      _ => _regionChoices(scheme),
    };
    // Avance global, incluido el avance dentro del cuestionario de estrés.
    final dentroEstres = _step == 1 && !_omitirEstres ? _respondidas / _totalPreguntas : (_step > 1 ? 1.0 : 0.0);
    return SafeArea(child: Column(children: [
      Padding(padding: const EdgeInsets.fromLTRB(24, 14, 24, 10), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: List.generate(_pasos, (i) {
          final valor = i + 1 < _step ? 1.0 : (i + 1 == _step ? (i == 0 ? math.max(.08, dentroEstres) : 0.5) : 0.0);
          return Expanded(child: Container(
            height: 5, margin: const EdgeInsets.only(right: 6),
            decoration: BoxDecoration(color: scheme.outlineVariant.withValues(alpha: .6), borderRadius: BorderRadius.circular(4)),
            child: Align(alignment: Alignment.centerLeft, child: AnimatedFractionallySizedBox(
              duration: const Duration(milliseconds: 420), curve: Curves.easeOutCubic,
              widthFactor: valor,
              child: Container(decoration: BoxDecoration(color: _green, borderRadius: BorderRadius.circular(4))),
            )),
          ));
        })),
        const SizedBox(height: 16),
        Row(children: [
          Expanded(child: Text('PASO $_step DE $_pasos', maxLines: 1, overflow: TextOverflow.ellipsis,
            style: TextStyle(color: _green, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.2))),
          const SizedBox(width: 8),
          if (_step == 1 && !_omitirEstres)
            Flexible(child: Text('Pregunta ${_pregunta + 1} de $_totalPreguntas', maxLines: 1, overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.end,
              style: TextStyle(color: scheme.onSurfaceVariant, fontSize: 11, fontWeight: FontWeight.w600))),
        ]),
        const SizedBox(height: 6),
        Row(crossAxisAlignment: CrossAxisAlignment.center, children: [
          Flexible(child: Text(_titulos[_step]!, style: TextStyle(fontFamily: 'CalSans', fontSize: 26, height: 1.12, color: scheme.onSurface))),
          // Instrucciones oficiales de la PSS-10: se muestran u ocultan con la "i".
          if (_step == 1 && _usarPss && !_omitirEstres)
            IconButton(
              onPressed: () { ToqueSuave.pulso(); setState(() => _verInstruccion = !_verInstruccion); },
              tooltip: _verInstruccion ? 'Ocultar instrucciones' : 'Instrucciones de la escala',
              color: _green,
              visualDensity: VisualDensity.compact,
              icon: Icon(_verInstruccion ? Icons.info_rounded : Icons.info_outline_rounded, size: 24),
            ),
        ]),
        const SizedBox(height: 5),
        Text(hints[_step]!, style: TextStyle(fontSize: 13, height: 1.4, color: scheme.onSurfaceVariant)),
      ])),
      // La llave por paso hace que cada paso empiece arriba.
      Expanded(child: SingleChildScrollView(key: ValueKey('paso_$_step'), padding: const EdgeInsets.fromLTRB(20, 4, 20, 16), child: body)),
      if (_formError != null) Padding(padding: const EdgeInsets.fromLTRB(24, 0, 24, 4), child: Text(_formError!, style: TextStyle(color: scheme.error, fontSize: 12))),
      Padding(padding: const EdgeInsets.fromLTRB(20, 6, 20, 16), child: Row(children: [
        Expanded(child: OutlinedButton(
          onPressed: _back,
          style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(50), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16))),
          child: const Text('Atrás'))),
        const SizedBox(width: 12),
        Expanded(child: FilledButton(
          onPressed: _next,
          style: FilledButton.styleFrom(backgroundColor: _green, foregroundColor: _onGreen, minimumSize: const Size.fromHeight(50),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16))),
          child: Text(_step == _pasos ? 'Ver lugares' : 'Continuar', style: const TextStyle(fontWeight: FontWeight.w700)))),
      ])),
    ]));
  }

  /// Un ítem por pantalla, con respuestas grandes y avance automático.
  Widget _stressQuestions(ColorScheme scheme) {
    final i = _pregunta.clamp(0, _totalPreguntas - 1);
    final opciones = _opcionesPregunta(i);
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      // Compacto para que la pregunta sea lo principal en cada pantalla.
      Material(
        color: scheme.surfaceContainerLow,
        borderRadius: BorderRadius.circular(14),
        child: SwitchListTile(
          value: _omitirEstres,
          dense: true,
          activeThumbColor: _green,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          title: const Text('Prefiero no responder', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13.5)),
          subtitle: _omitirEstres
              ? const Text('Usaremos lo que la mayoría prefiere en la región.', style: TextStyle(fontSize: 12))
              : null,
          onChanged: (v) { ToqueSuave.elegir(); setState(() { _omitirEstres = v; _formError = null; }); },
        ),
      ),
      if (!_omitirEstres) ...[
        // La instrucción oficial completa se muestra u oculta con el botón de información.
        if (_usarPss) ...[
          AnimatedSize(
            duration: const Duration(milliseconds: 220),
            curve: Curves.easeOutCubic,
            alignment: Alignment.topLeft,
            child: _verInstruccion
                ? Container(
                    width: double.infinity,
                    margin: const EdgeInsets.only(top: 4),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: _green.withValues(alpha: .07), borderRadius: BorderRadius.circular(12)),
                    child: Text(_pss!.instruccion, style: TextStyle(fontSize: 12, height: 1.4, color: scheme.onSurfaceVariant)))
                : const SizedBox(width: double.infinity),
          ),
        ],
        const SizedBox(height: 12),
        AnimatedSwitcher(
          duration: const Duration(milliseconds: 300),
          transitionBuilder: (child, anim) => FadeTransition(opacity: anim,
            child: SlideTransition(position: Tween(begin: const Offset(0.12, 0), end: Offset.zero).animate(anim), child: child)),
          child: Column(key: ValueKey('pregunta_$i'), crossAxisAlignment: CrossAxisAlignment.start, children: [
            _preguntaAltoFijo(scheme, i),
            const SizedBox(height: 16),
            ...List.generate(opciones.length, (v) => Padding(
              padding: const EdgeInsets.only(bottom: 9),
              child: _OpcionRespuesta(
                texto: opciones[v],
                nivel: v,
                niveles: opciones.length,
                seleccionada: _respuesta(i) == v,
                acento: _green,
                onTap: () => _responder(i, v),
              ),
            )),
          ]),
        ),
        const SizedBox(height: 4),
        Row(children: [
          if (i > 0) TextButton.icon(
            onPressed: () => setState(() => _pregunta = i - 1),
            icon: const Icon(Icons.chevron_left_rounded, size: 18), label: const Text('Anterior')),
          const Spacer(),
          if (i < _totalPreguntas - 1) TextButton(
            onPressed: () { ToqueSuave.pulso(); setState(() => _pregunta = i + 1); },
            child: Text(_respuesta(i) == null ? 'Omitir esta' : 'Siguiente')),
        ]),
        // Puntos: qué preguntas ya tienen respuesta.
        Center(child: Wrap(spacing: 6, children: List.generate(_totalPreguntas, (k) => GestureDetector(
          onTap: () => setState(() => _pregunta = k),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 250),
            width: k == i ? 18 : 8, height: 8,
            decoration: BoxDecoration(
              color: _respuesta(k) != null ? _green : (k == i ? _green.withValues(alpha: .45) : scheme.outlineVariant),
              borderRadius: BorderRadius.circular(8)),
          ),
        )))),
        if (_usarPss) ...[
          const SizedBox(height: 14),
          Text(_pss!.copyright, style: TextStyle(fontSize: 10, color: scheme.onSurfaceVariant)),
        ],
      ],
      const SizedBox(height: 10),
      Text('Si te sientes rebasado(a), la Línea de la Vida atiende 24 h: 800 911 2000.',
        style: TextStyle(fontSize: 11, color: scheme.onSurfaceVariant)),
    ]);
  }

  String _rotuloPregunta(int i) => _usarPss ? '${i + 1}. ${_textoPregunta(i)}' : _textoPregunta(i);

  /// La pregunta ocupa siempre el alto de la más larga (para este ancho y tamaño de letra),
  /// así las respuestas quedan en el mismo lugar en todas las preguntas.
  Widget _preguntaAltoFijo(ColorScheme scheme, int i) {
    final estilo = TextStyle(fontSize: 18, height: 1.35, fontWeight: FontWeight.w700, color: scheme.onSurface);
    return LayoutBuilder(builder: (context, c) {
      final escala = MediaQuery.textScalerOf(context);
      final direccion = Directionality.of(context);
      var alto = 0.0;
      for (var k = 0; k < _totalPreguntas; k++) {
        final medidor = TextPainter(
          text: TextSpan(text: _rotuloPregunta(k), style: DefaultTextStyle.of(context).style.merge(estilo)),
          textDirection: direccion,
          textScaler: escala,
        )..layout(maxWidth: c.maxWidth);
        alto = math.max(alto, medidor.height);
        medidor.dispose();
      }
      return SizedBox(
        height: alto,
        width: double.infinity,
        child: Align(alignment: Alignment.topLeft, child: Text(_rotuloPregunta(i), style: estilo)),
      );
    });
  }

  /// Tarjetas en cuadrícula con prioridad (1, 2, 3) para motivos M y modalidades W.
  Widget _grid(ColorScheme scheme, List<_Opcion> opciones, List<String> elegidas) => LayoutBuilder(builder: (context, c) {
    final columnas = c.maxWidth >= 560 ? 3 : 2;
    final ancho = (c.maxWidth - 10 * (columnas - 1)) / columnas;
    return Wrap(spacing: 10, runSpacing: 10, children: opciones.map((m) {
      final index = elegidas.indexOf(m.key);
      return SizedBox(width: ancho, child: _TarjetaOpcion(
        opcion: m,
        prioridad: index >= 0 ? index + 1 : null,
        atenuada: index < 0 && elegidas.length >= 3,
        acento: _green,
        sobreAcento: _onGreen,
        onTap: () => setState(() {
          _formError = null;
          if (index >= 0) {
            ToqueSuave.elegir();
            elegidas.remove(m.key);
          } else if (elegidas.length < 3) {
            ToqueSuave.elegir();
            elegidas.add(m.key);
          } else {
            ToqueSuave.error();
            _formError = 'Puedes elegir hasta tres.';
          }
        }),
      ));
    }).toList());
  });

  /// Un solo valor, mismas tarjetas que motivos y modalidades.
  Widget _gridUnico(List<_Opcion> opciones, String? elegida, ValueChanged<String> onElegir, {double altoMin = 138}) =>
      LayoutBuilder(builder: (context, c) {
        final columnas = c.maxWidth >= 560 ? 3 : 2;
        final ancho = (c.maxWidth - 10 * (columnas - 1)) / columnas;
        return Wrap(spacing: 10, runSpacing: 10, children: opciones.map((m) => SizedBox(width: ancho, child: _TarjetaOpcion(
          opcion: m,
          prioridad: m.key == elegida ? 1 : null,
          unica: true,
          altoMin: altoMin,
          atenuada: false,
          acento: _green,
          sobreAcento: _onGreen,
          onTap: () { ToqueSuave.elegir(); onElegir(m.key); },
        ))).toList());
      });

  Widget _effortChoices(ColorScheme scheme) => _gridUnico(
    [for (final e in _esfuerzos) (key: '${e.nivel}', title: e.titulo, subtitle: e.detalle, icon: e.icon)],
    '$_maxEffort',
    (k) => setState(() => _maxEffort = int.parse(k)),
  );

  Widget _subtitulo(ColorScheme scheme, String texto) => Padding(
    padding: const EdgeInsets.only(top: 20, bottom: 10, left: 2),
    child: Text(texto, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, letterSpacing: .2, color: scheme.onSurface)),
  );

  Widget _regionChoices(ColorScheme scheme) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    _gridUnico(const [
      (key: 'am', title: 'Altas Montañas', subtitle: 'Veracruz · 57 municipios.', icon: Icons.landscape_outlined),
      (key: 'mx', title: 'Todo México', subtitle: 'Inventario nacional de bienestar.', icon: Icons.public_outlined),
    ], _todoMexico ? 'mx' : 'am', (k) => setState(() { _todoMexico = k == 'mx'; _region = ''; })),
    if (!_todoMexico) ...[
      _subtitulo(scheme, '¿Algún municipio en especial?'),
      _gridUnico([
        for (final r in _regiones)
          (key: r, title: r.isEmpty ? 'Toda la región' : r,
           subtitle: r.isEmpty ? 'Los 57 municipios.' : 'Primero lo de $r.',
           icon: r.isEmpty ? Icons.map_outlined : Icons.place_outlined),
      ], _region, (k) => setState(() => _region = k), altoMin: 112),
    ] else ...[
      _subtitulo(scheme, '¿En qué parte del país?'),
      _gridUnico([
        (key: '', title: 'Todo el país', subtitle: 'Sin límite de estado.', icon: Icons.travel_explore_outlined),
        (key: 'estado', title: _region.isEmpty ? 'Un estado' : _region,
         subtitle: _region.isEmpty ? 'Toca para elegirlo.' : 'Toca para cambiarlo.', icon: Icons.location_city_outlined),
      ], _region.isEmpty ? '' : 'estado', (k) {
        if (k.isEmpty) {
          setState(() => _region = '');
        } else {
          _elegirEstado(scheme);
        }
      }, altoMin: 112),
    ],
  ]);

  Future<void> _elegirEstado(ColorScheme scheme) async {
    final elegido = await showModalBottomSheet<String>(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      builder: (ctx) => SafeArea(child: SizedBox(
        height: MediaQuery.of(ctx).size.height * .7,
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Padding(padding: const EdgeInsets.fromLTRB(22, 0, 22, 8), child: Text('Elige un estado',
            style: TextStyle(fontFamily: 'CalSans', fontSize: 22, color: scheme.onSurface))),
          Expanded(child: ListView(children: _estadosMexico.map((e) => ListTile(
            leading: Icon(Icons.place_outlined, color: e == _region ? _green : scheme.onSurfaceVariant),
            title: Text(e, style: TextStyle(fontWeight: e == _region ? FontWeight.w800 : FontWeight.w500)),
            trailing: e == _region ? Icon(Icons.check_circle_rounded, color: _green) : null,
            onTap: () { ToqueSuave.elegir(); Navigator.pop(ctx, e); },
          )).toList())),
        ]),
      )),
    );
    if (elegido != null && mounted) setState(() => _region = elegido);
  }

  // ── "La IA está pensando" ────────────────────────────────────────────────
  Widget _pensandoView(ColorScheme scheme) {
    final pasos = _pasosPensando;
    return SafeArea(child: Padding(
      padding: const EdgeInsets.fromLTRB(28, 24, 28, 24),
      child: Column(mainAxisAlignment: MainAxisAlignment.center, crossAxisAlignment: CrossAxisAlignment.start, children: [
        Center(child: _OrbeWelltur(color: _green, tamano: 128, pensando: true)),
        const SizedBox(height: 28),
        Center(child: Text('WELLTUR está pensando…', style: TextStyle(fontFamily: 'CalSans', fontSize: 24, color: scheme.onSurface))),
        const SizedBox(height: 6),
        Center(child: Text('Combinando tus respuestas con el modelo', style: TextStyle(fontSize: 13, color: scheme.onSurfaceVariant))),
        const SizedBox(height: 28),
        ...List.generate(pasos.length, (k) {
          final hecho = k < _pasoPensando;
          final activo = k == _pasoPensando;
          return AnimatedOpacity(
            duration: const Duration(milliseconds: 300),
            opacity: k <= _pasoPensando ? 1 : .35,
            child: Padding(padding: const EdgeInsets.only(bottom: 14), child: Row(children: [
              SizedBox(width: 24, height: 24, child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 250),
                transitionBuilder: (child, anim) => ScaleTransition(scale: anim, child: child),
                child: hecho
                    ? Icon(Icons.check_circle_rounded, key: const ValueKey('hecho'), color: _green, size: 22)
                    : activo
                        ? Padding(key: const ValueKey('activo'), padding: const EdgeInsets.all(3), child: CircularProgressIndicator(strokeWidth: 2.4, color: _green))
                        : Icon(Icons.circle_outlined, key: const ValueKey('pendiente'), color: scheme.outlineVariant, size: 20),
              )),
              const SizedBox(width: 12),
              Expanded(child: Text(pasos[k], style: TextStyle(
                fontSize: 14, height: 1.3,
                fontWeight: activo ? FontWeight.w700 : FontWeight.w500,
                color: activo || hecho ? scheme.onSurface : scheme.onSurfaceVariant))),
            ])),
          );
        }),
      ]),
    ));
  }

  // ── Resultados ───────────────────────────────────────────────────────────
  Widget _results(ColorScheme scheme) {
    final result = _result!;
    final elegidas = [
      ..._motivosElegidos.map((k) => _motivos.firstWhere((m) => m.key == k).title),
      ..._seleccion.map((k) => _modalidades.firstWhere((m) => m.key == k).title),
    ].join(', ');
    final mipymes = result.destinations.where((d) => d.esMipyme).length;
    return SafeArea(child: ListView(padding: const EdgeInsets.fromLTRB(0, 14, 0, 28), children: [
      _Entrada(orden: 0, child: Padding(padding: const EdgeInsets.symmetric(horizontal: 20), child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          gradient: LinearGradient(colors: [_green.withValues(alpha: .16), _green.withValues(alpha: .04)], begin: Alignment.topLeft, end: Alignment.bottomRight),
          borderRadius: BorderRadius.circular(22)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Icon(Icons.auto_awesome_rounded, size: 16, color: _green),
            const SizedBox(width: 6),
            Text('TU EXPERIENCIA', style: TextStyle(color: _green, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.1)),
          ]),
          const SizedBox(height: 6),
          Text(result.title, style: TextStyle(fontFamily: 'CalSans', fontSize: 24, color: scheme.onSurface)),
          const SizedBox(height: 6),
          Text([
            if (elegidas.isNotEmpty) 'Buscas: $elegidas',
            _omitirEstres ? 'Sin preguntas de estrés' : 'Ajustado con tu PSS-10',
            _todoMexico ? (_region.isEmpty ? 'Todo México' : _region) : (_region.isEmpty ? 'Altas Montañas' : _region),
            if (result.destinations.isNotEmpty) '$mipymes de ${result.destinations.length} son negocios locales (MiPyME)',
          ].join(' · '), style: TextStyle(fontSize: 12, height: 1.4, color: scheme.onSurfaceVariant)),
          const SizedBox(height: 8),
          Text(result.description, style: TextStyle(fontSize: 12, height: 1.4, color: scheme.onSurfaceVariant)),
        ]),
      ))),
      const Padding(padding: EdgeInsets.fromLTRB(20, 20, 20, 8), child: Text('Lugares sugeridos', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800))),
      if (result.avisoCoincidencia != null)
        Padding(padding: const EdgeInsets.fromLTRB(20, 0, 20, 8), child: _infoBox(scheme, result.avisoCoincidencia!, Icons.info_outline_rounded)),
      if (result.destinations.isEmpty)
        Padding(padding: const EdgeInsets.all(24), child: _infoBox(scheme, 'Por ahora no hay lugares aprobados en el catálogo. Inténtalo más tarde.', Icons.search_off_rounded))
      else
        ...result.destinations.indexed.map((e) => _Entrada(orden: e.$1 + 1,
          child: WellnessPoiCard(destination: e.$2, onTap: () => _openDestination(e.$2)))),
      if (result.sessionId != null) Padding(padding: const EdgeInsets.fromLTRB(20, 12, 20, 4), child: Card(
        child: Padding(padding: const EdgeInsets.all(16), child: Column(children: [
          Text(_feedbackSent ? '¡Gracias! Tu valoración ayuda a mejorar las recomendaciones.' : '¿Qué tan bien coincidieron con lo que buscabas?', textAlign: TextAlign.center, style: const TextStyle(fontWeight: FontWeight.w600)),
          if (!_feedbackSent) ...[
            const SizedBox(height: 8),
            Row(mainAxisAlignment: MainAxisAlignment.center, children: List.generate(5, (i) => IconButton(
              tooltip: '${i + 1} de 5',
              onPressed: () => _sendFeedback(i + 1),
              icon: Icon(_fitRating != null && i < _fitRating! ? Icons.star_rounded : Icons.star_outline_rounded, color: _green),
            ))),
          ],
        ])),
      )),
      Padding(padding: const EdgeInsets.fromLTRB(20, 16, 20, 0), child: OutlinedButton.icon(
        onPressed: () => setState(() { _step = 1; _pregunta = 0; _result = null; _feedbackSent = false; _fitRating = null; }),
        icon: const Icon(Icons.tune_rounded), label: const Text('Cambiar respuestas'))),
      // Aviso: no es un servicio médico.
      Padding(padding: const EdgeInsets.fromLTRB(20, 18, 20, 0), child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: scheme.surfaceContainerLow,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: scheme.outlineVariant.withValues(alpha: .7)),
        ),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Icon(Icons.health_and_safety_outlined, color: _green, size: 20),
          const SizedBox(width: 10),
          Expanded(child: Text(
            'WELLTUR no es un servicio médico ni psicológico. Estas sugerencias de viaje no diagnostican, '
            'tratan ni sustituyen la atención profesional. Si el estrés te rebasa, busca ayuda: '
            'Línea de la Vida, 800 911 2000 (24 h, gratuita).',
            style: TextStyle(fontSize: 12, height: 1.45, color: scheme.onSurfaceVariant))),
        ]),
      )),
    ]));
  }

  Widget _errorView(ColorScheme scheme) => Center(child: Padding(padding: const EdgeInsets.all(24), child: Column(
    mainAxisSize: MainAxisSize.min, children: [
      Icon(Icons.cloud_off_outlined, size: 42, color: scheme.error),
      const SizedBox(height: 12), Text(_loadError ?? 'No se pudieron cargar las recomendaciones.', textAlign: TextAlign.center),
      const SizedBox(height: 18), FilledButton(onPressed: _submit, child: const Text('Reintentar')),
      TextButton(onPressed: _back, child: const Text('Cambiar respuestas')),
    ],
  )));

  Widget _infoBox(ColorScheme scheme, String text, IconData icon) => Container(
    padding: const EdgeInsets.all(14), decoration: BoxDecoration(color: scheme.surfaceContainerLow, borderRadius: BorderRadius.circular(14)),
    child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [Icon(icon, color: _green, size: 18), const SizedBox(width: 10), Expanded(child: Text(text, style: TextStyle(fontSize: 12, height: 1.45, color: scheme.onSurfaceVariant)))]),
  );

  Widget _primaryButton(String label, VoidCallback? onPressed) => SizedBox(width: double.infinity, height: 54,
    child: FilledButton(onPressed: onPressed,
      style: FilledButton.styleFrom(backgroundColor: _green, foregroundColor: _onGreen, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18))),
      child: Text(label, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15))));
}

/// Respuesta de escala: barra de intensidad a la izquierda, se llena según el nivel.
class _OpcionRespuesta extends StatelessWidget {
  final String texto;
  final int nivel;
  final int niveles;
  final bool seleccionada;
  final Color acento;
  final VoidCallback onTap;
  const _OpcionRespuesta({required this.texto, required this.nivel, required this.niveles,
    required this.seleccionada, required this.acento, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Semantics(button: true, selected: seleccionada, label: texto, child: GestureDetector(
      onTap: onTap,
      child: AnimatedScale(
        scale: seleccionada ? 1.0 : .985,
        duration: const Duration(milliseconds: 180),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 220),
          curve: Curves.easeOutCubic,
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
          decoration: BoxDecoration(
            color: seleccionada ? acento.withValues(alpha: .14) : scheme.surfaceContainerLow,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: seleccionada ? acento : scheme.outlineVariant.withValues(alpha: .7), width: seleccionada ? 1.8 : 1),
          ),
          child: Row(children: [
            // Intensidad: de 1 a N barritas.
            Row(children: List.generate(niveles - 1, (k) => Container(
              width: 4, height: 8.0 + k * 3, margin: const EdgeInsets.only(right: 3),
              decoration: BoxDecoration(
                color: k < nivel ? acento.withValues(alpha: seleccionada ? 1 : .8) : scheme.outlineVariant,
                borderRadius: BorderRadius.circular(2)),
            ))),
            const SizedBox(width: 12),
            Expanded(child: Text(texto, style: TextStyle(fontSize: 15, fontWeight: seleccionada ? FontWeight.w700 : FontWeight.w500, color: scheme.onSurface))),
            AnimatedSwitcher(
              duration: const Duration(milliseconds: 200),
              transitionBuilder: (child, anim) => ScaleTransition(scale: anim, child: child),
              child: seleccionada
                  ? Icon(Icons.check_circle_rounded, key: const ValueKey('si'), color: acento, size: 22)
                  : Icon(Icons.circle_outlined, key: const ValueKey('no'), color: scheme.outlineVariant, size: 22),
            ),
          ]),
        ),
      ),
    ));
  }
}

/// Tarjeta seleccionable con icono, prioridad y animación.
class _TarjetaOpcion extends StatelessWidget {
  final _Opcion opcion;
  final int? prioridad;
  final bool atenuada;
  final Color acento;
  final Color sobreAcento;
  final VoidCallback onTap;
  final bool unica;
  final double altoMin;
  const _TarjetaOpcion({required this.opcion, required this.prioridad, required this.atenuada,
    required this.acento, required this.sobreAcento, required this.onTap, this.unica = false, this.altoMin = 138});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final sel = prioridad != null;
    return Semantics(button: true, selected: sel, label: opcion.title, child: GestureDetector(
      onTap: onTap,
      child: AnimatedOpacity(
        duration: const Duration(milliseconds: 200),
        opacity: atenuada ? .45 : 1,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 240),
          curve: Curves.easeOutCubic,
          constraints: BoxConstraints(minHeight: altoMin),
          padding: const EdgeInsets.fromLTRB(14, 14, 12, 14),
          decoration: BoxDecoration(
            gradient: sel
                ? LinearGradient(colors: [acento.withValues(alpha: .2), acento.withValues(alpha: .06)], begin: Alignment.topLeft, end: Alignment.bottomRight)
                : null,
            color: sel ? null : scheme.surfaceContainerLow,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: sel ? acento : scheme.outlineVariant.withValues(alpha: .7), width: sel ? 1.8 : 1),
          ),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              AnimatedContainer(
                duration: const Duration(milliseconds: 240),
                width: 40, height: 40,
                decoration: BoxDecoration(color: sel ? acento : acento.withValues(alpha: .1), shape: BoxShape.circle),
                child: Icon(opcion.icon, size: 21, color: sel ? sobreAcento : acento),
              ),
              const Spacer(),
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 220),
                transitionBuilder: (child, anim) => ScaleTransition(scale: anim, child: child),
                child: sel && unica
                    ? Icon(Icons.check_circle_rounded, key: const ValueKey('unica'), color: acento, size: 24)
                    : sel
                    ? CircleAvatar(key: ValueKey('p$prioridad'), radius: 12, backgroundColor: acento,
                        child: Text('$prioridad', style: TextStyle(fontSize: 12, color: sobreAcento, fontWeight: FontWeight.w800)))
                    : const SizedBox(key: ValueKey('vacio'), width: 24, height: 24),
              ),
            ]),
            const SizedBox(height: 10),
            Text(opcion.title, style: TextStyle(fontSize: 14, height: 1.2, fontWeight: FontWeight.w800, color: scheme.onSurface)),
            const SizedBox(height: 4),
            Text(opcion.subtitle, style: TextStyle(fontSize: 11.5, height: 1.3, color: scheme.onSurfaceVariant)),
          ]),
        ),
      ),
    ));
  }
}

/// Orbe animado de WELLTUR: respira en reposo y gira con anillos cuando "piensa".
class _OrbeWelltur extends StatefulWidget {
  final Color color;
  final double tamano;
  final bool pensando;
  const _OrbeWelltur({required this.color, required this.tamano, this.pensando = false});

  @override
  State<_OrbeWelltur> createState() => _OrbeWellturState();
}

class _OrbeWellturState extends State<_OrbeWelltur> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(vsync: this, duration: const Duration(milliseconds: 2400));

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Fijo en reposo; solo se anima mientras "piensa". También respeta "reducir movimiento".
    if (!widget.pensando || MediaQuery.of(context).disableAnimations) {
      _c.stop();
    } else if (!_c.isAnimating) {
      _c.repeat();
    }
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final t = widget.tamano;
    return SizedBox(width: t, height: t, child: AnimatedBuilder(
      animation: _c,
      builder: (context, _) {
        final fase = _c.value * 2 * math.pi;
        final respiro = widget.pensando ? 1 + .06 * math.sin(fase) : 1.0;
        return Stack(alignment: Alignment.center, children: [
          if (widget.pensando)
            for (var k = 0; k < 2; k++)
              Transform.rotate(
                angle: fase * (k == 0 ? 1 : -1.4),
                child: Container(
                  width: t * (k == 0 ? .98 : .84), height: t * (k == 0 ? .98 : .84),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: SweepGradient(colors: [
                      widget.color.withValues(alpha: 0),
                      widget.color.withValues(alpha: k == 0 ? .55 : .35),
                      widget.color.withValues(alpha: 0),
                    ]),
                  ),
                ),
              ),
          Transform.scale(scale: respiro, child: Container(
            width: t * .62, height: t * .62,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              // En reposo: color sólido, sin degradado ni resplandor. Al "pensar": con brillo.
              color: widget.pensando ? null : widget.color,
              gradient: widget.pensando
                  ? RadialGradient(colors: [widget.color.withValues(alpha: .95), widget.color.withValues(alpha: .55)])
                  : null,
              boxShadow: widget.pensando
                  ? [BoxShadow(color: widget.color.withValues(alpha: .35), blurRadius: 24 * respiro, spreadRadius: 2)]
                  : null,
            ),
            child: Icon(Icons.eco_rounded, color: Colors.white.withValues(alpha: .95), size: t * .3),
          )),
        ]);
      },
    ));
  }
}

/// Entrada escalonada: cada tarjeta aparece un poco después de la anterior.
class _Entrada extends StatelessWidget {
  final int orden;
  final Widget child;
  const _Entrada({required this.orden, required this.child});

  @override
  Widget build(BuildContext context) => TweenAnimationBuilder<double>(
    tween: Tween(begin: 0, end: 1),
    duration: Duration(milliseconds: 380 + orden * 90),
    curve: Curves.easeOutCubic,
    builder: (context, v, child) => Opacity(
      opacity: v.clamp(0, 1),
      child: Transform.translate(offset: Offset(0, (1 - v) * 24), child: child),
    ),
    child: child,
  );
}

/// Explicación breve enlazada desde otros puntos de la app.
void showWellnessInfoSheet(BuildContext context) {
  final scheme = Theme.of(context).colorScheme;
  showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (ctx) => SafeArea(child: Padding(
      padding: const EdgeInsets.fromLTRB(22, 4, 22, 24),
      child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('Sobre Welltur', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: scheme.onSurface)),
        const SizedBox(height: 12),
        Text('Welltur sugiere experiencias de negocios locales según lo que buscas en tu viaje. La escala de estrés (PSS-10) es opcional: con nuestra encuesta a 137 personas y datos de 6,224 mexicanos estimamos cómo cambian las preferencias con el estrés, y eso solo ajusta el orden de lo que te sugerimos.', style: TextStyle(fontSize: 13, height: 1.5, color: scheme.onSurfaceVariant)),
        const SizedBox(height: 10),
        Text('No mide ni diagnostica estrés y no promete resultados de salud. Los negocios provienen del DENUE (INEGI), del inventario nacional de bienestar y del registro de SMARTUR.', style: TextStyle(fontSize: 13, height: 1.5, color: scheme.onSurfaceVariant)),
        const SizedBox(height: 18),
        SizedBox(width: double.infinity, child: FilledButton(onPressed: () => Navigator.pop(ctx), child: const Text('Entendido'))),
      ]),
    )),
  );
}
