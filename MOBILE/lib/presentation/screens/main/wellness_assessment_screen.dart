import 'package:flutter/material.dart';

import '../../../data/services/wellness_service.dart';
import '../explore/detail_view_page.dart';
import '../../widgets/smartur_app_bar.dart';
import '../../widgets/wellness_poi_card.dart';

const _green = Color(0xFF16845B);

const _wellnessDimensions = <({String key, String title, String subtitle, IconData icon})>[
  (key: 'physical', title: 'Física', subtitle: 'Movimiento, alimentación, sueño o cuidado corporal.', icon: Icons.directions_walk_outlined),
  (key: 'mental', title: 'Mental', subtitle: 'Aprender, resolver problemas o explorar la creatividad.', icon: Icons.psychology_outlined),
  (key: 'emotional', title: 'Emocional', subtitle: 'Reconocer, expresar y comprender emociones.', icon: Icons.favorite_border_rounded),
  (key: 'spiritual', title: 'Espiritual', subtitle: 'Reflexionar sobre sentido, valores o propósito.', icon: Icons.spa_outlined),
  (key: 'social', title: 'Social', subtitle: 'Convivir y conectar con personas o comunidad.', icon: Icons.groups_outlined),
  (key: 'environmental', title: 'Ambiental', subtitle: 'Relacionarse con la naturaleza y el entorno.', icon: Icons.forest_outlined),
];

class WellnessAssessmentScreen extends StatefulWidget {
  const WellnessAssessmentScreen({super.key});

  @override
  State<WellnessAssessmentScreen> createState() => _WellnessAssessmentScreenState();
}

class _WellnessAssessmentScreenState extends State<WellnessAssessmentScreen> {
  int _step = 0; // intro, priorities, activity, region, result
  bool _consentGiven = false;
  final Set<String> _dimensions = {};
  String _activityLevel = 'moderate';
  // Avoid silently favoring a region before the user has chosen one.
  String _region = '';
  bool _loading = false;
  String? _loadError;
  String? _formError;
  WellnessRecommendationResult? _result;
  int? _fitRating;
  bool _feedbackSent = false;
  final WellnessService _service = WellnessService();

  void _next() {
    if (_step == 1 && _dimensions.isEmpty) {
      setState(() => _formError = 'Elige al menos una prioridad para tu viaje.');
      return;
    }
    setState(() { _formError = null; _loadError = null; _step = (_step + 1).clamp(0, 4); });
    if (_step == 4) _submit();
  }

  void _back() {
    if (_step == 0 || _step == 4) {
      Navigator.of(context).pop();
      return;
    }
    setState(() { _loadError = null; _formError = null; _step--; });
  }

