import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:smartur/l10n/app_localizations.dart';

import '../../../core/motion/smartur_routes.dart';
import '../../../core/theme/style_guide.dart';
import '../../../core/utils/notifications.dart';
import '../../../data/local/itinerary_db.dart';
import '../../../data/models/itinerary_model.dart';
import '../../../data/services/auth_service.dart';
import '../../../data/services/booking_service.dart';
import '../../../data/services/itinerary_service.dart';
import '../../../data/services/profile_service.dart';
import '../social/public_profile_screen.dart';
import 'planner_screen.dart';

class ItineraryDetailScreen extends StatefulWidget {
  final Itinerary itinerary;
  final bool isOwner;

  const ItineraryDetailScreen({
    super.key,
    required this.itinerary,
    this.isOwner = false,
  });

  @override
  State<ItineraryDetailScreen> createState() => _ItineraryDetailScreenState();
}

class _ItineraryDetailScreenState extends State<ItineraryDetailScreen> {
  late Itinerary _it;
  bool _loadingCopy = false;

  @override
  void initState() {
    super.initState();
    _it = widget.itinerary;
    _loadFull();
  }

  Future<void> _loadFull() async {
    try {
      final full = await ItineraryService().fetchById(_it.id);
      if (full != null && mounted) {
        setState(() => _it = full);
        await ItineraryDB.saveItinerary(full);
        return;
      }
    } catch (_) {}
    // Offline fallback
    final cached = await ItineraryDB.getItinerary(_it.id);
    if (cached != null && mounted) setState(() => _it = cached);
  }

  Future<void> _copyItinerary() async {
    final l10n = AppLocalizations.of(context)!;
    setState(() => _loadingCopy = true);
    try {
      final copy = await ItineraryService().copyItinerary(_it.id);
      await ItineraryDB.saveItinerary(copy);
      if (!mounted) return;
      SmarturNotifications.showSuccess(context, l10n.routeCopied);
      await Navigator.push(
        context,
        smarturFadeRoute(PlannerScreen(itinerary: copy)),
      );
    } catch (e) {
      if (mounted) SmarturNotifications.showError(context, e.toString());
    } finally {
      if (mounted) setState(() => _loadingCopy = false);
    }
  }

