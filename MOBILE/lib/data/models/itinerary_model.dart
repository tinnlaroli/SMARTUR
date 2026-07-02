class OptimizeResult {
  final List<int> optimizedStopIds;
  final double originalDistanceKm;
  final double optimizedDistanceKm;
  final int savingsPct;

  const OptimizeResult({
    required this.optimizedStopIds,
    required this.originalDistanceKm,
    required this.optimizedDistanceKm,
    required this.savingsPct,
  });

  factory OptimizeResult.fromJson(Map<String, dynamic> j) => OptimizeResult(
        optimizedStopIds:
            (j['optimized_stop_ids'] as List<dynamic>).cast<int>(),
        originalDistanceKm:
            (j['original_distance_km'] as num).toDouble(),
        optimizedDistanceKm:
            (j['optimized_distance_km'] as num).toDouble(),
        savingsPct: j['savings_pct'] as int,
      );
}

// ─────────────────────────────────────────────────────────────────────────────

class ItineraryStop {
  final int id;
  final int itineraryId;
  final String placeKind; // 'poi' | 'svc'
  final int placeId;
  final int stopOrder;
  final DateTime? visitDate;
  final String? visitTimeStart;
  final String? notes;
  final String placeName;
  final String? placeImageUrl;
  final double? placeLat;
  final double? placeLon;
  final String? contactPhone;
  final int? idCompany;

  const ItineraryStop({
    required this.id,
    required this.itineraryId,
    required this.placeKind,
    required this.placeId,
    required this.stopOrder,
    this.visitDate,
    this.visitTimeStart,
    this.notes,
    this.placeName = '',
    this.placeImageUrl,
    this.placeLat,
    this.placeLon,
    this.contactPhone,
    this.idCompany,
  });

  factory ItineraryStop.fromJson(Map<String, dynamic> j) {
    return ItineraryStop(
      id: j['id_stop'] as int,
      itineraryId: j['id_itinerary'] as int? ?? 0,
      placeKind: j['place_kind'] as String,
      placeId: j['place_id'] as int,
      stopOrder: j['stop_order'] as int,
      visitDate: j['visit_date'] != null
          ? DateTime.tryParse(j['visit_date'].toString())
          : null,
      visitTimeStart: j['visit_time_start'] as String?,
      notes: j['notes'] as String?,
      placeName: (j['place_name'] as String?) ?? '',
      placeImageUrl: j['place_image_url'] as String?,
      placeLat: _toDoubleN(j['place_lat']),
      placeLon: _toDoubleN(j['place_lon']),
      contactPhone: j['contact_phone'] as String?,
      idCompany: j['id_company'] as int?,
    );
  }

  Map<String, dynamic> toMap() => {
        'id': id,
        'itinerary_id': itineraryId,
        'place_kind': placeKind,
        'place_id': placeId,
        'stop_order': stopOrder,
        'visit_date': visitDate?.toIso8601String(),
        'visit_time_start': visitTimeStart,
        'notes': notes,
        'place_name': placeName,
        'place_image_url': placeImageUrl,
        'place_lat': placeLat,
        'place_lon': placeLon,
        'contact_phone': contactPhone,
        'id_company': idCompany,
      };

  factory ItineraryStop.fromMap(Map<String, dynamic> m) => ItineraryStop(
        id: m['id'] as int,
        itineraryId: m['itinerary_id'] as int,
        placeKind: m['place_kind'] as String,
        placeId: m['place_id'] as int,
        stopOrder: m['stop_order'] as int,
        visitDate: m['visit_date'] != null
            ? DateTime.tryParse(m['visit_date'] as String)
            : null,
        visitTimeStart: m['visit_time_start'] as String?,
        notes: m['notes'] as String?,
        placeName: (m['place_name'] as String?) ?? '',
        placeImageUrl: m['place_image_url'] as String?,
        placeLat: m['place_lat'] as double?,
        placeLon: m['place_lon'] as double?,
        contactPhone: m['contact_phone'] as String?,
        idCompany: m['id_company'] as int?,
      );

  ItineraryStop copyWith({
    DateTime? visitDate,
    bool clearDate = false,
    String? visitTimeStart,
    bool clearTime = false,
    String? notes,
    int? stopOrder,
  }) =>
      ItineraryStop(
        id: id,
        itineraryId: itineraryId,
        placeKind: placeKind,
        placeId: placeId,
        stopOrder: stopOrder ?? this.stopOrder,
        visitDate: clearDate ? null : (visitDate ?? this.visitDate),
        visitTimeStart: clearTime ? null : (visitTimeStart ?? this.visitTimeStart),
        notes: notes ?? this.notes,
        placeName: placeName,
        placeImageUrl: placeImageUrl,
        placeLat: placeLat,
        placeLon: placeLon,
        contactPhone: contactPhone,
        idCompany: idCompany,
      );

