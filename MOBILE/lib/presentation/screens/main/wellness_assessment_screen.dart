import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show rootBundle;

import '../../../data/services/wellness_service.dart';
import '../explore/detail_view_page.dart';
import '../../widgets/smartur_app_bar.dart';
import '../../widgets/wellness_poi_card.dart';
import 'wellness_trip_preferences_screen.dart';
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
  static const _pasos = 4; // estrés, modalidades, esfuerzo, región
  int _step = 0; // 0 intro, 1-4 preguntas, 5 resultados
  bool _consentGiven = false;
  bool _omitirEstres = false;
  final Map<String, int> _respuestas = {};
  final List<String> _seleccion = [];
  int _maxEffort = 2;
  String _region = '';
  bool _loading = false;
  String? _loadError;
  String? _formError;
  WellnessRecommendationResult? _result;
  int? _fitRating;
  bool _feedbackSent = false;
  final WellnessService _service = WellnessService();
  _Pss10? _pss;
  bool _usarPss = false;
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
        modalities: List.of(_seleccion),
        maxEffort: _maxEffort,
        saveHistory: _consentGiven,
        regionFilter: _region.isEmpty ? null : _region,
      );
      if (!mounted) return;
      setState(() { _result = result; _loading = false; });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _loadError = 'No se pudieron cargar lugares para estos criterios. Inténtalo de nuevo.';
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
        Text('Descansa en las Altas Montañas',
          style: TextStyle(fontSize: 27, height: 1.13, fontWeight: FontWeight.w800, color: scheme.onSurface)),
        const SizedBox(height: 12),
        Text('Cuéntanos cómo te has sentido y qué buscas; te sugerimos experiencias de negocios locales de la región.',
          style: TextStyle(fontSize: 15, height: 1.5, color: scheme.onSurfaceVariant)),
        const SizedBox(height: 16),
        _infoBox(scheme,
          'Las preguntas sobre estrés son opcionales y no son un diagnóstico. En nuestra encuesta a 137 personas, quienes reportaron más estrés eligieron más experiencias de relajación; por eso tus respuestas solo ajustan qué tipo de experiencia priorizamos.',
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
        const SizedBox(height: 8),
        // WELLTUR v2 recomienda en las Altas Montañas; para otros estados queda la búsqueda nacional.
        Center(child: TextButton(
          onPressed: () => Navigator.of(context).push(MaterialPageRoute<void>(builder: (_) => const WellnessTripPreferencesScreen())),
          child: Text('¿Viajas a otro estado? Busca en todo México', style: TextStyle(color: _green, fontWeight: FontWeight.w600)))),
      ]),
    ),
  );

  Widget _question(ColorScheme scheme) {
    const titles = {
      1: '¿Cómo te has sentido?',
      2: '¿Qué te gustaría vivir?',
      3: '¿Cuánto esfuerzo físico?',
      4: '¿Dónde buscas?',
    };
    const hints = {
      1: 'Seis preguntas breves. Puedes omitirlas.',
      2: 'Opcional: elige hasta tres, en orden de importancia.',
      3: 'Ocultaremos experiencias más exigentes que esto.',
      4: 'Municipio de las Altas Montañas, o toda la región.',
    };
    final body = switch (_step) {
      1 => _stressQuestions(scheme),
      2 => _modalityChoices(scheme),
      3 => _effortChoices(scheme),
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
      Expanded(child: SingleChildScrollView(padding: const EdgeInsets.fromLTRB(20, 0, 20, 16), child: body)),
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
    if (!_omitirEstres && _pss != null) ...[
      const SizedBox(height: 6),
      SegmentedButton<bool>(
        segments: const [
          ButtonSegment(value: false, label: Text('Breve · 6')),
          ButtonSegment(value: true, label: Text('PSS-10 · 10')),
        ],
        selected: {_usarPss},
        onSelectionChanged: (s) => setState(() { _usarPss = s.first; _formError = null; }),
      ),
    ],
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

  Widget _modalityChoices(ColorScheme scheme) => Column(children: _modalidades.map((m) {
    final index = _seleccion.indexOf(m.key);
    final selected = index >= 0;
    return Padding(padding: const EdgeInsets.only(bottom: 9), child: ListTile(
      onTap: () => setState(() {
        _formError = null;
        if (selected) {
          _seleccion.remove(m.key);
        } else if (_seleccion.length < 3) {
          _seleccion.add(m.key);
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

  Widget _regionChoices(ColorScheme scheme) => Column(children: _regiones.map((r) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: _choiceTile(scheme, r.isEmpty ? 'Toda la región' : r,
      r.isEmpty ? '57 municipios de las Altas Montañas' : 'Solo experiencias en $r',
      r.isEmpty ? Icons.map_outlined : Icons.place_outlined,
      selected: _region == r, onTap: () => setState(() => _region = r)),
  )).toList());

  Widget _choiceTile(ColorScheme scheme, String title, String subtitle, IconData icon, {required bool selected, required VoidCallback onTap}) =>
      ListTile(onTap: onTap, leading: Icon(icon, color: selected ? _green : scheme.onSurfaceVariant),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w700)), subtitle: Text(subtitle, style: const TextStyle(fontSize: 12)),
        trailing: selected ? Icon(Icons.check_circle, color: _green) : Icon(Icons.circle_outlined),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: BorderSide(color: selected ? _green : scheme.outlineVariant)),
        tileColor: selected ? _green.withValues(alpha: .08) : scheme.surfaceContainerLow);

  Widget _results(ColorScheme scheme) {
    final result = _result!;
    final elegidas = _seleccion.map((k) => _modalidades.firstWhere((m) => m.key == k).title).join(', ');
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
            _omitirEstres ? 'Sin preguntas de estrés' : 'Ajustado con tus respuestas de estrés',
            if (result.destinations.isNotEmpty) '$mipymes de ${result.destinations.length} son negocios locales (MiPyME)',
          ].join(' · '), style: TextStyle(fontSize: 12, height: 1.4, color: scheme.onSurfaceVariant)),
          const SizedBox(height: 8),
          Text(result.description, style: TextStyle(fontSize: 12, height: 1.4, color: scheme.onSurfaceVariant)),
        ]),
      )),
      const Padding(padding: EdgeInsets.fromLTRB(20, 20, 20, 8), child: Text('Lugares sugeridos', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800))),
      if (result.destinations.isEmpty)
        Padding(padding: const EdgeInsets.all(24), child: _infoBox(scheme, 'Aún no hay lugares que coincidan con este municipio y esfuerzo. Prueba con toda la región.', Icons.search_off_rounded))
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
