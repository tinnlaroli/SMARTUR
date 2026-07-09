import 'package:flutter/material.dart';
import 'package:smartur/l10n/app_localizations.dart';

import '../../../core/motion/smartur_routes.dart';
import '../../../core/theme/style_guide.dart';
import '../../../core/utils/notifications.dart';
import '../../../data/local/itinerary_db.dart';
import '../../../data/models/itinerary_model.dart';
import '../../../data/services/itinerary_service.dart';
import '../../widgets/smartur_app_bar.dart';
import '../../widgets/smartur_background.dart';
import '../../widgets/smartur_ui_kit.dart';
import '../main/main_screen.dart' show routeStopCount;
import 'comparison_screen.dart';

class PlannerScreen extends StatefulWidget {
  final Itinerary itinerary;

  const PlannerScreen({super.key, required this.itinerary});

  @override
  State<PlannerScreen> createState() => _PlannerScreenState();
}

class _PlannerScreenState extends State<PlannerScreen> {
  late Itinerary _it;
  late List<ItineraryStop> _stops;
  bool _loading = false;
  bool _optimizing = false;
  bool _isPublic = false;
  DateTimeRange? _dateRange;

  @override
  void initState() {
    super.initState();
    _it = widget.itinerary;
    _stops = List.from(widget.itinerary.stops);
    _isPublic = widget.itinerary.isPublic;
    routeStopCount.value = _stops.length;
    if (_it.startDate != null && _it.endDate != null) {
      _dateRange = DateTimeRange(start: _it.startDate!, end: _it.endDate!);
    }
    if (_stops.isNotEmpty && _stops.first.placeName.isEmpty) {
      _refreshFromApi();
    }
  }

  Future<void> _refreshFromApi() async {
    try {
      final updated = await ItineraryService().fetchById(_it.id);
      if (updated != null && mounted) {
        setState(() {
          _it = updated;
          _stops = List.from(updated.stops);
          _isPublic = updated.isPublic;
          routeStopCount.value = _stops.length;
          if (updated.startDate != null && updated.endDate != null) {
            _dateRange = DateTimeRange(start: updated.startDate!, end: updated.endDate!);
          } else {
            _dateRange = null;
          }
        });
        await ItineraryDB.saveItinerary(updated);
      }
    } catch (_) {}
  }