  void _showBookingSheet(BuildContext context, ItineraryStop stop) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _BookingSheet(
        serviceId: stop.placeId,
        serviceName: stop.placeName,
        initialDate: stop.visitDate,
      ),
    );
  }

  void _viewOwnerProfile() {
    if (_it.userId == 0) return;
    Navigator.push(
      context,
      smarturFadeRoute(PublicProfileScreen(
        userId: _it.userId,
        initialName: _it.ownerName,
      )),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final scheme = Theme.of(context).colorScheme;

    return Scaffold(
      backgroundColor: scheme.surface,
      body: CustomScrollView(
        slivers: [
          _buildHeader(scheme),
          SliverToBoxAdapter(child: _buildInfo(l10n, scheme)),
          if (_it.stops.isNotEmpty) ...[
            _buildMapSection(scheme),
            _buildStopsSectionHeader(l10n, scheme),
            _buildStopsList(scheme),
          ],
          SliverToBoxAdapter(
            child: SizedBox(
              height: MediaQuery.viewInsetsOf(context).bottom + 80,
            ),
          ),
        ],
      ),
      bottomNavigationBar: widget.isOwner ? null : _buildCopyBar(l10n, scheme),
    );
  }

  Widget _buildHeader(ColorScheme scheme) {
    return SliverAppBar(
      expandedHeight: 220,
      pinned: true,
      backgroundColor: scheme.surface,
      surfaceTintColor: Colors.transparent,
      flexibleSpace: FlexibleSpaceBar(
        background: _it.coverImageUrl != null
            ? CachedNetworkImage(
                imageUrl: _it.coverImageUrl!,
                fit: BoxFit.cover,
                errorWidget: (_, __, ___) => _gradientHeader(),
              )
            : _gradientHeader(),
      ),
    );
  }

  Widget _gradientHeader() {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            SmarturStyle.purple.withValues(alpha: 0.7),
            SmarturStyle.blue.withValues(alpha: 0.5),
          ],
        ),
      ),
      child: Center(
        child: Icon(Icons.route_rounded,
            size: 72, color: Colors.white.withValues(alpha: 0.6)),
      ),
    );
  }

  Widget _buildInfo(AppLocalizations l10n, ColorScheme scheme) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Badges
          Row(
            children: [
              if (_it.isCertified)
                _Badge(
                  icon: Icons.verified_rounded,
                  label: l10n.itineraryCertified,
                  color: SmarturStyle.purple,
                ),
              if (_it.isPublic && !_it.isCertified)
                _Badge(
                  icon: Icons.public_rounded,
                  label: l10n.itineraryPublic,
                  color: SmarturStyle.blue,
                ),
              if (!_it.isPublic)
                _Badge(
                  icon: Icons.lock_outline_rounded,
                  label: l10n.itineraryPrivate,
                  color: scheme.onSurfaceVariant,
                ),
            ],
          ),
          const SizedBox(height: 10),

          // Title
          Text(_it.title,
              style: SmarturStyle.calSansTitle.copyWith(fontSize: 22)),

          // Description
          if (_it.description?.isNotEmpty == true) ...[
            const SizedBox(height: 8),
            Text(
              _it.description!,
              style: TextStyle(
                fontFamily: 'Outfit',
                fontSize: 14,
                color: scheme.onSurfaceVariant,
                height: 1.5,
              ),
            ),
          ],
          const SizedBox(height: 12),

          // Metadata row
          Row(
            children: [
              if (_it.ownerName != null && !widget.isOwner) ...[
                Icon(Icons.person_outline_rounded,
                    size: 14, color: scheme.onSurfaceVariant),
                const SizedBox(width: 4),
                GestureDetector(
                  onTap: _viewOwnerProfile,
                  child: Text(
                    _it.ownerName!,
                    style: TextStyle(
                      fontFamily: 'Outfit',
                      fontSize: 13,
                      color: SmarturStyle.purple,
                      decoration: TextDecoration.underline,
                      decorationColor: SmarturStyle.purple,
                    ),
                  ),
                ),
                const SizedBox(width: 16),
              ],
              Icon(Icons.copy_outlined, size: 14, color: scheme.onSurfaceVariant),
              const SizedBox(width: 4),
              Text(
                '${_it.copyCount}',
                style: TextStyle(
                  fontFamily: 'Outfit',
                  fontSize: 13,
                  color: scheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(width: 16),
              Icon(Icons.pin_drop_outlined,
                  size: 14, color: scheme.onSurfaceVariant),
              const SizedBox(width: 4),
              Text(
                l10n.itineraryNStops(_it.stops.length),
                style: TextStyle(
                  fontFamily: 'Outfit',
                  fontSize: 13,
                  color: scheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMapSection(ColorScheme scheme) {
    final points = _it.stops
        .where((s) => s.placeLat != null && s.placeLon != null)
        .map((s) => LatLng(s.placeLat!, s.placeLon!))
        .toList();

    if (points.isEmpty) return const SliverToBoxAdapter(child: SizedBox.shrink());

    final center = _centroid(points);

    return SliverToBoxAdapter(
      child: Container(
        height: 200,
        margin: const EdgeInsets.symmetric(horizontal: 16),
        clipBehavior: Clip.antiAlias,
        decoration: BoxDecoration(borderRadius: BorderRadius.circular(20)),
        child: FlutterMap(
          options: MapOptions(
            initialCenter: center,
            initialZoom: 12,
            interactionOptions: const InteractionOptions(
              flags: InteractiveFlag.pinchZoom | InteractiveFlag.drag,
            ),
          ),
          children: [
            TileLayer(
              urlTemplate:
                  'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
              userAgentPackageName: 'com.smartur.app',
            ),
            MarkerLayer(
              markers: [
                for (var i = 0; i < _it.stops.length; i++)
                  if (_it.stops[i].placeLat != null &&
                      _it.stops[i].placeLon != null)
                    Marker(
                      point: LatLng(
                          _it.stops[i].placeLat!, _it.stops[i].placeLon!),
                      width: 32,
                      height: 32,
                      child: Container(
                        decoration: BoxDecoration(
                          color: SmarturStyle.purple,
                          shape: BoxShape.circle,
                          border: Border.all(
                              color: Colors.white, width: 2),
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          '${i + 1}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                            fontFamily: 'Outfit',
                          ),
                        ),
                      ),
                    ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStopsSectionHeader(AppLocalizations l10n, ColorScheme scheme) {
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
        child: Text(
          l10n.itineraryStops,
          style: SmarturStyle.calSansTitle.copyWith(fontSize: 18),
        ),
      ),
    );
  }

  Widget _buildStopsList(ColorScheme scheme) {
    return SliverList.builder(
      itemCount: _it.stops.length,
      itemBuilder: (context, i) {
        final stop = _it.stops[i];
        final isLast = i == _it.stops.length - 1;
        return Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 0),
          child: IntrinsicHeight(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Timeline
                Column(
                  children: [
                    Container(
                      width: 28,
                      height: 28,
                      decoration: BoxDecoration(
                        color: SmarturStyle.purple,
                        shape: BoxShape.circle,
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        '${i + 1}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          fontFamily: 'Outfit',
                        ),
                      ),
                    ),
                    if (!isLast)
                      Expanded(
                        child: Container(
                          width: 2,
                          color: SmarturStyle.purple.withValues(alpha: 0.2),
                        ),
                      ),
                  ],
                ),
                const SizedBox(width: 12),

                // Stop card
                Expanded(
                  child: Container(
                    margin: EdgeInsets.only(bottom: isLast ? 0 : 8),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: scheme.surfaceContainerHighest
                          .withValues(alpha: 0.5),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                          color: scheme.outlineVariant
                              .withValues(alpha: 0.4)),
                    ),
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
                        ),
                        if (stop.visitDate != null) ...[
                          const SizedBox(height: 4),
                          Text(
                            _formatDate(stop.visitDate!),
                            style: TextStyle(
                              fontFamily: 'Outfit',
                              fontSize: 12,
                              color: scheme.onSurfaceVariant,
                            ),
                          ),
                        ],
                        if (stop.notes?.isNotEmpty == true) ...[
                          const SizedBox(height: 4),
                          Text(
                            stop.notes!,
                            style: TextStyle(
                              fontFamily: 'Outfit',
                              fontSize: 12,
                              color: scheme.onSurfaceVariant,
                              fontStyle: FontStyle.italic,
                            ),
                          ),
                        ],
                        if (stop.placeKind == 'svc') ...[
                          const SizedBox(height: 8),
                          Align(
                            alignment: Alignment.centerRight,
                            child: TextButton.icon(
                              onPressed: () => _showBookingSheet(
                                context,
                                stop,
                              ),
                              icon: const Icon(Icons.calendar_today_rounded,
                                  size: 14),
                              label: Text(
                                AppLocalizations.of(context)!.bookingTitle,
                                style: const TextStyle(
                                  fontFamily: 'Outfit',
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              style: TextButton.styleFrom(
                                foregroundColor: SmarturStyle.purple,
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 10, vertical: 4),
                                minimumSize: Size.zero,
                                tapTargetSize:
                                    MaterialTapTargetSize.shrinkWrap,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildCopyBar(AppLocalizations l10n, ColorScheme scheme) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
        child: FilledButton.icon(
          onPressed: _loadingCopy ? null : _copyItinerary,
          style: FilledButton.styleFrom(
            backgroundColor: SmarturStyle.purple,
            minimumSize: const Size(double.infinity, 52),
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16)),
          ),
          icon: _loadingCopy
              ? const SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(
                      strokeWidth: 2, color: Colors.white))
              : const Icon(Icons.content_copy_rounded, size: 18),
          label: Text(
            l10n.itineraryCopy,
            style: const TextStyle(
                fontFamily: 'Outfit',
                fontWeight: FontWeight.w700,
                fontSize: 15),
          ),
        ),
      ),
    );
  }

  LatLng _centroid(List<LatLng> points) {
    final lat = points.map((p) => p.latitude).reduce((a, b) => a + b) /
        points.length;
    final lng = points.map((p) => p.longitude).reduce((a, b) => a + b) /
        points.length;
    return LatLng(lat, lng);
  }

  String _formatDate(DateTime d) =>
      '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';
}

// ─────────────────────────────────────────────────────────────────────────────

class _Badge extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;

  const _Badge({required this.icon, required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(right: 8),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: color),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontFamily: 'Outfit',
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

// Expose for external use
extension ItineraryDetailExt on ItineraryDetailScreen {
  static Widget forItinerary(Itinerary it, {bool isOwner = false}) =>
      ItineraryDetailScreen(itinerary: it, isOwner: isOwner);
}

// ─────────────────────────────────────────────────────────────────────────────

class _BookingSheet extends StatefulWidget {
  final int serviceId;
  final String serviceName;
  final DateTime? initialDate;

  const _BookingSheet({
    required this.serviceId,
    required this.serviceName,
    this.initialDate,
  });

  @override
  State<_BookingSheet> createState() => _BookingSheetState();
}

class _BookingSheetState extends State<_BookingSheet> {
  final _service = BookingService();
  final _notesCtrl = TextEditingController();
  late DateTime _date;
  String? _time;
  int _guests = 1;
  bool _saving = false;
  String? _userName;
  String? _userEmail;
  String? _activityLevel;
  String? _travelType;

  @override
  void initState() {
    super.initState();
    _date = widget.initialDate ?? DateTime.now().add(const Duration(days: 1));
    _loadUserInfo();
  }

  Future<void> _loadUserInfo() async {
    try {
      final auth = AuthService();
      final name = await auth.getUserName();
      final email = await auth.getUserEmail();
      final prefs = await ProfileService.fetchMyProfileForPreferences();
      String? activityLabel;
      final al = prefs['activity_level'];
      if (al is int) {
        if (al <= 1) activityLabel = 'Bajo';
        else if (al <= 3) activityLabel = 'Moderado';
        else if (al <= 4) activityLabel = 'Alto';
        else activityLabel = 'Extremo';
      }
      if (mounted) {
        setState(() {
          _userName = name;
          _userEmail = email;
          _activityLevel = activityLabel;
          _travelType = prefs['travel_type'] as String?;
        });
      }
    } catch (_) {}
  }

  @override
  void dispose() {
    _notesCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _date,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked != null && mounted) setState(() => _date = picked);
  }

  Future<void> _pickTime() async {
    final picked = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.now(),
    );
    if (picked != null && mounted) {
      setState(() {
        _time = '${picked.hour.toString().padLeft(2, '0')}:'
            '${picked.minute.toString().padLeft(2, '0')}';
      });
    }
  }

  Future<void> _submit() async {
    final l10n = AppLocalizations.of(context)!;
    setState(() => _saving = true);
    try {
      await _service.createBooking(
        serviceId: widget.serviceId,
        visitDate: _date,
        visitTime: _time,
        guests: _guests,
        notes: _notesCtrl.text.trim().isEmpty ? null : _notesCtrl.text.trim(),
      );
      if (!mounted) return;
      Navigator.pop(context);
      SmarturNotifications.showSuccess(context, l10n.bookingSuccess);
    } catch (e) {
      if (mounted) SmarturNotifications.showError(context, e.toString());
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final scheme = Theme.of(context).colorScheme;
    final mq = MediaQuery.of(context);

    return Container(
      padding: EdgeInsets.fromLTRB(24, 20, 24, 24 + mq.viewInsets.bottom),
      decoration: BoxDecoration(
        color: scheme.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Handle
          Center(
            child: Container(
              width: 36,
              height: 4,
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(
                color: scheme.outlineVariant,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),

          Text(
            l10n.bookingTitle,
            style: SmarturStyle.calSansTitle.copyWith(fontSize: 18),
          ),
          Text(
            widget.serviceName,
            style: TextStyle(
              fontFamily: 'Outfit',
              fontSize: 13,
              color: scheme.primary,
            ),
          ),
          const SizedBox(height: 20),

          // Traveler info
          if (_userName != null || _userEmail != null)
            Container(
              margin: const EdgeInsets.only(bottom: 16),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: scheme.surfaceContainerHighest.withValues(alpha: 0.6),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 36,
                        height: 36,
                        decoration: const BoxDecoration(
                          color: SmarturStyle.purple,
                          shape: BoxShape.circle,
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          (_userName ?? '?')
                              .split(' ')
                              .where((w) => w.isNotEmpty)
                              .take(2)
                              .map((w) => w[0])
                              .join()
                              .toUpperCase(),
                          style: const TextStyle(
                            fontFamily: 'Outfit',
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                            fontSize: 14,
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (_userName != null)
                              Text(
                                _userName!,
                                style: TextStyle(
                                  fontFamily: 'Outfit',
                                  fontWeight: FontWeight.w600,
                                  fontSize: 14,
                                  color: scheme.onSurface,
                                ),
                              ),
                            if (_userEmail != null)
                              Text(
                                _userEmail!,
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
                  if (_activityLevel != null || _travelType != null) ...[
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 6,
                      children: [
                        if (_activityLevel != null)
                          _PrefChip(label: _activityLevel!, color: SmarturStyle.pink),
                        if (_travelType != null)
                          _PrefChip(label: _travelType!, color: SmarturStyle.blue),
                      ],
                    ),
                  ],
                ],
              ),
            ),

          // Date row
          _Row(
            label: l10n.bookingDate,
            trailing: TextButton(
              onPressed: _pickDate,
              child: Text(
                '${_date.day.toString().padLeft(2, '0')}/'
                '${_date.month.toString().padLeft(2, '0')}/'
                '${_date.year}',
                style: TextStyle(
                  fontFamily: 'Outfit',
                  fontWeight: FontWeight.w600,
                  color: scheme.primary,
                ),
              ),
            ),
          ),

          // Time row
          _Row(
            label: l10n.bookingTime,
            trailing: TextButton(
              onPressed: _pickTime,
              child: Text(
                _time ?? '--:--',
                style: TextStyle(
                  fontFamily: 'Outfit',
                  fontWeight: FontWeight.w600,
                  color: _time != null ? scheme.primary : scheme.outline,
                ),
              ),
            ),
          ),

          // Guests row
          _Row(
            label: l10n.bookingGuests,
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                IconButton(
                  icon: const Icon(Icons.remove_circle_outline_rounded),
                  onPressed: _guests > 1
                      ? () => setState(() => _guests--)
                      : null,
                  color: scheme.primary,
                  visualDensity: VisualDensity.compact,
                ),
                Text(
                  '$_guests',
                  style: TextStyle(
                    fontFamily: 'Outfit',
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                    color: scheme.onSurface,
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.add_circle_outline_rounded),
                  onPressed: () => setState(() => _guests++),
                  color: scheme.primary,
                  visualDensity: VisualDensity.compact,
                ),
              ],
            ),
          ),

          const SizedBox(height: 8),

          // Notes
          TextField(
            controller: _notesCtrl,
            decoration: InputDecoration(
              labelText: l10n.bookingNotes,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
              ),
              filled: true,
              fillColor: scheme.surfaceContainerHighest,
            ),
            maxLines: 2,
            style: const TextStyle(fontFamily: 'Outfit', fontSize: 13),
          ),
          const SizedBox(height: 20),

          // Submit
          FilledButton(
            onPressed: _saving ? null : _submit,
            style: FilledButton.styleFrom(
              backgroundColor: SmarturStyle.purple,
              minimumSize: const Size(double.infinity, 52),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16)),
            ),
            child: _saving
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child:
                        CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : Text(
                    l10n.bookingConfirm,
                    style: const TextStyle(
                      fontFamily: 'Outfit',
                      fontWeight: FontWeight.w700,
                      fontSize: 15,
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}

class _Row extends StatelessWidget {
  final String label;
  final Widget trailing;
  const _Row({required this.label, required this.trailing});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Expanded(
            child: Text(
              label,
              style: TextStyle(
                fontFamily: 'Outfit',
                fontSize: 14,
                color: scheme.onSurfaceVariant,
              ),
            ),
          ),
          trailing,
        ],
      ),
    );
  }
}

class _PrefChip extends StatelessWidget {
  final String label;
  final Color color;

  const _PrefChip({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontFamily: 'Outfit',
          fontSize: 12,
          color: color,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }
}