  static double? _toDoubleN(dynamic v) {
    if (v == null) return null;
    if (v is double) return v;
    if (v is int) return v.toDouble();
    if (v is String) return double.tryParse(v);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────

class Itinerary {
  final int id;
  final int userId;
  final String title;
  final String? description;
  final String? coverImageUrl;
  final bool isPublic;
  final bool isCertified;
  final int? originalItineraryId;
  final int copyCount;
  final int viewCount;
  final DateTime createdAt;
  final DateTime updatedAt;
  final List<ItineraryStop> stops;
  final String? ownerName;
  final String? ownerAvatarUrl;
  final DateTime? startDate;
  final DateTime? endDate;

  const Itinerary({
    required this.id,
    required this.userId,
    required this.title,
    this.description,
    this.coverImageUrl,
    this.isPublic = false,
    this.isCertified = false,
    this.originalItineraryId,
    this.copyCount = 0,
    this.viewCount = 0,
    required this.createdAt,
    required this.updatedAt,
    this.stops = const [],
    this.ownerName,
    this.ownerAvatarUrl,
    this.startDate,
    this.endDate,
  });

  factory Itinerary.fromJson(Map<String, dynamic> j) {
    final rawStops = j['stops'];
    final stops = rawStops is List
        ? rawStops
            .whereType<Map<String, dynamic>>()
            .map(ItineraryStop.fromJson)
            .toList()
        : <ItineraryStop>[];

    return Itinerary(
      id: j['id_itinerary'] as int,
      userId: j['user_id'] as int,
      title: j['title'] as String,
      description: j['description'] as String?,
      coverImageUrl: j['cover_image_url'] as String?,
      isPublic: (j['is_public'] as bool?) ?? false,
      isCertified: (j['is_certified'] as bool?) ?? false,
      originalItineraryId: j['original_itinerary_id'] as int?,
      copyCount: (j['copy_count'] as int?) ?? 0,
      viewCount: (j['view_count'] as int?) ?? 0,
      createdAt: DateTime.parse(j['created_at'].toString()),
      updatedAt: DateTime.parse(j['updated_at'].toString()),
      stops: stops,
      ownerName: j['owner_name'] as String?,
      ownerAvatarUrl: j['owner_avatar_url'] as String?,
      startDate: j['start_date'] != null
          ? DateTime.tryParse(j['start_date'].toString())
          : null,
      endDate: j['end_date'] != null
          ? DateTime.tryParse(j['end_date'].toString())
          : null,
    );
  }

  Map<String, dynamic> toMap() => {
        'id': id,
        'user_id': userId,
        'title': title,
        'description': description,
        'cover_image_url': coverImageUrl,
        'is_public': isPublic ? 1 : 0,
        'is_certified': isCertified ? 1 : 0,
        'original_itinerary_id': originalItineraryId,
        'copy_count': copyCount,
        'view_count': viewCount,
        'owner_name': ownerName,
        'owner_avatar_url': ownerAvatarUrl,
        'created_at': createdAt.toIso8601String(),
        'updated_at': updatedAt.toIso8601String(),
        if (startDate != null) 'start_date': startDate!.toIso8601String().split('T')[0],
        if (endDate != null) 'end_date': endDate!.toIso8601String().split('T')[0],
      };

  factory Itinerary.fromMap(Map<String, dynamic> m) => Itinerary(
        id: m['id'] as int,
        userId: m['user_id'] as int,
        title: m['title'] as String,
        description: m['description'] as String?,
        coverImageUrl: m['cover_image_url'] as String?,
        isPublic: (m['is_public'] as int?) == 1,
        isCertified: (m['is_certified'] as int?) == 1,
        originalItineraryId: m['original_itinerary_id'] as int?,
        copyCount: (m['copy_count'] as int?) ?? 0,
        viewCount: (m['view_count'] as int?) ?? 0,
        createdAt: DateTime.parse(m['created_at'] as String),
        updatedAt: DateTime.parse(m['updated_at'] as String),
        ownerName: m['owner_name'] as String?,
        ownerAvatarUrl: m['owner_avatar_url'] as String?,
        startDate: m['start_date'] != null
            ? DateTime.tryParse(m['start_date'].toString())
            : null,
        endDate: m['end_date'] != null
            ? DateTime.tryParse(m['end_date'].toString())
            : null,
      );

  Itinerary copyWith({
    String? title,
    String? description,
    bool? isPublic,
    String? coverImageUrl,
    List<ItineraryStop>? stops,
    DateTime? updatedAt,
    DateTime? startDate,
    DateTime? endDate,
    bool clearStartDate = false,
    bool clearEndDate = false,
  }) =>
      Itinerary(
        id: id,
        userId: userId,
        title: title ?? this.title,
        description: description ?? this.description,
        coverImageUrl: coverImageUrl ?? this.coverImageUrl,
        isPublic: isPublic ?? this.isPublic,
        isCertified: isCertified,
        originalItineraryId: originalItineraryId,
        copyCount: copyCount,
        viewCount: viewCount,
        createdAt: createdAt,
        updatedAt: updatedAt ?? this.updatedAt,
        stops: stops ?? this.stops,
        ownerName: ownerName,
        ownerAvatarUrl: ownerAvatarUrl,
        startDate: clearStartDate ? null : (startDate ?? this.startDate),
        endDate: clearEndDate ? null : (endDate ?? this.endDate),
      );
}