  Future<void> _editDateRange() async {
    final picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime.now().subtract(const Duration(days: 365)),
      lastDate: DateTime.now().add(const Duration(days: 730)),
      initialDateRange: _dateRange,
      locale: const Locale('es', 'MX'),
      builder: (context, child) => child!,
    );
    if (picked == null || !mounted) return;
    setState(() => _dateRange = picked);
    try {
      final updated = await ItineraryService().updateItinerary(
        _it.id,
        startDate: picked.start,
        endDate: picked.end,
      );
      if (updated != null && mounted) {
        setState(() => _it = updated.copyWith(stops: _stops));
      }
    } catch (e) {
      if (mounted) SmarturNotifications.showError(context, e.toString());
    }
  }

  Future<void> _clearDateRange() async {
    final previous = _dateRange;
    setState(() => _dateRange = null);
    try {
      await ItineraryService().updateItinerary(
        _it.id,
        clearStartDate: true,
        clearEndDate: true,
      );
    } catch (e) {
      // Antes esto se tragaba el error: la UI quedaba mostrando "sin
      // fechas" aunque el servidor conservara las fechas viejas (estado
      // desincronizado sin que el usuario se enterara). Ahora se revierte
      // el cambio optimista y se avisa, igual que _editDateRange.
      if (mounted) {
        setState(() => _dateRange = previous);
        SmarturNotifications.showError(context, e.toString());
      }
    }
  }

  Future<void> _editTitle() async {
    final l10n = AppLocalizations.of(context)!;
    final ctrl = TextEditingController(text: _it.title);
    final result = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(l10n.plannerRouteName,
            style: SmarturStyle.calSansTitle.copyWith(fontSize: 18)),
        content: TextField(
          controller: ctrl,
          autofocus: true,
          textCapitalization: TextCapitalization.sentences,
          decoration: InputDecoration(hintText: l10n.plannerRouteNameHint),
          style: const TextStyle(fontFamily: 'Outfit'),
          onSubmitted: (v) => Navigator.pop(ctx, v.trim()),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(l10n.cancel,
                style: const TextStyle(fontFamily: 'Outfit')),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, ctrl.text.trim()),
            style: FilledButton.styleFrom(backgroundColor: Theme.of(ctx).colorScheme.primary),
            child: Text(l10n.save,
                style: const TextStyle(
                    fontFamily: 'Outfit', fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
    if (result == null || result.isEmpty || result == _it.title) return;
    try {
      final updated = await ItineraryService().updateItinerary(_it.id, title: result);
      if (updated != null && mounted) {
        setState(() => _it = updated.copyWith(stops: _stops));
      }
    } catch (e) {
      if (mounted) SmarturNotifications.showError(context, e.toString());
    }
  }

  Future<void> _togglePublic(bool value) async {
    setState(() => _isPublic = value);
    try {
      final updated =
          await ItineraryService().updateItinerary(_it.id, isPublic: value);
      if (updated != null && mounted) {
        setState(() => _it = updated.copyWith(stops: _stops));
      } else {
        setState(() => _isPublic = !value);
      }
    } catch (e) {
      setState(() => _isPublic = !value);
      if (mounted) SmarturNotifications.showError(context, e.toString());
    }
  }

  void _onReorder(int oldIndex, int newIndex) {
    if (oldIndex < newIndex) newIndex -= 1;
    setState(() {
      final stop = _stops.removeAt(oldIndex);
      _stops.insert(newIndex, stop);
    });
    final orderedIds = _stops.map((s) => s.id).toList();
    ItineraryService().reorderStops(_it.id, orderedIds);
  }

  Future<void> _deleteStop(ItineraryStop stop) async {
    final l10n = AppLocalizations.of(context)!;
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(l10n.plannerStopDelete,
            style: SmarturStyle.calSansTitle.copyWith(fontSize: 16)),
        content: Text(
          stop.placeName.isNotEmpty ? stop.placeName : l10n.plannerStopDelete,
          style: const TextStyle(fontFamily: 'Outfit'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(l10n.cancel,
                style: const TextStyle(fontFamily: 'Outfit')),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(l10n.plannerStopDelete,
                style: const TextStyle(
                    fontFamily: 'Outfit', color: Colors.red)),
          ),
        ],
      ),
    );
    if (ok != true) return;
    setState(() {
      _stops.removeWhere((s) => s.id == stop.id);
      routeStopCount.value = _stops.length;
    });
    try {
      await ItineraryService().deleteStop(_it.id, stop.id);
    } catch (e) {
      if (mounted) SmarturNotifications.showError(context, e.toString());
    }
  }

  Future<void> _deleteItinerary() async {
    final l10n = AppLocalizations.of(context)!;
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(l10n.plannerDelete,
            style: SmarturStyle.calSansTitle.copyWith(fontSize: 16)),
        content: Text(l10n.plannerDeleteConfirm,
            style: const TextStyle(fontFamily: 'Outfit')),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(l10n.cancel,
                style: const TextStyle(fontFamily: 'Outfit')),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            child: Text(l10n.plannerDelete,
                style: const TextStyle(
                    fontFamily: 'Outfit', fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
    if (ok != true) return;
    setState(() => _loading = true);
    try {
      await ItineraryService().deleteItinerary(_it.id);
      await ItineraryDB.deleteItinerary(_it.id);
      routeStopCount.value = 0;
      if (mounted) Navigator.pop(context);
    } catch (e) {
      setState(() => _loading = false);
      if (mounted) SmarturNotifications.showError(context, e.toString());
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final scheme = Theme.of(context).colorScheme;

    return Scaffold(
      backgroundColor: scheme.surface,
      appBar: SmarturAppBar(
        showBack: true,
        titleWidget: GestureDetector(
          onTap: _editTitle,
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 4,
                height: 22,
                decoration: BoxDecoration(
                  color: scheme.primary,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(width: 10),
              Flexible(
                child: Text(
                  _it.title,
                  style: SmarturStyle.calSansTitle.copyWith(fontSize: 20),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 4),
              Icon(Icons.edit_rounded,
                  size: 14, color: scheme.onSurfaceVariant),
            ],
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.delete_outline_rounded),
            color: Colors.red,
            tooltip: l10n.plannerDelete,
            onPressed: _loading ? null : _deleteItinerary,
          ),
        ],
      ),
      body: SmarturBackground(
        child: Column(
          children: [
            // Public toggle
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 0),
              child: Row(
                children: [
                  Icon(
                    _isPublic ? Icons.public_rounded : Icons.lock_outline_rounded,
                    size: 16,
                    color: _isPublic ? scheme.primary : scheme.onSurfaceVariant,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    l10n.plannerMakePublic,
                    style: TextStyle(
                      fontFamily: 'Outfit',
                      fontSize: 13,
                      color: scheme.onSurfaceVariant,
                    ),
                  ),
                  const Spacer(),
                  Switch(
                    value: _isPublic,
                    activeColor: scheme.primary,
                    onChanged: _togglePublic,
                  ),
                ],
              ),
            ),
            const Divider(height: 1),

            // Date range row
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 8, 4),
              child: Row(
                children: [
                  Icon(Icons.date_range_rounded, size: 15, color: scheme.primary),
                  const SizedBox(width: 6),
                  _dateRange != null
                      ? GestureDetector(
                          onTap: _editDateRange,
                          child: Text(
                            '${_fmt(_dateRange!.start)} – ${_fmt(_dateRange!.end)}',
                            style: TextStyle(
                              fontFamily: 'Outfit',
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: scheme.primary,
                            ),
                          ),
                        )
                      : TextButton.icon(
                          onPressed: _editDateRange,
                          icon: const Icon(Icons.add, size: 14),
                          label: const Text('Agregar fechas',
                              style: TextStyle(fontFamily: 'Outfit', fontSize: 12)),
                          style: TextButton.styleFrom(
                            foregroundColor: scheme.primary,
                            padding: EdgeInsets.zero,
                            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          ),
                        ),
                  if (_dateRange != null) ...[
                    const SizedBox(width: 4),
                    IconButton(
                      onPressed: _clearDateRange,
                      icon: const Icon(Icons.close_rounded, size: 14),
                      color: scheme.onSurfaceVariant,
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(minWidth: 24, minHeight: 24),
                    ),
                  ],
                ],
              ),
            ),
            const Divider(height: 1),

            // Stops list or empty state
            Expanded(
              child: _stops.isEmpty
                  ? _buildEmptyState(l10n, scheme)
                  : _buildStopsList(l10n, scheme),
            ),

            // Optimize button
            _buildOptimizeButton(l10n),
          ],
        ),
      ),
    );
  }

  String _fmt(DateTime d) {
    const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    return '${d.day} ${months[d.month - 1]}';
  }

  Widget _buildEmptyState(AppLocalizations l10n, ColorScheme scheme) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.add_location_alt_rounded,
              size: 64,
              color: scheme.onSurfaceVariant.withValues(alpha: 0.3)),
          const SizedBox(height: 16),
          Text(
            l10n.plannerNoStops,
            style: SmarturStyle.calSansTitle.copyWith(fontSize: 18),
          ),
          const SizedBox(height: 8),
          Text(
            l10n.plannerNoStopsSubtitle,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontFamily: 'Outfit',
              fontSize: 14,
              color: scheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStopsList(AppLocalizations l10n, ColorScheme scheme) {
    return ReorderableListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
      itemCount: _stops.length,
      onReorder: _onReorder,
      proxyDecorator: (child, index, animation) => Material(
        elevation: 6,
        borderRadius: BorderRadius.circular(16),
        child: child,
      ),
      itemBuilder: (context, i) {
        final stop = _stops[i];
        final hasConflict = i > 0 &&
            stop.visitTimeStart != null &&
            _stops[i - 1].visitTimeStart != null &&
            stop.visitDate == _stops[i - 1].visitDate &&
            _timeToMins(stop.visitTimeStart!) < _timeToMins(_stops[i - 1].visitTimeStart!);
        return _StopCard(
          key: ValueKey(stop.id),
          stop: stop,
          index: i,
          scheme: scheme,
          l10n: l10n,
          dateRange: _dateRange,
          onDelete: () => _deleteStop(stop),
          onDateSet: (date) => _setStopDate(stop, date: date),
          onTimeSet: (time) => _setStopDate(stop, time: time),
          hasTimeConflict: hasConflict,
        );
      },
    );
  }

  Widget _buildOptimizeButton(AppLocalizations l10n) {
    final scheme = Theme.of(context).colorScheme;
    final canOptimize = _stops.length >= 2 && !_optimizing && !_loading;
    return Padding(
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        bottom: MediaQuery.viewInsetsOf(context).bottom + 16,
        top: 8,
      ),
      child: FilledButton.icon(
        onPressed: canOptimize ? _optimizeRoute : null,
        style: FilledButton.styleFrom(
          backgroundColor: scheme.primary.withValues(alpha: 0.15),
          foregroundColor: scheme.primary,
          disabledBackgroundColor:
              scheme.primary.withValues(alpha: 0.07),
          disabledForegroundColor:
              scheme.primary.withValues(alpha: 0.4),
          minimumSize: const Size(double.infinity, 52),
          shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16)),
          elevation: 0,
        ),
        icon: _optimizing
            ? SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: scheme.primary,
                ),
              )
            : const Icon(Icons.auto_fix_high_rounded, size: 20),
        label: Text(
          _optimizing ? l10n.compareLoading : l10n.plannerOptimize,
          style: const TextStyle(
            fontFamily: 'Outfit',
            fontWeight: FontWeight.w700,
            fontSize: 15,
          ),
        ),
      ),
    );
  }

  Future<void> _optimizeRoute() async {
    final l10n = AppLocalizations.of(context)!;
    if (_stops.length < 2) {
      SmarturNotifications.showInfo(context, l10n.compareMinStops);
      return;
    }
    setState(() => _optimizing = true);
    try {
      final result = await ItineraryService().optimizeItinerary(_it.id);
      if (!mounted) return;
      final reordered = await Navigator.push<List<ItineraryStop>>(
        context,
        smarturFadeRoute(ComparisonScreen(
          originalStops: List.from(_stops),
          result: result,
        )),
      );
      if (reordered != null && mounted) {
        setState(() {
          _stops = reordered;
          routeStopCount.value = _stops.length;
        });
        await ItineraryService()
            .reorderStops(_it.id, reordered.map((s) => s.id).toList());
        if (mounted) {
          SmarturNotifications.showSuccess(context, l10n.compareApplied);
        }
      }
    } catch (e) {
      if (mounted) SmarturNotifications.showError(context, e.toString());
    } finally {
      if (mounted) setState(() => _optimizing = false);
    }
  }

  int _timeToMins(String t) {
    final p = t.split(':');
    if (p.length < 2) return 0;
    return (int.tryParse(p[0]) ?? 0) * 60 + (int.tryParse(p[1]) ?? 0);
  }

  Future<void> _setStopDate(ItineraryStop stop, {DateTime? date, String? time}) async {
    final idx = _stops.indexWhere((s) => s.id == stop.id);
    if (idx < 0) return;
    setState(() {
      _stops[idx] = _stops[idx].copyWith(
        visitDate: date,
        clearDate: date == null && time == null,
        visitTimeStart: time,
        clearTime: time == null && date == null,
      );
    });
    // Persist change to API in background (non-blocking, silent fail)
    try {
      if (stop.id > 0) {
        await ItineraryService().updateStop(
          _it.id,
          stop.id,
          visitDate: date,
          visitTimeStart: time,
        );
      }
    } catch (_) {}
  }
}

