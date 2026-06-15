import 'dart:math';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:intl/intl.dart';
import 'package:latlong2/latlong.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:share_plus/share_plus.dart';
import 'package:smartur/l10n/app_localizations.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/motion/smartur_routes.dart';
import '../../../core/theme/style_guide.dart';
import '../../../core/utils/notifications.dart';
import '../../../data/local/itinerary_db.dart';
import '../../../data/models/itinerary_model.dart';
import '../../../data/services/auth_service.dart';
import '../../../data/models/booking_model.dart';
import '../../../data/services/booking_service.dart';
import '../../../data/services/chat_service.dart';
import '../../../data/services/itinerary_service.dart';
import '../../../data/services/profile_service.dart';
import '../chat/chat_screen.dart';
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
  final Map<int, Booking> _stopBookings = {};

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
        dateRange: _it.startDate != null && _it.endDate != null
            ? DateTimeRange(start: _it.startDate!, end: _it.endDate!)
            : null,
        onBooked: (booking) {
          if (mounted) setState(() => _stopBookings[stop.placeId] = booking);
        },
      ),
    );
  }

  void _showManageBookingSheet(BuildContext context, ItineraryStop stop, Booking booking) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _ManageBookingSheet(
        booking: booking,
        serviceName: stop.placeName,
        dateRange: _it.startDate != null && _it.endDate != null
            ? DateTimeRange(start: _it.startDate!, end: _it.endDate!)
            : null,
        onCancelled: () {
          if (mounted) setState(() => _stopBookings.remove(stop.placeId));
        },
        onUpdated: (updated) {
          if (mounted) setState(() => _stopBookings[stop.placeId] = updated);
        },
      ),
    );
  }


  void _showContactSheet(BuildContext context, ItineraryStop stop) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _ContactSheet(
        serviceId: stop.placeId,
        serviceName: stop.placeName,
        contactPhone: stop.contactPhone,
        idCompany: stop.idCompany,
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
      bottomNavigationBar: widget.isOwner
          ? _buildOwnerBar(l10n, scheme)
          : _buildCopyBar(l10n, scheme),
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
    final validStops = _it.stops
        .where((s) => s.placeLat != null && s.placeLon != null)
        .toList();

    if (validStops.isEmpty) return const SliverToBoxAdapter(child: SizedBox.shrink());

    final points = validStops
        .map((s) => LatLng(s.placeLat!, s.placeLon!))
        .toList();

    final center = _centroid(points);
    final isDark = scheme.brightness == Brightness.dark;

    return SliverToBoxAdapter(
      child: Container(
        height: 220,
        margin: const EdgeInsets.symmetric(horizontal: 16),
        clipBehavior: Clip.antiAlias,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
              color: scheme.outlineVariant.withValues(alpha: 0.4)),
        ),
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
              urlTemplate: isDark
                  ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
                  : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
              subdomains: isDark ? const ['a', 'b', 'c'] : const [],
              userAgentPackageName: 'com.smartur.app',
            ),
            if (points.length > 1)
              PolylineLayer(
                polylines: [
                  Polyline(
                    points: points,
                    color: SmarturStyle.purple.withValues(alpha: 0.7),
                    strokeWidth: 3.5,
                  ),
                ],
              ),
            MarkerLayer(
              markers: [
                for (var i = 0; i < validStops.length; i++)
                  Marker(
                    point: LatLng(
                        validStops[i].placeLat!, validStops[i].placeLon!),
                    width: i == 0 || i == validStops.length - 1 ? 38 : 32,
                    height: i == 0 || i == validStops.length - 1 ? 38 : 32,
                    child: Container(
                      decoration: BoxDecoration(
                        color: i == 0
                            ? SmarturStyle.green
                            : i == validStops.length - 1
                                ? SmarturStyle.orange
                                : SmarturStyle.purple,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.25),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                        border: Border.all(
                            color: Colors.white, width: i == 0 || i == validStops.length - 1 ? 3 : 2.5),
                      ),
                      alignment: Alignment.center,
                      child: i == 0
                          ? const Icon(Icons.flag_rounded,
                              color: Colors.white, size: 16)
                          : i == validStops.length - 1
                              ? const Icon(Icons.flag_rounded,
                                  color: Colors.white, size: 16)
                              : Text(
                                  '${i + 1}',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 12,
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
    final children = <Widget>[];
    DateTime? lastDay;

    for (int i = 0; i < _it.stops.length; i++) {
      final stop = _it.stops[i];
      final isLast = i == _it.stops.length - 1;

      // Day group header for multi-day itineraries
      if (stop.visitDate != null) {
        final d = DateTime(
            stop.visitDate!.year, stop.visitDate!.month, stop.visitDate!.day);
        if (lastDay == null || d != lastDay) {
          lastDay = d;
          children.add(_buildDayHeader(d));
        }
      }

      // Transit chip before this stop (uses distance from previous stop)
      if (i > 0) {
        final transit = _transitLabel(_it.stops[i - 1], stop);
        if (transit.isNotEmpty) {
          children.add(
            Padding(
              padding: const EdgeInsets.only(left: 52, bottom: 2),
              child: Row(
                children: [
                  Icon(Icons.directions_car_outlined,
                      size: 12,
                      color: scheme.onSurfaceVariant.withValues(alpha: 0.6)),
                  const SizedBox(width: 4),
                  Text(
                    transit,
                    style: TextStyle(
                      fontFamily: 'Outfit',
                      fontSize: 10,
                      color: scheme.onSurfaceVariant.withValues(alpha: 0.6),
                    ),
                  ),
                ],
              ),
            ),
          );
        }
      }

      // Stop row with time label + numbered circle + card
      children.add(
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 0),
          child: IntrinsicHeight(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Time label column
                SizedBox(
                  width: 36,
                  child: stop.visitTimeStart != null
                      ? Padding(
                          padding: const EdgeInsets.only(top: 4),
                          child: Text(
                            stop.visitTimeStart!,
                            textAlign: TextAlign.right,
                            style: TextStyle(
                              fontFamily: 'Outfit',
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                              color: SmarturStyle.purple,
                            ),
                          ),
                        )
                      : const SizedBox.shrink(),
                ),
                const SizedBox(width: 6),

                // Timeline column
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
                const SizedBox(width: 10),

                // Stop card
                Expanded(
                  child: Container(
                    margin: EdgeInsets.only(bottom: isLast ? 0 : 8),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color:
                          scheme.surfaceContainerHighest.withValues(alpha: 0.5),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                          color: scheme.outlineVariant.withValues(alpha: 0.4)),
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
                          const SizedBox(height: 3),
                          Text(
                            _formatDate(stop.visitDate!),
                            style: TextStyle(
                              fontFamily: 'Outfit',
                              fontSize: 11,
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
                        // Action row: Book + Maps
                        if (stop.placeKind == 'svc' || stop.placeLat != null)
                          Padding(
                            padding: const EdgeInsets.only(top: 8),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.end,
                              children: [
                                if (stop.placeLat != null)
                                  GestureDetector(
                                    onTap: () => _openInMaps(stop),
                                    child: Row(
                                      children: [
                                        Icon(Icons.map_outlined,
                                            size: 13,
                                            color: scheme.onSurfaceVariant),
                                        const SizedBox(width: 3),
                                        Text(
                                          'Maps',
                                          style: TextStyle(
                                            fontFamily: 'Outfit',
                                            fontSize: 11,
                                            color: scheme.onSurfaceVariant,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                if (stop.placeKind == 'svc' &&
                                    stop.placeLat != null)
                                  const SizedBox(width: 12),
                                if (stop.placeKind == 'svc')
                                  Builder(builder: (bCtx) {
                                    final existing = _stopBookings[stop.placeId];
                                    if (existing != null && !existing.isCancelled) {
                                      return TextButton.icon(
                                        onPressed: () => _showManageBookingSheet(bCtx, stop, existing),
                                        icon: const Icon(Icons.check_circle_rounded, size: 14),
                                        label: const Text(
                                          'Reservado',
                                          style: TextStyle(fontFamily: 'Outfit', fontSize: 12, fontWeight: FontWeight.w600),
                                        ),
                                        style: TextButton.styleFrom(
                                          foregroundColor: Colors.green.shade600,
                                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                          minimumSize: Size.zero,
                                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                        ),
                                      );
                                    }
                                    return TextButton.icon(
                                      onPressed: () => _showBookingSheet(bCtx, stop),
                                      icon: const Icon(Icons.calendar_today_rounded, size: 14),
                                      label: Text(
                                        AppLocalizations.of(bCtx)!.bookingTitle,
                                        style: const TextStyle(fontFamily: 'Outfit', fontSize: 12, fontWeight: FontWeight.w600),
                                      ),
                                      style: TextButton.styleFrom(
                                        foregroundColor: SmarturStyle.purple,
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                        minimumSize: Size.zero,
                                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                      ),
                                    );
                                  }),
                                if (stop.placeKind == 'svc') ...[
                                  const SizedBox(width: 6),
                                  TextButton.icon(
                                    onPressed: () =>
                                        _showContactSheet(context, stop),
                                    icon: const Icon(Icons.phone_rounded,
                                        size: 14),
                                    label: const Text(
                                      'Contactar',
                                      style: TextStyle(
                                        fontFamily: 'Outfit',
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                    style: TextButton.styleFrom(
                                      foregroundColor: Colors.teal,
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 10, vertical: 4),
                                      minimumSize: Size.zero,
                                      tapTargetSize:
                                          MaterialTapTargetSize.shrinkWrap,
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return SliverList(
      delegate: SliverChildBuilderDelegate(
        (_, i) => children[i],
        childCount: children.length,
      ),
    );
  }

  Widget _buildDayHeader(DateTime date) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
      child: Row(
        children: [
          Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: SmarturStyle.purple.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                  color: SmarturStyle.purple.withValues(alpha: 0.2)),
            ),
            child: Text(
              DateFormat('EEEE, d MMM').format(date),
              style: TextStyle(
                fontFamily: 'Outfit',
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: SmarturStyle.purple,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Divider(
              color: SmarturStyle.purple.withValues(alpha: 0.15),
              height: 1,
            ),
          ),
        ],
      ),
    );
  }

  // ── Haversine ────────────────────────────────────────────────────────────────

  double _haversineKm(double lat1, double lon1, double lat2, double lon2) {
    const r = 6371.0;
    final dLat = (lat2 - lat1) * pi / 180;
    final dLon = (lon2 - lon1) * pi / 180;
    final a = sin(dLat / 2) * sin(dLat / 2) +
        cos(lat1 * pi / 180) *
            cos(lat2 * pi / 180) *
            sin(dLon / 2) *
            sin(dLon / 2);
    return r * 2 * atan2(sqrt(a), sqrt(1 - a));
  }

  String _transitLabel(ItineraryStop from, ItineraryStop to) {
    if (from.placeLat == null || to.placeLat == null) return '';
    final km = _haversineKm(
        from.placeLat!, from.placeLon!, to.placeLat!, to.placeLon!);
    final mins = (km / 40 * 60).round();
    if (mins <= 1) return '';
    return mins < 60 ? '~${mins} min' : '~${(mins / 60).toStringAsFixed(1)} h';
  }

  // ── Actions ──────────────────────────────────────────────────────────────────

  Future<void> _openInMaps(ItineraryStop stop) async {
    final Uri uri;
    if (stop.placeLat != null) {
      uri = Uri.parse(
          'https://www.google.com/maps/dir/?api=1&destination=${stop.placeLat},${stop.placeLon}');
    } else {
      uri = Uri.parse(
          'https://www.google.com/maps/search/?api=1&query=${Uri.encodeComponent(stop.placeName)}');
    }
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  void _shareAsText() {
    final lines = _it.stops
        .map((s) =>
            '• ${s.visitTimeStart != null ? "${s.visitTimeStart} " : ""}${s.placeName.isNotEmpty ? s.placeName : "Stop #${s.placeId}"}')
        .join('\n');
    SharePlus.instance.share(ShareParams(
      text: '${_it.title}\n\n$lines',
      subject: _it.title,
    ));
  }

  Future<void> _exportPdf() async {
    final doc = pw.Document();
    doc.addPage(pw.MultiPage(
      pageFormat: PdfPageFormat.a4,
      build: (ctx) => [
        pw.Header(level: 0, text: _it.title),
        if (_it.startDate != null)
          pw.Text(
            '${DateFormat('d MMM yyyy').format(_it.startDate!)}'
            '${_it.endDate != null ? " → ${DateFormat('d MMM yyyy').format(_it.endDate!)}" : ""}',
          ),
        pw.SizedBox(height: 8),
        ..._it.stops.asMap().entries.map((e) {
          final s = e.value;
          final name =
              s.placeName.isNotEmpty ? s.placeName : 'Stop #${s.placeId}';
          final time = s.visitTimeStart != null ? '${s.visitTimeStart} — ' : '';
          final note = s.notes?.isNotEmpty == true ? '\n  ${s.notes}' : '';
          return pw.Bullet(text: '$time$name$note');
        }),
      ],
    ));
    await Printing.sharePdf(
        bytes: await doc.save(), filename: '${_it.title}.pdf');
  }

  // ── Owner action bar ─────────────────────────────────────────────────────────

  Widget _buildOwnerBar(AppLocalizations l10n, ColorScheme scheme) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
        child: Row(
          children: [
            Expanded(
              child: FilledButton.icon(
                onPressed: () => Navigator.push(
                  context,
                  smarturFadeRoute(PlannerScreen(itinerary: _it)),
                ),
                style: FilledButton.styleFrom(
                  backgroundColor: SmarturStyle.purple,
                  minimumSize: const Size(0, 50),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14)),
                ),
                icon: const Icon(Icons.edit_rounded, size: 18),
                label: const Text(
                  'Edit Route',
                  style: TextStyle(
                      fontFamily: 'Outfit',
                      fontWeight: FontWeight.w700,
                      fontSize: 15),
                ),
              ),
            ),
            const SizedBox(width: 8),
            _ActionIconBtn(
              icon: Icons.share_rounded,
              onPressed: _shareAsText,
              scheme: scheme,
            ),
            const SizedBox(width: 6),
            _ActionIconBtn(
              icon: Icons.picture_as_pdf_rounded,
              onPressed: _exportPdf,
              scheme: scheme,
            ),
            if (_it.stops.any((s) => s.placeLat != null)) ...[
              const SizedBox(width: 6),
              _ActionIconBtn(
                icon: Icons.map_outlined,
                onPressed: () {
                  final first =
                      _it.stops.firstWhere((s) => s.placeLat != null);
                  _openInMaps(first);
                },
                scheme: scheme,
              ),
            ],
          ],
        ),
      ),
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

class _ActionIconBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback onPressed;
  final ColorScheme scheme;

  const _ActionIconBtn(
      {required this.icon, required this.onPressed, required this.scheme});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 42,
      height: 50,
      child: OutlinedButton(
        onPressed: onPressed,
        style: OutlinedButton.styleFrom(
          padding: EdgeInsets.zero,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          side: BorderSide(color: scheme.outlineVariant),
        ),
        child: Icon(icon, size: 18, color: scheme.onSurfaceVariant),
      ),
    );
  }
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
  final DateTimeRange? dateRange;
  final void Function(Booking)? onBooked;

  const _BookingSheet({
    required this.serviceId,
    required this.serviceName,
    this.initialDate,
    this.dateRange,
    this.onBooked,
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
    final range = widget.dateRange;
    final first = range != null ? range.start.isAfter(DateTime.now()) ? range.start : DateTime.now() : DateTime.now();
    final last = range?.end ?? DateTime.now().add(const Duration(days: 365));
    final picked = await showDatePicker(
      context: context,
      initialDate: _date,
      firstDate: first,
      lastDate: last,
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
      final booking = await _service.createBooking(
        serviceId: widget.serviceId,
        visitDate: _date,
        visitTime: _time,
        guests: _guests,
        notes: _notesCtrl.text.trim().isEmpty ? null : _notesCtrl.text.trim(),
      );
      if (!mounted) return;
      widget.onBooked?.call(booking);
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

// ─────────────────────────────────────────────────────────────────────────────
// Manage existing booking (edit / cancel)
// ─────────────────────────────────────────────────────────────────────────────

class _ManageBookingSheet extends StatefulWidget {
  final Booking booking;
  final String serviceName;
  final DateTimeRange? dateRange;
  final VoidCallback onCancelled;
  final void Function(Booking) onUpdated;

  const _ManageBookingSheet({
    required this.booking,
    required this.serviceName,
    this.dateRange,
    required this.onCancelled,
    required this.onUpdated,
  });

  @override
  State<_ManageBookingSheet> createState() => _ManageBookingSheetState();
}

class _ManageBookingSheetState extends State<_ManageBookingSheet> {
  final _service = BookingService();
  final _notesCtrl = TextEditingController();
  late DateTime _date;
  String? _time;
  late int _guests;
  bool _saving = false;
  bool _cancelling = false;

  @override
  void initState() {
    super.initState();
    _date = widget.booking.visitDate;
    _time = widget.booking.visitTime;
    _guests = widget.booking.guests;
    _notesCtrl.text = widget.booking.notes ?? '';
  }

  @override
  void dispose() {
    _notesCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final range = widget.dateRange;
    final first = range != null && range.start.isAfter(DateTime.now())
        ? range.start
        : DateTime.now();
    final last = range?.end ?? DateTime.now().add(const Duration(days: 365));
    final picked = await showDatePicker(
      context: context,
      initialDate: _date.isAfter(first) ? _date : first,
      firstDate: first,
      lastDate: last,
    );
    if (picked != null && mounted) setState(() => _date = picked);
  }

  Future<void> _pickTime() async {
    final initial = _time != null
        ? TimeOfDay(
            hour: int.parse(_time!.split(':')[0]),
            minute: int.parse(_time!.split(':')[1]))
        : TimeOfDay.now();
    final picked = await showTimePicker(context: context, initialTime: initial);
    if (picked != null && mounted) {
      setState(() {
        _time = '${picked.hour.toString().padLeft(2, '0')}:'
            '${picked.minute.toString().padLeft(2, '0')}';
      });
    }
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      final updated = await _service.updateBooking(
        id: widget.booking.id,
        visitDate: _date,
        visitTime: _time,
        guests: _guests,
        notes: _notesCtrl.text.trim().isEmpty ? null : _notesCtrl.text.trim(),
      );
      if (!mounted) return;
      widget.onUpdated(updated);
      Navigator.pop(context);
      SmarturNotifications.showSuccess(context, 'Reserva actualizada');
    } catch (e) {
      if (mounted) SmarturNotifications.showError(context, e.toString());
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _cancel() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Cancelar reserva', style: TextStyle(fontFamily: 'Outfit', fontWeight: FontWeight.w700)),
        content: const Text('¿Seguro que deseas cancelar esta reserva?', style: TextStyle(fontFamily: 'Outfit')),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('No', style: TextStyle(fontFamily: 'Outfit')),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Colors.red.shade600),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Sí, cancelar', style: TextStyle(fontFamily: 'Outfit')),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    setState(() => _cancelling = true);
    try {
      await _service.cancelBooking(widget.booking.id);
      if (!mounted) return;
      widget.onCancelled();
      Navigator.pop(context);
      SmarturNotifications.showSuccess(context, 'Reserva cancelada');
    } catch (e) {
      if (mounted) SmarturNotifications.showError(context, e.toString());
    } finally {
      if (mounted) setState(() => _cancelling = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final mq = MediaQuery.of(context);
    final statusColor = widget.booking.isPending
        ? Colors.amber.shade700
        : widget.booking.isConfirmed
            ? Colors.green.shade600
            : Colors.red.shade600;
    final statusLabel = widget.booking.isPending
        ? 'Pendiente'
        : widget.booking.isConfirmed
            ? 'Confirmada'
            : 'Cancelada';

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
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Mi reserva',
                      style: SmarturStyle.calSansTitle.copyWith(fontSize: 18),
                    ),
                    Text(
                      widget.serviceName,
                      style: TextStyle(fontFamily: 'Outfit', fontSize: 13, color: scheme.primary),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  statusLabel,
                  style: TextStyle(fontFamily: 'Outfit', fontSize: 12, fontWeight: FontWeight.w600, color: statusColor),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          _Row(
            label: 'Fecha',
            trailing: TextButton(
              onPressed: _pickDate,
              child: Text(
                '${_date.day.toString().padLeft(2, '0')}/${_date.month.toString().padLeft(2, '0')}/${_date.year}',
                style: TextStyle(fontFamily: 'Outfit', fontWeight: FontWeight.w600, color: scheme.primary),
              ),
            ),
          ),
          _Row(
            label: 'Hora',
            trailing: TextButton(
              onPressed: _pickTime,
              child: Text(
                _time ?? '--:--',
                style: TextStyle(fontFamily: 'Outfit', fontWeight: FontWeight.w600, color: _time != null ? scheme.primary : scheme.outline),
              ),
            ),
          ),
          _Row(
            label: 'Personas',
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                IconButton(
                  icon: const Icon(Icons.remove_circle_outline_rounded),
                  onPressed: _guests > 1 ? () => setState(() => _guests--) : null,
                  color: scheme.primary,
                  visualDensity: VisualDensity.compact,
                ),
                Text('$_guests', style: TextStyle(fontFamily: 'Outfit', fontWeight: FontWeight.bold, fontSize: 16, color: scheme.onSurface)),
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
          TextField(
            controller: _notesCtrl,
            decoration: InputDecoration(
              labelText: 'Notas',
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
              filled: true,
              fillColor: scheme.surfaceContainerHighest,
            ),
            maxLines: 2,
            style: const TextStyle(fontFamily: 'Outfit', fontSize: 13),
          ),
          const SizedBox(height: 16),

          FilledButton(
            onPressed: (_saving || _cancelling) ? null : _save,
            style: FilledButton.styleFrom(
              backgroundColor: SmarturStyle.purple,
              minimumSize: const Size(double.infinity, 52),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            ),
            child: _saving
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Text('Guardar cambios', style: TextStyle(fontFamily: 'Outfit', fontWeight: FontWeight.w700, fontSize: 15)),
          ),
          const SizedBox(height: 10),
          OutlinedButton(
            onPressed: (_saving || _cancelling) ? null : _cancel,
            style: OutlinedButton.styleFrom(
              foregroundColor: Colors.red.shade600,
              side: BorderSide(color: Colors.red.shade300),
              minimumSize: const Size(double.infinity, 48),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            ),
            child: _cancelling
                ? SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.red.shade600))
                : const Text('Cancelar reserva', style: TextStyle(fontFamily: 'Outfit', fontWeight: FontWeight.w600, fontSize: 14)),
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

// ─── Contact Sheet ────────────────────────────────────────────────────────────

class _ContactSheet extends StatefulWidget {
  final int serviceId;
  final String serviceName;
  final String? contactPhone;
  final int? idCompany;

  const _ContactSheet({
    required this.serviceId,
    required this.serviceName,
    this.contactPhone,
    this.idCompany,
  });

  @override
  State<_ContactSheet> createState() => _ContactSheetState();
}

class _ContactSheetState extends State<_ContactSheet> {
  final _chatService = ChatService();
  bool _loadingChat = false;

  Future<void> _openChat() async {
    if (widget.idCompany == null) return;
    setState(() => _loadingChat = true);
    try {
      final conv = await _chatService.createConversation(
        companyId: widget.idCompany!,
        serviceId: widget.serviceId,
      );
      if (!mounted) return;
      Navigator.pop(context);
      await Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => ChatScreen(conversation: conv)),
      );
    } catch (e) {
      if (mounted) SmarturNotifications.showError(context, e.toString());
    } finally {
      if (mounted) setState(() => _loadingChat = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final hasInfo = widget.contactPhone != null || widget.idCompany != null;

    return Container(
      decoration: BoxDecoration(
        color: scheme.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.fromLTRB(
          20, 16, 20, MediaQuery.of(context).viewInsets.bottom + 28),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: scheme.outlineVariant,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 18),
          Text(
            'Contactar servicio',
            style: SmarturStyle.calSansTitle.copyWith(fontSize: 18),
          ),
          const SizedBox(height: 2),
          Text(
            widget.serviceName,
            style: TextStyle(
              fontFamily: 'Outfit',
              fontSize: 13,
              color: scheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 20),
          if (widget.contactPhone != null) ...[
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: SmarturStyle.purple.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(Icons.phone_rounded,
                    color: SmarturStyle.purple, size: 20),
              ),
              title: const Text(
                'Llamar',
                style: TextStyle(
                    fontFamily: 'Outfit',
                    fontWeight: FontWeight.w600,
                    fontSize: 14),
              ),
              subtitle: Text(
                widget.contactPhone!,
                style: TextStyle(
                    fontFamily: 'Outfit',
                    fontSize: 12,
                    color: scheme.onSurfaceVariant),
              ),
              onTap: () async {
                final uri =
                    Uri(scheme: 'tel', path: widget.contactPhone);
                if (await canLaunchUrl(uri)) await launchUrl(uri);
              },
            ),
            if (widget.idCompany != null) const Divider(height: 8),
          ],
          if (widget.idCompany != null)
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.blue.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child:
                    Icon(Icons.chat_rounded, color: Colors.blue.shade600, size: 20),
              ),
              title: const Text(
                'Preguntas al chat',
                style: TextStyle(
                    fontFamily: 'Outfit',
                    fontWeight: FontWeight.w600,
                    fontSize: 14),
              ),
              subtitle: Text(
                'Envía dudas directamente a la empresa',
                style: TextStyle(
                    fontFamily: 'Outfit',
                    fontSize: 12,
                    color: scheme.onSurfaceVariant),
              ),
              trailing: _loadingChat
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2))
                  : null,
              onTap: _loadingChat ? null : _openChat,
            ),
          if (!hasInfo)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 16),
              child: Text(
                'Este servicio no tiene información de contacto disponible.',
                style: TextStyle(
                    fontFamily: 'Outfit',
                    color: scheme.onSurfaceVariant,
                    fontSize: 13),
              ),
            ),
        ],
      ),
    );
  }
}
