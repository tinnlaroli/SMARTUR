import 'package:flutter/material.dart';

import '../../../data/services/wellness_trip_service.dart';
import '../explore/detail_view_page.dart';
import 'wellness_assessment_screen.dart';
import '../../widgets/smartur_app_bar.dart';
import '../../../core/theme/welltur_theme.dart';


const _mexicanStates = <String>[
  'Aguascalientes',
  'Baja California',
  'Baja California Sur',
  'Campeche',
  'Chiapas',
  'Chihuahua',
  'Ciudad de México',
  'Coahuila',
  'Colima',
  'Durango',
  'Estado de México',
  'Guanajuato',
  'Guerrero',
  'Hidalgo',
  'Jalisco',
  'Michoacán',
  'Morelos',
  'Nayarit',
  'Nuevo León',
  'Oaxaca',
  'Puebla',
  'Querétaro',
  'Quintana Roo',
  'San Luis Potosí',
  'Sinaloa',
  'Sonora',
  'Tabasco',
  'Tamaulipas',
  'Tlaxcala',
  'Veracruz',
  'Yucatán',
  'Zacatecas',
];

const _motiveChoices = <({String code, String title, String detail})>[
  (
    code: 'M1',
    title: 'Descansar o hacer una pausa',
    detail: 'Bajar el ritmo o salir de la rutina.',
  ),
  (
    code: 'M2',
    title: 'Mantenerme activo/a',
    detail: 'Dedicar tiempo a mi vitalidad física.',
  ),
  (
    code: 'M3',
    title: 'Conectar con la naturaleza',
    detail: 'Buscar un entorno natural o al aire libre.',
  ),
  (
    code: 'M4',
    title: 'Aprender',
    detail: 'Conocer una práctica o tema de bienestar.',
  ),
  (
    code: 'M5',
    title: 'Compartir o conectar',
    detail: 'Convivir con personas o comunidad.',
  ),
  (
    code: 'M6',
    title: 'Probar algo nuevo',
    detail: 'Explorar una experiencia distinta para mí.',
  ),
  (
    code: 'M7',
    title: 'Dedicar tiempo al autocuidado',
    detail: 'Elegir una actividad de cuidado personal.',
  ),
  (
    code: 'M8',
    title: 'Explorar alimentos o bebidas',
    detail: 'Elegir una experiencia culinaria que me interese.',
  ),
  (
    code: 'M9',
    title: 'Reflexionar o practicar atención plena',
    detail: 'Buscar un momento o práctica personal.',
  ),
];

const _modalityChoices = <({String code, String title, String detail})>[
  (
    code: 'W1',
    title: 'Pausa y descanso',
    detail: 'Tiempo para bajar el ritmo o descansar.',
  ),
  (
    code: 'W2',
    title: 'Naturaleza y aire libre',
    detail: 'Entorno natural o actividad al aire libre.',
  ),
  (
    code: 'W3',
    title: 'Movimiento',
    detail: 'Actividad física con el esfuerzo que yo acepte.',
  ),
  (
    code: 'W4',
    title: 'Práctica mente-cuerpo',
    detail: 'Por ejemplo meditación, yoga o respiración.',
  ),
  (
    code: 'W5',
    title: 'Experiencia culinaria',
    detail: 'Experiencia de cocina o alimentación.',
  ),
  (
    code: 'W6',
    title: 'Aprendizaje',
    detail: 'Conocer una práctica, tema o tradición local.',
  ),
  (
    code: 'W7',
    title: 'Autocuidado',
    detail: 'Elegir un servicio o actividad de cuidado personal.',
  ),
];

class WellnessTripPreferencesScreen extends StatefulWidget {
  const WellnessTripPreferencesScreen({super.key});

  @override
  State<WellnessTripPreferencesScreen> createState() =>
      _WellnessTripPreferencesScreenState();
}