// ─────────────────────────────────────────────────────────────────────────────

class _StopCard extends StatelessWidget {
  final ItineraryStop stop;
  final int index;
  final ColorScheme scheme;
  final AppLocalizations l10n;
  final DateTimeRange? dateRange;
  final VoidCallback onDelete;
  final ValueChanged<DateTime?> onDateSet;
  final ValueChanged<String?> onTimeSet;
  final bool hasTimeConflict;

  const _StopCard({
    super.key,
    required this.stop,
    required this.index,
    required this.scheme,
    required this.l10n,
    this.dateRange,
    required this.onDelete,
    required this.onDateSet,
    required this.onTimeSet,
    this.hasTimeConflict = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: scheme.surfaceContainerHighest.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
            color: scheme.outlineVariant.withValues(alpha: 0.5)),
      ),
      child: Row(
        children: [
          // Drag handle
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 8),
            child: Icon(Icons.drag_handle_rounded, size: 20),
          ),

          // Stop number bubble
          Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(
              color: scheme.primary,
              shape: BoxShape.circle,
            ),
            alignment: Alignment.center,
            child: Text(
              '${index + 1}',
              style: const TextStyle(
                fontFamily: 'Outfit',
                fontSize: 12,
                fontWeight: FontWeight.w800,
                color: Colors.white,
              ),
            ),
          ),
          const SizedBox(width: 10),

          // Place info
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    stop.placeName.isNotEmpty
                        ? stop.placeName
                        : '${stop.placeKind.toUpperCase()} #${stop.placeId}',
                    style: TextStyle(
                      fontFamily: 'Outfit',
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: scheme.onSurface,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (stop.visitDate != null || stop.visitTimeStart != null) ...[
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        if (stop.visitDate != null) ...[
                          Icon(Icons.calendar_today_rounded,
                              size: 12,
                              color: scheme.primary.withValues(alpha: 0.8)),
                          const SizedBox(width: 4),
                          Text(
                            _formatDate(stop.visitDate!),
                            style: TextStyle(
                              fontFamily: 'Outfit',
                              fontSize: 12,
                              color: scheme.onSurfaceVariant,
                            ),
                          ),
                        ],
                        if (stop.visitTimeStart != null) ...[
                          const SizedBox(width: 8),
                          Icon(Icons.access_time_rounded,
                              size: 12,
                              color: scheme.primary.withValues(alpha: 0.8)),
                          const SizedBox(width: 4),
                          Text(
                            stop.visitTimeStart!,
                            style: TextStyle(
                              fontFamily: 'Outfit',
                              fontSize: 12,
                              color: scheme.onSurfaceVariant,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],
                  if (hasTimeConflict) ...[
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Icon(Icons.warning_amber_rounded,
                            size: 12, color: Colors.orange),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            'Time overlap with previous stop',
                            style: TextStyle(
                              fontFamily: 'Outfit',
                              fontSize: 10,
                              color: Colors.orange,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ),

          // Date button
          IconButton(
            icon: Icon(
              stop.visitDate != null
                  ? Icons.edit_calendar_rounded
                  : Icons.calendar_today_outlined,
              size: 18,
              color: scheme.onSurfaceVariant,
            ),
            onPressed: () => _pickDate(context),
            tooltip: l10n.plannerStopDate,
          ),

          // Time button
          IconButton(
            icon: Icon(
              stop.visitTimeStart != null
                  ? Icons.edit_outlined
                  : Icons.access_time_outlined,
              size: 18,
              color: scheme.onSurfaceVariant,
            ),
            onPressed: () => _pickTime(context),
            tooltip: 'Horario',
          ),

          // Delete button
          IconButton(
            icon: const Icon(Icons.close_rounded, size: 18, color: Colors.red),
            onPressed: onDelete,
            tooltip: l10n.plannerStopDelete,
          ),
        ],
      ),
    );
  }

  Future<void> _pickDate(BuildContext context) async {
    final first = dateRange?.start ?? DateTime.now().subtract(const Duration(days: 1));
    final last = dateRange?.end ?? DateTime.now().add(const Duration(days: 365 * 2));
    final picked = await showDatePicker(
      context: context,
      initialDate: stop.visitDate ?? DateTime.now(),
      firstDate: first,
      lastDate: last,
      builder: (ctx, child) => child!,
    );
    onDateSet(picked);
  }

  Future<void> _pickTime(BuildContext context) async {
    final initial = stop.visitTimeStart != null
        ? _parseTime(stop.visitTimeStart!)
        : TimeOfDay.now();
    final picked = await showTimePicker(
      context: context,
      initialTime: initial,
      builder: (ctx, child) => child!,
    );
    if (picked != null) {
      final formatted =
          '${picked.hour.toString().padLeft(2, '0')}:${picked.minute.toString().padLeft(2, '0')}';
      onTimeSet(formatted);
    }
  }

  TimeOfDay _parseTime(String t) {
    final parts = t.split(':');
    if (parts.length == 2) {
      return TimeOfDay(
        hour: int.tryParse(parts[0]) ?? 0,
        minute: int.tryParse(parts[1]) ?? 0,
      );
    }
    return TimeOfDay.now();
  }

  String _formatDate(DateTime d) =>
      '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';
}
