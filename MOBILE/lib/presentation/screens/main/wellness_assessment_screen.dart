import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../data/services/wellness_service.dart';
import '../../widgets/wellness_poi_card.dart';

const _modoColors = {
  'modo_calma':        Color(0xFF10B981),
  'modo_restauracion': Color(0xFF3B82F6),
  'modo_equilibrio':   Color(0xFF8B5CF6),
};

const _modoDescriptions = {
  'modo_calma':        'Necesitas desconectarte y recargar tu energía en un entorno tranquilo.',
  'modo_restauracion': 'Tu cuerpo y mente buscan descanso activo y recuperación.',
  'modo_equilibrio':   'Buscas silencio y espacio para centrarte y encontrar paz interior.',
};

const _modoIcons = {
  'modo_calma':        Icons.spa_outlined,
  'modo_restauracion': Icons.water_outlined,
  'modo_equilibrio':   Icons.self_improvement_outlined,
};

class _Question {
  final String id;
  final String dimension;   // etiqueta de grupo visible
  final String source;      // instrumento validado (solo referencia interna)
  final String question;
  final List<String> options;
  final List<IconData> icons;

  const _Question({
    required this.id,
    required this.dimension,
    required this.source,
    required this.question,
    required this.options,
    required this.icons,
  });
}

// ── 8 ítems — 2 por dimensión, basados en SF-36 VT, SMBM, PSS-4 y PANAS-NA ──
// Escala: 1 = estado óptimo, 4 = estado más deteriorado (consistente con el modelo)
const _questions = [

  // ── Dimensión 1: Energía cognitiva (SF-36 VT + SMBM cognitivo) ──────────────
  _Question(
    id: 'q1a',
    dimension: 'Energía',
    source: 'SF-36 VT',
    question: '¿Cuánta energía mental tienes en este momento?',
    options: [
      'Mucha — me siento enfocado/a y activo/a',
      'Suficiente, aunque algo cansado/a',
      'Poca, me cuesta arrancar',
      'Sin energía, mentalmente agotado/a',
    ],
    icons: [
      Icons.battery_full,
      Icons.battery_4_bar,
      Icons.battery_2_bar,
      Icons.battery_alert_outlined,
    ],
  ),
  _Question(
    id: 'q1b',
    dimension: 'Energía',
    source: 'SMBM cognitivo',
    question: '¿Cómo sientes tu pensamiento hoy?',
    options: [
      'Claro y ágil',
      'Un poco lento',
      'Me cuesta concentrarme',
      'Mi mente se siente pesada o bloqueada',
    ],
    icons: [
      Icons.lightbulb_outlined,
      Icons.lightbulb,
      Icons.psychology_outlined,
      Icons.psychology,
    ],
  ),

  // ── Dimensión 2: Tensión física (SMBM físico) ───────────────────────────────
  _Question(
    id: 'q2a',
    dimension: 'Cuerpo',
    source: 'SMBM físico',
    question: '¿Sientes tensión o pesadez en tu cuerpo?',
    options: [
      'Nada, estoy relajado/a',
      'Un poco de tensión',
      'Bastante tensión muscular',
      'Mucha tensión, me pesa o duele el cuerpo',
    ],
    icons: [
      Icons.sentiment_very_satisfied_outlined,
      Icons.sentiment_satisfied_outlined,
      Icons.sentiment_dissatisfied_outlined,
      Icons.mood_bad_outlined,
    ],
  ),
  _Question(
    id: 'q2b',
    dimension: 'Cuerpo',
    source: 'SMBM físico',
    question: '¿Cómo describes tu energía física ahora?',
    options: [
      'Me siento físicamente bien',
      'Un poco cansado/a',
      'Bastante agotado/a físicamente',
      'Sin fuerzas, el cuerpo no responde',
    ],
    icons: [
      Icons.directions_run,
      Icons.directions_walk,
      Icons.accessibility_new_outlined,
      Icons.airline_seat_flat_outlined,
    ],
  ),

  // ── Dimensión 3: Rumiación (PSS-4 adaptado) ─────────────────────────────────
  _Question(
    id: 'q3a',
    dimension: 'Pensamientos',
    source: 'PSS-4',
    question: '¿Te cuesta apagar los pensamientos?',
    options: [
      'No, mi mente está tranquila',
      'A veces pienso de más',
      'Con frecuencia no puedo parar',
      'Mis pensamientos no me dejan descansar',
    ],
    icons: [
      Icons.wb_sunny_outlined,
      Icons.cloud_outlined,
      Icons.thunderstorm_outlined,
      Icons.storm_outlined,
    ],
  ),
  _Question(
    id: 'q3b',
    dimension: 'Pensamientos',
    source: 'PSS-4',
    question: '¿Sientes que las cosas pendientes se acumulan?',
    options: [
      'No, tengo todo bajo control',
      'Algo se acumula pero lo manejo',
      'Se acumulan bastante y me pesa',
      'Siento que no puedo con todo',
    ],
    icons: [
      Icons.check_circle_outline,
      Icons.pending_outlined,
      Icons.inbox_outlined,
      Icons.warning_amber_outlined,
    ],
  ),

  // ── Dimensión 4: Activación negativa (PANAS-NA) ──────────────────────────────
  _Question(
    id: 'q4a',
    dimension: 'Estado interno',
    source: 'PANAS-NA',
    question: '¿Te sientes nervioso/a o inquieto/a?',
    options: [
      'Para nada, me siento en paz',
      'Un poco inquieto/a',
      'Bastante nervioso/a',
      'Muy agitado/a por dentro',
    ],
    icons: [
      Icons.spa_outlined,
      Icons.waves_outlined,
      Icons.cyclone_outlined,
      Icons.electric_bolt_outlined,
    ],
  ),
  _Question(
    id: 'q4b',
    dimension: 'Estado interno',
    source: 'PANAS-NA',
    question: '¿Sientes agitación o tensión interior?',
    options: [
      'Ninguna, estoy tranquilo/a',
      'Un leve malestar',
      'Bastante agitación',
      'Mucha tensión, difícil de calmar',
    ],
    icons: [
      Icons.self_improvement_outlined,
      Icons.water_drop_outlined,
      Icons.air_outlined,
      Icons.bolt_outlined,
    ],
  ),
];

