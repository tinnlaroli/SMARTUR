import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show rootBundle;

import '../../../data/services/wellness_service.dart';
import '../explore/detail_view_page.dart';
import '../../widgets/smartur_app_bar.dart';
import '../../widgets/wellness_poi_card.dart';
import '../../../core/theme/welltur_theme.dart';

/// Preguntas propias de la encuesta WELLTUR (oct-2026). Producen un índice continuo
/// 0-100 que solo ajusta qué tipo de experiencia se prioriza.
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

/// Motivos del viaje (protocolo M/W). Se piden junto con la PSS-10 y las modalidades W:
/// el recomendador pondera las tres cosas en una sola búsqueda.
const _motivos = <({String key, String title, String subtitle, IconData icon})>[
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

const _estadosMexico = <String>[
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas', 'Chihuahua',
  'Ciudad de México', 'Coahuila', 'Colima', 'Durango', 'Estado de México', 'Guanajuato', 'Guerrero',
  'Hidalgo', 'Jalisco', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro',
  'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz',
  'Yucatán', 'Zacatecas',
];

const _modalidades = <({String key, String title, String subtitle, IconData icon})>[
  (key: 'W1', title: 'Pausa y descanso', subtitle: 'Hospedaje tranquilo, bajar el ritmo.', icon: Icons.bedtime_outlined),
  (key: 'W2', title: 'Naturaleza y aire libre', subtitle: 'Cascadas, bosques, miradores.', icon: Icons.forest_outlined),
  (key: 'W3', title: 'Movimiento', subtitle: 'Caminatas, senderismo, aventura.', icon: Icons.hiking_outlined),
  (key: 'W4', title: 'Mente-cuerpo', subtitle: 'Yoga, meditación, temazcal.', icon: Icons.self_improvement_outlined),
  (key: 'W5', title: 'Experiencia culinaria', subtitle: 'Cocina local, café de altura.', icon: Icons.restaurant_outlined),
  (key: 'W6', title: 'Aprendizaje y cultura', subtitle: 'Museos, artesanía, comunidades.', icon: Icons.museum_outlined),
  (key: 'W7', title: 'Autocuidado', subtitle: 'Spa, masajes, balnearios.', icon: Icons.spa_outlined),
];

/// PSS-10 con licencia (Mapi Research Trust n.º 153824). Los textos se leen del asset que el equipo
/// llena textualmente desde el instrumento; si falta alguno, la opción no se muestra.
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

const _regiones = ['', 'Orizaba', 'Córdoba', 'Fortín', 'Huatusco', 'Coscomatepec', 'Ixhuatlán del Café', 'Ixtaczoquitlán'];

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
  int _step = 0; // 0 intro, 1-5 preguntas, 6 resultados
  bool _consentGiven = false;
  bool _omitirEstres = false;
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

  @override
  void initState() {
    super.initState();
    _Pss10.cargar().then((pss) {
      if (mounted && pss != null) setState(() => _pss = pss);
    });
  }

  bool get _estresCompleto => _usarPss
      ? _respuestasPss.length >= 8 // la puntuación oficial acepta hasta 2 ítems sin responder
      : _preguntasEstres.every((p) => _respuestas.containsKey(p.key));

  void _next() {
    if (_step == 1 && !_omitirEstres && !_estresCompleto) {
      setState(() => _formError = _usarPss
          ? 'Responde al menos 8 de las 10 preguntas o elige "Prefiero no responder".'
          : 'Responde las seis preguntas o elige "Prefiero no responder".');
      return;
    }
    setState(() { _formError = null; _loadError = null; _step = (_step + 1).clamp(0, _pasos + 1); });
    if (_step == _pasos + 1) _submit();
  }

  void _back() {
    if (_step == 0 || _step == _pasos + 1) {
      Navigator.of(context).pop();
      return;
    }
    setState(() { _loadError = null; _formError = null; _step--; });
  }

  Future<void> _submit() async {
    setState(() { _loading = true; _loadError = null; });
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
      if (!mounted) return;
      setState(() { _result = result; _loading = false; });
    } catch (e, st) {
      // Se registra el motivo real para poder diagnosticarlo (adb logcat / consola).
      debugPrint('[welltur] recomendación falló: $e\n$st');
      if (!mounted) return;
      setState(() {
        _loadError = 'No pudimos conectar con el recomendador. Revisa tu conexión e inténtalo de nuevo.';
        _loading = false;
      });
    }
  }

  Future<void> _sendFeedback(int rating) async {
    final session = _result?.sessionId;
    if (_feedbackSent || session == null) return;
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
      body: _loading
          ? _loadingView(scheme)
          : _step == 0
              ? _intro(scheme)
              : enResultados && _result != null
                  ? _results(scheme)
                  : _loadError != null
                      ? _errorView(scheme)
                      : _question(scheme),
    );
  }

  Widget _intro(ColorScheme scheme) => SafeArea(
    child: SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(24, 28, 24, 28),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(width: 58, height: 58,
          decoration: BoxDecoration(color: _green.withValues(alpha: .1), borderRadius: BorderRadius.circular(18)),
          child: Icon(Icons.eco_outlined, color: _green, size: 30)),
        const SizedBox(height: 22),
        Text('Tu viaje de bienestar',
          style: TextStyle(fontSize: 27, height: 1.13, fontWeight: FontWeight.w800, color: scheme.onSurface)),
        const SizedBox(height: 12),
        Text('Un solo cuestionario: cómo te has sentido, qué buscas en el viaje y dónde. Te sugerimos experiencias de negocios locales de las Altas Montañas o de todo México.',
          style: TextStyle(fontSize: 15, height: 1.5, color: scheme.onSurfaceVariant)),
        const SizedBox(height: 16),
        _infoBox(scheme,
          'Las preguntas de estrés (PSS-10) son opcionales y no son un diagnóstico. Lo que eliges en el viaje pesa más; el estrés ajusta el orden: en nuestra encuesta (137 personas) y en 6,224 mexicanos del estudio COVIDiSTRESS, a más estrés se prefiere más descansar y convivir.',
          Icons.info_outline_rounded),
        const SizedBox(height: 12),
        InkWell(
          onTap: () => setState(() => _consentGiven = !_consentGiven),
          borderRadius: BorderRadius.circular(12),
          child: Padding(padding: const EdgeInsets.symmetric(vertical: 8), child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Checkbox(value: _consentGiven, activeColor: _green, checkColor: _onGreen, onChanged: (v) => setState(() => _consentGiven = v ?? false)),
            Expanded(child: Padding(padding: const EdgeInsets.only(top: 12), child: Text(
              'Opcional: guardar esta búsqueda (incluido tu puntaje de estrés) para mejorar las recomendaciones y poder valorarlas. Si no lo activas, tus respuestas se usan solo para esta búsqueda. Puedes borrar el historial desde tu perfil.',
              style: TextStyle(fontSize: 12, height: 1.45, color: scheme.onSurfaceVariant)))),
          ])),
        ),
        const SizedBox(height: 20),
        _primaryButton('Empezar · $_pasos pasos', _next),
      ]),
    ),
  );

  Widget _question(ColorScheme scheme) {
    const titles = {
      1: '¿Cómo te has sentido?',
      2: '¿Qué buscas en este viaje?',
      3: '¿Cómo te gustaría vivirlo?',
      4: '¿Cuánto esfuerzo físico?',
      5: '¿Dónde buscas?',
    };
    final hints = {
      1: _usarPss ? 'Escala de estrés percibido (PSS-10), 10 preguntas. Puedes omitirla.' : 'Seis preguntas breves. Puedes omitirlas.',
      2: 'Elige hasta tres, en orden de importancia.',
      3: 'Opcional: hasta tres formas de experiencia, en orden.',
      4: 'Primero te mostramos lo que no pida más que esto.',
      5: 'Las Altas Montañas o cualquier parte de México.',
    };
    final body = switch (_step) {
      1 => _stressQuestions(scheme),
      2 => _motiveChoices(scheme),
      3 => _modalityChoices(scheme),
      4 => _effortChoices(scheme),
      _ => _regionChoices(scheme),
    };
    return SafeArea(child: Column(children: [
      Padding(padding: const EdgeInsets.fromLTRB(24, 20, 24, 12), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: List.generate(_pasos, (i) => Expanded(child: Container(
          height: 4, margin: const EdgeInsets.only(right: 6),
          decoration: BoxDecoration(color: _step >= i + 1 ? _green : scheme.outlineVariant, borderRadius: BorderRadius.circular(4)),
        )))),
        const SizedBox(height: 20),
        Text('PASO $_step DE $_pasos', style: TextStyle(color: _green, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.2)),
        const SizedBox(height: 7),
        Text(titles[_step]!, style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: scheme.onSurface)),
        const SizedBox(height: 6),
        Text(hints[_step]!, style: TextStyle(fontSize: 13, height: 1.4, color: scheme.onSurfaceVariant)),
      ])),
      // La llave por paso hace que cada paso empiece arriba (no hereda el scroll de la PSS-10).
      Expanded(child: SingleChildScrollView(key: ValueKey('paso_$_step'), padding: const EdgeInsets.fromLTRB(20, 0, 20, 16), child: body)),
      if (_formError != null) Padding(padding: const EdgeInsets.symmetric(horizontal: 24), child: Text(_formError!, style: TextStyle(color: scheme.error, fontSize: 12))),
      Padding(padding: const EdgeInsets.fromLTRB(20, 8, 20, 18), child: Row(children: [
        Expanded(child: OutlinedButton(onPressed: _back, child: const Text('Atrás'))),
        const SizedBox(width: 12),
        Expanded(child: FilledButton(
          onPressed: _next,
          style: FilledButton.styleFrom(backgroundColor: _green, foregroundColor: _onGreen),
          child: Text(_step == _pasos ? 'Ver lugares' : 'Continuar'))),
      ])),
    ]));
  }

  Widget _stressQuestions(ColorScheme scheme) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    SwitchListTile(
      value: _omitirEstres,
      activeThumbColor: _green,
      contentPadding: EdgeInsets.zero,
      title: const Text('Prefiero no responder', style: TextStyle(fontWeight: FontWeight.w600)),
      subtitle: const Text('Usaremos lo que la mayoría prefiere en la región.', style: TextStyle(fontSize: 12)),
      onChanged: (v) => setState(() { _omitirEstres = v; _formError = null; }),
    ),
    if (!_omitirEstres && _usarPss && _pss != null) ...[
      const SizedBox(height: 12),
      Text(_pss!.instruccion, style: TextStyle(fontSize: 13, height: 1.4, color: scheme.onSurfaceVariant)),
      ...List.generate(10, (i) => Padding(
        padding: const EdgeInsets.only(top: 14),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('${i + 1}. ${_pss!.items[i]}', style: TextStyle(fontSize: 14, height: 1.35, fontWeight: FontWeight.w600, color: scheme.onSurface)),
          const SizedBox(height: 8),
          Wrap(spacing: 6, runSpacing: 6, children: List.generate(5, (v) => ChoiceChip(
            label: Text(_pss!.opciones[v], style: const TextStyle(fontSize: 12)),
            selected: _respuestasPss[i] == v,
            selectedColor: _green.withValues(alpha: .16),
            onSelected: (_) => setState(() { _respuestasPss[i] = v; _formError = null; }),
          ))),
        ]),
      )),
      const SizedBox(height: 10),
      Text(_pss!.copyright, style: TextStyle(fontSize: 10, color: scheme.onSurfaceVariant)),
    ],
    if (!_omitirEstres && !_usarPss)
      ..._preguntasEstres.map((p) => Padding(
        padding: const EdgeInsets.only(top: 14),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(p.texto, style: TextStyle(fontSize: 14, height: 1.35, fontWeight: FontWeight.w600, color: scheme.onSurface)),
          const SizedBox(height: 8),
          Wrap(spacing: 6, runSpacing: 6, children: List.generate(p.opciones.length, (i) => ChoiceChip(
            label: Text(p.opciones[i], style: const TextStyle(fontSize: 12)),
            selected: _respuestas[p.key] == i,
            selectedColor: _green.withValues(alpha: .16),
            onSelected: (_) => setState(() { _respuestas[p.key] = i; _formError = null; }),
          ))),
        ]),
      )),
    const SizedBox(height: 14),
    Text('Si te sientes rebasado(a), la Línea de la Vida atiende 24 h: 800 911 2000.',
      style: TextStyle(fontSize: 11, color: scheme.onSurfaceVariant)),
  ]);

  Widget _motiveChoices(ColorScheme scheme) => _prioridades(scheme, _motivos, _motivosElegidos);

  Widget _modalityChoices(ColorScheme scheme) => _prioridades(scheme, _modalidades, _seleccion);

  /// Lista de opciones con prioridad (1, 2, 3) para motivos M y modalidades W.
  Widget _prioridades(ColorScheme scheme, List<({String key, String title, String subtitle, IconData icon})> opciones,
      List<String> elegidas) => Column(children: opciones.map((m) {
    final index = elegidas.indexOf(m.key);
    final selected = index >= 0;
    return Padding(padding: const EdgeInsets.only(bottom: 9), child: ListTile(
      onTap: () => setState(() {
        _formError = null;
        if (selected) {
          elegidas.remove(m.key);
        } else if (elegidas.length < 3) {
          elegidas.add(m.key);
        } else {
          _formError = 'Puedes elegir hasta tres.';
        }
      }),
      leading: Icon(m.icon, color: selected ? _green : scheme.onSurfaceVariant),
      title: Text(m.title, style: const TextStyle(fontWeight: FontWeight.w700)),
      subtitle: Text(m.subtitle, style: const TextStyle(fontSize: 12)),
      trailing: selected
          ? CircleAvatar(radius: 13, backgroundColor: _green, child: Text('${index + 1}', style: TextStyle(fontSize: 12, color: _onGreen, fontWeight: FontWeight.w800)))
          : const Icon(Icons.circle_outlined),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: BorderSide(color: selected ? _green : scheme.outlineVariant)),
      tileColor: selected ? _green.withValues(alpha: .08) : scheme.surfaceContainerLow,
    ));
  }).toList());

  Widget _effortChoices(ColorScheme scheme) {
    const choices = [
      (1, 'Suave', 'Poco esfuerzo físico', Icons.self_improvement_outlined),
      (2, 'Intermedio', 'Caminar un rato está bien', Icons.directions_walk_outlined),
      (3, 'Activo', 'Me gustan los retos físicos', Icons.hiking_outlined),
    ];
    return Column(children: choices.map((c) => Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: _choiceTile(scheme, c.$2, c.$3, c.$4, selected: _maxEffort == c.$1, onTap: () => setState(() => _maxEffort = c.$1)),
    )).toList());
  }

  Widget _regionChoices(ColorScheme scheme) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    Row(children: [
      Expanded(child: _zonaChip(scheme, 'Altas Montañas', Icons.landscape_outlined, !_todoMexico,
        () => setState(() { _todoMexico = false; _region = ''; }))),
      const SizedBox(width: 10),
      Expanded(child: _zonaChip(scheme, 'Todo México', Icons.public_outlined, _todoMexico,
        () => setState(() { _todoMexico = true; _region = ''; }))),
    ]),
    const SizedBox(height: 14),
    if (!_todoMexico)
      ..._regiones.map((r) => Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: _choiceTile(scheme, r.isEmpty ? 'Toda la región' : r,
          r.isEmpty ? '57 municipios de las Altas Montañas, Veracruz' : 'Primero lo de $r',
          r.isEmpty ? Icons.map_outlined : Icons.place_outlined,
          selected: _region == r, onTap: () => setState(() => _region = r)),
      ))
    else ...[
      Text('Inventario nacional de bienestar revisado por SMARTUR, más el catálogo de las Altas Montañas.',
        style: TextStyle(fontSize: 12, height: 1.4, color: scheme.onSurfaceVariant)),
      const SizedBox(height: 10),
      DropdownButtonFormField<String>(
        initialValue: _region,
        isExpanded: true,
        decoration: InputDecoration(labelText: 'Estado', border: OutlineInputBorder(borderRadius: BorderRadius.circular(14))),
        items: [
          const DropdownMenuItem(value: '', child: Text('Todo México')),
          ..._estadosMexico.map((e) => DropdownMenuItem(value: e, child: Text(e))),
        ],
        onChanged: (v) => setState(() => _region = v ?? ''),
      ),
    ],
  ]);

  Widget _zonaChip(ColorScheme scheme, String label, IconData icon, bool selected, VoidCallback onTap) => InkWell(
    onTap: onTap,
    borderRadius: BorderRadius.circular(16),
    child: Container(
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 10),
      decoration: BoxDecoration(
        color: selected ? _green.withValues(alpha: .1) : scheme.surfaceContainerLow,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: selected ? _green : scheme.outlineVariant, width: selected ? 1.6 : 1),
      ),
      child: Column(children: [
        Icon(icon, color: selected ? _green : scheme.onSurfaceVariant),
        const SizedBox(height: 6),
        Text(label, textAlign: TextAlign.center, style: TextStyle(fontWeight: FontWeight.w700, color: selected ? _green : scheme.onSurface)),
      ]),
    ),
  );

  Widget _choiceTile(ColorScheme scheme, String title, String subtitle, IconData icon, {required bool selected, required VoidCallback onTap}) =>
      ListTile(onTap: onTap, leading: Icon(icon, color: selected ? _green : scheme.onSurfaceVariant),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w700)), subtitle: Text(subtitle, style: const TextStyle(fontSize: 12)),
        trailing: selected ? Icon(Icons.check_circle, color: _green) : Icon(Icons.circle_outlined),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: BorderSide(color: selected ? _green : scheme.outlineVariant)),
        tileColor: selected ? _green.withValues(alpha: .08) : scheme.surfaceContainerLow);

  Widget _results(ColorScheme scheme) {
    final result = _result!;
    final elegidas = [
      ..._motivosElegidos.map((k) => _motivos.firstWhere((m) => m.key == k).title),
      ..._seleccion.map((k) => _modalidades.firstWhere((m) => m.key == k).title),
    ].join(', ');
    final mipymes = result.destinations.where((d) => d.esMipyme).length;
    return SafeArea(child: ListView(padding: const EdgeInsets.fromLTRB(0, 14, 0, 28), children: [
      Padding(padding: const EdgeInsets.symmetric(horizontal: 20), child: Container(
        padding: const EdgeInsets.all(18), decoration: BoxDecoration(color: _green.withValues(alpha: .08), borderRadius: BorderRadius.circular(20)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('TU EXPERIENCIA', style: TextStyle(color: _green, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.1)),
          const SizedBox(height: 5),
          Text(result.title, style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: scheme.onSurface)),
          const SizedBox(height: 5),
          Text([
            if (elegidas.isNotEmpty) 'Buscas: $elegidas',
            _omitirEstres ? 'Sin preguntas de estrés' : 'Ajustado con tu PSS-10',
            _todoMexico ? (_region.isEmpty ? 'Todo México' : _region) : (_region.isEmpty ? 'Altas Montañas' : _region),
            if (result.destinations.isNotEmpty) '$mipymes de ${result.destinations.length} son negocios locales (MiPyME)',
          ].join(' · '), style: TextStyle(fontSize: 12, height: 1.4, color: scheme.onSurfaceVariant)),
          const SizedBox(height: 8),
          Text(result.description, style: TextStyle(fontSize: 12, height: 1.4, color: scheme.onSurfaceVariant)),
        ]),
      )),
      const Padding(padding: EdgeInsets.fromLTRB(20, 20, 20, 8), child: Text('Lugares sugeridos', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800))),
      if (result.avisoCoincidencia != null)
        Padding(padding: const EdgeInsets.fromLTRB(20, 0, 20, 8), child: _infoBox(scheme, result.avisoCoincidencia!, Icons.info_outline_rounded)),
      if (result.destinations.isEmpty)
        Padding(padding: const EdgeInsets.all(24), child: _infoBox(scheme, 'Por ahora no hay lugares aprobados en el catálogo. Inténtalo más tarde.', Icons.search_off_rounded))
      else
        ...result.destinations.map((place) => WellnessPoiCard(destination: place, onTap: () => _openDestination(place))),
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
        onPressed: () => setState(() { _step = 1; _result = null; _feedbackSent = false; _fitRating = null; }),
        icon: const Icon(Icons.tune_rounded), label: const Text('Cambiar respuestas'))),
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

  Widget _loadingView(ColorScheme scheme) => Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
    CircularProgressIndicator(color: _green),
    const SizedBox(height: 16), Text('Buscando experiencias para ti…', style: TextStyle(color: _green, fontWeight: FontWeight.w600)),
    const SizedBox(height: 4), Text('Tomará solo un momento', style: TextStyle(color: scheme.onSurfaceVariant, fontSize: 12)),
  ]));

  Widget _infoBox(ColorScheme scheme, String text, IconData icon) => Container(
    padding: const EdgeInsets.all(14), decoration: BoxDecoration(color: scheme.surfaceContainerLow, borderRadius: BorderRadius.circular(14)),
    child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [Icon(icon, color: _green, size: 18), const SizedBox(width: 10), Expanded(child: Text(text, style: TextStyle(fontSize: 12, height: 1.45, color: scheme.onSurfaceVariant)))]),
  );

  Widget _primaryButton(String label, VoidCallback? onPressed) => SizedBox(width: double.infinity, height: 50,
    child: FilledButton(onPressed: onPressed, style: FilledButton.styleFrom(backgroundColor: _green, foregroundColor: _onGreen), child: Text(label, style: TextStyle(fontWeight: FontWeight.w700))));
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
        Text('Welltur sugiere experiencias de negocios locales de las Altas Montañas según lo que buscas. Las preguntas de estrés son opcionales: con nuestra encuesta a 137 personas estimamos cómo cambian las preferencias con el estrés, y eso solo ajusta qué tipo de experiencia priorizamos.', style: TextStyle(fontSize: 13, height: 1.5, color: scheme.onSurfaceVariant)),
        const SizedBox(height: 10),
        Text('No mide ni diagnostica estrés y no promete resultados de salud. Los negocios provienen del DENUE (INEGI) y del registro de SMARTUR.', style: TextStyle(fontSize: 13, height: 1.5, color: scheme.onSurfaceVariant)),
        const SizedBox(height: 18),
        SizedBox(width: double.infinity, child: FilledButton(onPressed: () => Navigator.pop(ctx), child: const Text('Entendido'))),
      ]),
    )),
  );
}
