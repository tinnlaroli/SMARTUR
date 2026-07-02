import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';

import '../../../core/theme/smartur_theme_extensions.dart';
import '../../../core/theme/style_guide.dart';
import '../../../data/models/place_model.dart';
import '../../../data/services/ai_route_service.dart';
import '../../../data/services/explore_service.dart';
import '../../../data/services/profile_service.dart';
import '../preferences/preferences_screen.dart';

// ─────────────────────────────────────────────────────────────────────────────
// Public entry point
// ─────────────────────────────────────────────────────────────────────────────

Future<AiRouteResult?> showAiRouteConfigSheet(BuildContext context) async {
  final hasPref = await ProfileService.hasPreferencesSaved();
  if (!context.mounted) return null;

  if (!hasPref) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text(
          'Primero cuéntanos tus preferencias para generar tu ruta ideal.',
          style: TextStyle(fontFamily: 'Outfit'),
        ),
        backgroundColor: SmarturStyle.purple,
        duration: const Duration(seconds: 3),
        action: SnackBarAction(
          label: 'Ir',
          textColor: Colors.white,
          onPressed: () => Navigator.of(context)
              .push(MaterialPageRoute(builder: (_) => const PreferencesScreen())),
        ),
      ),
    );
    return null;
  }

  return showModalBottomSheet<AiRouteResult>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    useSafeArea: true,
    // No descartable por tap/arrastre: la generación tarda varios segundos y
    // crea el itinerario en el servidor. Si el sheet se cerrara solo, se
    // perdería el resultado y la ruta quedaría creada pero sin refrescarse
    // en "Mis Rutas". El cierre se hace solo con la X (deshabilitada mientras carga).
    isDismissible: false,
    enableDrag: false,
    builder: (_) => const _AiRouteConfigSheet(),
  );
}

// ─────────────────────────────────────────────────────────────────────────────

class _AiRouteConfigSheet extends StatefulWidget {
  const _AiRouteConfigSheet();

  @override
  State<_AiRouteConfigSheet> createState() => _AiRouteConfigSheetState();
}

class _AiRouteConfigSheetState extends State<_AiRouteConfigSheet> {
  // ── Trip details ──
  DateTime? _startDate;
  int _nDays = 1;
  int _nPersonas = 2;
  String _groupType = 'familia';
  String? _selectedCity;
  CityData? _selectedCityData;
  List<CityData> _cities = [];

  // ── Preferences ──
  final Set<String> _tourTypes = {};
  String _budget = 'medio';
  int _stopsPerDay = 3;

  // ── Loading ──
  bool _loading = false;
  int _stepIndex = 0;
  String? _error;

  static const _steps = [
    'Analizando tus preferencias...',
    'Consultando el motor de IA...',
    'Creando tu itinerario...',
    'Optimizando el recorrido con IA...',
  ];

  static const _groups = [
    ('solo',    Icons.person_outline,           'Solo'),
    ('pareja',  Icons.favorite_border_rounded,  'Pareja'),
    ('familia', Icons.family_restroom_outlined,  'Familia'),
    ('amigos',  Icons.people_outline,            'Amigos'),
  ];

  static const _types = [
    ('cultural',     Icons.museum_outlined,           'Cultural'),
    ('naturaleza',   Icons.forest_outlined,           'Naturaleza'),
    ('gastronomico', Icons.restaurant_menu_outlined,  'Gastronómico'),
    ('aventura',     Icons.hiking_outlined,           'Aventura'),
    ('descanso',     Icons.self_improvement_outlined, 'Bienestar'),
    ('nocturno',     Icons.nightlife_outlined,        'Nocturno'),
  ];

  static const _budgets = [
    ('bajo',  Icons.savings_outlined,                'Económico'),
    ('medio', Icons.account_balance_wallet_outlined, 'Moderado'),
    ('alto',  Icons.diamond_outlined,                'Premium'),
  ];

  @override
  void initState() {
    super.initState();
    _startDate = DateTime.now().add(const Duration(days: 1));
    _inferGroupFromDays();
    _loadCities();
  }

  Future<void> _loadCities() async {
    try {
      final cities = await ExploreService().fetchCities();
      if (mounted) setState(() => _cities = cities);
    } catch (_) {}
  }

  void _inferGroupFromDays() {
    if (_nPersonas == 1) {
      _groupType = 'solo';
    } else if (_nPersonas == 2) {
      _groupType = 'pareja';
    } else {
      _groupType = 'familia';
    }
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _startDate ?? DateTime.now().add(const Duration(days: 1)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      locale: const Locale('es', 'MX'),
      builder: (ctx, child) => Theme(
        data: Theme.of(ctx).copyWith(
          colorScheme: Theme.of(ctx).colorScheme.copyWith(
                primary: SmarturStyle.purple,
              ),
        ),
        child: child!,
      ),
    );
    if (picked != null && mounted) setState(() => _startDate = picked);
  }