// Dimensiones con color e ícono para el indicador de grupo
const _dimensionMeta = {
  'Energía':         (Icons.battery_full,          Color(0xFF10B981)),
  'Cuerpo':          (Icons.accessibility_new,      Color(0xFF3B82F6)),
  'Pensamientos':    (Icons.psychology_outlined,    Color(0xFF8B5CF6)),
  'Estado interno':  (Icons.self_improvement_outlined, Color(0xFFF59E0B)),
};

/// Pantalla de evaluación de vitalidad de viaje (8 ítems validados SF-36/SMBM/PSS-4/PANAS-NA).
/// Nunca muestra terminología clínica. Incluye disclaimer y consentimiento explícito.
class WellnessAssessmentScreen extends StatefulWidget {
  const WellnessAssessmentScreen({super.key});

  @override
  State<WellnessAssessmentScreen> createState() => _WellnessAssessmentScreenState();
}

class _WellnessAssessmentScreenState extends State<WellnessAssessmentScreen>
    with TickerProviderStateMixin {
  // 0=disclaimer, 1-8=preguntas, 9=resultado
  int _step = 0;
  bool _consentGiven = false;
  final Map<String, int> _answers = {};
  bool _loading = false;
  String? _error;
  WellnessAssessmentResult? _result;

  late final AnimationController _fadeCtrl;
  late final Animation<double> _fadeAnim;

  final _service = WellnessService();

  int? _fitRating;
  bool _feedbackSent = false;

  @override
  void initState() {
    super.initState();
    _fadeCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 300));
    _fadeAnim = CurvedAnimation(parent: _fadeCtrl, curve: Curves.easeInOut);
    _fadeCtrl.forward();
  }

  @override
  void dispose() {
    _fadeCtrl.dispose();
    super.dispose();
  }

  void _nextStep() {
    _fadeCtrl.reverse().then((_) {
      if (mounted) {
        setState(() => _step++);
        _fadeCtrl.forward();
      }
    });
  }

  void _prevStep() {
    if (_step <= 1) { Navigator.of(context).pop(); return; }
    _fadeCtrl.reverse().then((_) {
      if (mounted) {
        setState(() => _step--);
        _fadeCtrl.forward();
      }
    });
  }

  void _selectAnswer(int questionIndex, int value) {
    final qId = _questions[questionIndex].id;
    setState(() => _answers[qId] = value);
    HapticFeedback.selectionClick();
    Future.delayed(const Duration(milliseconds: 250), () {
      if (!mounted) return;
      if (questionIndex < _questions.length - 1) {
        _nextStep();
      } else {
        _submit();
      }
    });
  }

  // Promedia los 2 ítems de cada dimensión → entero 1-4 para el modelo
  int _dimAvg(String a, String b) =>
      ((_answers[a] ?? 2) + (_answers[b] ?? 2) + 1) ~/ 2;

  Future<void> _submit() async {
    setState(() { _loading = true; _error = null; });
    try {
      final result = await _service.assess(
        q1: _dimAvg('q1a', 'q1b'),
        q2: _dimAvg('q2a', 'q2b'),
        q3: _dimAvg('q3a', 'q3b'),
        q4: _dimAvg('q4a', 'q4b'),
        topN: 3,
        regionFilter: 'Veracruz',
      );
      setState(() { _result = result; _loading = false; });
      _nextStep();
    } catch (e) {
      setState(() {
        _error = 'No se pudo obtener tu recomendación. Inténtalo de nuevo.';
        _loading = false;
      });
    }
  }

  Future<void> _sendFeedback(int rating) async {
    if (_feedbackSent || _result?.sessionId == null) return;
    setState(() => _fitRating = rating);
    try {
      await _service.submitSatisfaction(
        sessionId: _result!.sessionId!,
        fitRating: rating,
      );
      setState(() => _feedbackSent = true);
    } catch (_) {}
  }

  // ── Build ──────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      backgroundColor: scheme.surface,
      appBar: AppBar(
        backgroundColor: scheme.surface,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 18),
          onPressed: _step == 9 ? () => Navigator.of(context).pop() : _prevStep,
        ),
        title: Text(
          _step == 0
              ? 'SMARTUR'
              : _step <= 8
                  ? 'Cuéntanos cómo te sientes'
                  : 'SMARTUR · Tu recomendación',
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
        ),
        centerTitle: true,
      ),
      body: FadeTransition(
        opacity: _fadeAnim,
        child: _buildCurrentStep(scheme),
      ),
    );
  }

  Widget _buildCurrentStep(ColorScheme scheme) {
    if (_loading) return _buildLoading(scheme);
    if (_step == 0) return _buildDisclaimer(scheme);
    if (_step >= 1 && _step <= 8) return _buildQuestion(scheme, _step - 1);
    if (_step == 9 && _result != null) return _buildResult(scheme);
    if (_error != null) return _buildError(scheme);
    return const SizedBox();
  }

  // ── Step 0: Disclaimer + Consent ──────────────────────────────────────────

  Widget _buildDisclaimer(ColorScheme scheme) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          const SizedBox(height: 16),
          Container(
            width: 72, height: 72,
            decoration: BoxDecoration(
              color: const Color(0xFF10B981).withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.eco_outlined, size: 36, color: Color(0xFF10B981)),
          ),
          const SizedBox(height: 24),
          const Text('SMARTUR',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800,
                  letterSpacing: 1.5, color: Color(0xFF254117))),
          const SizedBox(height: 8),
          Text(
            '¿Quieres que adaptemos tu viaje\na cómo te sientes?',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800,
                height: 1.3, color: scheme.onSurface),
          ),
          const SizedBox(height: 12),
          Text(
            'Responde 8 preguntas rápidas sobre tu energía y SMARTUR te recomienda lugares de bienestar personalizados.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 14, height: 1.5,
                color: scheme.onSurface.withValues(alpha: 0.6)),
          ),
          const SizedBox(height: 16),
          // Indicadores de dimensiones
          Wrap(
            spacing: 8, runSpacing: 8, alignment: WrapAlignment.center,
            children: _dimensionMeta.entries.map((e) {
              final (icon, color) = e.value;
              return Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.10),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: color.withValues(alpha: 0.3)),
                ),
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  Icon(icon, size: 12, color: color),
                  const SizedBox(width: 4),
                  Text(e.key, style: TextStyle(
                      fontFamily: 'Outfit', fontSize: 11,
                      fontWeight: FontWeight.w600, color: color)),
                ]),
              );
            }).toList(),
          ),
          const SizedBox(height: 24),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: scheme.surfaceVariant.withValues(alpha: 0.5),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: scheme.outlineVariant.withValues(alpha: 0.5)),
            ),
            child: Column(children: [
              Row(children: [
                const Icon(Icons.info_outline, size: 16, color: Color(0xFF6B7280)),
                const SizedBox(width: 8),
                Expanded(child: Text('Nota importante',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600,
                        color: scheme.onSurface.withValues(alpha: 0.7)))),
              ]),
              const SizedBox(height: 8),
              Text(
                'Esta información nos ayuda a personalizar tu experiencia de viaje. '
                'No es un diagnóstico médico ni sustituye la consulta con un profesional de salud.',
                style: TextStyle(fontSize: 12, height: 1.5,
                    color: scheme.onSurface.withValues(alpha: 0.55)),
              ),
            ]),
          ),
          const SizedBox(height: 20),
          GestureDetector(
            onTap: () => setState(() => _consentGiven = !_consentGiven),
            child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              SizedBox(width: 20, height: 20,
                child: Checkbox(
                  value: _consentGiven,
                  onChanged: (v) => setState(() => _consentGiven = v ?? false),
                  activeColor: const Color(0xFF10B981),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                )),
              const SizedBox(width: 10),
              Expanded(child: Text(
                'Acepto que SMARTUR use mis respuestas para personalizar mis recomendaciones de bienestar. '
                'Puedo borrar este historial en cualquier momento desde mi perfil.',
                style: TextStyle(fontSize: 12, height: 1.5,
                    color: scheme.onSurface.withValues(alpha: 0.65)),
              )),
            ]),
          ),
          const SizedBox(height: 32),
          SizedBox(
            width: double.infinity, height: 52,
            child: ElevatedButton(
              onPressed: _consentGiven ? _nextStep : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF10B981),
                foregroundColor: Colors.white,
                disabledBackgroundColor: const Color(0xFF10B981).withValues(alpha: 0.3),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                elevation: 0,
              ),
              child: const Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                Text('Empezar', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                SizedBox(width: 8),
                Icon(Icons.arrow_forward, size: 18),
              ]),
            ),
          ),
          const SizedBox(height: 12),
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text('Quizás después',
                style: TextStyle(fontSize: 13,
                    color: scheme.onSurface.withValues(alpha: 0.45))),
          ),
        ],
      ),
    );
  }

  // ── Steps 1-8: Questions ───────────────────────────────────────────────────

  Widget _buildQuestion(ColorScheme scheme, int questionIndex) {
    final q = _questions[questionIndex];
    final progress = (questionIndex + 1) / _questions.length;
    final (dimIcon, dimColor) = _dimensionMeta[q.dimension] ?? (Icons.eco_outlined, const Color(0xFF10B981));

    // ¿Es el segundo ítem de la dimensión? (índice par=primero, impar=segundo)
    final isSecondInDim = questionIndex.isOdd;

    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Barra de progreso
          Row(children: [
            Expanded(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: progress,
                  backgroundColor: scheme.outlineVariant.withValues(alpha: 0.3),
                  valueColor: AlwaysStoppedAnimation(dimColor),
                  minHeight: 4,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Text('${questionIndex + 1}/8',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600,
                    color: scheme.onSurface.withValues(alpha: 0.5))),
          ]),
          const SizedBox(height: 10),
          // Chip de dimensión
          Row(children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: dimColor.withValues(alpha: 0.10),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: dimColor.withValues(alpha: 0.3)),
              ),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                Icon(dimIcon, size: 11, color: dimColor),
                const SizedBox(width: 4),
                Text(q.dimension,
                    style: TextStyle(fontFamily: 'Outfit', fontSize: 11,
                        fontWeight: FontWeight.w600, color: dimColor)),
              ]),
            ),
            if (isSecondInDim) ...[
              const SizedBox(width: 6),
              Text('2a parte',
                  style: TextStyle(fontFamily: 'Outfit', fontSize: 10,
                      color: scheme.onSurfaceVariant)),
            ],
          ]),
          const SizedBox(height: 20),
          Text(q.question,
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800,
                  height: 1.3, color: scheme.onSurface)),
          const SizedBox(height: 24),
          Expanded(
            child: ListView.separated(
              physics: const NeverScrollableScrollPhysics(),
              itemCount: q.options.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, i) {
                final isSelected = _answers[q.id] == (i + 1);
                return GestureDetector(
                  onTap: () => _selectAnswer(questionIndex, i + 1),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? dimColor.withValues(alpha: 0.10)
                          : scheme.surfaceVariant.withValues(alpha: 0.4),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: isSelected ? dimColor : scheme.outlineVariant.withValues(alpha: 0.4),
                        width: isSelected ? 2 : 1,
                      ),
                    ),
                    child: Row(children: [
                      Icon(q.icons[i], size: 22,
                          color: isSelected ? dimColor : scheme.onSurface.withValues(alpha: 0.45)),
                      const SizedBox(width: 14),
                      Expanded(child: Text(q.options[i],
                          style: TextStyle(fontSize: 14,
                              fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                              color: isSelected ? dimColor : scheme.onSurface.withValues(alpha: 0.8)))),
                      if (isSelected)
                        Icon(Icons.check_circle, size: 20, color: dimColor),
                    ]),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  // ── Step 9: Result ─────────────────────────────────────────────────────────

  Widget _buildResult(ColorScheme scheme) {
    final result = _result!;
    final modoColor = _modoColors[result.modoViaje] ?? const Color(0xFF10B981);
    final modoIcon  = _modoIcons[result.modoViaje]  ?? Icons.spa_outlined;
    final modoDesc  = _modoDescriptions[result.modoViaje] ?? '';

    return SingleChildScrollView(
      child: Column(children: [
        // Modo de viaje header
        Container(
          margin: const EdgeInsets.all(16),
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft, end: Alignment.bottomRight,
              colors: [modoColor.withValues(alpha: 0.15), modoColor.withValues(alpha: 0.05)],
            ),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: modoColor.withValues(alpha: 0.3)),
          ),
          child: Column(children: [
            Container(
              width: 64, height: 64,
              decoration: BoxDecoration(color: modoColor.withValues(alpha: 0.15), shape: BoxShape.circle),
              child: Icon(modoIcon, size: 32, color: modoColor),
            ),
            const SizedBox(height: 16),
            Text('Tu modo de viaje',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500,
                    color: scheme.onSurface.withValues(alpha: 0.5))),
            const SizedBox(height: 4),
            Text(result.modoViajeLabel,
                style: TextStyle(fontSize: 26, fontWeight: FontWeight.w900, color: modoColor)),
            const SizedBox(height: 10),
            Text(modoDesc.isNotEmpty ? modoDesc : result.modoViajeDescription,
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 14, height: 1.5,
                    color: scheme.onSurface.withValues(alpha: 0.7))),
          ]),
        ),

        if (result.destinations.isNotEmpty) ...[
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Text('Lugares recomendados para ti',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700,
                      color: scheme.onSurface)),
            ),
          ),
          ...result.destinations.map((d) =>
              WellnessPoiCard(destination: d, modoViaje: result.modoViaje)),
        ],

        // Feedback
        if (result.sessionId != null)
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: scheme.surfaceVariant.withValues(alpha: 0.4),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(children: [
                if (_feedbackSent)
                  Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                    Icon(Icons.check_circle_outline, size: 16, color: modoColor),
                    const SizedBox(width: 6),
                    Text('¡Gracias por tu valoración!',
                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: modoColor)),
                  ])
                else
                  Text('¿Estas recomendaciones se sienten adecuadas para ti?',
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500,
                          color: scheme.onSurface.withValues(alpha: 0.7)),
                      textAlign: TextAlign.center),
                if (!_feedbackSent) ...[
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(5, (i) {
                      final rating = i + 1;
                      const icons = [
                        Icons.sentiment_very_dissatisfied_outlined,
                        Icons.sentiment_dissatisfied_outlined,
                        Icons.sentiment_neutral_outlined,
                        Icons.sentiment_satisfied_outlined,
                        Icons.sentiment_very_satisfied_outlined,
                      ];
                      final selected = _fitRating == rating;
                      return GestureDetector(
                        onTap: () => _sendFeedback(rating),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          margin: const EdgeInsets.symmetric(horizontal: 4),
                          width: 44, height: 44,
                          decoration: BoxDecoration(
                            color: selected ? modoColor.withValues(alpha: 0.15) : Colors.transparent,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: selected ? modoColor : scheme.outlineVariant.withValues(alpha: 0.4),
                              width: selected ? 2 : 1,
                            ),
                          ),
                          child: Icon(icons[i], size: 22,
                              color: selected ? modoColor : scheme.onSurface.withValues(alpha: 0.45)),
                        ),
                      );
                    }),
                  ),
                ],
              ]),
            ),
          ),

        // Botones de acción
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
          child: Row(children: [
            Expanded(
              child: OutlinedButton(
                onPressed: () => setState(() {
                  _step = 0;
                  _answers.clear();
                  _result = null;
                  _fitRating = null;
                  _feedbackSent = false;
                }),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                child: const Text('Actualizar mi estado'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: ElevatedButton(
                onPressed: () => Navigator.of(context).pop(),
                style: ElevatedButton.styleFrom(
                  backgroundColor: modoColor, foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  elevation: 0,
                ),
                child: const Text('Explorar', style: TextStyle(fontWeight: FontWeight.w700)),
              ),
            ),
          ]),
        ),
      ]),
    );
  }

  // ── Loading / Error ────────────────────────────────────────────────────────

  Widget _buildLoading(ColorScheme scheme) {
    return Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
      const SizedBox(width: 48, height: 48,
          child: CircularProgressIndicator(strokeWidth: 3,
              valueColor: AlwaysStoppedAnimation(Color(0xFF10B981)))),
      const SizedBox(height: 16),
      Text('Encontrando tus lugares ideales…',
          style: TextStyle(fontSize: 14, color: scheme.onSurface.withValues(alpha: 0.55))),
    ]));
  }

  Widget _buildError(ColorScheme scheme) {
    return Center(child: Padding(
      padding: const EdgeInsets.all(24),
      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        Icon(Icons.error_outline, size: 48, color: scheme.error),
        const SizedBox(height: 16),
        Text(_error ?? 'Error desconocido', textAlign: TextAlign.center,
            style: TextStyle(color: scheme.onSurface.withValues(alpha: 0.7))),
        const SizedBox(height: 24),
        ElevatedButton(onPressed: _submit, child: const Text('Reintentar')),
      ]),
    ));
  }
}