class _WellnessTripPreferencesScreenState
    extends State<WellnessTripPreferencesScreen> {
  // Acento de la paleta WELLTUR, legible en modo claro y oscuro.
  Color get _acento => WellturPalette.acento(context);
  Color get _sobreAcento => WellturPalette.sobreAcento(context);
  final WellnessTripService _service = WellnessTripService();
  final List<String> _motives = [];
  final List<String> _modalities = [];
  int _step = 0;
  int _maxEffort = 3;
  bool _needsAccessible = false;
  bool _saveAndFeedback = false;
  String _region = '';
  bool _loading = false;
  String? _error;
  WellnessTripResult? _result;
  final Set<String> _sentEvents = {};
  final Map<String, int> _ratings = {};

  Future<void> _recommend() async {
    if (_motives.isEmpty && _modalities.isEmpty) {
      setState(
        () => _error =
            'Elige al menos una prioridad o modalidad para buscar lugares.',
      );
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final result = await _service.recommend(
        motivePriorities: List.of(_motives),
        modalityPreferences: List.of(_modalities),
        maxEffort: _maxEffort,
        needsAccessible: _needsAccessible,
        saveHistory: _saveAndFeedback,
        regionFilter: _region.isEmpty ? null : _region,
      );
      if (!mounted) return;
      setState(() {
        _result = result;
        _step = 3;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _error =
            'No se pudieron obtener lugares revisados para esas preferencias. Intenta ampliar la búsqueda.';
        _loading = false;
      });
    }
  }

  void _toggle(List<String> selected, String code) {
    setState(() {
      _error = null;
      if (selected.contains(code)) {
        selected.remove(code);
      } else if (selected.length < 3) {
        selected.add(
          code,
        ); // La secuencia de selección conserva el orden declarado.
      } else {
        _error = 'Puedes ordenar hasta tres opciones por pregunta.';
      }
    });
  }

  Future<void> _feedback(
    WellnessTripDestination place,
    String event, {
    int? rating,
  }) async {
    final session = _result?.sessionId;
    if (session == null) return;
    final key = '${place.id}:$event';
    try {
      await _service.submitItemFeedback(
        sessionId: session,
        itemId: place.id,
        eventType: event,
        rating: rating,
      );
      if (mounted) {
        setState(() {
          _sentEvents.add(key);
          if (rating != null) _ratings[place.id] = rating;
        });
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('No se pudo guardar tu respuesta.')),
        );
      }
    }
  }

  Future<void> _chooseRegion(ColorScheme scheme) async {
    final selected = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      showDragHandle: true,
      builder: (context) => _MexicanStatePicker(initialValue: _region),
    );
    if (!mounted || selected == null) return;
    setState(() {
      _region = selected;
      _error = null;
    });
  }

  Future<void> _open(WellnessTripDestination place) async {
    if (_result?.sessionId != null) await _feedback(place, 'opened');
    if (!mounted) return;
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => DetailViewPage(
          title: place.name,
          heroTag: 'welltur_mw_${place.id}',
          heroImageUrl: place.imageUrl ?? '',
          subtitle: place.description,
          locationLine: place.state,
          rating: 0,
          galleryUrls: const [],
          placeId: place.detailPagePlaceId,
          lat: place.lat,
          lon: place.lon,
          showRatingPill: false,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: SmarturAppBar(
        showBack: true,
        onBack: () => _step == 0 || _step == 3
            ? Navigator.of(context).pop()
            : setState(() {
                _step--;
                _error = null;
              }),
        titleWidget: SmarturAccentTitle(
          _step == 3 ? 'Welltur · resultados' : 'Welltur · preferencias',
          fontSize: 16,
        ),
      ),
      body: _loading
          ? Center(
              child: CircularProgressIndicator(color: _acento),
            )
          : _step == 3
          ? _results(scheme)
          : _step == 0
          ? _intro(scheme)
          : _question(scheme),
    );
  }

  Widget _intro(ColorScheme scheme) => SafeArea(
    child: ListView(
      padding: const EdgeInsets.all(24),
      children: [
        Icon(Icons.spa_outlined, color: _acento, size: 42),
        const SizedBox(height: 16),
        Text(
          'Busca una experiencia a tu manera',
          style: TextStyle(
            fontSize: 25,
            fontWeight: FontWeight.w800,
            color: scheme.onSurface,
          ),
        ),
        const SizedBox(height: 10),
        Text(
          'Cuéntanos qué buscas en este viaje y cómo te gustaría vivirlo. Ordenaremos lugares que tengan actividades revisadas relacionadas con tus elecciones.',
          style: TextStyle(height: 1.45, color: scheme.onSurfaceVariant),
        ),
        const SizedBox(height: 16),
        _note(
          scheme,
          'Tus respuestas describen preferencias para este viaje; no son una prueba de salud ni un perfil psicológico. Las etiquetas M/W y el cuestionario están en evaluación. Las recomendaciones actuales usan coincidencia transparente, no un ML validado.',
          Icons.info_outline,
        ),
        const SizedBox(height: 12),
        CheckboxListTile(
          contentPadding: EdgeInsets.zero,
          value: _saveAndFeedback,
          onChanged: (value) =>
              setState(() => _saveAndFeedback = value ?? false),
          controlAffinity: ListTileControlAffinity.leading,
          title: const Text(
            'Guardar esta búsqueda y permitir valoraciones voluntarias',
            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
          ),
          subtitle: const Text(
            'Si no lo activas, la búsqueda será temporal y no guardaremos la sesión. Puedes borrar el historial desde tu perfil.',
            style: TextStyle(fontSize: 11, height: 1.35),
          ),
        ),
        const SizedBox(height: 12),
        _button(
          'Empezar',
          () => setState(() {
            _step = 1;
            _error = null;
          }),
        ),
        const SizedBox(height: 6),
        TextButton(
          onPressed: () => Navigator.of(context).push(
            MaterialPageRoute<void>(
              builder: (_) => const WellnessAssessmentScreen(),
            ),
          ),
          child: const Text('Ajustar por tu nivel de estrés (WELLTUR)'),
        ),
      ],
    ),
  );

  Widget _question(ColorScheme scheme) {
    final options = _step == 1 ? _motiveChoices : _modalityChoices;
    final selected = _step == 1 ? _motives : _modalities;
    final title = _step == 1
        ? '¿Qué quieres buscar en este viaje?'
        : '¿Qué formas de experiencia te interesan?';
    final hint = _step == 1
        ? 'Elige hasta tres. El orden en que las marcas expresa tu prioridad. Puedes continuar sin responder esta parte.'
        : 'Elige hasta tres y ordénalas al marcarlas. No inferimos una búsqueda M a partir de una modalidad W ni al revés.';
    return SafeArea(
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(22, 18, 22, 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [1, 2, 3]
                      .map(
                        (number) => Expanded(
                          child: Container(
                            height: 4,
                            margin: const EdgeInsets.only(right: 6),
                            decoration: BoxDecoration(
                              color: _step >= number
                                  ? _acento
                                  : scheme.outlineVariant,
                              borderRadius: BorderRadius.circular(4),
                            ),
                          ),
                        ),
                      )
                      .toList(),
                ),
                const SizedBox(height: 18),
                Text(
                  'PASO $_step DE 3',
                  style: TextStyle(
                    color: _acento,
                    fontSize: 10,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1.2,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                    color: scheme.onSurface,
                  ),
                ),
                const SizedBox(height: 5),
                Text(
                  hint,
                  style: TextStyle(
                    fontSize: 12,
                    height: 1.4,
                    color: scheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: _step < 3
                ? ListView(
                    padding: const EdgeInsets.fromLTRB(18, 5, 18, 12),
                    children: [
                      ...options.map((option) {
                        final index = selected.indexOf(option.code);
                        return Card(
                          margin: const EdgeInsets.only(bottom: 8),
                          color: index >= 0
                              ? _acento.withValues(alpha: .08)
                              : scheme.surfaceContainerLow,
                          child: CheckboxListTile(
                            value: index >= 0,
                            activeColor: _acento,
                            controlAffinity: ListTileControlAffinity.leading,
                            title: Text(
                              '${option.code} · ${option.title}',
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            subtitle: Text(
                              index >= 0
                                  ? 'Prioridad ${index + 1} · ${option.detail}'
                                  : option.detail,
                              style: const TextStyle(fontSize: 11),
                            ),
                            onChanged: (_) => _toggle(selected, option.code),
                          ),
                        );
                      }),
                    ],
                  )
                : _filters(scheme),
          ),
          if (_error != null)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 4),
              child: Text(
                _error!,
                style: TextStyle(color: scheme.error, fontSize: 12),
              ),
            ),
          Padding(
            padding: const EdgeInsets.fromLTRB(18, 6, 18, 16),
            child: Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => setState(() {
                      _step--;
                      _error = null;
                    }),
                    child: const Text('Atrás'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: FilledButton(
                    onPressed: () {
                      if (_step < 3) {
                        setState(() {
                          _step++;
                          _error = null;
                        });
                      } else {
                        _recommend();
                      }
                    },
                    style: FilledButton.styleFrom(
                      backgroundColor: _acento,
                      foregroundColor: _sobreAcento,
                    ),
                    child: Text(_step == 3 ? 'Ver lugares' : 'Continuar'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _filters(ColorScheme scheme) => ListView(
    padding: const EdgeInsets.fromLTRB(20, 5, 20, 12),
    children: [
      Text(
        'Ajusta condiciones de búsqueda',
        style: TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w700,
          color: scheme.onSurface,
        ),
      ),
      const SizedBox(height: 10),
      const Text(
        'Esfuerzo físico máximo que aceptas',
        style: TextStyle(fontWeight: FontWeight.w600),
      ),
      const SizedBox(height: 4),
      SegmentedButton<int>(
        segments: const [
          ButtonSegment(value: 1, label: Text('Suave')),
          ButtonSegment(value: 2, label: Text('Medio')),
          ButtonSegment(value: 3, label: Text('Alto')),
        ],
        selected: {_maxEffort},
        onSelectionChanged: (selection) =>
            setState(() => _maxEffort = selection.first),
      ),
      const SizedBox(height: 12),
      SwitchListTile(
        contentPadding: EdgeInsets.zero,
        value: _needsAccessible,
        onChanged: (value) => setState(() => _needsAccessible = value),
        title: const Text(
          'Necesito opciones marcadas como accesibles',
          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
        ),
        subtitle: const Text(
          'Solo mostraremos lugares con accesibilidad registrada; un dato desconocido se excluye.',
          style: TextStyle(fontSize: 11),
        ),
      ),
      const SizedBox(height: 8),
      Text('Destino', style: TextStyle(fontWeight: FontWeight.w600)),
      const SizedBox(height: 6),
      Card(
        color: scheme.surfaceContainerLow,
        child: ListTile(
          leading: Icon(
            Icons.location_on_outlined,
            color: _acento,
          ),
          title: Text(_region.isEmpty ? 'Todo México' : _region),
          subtitle: Text(
            _region.isEmpty
                ? 'Buscar en los estados con lugares revisados'
                : 'Filtrar recomendaciones por estado',
          ),
          trailing: const Icon(Icons.expand_more),
          onTap: () => _chooseRegion(scheme),
        ),
      ),
    ],
  );

  Widget _results(ColorScheme scheme) {
    final result = _result!;
    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
        children: [
          _note(scheme, result.notice, Icons.info_outline),
          const SizedBox(height: 12),
          Text(
            'Lugares relacionados con tus preferencias',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w800,
              color: scheme.onSurface,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Estrategia: ${result.algorithm == 'explicit_mw_content_baseline_v1' ? 'coincidencia de contenido' : result.algorithm}. No representa una probabilidad de beneficio.',
            style: TextStyle(fontSize: 11, color: scheme.onSurfaceVariant),
          ),
          const SizedBox(height: 10),
          if (result.destinations.isEmpty)
            _note(
              scheme,
              'No hay lugares con etiquetas M/W revisadas que coincidan con estas condiciones. Prueba ampliar la región o el esfuerzo.',
              Icons.search_off_outlined,
            )
          else
            ...result.destinations.map((place) => _placeCard(place, scheme)),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: () => setState(() {
              _step = 1;
              _result = null;
              _error = null;
              _sentEvents.clear();
              _ratings.clear();
            }),
            icon: const Icon(Icons.tune),
            label: const Text('Cambiar preferencias'),
          ),
        ],
      ),
    );
  }

  Widget _placeCard(WellnessTripDestination place, ColorScheme scheme) {
    final session = _result?.sessionId;
    final saved = _sentEvents.contains('${place.id}:saved');
    final dismissed = _sentEvents.contains('${place.id}:dismissed');
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (place.imageUrl != null && place.imageUrl!.isNotEmpty)
            Image.network(
              place.imageUrl!,
              height: 150,
              width: double.infinity,
              fit: BoxFit.cover,
              errorBuilder: (context, error, stackTrace) =>
                  const SizedBox(height: 12),
            ),
          InkWell(
            onTap: () => _open(place),
            child: Padding(
              padding: const EdgeInsets.fromLTRB(14, 12, 14, 4),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    place.name,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      color: scheme.onSurface,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    '${place.category} · ${place.state} · coincidencia ${place.matchPct.toStringAsFixed(0)}%',
                    style: TextStyle(
                      fontSize: 11,
                      color: scheme.onSurfaceVariant,
                    ),
                  ),
                  if (place.description.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Text(
                      place.description,
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 12,
                        color: scheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 5,
                    runSpacing: 5,
                    children: [
                      ...place.matchedMotives.map(
                        (code) => _tag(
                          '$code · ${_motiveChoices.firstWhere((choice) => choice.code == code).title}',
                          scheme,
                        ),
                      ),
                      ...place.matchedModalities.map(
                        (code) => _tag(
                          '$code · ${_modalityChoices.firstWhere((choice) => choice.code == code).title}',
                          scheme,
                        ),
                      ),
                    ],
                  ),
                  ...place.evidence.entries.map(
                    (entry) => Padding(
                      padding: const EdgeInsets.only(top: 5),
                      child: Text(
                        '${entry.key}: ${entry.value}',
                        style: TextStyle(
                          fontSize: 10,
                          color: scheme.onSurfaceVariant,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          if (session != null)
            Padding(
              padding: const EdgeInsets.fromLTRB(10, 0, 10, 8),
              child: Column(
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: TextButton.icon(
                          onPressed: saved
                              ? null
                              : () => _feedback(place, 'saved'),
                          icon: const Icon(Icons.bookmark_border, size: 18),
                          label: Text(saved ? 'Guardado' : 'Me interesa'),
                        ),
                      ),
                      Expanded(
                        child: TextButton.icon(
                          onPressed: dismissed
                              ? null
                              : () => _feedback(place, 'dismissed'),
                          icon: const Icon(
                            Icons.thumb_down_alt_outlined,
                            size: 18,
                          ),
                          label: Text(
                            dismissed ? 'Registrado' : 'No me interesa',
                          ),
                        ),
                      ),
                    ],
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text(
                        '¿Qué tanto coincide?',
                        style: TextStyle(fontSize: 11),
                      ),
                      const SizedBox(width: 6),
                      ...List.generate(5, (index) {
                        final value = index + 1;
                        return IconButton(
                          visualDensity: VisualDensity.compact,
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints.tightFor(
                            width: 30,
                            height: 32,
                          ),
                          onPressed: () =>
                              _feedback(place, 'rated', rating: value),
                          icon: Icon(
                            value <= (_ratings[place.id] ?? 0)
                                ? Icons.star
                                : Icons.star_border,
                            color: _acento,
                            size: 19,
                          ),
                          tooltip: '$value de 5',
                        );
                      }),
                    ],
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _tag(String text, ColorScheme scheme) => Chip(
    visualDensity: VisualDensity.compact,
    label: Text(text, style: const TextStyle(fontSize: 9)),
    backgroundColor: _acento.withValues(alpha: .08),
    side: BorderSide.none,
    labelPadding: const EdgeInsets.symmetric(horizontal: 3),
  );

  Widget _note(ColorScheme scheme, String text, IconData icon) => Container(
    padding: const EdgeInsets.all(13),
    decoration: BoxDecoration(
      color: scheme.surfaceContainerLow,
      borderRadius: BorderRadius.circular(14),
    ),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: _acento, size: 18),
        const SizedBox(width: 9),
        Expanded(
          child: Text(
            text,
            style: TextStyle(
              fontSize: 11,
              height: 1.4,
              color: scheme.onSurfaceVariant,
            ),
          ),
        ),
      ],
    ),
  );

  Widget _button(String title, VoidCallback onPressed) => SizedBox(
    height: 48,
    child: FilledButton(
      onPressed: onPressed,
      style: FilledButton.styleFrom(backgroundColor: _acento, foregroundColor: _sobreAcento),
      child: Text(title),
    ),
  );
}

class _MexicanStatePicker extends StatefulWidget {
  const _MexicanStatePicker({required this.initialValue});

  final String initialValue;

  @override
  State<_MexicanStatePicker> createState() => _MexicanStatePickerState();
}

class _MexicanStatePickerState extends State<_MexicanStatePicker> {
  // Acento de la paleta WELLTUR, legible en modo claro y oscuro.
  Color get _acento => WellturPalette.acento(context);
  final TextEditingController _searchController = TextEditingController();
  String _query = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final query = _query.trim().toLowerCase();
    final states = _mexicanStates
        .where((state) => state.toLowerCase().contains(query))
        .toList(growable: false);
    return Padding(
      padding: EdgeInsets.fromLTRB(
        20,
        4,
        20,
        16 + MediaQuery.viewInsetsOf(context).bottom,
      ),
      child: SizedBox(
        height: MediaQuery.sizeOf(context).height * .72,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Elige dónde buscar',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w800,
                color: scheme.onSurface,
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _searchController,
              autofocus: false,
              onChanged: (value) => setState(() => _query = value),
              decoration: InputDecoration(
                prefixIcon: const Icon(Icons.search),
                hintText: 'Buscar estado',
                filled: true,
                fillColor: scheme.surfaceContainerLow,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
            const SizedBox(height: 8),
            Expanded(
              child: ListView(
                children: [
                  ListTile(
                    leading: const Icon(Icons.public_outlined),
                    title: const Text('Todo México'),
                    trailing: widget.initialValue.isEmpty
                        ? Icon(Icons.check, color: _acento)
                        : null,
                    onTap: () => Navigator.pop(context, ''),
                  ),
                  ...states.map(
                    (state) => ListTile(
                      title: Text(state),
                      trailing: widget.initialValue == state
                          ? Icon(Icons.check, color: _acento)
                          : null,
                      onTap: () => Navigator.pop(context, state),
                    ),
                  ),
                  if (states.isEmpty)
                    const Padding(
                      padding: EdgeInsets.all(20),
                      child: Text('No encontramos ese estado.'),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