  Future<void> _generate() async {
    if (_tourTypes.isEmpty) {
      setState(() => _error = 'Selecciona al menos un tipo de turismo.');
      return;
    }

    HapticFeedback.mediumImpact();
    setState(() {
      _loading = true;
      _error = null;
      _stepIndex = 0;
    });

    try {
      final result = await AiRouteService().generateRoute(
        config: AiRouteConfig(
          startDate: _startDate,
          nDays: _nDays,
          nPersonas: _nPersonas,
          groupType: _groupType,
          tourTypes: _tourTypes.toList(),
          budget: _budget,
          stopsPerDay: _stopsPerDay,
          city: _selectedCity,
          cityData: _selectedCityData,
        ),
        onProgress: (step) {
          final idx = _steps.indexWhere((s) => s == step);
          if (idx >= 0 && mounted) setState(() => _stepIndex = idx);
        },
      );

      if (!mounted) return;
      Navigator.of(context).pop(result);
    } on AiRouteException catch (e) {
      if (mounted) setState(() { _loading = false; _error = e.message; });
    } catch (_) {
      if (mounted) {
        setState(() {
          _loading = false;
          _error = 'Ocurrió un error inesperado. Intenta de nuevo.';
        });
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Build
  // ─────────────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    // Bloquea el botón atrás mientras se genera (evita cerrar y perder el resultado)
    return PopScope(
      canPop: !_loading,
      child: DraggableScrollableSheet(
        initialChildSize: 0.93,
        minChildSize: 0.5,
        maxChildSize: 0.97,
        builder: (_, controller) => Container(
          decoration: BoxDecoration(
            color: scheme.surface,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
          ),
          child: Column(
            children: [
              _handle(scheme),
              Expanded(
                child: _loading
                    ? _buildLoading(scheme)
                    : _buildForm(scheme, controller),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _handle(ColorScheme scheme) => Padding(
        padding: const EdgeInsets.fromLTRB(16, 12, 8, 4),
        child: Row(
          children: [
            const SizedBox(width: 32), // balancea la X para centrar el grip
            Expanded(
              child: Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
            ),
            // Cierre manual — oculto mientras genera para no perder el resultado
            SizedBox(
              width: 32,
              child: _loading
                  ? const SizedBox.shrink()
                  : IconButton(
                      icon: Icon(Icons.close_rounded,
                          size: 22, color: scheme.onSurfaceVariant),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                      onPressed: () => Navigator.of(context).pop(),
                    ),
            ),
          ],
        ),
      );

  // ─────────────────────────────────────────────────────────────────────────
  // Form UI
  // ─────────────────────────────────────────────────────────────────────────

  Widget _buildForm(ColorScheme scheme, ScrollController controller) {
    final sem = SmarturSemanticColors.of(context);
    final dateLabel = _startDate != null
        ? DateFormat('d MMM yyyy', 'es').format(_startDate!)
        : 'Elige la fecha';

    return ListView(
      controller: controller,
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
      children: [
        // ── Header ──
        Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [SmarturStyle.purple, sem.sea],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Icon(Icons.auto_awesome_rounded,
                  color: Colors.white, size: 22),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Generar ruta con IA',
                      style:
                          SmarturStyle.calSansTitle.copyWith(fontSize: 19)),
                  Text(
                    'El motor de IA diseña y optimiza tu recorrido',
                    style: TextStyle(
                      fontFamily: 'Outfit',
                      fontSize: 12,
                      color: scheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),

        const SizedBox(height: 28),

        // ─────────────────────── SECCIÓN 1: Cuándo ───────────────────────
        _sectionLabel(scheme, Icons.calendar_today_outlined, '¿Cuándo es tu viaje?'),
        const SizedBox(height: 12),

        // Date picker
        GestureDetector(
          onTap: _pickDate,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: scheme.surfaceContainerHighest.withValues(alpha: 0.5),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: _startDate != null
                    ? scheme.primary.withValues(alpha: 0.5)
                    : scheme.outlineVariant.withValues(alpha: 0.4),
              ),
            ),
            child: Row(
              children: [
                Icon(Icons.event_rounded,
                    size: 20,
                    color: _startDate != null
                        ? scheme.primary
                        : scheme.onSurfaceVariant),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    dateLabel,
                    style: TextStyle(
                      fontFamily: 'Outfit',
                      fontSize: 14,
                      fontWeight: _startDate != null
                          ? FontWeight.w600
                          : FontWeight.w400,
                      color: _startDate != null
                          ? scheme.onSurface
                          : scheme.onSurfaceVariant,
                    ),
                  ),
                ),
                Icon(Icons.chevron_right_rounded,
                    size: 18, color: scheme.onSurfaceVariant),
              ],
            ),
          ),
        ),

        const SizedBox(height: 16),

        // Duration
        _rowLabel(scheme, 'Duración', _nDays == 1 ? '1 día' : '$_nDays días',
            scheme.primary),
        Slider(
          value: _nDays.toDouble(),
          min: 1,
          max: 7,
          divisions: 6,
          activeColor: scheme.primary,
          inactiveColor: scheme.primary.withValues(alpha: 0.15),
          onChanged: (v) => setState(() => _nDays = v.round()),
        ),

        const SizedBox(height: 24),

        // ─────────────────────── SECCIÓN: Ciudad ─────────────────────────
        if (_cities.isNotEmpty) ...[
          _sectionLabel(scheme, Icons.location_city_outlined, 'Ciudad'),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              // "Cualquier ciudad" chip
              GestureDetector(
                onTap: () => setState(() { _selectedCity = null; _selectedCityData = null; }),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 150),
                  padding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    color: _selectedCity == null
                        ? scheme.primary.withValues(alpha: 0.12)
                        : scheme.surfaceContainerHighest.withValues(alpha: 0.5),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: _selectedCity == null
                          ? scheme.primary
                          : scheme.outlineVariant.withValues(alpha: 0.4),
                      width: _selectedCity == null ? 1.5 : 1,
                    ),
                  ),
                  child: Text(
                    'Cualquiera',
                    style: TextStyle(
                      fontFamily: 'Outfit',
                      fontSize: 13,
                      fontWeight: _selectedCity == null
                          ? FontWeight.w600
                          : FontWeight.w400,
                      color: _selectedCity == null
                          ? scheme.primary
                          : scheme.onSurfaceVariant,
                    ),
                  ),
                ),
              ),
              ..._cities.map((c) {
                final sel = _selectedCity == c.name;
                return GestureDetector(
                  onTap: () => setState(() { _selectedCity = c.name; _selectedCityData = c; }),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 150),
                    padding:
                        const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: sel
                          ? scheme.primary.withValues(alpha: 0.12)
                          : scheme.surfaceContainerHighest.withValues(alpha: 0.5),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: sel
                            ? scheme.primary
                            : scheme.outlineVariant.withValues(alpha: 0.4),
                        width: sel ? 1.5 : 1,
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(c.chipIcon,
                            size: 14,
                            color: sel
                                ? scheme.primary
                                : scheme.onSurfaceVariant),
                        const SizedBox(width: 6),
                        Text(
                          c.name,
                          style: TextStyle(
                            fontFamily: 'Outfit',
                            fontSize: 13,
                            fontWeight:
                                sel ? FontWeight.w600 : FontWeight.w400,
                            color: sel
                                ? scheme.primary
                                : scheme.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }),
            ],
          ),
          const SizedBox(height: 24),
        ],

        // ─────────────────────── SECCIÓN 2: Quién ────────────────────────
        _sectionLabel(scheme, Icons.people_outline, '¿Con quién viajas?'),
        const SizedBox(height: 12),

        // Number of people
        Row(
          children: [
            Expanded(
              child: Text(
                'Personas',
                style: TextStyle(
                  fontFamily: 'Outfit',
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                  color: scheme.onSurface,
                ),
              ),
            ),
            _PeopleStepper(
              value: _nPersonas,
              onChanged: (v) => setState(() {
                _nPersonas = v;
                _inferGroupFromDays();
              }),
            ),
          ],
        ),

        const SizedBox(height: 14),

        // Group type
        Wrap(
          spacing: 8,
          children: _groups.map((g) {
            final sel = _groupType == g.$1;
            return GestureDetector(
              onTap: () => setState(() {
                _groupType = g.$1;
                _nPersonas = switch (g.$1) {
                  'solo'   => 1,
                  'pareja' => 2,
                  'amigos' => 3,
                  _        => 4, // familia
                };
              }),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 150),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: sel
                      ? scheme.primary.withValues(alpha: 0.12)
                      : scheme.surfaceContainerHighest.withValues(alpha: 0.5),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: sel
                        ? scheme.primary
                        : scheme.outlineVariant.withValues(alpha: 0.4),
                    width: sel ? 1.5 : 1,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(g.$2,
                        size: 16,
                        color:
                            sel ? scheme.primary : scheme.onSurfaceVariant),
                    const SizedBox(width: 6),
                    Text(
                      g.$3,
                      style: TextStyle(
                        fontFamily: 'Outfit',
                        fontSize: 13,
                        fontWeight:
                            sel ? FontWeight.w600 : FontWeight.w400,
                        color:
                            sel ? scheme.primary : scheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }).toList(),
        ),

        const SizedBox(height: 24),

        // ─────────────────────── SECCIÓN 3: Intereses ────────────────────
        _sectionLabel(scheme, Icons.explore_outlined, '¿Qué tipo de turismo?'),
        const SizedBox(height: 4),
        Text(
          'Elige uno o varios',
          style: TextStyle(
            fontFamily: 'Outfit',
            fontSize: 12,
            color: scheme.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: 12),

        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _types.map((t) {
            final sel = _tourTypes.contains(t.$1);
            return GestureDetector(
              onTap: () => setState(() {
                if (sel) {
                  _tourTypes.remove(t.$1);
                } else {
                  _tourTypes.add(t.$1);
                }
              }),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 150),
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                decoration: BoxDecoration(
                  color: sel
                      ? SmarturStyle.purple.withValues(alpha: 0.12)
                      : scheme.surfaceContainerHighest.withValues(alpha: 0.5),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: sel
                        ? SmarturStyle.purple
                        : scheme.outlineVariant.withValues(alpha: 0.4),
                    width: sel ? 1.5 : 1,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(t.$2,
                        size: 18,
                        color: sel
                            ? SmarturStyle.purple
                            : scheme.onSurfaceVariant),
                    const SizedBox(width: 8),
                    Text(
                      t.$3,
                      style: TextStyle(
                        fontFamily: 'Outfit',
                        fontSize: 13,
                        fontWeight:
                            sel ? FontWeight.w600 : FontWeight.w400,
                        color: sel
                            ? SmarturStyle.purple
                            : scheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }).toList(),
        ),

        const SizedBox(height: 24),

        // ─────────────────────── SECCIÓN 4: Presupuesto ──────────────────
        _sectionLabel(scheme, Icons.account_balance_wallet_outlined, 'Presupuesto'),
        const SizedBox(height: 12),

        Row(
          children: _budgets.map((b) {
            final sel = _budget == b.$1;
            return Expanded(
              child: GestureDetector(
                onTap: () => setState(() => _budget = b.$1),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 150),
                  margin: const EdgeInsets.only(right: 8),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  decoration: BoxDecoration(
                    color: sel
                        ? scheme.primary.withValues(alpha: 0.12)
                        : scheme.surfaceContainerHighest.withValues(alpha: 0.5),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: sel
                          ? scheme.primary
                          : scheme.outlineVariant.withValues(alpha: 0.4),
                      width: sel ? 1.5 : 1,
                    ),
                  ),
                  child: Column(
                    children: [
                      Icon(b.$2,
                          size: 20,
                          color: sel
                              ? scheme.primary
                              : scheme.onSurfaceVariant),
                      const SizedBox(height: 4),
                      Text(
                        b.$3,
                        style: TextStyle(
                          fontFamily: 'Outfit',
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: sel
                              ? scheme.primary
                              : scheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }).toList(),
        ),

        const SizedBox(height: 20),

        // Stops per day
        _rowLabel(scheme, 'Paradas por día', '$_stopsPerDay lugares/día',
            scheme.onSurfaceVariant),
        Slider(
          value: _stopsPerDay.toDouble(),
          min: 2,
          max: 5,
          divisions: 3,
          activeColor: scheme.primary,
          inactiveColor: scheme.primary.withValues(alpha: 0.15),
          onChanged: (v) => setState(() => _stopsPerDay = v.round()),
        ),
        Padding(
          padding: const EdgeInsets.only(bottom: 4),
          child: Text(
            'Total: ${_nDays * _stopsPerDay} lugares en $_nDays ${_nDays == 1 ? 'día' : 'días'}',
            style: TextStyle(
              fontFamily: 'Outfit',
              fontSize: 12,
              color: scheme.primary,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),

        // Error
        if (_error != null) ...[
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.red.shade50,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.red.shade200),
            ),
            child: Row(
              children: [
                Icon(Icons.error_outline_rounded,
                    color: Colors.red.shade600, size: 18),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    _error!,
                    style: TextStyle(
                      fontFamily: 'Outfit',
                      fontSize: 13,
                      color: Colors.red.shade700,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],

        const SizedBox(height: 28),

        // Generate button
        SizedBox(
          width: double.infinity,
          height: 54,
          child: FilledButton.icon(
            onPressed: _generate,
            style: FilledButton.styleFrom(
              backgroundColor: scheme.primary,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16)),
              elevation: 0,
            ),
            icon: const Icon(Icons.auto_awesome_rounded,
                color: Colors.white, size: 18),
            label: Text(
              'Generar mi ruta — ${_nDays * _stopsPerDay} lugares',
              style: const TextStyle(
                fontFamily: 'Outfit',
                fontWeight: FontWeight.w700,
                fontSize: 15,
                color: Colors.white,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _sectionLabel(ColorScheme scheme, IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, size: 16, color: scheme.primary),
        const SizedBox(width: 8),
        Text(
          text,
          style: TextStyle(
            fontFamily: 'Outfit',
            fontWeight: FontWeight.w700,
            fontSize: 14,
            color: scheme.onSurface,
          ),
        ),
      ],
    );
  }

  Widget _rowLabel(
      ColorScheme scheme, String label, String value, Color valueColor) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label,
            style: TextStyle(
              fontFamily: 'Outfit',
              fontWeight: FontWeight.w600,
              fontSize: 14,
              color: scheme.onSurface,
            )),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          decoration: BoxDecoration(
            color: valueColor.withValues(alpha: 0.10),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(value,
              style: TextStyle(
                fontFamily: 'Outfit',
                fontWeight: FontWeight.w700,
                fontSize: 13,
                color: valueColor,
              )),
        ),
      ],
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Loading UI
  // ─────────────────────────────────────────────────────────────────────────

  Widget _buildLoading(ColorScheme scheme) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 48),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Steps
          ...List.generate(_steps.length, (i) {
            final done = i < _stepIndex;
            final active = i == _stepIndex;
            return AnimatedOpacity(
              duration: const Duration(milliseconds: 300),
              opacity: done || active ? 1.0 : 0.3,
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: Row(
                  children: [
                    SizedBox(
                      width: 24,
                      height: 24,
                      child: AnimatedSwitcher(
                        duration: const Duration(milliseconds: 250),
                        child: done
                            ? Icon(Icons.check_circle_rounded,
                                key: const ValueKey('done'),
                                color: scheme.primary,
                                size: 22)
                            : active
                                ? CircularProgressIndicator(
                                    key: const ValueKey('spin'),
                                    strokeWidth: 2.5,
                                    color: scheme.primary,
                                  )
                                : Icon(
                                    Icons.radio_button_unchecked_rounded,
                                    key: const ValueKey('idle'),
                                    color:
                                        scheme.outlineVariant,
                                    size: 22),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Text(
                      _steps[i],
                      style: TextStyle(
                        fontFamily: 'Outfit',
                        fontSize: 14,
                        fontWeight:
                            active ? FontWeight.w600 : FontWeight.w400,
                        color: active
                            ? scheme.onSurface
                            : done
                                ? scheme.primary
                                : scheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// People stepper widget
// ─────────────────────────────────────────────────────────────────────────────

class _PeopleStepper extends StatelessWidget {
  final int value;
  final ValueChanged<int> onChanged;

  const _PeopleStepper({required this.value, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        _btn(
          context,
          Icons.remove_rounded,
          scheme,
          enabled: value > 1,
          onTap: () {
            HapticFeedback.selectionClick();
            onChanged(value - 1);
          },
        ),
        AnimatedSwitcher(
          duration: const Duration(milliseconds: 150),
          child: SizedBox(
            key: ValueKey(value),
            width: 40,
            child: Text(
              '$value',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontFamily: 'Outfit',
                fontWeight: FontWeight.w700,
                fontSize: 18,
                color: scheme.onSurface,
              ),
            ),
          ),
        ),
        _btn(
          context,
          Icons.add_rounded,
          scheme,
          enabled: value < 20,
          onTap: () {
            HapticFeedback.selectionClick();
            onChanged(value + 1);
          },
        ),
      ],
    );
  }

  Widget _btn(BuildContext context, IconData icon, ColorScheme scheme,
      {required bool enabled, required VoidCallback onTap}) {
    return GestureDetector(
      onTap: enabled ? onTap : null,
      child: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          color: enabled
              ? scheme.primary.withValues(alpha: 0.10)
              : scheme.surfaceContainerHighest.withValues(alpha: 0.5),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(
          icon,
          size: 20,
          color: enabled ? scheme.primary : scheme.onSurfaceVariant.withValues(alpha: 0.4),
        ),
      ),
    );
  }
}