  Future<void> _submit() async {
    setState(() { _loading = true; _loadError = null; });
    try {
      final result = await _service.recommend(
        wellnessDimensions: _dimensions.toList(),
        activityLevel: _activityLevel,
        saveHistory: _consentGiven,
        regionFilter: _region.isEmpty ? null : _region,
        topN: 3,
      );
      if (!mounted) return;
      setState(() { _result = result; _loading = false; });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _loadError = 'No se pudieron cargar lugares aprobados para estos criterios. Inténtalo de nuevo.';
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
        locationLine: destination.estado,
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
    return Scaffold(
      backgroundColor: scheme.surface,
      appBar: SmarturAppBar(
        showBack: true,
        onBack: _back,
        titleWidget: SmarturAccentTitle(
          _step == 4 ? 'Welltur · resultados' : 'Welltur · preferencias',
          fontSize: 16,
        ),
      ),
      body: _loading
          ? _loadingView(scheme)
          : _step == 0
              ? _intro(scheme)
              : _step == 4 && _result != null
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
          child: const Icon(Icons.eco_outlined, color: _green, size: 30)),
        const SizedBox(height: 22),
        Text('Arma una experiencia a tu manera',
          style: TextStyle(fontSize: 27, height: 1.13, fontWeight: FontWeight.w800, color: scheme.onSurface)),
        const SizedBox(height: 12),
        Text('Elige tus prioridades de viaje y te mostraremos lugares aprobados que coincidan.',
          style: TextStyle(fontSize: 15, height: 1.5, color: scheme.onSurfaceVariant)),
        const SizedBox(height: 16),
        _infoBox(scheme,
          'Son preferencias de viaje, no una prueba de estrés. GWI aporta un marco conceptual; SMARTUR revisa las propuestas, no es una certificación de GWI.',
          Icons.info_outline_rounded),
        const SizedBox(height: 12),
        InkWell(
          onTap: () => setState(() => _consentGiven = !_consentGiven),
          borderRadius: BorderRadius.circular(12),
          child: Padding(padding: const EdgeInsets.symmetric(vertical: 8), child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Checkbox(value: _consentGiven, activeColor: _green, onChanged: (v) => setState(() => _consentGiven = v ?? false)),
            Expanded(child: Padding(padding: const EdgeInsets.only(top: 12), child: Text(
              'Opcional: guardar esta búsqueda en mi historial y poder enviar una valoración. Si no lo activo, usaremos tus criterios solo para esta búsqueda y no guardaremos la sesión. Puedes borrar el historial desde tu perfil.',
              style: TextStyle(fontSize: 12, height: 1.45, color: scheme.onSurfaceVariant)))),
          ])),
        ),
        const SizedBox(height: 20),
        _primaryButton('Empezar · 3 pasos', _next),
      ]),
    ),
  );

  Widget _question(ColorScheme scheme) {
    final titles = {
      1: '¿Qué quieres priorizar?',
      2: '¿Qué ritmo prefieres?',
      3: '¿En qué región buscas?',
    };
    final hints = {
      1: 'Elige de una a tres dimensiones. Son criterios de búsqueda, no una evaluación personal.',
      2: 'En lugares con la misma coincidencia de dimensiones, priorizaremos el esfuerzo más cercano al ritmo que prefieres.',
      3: 'Puedes cambiar la región o ver lugares de todos los estados.',
    };
    return SafeArea(child: Column(children: [
      Padding(padding: const EdgeInsets.fromLTRB(24, 20, 24, 12), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [1, 2, 3].map((step) => Expanded(child: Container(
          height: 4, margin: const EdgeInsets.only(right: 6),
          decoration: BoxDecoration(color: _step >= step ? _green : scheme.outlineVariant, borderRadius: BorderRadius.circular(4)),
        ))).toList()),
        const SizedBox(height: 20),
        Text('PASO $_step DE 3', style: const TextStyle(color: _green, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.2)),
        const SizedBox(height: 7),
        Text(titles[_step]!, style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: scheme.onSurface)),
        const SizedBox(height: 6),
        Text(hints[_step]!, style: TextStyle(fontSize: 13, height: 1.4, color: scheme.onSurfaceVariant)),
        if (_step == 1) ...[
          const SizedBox(height: 7),
          Semantics(
            liveRegion: true,
            label: '${_dimensions.length} de 3 prioridades seleccionadas',
            child: Text(
              '${_dimensions.length} de 3 seleccionadas',
              style: const TextStyle(color: _green, fontSize: 12, fontWeight: FontWeight.w700),
            ),
          ),
        ],
      ])),
      Expanded(child: SingleChildScrollView(padding: const EdgeInsets.fromLTRB(20, 0, 20, 16), child: _step == 1
          ? _dimensionChoices(scheme)
          : _step == 2 ? _activityChoices(scheme) : _regionChoice(scheme))),
      if (_formError != null) Padding(padding: const EdgeInsets.symmetric(horizontal: 24), child: Text(_formError!, style: TextStyle(color: scheme.error, fontSize: 12))),
      Padding(padding: const EdgeInsets.fromLTRB(20, 8, 20, 18), child: Row(children: [
        Expanded(child: OutlinedButton(onPressed: _back, child: const Text('Atrás'))),
        const SizedBox(width: 12),
        Expanded(child: FilledButton(
          onPressed: _step == 1 && _dimensions.isEmpty ? null : _next,
          style: FilledButton.styleFrom(backgroundColor: _green),
          child: Text(_step == 3 ? 'Ver lugares' : 'Continuar'))),
      ])),
    ]));
  }

  Widget _dimensionChoices(ColorScheme scheme) => Column(children: _wellnessDimensions.map((dimension) {
    final selected = _dimensions.contains(dimension.key);
    return Padding(padding: const EdgeInsets.only(bottom: 9), child: Material(
      color: selected ? _green.withValues(alpha: .08) : scheme.surfaceContainerLow,
      borderRadius: BorderRadius.circular(16),
      child: CheckboxListTile(
        value: selected,
        activeColor: _green,
        controlAffinity: ListTileControlAffinity.trailing,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(color: selected ? _green : scheme.outlineVariant.withValues(alpha: .6), width: selected ? 1.5 : 1),
        ),
        title: Row(children: [
          Icon(dimension.icon, color: selected ? _green : scheme.onSurfaceVariant, size: 20),
          const SizedBox(width: 9),
          Expanded(child: Text(dimension.title, style: TextStyle(fontWeight: FontWeight.w700, color: scheme.onSurface))),
        ]),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 3),
          child: Text(dimension.subtitle, style: TextStyle(fontSize: 11, height: 1.3, color: scheme.onSurfaceVariant)),
        ),
        onChanged: (_) => setState(() {
          _formError = null;
          if (selected) { _dimensions.remove(dimension.key); }
          else if (_dimensions.length < 3) { _dimensions.add(dimension.key); }
          else { _formError = 'Puedes elegir hasta tres prioridades.'; }
        }),
      ),
    ));
  }).toList());

  Widget _activityChoices(ColorScheme scheme) {
    const choices = [
      ('low', 'Suave', 'Poco esfuerzo físico', Icons.self_improvement_outlined),
      ('moderate', 'Intermedio', 'Un ritmo equilibrado', Icons.directions_walk_outlined),
      ('high', 'Activo', 'Me gustan los retos físicos', Icons.hiking_outlined),
    ];
    return RadioGroup<String>(
      groupValue: _activityLevel,
      onChanged: (value) {
        if (value != null) setState(() => _activityLevel = value);
      },
      child: Column(children: choices.map((choice) {
      final selected = _activityLevel == choice.$1;
      return Padding(padding: const EdgeInsets.only(bottom: 10), child: RadioListTile<String>(
        value: choice.$1,
        activeColor: _green, tileColor: selected ? _green.withValues(alpha: .08) : scheme.surfaceContainerLow,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: BorderSide(color: selected ? _green : scheme.outlineVariant.withValues(alpha: .5))),
        secondary: Icon(choice.$4, color: selected ? _green : scheme.onSurfaceVariant),
        title: Text(choice.$2, style: const TextStyle(fontWeight: FontWeight.w700)),
        subtitle: Text(choice.$3, style: const TextStyle(fontSize: 12)),
      ));
      }).toList()),
    );
  }

  Widget _regionChoice(ColorScheme scheme) => Column(children: [
    _choiceTile(scheme, 'Veracruz', 'Priorizar sitios dentro del estado', Icons.place_outlined, selected: _region == 'Veracruz', onTap: () => setState(() => _region = 'Veracruz')),
    const SizedBox(height: 10),
    _choiceTile(scheme, 'Todos los estados', 'Incluir todo el catálogo aprobado', Icons.map_outlined, selected: _region.isEmpty, onTap: () => setState(() => _region = '')),
  ]);

  Widget _choiceTile(ColorScheme scheme, String title, String subtitle, IconData icon, {required bool selected, required VoidCallback onTap}) =>
      ListTile(onTap: onTap, leading: Icon(icon, color: selected ? _green : scheme.onSurfaceVariant),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w700)), subtitle: Text(subtitle, style: const TextStyle(fontSize: 12)),
        trailing: selected ? const Icon(Icons.check_circle, color: _green) : const Icon(Icons.circle_outlined),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: BorderSide(color: selected ? _green : scheme.outlineVariant)),
        tileColor: selected ? _green.withValues(alpha: .08) : scheme.surfaceContainerLow);

  Widget _results(ColorScheme scheme) {
    final result = _result!;
    return SafeArea(child: ListView(padding: const EdgeInsets.fromLTRB(0, 14, 0, 28), children: [
      Padding(padding: const EdgeInsets.symmetric(horizontal: 20), child: Container(
        padding: const EdgeInsets.all(18), decoration: BoxDecoration(color: _green.withValues(alpha: .08), borderRadius: BorderRadius.circular(20)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('TU EXPERIENCIA', style: TextStyle(color: _green, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.1)),
          const SizedBox(height: 5),
          Text(result.title, style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: scheme.onSurface)),
          const SizedBox(height: 5),
          Text('Prioridades: ${_dimensions.map((key) => _wellnessDimensions.firstWhere((d) => d.key == key).title).join(', ')} · ritmo ${_activityLabel(_activityLevel)}',
              style: TextStyle(fontSize: 12, height: 1.4, color: scheme.onSurfaceVariant)),
          const SizedBox(height: 8),
          Text(result.description, style: TextStyle(fontSize: 13, height: 1.4, color: scheme.onSurfaceVariant)),
        ]),
      )),
      const Padding(padding: EdgeInsets.fromLTRB(20, 20, 20, 3), child: Text('Lugares que coinciden', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800))),
      Padding(padding: const EdgeInsets.fromLTRB(20, 0, 20, 8), child: Text('El orden refleja coincidencia con tus criterios; no es una probabilidad de beneficio para la salud.', style: TextStyle(fontSize: 11, color: scheme.onSurfaceVariant))),
      if (result.destinations.isEmpty)
        Padding(padding: const EdgeInsets.all(24), child: _infoBox(scheme, 'Aún no hay lugares aprobados que coincidan con esta región y preferencias. Prueba con todos los estados.', Icons.search_off_rounded))
      else
        ...result.destinations.map((place) => WellnessPoiCard(
          destination: place,
          onTap: () => _openDestination(place),
        )),
      if (result.sessionId != null) Padding(padding: const EdgeInsets.fromLTRB(20, 12, 20, 4), child: Card(
        child: Padding(padding: const EdgeInsets.all(16), child: Column(children: [
          Text(_feedbackSent ? '¡Gracias! Usaremos tu valoración para evaluar el ajuste de las recomendaciones.' : '¿Qué tan bien coincidieron con lo que buscabas?', textAlign: TextAlign.center, style: const TextStyle(fontWeight: FontWeight.w600)),
          if (!_feedbackSent) ...[
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                5,
                (i) => IconButton(
                  tooltip: '${i + 1} de 5',
                  onPressed: () => _sendFeedback(i + 1),
                  icon: Icon(
                    _fitRating != null && i < _fitRating!
                        ? Icons.star_rounded
                        : Icons.star_outline_rounded,
                    color: _green,
                  ),
                ),
              ),
            ),
          ],
        ])),
      )),
      Padding(padding: const EdgeInsets.fromLTRB(20, 16, 20, 0), child: OutlinedButton.icon(
        onPressed: () => setState(() { _step = 1; _result = null; _feedbackSent = false; _fitRating = null; }),
        icon: const Icon(Icons.tune_rounded), label: const Text('Cambiar preferencias'))),
    ]));
  }

  Widget _errorView(ColorScheme scheme) => Center(child: Padding(padding: const EdgeInsets.all(24), child: Column(
    mainAxisSize: MainAxisSize.min, children: [
      Icon(Icons.cloud_off_outlined, size: 42, color: scheme.error),
      const SizedBox(height: 12), Text(_loadError ?? 'No se pudieron cargar las recomendaciones.', textAlign: TextAlign.center),
      const SizedBox(height: 18), FilledButton(onPressed: _submit, child: const Text('Reintentar')),
      TextButton(onPressed: _back, child: const Text('Cambiar criterios')),
    ],
  )));

  Widget _loadingView(ColorScheme scheme) => Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
    const CircularProgressIndicator(color: _green),
    const SizedBox(height: 16), Text('Buscando lugares aprobados que coincidan…', style: TextStyle(color: _green, fontWeight: FontWeight.w600)),
    const SizedBox(height: 4), Text('Tomará solo un momento', style: TextStyle(color: scheme.onSurfaceVariant, fontSize: 12)),
  ]));

  Widget _infoBox(ColorScheme scheme, String text, IconData icon) => Container(
    padding: const EdgeInsets.all(14), decoration: BoxDecoration(color: scheme.surfaceContainerLow, borderRadius: BorderRadius.circular(14)),
    child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [Icon(icon, color: _green, size: 18), const SizedBox(width: 10), Expanded(child: Text(text, style: TextStyle(fontSize: 12, height: 1.45, color: scheme.onSurfaceVariant)))]),
  );

  Widget _primaryButton(String label, VoidCallback? onPressed) => SizedBox(width: double.infinity, height: 50,
    child: FilledButton(onPressed: onPressed, style: FilledButton.styleFrom(backgroundColor: _green), child: Text(label, style: const TextStyle(fontWeight: FontWeight.w700))));

  String _activityLabel(String value) => switch (value) { 'low' => 'suave', 'high' => 'activo', _ => 'intermedio' };
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
        Text('Welltur ordena lugares aprobados por SMARTUR según tus prioridades de viaje y el esfuerzo físico informado para cada experiencia. No mide ni diagnostica estrés y no predice resultados de salud.', style: TextStyle(fontSize: 13, height: 1.5, color: scheme.onSurfaceVariant)),
        const SizedBox(height: 10),
        Text('El marco de seis dimensiones de GWI es conceptual: no constituye una rúbrica de puntuación ni una certificación para los lugares.', style: TextStyle(fontSize: 13, height: 1.5, color: scheme.onSurfaceVariant)),
        const SizedBox(height: 18),
        SizedBox(width: double.infinity, child: FilledButton(onPressed: () => Navigator.pop(ctx), child: const Text('Entendido'))),
      ]),
    )),
  );
}
