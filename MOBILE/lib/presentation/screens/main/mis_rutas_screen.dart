import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';
import 'package:smartur/l10n/app_localizations.dart';

import '../../../core/theme/smartur_theme_extensions.dart';
import '../../../core/theme/style_guide.dart';
import '../../../core/utils/notifications.dart';
import '../../../data/local/itinerary_db.dart';
import '../../../data/models/itinerary_model.dart';
import '../../../data/services/auth_service.dart';
import '../../../data/services/itinerary_service.dart';
import '../../widgets/smartur_app_bar.dart';
import '../../widgets/smartur_background.dart';
import '../../widgets/smartur_ui_kit.dart';
import '../itinerary/ai_route_config_sheet.dart';
import '../itinerary/itinerary_detail_screen.dart';
import '../itinerary/planner_screen.dart';
import 'main_screen.dart' show routeStopCount;

class MisRutasScreen extends StatefulWidget {
  const MisRutasScreen({super.key});

  @override
  State<MisRutasScreen> createState() => _MisRutasScreenState();
}

class _MisRutasScreenState extends State<MisRutasScreen> {
  List<Itinerary> _itineraries = [];
  bool _loading = true;
  String? _error;
  bool _fabExpanded = false;

  // ── Selección múltiple (long-press) ──
  bool _selectionMode = false;
  final Set<int> _selectedIds = {};
  bool _deleting = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final list = await ItineraryService().fetchMyItineraries();
      if (mounted) {
        setState(() {
          _itineraries = list;
          _loading = false;
        });
        // Entrar a "Mis rutas" cuenta como haber visto las paradas nuevas —
        // antes se reasignaba al mismo conteo (list.first.stops.length), así
        // que el badge del bottom bar nunca bajaba a 0 aunque ya se hubieran
        // visto. Vuelve a subir solo cuando se agrega una parada nueva.
        routeStopCount.value = 0;
        await ItineraryDB.saveItineraries(list);
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _loading = false;
        });
        // Offline fallback
        try {
          final userId = await AuthService().getUserId();
          if (userId != null) {
            final cached = await ItineraryDB.getMyItineraries(userId);
            if (cached.isNotEmpty && mounted) {
              setState(() {
                _itineraries = cached;
                _error = null;
              });
            }
          }
        } catch (_) {}
      }
    }
  }

  Future<void> _createItinerary() async {
    final l10n = AppLocalizations.of(context)!;
    final ctrl = TextEditingController();
    final name = await showDialog<String>(
      context: context,
      builder: (ctx) {
        final scheme = Theme.of(ctx).colorScheme;
        return AlertDialog(
        title: Text(l10n.plannerRouteName,
            style: SmarturStyle.calSansTitle.copyWith(fontSize: 18)),
        content: TextField(
          controller: ctrl,
          autofocus: true,
          textCapitalization: TextCapitalization.sentences,
          decoration: InputDecoration(hintText: l10n.plannerRouteNameHint),
          style: const TextStyle(fontFamily: 'Outfit'),
          onSubmitted: (v) {
            if (v.trim().isNotEmpty) Navigator.pop(ctx, v.trim());
          },
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(l10n.cancel,
                style: const TextStyle(fontFamily: 'Outfit')),
          ),
          FilledButton(
            onPressed: () {
              if (ctrl.text.trim().isNotEmpty) {
                Navigator.pop(ctx, ctrl.text.trim());
              }
            },
            style: FilledButton.styleFrom(backgroundColor: scheme.primary),
            child: Text(l10n.misRutasCreate,
                style: const TextStyle(
                    fontFamily: 'Outfit', fontWeight: FontWeight.w700)),
          ),
        ],
        );
      },
    );
    if (name == null || name.isEmpty || !mounted) return;
    try {
      final it = await ItineraryService().createItinerary(title: name);
      await ItineraryDB.saveItinerary(it);
      if (mounted) {
        await Navigator.push(
          context,
          smarturFadeRoute(PlannerScreen(itinerary: it)),
        );
        _load();
      }
    } catch (e) {
      if (mounted) {
        SmarturNotifications.showError(context, e.toString());
      }
    }
  }

  Future<void> _generateAiRoute() async {
    setState(() => _fabExpanded = false);
    final result = await showAiRouteConfigSheet(context);
    if (!mounted) return;

    if (result != null) {
      // Persistir de inmediato en la BD local y mostrar en la lista antes
      // de refrescar contra el servidor (aparece al instante como el resto).
      // Un fallo de caché local no debe bloquear el flujo (la ruta ya está
      // en el servidor y el _load() final la traerá igual).
      try {
        await ItineraryDB.saveItinerary(result.itinerary);
      } catch (_) {}
      if (!mounted) return;
      setState(() {
        _itineraries.removeWhere((it) => it.id == result.itinerary.id);
        _itineraries.insert(0, result.itinerary);
      });
      await Navigator.of(context).push(
        smarturDetailRoute(
          ItineraryDetailScreen(itinerary: result.itinerary, isOwner: true),
        ),
      );
    }
    // Refrescar siempre: si la generación creó la ruta en el servidor pero el
    // resultado no llegó (error tardío), el refetch la traerá igualmente.
    if (mounted) _load();
  }

  // ── Selección múltiple ─────────────────────────────────────────────────────

  void _enterSelection(int id) {
    setState(() {
      _selectionMode = true;
      _fabExpanded = false;
      _selectedIds
        ..clear()
        ..add(id);
    });
  }

  void _toggleSelection(int id) {
    setState(() {
      if (_selectedIds.contains(id)) {
        _selectedIds.remove(id);
        if (_selectedIds.isEmpty) _selectionMode = false;
      } else {
        _selectedIds.add(id);
      }
    });
  }

  void _exitSelection() {
    setState(() {
      _selectionMode = false;
      _selectedIds.clear();
    });
  }

  void _selectAll() {
    setState(() {
      if (_selectedIds.length == _itineraries.length) {
        _selectedIds.clear();
        _selectionMode = false;
      } else {
        _selectedIds
          ..clear()
          ..addAll(_itineraries.map((it) => it.id));
      }
    });
  }

  Future<void> _deleteSelected() async {
    final l10n = AppLocalizations.of(context)!;
    final count = _selectedIds.length;
    if (count == 0) return;

    final scheme = Theme.of(context).colorScheme;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text(
          count == 1 ? '¿Eliminar la ruta?' : '¿Eliminar $count rutas?',
          style: SmarturStyle.calSansTitle.copyWith(fontSize: 18),
        ),
        content: Text(
          count == 1
              ? 'Esta acción no se puede deshacer.'
              : 'Se eliminarán $count rutas de forma permanente. Esta acción no se puede deshacer.',
          style: const TextStyle(fontFamily: 'Outfit'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(l10n.cancel,
                style: TextStyle(
                    fontFamily: 'Outfit', color: scheme.onSurfaceVariant)),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: FilledButton.styleFrom(backgroundColor: scheme.error),
            child: const Text('Eliminar',
                style: TextStyle(
                    fontFamily: 'Outfit',
                    fontWeight: FontWeight.w700,
                    color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirmed != true || !mounted) return;

    setState(() => _deleting = true);
    final ids = _selectedIds.toList();
    final svc = ItineraryService();
    var failed = 0;
    for (final id in ids) {
      try {
        await svc.deleteItinerary(id);
        await ItineraryDB.deleteItinerary(id);
      } catch (_) {
        failed++;
      }
    }

    if (!mounted) return;
    setState(() {
      _itineraries.removeWhere((it) => ids.contains(it.id) );
      _selectedIds.clear();
      _selectionMode = false;
      _deleting = false;
    });

    if (failed == 0) {
      SmarturNotifications.showSuccess(
          context, count == 1 ? 'Ruta eliminada' : '$count rutas eliminadas');
    } else {
      SmarturNotifications.showError(
          context, 'No se pudieron eliminar $failed ruta(s).');
    }
    _load();
  }

  Future<void> _setPublicSelected(bool makePublic) async {
    final ids = _selectedIds.toList();
    if (ids.isEmpty) return;

    setState(() => _deleting = true); // reutiliza el estado "procesando"
    final svc = ItineraryService();
    var failed = 0;
    var changed = 0;
    for (final id in ids) {
      final idx = _itineraries.indexWhere((it) => it.id == id);
      if (idx < 0) continue;
      if (_itineraries[idx].isPublic == makePublic) continue; // ya está así
      try {
        final updated =
            await svc.updateItinerary(id, isPublic: makePublic);
        if (updated != null) {
          _itineraries[idx] = updated;
        } else {
          _itineraries[idx] =
              _itineraries[idx].copyWith(isPublic: makePublic);
        }
        await ItineraryDB.saveItinerary(_itineraries[idx]);
        changed++;
      } catch (_) {
        failed++;
      }
    }

    if (!mounted) return;
    setState(() {
      _deleting = false;
      _selectionMode = false;
      _selectedIds.clear();
    });

    if (failed == 0) {
      SmarturNotifications.showSuccess(
        context,
        makePublic
            ? '$changed ruta(s) ahora son públicas'
            : '$changed ruta(s) ahora son privadas',
      );
    } else {
      SmarturNotifications.showError(
          context, 'No se pudieron actualizar $failed ruta(s).');
    }
  }

  void _shareSelected() {
    final selected =
        _itineraries.where((it) => _selectedIds.contains(it.id)).toList();
    if (selected.isEmpty) return;

    final buffer = StringBuffer();
    if (selected.length == 1) {
      final it = selected.first;
      buffer.writeln(it.title);
      buffer.writeln('${it.stops.length} paradas');
    } else {
      buffer.writeln('Mis rutas en SMARTUR (${selected.length}):');
      buffer.writeln();
      for (final it in selected) {
        buffer.writeln('• ${it.title} — ${it.stops.length} paradas');
      }
    }
    buffer.writeln();
    buffer.writeln('Planea tu viaje con SMARTUR');

    SharePlus.instance.share(
      ShareParams(
        text: buffer.toString().trim(),
        subject: selected.length == 1 ? selected.first.title : 'Mis rutas SMARTUR',
      ),
    );

    _exitSelection();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final scheme = Theme.of(context).colorScheme;

    return PopScope(
      canPop: !_selectionMode,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop && _selectionMode) _exitSelection();
      },
      child: Scaffold(
        backgroundColor: scheme.surface,
        appBar: _selectionMode ? _buildSelectionAppBar(scheme) : null,
        // Padding inferior para que el FAB quede por encima del pill flotante
        // del MainScreen (que se dibuja sobre el body por extendBody).
        floatingActionButton: _selectionMode
            ? null
            : Padding(
                padding: const EdgeInsets.only(bottom: 76),
                child: _buildFab(scheme),
              ),
        body: SmarturBackground(
          child: _buildBody(l10n, scheme),
        ),
      ),
    );
  }

  PreferredSizeWidget _buildSelectionAppBar(ColorScheme scheme) {
    final count = _selectedIds.length;
    final allSelected =
        _itineraries.isNotEmpty && count == _itineraries.length;
    return AppBar(
      elevation: 0,
      backgroundColor: scheme.primary.withValues(alpha: 0.10),
      surfaceTintColor: Colors.transparent,
      leading: IconButton(
        icon: const Icon(Icons.close_rounded),
        onPressed: _deleting ? null : _exitSelection,
        tooltip: 'Cancelar',
      ),
      title: Text(
        '$count seleccionada${count == 1 ? '' : 's'}',
        style: SmarturStyle.calSansTitle.copyWith(fontSize: 18),
      ),
      actions: _deleting
          ? const [
              Padding(
                padding: EdgeInsets.symmetric(horizontal: 16),
                child: SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2)),
              )
            ]
          : [
              IconButton(
                icon: Icon(allSelected
                    ? Icons.deselect_rounded
                    : Icons.select_all_rounded),
                onPressed: _selectAll,
                tooltip: allSelected ? 'Quitar todo' : 'Seleccionar todo',
              ),
              IconButton(
                icon: const Icon(Icons.ios_share_rounded),
                onPressed: count == 0 ? null : _shareSelected,
                tooltip: 'Compartir',
              ),
              IconButton(
                icon: Icon(Icons.delete_outline_rounded, color: scheme.error),
                onPressed: count == 0 ? null : _deleteSelected,
                tooltip: 'Eliminar',
              ),
              PopupMenuButton<String>(
                icon: const Icon(Icons.more_vert_rounded),
                enabled: count > 0,
                onSelected: (v) {
                  if (v == 'public') _setPublicSelected(true);
                  if (v == 'private') _setPublicSelected(false);
                },
                itemBuilder: (_) => [
                  const PopupMenuItem(
                    value: 'public',
                    child: Row(children: [
                      Icon(Icons.public_rounded, size: 20),
                      SizedBox(width: 10),
                      Text('Hacer públicas',
                          style: TextStyle(fontFamily: 'Outfit')),
                    ]),
                  ),
                  const PopupMenuItem(
                    value: 'private',
                    child: Row(children: [
                      Icon(Icons.lock_outline_rounded, size: 20),
                      SizedBox(width: 10),
                      Text('Hacer privadas',
                          style: TextStyle(fontFamily: 'Outfit')),
                    ]),
                  ),
                ],
              ),
            ],
    );
  }

  Widget _buildFab(ColorScheme scheme) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        // Sub-FABs (visible when expanded)
        AnimatedSlide(
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOutCubic,
          offset: _fabExpanded ? Offset.zero : const Offset(0, 0.4),
          child: AnimatedOpacity(
            duration: const Duration(milliseconds: 180),
            opacity: _fabExpanded ? 1.0 : 0.0,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                // AI route option
                FloatingActionButton.extended(
                  heroTag: 'fab_ai',
                  onPressed: _fabExpanded ? _generateAiRoute : null,
                  backgroundColor: SmarturStyle.purple,
                  elevation: 3,
                  icon: const Icon(Icons.auto_awesome_rounded,
                      color: Colors.white, size: 18),
                  label: const Text(
                    'Generar con IA',
                    style: TextStyle(
                      fontFamily: 'Outfit',
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                      fontSize: 14,
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                // Manual option
                FloatingActionButton.extended(
                  heroTag: 'fab_manual',
                  onPressed: _fabExpanded
                      ? () {
                          setState(() => _fabExpanded = false);
                          _createItinerary();
                        }
                      : null,
                  backgroundColor: scheme.surfaceContainerHighest,
                  elevation: 3,
                  icon: Icon(Icons.edit_rounded,
                      color: scheme.onSurface, size: 18),
                  label: Text(
                    'Crear manualmente',
                    style: TextStyle(
                      fontFamily: 'Outfit',
                      fontWeight: FontWeight.w600,
                      color: scheme.onSurface,
                      fontSize: 14,
                    ),
                  ),
                ),
                const SizedBox(height: 10),
              ],
            ),
          ),
        ),
        // Main FAB
        FloatingActionButton(
          heroTag: 'fab_main',
          onPressed: () => setState(() => _fabExpanded = !_fabExpanded),
          backgroundColor: scheme.primary,
          child: AnimatedRotation(
            turns: _fabExpanded ? 0.125 : 0,
            duration: const Duration(milliseconds: 200),
            child: const Icon(Icons.add_rounded, color: Colors.white),
          ),
        ),
      ],
    );
  }

  Widget _buildBody(AppLocalizations l10n, ColorScheme scheme) {
    return RefreshIndicator(
      onRefresh: _load,
      color: scheme.primary,
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          // Cabecera flotante (se oculta al bajar). Oculta en modo selección,
          // donde el Scaffold ya muestra el AppBar contextual.
          if (!_selectionMode)
            SmarturSliverAppBar(title: l10n.misRutasTitle, showBack: false),
          ..._buildBodySlivers(l10n, scheme),
        ],
      ),
    );
  }

  List<Widget> _buildBodySlivers(AppLocalizations l10n, ColorScheme scheme) {
    if (_loading) {
      return [
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
          sliver: SliverList.builder(
            itemCount: 5,
            itemBuilder: (_, __) => const _SkeletonCard(),
          ),
        ),
      ];
    }

    if (_error != null && _itineraries.isEmpty) {
      return [
        SliverFillRemaining(
          hasScrollBody: false,
          child: Center(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.cloud_off_rounded,
                      size: 56,
                      color: scheme.onSurfaceVariant.withValues(alpha: 0.3)),
                  const SizedBox(height: 16),
                  Text(
                    l10n.routesLoadError,
                    style: TextStyle(
                        fontFamily: 'Outfit',
                        fontSize: 15,
                        color: scheme.onSurfaceVariant),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 20),
                  OutlinedButton.icon(
                    onPressed: _load,
                    icon: const Icon(Icons.refresh_rounded, size: 18),
                    label: const Text('Reintentar',
                        style: TextStyle(fontFamily: 'Outfit')),
                  ),
                ],
              ),
            ),
          ),
        ),
      ];
    }

    if (_itineraries.isEmpty) {
      return [
        SliverFillRemaining(
          hasScrollBody: false,
          child: SmarturEmptyState(
            icon: Icons.route_rounded,
            title: l10n.misRutasEmptyTitle,
            subtitle: l10n.misRutasEmptySubtitle,
            action: FilledButton.icon(
              onPressed: _createItinerary,
              style: FilledButton.styleFrom(backgroundColor: scheme.primary),
              icon: const Icon(Icons.add_rounded, size: 18),
              label: Text(l10n.misRutasCreate,
                  style: const TextStyle(
                      fontFamily: 'Outfit', fontWeight: FontWeight.w700)),
            ),
          ),
        ),
      ];
    }

    final withDates = _itineraries.where((it) => it.startDate != null).toList();
    final withoutDates =
        _itineraries.where((it) => it.startDate == null).toList();

    return [
      SliverPadding(
        padding: const EdgeInsets.fromLTRB(16, 4, 16, 100),
        sliver: SliverList.list(
          children: [
            // Subtítulo: conteo + gesto disponible, en una línea discreta
            Padding(
              padding: const EdgeInsets.only(left: 4, right: 4, bottom: 18),
              child: Text(
                _itineraries.length == 1
                    ? '1 ruta guardada · mantén una para seleccionar'
                    : '${_itineraries.length} rutas guardadas · mantén una para seleccionar',
                style: TextStyle(
                  fontFamily: 'Outfit',
                  fontSize: 12.5,
                  height: 1.3,
                  color: scheme.onSurfaceVariant.withValues(alpha: 0.75),
                ),
              ),
            ),
            if (withDates.isNotEmpty) ...[
              _sectionHeader(scheme, 'PROGRAMADAS'),
              ...withDates.map((it) => _routeCardTile(it, scheme)),
            ],
            if (withoutDates.isNotEmpty) ...[
              SizedBox(height: withDates.isNotEmpty ? 14 : 0),
              _sectionHeader(scheme, 'SIN PROGRAMAR'),
              ...withoutDates.map((it) => _routeCardTile(it, scheme)),
            ],
          ],
        ),
      ),
    ];
  }

  Widget _sectionHeader(ColorScheme scheme, String label) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 10),
      child: Text(
        label,
        style: TextStyle(
          fontFamily: 'Outfit',
          fontSize: 11,
          fontWeight: FontWeight.w700,
          letterSpacing: 1.2,
          color: scheme.onSurfaceVariant.withValues(alpha: 0.6),
        ),
      ),
    );
  }

  Widget _routeCardTile(Itinerary it, ColorScheme scheme) {
    final selected = _selectedIds.contains(it.id);
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: _ItineraryCard(
        itinerary: it,
        selectionMode: _selectionMode,
        selected: selected,
        onLongPress: () => _enterSelection(it.id),
        onTap: () {
          if (_selectionMode) {
            _toggleSelection(it.id);
          } else {
            Navigator.push(
              context,
              smarturFadeRoute(
                  ItineraryDetailScreen(itinerary: it, isOwner: true)),
            );
          }
        },
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────

class _ItineraryCard extends StatelessWidget {
  final Itinerary itinerary;
  final VoidCallback onTap;
  final VoidCallback? onLongPress;
  final bool selectionMode;
  final bool selected;

  const _ItineraryCard({
    required this.itinerary,
    required this.onTap,
    this.onLongPress,
    this.selectionMode = false,
    this.selected = false,
  });

  static const _avatarColors = [
    Color(0xFF7C4DFF),
    Color(0xFF448AFF),
    Color(0xFF00BCD4),
    Color(0xFF4CAF50),
    Color(0xFFFF6D00),
    Color(0xFFE91E63),
    Color(0xFF9C27B0),
    Color(0xFF00E676),
    Color(0xFFFFAB00),
    Color(0xFFFF1744),
  ];

  Color _avatarColor(String title) {
    final hash = title.codeUnits.fold<int>(0, (h, c) => h * 31 + c);
    return _avatarColors[hash % _avatarColors.length];
  }

  String _daysAgo(DateTime dt) {
    final diff = DateTime.now().difference(dt).inDays;
    if (diff == 0) return 'Hoy';
    if (diff == 1) return 'Ayer';
    return 'Hace $diff días';
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final l10n = AppLocalizations.of(context)!;
    final color = _avatarColor(itinerary.title);

    return GestureDetector(
      onTap: onTap,
      onLongPress: onLongPress,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: selected
              ? scheme.primary.withValues(alpha: 0.08)
              : scheme.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: selected
                ? scheme.primary
                : scheme.outlineVariant.withValues(alpha: 0.4),
            width: selected ? 1.5 : 1,
          ),
          boxShadow: [
            BoxShadow(
              color: scheme.shadow.withValues(alpha: 0.04),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            // Avatar / checkbox de selección
            selectionMode
                ? Container(
                    width: 52,
                    height: 52,
                    decoration: BoxDecoration(
                      color: selected
                          ? scheme.primary
                          : scheme.surfaceContainerHighest,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: selected
                            ? scheme.primary
                            : scheme.outlineVariant,
                        width: 1.5,
                      ),
                    ),
                    alignment: Alignment.center,
                    child: Icon(
                      selected
                          ? Icons.check_rounded
                          : Icons.circle_outlined,
                      color: selected ? Colors.white : scheme.onSurfaceVariant,
                      size: 24,
                    ),
                  )
                : Container(
                    width: 52,
                    height: 52,
                    decoration: BoxDecoration(
                      color: color.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      itinerary.title.isNotEmpty
                          ? itinerary.title[0].toUpperCase()
                          : '?',
                      style: TextStyle(
                        fontFamily: 'Outfit',
                        fontSize: 22,
                        fontWeight: FontWeight.w700,
                        color: color,
                      ),
                    ),
                  ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          itinerary.title,
                          style: TextStyle(
                            fontFamily: 'Outfit',
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                            color: scheme.onSurface,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (itinerary.isCertified) ...[
                        const SizedBox(width: 6),
                        Icon(Icons.verified_rounded,
                            size: 16, color: scheme.primary),
                      ],
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(Icons.flag_rounded,
                          size: 14, color: scheme.onSurfaceVariant),
                      const SizedBox(width: 4),
                      Text(
                        l10n.itineraryNStops(itinerary.stops.length),
                        style: TextStyle(
                          fontFamily: 'Outfit',
                          fontSize: 12,
                          color: scheme.onSurfaceVariant,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Icon(Icons.access_time_rounded,
                          size: 14, color: scheme.onSurfaceVariant),
                      const SizedBox(width: 4),
                      Text(
                        _daysAgo(itinerary.createdAt),
                        style: TextStyle(
                          fontFamily: 'Outfit',
                          fontSize: 12,
                          color: scheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            if (itinerary.isPublic && !selectionMode)
              Container(
                margin: const EdgeInsets.only(right: 4),
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: SmarturSemanticColors.of(context).leaf.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.public_rounded,
                        size: 12, color: SmarturSemanticColors.of(context).leaf),
                    const SizedBox(width: 4),
                    Text(
                      'Pública',
                      style: TextStyle(
                        fontFamily: 'Outfit',
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                        color: SmarturSemanticColors.of(context).leaf,
                      ),
                    ),
                  ],
                ),
              ),
            if (!selectionMode)
              Icon(Icons.chevron_right_rounded,
                  color: scheme.onSurfaceVariant.withValues(alpha: 0.5)),
          ],
        ),
      ),
    );
  }
}

class _SkeletonCard extends StatelessWidget {
  const _SkeletonCard();

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      height: 84,
      decoration: BoxDecoration(
        color: scheme.surfaceContainerHighest.withValues(alpha: 0.4),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        children: [
          const SizedBox(width: 16),
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: scheme.onSurface.withValues(alpha: 0.06),
              borderRadius: BorderRadius.circular(16),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 140,
                  height: 12,
                  decoration: BoxDecoration(
                    color: scheme.onSurface.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  width: 90,
                  height: 10,
                  decoration: BoxDecoration(
                    color: scheme.onSurface.withValues(alpha: 0.05),
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
